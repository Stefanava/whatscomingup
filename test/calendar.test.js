import { describe, expect, it } from 'vitest';
import { buildCalendarWeeks, filterDayEvents, dayHasNight } from '../public/js/utils/calendar.js';

describe('buildCalendarWeeks', () => {
  it('always starts the grid on a Sunday and ends on a Saturday', () => {
    // Aug 12 2026 is a Wednesday, Sep 12 2026 is a Saturday — neither
    // boundary is itself a Sunday/Saturday, so this exercises the padding.
    const start = new Date(2026, 7, 12);
    const end = new Date(2026, 8, 12);
    const weeks = buildCalendarWeeks(start, end, new Map());

    const firstCell = weeks[0][0];
    const lastWeek = weeks[weeks.length - 1];
    const lastCell = lastWeek[lastWeek.length - 1];
    expect(firstCell.date.getDay()).toBe(0);
    expect(lastCell.date.getDay()).toBe(6);
  });

  it('gives every week exactly 7 cells', () => {
    const start = new Date(2026, 7, 12);
    const end = new Date(2026, 8, 12);
    const weeks = buildCalendarWeeks(start, end, new Map());
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('marks inRange true only for [startDate, endExclusiveDate)', () => {
    const start = new Date(2026, 7, 12);
    const end = new Date(2026, 8, 12);
    const weeks = buildCalendarWeeks(start, end, new Map());
    const cells = weeks.flat();

    const dayBeforeStart = cells.find((c) => c.date.getTime() === new Date(2026, 7, 11).getTime());
    const startCell = cells.find((c) => c.date.getTime() === start.getTime());
    const dayBeforeEnd = cells.find((c) => c.date.getTime() === new Date(2026, 8, 11).getTime());
    const endCell = cells.find((c) => c.date.getTime() === end.getTime());

    expect(dayBeforeStart.inRange).toBe(false);
    expect(startCell.inRange).toBe(true);
    expect(dayBeforeEnd.inRange).toBe(true);
    expect(endCell.inRange).toBe(false);
  });

  it('picks up events from dayMap by dateKey, defaulting to an empty array', () => {
    const start = new Date(2026, 7, 12);
    const end = new Date(2026, 8, 12);
    const dayMap = new Map([
      ['2026-08-15', { key: '2026-08-15', date: new Date(2026, 7, 15), events: [{ title: 'Test Night' }] }],
    ]);
    const weeks = buildCalendarWeeks(start, end, dayMap);
    const cells = weeks.flat();

    const populated = cells.find((c) => c.key === '2026-08-15');
    const empty = cells.find((c) => c.key === '2026-08-16');
    expect(populated.events).toEqual([{ title: 'Test Night' }]);
    expect(empty.events).toEqual([]);
  });
});

describe('filterDayEvents', () => {
  const events = [
    { venue: 'fold', title: 'A' },
    { venue: 'coven', title: 'B' },
  ];

  it('returns all events when activeFilters is empty', () => {
    expect(filterDayEvents(events, new Set())).toEqual(events);
  });

  it('filters to only events whose venue is in activeFilters', () => {
    const result = filterDayEvents(events, new Set(['fold']));
    expect(result).toEqual([{ venue: 'fold', title: 'A' }]);
  });

  it('returns an empty array for an empty input array', () => {
    expect(filterDayEvents([], new Set(['fold']))).toEqual([]);
  });
});

describe('dayHasNight', () => {
  const venueMap = {
    fold: { slug: 'fold', venue_type: 'promoter' },
    coven: { slug: 'coven', venue_type: 'venue' },
  };

  it('is true when any event belongs to a promoter venue', () => {
    expect(dayHasNight([{ venue: 'coven' }, { venue: 'fold' }], venueMap)).toBe(true);
  });

  it('is false when every event belongs to a fixed venue', () => {
    expect(dayHasNight([{ venue: 'coven' }], venueMap)).toBe(false);
  });

  it('is false for an empty events array', () => {
    expect(dayHasNight([], venueMap)).toBe(false);
  });

  it('is false when the event references a venue slug missing from venueMap', () => {
    expect(dayHasNight([{ venue: 'unknown-slug' }], venueMap)).toBe(false);
  });
});
