// API service for interacting with the backend

const RAW_API = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const RAW_WS = process.env.NEXT_PUBLIC_WS_BASE_URL || '';
const isPlaceholder = /your-render-app-name/.test(RAW_API) || RAW_API === '';
const isPlaceholderWS = /your-render-app-name/.test(RAW_WS) || RAW_WS === '';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
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
    
    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: AbortSignal.timeout(15000) // Increase timeout to 15 seconds
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
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your network connection');
    }
    throw new Error(`Failed to fetch: ${error.message}`);
  }
};

// User authentication services
export const authService = {
  // Register a new user
  register: async (userData) => {
    return apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get user profile
  getProfile: async (token) => {
    return apiRequest('/api/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Update user profile
  updateProfile: async (userData, token) => {
    return apiRequest('/api/users/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  },
};

// Cryptocurrency services
export const cryptoService = {
  // Get current prices
  getPrices: async () => {
    try {
      return await apiRequest('/api/prices');
    } catch (e) {
      return { BTC: 0, ETH: 0, LTC: 0, XRP: 0 };
    }
  },

  // Get available assets
  getAssets: async () => {
    return apiRequest('/api/assets');
  },

  // Create WebSocket connection for real-time prices
  createPriceWebSocket: () => {
    let target;
    if (typeof window !== 'undefined') {
      // In browser environment
      if (isPlaceholderWS || RAW_WS === '') {
        // If we're in development or no WS URL is set, construct from current origin
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        target = `${protocol}//${window.location.host}/ws`;
      } else {
        // Production environment with explicit WS URL
        target = RAW_WS;
      }
    } else {
      // Server-side environment (for SSR)
      if (isPlaceholderWS || RAW_WS === '') {
        // Default to localhost in development
        target = 'ws://localhost:5000/ws';
      } else {
        target = RAW_WS;
      }
    }
    
    console.log(`Creating WebSocket connection to: ${target}`);
    const ws = new WebSocket(target);
    
    // Add reconnection logic
    ws.reconnect = () => {
      console.log('Attempting to reconnect WebSocket...');
      return new WebSocket(target);
    };
    
    return ws;
  },
};

// Transaction services
export const transactionService = {
  // Create a new transaction
  createTransaction: async (transactionData, token) => {
    const response = await apiRequest('/api/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    
    return response;
  },

  // Get user transactions
  getUserTransactions: async (token) => {
    return apiRequest('/api/transactions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get transaction by ID
  getTransactionById: async (id, token) => {
    return apiRequest(`/api/transactions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};