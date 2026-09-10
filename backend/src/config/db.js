const mongoose = require('mongoose');

let connectPromise = null;

// Cached so a warm serverless invocation reuses the existing connection
// instead of opening a new one per request (mongoose.connection.readyState
// 1 = connected, 2 = connecting).
async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectPromise) {
    mongoose.set('strictQuery', true);
    connectPromise = mongoose.connect(uri).catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  await connectPromise;
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return mongoose.connection;
}

module.exports = connectDB;
