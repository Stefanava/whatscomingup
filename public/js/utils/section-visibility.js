// Shows/hides a day-section's event grid and empty-state placeholder based
// on how many of its cards are currently visible under the active filter.
//
// The grid's `display:grid` is only ever set inline (there's no CSS class
// for it), so resetting it to '' to "show" the grid clears the inline
// `display` property entirely rather than reapplying `grid` — the element
// then falls back to its default block display, and block-level children
// (including the event image, which is width:100%) stretch to the full
// container width instead of respecting the grid's column tracks. Setting
// it back to the explicit string 'grid' avoids that.
function setSectionVisibility(section, visibleCount) {
  const grid = section.querySelector('.event-grid');
  const empty = section.querySelector('.empty-state');
  grid.style.display = visibleCount ? 'grid' : 'none';
  empty.style.display = visibleCount ? 'none' : '';
}

module.exports = { setSectionVisibility };
