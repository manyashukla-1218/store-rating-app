require('dotenv').config();
const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const db = require('./db');
const { userErrors, storeErrors, passwordOk } = require('./validate');

const app = express();
app.use(cors());
app.use(express.json());

const sign = u => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
const auth = (...roles) => (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').split(' ')[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ message: 'Please login again' }); }
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ message: 'Server error' }); });
const fail = (res, msg, code = 400) => res.status(code).json({ message: msg });
const like = v => `%${(v || '').toString().trim()}%`;

async function createUser(b, role) {
  const errs = userErrors(b);
  if (errs.length) return { error: errs[0] };
  const email = b.email.trim().toLowerCase();
  if ((await db.query('SELECT 1 FROM users WHERE email=$1', [email])).rowCount) return { error: 'Email already registered' };
  const hash = await bcrypt.hash(b.password, 10);
  const r = await db.query(
    'INSERT INTO users(name,email,password_hash,address,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,address,role',
    [b.name.trim(), email, hash, (b.address || '').trim(), role]);
  return { user: r.rows[0] };
}

/* ---------- AUTH ---------- */
app.post('/api/auth/signup', wrap(async (req, res) => {
  const { error, user } = await createUser(req.body, 'user');
  if (error) return fail(res, error);
  res.status(201).json({ token: sign(user), user });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const r = await db.query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return fail(res, 'Invalid email or password', 401);
  res.json({ token: sign(u), user: { id: u.id, name: u.name, email: u.email, address: u.address, role: u.role } });
}));

app.put('/api/auth/password', auth(), wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const u = (await db.query('SELECT * FROM users WHERE id=$1', [req.user.id])).rows[0];
  if (!u || !(await bcrypt.compare(currentPassword || '', u.password_hash))) return fail(res, 'Current password is wrong');
  if (!passwordOk(newPassword)) return fail(res, 'Password: 8-16 chars, 1 uppercase & 1 special character');
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(newPassword, 10), u.id]);
  res.json({ message: 'Password updated' });
}));

/* ---------- ADMIN ---------- */
app.get('/api/admin/stats', auth('admin'), wrap(async (_req, res) => {
  const q = t => db.query(`SELECT COUNT(*)::int c FROM ${t}`);
  const [u, s, r] = await Promise.all([q('users'), q('stores'), q('ratings')]);
  res.json({ users: u.rows[0].c, stores: s.rows[0].c, ratings: r.rows[0].c });
}));

app.post('/api/admin/users', auth('admin'), wrap(async (req, res) => {
  const role = ['admin', 'user', 'owner'].includes(req.body.role) ? req.body.role : 'user';
  const { error, user } = await createUser(req.body, role);
  if (error) return fail(res, error);
  res.status(201).json(user);
}));

const USER_SQL = `SELECT u.id,u.name,u.email,u.address,u.role,
  CASE WHEN u.role='owner' THEN (SELECT ROUND(AVG(r.rating),1)::float FROM ratings r JOIN stores s ON s.id=r.store_id WHERE s.owner_id=u.id) END AS rating
  FROM users u`;

app.get('/api/admin/users', auth('admin'), wrap(async (req, res) => {
  const q = req.query;
  const r = await db.query(`${USER_SQL} WHERE u.name ILIKE $1 AND u.email ILIKE $2 AND u.address ILIKE $3 AND ($4='' OR u.role=$4) ORDER BY u.id DESC`,
    [like(q.name), like(q.email), like(q.address), q.role || '']);
  res.json(r.rows);
}));

app.get('/api/admin/users/:id', auth('admin'), wrap(async (req, res) => {
  const r = await db.query(`${USER_SQL} WHERE u.id=$1`, [Number(req.params.id) || 0]);
  if (!r.rows[0]) return fail(res, 'User not found', 404);
  res.json(r.rows[0]);
}));

app.post('/api/admin/stores', auth('admin'), wrap(async (req, res) => {
  const errs = storeErrors(req.body);
  if (errs.length) return fail(res, errs[0]);
  const b = req.body, email = b.email.trim().toLowerCase();
  if ((await db.query('SELECT 1 FROM stores WHERE email=$1', [email])).rowCount) return fail(res, 'Store email already exists');
  let ownerId = null;
  if (b.ownerId) {
    const o = await db.query("SELECT id FROM users WHERE id=$1 AND role='owner'", [b.ownerId]);
    if (!o.rowCount) return fail(res, 'Selected owner is invalid');
    ownerId = o.rows[0].id;
  }
  const r = await db.query('INSERT INTO stores(name,email,address,owner_id) VALUES($1,$2,$3,$4) RETURNING *', [b.name.trim(), email, b.address.trim(), ownerId]);
  res.status(201).json(r.rows[0]);
}));

app.get('/api/admin/stores', auth('admin'), wrap(async (req, res) => {
  const q = req.query;
  const r = await db.query(`SELECT s.id,s.name,s.email,s.address,ROUND(AVG(r.rating),1)::float AS rating
    FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
    WHERE s.name ILIKE $1 AND s.email ILIKE $2 AND s.address ILIKE $3 GROUP BY s.id ORDER BY s.id DESC`,
    [like(q.name), like(q.email), like(q.address)]);
  res.json(r.rows);
}));

/* ---------- NORMAL USER ---------- */
app.get('/api/stores', auth('user'), wrap(async (req, res) => {
  const r = await db.query(`SELECT s.id,s.name,s.address,ROUND(AVG(r.rating),1)::float AS overall,
    (SELECT rating FROM ratings WHERE store_id=s.id AND user_id=$1) AS my_rating
    FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
    WHERE s.name ILIKE $2 AND s.address ILIKE $3 GROUP BY s.id ORDER BY s.name`,
    [req.user.id, like(req.query.name), like(req.query.address)]);
  res.json(r.rows);
}));

app.put('/api/stores/:id/rating', auth('user'), wrap(async (req, res) => {
  const rating = Number(req.body.rating), sid = Number(req.params.id);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 'Rating must be between 1 and 5');
  if (!(await db.query('SELECT 1 FROM stores WHERE id=$1', [sid])).rowCount) return fail(res, 'Store not found', 404);
  await db.query(`INSERT INTO ratings(user_id,store_id,rating) VALUES($1,$2,$3)
    ON CONFLICT (user_id,store_id) DO UPDATE SET rating=EXCLUDED.rating, updated_at=now()`, [req.user.id, sid, rating]);
  res.json({ message: 'Rating saved' });
}));

/* ---------- STORE OWNER ---------- */
app.get('/api/owner/dashboard', auth('owner'), wrap(async (req, res) => {
  const st = (await db.query('SELECT id,name,address FROM stores WHERE owner_id=$1 LIMIT 1', [req.user.id])).rows[0];
  if (!st) return res.json({ store: null, average: null, raters: [] });
  const avg = (await db.query('SELECT ROUND(AVG(rating),1)::float a FROM ratings WHERE store_id=$1', [st.id])).rows[0].a;
  const raters = (await db.query(`SELECT u.id,u.name,u.email,r.rating,r.updated_at FROM ratings r JOIN users u ON u.id=r.user_id
    WHERE r.store_id=$1 ORDER BY r.updated_at DESC`, [st.id])).rows;
  res.json({ store: st, average: avg, raters });
}));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
