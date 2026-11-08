/* Cart + checkout */
const list = $('#cartList'), form = $('#orderForm');
let step = 'cart';

function totals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tees = items.filter((i) => i.fit).reduce((s, i) => s + i.quantity, 0);
  const discount = tees >= 2 ? 50 : 0;
  return { subtotal, discount, total: subtotal - discount, tees };
}

function render() {
  const items = cart.items();
  if (!items.length) {
    list.innerHTML = `<div class="empty-cart"><div class="empty-ic">🛍</div><h3>Your bag is empty</h3><p class="muted">Grab some CodeCoast threads before the pre-order closes.</p><a href="/merch" class="btn btn-blue btn-sm">Shop merch <span class="btn-dot btn-dot-light">↗</span></a></div>`;
    $('#summary').hidden = true; $('#cartActions').hidden = true; form.hidden = true;
    return;
  }
  list.innerHTML = items.map((i, idx) => `
    <div class="cart-item" data-idx="${idx}">
      <img src="${escapeHTML(i.image)}" alt=""/>
      <div class="ci-info">
        <b>${escapeHTML(i.name)}</b>
        <div class="chip-row left">${i.fit ? `<span class="chip chip-soft">${escapeHTML(i.fit)}</span><span class="chip chip-soft">SIZE: ${escapeHTML(i.size)}</span>` : ''}</div>
        <div class="qty small"><button data-act="minus" aria-label="Decrease">−</button><span>${i.quantity}</span><button data-act="plus" aria-label="Increase">+</button></div>
      </div>
      <div class="ci-right"><b>${rupee(i.price * i.quantity)}</b><button class="link-btn danger" data-act="remove" aria-label="Remove">🗑</button></div>
    </div>`).join('');
  const t = totals(items);
  $('#sSub').textContent = rupee(t.subtotal);
  $('#sDiscRow').hidden = !t.discount;
  $('#sTotal').textContent = rupee(t.total);
  $('#comboHint').textContent = t.tees === 1 ? 'Add one more tee to unlock ₹50 off!' : '';
}

list.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const idx = +btn.closest('.cart-item').dataset.idx;
  const items = cart.items();
  if (btn.dataset.act === 'plus') items[idx].quantity = Math.min(10, items[idx].quantity + 1);
  if (btn.dataset.act === 'minus') items[idx].quantity = Math.max(1, items[idx].quantity - 1);
  if (btn.dataset.act === 'remove') {
    const el = btn.closest('.cart-item');
    gsap.to(el, { x: 80, opacity: 0, height: 0, padding: 0, margin: 0, duration: .4, onComplete: () => { items.splice(idx, 1); cart.save(items); render(); } });
    return;
  }
  cart.save(items); render();
});
$('#clearCart').addEventListener('click', () => { if (confirm('Remove everything from your bag?')) { cart.save([]); render(); } });

$('#checkoutBtn').addEventListener('click', async () => {
  if (step === 'cart') {
    step = 'details';
    form.hidden = false;
    gsap.from(form, { y: 40, opacity: 0, duration: .7, ease: 'expo.out' });
    scrollToTarget(form);
    $('#checkoutBtn').innerHTML = 'PLACE ORDER <span class="btn-dot">✓</span>';
    form.querySelector('input').focus({ preventScroll: true });
    return;
  }
  if (!form.reportValidity()) return;
  const btn = $('#checkoutBtn');
  setBusy(btn, true, 'Placing order…');
  const res = await postJSON('/api/orders', { ...formData(form), items: cart.items().map(({ productId, fit, size, quantity }) => ({ productId, fit, size, quantity })) });
  setBusy(btn, false);
  if (!res.ok) return toast(res.error, 'err');
  cart.save([]);
  $('#orderRef').textContent = res.orderRef;
  $('#orderMsg').textContent = `Total payable at pickup: ${rupee(res.total)}${res.discount ? ` (you saved ${rupee(res.discount)})` : ''}. Show this reference at the merch desk.`;
  openModal($('#orderDone'));
  confetti($('.done-tick'));
  render();
});

render();
gsap.from('.cart-item', { y: 30, opacity: 0, stagger: .08, duration: .7, ease: 'expo.out', delay: .4 });
