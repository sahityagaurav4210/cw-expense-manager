const allowedOrigins = process.env?.ALLOWED_CORS_ORIGIN?.trim()?.split(',') || [
  'http://localhost:9123',
  'http://localhost:3000',
  'http://localhost:3001',
];

module.exports = { allowedOrigins };
