/**
 * Mandi Mood - APMC Vashi Daily Wholesale Market Dashboard
 * Mobile-First Frontend Controller
 */

// Global App State
const state = {
  currentLang: localStorage.getItem('mandi_lang') || 'mr', // Marathi by default for Vashi/Navi Mumbai
  rates: [],
  filteredRates: [],
  cookToday: null,
  seasonalItems: [],
  selectedCategory: 'all',
  searchQuery: '',
  sortOption: 'default',
  editingRateId: null,
  selectedDishIndex: 0,
  quickMeals: []
};

// DOM Elements
const elements = {
  // Lang switcher
  langBtns: document.querySelectorAll('.lang-btn'),
  // Controls
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  categoryChips: document.querySelectorAll('.category-chip'),
  sortSelect: document.getElementById('sortSelect'),
  itemsCounter: document.getElementById('itemsCounter'),
  // Containers
  seasonScroll: document.getElementById('seasonScroll'),
  seasonMonthName: document.getElementById('seasonMonthName'),
  ratesGrid: document.getElementById('ratesGrid'),
  cookContainer: document.getElementById('cookContainer'),
  quickMealsContainer: document.getElementById('quickMealsContainer'),
  // Modals
  posterModal: document.getElementById('posterModal'),
  adminModal: document.getElementById('adminModal'),
  quickMixModal: document.getElementById('quickMixModal'),
  closeQuickMixBtn: document.getElementById('closeQuickMixBtn'),
  quickMixModalBody: document.getElementById('quickMixModalBody'),
  quickMixModalName: document.getElementById('quickMixModalName'),
  posterCanvas: document.getElementById('posterCanvas'),
  openPosterBtn: document.getElementById('openPosterBtn'),
  closePosterBtn: document.getElementById('closePosterBtn'),
  downloadPosterBtn: document.getElementById('downloadPosterBtn'),
  shareWhatsAppBtn: document.getElementById('shareWhatsAppBtn'),
  openAdminBtn: document.getElementById('openAdminBtn'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  // Admin form
  adminForm: document.getElementById('adminForm'),
  adminTabAdd: document.getElementById('adminTabAdd'),
  adminTabEdit: document.getElementById('adminTabEdit'),
  adminEditList: document.getElementById('adminEditList'),
  adminSelectGroup: document.getElementById('adminSelectGroup'),
  resetSeedBtn: document.getElementById('resetSeedBtn'),
  toast: document.getElementById('toastNotice')
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initEventListeners();
  loadAllData();
});

function initLanguage() {
  updateLanguageUI(state.currentLang);
}

function initEventListeners() {
  // Language buttons
  elements.langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  // Search input
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    elements.clearSearchBtn.classList.toggle('visible', state.searchQuery.length > 0);
    applyFilters();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchBtn.classList.remove('visible');
    applyFilters();
    elements.searchInput.focus();
  });

  // Category chips
  elements.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedCategory = chip.getAttribute('data-category');
      applyFilters();
    });
  });

  // Sort select
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortOption = e.target.value;
    applyFilters();
  });

  // Share Poster Modal
  elements.openPosterBtn.addEventListener('click', openPosterModal);
  elements.closePosterBtn.addEventListener('click', () => elements.posterModal.classList.remove('open'));
  elements.downloadPosterBtn.addEventListener('click', downloadPosterImage);
  elements.shareWhatsAppBtn.addEventListener('click', sharePosterWhatsApp);

  // Admin Modal
  elements.openAdminBtn.addEventListener('click', () => openAdminModal());
  elements.closeAdminBtn.addEventListener('click', () => elements.adminModal.classList.remove('open'));
  elements.adminTabAdd.addEventListener('click', () => setAdminMode('add'));
  elements.adminTabEdit.addEventListener('click', () => setAdminMode('edit'));
  elements.adminForm.addEventListener('submit', handleAdminFormSubmit);
  elements.resetSeedBtn.addEventListener('click', handleResetSeed);

  // Quick Mix Modal Close
  if (elements.closeQuickMixBtn) {
    elements.closeQuickMixBtn.addEventListener('click', closeQuickMixModal);
  }

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target === elements.posterModal) elements.posterModal.classList.remove('open');
    if (e.target === elements.adminModal) elements.adminModal.classList.remove('open');
    if (e.target === elements.quickMixModal) closeQuickMixModal();
  });

  // Delegated click listener for quick mix details buttons
  if (elements.quickMealsContainer) {
    elements.quickMealsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-mix-details');
      if (btn) {
        const mixId = btn.getAttribute('data-mix');
        openQuickMixModal(mixId);
      }
    });
  }

  // Chef's recipe dish selector (delegated listener to guarantee click switching across all devices)
  if (elements.cookContainer) {
    elements.cookContainer.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.dish-tab-btn');
      if (tabBtn) {
        const idx = parseInt(tabBtn.getAttribute('data-dish-index'), 10);
        if (!isNaN(idx)) {
          state.selectedDishIndex = idx;
          renderCookToday();
        }
      }
    });
  }
}

// ==========================================================================
// LANGUAGE SWITCHER
// ==========================================================================
function setLanguage(lang) {
  if (!translations[lang]) return;
  state.currentLang = lang;
  localStorage.setItem('mandi_lang', lang);
  updateLanguageUI(lang);
  renderAll();
}

function updateLanguageUI(lang) {
  const dict = translations[lang] || translations.en;

  // Active button
  elements.langBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Translate static data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Translate placeholder
  if (elements.searchInput && dict.searchPlaceholder) {
    elements.searchInput.placeholder = dict.searchPlaceholder;
  }

  // Update current date display
  const dateEl = document.getElementById('currentDateDisplay');
  if (dateEl) {
    const locale = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    const dateFormatted = new Date().toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    dateEl.textContent = dateFormatted;
  }
}

function getLocalizedName(item) {
  if (state.currentLang === 'hi') return item.name_hi || item.name_en;
  if (state.currentLang === 'mr') return item.name_mr || item.name_en;
  return item.name_en;
}

function getSecondaryName(item) {
  if (state.currentLang === 'en') return `${item.name_mr || ''} • ${item.name_hi || ''}`;
  if (state.currentLang === 'hi') return `${item.name_en} (${item.name_mr || ''})`;
  return `${item.name_en} (${item.name_hi || ''})`;
}

// ==========================================================================
// DATA FETCHING
// ==========================================================================
async function loadAllData() {
  await Promise.all([
    fetchRates(),
    fetchCookToday(),
    fetchQuickMeals(),
    fetchSeason()
  ]);
  renderAll();
}

async function fetchQuickMeals() {
  try {
    const res = await fetch('/api/quick-meals');
    const data = await res.json();
    if (data.success && Array.isArray(data.mixes)) {
      state.quickMeals = data.mixes;
    }
  } catch (err) {
    console.warn('Quick meals API unreachable, using built-in prototype mixes:', err);
  }
}

async function fetchRates() {
  try {
    const res = await fetch('/api/rates');
    const data = await res.json();
    if (data.success && Array.isArray(data.rates)) {
      state.rates = data.rates;
      updateCategoryCounts();
    }
  } catch (err) {
    console.error('Error fetching rates:', err);
    showToast('Failed to load live rates from APMC Vashi');
  }
}

async function fetchCookToday() {
  try {
    const res = await fetch('/api/cook-today');
    const data = await res.json();
    if (data.success) {
      state.cookToday = data;
    }
  } catch (err) {
    console.error('Error fetching cook today:', err);
  }
}

async function fetchSeason() {
  try {
    const res = await fetch('/api/season');
    const data = await res.json();
    if (data.success) {
      state.seasonalItems = data.items || [];
      state.currentSeasonData = data;
    }
  } catch (err) {
    console.error('Error fetching season items:', err);
  }
}

function updateCategoryCounts() {
  const counts = {
    all: state.rates.length,
    vegetable: state.rates.filter(r => r.category === 'vegetable').length,
    fruit: state.rates.filter(r => r.category === 'fruit').length,
    spice: state.rates.filter(r => r.category === 'spice').length
  };

  document.querySelectorAll('.category-chip').forEach(chip => {
    const cat = chip.getAttribute('data-category');
    const countEl = chip.querySelector('.chip-count');
    if (countEl && counts[cat] !== undefined) {
      countEl.textContent = counts[cat];
    }
  });
}

// ==========================================================================
// FILTER & SORT
// ==========================================================================
function applyFilters() {
  let list = [...state.rates];

  // Category filter
  if (state.selectedCategory !== 'all') {
    list = list.filter(item => item.category === state.selectedCategory);
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(item => {
      const matchEn = item.name_en && item.name_en.toLowerCase().includes(q);
      const matchHi = item.name_hi && item.name_hi.toLowerCase().includes(q);
      const matchMr = item.name_mr && item.name_mr.toLowerCase().includes(q);
      const matchCat = item.category && item.category.toLowerCase().includes(q);
      return matchEn || matchHi || matchMr || matchCat;
    });
  }

  // Sorting
  if (state.sortOption === 'price_asc') {
    list.sort((a, b) => a.price_today - b.price_today);
  } else if (state.sortOption === 'price_desc') {
    list.sort((a, b) => b.price_today - a.price_today);
  } else if (state.sortOption === 'spike') {
    list.sort((a, b) => {
      const changeA = ((a.price_today - a.price_yesterday) / (a.price_yesterday || 1));
      const changeB = ((b.price_today - b.price_yesterday) / (b.price_yesterday || 1));
      return changeB - changeA;
    });
  } else {
    // Default: category first, then alphabetical
    list.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name_en.localeCompare(b.name_en);
    });
  }

  state.filteredRates = list;
  renderRatesGrid();
  renderCounter();
}

function renderCounter() {
  const dict = translations[state.currentLang] || translations.en;
  elements.itemsCounter.textContent = dict.filterCount.replace('{count}', state.filteredRates.length);
}

// ==========================================================================
// RENDERING
// ==========================================================================
function renderAll() {
  renderSeasonStrip();
  renderCookToday();
  renderQuickMeals();
  applyFilters();
}

// 1. What's In Season
function renderSeasonStrip() {
  const dict = translations[state.currentLang] || translations.en;
  if (state.currentSeasonData) {
    const monthName = state.currentLang === 'mr' ? state.currentSeasonData.month_name_mr :
                      state.currentLang === 'hi' ? state.currentSeasonData.month_name_hi :
                      state.currentSeasonData.month_name_en;
    elements.seasonMonthName.textContent = monthName;
  }

  if (!state.seasonalItems || state.seasonalItems.length === 0) {
    elements.seasonScroll.innerHTML = `<div style="padding: 10px; font-size: 0.85rem; color: #888;">No seasonal items recorded for this month.</div>`;
    return;
  }

  elements.seasonScroll.innerHTML = state.seasonalItems.map(item => {
    const primaryName = getLocalizedName(item);
    const photoHtml = item.image_url ? `
      <div class="season-photo-wrap">
        <img src="${item.image_url}" alt="${escapeHtml(primaryName)}" class="season-real-photo" loading="lazy" onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='block';">
      </div>
      <div class="card-emoji" style="display: none;">${item.emoji}</div>
    ` : `<div class="card-emoji">${item.emoji}</div>`;

    return `
      <div class="season-card" onclick="filterByItemName('${escapeHtml(item.name_en)}')">
        <span class="season-ribbon">${dict.seasonBadge}</span>
        ${photoHtml}
        <div class="card-name">${escapeHtml(primaryName)}</div>
        <div class="card-subname">${escapeHtml(item.category)}</div>
        <div class="card-price">₹${item.price_today}${dict.unitKg}</div>
      </div>
    `;
  }).join('');
}

// Helper to click seasonal card and search for it
window.filterByItemName = function(nameEn) {
  elements.searchInput.value = nameEn;
  state.searchQuery = nameEn.toLowerCase();
  elements.clearSearchBtn.classList.add('visible');
  applyFilters();
  document.getElementById('ratesSection').scrollIntoView({ behavior: 'smooth' });
};

// 2. Cook This Today - Multi-Dish Smartest Pick
function renderCookToday() {
  const dict = translations[state.currentLang] || translations.en;
  if (!state.cookToday || !state.cookToday.vegetables || state.cookToday.vegetables.length === 0) {
    elements.cookContainer.innerHTML = '';
    return;
  }

  const { vegetables } = state.cookToday;
  
  // Safe client-side fallback ensuring 4 complete dishes always exist
  let dishes = state.cookToday.dishes;
  if (!Array.isArray(dishes) || dishes.length < 4) {
    const v1 = vegetables[0];
    const v2 = vegetables[1] || v1;
    const v3 = vegetables[2] || v2;
    const baseProduceCost = Math.round((v1.price_today * 0.45) + (v2.price_today * 0.35) + (v3.price_today * 0.20));
    
    dishes = [
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
        tadka_cost: 20,
        staples_cost: 28,
        family_cost: baseProduceCost + 20 + 28,
        cost_per_person: Math.round((baseProduceCost + 48) / 4),
        servings: '4 persons',
        savings_vs_hotel: 290
      },
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
        tadka_cost: 18,
        staples_cost: 26,
        family_cost: Math.round(baseProduceCost * 0.95) + 18 + 26,
        cost_per_person: Math.round((Math.round(baseProduceCost * 0.95) + 44) / 4),
        servings: '4 persons',
        savings_vs_hotel: 270
      },
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
        tadka_cost: 26,
        staples_cost: 32,
        family_cost: Math.round(baseProduceCost * 0.8) + 26 + 32,
        cost_per_person: Math.round((Math.round(baseProduceCost * 0.8) + 58) / 4),
        servings: '4 persons',
        savings_vs_hotel: 310
      },
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
        tadka_cost: 22,
        staples_cost: 16,
        family_cost: Math.round(baseProduceCost * 0.85) + 22 + 16,
        cost_per_person: Math.round((Math.round(baseProduceCost * 0.85) + 38) / 4),
        servings: '4 persons',
        savings_vs_hotel: 220
      }
    ];
  }

  const activeIndex = Math.max(0, Math.min(Number(state.selectedDishIndex) || 0, dishes.length - 1));
  const dish = dishes[activeIndex] || dishes[0];

  // Recipe steps based on current language
  let recipeSteps = dish.recipe_mr || dish.recipe_en || [];
  let dishTitle = dish.title_mr || dish.title_en || '';
  if (state.currentLang === 'hi') {
    recipeSteps = dish.recipe_hi || dish.recipe_en || dish.recipe_mr || [];
    dishTitle = dish.title_hi || dish.title_en || dish.title_mr || '';
  } else if (state.currentLang === 'en') {
    recipeSteps = dish.recipe_en || dish.recipe_hi || dish.recipe_mr || [];
    dishTitle = dish.title_en || dish.title_hi || dish.title_mr || '';
  }

  // Dish tabs row
  const tabsHtml = dishes.map((d, idx) => {
    const label = state.currentLang === 'mr' ? (d.type_label_mr || d.type_label_en) :
                  state.currentLang === 'hi' ? (d.type_label_hi || d.type_label_en) :
                  d.type_label_en;
    return `
      <button type="button" class="dish-tab-btn ${idx === activeIndex ? 'active' : ''}" data-dish-index="${idx}" onclick="selectDishIndex(${idx})">
        ${label}
      </button>
    `;
  }).join('');

  const veggiesHtml = vegetables.map(v => {
    const photoHtml = v.image_url ? `
      <div class="veg-photo-wrap">
        <img src="${v.image_url}" alt="${escapeHtml(getLocalizedName(v))}" class="veg-real-photo" loading="lazy" onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='block';">
      </div>
      <span class="v-emoji" style="display: none;">${v.emoji}</span>
    ` : `<span class="v-emoji">${v.emoji}</span>`;

    return `
      <div class="veg-hero-pill">
        ${photoHtml}
        <div class="v-name">${escapeHtml(getLocalizedName(v))}</div>
        <div class="v-price">₹${v.price_today}${dict.unitKg}</div>
      </div>
    `;
  }).join('');

  const stepsHtml = (Array.isArray(recipeSteps) ? recipeSteps : []).map((step, idx) => `
    <div class="recipe-step-item">
      <span class="step-num">${idx + 1}</span>
      <span>${escapeHtml(String(step).replace(/^\d+\.\s*/, ''))}</span>
    </div>
  `).join('');

  const familyCost = dish.family_cost || 72;
  const perPersonCost = dish.cost_per_person || Math.round(familyCost / 4);
  const produceCost = dish.produce_cost || 24;
  const tadkaCost = dish.tadka_cost || 20;
  const staplesCost = dish.staples_cost || 28;
  const savings = dish.savings_vs_hotel || 280;

  const perPersonText = (dict.perPersonCost || '₹{price} / person').replace('{price}', perPersonCost);
  const vegText = (dict.breakdownVeggies || 'Fresh Veggies: ₹{price}').replace('{price}', produceCost);
  const tadkaText = (dict.breakdownTadka || 'Oil & Spices: ₹{price}').replace('{price}', tadkaCost);
  const staplesText = (dict.breakdownStaples || 'Roti / Rice: ₹{price}').replace('{price}', staplesCost);

  elements.cookContainer.innerHTML = `
    <div class="cook-card">
      <div class="cook-header">
        <div class="cook-title-wrap">
          <span class="cook-tag-pill"> ${dict.cookTodayBadge}</span>
          <h3>${escapeHtml(dishTitle)}</h3>
          <p>${dict.cookTodaySub}</p>
        </div>
      </div>

      <!-- Multiple Dishes Selector Tabs -->
      <div class="dish-tabs-row" role="tablist">
        ${tabsHtml}
      </div>

      <div class="dish-meta-row">
        <span class="dish-meta-chip">⏱️ ${dish.time || '20 mins'}</span>
        <span class="dish-meta-chip">⚡ ${dish.difficulty || 'Easy'}</span>
        <span class="dish-meta-chip">👨‍👩‍👧‍👦 ${dish.servings || '4 persons'}</span>
      </div>

      <div class="cheapest-veggies-showcase">
        <div class="veggies-label">
          <span>🥕</span>
          <span>Today's 3 Lowest APMC Vegetables Used in These Dishes</span>
        </div>
        <div class="veggies-grid">
          ${veggiesHtml}
        </div>
      </div>

      <div class="cook-body">
        <div class="recipe-steps">
          ${stepsHtml}
        </div>

        <div class="cook-cost-card">
          <div class="cost-label">${dict.approxCostLabel}</div>
          <div class="cost-amount">₹${familyCost} <span class="cost-per-head">(${perPersonText})</span></div>
          
          <div class="cost-breakdown-pills">
            <span class="breakdown-pill">🥬 ${vegText}</span>
            <span class="breakdown-pill">🧂 ${tadkaText}</span>
            <span class="breakdown-pill">🌾 ${staplesText}</span>
          </div>

          <div class="cost-subtitle">Wholesome Balanced Meal for 4 Persons</div>
          <div class="savings-chip">
            <span>✨</span>
            <span>${dict.savingsLabel}: ~₹${savings}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.selectDishIndex = function(index) {
  state.selectedDishIndex = Number(index) || 0;
  renderCookToday();
};

// ==========================================================================
// 3. QUICK MEALS – HOMEMADE INSTANT MIXES (DIY Meal-Kit Prototypes)
// ==========================================================================
function renderQuickMeals() {
  if (!elements.quickMealsContainer) return;
  const dict = translations[state.currentLang] || translations.en;

  const mixes = (state.quickMeals && state.quickMeals.length > 0) ? state.quickMeals : [
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
        { name: 'Fried Green Chilli', amount: '2g', rate_basis: 'APMC Live ₹48/kg', cost: '₹0.50', type: 'APMC Live Rate' },
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
        { name: 'Fried Green Chilli', amount: '2g', rate_basis: 'APMC Live ₹48/kg', cost: '₹0.50', type: 'APMC Live Rate' },
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

  state.quickMeals = mixes;

  elements.quickMealsContainer.innerHTML = mixes.map(mix => {
    const title = state.currentLang === 'hi' ? mix.name_hi : state.currentLang === 'mr' ? mix.name_mr : mix.name_en;
    const prepTime = state.currentLang === 'hi' ? mix.prep_time_hi : state.currentLang === 'mr' ? mix.prep_time_mr : mix.prep_time;
    const servingSize = state.currentLang === 'hi' ? mix.serving_size_hi : state.currentLang === 'mr' ? mix.serving_size_mr : mix.serving_size_en;
    const ingredients = state.currentLang === 'hi' ? mix.ingredients_list_hi : state.currentLang === 'mr' ? mix.ingredients_list_mr : mix.ingredients_list_en;
    const ingredientsArray = ingredients.split(',').map(s => s.trim());

    return `
      <div class="quick-mix-card" data-mix-id="${mix.id}">
        <div class="quick-mix-img-wrap">
          <img src="${mix.image_url}" alt="${escapeHtml(title)}" class="quick-mix-img" loading="lazy">
          <div class="quick-mix-badges-overlay">
            <span class="mix-badge time">⏱️ ${prepTime}</span>
            <span class="mix-badge prototype">🧪 Nirmaan Lab</span>
          </div>
        </div>

        <div class="quick-mix-content">
          <div class="quick-mix-header">
            <div>
              <span class="mix-author-chip">👩‍🔬 Sakshi Sutar • Nirmaan Lab</span>
              <h3 class="quick-mix-title">${escapeHtml(title)}</h3>
            </div>
            <span class="quick-mix-serving">🥣 ${servingSize}</span>
          </div>

          <div class="quick-mix-ingredients-block">
            <div class="mix-ing-label"><span>🌱</span> <span>${dict.ingredientsListLabel || 'Key Ingredients'}:</span></div>
            <div class="mix-ing-chips">
              ${ingredientsArray.map(ing => `<span class="mix-chip">${escapeHtml(ing)}</span>`).join('')}
            </div>
          </div>

          <!-- Product Packaging & Jar Specs (Estimated ingredient cost per serving removed) -->
          <div class="quick-mix-specs-card">
            <div class="specs-row-main">
              <div class="specs-mrp-wrap">
                <span class="specs-mrp-label">Prototype MRP:</span>
                <span class="specs-mrp-val">₹${(mix.mrp_estimate || (mix.id === 'upma-mix' ? 95 : 99)).toFixed(2)}</span>
                <span class="specs-mrp-sub">(250g Jar)</span>
              </div>
              <span class="cost-tag-actual">Glass Jar: ₹70</span>
            </div>

            <div class="cost-pkg-note">
              <span>🏺</span>
              <span>250g Food-Grade Reusable Glass Jar (~4 Servings)</span>
            </div>

            <!-- Comparison Section Temporarily Marked Pending Verification -->
            <div class="mix-comparison-pending-pill">
              <span>🔒</span>
              <span>${dict.commercialCompPending || 'Commercial store comparison pending verification'}</span>
            </div>
          </div>

          <button type="button" class="btn-mix-details" data-mix="${mix.id}">
            <span>📖</span>
            <span>${dict.viewRecipeBtn || 'View Recipe & Cost Breakdown'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.openQuickMixModal = function(mixId) {
  const dict = translations[state.currentLang] || translations.en;
  const mix = (state.quickMeals || []).find(m => m.id === mixId);
  if (!mix || !elements.quickMixModal) return;

  const title = state.currentLang === 'hi' ? mix.name_hi : state.currentLang === 'mr' ? mix.name_mr : mix.name_en;
  const prepTime = state.currentLang === 'hi' ? mix.prep_time_hi : state.currentLang === 'mr' ? mix.prep_time_mr : mix.prep_time;
  const servingSize = state.currentLang === 'hi' ? mix.serving_size_hi : state.currentLang === 'mr' ? mix.serving_size_mr : mix.serving_size_en;
  const steps = state.currentLang === 'hi' ? mix.steps_hi : state.currentLang === 'mr' ? mix.steps_mr : mix.steps_en;
  const nutri = mix.nutrition_facts || { calories: '385 kcal', fat: '8.5 g', sodium: '420 mg', carbs: '68 g', protein: '9.2 g' };

  if (elements.quickMixModalName) {
    elements.quickMixModalName.textContent = `${title} • Nirmaan Lab`;
  }

  if (elements.quickMixModalBody) {
    elements.quickMixModalBody.innerHTML = `
      <!-- Innovator & Lab Credit Banner -->
      <div class="modal-lab-banner">
        <div class="lab-banner-badge">
          <span>🏛️</span>
          <span>NIRMAAN LAB INNOVATION PROTOTYPE</span>
        </div>
        <div class="lab-banner-author">
          Formulated & Packaged by: <strong>Sakshi Sutar</strong> (Student Innovator)
        </div>
      </div>

      <!-- Hero Header -->
      <div class="mix-modal-hero">
        <img src="${mix.image_url}" alt="${escapeHtml(title)}" class="mix-modal-photo" title="Click to view packaging label">
        <div class="mix-modal-hero-details">
          <h4>${escapeHtml(title)}</h4>
          <p style="font-size: 0.82rem; color: #555; margin-bottom: 8px;">
            Tested homemade ready-to-cook dry breakfast premix kit. Just add boiling water for a wholesome, fresh meal in 5-6 minutes.
          </p>
          <div class="modal-spec-chips">
            <span class="spec-chip">⏱️ ${dict.prepTimeLabel || 'Prep Time'}: <strong>${prepTime}</strong></span>
            <span class="spec-chip">🥣 ${dict.servingSizeLabel || 'Serving'}: <strong>${servingSize}</strong></span>
            <span class="spec-chip">📦 Shelf Life: <strong>60 Days (Glass Jar)</strong></span>
            <span class="spec-chip">🏷️ Prototype MRP: <strong>₹${mix.mrp_estimate ? mix.mrp_estimate.toFixed(2) : '99.00'}</strong></span>
          </div>
        </div>
      </div>

      <!-- 1. Cooking Instructions (Realistic Tested Steps) -->
      <div class="modal-section-card">
        <h5 class="modal-sec-title"><span>🍳</span> <span>${dict.instructionsLabel || 'Step-by-Step Cooking Instructions (Tested Homemade Recipe)'}</span></h5>
        <div class="mix-steps-list">
          ${steps.map((st, i) => `
            <div class="mix-step-item">
              <span class="step-num">${i + 1}</span>
              <p class="step-desc">${escapeHtml(st.replace(/^[0-9०-९१-४\.]+\s*/, ''))}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Cost Breakdown: Ingredient Names, Quantities & Available Market Rates -->
      <div class="modal-section-card">
        <h5 class="modal-sec-title"><span>📊</span> <span>${dict.costBreakdownLabel || 'Per-Serving Ingredient Cost Breakdown'}</span></h5>
        <p style="font-size: 0.76rem; color: #666; margin-bottom: 8px;">
          *Single serving ingredient portions with market-price source connections. <strong>Packaging excluded:</strong>
        </p>
        <div class="mix-cost-table-wrap">
          <table class="mix-cost-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Rate Basis / Source</th>
                <th style="text-align: right;">Portion Cost</th>
              </tr>
            </thead>
            <tbody>
              ${mix.ingredient_breakdown.map(item => `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong></td>
                  <td>${escapeHtml(item.amount)}</td>
                  <td><span class="table-basis-tag">${escapeHtml(item.rate_basis)}</span></td>
                  <td style="text-align: right; font-weight: 700; color: #2E7D32;">${escapeHtml(item.cost)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="font-size: 0.76rem; color: #666; font-style: italic; text-align: left; background: #FAF9F6; padding: 10px;">
                  ℹ️ Individual ingredients and baseline market rates provided for reference. Estimated ingredient cost per serving removed per evaluation standards.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 3. Full Jar Unit Economics (250g Jar = 4 Servings, ₹70 Packaging, Exclusions) -->
      <div class="modal-section-card jar-economics-card">
        <h5 class="modal-sec-title"><span>🏺</span> <span>${dict.jarEconomicsTitle || 'Full 250g Jar Prototype Economics (4 Servings)'}</span></h5>
        <div class="mix-cost-table-wrap">
          <table class="mix-cost-table">
            <thead>
              <tr>
                <th>Item / Component</th>
                <th>Quantity / Basis</th>
                <th style="text-align: right;">Cost / Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Ingredients for Full 250g Jar</strong></td>
                <td>4 Servings dry staples baseline (250g net)</td>
                <td style="text-align: right; font-weight: 700; color: #2E7D32;">₹${mix.jar_ingredient_cost ? mix.jar_ingredient_cost.toFixed(2) : (mix.id === 'upma-mix' ? '23.20' : '26.00')}</td>
              </tr>
              <tr style="background: #FFF9C4;">
                <td><strong>Food-Grade Glass Jar Packaging</strong> <span class="cost-tag-actual">Actual Entered Cost</span></td>
                <td>Reusable glass jar + hermetic red lid + waterproof label</td>
                <td style="text-align: right; font-weight: 800; color: #D84315;">₹${(mix.jar_packaging_cost || 70).toFixed(2)}</td>
              </tr>
              <tr style="background: #E8F5E9; border-top: 2px solid var(--color-dark);">
                <td><strong>Total Prototype Cost per Jar</strong></td>
                <td>Sum of known prototype inputs (Ingredients + Packaging)</td>
                <td style="text-align: right; font-weight: 900; font-size: 1.1rem; color: #1B5E20;">₹${(mix.jar_total_prototype_cost || 96).toFixed(2)}</td>
              </tr>
              <tr style="background: #FBE9E7;">
                <td><strong>Prototype Market MRP Benchmark</strong></td>
                <td>Market-aligned retail price for 250g premium reusable jar</td>
                <td style="text-align: right; font-weight: 900; font-size: 1.1rem; color: #B71C1C;">₹${(mix.mrp_estimate || 99).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cost Exclusions Explicit Notice -->
        <div class="exclusions-notice-box">
          <span class="excl-icon">ℹ️</span>
          <div class="excl-text">
            <strong>Exclusions:</strong> ${dict.exclusionsNotice || 'Total prototype cost per jar excludes: commercial factory overheads, manual blending/packaging labor, secondary logistics, GST, and distributor margins (all pending formal verification).'}
          </div>
        </div>
      </div>

      <!-- 4. Nutrition Facts Box (Filled for 250g Jar / 100g) -->
      <div class="modal-section-card">
        <h5 class="modal-sec-title"><span>🥗</span> <span>Nutrition Facts (Per 100g Dry Mix / 250g Net)</span></h5>
        <div class="nutri-grid-display">
          <div class="nutri-pill">
            <span class="nutri-val">${nutri.calories}</span>
            <span class="nutri-lbl">Calories</span>
          </div>
          <div class="nutri-pill">
            <span class="nutri-val">${nutri.carbs}</span>
            <span class="nutri-lbl">Carbs</span>
          </div>
          <div class="nutri-pill">
            <span class="nutri-val">${nutri.protein}</span>
            <span class="nutri-lbl">Protein</span>
          </div>
          <div class="nutri-pill">
            <span class="nutri-val">${nutri.fat}</span>
            <span class="nutri-lbl">Fat</span>
          </div>
          <div class="nutri-pill">
            <span class="nutri-val">${nutri.sodium}</span>
            <span class="nutri-lbl">Sodium</span>
          </div>
        </div>
      </div>

      <!-- 5. Commercial Cup Comparison (Hidden / Marked "Pending Verification") -->
      <div class="modal-section-card comparison-pending-box">
        <h5 class="modal-sec-title" style="color: #6D4C41;"><span>🔒</span> <span>Commercial Store Comparison — Pending Verification</span></h5>
        <p style="font-size: 0.8rem; color: #6D4C41; margin: 0; line-height: 1.45;">
          Direct percentage savings claims vs commercial instant cups (₹45-₹50) are temporarily withheld. 
          Verification is in progress for equivalent dried portion weights, shelf-life testing, and retail supermarket audits.
        </p>
      </div>

      <!-- 6. Official Packaging Label Preview with QR Code -->
      <div class="modal-section-card">
        <h5 class="modal-sec-title"><span>🏷️</span> <span>Official Packaging Label with QR Code & Traceability</span></h5>
        <p style="font-size: 0.78rem; color: #555; margin-bottom: 10px;">
          Created for Nirmaan Lab prototype evaluation. Contains QR code linking to APMC mandi rates and live product traceability.
        </p>
        <div class="label-preview-container">
          <a href="${mix.label_url || mix.image_url}" target="_blank" rel="noopener noreferrer" title="Click to view full high-resolution label">
            <img src="${mix.label_url || mix.image_url}" alt="${escapeHtml(title)} Packaging Label" class="label-preview-img">
          </a>
          <div class="label-preview-caption">
            <span>📷 High-Resolution 250g Jar Packaging Label • Click image to open full size</span>
          </div>
        </div>
      </div>

      <!-- 7. Strict Prototype Disclaimer -->
      <div class="mix-modal-disclaimer">
        <div class="disc-title">⚠️ Provisional Prototype Evaluation Notice</div>
        <p>
          These figures are academic meal-kit prototypes formulated by Sakshi Sutar at Nirmaan Lab. 
          Cost figures distinguish measured packaging inputs (₹70 jar), APMC wholesale baseline market rates, and unverified domestic fuel estimates. 
          Not commercially certified or distributed.
        </p>
      </div>
    `;
  }

  elements.quickMixModal.classList.add('open');
};

window.closeQuickMixModal = function() {
  if (elements.quickMixModal) {
    elements.quickMixModal.classList.remove('open');
  }
};

// 3. Today's Rates Grid
function renderRatesGrid() {
  const dict = translations[state.currentLang] || translations.en;

  if (state.filteredRates.length === 0) {
    elements.ratesGrid.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-emoji">🔍</div>
        <div class="empty-state-text">${dict.emptyState}</div>
        <button class="action-pill-btn" onclick="clearFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  elements.ratesGrid.innerHTML = state.filteredRates.map(item => {
    const primaryName = getLocalizedName(item);
    const secondaryName = getSecondaryName(item);

    // Calculate trend vs yesterday
    const diff = item.price_today - item.price_yesterday;
    let pctChange = 0;
    if (item.price_yesterday > 0) {
      pctChange = Math.round((diff / item.price_yesterday) * 100);
    }

    let trendClass = 'trend-flat';
    let trendArrow = '▬';
    let trendText = '0%';

    // Prompt specifies: "and a green up / red down arrow with % change vs yesterday"
    if (diff > 0) {
      trendClass = 'trend-up';
      trendArrow = '▲';
      trendText = `+${pctChange}%`;
    } else if (diff < 0) {
      trendClass = 'trend-down';
      trendArrow = '▼';
      trendText = `${pctChange}%`;
    }

    // Badges
    const isCheapestWeek = item.price_today <= item.price_week_low;
    const isPriceSpike = pctChange > 15;

    let badgesHtml = '';
    if (isCheapestWeek) {
      badgesHtml += `<span class="badge badge-cheapest">⭐ ${dict.cheapestWeekBadge}</span>`;
    }
    if (isPriceSpike) {
      badgesHtml += `<span class="badge badge-spike">🔥 ${dict.priceSpikeBadge}</span>`;
    }

    return `
      <div class="rate-card" id="rate-card-${item._id}">
        <div>
          <div class="card-badges-row">
            ${badgesHtml}
          </div>

          <div class="card-item-header">
            <div class="item-photo-wrap">
              <img src="${item.image_url || '/images/' + item.name_en.toLowerCase().replace(/\s+/g, '_') + '.jpg'}" 
                   alt="${escapeHtml(primaryName)}" 
                   class="item-real-photo" 
                   loading="lazy" 
                   onerror="this.style.display='none';">
              <span class="item-mini-emoji" title="${escapeHtml(item.category)}">${item.emoji}</span>
            </div>
            <div class="item-names-wrap">
              <div class="item-primary-name" title="${escapeHtml(primaryName)}">${escapeHtml(primaryName)}</div>
              <div class="item-secondary-name">${escapeHtml(secondaryName)}</div>
              <span class="category-tag">${escapeHtml(item.category)}</span>
            </div>
          </div>

          <div class="card-price-row">
            <div class="price-main-wrap">
              <span class="currency-sym">₹</span>
              <span class="price-val">${item.price_today}</span>
              <span class="unit-label">${dict.unitKg}</span>
            </div>

            <div class="price-trend-wrap">
              <div class="trend-indicator ${trendClass}">
                <span>${trendArrow}</span>
                <span>${trendText}</span>
              </div>
              <span class="trend-subtext">${dict.changeVsYesterday}</span>
            </div>
          </div>
        </div>

        <div class="card-footer-info">
          <span>${dict.yesterdayRate}: <b>₹${item.price_yesterday}</b></span>
          <span>${dict.weekLow}: <b>₹${item.price_week_low}</b></span>
          <button class="quick-edit-btn" title="Quick Update Price" onclick="openAdminForEdit('${item._id}')">
            ✏️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.clearFilters = function() {
  elements.searchInput.value = '';
  state.searchQuery = '';
  state.selectedCategory = 'all';
  elements.categoryChips.forEach(c => c.classList.remove('active'));
  document.querySelector('.category-chip[data-category="all"]').classList.add('active');
  elements.sortSelect.value = 'default';
  state.sortOption = 'default';
  applyFilters();
};

// ==========================================================================
// SHARE POSTER CANVAS GENERATOR (WhatsApp Friendly HTML5 Canvas)
// ==========================================================================
const posterImageCache = {};

function openPosterModal() {
  elements.posterModal.classList.add('open');
  drawPosterCanvas();

  // Preload top 5 images and redraw once loaded
  const top5 = state.rates.slice(0, 5);
  top5.forEach(item => {
    const src = item.image_url || `/images/${item.name_en.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    if (!posterImageCache[src]) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        posterImageCache[src] = img;
        drawPosterCanvas();
      };
    }
  });
}

function drawPosterCanvas() {
  const canvas = elements.posterCanvas;
  const ctx = canvas.getContext('2d');
  const dict = translations[state.currentLang] || translations.en;

  // Set high resolution canvas dimensions
  canvas.width = 900;
  canvas.height = 1200;

  // 1. Background Cream
  ctx.fillStyle = '#FFF8E1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Poster Outer Double Border (Crate Yellow & Dark Charcoal)
  ctx.strokeStyle = '#2A2118';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.strokeStyle = '#F4B400';
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // 3. Header Marquee Strip
  ctx.fillStyle = '#E53935';
  ctx.fillRect(32, 32, canvas.width - 64, 150);

  // Decorative border beneath header
  ctx.fillStyle = '#F4B400';
  ctx.fillRect(32, 178, canvas.width - 64, 10);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px "Baloo 2", sans-serif';
  ctx.fillText('मंडी मूड • MANDI MOOD', canvas.width / 2, 95);

  ctx.font = 'bold 22px "Poppins", sans-serif';
  ctx.fillStyle = '#FFF8E1';
  ctx.fillText('APMC VASHI WHOLESALE MARKET YARD • NAVI MUMBAI', canvas.width / 2, 135);

  // 4. Date & Stamp Bar
  const todayStr = new Date().toLocaleDateString(
    state.currentLang === 'mr' ? 'mr-IN' : state.currentLang === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  ctx.fillStyle = '#2A2118';
  ctx.font = 'bold 24px "Poppins", sans-serif';
  ctx.fillText(`📅 ${todayStr}`, canvas.width / 2, 230);

  ctx.font = '600 18px "Poppins", sans-serif';
  ctx.fillStyle = '#6B5E51';
  ctx.fillText('Official Wholesale Bhaav • Certified Morning Arrivals', canvas.width / 2, 260);

  // 5. Top 5 Spotlight Rates Box
  ctx.fillStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2A2118';
  ctx.beginPath();
  ctx.roundRect(48, 290, canvas.width - 96, 520, 16);
  ctx.fill();
  ctx.stroke();

  // Box Header
  ctx.fillStyle = '#F4B400';
  ctx.beginPath();
  ctx.roundRect(48, 290, canvas.width - 96, 54, [16, 16, 0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2A2118';
  ctx.font = 'bold 26px "Baloo 2", sans-serif';
  ctx.fillText("🌟 TODAY'S TOP 5 WHOLESALE RATES (प्रति किलो)", canvas.width / 2, 327);

  // Select top 5 rates (essential staples or top movers)
  const top5 = state.rates.slice(0, 5);
  let startY = 375;

  top5.forEach((item, index) => {
    const itemY = startY + (index * 84);

    // Row alternating background
    if (index % 2 === 0) {
      ctx.fillStyle = '#FFFDF5';
      ctx.fillRect(52, itemY - 26, canvas.width - 104, 76);
    }

    // Real Photo Thumbnail in Canvas
    const imgSrc = item.image_url || `/images/${item.name_en.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    const cachedImg = posterImageCache[imgSrc];

    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(68, itemY - 22, 54, 54, 10);
      ctx.clip();
      ctx.drawImage(cachedImg, 68, itemY - 22, 54, 54);
      ctx.restore();
      ctx.strokeStyle = '#2A2118';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Emoji
      ctx.font = '38px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.emoji, 70, itemY + 16);
    }

    // Names
    ctx.fillStyle = '#2A2118';
    ctx.font = 'bold 24px "Poppins", sans-serif';
    ctx.textAlign = 'left';
    const primaryName = getLocalizedName(item);
    ctx.fillText(`${index + 1}. ${primaryName}`, 136, itemY + 8);

    ctx.font = '16px "Poppins", sans-serif';
    ctx.fillStyle = '#777777';
    ctx.fillText(`${item.name_en} (${item.emoji})`, 136, itemY + 30);

    // Price
    ctx.textAlign = 'right';
    ctx.font = 'bold 34px "Poppins", sans-serif';
    ctx.fillStyle = '#2E7D32';
    ctx.fillText(`₹${item.price_today}`, canvas.width - 160, itemY + 16);

    ctx.font = 'bold 18px "Poppins", sans-serif';
    ctx.fillStyle = '#555555';
    ctx.fillText('/ kg', canvas.width - 120, itemY + 16);

    // Trend badge
    const diff = item.price_today - item.price_yesterday;
    ctx.font = 'bold 16px "Poppins", sans-serif';
    if (diff > 0) {
      ctx.fillStyle = '#2E7D32';
      ctx.fillText(`▲ +₹${diff}`, canvas.width - 70, itemY + 16);
    } else if (diff < 0) {
      ctx.fillStyle = '#E53935';
      ctx.fillText(`▼ ₹${Math.abs(diff)}`, canvas.width - 70, itemY + 16);
    } else {
      ctx.fillStyle = '#888888';
      ctx.fillText('▬ flat', canvas.width - 70, itemY + 16);
    }

    // Separator line
    if (index < 4) {
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, itemY + 46);
      ctx.lineTo(canvas.width - 70, itemY + 46);
      ctx.stroke();
    }
  });


  // 6. Cook This Today Banner in Poster
  if (state.cookToday && state.cookToday.dish) {
    const dish = state.cookToday.dish;
    ctx.fillStyle = '#E8F5E9';
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(48, 835, canvas.width - 96, 175, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 22px "Baloo 2", sans-serif';
    ctx.fillText('👨‍🍳 ' + dict.cookTodayTitle.toUpperCase(), 74, 875);

    ctx.fillStyle = '#2A2118';
    ctx.font = 'bold 24px "Poppins", sans-serif';
    const dishName = state.currentLang === 'mr' ? dish.title_mr : state.currentLang === 'hi' ? dish.title_hi : dish.title_en;
    ctx.fillText(dishName, 74, 915);

    ctx.fillStyle = '#444444';
    ctx.font = '18px "Poppins", sans-serif';
    ctx.fillText(`Approx Cost: ₹${dish.family_cost} for family of 4 • Save ₹${dish.savings_vs_hotel} vs eating out!`, 74, 955);

    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🥗🍲', canvas.width - 74, 920);
  }

  // 7. Footer Stamp
  ctx.fillStyle = '#2A2118';
  ctx.fillRect(32, 1035, canvas.width - 64, 125);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F4B400';
  ctx.font = 'bold 22px "Baloo 2", sans-serif';
  ctx.fillText('Data source: APMC Vashi Wholesale Market Yard (Daily Bhaav)', canvas.width / 2, 1075);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px "Poppins", sans-serif';
  ctx.fillText('Made with ❤️ in Navi Mumbai • Shared via Mandi Mood', canvas.width / 2, 1115);
}

function downloadPosterImage() {
  const canvas = elements.posterCanvas;
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `mandi-mood-bhaav-vashi-${dateStr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Daily Bhaav Poster downloaded successfully!');
}

async function sharePosterWhatsApp() {
  const canvas = elements.posterCanvas;
  const dict = translations[state.currentLang] || translations.en;
  const topRatesText = state.rates.slice(0, 5).map(r => `${r.emoji} ${getLocalizedName(r)}: ₹${r.price_today}/kg`).join('\n');
  const shareText = `*MANDI MOOD - APMC Vashi Wholesale Bhaav*\n${new Date().toDateString()}\n\n*Top 5 Rates:*\n${topRatesText}\n\nCheck full live rates & daily recipes at: http://localhost:3000`;

  // Try Web Share API with image file if supported
  if (navigator.share && canvas.toBlob) {
    try {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'mandi-mood-bhaav.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Mandi Mood - APMC Vashi Bhaav",
            text: shareText,
            files: [file]
          });
          showToast('Shared successfully!');
          return;
        }
        openWhatsAppTextFallback(shareText);
      });
      return;
    } catch (e) {
      console.log('Web share aborted or failed:', e);
    }
  }

  openWhatsAppTextFallback(shareText);
}

function openWhatsAppTextFallback(text) {
  downloadPosterImage();
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ==========================================================================
// ADMIN MODAL & CRUD HANDLERS
// ==========================================================================
function getAdminApiKey() {
  const inputEl = document.getElementById('adminApiKeyInput');
  const stored = localStorage.getItem('mandi_admin_key');
  if (inputEl && inputEl.value.trim()) {
    const key = inputEl.value.trim();
    localStorage.setItem('mandi_admin_key', key);
    return key;
  }
  return stored || 'apmc-vashi-secret-2026';
}

function openAdminModal(rateId = null) {
  elements.adminModal.classList.add('open');
  const keyInput = document.getElementById('adminApiKeyInput');
  if (keyInput) {
    keyInput.value = localStorage.getItem('mandi_admin_key') || 'apmc-vashi-secret-2026';
    keyInput.oninput = (e) => localStorage.setItem('mandi_admin_key', e.target.value.trim());
  }
  if (rateId) {
    openAdminForEdit(rateId);
  } else {
    setAdminMode('add');
  }
}

window.openAdminForEdit = function(rateId) {
  elements.adminModal.classList.add('open');
  setAdminMode('edit');
  selectItemForEdit(rateId);
};

function setAdminMode(mode) {
  if (mode === 'add') {
    elements.adminTabAdd.classList.add('active');
    elements.adminTabEdit.classList.remove('active');
    elements.adminSelectGroup.style.display = 'none';
    elements.adminForm.reset();
    document.getElementById('formRateId').value = '';
    document.getElementById('adminSubmitBtn').textContent = 'Add Rate to Mandi';
    state.editingRateId = null;
  } else {
    elements.adminTabEdit.classList.add('active');
    elements.adminTabAdd.classList.remove('active');
    elements.adminSelectGroup.style.display = 'block';
    renderAdminSelectList();
    document.getElementById('adminSubmitBtn').textContent = 'Update Rate';
  }
}

function renderAdminSelectList() {
  elements.adminEditList.innerHTML = state.rates.map(item => `
    <div class="admin-item-row ${state.editingRateId === item._id ? 'selected' : ''}" onclick="selectItemForEdit('${item._id}')">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="${item.image_url || '/images/' + item.name_en.toLowerCase().replace(/\s+/g, '_') + '.jpg'}" 
             alt="${escapeHtml(item.name_en)}" 
             style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover; border: 1.5px solid var(--color-dark);"
             onerror="this.style.display='none';">
        <span>${item.emoji}</span>
        <b>${escapeHtml(item.name_en)}</b> (${escapeHtml(item.name_mr || '')})
      </div>
      <div>
        <b>₹${item.price_today}</b>/kg
      </div>
    </div>
  `).join('');
}

window.selectItemForEdit = function(rateId) {
  const item = state.rates.find(r => r._id === rateId);
  if (!item) return;

  state.editingRateId = rateId;
  renderAdminSelectList();

  document.getElementById('formRateId').value = item._id;
  document.getElementById('formNameEn').value = item.name_en;
  document.getElementById('formNameHi').value = item.name_hi;
  document.getElementById('formNameMr').value = item.name_mr;
  document.getElementById('formCategory').value = item.category;
  document.getElementById('formEmoji').value = item.emoji;
  if (document.getElementById('formImageUrl')) {
    document.getElementById('formImageUrl').value = item.image_url || '';
  }
  document.getElementById('formPriceToday').value = item.price_today;
  document.getElementById('formPriceYesterday').value = item.price_yesterday;
  document.getElementById('formPriceWeekLow').value = item.price_week_low;
};

async function handleAdminFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('formRateId').value;
  const imgUrlVal = document.getElementById('formImageUrl') ? document.getElementById('formImageUrl').value.trim() : '';
  const payload = {
    name_en: document.getElementById('formNameEn').value.trim(),
    name_hi: document.getElementById('formNameHi').value.trim(),
    name_mr: document.getElementById('formNameMr').value.trim(),
    category: document.getElementById('formCategory').value,
    emoji: document.getElementById('formEmoji').value.trim() || '🥬',
    image_url: imgUrlVal || `/images/${document.getElementById('formNameEn').value.trim().toLowerCase().replace(/\s+/g, '_')}.jpg`,
    price_today: Number(document.getElementById('formPriceToday').value),
    price_yesterday: Number(document.getElementById('formPriceYesterday').value),
    price_week_low: Number(document.getElementById('formPriceWeekLow').value),
    unit: 'kg'
  };

  const adminKey = getAdminApiKey();

  try {
    let res;
    if (id) {
      // PUT /api/rates/:id
      res = await fetch(`/api/rates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminKey
        },
        body: JSON.stringify(payload)
      });
    } else {
      // POST /api/rates
      res = await fetch('/api/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminKey
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.status === 401) {
      showToast('🔐 Unauthorized: Invalid Admin Security Passkey.');
      return;
    }
    if (res.status === 429) {
      showToast('⏱️ Rate limit exceeded: Too many modifications. Please wait 15 minutes.');
      return;
    }

    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Saved successfully!');
      elements.adminModal.classList.remove('open');
      await loadAllData();
    } else {
      showToast('Error: ' + data.message);
    }
  } catch (err) {
    console.error('Error saving rate:', err);
    showToast('Failed to save rate: ' + err.message);
  }
}

async function handleResetSeed() {
  const dict = translations[state.currentLang] || translations.en;
  if (!confirm(dict.resetSeedConfirm)) return;

  const adminKey = getAdminApiKey();

  try {
    showToast('Restoring official APMC Vashi rates...');
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': adminKey
      }
    });

    if (res.status === 401) {
      showToast('🔐 Unauthorized: Invalid Admin Security Passkey.');
      return;
    }
    if (res.status === 429) {
      showToast('⏱️ Rate limit exceeded: Please wait before resetting again.');
      return;
    }

    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Rates reset successfully!');
      elements.adminModal.classList.remove('open');
      await loadAllData();
    } else {
      showToast('Reset failed: ' + data.message);
    }
  } catch (err) {
    showToast('Reset failed: ' + err.message);
  }
}

// ==========================================================================
// UTILITIES
// ==========================================================================
function showToast(msg) {
  elements.toast.textContent = msg;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
