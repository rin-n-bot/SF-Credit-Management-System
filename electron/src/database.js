import { Pool } from 'pg';
import 'dotenv/config';

console.log('DATABASE_URL loaded?', process.env.DATABASE_URL ? 'YES' : 'NO');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initializeDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id   SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      username  TEXT NOT NULL UNIQUE,
      password  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      customer_id SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      contact_no  TEXT NOT NULL UNIQUE,
      address     TEXT
    );

    CREATE TABLE IF NOT EXISTS credits (
      credit_id         SERIAL PRIMARY KEY,
      customer_id       INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
      trans_date        DATE NOT NULL,
      due_date          DATE NOT NULL,
      total_amount      NUMERIC(10,2) NOT NULL,
      remaining_balance NUMERIC(10,2) NOT NULL,
      status            TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS payments (
      payment_id  SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
      credit_id   INTEGER REFERENCES credits(credit_id) ON DELETE CASCADE,
      pay_date    DATE NOT NULL,
      amount_paid NUMERIC(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credit_details (
      detail_id  SERIAL PRIMARY KEY,
      credit_id  INTEGER NOT NULL REFERENCES credits(credit_id) ON DELETE CASCADE,
      item_name  TEXT NOT NULL,
      quantity   INTEGER NOT NULL,
      price      NUMERIC(10,2) NOT NULL
    );
  `);

  await db.query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS credit_id INTEGER REFERENCES credits(credit_id) ON DELETE CASCADE;
  `);
}