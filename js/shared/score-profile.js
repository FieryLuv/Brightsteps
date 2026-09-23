/**
 * ECCD official-style score displays (Child's Record 1 & 2)
 *
 * Record 1: 6 score-sheet columns, 6 scaled-score charts, standard-score chart
 * Record 2: 3 score-sheet columns, 3 scaled-score charts, standard-score chart
 *
 * Layout is vertical so tables/charts stay large and readable.
 */

const ScoreProfile = {
  DOMAIN_ORDER: ['GM', 'FM', 'SH', 'RL', 'EL', 'COG', 'SE'],
  DOMAIN_NAMES: {
    GM: 'Gross Motor',
    FM: 'Fine Motor',
    SH: 'Self-Help',
    RL: 'Receptive Language',
    EL: 'Expressive Language',
    COG: 'Cognitive',
    SE: 'Social- Emotional'
  },
  DOMAIN_ABBR: {
    GM: 'GM', FM: 'FM', SH: 'SH', RL: 'RL', EL: 'EL', COG: 'COG', SE: 'SE'
  },

  periodsFor(recordType) {
    return recordType === 1
      ? ['1st', '2nd', '3rd', '4th', '5th', '6th']
      : ['1st', '2nd', '3rd'];
  },

  /** Map saved assessments by period label */
  _byPeriod(assessments) {
    const map = {};
    (assessments || []).forEach(a => {
      if (a && a.period) map[a.period] = a;
    });
    return map;
  },

  _domainData(assessment, code) {
    if (!assessment) return { raw: '', scaled: '' };
    const d = assessment.insight && assessment.insight.domains
      ? assessment.insight.domains.find(x => x.code === code)
      : null;
    if (d) {
      return {
        raw: d.raw != null ? d.raw : '',
        scaled: d.scaled != null ? d.scaled : ''
      };
    }
    const ds = assessment.domainScores && assessment.domainScores[code];
    return {
      raw: ds && ds.present != null ? ds.present : '',
      scaled: ''
    };
  },

  /**
   * Full official score sheet(s) — always shows all evaluation slots.
   * Cells are editable so the teacher can adjust and finalize scores.
   * Record 1: two tables (1–3 and 4–6). Record 2: one table (1–3).
   */
  scoreSheets(recordType, assessments, child, opts = {}) {
    const editable = opts.editable !== false;
    const childId = child && child.id != null ? child.id : '';
    const periods = this.periodsFor(recordType);
    const byP = this._byPeriod(assessments);
    const chunks = recordType === 1
      ? [periods.slice(0, 3), periods.slice(3, 6)]
      : [periods];

    const note = `
      <p class="ecc-summary-note">
        Transfer the raw score for each domain. Convert using the Scaled Score table for the child’s age.
        Add Scaled Scores for the Sum, then look up the Standard Score.
        <strong>Teachers may edit any cell</strong> to correct or finalize the assessment, then click
        <em>Save final assessment</em> for that evaluation.
      </p>`;

    const input = (val, attrs) => {
      if (!editable) {
        return `<span class="ecc-cell-static">${val !== '' && val != null ? val : ''}</span>`;
      }
      const v = val !== '' && val != null ? String(val).replace(/"/g, '&quot;') : '';
      return `<input type="text" class="ecc-cell-input" value="${v}" ${attrs} />`;
    };

    const tables = chunks.map((chunk) => {
      const headEvals = chunk.map(p => {
        const a = byP[p];
        const age = a && a.ageMonths != null
          ? a.ageMonths + ' mo'
          : (child && child.ageLabel ? child.ageLabel : '');
        const date = a && a.savedAt
          ? new Date(a.savedAt).toLocaleDateString()
          : '';
        const approved = a && a.finalized
          ? `<div class="ecc-final-badge">✓ Final</div>`
          : '';
        return `<th colspan="2" class="ecc-eval-head">${p} Evaluation
          <div class="ecc-eval-sub">Date: ${date || '________'}</div>
          <div class="ecc-eval-sub">Child’s Age: ${age || '________'}</div>
          ${approved}
        </th>`;
      }).join('');

      const subHeads = chunk.map(() =>
        `<th class="ecc-raw-head">Raw Score</th><th class="ecc-scaled-head">Scaled Score</th>`
      ).join('');

      const domainRows = this.DOMAIN_ORDER.map(code => {
        const cells = chunk.map(p => {
          const a = byP[p];
          let raw = '';
          let scaled = '';
          // Prefer teacher final overrides
          if (a && a.finalScores && a.finalScores.domains && a.finalScores.domains[code]) {
            raw = a.finalScores.domains[code].raw;
            scaled = a.finalScores.domains[code].scaled;
          } else {
            const d = this._domainData(a, code);
            raw = d.raw;
            scaled = d.scaled;
          }
          return `<td class="ecc-sum-num">${input(raw, `data-role="raw" data-period="${p}" data-domain="${code}" data-child="${childId}" inputmode="numeric"`)}</td>
            <td class="ecc-sum-num">${input(scaled, `data-role="scaled" data-period="${p}" data-domain="${code}" data-child="${childId}" inputmode="numeric" oninput="TeacherDevelopment.onScaledEdit(this)"`)}</td>`;
        }).join('');
        return `<tr>
          <td class="ecc-sum-domain">${this.DOMAIN_NAMES[code]}</td>
          ${cells}
        </tr>`;
      }).join('');

      const sumCells = chunk.map(p => {
        const a = byP[p];
        let sum = '';
        if (a && a.finalScores && a.finalScores.sumOfScaledScores != null) {
          sum = a.finalScores.sumOfScaledScores;
        } else if (a && a.insight && a.insight.sumOfScaledScores != null) {
          sum = a.insight.sumOfScaledScores;
        }
        return `<td class="ecc-sum-shaded"></td>
          <td class="ecc-sum-num">${input(sum, `data-role="sum" data-period="${p}" data-child="${childId}" id="ecc-sum-${childId}-${p}" inputmode="numeric"`)}</td>`;
      }).join('');

      const stdCells = chunk.map(p => {
        const a = byP[p];
        let std = '';
        if (a && a.finalScores && a.finalScores.standardScore != null) {
          std = a.finalScores.standardScore;
        } else if (a && a.insight && a.insight.standardScore != null) {
          std = a.insight.standardScore;
        }
        return `<td class="ecc-sum-shaded"></td>
          <td class="ecc-sum-num">${input(std, `data-role="standard" data-period="${p}" data-child="${childId}" id="ecc-std-${childId}-${p}" inputmode="numeric"`)}</td>`;
      }).join('');

      const interpCells = chunk.map(p => {
        const a = byP[p];
        let label = '';
        if (a && a.finalScores && a.finalScores.interpretation) {
          label = a.finalScores.interpretation;
        } else if (a && a.insight && a.insight.overallInterpretation) {
          label = a.insight.overallInterpretation.label;
        }
        if (!editable) {
          return `<td colspan="2" class="ecc-interp-cell">${label}</td>`;
        }
        const v = String(label || '').replace(/"/g, '&quot;');
        return `<td colspan="2" class="ecc-interp-cell">
          <input type="text" class="ecc-cell-input ecc-interp-input" value="${v}"
            data-role="interpretation" data-period="${p}" data-child="${childId}"
            placeholder="e.g. Average overall development" />
        </td>`;
      }).join('');

      const actionRow = editable
        ? `<tr class="ecc-action-row"><td></td>${chunk.map(p => `
            <td colspan="2" style="text-align:center;padding:0.5rem;">
              <button type="button" class="btn btn-blue ecc-finalize-btn"
                onclick="TeacherDevelopment.finalizePeriod(${childId}, '${p}')">
                💾 Save final · ${p}
              </button>
            </td>`).join('')}</tr>`
        : '';

      return `
        <div class="ecc-summary-wrap">
          <table class="ecc-summary-table ecc-sheet-large" data-record="${recordType}" data-child="${childId}">
            <thead>
              <tr>
                <th rowspan="2" class="ecc-domain-head">Domain</th>
                <th colspan="${chunk.length * 2}" class="ecc-age-banner">Age</th>
              </tr>
              <tr>${headEvals}</tr>
              <tr>
                <th class="ecc-domain-head" style="background:#1e3a8a;"></th>
                ${subHeads}
              </tr>
            </thead>
            <tbody>
              ${domainRows}
              <tr class="ecc-sum-row"><td>Sum of Scaled Scores</td>${sumCells}</tr>
              <tr class="ecc-std-row"><td>Standard Score</td>${stdCells}</tr>
              <tr class="ecc-interp-row"><td>Interpretation</td>${interpCells}</tr>
              ${actionRow}
            </tbody>
          </table>
        </div>`;
    }).join('');

    return `<div class="ecc-sheets-block">${note}${tables}</div>`;
  },

  /**
   * One scaled-score profile chart for a single evaluation (paper style).
   */
  scaledChartOne(assessment, opts = {}) {
    const period = opts.period || (assessment && assessment.period) || '—';
    const ageLabel = opts.childAge
      || (assessment && assessment.ageMonths != null ? assessment.ageMonths + ' months' : '');
    const byCode = {};
    // Prefer teacher-finalized scaled scores for the profile chart
    if (assessment && assessment.finalScores && assessment.finalScores.domains) {
      Object.keys(assessment.finalScores.domains).forEach(code => {
        const s = assessment.finalScores.domains[code].scaled;
        if (s !== '' && s != null && !isNaN(Number(s))) {
          byCode[code] = { code, scaled: Number(s) };
        }
      });
    } else if (assessment && assessment.insight && assessment.insight.domains) {
      assessment.insight.domains.forEach(d => { byCode[d.code] = d; });
    }

    const colW = 42;
    const rowH = 20;
    const leftW = 40;
    const topH = 70;
    const nDom = this.DOMAIN_ORDER.length;
    const width = leftW + nDom * colW + 10;
    const height = topH + 19 * rowH + 10;

    const headers = this.DOMAIN_ORDER.map((code, i) => {
      const x = leftW + i * colW + colW / 2;
      return `<text x="${x}" y="${topH - 10}" text-anchor="middle" class="ecc-chart-dom">${this.DOMAIN_ABBR[code]}</text>`;
    }).join('');

    let rows = '';
    let marks = '';
    for (let s = 19; s >= 1; s--) {
      const y = topH + (19 - s) * rowH;
      let zoneClass = 'ecc-zone-retest';
      if (s >= 14) zoneClass = 'ecc-zone-advanced';
      else if (s >= 7) zoneClass = 'ecc-zone-average';
      if (s === 10) zoneClass += ' ecc-zone-mid';

      rows += `<rect x="${leftW}" y="${y}" width="${nDom * colW}" height="${rowH}" class="${zoneClass}" />`;
      rows += `<text x="${leftW - 6}" y="${y + rowH / 2 + 4}" text-anchor="end" class="ecc-chart-score">${s}</text>`;

      this.DOMAIN_ORDER.forEach((code, i) => {
        const x = leftW + i * colW + colW / 2;
        const cy = y + rowH / 2;
        rows += `<circle cx="${x}" cy="${cy}" r="2.5" class="ecc-dot-empty" />`;
        const d = byCode[code];
        if (d && d.scaled === s) {
          marks += `<circle cx="${x}" cy="${cy}" r="6" class="ecc-dot-mark" />`;
          marks += `<text x="${x}" y="${cy + 4}" text-anchor="middle" class="ecc-dot-x">×</text>`;
        }
      });
    }

    const points = this.DOMAIN_ORDER.map((code, i) => {
      const d = byCode[code];
      if (!d || d.scaled == null) return null;
      const x = leftW + i * colW + colW / 2;
      const y = topH + (19 - d.scaled) * rowH + rowH / 2;
      return `${x},${y}`;
    }).filter(Boolean);

    const line = points.length >= 2
      ? `<polyline points="${points.join(' ')}" class="ecc-profile-line" fill="none" />`
      : '';

    return `
      <div class="ecc-scaled-chart-wrap ecc-scaled-one">
        <div class="ecc-scaled-one-head">
          <strong>${period} Evaluation</strong>
          <span>Child’s Age: ${ageLabel || '________'}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="ecc-scaled-svg ecc-scaled-svg-lg" role="img">
          <rect x="${leftW}" y="${topH}" width="${nDom * colW}" height="${19 * rowH}" class="ecc-chart-frame" />
          ${rows}
          ${line}
          ${marks}
          ${headers}
          <text x="${leftW + (nDom * colW) / 2}" y="16" text-anchor="middle" class="ecc-chart-head">DOMAIN</text>
          <text x="8" y="${topH + 2.5 * rowH}" class="ecc-zone-side" fill="#b45309">Advanced</text>
          <text x="8" y="${topH + 9 * rowH}" class="ecc-zone-side" fill="#1d4ed8">Average</text>
          <text x="8" y="${topH + 16.5 * rowH}" class="ecc-zone-side" fill="#b45309">Re-test</text>
        </svg>
      </div>`;
  },

  /**
   * All scaled-score charts for the record (6 or 3), stacked vertically.
   */
  scaledChartsAll(recordType, assessments, child) {
    const periods = this.periodsFor(recordType);
    const byP = this._byPeriod(assessments);
    const charts = periods.map(p => {
      const a = byP[p] || null;
      return this.scaledChartOne(a, {
        period: p,
        childAge: a && a.ageMonths != null
          ? a.ageMonths + ' months'
          : (child && child.ageLabel ? child.ageLabel : '')
      });
    }).join('');

    return `
      <div class="ecc-scaled-all">
        <h3 class="ecc-section-title">Scaled Scores</h3>
        <p class="ecc-summary-note">
          Mark an × on the dot corresponding to the Scaled Score for each domain and connect the ×’s.
          Write the child’s age on each evaluation.
        </p>
        <div class="ecc-chart-legend">
          <span><i class="ecc-leg-adv"></i> Suggests advanced development (14–19)</span>
          <span><i class="ecc-leg-avg"></i> Average development (7–13)</span>
          <span><i class="ecc-leg-ret"></i> Re-test after 3–6 months (1–6)</span>
        </div>
        <div class="ecc-scaled-stack">${charts}</div>
      </div>`;
  },

  /**
   * Standard Scores chart matching the paper form.
   * Record 1: age columns 0–4, 5–8, 9–12, 13–18, 19–24, 25–36 months
   * Record 2: 3 years & 1 month, 4 years, 5 years
   * Y-axis ~20–160 with zone bands.
   */
  standardChart(recordType, assessments, child) {
    const ageCols = recordType === 1
      ? [
          { id: 'r1a', label: '0–4 months', minM: 0, maxM: 4.99 },
          { id: 'r1b', label: '5–8 months', minM: 5, maxM: 8.99 },
          { id: 'r1c', label: '9–12 months', minM: 9, maxM: 12.99 },
          { id: 'r1d', label: '13–18 months', minM: 13, maxM: 18.99 },
          { id: 'r1e', label: '19–24 months', minM: 19, maxM: 24.99 },
          { id: 'r1f', label: '25–36 months', minM: 25, maxM: 36.99 }
        ]
      : [
          { id: 'r2a', label: '3 years & 1 month', minM: 37, maxM: 48.99 },
          { id: 'r2b', label: '4 years', minM: 49, maxM: 60.99 },
          { id: 'r2c', label: '5 years', minM: 61, maxM: 71.99 }
        ];

    const yMin = 20;
    const yMax = 160;
    const plotH = 360;
    const plotW = ageCols.length * 90;
    const left = 48;
    const top = 36;
    const width = left + plotW + 16;
    const height = top + plotH + 48;

    // Zone bands (from bottom of plot)
    // Advanced >= 120, Average 80-119, Re-test < 80
    const yFor = (score) => {
      const clamped = Math.max(yMin, Math.min(yMax, score));
      return top + plotH - ((clamped - yMin) / (yMax - yMin)) * plotH;
    };

    const zoneAdvH = ((yMax - 120) / (yMax - yMin)) * plotH;
    const zoneAvgH = ((120 - 80) / (yMax - yMin)) * plotH;
    const zoneRetH = ((80 - yMin) / (yMax - yMin)) * plotH;

    // Grid lines every 10
    let grid = '';
    for (let s = yMin; s <= yMax; s += 10) {
      const y = yFor(s);
      grid += `<line x1="${left}" y1="${y}" x2="${left + plotW}" y2="${y}" class="ecc-std-grid" />`;
      grid += `<text x="${left - 6}" y="${y + 3}" text-anchor="end" class="ecc-std-ylab">${s}</text>`;
    }

    // Column separators + headers
    let cols = '';
    ageCols.forEach((c, i) => {
      const x = left + i * 90;
      cols += `<rect x="${x}" y="${top}" width="90" height="${plotH}" class="ecc-std-col" />`;
      cols += `<text x="${x + 45}" y="${top - 10}" text-anchor="middle" class="ecc-std-colhead">${c.label}</text>`;
      // vertical mid line for "Date Tested" feel
      cols += `<line x1="${x + 45}" y1="${top}" x2="${x + 45}" y2="${top + plotH}" class="ecc-std-vline" />`;
    });

    // Marks from assessments
    let marks = '';
    const markPoints = [];
    (assessments || []).forEach(a => {
      const stdVal = (a.finalScores && a.finalScores.standardScore != null)
        ? Number(a.finalScores.standardScore)
        : (a.insight && a.insight.standardScore != null ? a.insight.standardScore : null);
      if (stdVal == null || isNaN(stdVal)) return;
      const ageM = a.ageMonths != null ? a.ageMonths : (child && child.ageMonths);
      if (ageM == null) return;
      const colIdx = ageCols.findIndex(c => ageM >= c.minM && ageM <= c.maxM);
      if (colIdx < 0) return;
      const std = stdVal;
      const x = left + colIdx * 90 + 45;
      const y = yFor(std);
      markPoints.push({ x, y, period: a.period, std });
      marks += `<circle cx="${x}" cy="${y}" r="7" class="ecc-std-mark" />`;
      marks += `<text x="${x}" y="${y + 4}" text-anchor="middle" class="ecc-std-mark-x">×</text>`;
      marks += `<text x="${x + 10}" y="${y - 8}" class="ecc-std-mark-label">${std}</text>`;
    });

    // Connect marks in period order if multiple
    let line = '';
    if (markPoints.length >= 2) {
      const pts = markPoints.map(p => `${p.x},${p.y}`).join(' ');
      line = `<polyline points="${pts}" class="ecc-profile-line" fill="none" />`;
    }

    // Date tested row labels
    const dateRow = ageCols.map((c, i) => {
      const a = (assessments || []).find(x => {
        const ageM = x.ageMonths != null ? x.ageMonths : (child && child.ageMonths);
        return ageM != null && ageM >= c.minM && ageM <= c.maxM && x.insight && x.insight.standardScore != null;
      });
      const date = a && a.savedAt ? new Date(a.savedAt).toLocaleDateString() : '';
      const x = left + i * 90 + 45;
      return `<text x="${x}" y="${top + plotH + 28}" text-anchor="middle" class="ecc-std-date">${date || 'Date: ____'}</text>`;
    }).join('');

    return `
      <div class="ecc-std-chart-wrap">
        <h3 class="ecc-section-title">Standard Scores</h3>
        <p class="ecc-summary-note">
          Mark an × on the corresponding Standard Score for each test administration and connect the ×’s.
          Write the date for each test administration.
        </p>
        <div class="ecc-chart-legend">
          <span><i class="ecc-leg-adv"></i> Suggests advanced development (≥120)</span>
          <span><i class="ecc-leg-avg"></i> Average development (80–119)</span>
          <span><i class="ecc-leg-ret"></i> Re-test after 3 to 6 months (≤79)</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="ecc-std-svg" role="img">
          <!-- zones -->
          <rect x="${left}" y="${top}" width="${plotW}" height="${zoneAdvH}" class="ecc-zone-advanced" />
          <rect x="${left}" y="${top + zoneAdvH}" width="${plotW}" height="${zoneAvgH}" class="ecc-zone-average" />
          <rect x="${left}" y="${top + zoneAdvH + zoneAvgH}" width="${plotW}" height="${zoneRetH}" class="ecc-zone-retest" />
          ${cols}
          ${grid}
          <rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" class="ecc-chart-frame" fill="none" />
          ${line}
          ${marks}
          ${dateRow}
          <text x="10" y="${top + zoneAdvH / 2}" class="ecc-zone-side" fill="#b45309">Advanced</text>
          <text x="10" y="${top + zoneAdvH + zoneAvgH / 2}" class="ecc-zone-side" fill="#1d4ed8">Average</text>
          <text x="10" y="${top + zoneAdvH + zoneAvgH + zoneRetH / 2}" class="ecc-zone-side" fill="#b45309">Re-test</text>
        </svg>
      </div>`;
  },

  /**
   * Complete official scoring display for a child (all sheets + charts).
   * Always shows full empty slots; fills in saved assessments.
   */
  fullRecordView(recordType, assessments, child, opts = {}) {
    return `
      <div class="ecc-full-record" data-child="${child && child.id != null ? child.id : ''}">
        <section class="ecc-block">
          <h3 class="ecc-section-title">Score Sheet — Child’s Record ${recordType}</h3>
          ${this.scoreSheets(recordType, assessments, child, { editable: opts.editable !== false })}
        </section>
        <section class="ecc-block">
          ${this.scaledChartsAll(recordType, assessments, child)}
        </section>
        <section class="ecc-block">
          ${this.standardChart(recordType, assessments, child)}
        </section>
      </div>`;
  },

  /** After-save panel: same full view so teacher sees the complete form */
  fullPanel(insight, opts = {}) {
    // Keep for backward compatibility — single-eval summary only
    // Prefer fullRecordView from callers when history is available
    const fake = insight
      ? [{
          period: opts.period || '1st',
          ageMonths: insight.ageMonths,
          insight,
          domainScores: null,
          savedAt: new Date().toISOString()
        }]
      : [];
    const recordType = insight && insight.recordKey === 'record2' ? 2 : 1;
    return this.fullRecordView(recordType, fake, {
      ageLabel: opts.childAge,
      ageMonths: insight && insight.ageMonths
    });
  },

  multiEvalTable(assessments) {
    if (!assessments || !assessments.length) {
      return `<p class="text-muted">No saved evaluations yet.</p>`;
    }
    const recordType = assessments[0].recordType || 1;
    return this.scoreSheets(recordType, assessments, null);
  }
};
