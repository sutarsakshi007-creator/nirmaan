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
  selectedDishIndex: 0
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
  // Modals
  posterModal: document.getElementById('posterModal'),
  adminModal: document.getElementById('adminModal'),
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

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target === elements.posterModal) elements.posterModal.classList.remove('open');
    if (e.target === elements.adminModal) elements.adminModal.classList.remove('open');
  });
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
    fetchSeason()
  ]);
  renderAll();
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
  const dishes = state.cookToday.dishes && state.cookToday.dishes.length > 0 
    ? state.cookToday.dishes 
    : [state.cookToday.dish];
  
  const activeIndex = Math.min(state.selectedDishIndex || 0, dishes.length - 1);
  const dish = dishes[activeIndex] || dishes[0];

  // Recipe steps based on current language
  let recipeSteps = dish.recipe_mr;
  let dishTitle = dish.title_mr;
  if (state.currentLang === 'hi') {
    recipeSteps = dish.recipe_hi || dish.recipe_en;
    dishTitle = dish.title_hi || dish.title_en;
  } else if (state.currentLang === 'en') {
    recipeSteps = dish.recipe_en;
    dishTitle = dish.title_en;
  }

  // Dish tabs row
  const tabsHtml = dishes.map((d, idx) => {
    const label = state.currentLang === 'mr' ? d.type_label_mr :
                  state.currentLang === 'hi' ? d.type_label_hi :
                  d.type_label_en;
    return `
      <button type="button" class="dish-tab-btn ${idx === activeIndex ? 'active' : ''}" onclick="selectDishIndex(${idx})">
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

  const stepsHtml = recipeSteps.map((step, idx) => `
    <div class="recipe-step-item">
      <span class="step-num">${idx + 1}</span>
      <span>${escapeHtml(step.replace(/^\d+\.\s*/, ''))}</span>
    </div>
  `).join('');

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
          <div class="cost-amount">₹${dish.family_cost}</div>
          <div class="cost-subtitle">4 Servings • Fresh & Healthy</div>
          <div class="savings-chip">
            <span>✨</span>
            <span>${dict.savingsLabel}: ~₹${dish.savings_vs_hotel}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.selectDishIndex = function(index) {
  state.selectedDishIndex = index;
  renderCookToday();
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
  ctx.fillText('Data source: APMC Vashi (sample data for demo)', canvas.width / 2, 1075);

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
    showToast('Resetting to APMC demo rates...');
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
