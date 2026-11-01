const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 1 minute.',
  },
});

module.exports = { limiter };
