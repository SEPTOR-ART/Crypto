const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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
wss.on('connection', (ws, request) => {
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
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'PRICE_UPDATE',
        data: {
          BTC: (Math.random() * 100000 + 30000).toFixed(2),
          ETH: (Math.random() * 5000 + 1500).toFixed(2),
          LTC: (Math.random() * 500 + 50).toFixed(2),
          XRP: (Math.random() * 2 + 0.2).toFixed(4)
        }
      }));
    }
  }, 5000);
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(priceInterval);
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(priceInterval);
  });
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// Configure CORS for production and development
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-netlify-domain.netlify.app'],
    credentials: true
  }));
} else {
  app.use(cors());
}

app.use(express.json());

// Basic rate limiting for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/users', authLimiter);

// CSRF protection in production for state-changing routes without Authorization
function csrfMiddleware(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  const method = req.method.toUpperCase();
  const mutating = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  if (!mutating) return next();
  const hasAuth = !!req.headers.authorization;
  if (hasAuth) return next();
  const token = req.headers['x-csrf-token'];
  const expected = process.env.CSRF_SECRET;
  if (expected && token === expected) return next();
  return res.status(403).json({ message: 'CSRF validation failed' });
}
app.use(csrfMiddleware);

// Simple in-memory metrics
const metrics = { startTime: Date.now(), requests: 0, paths: {}, latency: { total: 0, count: 0 } };
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  metrics.requests += 1;
  metrics.paths[req.path] = (metrics.paths[req.path] || 0) + 1;
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    metrics.latency.total += ms;
    metrics.latency.count += 1;
  });
  next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/metrics', (req, res) => {
  const avgLatency = metrics.latency.count ? Number((metrics.latency.total / metrics.latency.count).toFixed(2)) : 0;
  res.json({
    uptime: process.uptime(),
    since: new Date(metrics.startTime).toISOString(),
    requests: metrics.requests,
    avgLatencyMs: avgLatency,
    paths: metrics.paths,
  });
});

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

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});