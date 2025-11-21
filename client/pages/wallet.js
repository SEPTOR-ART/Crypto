import { useState, useEffect } from 'react';
import styles from '../styles/Wallet.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { transactionService } from '../services/api';

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
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  // Show loading state
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
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
        
        <div className={styles.qrCode}>
          <div className={styles.qrPlaceholder}>
            <p>QR Code</p>
          </div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className={styles.tabs}>
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
          History
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewContent}>
            <h3>Your Assets</h3>
            <div className={styles.assetsGrid}>
              {walletBalances.filter(wallet => (wallet.balance || 0) > 0).map(wallet => (
                <div key={wallet.symbol} className={styles.assetCard}>
                  <div className={styles.assetHeader}>
                    <span className={styles.assetSymbol}>{wallet.symbol}</span>
                    <span className={styles.assetName}>{wallet.name}</span>
                  </div>
                  <div className={styles.assetBalance}>
                    <span>{(wallet.balance || 0).toFixed(6)} {wallet.symbol}</span>
                    <span className={styles.assetValue}>${(wallet.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className={styles.sendContent}>
            <h3>Send Cryptocurrency</h3>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Transaction sent successfully!</div>}
            <form onSubmit={handleSend} className={styles.sendForm}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <div className={styles.inputWithSymbol}>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    min="0"
                    required
                  />
                  <span className={styles.symbol}>{selectedCrypto}</span>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Recipient Address</label>
                <input
                  type="text"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  placeholder="Enter recipient address"
                  required
                />
              </div>
              
              <div className={styles.feeInfo}>
                <div className={styles.feeRow}>
                  <span>Network Fee</span>
                  <span>0.0005 {selectedCrypto}</span>
                </div>
                <div className={styles.feeRow}>
                  <span>Total</span>
                  <span>{sendAmount ? (parseFloat(sendAmount) + 0.0005).toFixed(4) : '0.0000'} {selectedCrypto}</span>
                </div>
              </div>
              
              <button type="submit" className={styles.sendButton}>Send {selectedCrypto}</button>
            </form>
          </div>
        )}

        {activeTab === 'receive' && (
          <div className={styles.receiveContent}>
            <h3>Receive Cryptocurrency</h3>
            <div className={styles.receiveInfo}>
              <p>Send only {selectedCrypto} to this address</p>
              <div className={styles.addressDisplay}>
                <span>{selectedWallet?.address}</span>
                <button 
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(selectedWallet?.address || '')}
                >
                  Copy Address
                </button>
              </div>
              <div className={styles.qrContainer}>
                <div className={styles.qrPlaceholder}>
                  <p>QR Code</p>
                </div>
              </div>
              <p className={styles.warning}>
                Sending any other cryptocurrency to this address may result in the loss of your funds.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.historyContent}>
            <h3>Transaction History</h3>
            {loadingTransactions ? (
              <div className={styles.loading}>Loading transactions...</div>
            ) : (
              <div className={styles.historyList}>
                {transactionHistory.length > 0 ? (
                  transactionHistory.map(transaction => (
                    <div key={transaction.id} className={styles.historyItem}>
                      <div className={styles.transactionInfo}>
                        <div className={styles.transactionHeader}>
                          <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                            {transaction.type}
                          </span>
                          <span className={styles.transactionAmount}>
                            {transaction.amount} {transaction.crypto}
                          </span>
                        </div>
                        <div className={styles.transactionDetails}>
                          <span>
                            {transaction.type === 'sent' 
                              ? `To: ${transaction.to.substring(0, 10)}...` 
                              : `From: ${transaction.from.substring(0, 10)}...`}
                          </span>
                          <span>{transaction.date}</span>
                        </div>
                      </div>
                      <div className={styles.transactionStatus}>
                        <span className={`${styles.status} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No transactions found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <ChatSupport />
    </div>
  );
}