import './App.css';
import CryptoPrices from './components/CryptoPrices';
import DividendLogger from './components/DividendLogger';
import StockTracker from './components/StockTracker';
import PortfolioPerformance from './components/PortfolioPerformance';
import CryptoHoldings from './components/CryptoHoldings';
import { restoreAllConfirmations } from './utils/storage';
import Button from './components/Button';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const restoreAll = () => {
    restoreAllConfirmations(); // reset all flags to false
    window.location.reload(); // reload so modules re-read flags
  };

  return (
    <div className="App">
      {/* ✅ Skip link for keyboard users */}
      <a href="#dashboard-title" className="skip-link">
        Skip to main content
      </a>

      <main>
        <h1 id="dashboard-title">Investment Dashboard</h1>

        {/* Global restore button */}
        <div style={{ marginBottom: '1rem' }}>
          <Button variant="muted" onClick={restoreAll}>
            Restore All Confirmations
          </Button>
        </div>

        {/* ✅ Each module wrapped in ErrorBoundary */}
        <ErrorBoundary>
          <section aria-labelledby="crypto-prices-title">
            <h2 id="crypto-prices-title" className="visually-hidden">
              Crypto Prices
            </h2>
            <CryptoPrices />
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section aria-labelledby="crypto-holdings-title">
            <h2 id="crypto-holdings-title" className="visually-hidden">
              Crypto Holdings
            </h2>
            <CryptoHoldings />
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section aria-labelledby="stock-tracker-title">
            <h2 id="stock-tracker-title" className="visually-hidden">
              Stock Tracker
            </h2>
            <StockTracker />
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section aria-labelledby="dividend-logger-title">
            <h2 id="dividend-logger-title" className="visually-hidden">
              Dividend Logger
            </h2>
            <DividendLogger />
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section aria-labelledby="portfolio-performance-title">
            <h2 id="portfolio-performance-title" className="visually-hidden">
              Portfolio Performance
            </h2>
            <PortfolioPerformance />
          </section>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
