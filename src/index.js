const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { StatusCodes } = require('http-status-codes');

const { routers, msg } = require('./constant');
const { envConfig, dbConfig } = require('./config');
const { RootApiRouter } = require('./routes');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { cache } = require('./utils');

/* initialize express app */
const app = express();

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
app.use(morgan(envConfig.PLATFORM));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());

/* apply strict rate limiting to auth endpoints */
app.use(`${routers.endPoints.base}${routers.endPoints.v1Base}/auth/signin`, authLimiter);
app.use(`${routers.endPoints.base}${routers.endPoints.v1Base}/auth/signup`, authLimiter);

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
app.use((error, req, res, next) => {
  const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(status).json({
    status,
    error: {
      message: error.message || msg.appMsg.somethingWrong,
    },
  });
});

/* connect database and start server */
let server;

dbConfig
  .dbConnect()
  .then(() => {
    server = app.listen(envConfig.PORT, () => {
      console.log(`${msg.server.serveSuccess} ${envConfig.PORT}`);
    });
  })
  .catch((err) => {
    console.error(msg.dbMsg.dbFailed, err);
    process.exit(1);
  });

/* graceful shutdown handler */
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await dbConfig.dbDisconnect();
      await cache.close();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
