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
export const adminGetAllUsers = async (token) => {
  return handleAdminRequest(() => apiRequest('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

// Get user by ID (admin only)
export const adminGetUserById = async (userId, token) => {
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

// Update user balance (admin only)
export const adminUpdateUserBalance = async (userId, asset, amount, token) => {
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ asset, amount }),
  }));
};

// Get all transactions (admin only)
export const adminGetAllTransactions = async (token) => {
  return handleAdminRequest(() => apiRequest('/api/admin/transactions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

// Update transaction status (admin only)
export const adminUpdateTransactionStatus = async (transactionId, status, token) => {
  return handleAdminRequest(() => apiRequest(`/api/admin/transactions/${transactionId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  }));
};

// Suspend/activate user (admin only)
export const adminUpdateUserStatus = async (userId, action, token) => {
  return handleAdminRequest(() => apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  }));
};

// Get all gift cards (admin only)
export const adminGetAllGiftCards = async (token, page = 1, limit = 10) => {
  return handleAdminRequest(() => apiRequest(`/api/gift-cards?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

// Get gift card by ID (admin only)
export const adminGetGiftCardById = async (giftCardId, token) => {
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

// Create gift card (admin only)
export const adminCreateGiftCard = async (cardData, token) => {
  return handleAdminRequest(() => apiRequest('/api/gift-cards', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  }));
};

// Update gift card status (admin only)
export const adminUpdateGiftCardStatus = async (giftCardId, status, token) => {
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  }));
};

// Add balance to gift card (admin only)
export const adminAddGiftCardBalance = async (giftCardId, amount, token) => {
  return handleAdminRequest(() => apiRequest(`/api/gift-cards/${giftCardId}/add-balance`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  }));
};