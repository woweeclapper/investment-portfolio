# 💼 Investment Dashboard

A modular personal finance dashboard built with **React + TypeScript**, designed to track crypto holdings, stock positions, dividend income, and overall portfolio performance.

This project emphasizes **clarity**, **modularity**, and **safety nets** — every action is confirmed via reusable modals, with restore buttons to re‑enable confirmations locally or globally.

---

## 🎥 Demo

![Investment Dashboard Demo](public/investmentdashboard.mp4)

👉 [View Live Deployment](https://joeinvestmentportfolio.vercel.app)

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
- `api.ts` — Fetch live crypto prices from CoinGecko & stock prices from Finnhub
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
npm run dev

🧩 Project Structure Overview
Components

UI Primitives: badge, button
Feedback & Safety: confirmmodal, errorboundary, formerror
Domain Modules:
    Crypto: cryptoholding, cryptoprices, holdingrow
    Dividend: dividendchart, dividendlogger
    Stock: stockrow, stocktracker
    portfolioperformance
    Login: Authgate

Hooks
usePositionMetric → custom logic for portfolio/holding calculations.

Types
    types: shared type definitions for domain

Utils
Data & API: api, storage, validator
Math & Logic: calculation, formatter
Charts: chartcolors, chartoptions
Infra: constants, debounce, supabaseClient
```
