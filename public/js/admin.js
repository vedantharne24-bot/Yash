/* Organiser dashboard — all values rendered with escapeHTML */
const COLS = {
  registrations: [['id', '#'], ['created_at', 'Date'], ['team_name', 'Team'], ['track', 'Track'], ['leader_name', 'Lead'], ['leader_email', 'Email'], ['leader_phone', 'Phone'], ['college', 'College'], ['members', 'Members'], ['referral_code', 'Ref'], ['idea', 'Idea'], ['status', 'Status']],
  ambassadors: [['id', '#'], ['created_at', 'Date'], ['code', 'Code'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['college', 'College'], ['department', 'Dept'], ['semester', 'Sem'], ['points', 'Points']],
  orders: [['id', '#'], ['created_at', 'Date'], ['order_ref', 'Ref'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['items', 'Items'], ['subtotal', 'Subtotal'], ['discount', 'Disc.'], ['total', 'Total'], ['status', 'Status']],
  enquiries: [['id', '#'], ['created_at', 'Date'], ['kind', 'Type'], ['first_name', 'Name'], ['last_name', ''], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company'], ['tier', 'Tier'], ['message', 'Message'], ['status', 'Status']],
};
let table = 'registrations', rows = [], statuses = null;

async function api(url, opts) {
  const r = await fetch(url, opts);
  if (r.status === 401) { showLogin(); throw new Error('unauth'); }
  return r.json();
}
function showLogin() { $('#loginBox').hidden = false; $('#adminApp').hidden = true; }
async function showApp() {
  $('#loginBox').hidden = true; $('#adminApp').hidden = false;
  await Promise.all([loadStats(), load()]);
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postJSON('/api/admin/login', formData(e.target));
  if (!res.ok) { toast(res.error, 'err'); gsap.fromTo('#loginBox', { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); return; }
  e.target.reset();
  showApp();
});
$('#logoutBtn').addEventListener('click', async () => { await postJSON('/api/admin/logout', {}); showLogin(); });

async function loadStats() {
  const { stats: s } = await api('/api/admin/stats');
  const cards = [['Teams', s.teams], ['Hackers', s.hackers], ['Ambassadors', s.ambassadors], ['Orders', s.orders], ['Merch revenue', rupee(s.revenue)], ['New enquiries', s.enquiries]];
  $('#stats').innerHTML = cards.map(([k, v]) => `<div class="stat-card"><small>${k}</small><b>${escapeHTML(v)}</b></div>`).join('');
}

function cell(key, v, row) {
  if (key === 'members') { try { return JSON.parse(v).map((m) => escapeHTML(m.name) + ' &lt;' + escapeHTML(m.email) + '&gt;').join('<br>'); } catch (e) { return ''; } }
  if (key === 'items') { try { return JSON.parse(v).map((i) => `${i.quantity}× ${escapeHTML(i.name)}${i.fit ? ` (${escapeHTML(i.fit)}, ${escapeHTML(i.size)})` : ''}`).join('<br>'); } catch (e) { return ''; } }
  if (['subtotal', 'discount', 'total'].includes(key)) return rupee(v);
  if (key === 'status' && statuses) return `<select data-id="${row.id}" class="st st-${escapeHTML(v)}">${statuses.map((s) => `<option${s === v ? ' selected' : ''}>${s}</option>`).join('')}</select>`;
  if (key === 'email') return `<a href="mailto:${escapeHTML(v)}">${escapeHTML(v)}</a>`;
  return escapeHTML(v ?? '');
}
function render() {
  const q = $('#search').value.toLowerCase();
  const list = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : rows;
  const cols = COLS[table];
  $('#table').innerHTML = `<thead><tr>${cols.map(([, h]) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${list.length ? list.map((r) => `<tr>${cols.map(([k]) => `<td class="c-${k}">${cell(k, r[k], r)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="muted">Nothing here yet.</td></tr>`}</tbody>`;
}
async function load() {
  const res = await api('/api/admin/' + table);
  rows = res.rows; statuses = res.statuses;
  $('#exportBtn').href = `/api/admin/${table}/export.csv`;
  render();
}
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  table = b.dataset.t; $('#search').value = ''; load();
});
$('#search').addEventListener('input', render);
$('#table').addEventListener('change', async (e) => {
  const s = e.target.closest('select.st'); if (!s) return;
  const r = await api(`/api/admin/${table}/${s.dataset.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s.value }) });
  if (r.ok) { s.className = 'st st-' + s.value; toast('Status updated'); rows.find((x) => x.id == s.dataset.id).status = s.value; loadStats(); } else toast(r.error, 'err');
});

fetch('/api/admin/me').then((r) => (r.ok ? showApp() : showLogin()));
