require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db');

// Create Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting
const PORT = process.env.PORT || 5000;

// Validate required environment variables
console.log('Environment variables check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('- JWT_SECRET set:', !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
  console.log('- JWT_SECRET length:', process.env.JWT_SECRET.length);
}
console.log('- MONGODB_URI set:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('- MONGODB_URI length:', process.env.MONGODB_URI.length);
}

// Remove MONGODB_URI from required environment variables check
// Let the database connection logic handle this
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

console.log('MONGODB_URI is set:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI length:', process.env.MONGODB_URI.length);
} else {
  console.log('MONGODB_URI is not set! Will attempt to connect through database connection logic...');
  // Don't exit here, let the database connection logic handle it
}

// Connect to database
connectDB().then(() => {
  console.log('Database connection established');
  // Start server only after successful database connection
  startServer();
}).catch(err => {
  console.error('Failed to connect to database:', err);
  console.error('Cannot start server without database connection');
  process.exit(1);
});

// Function to start the server
const startServer = () => {
  // Middleware
  app.use(helmet());
  app.use(morgan('combined'));

  // Configure CORS for production and development
  if (process.env.NODE_ENV === 'production') {
    // In production, credentials require a specific origin (not '*')
    const allowedOrigins = (process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : ['https://cryptozing.netlify.app']);

    const corsConfig = {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow same-origin and non-browser clients
        const isAllowed = allowedOrigins.includes(origin);
        callback(null, isAllowed);
      },
      credentials: true,
      methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
      optionsSuccessStatus: 200
    };
    app.use(cors(corsConfig));
    // Express v5 uses path-to-regexp v6 which does not support '*' wildcard
    // Use a RegExp to match all paths for preflight handling
    app.options(/.*/, cors(corsConfig));
  } else {
    // Reflect request origin in development, allow credentials
    app.use(cors({ origin: true, credentials: true }));
  }

  // Add JSON parsing middleware with better error handling
  app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      express.json({
        limit: '10mb',
        verify: (req, res, buf, encoding) => {
          try {
            // Try to parse the buffer to validate JSON
            JSON.parse(buf.toString());
          } catch (e) {
            console.error('Invalid JSON detected:', e.message);
            // We'll let the regular middleware handle the error
          }
        }
      })(req, res, next);
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });

  // Global error handler for JSON parsing errors
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error('JSON parsing error:', err.message);
      return res.status(400).json({ 
        message: 'Invalid JSON format in request body',
        error: 'Bad Request'
      });
    }
    next();
  });

  // Basic rate limiting for auth endpoints - increased limits for better user experience
  const authLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to 200 requests per window
    message: {
      error: 'Too many requests',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/users', authLimiter);
  
  // Rate limiting for general API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    message: {
      error: 'Too many requests',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/transactions', apiLimiter);
  app.use('/api/gift-cards', apiLimiter);

  // CSRF protection (double-submit cookie) in production for mutating routes
  function csrfMiddleware(req, res, next) {
    if (process.env.NODE_ENV !== 'production') return next();
    const method = req.method.toUpperCase();
    const mutating = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
    if (!mutating) return next();

    // Skip CSRF for auth endpoints that set cookies
    const isAuthEndpoint = (
      (req.path === '/api/users' && method === 'POST') ||
      (req.path === '/api/users/login' && method === 'POST') ||
      (req.path === '/api/users/logout' && method === 'POST')
    );
    if (isAuthEndpoint) return next();

    // Read cookies
    let csrfCookie;
    if (req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        })
      );
      csrfCookie = cookies.csrf_token;
    }
    const headerToken = req.headers['x-csrf-token'];

    if (csrfCookie && headerToken && csrfCookie === headerToken) {
      return next();
    }
    console.warn('CSRF validation failed');
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
  const adminRoutes = require('./routes/adminRoutes');
  const giftCardRoutes = require('./routes/giftCardRoutes');

  // Use routes
  app.use('/api/users', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/mfa', mfaRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/gift-cards', giftCardRoutes);

  // Create HTTP server
  const server = http.createServer(app);

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
  });

  // Create WebSocket server with proper path handling
  const wss = new WebSocket.Server({ server, path: '/ws' });

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

    // Send periodic updates
    const interval = setInterval(() => {
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

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(interval);
    });
  });

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
};

// Export app for testing
module.exports = app;
