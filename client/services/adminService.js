// Admin service for interacting with the admin backend API

import { apiRequest } from './api';

// Wrapper function to handle rate limit errors
const handleAdminRequest = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    // Re-throw rate limit errors with user-friendly message
    if (error.message && error.message.includes('429')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    throw error;
  }
};

// Get all users (admin only)
export const adminGetAllUsers = async () => {
  console.log('Fetching all users for admin');
  return handleAdminRequest(() => apiRequest('/api/admin/users'));
};

// Get user by ID (admin only)
export const adminGetUserById = async (userId) => {
  console.log('Fetching user by ID for admin:', userId);
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}`));
};

// Update user balance (admin only)
export const adminUpdateUserBalance = async (userId, asset, amount) => {
  console.log('Updating user balance for admin:', userId, asset, amount);
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ asset, amount }),
  }));
};

// Get all transactions (admin only)
export const adminGetAllTransactions = async () => {
  console.log('Fetching all transactions for admin');
  return handleAdminRequest(() => apiRequest('/api/admin/transactions'));
};

// Update transaction status (admin only)
export const adminUpdateTransactionStatus = async (transactionId, status) => {
  console.log('Updating transaction status for admin:', transactionId, status);
  return handleAdminRequest(() => apiRequest(`/api/admin/transactions/${transactionId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  }));
};

// Suspend/activate user (admin only)
export const adminUpdateUserStatus = async (userId, action) => {
  console.log('Updating user status for admin:', userId, action);
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  }));
};

// Get all gift cards (admin only)
export const adminGetAllGiftCards = async (page = 1, limit = 10) => {
  console.log('Fetching all gift cards for admin:', page, limit);
  return handleAdminRequest(() => apiRequest(`/api/gift-cards?page=${page}&limit=${limit}`));
};

// Get gift card by ID (admin only)
export const adminGetGiftCardById = async (giftCardId) => {
  console.log('Fetching gift card by ID for admin:', giftCardId);
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}`));
};

// Create gift card (admin only)
export const adminCreateGiftCard = async (cardData) => {
  console.log('Creating gift card for admin:', cardData);
  return handleAdminRequest(() => apiRequest('/api/gift-cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  }));
};

// Update gift card status (admin only)
export const adminUpdateGiftCardStatus = async (giftCardId, status) => {
  console.log('Updating gift card status for admin:', giftCardId, status);
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  }));
};

// Add balance to gift card (admin only)
export const adminAddGiftCardBalance = async (giftCardId, amount) => {
  console.log('Adding balance to gift card for admin:', giftCardId, amount);
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}/add-balance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  }));
};