/* CodeCoast — interactions & animations */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- smooth scroll (Lenis) ---------- */
let lenis = null;
if (window.Lenis && !reduce) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target) => (lenis ? lenis.scrollTo(target, { offset: 0 }) : (typeof target === 'number' ? scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' })));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  $('#mobileMenu').classList.remove('open');
  $('#menuBtn').classList.remove('open');
  scrollToTarget(el);
}));

/* ---------- hero: pixel text scramble ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*<>/';
function scramble(el, delay = 0) {
  const final = el.dataset.scramble;
  let frame = 0;
  const total = 38;
  el.style.opacity = 1;
  setTimeout(function tick() {
    const p = frame / total;
    el.textContent = final.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      return i / final.length < p ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }).join('');
    if (frame++ < total) requestAnimationFrame(tick); else el.textContent = final;
  }, delay);
}
$$('[data-scramble]').forEach((el, i) => { el.style.opacity = 0; scramble(el, 350 + i * 260); });

gsap.from('.nav > *', { y: -30, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out' });
gsap.from('.hero .reveal-up', { y: 40, opacity: 0, duration: 1, stagger: .15, delay: .5, ease: 'power3.out' });
gsap.from('.spin-badge', { scale: 0, rotate: -180, duration: 1.2, delay: 1, ease: 'back.out(1.6)' });
gsap.from('.hero-bubble', { scale: 0, duration: .6, delay: 1.3, ease: 'back.out(3)' });

/* glow follows cursor in hero */
const hero = $('#hero'), glow = $('.hero-glow');
hero.addEventListener('mousemove', (e) => {
  const r = hero.getBoundingClientRect();
  gsap.to(glow, { left: e.clientX - r.left, top: e.clientY - r.top, duration: .8, ease: 'power3.out' });
});
/* hero title parallax out */
gsap.to('.hero-title', { yPercent: -25, opacity: .3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- marquees (scroll-velocity aware) ---------- */
$$('.marquee-track').forEach((track) => {
  track.innerHTML += track.innerHTML; // duplicate for seamless loop
  const dir = track.classList.contains('reverse') ? 1 : -1;
  const speed = +track.dataset.speed || 40;
  const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: speed, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: track, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
      gsap.to(tween, { timeScale: 1 + v, duration: .2, overwrite: true });
      gsap.to(tween, { timeScale: 1, duration: 1.2, delay: .2 });
    },
  });
});

/* ---------- generic reveals ---------- */
$$('.reveal-up').forEach((el) => {
  if (el.closest('.hero')) return;
  gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('.reveal-card').forEach((el, i) => {
  gsap.from(el, { y: 80, scale: .94, opacity: 0, duration: 1.1, ease: 'expo.out', delay: (i % 4) * .08, scrollTrigger: { trigger: el, start: 'top 90%' } });
});
$$('.sec-title').forEach((el) => {
  const em = el.querySelector('em');
  if (em) gsap.from(em, { x: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});

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
    onUpdate: (self) => {
      const n = Math.round(self.progress * items.length);
      items.forEach((w, i) => w.classList.toggle('on', i < n));
    },
  });
})();

/* ---------- counters ---------- */
$$('[data-count]').forEach((el) => {
  const end = +el.dataset.count, suf = el.dataset.suffix || '';
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v) + suf) }),
  });
});

/* ---------- stacked track cards ---------- */
$$('.stack-card').forEach((card, i) => {
  gsap.fromTo(card, { rotate: i ? 4 : -4, y: 80 }, { rotate: 0, y: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 40%', scrub: 1 } });
});

/* ---------- ribbons drift with scroll ---------- */
gsap.utils.toArray('.ribbon').forEach((r, i) => {
  gsap.fromTo(r, { x: i % 2 ? -80 : 80 }, { x: i % 2 ? 80 : -80, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* ---------- tracks: pinned horizontal folders ---------- */
const TRACKS = [
  ['AI Agents & LLM Tooling', 'Ship autonomous agents, retrieval pipelines and developer tools that make large models genuinely useful.'],
  ['Decentralised Apps & Digital Identity', 'Build trustworthy on-chain apps, wallets and identity systems people can actually use.'],
  ['Cloud, DevOps & Platform Engineering', 'Automate, observe and scale — tooling that makes deployments boring in the best way.'],
  ['Cybersecurity & Privacy Engineering', 'Detect threats, harden systems and design privacy-first products.'],
  ['FinTech & Financial Inclusion', 'Payments, lending and money tools for the next billion users.'],
  ['Climate & Ocean Tech', 'Monitor coastlines, cut emissions and build tools for a healthier planet.'],
  ['Smart Cities & IoT', 'Sensors, edge devices and data platforms for safer, smarter streets.'],
  ['HealthTech & Accessibility', 'Care delivery, diagnostics and assistive tech that includes everyone.'],
];
const ICONS = ['✦', '⬡', '☁', '⛨', '↗', '≋', '⌂', '♥'];
const row = $('#tracksRow');
TRACKS.forEach(([t], i) => {
  const n = String(i + 1).padStart(2, '0');
  row.insertAdjacentHTML('beforeend', `
    <article class="folder" data-i="${i}">
      <div class="folder-tab">${n} // TRACK</div>
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
  scrollTrigger: {
    trigger: '#tracks', start: 'top top', end: () => '+=' + (row.scrollWidth - innerWidth), pin: true, scrub: 1, invalidateOnRefresh: true,
    onUpdate: setActive,
  },
});
setActive();
const modal = $('#trackModal');
folders.forEach((f) => f.addEventListener('click', () => {
  const i = +f.dataset.i;
  $('#modalNum').textContent = String(i + 1).padStart(2, '0') + ' // TRACK';
  $('#modalTitle').textContent = TRACKS[i][0];
  $('#modalBody').textContent = TRACKS[i][1];
  modal.classList.add('show');
}));
const closeModal = () => modal.classList.remove('show');
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

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
function renderCal() {
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
  $('#calGrid').innerHTML = html;
}
$('#calPrev').addEventListener('click', () => { calM = (calM + 11) % 12; if (calM === 11) calY--; renderCal(); });
$('#calNext').addEventListener('click', () => { calM = (calM + 1) % 12; if (calM === 0) calY++; renderCal(); });
renderCal();

/* mini calendar in venue bento */
(function miniCal() {
  const y = 2027, m = 2;
  let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span class="dow">${d}</span>`).join('');
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) h += '<span class="other"></span>';
  for (let d = 1; d <= days; d++) h += `<span class="${d >= 13 && d <= 15 ? 'ev-day' : ''}">${d}</span>`;
  $('#miniCal').innerHTML = h;
})();

/* ---------- countdown ---------- */
function tickCountdown() {
  const now = new Date();
  let diff = Math.max(0, EVENT_DATE - now);
  const months = Math.floor(diff / (30.44 * 864e5)); diff -= months * 30.44 * 864e5;
  const days = Math.floor(diff / 864e5); diff -= days * 864e5;
  const hrs = Math.floor(diff / 36e5); diff -= hrs * 36e5;
  const mins = Math.floor(diff / 6e4);
  const pad = (n) => String(n).padStart(2, '0');
  $('#cdM').textContent = pad(months); $('#cdD').textContent = pad(days);
  $('#cdH').textContent = pad(hrs); $('#cdMin').textContent = pad(mins);
}
tickCountdown(); setInterval(tickCountdown, 1000 * 30);

/* ---------- gallery: pinned horizontal + liquid hover ---------- */
const gal = $('#galTrack');
const SEEDS = ['coast1', 'stage2', 'crowd3', 'laptop4', 'night5', 'team6', 'beach7'];
SEEDS.forEach((s, i) => gal.insertAdjacentHTML('beforeend',
  `<figure class="gal-item"><div class="ph" style="--img:url('https://picsum.photos/seed/${s}/600/750')"></div><figcaption class="gal-cap">PREVIOUS MEETUP<b>MOMENT ${i + 1}</b></figcaption></figure>`));
gal.insertAdjacentHTML('beforeend', '<a href="#" class="gal-more">VIEW<br/>ALL<em class="serif">memories</em></a>');
if (innerWidth > 640) {
  gsap.to(gal, {
    x: () => -(gal.scrollWidth - innerWidth + innerWidth * .04),
    ease: 'none',
    scrollTrigger: { trigger: '#gallery', start: 'top top', end: () => '+=' + gal.scrollWidth * .7, pin: true, scrub: 1, invalidateOnRefresh: true },
  });
} else {
  gal.parentElement.style.overflowX = 'auto';
}
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
$('#getCode').addEventListener('click', (e) => { e.preventDefault(); e.currentTarget.textContent = 'COAST-' + Math.random().toString(36).slice(2, 7).toUpperCase(); });

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

/* ---------- magnetic buttons ---------- */
$$('.magnetic').forEach((b) => {
  b.addEventListener('mousemove', (e) => {
    const r = b.getBoundingClientRect();
    gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4 });
  });
  b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
});

/* ---------- menu, popup, back-to-top ---------- */
$('#menuBtn').addEventListener('click', () => { $('#menuBtn').classList.toggle('open'); $('#mobileMenu').classList.toggle('open'); });

const popup = $('#popup');
let never = false;
try { never = localStorage.getItem('cc-popup-never') === '1'; } catch (e) {}
if (!never) setTimeout(() => popup.classList.add('show'), 3500);
$('#popupClose').addEventListener('click', () => {
  popup.classList.remove('show');
  try { if ($('#popupNever').checked) localStorage.setItem('cc-popup-never', '1'); } catch (e) {}
});

const toTop = $('#toTop');
ScrollTrigger.create({ start: 600, onToggle: (s) => toTop.classList.toggle('show', s.isActive) });
toTop.addEventListener('click', () => scrollToTarget(0));

addEventListener('load', () => ScrollTrigger.refresh());
