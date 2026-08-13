const getVenues = require('./utils/get-venues');
const getEvents = require('./utils/get-events');
const { WD_SHORT, WD_LONG, MONTHS, esc, safeUrl, dateKey, dayId, fmtToday } = require('./utils/format');
const { setSectionVisibility } = require('./utils/section-visibility');
const { buildCalendarWeeks, filterDayEvents, dayHasNight } = require('./utils/calendar');

let VENUE_COLORS = {};

// ── view state ────────────────────────────────────────────────────────────────

let currentView = 'list'; // 'list' | 'calendar'
let selectedDayKey = null;
const STATE = { venueMap: {}, dayMap: new Map(), todayKey: null, windowStart: null, windowEnd: null };

function col(slug) { return VENUE_COLORS[slug] || '#ff3d9a'; }

// Parses a `dateKey` ("YYYY-MM-DD") back into a local-time Date, matching
// dateKey's own local getFullYear/getMonth/getDate — `new Date(key)` would
// parse it as UTC midnight instead and can land on the wrong local day.
function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

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
        <div style="display:flex;align-items:center;gap:2px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:99px;padding:2px;">
          <button id="btn-view-list" style="font-family:'Spline Sans Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;border:none;border-radius:99px;padding:6px 12px;cursor:pointer;color:#0c0b0f;background:#ffb3d6;">List</button>
          <button id="btn-view-calendar" style="font-family:'Spline Sans Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;border:none;border-radius:99px;padding:6px 12px;cursor:pointer;color:#cabfd4;background:transparent;">Calendar</button>
        </div>
        <div id="auth-area" style="display:flex;align-items:center;"></div>
      </div>
    </div>
    <div class="nin-key-pills-row nin-scroll" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button id="pill-my-venues" style="display:none;flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:none;background:#ff3d9a;color:#0c0b0f;transition:all 0.15s;">My venues ♥</button>
      <button id="pill-all" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid #f3efe9;background:#f3efe9;color:#0c0b0f;transition:all 0.15s;">All venues</button>
      <button id="pill-filter-venues" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">Venues</button>
      <button id="pill-filter-promoters" style="flex:0 0 auto;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">Club nights</button>
      <button id="btn-toggle-venues" style="flex:0 0 auto;display:flex;align-items:center;gap:6px;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:0.02em;padding:7px 14px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#cabfd4;transition:all 0.15s;">More venues <span id="venue-toggle-arrow" style="font-size:9px;display:inline-block;transition:transform 0.2s ease;">▾</span></button>
    </div>
    <div id="venue-pills-panel" style="overflow:hidden;max-height:0;opacity:0;transition:max-height 0.3s ease,opacity 0.2s ease;">
      <div class="nin-venue-pills nin-scroll" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:8px;flex-wrap:wrap;">
        ${venuePills}
      </div>
    </div>
    <nav class="nin-scroll nin-day-nav" style="max-width:1280px;margin:0 auto;padding:0 28px 14px;display:flex;gap:6px;overflow-x:auto;border-top:1px solid rgba(255,255,255,0.05);">
      ${dayPills}
    </nav>
  </header>`;
}

function toggleVenuePanel() {
  const panel = document.getElementById('venue-pills-panel');
  const arrow = document.getElementById('venue-toggle-arrow');
  const isOpen = panel.dataset.open === 'true';
  panel.dataset.open = isOpen ? 'false' : 'true';
  panel.style.maxHeight = isOpen ? '0' : '600px';
  panel.style.opacity = isOpen ? '0' : '1';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

function buildCard(event, venueMap) {
  const color = col(event.venue);
  const venueName = venueMap[event.venue] ? venueMap[event.venue].name : event.venue;
  const imgHtml = event.image_url
    ? `<div style="width:100%;height:130px;overflow:hidden;flex-shrink:0;"><img src="${safeUrl(event.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
    : '';
  const blurbHtml = event.description
    ? `<p style="margin:0;font-size:12px;line-height:1.5;color:#a9a1b3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;">${esc(event.description)}</p>`
    : '';

  return `<article class="event-card" data-venue="${event.venue}" style="animation:ninFade 0.4s ease both;display:flex;flex-direction:column;background:#161420;border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${color};border-radius:8px;overflow:hidden;">
    ${imgHtml}
    <div style="padding:9px 9px 10px;display:flex;flex-direction:column;gap:6px;flex:1;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:5px;">
        <span style="display:inline-flex;align-items:center;gap:5px;font-family:'Spline Sans Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.02em;padding:3px 6px;border-radius:99px;background:${color}22;color:${color};overflow:hidden;max-width:60%;"><span style="width:5px;height:5px;border-radius:99px;background:${color};flex:0 0 auto;"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(venueName)}</span></span>
        <span style="font-family:'Spline Sans Mono',monospace;font-size:10px;font-weight:500;color:#cabfd4;white-space:nowrap;">${esc(event.time || '')}</span>
      </div>
      <h3 style="margin:0;font-weight:700;font-size:15px;line-height:1.12;letter-spacing:-0.02em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;">${esc(event.title)}</h3>
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
      <p style="margin:0;font-size:16px;color:#8f8898;">No events on this day.</p>
    </div>
  </section>`;
}

function buildFooter() {
  return `<footer style="margin-top:64px;padding-top:28px;border-top:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;color:#ffb3d6;">whatscomingup?</div>
    <div style="font-family:'Spline Sans Mono',monospace;font-size:11px;letter-spacing:0.06em;color:#6f6878;text-align:right;">a love letter to queer london nightlife<br>got a night to list? hello@whatsnin.london</div>
  </footer>`;
}

function buildMainList(days, venueMap) {
  return days.map(day => buildSection(day, venueMap)).join('') + buildFooter();
}

function buildCalendarCell(cell, venueMap) {
  const filtered = filterDayEvents(cell.events, activeFilters);
  const count = filtered.length;
  const isNight = cell.inRange && dayHasNight(filtered, venueMap);
  const isToday = cell.key === STATE.todayKey;
  const isSelected = cell.key === selectedDayKey;

  let border = '1px solid rgba(255,255,255,0.1)';
  let background = 'rgba(255,255,255,0.03)';
  let color = '#cabfd4';

  if (!cell.inRange) {
    border = '1px solid transparent';
    background = 'transparent';
    color = '#4a4552';
  } else if (isSelected) {
    border = '1px solid #ffb3d6';
    background = '#ffb3d6';
    color = '#0c0b0f';
  } else if (isNight) {
    border = '1px solid #ff3d9a';
    background = '#ff3d9a1a';
    color = '#f3efe9';
  } else if (isToday) {
    border = '1px solid #ffb3d6';
  }

  const countHtml = cell.inRange
    ? `<span class="calendar-count" style="font-family:'Spline Sans Mono',monospace;font-size:9px;letter-spacing:0.05em;color:${isSelected ? '#0c0b0f' : '#ff3d9a'};min-height:11px;">${count || ''}</span>`
    : '';

  return `<button class="calendar-cell" data-day="${cell.key}" data-in-range="${cell.inRange}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1;border-radius:10px;cursor:${cell.inRange ? 'pointer' : 'default'};pointer-events:${cell.inRange ? 'auto' : 'none'};border:${border};background:${background};color:${color};transition:all 0.15s;">
    <span style="font-weight:700;font-size:14px;line-height:1;">${cell.date.getDate()}</span>
    ${countHtml}
  </button>`;
}

function buildCalendarPanelSection(venueMap) {
  const entry = STATE.dayMap.get(selectedDayKey);
  const date = entry ? entry.date : keyToDate(selectedDayKey);
  const events = entry ? entry.events : [];
  const filtered = filterDayEvents(events, activeFilters);
  return buildSection({ key: selectedDayKey, date, events: filtered }, venueMap);
}

function buildMainCalendar(venueMap) {
  const weeks = buildCalendarWeeks(STATE.windowStart, STATE.windowEnd, STATE.dayMap);
  const weekdayHeader = WD_SHORT.map(d => `<div style="text-align:center;font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8f8898;padding-bottom:8px;">${d}</div>`).join('');
  const cells = weeks.flat().map(cell => buildCalendarCell(cell, venueMap)).join('');

  // #calendar-panel starts empty and is populated by renderCalendarPanel()
  // right after this markup is inserted into the DOM — unlike list-view
  // day-sections (always built with ≥1 event by construction), a selected
  // calendar day can genuinely have zero events, and correctly showing the
  // empty state requires setSectionVisibility(), which needs real DOM nodes.
  return `
    <div style="padding-top:32px;">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;">${weekdayHeader}</div>
      <div id="calendar-grid" class="calendar-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">${cells}</div>
    </div>
    <div id="calendar-panel" style="padding-top:32px;"></div>
    ${buildFooter()}`;
}

function buildPage(venues, days) {
  const venueMap = {};
  venues.forEach(v => { venueMap[v.slug] = v; });

  return buildHeader(venues, days) + `
    <main id="main-content" class="nin-main" style="max-width:1280px;margin:0 auto;padding:0 28px 80px;">
      ${buildMainList(days, venueMap)}
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

  // Calendar cells and the day panel aren't `.event-card`/`.day-summary`
  // elements the loops above touch — and the panel pre-filters events at
  // build time rather than hiding cards via display:none, so a filter
  // change can only be reflected by rebuilding it, not by restyling it.
  if (currentView === 'calendar') {
    renderCalendarGrid();
    renderCalendarPanel();
  }
}

// ── calendar view ─────────────────────────────────────────────────────────────

function attachCalendarCellHandlers() {
  document.querySelectorAll('.calendar-cell').forEach(cellEl => {
    if (cellEl.dataset.inRange !== 'true') return;
    cellEl.addEventListener('click', () => selectCalendarDay(cellEl.dataset.day));
  });
}

function renderCalendarGrid() {
  const gridEl = document.getElementById('calendar-grid');
  if (!gridEl) return;
  const weeks = buildCalendarWeeks(STATE.windowStart, STATE.windowEnd, STATE.dayMap);
  gridEl.innerHTML = weeks.flat().map(cell => buildCalendarCell(cell, STATE.venueMap)).join('');
  attachCalendarCellHandlers();
}

function renderCalendarPanel() {
  const panelEl = document.getElementById('calendar-panel');
  if (!panelEl) return;
  panelEl.innerHTML = buildCalendarPanelSection(STATE.venueMap);
  const entry = STATE.dayMap.get(selectedDayKey);
  const filtered = filterDayEvents(entry ? entry.events : [], activeFilters);
  setSectionVisibility(panelEl.querySelector('.day-section'), filtered.length);
}

function selectCalendarDay(key) {
  selectedDayKey = key;
  renderCalendarGrid();
  renderCalendarPanel();
}

function renderMain() {
  const main = document.getElementById('main-content');
  main.innerHTML = currentView === 'calendar'
    ? buildMainCalendar(STATE.venueMap)
    : buildMainList(Array.from(STATE.dayMap.values()), STATE.venueMap);
  // renderFilter() rebuilds+attaches the calendar grid/panel when
  // currentView === 'calendar' (see its calendar branch), or restyles
  // list-view pills/cards otherwise — single path for both.
  renderFilter();
  const dayNav = document.querySelector('.nin-day-nav');
  if (dayNav) dayNav.style.display = currentView === 'calendar' ? 'none' : 'flex';
}

function updateViewToggleUI() {
  const listBtn = document.getElementById('btn-view-list');
  const calBtn = document.getElementById('btn-view-calendar');
  if (!listBtn || !calBtn) return;
  listBtn.style.color = currentView === 'list' ? '#0c0b0f' : '#cabfd4';
  listBtn.style.background = currentView === 'list' ? '#ffb3d6' : 'transparent';
  calBtn.style.color = currentView === 'calendar' ? '#0c0b0f' : '#cabfd4';
  calBtn.style.background = currentView === 'calendar' ? '#ffb3d6' : 'transparent';
}

function setView(view) {
  if (view === currentView) return;
  currentView = view;
  renderMain();
  updateViewToggleUI();
}

// ── handlers ──────────────────────────────────────────────────────────────────

function attachHandlers() {
  const header = document.getElementById('site-header');

  document.getElementById('btn-toggle-venues').addEventListener('click', toggleVenuePanel);

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

  document.getElementById('btn-view-list').addEventListener('click', () => setView('list'));
  document.getElementById('btn-view-calendar').addEventListener('click', () => setView('calendar'));

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

    const oneMonthOut = new Date(today);
    oneMonthOut.setMonth(oneMonthOut.getMonth() + 1);

    const futureEvents = events
      .map(e => ({ ...e, _date: new Date(e.date) }))
      .filter(e => e._date >= today && e._date < oneMonthOut)
      .sort((a, b) => a._date - b._date);

    const dayMap = new Map();
    futureEvents.forEach(e => {
      const key = dateKey(e._date);
      if (!dayMap.has(key)) dayMap.set(key, { key, date: new Date(e._date), events: [] });
      dayMap.get(key).events.push(e);
    });

    const days = Array.from(dayMap.values());

    const venueMap = {};
    venues.forEach(v => { venueMap[v.slug] = v; });

    const todayKey = dateKey(today);
    Object.assign(STATE, { venueMap, dayMap, todayKey, windowStart: today, windowEnd: oneMonthOut });
    selectedDayKey = todayKey;

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
