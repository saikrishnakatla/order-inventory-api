import pool from '../config/db.js';

// 1. Get all orders with their items
export const getAllOrders = async () => {
  const [orders] = await pool.query('SELECT * FROM orders ORDER BY id DESC');

  // Fetch items for each order
  for (const order of orders) {
    const [items] = await pool.query(
      'SELECT id, product_id, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = items;
  }

  return orders;
};

// 2. Get a single order by ID with its items
export const getOrderById = async (id) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orders.length === 0) return null;

  const order = orders[0];
  const [items] = await pool.query(
    'SELECT id, product_id, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?',
    [order.id]
  );
  order.items = items;

  return order;
};

// 3. Create Order with Full ACID Transaction & Row Locking
export const createOrder = async ({ customerName, items }) => {
  // Grab a dedicated connection from the pool for the transaction
  const connection = await pool.getConnection();

  try {
    // START TRANSACTION
    await connection.beginTransaction();

    const validatedItems = [];
    let totalAmount = 0;

    // Step A: Lock and validate every product row
    for (const item of items) {
      // FOR UPDATE locks the product row until COMMIT or ROLLBACK
      const [rows] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [item.productId]
      );

      if (rows.length === 0) {
        const error = new Error(`Product with ID ${item.productId} not found`);
        error.statusCode = 404;
        throw error;
      }

      const product = rows[0];

      if (product.stock < item.quantity) {
        const error = new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }

      const subtotal = Number(product.price) * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.price),
        quantity: item.quantity,
        subtotal,
      });
    }

    // Step B: INSERT INTO orders
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, total_amount, status) VALUES (?, ?, ?)',
      [customerName.trim(), totalAmount, 'completed']
    );

    const orderId = orderResult.insertId;

    // Step C: INSERT INTO order_items AND UPDATE products stock
    for (const item of validatedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.unitPrice, item.subtotal]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // COMMIT TRANSACTION (All inserts & updates succeed atomically)
    await connection.commit();

    return {
      id: orderId,
      customerName: customerName.trim(),
      items: validatedItems,
      totalAmount,
      status: 'completed',
    };
  } catch (err) {
    // ROLLBACK TRANSACTION (Reverts everything if any step fails!)
    await connection.rollback();
    throw err;
  } finally {
    // Always release the connection back to the pool!
    connection.release();
  }
};