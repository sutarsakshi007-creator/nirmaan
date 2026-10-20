const mongoose = require('mongoose');

/**
 * Escapes characters with special meaning in Regular Expressions
 * Prevents ReDoS (Regular Expression Denial of Service) and RegExp injection.
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
}

/**
 * Validates whether the given route param is a valid MongoDB ObjectId.
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'. Expected a 24-character hexadecimal ObjectId.`
      });
    }
    next();
  };
}

const ALLOWED_CATEGORIES = ['vegetable', 'fruit', 'spice'];

/**
 * Validates and sanitizes rate creation and update payloads.
 */
function validateRatePayload(isUpdate = false) {
  return (req, res, next) => {
    const {
      name_en,
      name_hi,
      name_mr,
      category,
      emoji,
      price_today,
      price_yesterday,
      price_week_low,
      image_url,
      season_months
    } = req.body;

    // For POST (new item), required fields must exist
    if (!isUpdate) {
      if (!name_en || !name_hi || !name_mr || !category || !emoji || price_today === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name_en, name_hi, name_mr, category, emoji, price_today'
        });
      }
    }

    // Name validations (length and type)
    if (name_en !== undefined) {
      if (typeof name_en !== 'string' || name_en.trim().length === 0 || name_en.trim().length > 80) {
        return res.status(400).json({ success: false, message: 'name_en must be between 1 and 80 characters' });
      }
    }

    if (name_hi !== undefined) {
      if (typeof name_hi !== 'string' || name_hi.trim().length === 0 || name_hi.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'name_hi must be between 1 and 100 characters' });
      }
    }

    if (name_mr !== undefined) {
      if (typeof name_mr !== 'string' || name_mr.trim().length === 0 || name_mr.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'name_mr must be between 1 and 100 characters' });
      }
    }

    // Category whitelist
    if (category !== undefined) {
      const cleanCat = String(category).toLowerCase().trim();
      if (!ALLOWED_CATEGORIES.includes(cleanCat)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${cleanCat}'. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
        });
      }
    }

    // Emoji validation
    if (emoji !== undefined) {
      if (typeof emoji !== 'string' || emoji.trim().length === 0 || emoji.trim().length > 10) {
        return res.status(400).json({ success: false, message: 'emoji must be a valid emoji character (max 10 chars)' });
      }
    }

    // Price numeric validations (non-negative, realistic wholesale bounds)
    const validatePrice = (val, fieldName) => {
      if (val !== undefined) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100000) {
          return `${fieldName} must be a positive number between 0 and 100,000`;
        }
      }
      return null;
    };

    const errPriceToday = validatePrice(price_today, 'price_today');
    if (errPriceToday) return res.status(400).json({ success: false, message: errPriceToday });

    const errPriceYest = validatePrice(price_yesterday, 'price_yesterday');
    if (errPriceYest) return res.status(400).json({ success: false, message: errPriceYest });

    const errPriceLow = validatePrice(price_week_low, 'price_week_low');
    if (errPriceLow) return res.status(400).json({ success: false, message: errPriceLow });

    // Image URL validation (prevent javascript: or xss schemes)
    if (image_url !== undefined && image_url !== null) {
      const cleanUrl = String(image_url).trim();
      if (cleanUrl.length > 500) {
        return res.status(400).json({ success: false, message: 'image_url is too long (max 500 characters)' });
      }
      if (cleanUrl && !cleanUrl.startsWith('/') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        return res.status(400).json({ success: false, message: 'image_url must start with / (local) or http(s)://' });
      }
    }

    // Season months array validation
    if (season_months !== undefined && season_months !== null) {
      if (!Array.isArray(season_months)) {
        return res.status(400).json({ success: false, message: 'season_months must be an array of month numbers (1-12)' });
      }
      for (const m of season_months) {
        const num = Number(m);
        if (isNaN(num) || num < 1 || num > 12) {
          return res.status(400).json({ success: false, message: 'season_months elements must be integers between 1 and 12' });
        }
      }
    }

    next();
  };
}

module.exports = {
  escapeRegex,
  validateObjectId,
  validateRatePayload
};
