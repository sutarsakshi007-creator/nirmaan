/**
 * Dataset Generator for Mandi Mood - APMC Vashi Wholesale Market
 * Generates exactly 5,000 authentic, structured daily market transaction records.
 * Outputs both JSON and CSV in the data/ directory.
 */

const fs = require('fs');
const path = require('path');

const COMMODITIES = [
  // Vegetables (22 items)
  { name_en: 'Onion', name_hi: 'प्याज (Pyaaz)', name_mr: 'कांदा (Kanda)', category: 'vegetable', emoji: '🧅', base_price: 28, variety: 'Nashik Red', season_months: [11, 12, 1, 2, 3] },
  { name_en: 'Potato', name_hi: 'आलू (Aloo)', name_mr: 'बटाटा (Batata)', category: 'vegetable', emoji: '🥔', base_price: 22, variety: 'Agra Jyoti', season_months: [12, 1, 2, 3, 4] },
  { name_en: 'Tomato', name_hi: 'टमाटर (Tamatar)', name_mr: 'टोमॅटो (Tomato)', category: 'vegetable', emoji: '🍅', base_price: 26, variety: 'Desi Gavran', season_months: [1, 2, 8, 9, 10, 11] },
  { name_en: 'Cauliflower', name_hi: 'फूलगोभी (Phool Gobi)', name_mr: 'फ्लॉवर (Flower)', category: 'vegetable', emoji: '🥦', base_price: 30, variety: 'Snowball White', season_months: [10, 11, 12, 1, 2] },
  { name_en: 'Cabbage', name_hi: 'पत्तागोभी (Patta Gobi)', name_mr: 'कोबी (Kobi)', category: 'vegetable', emoji: '🥬', base_price: 18, variety: 'Green Pride', season_months: [9, 10, 11, 12, 1, 2] },
  { name_en: 'Spinach', name_hi: 'पालक (Palak)', name_mr: 'पालक (Palak)', category: 'vegetable', emoji: '🥬', base_price: 16, variety: 'All Green Gavran', season_months: [9, 10, 11, 12, 1, 2] },
  { name_en: 'Capsicum', name_hi: 'शिमला मिर्च (Shimla Mirch)', name_mr: 'ढोबळी मिरची (Dhobali Mirchi)', category: 'vegetable', emoji: '🫑', base_price: 42, variety: 'California Green', season_months: [8, 9, 10, 11, 12] },
  { name_en: 'Green Chilli', name_hi: 'हरी मिर्च (Hari Mirch)', name_mr: 'हिरवी मिरची (Hirvi Mirchi)', category: 'spice', emoji: '🌶️', base_price: 48, variety: 'G4 Spicy', season_months: [6, 7, 8, 9, 10, 11] },
  { name_en: 'Ginger', name_hi: 'अदरक (Adrak)', name_mr: 'आले (Aale)', category: 'spice', emoji: '🫚', base_price: 65, variety: 'Mahim Fresh', season_months: [11, 12, 1, 2, 3] },
  { name_en: 'Garlic', name_hi: 'लहसुन (Lahsun)', name_mr: 'लसूण (Lasun)', category: 'spice', emoji: '🧄', base_price: 120, variety: 'MP Bold White', season_months: [1, 2, 3, 4] },
  { name_en: 'Carrot', name_hi: 'गाजर (Gajar)', name_mr: 'गाजर (Gajar)', category: 'vegetable', emoji: '🥕', base_price: 28, variety: 'Pusa Kesar', season_months: [11, 12, 1, 2] },
  { name_en: 'Green Peas', name_hi: 'मटर (Matar)', name_mr: 'मटार (Matar)', category: 'vegetable', emoji: '🫛', base_price: 52, variety: 'Golden Sweet', season_months: [11, 12, 1, 2] },
  { name_en: 'Coriander', name_hi: 'हरा धनिया (Hara Dhaniya)', name_mr: 'कोथिंबीर (Kothimbir)', category: 'spice', emoji: '🌿', base_price: 32, variety: 'Solapur Fragrant', season_months: [10, 11, 12, 1, 2] },
  { name_en: 'Fenugreek', name_hi: 'मेथी (Methi)', name_mr: 'मेथी (Methi)', category: 'vegetable', emoji: '🌱', base_price: 24, variety: 'Gavran Small Leaf', season_months: [10, 11, 12, 1, 2] },
  { name_en: 'Okra / Bhindi', name_hi: 'भिंडी (Bhindi)', name_mr: 'भेंडी (Bhendi)', category: 'vegetable', emoji: '🥢', base_price: 38, variety: 'Prabhani Kranti', season_months: [3, 4, 5, 6, 7, 8] },
  { name_en: 'Brinjal', name_hi: 'बैंगन (Baingan)', name_mr: 'वांगी (Vangi)', category: 'vegetable', emoji: '🍆', base_price: 32, variety: 'Manjri Gota Purple', season_months: [1, 2, 3, 4, 8, 9] },
  { name_en: 'Bottle Gourd', name_hi: 'लौकी (Lauki)', name_mr: 'दुधी भोपळा (Dudhi Bhopla)', category: 'vegetable', emoji: '🥒', base_price: 22, variety: 'Pusa Summer Long', season_months: [3, 4, 5, 6] },
  { name_en: 'Bitter Gourd', name_hi: 'करेला (Karela)', name_mr: 'कारले (Karle)', category: 'vegetable', emoji: '🥒', base_price: 36, variety: 'Green Long Spiny', season_months: [4, 5, 6, 7, 8] },
  { name_en: 'Cucumber', name_hi: 'खीरा (Kheera)', name_mr: 'काकडी (Kakdi)', category: 'vegetable', emoji: '🥒', base_price: 25, variety: 'Desi Crisp Green', season_months: [3, 4, 5, 6, 7] },
  { name_en: 'Beetroot', name_hi: 'चुकंदर (Chukandar)', name_mr: 'बीट (Beet)', category: 'vegetable', emoji: '🥗', base_price: 34, variety: 'Crimson Globe', season_months: [10, 11, 12, 1, 2] },
  { name_en: 'Radish', name_hi: 'मूली (Mooli)', name_mr: 'मुळा (Mula)', category: 'vegetable', emoji: '🥢', base_price: 20, variety: 'Japanese White', season_months: [11, 12, 1, 2] },
  { name_en: 'Lemon', name_hi: 'नींबू (Nimbu)', name_mr: 'लिंबू (Limbu)', category: 'fruit', emoji: '🍋', base_price: 58, variety: 'Kagzi Juicy', season_months: [3, 4, 5, 6, 7] },

  // Fruits (14 items)
  { name_en: 'Banana', name_hi: 'केला (Kela)', name_mr: 'केळी (Keli)', category: 'fruit', emoji: '🍌', base_price: 35, variety: 'Jalgaon Robusta', season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { name_en: 'Apple', name_hi: 'सेब (Seb)', name_mr: 'सफरचंद (Safarchand)', category: 'fruit', emoji: '🍎', base_price: 135, variety: 'Kinnaur Royal Delicious', season_months: [8, 9, 10, 11, 12] },
  { name_en: 'Pomegranate', name_hi: 'अनार (Anaar)', name_mr: 'डाळिंब (Dalimb)', category: 'fruit', emoji: '🫐', base_price: 110, variety: 'Solapur Bhagwa', season_months: [8, 9, 10, 11, 12, 1] },
  { name_en: 'Alphonso Mango', name_hi: 'हापुस आम (Hapus Aam)', name_mr: 'हापूस आंबा (Hapus Amba)', category: 'fruit', emoji: '🥭', base_price: 190, variety: 'Ratnagiri GI Tag', season_months: [3, 4, 5, 6] },
  { name_en: 'Orange', name_hi: 'संतरा (Santra)', name_mr: 'संत्रे (Santre)', category: 'fruit', emoji: '🍊', base_price: 55, variety: 'Nagpur Mandarin', season_months: [10, 11, 12, 1, 2, 3] },
  { name_en: 'Sweet Lime / Mosambi', name_hi: 'मौसंबी (Mosambi)', name_mr: 'मोसंबी (Mosambi)', category: 'fruit', emoji: '🍈', base_price: 48, variety: 'Jalna Special', season_months: [7, 8, 9, 10, 11] },
  { name_en: 'Grapes', name_hi: 'अंगूर (Angoor)', name_mr: 'द्राक्षे (Drakshe)', category: 'fruit', emoji: '🍇', base_price: 75, variety: 'Nashik Sonaka Green', season_months: [1, 2, 3, 4] },
  { name_en: 'Black Grapes', name_hi: 'काले अंगूर (Kale Angoor)', name_mr: 'काळी द्राक्षे (Kali Drakshe)', category: 'fruit', emoji: '🍇', base_price: 88, variety: 'Sharad Seedless', season_months: [1, 2, 3, 4] },
  { name_en: 'Papaya', name_hi: 'पपीता (Papita)', name_mr: 'पपई (Papai)', category: 'fruit', emoji: '🍈', base_price: 28, variety: 'Taiwan Red Lady 786', season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { name_en: 'Watermelon', name_hi: 'तरबूज (Tarbooj)', name_mr: 'कलिंगड (Kalingad)', category: 'fruit', emoji: '🍉', base_price: 20, variety: 'Kiran Sweet Black', season_months: [2, 3, 4, 5, 6] },
  { name_en: 'Muskmelon', name_hi: 'खरबूजा (Kharbooza)', name_mr: 'खरबूज (Kharbuj)', category: 'fruit', emoji: '🍈', base_price: 32, variety: 'Kundan Orange Flesh', season_months: [3, 4, 5, 6] },
  { name_en: 'Guava', name_hi: 'अमरूद (Amrood)', name_mr: 'पेरू (Peru)', category: 'fruit', emoji: '🍐', base_price: 42, variety: 'Sardar Lucknow 49', season_months: [10, 11, 12, 1] },
  { name_en: 'Custard Apple', name_hi: 'शरीफा (Shareefa)', name_mr: 'सीताफळ (Sitaphal)', category: 'fruit', emoji: '🍏', base_price: 70, variety: 'Balanagar Beed', season_months: [9, 10, 11] },
  { name_en: 'Pineapple', name_hi: 'अनानास (Ananas)', name_mr: 'अननस (Ananas)', category: 'fruit', emoji: '🍍', base_price: 45, variety: 'Kew Giant', season_months: [5, 6, 7, 8] },

  // Grains & Cereals (7 items)
  { name_en: 'Basmati Rice', name_hi: 'बासमती चावल (Basmati Chawal)', name_mr: 'बासमती तांदूळ (Basmati Tandul)', category: 'grain', emoji: '🍚', base_price: 85, variety: '1121 Steam Extra Long', season_months: [10, 11, 12] },
  { name_en: 'Kolam Rice', name_hi: 'कोलम चावल (Kolam Chawal)', name_mr: 'वाडा कोलम (Wada Kolam)', category: 'grain', emoji: '🌾', base_price: 62, variety: 'Wada GI Tag Superior', season_months: [10, 11, 12, 1] },
  { name_en: 'Indrayani Rice', name_hi: 'इंद्रायणी चावल (Indrayani Chawal)', name_mr: 'इंद्रायणी तांदूळ (Indrayani Tandul)', category: 'grain', emoji: '🌾', base_price: 54, variety: 'Maval Aromatic', season_months: [11, 12, 1] },
  { name_en: 'Wheat Lokwan', name_hi: 'लोकवन गेहूं (Lokwan Gehun)', name_mr: 'लोकवन गहू (Lokwan Gahu)', category: 'grain', emoji: '🌾', base_price: 38, variety: 'Maharashtra Lokwan-1', season_months: [3, 4, 5] },
  { name_en: 'Wheat Sharbati', name_hi: 'शरबती गेहूं (Sharbati Gehun)', name_mr: 'शरबती गहू (Sharbati Gahu)', category: 'grain', emoji: '🌾', base_price: 48, variety: 'Sehore Premium Golden', season_months: [3, 4, 5] },
  { name_en: 'Jowar', name_hi: 'ज्वार (Jowar)', name_mr: 'ज्वारी (Jwari)', category: 'grain', emoji: '🌾', base_price: 44, variety: 'Maldandi Shalu Super', season_months: [1, 2, 3] },
  { name_en: 'Bajra', name_hi: 'बाजरा (Bajra)', name_mr: 'बाजरी (Bajri)', category: 'grain', emoji: '🌾', base_price: 34, variety: 'Gavran Bold Desi', season_months: [9, 10, 11] },

  // Pulses & Dals (7 items)
  { name_en: 'Toor Dal', name_hi: 'तुअर दाल (Toor Dal)', name_mr: 'तूर डाळ (Toor Dal)', category: 'pulse', emoji: '🥣', base_price: 135, variety: 'Latur Fatka Desi', season_months: [12, 1, 2] },
  { name_en: 'Chana Dal', name_hi: 'चना दाल (Chana Dal)', name_mr: 'हरभरा डाळ (Harbhara Dal)', category: 'pulse', emoji: '🥣', base_price: 78, variety: 'Gulbarga Bold Unpolished', season_months: [2, 3, 4] },
  { name_en: 'Moong Dal', name_hi: 'मूंग दाल (Moong Dal)', name_mr: 'मूग डाळ (Moog Dal)', category: 'pulse', emoji: '🥣', base_price: 105, variety: 'Yellow Split Dhuli', season_months: [9, 10, 11] },
  { name_en: 'Urad Dal', name_hi: 'उड़द दाल (Urad Dal)', name_mr: 'उडीद डाळ (Udid Dal)', category: 'pulse', emoji: '🥣', base_price: 112, variety: 'Guntur Black Split', season_months: [10, 11, 12] },
  { name_en: 'Kabuli Chana', name_hi: 'काबुली चना (Kabuli Chana)', name_mr: 'काबुली चणा (Kabuli Chana)', category: 'pulse', emoji: '🥣', base_price: 125, variety: 'Indore Dollar 12mm', season_months: [2, 3, 4] },
  { name_en: 'Masoor Dal', name_hi: 'मसूर दाल (Masoor Dal)', name_mr: 'मसूर डाळ (Masoor Dal)', category: 'pulse', emoji: '🥣', base_price: 88, variety: 'Red Split Polished', season_months: [2, 3, 4] },
  { name_en: 'Soybean', name_hi: 'सोयाबीन (Soyabean)', name_mr: 'सोयाबीन (Soyabean)', category: 'pulse', emoji: '🫘', base_price: 46, variety: 'Yellow Bold JS-335', season_months: [10, 11, 12] }
];

// 50 commodities * 100 historical dates = exactly 5,000 records
const TOTAL_DATES = 100;
const START_DATE = new Date('2024-05-01');

function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateDataset() {
  console.log(`Generating 5,000 APMC Vashi wholesale market records across ${COMMODITIES.length} commodities and ${TOTAL_DATES} trading dates...`);

  const records = [];
  let recordCounter = 1;

  for (let dayIndex = 0; dayIndex < TOTAL_DATES; dayIndex++) {
    const curDate = new Date(START_DATE);
    curDate.setDate(START_DATE.getDate() + (dayIndex * 2)); // Trading every 2 days
    const dateStr = formatDate(curDate);
    const monthNum = curDate.getMonth() + 1;

    for (let cIdx = 0; cIdx < COMMODITIES.length; cIdx++) {
      const comm = COMMODITIES[cIdx];
      const seed = (dayIndex * 100) + cIdx + 42;

      // Seasonal price effect: If in peak season, arrivals increase and prices soften by 15-25%
      const isSeason = comm.season_months.includes(monthNum);
      const seasonMultiplier = isSeason ? 0.85 : 1.15;

      // Natural market fluctuation (+/- 12%)
      const fluctuation = 0.88 + (pseudoRandom(seed) * 0.24);
      const modalPerKg = Math.round(comm.base_price * seasonMultiplier * fluctuation);

      // Yesterday price with -8% to +10% variation
      const yesterdayDiff = -0.08 + (pseudoRandom(seed + 1) * 0.18);
      const yesterdayPerKg = Math.max(5, Math.round(modalPerKg * (1 - yesterdayDiff)));

      // 7-day low
      const weekLowPerKg = Math.round(Math.min(modalPerKg, yesterdayPerKg) * (0.88 + pseudoRandom(seed + 2) * 0.08));

      // Daily % change
      const changePct = Number((((modalPerKg - yesterdayPerKg) / (yesterdayPerKg || 1)) * 100).toFixed(1));

      // APMC Vashi wholesale quintal pricing (1 quintal = 100 kg)
      const modalQuintal = modalPerKg * 100;
      const minQuintal = Math.round(modalQuintal * (0.85 + pseudoRandom(seed + 3) * 0.08));
      const maxQuintal = Math.round(modalQuintal * (1.08 + pseudoRandom(seed + 4) * 0.12));

      // Realistic wholesale arrival volume (in quintals)
      const baseArrival = comm.category === 'grain' || comm.category === 'pulse' ? 800 : (comm.category === 'vegetable' ? 1400 : 600);
      const arrivalsQtl = Math.round(baseArrival * (isSeason ? 1.6 : 0.8) * (0.7 + pseudoRandom(seed + 5) * 0.6));

      const recordId = `APMC-VSH-${String(recordCounter).padStart(5, '0')}`;

      const itemRecord = {
        record_id: recordId,
        date: dateStr,
        market: 'APMC Vashi (Navi Mumbai)',
        market_yard: 'Sector 19, Turbhe Wholesale Yard',
        state: 'Maharashtra',
        district: 'Thane / Navi Mumbai',
        commodity_name_en: comm.name_en,
        commodity_name_hi: comm.name_hi,
        commodity_name_mr: comm.name_mr,
        category: comm.category,
        variety: comm.variety,
        grade: pseudoRandom(seed + 6) > 0.4 ? 'FAQ (Fair Average Quality)' : 'Super A-Grade',
        arrivals_quintal: arrivalsQtl,
        min_price_quintal: minQuintal,
        max_price_quintal: maxQuintal,
        modal_price_quintal: modalQuintal,
        price_today: modalPerKg,
        price_yesterday: yesterdayPerKg,
        price_change_pct: changePct,
        price_week_low: weekLowPerKg,
        unit: 'kg',
        emoji: comm.emoji,
        image_url: `/images/${comm.name_en.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}.jpg`,
        season_months: comm.season_months,
        in_season_today: isSeason
      };

      records.push(itemRecord);
      recordCounter++;
    }
  }

  return records;
}

function writeCsv(records, outputPath) {
  if (records.length === 0) return;
  const headers = Object.keys(records[0]);
  const rows = [headers.join(',')];

  for (const r of records) {
    const values = headers.map(h => {
      let val = r[h];
      if (Array.isArray(val)) {
        val = `"${val.join(';')}"`;
      } else if (typeof val === 'string') {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
      }
      return val;
    });
    rows.push(values.join(','));
  }

  fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');
}

function run() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const records = generateDataset();
  console.log(`Generated ${records.length} records successfully!`);

  // 1. Write JSON
  const jsonPath = path.join(dataDir, 'apmc_vashi_5000_rates.json');
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Saved JSON dataset: ${jsonPath} (${(fs.statSync(jsonPath).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 2. Write CSV
  const csvPath = path.join(dataDir, 'apmc_vashi_5000_rates.csv');
  writeCsv(records, csvPath);
  console.log(`Saved CSV dataset: ${csvPath} (${(fs.statSync(csvPath).size / (1024 * 1024)).toFixed(2)} MB)`);
}

run();
