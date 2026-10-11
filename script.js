// Mobile menu (hamburger)
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');
const desktopQuery = window.matchMedia('(min-width: 901px)');

function setMenu(open, returnFocus) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (!open && returnFocus) menuBtn.focus();
}

menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true);
});
document.addEventListener('click', e => {
  if (nav.classList.contains('open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
});
desktopQuery.addEventListener('change', e => { if (e.matches) setMenu(false); });

document.getElementById('year').textContent = new Date().getFullYear();

// Event request form: opens WhatsApp to OnePoint's number with the request filled in.
// Swap for a form service or email endpoint if the company sets one up.
const WHATSAPP_NUMBER = '250788980666';
const form = document.getElementById('quote-form');
const msg = document.getElementById('form-msg');

form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  const val = k => String(f.get(k) || '').trim();
  const required = ['name', 'org', 'email', 'dates'];
  const missing = required.some(k => !val(k));
  const emailOk = /^\S+@\S+\.\S+$/.test(val('email'));

  if (missing) {
    msg.className = 'form-msg bad';
    msg.textContent = 'Fill in your name, organization, email and event dates.';
    return;
  }
  if (!emailOk) {
    msg.className = 'form-msg bad';
    msg.textContent = 'Enter a valid email address so we can reply.';
    return;
  }

  const services = f.getAll('services');
  const body = [
    'Name: ' + val('name'),
    'Organization: ' + val('org'),
    'Email: ' + val('email'),
    'Phone: ' + (val('phone') || '-'),
    'Event dates: ' + val('dates'),
    'Guests: ' + (val('guests') || '-'),
    'Services: ' + (services.length ? services.join(', ') : '-'),
    '',
    'Details:',
    val('details') || '-'
  ].join('\n');

  const text = 'Event request from ' + val('org') + '\n\n' + body;
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');

  msg.className = 'form-msg ok';
  msg.textContent = 'WhatsApp should open with your request ready to send. If it does not, call us on +250 788 980 666.';
});

// Gallery lightbox with previous / next
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
const lbCount = document.getElementById('lb-count');
const shots = [...document.querySelectorAll('.shot')];
let current = 0;

function showShot(i) {
  current = (i + shots.length) % shots.length;
  const btn = shots[current];
  lbImg.src = btn.dataset.full;
  lbImg.alt = btn.querySelector('img').alt;
  lbCap.textContent = btn.dataset.caption;
  lbCount.textContent = (current + 1) + ' / ' + shots.length;
  // preload neighbours so switching feels instant
  [current - 1, current + 1].forEach(n => { new Image().src = shots[(n + shots.length) % shots.length].dataset.full; });
}

shots.forEach((btn, i) => {
  btn.addEventListener('click', () => { showShot(i); lightbox.showModal(); });
});
lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lb-prev').addEventListener('click', () => showShot(current - 1));
lightbox.querySelector('.lb-next').addEventListener('click', () => showShot(current + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
lightbox.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showShot(current - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showShot(current + 1); }
});

// Swipe on touch screens
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, {passive: true});
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 50) showShot(current + (dx < 0 ? 1 : -1));
}, {passive: true});

// Scroll reveal (once per element; fade only when reduced motion is on)
(function () {
  if (!('IntersectionObserver' in window)) return;

  const selector = [
    '.section h2', '.section .section-lead',
    '.services li', '.audience li', '.steps li', '.gallery li',
    '.faq details', '.reassure', '.form', '.contact > div', '.gallery-note'
  ].join(',');

  const items = [...document.querySelectorAll(selector)];
  const vh = window.innerHeight;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // reveal when visible, or when already scrolled past (e.g. jumped to a link)
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(el => {
    // anything already on screen at load stays as-is, so nothing flashes
    if (el.getBoundingClientRect().top < vh * 0.92) return;
    // small stagger within a group, capped so long lists don't drag
    const siblings = [...el.parentElement.children].filter(c => c.matches(selector));
    const idx = Math.min(siblings.indexOf(el), 4);
    el.style.setProperty('--rd', (idx * 0.14).toFixed(2) + 's');
    el.classList.add('reveal');
    io.observe(el);
  });
})();
