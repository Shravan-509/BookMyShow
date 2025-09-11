const NodeCache = require("node-cache")

// Initialize node-cache with default TTL and periodic cleanup
const cache = new NodeCache({
  stdTTL: 60, // Default TTL of 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance, but be careful with object mutations
  deleteOnExpire: true, // Automatically delete expired keys
  maxKeys: 1000, // Limit cache size to prevent memory issues
})

function makeKey(req) {
  // Keyed by method + path + query string; exclude auth headers so response cache is shared
  return `${req.method}:${req.originalUrl}`
}

function cacheMiddleware(ttlSec = 60) {
  return (req, res, next) => {
    if (req.method !== "GET") return next()
    // Allow bypass
    if (req.headers["cache-control"] === "no-cache") return next()

    const key = makeKey(req)

    const hit = cache.get(key)
    if (hit) {
      // Replay cached response
      res.status(hit.status)
      Object.entries(hit.headers || {}).forEach(([k, v]) => res.setHeader(k, v))
      res.setHeader("X-Cache", "HIT")
      return res.send(hit.body)
    }

    // Wrap res.send to capture
    const originalSend = res.send.bind(res)
    res.send = (body) => {
      try {
        cache.set(
          key,
          {
            body,
            headers: {
              "Content-Type": res.getHeader("Content-Type") || "application/json",
            },
            status: res.statusCode,
          },
          ttlSec,
        )
      } catch (error) {
        console.error("[Cache] Failed to cache response:", error.message)
      }
      res.setHeader("X-Cache", "MISS")
      return originalSend(body)
    }

    next()
  }
}

const cacheUtils = {
  // Clear all cache
  flushAll: () => cache.flushAll(),

  // Clear specific key
  del: (key) => cache.del(key),

  // Clear keys by pattern (useful for invalidating related data)
  delByPattern: (pattern) => {
    const keys = cache.keys().filter((key) => key.includes(pattern))
    cache.del(keys)
    return keys.length
  },

  // Get cache statistics
  getStats: () => cache.getStats(),

  // Get all keys
  getKeys: () => cache.keys(),
}

module.exports = { cache: cacheMiddleware, cacheUtils }
