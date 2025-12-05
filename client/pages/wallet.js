import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState('transactions');
  const [filterType, setFilterType] = useState('all');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addressBook, setAddressBook] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [slowNetwork, setSlowNetwork] = useState(false);
  const { user, refreshUser } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);

  const walletBalances = useMemo(() => ([
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      balance: user?.balance?.BTC || 0, 
      value: (user?.balance?.BTC || 0) * (cryptoPrices.BTC || 45000),
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' 
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: user?.balance?.ETH || 0, 
      value: (user?.balance?.ETH || 0) * (cryptoPrices.ETH || 3000),
      address: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C' 
    },
    { 
      symbol: 'LTC', 
      name: 'Litecoin', 
      balance: user?.balance?.LTC || 0, 
      value: (user?.balance?.LTC || 0) * (cryptoPrices.LTC || 150),
      address: 'LZ1Q2W3E4R5T6Y7U8I9O0P1Q2W3E4R5T6Y7U8I9O0' 
    },
    { 
      symbol: 'XRP', 
      name: 'Ripple', 
      balance: user?.balance?.XRP || 0, 
      value: (user?.balance?.XRP || 0) * (cryptoPrices.XRP || 1.2),
      address: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV' 
    }
  ]), [user?.balance?.BTC, user?.balance?.ETH, user?.balance?.LTC, user?.balance?.XRP, cryptoPrices.BTC, cryptoPrices.ETH, cryptoPrices.LTC, cryptoPrices.XRP]);

  const transactionHistory = useMemo(() => transactions.map(transaction => ({
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
  })), [transactions]);

  const filteredHistory = useMemo(() => {
    return transactionHistory.filter(t => {
      const typeOk = filterType === 'all' || t.type === filterType;
      const assetOk = filterAsset === 'all' || t.crypto === filterAsset;
      const statusOk = filterStatus === 'all' || t.status === filterStatus;
      return typeOk && assetOk && statusOk;
    });
  }, [transactionHistory, filterType, filterAsset, filterStatus]);

  // Fetch user transactions
  useEffect(() => {
    mountedRef.current = true;
    const fetchTransactions = async () => {
      if (!user) return;
      
      let slowTimer;
      try {
        setLoading(true);
        setError('');
        setSlowNetwork(false);
        slowTimer = setTimeout(() => {
          if (mountedRef.current) setSlowNetwork(true);
        }, 5000);
        
        const userTransactions = await transactionService.getUserTransactions();
        if (mountedRef.current) {
          setTransactions(userTransactions);
          setSlowNetwork(false);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        if (mountedRef.current) setError(err.message || 'Failed to load transactions');
      } finally {
        if (slowTimer) clearTimeout(slowTimer);
        if (mountedRef.current) setLoading(false);
      }
    };
    
    fetchTransactions();
    
    // Set up interval for real-time updates
    intervalRef.current = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (user) {
        try {
          const userTransactions = await transactionService.getUserTransactions();
          if (mountedRef.current) setTransactions(userTransactions);
          await refreshUser();
        } catch (err) {
          console.error('Failed to refresh transactions:', err);
          // If we hit rate limits, increase the interval temporarily
          if (err.message && err.message.includes('429')) {
            console.log('Rate limit hit, increasing refresh interval');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            // Increase interval to 2 minutes when rate limited
            intervalRef.current = setInterval(async () => {
              if (typeof document !== 'undefined' && document.hidden) return;
              if (user) {
                try {
                  const userTransactions = await transactionService.getUserTransactions();
                  if (mountedRef.current) setTransactions(userTransactions);
                  await refreshUser();
                } catch (err) {
                  console.error('Failed to refresh transactions:', err);
                }
              }
            }, 120000); // Refresh every 2 minutes when rate limited
          }
        }
      }
    }, 60000); // Refresh every 60 seconds instead of 30 seconds
    
    // Clean up interval
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshUser]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('address_book') : null;
      if (raw) setAddressBook(JSON.parse(raw));
    } catch {}
  }, []);

  const saveAddressBook = (next) => {
    setAddressBook(next);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('address_book', JSON.stringify(next));
    } catch {}
  };

  const addAddress = () => {
    if (!newLabel.trim() || !newAddress.trim()) return;
    const next = [...addressBook, { id: Date.now(), label: newLabel.trim(), address: newAddress.trim() }];
    setNewLabel('');
    setNewAddress('');
    saveAddressBook(next);
  };

  const removeAddress = (id) => {
    const next = addressBook.filter(a => a.id !== id);
    saveAddressBook(next);
  };

  // Show loading state
  if (loading && transactions.length === 0) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.walletHeader}>
            <h1>Wallet</h1>
            <p>Manage your cryptocurrency assets securely</p>
          </div>
          <div className={styles.loading}>Loading wallet data...</div>
        </div>
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

  

  const isValidAddress = (asset, address) => {
    if (!address || typeof address !== 'string') return false;
    if (asset === 'ETH') return address.startsWith('0x') && address.length === 42;
    if (asset === 'BTC') return address.length >= 26 && address.length <= 42;
    if (asset === 'LTC') return address.length >= 26 && address.length <= 42;
    if (asset === 'XRP') return address.length >= 25 && address.length <= 35;
    return address.length >= 10;
  };

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
        throw new Error(`Insufficient ${selectedCrypto} balance. You have ${userBalance.toFixed(6)} ${selectedCrypto}`);
      }

      if (!isValidAddress(selectedCrypto, sendAddress)) {
        throw new Error(`Invalid ${selectedCrypto} address format`);
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
    const val = Number(wallet.value) || 0;
    return total + val;
  }, 0);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        <div className={styles.walletHeader}>
          <h1>Wallet</h1>
          <p>Manage your cryptocurrency assets securely</p>
        </div>

        {error && <div className={styles.errorMessage} role="status" aria-live="polite">{error}</div>}
        {success && <div className={styles.successMessage} role="status" aria-live="polite">Transaction sent successfully!</div>}

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
            {pricesLoading && (
              <div className={styles.balanceInfo}>Loading live prices...</div>
            )}
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
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'transactions' ? styles.activeTab : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</button>
          <button className={`${styles.tab} ${activeTab === 'deposit' ? styles.activeTab : ''}`} onClick={() => setActiveTab('deposit')}>Deposit</button>
          <button className={`${styles.tab} ${activeTab === 'send' ? styles.activeTab : ''}`} onClick={() => setActiveTab('send')}>Send</button>
          <button className={`${styles.tab} ${activeTab === 'address-book' ? styles.activeTab : ''}`} onClick={() => setActiveTab('address-book')}>Address Book</button>
        </div>

        {/* Send Form */}
        {activeTab === 'send' && (
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
                ≈ ${((parseFloat(sendAmount) || 0) * (cryptoPrices[selectedCrypto] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={styles.balanceInfo}>
                Available: {(user.balance?.[selectedCrypto] || 0).toFixed(6)} {selectedCrypto}
              </div>
              <button type="button" className={styles.copyButton} onClick={() => setSendAmount(String(user.balance?.[selectedCrypto] || 0))}>
                Max
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
                className={styles.input}
              />
            </div>
            
            <button type="submit" className={styles.sendButton} disabled={pricesLoading}>
              Send {selectedCrypto}
            </button>
          </form>
        </div>
        )}

        {/* Deposit */}
        {activeTab === 'deposit' && (
          <div className={styles.transactionHistory}>
            <div className={styles.sectionHeader}>
              <h2>Deposit {selectedWallet?.symbol}</h2>
              <div className={styles.balanceInfo}>Use the address below to deposit {selectedWallet?.symbol}.</div>
            </div>
            <div className={styles.walletDetails}>
              <div className={styles.walletInfo}>
                <div className={styles.infoRow}>
                  <span>Address</span>
                  <div className={styles.addressContainer}>
                    <span className={styles.address}>{selectedWallet?.address}</span>
                    <button className={styles.copyButton} onClick={() => copyToClipboard(selectedWallet?.address || '')}>Copy</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        {activeTab === 'transactions' && (
        <div className={styles.transactionHistory}>
          <div className={styles.sectionHeader}>
            <h2>Transaction History</h2>
            <Link href="/dashboard" className={styles.viewAllButton}>View Dashboard</Link>
          </div>
          <div className={styles.filters}>
            <select value={filterType} onChange={(e)=>setFilterType(e.target.value)} className={styles.filterSelect}>
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="send">Send</option>
            </select>
            <select value={filterAsset} onChange={(e)=>setFilterAsset(e.target.value)} className={styles.filterSelect}>
              <option value="all">All Assets</option>
              {walletBalances.map(w=> (
                <option key={w.symbol} value={w.symbol}>{w.symbol}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className={styles.filterSelect}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {slowNetwork && (
            <div className={styles.loading}>Slow network detected. Still loading latest transactions...</div>
          )}
          
          {loading && transactions.length > 0 ? (
            <div className={styles.loading}>Refreshing transactions...</div>
          ) : filteredHistory.length > 0 ? (
            <div className={styles.transactionsList}>
              {filteredHistory.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionInfo}>
                    <span className={`${styles.transactionType} ${transaction.type === 'send' ? styles.sent : styles.received}`}>
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
                    <span>To: {(transaction.to || 'N/A').slice(0, 10)}...</span>
                  </div>
                  <div className={styles.transactionStatus}>
                    <span className={`${styles.statusBadge} ${transaction.status === 'completed' ? styles.completed : transaction.status === 'pending' ? styles.pending : styles.failed}`}>
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
        )}

        {activeTab === 'address-book' && (
          <div className={styles.transactionHistory}>
            <div className={styles.sectionHeader}>
              <h2>Address Book</h2>
            </div>
            <div className={styles.sendForm}>
              <div className={styles.formGroup}>
                <label>Label</label>
                <input type="text" value={newLabel} onChange={(e)=>setNewLabel(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input type="text" value={newAddress} onChange={(e)=>setNewAddress(e.target.value)} className={styles.input} />
              </div>
              <button type="button" className={styles.sendButton} onClick={addAddress}>Add</button>
            </div>
            <div className={styles.transactionsList}>
              {addressBook.length === 0 ? (
                <div className={styles.emptyState}><p>No saved addresses.</p></div>
              ) : (
                addressBook.map(entry => (
                  <div key={entry.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionCrypto}>{entry.label}</span>
                    </div>
                    <div className={styles.transactionAddress}>
                      <span>{entry.address}</span>
                    </div>
                    <div className={styles.transactionStatus}>
                      <button className={styles.copyButton} onClick={() => setSendAddress(entry.address)}>Use</button>
                      <button className={styles.copyButton} onClick={() => removeAddress(entry.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
