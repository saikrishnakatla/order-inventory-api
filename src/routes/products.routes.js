import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';

const router = Router();

router.get('/', productsController.getProducts);
router.get('/out-of-stock', productsController.getOutOfStock);
router.get('/:id', productsController.getProductById);
router.post('/', productsController.createProduct);
router.patch('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

export default router;