import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';

const router = Router();

router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/', ordersController.createOrder);

export default router;