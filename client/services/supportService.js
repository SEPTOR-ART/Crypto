import { apiRequest } from './api';

const handleSupportRequest = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    if (error.message && error.message.includes('429')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (error.message && error.message.includes('CSRF validation failed')) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    throw error;
  }
};

export const createSupportMessage = async ({ text, subject }) => {
  return handleSupportRequest(() => apiRequest('/api/support/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, subject })
  }));
};

export const getMySupportMessages = async () => {
  return handleSupportRequest(() => apiRequest('/api/support/my'));
};

// Admin APIs
export const adminListSupportMessages = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return handleSupportRequest(() => apiRequest(`/api/support/${qs}`));
};

export const adminUpdateSupportStatus = async (id, status) => {
  return handleSupportRequest(() => apiRequest(`/api/support/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }));
};

export const adminReplySupportMessage = async (id, text) => {
  return handleSupportRequest(() => apiRequest(`/api/support/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  }));
};
