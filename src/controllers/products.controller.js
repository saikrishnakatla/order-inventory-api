import * as productsService from '../services/products.service.js';

// 1. GET /products
export const getProducts = async (req, res, next) => {
  try {
    const products = await productsService.getAllProducts(req.query);
    res.status(200).json({
      count: products.length,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /products/out-of-stock
export const getOutOfStock = async (req, res, next) => {
  try {
    const products = await productsService.getOutOfStockProducts();
    res.status(200).json({
      count: products.length,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// 3. GET /products/:id
export const getProductById = async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const product = await productsService.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
};

// 4. POST /products
export const createProduct = async (req, res, next) => {
  const { name, category, price, stock } = req.body || {};

  if (!name || typeof name !== 'string' || !category || typeof category !== 'string') {
    return res.status(400).json({ error: 'name and category are required strings' });
  }

  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: 'stock must be an integer >= 0' });
  }

  try {
    const newProduct = await productsService.createProduct({ name, category, price, stock });
    res.status(201).json({ data: newProduct });
  } catch (err) {
    next(err);
  }
};

// 5. PATCH /products/:id
export const updateProduct = async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const { name, category, price, stock } = req.body || {};

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
    return res.status(400).json({ error: 'Invalid stock' });
  }

  try {
    const updatedProduct = await productsService.updateProduct(id, { name, category, price, stock });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ data: updatedProduct });
  } catch (err) {
    next(err);
  }
};

// 6. DELETE /products/:id
export const deleteProduct = async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const deleted = await productsService.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};