import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createOrderSchema } from '../validators/orders.validator.js';

const router = Router();

router.get('/', authenticateToken, ordersController.getOrders);
router.get('/:id', authenticateToken, ordersController.getOrderById);
router.post('/', authenticateToken, validate(createOrderSchema), ordersController.createOrder);

export default router;