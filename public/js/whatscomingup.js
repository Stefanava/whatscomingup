const getVenues = require('./utils/get-venues');
const getEvents = require('./utils/get-events');
const { WD_SHORT, WD_LONG, MONTHS, esc, safeUrl, dateKey, dayId, fmtToday } = require('./utils/format');
const { setSectionVisibility } = require('./utils/section-visibility');

let VENUE_COLORS = {};

function col(slug) { return VENUE_COLORS[slug] || '#ff3d9a'; }

// ── favourites ────────────────────────────────────────────────────────────────

function getFavourites() {
  try { return new Set(JSON.parse(localStorage.getItem('wcu_favourites') || '[]')); }
  catch (_) { return new Set(); }
}

function saveFavourites(set) {
  localStorage.setItem('wcu_favourites', JSON.stringify([...set]));
}

const favourites = getFavourites();

function toggleFavourite(slug) {
  if (favourites.has(slug)) { favourites.delete(slug); } else { favourites.add(slug); }
  saveFavourites(favourites);
  renderFavourites();
}

function renderFavourites() {
  const myPill = document.getElementById('pill-my-venues');
  if (myPill) myPill.style.display = favourites.size > 0 ? '' : 'none';
  document.querySelectorAll('.fav-heart').forEach(heart => {
    const isFav = favourites.has(heart.dataset.slug);
    heart.textContent = isFav ? '♥' : '♡';
    heart.style.color = isFav ? '#ff3d9a' : 'rgba(255,255,255,0.25)';
  });
}

// ── builders ──────────────────────────────────────────────────────────────────

function buildHeader(venues, days) {
  const venuePills = venues.map(v => {
    const color = col(v.slug);
    return `<button class="venue-pill" data-slug="${v.slug}" data-type="${v.venue_type || 'venue'}" style="flex:0 0 auto;display:flex;align-items:center;gap:8px;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.01em;padding:7px 14px;border-radius:99px;cursor:pointer;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;"><span style="width:9px;height:9px;border-radius:99px;background:${color};flex:0 0 auto;"></span>${esc(v.name)}<span class="fav-heart" data-slug="${v.slug}" style="margin-left:2px;font-size:11px;line-height:1;color:rgba(255,255,255,0.25);cursor:pointer;">♡</span></button>`;
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
        <div style="font-weight:800;font-size:26px;letter-spacing:-0.03em;line-height:1;color:#ffb3d6;">whatscomingup?</div>
        <div class="nin-tagline" style="font-family:'Spline Sans Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8f8898;">queer london · nightly</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div class="nin-today" style="font-family:'Spline Sans Mono',monospace;font-size:12px;color:#8f8898;">${fmtToday()}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="last-scraped" class="nin-last-scraped" style="font-family:'Spline Sans Mono',monospace;font-size:11px;color:#6f6878;"></span>
          <button id="btn-scrape" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8f8898;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:99px;padding:8px 14px;cursor:pointer;">Get latest</button>
        </div>
        <button id="btn-tonight" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#0c0b0f;background:#ffb3d6;border:none;border-radius:99px;padding:8px 14px;cursor:pointer;">Tonight</button>
        <div id="auth-area" style="display:flex;align-items:center;"></div>
      </div>
    </div>
    <div id="header-collapsible" style="overflow:hidden;max-height:0;opacity:0;transition:max-height 0.35s ease,opacity 0.2s ease;">
      <div class="nin-pills-row nin-scroll" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:8px;flex-wrap:wrap;">
        <button id="pill-my-venues" style="display:none;flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:none;background:#ff3d9a;color:#0c0b0f;transition:all 0.15s;">My venues ♥</button>
        <button id="pill-all" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid #f3efe9;background:#f3efe9;color:#0c0b0f;transition:all 0.15s;">All venues</button>
        <button id="pill-filter-venues" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">Venues</button>
        <button id="pill-filter-promoters" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">Club nights</button>
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
    ? `<div style="width:100%;height:130px;overflow:hidden;flex-shrink:0;"><img src="${safeUrl(event.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
    : '';
  const blurbHtml = event.description
    ? `<p style="margin:0;font-size:12px;line-height:1.5;color:#a9a1b3;">${esc(event.description)}</p>`
    : '';

  return `<article class="event-card" data-venue="${event.venue}" style="animation:ninFade 0.4s ease both;display:flex;flex-direction:column;background:#161420;border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${color};border-radius:8px;overflow:hidden;">
    ${imgHtml}
    <div style="padding:9px 9px 10px;display:flex;flex-direction:column;gap:6px;flex:1;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:5px;">
        <span style="display:inline-flex;align-items:center;gap:5px;font-family:'Spline Sans Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.02em;padding:3px 6px;border-radius:99px;background:${color}22;color:${color};overflow:hidden;max-width:60%;"><span style="width:5px;height:5px;border-radius:99px;background:${color};flex:0 0 auto;"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(venueName)}</span></span>
        <span style="font-family:'Spline Sans Mono',monospace;font-size:10px;font-weight:500;color:#cabfd4;white-space:nowrap;">${esc(event.time || '')}</span>
      </div>
      <h3 style="margin:0;font-weight:700;font-size:15px;line-height:1.12;letter-spacing:-0.02em;">${esc(event.title)}</h3>
      ${blurbHtml}
      <div style="margin-top:auto;padding-top:4px;display:flex;justify-content:flex-end;">
        <a href="${safeUrl(event.link)}" target="_blank" rel="noopener" style="font-family:'Spline Sans Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;text-decoration:none;padding:5px 10px;border-radius:99px;color:${color};border:1px solid ${color}44;">Details →</a>
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
    <div class="event-grid" data-day="${day.key}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,180px));gap:9px;align-items:start;">
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
        <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;color:#ffb3d6;">whatscomingup?</div>
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

  const setTypePillActive = (id, type) => {
    const slugs = Array.from(document.querySelectorAll(`.venue-pill[data-type="${type}"]`)).map(p => p.dataset.slug);
    const active = slugs.length > 0 && activeFilters.size === slugs.length && slugs.every(s => activeFilters.has(s));
    const pill = document.getElementById(id);
    pill.style.border = active ? '1px solid #f3efe9' : '1px solid rgba(255,255,255,0.1)';
    pill.style.background = active ? '#f3efe9' : 'rgba(255,255,255,0.03)';
    pill.style.color = active ? '#0c0b0f' : '#cabfd4';
  };
  setTypePillActive('pill-filter-venues', 'venue');
  setTypePillActive('pill-filter-promoters', 'promoter');

  document.querySelectorAll('.event-card').forEach(card => {
    card.style.display = (isAll || activeFilters.has(card.dataset.venue)) ? '' : 'none';
  });

  document.querySelectorAll('.day-section').forEach(section => {
    const key = section.dataset.day;
    const visible = Array.from(section.querySelectorAll('.event-card'))
      .filter(el => el.style.display !== 'none').length;
    setSectionVisibility(section, visible);

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
    const ts = localStorage.getItem('wcu_last_scraped');
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
      localStorage.setItem('wcu_last_scraped', now);
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

  const filterByType = (type) => {
    clearFilters();
    document.querySelectorAll(`.venue-pill[data-type="${type}"]`).forEach(p => activeFilters.add(p.dataset.slug));
    renderFilter();
  };
  document.getElementById('pill-filter-venues').addEventListener('click', () => filterByType('venue'));
  document.getElementById('pill-filter-promoters').addEventListener('click', () => filterByType('promoter'));

  document.querySelectorAll('.venue-pill').forEach(pill => {
    pill.addEventListener('click', () => toggleFilter(pill.dataset.slug));
  });

  document.querySelectorAll('.fav-heart').forEach(heart => {
    heart.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavourite(heart.dataset.slug);
    });
  });

  const myVenuesPill = document.getElementById('pill-my-venues');
  if (myVenuesPill) {
    myVenuesPill.addEventListener('click', () => {
      clearFilters();
      favourites.forEach(slug => activeFilters.add(slug));
      renderFilter();
    });
  }

  renderFavourites();

  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const el = document.getElementById(pill.dataset.target);
      if (!el) return;
      const offset = header.offsetHeight + 10;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}

// ── auth ──────────────────────────────────────────────────────────────────────

async function initAuth() {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;
  try {
    const data = await fetch('/auth/me').then(r => r.json());
    if (data && data.user) {
      if (window.location.search.includes('loggedIn=1')) {
        await fetch('/auth/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venues: [...favourites] }),
        });
        history.replaceState({}, '', '/');
      }
      if (data.favourites && data.favourites.length) {
        data.favourites.forEach(slug => favourites.add(slug));
        saveFavourites(favourites);
        renderFavourites();
      }
      authArea.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">
        ${data.user.picture ? `<img src="${esc(data.user.picture)}" style="width:26px;height:26px;border-radius:99px;object-fit:cover;" alt="">` : ''}
        <a href="/auth/logout" style="font-family:'Spline Sans Mono',monospace;font-size:11px;color:#8f8898;text-decoration:none;border:1px solid rgba(255,255,255,0.12);border-radius:99px;padding:5px 10px;">Sign out</a>
      </div>`;
    } else if (data && data.authAvailable) {
      authArea.innerHTML = `<a href="/auth/google" style="font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;color:#8f8898;border:1px solid rgba(255,255,255,0.12);border-radius:99px;padding:8px 14px;">Sign in</a>`;
    }
  } catch (_) {}
}

// ── init ──────────────────────────────────────────────────────────────────────

async function run() {
  try {
    const [venues, events] = await Promise.all([getVenues({ active: 'TRUE' }), getEvents()]);
    VENUE_COLORS = Object.fromEntries(venues.map(v => [v.slug, v.color || '#ff3d9a']));

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
    initAuth();
  } catch (err) {
    console.error(err);
    document.getElementById('app').innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
        <div style="font-family:'Spline Sans Mono',monospace;font-size:12px;color:#8f8898;">Something went wrong. Try refreshing.</div>
      </div>`;
  }
}

run();
