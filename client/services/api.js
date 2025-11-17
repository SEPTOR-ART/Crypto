// API service for interacting with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:5000';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
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
    return apiRequest('/api/prices');
  },

  // Get available assets
  getAssets: async () => {
    return apiRequest('/api/assets');
  },

  // Create WebSocket connection for real-time prices
  createPriceWebSocket: () => {
    console.log(`Creating WebSocket connection to: ${WS_BASE_URL}`);
    const ws = new WebSocket(WS_BASE_URL);
    
    // Add reconnection logic
    ws.reconnect = () => {
      console.log('Attempting to reconnect WebSocket...');
      return new WebSocket(WS_BASE_URL);
    };
    
    return ws;
  },
};

// Transaction services
export const transactionService = {
  // Create a new transaction
  createTransaction: async (transactionData, token) => {
    return apiRequest('/api/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
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