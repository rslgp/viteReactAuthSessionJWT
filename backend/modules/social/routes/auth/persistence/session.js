
import session from 'express-session';
import Redis from 'ioredis';
import { RedisStore } from 'connect-redis';

// Create a Redis client using ioredis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost', // Redis server host
  port: process.env.REDIS_PORT || 6379,        // Redis server port
  password: process.env.REDIS_PASSWORD || null,
});
redisClient.on("error", (err) => console.error("Redis Error:", err));

// Configure Redis store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: process.env.REDIT_PREFIX || 'arbitrio:', // Optional: Add a prefix to all keys in Redis
});

const persist_session = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET, // Replace with a strong secret key
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something is stored
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // Session expiration time (e.g., 1 day)
  },
});

// session({ // no persistence
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
// });

export default persist_session;
