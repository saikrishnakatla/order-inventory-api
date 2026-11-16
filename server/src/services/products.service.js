import pool from '../config/db.js';
import redis from '../config/redis.js';

const CACHE_KEY_ALL = 'cache:products:all';
const CACHE_TTL_SECONDS = 60; // Cache lives for 60 seconds

// 1. GET ALL PRODUCTS (Cache-Aside Pattern)
export const getAllProducts = async ({ category, instock, search } = {}) => {
  const isDefaultFetch = !category && !instock && !search;

  // Step A: Check Redis Cache for default catalog
  if (isDefaultFetch) {
    try {
      const cached = await redis.get(CACHE_KEY_ALL);
      if (cached) {
        console.log('[REDIS] Cache HIT! Serving from RAM (< 1ms)');
        return JSON.parse(cached);
      }
    } catch (e) {
      // If Redis fails, gracefully continue to MySQL
    }
  }

  // Step B: Cache MISS - Query MySQL
  console.log('[MYSQL] Cache MISS. Querying MySQL database...');
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  if (instock === 'true') {
    sql += ' AND stock > 0';
  } else if (instock === 'false') {
    sql += ' AND stock = 0';
  }

  if (search) {
    sql += ' AND LOWER(name) LIKE LOWER(?)';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY id ASC';

  const [rows] = await pool.query(sql, params);

  // Step C: Save to Redis with TTL
  if (isDefaultFetch && rows.length > 0) {
    try {
      await redis.set(CACHE_KEY_ALL, JSON.stringify(rows), 'EX', CACHE_TTL_SECONDS);
      console.log(`[REDIS] Saved ${rows.length} products to cache (TTL: ${CACHE_TTL_SECONDS}s)`);
    } catch (e) {
      // Ignore cache write errors
    }
  }

  return rows;
};

// 2. GET PRODUCT BY ID
export const getProductById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0] || null;
};

// 3. GET OUT OF STOCK
export const getOutOfStockProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM products WHERE stock = 0 ORDER BY id ASC');
  return rows;
};

// 4. CREATE PRODUCT (Invalidates Cache!)
export const createProduct = async ({ name, category, price, stock }) => {
  const [result] = await pool.query(
    'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)',
    [name.trim(), category.trim().toLowerCase(), price, stock]
  );

  // Invalidate Cache so the new product is visible immediately
  try {
    await redis.del(CACHE_KEY_ALL);
    console.log('[REDIS] Cache invalidated after product creation');
  } catch (e) {}

  return {
    id: result.insertId,
    name: name.trim(),
    category: category.trim().toLowerCase(),
    price: Number(price),
    stock: Number(stock),
  };
};

// 5. UPDATE PRODUCT (Invalidates Cache!)
export const updateProduct = async (id, updates) => {
  const fields = [];
  const params = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    params.push(String(updates.name).trim());
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    params.push(String(updates.category).trim().toLowerCase());
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    params.push(updates.price);
  }
  if (updates.stock !== undefined) {
    fields.push('stock = ?');
    params.push(updates.stock);
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  params.push(id);
  const [result] = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return null;
  }

  // Invalidate Cache
  try {
    await redis.del(CACHE_KEY_ALL);
    console.log('[REDIS] Cache invalidated after product update');
  } catch (e) {}

  return getProductById(id);
};

// 6. DELETE PRODUCT (Invalidates Cache!)
export const deleteProduct = async (id) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

  // Invalidate Cache
  try {
    await redis.del(CACHE_KEY_ALL);
    console.log('[REDIS] Cache invalidated after product deletion');
  } catch (e) {}

  return result.affectedRows > 0;
};