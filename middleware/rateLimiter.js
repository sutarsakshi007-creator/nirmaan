const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Allows up to 200 requests per 15 minutes per IP address.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Sensitive Admin Operations Rate Limiter
 * Limits POST, PUT, DELETE, and /reset actions to 30 requests per 15 minutes to prevent brute-force and spamming.
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many rate modification requests. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  adminLimiter
};
