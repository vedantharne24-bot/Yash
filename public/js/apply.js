/* Multi-step team application */
const form = $('#applyForm');
const panes = $$('.pane', form);
let cur = 0;

// prefill from query (?ref=CODE&domain=...)
const qs = new URLSearchParams(location.search);
if (qs.get('ref')) form.referralCode.value = qs.get('ref').toUpperCase();
if (qs.get('domain')) form.idea.value = `Track interest: ${qs.get('domain')}\n`;

/* members */
const membersBox = $('#members');
function addMember(focus) {
  const n = $$('.member', membersBox).length;
  if (n >= 3) return toast('Teams can have at most 4 members', 'err');
  membersBox.insertAdjacentHTML('beforeend', `
    <div class="member form-grid">
      <label class="field"><span>TEAMMATE ${n + 2} NAME</span><input data-m="name" required maxlength="80" placeholder="Full name"/></label>
      <label class="field"><span>TEAMMATE ${n + 2} EMAIL</span><input data-m="email" type="email" required maxlength="120" placeholder="mate@example.com"/></label>
      <button type="button" class="m-del" aria-label="Remove teammate">×</button>
    </div>`);
  const m = membersBox.lastElementChild;
  gsap.from(m, { y: 20, opacity: 0, duration: .5, ease: 'expo.out' });
  if (focus) m.querySelector('input').focus();
  $('#addMember').hidden = n + 1 >= 3;
}
membersBox.addEventListener('click', (e) => {
  if (!e.target.matches('.m-del')) return;
  if ($$('.member', membersBox).length <= 1) return toast('You need at least one teammate', 'err');
  e.target.closest('.member').remove();
  $$('.member', membersBox).forEach((m, i) => $$('span', m).forEach((s, j) => (s.textContent = `TEAMMATE ${i + 2} ${j ? 'EMAIL' : 'NAME'}`)));
  $('#addMember').hidden = false;
});
$('#addMember').addEventListener('click', () => addMember(true));
addMember(false);

/* referral code live check */
let refT;
$('#refInput').addEventListener('input', (e) => {
  clearTimeout(refT);
  const v = e.target.value.trim();
  $('#refOk').textContent = '';
  if (v.length < 6) return;
  refT = setTimeout(async () => {
    const r = await fetch('/api/referrals/' + encodeURIComponent(v)).then((x) => x.json()).catch(() => ({}));
    $('#refOk').textContent = r.ok ? `✓ Referred by ${r.name}` : '✗ Code not found';
    $('#refOk').className = 'ref-ok ' + (r.ok ? 'good' : 'bad');
  }, 400);
});
if (form.referralCode.value) $('#refInput').dispatchEvent(new Event('input'));

/* steps */
function go(n) {
  const dir = n > cur ? 1 : -1;
  const from = panes[cur], to = panes[n];
  gsap.to(from, { x: -40 * dir, opacity: 0, duration: .25, onComplete: () => {
    from.classList.remove('on');
    to.classList.add('on');
    gsap.fromTo(to, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'expo.out' });
  } });
  cur = n;
  $$('.step').forEach((s, i) => { s.classList.toggle('on', i <= n); });
  gsap.to('#stepsFill', { width: (n / (panes.length - 1)) * 100 + '%', duration: .6, ease: 'expo.out' });
  $('#prevBtn').hidden = n === 0;
  $('#nextBtn').innerHTML = n === panes.length - 1 ? 'Submit application <span class="btn-dot">✓</span>' : 'Next <span class="btn-dot">→</span>';
}
function valid(pane) {
  for (const el of $$('input, textarea, select', pane)) if (!el.checkValidity()) { el.reportValidity(); return false; }
  return true;
}
$('#prevBtn').addEventListener('click', () => go(cur - 1));
$('#nextBtn').addEventListener('click', async () => {
  if (!valid(panes[cur])) return;
  if (cur < panes.length - 1) return go(cur + 1);
  const d = formData(form);
  d.agree = form.agree.checked;
  d.members = $$('.member', membersBox).map((m) => ({ name: m.querySelector('[data-m=name]').value.trim(), email: m.querySelector('[data-m=email]').value.trim() }));
  const btn = $('#nextBtn');
  setBusy(btn, true, 'Submitting…');
  const res = await postJSON('/api/register', d);
  setBusy(btn, false);
  if (!res.ok) return toast(res.error, 'err');
  $('#tTeam').textContent = d.teamName;
  $('#tTrack').textContent = d.track + ' · ' + (d.members.length + 1) + ' members';
  $('#tNo').textContent = res.ticket;
  $('#tMsg').textContent = `We've saved your application. Shortlists are announced on March 5 by email to ${d.leaderEmail}.` + (res.referredBy ? ` Thanks for joining via ${res.referredBy}'s invite!` : '');
  gsap.to([form, '#steps'], { opacity: 0, y: -30, duration: .4, onComplete: () => {
    form.hidden = true; $('#steps').hidden = true;
    const t = $('#ticket'); t.hidden = false;
    gsap.fromTo(t, { rotateX: -70, y: 80, opacity: 0, transformPerspective: 900 }, { rotateX: 0, y: 0, opacity: 1, duration: 1, ease: 'expo.out' });
    confetti(t);
    scrollToTarget(t);
  } });
});
