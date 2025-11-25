import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Wallet.module.css';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

export default function Wallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const { user, refreshUser } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const intervalRef = useRef(null);

  // Fetch user transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const userTransactions = await transactionService.getUserTransactions(token);
        setTransactions(userTransactions);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
    
    // Set up interval for real-time updates
    intervalRef.current = setInterval(async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const userTransactions = await transactionService.getUserTransactions(token);
            setTransactions(userTransactions);
            // Refresh user data to get updated balance
            await refreshUser();
          }
        } catch (err) {
          console.error('Failed to refresh transactions:', err);
        }
      }
    }, 30000); // Refresh every 30 seconds
    
    // Clean up interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshUser]);

  // Show loading state
  if (loading && transactions.length === 0) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className={styles.loading}>Loading wallet data...</div>
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

  // Calculate wallet balances from user data using real prices
  const walletBalances = [
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      balance: user.balance?.BTC || 0, 
      value: (user.balance?.BTC || 0) * (cryptoPrices.BTC || 45000),
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' 
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: user.balance?.ETH || 0, 
      value: (user.balance?.ETH || 0) * (cryptoPrices.ETH || 3000),
      address: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C' 
    },
    { 
      symbol: 'LTC', 
      name: 'Litecoin', 
      balance: user.balance?.LTC || 0, 
      value: (user.balance?.LTC || 0) * (cryptoPrices.LTC || 150),
      address: 'LZ1Q2W3E4R5T6Y7U8I9O0P1Q2W3E4R5T6Y7U8I9O0' 
    },
    { 
      symbol: 'XRP', 
      name: 'Ripple', 
      balance: user.balance?.XRP || 0, 
      value: (user.balance?.XRP || 0) * (cryptoPrices.XRP || 1.2),
      address: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV' 
    }
  ];

  // Format transaction history from user transactions
  const transactionHistory = transactions.map(transaction => ({
    id: transaction._id,
    type: transaction.type,
    crypto: transaction.asset,
    amount: transaction.amount,
    from: transaction.fromAddress || 'N/A',
    to: transaction.toAddress || 'N/A',
    date: new Date(transaction.createdAt).toLocaleDateString(),
    time: new Date(transaction.createdAt).toLocaleTimeString(),
    status: transaction.status,
    total: transaction.total
  }));

  const handleSend = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Validate inputs
      if (!sendAmount || !sendAddress) {
        throw new Error('Amount and address are required');
      }
      
      const numericAmount = parseFloat(sendAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      // Check if user has sufficient balance
      const userBalance = user.balance?.[selectedCrypto] || 0;
      if (numericAmount > userBalance) {
        throw new Error(`Insufficient ${selectedCrypto} balance`);
      }
      
      // Create transaction data for sending
      const transactionData = {
        type: 'send',
        asset: selectedCrypto,
        amount: numericAmount,
        toAddress: sendAddress,
        // Price is not relevant for send transactions, but required by the model
        price: 0,
        paymentMethod: 'wallet'
      };
      
      // Call the transaction service
      const result = await transactionService.createTransaction(transactionData, token);
      
      console.log('Send transaction created:', result);
      setSuccess(true);
      
      // Refresh transactions
      const userTransactions = await transactionService.getUserTransactions(token);
      setTransactions(userTransactions);
      
      // Refresh user data to update balance
      await refreshUser();
      
      // Reset form
      setSendAmount('');
      setSendAddress('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Send transaction failed:', err);
      setError(err.message || 'Failed to send transaction');
      setSuccess(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Copied to clipboard:', text);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const selectedWallet = walletBalances.find(wallet => wallet.symbol === selectedCrypto);

  // Calculate total balance
  const totalBalance = walletBalances.reduce((total, wallet) => {
    // Ensure we're working with numbers
    const balance = parseFloat(wallet.balance) || 0;
    const price = wallet.value / (balance || 1); // Avoid division by zero
    return total + (balance * price);
  }, 0);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        <div className={styles.walletHeader}>
          <h1>Wallet</h1>
          <p>Manage your cryptocurrency assets securely</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>Transaction sent successfully!</div>}

        {/* Wallet Overview */}
        <div className={styles.walletOverview}>
          <div className={styles.balanceCard}>
            <h2>Total Balance</h2>
            <p className={styles.totalBalance}>${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className={styles.balanceChange}>+2.5% last 24h</div>
          </div>
          
          <div className={styles.cryptoSelector}>
            <select 
              value={selectedCrypto} 
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className={styles.cryptoSelect}
            >
              {walletBalances.map(wallet => (
                <option key={wallet.symbol} value={wallet.symbol}>
                  {wallet.symbol} - {wallet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Wallet Details */}
        <div className={styles.walletDetails}>
          <div className={styles.walletInfo}>
            <div className={styles.infoRow}>
              <span>Balance</span>
              <span className={styles.balanceAmount}>
                {(selectedWallet?.balance || 0).toFixed(6)} {selectedWallet?.symbol}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span>Value</span>
              <span className={styles.balanceValue}>${(selectedWallet?.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Address</span>
              <div className={styles.addressContainer}>
                <span className={styles.address}>{selectedWallet?.address}</span>
                <button 
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(selectedWallet?.address || '')}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Tabs */}
        <div className={styles.walletTabs}>
          <button className={`${styles.tab} ${styles.active}`}>Transactions</button>
          <button className={styles.tab}>Deposit</button>
          <button className={styles.tab}>Send</button>
        </div>

        {/* Send Form */}
        <div className={styles.sendSection}>
          <h2>Send Cryptocurrency</h2>
          
          <form onSubmit={handleSend} className={styles.sendForm}>
            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className={styles.input}
              />
              <div className={styles.balanceInfo}>
                Available: {(user.balance?.[selectedCrypto] || 0).toFixed(6)} {selectedCrypto}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="address">Recipient Address</label>
              <input
                type="text"
                id="address"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                placeholder="Enter recipient address"
                className={styles.input}
              />
            </div>
            
            <button type="submit" className={styles.sendButton}>
              Send {selectedCrypto}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className={styles.transactionHistory}>
          <div className={styles.sectionHeader}>
            <h2>Transaction History</h2>
            <Link href="/dashboard" className={styles.viewAllButton}>View Dashboard</Link>
          </div>
          
          {loading && transactions.length > 0 ? (
            <div className={styles.loading}>Refreshing transactions...</div>
          ) : transactionHistory.length > 0 ? (
            <div className={styles.transactionsList}>
              {transactionHistory.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionInfo}>
                    <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                      {transaction.type}
                    </span>
                    <span className={styles.transactionCrypto}>{transaction.crypto}</span>
                  </div>
                  <div className={styles.transactionDetails}>
                    <span className={styles.transactionAmount}>
                      {transaction.amount} {transaction.crypto}
                    </span>
                    <span className={styles.transactionDate}>
                      {transaction.date} {transaction.time}
                    </span>
                  </div>
                  <div className={styles.transactionAddress}>
                    <span>To: {transaction.to.substring(0, 10)}...</span>
                  </div>
                  <div className={styles.transactionStatus}>
                    <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No transactions yet.</p>
              <Link href="/trade" className={styles.getStartedButton}>Start Trading</Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}