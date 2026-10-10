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

// Gallery lightbox
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
document.querySelectorAll('.shot').forEach(btn => {
  btn.addEventListener('click', () => {
    lbImg.src = btn.dataset.full;
    lbImg.alt = btn.querySelector('img').alt;
    lbCap.textContent = btn.dataset.caption;
    lightbox.showModal();
  });
});
lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
