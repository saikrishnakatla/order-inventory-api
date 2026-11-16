import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/products.validator.js';

const router = Router();

// Public routes: Anyone can browse products
router.get('/', productsController.getProducts);
router.get('/out-of-stock', productsController.getOutOfStock);
router.get('/:id', productsController.getProductById);

// Admin-only protected routes: Require valid JWT with role = 'admin'
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  validate(createProductSchema),
  productsController.createProduct
);
router.patch(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  validate(updateProductSchema),
  productsController.updateProduct
);
router.delete('/:id', authenticateToken, requireRole('admin'), productsController.deleteProduct);

export default router;