/* Sponsorship enquiries */
const sm = $('#sponsorModal'), sf = $('#sponsorForm');
$$('.open-sponsor').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.tier) sf.tier.value = b.dataset.tier;
  openModal(sm);
  setTimeout(() => sf.firstName.focus(), 300);
}));
sf.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!sf.reportValidity()) return;
  const btn = $('#sponsorBtn');
  setBusy(btn, true);
  const res = await postJSON('/api/contact', { ...formData(sf), kind: 'sponsor' });
  setBusy(btn, false);
  if (!res.ok) return toast(res.error, 'err');
  sf.reset();
  closeModal(sm);
  toast('Thanks! Our partnerships team will reach out within 48 hours.');
  confetti(document.querySelector('.ready .btn'));
});
gsap.from('.compare tbody tr', { opacity: 0, x: -20, stagger: .04, duration: .5, scrollTrigger: { trigger: '.compare', start: 'top 80%' } });
