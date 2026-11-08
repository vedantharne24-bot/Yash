/* Referral program */
async function loadBoard() {
  const ol = $('#leaderboard');
  try {
    const { rows } = await fetch('/api/referrals/leaderboard').then((r) => r.json());
    if (!rows.length) { ol.innerHTML = '<li class="muted">No points yet — be the first on the board!</li>'; return; }
    ol.innerHTML = rows.map((r, i) => `<li><span class="lb-rank">${i + 1}</span><span class="lb-name">${escapeHTML(r.name)}<small>${escapeHTML(r.college)}</small></span><b>${r.points} pts</b></li>`).join('');
    gsap.from('#leaderboard li', { x: -30, opacity: 0, stagger: .06, duration: .6, ease: 'expo.out' });
  } catch (e) { ol.innerHTML = '<li class="muted">Leaderboard unavailable.</li>'; }
}
loadBoard();

function showCode(code, points, existing) {
  const card = $('#codeCard');
  $('#myCode').textContent = '';
  $('#myPoints').textContent = existing ? `Welcome back! You have ${points} points.` : 'Share it — every teammate who registers with it earns you 25 points.';
  const link = `${location.origin}/apply?ref=${encodeURIComponent(code)}`;
  const msg = `Join me at CodeCoast S01 — a 36h seaside hackathon with ₹2L+ prizes! Register with my code ${code}: ${link}`;
  $('#waShare').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  $('#copyCode').onclick = () => copy(code, 'Code copied!');
  $('#copyLink').onclick = () => copy(link, 'Invite link copied!');
  card.hidden = false;
  gsap.fromTo(card, { scale: .8, opacity: 0, rotate: -3 }, { scale: 1, opacity: 1, rotate: 0, duration: .8, ease: 'back.out(1.8)' });
  // typewriter reveal of the code
  let i = 0;
  const t = setInterval(() => { $('#myCode').textContent = code.slice(0, ++i); if (i >= code.length) clearInterval(t); }, 70);
  confetti(card);
  store.set('cc_my_code', code);
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); } catch (e) { prompt('Copy this:', text); }
}

$('#referForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  if (!f.reportValidity()) return;
  const btn = $('#referBtn');
  setBusy(btn, true, 'Generating…');
  const res = await postJSON('/api/referrals', formData(f));
  setBusy(btn, false);
  if (!res.ok) return toast(res.error, 'err');
  gsap.to(f, { height: 0, opacity: 0, duration: .5, ease: 'power3.inOut', onComplete: () => (f.hidden = true) });
  showCode(res.code, res.points, res.existing);
});

gsap.to('.amb-pixels', { backgroundPosition: '40px 40px', duration: 4, repeat: -1, ease: 'none' });
