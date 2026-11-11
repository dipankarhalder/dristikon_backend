const express = require('express');
const cluster = require('cluster');
const os = require('os');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { StatusCodes } = require('http-status-codes');

const { routers, msg } = require('./constant');
const { envConfig, dbConfig } = require('./config');
const { RootApiRouter } = require('./routes');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { nosqlSanitizer } = require('./middleware/nosqlSanitizer');
const { cache, logger } = require('./utils');
const { initKafka, closeKafka } = require('./queue/kafka');

/* initialize express app */
const app = express();

/* server cloaking: explicitly disable framework signatures */
app.disable('x-powered-by');

/* security HTTP headers */
app.use(helmet());

/* gzip/brotli response compression */
app.use(compression());

/* CORS configuration */
const corsOptions = {
  origin: envConfig.CLIENTURL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
};

/* core middleware */
app.use(
  morgan(envConfig.PLATFORM === 'production' ? 'combined' : 'dev', {
    stream: logger.stream,
  }),
);
app.use(cors(corsOptions));

/* strict body payload capping (16kb) to defend against memory exhaustion and buffer overflows */
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

/* parameter pollution prevention (hpp) */
app.use(hpp());

/* NoSQL injection filter (recursive sanitization of $, . keys) */
app.use(nosqlSanitizer);

app.use(cookieParser());

/* serve uploaded files (images, docs, pdfs) statically with secure settings */
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    etag: true,
    maxAge: '1d',
  }),
);

/* apply strict distributed rate limiting to sensitive auth endpoints */
app.use(`${routers.endPoints.base}${routers.endPoints.v1Base}/auth/signin`, authLimiter);
app.use(`${routers.endPoints.base}${routers.endPoints.v1Base}/auth/signup`, authLimiter);
app.use(`${routers.endPoints.base}${routers.endPoints.v1Base}/auth/refresh`, authLimiter);

/* apply general rate limiting to all API endpoints */
app.use(routers.endPoints.base, apiLimiter);

/* application main endpoint */
app.use(routers.endPoints.base, RootApiRouter);

/* handle undefined routes */
app.use((req, res, next) => {
  const error = new Error(msg.appMsg.apiNotFound);
  error.status = StatusCodes.NOT_FOUND;
  next(error);
});

/* application global error handler (4 parameters required by Express) */
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  logger.error('Global Error Handler caught exception:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
  });

  // Intercept Mongoose CastError (e.g. invalid 24-char ObjectId)
  if (error.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `Invalid identifier provided for path '${error.path}'.`,
    });
  }

  // Intercept Mongoose ValidationError
  if (error.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: error.message,
    });
  }

  const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const isProd = envConfig.NODEENV;

  res.status(status).json({
    status,
    error: {
      message:
        status === StatusCodes.INTERNAL_SERVER_ERROR && isProd
          ? msg.appMsg.somethingWrong
          : error.message || msg.appMsg.somethingWrong,
    },
  });
});

/* ⚡ Native Process Clustering & Server Initialization */
const numCPUs = os.cpus().length;
const isClusteringEnabled = envConfig.ENABLE_CLUSTER || (envConfig.NODEENV && process.env.ENABLE_CLUSTER !== 'false');

if (isClusteringEnabled && cluster.isPrimary) {
  logger.info(`⚡ Primary Master process ${process.pid} is running. Auto-forking ${numCPUs} worker processes...`);

  // Auto-fork worker processes matching CPU core count
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Auto-respawn replacement worker on unexpected termination
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Auto-respawning replacement worker...`);
    cluster.fork();
  });

  // Graceful shutdown forwarding to all child workers
  const handleMasterShutdown = (signal) => {
    logger.info(`Master process received ${signal}. Gracefully stopping all worker processes...`);
    for (const id in cluster.workers) {
      if (cluster.workers[id]) {
        cluster.workers[id].process.kill(signal);
      }
    }
  };

  process.on('SIGTERM', () => handleMasterShutdown('SIGTERM'));
  process.on('SIGINT', () => handleMasterShutdown('SIGINT'));
} else {
  /* Worker process (or single process in development) */
  let server;

  dbConfig
    .dbConnect()
    .then(async () => {
      // Initialize Kafka message broker (with graceful in-process fallback)
      await initKafka();

      server = app.listen(envConfig.PORT, () => {
        logger.info(`${msg.server.serveSuccess} ${envConfig.PORT} (Worker PID: ${process.pid})`);
      });
    })
    .catch((err) => {
      logger.error(`${msg.dbMsg.dbFailed}:`, { error: err.message });
      process.exit(1);
    });

  /* graceful shutdown handler */
  const gracefulShutdown = async (signal) => {
    logger.info(`Worker ${process.pid} received ${signal}. Starting graceful shutdown...`);
    if (server) {
      server.close(async () => {
        logger.info(`Worker ${process.pid} HTTP server closed.`);
        await dbConfig.dbDisconnect();
        await cache.close();
        await closeKafka();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error(`Worker ${process.pid} graceful shutdown timed out, forcing exit.`);
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
