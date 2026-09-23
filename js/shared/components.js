/**
 * Shared UI helpers used across Teacher and Parent modules.
 */

const UI = {
  /** Simple progress bar — green only for positive status */
  progressBar(percent, color = 'var(--success)') {
    const p = Math.max(0, Math.min(100, percent));
    return `
      <div class="progress-track">
        <div class="progress-fill" style="width:${p}%; background:${color};"></div>
      </div>
    `;
  },

  /** Stat number used on dashboard cards */
  bigStat(value, color = 'var(--success)') {
    return `<div style="font-size:2.6rem; font-weight:700; color:${color}; margin:0.4rem 0;">${value}</div>`;
  },

  /** Empty state */
  empty(message = 'No data yet') {
    return `<div class="card" style="text-align:center; padding:2.5rem; color:var(--muted);">${message}</div>`;
  },

  /** Page header */
  pageHeader(title, subtitle = '') {
    return `
      <div class="mb-3">
        <h1>${title}</h1>
        ${subtitle ? `<p class="text-muted">${subtitle}</p>` : ''}
      </div>
    `;
  }
};
