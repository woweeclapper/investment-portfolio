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
    window.location.reload();  // reload so modules re-read flags
  };

return (
  <div className="App">
    <h1>Investment Dashboard</h1>

    {/* Global restore button */}
    <div style={{ marginBottom: '1rem' }}>
      <Button variant="muted" onClick={restoreAll}>
        Restore All Confirmations
      </Button>
    </div>

    <ErrorBoundary>
      <CryptoPrices />
    </ErrorBoundary>

    <ErrorBoundary>
      <CryptoHoldings />
    </ErrorBoundary>

    <ErrorBoundary>
      <StockTracker />
    </ErrorBoundary>

    <ErrorBoundary>
      <DividendLogger />
    </ErrorBoundary>

    <ErrorBoundary>
      <PortfolioPerformance />
    </ErrorBoundary>
  </div>
);

}

export default App;
