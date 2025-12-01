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
    // Handle CSRF validation errors specifically
    if (error.message && error.message.includes('CSRF validation failed')) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    throw error;
  }
};

// Get all users (admin only)
export const adminGetAllUsers = async () => {
  return handleAdminRequest(() => apiRequest('/api/admin/users'));
};

// Get user by ID (admin only)
export const adminGetUserById = async (userId) => {
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}`));
};

// Update user balance (admin only)
export const adminUpdateUserBalance = async (userId, asset, amount) => {
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
  return handleAdminRequest(() => apiRequest('/api/admin/transactions'));
};

// Update transaction status (admin only)
export const adminUpdateTransactionStatus = async (transactionId, status) => {
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
  return handleAdminRequest(() => apiRequest(`/api/gift-cards?page=${page}&limit=${limit}`));
};

// Get gift card by ID (admin only)
export const adminGetGiftCardById = async (giftCardId) => {
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}`));
};

// Create gift card (admin only)
export const adminCreateGiftCard = async (cardData) => {
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
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}/add-balance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  }));
};