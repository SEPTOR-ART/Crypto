const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const WebSocket = require('ws');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send initial price data
  ws.send(JSON.stringify({
    type: 'INITIAL_PRICES',
    data: {
      BTC: (Math.random() * 100000 + 30000).toFixed(2),
      ETH: (Math.random() * 5000 + 1500).toFixed(2),
      LTC: (Math.random() * 500 + 50).toFixed(2),
      XRP: (Math.random() * 2 + 0.2).toFixed(4)
    }
  }));
  
  // Send price updates every 5 seconds
  const priceInterval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'PRICE_UPDATE',
      data: {
        BTC: (Math.random() * 100000 + 30000).toFixed(2),
        ETH: (Math.random() * 5000 + 1500).toFixed(2),
        LTC: (Math.random() * 500 + 50).toFixed(2),
        XRP: (Math.random() * 2 + 0.2).toFixed(4)
      }
    }));
  }, 5000);
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(priceInterval);
  });
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'CryptoZen API is running!' });
});

app.get('/api/prices', (req, res) => {
  // Mock cryptocurrency prices
  const prices = {
    BTC: (Math.random() * 100000 + 30000).toFixed(2),
    ETH: (Math.random() * 5000 + 1500).toFixed(2),
    LTC: (Math.random() * 500 + 50).toFixed(2),
    XRP: (Math.random() * 2 + 0.2).toFixed(4)
  };
  
  res.json(prices);
});

app.get('/api/assets', (req, res) => {
  // Mock cryptocurrency assets
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', price: (Math.random() * 100000 + 30000).toFixed(2) },
    { symbol: 'ETH', name: 'Ethereum', price: (Math.random() * 5000 + 1500).toFixed(2) },
    { symbol: 'LTC', name: 'Litecoin', price: (Math.random() * 500 + 50).toFixed(2) },
    { symbol: 'XRP', name: 'Ripple', price: (Math.random() * 2 + 0.2).toFixed(4) }
  ];
  
  res.json(assets);
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const mfaRoutes = require('./routes/mfaRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/mfa', mfaRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});