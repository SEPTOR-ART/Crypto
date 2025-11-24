import { useState, useEffect } from 'react';
import styles from '../styles/Trade.module.css';
import ChatSupport from '../components/ChatSupport';
import Chart from '../components/Chart';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
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

          <div className={styles.panelContent}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>Trade executed successfully!</div>}
            
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
                  <option value="credit">Credit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="wallet">Wallet Balance</option>
                  <option value="gift">Gift Card</option>
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
        
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}