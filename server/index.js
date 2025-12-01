require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const connectDB = require('./config/db');

// Create Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting
const PORT = process.env.PORT || 10000;

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
    max: 500, // Increased from 200 to 500 requests per window
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
    max: 1000, // Increased from 500 to 1000 requests per window
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
      (req.path === '/api/users/logout' && method === 'POST') ||
      (req.path === '/api/support/public' && method === 'POST')
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
    
    // Get CSRF token from header (case-insensitive)
    let headerToken;
    const headerKeys = Object.keys(req.headers);
    const csrfHeaderKey = headerKeys.find(key => key.toLowerCase() === 'x-csrf-token');
    if (csrfHeaderKey) {
      headerToken = req.headers[csrfHeaderKey];
    }

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
      
      // Find user by email and promote to admin
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.isAdmin = true;
      await user.save();
      
      console.log(`User ${email} promoted to admin successfully`);
      res.json({ message: 'User promoted to admin successfully' });
    } catch (error) {
      console.error('Admin promotion error:', error);
      res.status(500).json({ message: 'Server error during admin promotion' });
    }
  });

  // Routes
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/transactions', require('./routes/transactionRoutes'));
  app.use('/api/gift-cards', require('./routes/giftCardRoutes'));
  app.use('/api/assets', require('./routes/assetRoutes'));
  app.use('/api/prices', require('./routes/priceRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/support', require('./routes/supportRoutes'));

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    
    // Serve frontend routes
    app.get(/.*/, (req, res) => {
      res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
  }

  // Create HTTP server
  const server = http.createServer(app);

  // Setup WebSocket server
  const wss = new WebSocket.Server({ server });

  // Store active connections
  const clients = new Set();

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection opened');
    clients.add(ws);
    
    // Send initial price data
    sendInitialPrices(ws);
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error occurred:', error);
      clients.delete(ws);
    });
  });

  // Broadcast price updates to all connected clients
  const broadcastPrices = (prices) => {
    const data = JSON.stringify({ type: 'PRICE_UPDATE', data: prices });
    [...clients].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  // Send initial price data to a client
  const sendInitialPrices = (ws) => {
    // Mock initial prices
    const initialPrices = {
      BTC: 43250.75,
      ETH: 2650.30,
      LTC: 85.42,
      XRP: 0.52
    };
    ws.send(JSON.stringify({ type: 'INITIAL_PRICES', data: initialPrices }));
  };

  // Simulate price updates (in a real app, this would come from an external API)
  setInterval(() => {
    // Mock price updates
    const priceUpdates = {
      BTC: 43250.75 + (Math.random() - 0.5) * 100,
      ETH: 2650.30 + (Math.random() - 0.5) * 20,
      LTC: 85.42 + (Math.random() - 0.5) * 2,
      XRP: 0.52 + (Math.random() - 0.5) * 0.02
    };
    broadcastPrices(priceUpdates);
  }, 5000); // Update every 5 seconds

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`WebSocket server listening on ws://localhost:${PORT}/ws`);
  });
};

module.exports = app;
