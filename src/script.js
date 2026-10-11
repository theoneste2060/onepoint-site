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
    '.faq details', '.reassure', '.form', '.contact > div', '.gallery-note', '.qr-card'
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

// ---------- Floating WhatsApp button + guided assistant ----------
(function () {
  const PHONE = '+250 788 980 666';
  const wa = text => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);

  const toggle = document.getElementById('assistant-toggle');
  const panel = document.getElementById('assistant');
  const log = document.getElementById('chat-log');
  const chipsEl = document.getElementById('chat-chips');
  const formEl = document.getElementById('chat-form');
  const input = document.getElementById('chat-in');
  const statusEl = document.getElementById('as-status');
  const waFab = document.getElementById('wa-fab');
  const closeBtn = panel.querySelector('.as-close');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  waFab.href = wa('Hello OnePoint Logistics, I have a question about an event.');

  // Office hours: Monday to Friday, 08:00 to 17:00, Kigali time
  function officeOpen() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kigali', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    const day = parts.find(p => p.type === 'weekday').value;
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10) % 24;
    return day !== 'Sat' && day !== 'Sun' && hour >= 8 && hour < 17;
  }
  function updateStatus() {
    const open = officeOpen();
    statusEl.textContent = open ? 'Office open now' : 'Office closed now';
    statusEl.classList.toggle('on', open);
  }

  let lastTopic = 'your services';
  const A = {
    whatsapp: txt => ({ label: 'Chat on WhatsApp', href: wa(txt), external: true }),
    call: { label: 'Call ' + PHONE, href: 'tel:+250788980666' },
    form: { label: 'Fill the request form', jump: '#quote' },
    services: { label: 'See all services', jump: '#services' },
    examples: { label: 'See examples', jump: '#examples' },
    faq: { label: 'Read the FAQ', jump: '#faq' }
  };

  // keys ending in $ must match a whole word; others match the start of a word
  const KB = [
    { id: 'quote', q: 'Get a quote', topic: 'a quote', keys: ['quote', 'quotation', 'price', 'pricing', 'cost', 'how much', 'rate', 'fee', 'budget', 'estimate', 'proposal'],
      a: () => 'Pricing depends on your dates, group size and the services you need, so we quote each event. Send us the details and we will reply with a plan and a quote.',
      actions: () => [A.form, A.whatsapp('Hello OnePoint Logistics, I would like a quote for an event.')] },
    { id: 'hours', q: 'Opening hours', topic: 'opening hours', keys: ['hour', 'open', 'close', 'time', 'weekend', 'saturday', 'sunday', 'monday', 'friday', 'schedule'],
      a: () => 'Our office is open Monday to Friday, 8:00 AM to 5:00 PM, and closed on Saturday and Sunday. ' + (officeOpen() ? 'We are open right now.' : 'The office is closed right now, but you can leave a message on WhatsApp and we will reply when we reopen.'),
      actions: () => [A.whatsapp('Hello OnePoint Logistics, I have a question.')] },
    { id: 'contact', q: 'Contact us', topic: 'contacting you', keys: ['phone', 'call', 'number', 'contact', 'whatsapp', 'reach', 'talk', 'speak', 'person', 'human', 'agent', 'someone', 'email'],
      a: () => 'You can call or WhatsApp us on ' + PHONE + '. ' + (officeOpen() ? 'The office is open now.' : 'The office is closed right now, so leave a message and we will reply when we reopen.'),
      actions: () => [A.whatsapp('Hello OnePoint Logistics, I would like to ask about ' + lastTopic + '.'), A.call] },
    { id: 'where', q: 'Where are you based?', topic: 'your location', keys: ['where', 'location', 'address', 'office', 'visit', 'located', 'find you', 'gahanga', 'kicukiro', 'map', 'direction', 'based'],
      a: () => 'We are in Gahanga Sector, Kicukiro District, Kigali, near Gahanga Cricket Stadium. Customers are welcome to visit during office hours.',
      actions: () => [A.whatsapp('Hello OnePoint Logistics, I would like directions to your office.')] },
    { id: 'outside', q: 'Do you work outside Kigali?', topic: 'services outside Kigali', keys: ['outside', 'province', 'rubavu', 'musanze', 'huye', 'rusizi', 'nyagatare', 'upcountry', 'nationwide', 'across rwanda', 'whole rwanda', 'other district', 'other city'],
      a: () => 'Yes. We provide services across Rwanda, according to your requirements and the nature of the assignment.',
      actions: () => [A.form] },
    { id: 'transfer', q: 'Airport transfers and transport', topic: 'airport transfers and transport', keys: ['airport', 'transfer', 'pickup', 'pick up', 'drop', 'transport', 'bus', 'vehicle', 'car', 'driver', 'shuttle', 'van', 'travel'],
      a: () => 'We coordinate pickups and drop-offs at Kigali International Airport, plus vehicles, buses and drivers for delegates, speakers, staff and field activities.',
      actions: () => [A.form, A.whatsapp('Hello OnePoint Logistics, I need airport transfers or transport.')] },
    { id: 'stay', q: 'Venues and accommodation', topic: 'venues and accommodation', keys: ['hotel', 'accommodation', 'stay', 'lodging', 'room', 'venue', 'hall', 'book', 'sleep'],
      a: () => 'We source and coordinate conference venues and meeting rooms, and arrange hotels for individual travelers, delegations and groups.',
      actions: () => [A.form] },
    { id: 'catering', q: 'Catering', topic: 'catering', keys: ['cater', 'food', 'meal', 'coffee', 'lunch', 'breakfast', 'dinner', 'refreshment', 'snack', 'drink'],
      a: () => 'We arrange meals, refreshments and coffee breaks for meetings, conferences, workshops and seminars, including event, conference and corporate catering.',
      actions: () => [A.form] },
    { id: 'equipment', q: 'Equipment, printing and branding', topic: 'equipment, printing and branding', keys: ['equipment', 'sound', 'projector', 'screen', 'microphone', 'mic', 'furniture', 'chair', 'table', 'print', 'banner', 'brand', 'backdrop', 'signage', 'badge', 'poster', 'flyer', 'design', 'mug', 'pin', 'notebook', 'folder', 'tshirt', 't-shirt'],
      a: () => 'We arrange sound systems, projectors, screens and furniture, plus printed materials and branding such as banners, backdrops, signage and badges.',
      actions: () => [A.examples, A.form] },
    { id: 'people', q: 'Interpretation, security and staff', topic: 'interpretation, security and event staff', keys: ['interpret', 'translat', 'language', 'security', 'guard', 'usher', 'staff', 'registration', 'coordinator', 'hostess', 'protocol'],
      a: () => 'We coordinate interpreters for multilingual meetings, security arrangements, and ushers, registration staff and coordinators to run the day.',
      actions: () => [A.form] },
    { id: 'media', q: 'Photography and entertainment', topic: 'photography and entertainment', keys: ['photo', 'camera', 'video', 'media', 'coverage', 'entertain', 'music', 'perform', 'dj', 'band', 'mc$'],
      a: () => 'We arrange photography and media coverage of your event, and performers or music where the occasion calls for it.',
      actions: () => [A.examples, A.form] },
    { id: 'clients', q: 'Who do you work with?', topic: 'who you work with', keys: ['who', 'ngo', 'compan', 'institution', 'organi', 'client', 'serve', 'government', 'international'],
      a: () => 'We work with companies, NGOs, international organizations and institutions that need reliable local logistics and event support in Rwanda.',
      actions: () => [A.faq] },
    { id: 'services', q: 'What services do you offer?', topic: 'your services', keys: ['service', 'offer', 'provide', 'what do you', 'what can', 'help', 'do you do', 'package', 'everything'],
      a: () => 'We coordinate venues, accommodation, airport transfers, transportation, catering, conference equipment, printing, event branding, interpretation, security, photography, entertainment and event staff, all through one local point of contact.',
      actions: () => [A.services, A.form] },
    { id: 'conference', q: 'Conferences and events', topic: 'a conference or event', keys: ['conference', 'workshop', 'seminar', 'meeting', 'event', 'corporate', 'launch', 'training', 'retreat', 'summit', 'forum'],
      a: () => 'Yes. We coordinate conferences, workshops, seminars, corporate meetings and launches in Kigali and across Rwanda: venue, transport, accommodation, catering, equipment, branding and staff, managed through one contact.',
      actions: () => [A.form, A.whatsapp('Hello OnePoint Logistics, I am planning an event.')] },
    { id: 'about', q: 'About OnePoint', topic: 'your company', keys: ['about', 'since', 'established', 'founded', 'started', 'how long', 'history', 'company'],
      a: () => 'OnePoint Logistics Ltd was established on 27 September 2021 and is based in Kigali. Our one-point model gives you a single local partner instead of many separate suppliers.',
      actions: () => [] },
    { id: 'hello', q: '', topic: 'your services', keys: ['hello$', 'hi$', 'hey$', 'muraho', 'mwiriwe', 'bonjour', 'good morning', 'good afternoon', 'good evening'],
      a: () => 'Hello! What would you like to know? You can pick a question below or type your own.', actions: () => [] },
    { id: 'thanks', q: '', topic: '', keys: ['thank', 'murakoze', 'merci', 'great$', 'ok$', 'okay$'],
      a: () => 'You are welcome! If you need anything else, ask here or message the team on WhatsApp.', actions: () => [A.whatsapp('Hello OnePoint Logistics, I have a question.')] }
  ];
  KB.forEach(item => { item.res = item.keys.map(k => k.endsWith('$') ? new RegExp('\\b' + k.slice(0, -1) + '\\b') : new RegExp('\\b' + k)); });

  const CHIP_ORDER = ['services', 'transfer', 'quote', 'where', 'hours', 'contact', 'stay', 'catering'];

  function match(text) {
    const t = text.toLowerCase();
    let best = null, bestScore = 0;
    KB.forEach(item => {
      const score = item.res.reduce((n, re) => n + (re.test(t) ? 1 : 0), 0);
      if (score > bestScore) { best = item; bestScore = score; }
    });
    return best;
  }

  function addMsg(role, text, actions) {
    const m = document.createElement('div');
    m.className = 'msg ' + role;
    const p = document.createElement('p');
    p.textContent = text;
    m.appendChild(p);
    if (actions && actions.length) {
      const box = document.createElement('div');
      box.className = 'msg-actions';
      actions.forEach(a => {
        const el = document.createElement('a');
        el.className = 'msg-btn';
        el.textContent = a.label;
        if (a.href) {
          el.href = a.href;
          if (a.external) { el.target = '_blank'; el.rel = 'noopener'; }
        } else if (a.jump) {
          el.href = a.jump;
          el.addEventListener('click', () => { if (window.innerWidth <= 900) closePanel(); });
        }
        box.appendChild(el);
      });
      m.appendChild(box);
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function say(text, actions) {
    if (reduce) { addMsg('bot', text, actions); return; }
    const t = document.createElement('div');
    t.className = 'msg bot typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    t.setAttribute('aria-hidden', 'true');
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    setTimeout(() => { t.remove(); addMsg('bot', text, actions); }, 450);
  }

  function showChips(excludeId) {
    chipsEl.textContent = '';
    CHIP_ORDER.filter(id => id !== excludeId).slice(0, 5).forEach(id => {
      const item = KB.find(k => k.id === id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = item.q;
      b.addEventListener('click', () => ask(item.q, item));
      chipsEl.appendChild(b);
    });
  }

  function ask(text, item) {
    addMsg('user', text);
    const found = item || match(text);
    if (found) {
      lastTopic = found.topic || lastTopic;
      say(found.a(), found.actions());
      showChips(found.id);
    } else {
      say('I am not sure about that one. I can help with our services, airport transfers, venues, catering, location, hours and quotes, or you can send your question to the team.',
        [A.whatsapp('Hello OnePoint Logistics, my question: ' + text.slice(0, 300)), A.form]);
      showChips('');
    }
  }

  function greet() {
    updateStatus();
    let text = 'Hello! I am the OnePoint assistant. I can answer quick questions about our services, location and hours, or point you to the team.';
    if (!officeOpen()) text += ' The office is closed right now, but I am here and you can leave a message on WhatsApp.';
    addMsg('bot', text);
    showChips('');
  }

  let started = false;
  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('assistant-open');
    if (!started) { started = true; greet(); } else { updateStatus(); }
    if (window.innerWidth > 560) input.focus({ preventScroll: true }); else panel.focus({ preventScroll: true });
  }
  function closePanel(returnFocus) {
    panel.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('assistant-open');
    setTimeout(() => { if (!panel.classList.contains('show')) panel.hidden = true; }, reduce ? 0 : 230);
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => { panel.classList.contains('show') ? closePanel(true) : openPanel(); });
  closeBtn.addEventListener('click', () => closePanel(true));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closePanel(true); } });
  formEl.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    ask(text);
  });
})();
