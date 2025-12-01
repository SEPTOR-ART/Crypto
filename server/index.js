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
const hasJWT = !!process.env.JWT_SECRET;
if (!hasJWT) {
  console.warn('JWT_SECRET not set. Falling back to opaque token authentication.');
}
if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI is not set! Will attempt to connect through database connection logic...');
}

// Connect to database
connectDB().then(() => {
  console.log('Database connection established');
  
  // Setup admin user from environment variables
  const setupAdminUser = require('./config/setupAdmin');
  setupAdminUser().then(() => {
    console.log('Admin setup check completed');
  }).catch(err => {
    console.error('Admin setup failed:', err);
  });
  
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
    const allowedOrigins = (process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : ['https://cryptozing.netlify.app']);

    const corsConfig = {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isExplicit = allowedOrigins.includes(origin);
        const isNetlifySubdomain = /\.netlify\.app$/.test(origin);
        const isRenderSelf = /\.onrender\.com$/.test(origin);
        const isAllowed = isExplicit || isNetlifySubdomain || isRenderSelf;
        callback(null, isAllowed);
      },
      credentials: true,
      methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
      optionsSuccessStatus: 200
    };
    app.use(cors(corsConfig));
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
    
    // Skip CSRF validation if Bearer token is present in Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      return next();
    }

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

    // If we have both cookie and header token, validate them
    if (csrfCookie && headerToken && csrfCookie === headerToken) {
      return next();
    }
    
    // Log detailed information for debugging
    console.warn('CSRF validation failed for request:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader,
      hasCsrfCookie: !!csrfCookie,
      hasHeaderToken: !!headerToken,
      userAgent: req.headers['user-agent']
    });
    
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

  // One-time setup endpoint to promote user to admin
  // This endpoint is protected by a secret key and can only be called once
  app.options('/api/setup/promote-admin', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).send();
  });
  
  app.post('/api/setup/promote-admin', async (req, res) => {
    // Allow CORS for this setup endpoint (including file:// origin)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
      const User = require('./models/User');
      
      // Get email from request body
      const { email, setupKey } = req.body;
      
      // Simple protection - require a setup key (use any random string)
      const SETUP_KEY = process.env.SETUP_KEY || 'cryptozen-setup-2025';
      if (setupKey !== SETUP_KEY) {
        return res.status(403).json({ message: 'Invalid setup key' });
      }
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if already admin
      if (user.isAdmin) {
        return res.status(200).json({ 
          message: 'User is already an admin',
          email: user.email,
          isAdmin: true
        });
      }
      
      // Promote to admin
      user.isAdmin = true;
      await user.save();
      
      res.status(200).json({ 
        message: 'User promoted to admin successfully',
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    
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

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      try { ws.ping(); } catch (e) {}
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
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
