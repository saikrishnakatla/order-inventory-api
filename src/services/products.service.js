import pool from '../config/db.js';

// 1. SELECT * FROM products (with dynamic WHERE filters and parameterized ? placeholders)
export const getAllProducts = async ({ category, instock, search } = {}) => {
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
  return rows;
};

// 2. SELECT * FROM products WHERE id = ? LIMIT 1
export const getProductById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0] || null;
};

// 3. SELECT * FROM products WHERE stock = 0
export const getOutOfStockProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM products WHERE stock = 0 ORDER BY id ASC');
  return rows;
};

// 4. INSERT INTO products
export const createProduct = async ({ name, category, price, stock }) => {
  const [result] = await pool.query(
    'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)',
    [name.trim(), category.trim().toLowerCase(), price, stock]
  );

  return {
    id: result.insertId,
    name: name.trim(),
    category: category.trim().toLowerCase(),
    price: Number(price),
    stock: Number(stock),
  };
};

// 5. UPDATE products SET ... WHERE id = ?
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

  return getProductById(id);
};

// 6. DELETE FROM products WHERE id = ?
export const deleteProduct = async (id) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
};