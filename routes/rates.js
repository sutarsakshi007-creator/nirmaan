const express = require('express');
const router = express.Router();
const Rate = require('../models/Rate');
const sampleRates = require('../sampleRates');
const { requireAdminAuth } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { escapeRegex, validateObjectId, validateRatePayload } = require('../middleware/validator');

const VALID_CATEGORIES = ['vegetable', 'fruit', 'spice'];
const VALID_SORTS = ['price_asc', 'price_desc', 'spike', 'default'];

// Recipe suggestions helper returning 4 diverse dishes based on cheapest vegetables
function generateDishSuggestions(veggies) {
  if (!veggies || veggies.length === 0) {
    return [];
  }

  const v1 = veggies[0];
  const v2 = veggies[1] || v1;
  const v3 = veggies[2] || v2;

  const produceCost = Math.round(
    (v1.price_today * 0.4) +
    (v2.price_today * 0.3) +
    (v3.price_today * 0.3)
  );

  const dishes = [
    // 1. Main Course Gravy / Sabzi
    {
      id: 'dish-main',
      type: 'main',
      type_label_en: '🍲 Main Sabzi',
      type_label_hi: '🍲 मुख्य सब्जी',
      type_label_mr: '🍲 मुख्य भाजी',
      time: '20 mins',
      difficulty: 'Easy • सोपे',
      title_en: 'Desi Aloo Palak with Homestyle Tadka',
      title_hi: 'देसी आलू पालक लजीज तड़का',
      title_mr: 'गावरान बटाटा पालक झणझणीत फोडणी',
      recipe_en: [
        '1. Heat 1.5 tbsp oil with cumin, chopped garlic, and green chillies until aromatic.',
        '2. Add cubed boiled potatoes with turmeric and salt; sauté until golden crisp.',
        '3. Fold in roughly chopped fresh spinach and simmer for 5 minutes; finish with a dash of garam masala.'
      ],
      recipe_hi: [
        '1. तेल में जीरा, लहसुन और हरी मिर्च डालकर खुशबू आने तक भूनें।',
        '2. उबले कटे आलू, हल्दी और नमक डालकर सुनहरा कुरकुरा होने तक सेकें।',
        '3. ताजी कटी पालक मिलाएं और ५ मिनट ढककर पकाएं; अंत में चुटकी भर गरम मसाला छिड़कें।'
      ],
      recipe_mr: [
        '1. तेलात जिरे, ठेचलेला लसूण आणि हिरवी मिरची घालून खमंग परतून घ्या.',
        '2. उकडलेल्या बटाट्याचे तुकडे, हळद व मीठ घालून सोनेरी कुरकुरीत होईपर्यंत परता.',
        '3. बारीक चिरलेली ताजी पालक घालून ५ मिनिटे वाफ काढा; शेवटी थोडा गरम मसाला भुरभुरा.'
      ],
      family_cost: produceCost + 15,
      servings: '4 persons',
      savings_vs_hotel: Math.max(160, Math.round((produceCost + 15) * 3.8))
    },

    // 2. Sookhi Bhaji / Dry Stir Fry
    {
      id: 'dish-dry',
      type: 'dry',
      type_label_en: '🍳 Sookhi Bhaji',
      type_label_hi: '🍳 सूखी सब्जी',
      type_label_mr: '🍳 खमंग सुकी भाजी',
      time: '15 mins',
      difficulty: 'Quick • झटपट',
      title_en: 'Maharashtrian Kobi Batata Sookhi Bhaji',
      title_hi: 'पत्तागोभी आलू की सूखी मसालेदार सब्जी',
      title_mr: 'खमंग कोबी बटाटा सुकी भाजी',
      recipe_en: [
        '1. Splutter mustard seeds, curry leaves, and green chillies in hot oil in a heavy kadai.',
        '2. Add finely diced potatoes and sliced cabbage with turmeric, cumin, and salt.',
        '3. Cover and cook in its own steam for 10 minutes; garnish with freshly grated coconut and coriander.'
      ],
      recipe_hi: [
        '1. गरम तेल में राई, कढ़ी पत्ता और हरी मिर्च का तड़का लगाएं।',
        '2. बारीक कटे आलू और पत्तागोभी को हल्दी व स्वादानुसार नमक के साथ मिलाएं।',
        '3. ढक्कन रखकर १० मिनट भाप में पकाएं; ऊपर से ताजा कसा नारियल और हरा धनिया सजाएं।'
      ],
      recipe_mr: [
        '1. गरम तेलात मोहरी, कढीपत्ता आणि हिरवी मिरची तडतडवून घ्या.',
        '2. बारीक चिरलेला बटाटा व कोबी हळद आणि चवीनुसार मीठ घालून व्यवस्थित परता.',
        '3. झाकण ठेवून १० मिनिटे वाफेवर शिजवा; वरून ओले खोबरे आणि कोथिंबीर पेरा.'
      ],
      family_cost: Math.round(produceCost * 0.9) + 12,
      servings: '4 persons',
      savings_vs_hotel: 145
    },

    // 3. Comfort Protein Dal / Soup
    {
      id: 'dish-dal',
      type: 'dal',
      type_label_en: '🥣 Comfort Dal',
      type_label_hi: '🥣 पौष्टिक दाल',
      type_label_mr: '🥣 पौष्टिक डाळ',
      time: '25 mins',
      difficulty: 'Nutritious • पौष्टिक',
      title_en: 'Dhabe Wali Paushtik Palak Lasooni Dal',
      title_hi: 'ढाबा स्टाइल लहसुनी पालक दाल',
      title_mr: 'अस्सल ढाबा स्टाईल लसुणी पालक डाळ',
      recipe_en: [
        '1. Pressure cook toor or moong dal with chopped tomatoes, turmeric, and pinch of hing until soft.',
        '2. In a pan, crackle cumin seeds, dry red chillies, and 8-10 sliced garlic cloves in 1 tbsp desi ghee.',
        '3. Add shredded spinach, pour over cooked dal, simmer 6 mins; serve hot with rice or bhakri.'
      ],
      recipe_hi: [
        '1. कुकर में तुअर या मूंग दाल को टमाटर, हल्दी और हींग के साथ नरम होने तक पकाएं।',
        '2. पैन में १ चम्मच देसी घी में जीरा, सूखी लाल मिर्च और ८-१० लहसुन की कलियां भूनें।',
        '3. कटी पालक डालकर भूनें, उबली दाल मिलाकर ६ मिनट पकाएं; गरमागरम भात या रोटी संग परोसें।',
      ],
      recipe_mr: [
        '1. कुकरमध्ये तूर किंवा मूग डाळ टोमॅटो, हळद आणि हिंग घालून मऊ शिजवून घ्या.',
        '2. पॅनमध्ये १ चमचा साजूक तुपात जिरे, सुकी लाल मिरची आणि ८-१० लसूण पाकळ्यांची खमंग फोडणी द्या.',
        '3. बारीक चिरलेली पालक परतून त्यात शिजलेली डाळ घाला व ६ मिनिटे उकळा; भात किंवा भाकरीसोबत सर्व्ह करा.'
      ],
      family_cost: Math.round(produceCost * 1.1) + 18,
      servings: '4 persons',
      savings_vs_hotel: 175
    },

    // 4. Tea-Time Crispy Bhaji / Snacks
    {
      id: 'dish-snack',
      type: 'snack',
      type_label_en: '☕ Crispy Bhaji',
      type_label_hi: '☕ कुरकुरी भजिया',
      type_label_mr: '☕ गरमागरम भजी',
      time: '12 mins',
      difficulty: 'Crispy • कुरकुरीत',
      title_en: 'Chai-Time Crispy Palak Kanda Bhaji & Batata Pakora',
      title_hi: 'चाय-टाइम कुरकुरी पालक प्याज भजिया',
      title_mr: 'चहा सोबत कुरकुरीत पालक कांदा भजी',
      recipe_en: [
        '1. Mix finely sliced potatoes, onions, and shredded spinach in a bowl with besan, ajwain, and red chilli.',
        '2. Sprinkle minimal water and mix firmly to create a rough, crunchy coating.',
        '3. Drop rough fritters into medium-hot oil and deep-fry till golden brown; serve with mint chutney & chai.'
      ],
      recipe_hi: [
        '1. बाउल में पतले कटे आलू, प्याज और कटी पालक को बेसन, अजवाइन और लाल मिर्च पाउडर के साथ मिलाएं।',
        '2. बहुत थोड़ा पानी छिड़क कर कुरकुरा सूखा मिश्रण तैयार करें।',
        '3. मध्यम गरम तेल में छोटे पकोड़े डालकर सुनहरा कुरकुरा होने तक तलें; हरी चटनी व चाय के साथ परोसें।'
      ],
      recipe_mr: [
        '1. बाऊलमध्ये पातळ बटाटा काप, कांदा आणि चिरलेली पालक बेसन, ओवा व तिखट-मीठ घालून एकत्र करा.',
        '2. किंचित पाणी शिंपडून छान कुरकुरीत सुके पीठ तयार करा.',
        '3. मध्यम तेलात कुरकुरीत भजी तळून काढा; पुदिना चटणी आणि गरमागरम वाफाळलेल्या चहाचा आस्वाद घ्या.'
      ],
      family_cost: Math.round(produceCost * 0.8) + 14,
      servings: '4 persons',
      savings_vs_hotel: 130
    }
  ];

  return dishes;
}

// In-memory fallback helper ensuring items and images are NEVER missing
function getFallbackRates(category, search, sort) {
  let list = sampleRates.map((item, idx) => ({
    _id: `sample-${idx + 1}`,
    ...item
  }));

  if (category && category !== 'all') {
    list = list.filter(r => r.category === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(r =>
      (r.name_en && r.name_en.toLowerCase().includes(q)) ||
      (r.name_hi && r.name_hi.includes(q)) ||
      (r.name_mr && r.name_mr.includes(q))
    );
  }

  if (sort === 'price_asc') {
    list.sort((a, b) => a.price_today - b.price_today);
  } else if (sort === 'price_desc' || sort === 'spike') {
    list.sort((a, b) => b.price_today - a.price_today);
  } else {
    list.sort((a, b) => a.category.localeCompare(b.category) || a.name_en.localeCompare(b.name_en));
  }

  return list;
}

// GET /api/rates and /api/rates/all - returns all rates (supports sanitized ?category=, ?search=, ?sort=)
router.get(['/rates', '/'], async (req, res) => {
  const { category, search, sort } = req.query;
  const cleanCat = (category && category !== 'all' && VALID_CATEGORIES.includes(String(category).toLowerCase().trim()))
    ? String(category).toLowerCase().trim()
    : null;

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (cleanCat) filter.category = cleanCat;

      if (search && typeof search === 'string' && search.trim()) {
        const sanitizedSearch = escapeRegex(search.trim());
        const searchRegex = new RegExp(sanitizedSearch, 'i');
        filter.$or = [
          { name_en: searchRegex },
          { name_hi: searchRegex },
          { name_mr: searchRegex }
        ];
      }

      let query = Rate.find(filter);

      if (sort && VALID_SORTS.includes(sort)) {
        if (sort === 'price_asc') query = query.sort({ price_today: 1 });
        else if (sort === 'price_desc' || sort === 'spike') query = query.sort({ price_today: -1 });
        else query = query.sort({ category: 1, name_en: 1 });
      } else {
        query = query.sort({ category: 1, name_en: 1 });
      }

      const rates = await query.exec();
      if (rates && rates.length > 0) {
        return res.json({ success: true, count: rates.length, rates });
      }
    }

    // Always fallback to 20 canonical items so the site is never blank
    const fallbackList = getFallbackRates(cleanCat, search, sort);
    return res.json({ success: true, count: fallbackList.length, rates: fallbackList });
  } catch (error) {
    console.warn('⚠️ MongoDB query error, using sample rates fallback:', error.message);
    const fallbackList = getFallbackRates(cleanCat, search, sort);
    return res.json({ success: true, count: fallbackList.length, rates: fallbackList });
  }
});

// GET /api/cook-today and /api/rates/cook-today - returns the 3 cheapest vegetables with 4 dish suggestions
router.get(['/cook-today', '/rates/cook-today'], async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let cheapestVegetables = [];
    if (mongoose.connection.readyState === 1) {
      cheapestVegetables = await Rate.find({ category: 'vegetable' })
        .sort({ price_today: 1 })
        .limit(3);
    }

    if (!cheapestVegetables || cheapestVegetables.length === 0) {
      cheapestVegetables = sampleRates
        .filter(r => r.category === 'vegetable')
        .sort((a, b) => a.price_today - b.price_today)
        .slice(0, 3);
    }

    const dishes = generateDishSuggestions(cheapestVegetables);

    res.json({
      success: true,
      count: cheapestVegetables.length,
      vegetables: cheapestVegetables,
      dish: dishes[0] || null,
      dishes: dishes
    });
  } catch (error) {
    const fallbackVeg = sampleRates
      .filter(r => r.category === 'vegetable')
      .sort((a, b) => a.price_today - b.price_today)
      .slice(0, 3);
    const dishes = generateDishSuggestions(fallbackVeg);

    res.json({
      success: true,
      count: fallbackVeg.length,
      vegetables: fallbackVeg,
      dish: dishes[0] || null,
      dishes: dishes
    });
  }
});

// GET /api/season and /api/rates/season - returns items in season for the requested/current month
router.get(['/season', '/rates/season'], async (req, res) => {
  const now = new Date();
  let monthNum = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    monthNum = now.getMonth() + 1;
  }

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesHi = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const monthNamesMr = [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ];

  try {
    const mongoose = require('mongoose');
    let seasonalItems = [];
    if (mongoose.connection.readyState === 1) {
      seasonalItems = await Rate.find({ season_months: monthNum })
        .sort({ category: 1, price_today: 1 });
    }

    if (!seasonalItems || seasonalItems.length === 0) {
      seasonalItems = sampleRates
        .filter(r => r.season_months && r.season_months.includes(monthNum))
        .sort((a, b) => a.price_today - b.price_today);
    }

    res.json({
      success: true,
      month: monthNum,
      month_name_en: monthNamesEn[monthNum - 1],
      month_name_hi: monthNamesHi[monthNum - 1],
      month_name_mr: monthNamesMr[monthNum - 1],
      count: seasonalItems.length,
      items: seasonalItems
    });
  } catch (error) {
    const seasonalItems = sampleRates
      .filter(r => r.season_months && r.season_months.includes(monthNum))
      .sort((a, b) => a.price_today - b.price_today);

    res.json({
      success: true,
      month: monthNum,
      month_name_en: monthNamesEn[monthNum - 1],
      month_name_hi: monthNamesHi[monthNum - 1],
      month_name_mr: monthNamesMr[monthNum - 1],
      count: seasonalItems.length,
      items: seasonalItems
    });
  }
});

// GET /api/rates/:id - get single rate item (validates ObjectId)
router.get('/rates/:id', validateObjectId('id'), async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate item not found' });
    }
    res.json({ success: true, rate });
  } catch (error) {
    console.error('Error retrieving rate:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving rate item' });
  }
});

// POST /api/rates - add a new rate (Admin Auth + Admin Rate Limiter + Validation)
router.post('/rates', adminLimiter, requireAdminAuth, validateRatePayload(false), async (req, res) => {
  try {
    const {
      name_en,
      name_hi,
      name_mr,
      category,
      emoji,
      price_today,
      price_yesterday,
      price_week_low,
      unit,
      season_months,
      image_url
    } = req.body;

    const newRate = new Rate({
      name_en: name_en.trim(),
      name_hi: name_hi.trim(),
      name_mr: name_mr.trim(),
      category: category.toLowerCase().trim(),
      emoji: emoji.trim(),
      image_url: image_url ? image_url.trim() : `/images/${name_en.toLowerCase().replace(/\s+/g, '_')}.jpg`,
      price_today: Number(price_today),
      price_yesterday: price_yesterday !== undefined ? Number(price_yesterday) : Number(price_today),
      price_week_low: price_week_low !== undefined ? Number(price_week_low) : Number(price_today),
      unit: unit ? String(unit).slice(0, 20) : 'kg',
      date: new Date(),
      season_months: Array.isArray(season_months) ? season_months.map(Number) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    });

    const saved = await newRate.save();
    res.status(201).json({
      success: true,
      message: 'Rate added successfully to APMC Vashi Mandi',
      rate: saved
    });
  } catch (error) {
    console.error('Error adding rate:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/rates/:id - update an existing rate (Admin Auth + Admin Rate Limiter + ObjectId & Payload Validation)
router.put('/rates/:id', adminLimiter, requireAdminAuth, validateObjectId('id'), validateRatePayload(true), async (req, res) => {
  try {
    const updateData = {};
    const allowedFields = [
      'name_en', 'name_hi', 'name_mr', 'category', 'emoji',
      'price_today', 'price_yesterday', 'price_week_low',
      'unit', 'image_url', 'season_months'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.price_today !== undefined) updateData.price_today = Number(updateData.price_today);
    if (updateData.price_yesterday !== undefined) updateData.price_yesterday = Number(updateData.price_yesterday);
    if (updateData.price_week_low !== undefined) updateData.price_week_low = Number(updateData.price_week_low);
    updateData.date = new Date();

    const updated = await Rate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Rate item not found' });
    }

    res.json({
      success: true,
      message: 'Rate updated successfully',
      rate: updated
    });
  } catch (error) {
    console.error('Error updating rate:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/rates/:id - delete rate (Admin Auth + Admin Rate Limiter + ObjectId Validation)
router.delete('/rates/:id', adminLimiter, requireAdminAuth, validateObjectId('id'), async (req, res) => {
  try {
    const deleted = await Rate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Rate item not found' });
    }
    res.json({ success: true, message: 'Rate item removed from Mandi' });
  } catch (error) {
    console.error('Error deleting rate:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reset - reset rates to default sample items (Admin Auth + Admin Rate Limiter)
router.post('/reset', adminLimiter, requireAdminAuth, async (req, res) => {
  try {
    await Rate.deleteMany({});
    const inserted = await Rate.insertMany(sampleRates);
    res.json({
      success: true,
      message: `Reset complete! Inserted ${inserted.length} default APMC Vashi items.`,
      count: inserted.length
    });
  } catch (error) {
    console.error('Error resetting rates:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
