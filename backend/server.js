const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/user');
const milkRoutes = require('./routes/milk');
const customerRoutes = require('./routes/customers');
require('dotenv').config();

const app = express();

// Enhanced security middleware
app.use(helmet());
app.disable('x-powered-by');

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced CORS configuration
const corsOptions = {
  origin: [
     'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization', 'X-New-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit preflight handling

// Enhanced body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`
    );
  });
  next();
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Route configuration
app.use('/api/user', userRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/customers', customerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal Server Error',
      code: err.code || 'SERVER_ERROR'
    }
  });
});

// Server startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  Server running in ${process.env.NODE_ENV || 'development'} mode
Listening on port ${PORT}
  Base URL: http://localhost:${PORT}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});