Investment Dashboard:
A modular, personal finance dashboard built with React + TypeScript, designed to track crypto holdings, stock positions, dividend income, and overall portfolio performance.

This project emphasizes clarity, modularity, and safety nets — every action is confirmed with reusable modals, and restore buttons allow you to re‑enable confirmations locally or globally. 

Core Modules:
CryptoPrices – Live crypto price feed (main + supplementary coins).

CryptoHoldings – Track your crypto positions with:

Buy price, current price, value, and P/L calculations.

Confirmation modal with “Don’t ask again” option.

Per‑module restore button.

StockTracker – Manage stock positions with the same confirmation logic.

DividendLogger – Log dividend income with:

Monthly summaries.

Integrated chart visualization.

Persistent confirmation flags.

PortfolioPerformance – Unified view of portfolio growth across crypto, stocks, and dividends.

Utilities
storage.ts – Local persistence for data and confirmation flags.

formatters.ts – Consistent currency and date formatting.

api.ts – Fetch live crypto prices from CoinGecko.

ConfirmModal.tsx – Reusable modal with dark styling, “Don’t ask again,” and restore logic.

Safety Nets
Confirmation Modals – Prevent accidental deletions.

Per‑Module Restore – Re‑enable confirmations inside each module.

Global Restore – Reset all confirmations at once from the dashboard header.

🛠️ Getting Started
Prerequisites
Node.js (>= 18)

npm or yarn

Installation
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
