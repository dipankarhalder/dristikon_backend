import express, { Request, Response, NextFunction } from 'express';
import cluster from 'cluster';
import os from 'os';
import path from 'path';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';

import { routers, msg } from './constant';
import { envConfig, dbConfig } from './config';
import { RootApiRouter } from './routes';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { nosqlSanitizer } from './middleware/nosqlSanitizer';
import { cache, logger } from './utils';
import { initKafka, closeKafka } from './queue/kafka';

// 🚀 TypeScript Hot Reload Active
/* initialize express app */
const app = express();

/* server cloaking: explicitly disable framework signatures */
app.disable('x-powered-by');

/* security HTTP headers */
app.use(helmet());

/* gzip/brotli response compression */
app.use(compression());

/* CORS configuration */
const corsOptions: CorsOptions = {
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
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(msg.appMsg.apiNotFound) as Error & { status?: number };
  error.status = StatusCodes.NOT_FOUND;
  next(error);
});

/* application global error handler (4 parameters required by Express) */
app.use((error: Error & { status?: number; path?: string }, _req: Request, res: Response, _next: NextFunction) => {
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

  return res.status(status).json({
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
  const handleMasterShutdown = (signal: NodeJS.Signals) => {
    logger.info(`Master process received ${signal}. Gracefully stopping all worker processes...`);
    for (const id in cluster.workers) {
      if (cluster.workers[id]) {
        cluster.workers[id]?.process.kill(signal);
      }
    }
  };

  process.on('SIGTERM', () => handleMasterShutdown('SIGTERM'));
  process.on('SIGINT', () => handleMasterShutdown('SIGINT'));
} else {
  /* Worker process (or single process in development) */
  let server: http.Server;

  dbConfig
    .dbConnect()
    .then(async () => {
      // Initialize Kafka message broker (with graceful in-process fallback)
      await initKafka();

      server = app.listen(envConfig.PORT, () => {
        logger.info(`${msg.server.serveSuccess} ${envConfig.PORT} (Worker PID: ${process.pid})`);
      });
    })
    .catch((err: Error) => {
      logger.error(`${msg.dbMsg.dbFailed}:`, { error: err.message });
      process.exit(1);
    });

  /* graceful shutdown handler */
  const gracefulShutdown = async (signal: string) => {
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

export default app;
