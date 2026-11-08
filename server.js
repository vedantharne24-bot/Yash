const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'codecoast-admin';
const SITE = { name: 'CodeCoast', season: 'S01' };
if (!process.env.ADMIN_PASSWORD) console.warn('⚠  ADMIN_PASSWORD not set — using the default "codecoast-admin". Set it before deploying!');

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: false }));

/* ------------------------------------------------------------------ */
/* Page rendering: views/<page>.html is wrapped in views/layout.html  */
/* ------------------------------------------------------------------ */
const VIEWS = path.join(__dirname, 'views');
const read = (f) => fs.readFileSync(path.join(VIEWS, f), 'utf8');
const PAGES = {
  '/':                 { view: 'home',     title: 'CodeCoast S01 — Ride the Tide of Innovation', js: ['home'] },
  '/apply':            { view: 'apply',    title: 'Apply | CodeCoast S01', js: ['apply'] },
  '/merch':            { view: 'merch',    title: 'Official Merch | CodeCoast S01', js: ['merch'] },
  '/checkout':         { view: 'checkout', title: 'Your Cart | CodeCoast S01', js: ['checkout'] },
  '/refer':            { view: 'refer',    title: 'Referral Program | CodeCoast S01', js: ['refer'] },
  '/contact':          { view: 'contact',  title: 'Contact | CodeCoast S01', js: ['contact'] },
  '/sponsorship':      { view: 'sponsorship', title: 'Sponsorship | CodeCoast S01', js: ['sponsorship'] },
  '/gallery':          { view: 'gallery',  title: 'Gallery | CodeCoast S01', js: ['gallery'] },
  '/about':            { view: 'about',    title: 'About | CodeCoast S01', js: [] },
  '/code-of-conduct':  { view: 'code-of-conduct', title: 'Code of Conduct | CodeCoast S01', js: [] },
  '/privacy-policy':   { view: 'privacy-policy',  title: 'Privacy Policy | CodeCoast S01', js: [] },
  '/terms':            { view: 'terms',    title: 'Terms & Conditions | CodeCoast S01', js: [] },
  '/admin':            { view: 'admin',    title: 'Admin | CodeCoast S01', js: ['admin'], bare: true },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render(res, page, extra = {}, status = 200) {
  const layout = read('layout.html');
  let body = read(page.view + '.html');
  for (const [k, v] of Object.entries(extra)) body = body.split(`{{${k}}}`).join(v);
  const scripts = page.js.map((j) => `<script src="/js/${j}.js"></script>`).join('\n');
  const html = layout
    .replace('{{TITLE}}', esc(page.title))
    .replace('{{BODY_CLASS}}', 'page-' + page.view + (page.bare ? ' bare' : ''))
    .replace('{{BODY}}', body)
    .replace('{{SCRIPTS}}', scripts);
  res.status(status).type('html').send(html);
}

for (const [route, page] of Object.entries(PAGES)) app.get(route, (req, res) => render(res, page));

app.get('/merch/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!p) return render(res, { view: '404', title: 'Not found | CodeCoast', js: [] }, {}, 404);
  render(res, { view: 'product', title: `${p.name} | CodeCoast Merch`, js: ['product'] }, { SLUG: esc(p.slug) });
});

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

// tiny in-memory rate limiter for public POST endpoints
const hits = new Map();
function limit(max = 10, windowMs = 60_000) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return bad(res, 'Too many requests — please wait a minute and try again.', 429);
    arr.push(now); hits.set(key, arr); next();
  };
}
setInterval(() => hits.clear(), 10 * 60_000).unref();

function makeCode(name) {
  const base = (name.replace(/[^a-z]/gi, '').toUpperCase() + 'XXXX').slice(0, 4);
  for (;;) {
    const code = `CC-${base}${crypto.randomInt(100, 999)}`;
    if (!db.prepare('SELECT 1 FROM ambassadors WHERE code = ?').get(code)) return code;
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */
const POINTS_PER_MEMBER = 25;
const TRACKS = ['CodeCoast Open', 'Build For Good'];

app.post('/api/register', limit(5), (req, res) => {
  const b = req.body || {};
  const team = clean(b.teamName, 60), track = clean(b.track, 40);
  const leader = { name: clean(b.leaderName, 80), email: clean(b.leaderEmail, 120).toLowerCase(), phone: clean(b.leaderPhone, 20) };
  const college = clean(b.college, 120), idea = clean(b.idea, 1000), ref = clean(b.referralCode, 20).toUpperCase();
  const members = Array.isArray(b.members) ? b.members.slice(0, 3).map((m) => ({ name: clean(m?.name, 80), email: clean(m?.email, 120).toLowerCase() })).filter((m) => m.name || m.email) : [];

  if (!team || !leader.name || !college) return bad(res, 'Please fill in team name, your name and college.');
  if (!TRACKS.includes(track)) return bad(res, 'Please choose a track.');
  if (!EMAIL.test(leader.email)) return bad(res, 'Please enter a valid email address.');
  if (!PHONE.test(leader.phone)) return bad(res, 'Please enter a valid phone number.');
  if (members.length < 1) return bad(res, 'Teams need at least 2 members (you + 1).');
  for (const m of members) if (!m.name || !EMAIL.test(m.email)) return bad(res, 'Every team member needs a name and a valid email.');
  if (!b.agree) return bad(res, 'Please accept the Code of Conduct.');
  if (db.prepare('SELECT 1 FROM registrations WHERE leader_email = ?').get(leader.email)) return bad(res, 'A team is already registered with this email.', 409);

  let amb = null;
  if (ref) {
    amb = db.prepare('SELECT id, name FROM ambassadors WHERE code = ?').get(ref);
    if (!amb) return bad(res, 'That referral code does not exist. Leave it empty or check for typos.');
  }
  const info = db.prepare(`INSERT INTO registrations (team_name,track,leader_name,leader_email,leader_phone,college,members,idea,referral_code)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(team, track, leader.name, leader.email, leader.phone, college, JSON.stringify(members), idea, amb ? ref : null);
  if (amb) db.prepare('UPDATE ambassadors SET points = points + ? WHERE id = ?').run(POINTS_PER_MEMBER * (members.length + 1), amb.id);
  res.json({ ok: true, id: info.lastInsertRowid, ticket: `CC01-${String(info.lastInsertRowid).padStart(4, '0')}`, referredBy: amb ? amb.name : null });
});

app.post('/api/referrals', limit(5), (req, res) => {
  const b = req.body || {};
  const d = { name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120).toLowerCase(), college: clean(b.college, 120), department: clean(b.department, 60), semester: clean(b.semester, 20) };
  if (!d.name || !d.college) return bad(res, 'Please fill in your name and college.');
  if (!EMAIL.test(d.email)) return bad(res, 'Please enter a valid email address.');
  if (!PHONE.test(d.phone)) return bad(res, 'Please enter a valid phone number.');
  const existing = db.prepare('SELECT code, points FROM ambassadors WHERE email = ?').get(d.email);
  if (existing) return res.json({ ok: true, code: existing.code, points: existing.points, existing: true });
  const code = makeCode(d.name);
  db.prepare('INSERT INTO ambassadors (code,name,phone,email,college,department,semester) VALUES (?,?,?,?,?,?,?)')
    .run(code, d.name, d.phone, d.email, d.college, d.department, d.semester);
  res.json({ ok: true, code, points: 0 });
});

app.get('/api/referrals/leaderboard', (req, res) => {
  const rows = db.prepare('SELECT name, college, points FROM ambassadors WHERE points > 0 ORDER BY points DESC, created_at ASC LIMIT 10').all();
  // only first name + initial for privacy
  res.json({ ok: true, rows: rows.map((r) => ({ name: r.name.split(' ')[0] + (r.name.split(' ')[1] ? ' ' + r.name.split(' ')[1][0] + '.' : ''), college: r.college, points: r.points })) });
});

app.get('/api/referrals/:code', (req, res) => {
  const r = db.prepare('SELECT name, points FROM ambassadors WHERE code = ?').get(clean(req.params.code, 20).toUpperCase());
  if (!r) return bad(res, 'Code not found', 404);
  const teams = db.prepare('SELECT COUNT(*) AS n FROM registrations WHERE referral_code = ?').get(req.params.code.toUpperCase()).n;
  res.json({ ok: true, name: r.name.split(' ')[0], points: r.points, teams });
});

app.post('/api/contact', limit(5), (req, res) => {
  const b = req.body || {};
  const kind = b.kind === 'sponsor' ? 'sponsor' : 'general';
  const d = { first: clean(b.firstName, 60), last: clean(b.lastName, 60), email: clean(b.email, 120).toLowerCase(), phone: clean(b.phone, 20), company: clean(b.company, 100), tier: clean(b.tier, 30), msg: clean(b.message, 3000) };
  if (!d.first) return bad(res, 'Please tell us your name.');
  if (!EMAIL.test(d.email)) return bad(res, 'Please enter a valid email address.');
  if (d.phone && !PHONE.test(d.phone)) return bad(res, 'Please enter a valid phone number.');
  if (kind === 'sponsor' && !d.company) return bad(res, 'Please tell us your company name.');
  if (d.msg.length < 5) return bad(res, 'Please write a short message.');
  db.prepare('INSERT INTO enquiries (kind,first_name,last_name,email,phone,company,tier,message) VALUES (?,?,?,?,?,?,?,?)')
    .run(kind, d.first, d.last, d.email, d.phone, d.company, d.tier, d.msg);
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => res.json({ ok: true, rows: db.prepare('SELECT * FROM products ORDER BY rowid').all() }));
app.get('/api/products/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  p ? res.json({ ok: true, product: p }) : bad(res, 'Not found', 404);
});

const FITS = { Regular: 0, Oversized: 100 };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
app.post('/api/orders', limit(5), (req, res) => {
  const b = req.body || {};
  const d = { name: clean(b.name, 80), email: clean(b.email, 120).toLowerCase(), phone: clean(b.phone, 20), college: clean(b.college, 120) };
  if (!d.name) return bad(res, 'Please enter your name.');
  if (!EMAIL.test(d.email)) return bad(res, 'Please enter a valid email address.');
  if (!PHONE.test(d.phone)) return bad(res, 'Please enter a valid phone number.');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 20) return bad(res, 'Your cart is empty.');

  // Re-price everything on the server — never trust client prices
  const items = [];
  for (const it of b.items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(String(it.productId));
    const qty = Math.max(1, Math.min(10, parseInt(it.quantity, 10) || 1));
    if (!p) return bad(res, 'One of the items is no longer available.');
    let fit = null, size = null, price = p.price;
    if (p.has_sizes) {
      fit = it.fit in FITS ? it.fit : null; size = SIZES.includes(it.size) ? it.size : null;
      if (!fit || !size) return bad(res, `Please choose a fit and size for ${p.name}.`);
      price += FITS[fit];
    }
    if (p.stock < qty) return bad(res, `Sorry, ${p.name} is out of stock.`);
    items.push({ productId: p.id, name: p.name, fit, size, quantity: qty, price, lineTotal: price * qty });
  }
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const tees = items.filter((i) => i.fit).reduce((s, i) => s + i.quantity, 0);
  const discount = tees >= 2 ? 50 : 0;
  const total = subtotal - discount;
  const ref = 'CCM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  db.prepare('INSERT INTO orders (order_ref,name,email,phone,college,items,subtotal,discount,total) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(ref, d.name, d.email, d.phone, d.college, JSON.stringify(items), subtotal, discount, total);
  for (const i of items) db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(i.quantity, i.productId);
  res.json({ ok: true, orderRef: ref, subtotal, discount, total });
});

/* ------------------------------------------------------------------ */
/* Admin API (cookie session)                                         */
/* ------------------------------------------------------------------ */
const sessions = new Set();
const cookieToken = (req) => (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === 'cc_admin')?.[1];
const requireAdmin = (req, res, next) => (sessions.has(cookieToken(req)) ? next() : bad(res, 'Unauthorised', 401));

app.post('/api/admin/login', limit(8), (req, res) => {
  const pw = String(req.body?.password || '');
  const a = Buffer.from(pw), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return bad(res, 'Wrong password', 401);
  const t = crypto.randomBytes(24).toString('hex');
  sessions.add(t);
  res.setHeader('Set-Cookie', `cc_admin=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 12}`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => { sessions.delete(cookieToken(req)); res.setHeader('Set-Cookie', 'cc_admin=; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));

const TABLES = {
  registrations: { sql: 'SELECT * FROM registrations ORDER BY id DESC', statuses: ['pending', 'shortlisted', 'rejected'] },
  ambassadors: { sql: 'SELECT * FROM ambassadors ORDER BY points DESC, id DESC', statuses: null },
  orders: { sql: 'SELECT * FROM orders ORDER BY id DESC', statuses: ['pending', 'paid', 'ready', 'collected', 'cancelled'] },
  enquiries: { sql: 'SELECT * FROM enquiries ORDER BY id DESC', statuses: ['new', 'replied', 'closed'] },
};
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const n = (sql) => db.prepare(sql).get().n;
  res.json({ ok: true, stats: {
    teams: n('SELECT COUNT(*) n FROM registrations'),
    hackers: db.prepare('SELECT members FROM registrations').all().reduce((s, r) => s + JSON.parse(r.members).length + 1, 0),
    ambassadors: n('SELECT COUNT(*) n FROM ambassadors'),
    orders: n('SELECT COUNT(*) n FROM orders WHERE status != \'cancelled\''),
    revenue: db.prepare("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status IN ('paid','ready','collected')").get().n,
    enquiries: n("SELECT COUNT(*) n FROM enquiries WHERE status = 'new'"),
  } });
});
app.get('/api/admin/:table', requireAdmin, (req, res) => {
  const t = TABLES[req.params.table];
  if (!t) return bad(res, 'Unknown table', 404);
  res.json({ ok: true, rows: db.prepare(t.sql).all(), statuses: t.statuses });
});
app.patch('/api/admin/:table/:id', requireAdmin, (req, res) => {
  const t = TABLES[req.params.table];
  if (!t || !t.statuses) return bad(res, 'Not editable');
  const s = String(req.body?.status);
  if (!t.statuses.includes(s)) return bad(res, 'Invalid status');
  db.prepare(`UPDATE ${req.params.table} SET status = ? WHERE id = ?`).run(s, Number(req.params.id));
  res.json({ ok: true });
});
app.get('/api/admin/:table/export.csv', requireAdmin, (req, res) => {
  const t = TABLES[req.params.table];
  if (!t) return bad(res, 'Unknown table', 404);
  const rows = db.prepare(t.sql).all();
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"` : s; };
  res.type('text/csv').attachment(`${req.params.table}.csv`).send([cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n'));
});

/* 404 */
app.use('/api', (req, res) => bad(res, 'Not found', 404));
app.use((req, res) => render(res, { view: '404', title: 'Not found | CodeCoast', js: [] }, {}, 404));

app.listen(PORT, () => console.log(`🌊 CodeCoast running at http://localhost:${PORT}  (admin: /admin)`));
