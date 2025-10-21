import './App.css';
import CryptoPrices from './components/CryptoPrices';
import DividendLogger from './components/DividendLogger';
import StockTracker from './components/StockTracker';
import PortfolioPerformance from './components/PortfolioPerformance';
import CryptoHoldings from './components/CryptoHoldings';
import { saveConfirmFlags } from './utils/storage';

function App() {
  const restoreAll = () => {
    saveConfirmFlags({}); // clear all confirmation flags
    window.location.reload(); // reload so modules re-read flags
  };

  return (
    <div className="App">
      <h1>Investment Dashboard</h1>

      {/* Global restore button */}
      <button
        style={{
          marginBottom: '1rem',
          background: '#444',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
        }}
        onClick={restoreAll}
      >
        Restore All Confirmations
      </button>

      <CryptoPrices />
      <CryptoHoldings />
      <StockTracker />
      <DividendLogger />
      <PortfolioPerformance />
    </div>
  );
}

export default App;
