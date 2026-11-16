import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

// Public routes: Anyone can browse products
router.get('/', productsController.getProducts);
router.get('/out-of-stock', productsController.getOutOfStock);
router.get('/:id', productsController.getProductById);

// Admin-only protected routes: Require valid JWT with role = 'admin'
router.post('/', authenticateToken, requireRole('admin'), productsController.createProduct);
router.patch('/:id', authenticateToken, requireRole('admin'), productsController.updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin'), productsController.deleteProduct);

export default router;