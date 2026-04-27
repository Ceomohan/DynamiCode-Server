const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize CLIENT_URL by removing trailing slash
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'production') {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    } else {
      // Allow all in development
      callback(null, true);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(helmet());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/problems', require('./routes/problemRoutes'));
app.use('/api/execute', require('./routes/executionRoutes'));
app.use('/api/solutions', require('./routes/solutionRoutes'));
app.use('/api/adaptive', require('./routes/adaptiveRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DynamiCode API' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
