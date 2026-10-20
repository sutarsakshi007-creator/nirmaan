/**
 * MongoDB Bulk Seeder for 5,000 APMC Vashi Records
 * Imports data/apmc_vashi_5000_rates.json into the MongoDB database.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Rate = require('../models/Rate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mandi-mood';
const DATA_FILE = path.join(__dirname, '..', 'data', 'apmc_vashi_5000_rates.json');

async function seedLargeDataset() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`❌ Data file not found at ${DATA_FILE}. Run "node scripts/generate_dataset.js" first.`);
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('📖 Reading 5,000 records from JSON...');
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const records = JSON.parse(rawData);

    console.log(`📦 Found ${records.length} records. Preparing bulk insert...`);

    const formattedRecords = records.map(r => ({
      name_en: r.commodity_name_en,
      name_hi: r.commodity_name_hi,
      name_mr: r.commodity_name_mr,
      category: r.category === 'grain' || r.category === 'pulse' ? 'vegetable' : r.category,
      emoji: r.emoji,
      image_url: r.image_url,
      price_today: r.price_today,
      price_yesterday: r.price_yesterday,
      price_week_low: r.price_week_low,
      unit: r.unit || 'kg',
      date: new Date(r.date),
      season_months: r.season_months
    }));

    console.log('🗑️ Clearing existing rate collection...');
    await Rate.deleteMany({});

    console.log('🚀 Bulk inserting 5,000 records into MongoDB in batches...');
    const BATCH_SIZE = 1000;
    for (let i = 0; i < formattedRecords.length; i += BATCH_SIZE) {
      const batch = formattedRecords.slice(i, i + BATCH_SIZE);
      await Rate.insertMany(batch);
      console.log(`   Inserted records ${i + 1} to ${Math.min(i + BATCH_SIZE, formattedRecords.length)}`);
    }

    const totalCount = await Rate.countDocuments();
    console.log(`\n🎉 Successfully imported ${totalCount} records into Mandi Mood MongoDB database!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during 5,000 records seeding:', err);
    process.exit(1);
  }
}

seedLargeDataset();
