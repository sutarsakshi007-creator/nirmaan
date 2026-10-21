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

  // Realistic meal economics for a family of 4 (4 full servings):
  // 1. Fresh APMC wholesale produce (~1 kg total fresh vegetables)
  const baseProduceCost = Math.round(
    (v1.price_today * 0.45) +
    (v2.price_today * 0.35) +
    (v3.price_today * 0.20)
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
      title_en: 'Desi Aloo Palak with Homestyle Tadka & Phulkas',
      title_hi: 'देसी आलू पालक लजीज तड़का व ताज़ा फुल्के',
      title_mr: 'गावरान बटाटा पालक झणझणीत फोडणी व गरम चपाती',
      recipe_en: [
        '1. Heat 1.5 tbsp mustard or sunflower oil with cumin seeds, crushed garlic, and sliced green chillies until fragrant.',
        '2. Add cubed boiled potatoes with turmeric, coriander powder, and pink rock salt; sauté until edges turn golden crisp.',
        '3. Fold in washed, shredded fresh spinach, simmer covered for 4-5 minutes, finish with homemade garam masala; serve hot with fresh wheat phulkas.'
      ],
      recipe_hi: [
        '1. गरम तेल में जीरा, ठेचा हुआ लहसुन और हरी मिर्च डालकर हल्की खुशबू आने तक भूनें।',
        '2. उबले चौकोर कटे आलू, हल्दी, धनिया पाउडर और नमक डालकर सुनहरा कुरकुरा होने तक सेकें।',
        '3. ताजी कटी पालक मिलाएं और ४-५ मिनट ढककर पकाएं; अंत में गरम मसाला छिड़कें और गरमागरम फुल्कों के साथ परोसें।'
      ],
      recipe_mr: [
        '1. कढईत तेलात जिरे, ठेचलेला लसूण आणि हिरवी मिरची घालून खमंग तडतडवून घ्या.',
        '2. उकडलेल्या बटाट्याचे मध्यम काप, हळद, धनेपूड व मीठ घालून सोनेरी कुरकुरीत होईपर्यंत परतून घ्या.',
        '3. बारीक चिरलेली ताजी पालक घालून मंद आचेवर ४-५ मिनिटे वाफ काढा; वरून थोडा गरम मसाला भुरभुरा व गरम चपातीसोबत वाढा.'
      ],
      produce_cost: baseProduceCost,
      tadka_cost: 20, // Cooking oil, cumin, garlic, green chillies, turmeric, salt
      staples_cost: 28, // 400g whole wheat atta for 10-12 hot phulkas
      family_cost: baseProduceCost + 20 + 28, // Complete balanced meal for 4
      cost_per_person: Math.round((baseProduceCost + 48) / 4),
      servings: '4 persons',
      savings_vs_hotel: 290 // Restaurant delivery bill is ₹360+ vs ~₹72 at home
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
      title_en: 'Maharashtrian Kobi Batata Sookhi Bhaji & Bhakri',
      title_hi: 'पत्तागोभी आलू की सूखी मसालेदार भाजी व रोटी',
      title_mr: 'खमंग कोबी बटाटा सुकी भाजी व ज्वारीची भाकरी',
      recipe_en: [
        '1. In hot oil, crackle mustard seeds, curry leaves, hing, and chopped green chillies in a heavy-bottom kadai.',
        '2. Add finely shredded fresh cabbage and cubed potatoes with turmeric powder and salt; mix thoroughly on high flame for 2 mins.',
        '3. Cover and cook in its own gentle steam for 8-10 mins without adding water; garnish with freshly grated coconut & coriander; enjoy with bhakri.'
      ],
      recipe_hi: [
        '1. गरम तेल में राई, कढ़ी पत्ता, हींग और कटी हरी मिर्च का खमंग तड़का लगाएं।',
        '2. बारीक कटी पत्तागोभी और आलू हल्दी व स्वादानुसार नमक डालकर २ मिनट तेज आंच पर भूनें।',
        '3. ढक्कन रखकर बिना पानी डाले ८-१० मिनट अपनी भाप में पकाएं; ऊपर से ताजा कसा नारियल और हरा धनिया सजाकर रोटी संग परोसें।'
      ],
      recipe_mr: [
        '1. कढईत गरम तेलात मोहरी, कढीपत्ता, हिंग आणि हिरवी मिरचीची खमंग फोडणी द्या.',
        '2. बारीक चिरलेली कोबी व बटाट्याचे काप हळद आणि चवीनुसार मीठ घालून २ मिनिटे परता.',
        '3. पाणी न घालता झाकण ठेवून ८-१० मिनिटे मंद वाफेवर शिजवा; वरून ओले खोबरे आणि कोथिंबीर पेरा व गरमागरम भाकरीसोबत आस्वाद घ्या.'
      ],
      produce_cost: Math.round(baseProduceCost * 0.95),
      tadka_cost: 18, // Oil, mustard, curry leaves, hing, green chillies, coconut
      staples_cost: 26, // Atta / Jowar flour for 4 persons
      family_cost: Math.round(baseProduceCost * 0.95) + 18 + 26,
      cost_per_person: Math.round((Math.round(baseProduceCost * 0.95) + 44) / 4),
      servings: '4 persons',
      savings_vs_hotel: 270
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
      title_en: 'Dhabe Wali Paushtik Palak Lasooni Dal & Jeera Rice',
      title_hi: 'ढाबा स्टाइल लहुसनी पालक दाल तड़का व चावल',
      title_mr: 'अस्सल ढाबा स्टाईल लसुणी पालक डाळ तडका व जिरा राईस',
      recipe_en: [
        '1. Pressure cook washed toor/moong dal with ripe tomatoes, turmeric, and a pinch of hing for 3-4 whistles till creamy.',
        '2. In a tadka pan, crackle cumin seeds, 2 dry red chillies, and 8-10 crushed garlic cloves in 1 tbsp pure cow desi ghee until golden brown.',
        '3. Sauté shredded spinach in the tadka for 2 mins, pour directly into hot cooked dal, simmer for 5 mins; serve piping hot with steamed jeera rice.'
      ],
      recipe_hi: [
        '1. प्रेशर कुकर में तुअर या मूंग दाल को पके टमाटर, हल्दी और हींग के साथ ३-४ सीटी आने तक क्रीमी पकाएं।',
        '2. तड़का पैन में १ बड़ा चम्मच देसी घी गर्म करके जीरा, २ सूखी लाल मिर्च और ८-१० कुटी लहसुन की कलियां सुनहरी भूनें।',
        '3. कटी पालक को तड़के में २ मिनट भूनकर उबली दाल में डालें, ५ मिनट उबालें; गरमागरम खुशबूदार जीरा राइस के साथ परोसें।'
      ],
      recipe_mr: [
        '1. कुकरमध्ये तूर किंवा मूग डाळ टोमॅटो, हळद आणि हिंग घालून मऊसर ३-४ शिट्ट्यांवर शिजवून घ्या.',
        '2. तडका पॅनमध्ये १ चमचा साजूक तुपात जिरे, २ सुक्या लाल मिरच्या आणि ८-१० लसूण पाकळ्या सोनेरी होईपर्यंत खमंग परता.',
        '3. बारीक चिरलेली पालक तुपाच्या फोडणीत २ मिनिटे परतून शिजलेल्या डाळीत ओता व ५ मिनिटे उकळा; गरमागरम जिरा राईससोबत सर्व्ह करा.'
      ],
      produce_cost: Math.round(baseProduceCost * 0.8),
      tadka_cost: 26, // Desi ghee, 10 garlic cloves, dry chillies, cumin, hing
      staples_cost: 32, // 200g high-protein toor/moong dal + basmati rice for 4
      family_cost: Math.round(baseProduceCost * 0.8) + 26 + 32,
      cost_per_person: Math.round((Math.round(baseProduceCost * 0.8) + 58) / 4),
      servings: '4 persons',
      savings_vs_hotel: 310
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
      title_hi: 'शाम की चाय संग कुरकुरी पालक प्याज भजिया व पकोड़े',
      title_mr: 'संध्याकाळच्या चहा सोबत कुरकुरीत पालक कांदा भजी व भजी ताट',
      recipe_en: [
        '1. Thinly slice potatoes and onions; combine with finely shredded spinach, carom seeds (ajwain), green chillies, and pinch of baking soda.',
        '2. Add gram flour (chana besan), rice flour for extra crunch, turmeric, and salt; mix with minimal water drops to form a thick, crunchy coating.',
        '3. Drop rough fritters into medium-hot oil and deep fry until crispy and golden amber; serve piping hot with fresh mint chutney & cutting chai.'
      ],
      recipe_hi: [
        '1. पतले कटे आलू व प्याज को कटी पालक, अजवाइन, हरी मिर्च और चुटकी भर मीठे सोडे के साथ मिलाएं।',
        '2. चने का बेसन, १ चम्मच चावल का आटा (अतिरिक्त कुरकुरेपन के लिए), हल्दी व नमक डालकर हल्का पानी छिड़क कर सूखा गाढ़ा घोल बनाएं।',
        '3. मध्यम गरम तेल में छोटे पकोड़े डालकर सुनहरा कुरकुरा होने तक तलें; हरी पुदीना चटनी और गरमागरम कड़क चाय के साथ परोसें।'
      ],
      recipe_mr: [
        '1. पातळ कापलेला बटाटा, कांदा, चिरलेली पालक, ओवा, बारीक हिरवी मिरची व चिमूटभर सोडा एकत्र करा.',
        '2. चण्याचे बेसन, कुरकुरीतपणासाठी १ चमचा तांदळाचे पीठ, हळद व चवीनुसार मीठ घालून हलका पाण्याचा हात लावून घट्ट पीठ तयार करा.',
        '3. मध्यम गरम तेलात कुरकुरीत भजी तळून काढा; पुदिना-कोथिंबीर चटणी आणि गरमागरम वाफाळलेल्या कटिंग चहासोबत मनसोक्त आस्वाद घ्या.'
      ],
      produce_cost: Math.round(baseProduceCost * 0.85),
      tadka_cost: 22, // Frying oil, ajwain, green chillies, mint chutney ingredients
      staples_cost: 16, // Chana besan & rice flour
      family_cost: Math.round(baseProduceCost * 0.85) + 22 + 16,
      cost_per_person: Math.round((Math.round(baseProduceCost * 0.85) + 38) / 4),
      servings: '4 persons',
      savings_vs_hotel: 220
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

// GET /api/quick-meals and /api/rates/quick-meals - returns homemade instant mixes prototypes with APMC market cost connections
router.get(['/quick-meals', '/rates/quick-meals'], async (req, res) => {
  try {
    let greenChilliRate = 48;
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const chilliDoc = await Rate.findOne({ name_en: /Green Chilli/i });
      if (chilliDoc && chilliDoc.price_today) {
        greenChilliRate = chilliDoc.price_today;
      }
    }

    const mixes = [
      {
        id: 'poha-mix',
        name_en: 'Instant Poha Mix',
        name_hi: 'इंस्टेंट पोहा मिक्स',
        name_mr: 'इन्स्टंट पोहे मिक्स',
        image_url: '/images/poha_mix.jpg',
        label_url: '/images/poha_mix_label.png',
        qr_url: '/images/mix_qr_code.png',
        prep_time: '5-6 mins',
        prep_time_hi: '५-६ मिनट',
        prep_time_mr: '५-६ मिनिटे',
        serving_size_en: '1 Bowl (~160g cooked) • 250g Jar (~4 Servings)',
        serving_size_hi: '१ कटोरी (~१६० ग्राम तैयार) • २५० ग्राम जार (~४ प्लेट)',
        serving_size_mr: '१ वाटी (~१६० ग्रॅम तयार) • २५० ग्रॅम बरणी (~४ प्लेट)',
        estimated_cost_per_serving: 6.50,
        cost_status_label: 'Estimated ingredient cost per serving — prototype estimate; verification pending',
        packaging_note: 'Packaging excluded from per-serving ingredient cost',
        jar_net_wt: '250g',
        jar_servings: 4,
        jar_ingredient_cost: 26.00,
        jar_packaging_cost: 70.00,
        jar_total_prototype_cost: 96.00,
        mrp_estimate: 99.00,
        mrp_label: '₹99.00 (Market-Aligned Prototype MRP)',
        commercial_comparison_status: 'Pending verification',
        commercial_comparison_text: 'Commercial store comparison temporarily withheld pending lab verification of portion weights and shelf-life audit.',
        exclusions_text: 'Total prototype cost per jar excludes: commercial factory overheads, manual labor, secondary logistics, GST, and distributor margins (verification pending).',
        formulated_by: 'Sakshi Sutar',
        lab_name: 'Nirmaan Lab',
        ingredients_list_en: 'Poha, Peanuts, Cumin, Mustard seeds, Fried chilli, Turmeric, Salt',
        ingredients_list_hi: 'पोहा, मूंगफली, जीरा, राई, तली हरी मिर्च, हल्दी, नमक',
        ingredients_list_mr: 'पोहे, शेंगदाणे, जिरे, मोहरी, तळलेली हिरवी मिरची, हळद, मीठ',
        nutrition_facts: {
          serving: 'Per 100g dry mix (Jar: 250g)',
          calories: '385 kcal',
          fat: '8.5 g',
          sodium: '420 mg',
          carbs: '68.0 g',
          protein: '9.2 g'
        },
        ingredient_breakdown: [
          { name: 'Thick Poha (Rice Flakes)', amount: '45g', rate_basis: 'APMC wholesale ₹42/kg', cost: '₹1.90', type: 'APMC Wholesale Rate' },
          { name: 'Roasted Peanuts', amount: '10g', rate_basis: 'Wholesale ₹120/kg', cost: '₹1.20', type: 'Market Baseline' },
          { name: 'Mustard & Cumin Seeds', amount: '2g', rate_basis: 'Spice market ₹280/kg', cost: '₹0.60', type: 'Market Baseline' },
          { name: 'Fried Green Chilli', amount: '2g', rate_basis: `APMC Live ₹${greenChilliRate}/kg`, cost: '₹0.50', type: 'APMC Live Rate' },
          { name: 'Turmeric, Salt & Curry Leaf', amount: '1g', rate_basis: 'Pantry staples baseline', cost: '₹0.80', type: 'Pantry Baseline' },
          { name: 'Cooking Steam / Fuel', amount: 'Boiling water', rate_basis: 'Domestic fuel estimate', cost: '₹1.50', type: 'Estimated Fuel' }
        ],
        jar_cost_breakdown: [
          { item: 'Estimated Ingredients (250g Jar - 4 Servings)', cost: '₹26.00', basis: '4 servings × ₹6.50 portion estimate', badge: 'Estimate' },
          { item: 'Glass Jar Packaging (Actual Entered Cost)', cost: '₹70.00', basis: 'Food-grade glass jar, airtight lid & label printing', badge: 'Entered Cost' },
          { item: 'Total Prototype Cost per Jar', cost: '₹96.00', basis: 'Ingredients (₹26) + Packaging (₹70)', badge: 'Total Prototype' },
          { item: 'Prototype Market MRP', cost: '₹99.00', basis: 'Benchmark market retail price (Incl. of all taxes)', badge: 'Market Price' }
        ],
        steps_en: [
          'Boil 1½ cups (approx. 220ml) of clean drinking water in a pan or saucepan.',
          'Add the Instant Poha Mix (approx. 60g portion for 1 serving) into the boiling water.',
          'Cook on medium heat for 2-3 minutes, stirring gently until the poha softens and absorbs the seasoned moisture.',
          'Remove from heat, cover with a lid for 1 minute to rest, fluff with a fork, and serve hot with fresh lemon.'
        ],
        steps_hi: [
          'एक पैन या बर्तन में डेढ़ कप (लगभग २२० मिली) पानी उबालें।',
          'उबलते पानी में इंस्टेंट पोहा मिक्स (६० ग्राम प्रति प्लेट) डालें।',
          'मध्यम आंच पर २ से ३ मिनट पकाएं और धीरे-धीरे चम्मच से चलाएं जब तक पोहा पानी सोख कर मुलायम न हो जाए।',
          'गैस बंद करें, १ मिनट के लिए ढक्कन रखकर भाप में रहने दें, कांटे से मोकळा करें और नींबू निचोड़कर गरमागरम परोसें।'
        ],
        steps_mr: [
          'एका पातेल्यात दीड कप (अंदाजे २२० मिली) पाणी चांगले उकळून घ्या.',
          'उकळत्या पाण्यात इन्स्टंट पोहे मिक्स (६० ग्रॅम प्रति प्लेट) घाला.',
          'मध्यम आचेवर २ ते ३ मिनिटे शिजवा, पोहे पाणी शोषून मऊ होईपर्यंत हलक्या हाताने ढवळा.',
          'गॅस बंद करून १ मिनिट झाकण ठेवा, चमच्याने मोकळे करा आणि लिंबू पिळून गरमागरम आस्वाद घ्या.'
        ]
      },
      {
        id: 'upma-mix',
        name_en: 'Instant Upma Mix',
        name_hi: 'इंस्टेंट उपमा मिक्स',
        name_mr: 'इन्स्टंट उपमा मिक्स',
        image_url: '/images/upma_mix.jpg',
        label_url: '/images/upma_mix_label.png',
        qr_url: '/images/mix_qr_code.png',
        prep_time: '5-6 mins',
        prep_time_hi: '५-६ मिनट',
        prep_time_mr: '५-६ मिनिटे',
        serving_size_en: '1 Bowl (~180g cooked) • 250g Jar (~4 Servings)',
        serving_size_hi: '१ कटोरी (~१८० ग्राम तैयार) • २५० ग्राम जार (~४ प्लेट)',
        serving_size_mr: '१ वाटी (~१८० ग्रॅम तयार) • २५० ग्रॅम बरणी (~४ प्लेट)',
        estimated_cost_per_serving: 5.80,
        cost_status_label: 'Estimated ingredient cost per serving — prototype estimate; verification pending',
        packaging_note: 'Packaging excluded from per-serving ingredient cost',
        jar_net_wt: '250g',
        jar_servings: 4,
        jar_ingredient_cost: 23.20,
        jar_packaging_cost: 70.00,
        jar_total_prototype_cost: 93.20,
        mrp_estimate: 95.00,
        mrp_label: '₹95.00 (Market-Aligned Prototype MRP)',
        commercial_comparison_status: 'Pending verification',
        commercial_comparison_text: 'Commercial store comparison temporarily withheld pending lab verification of portion weights and shelf-life audit.',
        exclusions_text: 'Total prototype cost per jar excludes: commercial factory overheads, manual labor, secondary logistics, GST, and distributor margins (verification pending).',
        formulated_by: 'Sakshi Sutar',
        lab_name: 'Nirmaan Lab',
        ingredients_list_en: 'Roasted semolina (rava/suji), Peanuts, Mustard seeds, Cumin, Fried chilli, Salt',
        ingredients_list_hi: 'भुनी सूजी (रवा), मूंगफली, राई, जीरा, तली हरी मिर्च, नमक',
        ingredients_list_mr: 'भाजलेला रवा, शेंगदाणे, मोहरी, जिरे, तळलेली हिरवी मिरची, मीठ',
        nutrition_facts: {
          serving: 'Per 100g dry mix (Jar: 250g)',
          calories: '380 kcal',
          fat: '7.2 g',
          sodium: '440 mg',
          carbs: '67.5 g',
          protein: '11.5 g'
        },
        ingredient_breakdown: [
          { name: 'Roasted Semolina (Rava / Suji)', amount: '45g', rate_basis: 'APMC wholesale ₹38/kg', cost: '₹1.70', type: 'APMC Wholesale Rate' },
          { name: 'Roasted Peanuts', amount: '8g', rate_basis: 'Wholesale ₹120/kg', cost: '₹0.96', type: 'Market Baseline' },
          { name: 'Mustard & Cumin Seeds', amount: '3g', rate_basis: 'Spice market ₹280/kg', cost: '₹0.75', type: 'Market Baseline' },
          { name: 'Fried Green Chilli', amount: '2g', rate_basis: `APMC Live ₹${greenChilliRate}/kg`, cost: '₹0.50', type: 'APMC Live Rate' },
          { name: 'Salt & Roasting Ghee/Oil', amount: '2g', rate_basis: 'Pantry staples baseline', cost: '₹0.89', type: 'Pantry Baseline' },
          { name: 'Simmering Fuel', amount: 'Water boiling', rate_basis: 'Domestic fuel estimate', cost: '₹1.00', type: 'Estimated Fuel' }
        ],
        jar_cost_breakdown: [
          { item: 'Estimated Ingredients (250g Jar - 4 Servings)', cost: '₹23.20', basis: '4 servings × ₹5.80 portion estimate', badge: 'Estimate' },
          { item: 'Glass Jar Packaging (Actual Entered Cost)', cost: '₹70.00', basis: 'Food-grade glass jar, airtight lid & label printing', badge: 'Entered Cost' },
          { item: 'Total Prototype Cost per Jar', cost: '₹93.20', basis: 'Ingredients (₹23.20) + Packaging (₹70)', badge: 'Total Prototype' },
          { item: 'Prototype Market MRP', cost: '₹95.00', basis: 'Benchmark market retail price (Incl. of all taxes)', badge: 'Market Price' }
        ],
        steps_en: [
          'Boil 1½ cups (approx. 220ml) of clean drinking water in a saucepan.',
          'Lower flame and gradually pour in the Instant Upma Mix while stirring continuously to prevent any lumps from forming.',
          'Cook on medium heat for 2-3 minutes until the batter thickens and turns aromatic.',
          'Turn off flame, let sit covered with a lid for 1 minute for fluffy texture, and serve hot with coconut chutney or desi ghee.'
        ],
        steps_hi: [
          'एक पैन में डेढ़ कप (लगभग २२० मिली) पानी उबाल लें।',
          'आंच धीमी करें और धीरे-धीरे इंस्टेंट उपमा मिक्स डालते हुए लगातार चम्मच से चलाएं ताकि कोई गांठ न पड़े।',
          'मध्यम आंच पर २ से ३ मिनट पकाएं जब तक मिश्रण गाढ़ा और खुशबूदार न हो जाए।',
          'गैस बंद करें, १ मिनट ढककर रखें ताकि उपमा खिला-खिला बने और देसी घी या चटनी के साथ परोसें।'
        ],
        steps_mr: [
          'एका पातेल्यात दीड कप (अंदाजे २२० मिली) पाणी चांगले उकळून घ्या.',
          'गॅस मंद करा आणि इन्स्टंट उपमा मिक्स हळूहळू ओता व गुठळ्या होऊ नयेत म्हणून सतत ढवळत राहा.',
          'मध्यम आचेवर २ ते ३ मिनिटे पीठ घट्ट व खमंग होईपर्यंत शिजवा.',
          'गॅस बंद करून १ मिनिट झाकून ठेवा आणि साजूक तूप किंवा खोबऱ्याच्या चटणीसोबत गरमागरम वाढा.'
        ]
      }
    ];

    res.json({
      success: true,
      count: mixes.length,
      disclaimer: 'Estimated prototype cost based on APMC wholesale baseline rates. Non-certified homemade experimental meal-kit.',
      mixes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving quick meals' });
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
