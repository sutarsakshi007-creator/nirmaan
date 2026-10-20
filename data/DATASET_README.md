# 📊 APMC Vashi Wholesale Market Dataset (5,000 Records)

> **Dataset Name**: APMC Vashi Daily Wholesale Market Arrivals & Commodity Rates Dataset  
> **Source**: Inspired by APMC Vashi (Sector 19, Turbhe Wholesale Yard, Navi Mumbai, Maharashtra)  
> **Total Records**: Exactly **5,000 Records**  
> **Formats Available**: CSV (`data/apmc_vashi_5000_rates.csv`) and JSON (`data/apmc_vashi_5000_rates.json`)

---

## 🌾 Overview

This dataset captures daily wholesale agricultural market transactions and arrivals from **APMC Vashi (Navi Mumbai)** — India's largest and most prominent wholesale agricultural market yard for the Mumbai Metropolitan Region (MMR).

The dataset spans **50 major agricultural commodities** across **100 distinct trading dates**, covering seasonal peak harvest windows, market fluctuations, arrival volumes, and tri-lingual naming (English, Hindi, Marathi).

---

## 📁 Files in this Directory

| File Name | Format | Size | Description |
|---|---|---|---|
| [`apmc_vashi_5000_rates.csv`](./apmc_vashi_5000_rates.csv) | CSV | ~1.5 MB | Tabular 5,000 rows with 25 feature columns (Excel, Pandas, PowerBI, SQL ready) |
| [`apmc_vashi_5000_rates.json`](./apmc_vashi_5000_rates.json) | JSON | ~4.3 MB | 5,000 structured JSON objects with nested arrays (MongoDB, REST API ready) |

---

## 🗄️ Dataset Schema & Field Descriptions

| Column Name | Data Type | Example Value | Description |
|---|---|---|---|
| `record_id` | String | `APMC-VSH-00001` | Unique primary key for each market lot transaction |
| `date` | Date (YYYY-MM-DD) | `2024-05-01` | Date of market trading session |
| `market` | String | `APMC Vashi (Navi Mumbai)` | Terminal wholesale market name |
| `market_yard` | String | `Sector 19, Turbhe Wholesale Yard` | Physical APMC market yard location |
| `state` | String | `Maharashtra` | State of the market |
| `district` | String | `Thane / Navi Mumbai` | District jurisdiction |
| `commodity_name_en` | String | `Onion` | Canonical English commodity name |
| `commodity_name_hi` | String | `प्याज (Pyaaz)` | Commodity name in Devanagari Hindi |
| `commodity_name_mr` | String | `कांदा (Kanda)` | Commodity name in Marathi (local official language) |
| `category` | String | `vegetable` | Category: `vegetable`, `fruit`, `spice`, `grain`, `pulse` |
| `variety` | String | `Nashik Red` | Botanical / commercial crop variety |
| `grade` | String | `FAQ (Fair Average Quality)` | Quality grading standard (`FAQ` or `Super A-Grade`) |
| `arrivals_quintal` | Integer | `1275` | Daily arrival volume at APMC Vashi in quintals (100 kg) |
| `min_price_quintal` | Integer | `2900` | Minimum auction bidding price in ₹ per quintal |
| `max_price_quintal` | Integer | `4032` | Maximum auction bidding price in ₹ per quintal |
| `modal_price_quintal` | Integer | `3400` | Standard modal / most frequent wholesale rate (₹/qtl) |
| `price_today` | Integer | `34` | Today's modal wholesale rate in ₹ per kg |
| `price_yesterday` | Integer | `35` | Previous trading session rate in ₹ per kg |
| `price_change_pct` | Float | `-2.9` | Day-over-day price fluctuation percentage (+% / -%) |
| `price_week_low` | Integer | `30` | 7-day lowest wholesale rate in ₹ per kg |
| `unit` | String | `kg` | Base unit of measurement |
| `emoji` | String | `🧅` | Visual produce glyph |
| `image_url` | String | `/images/onion.jpg` | Local asset path for real produce photography |
| `season_months` | Array/String | `11;12;1;2;3` | Calendar months of peak harvest arrivals (1-12) |
| `in_season_today` | Boolean | `false` | Indicator whether the trading date falls within peak season |

---

## 📈 Dataset Statistics & Breakdown

- **Total Transactions / Records**: `5,000`
- **Total Unique Commodities**: `50`
- **Trading Dates Covered**: `100` distinct sessions
- **Categories Breakdown**:
  - 🥬 **Vegetables**: 22 commodities (2,200 records)
  - 🍎 **Fruits**: 14 commodities (1,400 records)
  - 🌶️ **Spices & Herbs**: 5 commodities (500 records)
  - 🌾 **Grains & Cereals**: 7 commodities (700 records)
  - 🥣 **Pulses & Dals**: 7 commodities (700 records)

---

## 🐍 Usage Examples

### 1. In Python with Pandas (Data Science & ML)
```python
import pandas as pd

# Load the dataset
df = pd.read_csv('data/apmc_vashi_5000_rates.csv')

print(f"Dataset Shape: {df.shape}")
print(df.head())

# Filter for Onions in APMC Vashi
onions_df = df[df['commodity_name_en'] == 'Onion']
print(f"Average Onion Modal Price: ₹{onions_df['price_today'].mean():.2f}/kg")
```

### 2. In Node.js / MongoDB
```bash
# Seed all 5,000 records into your local or cloud MongoDB database:
npm run seed:5000
```

---

## 📜 Academic & Project Citation

```text
Mandi Mood APMC Vashi Wholesale Market Dataset (2024-2026)
Research & Project Data: Agricultural Produce Market Committee (APMC) Vashi, Navi Mumbai, Maharashtra.
Project: Nirmaan / Mandi Mood Daily Market Dashboard.
```
