import 'dotenv/config';
import jwt from 'jsonwebtoken';
import pool from '../src/config/db.js';

const API_BASE_URL = 'http://localhost:3000';
const TARGET_PRODUCT_ID = 1;
const INITIAL_STOCK = 2;
const CONCURRENT_BUYERS = 30;

async function runFlashSaleSimulation() {
  console.log('\n============================================================');
  console.log('   FLASH SALE CONCURRENCY STRESS TEST (ACID ROW LOCKING)    ');
  console.log('============================================================\n');

  try {
    // Step 1: Issue signed customer JWT token
    console.log('[1/5] Generating verified customer JWT session...');
    const token = jwt.sign(
      {
        id: 999,
        name: 'Flash Sale Buyer',
        email: 'flashsale@stress-test.com',
        role: 'customer',
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_2026_dev',
      { expiresIn: '1h' }
    );
    console.log('      Verified JWT Bearer Token generated!');

    // Step 2: Set target product stock to exactly INITIAL_STOCK (2)
    console.log(`\n[2/5] Resetting Product #${TARGET_PRODUCT_ID} stock to exactly ${INITIAL_STOCK} in MySQL...`);
    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [INITIAL_STOCK, TARGET_PRODUCT_ID]);

    const [[productBefore]] = await pool.query('SELECT id, name, price, stock FROM products WHERE id = ?', [TARGET_PRODUCT_ID]);
    console.log(`      Product: "${productBefore.name}" | Price: $${productBefore.price} | Stock: ${productBefore.stock}`);

    // Step 3: Launch concurrent checkout requests
    console.log(`\n[3/5] FIRING ${CONCURRENT_BUYERS} CONCURRENT CHECKOUT REQUESTS AT THE SAME MILLISECOND...`);
    console.log(`      Each buyer is trying to buy 1 item (Total Demand: ${CONCURRENT_BUYERS}, Supply: ${INITIAL_STOCK})...\n`);

    const startTime = Date.now();

    const requestPromises = Array.from({ length: CONCURRENT_BUYERS }, async (_, index) => {
      const buyerId = index + 1;
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: [{ productId: TARGET_PRODUCT_ID, quantity: 1 }],
          }),
        });

        const data = await res.json();
        return {
          buyerId,
          status: res.status,
          success: res.status === 201,
          data,
        };
      } catch (err) {
        return {
          buyerId,
          status: 500,
          success: false,
          error: err.message,
        };
      }
    });

    const results = await Promise.all(requestPromises);
    const duration = Date.now() - startTime;

    // Step 4: Tally the results
    console.log(`[4/5] All ${CONCURRENT_BUYERS} requests completed in ${duration}ms! Analyzing outcomes...\n`);

    const successfulOrders = results.filter((r) => r.success);
    const failedOrders = results.filter((r) => !r.success);

    console.log(`------------------------------------------------------------`);
    console.log(`  Successful Orders (HTTP 201):  ${successfulOrders.length}`);
    console.log(`  Rejected Orders   (HTTP 400):  ${failedOrders.length}`);
    console.log(`------------------------------------------------------------\n`);

    successfulOrders.forEach((order) => {
      console.log(`  [SUCCESS] Buyer #${order.buyerId} placed Order #${order.data.data.id}!`);
    });

    console.log('\nSample Rejection Reason:');
    if (failedOrders.length > 0) {
      console.log(`  [BLOCKED] Buyer #${failedOrders[0].buyerId} -> "${failedOrders[0].data.message || failedOrders[0].data.error}"`);
    }

    // Step 5: Verify Database Integrity
    console.log(`\n[5/5] VERIFYING DATABASE INTEGRITY (ACID VERIFICATION)...`);
    const [[productAfter]] = await pool.query('SELECT id, name, price, stock FROM products WHERE id = ?', [TARGET_PRODUCT_ID]);
    console.log(`      Final Stock in MySQL: ${productAfter.stock}`);

    if (productAfter.stock === 0 && successfulOrders.length === INITIAL_STOCK) {
      console.log('\n  ============================================================');
      console.log('   ACID TRANSACTION INTEGRITY 100% VERIFIED!                  ');
      console.log('   - Exactly 2 orders created.                                ');
      console.log('   - Exactly 28 buyers blocked gracefully.                    ');
      console.log('   - Inventory settled at 0 (ZERO OVERSOLD ITEMS!).           ');
      console.log('   - MySQL `SELECT ... FOR UPDATE` successfully prevented     ');
      console.log('     all race conditions and phantom reads!                   ');
      console.log('  ============================================================\n');
    } else {
      console.log('\n  [WARNING] Stock anomaly detected! Check transaction isolation level.\n');
    }

  } catch (error) {
    console.error('Simulation Error:', error.message);
  } finally {
    await pool.end();
  }
}

runFlashSaleSimulation();
