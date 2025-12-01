// API service for interacting with the backend

const RAW_API = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const RAW_WS = process.env.NEXT_PUBLIC_WS_BASE_URL || '';
const isPlaceholder = /your-render-app-name/.test(RAW_API) || RAW_API === '';
const isPlaceholderWS = /your-render-app-name/.test(RAW_WS) || RAW_WS === '';

// In-flight and rate limit caches to reduce duplicate requests
const inflightRequests = new Map();
const lastResponses = new Map();
// Rate limits in milliseconds - increased to reduce client-side rate limiting issues
const rateLimits = {
  '/api/users/profile': 30000,  // 30 seconds
  '/api/transactions': 30000,   // 30 seconds
  '/api/admin/users': 30000,    // 30 seconds
  '/api/admin/transactions': 30000, // 30 seconds
  '/api/gift-cards': 30000,     // 30 seconds
};
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Helper function to get cookie value by name
const getCookie = (name) => {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const result = parts.pop().split(';').shift();
      return result;
    }
  }
  return null;
};

const getStoredToken = () => {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('auth_token') || null;
    }
  } catch {}
  return null;
};

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
      // Try to get CSRF token from cookie
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        csrfHeader['X-CSRF-Token'] = csrfToken;
      }
    }

    // Include credentials only when needed (protected endpoints or mutations)
    const protectedPrefixes = ['/api/users', '/api/transactions', '/api/admin', '/api/gift-cards'];
    const needsCredentials = mutating || protectedPrefixes.some(p => endpoint.startsWith(p));

    // Build headers: avoid setting Content-Type on GET/HEAD to prevent CORS preflight
    const baseHeaders = {
      ...csrfHeader,
      ...options.headers,
    };
    
    // For protected endpoints, we rely on cookies rather than localStorage tokens
    // The credentials: 'include' option will send cookies automatically
    
    if (mutating && !baseHeaders['Content-Type']) {
      baseHeaders['Content-Type'] = 'application/json';
    }
    if (needsCredentials) {
      const hasAuth = !!(baseHeaders.Authorization || baseHeaders.authorization);
      if (!hasAuth) {
        const t = getStoredToken();
        if (t) {
          baseHeaders.Authorization = `Bearer ${t}`;
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: baseHeaders,
      credentials: needsCredentials ? 'include' : 'omit',
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
      const res = await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      try {
        if (typeof window !== 'undefined' && res && res.token) {
          window.localStorage.setItem('auth_token', res.token);
        }
      } catch {}
      return res;
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
      const res = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        // Credentials are automatically included for this request
      });
      try {
        if (typeof window !== 'undefined' && res && res.token) {
          window.localStorage.setItem('auth_token', res.token);
        }
      } catch {}
      return res;
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
      const res = await apiRequest('/api/users/logout', {
        method: 'POST'
      });
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth_token');
        }
      } catch {}
      return res;
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
  // Create a new gift card (admin only)
  createGiftCard: async (cardData) => {
    try {
      return await apiRequest('/api/gift-cards', {
        method: 'POST',
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

  // Get all gift cards (paginated)
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

  // Get gift card by ID
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

  // Update gift card (admin only)
  updateGiftCard: async (id, cardData) => {
    try {
      return await apiRequest(`/api/gift-cards/${id}`, {
        method: 'PUT',
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

  // Redeem gift card
  redeemGiftCard: async (id, redemptionData) => {
    try {
      return await apiRequest(`/api/gift-cards/${id}/redeem`, {
        method: 'POST',
        body: JSON.stringify(redemptionData),
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
