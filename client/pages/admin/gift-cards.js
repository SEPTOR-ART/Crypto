import { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/Admin.module.css';
import { useAuth } from '../../context/AuthContext';
import { giftCardService } from '../../services/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function GiftCardManagement() {
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, isAdmin } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCard, setNewCard] = useState({
    balance: '',
    currency: 'USD',
    expiresAt: ''
  });

  const fetchGiftCards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await giftCardService.getAllGiftCards(token, page, 10);
      setGiftCards(response.giftCards);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      console.error('Failed to fetch gift cards:', err);
      if (err.message && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to load gift cards');
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) {
      fetchGiftCards();
    }
  }, [user, page, fetchGiftCards]);

  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [addAmount, setAddAmount] = useState('');

  const openAddBalance = (cardId) => {
    setSelectedCardId(cardId);
    setAddAmount('');
    setShowAddBalanceModal(true);
  };

  const closeAddBalance = () => {
    setShowAddBalanceModal(false);
    setSelectedCardId(null);
    setAddAmount('');
  };

  const handleCreateGiftCard = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const cardData = {
        balance: parseFloat(newCard.balance),
        currency: newCard.currency,
        expiresAt: newCard.expiresAt || undefined
      };
      
      const response = await giftCardService.createGiftCard(cardData, token);
      
      setSuccess(response.message);
      setShowCreateForm(false);
      setNewCard({
        balance: '',
        currency: 'USD',
        expiresAt: ''
      });
      
      // Refresh the gift cards list
      fetchGiftCards();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Failed to create gift card:', err);
      // Handle rate limit errors with user-friendly message
      if (err.message && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to create gift card');
      }
    }
  };

  const handleUpdateStatus = async (cardId, status) => {
    try {
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await giftCardService.updateGiftCardStatus(cardId, { status }, token);
      
      setSuccess('Gift card status updated successfully');
      
      // Refresh the gift cards list
      fetchGiftCards();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Failed to update gift card status:', err);
      setError(err.message || 'Failed to update gift card status');
    }
  };

  const handleAddBalance = async (cardId, amount) => {
    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const numeric = parseFloat(amount);
      if (isNaN(numeric) || numeric <= 0) {
        throw new Error('Please enter a valid positive amount');
      }
      await giftCardService.addGiftCardBalance(cardId, { amount: numeric }, token);
      
      setSuccess('Balance added successfully');
      
      // Refresh the gift cards list
      fetchGiftCards();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Failed to add balance:', err);
      setError(err.message || 'Failed to add balance');
    }
  };

  if (!user || !isAdmin(user)) {
    return (
      <ProtectedRoute requireAuth={true} requireAdmin={true}>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <div className={styles.container}>
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

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h2>Gift Card Management</h2>
            <button 
              className={styles.addButton}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create New Gift Card'}
            </button>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          {/* Create Gift Card Form */}
          {showCreateForm && (
            <div className={styles.createForm}>
              <h3>Create New Gift Card</h3>
              <form onSubmit={handleCreateGiftCard}>
                <div className={styles.formGroup}>
                  <label htmlFor="balance">Balance</label>
                  <input
                    type="number"
                    id="balance"
                    value={newCard.balance}
                    onChange={(e) => setNewCard({...newCard, balance: e.target.value})}
                    placeholder="Enter balance"
                    className={styles.formControl}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    value={newCard.currency}
                    onChange={(e) => setNewCard({...newCard, currency: e.target.value})}
                    className={styles.formControl}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="expiresAt">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    id="expiresAt"
                    value={newCard.expiresAt}
                    onChange={(e) => setNewCard({...newCard, expiresAt: e.target.value})}
                    className={styles.formControl}
                  />
                </div>
                
                <button type="submit" className={styles.submitButton}>
                  Create Gift Card
                </button>
              </form>
            </div>
          )}

          {/* Gift Cards List */}
          <div className={styles.tableContainer}>
            <h3>Gift Cards</h3>
            {loading ? (
              <div className={styles.loading}>Loading gift cards...</div>
            ) : giftCards.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No gift cards found.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Card Number</th>
                    <th>Balance</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Issued To</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {giftCards.map((card) => (
                    <tr key={card._id}>
                      <td>{card.cardNumber}</td>
                      <td>${card.balance.toFixed(2)}</td>
                      <td>{card.currency}</td>
                      <td>
                        <span className={`${styles.status} ${styles[card.status]}`}>
                          {card.status}
                        </span>
                      </td>
                      <td>
                        {card.issuedTo ? 
                          `${card.issuedTo.firstName} ${card.issuedTo.lastName}` : 
                          'Not issued'
                        }
                      </td>
                      <td>{new Date(card.createdAt).toLocaleDateString()}</td>
                      <td>
                        {card.expiresAt ? 
                          new Date(card.expiresAt).toLocaleDateString() : 
                          'Never'
                        }
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          {card.status === 'active' && (
                            <>
                              <button 
                                className={styles.dangerButton}
                                onClick={() => {
                                  if (confirm('Cancel this gift card? This action cannot be easily undone.')) {
                                    handleUpdateStatus(card._id, 'cancelled');
                                  }
                                }}
                              >
                                Cancel
                              </button>
                      <button 
                        className={styles.secondaryButton}
                        onClick={() => openAddBalance(card._id)}
                      >
                        Add Balance
                      </button>
                            </>
                          )}
                          {card.status === 'cancelled' && (
                            <button 
                              className={styles.successButton}
                              onClick={() => handleUpdateStatus(card._id, 'active')}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.paginationButton}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button 
                className={styles.paginationButton}
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {showAddBalanceModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="add-balance-title">
          <div className={styles.modal}>
            <h3 id="add-balance-title">Add Balance</h3>
            <div className={styles.formGroup}>
              <label htmlFor="add-amount">Amount</label>
              <input
                id="add-amount"
                type="number"
                step="0.01"
                min="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formActions}>
              <button 
                className={styles.saveButton}
                onClick={() => {
                  if (selectedCardId) {
                    handleAddBalance(selectedCardId, addAmount);
                    closeAddBalance();
                  }
                }}
              >
                Confirm
              </button>
              <button className={styles.cancelButton} onClick={closeAddBalance}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
