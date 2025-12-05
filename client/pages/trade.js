import { useState, useEffect } from 'react';
import styles from '../styles/Trade.module.css';
import Chart from '../components/Chart';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { useMarketData } from '../hooks/useMarketData';
import { transactionService, giftCardService } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

export default function Trade() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [depth, setDepth] = useState({ bids: [], asks: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, loading: authLoading, updateUserBalance, refreshUser } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [giftCardInfo, setGiftCardInfo] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');

  // Get current price for selected crypto
  const price = cryptoPrices[selectedCrypto] || 0;
  const symbol = `${selectedCrypto}USD`;
  const { data: marketAgg } = useMarketData({ symbols: [symbol], metrics: true });
  const agg = Array.isArray(marketAgg) ? marketAgg.find(d => d.symbol === symbol) : null;

  // Cryptocurrencies with real data
  const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'LTC', name: 'Litecoin' },
    { symbol: 'XRP', name: 'Ripple' }
  ];

  // Update total when amount changes (must be declared before any early returns)
  useEffect(() => {
    const numericAmount = parseFloat(amount) || 0;
    const numericPrice = parseFloat(price) || 0;
    setTotal((numericAmount * numericPrice).toFixed(2));
  }, [amount, price]);

  // Generate order book data based on real prices
  useEffect(() => {
    // Generate mock order book data
    const bids = [];
    const asks = [];
    
    const numericPrice = parseFloat(price) || 0;
    
    for (let i = 0; i < 10; i++) {
      const bidPrice = numericPrice - (i * (numericPrice * 0.005));
      const askPrice = numericPrice + (i * (numericPrice * 0.005));
      
      bids.push({
        price: bidPrice.toFixed(2),
        amount: (Math.random() * 5).toFixed(4)
      });
      
      asks.push({
        price: askPrice.toFixed(2),
        amount: (Math.random() * 5).toFixed(4)
      });
    }
    
    setOrderBook({ bids, asks });

    const maxBid = Math.max(...bids.map(b => parseFloat(b.amount) || 0), 0.0001);
    const maxAsk = Math.max(...asks.map(a => parseFloat(a.amount) || 0), 0.0001);
    setDepth({
      bids: bids.map(b => ({ ...b, pct: Math.min(100, (parseFloat(b.amount) || 0) / maxBid * 100) })),
      asks: asks.map(a => ({ ...a, pct: Math.min(100, (parseFloat(a.amount) || 0) / maxAsk * 100) }))
    });
  }, [price]);

  // Refresh user profile periodically to ensure balance is up to date
  useEffect(() => {
    if (!user) return;
    
    // Clear any existing interval
    let intervalId;
    
    const startInterval = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      const refreshProfile = async () => {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
          // Handle rate limit errors specifically
          if (error.message && error.message.includes('429')) {
            console.log('Rate limit hit, extending refresh interval');
            // Extend the interval when rate limited
            clearInterval(intervalId);
            intervalId = setInterval(refreshProfile, 300000); // 5 minutes when rate limited
          }
        }
      };
      
      // Refresh profile every 2 minutes (increased from 60 seconds to reduce API load)
      intervalId = setInterval(refreshProfile, 120000);
    };
    
    startInterval();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, refreshUser]);

  // Show loading state
  if (authLoading || pricesLoading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className={styles.loading}>Loading...</div>
      </ProtectedRoute>
    );
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div></div>
      </ProtectedRoute>
    );
  }

  // Get user's balance for selected cryptocurrency
  const userBalance = user.balance?.[selectedCrypto] || 0;

  const handleTrade = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Validate amount
      const numericAmount = parseFloat(amount);
      const numericPrice = parseFloat(price);
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error('Invalid price');
      }
      
      // If using gift card, validate it first
      let giftCardDetails = null;
      if (paymentMethod === 'gift') {
        if (!giftCardNumber || !giftCardPin) {
          throw new Error('Please enter gift card number and PIN');
        }
        
        // Validate gift card
        const validationResponse = await giftCardService.validateGiftCard({
          cardNumber: giftCardNumber,
          pin: giftCardPin
        });
        
        if (!validationResponse.valid) {
          throw new Error(validationResponse.message || 'Invalid gift card');
        }
        
        setGiftCardInfo(validationResponse);
        giftCardDetails = {
          cardNumber: giftCardNumber,
          pin: giftCardPin
        };
      }
      
      // Prepare transaction data
      const transactionData = {
        type: tradeType,
        asset: selectedCrypto,
        amount: numericAmount,
        price: numericPrice,
        paymentMethod,
        giftCardDetails,
        // For sell transactions, we might need a toAddress
        // For buy transactions, we might need a fromAddress
        toAddress: tradeType === 'sell' ? 'recipient_address' : undefined,
        fromAddress: tradeType === 'buy' ? 'sender_address' : undefined
      };
      
      // Call the transaction service
      const result = await transactionService.createTransaction(transactionData, token);
      
      console.log('Trade executed:', result);
      
      // If the result includes userBalance, update the auth context
      if (result.userBalance) {
        updateUserBalance(result.userBalance);
      }
      
      // If this was a gift card payment, show remaining balance
      if (result.giftCardPayment && result.giftCardPayment.processed) {
        console.log('Gift card payment processed successfully');
      }
      
      // Refresh user data to ensure balance is up to date
      await refreshUser();
      
      setSuccess(true);
      setError('');
      
      // Reset form
      setAmount('');
      
      // Clear gift card form if it was used
      if (paymentMethod === 'gift') {
        setGiftCardNumber('');
        setGiftCardPin('');
        setGiftCardInfo(null);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Trade execution failed:', err);
      // Handle rate limit errors with user-friendly message
      if (err.message && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to execute trade');
      }
      setSuccess(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.label}>TRADE LAB</span>
            <h1 className={styles.title}>Buy & Sell Crypto</h1>
            <p className={styles.subtitle}>Trade cryptocurrencies with real-time prices and advanced tools</p>
          </div>
        </div>

        {/* Market Stats */}
        <div className={styles.marketStats}>
          {cryptocurrencies.map(crypto => {
            const cryptoPrice = cryptoPrices[crypto.symbol] || 0;
            return (
              <div key={crypto.symbol} className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.cryptoName}>{crypto.name}</span>
                  <span className={styles.cryptoSymbol}>{crypto.symbol}</span>
                </div>
                <div className={styles.statPrice}>
                  ${parseFloat(cryptoPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={styles.statChange}>+2.5%</div>
              </div>
            );
          })}
        </div>

        {/* Main Trading Interface */}
        <div className={styles.tradingInterface}>
          {/* Left: Chart & Order Book */}
          <div className={styles.leftPanel}>
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
                <span className={styles.currentPrice}>${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={styles.priceChange}>+2.5%</span>
              </div>
            </div>

            {/* Chart Area */}
            <div className={styles.chartArea}>
              <Chart 
                prices={cryptoPrices} 
                selectedCrypto={selectedCrypto} 
                loading={pricesLoading} 
                error={null} 
              />
            </div>

            {/* Order Book */}
            <div className={styles.orderBook}>
              <h3>Order Book</h3>
              <div className={styles.orderBookContent}>
                <div className={styles.asks}>
                  <h4>Asks (Sell Orders)</h4>
                  {depth.asks.slice(0, 5).map((ask, index) => (
                    <div key={index} className={styles.orderRow}>
                      <span className={styles.askPrice}>${ask.price}</span>
                      <span className={styles.orderAmount}>{ask.amount}</span>
                      <span className={styles.depthBar} style={{width: `${ask.pct}%`, background: 'rgba(255,0,128,.25)'}}></span>
                    </div>
                  ))}
                </div>
                
                <div className={styles.bids}>
                  <h4>Bids (Buy Orders)</h4>
                  {depth.bids.slice(0, 5).map((bid, index) => (
                    <div key={index} className={styles.orderRow}>
                      <span className={styles.bidPrice}>${bid.price}</span>
                      <span className={styles.orderAmount}>{bid.amount}</span>
                      <span className={styles.depthBar} style={{width: `${bid.pct}%`, background: 'rgba(0,212,255,.25)'}}></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Trading Panel */}
          <div className={styles.rightPanel}>
            <div className={styles.tradingPanel}>
              <div className={styles.panelHeader}>
                <button 
                  className={`${styles.panelTab} ${tradeType === 'buy' ? styles.activeTab : ''}`}
                  onClick={() => setTradeType('buy')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Buy
                </button>
                <button 
                  className={`${styles.panelTab} ${tradeType === 'sell' ? styles.activeTab : ''}`}
                  onClick={() => setTradeType('sell')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Sell
                </button>
              </div>

              <div className={styles.panelContent}>
                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>✓ Trade executed successfully!</div>}
                
                <form onSubmit={handleTrade} className={styles.tradeForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="amount">Amount</label>
                    <div className={styles.inputWithAddon}>
                      <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.000001"
                        className={styles.formControl}
                        required
                      />
                      <span className={styles.addon}>{selectedCrypto}</span>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Total</label>
                    <div className={styles.totalDisplay}>
                      <span className={styles.totalAmount}>${total}</span>
                      <span className={styles.totalCurrency}>USD</span>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Payment Method</label>
                    <select 
                      value={paymentMethod} 
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        if (e.target.value === 'gift') {
                          setShowGiftCardForm(true);
                        } else {
                          setShowGiftCardForm(false);
                        }
                      }}
                      className={styles.formControl}
                    >
                      <option value="credit">💳 Credit Card</option>
                      <option value="bank">🏦 Bank Transfer</option>
                      <option value="wallet">👛 Wallet Balance</option>
                      <option value="gift">🎁 Gift Card</option>
                    </select>
                  </div>
                  
                  {/* Gift Card Form */}
                  {showGiftCardForm && (
                    <div className={styles.giftCardForm}>
                      <h4>Gift Card Details</h4>
                      {giftCardError && <div className={styles.errorMessage}>{giftCardError}</div>}
                      {giftCardInfo && (
                        <div className={styles.giftCardInfo}>
                          <p>Available Balance: ${giftCardInfo.balance}</p>
                          {giftCardInfo.expiresAt && (
                            <p>Expires: {new Date(giftCardInfo.expiresAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label htmlFor="giftCardNumber">Card Number</label>
                        <input
                          type="text"
                          id="giftCardNumber"
                          value={giftCardNumber}
                          onChange={(e) => setGiftCardNumber(e.target.value)}
                          placeholder="Enter gift card number"
                          className={styles.formControl}
                          required={paymentMethod === 'gift'}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="giftCardPin">PIN</label>
                        <input
                          type="password"
                          id="giftCardPin"
                          value={giftCardPin}
                          onChange={(e) => setGiftCardPin(e.target.value)}
                          placeholder="Enter PIN"
                          className={styles.formControl}
                          required={paymentMethod === 'gift'}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.balanceInfo}>
                    <span>Available Balance:</span>
                    <span>{userBalance.toFixed(6)} {selectedCrypto}</span>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`${styles.tradeButton} ${tradeType === 'buy' ? styles.buyButton : styles.sellButton}`}
                  >
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto}
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
              <h3>24h Statistics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>24h High</span>
                  <span className={styles.statValue}>${(parseFloat(price) * 1.05).toFixed(2)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>24h Low</span>
                  <span className={styles.statValue}>${(parseFloat(price) * 0.95).toFixed(2)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>24h Volume</span>
                  <span className={styles.statValue}>1.2M {selectedCrypto}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Market Cap</span>
                  <span className={styles.statValue}>$1.2T</span>
                </div>
              </div>
            </div>
            {agg && (
              <div className={styles.quickStats}>
                <h3>Verified Rates</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}><span className={styles.statLabel}>VWAP</span><span className={styles.statValue}>${Number(agg.verified?.vwap||0).toFixed(2)}</span></div>
                  <div className={styles.statItem}><span className={styles.statLabel}>Mid</span><span className={styles.statValue}>${Number(agg.verified?.priceMid||0).toFixed(2)}</span></div>
                  <div className={styles.statItem}><span className={styles.statLabel}>Sources</span><span className={styles.statValue}>{Object.keys(agg.sources||{}).length}</span></div>
                  <div className={styles.statItem}><span className={styles.statLabel}>Discrepancy</span><span className={styles.statValue}>{Number(agg.verified?.discrepancyPct||0).toFixed(2)}%</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </ProtectedRoute>
  );
}
