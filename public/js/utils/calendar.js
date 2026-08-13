const { dateKey } = require('./format');

// Synthesizes a continuous, Sunday-start 7-column grid spanning from the
// Sunday on/before `startDate` through the Saturday on/after the last
// in-range day. Every week row is fully populated (no blank leading/trailing
// cells needed), so cells outside [startDate, endExclusiveDate) are marked
// via `inRange` rather than omitted.
function buildCalendarWeeks(startDate, endExclusiveDate, dayMap) {
  const gridStart = new Date(startDate);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const lastDay = new Date(endExclusiveDate);
  lastDay.setDate(lastDay.getDate() - 1);

  const gridEnd = new Date(lastDay);
  gridEnd.setDate(gridEnd.getDate() + (6 - lastDay.getDay()));

  const cells = [];
  for (const d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const inRange = d >= startDate && d < endExclusiveDate;
    cells.push({ key, date: new Date(d), inRange, events: dayMap.get(key)?.events || [] });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function filterDayEvents(events, activeFilters) {
  return activeFilters.size === 0 ? events : events.filter((e) => activeFilters.has(e.venue));
}

function dayHasNight(events, venueMap) {
  return events.some((e) => venueMap[e.venue]?.venue_type === 'promoter');
}

module.exports = { buildCalendarWeeks, filterDayEvents, dayHasNight };
