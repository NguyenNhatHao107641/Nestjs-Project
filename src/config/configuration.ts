export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri:
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/homestay_booking',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key_nest_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  refreshToken: {
    secret:
      process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret_nest_2026',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
});
