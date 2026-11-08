/* Contact form */
const cf = $('#contactForm');
cf.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!cf.reportValidity()) return;
  const btn = $('#contactBtn');
  setBusy(btn, true);
  const res = await postJSON('/api/contact', { ...formData(cf), kind: 'general' });
  setBusy(btn, false);
  if (!res.ok) return toast(res.error, 'err');
  cf.reset();
  gsap.to(cf, { opacity: 0, y: -20, duration: .35, onComplete: () => {
    cf.hidden = true;
    const s = $('#sentCard'); s.hidden = false;
    gsap.fromTo(s, { scale: .85, opacity: 0 }, { scale: 1, opacity: 1, duration: .7, ease: 'back.out(1.8)' });
    confetti($('#sentCard .done-tick'));
  } });
});
$('#againBtn').addEventListener('click', () => {
  $('#sentCard').hidden = true; cf.hidden = false;
  gsap.fromTo(cf, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5 });
});
gsap.from('.cp-right .field', { y: 30, opacity: 0, stagger: .06, duration: .7, ease: 'expo.out', delay: .5 });
