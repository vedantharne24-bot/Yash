/* CodeCoast — shared behaviour for every page */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(pointer: fine)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN');

/* ---------- smooth scroll ---------- */
let lenis = null;
if (window.Lenis && !REDUCE && !document.body.classList.contains('bare')) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToTarget(target) {
  if (lenis) return lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : -20 });
  if (typeof target === 'number') return scrollTo({ top: target, behavior: 'smooth' });
  target.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- toast ---------- */
let toastT;
function toast(msg, type = 'ok') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- page transition curtain ---------- */
const curtain = $('#curtain');
const cols = $$('.curtain-cols i');
const curtainLogo = $('.curtain-logo');
function curtainOut() { // reveal page
  gsap.set(curtain, { autoAlpha: 1 });
  const tl = gsap.timeline({ onComplete: () => gsap.set(curtain, { autoAlpha: 0 }) });
  tl.to(curtainLogo, { scale: .8, opacity: 0, duration: .35, ease: 'power2.in' })
    .to(cols, { yPercent: -100, duration: .7, stagger: .06, ease: 'expo.inOut' }, '-=.1');
  return tl;
}
function curtainIn(href) { // cover page then navigate
  curtain.dataset.leaving = '1';
  setTimeout(() => (location.href = href), 1500); // safety net
  gsap.set(curtain, { autoAlpha: 1 });
  gsap.set(cols, { yPercent: 100 });
  gsap.set(curtainLogo, { scale: .8, opacity: 0 });
  gsap.timeline({ onComplete: () => (location.href = href) })
    .to(cols, { yPercent: 0, duration: .6, stagger: .05, ease: 'expo.inOut' })
    .to(curtainLogo, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2)' }, '-=.2');
}
gsap.ticker.lagSmoothing(0); // keep animations in real time even if frames are throttled
if (REDUCE) gsap.set(curtain, { autoAlpha: 0 }); else curtainOut();
setTimeout(() => { if (!curtain.dataset.leaving) gsap.set(curtain, { autoAlpha: 0 }); }, 2000); // safety net
addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(curtain, { autoAlpha: 0 }); });

/* ---------- link handling: in-page anchors scroll, other pages get the curtain ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.getAttribute('href'), location.href);
  if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
  closeMenu();
  if (url.pathname === location.pathname && url.hash) {
    const el = document.querySelector(url.hash);
    if (el) { e.preventDefault(); scrollToTarget(el); history.replaceState(null, '', url.hash); }
    return;
  }
  if (url.pathname === location.pathname && !url.hash) { e.preventDefault(); scrollToTarget(0); return; }
  if (REDUCE) return;
  e.preventDefault();
  curtainIn(url.href);
});
// arriving with a #hash from another page
if (location.hash) addEventListener('load', () => { const el = document.querySelector(location.hash); if (el) setTimeout(() => scrollToTarget(el), 600); });

/* ---------- nav: hide on scroll down, show on scroll up ---------- */
const nav = $('#siteNav');
let lastY = 0;
const onScrollNav = () => {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 40);
  nav.classList.toggle('hidden', y > 300 && y > lastY && !document.body.classList.contains('menu-open'));
  lastY = y;
};
addEventListener('scroll', onScrollNav, { passive: true });
$$('.nav-pill a').forEach((a) => { if (a.getAttribute('href') === location.pathname) a.classList.add('active'); });

/* ---------- full-screen menu ---------- */
const menuBtn = $('#menuBtn'), overlay = $('#menuOverlay');
const menuTl = gsap.timeline({ paused: true })
  .set(overlay, { visibility: 'visible' })
  .fromTo(overlay, { clipPath: 'circle(0% at calc(100% - 3.5rem) 3.5rem)' }, { clipPath: 'circle(150% at calc(100% - 3.5rem) 3.5rem)', duration: .8, ease: 'expo.inOut' })
  .from('.menu-links a', { yPercent: 120, opacity: 0, duration: .6, stagger: .05, ease: 'expo.out' }, '-=.35')
  .from('.menu-foot', { opacity: 0, y: 20, duration: .4 }, '-=.3');
function openMenu() { document.body.classList.add('menu-open'); menuBtn.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); lenis?.stop(); menuTl.timeScale(1).play(); }
function closeMenu() { if (!document.body.classList.contains('menu-open')) return; document.body.classList.remove('menu-open'); menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); lenis?.start(); menuTl.timeScale(1.6).reverse(); }
menuBtn.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); $$('.modal.show').forEach((m) => m.classList.remove('show')); } });

/* ---------- modals (generic) ---------- */
function openModal(m) { m.classList.add('show'); m.setAttribute('aria-hidden', 'false'); }
function closeModal(m) { m.classList.remove('show'); m.setAttribute('aria-hidden', 'true'); }
$$('.modal').forEach((m) => {
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
});

/* ---------- cart (localStorage) ---------- */
const cart = {
  items() { return store.get('cc_cart', []); },
  save(items) { store.set('cc_cart', items); cart.badge(); },
  add(item) {
    const items = cart.items();
    const same = items.find((i) => i.productId === item.productId && i.fit === item.fit && i.size === item.size);
    if (same) same.quantity = Math.min(10, same.quantity + item.quantity); else items.push(item);
    cart.save(items);
  },
  count() { return cart.items().reduce((s, i) => s + i.quantity, 0); },
  badge() {
    const n = cart.count(), b = $('#cartCount');
    b.textContent = n;
    b.classList.toggle('on', n > 0);
    if (n > 0) gsap.fromTo(b, { scale: 1.6 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    else gsap.set(b, { scale: 0 });
  },
};
cart.badge();

/* ---------- referral popup ---------- */
const popup = $('#popup');
if (!store.get('cc_popup_never', false) && !document.body.classList.contains('bare') && !/^\/(refer|checkout|apply)/.test(location.pathname)) {
  setTimeout(() => { popup.classList.add('show'); popup.setAttribute('aria-hidden', 'false'); }, 4000);
}
$('#popupClose').addEventListener('click', () => {
  popup.classList.remove('show'); popup.setAttribute('aria-hidden', 'true');
  if ($('#popupNever').checked) store.set('cc_popup_never', true);
});
popup.addEventListener('click', (e) => { if (e.target.closest('a')) popup.classList.remove('show'); });

/* ---------- back to top ---------- */
const toTop = $('#toTop');
ScrollTrigger.create({ start: 600, onToggle: (s) => toTop.classList.toggle('show', s.isActive) });
toTop.addEventListener('click', () => scrollToTarget(0));

/* ---------- marquees (scroll-velocity aware) ---------- */
$$('.marquee-track').forEach((track) => {
  track.innerHTML += track.innerHTML;
  const dir = track.classList.contains('reverse') ? 1 : -1;
  const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: +track.dataset.speed || 40, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: track, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
      gsap.to(tween, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + v), duration: .2, overwrite: true });
      gsap.to(tween, { timeScale: 1, duration: 1.2, delay: .25 });
    },
  });
});

/* ---------- generic reveals ---------- */
$$('.reveal-up').forEach((el) => {
  if (el.closest('.hero')) return;
  gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('.reveal-card').forEach((el, i) => {
  gsap.from(el, { y: 80, scale: .94, opacity: 0, duration: 1.1, ease: 'expo.out', delay: (i % 4) * .08, scrollTrigger: { trigger: el, start: 'top 92%' } });
});
$$('.sec-title').forEach((el) => {
  const em = el.querySelector('em');
  if (em) gsap.from(em, { x: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
// headline letters rise one by one
$$('.split-chars').forEach((el) => {
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      [...n.textContent].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch === ' ' ? ' ' : ch; f.appendChild(s); });
      n.replaceWith(f);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
  gsap.from($$('.ch', el), { yPercent: 110, rotate: 8, opacity: 0, duration: .9, stagger: .025, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});

/* ---------- counters ---------- */
$$('[data-count]').forEach((el) => {
  const end = +el.dataset.count, suf = el.dataset.suffix || '';
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 92%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-IN') + suf) }),
  });
});

/* ---------- magnetic buttons ---------- */
if (FINE) $$('.magnetic').forEach((b) => {
  b.addEventListener('mousemove', (e) => {
    const r = b.getBoundingClientRect();
    gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4 });
  });
  b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
});

/* ---------- 3D tilt cards (new) ---------- */
if (FINE && !REDUCE) $$('.tilt').forEach((c) => {
  c.style.transformStyle = 'preserve-3d';
  c.addEventListener('mousemove', (e) => {
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    gsap.to(c, { rotateY: x * 8, rotateX: -y * 8, transformPerspective: 900, duration: .5, ease: 'power2.out' });
    c.style.setProperty('--mx', (x + .5) * 100 + '%'); c.style.setProperty('--my', (y + .5) * 100 + '%');
  });
  c.addEventListener('mouseleave', () => gsap.to(c, { rotateY: 0, rotateX: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
});

/* ---------- cursor follower (new) ---------- */
const cursor = $('#cursor');
if (FINE && !REDUCE) {
  document.body.classList.add('has-cursor');
  const xTo = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });
  addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('a, button, .folder, .gal-item, .dome-item, label, input, select, textarea');
    cursor.classList.toggle('hover', !!t && !t.matches('input, textarea, select'));
    cursor.classList.toggle('text', !!t && t.matches('input, textarea'));
    const label = e.target.closest('[data-cursor]')?.dataset.cursor || '';
    cursor.querySelector('span').textContent = label;
    cursor.classList.toggle('label', !!label);
  });
  document.addEventListener('mouseleave', () => cursor.classList.add('gone'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('gone'));
}

/* ---------- form helper ---------- */
async function postJSON(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  let j = {};
  try { j = await r.json(); } catch (e) { j = { ok: false, error: 'Server error — is the server running?' }; }
  if (!r.ok && !j.error) j.error = 'Something went wrong (' + r.status + ')';
  return j;
}
function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => (o[k] = typeof v === 'string' ? v.trim() : v));
  return o;
}
function setBusy(btn, busy, text) {
  if (busy) { btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span> ' + (text || 'Sending…'); btn.disabled = true; }
  else { btn.innerHTML = btn.dataset.label || btn.innerHTML; btn.disabled = false; }
}
// floating labels + shake on invalid
$$('.field input, .field textarea, .field select').forEach((i) => {
  i.addEventListener('invalid', () => gsap.fromTo(i.closest('.field'), { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }));
});

/* confetti burst (used on success screens) */
function confetti(originEl) {
  if (REDUCE) return;
  const r = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const colors = ['#D2FF52', '#1C46F5', '#131313', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.background = colors[i % 4];
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
    gsap.to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d - 120, rotate: Math.random() * 720, duration: 1.2 + Math.random() * .6, ease: 'power3.out' });
    gsap.to(p, { y: '+=320', opacity: 0, duration: 1, delay: 1, ease: 'power1.in', onComplete: () => p.remove() });
  }
}

addEventListener('load', () => ScrollTrigger.refresh());
