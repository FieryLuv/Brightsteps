/**
 * Shared UI helpers used across Teacher and Parent modules.
 */

const UI = {
  /** ECCD domain display order + colors for donut snapshots */
  DOMAIN_SNAP: [
    { code: 'GM', name: 'Gross Motor', color: '#43a047' },
    { code: 'FM', name: 'Fine Motor', color: '#1e88e5' },
    { code: 'SH', name: 'Self-Help', color: '#fb8c00' },
    { code: 'RL', name: 'Receptive Language', color: '#8e24aa' },
    { code: 'EL', name: 'Expressive Language', color: '#00acc1' },
    { code: 'COG', name: 'Cognitive', color: '#f4511e' },
    { code: 'SE', name: 'Social-Emotional', color: '#7cb342' }
  ],

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
  },

  /**
   * Donut with center percentage (conic-gradient).
   * @param {number|null} percent 0–100 or null for empty
   * @param {string} color CSS color
   * @param {string} label Domain name under the ring
   */
  domainDonut(percent, color, label) {
    const has = percent != null && !isNaN(Number(percent));
    const p = has ? Math.max(0, Math.min(100, Math.round(Number(percent)))) : 0;
    const display = has ? p + '%' : '—';
    const c = color || '#1e88e5';
    return (
      '<div class="domain-donut-wrap">' +
        '<div class="domain-donut' + (has ? '' : ' is-empty') + '" style="--p:' + p + ';--c:' + c + ';">' +
          '<span class="domain-donut-value">' + display + '</span>' +
        '</div>' +
        '<div class="domain-donut-label">' + (label || '') + '</div>' +
      '</div>'
    );
  },

  /** Grid of domain donuts from [{code,name,percent,color}, ...] */
  domainDonutGrid(domains) {
    const list = domains && domains.length ? domains : this.DOMAIN_SNAP.map(d => ({
      code: d.code, name: d.name, percent: null, color: d.color
    }));
    return (
      '<div class="domain-donut-grid">' +
      list.map(d => this.domainDonut(d.percent, d.color || '#1e88e5', d.name)).join('') +
      '</div>'
    );
  },

  /**
   * Domain % from a single assessment (latest preferred).
   * Uses domainScores.percent, else present/total, else insight.domains.
   */
  domainPercentsFromAssessment(assessment) {
    const out = {};
    if (!assessment) return out;

    const ds = assessment.domainScores || {};
    Object.keys(ds).forEach(code => {
      const d = ds[code];
      if (!d) return;
      if (d.percent != null && !isNaN(Number(d.percent))) {
        out[code] = Math.round(Number(d.percent));
      } else if (d.total > 0 && d.present != null) {
        out[code] = Math.round((Number(d.present) / Number(d.total)) * 100);
      }
    });

    const insightDomains = assessment.insight && assessment.insight.domains;
    if (Array.isArray(insightDomains)) {
      insightDomains.forEach(d => {
        if (out[d.code] != null) return;
        if (d.percent != null) out[d.code] = Math.round(Number(d.percent));
        else if (d.total > 0 && d.raw != null) {
          out[d.code] = Math.round((Number(d.raw) / Number(d.total)) * 100);
        }
      });
    }

    // Teacher-finalized scaled scores: map roughly if no percent (optional display aid)
    const finalDomains = assessment.finalScores && assessment.finalScores.domains;
    if (finalDomains) {
      Object.keys(finalDomains).forEach(code => {
        if (out[code] != null) return;
        // scaled is 1–19 band; not a percent — skip rather than mislead
      });
    }

    return out;
  },

  /** Latest assessment for child (by period order). */
  latestAssessmentForChild(childId) {
    if (typeof AssessmentStore === 'undefined') return null;
    const list = AssessmentStore.listForChild(childId);
    if (!list || !list.length) return null;
    const order = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
    return list.slice().sort((a, b) => (order[a.period] || 99) - (order[b.period] || 99)).pop();
  },

  /**
   * Snapshot rows for one child (7 domains).
   * @returns {{ code, name, percent, color, period }[]}
   */
  childDomainSnapshot(childId) {
    const assessment = this.latestAssessmentForChild(childId);
    const percents = this.domainPercentsFromAssessment(assessment);
    return this.DOMAIN_SNAP.map(d => ({
      code: d.code,
      name: d.name,
      color: d.color,
      percent: percents[d.code] != null ? percents[d.code] : null,
      period: assessment ? assessment.period : null
    }));
  },

  /**
   * Class average snapshot for a list of children (latest assessment each).
   */
  classDomainSnapshot(children) {
    const sums = {};
    const counts = {};
    let withData = 0;
    let periods = new Set();

    (children || []).forEach(c => {
      const assessment = this.latestAssessmentForChild(c.id);
      if (!assessment) return;
      withData++;
      if (assessment.period) periods.add(assessment.period);
      const percents = this.domainPercentsFromAssessment(assessment);
      this.DOMAIN_SNAP.forEach(d => {
        if (percents[d.code] == null) return;
        sums[d.code] = (sums[d.code] || 0) + percents[d.code];
        counts[d.code] = (counts[d.code] || 0) + 1;
      });
    });

    const domains = this.DOMAIN_SNAP.map(d => ({
      code: d.code,
      name: d.name,
      color: d.color,
      percent: counts[d.code]
        ? Math.round(sums[d.code] / counts[d.code])
        : null
    }));

    return {
      domains,
      childrenWithData: withData,
      childrenTotal: (children || []).length,
      periods: Array.from(periods)
    };
  }
};
