/* Merch listing */
(async function () {
  const grid = $('#productGrid');
  try {
    const r = await fetch('/api/products');
    const { rows } = await r.json();
    grid.innerHTML = rows.map((p) => `
      <a href="/merch/${escapeHTML(p.slug)}" class="product-card tilt" data-cursor="SHOP">
        ${p.badge ? `<span class="chip chip-lime p-badge">${escapeHTML(p.badge)}</span>` : ''}
        <div class="product-img"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy"/></div>
        <span class="p-cat">${escapeHTML(p.category)}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <div class="p-price"><b>${rupee(p.price)}</b><s>${rupee(p.mrp)}</s><span class="p-go">↗</span></div>
      </a>`).join('');
    gsap.from('.product-card', { y: 80, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out' });
    $$('.product-card').forEach((c) => {
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(c.querySelector('img'), { x: x * 20, y: y * 20, rotate: x * 6, duration: .5 });
      });
      c.addEventListener('mouseleave', () => gsap.to(c.querySelector('img'), { x: 0, y: 0, rotate: 0, duration: .6 }));
    });
  } catch (e) {
    grid.innerHTML = '<p class="muted">Could not load products. Is the server running?</p>';
  }
})();
