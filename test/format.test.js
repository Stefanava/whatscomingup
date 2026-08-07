import { describe, expect, it } from 'vitest';
import { esc, safeUrl, dateKey, dayId, fmtToday } from '../public/js/utils/format.js';

describe('esc', () => {
  it('escapes HTML-significant characters', () => {
    expect(esc('<script>alert("hi")</script>')).toBe(
      '&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(esc('Rock & Roll')).toBe('Rock &amp; Roll');
  });

  it('treats null/undefined/empty as empty string', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
    expect(esc('')).toBe('');
  });
});

describe('safeUrl', () => {
  it('passes through http(s) URLs unchanged', () => {
    expect(safeUrl('https://example.com/event')).toBe('https://example.com/event');
    expect(safeUrl('http://example.com')).toBe('http://example.com');
  });

  it('blocks javascript: and other non-http(s) schemes', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('falls back to # for missing or unparsable URLs', () => {
    expect(safeUrl(null)).toBe('#');
    expect(safeUrl(undefined)).toBe('#');
    expect(safeUrl('not a url')).toBe('#');
  });
});

describe('dateKey', () => {
  it('formats a date as YYYY-MM-DD using local time', () => {
    expect(dateKey(new Date(2026, 7, 7))).toBe('2026-08-07');
  });

  it('zero-pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('dayId', () => {
  it('prefixes the date key with d-', () => {
    expect(dayId('2026-08-07')).toBe('d-2026-08-07');
  });
});

describe('fmtToday', () => {
  it('returns a non-empty weekday/day/month/year string', () => {
    expect(fmtToday()).toMatch(/^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} \d{4}$/);
  });
});
