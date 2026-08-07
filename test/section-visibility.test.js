// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { setSectionVisibility } from '../public/js/utils/section-visibility.js';

function makeSection() {
  document.body.innerHTML = `
    <section class="day-section">
      <div class="event-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,180px));gap:9px;">
        <article class="event-card"></article>
      </div>
      <div class="empty-state" style="display:none;"></div>
    </section>`;
  return document.querySelector('.day-section');
}

describe('setSectionVisibility', () => {
  it('keeps the grid laid out as a grid when cards are visible', () => {
    const section = makeSection();
    setSectionVisibility(section, 1);
    const grid = section.querySelector('.event-grid');
    // Regression guard: resetting `style.display` to '' (rather than the
    // explicit string 'grid') clears the only place `display:grid` was ever
    // set, and the element silently falls back to block layout — which is
    // what made images stretch to full page width when filtering.
    expect(grid.style.display).toBe('grid');
    expect(section.querySelector('.empty-state').style.display).toBe('none');
  });

  it('hides the grid and shows the empty state when nothing is visible', () => {
    const section = makeSection();
    setSectionVisibility(section, 0);
    expect(section.querySelector('.event-grid').style.display).toBe('none');
    expect(section.querySelector('.empty-state').style.display).toBe('');
  });

  it('is idempotent across repeated toggles', () => {
    const section = makeSection();
    setSectionVisibility(section, 2);
    setSectionVisibility(section, 0);
    setSectionVisibility(section, 1);
    expect(section.querySelector('.event-grid').style.display).toBe('grid');
  });
});
