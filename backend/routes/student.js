const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { createId } = require("../utils/ids");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/dashboard", async (req, res) => {
  const role = req.user.ROLE || req.user.role;
  const studentId = req.user.ID || req.user.id;

  if (role !== "student") {
    return res.status(403).json({ message: "Only students allowed." });
  }

  let connection;

  try {
    connection = await getConnection();

    const orders = await connection.execute(
      `SELECT COUNT(*) AS TOTAL_ORDERS
       FROM orders
       WHERE student_id = :student_id`,
      { student_id: studentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      message: "Student dashboard loaded.",
      student: req.user,
      totalOrders: orders.rows[0].TOTAL_ORDERS
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard error.", error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

router.get("/menu", async (_req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT id, name, category, price_nest_coins, description, available
       FROM menu_items
       WHERE available = 1`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Menu fetch failed.", error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

router.post("/orders", async (req, res) => {
  const { items } = req.body;
  const role = req.user.ROLE || req.user.role;
  const studentId = req.user.ID || req.user.id;

  if (role !== "student") {
    return res.status(403).json({ message: "Only students allowed." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Items required." });
  }

  let connection;

  try {
    connection = await getConnection();

    const studentResult = await connection.execute(
      `SELECT nest_coins FROM users WHERE id = :id`,
      { id: studentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const balance = studentResult.rows[0].NEST_COINS;
    const orderId = createId("order");
    let total = 0;

    for (const item of items) {
      const menuResult = await connection.execute(
        `SELECT id, price_nest_coins
         FROM menu_items
         WHERE id = :id AND available = 1`,
        { id: item.menuItemId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (menuResult.rows.length === 0) {
        return res.status(400).json({ message: `Invalid menu item ${item.menuItemId}` });
      }

      const menuItem = menuResult.rows[0];
      const quantity = Number(item.quantity || 1);
      const lineTotal = menuItem.PRICE_NEST_COINS * quantity;
      total += lineTotal;

      await connection.execute(
        `INSERT INTO order_items
         (id, order_id, menu_item_id, quantity, unit_price_nest_coins, line_total_nest_coins)
         VALUES (:id, :order_id, :menu_item_id, :quantity, :unit_price, :line_total)`,
        {
          id: createId("oi"),
          order_id: orderId,
          menu_item_id: menuItem.ID,
          quantity,
          unit_price: menuItem.PRICE_NEST_COINS,
          line_total: lineTotal
        }
      );
    }

    if (balance < total) {
      return res.status(400).json({ message: "Insufficient NestCoins." });
    }

    await connection.execute(
      `UPDATE users
       SET nest_coins = nest_coins - :total
       WHERE id = :id`,
      { total, id: studentId }
    );

    await connection.execute(
      `INSERT INTO orders
       (id, student_id, total_nest_coins, payment_method, payment_status, status)
       VALUES (:id, :student_id, :total, 'NestCoins', 'Paid', 'Order Placed')`,
      {
        id: orderId,
        student_id: studentId,
        total
      }
    );

    await connection.execute(
      `INSERT INTO order_status_history (id, order_id, stage, simulated)
       VALUES (:id, :order_id, 'Order Placed', 1)`,
      {
        id: createId("osh"),
        order_id: orderId
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Order placed successfully.",
      orderId,
      totalNestCoins: total
    });
  } catch (error) {
    res.status(500).json({ message: "Order failed.", error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

router.post("/orders/:orderId/feedback", async (req, res) => {
  const { rating } = req.body;
  const { orderId } = req.params;
  const role = req.user.ROLE || req.user.role;

  if (role !== "student") {
    return res.status(403).json({ message: "Only students allowed." });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be 1 to 5." });
  }

  let connection;

  try {
    connection = await getConnection();

    await connection.execute(
      `INSERT INTO feedback (id, order_id, rating)
       VALUES (:id, :order_id, :rating)`,
      {
        id: createId("fb"),
        order_id: orderId,
        rating
      },
      { autoCommit: true }
    );

    res.json({ message: "Feedback submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Feedback failed.", error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;

