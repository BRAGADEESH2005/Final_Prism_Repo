require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/audio-classifier'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};