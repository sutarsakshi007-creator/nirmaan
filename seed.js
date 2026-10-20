require('dotenv').config();
const mongoose = require('mongoose');
const Rate = require('./models/Rate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mandi-mood';

const sampleRates = require('./sampleRates');

async function seedDatabase() {
  try {
    console.log(' Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB successfully.');

    console.log(' Clearing existing Mandi rates...');
    await Rate.deleteMany({});

    console.log(` Inserting ${sampleRates.length} sample APMC Vashi items...`);
    const inserted = await Rate.insertMany(sampleRates);
    
    console.log(` Successfully seeded ${inserted.length} items into Mandi Mood!`);
    console.table(
      inserted.map(item => ({
        Emoji: item.emoji,
        Name: item.name_en,
        Marathi: item.name_mr,
        Hindi: item.name_hi,
        Category: item.category,
        Today: `₹${item.price_today}/${item.unit}`,
        Yesterday: `₹${item.price_yesterday}`,
        Low: `₹${item.price_week_low}`
      }))
    );

    await mongoose.connection.close();
    console.log(' Database connection closed. Ready to run: node server.js');
    process.exit(0);
  } catch (error) {
    console.error(' Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
