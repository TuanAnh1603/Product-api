require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'UP' : 'DOWN',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

app.use('/api/products', productRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ message: 'Invalid request' });
});

async function start() {
  const port = Number(process.env.PORT || 3000);
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/productdb';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, '0.0.0.0', () => console.log(`Product API listening on ${port}`));
}

if (require.main === module) {
  start().catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
}

module.exports = { app, start };
