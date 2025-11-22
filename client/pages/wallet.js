import { useState, useEffect } from 'react';
import styles from '../styles/Wallet.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { transactionService } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Wallet() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // Fetch user transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (user) {
        try {
          setLoadingTransactions(true);
          const token = localStorage.getItem('token');
          const userTransactions = await transactionService.getUserTransactions(token);
          setTransactions(userTransactions);
          setLoadingTransactions(false);
        } catch (err) {
          console.error('Failed to fetch transactions:', err);
          setError('Failed to load transaction history');
          setLoadingTransactions(false);
        }
      }
    };

    fetchTransactions();
  }, [user]);

  // Refresh user profile periodically to ensure balance is up to date
  useEffect(() => {
    if (!user) return;
    
    const refreshProfile = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    };
    
    // Refresh profile every 30 seconds
    const interval = setInterval(refreshProfile, 30000);
    
    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Show loading state
  if (loading) {
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

  // Calculate wallet balances from user data
  const walletBalances = [
    { symbol: 'BTC', name: 'Bitcoin', balance: user.balance?.BTC || 0, value: (user.balance?.BTC || 0) * 45000, address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
    { symbol: 'ETH', name: 'Ethereum', balance: user.balance?.ETH || 0, value: (user.balance?.ETH || 0) * 3000, address: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C' },
    { symbol: 'LTC', name: 'Litecoin', balance: user.balance?.LTC || 0, value: (user.balance?.LTC || 0) * 150, address: 'LZ1Q2W3E4R5T6Y7U8I9O0P1Q2W3E4R5T6Y7U8I9O0' },
    { symbol: 'XRP', name: 'Ripple', balance: user.balance?.XRP || 0, value: (user.balance?.XRP || 0) * 1.2, address: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV' }
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
    status: transaction.status
  }));

  const handleSend = async (e) => {
    e.preventDefault();
    
    try {
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
      setError('');
      
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
    navigator.clipboard.writeText(text);
    // In a real app, you would show a notification here
    console.log('Copied to clipboard:', text);
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
          <button 
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'send' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('send')}
          >
            Send
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'receive' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('receive')}
          >
            Receive
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              <h2>Your Assets</h2>
              <div className={styles.assetsGrid}>
                {walletBalances.filter(wallet => wallet.balance > 0).map(wallet => (
                  <div key={wallet.symbol} className={styles.assetCard}>
                    <div className={styles.assetHeader}>
                      <span className={styles.assetSymbol}>{wallet.symbol}</span>
                      <span className={styles.assetName}>{wallet.name}</span>
                    </div>
                    <div className={styles.assetDetails}>
                      <span className={styles.assetBalance}>{wallet.balance.toFixed(6)}</span>
                      <span className={styles.assetValue}>${wallet.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'send' && (
            <div className={styles.sendContent}>
              <h2>Send Cryptocurrency</h2>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && <div className={styles.successMessage}>Transaction sent successfully!</div>}
              
              <form onSubmit={handleSend} className={styles.sendForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="crypto">Cryptocurrency</label>
                  <select 
                    id="crypto"
                    value={selectedCrypto} 
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className={styles.formControl}
                  >
                    {walletBalances.filter(wallet => wallet.balance > 0).map(wallet => (
                      <option key={wallet.symbol} value={wallet.symbol}>
                        {wallet.symbol} - {wallet.name} (Balance: {wallet.balance.toFixed(6)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    className={styles.formControl}
                    required
                  />
                  <button 
                    type="button" 
                    className={styles.maxButton}
                    onClick={() => setSendAmount(selectedWallet?.balance || 0)}
                  >
                    MAX
                  </button>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="address">Recipient Address</label>
                  <input
                    type="text"
                    id="address"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder="Enter recipient address"
                    className={styles.formControl}
                    required
                  />
                </div>
                
                <button type="submit" className={styles.sendButton}>
                  Send {selectedCrypto}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className={styles.receiveContent}>
              <h2>Receive Cryptocurrency</h2>
              <p>Send cryptocurrency to the address below:</p>
              
              <div className={styles.qrCode}>
                <div className={styles.qrPlaceholder}>QR Code</div>
              </div>
              
              <div className={styles.addressDisplay}>
                <input
                  type="text"
                  value={selectedWallet?.address || ''}
                  readOnly
                  className={styles.addressInput}
                />
                <button 
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(selectedWallet?.address || '')}
                >
                  Copy Address
                </button>
              </div>
              
              <div className={styles.warning}>
                <p>Only send {selectedWallet?.name} ({selectedWallet?.symbol}) to this address.</p>
                <p>Sending any other cryptocurrency may result in permanent loss.</p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.historyContent}>
              <h2>Transaction History</h2>
              {loadingTransactions ? (
                <div className={styles.loading}>Loading transactions...</div>
              ) : transactionHistory.length > 0 ? (
                <div className={styles.transactionList}>
                  {transactionHistory.map(transaction => (
                    <div key={transaction.id} className={styles.transactionItem}>
                      <div className={styles.transactionHeader}>
                        <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                          {transaction.type}
                        </span>
                        <span className={styles.transactionCrypto}>{transaction.crypto}</span>
                      </div>
                      <div className={styles.transactionDetails}>
                        <div className={styles.detailRow}>
                          <span>Amount:</span>
                          <span>{transaction.amount} {transaction.crypto}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Date:</span>
                          <span>{transaction.date}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Status:</span>
                          <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No transactions yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}