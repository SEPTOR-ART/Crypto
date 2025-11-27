// API service for interacting with the backend

const RAW_API = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const RAW_WS = process.env.NEXT_PUBLIC_WS_BASE_URL || '';
const isPlaceholder = /your-render-app-name/.test(RAW_API) || RAW_API === '';
const isPlaceholderWS = /your-render-app-name/.test(RAW_WS) || RAW_WS === '';

// In-flight and rate limit caches to reduce duplicate requests
const inflightRequests = new Map();
const lastResponses = new Map();
const rateLimits = {
  '/api/users/profile': 10000,
  '/api/transactions': 10000,
  '/api/admin/users': 10000,
  '/api/admin/transactions': 10000,
  '/api/gift-cards': 10000,
};
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Helper function to make API requests
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // For relative paths in development or when no base URL is set, construct the full URL
    let url;
    if (typeof window !== 'undefined') {
      // In browser environment
      if (isPlaceholder || RAW_API === '') {
        // If we're in development or no API URL is set, construct from current origin
        if (endpoint.startsWith('/')) {
          // For relative API endpoints, construct full URL
          url = `${window.location.origin}${endpoint}`;
        } else {
          // For absolute endpoints, use as is
          url = endpoint;
        }
      } else {
        // Production environment with explicit API URL
        url = `${RAW_API}${endpoint}`;
      }
    } else {
      // Server-side environment (for SSR)
      if (isPlaceholder || RAW_API === '') {
        // Default to localhost in development
        url = `http://localhost:5000${endpoint}`;
      } else {
        url = `${RAW_API}${endpoint}`;
      }
    }
    
    const method = (options.method || 'GET').toUpperCase();
    const key = `${method} ${url}`;

    // Basic Authorization guard: avoid server hit when token is missing
    const authHeader = options.headers?.Authorization || options.headers?.authorization;
    if (authHeader && /Bearer\s*($|undefined|null)/i.test(authHeader)) {
      throw new Error('Not authorized, no token');
    }

    // Rate limit specific endpoints and return cached response when available
    const rateMs = rateLimits[endpoint] || 0;
    if (rateMs > 0) {
      const last = lastResponses.get(key);
      if (last && (nowMs() - last.timestamp) < rateMs) {
        return last.data;
      }
    }

    // De-duplicate concurrent identical requests
    if (inflightRequests.has(key)) {
      return await inflightRequests.get(key);
    }

    console.log(`Making API request to: ${url}`);
    
    // Attach CSRF header for mutating requests (double-submit cookie)
    const methodUpper = (options.method || 'GET').toUpperCase();
    const mutating = methodUpper === 'POST' || methodUpper === 'PUT' || methodUpper === 'DELETE' || methodUpper === 'PATCH';
    let csrfHeader = {};
    if (mutating && typeof document !== 'undefined') {
      const cookieMap = Object.fromEntries(document.cookie.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      }));
      if (cookieMap.csrf_token) {
        csrfHeader['X-CSRF-Token'] = cookieMap.csrf_token;
      }
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...options.headers,
      },
      credentials: 'include',
      ...options,
      signal: AbortSignal.timeout(30000)
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
      }
      throw new Error(`Non-JSON response: ${text.slice(0, 120)}`);
    }

    if (!response.ok) {
      const msg = data && (data.message || data.error) ? (data.message || data.error) : `HTTP ${response.status}`;
      // Handle rate limit errors specifically
      if (response.status === 429) {
        throw new Error('Too many requests, please try again later.');
      }
      throw new Error(msg);
    }

    // Cache successful responses for rate-limited endpoints
    if (rateMs > 0 && data) {
      lastResponses.set(key, { data, timestamp: nowMs() });
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your network connection');
    }
    // Handle rate limit errors in the catch block as well
    if (error.message && error.message.includes('429')) {
      throw new Error('Too many requests, please try again later.');
    }
    throw new Error(`Failed to fetch: ${error.message}`);
  }
};

// User authentication services
export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      return await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      return await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Logout user (clear cookies)
  logout: async () => {
    try {
      return await apiRequest('/api/users/logout', {
        method: 'POST'
      });
    } catch (error) {
      throw error;
    }
  },

  // Get user profile (cookie-based session)
  getProfile: async () => {
    try {
      return await apiRequest('/api/users/profile');
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      return await apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },
};

// Cryptocurrency services
export const cryptoService = {
  // Get current prices
  getPrices: async () => {
    try {
      return await apiRequest('/api/prices');
    } catch (e) {
      // Handle rate limit errors
      if (e.message && e.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      return { BTC: 0, ETH: 0, LTC: 0, XRP: 0 };
    }
  },

  // Get available assets
  getAssets: async () => {
    try {
      return await apiRequest('/api/assets');
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Create WebSocket connection for real-time prices
  createPriceWebSocket: () => {
    let target;
    if (typeof window !== 'undefined') {
      const isNetlify = /netlify\.app$/.test(window.location.hostname);
      if (isPlaceholderWS || RAW_WS === '') {
        if (isNetlify) {
          return null;
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        target = `${protocol}//${window.location.host}/ws`;
      } else {
        if (RAW_WS.startsWith('wss://') || RAW_WS.startsWith('ws://')) {
          if (RAW_WS.endsWith('/ws')) {
            target = RAW_WS;
          } else if (RAW_WS.endsWith('/')) {
            target = `${RAW_WS}ws`;
          } else {
            target = `${RAW_WS}/ws`;
          }
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
          if (RAW_WS.startsWith('/')) {
            target = `${protocol}${RAW_WS.replace('//', '').replace('/ws', '')}/ws`;
          } else {
            target = `${protocol}${RAW_WS}/ws`;
          }
        }
      }
    } else {
      if (isPlaceholderWS || RAW_WS === '') {
        target = 'ws://localhost:5000/ws';
      } else {
        target = RAW_WS.endsWith('/ws') ? RAW_WS : `${RAW_WS}/ws`;
      }
    }
    console.log(`Creating WebSocket connection to: ${target}`);
    
    // Validate WebSocket URL
    try {
      new URL(target);
    } catch (e) {
      console.error('Invalid WebSocket URL:', target);
      throw new Error(`Invalid WebSocket URL: ${target}`);
    }
    
    const ws = new WebSocket(target);
    
    // Provide a simple exponential backoff reconnect helper
    let attempts = 0;
    ws.reconnect = () => {
      attempts = Math.min(attempts + 1, 10);
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000) + Math.random() * 1000;
      console.log(`Attempting to reconnect WebSocket in ${Math.round(delay)}ms...`);
      return new Promise((resolve) => {
        setTimeout(() => resolve(new WebSocket(target)), delay);
      });
    };
    
    return ws;
  },
};

// Transaction services
export const transactionService = {
  // Create a new transaction
  createTransaction: async (transactionData) => {
    try {
      const response = await apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      
      return response;
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Get user transactions
  getUserTransactions: async () => {
    try {
      return await apiRequest('/api/transactions');
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Get transaction by ID
  getTransactionById: async (id) => {
    try {
      return await apiRequest(`/api/transactions/${id}`);
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },
};

// Gift Card services
export const giftCardService = {
  // Validate gift card
  validateGiftCard: async (cardData) => {
    try {
      return await apiRequest('/api/gift-cards/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Process gift card payment
  processGiftCardPayment: async (paymentData) => {
    try {
      return await apiRequest('/api/gift-cards/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Get user's gift cards
  getUserGiftCards: async () => {
    try {
      return await apiRequest('/api/gift-cards/my-cards');
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Admin: Create gift card
  createGiftCard: async (cardData) => {
    try {
      return await apiRequest('/api/gift-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Admin: Get all gift cards
  getAllGiftCards: async (page = 1, limit = 10) => {
    try {
      return await apiRequest(`/api/gift-cards?page=${page}&limit=${limit}`);
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Admin: Get gift card by ID
  getGiftCardById: async (id) => {
    try {
      return await apiRequest(`/api/gift-cards/${id}`);
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Admin: Update gift card status
  updateGiftCardStatus: async (id, statusData) => {
    try {
      return await apiRequest(`/api/gift-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Admin: Add balance to gift card
  addGiftCardBalance: async (id, balanceData) => {
    try {
      return await apiRequest(`/api/gift-cards/${id}/add-balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(balanceData),
      });
    } catch (error) {
      // Handle rate limit errors
      if (error.message && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    }
  },
};
