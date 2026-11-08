/* Product detail */
(async function () {
  const slug = $('.product-page').dataset.slug;
  const r = await fetch('/api/products/' + encodeURIComponent(slug));
  const j = await r.json();
  if (!j.ok) return;
  const p = j.product;
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const FIT_EXTRA = { Regular: 0, Oversized: 100 };
  let fit = 'Oversized', size = null, qty = 1;

  $('#pImg').src = p.image; $('#pImg').alt = p.name;
  $('#pName').textContent = p.name;
  $('#pCat').textContent = p.category;
  $('#pDesc').textContent = p.description;
  $('#pStock').textContent = p.stock > 0 ? 'IN STOCK' : 'SOLD OUT';
  const views = [p.image, p.image];
  $('#pThumbs').innerHTML = views.map((v, i) => `<button class="${i ? '' : 'on'}" data-i="${i}"><img src="${escapeHTML(v)}" alt="" style="${i ? 'transform:scaleX(-1)' : ''}"/></button>`).join('');
  $$('#pThumbs button').forEach((b) => b.addEventListener('click', () => {
    $$('#pThumbs button').forEach((x) => x.classList.toggle('on', x === b));
    gsap.fromTo('#pImg', { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2)' });
    $('#pImg').style.transform = b.dataset.i === '1' ? 'scaleX(-1)' : '';
  }));

  function price() { return p.price + (p.has_sizes ? FIT_EXTRA[fit] : 0); }
  function renderPrice() {
    const now = price(), mrp = p.mrp + (p.has_sizes ? FIT_EXTRA[fit] : 0);
    $('#pPrice').textContent = rupee(now);
    $('#pMrp').textContent = rupee(mrp);
    $('#pSave').textContent = Math.round((1 - now / mrp) * 100) + '% SAVE';
    gsap.fromTo('#pPrice', { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: .4 });
  }

  if (!p.has_sizes) { $('#fitBox').remove(); }
  else {
    $('#pNote').textContent = 'Oversized fit is 240 GSM with dropped shoulders. Regular fit is 180 GSM with standard sleeves.';
    $('#sizes').innerHTML = SIZES.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join('');
    $$('#sizes button').forEach((b) => b.addEventListener('click', () => {
      size = b.dataset.size;
      $$('#sizes button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $$('#fitSeg button').forEach((b) => b.addEventListener('click', () => {
      fit = b.dataset.fit;
      $$('#fitSeg button').forEach((x) => x.classList.toggle('on', x === b));
      renderPrice();
    }));
    $('#sizeChartBtn').addEventListener('click', () => openModal($('#sizeModal')));
  }
  renderPrice();

  $('#qMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qVal').textContent = qty; });
  $('#qPlus').addEventListener('click', () => { qty = Math.min(10, qty + 1); $('#qVal').textContent = qty; });

  $('#addBtn').addEventListener('click', () => {
    if (p.has_sizes && !size) {
      toast('Please pick a size first', 'err');
      gsap.fromTo('#sizes', { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' });
      return;
    }
    cart.add({ productId: p.id, slug: p.slug, name: p.name, image: p.image, fit: p.has_sizes ? fit : null, size: p.has_sizes ? size : null, quantity: qty, price: price() });
    // fly-to-cart animation
    const img = $('#pImg'), target = $('.cart-btn');
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const ghost = img.cloneNode();
    ghost.className = 'fly-ghost';
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    gsap.to(ghost, { left: b.left + b.width / 2 - 20, top: b.top + b.height / 2 - 20, width: 40, height: 40, opacity: .4, rotate: 20, duration: .9, ease: 'power3.in', onComplete: () => { ghost.remove(); cart.badge(); } });
    toast(`Added ${qty} × ${p.name} to your bag`, 'ok');
    const btn = $('#addBtn');
    btn.innerHTML = 'ADDED ✓ <a href="/checkout" class="btn-dot" style="width:auto;padding:0 .9em;border-radius:99px">VIEW BAG</a>';
    setTimeout(() => (btn.innerHTML = 'ADD TO BAG <span class="btn-dot">+</span>'), 3500);
  });

  gsap.from('.product-gallery', { x: -60, opacity: 0, duration: 1, ease: 'expo.out', delay: .3 });
  gsap.from('.product-info > *', { y: 40, opacity: 0, duration: .8, stagger: .06, ease: 'expo.out', delay: .4 });
})();
