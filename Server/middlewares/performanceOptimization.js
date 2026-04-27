/**
 * Performance Optimization Middleware
 * 
 * Includes:
 * - Compression (gzip/brotli)
 * - Response caching
 * - Rate limiting
 * - Security headers
 */

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const NodeCache = require('node-cache');

/**
 * Initialize cache with 10-minute default TTL
 */
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Compression Middleware
 * Enables gzip compression for all responses > 1KB
 */
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9), 6 is good balance
  threshold: 1024 // Only compress responses larger than 1KB
});

/**
 * Security Headers Middleware
 * Implements security best practices with helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Cache Middleware Factory
 * Creates middleware for route-level caching
 * 
 * @param {number} duration - Cache duration in seconds (default: 600)
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = '__express__' + (req.originalUrl || req.url);
    const cachedData = cache.get(key);

    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      cache.set(key, data, duration);
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', `public, max-age=${duration}`);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 15 minutes by default
    max, // Limit each IP to max requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    keyGenerator: (req) => {
      // Use IP address as key
      return req.user?.id || ipKeyGenerator(req);
    },
  });
};

/**
 * Specific rate limiters for different endpoints
 */
const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 per 15 min
const bookingLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 per 15 min
const paymentLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 per hour
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 per 15 min

/**
 * Response Time Header Middleware
 * Adds X-Response-Time header for monitoring
 */
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - start;
    res.setHeader("X-Response-Time", `${duration}ms`);
    return originalEnd.apply(this, args);
  };
  
  // res.on('finish', () => {
  //   const duration = Date.now() - start;
  //   res.set('X-Response-Time', `${duration}ms`);
    
  //   // Log slow requests (> 1 second)
  //   if (duration > 1000) {
  //     console.warn(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`);
  //   }
  // });
  
  next();
};

/**
 * Database Connection Pool Optimization
 * Configure in MongoDB/Mongoose connection
 * 
 * Example:
 * mongoose.connect(MONGO_URI, {
 *   maxPoolSize: 10,
 *   minPoolSize: 5,
 *   maxIdleTimeMS: 45000,
 * });
 */

/**
 * Clear cache for specific routes
 * @param {string} pattern - Route pattern to clear (e.g., '/bms/v1/movie/*')
 */
const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

/**
 * Get cache stats
 */
const getCacheStats = () => {
  const keys = cache.keys();
  const stats = cache.getStats();
  
  return {
    cacheSize: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0
  };
};

/**
 * HTTP Response Caching Headers
 * Applied to static resources
 */
const staticCacheHeaders = (req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for versioned assets
  } else if (req.path.match(/\.(html)$/)) {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hour for HTML
  } else {
    res.set('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 min for API
  }
  next();
};

/**
 * Request Logging for Performance
 */
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to ms
    
    const logLevel = duration > 500 ? 'warn' : 'debug';
    console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
  });
  
  next();
};

/**
 * Initialize all performance middleware
 * @param {Express} app - Express application
 */
const initializePerformanceMiddleware = (app) => {
  // Security first
  app.use(securityHeaders);
  
  // Compression
  app.use(compressionMiddleware);
  
  // Response time tracking
  app.use(responseTimeMiddleware);
  
  // Request logging
  app.use(requestLogger);
  
  // Cache headers for static files
  app.use(staticCacheHeaders);
  
  // Rate limiting (general)
  app.use(generalLimiter);
  
  return {
    cacheMiddleware,
    authLimiter,
    bookingLimiter,
    paymentLimiter,
    clearCache,
    getCacheStats
  };
};

module.exports = {
  compressionMiddleware,
  securityHeaders,
  cacheMiddleware,
  createRateLimiter,
  authLimiter,
  bookingLimiter,
  paymentLimiter,
  generalLimiter,
  responseTimeMiddleware,
  staticCacheHeaders,
  requestLogger,
  initializePerformanceMiddleware,
  clearCache,
  getCacheStats
};
