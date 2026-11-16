import * as ordersService from '../services/orders.service.js';

// 1. GET /orders
export const getOrders = async (req, res, next) => {
  try {
    const orders = await ordersService.getAllOrders();
    res.status(200).json({
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /orders/:id
export const getOrderById = async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  try {
    const order = await ordersService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
};

// 3. POST /orders
export const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;
    // Extract customer name from verified JWT identity or request body
    const customerName = req.user?.name || req.body?.customerName || req.user?.email || 'Authenticated User';

    const newOrder = await ordersService.createOrder({ customerName, items });
    res.status(201).json({ data: newOrder });
  } catch (err) {
    next(err);
  }
};