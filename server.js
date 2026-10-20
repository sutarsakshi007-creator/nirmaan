require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const ratesRouter = require('./routes/rates');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mandi-mood';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', ratesRouter);

// Fallback to index.html for frontend navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    console.log(' Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB (Mandi Mood DB)');

    app.listen(PORT, () => {
      console.log(`
=====================================================
  MANDI MOOD - APMC Vashi Daily Wholesale Market
=====================================================
 Server listening on: http://localhost:${PORT}
 API Endpoints:
   - GET  /api/rates
   - GET  /api/cook-today
   - GET  /api/season
   - POST /api/rates
   - PUT  /api/rates/:id
=====================================================
`);
    });
  } catch (err) {
    console.error(' Failed to connect to MongoDB:', err.message);
    console.error('Make sure MongoDB is running or configure MONGO_URI in .env');
    process.exit(1);
  }
}

startServer();
