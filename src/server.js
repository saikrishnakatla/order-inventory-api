import 'dotenv/config';
import express from 'express';
import productsRouter from './routes/products.routes.js';
import ordersRouter from './routes/orders.routes.js';
import {errorHandler} from './middlewares/errorHandler.js'

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Routes
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);

// 404 catch-all middleware
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});


// Centralized error handling middleware (MUST be last!)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});