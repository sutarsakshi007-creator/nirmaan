# 🌿 Mandi Mood (मंडी मूड / मंडी मूड)

> **A friendly, colorful daily wholesale market dashboard inspired by APMC Vashi market (Navi Mumbai). Designed to feel like a vibrant Indian market poster, not a boring data table.**

---

## 🎨 Overview & Design Aesthetic

**Mandi Mood** brings the energy of the bustling **APMC Vashi Market Yard (Sector 19, Turbhe / Vashi, Navi Mumbai)** to the web. Instead of stiff enterprise data tables, it celebrates the sights, sounds, and vibrant typography of Indian wholesale sabzi mandis:

- **Poster Color Palette**:
  - 🟡 **Crate Yellow**: `#F4B400`
  - 🔴 **Tomato Red**: `#E53935`
  - 🟢 **Leaf Green**: `#2E7D32`
  - 🥛 **Cream Background**: `#FFF8E1`
- **Authentic Typography**: Google Fonts **Rozha One** (traditional Indian poster headlines), **Baloo 2** (friendly Hindi/Marathi/English display), and **Poppins** (clean, readable body text).
- **Tactile Poster Elements**: Rounded cards, bold borders, soft drop shadows, playful hover/tap micro-animations, market marquee ticker, and stamp badges.
- **Mobile-First & Touch Ready**: Large tap targets (44px+), responsive grids, smooth horizontal swipe gestures, and fast zero-bundle performance.

---

## 🚀 Strict Tech Stack

- **Frontend**: Plain HTML5, CSS3, and vanilla JavaScript (zero frameworks: **no React, no Tailwind**).
- **Backend**: Node.js + Express (lightweight REST API connecting to MongoDB).
- **Database**: MongoDB using Mongoose ODM (configured via `.env` with `MONGO_URI`).

---

## 📂 Project Structure

```text
mandi-mood/
├── server.js               # Express server & MongoDB connection
├── .env                    # Environment variables (PORT, MONGO_URI)
├── .env.example            # Sample configuration template
├── package.json            # Project dependencies and scripts
├── models/
│   └── Rate.js             # Mongoose schema for Mandi rates
├── routes/
│   └── rates.js            # REST API endpoints (/api/rates, cook-today, season)
├── seed.js                 # Database seeder (20 APMC Vashi items)
├── sampleRates.js          # Canonical 20 sample items dataset
├── public/
│   ├── images/             # Real photography of all 20 produce items
│   ├── index.html          # Mobile-first semantic HTML5 interface
│   ├── style.css           # Custom CSS with Indian market poster theme
│   ├── app.js              # Vanilla JS controller & Canvas poster generator
│   └── translations.js     # Full tri-lingual dictionary (English, Hindi, Marathi)
└── README.md               # Setup and usage guide
```

---

## ✨ Features

### 1. 📊 Today's Wholesale Bhaav
- Real-time wholesale rate cards showing emoji, item name in selected language, and price per kg (`₹/kg`).
- **Trend Indicators**: Green up arrow (`▲ +%`) or red down arrow (`▼ -%`) showing percentage change vs yesterday.
- **Smart Badges**:
  - ⭐ **Cheapest this week**: Highlighted when `price_today <= price_week_low`.
  - 🔥 **Price spike**: Striking tomato red alert badge when price jumps more than 15% vs yesterday.
- Live search bar (searches English, Hindi, and Marathi names simultaneously).
- Category filter chips: **All Items**, **Vegetables**, **Fruits**, and **Spices & Herbs** with live count counters.
- Sort options: Standard, Price Low-to-High, Price High-to-Low, and Price Spikes First.

### 2. 👨‍🍳 Cook This Today!
- Automatically queries `/api/cook-today` for the **3 cheapest vegetables** of the day.
- Recommends an authentic home-style Indian dish tailored to the cheapest produce.
- Provides a clean, numbered **3-line step-by-step recipe**.
- Calculates realistic **approximate grocery cost for a family of 4** (e.g., ~₹31–₹45) and highlights huge savings vs restaurant dining!

### 3. 🌐 Tri-Lingual Language Toggle
- Instant switching between **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)** with one click.
- Translates every label, heading, badge, recipe step, search placeholder, and footer text using `translations.js`.

### 4. 🌿 What's in Season (Horizontal Scroll Strip)
- Displays current month's seasonal harvest directly from APMC arrivals.
- Touch-friendly horizontal swipe container on mobile with snappy scroll-snap.

### 5. 📢 "Share Today's Bhaav Poster" (WhatsApp Ready)
- Draws a high-resolution, beautifully formatted Indian market poster onto an HTML5 `<canvas>`.
- Displays top 5 wholesale prices, date stamp, today's recipe highlight, and APMC Vashi certified badge.
- **Download Poster (PNG)** or **Share to WhatsApp** with 1 click using the Web Share API.

### 6. ⚙️ Admin Rate Manager
- Built-in friendly admin modal to:
  - Add a brand new item with English/Hindi/Marathi names, category, emoji, and prices.
  - Update today's and yesterday's rates for any existing item.
  - Reset to default 20 APMC demo items.

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster.

### 1. Clone the Repository
```bash
git clone https://github.com/sutarsakshi007-creator/nirmaan.git
cd nirmaan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure `.env`
Create a `.env` file in the project root:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/mandi-mood
```

*(For MongoDB Atlas cloud, set `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mandi-mood?retryWrites=true&w=majority`)*

### 4. Seed 20 APMC Sample Items
```bash
node seed.js
```
*(or `npm run seed`)*

You will see a formatted table in your terminal showing all 20 inserted APMC items with emojis, Marathi/Hindi/English names, categories, and prices.

### 5. Start the Server
```bash
node server.js
```
*(or `npm start`)*

Open your browser at:
👉 **`http://localhost:3000`**

---

## ☁️ How to Host on Render (Step-by-Step Guide)

You can host Mandi Mood on **[Render](https://render.com)** for free in just 3 steps:

### Step 1: Set up a Free MongoDB Database on MongoDB Atlas
1. Sign up for free at **[mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)**.
2. Create a free **M0 Sandbox** cluster (AWS / Mumbai or closest region).
3. Under **Security → Database Access**, create a user (e.g. `mandiadmin`) and password.
4. Under **Security → Network Access**, click **"Add IP Address"** and choose **"Allow Access from Anywhere"** (`0.0.0.0/0`).
5. Click **"Connect" → "Drivers" (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/mandi-mood?retryWrites=true&w=majority
   ```

### Step 2: Deploy on Render.com
1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in with GitHub.
2. Click **"New +" → "Web Service"**.
3. Select your repository: **`sutarsakshi007-creator/nirmaan`**.
4. Configure the service settings:
   - **Name**: `mandi-mood`
   - **Region**: Singapore or Frankfurt (closest to India)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   - `MONGO_URI`: *(Paste your MongoDB Atlas connection string from Step 1)*
   - `NODE_ENV`: `production`
   - `ADMIN_API_KEY`: `apmc-vashi-secret-2026` *(or choose your own passkey)*
   - `ALLOWED_ORIGIN`: `*`
6. Click **"Create Web Service"**.

> [!TIP]
> **Automatic Cold-Start Seeding**: The server automatically detects if the newly connected MongoDB Atlas database is empty and automatically inserts all 20 APMC Vashi items with their images, categories, and prices on first boot!

### Step 3: Access Your Live Dashboard
Once Render finishes building (usually 1-2 minutes), it will provide your live URL:
👉 **`https://mandi-mood.onrender.com`**

---

## 🗄️ Database Schema (`models/Rate.js`)

| Field | Type | Description |
|---|---|---|
| `name_en` | String | English name (e.g. "Onion") |
| `name_hi` | String | Hindi name (e.g. "प्याज (Pyaaz)") |
| `name_mr` | String | Marathi name (e.g. "कांदा (Kanda)") |
| `category` | String | Enum: `'vegetable'`, `'fruit'`, `'spice'` |
| `emoji` | String | Visual icon (e.g. "🧅") |
| `image_url` | String | Path/URL to real photography image (e.g. `"/images/onion.jpg"`) |
| `price_today` | Number | Today's wholesale price in ₹ per unit |
| `price_yesterday` | Number | Yesterday's price in ₹ per unit |
| `price_week_low` | Number | 7-day low price in ₹ |
| `unit` | String | Default: `"kg"` |
| `date` | Date | Timestamp of rate entry (default: Date.now) |
| `season_months` | [Number] | Array of month numbers (1 to 12) |

---

## 📡 REST API Endpoints

### 1. `GET /api/rates`
Returns all rates. Supports query parameters:
- `?category=vegetable` (or `fruit`, `spice`, `all`)
- `?search=onion` (matches English, Hindi, or Marathi names)
- `?sort=price_asc` (or `price_desc`, `spike`)

**Sample Response**:
```json
{
  "success": true,
  "count": 20,
  "rates": [
    {
      "_id": "6ad6ffaab90b0d1d236175d0",
      "name_en": "Onion",
      "name_hi": "प्याज (Pyaaz)",
      "name_mr": "कांदा (Kanda)",
      "category": "vegetable",
      "emoji": "🧅",
      "price_today": 24,
      "price_yesterday": 28,
      "price_week_low": 24,
      "unit": "kg",
      "season_months": [1, 2, 3, 4, 10, 11, 12]
    }
  ]
}
```

### 2. `GET /api/cook-today`
Returns the 3 cheapest vegetables currently in the mandi, along with a tailored recipe, step-by-step instructions in 3 languages, and cost calculation for a family of 4.

### 3. `GET /api/season`
Returns produce in peak season for the current month (`?month=1..12` optional).

### 4. `POST /api/rates`
Create a new rate item.
```json
{
  "name_en": "Methi",
  "name_hi": "मेथी (Methi)",
  "name_mr": "मेथी (Methi)",
  "category": "vegetable",
  "emoji": "🌱",
  "price_today": 20,
  "price_yesterday": 25,
  "price_week_low": 20,
  "unit": "kg",
  "season_months": [10, 11, 12, 1, 2]
}
```

### 5. `PUT /api/rates/:id` *(Protected by Admin Passkey)*
Update prices for an existing item.
```json
{
  "price_today": 22,
  "price_yesterday": 24
}
```

### 6. `DELETE /api/rates/:id` *(Protected by Admin Passkey)*
Delete an item from the market list.

### 7. `POST /api/reset` *(Protected by Admin Passkey)*
Reset database back to the canonical 20 APMC items.

---

## 🛡️ Security Features & Architecture

Mandi Mood is built with multi-layered production-grade web security:

1. **HTTP Security Headers (`helmet`)**:
   - Strict **Content Security Policy (CSP)** restricting origins while allowing verified Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) and canvas blob downloads.
   - `X-Content-Type-Options: nosniff` to prevent MIME-sniffing attacks.
   - `X-Frame-Options: SAMEORIGIN` preventing Clickjacking attacks.
   - Hides Express fingerprint (`X-Powered-By: Express` stripped).
   - `Strict-Transport-Security` (HSTS) ready.

2. **DDoS & Brute Force Rate Limiting (`express-rate-limit`)**:
   - **General API Limiter**: Max 200 requests per 15 minutes per IP address with standard `RateLimit-*` headers.
   - **Strict Mutation Limiter**: Sensitive write operations (`POST`, `PUT`, `DELETE`, `/reset`) are throttled to 30 requests per 15 minutes per IP to prevent spamming and automated price manipulation.

3. **Admin Passkey Authentication (`authMiddleware`)**:
   - Write endpoints (`POST /api/rates`, `PUT /api/rates/:id`, `DELETE /api/rates/:id`, `POST /api/reset`) require authentication.
   - Validates the `x-api-key` header against `ADMIN_API_KEY` in `.env`.
   - The web UI includes an **Admin Security Passkey** field with local persistence in the browser.

4. **Input Validation & Sanitization**:
   - **ReDoS Shield**: Search query regexes are safely escaped to prevent Regular Expression Denial of Service attacks.
   - **MongoDB ObjectId Validation**: Route parameters validate 24-character hexadecimal ObjectIds before querying, preventing Mongoose CastError exceptions.
   - **Type & Range Whitelisting**: Strict whitelists for produce categories (`vegetable`, `fruit`, `spice`), sort options, numeric bounds (prices 0 to 100,000), and image URL schemes (`/images/`, `http://`, `https://`).
   - **Payload Size Capping**: `express.json({ limit: '100kb' })` blocks memory exhaustion attacks.

5. **Safe Error Handling**:
   - In production (`NODE_ENV=production`), internal database connection details and stack traces are withheld from API responses.

---

## 📝 How to Update Daily Rates

### Option 1: Using the Web UI (Admin Modal)
1. Click the **"Update / Add Rate"** button in the header.
2. Enter your **Admin Security Passkey** (default: `apmc-vashi-secret-2026`).
3. Select **"Update Existing Rates"** tab.
4. Click on the vegetable or fruit you wish to edit (or click the ✏️ icon on any card).
5. Update `Today's Price` and `Yesterday's Price`.
6. Click **"Save Rate"** — the rate card, price trends, and "Cook This Today" automatically update!

### Option 2: Using cURL / Terminal
```bash
# Update Tomato price (replace with actual MongoDB _id and admin key)
curl -X PUT http://localhost:3000/api/rates/6ad6ffaab90b0d1d236175d2 \
  -H "Content-Type: application/json" \
  -H "x-api-key: apmc-vashi-secret-2026" \
  -d '{"price_today": 20, "price_yesterday": 22}'
```

---

## 🏷️ Footer & Credits

- **Data Source**: APMC Vashi (sample data for demo)
- **Location**: Sector 19, Turbhe Wholesale Yard, Navi Mumbai
- **Made with ❤️ in Navi Mumbai**