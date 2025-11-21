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

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please set these variables in your environment or .env file');
  process.exit(1);
}

// Log JWT secret status (without revealing the actual secret)
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
}

// Create Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB().then(() => {
  console.log('Database connection established');
  // Start server only after successful database connection
  startServer();
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Function to start the server
const startServer = () => {
  // Create HTTP server
  const server = http.createServer(app);

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
  });

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

  // Start server
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }).on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// Configure CORS for production and development
if (process.env.NODE_ENV === 'production') {
  // In production, allow specific origins or all origins if not specified
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : '*'; // Allow all origins if not specified
  
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
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
  
  // Skip CSRF check for user registration and login since they don't require auth
  // Handle both mounted and direct paths
  const isRegistration = (req.path === '/api/users' || req.path === '/api/users/' || req.originalUrl === '/api/users') && method === 'POST';
  const isLogin = (req.path === '/api/users/login' || req.path === '/api/users/login/') && method === 'POST';
  
  if (isRegistration || isLogin) {
    return next();
  }
  
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

app.get('/api/health', (req, res) => {
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
