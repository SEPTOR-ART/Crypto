import { useState, useEffect } from 'react';
import styles from '../styles/Admin.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { 
  adminGetAllUsers, 
  adminGetUserById, 
  adminUpdateUserBalance,
  adminGetAllTransactions,
  adminUpdateTransactionStatus,
  adminUpdateUserStatus,
  adminGetAllGiftCards
} from '../services/adminService';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceUpdate, setBalanceUpdate] = useState({ asset: 'BTC', amount: 0 });
  const { user, loading: authLoading, refreshUser, isAdmin } = useAuth();
  const router = useRouter();

  // Load admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load users and transactions
      const [usersData, transactionsData, giftCardsData] = await Promise.all([
        adminGetAllUsers(),
        adminGetAllTransactions(),
        adminGetAllGiftCards(1, 100) // Get first 100 gift cards for stats
      ]);
      
      setUsers(usersData);
      setTransactions(transactionsData);
      
      // Calculate gift card stats
      if (giftCardsData && giftCardsData.giftCards) {
        const activeGiftCards = giftCardsData.giftCards.filter(card => card.status === 'active').length;
        const totalIssuedValue = giftCardsData.giftCards.reduce((total, card) => total + card.initialBalance, 0);
        const redeemedCards = giftCardsData.giftCards.filter(card => card.status === 'used').length;
        
        // Store these stats in state or use them directly in the render
        // For now, we'll just log them
        console.log('Gift card stats:', { activeGiftCards, totalIssuedValue, redeemedCards });
      }
    } catch (err) {
      // Handle rate limit errors with user-friendly message
      if (err.message && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to load admin data: ' + err.message);
      }
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load user details when selected
  const loadUserDetails = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      const userDetails = await adminGetUserById(userId);
      setSelectedUser(userDetails);
      
      // Initialize balance update form with first asset
      if (userDetails.balance && Object.keys(userDetails.balance).length > 0) {
        const firstAsset = Object.keys(userDetails.balance)[0];
        setBalanceUpdate({
          asset: firstAsset,
          amount: userDetails.balance[firstAsset]
        });
      } else {
        setBalanceUpdate({ asset: 'BTC', amount: 0 });
      }
    } catch (err) {
      // Handle rate limit errors with user-friendly message
      if (err.message && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to load user details: ' + err.message);
      }
      console.error('User details load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user balance
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!selectedUser) {
        throw new Error('No user selected');
      }
      
      await adminUpdateUserBalance(
        selectedUser._id, 
        balanceUpdate.asset, 
        parseFloat(balanceUpdate.amount)
      );
      
      setSuccess('User balance updated successfully');
      
      // Reload user details
      await loadUserDetails(selectedUser._id);
      
      // Reload all users to reflect changes
      await loadAdminData();
      
      setEditingBalance(false);
    } catch (err) {
      setError('Failed to update user balance: ' + err.message);
      console.error('Balance update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle user action
  const handleUserAction = async (userId, action) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      switch (action) {
        case 'view':
          await loadUserDetails(userId);
          break;
        case 'suspend':
        case 'activate':
          await adminUpdateUserStatus(userId, action);
          setSuccess(`User ${action}ed successfully`);
          // Reload users to reflect changes
          await loadAdminData();
          break;
        default:
          break;
      }
    } catch (err) {
      setError('Failed to perform user action: ' + err.message);
      console.error('User action error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction action
  const handleTransactionAction = async (transactionId, action) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      switch (action) {
        case 'approve':
          await adminUpdateTransactionStatus(transactionId, 'completed');
          setSuccess('Transaction approved successfully');
          break;
        case 'reject':
          await adminUpdateTransactionStatus(transactionId, 'failed');
          setSuccess('Transaction rejected successfully');
          break;
        default:
          break;
      }
      
      // Reload transactions to reflect changes
      await loadAdminData();
    } catch (err) {
      setError('Failed to perform transaction action: ' + err.message);
      console.error('Transaction action error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total platform volume
  const platformVolume = transactions.reduce((total, transaction) => {
    if (transaction.status === 'completed') {
      return total + transaction.total;
    }
    return total;
  }, 0);

  // Refresh admin data periodically
  useEffect(() => {
    // Clear any existing interval
    let intervalId;
    
    const startInterval = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      const refreshData = async () => {
        try {
          await loadAdminData();
        } catch (error) {
          console.error('Failed to refresh admin data:', error);
          // Handle rate limit errors specifically
          if (error.message && error.message.includes('429')) {
            console.log('Rate limit hit, extending refresh interval');
            // Extend the interval when rate limited
            clearInterval(intervalId);
            intervalId = setInterval(refreshData, 600000); // 10 minutes when rate limited
          }
        }
      };
      
      // Refresh every 5 minutes (increased from 1 minute to reduce API load)
      intervalId = setInterval(refreshData, 300000);
    };
    
    // Load initial data
    loadAdminData().catch(console.error);
    startInterval();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  
  // Refresh user profile periodically to ensure admin status is up to date
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
            intervalId = setInterval(refreshProfile, 600000); // 10 minutes when rate limited
          }
        }
      };
      
      // Refresh profile every 5 minutes (increased from 60 seconds)
      intervalId = setInterval(refreshProfile, 300000);
    };
    
    startInterval();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, refreshUser]);

  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <div className={styles.container}>
        {/* Header with Navigation */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <h1>CryptoZen Admin</h1>
          </div>
          <nav className={styles.nav}>
            <Link href="/admin" className={styles.navLink}>Dashboard</Link>
            <Link href="/admin/users" className={styles.navLink}>Users</Link>
            <Link href="/admin/transactions" className={styles.navLink}>Transactions</Link>
            <Link href="/admin/gift-cards" className={styles.navLink}>Gift Cards</Link>
          </nav>
        </header>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Stats Overview */}
        <div className={styles.statsOverview}>
          <div className={styles.statCard}>
            <h3>Total Users</h3>
            <p className={styles.statValue}>{users.length}</p>
            <div className={styles.statChange}>+12% last 30 days</div>
          </div>
          
          <div className={styles.statCard}>
            <h3>Active Users</h3>
            <p className={styles.statValue}>{users.filter(u => !u.isSuspended).length}</p>
            <div className={styles.statChange}>+8% last 30 days</div>
          </div>
          
          <div className={styles.statCard}>
            <h3>Transactions</h3>
            <p className={styles.statValue}>{transactions.length}</p>
            <div className={styles.statChange}>+15% last 30 days</div>
          </div>
          
          <div className={styles.statCard}>
            <h3>Platform Volume</h3>
            <p className={styles.statValue}>${platformVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className={styles.statChange}>+22% last 30 days</div>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'transactions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'giftcards' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('giftcards')}
          >
            Gift Cards
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Platform Settings
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'reports' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'support' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('support')}
          >
            Support Chat
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'users' && (
            <div className={styles.usersContent}>
              <div className={styles.contentHeader}>
                <h2>User Management</h2>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button className={styles.searchButton}>Search</button>
                </div>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Member Since</th>
                      <th>Status</th>
                      <th>KYC Status</th>
                      <th>Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.avatar}>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                            <span>{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${user.isSuspended ? styles.suspended : styles.active}`}>
                            {user.isSuspended ? 'suspended' : 'active'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.kycBadge} ${styles[user.kycStatus?.replace(' ', '') || 'notstarted']}`}>
                            {user.kycStatus || 'not started'}
                          </span>
                        </td>
                        <td>
                          {user.balance ? Object.entries(user.balance).map(([asset, amount]) => (
                            <div key={asset}>{amount.toFixed(6)} {asset}</div>
                          )) : '$0.00'}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button 
                              className={styles.viewButton}
                              onClick={() => handleUserAction(user._id, 'view')}
                            >
                              View
                            </button>
                            <button 
                              className={user.isSuspended ? styles.activateButton : styles.suspendButton}
                              onClick={() => handleUserAction(user._id, user.isSuspended ? 'activate' : 'suspend')}
                            >
                              {user.isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* User Detail View */}
              {selectedUser && (
                <div className={styles.userDetail}>
                  <div className={styles.detailHeader}>
                    <h3>User Details: {selectedUser.firstName} {selectedUser.lastName}</h3>
                    <button 
                      className={styles.closeButton}
                      onClick={() => setSelectedUser(null)}
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className={styles.detailContent}>
                    <div className={styles.detailSection}>
                      <h4>Personal Information</h4>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Email:</span>
                          <span>{selectedUser.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Phone:</span>
                          <span>{selectedUser.phone || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Member Since:</span>
                          <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>KYC Status:</span>
                          <span className={styles[selectedUser.kycStatus?.replace(' ', '') || 'notstarted']}>
                            {selectedUser.kycStatus || 'not started'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.detailSection}>
                      <h4>Wallet Balances</h4>
                      <div className={styles.balanceGrid}>
                        {selectedUser.balance && Object.keys(selectedUser.balance).length > 0 ? (
                          Object.entries(selectedUser.balance).map(([asset, amount]) => (
                            <div key={asset} className={styles.balanceItem}>
                              <span className={styles.assetName}>{asset}</span>
                              <span className={styles.assetAmount}>{amount.toFixed(6)}</span>
                            </div>
                          ))
                        ) : (
                          <p>No balances found</p>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.detailSection}>
                      <h4>Update Balance</h4>
                      {editingBalance ? (
                        <form onSubmit={handleUpdateBalance} className={styles.balanceForm}>
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label>Asset</label>
                              <select
                                value={balanceUpdate.asset}
                                onChange={(e) => setBalanceUpdate({...balanceUpdate, asset: e.target.value})}
                                className={styles.formControl}
                              >
                                <option value="BTC">BTC</option>
                                <option value="ETH">ETH</option>
                                <option value="LTC">LTC</option>
                                <option value="XRP">XRP</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Amount</label>
                              <input
                                type="number"
                                step="0.000001"
                                value={balanceUpdate.amount}
                                onChange={(e) => setBalanceUpdate({...balanceUpdate, amount: e.target.value})}
                                className={styles.formControl}
                                required
                              />
                            </div>
                          </div>
                          <div className={styles.formActions}>
                            <button type="submit" className={styles.saveButton}>Save</button>
                            <button 
                              type="button" 
                              className={styles.cancelButton}
                              onClick={() => setEditingBalance(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          className={styles.editButton}
                          onClick={() => setEditingBalance(true)}
                        >
                          Edit Balance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className={styles.transactionsContent}>
              <div className={styles.contentHeader}>
                <h2>Transaction Management</h2>
                <div className={styles.filters}>
                  <select className={styles.filterSelect}>
                    <option>All Types</option>
                    <option>Buy</option>
                    <option>Sell</option>
                  </select>
                  <select className={styles.filterSelect}>
                    <option>All Statuses</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Failed</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.transactionsTable}>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction._id}>
                        <td>#{transaction._id.substring(0, 8)}</td>
                        <td>{transaction.userId?.firstName} {transaction.userId?.lastName}</td>
                        <td>
                          <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.asset}</td>
                        <td>{transaction.amount} {transaction.asset}</td>
                        <td>${transaction.price.toFixed(2)}</td>
                        <td>${transaction.total.toFixed(2)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            {transaction.status === 'pending' && (
                              <>
                                <button 
                                  className={styles.approveButton}
                                  onClick={() => handleTransactionAction(transaction._id, 'approve')}
                                >
                                  Approve
                                </button>
                                <button 
                                  className={styles.rejectButton}
                                  onClick={() => handleTransactionAction(transaction._id, 'reject')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'giftcards' && (
            <div className={styles.giftCardsContent}>
              <div className={styles.contentHeader}>
                <h2>Gift Card Management</h2>
                <p>Manage gift cards and view transaction history</p>
              </div>
              
              <div className={styles.infoBox}>
                <h3>Gift Card Management</h3>
                <p>Use the dedicated gift card management page for full functionality:</p>
                <Link href="/admin/gift-cards" className={styles.primaryButton}>
                  Go to Gift Card Management
                </Link>
              </div>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Active Gift Cards</h3>
                  <p className={styles.statValue}>0</p>
                  <div className={styles.statChange}>+0% last 30 days</div>
                </div>
                
                <div className={styles.statCard}>
                  <h3>Total Issued Value</h3>
                  <p className={styles.statValue}>$0.00</p>
                  <div className={styles.statChange}>+0% last 30 days</div>
                </div>
                
                <div className={styles.statCard}>
                  <h3>Redeemed Cards</h3>
                  <p className={styles.statValue}>0</p>
                  <div className={styles.statChange}>+0% last 30 days</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.settingsContent}>
              <h2>Platform Settings</h2>
              
              <div className={styles.settingsSection}>
                <h3>Security Settings</h3>
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h4>Two-Factor Authentication</h4>
                      <p>Require 2FA for all admin accounts</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h4>IP Whitelisting</h4>
                      <p>Restrict admin access to specific IP addresses</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={styles.settingsSection}>
                <h3>Trading Settings</h3>
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h4>Maintenance Mode</h4>
                      <p>Temporarily disable trading for maintenance</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h4>Withdrawal Limits</h4>
                      <p>Set daily withdrawal limits for users</p>
                    </div>
                    <button className={styles.editButton}>Configure</button>
                  </div>
                </div>
              </div>
              
              <div className={styles.settingsSection}>
                <h3>User Management</h3>
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h4>Email Verification</h4>
                      <p>Require email verification for new accounts</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h4>Account Lockout</h4>
                      <p>Lock accounts after 5 failed login attempts</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className={styles.reportsContent}>
              <h2>Reports & Analytics</h2>
              
              <div className={styles.reportCards}>
                <div className={styles.reportCard}>
                  <h3>User Activity Report</h3>
                  <p>View user login patterns and activity metrics</p>
                  <button className={styles.generateButton}>Generate Report</button>
                </div>
                
                <div className={styles.reportCard}>
                  <h3>Financial Report</h3>
                  <p>Generate revenue and transaction volume reports</p>
                  <button className={styles.generateButton}>Generate Report</button>
                </div>
                
                <div className={styles.reportCard}>
                  <h3>Compliance Report</h3>
                  <p>Export KYC and transaction compliance data</p>
                  <button className={styles.generateButton}>Generate Report</button>
                </div>
                
                <div className={styles.reportCard}>
                  <h3>System Performance</h3>
                  <p>Monitor platform uptime and performance metrics</p>
                  <button className={styles.generateButton}>Generate Report</button>
                </div>
              </div>
              
              <div className={styles.reportFilters}>
                <h3>Custom Report</h3>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <label>Date Range</label>
                    <input type="date" className={styles.dateInput} />
                    <span>to</span>
                    <input type="date" className={styles.dateInput} />
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Report Type</label>
                    <select className={styles.filterSelect}>
                      <option>User Activity</option>
                      <option>Financial</option>
                      <option>Compliance</option>
                      <option>Performance</option>
                    </select>
                  </div>
                  <button className={styles.generateButton}>Generate</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className={styles.supportContent}>
              <h2>Support Chat</h2>
              <div className={styles.chatContainer}>
                <div className={styles.chatMessages}>
                  <div className={`${styles.message}`}>
                    <div className={styles.messageHeader}>
                      <span className={styles.userName}>John Doe</span>
                      <span className={styles.timestamp}>2025-11-20 14:30</span>
                    </div>
                    <div className={styles.messageContent}>
                      I&apos;m having trouble with my withdrawal. It&apos;s been pending for over 24 hours.
                    </div>
                  </div>
                  <div className={`${styles.message} ${styles.admin}`}>
                    <div className={styles.messageHeader}>
                      <span className={styles.userName}>Admin</span>
                      <span className={styles.timestamp}>2025-11-20 14:32</span>
                    </div>
                    <div className={styles.messageContent}>
                      Hello John, I can see your withdrawal request. Let me check the status for you.
                    </div>
                  </div>
                </div>
                <div className={styles.chatInput}>
                  <input type="text" placeholder="Type your message..." className={styles.messageInput} />
                  <button className={styles.sendButton}>Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}
