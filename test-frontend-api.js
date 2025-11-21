// Simulate browser environment for testing
global.window = {
  location: {
    origin: 'http://localhost:3000',
    protocol: 'http:'
  }
};

// Test the API service
const { authService } = require('./client/services/api.js');

// Mock fetch for testing
global.fetch = async (url, options) => {
  console.log('Fetch called with:', url, options);
  
  // Simulate a successful response
  return {
    ok: true,
    status: 201,
    headers: {
      get: () => 'application/json'
    },
    json: async () => ({
      _id: 2,
      firstName: 'Frontend',
      lastName: 'Test',
      email: 'frontend@example.com',
      token: 'test-token'
    })
  };
};

// Test the register function
authService.register({
  firstName: 'Frontend',
  lastName: 'Test',
  email: 'frontend@example.com',
  password: 'Test1234'
}).then(result => {
  console.log('Registration successful:', result);
}).catch(error => {
  console.error('Registration failed:', error);
});