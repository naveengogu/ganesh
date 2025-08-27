import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'velampata'
});

async function ensureTables() {
  try {
    console.log('Creating tables...');
    
    // Drop existing tables in correct order (due to foreign key constraints)
    try {
      await pool.query('DROP TABLE IF EXISTS items CASCADE');
      await pool.query('DROP TABLE IF EXISTS tenants CASCADE');
      await pool.query('DROP TABLE IF EXISTS admins CASCADE');
    } catch (error) {
      // Ignore drop errors
    }
    
    // Admin table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Tenants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Items table with tenant_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        last_button_clicked INTEGER DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create default admin if not exists
    const adminExists = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', passwordHash]);
    }
    
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Middleware to verify admin JWT
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to get tenant from slug
const getTenantFromSlug = async (req, res, next) => {
  try {
    const tenantSlug = req.params.tenantSlug;
    const tenant = await pool.query('SELECT * FROM tenants WHERE slug = $1', [tenantSlug]);
    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    req.tenant = tenant.rows[0];
    next();
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({ error: 'Failed to get tenant' });
  }
};

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Admin authentication
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (admin.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { id: admin.rows[0].id, username: admin.rows[0].username } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin dashboard - get all tenants
app.get('/admin/tenants', authenticateAdmin, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, slug, description, created_at FROM tenants ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Admin dashboard - create tenant
app.post('/admin/tenants', authenticateAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const result = await pool.query(
      'INSERT INTO tenants (name, slug, description) VALUES ($1, $2, $3) RETURNING id, name, slug, description, created_at',
      [name, slug, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Tenant with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  }
});

// Admin dashboard - delete tenant
app.delete('/admin/tenants/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
    res.json({ message: 'Tenant deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Tenant-specific items endpoints
app.get('/tenant/:tenantSlug/items', getTenantFromSlug, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, amount, last_button_clicked, created_at FROM items WHERE tenant_id = $1 ORDER BY id DESC',
      [req.tenant.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/tenant/:tenantSlug/items', getTenantFromSlug, async (req, res) => {
  try {
    const { name, amount } = req.body;
    if (!name || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: require name (string) and amount (number)' });
    }
    const result = await pool.query(
      'INSERT INTO items (tenant_id, name, amount, last_button_clicked) VALUES ($1, $2, $3, $4) RETURNING id, name, amount, last_button_clicked, created_at',
      [req.tenant.id, name, amount, 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.delete('/tenant/:tenantSlug/items/:itemId', getTenantFromSlug, async (req, res) => {
  try {
    const { itemId } = req.params;
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [itemId, req.tenant.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.patch('/tenant/:tenantSlug/items/:itemId/button', getTenantFromSlug, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { buttonNumber } = req.body;
    
    if (!buttonNumber || ![1, 2, 3].includes(buttonNumber)) {
      return res.status(400).json({ error: 'Invalid button number. Must be 1, 2, or 3.' });
    }
    
    const result = await pool.query(
      'UPDATE items SET last_button_clicked = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, last_button_clicked',
      [buttonNumber, itemId, req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Button clicked updated', last_button_clicked: result.rows[0].last_button_clicked });
  } catch (error) {
    console.error('Error updating button clicked:', error);
    res.status(500).json({ error: 'Failed to update button clicked' });
  }
});

// Get tenant info
app.get('/tenant/:tenantSlug', getTenantFromSlug, async (req, res) => {
  res.json(req.tenant);
});

app.listen(port, async () => {
  try {
    await ensureTables();
    console.log(`[backend] Server listening on port ${port}`);
  } catch (e) {
    console.error('Failed to ensure DB tables:', e);
    process.exit(1);
  }
}); 