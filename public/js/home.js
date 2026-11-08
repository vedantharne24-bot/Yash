/* CodeCoast — home page */

/* ---------- hero: pixel text scramble ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*<>/';
function scramble(el, delay = 0) {
  const final = el.dataset.scramble;
  let frame = 0;
  const total = 38;
  setTimeout(function tick() {
    el.style.opacity = 1;
    const p = frame / total;
    el.textContent = final.split('').map((ch, i) => (ch === ' ' ? ' ' : i / final.length < p ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
    if (frame++ < total) requestAnimationFrame(tick); else el.textContent = final;
  }, delay);
}
$$('[data-scramble]').forEach((el, i) => { el.style.opacity = 0; scramble(el, 700 + i * 260); });
// re-scramble on hover
$$('[data-scramble]').forEach((el) => el.addEventListener('mouseenter', () => { if (el.textContent === el.dataset.scramble) scramble(el, 0); }));

gsap.from('.site-nav > *', { y: -30, opacity: 0, duration: .9, stagger: .1, delay: .5, ease: 'power3.out' });
gsap.from('.hero .reveal-up', { y: 40, opacity: 0, duration: 1, stagger: .15, delay: .8, ease: 'power3.out' });
gsap.from('.spin-badge', { scale: 0, rotate: -180, duration: 1.2, delay: 1.2, ease: 'back.out(1.6)' });
gsap.from('.hero-bubble', { scale: 0, duration: .6, delay: 1.5, ease: 'back.out(3)' });

/* glow follows cursor */
const hero = $('#hero'), glow = $('.hero-glow');
hero.addEventListener('mousemove', (e) => {
  const r = hero.getBoundingClientRect();
  gsap.to(glow, { left: e.clientX - r.left, top: e.clientY - r.top, duration: .8, ease: 'power3.out' });
});
gsap.to('.hero-title', { yPercent: -25, opacity: .3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- hero: pixel trail on the grid (new) ---------- */
(function pixelTrail() {
  const cv = $('#heroPixels');
  if (!cv || REDUCE) return;
  const ctx = cv.getContext('2d');
  const CELL = 54;
  let cells = new Map(), w, h, dpr;
  const size = () => { dpr = Math.min(devicePixelRatio, 2); w = cv.width = hero.clientWidth * dpr; h = cv.height = hero.clientHeight * dpr; };
  size(); addEventListener('resize', size);
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const cx = Math.floor((e.clientX - r.left) / CELL), cy = Math.floor((e.clientY - r.top) / CELL);
    cells.set(cx + ',' + cy, { x: cx, y: cy, life: 1, c: Math.random() < .5 ? '28,70,245' : '210,255,82' });
  });
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    cells.forEach((c, k) => {
      c.life -= .02;
      if (c.life <= 0) return cells.delete(k);
      ctx.fillStyle = `rgba(${c.c},${c.life * .35})`;
      ctx.fillRect(c.x * CELL * dpr + dpr, c.y * CELL * dpr + dpr, (CELL - 1) * dpr, (CELL - 1) * dpr);
    });
    requestAnimationFrame(loop);
  })();
})();

/* ---------- vision paragraph word-by-word reveal ---------- */
(function vision() {
  const p = $('#vision');
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('img-pill')) {
        if (n.classList.contains('blue')) n.dataset.blue = 1;
        walk(n);
      }
    });
  };
  walk(p);
  $$('.w', p).forEach((w) => { if (w.closest('[data-blue]')) w.classList.add('blue-w'); });
  const items = $$('.w, .img-pill', p);
  ScrollTrigger.create({
    trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: (self) => { const n = Math.round(self.progress * items.length); items.forEach((w, i) => w.classList.toggle('on', i < n)); },
  });
})();

/* ---------- stacked track cards ---------- */
$$('.stack-card').forEach((card, i) => {
  gsap.fromTo(card, { rotate: i ? 4 : -4, y: 80 }, { rotate: 0, y: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 40%', scrub: 1 } });
});

/* ---------- ribbons drift ---------- */
gsap.utils.toArray('.ribbon').forEach((r, i) => {
  gsap.fromTo(r, { x: i % 2 ? -80 : 80 }, { x: i % 2 ? 80 : -80, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* ---------- mascot eyes follow cursor (new) ---------- */
(function mascot() {
  const card = $('#mascotCard'), eyes = $('.mascot-eyes');
  if (!card || !eyes) return;
  addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 300));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 300));
    gsap.to(eyes, { x: dx * .6, y: dy * .5, duration: .3 });
  });
  card.addEventListener('click', () => gsap.fromTo('.mascot', { y: 0 }, { y: -30, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' }));
})();

/* ---------- tracks: pinned horizontal folders ---------- */
const TRACKS = [
  ['AI Agents & LLM Tooling', 'Ship autonomous agents, retrieval pipelines and developer tools that make large models genuinely useful.', ['Multi-agent workflow builder', 'Local-first RAG for documents', 'LLM evaluation dashboard']],
  ['Decentralised Apps & Digital Identity', 'Build trustworthy on-chain apps, wallets and identity systems people can actually use.', ['Verifiable student credentials', 'Gasless onboarding wallet', 'On-chain event ticketing']],
  ['Cloud, DevOps & Platform Engineering', 'Automate, observe and scale — tooling that makes deployments boring in the best way.', ['Self-healing deploy pipeline', 'Cost anomaly detector', 'Internal developer portal']],
  ['Cybersecurity & Privacy Engineering', 'Detect threats, harden systems and design privacy-first products.', ['Phishing detector for messaging apps', 'Secrets scanner for repos', 'Privacy-preserving analytics']],
  ['FinTech & Financial Inclusion', 'Payments, lending and money tools for the next billion users.', ['UPI expense coach', 'Micro-savings for gig workers', 'Fraud-aware checkout']],
  ['Climate & Ocean Tech', 'Monitor coastlines, cut emissions and build tools for a healthier planet.', ['Beach litter mapping with drones', 'Fishermen weather alerts', 'Carbon tracker for campuses']],
  ['Smart Cities & IoT', 'Sensors, edge devices and data platforms for safer, smarter streets.', ['Smart parking finder', 'Flood early-warning mesh', 'Air quality street map']],
  ['HealthTech & Accessibility', 'Care delivery, diagnostics and assistive tech that includes everyone.', ['Sign-language live captions', 'Rural tele-triage assistant', 'Medicine reminder for elders']],
];
const ICONS = ['✦', '⬡', '☁', '⛨', '↗', '≋', '⌂', '♥'];
const row = $('#tracksRow');
TRACKS.forEach(([t], i) => {
  const n = String(i + 1).padStart(2, '0');
  row.insertAdjacentHTML('beforeend', `
    <article class="folder" data-i="${i}" data-cursor="OPEN">
      <div class="folder-tab">${n} // TRACK</div>
      <div class="folder-paper" aria-hidden="true"></div>
      <div class="folder-body">
        <span class="folder-icon">${ICONS[i]}</span>
        <h4>${t}</h4>
        <div class="folder-foot"><span>CLICK TO OPEN</span><span>→</span></div>
      </div>
    </article>`);
});
const folders = $$('.folder', row);
const setActive = () => {
  const c = innerWidth / 2;
  let best = 0, bd = Infinity;
  folders.forEach((f, i) => { const r = f.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - c); if (d < bd) { bd = d; best = i; } });
  folders.forEach((f, i) => f.classList.toggle('active', i === best));
};
gsap.to(row, {
  x: () => -(row.scrollWidth - innerWidth),
  ease: 'none',
  scrollTrigger: { trigger: '#tracks', start: 'top top', end: () => '+=' + (row.scrollWidth - innerWidth), pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: setActive },
});
setActive();
const trackModal = $('#trackModal');
folders.forEach((f) => f.addEventListener('click', () => {
  const i = +f.dataset.i;
  $('#modalNum').textContent = String(i + 1).padStart(2, '0') + ' // TRACK';
  $('#modalTitle').textContent = TRACKS[i][0];
  $('#modalBody').textContent = TRACKS[i][1];
  $('#modalIdeas').innerHTML = TRACKS[i][2].map((x) => `<li>${escapeHTML(x)}</li>`).join('');
  $('#modalApply').href = '/apply?domain=' + encodeURIComponent(TRACKS[i][0]);
  openModal(trackModal);
}));
$('#modalClose').addEventListener('click', () => closeModal(trackModal));

/* ---------- calendar ---------- */
const EVENT_DATE = new Date('2027-03-13T09:00:00+05:30');
const EVENTS = {
  '2027-1-1': [['10:00 AM', 'Registration Opens', '']],
  '2027-1-21': [['11:59 PM', 'Build For Good Reg Closes', 'blue']],
  '2027-1-28': [['11:59 PM', 'Main Track Reg Closes', '']],
  '2027-2-5': [['6:00 PM', 'Shortlist Announced', 'blue']],
  '2027-2-13': [['9:00 AM', 'Hacking Begins', 'lime']],
  '2027-2-15': [['4:00 PM', 'Closing Ceremony', 'blue']],
};
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
let calY = 2027, calM = 1;
function renderCal(dir = 0) {
  $('#calMonth').textContent = MONTHS[calM];
  const first = new Date(calY, calM, 1).getDay();
  const days = new Date(calY, calM + 1, 0).getDate();
  let html = '';
  for (let i = 0; i < first; i++) html += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= days; d++) {
    const ev = EVENTS[`${calY}-${calM}-${d}`];
    html += `<div class="cal-cell${ev ? ' has-ev' : ''}"><span class="day">${d}</span>${ev ? ev.map(([t, n, c]) => `<div class="ev ${c}"><small>${t}</small>${n}</div>`).join('') : ''}</div>`;
  }
  const tail = (7 - ((first + days) % 7)) % 7;
  for (let i = 0; i < tail; i++) html += '<div class="cal-cell blank"></div>';
  const grid = $('#calGrid');
  grid.innerHTML = html;
  if (dir) gsap.from(grid.children, { opacity: 0, x: 30 * dir, duration: .4, stagger: .006, ease: 'power2.out' });
}
$('#calPrev').addEventListener('click', () => { calM = (calM + 11) % 12; if (calM === 11) calY--; renderCal(-1); });
$('#calNext').addEventListener('click', () => { calM = (calM + 1) % 12; if (calM === 0) calY++; renderCal(1); });
renderCal();

(function miniCal() {
  const y = 2027, m = 2;
  let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span class="dow">${d}</span>`).join('');
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) h += '<span class="other"></span>';
  for (let d = 1; d <= days; d++) h += `<span class="${d >= 13 && d <= 15 ? 'ev-day' : ''}">${d}</span>`;
  $('#miniCal').innerHTML = h;
})();

/* ---------- countdown (digits flip when they change) ---------- */
function tickCountdown() {
  let diff = Math.max(0, EVENT_DATE - new Date());
  const months = Math.floor(diff / (30.44 * 864e5)); diff -= months * 30.44 * 864e5;
  const days = Math.floor(diff / 864e5); diff -= days * 864e5;
  const hrs = Math.floor(diff / 36e5); diff -= hrs * 36e5;
  const mins = Math.floor(diff / 6e4);
  const pad = (n) => String(n).padStart(2, '0');
  [['#cdM', months], ['#cdD', days], ['#cdH', hrs], ['#cdMin', mins]].forEach(([id, v]) => {
    const el = $(id), txt = pad(v);
    if (el.textContent !== txt) { el.textContent = txt; gsap.fromTo(el, { rotateX: -90, opacity: 0 }, { rotateX: 0, opacity: 1, duration: .6, ease: 'back.out(2)' }); }
  });
}
tickCountdown(); setInterval(tickCountdown, 1000 * 15);

/* ---------- gallery strip ---------- */
const gal = $('#galTrack');
['coast1', 'stage2', 'crowd3', 'laptop4', 'night5', 'team6', 'beach7'].forEach((s, i) => gal.insertAdjacentHTML('beforeend',
  `<figure class="gal-item" data-cursor="VIEW"><div class="ph" style="--img:url('https://picsum.photos/seed/${s}/600/750')"></div><figcaption class="gal-cap">PREVIOUS MEETUP<b>MOMENT ${i + 1}</b></figcaption></figure>`));
gal.insertAdjacentHTML('beforeend', '<a href="/gallery" class="gal-more">VIEW<br/>ALL<em class="serif">memories</em></a>');
$$('.gal-item', gal).forEach((g) => g.addEventListener('click', () => { location.href = '/gallery'; }));
if (innerWidth > 640) {
  gsap.to(gal, {
    x: () => -(gal.scrollWidth - innerWidth + innerWidth * .04),
    ease: 'none',
    scrollTrigger: { trigger: '#gallery', start: 'top top', end: () => '+=' + gal.scrollWidth * .7, pin: true, scrub: 1, invalidateOnRefresh: true },
  });
} else gal.parentElement.style.overflowX = 'auto';
const disp = $('#liquid-disp'), turb = $('#liquid-turbulence');
$$('.gal-item').forEach((it) => {
  let raf, t = 0;
  it.addEventListener('mouseenter', () => {
    gsap.to(disp, { attr: { scale: 28 }, duration: .6 });
    const loop = () => { t += .01; turb.setAttribute('baseFrequency', `${0.012 + Math.sin(t) * .004} ${0.018 + Math.cos(t) * .004}`); raf = requestAnimationFrame(loop); };
    loop();
  });
  it.addEventListener('mouseleave', () => { cancelAnimationFrame(raf); gsap.to(disp, { attr: { scale: 0 }, duration: .6 }); });
});

/* ---------- live clock (IST) ---------- */
const ticks = $('#ticks');
for (let i = 0; i < 12; i++) {
  const a = (i * 30 * Math.PI) / 180;
  ticks.insertAdjacentHTML('beforeend', `<line x1="${50 + Math.sin(a) * 40}" y1="${50 - Math.cos(a) * 40}" x2="${50 + Math.sin(a) * 44}" y2="${50 - Math.cos(a) * 44}" stroke="#555" stroke-width="1.5"/>`);
}
function tickClock() {
  const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 6e4);
  const h = ist.getHours(), m = ist.getMinutes(), s = ist.getSeconds();
  $('#hHand').setAttribute('transform', `rotate(${(h % 12) * 30 + m * .5} 50 50)`);
  $('#mHand').setAttribute('transform', `rotate(${m * 6 + s * .1} 50 50)`);
  $('#sHand').setAttribute('transform', `rotate(${s * 6} 50 50)`);
  $('#clockTxt').textContent = ist.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
tickClock(); setInterval(tickClock, 1000);

/* ---------- live weather for the venue (Open-Meteo, no API key) ---------- */
(async function weather() {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=15.52&longitude=73.77&current=temperature_2m,weather_code,wind_speed_10m');
    const j = await r.json();
    const c = j.current;
    const code = c.weather_code;
    const [icon, desc] = code === 0 ? ['☀', 'Clear & Sunny'] : code <= 3 ? ['⛅', 'Partly Cloudy'] : code <= 48 ? ['🌫', 'Hazy'] : code <= 67 ? ['🌧', 'Rainy'] : code <= 82 ? ['🌦', 'Showers'] : ['⛈', 'Stormy'];
    $('#wTemp').textContent = Math.round(c.temperature_2m) + '°';
    $('#wIcon').textContent = icon;
    $('#wDesc').textContent = `${desc} · ${Math.round(c.wind_speed_10m)} km/h wind`;
  } catch (e) { /* keep the default */ }
})();

/* ---------- travel guide ---------- */
$('#travelBtn').addEventListener('click', () => openModal($('#travelModal')));

/* ---------- FAQ accordion ---------- */
const FAQ = [
  ['How long is the hackathon?', 'CodeCoast is a non-stop 36-hour build sprint — plenty of time to ideate, ship, iterate and polish.'],
  ['What is the team size?', 'Teams can have 2 to 4 members. Solo hackers can find teammates in our community Discord before the event.'],
  ['When are the problem statements revealed?', 'Problem statements drop at the opening ceremony. Everything you build must be created during the event.'],
  ['What do participants get?', 'Meals, snacks and caffeine for the full event, exclusive swag, a certificate, and plenty of chances to meet mentors and sponsors.'],
  ['How are teams shortlisted?', 'We review team profiles and past work to build a balanced, diverse cohort. Passion counts as much as experience.'],
  ['What should I bring?', 'Your laptop, chargers, any hardware you plan to use, and a reusable bottle. We provide Wi-Fi, power and food.'],
  ['Will there be mentors?', 'Yes — engineers, designers and founders will be on the floor throughout to help you get unstuck.'],
  ['Can beginners participate?', 'Absolutely. CodeCoast is built for first-timers and veterans alike; curiosity matters more than experience.'],
  ['Can we use pre-built projects?', 'No. Open-source libraries are fine, but your project itself must be built from scratch during the hackathon.'],
];
const list = $('#faqList');
FAQ.forEach(([q, a]) => list.insertAdjacentHTML('beforeend',
  `<div class="faq-item"><button class="faq-q" aria-expanded="false">${q}<span class="faq-ic">⌄</span></button><div class="faq-a"><p>${a}</p></div></div>`));
$$('.faq-item').forEach((item, idx) => {
  const btn = $('.faq-q', item), ans = $('.faq-a', item);
  const toggle = (open) => {
    item.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    gsap.to(ans, { height: open ? 'auto' : 0, duration: .5, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
  };
  btn.addEventListener('click', () => {
    const open = !item.classList.contains('open');
    $$('.faq-item.open').forEach((o) => o !== item && (o.classList.remove('open'), gsap.to($('.faq-a', o), { height: 0, duration: .4 })));
    toggle(open);
  });
  if (idx === 0) toggle(true);
});
gsap.from('.faq-item', { y: 40, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '#faqList', start: 'top 85%' } });

/* ---------- curved text marquee ---------- */
const curveText = $('#curveText');
const curve = { o: 0 };
gsap.to(curve, { o: -50, duration: 30, ease: 'none', repeat: -1, onUpdate: () => curveText.setAttribute('startOffset', curve.o + '%') });
