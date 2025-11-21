import { useState, useEffect } from 'react';
import styles from '../styles/Admin.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.email !== 'admin@cryptozen.com') {
        router.push('/dashboard');
      } else {
        // Load admin data
        loadAdminData();
      }
    }
  }, [user, authLoading, router]);

  // Load admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, these would be API calls
      // For now, we'll use mock data
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', kyc: 'verified', balance: 12500, createdAt: '2025-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', kyc: 'pending', balance: 8750, createdAt: '2025-02-20' },
        { id: 3, name: 'Robert Johnson', email: 'robert@example.com', status: 'suspended', kyc: 'verified', balance: 32000, createdAt: '2025-03-10' },
        { id: 4, name: 'Emily Davis', email: 'emily@example.com', status: 'active', kyc: 'not started', balance: 5400, createdAt: '2025-04-05' },
        { id: 5, name: 'Michael Wilson', email: 'michael@example.com', status: 'inactive', kyc: 'verified', balance: 18900, createdAt: '2025-05-12' }
      ];
      
      const mockTransactions = [
        { id: 1, user: 'John Doe', type: 'buy', crypto: 'BTC', amount: 0.5, status: 'completed', date: '2025-11-15', price: 45000 },
        { id: 2, user: 'Jane Smith', type: 'sell', crypto: 'ETH', amount: 2, status: 'pending', date: '2025-11-14', price: 3000 },
        { id: 3, user: 'Robert Johnson', type: 'buy', crypto: 'LTC', amount: 10, status: 'completed', date: '2025-11-13', price: 150 },
        { id: 4, user: 'Emily Davis', type: 'buy', crypto: 'XRP', amount: 500, status: 'failed', date: '2025-11-12', price: 1.2 }
      ];
      
      setUsers(mockUsers);
      setTransactions(mockTransactions);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
  }

  // Check if user is admin
  if (user.email !== 'admin@cryptozen.com') {
    return null;
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (userId, action) => {
    console.log(`Performing ${action} on user ${userId}`);
    // In a real app, this would make an API call
    switch (action) {
      case 'view':
        // View user details
        alert(`Viewing details for user ${userId}`);
        break;
      case 'edit':
        // Edit user details
        alert(`Editing user ${userId}`);
        break;
      case 'suspend':
        // Suspend user
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, status: user.status === 'suspended' ? 'active' : 'suspended' }
            : user
        ));
        break;
      case 'delete':
        // Delete user
        if (window.confirm('Are you sure you want to delete this user?')) {
          setUsers(users.filter(user => user.id !== userId));
        }
        break;
      default:
        break;
    }
  };

  const handleTransactionAction = (transactionId, action) => {
    console.log(`Performing ${action} on transaction ${transactionId}`);
    // In a real app, this would make an API call
    switch (action) {
      case 'view':
        // View transaction details
        alert(`Viewing details for transaction ${transactionId}`);
        break;
      case 'approve':
        // Approve transaction
        setTransactions(transactions.map(transaction => 
          transaction.id === transactionId 
            ? { ...transaction, status: 'completed' }
            : transaction
        ));
        break;
      case 'reject':
        // Reject transaction
        setTransactions(transactions.map(transaction => 
          transaction.id === transactionId 
            ? { ...transaction, status: 'failed' }
            : transaction
        ));
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Manage users, transactions, and platform settings</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Stats Overview */}
      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <p className={styles.statValue}>{users.length}</p>
          <div className={styles.statChange}>+12% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Active Users</h3>
          <p className={styles.statValue}>{users.filter(u => u.status === 'active').length}</p>
          <div className={styles.statChange}>+8% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Transactions</h3>
          <p className={styles.statValue}>{transactions.length}</p>
          <div className={styles.statChange}>+15% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Platform Volume</h3>
          <p className={styles.statValue}>$12.5M</p>
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
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>{user.name.charAt(0)}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.createdAt}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.kycBadge} ${styles[user.kyc.replace(' ', '')]}`}>
                          {user.kyc}
                        </span>
                      </td>
                      <td>${user.balance.toLocaleString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewButton}
                            onClick={() => handleUserAction(user.id, 'view')}
                          >
                            View
                          </button>
                          <button 
                            className={styles.editButton}
                            onClick={() => handleUserAction(user.id, 'edit')}
                          >
                            Edit
                          </button>
                          <button 
                            className={user.status === 'suspended' ? styles.activateButton : styles.suspendButton}
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          <button 
                            className={styles.deleteButton}
                            onClick={() => handleUserAction(user.id, 'delete')}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <tr key={transaction.id}>
                      <td>#{transaction.id}</td>
                      <td>{transaction.user}</td>
                      <td>
                        <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.crypto}</td>
                      <td>{transaction.amount} {transaction.crypto}</td>
                      <td>${transaction.price}</td>
                      <td>${(transaction.amount * transaction.price).toFixed(2)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewButton}
                            onClick={() => handleTransactionAction(transaction.id, 'view')}
                          >
                            View
                          </button>
                          {transaction.status === 'pending' && (
                            <>
                              <button 
                                className={styles.approveButton}
                                onClick={() => handleTransactionAction(transaction.id, 'approve')}
                              >
                                Approve
                              </button>
                              <button 
                                className={styles.rejectButton}
                                onClick={() => handleTransactionAction(transaction.id, 'reject')}
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
                    I'm having trouble with my withdrawal. It's been pending for over 24 hours.
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
  );
}