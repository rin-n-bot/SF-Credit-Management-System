import { ipcMain } from 'electron';
import bcrypt from 'bcrypt';
import { db } from './database.js';

ipcMain.handle('auth:register', async (_, data) => {
  try {
    const existing = await db.query(`SELECT user_id FROM users LIMIT 1`);
    if (existing.rows.length > 0) {
      return { success: false, message: 'An account already exists. Only one owner account is allowed.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const result = await db.query(
      `INSERT INTO users (full_name, username, password)
       VALUES ($1, $2, $3)
       RETURNING user_id, full_name, username`,
      [data.full_name, data.username, hashedPassword],
    );

    return { success: true, user: result.rows[0] };
  } catch (err) {
    console.error('auth:register error:', err);
    return { success: false, message: 'Registration failed. Username may already be taken.' };
  }
});

ipcMain.handle('auth:login', async (_, data) => {
  try {
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [data.username]);
    const user = result.rows[0];

    if (!user) return { success: false, message: 'Invalid username or password.' };

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return { success: false, message: 'Invalid username or password.' };

    const { password, ...safeUser } = user;
    return { success: true, user: safeUser };
  } catch (err) {
    console.error('auth:login error:', err);
    return { success: false, message: 'Server error during login.' };
  }
});

ipcMain.handle('customer:getAll', async () => {
  const result = await db.query(`SELECT * FROM customers ORDER BY name ASC`);
  return result.rows;
});

ipcMain.handle('customer:add', async (_, data) => {
  const result = await db.query(
    `INSERT INTO customers (name, contact_no, address)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.name, data.contact_no, data.address ?? null],
  );

  return result.rows[0];
});

ipcMain.handle('customer:update', async (_, data) => {
  const result = await db.query(
    `UPDATE customers
     SET name = $1, contact_no = $2, address = $3
     WHERE customer_id = $4
     RETURNING *`,
    [data.name, data.contact_no, data.address ?? null, data.customer_id],
  );

  return result.rows[0];
});

ipcMain.handle('customer:delete', async (_, customer_id) => {
  await db.query(`DELETE FROM customers WHERE customer_id = $1`, [customer_id]);
  return { success: true };
});

ipcMain.handle('credit:getAll', async () => {
  const result = await db.query(`SELECT * FROM credits ORDER BY trans_date DESC`);
  return result.rows;
});

ipcMain.handle('credit:getByCustomer', async (_, customer_id) => {
  const result = await db.query(
    `SELECT * FROM credits WHERE customer_id = $1 ORDER BY trans_date DESC`,
    [customer_id],
  );

  return result.rows;
});

ipcMain.handle('credit:add', async (_, data) => {
  const result = await db.query(
    `INSERT INTO credits (customer_id, trans_date, due_date, total_amount, remaining_balance, status)
     VALUES ($1, $2, $3, $4, $4, 'Active')
     RETURNING *`,
    [data.customer_id, data.trans_date, data.due_date, data.total_amount],
  );

  return result.rows[0];
});

ipcMain.handle('credit:update', async (_, data) => {
  const result = await db.query(
    `UPDATE credits
     SET due_date = $1, total_amount = $2
     WHERE credit_id = $3
     RETURNING *`,
    [data.due_date, data.total_amount, data.credit_id],
  );

  return result.rows[0];
});

ipcMain.handle('credit:delete', async (_, credit_id) => {
  await db.query(`DELETE FROM credits WHERE credit_id = $1`, [credit_id]);
  return { success: true };
});

ipcMain.handle('payment:getAll', async () => {
  const result = await db.query(`SELECT * FROM payments ORDER BY pay_date DESC, payment_id DESC`);
  return result.rows;
});

ipcMain.handle('payment:getByCustomer', async (_, customer_id) => {
  const result = await db.query(
    `SELECT * FROM payments
     WHERE customer_id = $1
     ORDER BY pay_date DESC, payment_id DESC`,
    [customer_id],
  );

  return result.rows;
});

ipcMain.handle('payment:add', async (_, data) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const creditResult = await client.query(
      `SELECT remaining_balance, due_date
       FROM credits
       WHERE credit_id = $1
       FOR UPDATE`,
      [data.credit_id],
    );

    const credit = creditResult.rows[0];
    if (!credit) throw new Error('Credit not found.');

    const currentBalance = Number(credit.remaining_balance);
    const amountPaid = Number(data.amount_paid);

    if (amountPaid <= 0) throw new Error('Payment amount must be greater than zero.');
    if (amountPaid > currentBalance) throw new Error('Payment amount cannot exceed credit balance.');

    const paymentResult = await client.query(
      `INSERT INTO payments (customer_id, credit_id, pay_date, amount_paid)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.customer_id, data.credit_id, data.pay_date, amountPaid],
    );

    const newBalance = Math.max(currentBalance - amountPaid, 0);
    const today = new Date();
    const dueDate = new Date(credit.due_date);
    const isOverdue = today > dueDate;
    const newStatus = newBalance <= 0 ? 'Paid' : isOverdue ? 'Overdue' : 'Partially Paid';

    await client.query(
      `UPDATE credits
       SET remaining_balance = $1, status = $2
       WHERE credit_id = $3`,
      [newBalance, newStatus, data.credit_id],
    );

    await client.query('COMMIT');
    return paymentResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('payment:add error:', err);
    throw err;
  } finally {
    client.release();
  }
});

ipcMain.handle('payment:delete', async (_, payment_id) => {
  await db.query(`DELETE FROM payments WHERE payment_id = $1`, [payment_id]);
  return { success: true };
});

ipcMain.handle('creditDetail:getByCredit', async (_, credit_id) => {
  const result = await db.query(
    `SELECT * FROM credit_details WHERE credit_id = $1 ORDER BY detail_id ASC`,
    [credit_id],
  );

  return result.rows;
});

ipcMain.handle('creditDetail:add', async (_, data) => {
  const result = await db.query(
    `INSERT INTO credit_details (credit_id, item_name, quantity, price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.credit_id, data.item_name, data.quantity, data.price],
  );

  return result.rows[0];
});