# 💼 Investment Dashboard

A modular personal finance dashboard built with **React + TypeScript**, designed to track crypto holdings, stock positions, dividend income, and overall portfolio performance.


This project emphasizes **clarity**, **modularity**, and **safety nets** — every action is confirmed via reusable modals, with restore buttons to re‑enable confirmations locally or globally.
=======

---

## 🧩 Core Modules

### 📈 CryptoPrices
- Live feed for primary and supplementary coins
- Debounced API calls with loading/error states

### 🪙 CryptoHoldings
- Track buy price, current price, value, and P/L
- Confirmation modal with “Don’t ask again” logic
- Per‑module restore button

### 📊 StockTracker
- Manage stock positions with confirm logic
- Inline validation for amount and date

### 💸 DividendLogger
- Log dividend income with monthly summaries
- Integrated chart visualization
- Persistent confirmation flags

### 📊 PortfolioPerformance
- Unified view of portfolio growth across crypto, stocks, and dividends
- Memoized aggregates for performance

---

## 🛠️ Utilities

- `storage.ts` — Local persistence for holdings and confirm flags  
- `formatters.ts` — Consistent currency and date formatting  
- `api.ts` — Fetch live crypto prices from CoinGecko  
- `ConfirmModal.tsx` — Reusable modal with dark styling, “Don’t ask again,” and restore logic

---

## 🛡️ Safety Nets

- **Confirmation Modals** — Prevent accidental deletions  
- **Per‑Module Restore** — Re‑enable confirmations inside each module  
- **Global Restore** — Reset all confirmations from the dashboard header

---

## 🚀 Getting Started

### Prerequisites
- Node.js (≥ 18)
- npm or yarn

### Installation
```bash
git clone https://github.com/your-username/investment-dashboard.git
cd investment-dashboard
npm install
npm start


Project Structure
src/
 ├── components/
 │    ├── CryptoPrices.tsx
 │    ├── CryptoHoldings.tsx
 │    ├── StockTracker.tsx
 │    ├── DividendLogger.tsx
 │    ├── PortfolioPerformance.tsx
 │    └── ConfirmModal.tsx
 ├── utils/
 │    ├── storage.ts
 │    ├── formatters.ts
 │    └── api.ts
 └── App.tsx


📜 License
MIT License — feel free to use, modify, and share.
>>>>>>> 856be8c78635514b027021c0722f4a2cc2282795
