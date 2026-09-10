require('dotenv').config();
const createApp = require('../src/app');
const connectDB = require('../src/config/db');

const app = createApp();

module.exports = async (req, res) => {
  if (!process.env.MONGO_URI) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'MONGO_URI is not configured' }));
    return;
  }

  try {
    await connectDB(process.env.MONGO_URI);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: `Database connection failed: ${err.message}` }));
    return;
  }

  return app(req, res);
};
