/* Gallery: draggable 3D dome + filterable masonry + lightbox */
const TAGS = ['hack', 'stage', 'beach'];
const PHOTOS = Array.from({ length: 36 }, (_, i) => ({
  src: `https://picsum.photos/seed/codecoast-${i}/600/600`,
  big: `https://picsum.photos/seed/codecoast-${i}/1400/1000`,
  tag: TAGS[i % 3],
  cap: `Season moment #${String(i + 1).padStart(2, '0')}`,
}));

/* ---------- dome ---------- */
const dome = $('#dome'), wrap = $('#domeWrap');
const ROWS = 5, COLS = 18;
const R = () => Math.min(innerWidth * .36, 400);
function buildDome() {
  dome.innerHTML = '';
  const radius = R();
  const tile = Math.max(46, radius * .24);
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    const lat = (r - (ROWS - 1) / 2) * 16; // degrees
    for (let c = 0; c < COLS; c++) {
      const lon = (360 / COLS) * c + (r % 2 ? 360 / COLS / 2 : 0);
      const p = PHOTOS[k++ % PHOTOS.length];
      const el = document.createElement('button');
      el.className = 'dome-item';
      el.style.width = el.style.height = tile + 'px';
      el.style.transform = `rotateY(${lon}deg) rotateX(${-lat}deg) translateZ(${radius}px)`;
      el.style.backgroundImage = `url(${p.src})`;
      el.dataset.i = PHOTOS.indexOf(p);
      el.setAttribute('aria-label', p.cap);
      dome.appendChild(el);
    }
  }
}
buildDome();
addEventListener('resize', () => { clearTimeout(window._db); window._db = setTimeout(buildDome, 200); });

let rotY = 0, rotX = -6, velY = .08, velX = 0, dragging = false, moved = 0, lx = 0, ly = 0;
wrap.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; wrap.setPointerCapture(e.pointerId); wrap.classList.add('grabbing'); });
wrap.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lx, dy = e.clientY - ly;
  moved += Math.abs(dx) + Math.abs(dy);
  velY = dx * .25; velX = -dy * .12;
  lx = e.clientX; ly = e.clientY;
});
const endDrag = (e) => {
  if (!dragging) return;
  dragging = false; wrap.classList.remove('grabbing');
  if (moved < 6) { // treat as click
    const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList?.contains('dome-item'));
    if (el) openLB(+el.dataset.i);
  }
};
wrap.addEventListener('pointerup', endDrag);
wrap.addEventListener('pointercancel', () => { dragging = false; });
(function spin() {
  rotY += velY; rotX = Math.max(-25, Math.min(25, rotX + velX));
  if (!dragging) { velY += (.08 - velY) * .03; velX *= .9; }
  dome.style.transform = `translateZ(${-R()}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  requestAnimationFrame(spin);
})();
gsap.from('.dome-item', { opacity: 0, scale: 0, duration: 1.2, stagger: { each: .006, from: 'random' }, ease: 'back.out(1.6)', delay: .5 });

/* ---------- masonry with filter ---------- */
const mas = $('#masonry');
function renderMasonry(f) {
  const list = PHOTOS.map((p, i) => ({ ...p, i })).filter((p) => f === 'all' || p.tag === f);
  mas.innerHTML = list.map((p, n) => `<button class="m-item" data-i="${p.i}" style="aspect-ratio:${[1, .8, 1.25, .9][n % 4]}" data-cursor="VIEW"><img src="${p.src}" alt="${escapeHTML(p.cap)}" loading="lazy"/><span>${escapeHTML(p.tag.toUpperCase())}</span></button>`).join('');
  gsap.from('.m-item', { y: 50, opacity: 0, duration: .7, stagger: .03, ease: 'expo.out' });
  ScrollTrigger.refresh();
}
renderMasonry('all');
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#filters button').forEach((x) => x.classList.toggle('on', x === b));
  renderMasonry(b.dataset.f);
});
mas.addEventListener('click', (e) => { const b = e.target.closest('.m-item'); if (b) openLB(+b.dataset.i); });

/* ---------- lightbox ---------- */
const lb = $('#lightbox');
let cur = 0;
function showLB(i, dir = 0) {
  cur = (i + PHOTOS.length) % PHOTOS.length;
  const img = $('#lbImg');
  gsap.to(img, { x: -40 * dir, opacity: 0, duration: dir ? .2 : 0, onComplete: () => {
    img.src = PHOTOS[cur].big;
    $('#lbCap').textContent = PHOTOS[cur].cap;
    gsap.fromTo(img, { x: 40 * dir, opacity: 0, scale: dir ? 1 : .85 }, { x: 0, opacity: 1, scale: 1, duration: .5, ease: 'expo.out' });
  } });
}
function openLB(i) { lb.classList.add('show'); lb.setAttribute('aria-hidden', 'false'); lenis?.stop(); showLB(i); }
function closeLB() { lb.classList.remove('show'); lb.setAttribute('aria-hidden', 'true'); lenis?.start(); }
lb.addEventListener('click', (e) => {
  const a = e.target.closest('[data-lb]')?.dataset.lb;
  if (a === 'close' || e.target === lb) closeLB();
  if (a === 'prev') showLB(cur - 1, -1);
  if (a === 'next') showLB(cur + 1, 1);
});
addEventListener('keydown', (e) => {
  if (!lb.classList.contains('show')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowLeft') showLB(cur - 1, -1);
  if (e.key === 'ArrowRight') showLB(cur + 1, 1);
});
