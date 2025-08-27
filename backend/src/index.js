import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'velampata'
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/items', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, amount, created_at FROM items ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/items', async (req, res) => {
  try {
    const { name, amount } = req.body || {};
    if (!name || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: require name (string) and amount (number)' });
    }
    const result = await pool.query(
      'INSERT INTO items (name, amount) VALUES ($1, $2) RETURNING id, name, amount, created_at',
      [name, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.listen(port, async () => {
  try {
    await ensureTable();
    console.log(`[backend] Server listening on port ${port}`);
  } catch (e) {
    console.error('Failed to ensure DB table:', e);
    process.exit(1);
  }
}); 