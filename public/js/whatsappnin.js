const getVenues = require('./utils/get-venues');
const getEvents = require('./utils/get-events');

const VENUE_COLORS = {
  bgwmc: '#ff5252',
  coven: '#b06cff',
  'dalston-superstore': '#1fd3c3',
  fire: '#ff7a18',
  heaven: '#3d8bff',
  lightbox: '#ffc233',
  rvt: '#3ddc84',
  divine: '#ff3d9a',
  eagle: '#7b7bff',
  'two-brewers': '#f0a23c',
  'white-swan': '#ff6dc4',
  xoyo: '#19d0ff',
  comptons: '#4ade80',
  'duke-of-wellington': '#fbbf24',
  'bar-soho': '#f472b6',
  'halfway-to-heaven': '#38bdf8',
  freedom: '#f87171',
  howl: '#f472b6',
  sextou: '#fb923c',
  'tech-couture': '#a78bfa',
  smut: '#f43f5e',
  fold: '#34d399',
  'maiden-voyage': '#38bdf8',
  'body-movements': '#fbbf24',
  'club-are': '#818cf8',
};

const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function col(slug) { return VENUE_COLORS[slug] || '#ff3d9a'; }

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(url) {
  if (!url) return '#';
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
  } catch (e) { return '#'; }
}

function fmtToday() {
  const d = new Date();
  return `${WD_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function dateKey(dateVal) {
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayId(key) { return 'd-' + key; }

// ── builders ──────────────────────────────────────────────────────────────────

function buildHeader(venues, days) {
  const venuePills = venues.map(v => {
    const color = col(v.slug);
    return `<button class="venue-pill" data-slug="${v.slug}" style="flex:0 0 auto;display:flex;align-items:center;gap:8px;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.01em;padding:7px 14px;border-radius:99px;cursor:pointer;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;"><span style="width:9px;height:9px;border-radius:99px;background:${color};flex:0 0 auto;"></span>${esc(v.name)}</button>`;
  }).join('');

  const dayPills = days.map(day => {
    const d = day.date;
    return `<button class="day-pill" data-target="${dayId(day.key)}" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:58px;padding:9px 12px;margin-top:14px;border-radius:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">
      <span style="font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.7;">${WD_SHORT[d.getDay()]}</span>
      <span style="font-weight:700;font-size:18px;line-height:1;">${d.getDate()}</span>
      <span class="day-count" data-day="${day.key}" style="font-family:'Spline Sans Mono',monospace;font-size:9px;letter-spacing:0.05em;color:#ff3d9a;min-height:11px;">${day.events.length || ''}</span>
    </button>`;
  }).join('');

  return `<header id="site-header" style="position:sticky;top:0;z-index:40;background:rgba(12,11,15,0.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.08);">
    <div style="height:5px;background:#ffb3d6;"></div>
    <div class="nin-header-inner" style="max-width:1280px;margin:0 auto;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div style="display:flex;align-items:baseline;gap:14px;">
        <div style="font-weight:800;font-size:26px;letter-spacing:-0.03em;line-height:1;color:#ffb3d6;">whats 'appnin?</div>
        <div class="nin-tagline" style="font-family:'Spline Sans Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8f8898;">queer london · nightly</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div class="nin-today" style="font-family:'Spline Sans Mono',monospace;font-size:12px;color:#8f8898;">${fmtToday()}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="last-scraped" class="nin-last-scraped" style="font-family:'Spline Sans Mono',monospace;font-size:11px;color:#6f6878;"></span>
          <button id="btn-scrape" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8f8898;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:99px;padding:8px 14px;cursor:pointer;">Get latest</button>
        </div>
        <button id="btn-tonight" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#0c0b0f;background:#ffb3d6;border:none;border-radius:99px;padding:8px 14px;cursor:pointer;">Tonight</button>
      </div>
    </div>
    <div id="header-collapsible" style="overflow:hidden;max-height:0;opacity:0;transition:max-height 0.35s ease,opacity 0.2s ease;">
      <div class="nin-pills-row nin-scroll" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:8px;flex-wrap:wrap;">
        <button id="pill-all" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid #f3efe9;background:#f3efe9;color:#0c0b0f;transition:all 0.15s;">All venues</button>
        ${venuePills}
      </div>
      <nav class="nin-scroll nin-day-nav" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:6px;overflow-x:auto;border-top:1px solid rgba(255,255,255,0.05);">
        ${dayPills}
      </nav>
    </div>
  </header>`;
}

function buildCard(event, venueMap) {
  const color = col(event.venue);
  const venueName = venueMap[event.venue] ? venueMap[event.venue].name : event.venue;
  const imgHtml = event.image_url
    ? `<div style="width:100%;height:260px;overflow:hidden;flex-shrink:0;"><img src="${safeUrl(event.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
    : '';
  const blurbHtml = event.description
    ? `<p style="margin:0;font-size:14px;line-height:1.5;color:#a9a1b3;">${esc(event.description)}</p>`
    : '';

  return `<article class="event-card" data-venue="${event.venue}" style="animation:ninFade 0.4s ease both;display:flex;flex-direction:column;background:#161420;border:1px solid rgba(255,255,255,0.07);border-left:5px solid ${color};border-radius:16px;overflow:hidden;">
    ${imgHtml}
    <div style="padding:18px 18px 20px;display:flex;flex-direction:column;gap:12px;flex:1;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span style="display:inline-flex;align-items:center;gap:7px;font-family:'Spline Sans Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.02em;padding:5px 10px;border-radius:99px;background:${color}22;color:${color};overflow:hidden;max-width:60%;"><span style="width:7px;height:7px;border-radius:99px;background:${color};flex:0 0 auto;"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(venueName)}</span></span>
        <span style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:500;color:#cabfd4;white-space:nowrap;">${esc(event.time || '')}</span>
      </div>
      <h3 style="margin:0;font-weight:700;font-size:21px;line-height:1.12;letter-spacing:-0.02em;">${esc(event.title)}</h3>
      ${blurbHtml}
      <div style="margin-top:auto;padding-top:8px;display:flex;justify-content:flex-end;">
        <a href="${safeUrl(event.link)}" target="_blank" rel="noopener" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;text-decoration:none;padding:8px 14px;border-radius:99px;color:${color};border:1px solid ${color}44;">Details →</a>
      </div>
    </div>
  </article>`;
}

function buildSection(day, venueMap) {
  const d = day.date;
  const cards = day.events.map(e => buildCard(e, venueMap)).join('');

  return `<section id="${dayId(day.key)}" class="day-section" data-day="${day.key}" style="padding-top:46px;">
    <div style="display:flex;align-items:baseline;gap:16px;padding-bottom:16px;flex-wrap:wrap;">
      <h2 class="day-heading" style="margin:0;font-weight:800;font-size:38px;letter-spacing:-0.03em;line-height:0.95;">${WD_LONG[d.getDay()]} <span style="color:#8f8898;font-weight:600;">${d.getDate()} ${MONTHS[d.getMonth()]}</span></h2>
      <span class="day-summary" data-day="${day.key}" style="font-family:'Spline Sans Mono',monospace;font-size:12px;color:#8f8898;margin-left:auto;">${day.events.length} night${day.events.length !== 1 ? 's' : ''}</span>
    </div>
    <div style="height:3px;border-radius:99px;margin-bottom:26px;background:#ffb3d6;"></div>
    <div class="event-grid" data-day="${day.key}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,360px));gap:18px;align-items:start;">
      ${cards}
    </div>
    <div class="empty-state" data-day="${day.key}" style="display:none;padding:40px 24px;border:1px dashed rgba(255,255,255,0.12);border-radius:16px;text-align:center;">
      <p style="margin:0;font-size:16px;color:#8f8898;">No events for this venue on this day.</p>
    </div>
  </section>`;
}

function buildPage(venues, days) {
  const venueMap = {};
  venues.forEach(v => { venueMap[v.slug] = v; });

  return buildHeader(venues, days) + `
    <main class="nin-main" style="max-width:1280px;margin:0 auto;padding:0 28px 80px;">
      ${days.map(day => buildSection(day, venueMap)).join('')}
      <footer style="margin-top:64px;padding-top:28px;border-top:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;color:#ffb3d6;">whats 'appnin?</div>
        <div style="font-family:'Spline Sans Mono',monospace;font-size:11px;letter-spacing:0.06em;color:#6f6878;text-align:right;">a love letter to queer london nightlife<br>got a night to list? hello@whatsnin.london</div>
      </footer>
    </main>`;
}

// ── filter ────────────────────────────────────────────────────────────────────

const activeFilters = new Set();

function toggleFilter(slug) {
  if (activeFilters.has(slug)) {
    activeFilters.delete(slug);
  } else {
    activeFilters.add(slug);
  }
  renderFilter();
}

function clearFilters() {
  activeFilters.clear();
  renderFilter();
}

function renderFilter() {
  const isAll = activeFilters.size === 0;

  const allPill = document.getElementById('pill-all');
  allPill.style.border = isAll ? '1px solid #f3efe9' : '1px solid rgba(255,255,255,0.1)';
  allPill.style.background = isAll ? '#f3efe9' : 'rgba(255,255,255,0.03)';
  allPill.style.color = isAll ? '#0c0b0f' : '#cabfd4';

  document.querySelectorAll('.venue-pill').forEach(pill => {
    const active = activeFilters.has(pill.dataset.slug);
    const color = col(pill.dataset.slug);
    pill.style.border = active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)';
    pill.style.background = active ? color : 'rgba(255,255,255,0.03)';
    pill.style.color = active ? '#0c0b0f' : '#cabfd4';
  });

  document.querySelectorAll('.event-card').forEach(card => {
    card.style.display = (isAll || activeFilters.has(card.dataset.venue)) ? '' : 'none';
  });

  document.querySelectorAll('.day-section').forEach(section => {
    const key = section.dataset.day;
    const visible = Array.from(section.querySelectorAll('.event-card'))
      .filter(el => el.style.display !== 'none').length;
    section.querySelector('.event-grid').style.display = visible ? '' : 'none';
    section.querySelector('.empty-state').style.display = visible ? 'none' : '';

    const countEl = document.querySelector(`.day-count[data-day="${key}"]`);
    const summaryEl = document.querySelector(`.day-summary[data-day="${key}"]`);
    if (countEl) countEl.textContent = visible ? String(visible) : '';
    if (summaryEl) summaryEl.textContent = visible
      ? `${visible} night${visible !== 1 ? 's' : ''}`
      : 'filtered';
  });
}

// ── handlers ──────────────────────────────────────────────────────────────────

function attachHandlers() {
  const header = document.getElementById('site-header');
  const collapsible = document.getElementById('header-collapsible');

  const expand = () => {
    collapsible.style.maxHeight = '400px';
    collapsible.style.opacity = '1';
  };
  const collapse = () => {
    collapsible.style.maxHeight = '0';
    collapsible.style.opacity = '0';
  };

  if (window.matchMedia('(hover: hover)').matches) {
    header.addEventListener('mouseenter', expand);
    header.addEventListener('mouseleave', collapse);
  } else {
    expand();
  }

  const scrapeBtn = document.getElementById('btn-scrape');
  const lastScrapedEl = document.getElementById('last-scraped');

  const updateLastScraped = () => {
    const ts = localStorage.getItem('nin_last_scraped');
    if (ts) {
      const d = new Date(ts);
      const str = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      lastScrapedEl.textContent = 'Last updated ' + str;
    }
  };

  updateLastScraped();

  scrapeBtn.addEventListener('click', async () => {
    scrapeBtn.textContent = 'Updating…';
    scrapeBtn.disabled = true;
    scrapeBtn.style.opacity = '0.5';
    try {
      await fetch('/refresh-events');
      const now = new Date().toISOString();
      localStorage.setItem('nin_last_scraped', now);
      updateLastScraped();
      window.location.reload();
    } catch (_) {
      scrapeBtn.textContent = 'Error';
      setTimeout(() => {
        scrapeBtn.textContent = 'Get latest';
        scrapeBtn.disabled = false;
        scrapeBtn.style.opacity = '1';
      }, 3000);
    }
  });

  document.getElementById('btn-tonight').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('pill-all').addEventListener('click', () => clearFilters());

  document.querySelectorAll('.venue-pill').forEach(pill => {
    pill.addEventListener('click', () => toggleFilter(pill.dataset.slug));
  });

  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const el = document.getElementById(pill.dataset.target);
      if (!el) return;
      const offset = header.offsetHeight + 10;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}

// ── init ──────────────────────────────────────────────────────────────────────

async function run() {
  try {
    const [venues, events] = await Promise.all([getVenues({ active: 'TRUE' }), getEvents()]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureEvents = events
      .map(e => ({ ...e, _date: new Date(e.date) }))
      .filter(e => e._date >= today)
      .sort((a, b) => a._date - b._date);

    const dayMap = new Map();
    futureEvents.forEach(e => {
      const key = dateKey(e._date);
      if (!dayMap.has(key)) dayMap.set(key, { key, date: new Date(e._date), events: [] });
      dayMap.get(key).events.push(e);
    });

    const days = Array.from(dayMap.values()).slice(0, 14);

    document.getElementById('app').innerHTML = buildPage(venues, days);
    attachHandlers();
  } catch (err) {
    console.error(err);
    document.getElementById('app').innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
        <div style="font-family:'Spline Sans Mono',monospace;font-size:12px;color:#8f8898;">Something went wrong. Try refreshing.</div>
      </div>`;
  }
}

run();
