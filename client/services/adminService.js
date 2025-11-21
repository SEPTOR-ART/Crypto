// Admin service for interacting with the admin backend API

import { apiRequest } from './api';

// Get all users (admin only)
export const adminGetAllUsers = async (token) => {
  return apiRequest('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get user by ID (admin only)
export const adminGetUserById = async (userId, token) => {
  return apiRequest(`/api/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Update user balance (admin only)
export const adminUpdateUserBalance = async (userId, asset, amount, token) => {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ asset, amount }),
  });
};

// Get all transactions (admin only)
export const adminGetAllTransactions = async (token) => {
  return apiRequest('/api/admin/transactions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Update transaction status (admin only)
export const adminUpdateTransactionStatus = async (transactionId, status, token) => {
  return apiRequest(`/api/admin/transactions/${transactionId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
};

// Suspend/activate user (admin only)
export const adminUpdateUserStatus = async (userId, action, token) => {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });
};