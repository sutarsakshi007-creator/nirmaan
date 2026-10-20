const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema(
  {
    name_en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true
    },
    name_hi: {
      type: String,
      required: [true, 'Hindi name is required'],
      trim: true
    },
    name_mr: {
      type: String,
      required: [true, 'Marathi name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['vegetable', 'fruit', 'spice'],
        message: '{VALUE} is not a valid category'
      },
      lowercase: true,
      trim: true
    },
    emoji: {
      type: String,
      required: [true, 'Emoji icon is required'],
      trim: true
    },
    image_url: {
      type: String,
      default: '',
      trim: true
    },
    price_today: {
      type: Number,
      required: [true, 'Today price is required'],
      min: [0, 'Price must be positive']
    },
    price_yesterday: {
      type: Number,
      required: [true, 'Yesterday price is required'],
      min: [0, 'Price must be positive']
    },
    price_week_low: {
      type: Number,
      required: [true, 'Week low price is required'],
      min: [0, 'Price must be positive']
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    season_months: {
      type: [Number],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every(m => Number.isInteger(m) && m >= 1 && m <= 12);
        },
        message: 'Season months must be numbers between 1 and 12'
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup and search
rateSchema.index({ category: 1 });
rateSchema.index({ price_today: 1 });
rateSchema.index({ name_en: 'text', name_hi: 'text', name_mr: 'text' });

module.exports = mongoose.model('Rate', rateSchema);
