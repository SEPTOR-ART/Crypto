import { useState, useEffect } from 'react';
import styles from '../styles/Trade.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { transactionService } from '../services/api';

export default function Trade() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const router = useRouter();
  
  // Get current price for selected crypto
  const price = cryptoPrices[selectedCrypto] || 0;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);


  const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin', price: 45000 },
    { symbol: 'ETH', name: 'Ethereum', price: 3000 },
    { symbol: 'LTC', name: 'Litecoin', price: 150 },
    { symbol: 'XRP', name: 'Ripple', price: 1.2 }
  ];

  // Update total when amount changes (must be declared before any early returns)
  useEffect(() => {
    setTotal((amount * price).toFixed(2));
  }, [amount, price]);

  // Mock order book data (must be declared before any early returns)
  useEffect(() => {
    // Generate mock order book data
    const bids = [];
    const asks = [];
    
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: (price - (i * 50)).toFixed(2),
        amount: (Math.random() * 5).toFixed(4)
      });
      
      asks.push({
        price: (price + (i * 50)).toFixed(2),
        amount: (Math.random() * 5).toFixed(4)
      });
    }
    
    setOrderBook({ bids, asks });
  }, [price]);

  // Show loading state
  if (authLoading || pricesLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
  }

  const handleTrade = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Create transaction data
      const transactionData = {
        type: tradeType,
        asset: selectedCrypto,
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
        // For sell transactions, we might need a toAddress
        // For buy transactions, we might need a fromAddress
        toAddress: tradeType === 'sell' ? 'recipient_address' : undefined,
        fromAddress: tradeType === 'buy' ? 'sender_address' : undefined
      };
      
      // Call the transaction service
      const result = await transactionService.createTransaction(transactionData, token);
      
      console.log('Trade executed:', result);
      setSuccess(true);
      setError('');
      
      // Reset form
      setAmount('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Trade execution failed:', err);
      setError(err.message || 'Failed to execute trade');
      setSuccess(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tradingView}>
        {/* Trading Pair Selector */}
        <div className={styles.pairSelector}>
          <select 
            value={selectedCrypto} 
            onChange={(e) => setSelectedCrypto(e.target.value)}
            className={styles.cryptoSelect}
          >
            {cryptocurrencies.map(crypto => (
              <option key={crypto.symbol} value={crypto.symbol}>
                {crypto.symbol}/USD
              </option>
            ))}
          </select>
          
          <div className={styles.priceDisplay}>
            <span className={styles.currentPrice}>${parseFloat(price).toLocaleString()}</span>
            <span className={styles.priceChange}>+2.5%</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className={styles.chartArea}>
          <div className={styles.chartPlaceholder}>
            <p>Price Chart Visualization</p>
          </div>
        </div>

        {/* Order Book */}
        <div className={styles.orderBook}>
          <h3>Order Book</h3>
          <div className={styles.orderBookContent}>
            <div className={styles.asks}>
              <h4>Asks</h4>
              {orderBook.asks.slice(0, 5).map((ask, index) => (
                <div key={index} className={styles.orderRow}>
                  <span className={styles.askPrice}>{ask.price}</span>
                  <span>{ask.amount}</span>
                </div>
              ))}
            </div>
            
            <div className={styles.bids}>
              <h4>Bids</h4>
              {orderBook.bids.slice(0, 5).map((bid, index) => (
                <div key={index} className={styles.orderRow}>
                  <span className={styles.bidPrice}>{bid.price}</span>
                  <span>{bid.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trading Panel */}
      <div className={styles.tradingPanel}>
        <div className={styles.panelHeader}>
          <button 
            className={`${styles.panelTab} ${tradeType === 'buy' ? styles.activeTab : ''}`}
            onClick={() => setTradeType('buy')}
          >
            Buy
          </button>
          <button 
            className={`${styles.panelTab} ${tradeType === 'sell' ? styles.activeTab : ''}`}
            onClick={() => setTradeType('sell')}
          >
            Sell
          </button>
        </div>

        <form onSubmit={handleTrade} className={styles.tradeForm}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>Trade executed successfully!</div>}
          
          <div className={styles.formGroup}>
            <label>Amount</label>
            <div className={styles.inputWithSymbol}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                required
              />
              <span className={styles.symbol}>{selectedCrypto}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Price</label>
            <div className={styles.inputWithSymbol}>
              <input
                type="number"
                value={price}
                readOnly
              />
              <span className={styles.symbol}>USD</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Total</label>
            <div className={styles.inputWithSymbol}>
              <input
                type="text"
                value={total}
                readOnly
              />
              <span className={styles.symbol}>USD</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Payment Method</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.paymentSelect}
            >
              <option value="credit">Credit/Debit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="gift">Gift Card</option>
              <option value="wallet">Digital Wallet</option>
            </select>
          </div>

          <button 
            type="submit" 
            className={`${styles.tradeButton} ${tradeType === 'buy' ? styles.buyButton : styles.sellButton}`}
          >
            {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto}
          </button>
        </form>

        {/* Market Info */}
        <div className={styles.marketInfo}>
          <h3>Market Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>24h High</span>
              <span>${(parseFloat(price) * 1.05).toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>24h Low</span>
              <span>${(parseFloat(price) * 0.95).toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>24h Volume</span>
              <span>{(Math.random() * 10000).toFixed(2)} {selectedCrypto}</span>
            </div>
            <div className={styles.infoItem}>
              <span>Market Cap</span>
              <span>${(parseFloat(price) * 1000000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <ChatSupport />
    </div>
  );
}