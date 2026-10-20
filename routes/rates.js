const express = require('express');
const router = express.Router();
const Rate = require('../models/Rate');
const sampleRates = require('../sampleRates');

// Recipe suggestions helper based on cheapest vegetables
function generateDishSuggestion(veggies) {
  if (!veggies || veggies.length === 0) {
    return null;
  }

  const names = veggies.map(v => v.name_en.toLowerCase());
  const v1 = veggies[0];
  const v2 = veggies[1] || v1;
  const v3 = veggies[2] || v2;

  // Calculate realistic cost for family of 4 (approx 1 kg total fresh produce + ₹15 oil/spices)
  const produceCost = Math.round(
    (v1.price_today * 0.4) +
    (v2.price_today * 0.3) +
    (v3.price_today * 0.3)
  );
  const pantryStaplesCost = 15;
  const familyCost = produceCost + pantryStaplesCost;

  let dish = {
    title_en: `${v1.name_en.split(' ')[0]} & ${v2.name_en.split(' ')[0]} Bazaar Stir Fry`,
    title_hi: `${v1.name_hi.split(' ')[0]} और ${v2.name_hi.split(' ')[0]} की स्वादिष्ट सब्जी`,
    title_mr: `${v1.name_mr.split(' ')[0]} आणि ${v2.name_mr.split(' ')[0]} चविष्ट भाजी`,
    recipe_en: [
      `1. Heat 2 tbsp mustard or groundnut oil in a kadai with cumin seeds, mustard seeds, and pinch of hing.`,
      `2. Add chopped ${v1.name_en} and ${v2.name_en} with turmeric, red chilli powder, and coriander-cumin powder.`,
      `3. Stir in ${v3.name_en}, cover and cook on low flame for 10-12 mins until tender; garnish with fresh coriander.`
    ],
    recipe_hi: [
      `1. कड़ाही में २ बड़े चम्मच तेल गरम करें, उसमें जीरा, राई और चुटकी भर हींग का तड़का लगाएं।`,
      `2. कटी हुई ${v1.name_hi.split(' ')[0]} और ${v2.name_hi.split(' ')[0]} डालें, साथ में हल्दी, लाल मिर्च और धनिया पाउडर मिलाएं।`,
      `3. फिर ${v3.name_hi.split(' ')[0]} मिलाकर धीमी आंच पर १०-१२ मिनट ढककर पकाएं; ऊपर से हरा धनिया बुरकें।`
    ],
    recipe_mr: [
      `1. कढईत २ मोठे चमचे तेल गरम करून त्यात जिरे, मोहरी आणि चिमूटभर हिंगाची फोडणी द्या.`,
      `2. चिरलेला ${v1.name_mr.split(' ')[0]} आणि ${v2.name_mr.split(' ')[0]} घालून हळद, तिखट आणि धने-जिरे पूड मिसळा.`,
      `3. त्यात ${v3.name_mr.split(' ')[0]} टाकून झाकण ठेवून मंद आचेवर १०-१२ मिनिटे वाफेवर शिजवा; कोथिंबीर घालून सर्व्ह करा.`
    ],
    family_cost: familyCost,
    servings: '4 persons',
    produce_cost: produceCost,
    savings_vs_hotel: Math.max(160, Math.round(familyCost * 3.5))
  };

  // Tailored recipes for classic combos
  const hasSpinach = names.some(n => n.includes('spinach'));
  const hasPotato = names.some(n => n.includes('potato'));
  const hasCabbage = names.some(n => n.includes('cabbage'));
  const hasCauliflower = names.some(n => n.includes('cauliflower'));
  const hasTomato = names.some(n => n.includes('tomato'));

  if (hasSpinach && hasPotato) {
    dish.title_en = 'Desi Aloo Palak with Homestyle Tadka';
    dish.title_hi = 'देसी आलू पालक लजीज तड़का';
    dish.title_mr = 'गावरान बटाटा पालक झणझणीत फोडणी';
    dish.recipe_en = [
      '1. Heat 1.5 tbsp oil with cumin, chopped garlic, and green chillies until aromatic.',
      '2. Add cubed boiled potatoes with turmeric and salt; sauté until golden crisp.',
      '3. Fold in roughly chopped fresh spinach and simmer for 5 minutes; finish with a dash of garam masala.'
    ];
    dish.recipe_hi = [
      '1. तेल में जीरा, लहसुन और हरी मिर्च डालकर खुशबू आने तक भूनें।',
      '2. उबले कटे आलू, हल्दी और नमक डालकर सुनहरा कुरकुरा होने तक सेकें।',
      '3. ताजी कटी पालक मिलाएं और ५ मिनट ढककर पकाएं; अंत में चुटकी भर गरम मसाला छिड़कें।'
    ];
    dish.recipe_mr = [
      '1. तेलात जिरे, ठेचलेला लसूण आणि हिरवी मिरची घालून खमंग परतून घ्या.',
      '2. उकडलेल्या बटाट्याचे तुकडे, हळद व मीठ घालून सोनेरी कुरकुरीत होईपर्यंत परता.',
      '3. बारीक चिरलेली ताजी पालक घालून ५ मिनिटे वाफ काढा; शेवटी थोडा गरम मसाला भुरभुरा.'
    ];
  } else if (hasCabbage && hasPotato) {
    dish.title_en = 'Maharashtrian Kobi Batata Sookhi Bhaji';
    dish.title_hi = 'पत्तागोभी आलू की सूखी मसालेदार सब्जी';
    dish.title_mr = 'खमंग कोबी बटाटा सुकी भाजी';
    dish.recipe_en = [
      '1. Splutter mustard seeds, curry leaves, and green chillies in hot oil.',
      '2. Add finely diced potatoes and sliced cabbage with turmeric and salt.',
      '3. Cover and cook in its own steam for 10 minutes; garnish with freshly grated coconut and coriander.'
    ];
    dish.recipe_hi = [
      '1. गरम तेल में राई, कढ़ी पत्ता और हरी मिर्च का तड़का लगाएं।',
      '2. बारीक कटे आलू और पत्तागोभी को हल्दी व स्वादानुसार नमक के साथ मिलाएं।',
      '3. ढक्कन रखकर १० मिनट भाप में पकाएं; ऊपर से ताजा कसा नारियल और हरा धनिया सजाएं।'
    ];
    dish.recipe_mr = [
      '1. गरम तेलात मोहरी, कढीपत्ता आणि हिरवी मिरची तडतडवून घ्या.',
      '2. बारीक चिरलेला बटाटा व कोबी हळद आणि चवीनुसार मीठ घालून व्यवस्थित परता.',
      '3. झाकण ठेवून १० मिनिटे वाफेवर शिजवा; वरून ओले खोबरे आणि कोथिंबीर पेरा.'
    ];
  } else if (hasCauliflower && hasPotato) {
    dish.title_en = 'APMC Special Aloo Gobi Masala';
    dish.title_hi = 'हलवाई स्टाइल आलू गोभी मसाला';
    dish.title_mr = 'मसालेदार बटाटा फ्लॉवर रस्सा / सुकी भाजी';
    dish.recipe_en = [
      '1. Lightly sauté cauliflower florets and potato cubes in 2 tbsp oil till golden.',
      '2. Temper ginger, onions, tomatoes, and ground spices till oil separates.',
      '3. Combine vegetables with the gravy, add splash of water, simmer covered for 8 mins.'
    ];
    dish.recipe_hi = [
      '1. फूलगोभी और आलू को २ चम्मच तेल में हल्का सुनहरा होने तक भूनकर निकालें।',
      '2. उसी कड़ाही में अदरक, प्याज, टमाटर और मसाले तेल छोड़ने तक भूनें।',
      '3. सब्जियां मसाले में मिलाएं, थोड़ा पानी छिड़कें और ढककर ८ मिनट पकाएं।'
    ];
    dish.recipe_mr = [
      '1. फ्लॉवरचे तुकडे आणि बटाटा २ चमचे तेलात सोनेरी रंगावर परतून बाजूला ठेवा.',
      '2. कढईत आले, कांदा, टोमॅटो आणि मसाले तेल सुटेपर्यंत चांगले परता.',
      '3. भाज्या मसाल्यात मिसळा, किंचित पाणी घालून झाकून ८ मिनिटे छान शिजू द्या.'
    ];
  }

  return dish;
}

// GET /api/rates and /api/rates/all - returns all rates (supports ?category= and ?search=)
router.get(['/rates', '/'], async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category.toLowerCase().trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name_en: searchRegex },
        { name_hi: searchRegex },
        { name_mr: searchRegex }
      ];
    }

    let query = Rate.find(filter);

    if (sort === 'price_asc') {
      query = query.sort({ price_today: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ price_today: -1 });
    } else if (sort === 'spike') {
      // client can also sort by spike, or default order
      query = query.sort({ price_today: -1 });
    } else {
      query = query.sort({ category: 1, name_en: 1 });
    }

    const rates = await query.exec();
    res.json({
      success: true,
      count: rates.length,
      rates
    });
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rates', error: error.message });
  }
});

// GET /api/cook-today and /api/rates/cook-today - returns the 3 cheapest vegetables with dish suggestion & approx cost
router.get(['/cook-today', '/rates/cook-today'], async (req, res) => {
  try {
    const cheapestVegetables = await Rate.find({ category: 'vegetable' })
      .sort({ price_today: 1 })
      .limit(3);

    const dishSuggestion = generateDishSuggestion(cheapestVegetables);

    res.json({
      success: true,
      count: cheapestVegetables.length,
      vegetables: cheapestVegetables,
      dish: dishSuggestion
    });
  } catch (error) {
    console.error('Error fetching cook-today vegetables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cook-today items', error: error.message });
  }
});

// GET /api/season and /api/rates/season - returns items in season for the current month
router.get(['/season', '/rates/season'], async (req, res) => {
  try {
    const now = new Date();
    // Month number 1 to 12
    const currentMonth = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;

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

    const safeMonth = (currentMonth >= 1 && currentMonth <= 12) ? currentMonth : now.getMonth() + 1;

    const seasonalItems = await Rate.find({ season_months: safeMonth })
      .sort({ category: 1, price_today: 1 });

    res.json({
      success: true,
      month: safeMonth,
      month_name_en: monthNamesEn[safeMonth - 1],
      month_name_hi: monthNamesHi[safeMonth - 1],
      month_name_mr: monthNamesMr[safeMonth - 1],
      count: seasonalItems.length,
      items: seasonalItems
    });
  } catch (error) {
    console.error('Error fetching seasonal items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seasonal items', error: error.message });
  }
});

// GET /api/rates/:id - get single rate item
router.get('/rates/:id', async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate item not found' });
    }
    res.json({ success: true, rate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving rate', error: error.message });
  }
});

// POST /api/rates - add a new rate
router.post('/rates', async (req, res) => {
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
      season_months
    } = req.body;

    if (!name_en || !name_hi || !name_mr || !category || !emoji || price_today === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name_en, name_hi, name_mr, category, emoji, price_today'
      });
    }

    const newRate = new Rate({
      name_en: name_en.trim(),
      name_hi: name_hi.trim(),
      name_mr: name_mr.trim(),
      category: category.toLowerCase().trim(),
      emoji: emoji.trim(),
      price_today: Number(price_today),
      price_yesterday: price_yesterday !== undefined ? Number(price_yesterday) : Number(price_today),
      price_week_low: price_week_low !== undefined ? Number(price_week_low) : Number(price_today),
      unit: unit || 'kg',
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
    console.error('Error adding rate:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/rates/:id - update an existing rate
router.put('/rates/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
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
    console.error('Error updating rate:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/rates/:id - delete rate
router.delete('/rates/:id', async (req, res) => {
  try {
    const deleted = await Rate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Rate item not found' });
    }
    res.json({ success: true, message: 'Rate item removed from Mandi' });
  } catch (error) {
    console.error('Error deleting rate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reset - reset rates to default sample items
router.post('/reset', async (req, res) => {
  try {
    await Rate.deleteMany({});
    const inserted = await Rate.insertMany(sampleRates);
    res.json({
      success: true,
      message: `Reset complete! Inserted ${inserted.length} default APMC Vashi items.`,
      count: inserted.length
    });
  } catch (error) {
    console.error('Error resetting rates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
