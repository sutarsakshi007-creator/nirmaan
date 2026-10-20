require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const ratesRouter = require('./routes/rates');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mandi-mood';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enable proxy trust for reverse proxies like Render / Cloudflare
app.set('trust proxy', 1);

// Health check endpoint for Render / cloud monitoring
app.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: isConnected ? 'ok' : 'initializing',
    database: isConnected ? 'connected' : 'connecting',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 1. Security Headers via Helmet (with CSP configured for Google Fonts & Canvas poster)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS configuration (supports explicit origins via ALLOWED_ORIGIN in .env)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim()) : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 86400
};
app.use(cors(corsOptions));

// 3. Request Payload Size Limits (Defends against Large Payload DoS)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Rate Limiting for all /api endpoints
app.use('/api', apiLimiter);

// 5. Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// 6. API Routes
app.use('/api', ratesRouter);

// 7. 404 handler for unknown /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// 8. Fallback to index.html for frontend navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// 9. Centralized Error Handler (Does not leak stack traces in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message || 'Server error'
  });
});

// MongoDB Connection with Auto-Retry & Diagnostics
async function connectToMongoDB() {
  const maskedUri = MONGO_URI.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@');
  console.log('🔄 Connecting to MongoDB at:', maskedUri);

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('✅ Connected to MongoDB (Mandi Mood DB)');

    // Auto-seed if database is freshly created / empty (e.g. Render cold start)
    try {
      const Rate = require('./models/Rate');
      const sampleRates = require('./sampleRates');
      const count = await Rate.countDocuments();
      if (count === 0) {
        console.log('📦 Database is empty. Auto-seeding 20 APMC Vashi wholesale items...');
        await Rate.insertMany(sampleRates);
        console.log('✅ Auto-seed completed successfully!');
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed check skipped or encountered non-critical error:', seedErr.message);
    }
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error(`
👉 RENDER / MONGODB ATLAS TROUBLESHOOTING:
   1. Check MongoDB Atlas "Network Access": Make sure IP 0.0.0.0/0 is added (Allow from anywhere).
   2. Check your MONGO_URI environment variable on Render.
   3. Make sure special characters in your database password are URL-encoded.
   🔄 Retrying connection in 6 seconds...
`);
    setTimeout(connectToMongoDB, 6000);
  }
}

// Start HTTP Server immediately so Render port detection succeeds
app.listen(PORT, () => {
  console.log(`
=====================================================
  MANDI MOOD - APMC Vashi Daily Wholesale Market
=====================================================
 Server listening on: http://localhost:${PORT}
 Environment:        ${NODE_ENV}
 Security Features:  Helmet CSP, Rate-Limiting, Admin Auth,
                     Input Validation & ReDoS Shield Active
 API Endpoints:
   - GET  /api/rates (supports ?category=, ?search=, ?sort=)
   - GET  /api/cook-today
   - GET  /api/season
   - POST /api/rates (protected by x-api-key)
   - PUT  /api/rates/:id (protected by x-api-key)
   - DEL  /api/rates/:id (protected by x-api-key)
   - POST /api/reset (protected by x-api-key)
=====================================================
`);
  // Initiate MongoDB connection asynchronously
  connectToMongoDB();
});
