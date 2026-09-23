/**
 * Development Tracking
 * - Section selector + children list
 * - Digital ECCD checklist encoding (from catalog)
 * - Domain score summary (feeds rule-based engine later)
 */

const TeacherDevelopment = {
  selectedSection: 'sunshine',
  catalog: null,
  _responses: {}, // key: `${childId}:${item_id}` -> true/false

  async render(container) {
    this.container = container;
    await this._ensureCatalog();
    this._draw();
  },

  async _ensureCatalog() {
    if (this.catalog) return;
    try {
      const res = await fetch('js/data/eccd_checklist_catalog.json');
      this.catalog = await res.json();
    } catch (e) {
      console.warn('Could not load ECCD catalog', e);
      this.catalog = null;
    }
  },

  _draw() {
    const sections = [
      { key: 'explorers', label: 'Little Explorers (0–3 yrs)' },
      { key: 'stars', label: 'Little Stars (3–4 yrs)' },
      { key: 'sunshine', label: 'Sunshine Group (4–5 yrs)' }
    ];

    const children = SampleChildren.filter(c => c.sectionKey === this.selectedSection);

    this.container.innerHTML = `
      ${UI.pageHeader('📈 Development Tracking', 'Select a class, open a child, and encode the ECCD developmental checklist.')}

      <div class="card">
        <h3>Select Class / Section</h3>
        <div class="flex flex-wrap gap-1 mt-2">
          ${sections.map(s => `
            <button
              class="btn ${this.selectedSection === s.key ? 'btn-blue' : ''}"
              style="${this.selectedSection !== s.key ? 'background:#e8e8e8;color:var(--text);' : ''}"
              onclick="TeacherDevelopment.setSection('${s.key}')"
            >${s.label}</button>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <h3>Children in this section (${children.length})</h3>
        ${children.length === 0
          ? `<p class="text-muted">No children in this section.</p>`
          : `<div class="children-grid" style="margin-top:1rem;">
              ${children.map(c => this._childCard(c)).join('')}
            </div>`
        }
      </div>

      <div class="card">
        <h3>Overall Class Snapshot</h3>
        <p class="text-muted" style="margin-bottom:1rem;">Sample domain averages for the selected section (demo). Real averages will come from saved assessments.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;">
          ${this._snapshotPills(children)}
        </div>
      </div>
    `;
  },

  setSection(key) {
    this.selectedSection = key;
    this._draw();
  },

  _childCard(c) {
    const isSupport = c.status === 'needs_support';
    const color = isSupport ? 'var(--orange)' : 'var(--success)';
    const label = isSupport ? `${c.focusArea}: Needs Support` : 'On Track';
    const history = (typeof AssessmentStore !== 'undefined')
      ? AssessmentStore.listForChild(c.id)
      : [];
    const histNote = history.length
      ? `<div style="font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem;">
           ${history.length} saved assessment${history.length > 1 ? 's' : ''}
           (${history.map(h => h.period).join(', ')})
         </div>`
      : `<div style="font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem;">No saved assessments yet</div>`;
    const trendBtn = history.length
      ? `<button class="btn" style="width:100%;margin-top:0.4rem;background:#e8e8e8;color:var(--text);"
           onclick="TeacherDevelopment.showTrends(${c.id})">📈 View Trends</button>`
      : '';
    return `
      <div class="card child-card" style="margin-bottom:0;">
        <div class="flex justify-between items-center" style="margin-bottom:0.35rem;">
          <strong>${c.name}</strong>
          <span style="font-size:0.85rem;color:var(--muted);">${c.ageLabel}</span>
        </div>
        <div style="color:${color};font-weight:600;font-size:0.9rem;margin-bottom:0.35rem;">${label}</div>
        ${histNote}
        <button class="btn btn-blue" style="width:100%;" onclick="TeacherDevelopment.openAssessment(${c.id})">
          Encode ECCD Checklist
        </button>
        ${trendBtn}
      </div>
    `;
  },

  showTrends(childId) {
    const child = SampleChildren.find(c => c.id === childId);
    if (!child || typeof AssessmentStore === 'undefined') return;
    const history = AssessmentStore.listForChild(childId);
    const trends = (typeof ProgressEngine !== 'undefined')
      ? ProgressEngine.compareTrends(history)
      : { status: 'empty', summary: 'Engine not loaded.' };

    const fullView = (typeof ScoreProfile !== 'undefined')
      ? ScoreProfile.fullRecordView(child.recordType || 1, history, child)
      : '';

    const domainRows = Object.values(trends.domains || {}).map(d => {
      const icon = d.trend === 'improving' ? '↑' : d.trend === 'declining' ? '↓' : '→';
      const col = d.trend === 'improving' ? 'var(--success)' : d.trend === 'declining' ? '#d32f2f' : 'var(--muted)';
      const series = (d.series || []).map(s =>
        s.scaled != null ? `SS${s.scaled}` : (s.percent != null ? `${s.percent}%` : '—')
      ).join(' → ');
      return `<tr>
        <td>${d.name}</td>
        <td style="font-size:0.85rem;">${series}</td>
        <td style="color:${col};font-weight:600;">${icon} ${d.trend}</td>
      </tr>`;
    }).join('');

    const html = `
      <div id="dev-result-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">ECCD Scores & Trends — ${child.name}</h2>
            <button onclick="TeacherDevelopment.closeResult()" class="bs-modal-close">×</button>
          </div>
          <div class="bs-modal-body">
            <p style="margin-bottom:1rem;">${trends.summary || 'No saved assessments yet. Encode and save evaluations to fill the forms.'}</p>
            ${fullView}
            <div class="card" style="margin-top:1.25rem;margin-bottom:0;">
              <h3>Domain trends (latest vs previous)</h3>
              <div class="eccd-table-wrap">
                <table class="eccd-table">
                  <thead><tr><th>Domain</th><th>Series</th><th>Trend</th></tr></thead>
                  <tbody>${domainRows || '<tr><td colspan="3">Need 2+ assessments</td></tr>'}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="TeacherDevelopment.closeResult()">Close</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _snapshotPills(children) {
    const domains = [
      { name: 'Gross Motor', pct: 90, color: 'var(--success)' },
      { name: 'Fine Motor', pct: 82, color: 'var(--primary)' },
      { name: 'Self-Help', pct: 85, color: 'var(--orange)' },
      { name: 'Language', pct: 88, color: 'var(--purple)' },
      { name: 'Cognitive', pct: 91, color: 'var(--cyan)' },
      { name: 'Social-Emotional', pct: 93, color: 'var(--lime)' }
    ];
    return domains.map(d => `
      <div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:10px;">
        <div style="font-size:1.35rem;font-weight:700;color:${d.color};">${d.pct}%</div>
        <div style="font-size:0.8rem;color:var(--muted);">${d.name}</div>
      </div>
    `).join('');
  },

  /* ---------- Assessment modal ---------- */

  async openAssessment(childId) {
    await this._ensureCatalog();
    const child = SampleChildren.find(c => c.id === childId);
    if (!child) return;

    if (!this.catalog) {
      alert('ECCD catalog could not be loaded. Make sure you open the app via a local server (not file://).');
      return;
    }

    this.closeAssessment();
    this._assessChild = child;

    const recordKey = child.recordType === 1 ? 'record1' : 'record2';
    const record = this.catalog.records[recordKey];
    // Record 1: up to 6 periods; Record 2: up to 3 evaluations (matches paper forms)
    this._periods = child.recordType === 1
      ? ['1st', '2nd', '3rd', '4th', '5th', '6th']
      : ['1st', '2nd', '3rd'];
    this._scorePeriod = this._periods[0];

    const jumpLinks = this.catalog.domains.map(d =>
      `<a href="#domain-${d.code}" class="eccd-jump">${d.name}</a>`
    ).join('');

    const allDomainsHtml = this.catalog.domains.map(d =>
      this._domainBlock(record, d, child)
    ).join('');

    const periodOptions = this._periods.map(p =>
      `<option value="${p}">${p} evaluation</option>`
    ).join('');

    const html = `
      <div id="dev-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:1200px;">
          <div class="bs-modal-header">
            <div>
              <h2 style="margin:0;font-size:1.3rem;color:white;">ECCD Checklist — ${child.name}</h2>
              <div style="opacity:0.9;font-size:0.88rem;margin-top:2px;">
                ${child.ageLabel} • ${child.section} • ${record.label}
              </div>
            </div>
            <button onclick="TeacherDevelopment.closeAssessment()" class="bs-modal-close">×</button>
          </div>

          <div class="eccd-toolbar">
            <div class="eccd-jump-nav">${jumpLinks}</div>
            <div class="eccd-score-period">
              <label for="eccd-score-period">Score using:</label>
              <select id="eccd-score-period" onchange="TeacherDevelopment._scorePeriod=this.value">
                ${periodOptions}
              </select>
            </div>
          </div>

          <div id="dev-modal-body" class="bs-modal-body eccd-form-scroll">
            <p class="eccd-form-note">
              Mark a period column when the skill is <strong>Present</strong>.
              Use Comments for observations. Domains are listed top-to-bottom as in the paper checklist.
            </p>
            ${allDomainsHtml}
          </div>

          <div class="bs-modal-footer">
            <button class="btn" onclick="TeacherDevelopment.closeAssessment()">Cancel</button>
            <button class="btn btn-blue" onclick="TeacherDevelopment.saveAssessment()">💾 Save Assessment</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this._bindAssessmentDismiss();
  },

  /** One domain section: header + table matching paper layout */
  _domainBlock(record, domainMeta, child) {
    const items = record.domains[domainMeta.code] || [];
    const periodHeaders = this._periods.map(p =>
      `<th class="eccd-period-col">${p}</th>`
    ).join('');

    if (!items.length) {
      return `
        <section class="eccd-domain-block" id="domain-${domainMeta.code}">
          <h3 class="eccd-domain-title">${domainMeta.name} Domain</h3>
          <p class="text-muted">No items in catalog for this domain.</p>
        </section>`;
    }

    const rows = items.map(it => {
      const checks = this._periods.map(p => {
        const key = `${child.id}:${it.item_id}:${p}`;
        const checked = this._responses[key] ? 'checked' : '';
        return `
          <td class="eccd-period-col">
            <input type="checkbox" data-key="${key}" ${checked}
              onchange="TeacherDevelopment.toggleItem(this)"
              title="${p} — Present" />
          </td>`;
      }).join('');

      const commentKey = `${child.id}:${it.item_id}:comment`;
      const commentVal = this._responses[commentKey] || '';
      const proc = (it.procedure || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `
        <tr>
          <td class="eccd-num">${it.number}</td>
          <td class="eccd-item-cell">
            <div class="eccd-item-title">${it.title}</div>
            ${proc ? `<div class="eccd-item-proc"><span class="eccd-proc-label">Material / Procedure:</span> ${proc}</div>` : ''}
          </td>
          ${checks}
          <td class="eccd-comment-cell">
            <input type="text" class="eccd-comment-input"
              data-key="${commentKey}"
              value="${String(commentVal).replace(/"/g, '&quot;')}"
              placeholder="Comments..."
              onchange="TeacherDevelopment.saveComment(this)"
              oninput="TeacherDevelopment.saveComment(this)" />
          </td>
        </tr>`;
    }).join('');

    return `
      <section class="eccd-domain-block" id="domain-${domainMeta.code}">
        <h3 class="eccd-domain-title">${domainMeta.name} Domain</h3>
        <div class="eccd-table-wrap">
          <table class="eccd-table eccd-table-form">
            <thead>
              <tr>
                <th class="eccd-num">#</th>
                <th>Item / observation</th>
                <th colspan="${this._periods.length}" class="eccd-present-group">Present</th>
                <th>Comments</th>
              </tr>
              <tr class="eccd-subhead">
                <th></th>
                <th></th>
                ${periodHeaders}
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  },

  toggleItem(checkbox) {
    const key = checkbox.getAttribute('data-key');
    this._responses[key] = checkbox.checked;
  },

  saveComment(input) {
    const key = input.getAttribute('data-key');
    this._responses[key] = input.value;
  },

  async saveAssessment() {
    const child = this._assessChild;
    if (!child || !this.catalog) return;

    const recordKey = child.recordType === 1 ? 'record1' : 'record2';
    const record = this.catalog.records[recordKey];
    const period = this._scorePeriod || this._periods[0];
    const domainScores = {};

    this.catalog.domains.forEach(d => {
      const items = record.domains[d.code] || [];
      let present = 0;
      items.forEach(it => {
        const key = `${child.id}:${it.item_id}:${period}`;
        if (this._responses[key]) present++;
      });
      const total = items.length || 1;
      const pct = Math.round((present / total) * 100);
      domainScores[d.code] = {
        name: d.name,
        present,
        total: items.length,
        percent: pct,
        period
      };
    });

    let insight = null;
    if (typeof ProgressEngine !== 'undefined' && ProgressEngine.analyze) {
      insight = await ProgressEngine.analyze({
        childId: child.id,
        recordType: child.recordType,
        ageMonths: child.ageMonths,
        period,
        domainScores
      });
    }

    // Persist to localStorage
    let saved = null;
    if (typeof AssessmentStore !== 'undefined') {
      saved = AssessmentStore.save({
        childId: child.id,
        childName: child.name,
        recordType: child.recordType,
        ageMonths: child.ageMonths,
        period,
        domainScores,
        insight,
        responses: null // full checklist responses stay in-session for now
      });
    }

    // Trends across periods for this child
    let trends = null;
    if (typeof AssessmentStore !== 'undefined' && typeof ProgressEngine !== 'undefined') {
      const history = AssessmentStore.listForChild(child.id);
      trends = ProgressEngine.compareTrends(history);
    }

    this.closeAssessment();

    const bandNote = insight && insight.ageBand
      ? `Age band: <strong>${insight.ageBand.label}</strong>.`
      : 'Age band could not be resolved.';
    const tableNote = insight && !insight.tablesComplete
      ? `<p class="text-muted" style="margin-top:0.75rem;font-size:0.85rem;">Some official tables are incomplete for this age — scaled/standard scores appear when mappings exist.</p>`
      : '';
    const strengths = insight && insight.strengths && insight.strengths.length
      ? `<p style="margin-top:0.75rem;"><strong>Strengths:</strong> ${insight.strengths.join('; ')}</p>` : '';
    const needs = insight && insight.needs && insight.needs.length
      ? `<p><strong>Needs monitoring:</strong> ${insight.needs.join('; ')}</p>` : '';
    const draft = insight && insight.parentFriendlyDraft
      ? `<div class="card" style="margin-top:1rem;background:var(--primary-light);"><strong>Parent-friendly draft</strong><p style="margin:0.5rem 0 0;font-size:0.9rem;">${insight.parentFriendlyDraft}</p></div>`
      : '';

    const persistNote = saved
      ? `<p class="text-muted" style="font-size:0.85rem;margin-bottom:0.75rem;">✓ Saved to this browser (period <strong>${period}</strong>). Re-save the same period to update.</p>`
      : '';

    // Full official forms: all score sheets + scaled charts + standard chart
    const history = typeof AssessmentStore !== 'undefined'
      ? AssessmentStore.listForChild(child.id)
      : [];
    const profilePanel = (typeof ScoreProfile !== 'undefined')
      ? ScoreProfile.fullRecordView(child.recordType || 1, history, child)
      : '';

    let trendNote = '';
    if (trends && trends.status === 'ok') {
      const trendColor = trends.overallTrend === 'improving' ? 'var(--success)'
        : trends.overallTrend === 'declining' ? '#d32f2f' : 'var(--muted)';
      trendNote = `
        <div class="card" style="margin-bottom:1rem;">
          <p style="margin:0;font-size:0.95rem;">${trends.summary}</p>
          ${trends.overallTrend
            ? `<p style="margin:0.35rem 0 0;font-size:0.88rem;color:${trendColor};">Overall standard score trend: <strong>${trends.overallTrend}</strong></p>`
            : ''}
        </div>`;
    }

    const resultHtml = `
      <div id="dev-result-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">ECCD Scoring — ${child.name}</h2>
            <button onclick="TeacherDevelopment.closeResult()" class="bs-modal-close">×</button>
          </div>
          <div class="bs-modal-body">
            ${persistNote}
            <p class="text-muted" style="margin-bottom:1rem;">
              Period <strong>${period}</strong>. ${bandNote}
              Empty columns fill in as you save each evaluation.
            </p>
            ${trendNote}
            ${profilePanel}
            ${tableNote}
            ${strengths}
            ${needs}
            ${draft}
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="TeacherDevelopment.closeResult()">Done</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', resultHtml);
  },

  /**
   * When teacher edits a scaled score, recompute Sum of Scaled for that period.
   */
  onScaledEdit(input) {
    const period = input.getAttribute('data-period');
    const childId = input.getAttribute('data-child');
    if (!period) return;
    const root = input.closest('.ecc-full-record') || document;
    const scaledInputs = root.querySelectorAll(
      `input[data-role="scaled"][data-period="${period}"][data-child="${childId}"]`
    );
    let sum = 0;
    let count = 0;
    scaledInputs.forEach(el => {
      const n = parseFloat(el.value);
      if (!isNaN(n)) {
        sum += n;
        count++;
      }
    });
    const sumEl = document.getElementById(`ecc-sum-${childId}-${period}`);
    if (sumEl && count > 0) sumEl.value = sum;
  },

  /**
   * Teacher finalizes one evaluation period from the editable score sheet.
   * Reads all inputs for that period and persists as finalScores.
   */
  async finalizePeriod(childId, period) {
    const child = SampleChildren.find(c => c.id === childId);
    if (!child) return;

    const root = document.querySelector(`.ecc-full-record[data-child="${childId}"]`) || document;
    const domains = {};
    (ScoreProfile.DOMAIN_ORDER || ['GM', 'FM', 'SH', 'RL', 'EL', 'COG', 'SE']).forEach(code => {
      const rawEl = root.querySelector(
        `input[data-role="raw"][data-period="${period}"][data-domain="${code}"][data-child="${childId}"]`
      );
      const scEl = root.querySelector(
        `input[data-role="scaled"][data-period="${period}"][data-domain="${code}"][data-child="${childId}"]`
      );
      const rawVal = rawEl && rawEl.value.trim() !== '' ? Number(rawEl.value) : null;
      const scVal = scEl && scEl.value.trim() !== '' ? Number(scEl.value) : null;
      domains[code] = {
        raw: rawVal != null && !isNaN(rawVal) ? rawVal : (rawEl ? rawEl.value : ''),
        scaled: scVal != null && !isNaN(scVal) ? scVal : (scEl ? scEl.value : '')
      };
    });

    const sumEl = document.getElementById(`ecc-sum-${childId}-${period}`);
    const stdEl = document.getElementById(`ecc-std-${childId}-${period}`);
    const interpEl = root.querySelector(
      `input[data-role="interpretation"][data-period="${period}"][data-child="${childId}"]`
    );

    let sumVal = sumEl && sumEl.value.trim() !== '' ? Number(sumEl.value) : null;
    if (sumVal == null || isNaN(sumVal)) {
      // recompute from scaled
      sumVal = 0;
      let n = 0;
      Object.values(domains).forEach(d => {
        if (typeof d.scaled === 'number' && !isNaN(d.scaled)) {
          sumVal += d.scaled;
          n++;
        }
      });
      if (!n) sumVal = null;
    }

    let stdVal = stdEl && stdEl.value.trim() !== '' ? Number(stdEl.value) : null;
    if ((stdVal == null || isNaN(stdVal)) && sumVal != null && typeof ProgressEngine !== 'undefined') {
      await ProgressEngine.loadTables();
      const recordKey = child.recordType === 2 ? 'record2' : 'record1';
      stdVal = ProgressEngine.lookupStandardScore(recordKey, sumVal);
      if (stdEl && stdVal != null) stdEl.value = stdVal;
    }

    const interpretation = interpEl ? interpEl.value.trim() : '';

    // Build insight-shaped object so charts/trends keep working
    const domainList = Object.keys(domains).map(code => ({
      code,
      name: (ScoreProfile.DOMAIN_NAMES && ScoreProfile.DOMAIN_NAMES[code]) || code,
      raw: typeof domains[code].raw === 'number' ? domains[code].raw : null,
      scaled: typeof domains[code].scaled === 'number' ? domains[code].scaled : null,
      total: null,
      percent: null,
      interpretation: null
    }));

    let overallInterpretation = null;
    if (stdVal != null && typeof ProgressEngine !== 'undefined') {
      const band = ProgressEngine.interpretStandard(stdVal);
      if (band) {
        overallInterpretation = {
          code: band.code,
          label: interpretation || band.label,
          description: band.description,
          level: band.level
        };
      }
    }
    if (!overallInterpretation && interpretation) {
      overallInterpretation = {
        code: 'TEACHER',
        label: interpretation,
        description: interpretation,
        level: 'unknown'
      };
    }

    const existing = typeof AssessmentStore !== 'undefined'
      ? AssessmentStore.get(childId, period)
      : null;

    const finalScores = {
      domains,
      sumOfScaledScores: sumVal,
      standardScore: stdVal,
      interpretation: interpretation || (overallInterpretation && overallInterpretation.label) || ''
    };

    const insight = {
      ...(existing && existing.insight ? existing.insight : {}),
      domains: domainList,
      sumOfScaledScores: sumVal,
      standardScore: stdVal,
      overallInterpretation,
      status: 'ok',
      teacherFinalized: true
    };

    if (typeof AssessmentStore !== 'undefined') {
      AssessmentStore.save({
        childId,
        childName: child.name,
        recordType: child.recordType,
        ageMonths: child.ageMonths,
        period,
        domainScores: existing && existing.domainScores ? existing.domainScores : {},
        insight,
        finalScores,
        finalized: true,
        finalizedAt: new Date().toISOString()
      });
    }

    // Refresh the result/trends panel so charts pick up final scores
    this.closeResult();
    this.showTrends(childId);

    // Brief confirmation
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = `Final assessment saved for ${period} evaluation.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  },

  closeAssessment() {
    this._unbindAssessmentDismiss();
    const el = document.getElementById('dev-modal-overlay');
    if (el) el.remove();
    this._assessChild = null;
  },

  closeResult() {
    const el = document.getElementById('dev-result-overlay');
    if (el) el.remove();
  },

  _bindAssessmentDismiss() {
    this._onKeyDown = (e) => {
      if (e.key === 'Escape') this.closeAssessment();
    };
    document.addEventListener('keydown', this._onKeyDown);
    const overlay = document.getElementById('dev-modal-overlay');
    if (overlay) {
      this._onOverlayClick = (e) => {
        if (e.target === overlay) this.closeAssessment();
      };
      overlay.addEventListener('click', this._onOverlayClick);
    }
  },

  _unbindAssessmentDismiss() {
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
    if (this._onOverlayClick) {
      const overlay = document.getElementById('dev-modal-overlay');
      if (overlay) overlay.removeEventListener('click', this._onOverlayClick);
      this._onOverlayClick = null;
    }
  }
};
