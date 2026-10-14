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
  searchQuery: '',
  focusChildId: null,
  /** Set by Children module before navigate('development') */
  pendingChildId: null,
  pendingOpenChecklist: false,

  async render(container) {
    this.container = container;
    await this._ensureCatalog();
    // Online: load Supabase children so list matches Children module (no demo seeds)
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      try {
        await ChildrenRemote.ensureLoaded();
      } catch (e) {
        console.warn('[Development] children load', e);
      }
    } else if (typeof ChildRegistry !== 'undefined') {
      ChildRegistry.ensureMerged();
    }
    await this._applyPendingChild();
    this._draw();
  },

  /**
   * Jump from Children (or elsewhere) to this child's class, optionally open checklist.
   */
  async openForChild(childId, opts) {
    opts = opts || {};
    this.pendingChildId = childId;
    this.pendingOpenChecklist = !!opts.openChecklist;
    if (this.container) {
      await this._applyPendingChild();
      this._draw();
    }
  },

  async _applyPendingChild() {
    if (this.pendingChildId == null) return;
    const id = this.pendingChildId;
    const openChecklist = this.pendingOpenChecklist;
    this.pendingChildId = null;
    this.pendingOpenChecklist = false;

    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    const child = (typeof SampleChildren !== 'undefined')
      ? SampleChildren.find(c => String(c.id) === String(id))
      : null;
    if (!child) return;

    if (child.sectionKey) this.selectedSection = child.sectionKey;
    this.focusChildId = child.id;
    this.searchQuery = '';

    if (openChecklist) {
      setTimeout(() => {
        if (typeof TeacherDevelopment !== 'undefined') {
          TeacherDevelopment.openAssessment(child.id);
        }
      }, 120);
    }
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
    const sections = (typeof ClassStore !== 'undefined')
      ? ClassStore.options(false)
      : [
          { key: 'explorers', label: 'Little Explorers (0–3 yrs)' },
          { key: 'stars', label: 'Little Stars (3–4 yrs)' },
          { key: 'sunshine', label: 'Sunshine Group (4–5 yrs)' }
        ];

    const q = String(this.searchQuery || '').trim().toLowerCase();
    const baseList = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    let children = baseList.filter(c => c.sectionKey === this.selectedSection);

    if (q) {
      // Search across all classes when query is present (active only)
      children = baseList.filter(c => {
        const hay = [
          c.name, c.childCode, c.parentName, c.motherName, c.fatherName, c.section
        ].map(x => String(x || '').toLowerCase()).join(' ');
        return hay.includes(q);
      });
    }

    const focusNote = this.focusChildId
      ? (() => {
          const fc = (SampleChildren || []).find(c => String(c.id) === String(this.focusChildId));
          return fc
            ? `<p class="text-muted" style="margin:0 0 0.75rem;font-size:0.9rem;">
                 Focused on <strong>${fc.name}</strong>${fc.childCode ? ' · ' + fc.childCode : ''}
                 · <button type="button" class="btn" style="padding:2px 8px;font-size:0.8rem;background:#e8e8e8;"
                     onclick="TeacherDevelopment.clearFocus()">Clear focus</button>
               </p>`
            : '';
        })()
      : '';

    this.container.innerHTML = `
      ${UI.pageHeader('📈 Development Tracking', 'Select a class, search a child, and encode the ECCD developmental checklist.')}

      <div class="card filter-bar-card">
        <div class="filter-bar">
          <div class="filter-bar-search">
            <label class="ecc-field-label" for="dev-search">Search</label>
            <input type="search" id="dev-search" class="ecc-field-input" placeholder="Name, Child ID, or parent"
              value="${String(this.searchQuery || '').replace(/"/g, '&quot;')}"
              oninput="TeacherDevelopment.onSearch(this.value)" />
          </div>
          <div class="filter-bar-class">
            <label class="ecc-field-label" for="dev-section">Class / section</label>
            <select id="dev-section" class="ecc-field-input" ${q ? 'disabled' : ''}
              onchange="TeacherDevelopment.setSection(this.value)">
              ${sections.map(s =>
                '<option value="' + s.key + '"' +
                (this.selectedSection === s.key ? ' selected' : '') + '>' +
                s.label + (s.ages ? ' (' + s.ages + ')' : '') + '</option>'
              ).join('')}
            </select>
          </div>
          ${q ? '<button type="button" class="btn filter-bar-clear" style="background:#e8e8e8;" onclick="TeacherDevelopment.onSearch('')">Clear</button>' : ''}
        </div>
        ${q ? `<p class="text-muted" style="margin:0.65rem 0 0;font-size:0.85rem;">Search is across all classes · ${children.length} match(es)</p>` : ''}
      </div>

      <div class="card" style="padding-bottom:0.75rem;">
        <h3 style="margin:0 0 0.5rem;">${q ? 'Search results' : 'Children'} (${children.length})</h3>
        ${focusNote}
        ${children.length === 0
          ? `<p class="text-muted">${q ? 'No children match that search.' : 'No children in this section.'}</p>`
          : `<div class="children-grid" style="margin-top:1rem;">
              ${children.map(c => this._childCard(c)).join('')}
            </div>`
        }
      </div>

      ${!q ? `<div class="card">
        <h3>Overall Class Snapshot</h3>
        ${this._classSnapshotBlock(children)}
      </div>` : ''}
    `;

    // Scroll focused child into view
    if (this.focusChildId) {
      setTimeout(() => {
        const el = document.getElementById('dev-child-' + this.focusChildId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  },

  onSearch(val) {
    this.searchQuery = val || '';
    this._draw();
  },

  clearFocus() {
    this.focusChildId = null;
    this._draw();
  },

  _classSnapshotBlock(children) {
    const snap = (typeof UI !== 'undefined' && UI.classDomainSnapshot)
      ? UI.classDomainSnapshot(children)
      : { domains: [], childrenWithData: 0, childrenTotal: children.length, periods: [] };

    if (!snap.childrenWithData) {
      return `
        <p class="text-muted" style="margin:0.35rem 0 0.75rem;">
          No saved assessments for this class yet. Encode and save an ECCD checklist for a child to fill domain averages.
        </p>
        ${typeof UI !== 'undefined' ? UI.domainDonutGrid(snap.domains) : ''}`;
    }

    const periodNote = snap.periods.length
      ? 'Based on each child’s <strong>latest</strong> saved evaluation' +
        (snap.periods.length === 1 ? ` (${snap.periods[0]})` : ` (${snap.periods.sort().join(', ')})`) + '.'
      : 'Based on each child’s latest saved evaluation.';

    return `
      <p class="text-muted" style="margin:0.35rem 0 1rem;">
        Domain averages for this section ·
        <strong>${snap.childrenWithData}</strong> of <strong>${snap.childrenTotal}</strong> children with data.
        ${periodNote}
        Percent = items marked <em>Present</em> ÷ items in domain.
      </p>
      ${UI.domainDonutGrid(snap.domains)}`;
  },

  setSection(key) {
    this.selectedSection = key;
    this.searchQuery = '';
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
           onclick="TeacherDevelopment.showTrends('${c.id}')">📈 View Trends</button>`
      : '';
    const focused = this.focusChildId != null && String(this.focusChildId) === String(c.id);
    const focusStyle = focused
      ? 'outline:3px solid var(--primary);box-shadow:0 0 0 4px rgba(33,150,243,0.2);'
      : '';
    const sectionLine = this.searchQuery
      ? `<div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.35rem;">${c.section || c.sectionKey || ''}${c.childCode ? ' · ' + c.childCode : ''}</div>`
      : (c.childCode ? `<div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.35rem;">${c.childCode}</div>` : '');
    return `
      <div class="card child-card" id="dev-child-${c.id}" style="margin-bottom:0;${focusStyle}">
        <div class="flex justify-between items-center" style="margin-bottom:0.35rem;">
          <strong>${c.name}</strong>
          <span style="font-size:0.85rem;color:var(--muted);">${c.ageLabel}</span>
        </div>
        ${sectionLine}
        <div style="color:${color};font-weight:600;font-size:0.9rem;margin-bottom:0.35rem;">${label}</div>
        ${histNote}
        <button class="btn btn-blue" style="width:100%;" onclick="TeacherDevelopment.openAssessment('${c.id}')">
          Encode ECCD Checklist
        </button>
        ${trendBtn}
      </div>
    `;
  },

  showTrends(childId) {
    const child = SampleChildren.find(c => String(c.id) === String(childId));
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
            <button class="btn no-print" style="background:#fff3e0;color:#e65100;" onclick="TeacherDevelopment.printResult()">🖨 Print</button>
            <button class="btn btn-blue no-print" onclick="TeacherDevelopment.closeResult()">Close</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },



  /* ---------- Assessment modal ---------- */

  async openAssessment(childId) {
    await this._ensureCatalog();
    const child = SampleChildren.find(c => String(c.id) === String(childId));
    if (!child) return;

    if (!this.catalog) {
      alert('ECCD catalog could not be loaded. Make sure you open the app via a local server (not file://).');
      return;
    }

    this.closeAssessment();
    this._assessChild = child;

    // Server children may miss recordType — derive from ageMonths
    if (child.recordType != 1 && child.recordType != 2) {
      const am = Number(child.ageMonths);
      child.recordType = (!isNaN(am) && am >= 37) ? 2 : 1;
    }

    const recordKey = child.recordType === 1 ? 'record1' : 'record2';
    const record = this.catalog.records[recordKey];
    // Record 1: 1st–6th columns; Record 2: 1st–3rd (matches paper forms — no separate period dropdown)
    this._periods = child.recordType === 1
      ? ['1st', '2nd', '3rd', '4th', '5th', '6th']
      : ['1st', '2nd', '3rd'];

    // Restore checklist marks from any saved assessments for this child
    this._responses = {};
    if (typeof AssessmentStore !== 'undefined') {
      const history = AssessmentStore.listForChild(child.id);
      history.forEach(a => {
        if (a.responses && typeof a.responses === 'object') {
          Object.keys(a.responses).forEach(k => {
            this._responses[k] = a.responses[k];
          });
        }
      });
    }

    const jumpLinks = this.catalog.domains.map(d =>
      `<a href="#domain-${d.code}" class="eccd-jump">${d.name}</a>`
    ).join('');

    const allDomainsHtml = this.catalog.domains.map(d =>
      this._domainBlock(record, d, child)
    ).join('');

    const periodHint = child.recordType === 1
      ? '1st through 6th evaluation columns'
      : '1st through 3rd evaluation columns';

    const isR1 = child.recordType === 1;
    const themeClass = isR1 ? 'eccd-theme-record1' : 'eccd-theme-record2';
    const coverSrc = isR1
      ? 'assets/eccd/record1-cover.png'
      : 'assets/eccd/record2-cover.png';
    const coverAlt = isR1
      ? "Child's Record 1 — Ages 0 month to 3 years"
      : "Child's Record 2 — Age 3 years 1 month to 5 years";

    const html = `
      <div id="dev-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel eccd-checklist-panel ${themeClass}" style="max-width:1200px;">
          <div class="bs-modal-header eccd-checklist-header">
            <div>
              <h2 style="margin:0;font-size:1.3rem;color:white;">ECCD Checklist — ${child.name}</h2>
              <div style="opacity:0.9;font-size:0.88rem;margin-top:2px;">
                ${child.ageLabel} • ${child.section} • ${record.label}
              </div>
            </div>
            <button onclick="TeacherDevelopment.closeAssessment()" class="bs-modal-close">×</button>
          </div>

          <div id="dev-modal-body" class="bs-modal-body eccd-form-scroll">
            <div class="eccd-cover-wrap">
              <img src="${coverSrc}" alt="${coverAlt}" class="eccd-cover-img" />
            </div>
            <div class="eccd-toolbar eccd-toolbar-sticky">
              <div class="eccd-jump-nav">${jumpLinks}</div>
            </div>
            <p class="eccd-form-note">
              Mark the <strong>Present</strong> checkbox under the evaluation column (${periodHint}) when the skill is observed.
              Each column is one evaluation — same as the paper form. Previously saved marks are restored when you reopen.
              Use Comments for observations. Domains are listed top-to-bottom as on the official checklist.
            </p>
            ${allDomainsHtml}
          </div>

          <div class="bs-modal-footer">
            <button class="btn" onclick="TeacherDevelopment.closeAssessment()">Cancel</button>
            <button class="btn btn-blue" onclick="TeacherDevelopment.saveAssessment()">💾 Save checklist</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this._bindAssessmentDismiss();
    this._bindDomainSpy();
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

  /**
   * Build domain scores for one evaluation column from checklist responses.
   */
  _scoresForPeriod(child, record, period) {
    const domainScores = {};
    let anyPresent = 0;
    this.catalog.domains.forEach(d => {
      const items = record.domains[d.code] || [];
      let present = 0;
      items.forEach(it => {
        const key = `${child.id}:${it.item_id}:${period}`;
        if (this._responses[key]) present++;
      });
      anyPresent += present;
      const total = items.length || 1;
      domainScores[d.code] = {
        name: d.name,
        present,
        total: items.length,
        percent: Math.round((present / total) * 100),
        period
      };
    });
    return { domainScores, anyPresent };
  },

  /**
   * Item-level results for the insight engine (present/not + teacher comments).
   */
  _itemResultsForPeriod(child, record, period) {
    const out = [];
    this.catalog.domains.forEach(d => {
      const items = record.domains[d.code] || [];
      items.forEach(it => {
        const presentKey = `${child.id}:${it.item_id}:${period}`;
        const commentKey = `${child.id}:${it.item_id}:comment`;
        const present = !!this._responses[presentKey];
        const comment = this._responses[commentKey] != null ? String(this._responses[commentKey]) : '';
        out.push({
          domainCode: d.code,
          domainName: d.name,
          itemId: it.item_id,
          title: it.title || it.item_id,
          present,
          comment: comment.trim()
        });
      });
    });
    return out;
  },

  /**
   * Snapshot of checkbox/comment keys for one period (plus shared comments).
   */
  _responsesSnapshotForPeriod(child, record, period) {
    const snap = {};
    this.catalog.domains.forEach(d => {
      const items = record.domains[d.code] || [];
      items.forEach(it => {
        const k = `${child.id}:${it.item_id}:${period}`;
        if (this._responses[k]) snap[k] = true;
        const ck = `${child.id}:${it.item_id}:comment`;
        if (this._responses[ck] != null && this._responses[ck] !== '') {
          snap[ck] = this._responses[ck];
        }
      });
    });
    return snap;
  },

  async saveAssessment() {
    const child = this._assessChild;
    if (!child || !this.catalog) return;

    const recordKey = child.recordType === 1 ? 'record1' : 'record2';
    const record = this.catalog.records[recordKey];
    const periods = this._periods || ['1st'];

    // Sync any checkbox state from DOM (safety) before scoring
    document.querySelectorAll('#dev-modal-overlay input[type="checkbox"][data-key]').forEach(cb => {
      this._responses[cb.getAttribute('data-key')] = cb.checked;
    });
    document.querySelectorAll('#dev-modal-overlay input.eccd-comment-input[data-key]').forEach(inp => {
      this._responses[inp.getAttribute('data-key')] = inp.value;
    });

    let savedPeriods = [];
    let lastInsight = null;

    for (const period of periods) {
      const { domainScores, anyPresent } = this._scoresForPeriod(child, record, period);
      if (anyPresent === 0) continue; // only persist columns that have marks

      const itemResults = this._itemResultsForPeriod(child, record, period);
      let insight = null;
      if (typeof ProgressEngine !== 'undefined' && ProgressEngine.analyze) {
        insight = await ProgressEngine.analyze({
          childId: child.id,
          recordType: child.recordType,
          ageMonths: child.ageMonths,
          period,
          domainScores,
          itemResults
        });
        lastInsight = insight;
      }

      if (typeof AssessmentStore !== 'undefined') {
        AssessmentStore.save({
          childId: child.id,
          childName: child.name,
          recordType: child.recordType,
          ageMonths: child.ageMonths,
          period,
          domainScores,
          insight,
          responses: this._responsesSnapshotForPeriod(child, record, period)
        });
        savedPeriods.push(period);
      }
    }

    if (!savedPeriods.length) {
      alert('No Present marks found. Check at least one skill under an evaluation column (1st, 2nd, …) before saving.');
      return;
    }

    // Trends across periods for this child
    let trends = null;
    if (typeof AssessmentStore !== 'undefined' && typeof ProgressEngine !== 'undefined') {
      const history = AssessmentStore.listForChild(child.id);
      trends = ProgressEngine.compareTrends(history);
    }

    this.closeAssessment();

    const insight = lastInsight;
    const period = savedPeriods[savedPeriods.length - 1];
    const bandNote = insight && insight.ageBand
      ? `Age band: <strong>${insight.ageBand.label}</strong>.`
      : 'Age band could not be resolved.';
    const tableNote = insight && !insight.tablesComplete
      ? `<p class="text-muted" style="margin-top:0.75rem;font-size:0.85rem;">Some official tables are incomplete for this age — scaled/standard scores appear when mappings exist.</p>`
      : '';

    const overallLabel = (insight && insight.overallInterpretation && insight.overallInterpretation.label)
      || (insight && insight.interpretation)
      || '';
    const overallLevel = (insight && insight.overallInterpretation && insight.overallInterpretation.level) || '';
    const levelTone = overallLevel === 'needs_support' || overallLevel === 'emerging'
      ? '#e65100'
      : overallLevel === 'advanced'
        ? '#2e7d32'
        : 'var(--primary-dark, #1565c0)';
    const summaryCard = insight ? `
      <div class="insight-summary-card card" style="margin-top:0.5rem;background:linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 100%);border:1px solid #c8e6c9;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:flex-start;">
          <div>
            <div class="text-muted" style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.04em;">Progress insight · ${period || 'Latest'}</div>
            <h3 style="margin:0.25rem 0 0;color:${levelTone};font-size:1.2rem;">${overallLabel || 'Assessment recorded'}</h3>
            <p class="text-muted" style="margin:0.35rem 0 0;font-size:0.88rem;">${bandNote}</p>
          </div>
          ${insight.standardScore != null ? `
            <div style="text-align:center;min-width:4.5rem;background:#fff;border-radius:12px;padding:0.5rem 0.75rem;border:1px solid #e0e0e0;">
              <div class="text-muted" style="font-size:0.72rem;">Standard</div>
              <div style="font-size:1.45rem;font-weight:700;color:var(--primary-dark);">${insight.standardScore}</div>
            </div>` : ''}
        </div>
      </div>` : '';

    const chip = (text, tone) =>
      `<span class="insight-chip" style="display:inline-block;margin:0.2rem 0.35rem 0.2rem 0;padding:0.28rem 0.65rem;border-radius:999px;font-size:0.82rem;background:${tone.bg};color:${tone.fg};border:1px solid ${tone.bd};">${text}</span>`;
    const strengthChips = (insight && insight.strengths && insight.strengths.length)
      ? insight.strengths.map(s => chip(s, { bg: '#e8f5e9', fg: '#1b5e20', bd: '#a5d6a7' })).join('')
      : '<span class="text-muted" style="font-size:0.88rem;">No strength highlights yet for this period.</span>';
    const needChips = (insight && insight.needs && insight.needs.length)
      ? insight.needs.map(n => chip(n, { bg: '#fff3e0', fg: '#e65100', bd: '#ffcc80' })).join('')
      : '<span class="text-muted" style="font-size:0.88rem;">No areas flagged for extra support this period.</span>';

    const strengthsNeedsHtml = `
      <div class="insight-split" style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-top:1rem;">
        <div class="card" style="margin:0;border-left:4px solid #43a047;">
          <h3 style="margin:0 0 0.5rem;font-size:1rem;">✓ Strengths</h3>
          <div>${strengthChips}</div>
        </div>
        <div class="card" style="margin:0;border-left:4px solid #fb8c00;">
          <h3 style="margin:0 0 0.5rem;font-size:1rem;">◎ Needs monitoring</h3>
          <div>${needChips}</div>
        </div>
      </div>
      <style>@media (max-width:700px){ .insight-split{ grid-template-columns:1fr !important; } }</style>`;

    let tipsHtml = '';
    if (insight && insight.tipLines && insight.tipLines.length) {
      tipsHtml = `
        <div class="card" style="margin-top:1rem;border-left:5px solid #5c6bc0;">
          <h3 style="margin-top:0;">Quick guidance tips</h3>
          <ol style="margin:0;padding-left:1.25rem;font-size:0.9rem;line-height:1.45;">
            ${insight.tipLines.slice(0, 8).map(t => `<li style="margin-bottom:0.35rem;">${t}</li>`).join('')}
          </ol>
        </div>`;
    }

    let commentsHtml = '';
    if (insight && insight.teacherComments && insight.teacherComments.length) {
      commentsHtml = `
        <div class="card" style="margin-top:1rem;border-left:5px solid #f9a825;">
          <h3 style="margin-top:0;">Teacher comments on checklist items</h3>
          <ul style="margin:0;padding-left:1.25rem;font-size:0.9rem;">
            ${insight.teacherComments.slice(0, 10).map(c =>
              `<li style="margin-bottom:0.35rem;"><strong>${c.itemTitle}</strong>${c.present ? '' : ' <span class="text-muted">(still developing)</span>'}: ${c.comment}</li>`
            ).join('')}
          </ul>
        </div>`;
    }

    let focusHtml = '';
    if (insight && insight.focusItems && insight.focusItems.length) {
      focusHtml = `
        <div class="card" style="margin-top:1rem;border-left:5px solid #e65100;">
          <h3 style="margin-top:0;">Skills still developing</h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">From items not yet marked Present — used for parent tips and priorities.</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${insight.focusItems.slice(0, 10).map(fi =>
              `<span style="background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;padding:0.35rem 0.55rem;font-size:0.82rem;"><strong>${fi.domainName}</strong> · ${fi.itemTitle}</span>`
            ).join('')}
          </div>
        </div>`;
    }

    let teacherPriHtml = '';
    if (insight && insight.teacherPriorities && insight.teacherPriorities.length) {
      teacherPriHtml = `
        <div class="card" style="margin-top:1rem;border-left:5px solid var(--primary);">
          <h3 style="margin-top:0;">Teacher learning priorities</h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Classroom focus based on domains that need support or monitoring.</p>
          <div style="display:grid;gap:0.75rem;">
            ${insight.teacherPriorities.map(tp => `
              <div style="background:#f7fafc;border-radius:10px;padding:0.65rem 0.85rem;">
                <strong>${tp.domainName}</strong>
                <span class="text-muted" style="font-size:0.85rem;"> — ${tp.reason || ''}</span>
                <ul style="margin:0.35rem 0 0;padding-left:1.25rem;font-size:0.9rem;">
                  ${(tp.priorities || []).map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    let parentActHtml = '';
    if (insight && insight.parentActivities && insight.parentActivities.length) {
      parentActHtml = `
        <div class="card" style="margin-top:1rem;border-left:5px solid var(--success);">
          <h3 style="margin-top:0;">Suggested activities for parents</h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Home ideas matched to this child’s domains. Review before sharing in the parent report.</p>
          <div style="display:grid;gap:0.75rem;">
            ${insight.parentActivities.map(pa => `
              <div style="background:#f1f8f4;border-radius:10px;padding:0.65rem 0.85rem;">
                <strong>${pa.domainName}</strong>
                <span class="text-muted" style="font-size:0.85rem;"> — ${pa.reason || ''}</span>
                <ul style="margin:0.35rem 0 0;padding-left:1.25rem;font-size:0.9rem;">
                  ${(pa.activities || []).map(a => `<li>${a}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    const draft = insight && insight.parentFriendlyDraft
      ? `<div class="card" style="margin-top:1rem;background:#e3f2fd;border:1px solid #90caf9;">
          <h3 style="margin:0 0 0.35rem;font-size:1rem;">Parent-friendly report draft</h3>
          <p class="text-muted" style="margin:0 0 0.5rem;font-size:0.82rem;">Editable later when you approve the parent report. Written in plain language.</p>
          <p style="margin:0;font-size:0.95rem;line-height:1.5;">${insight.parentFriendlyDraft}</p>
        </div>`
      : '';

    const persistNote =
      `<p class="text-muted" style="font-size:0.85rem;margin-bottom:0.75rem;">✓ Saved evaluation column(s): <strong>${savedPeriods.join(', ')}</strong>. Reopen the checklist to edit; marks restore from these columns.</p>`;

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
              Evaluation columns saved: <strong>${savedPeriods.join(', ')}</strong>. ${bandNote}
              Empty columns fill in as you mark Present under each evaluation.
            </p>
            ${trendNote}
            ${summaryCard}
            ${strengthsNeedsHtml}
            ${tipsHtml}
            ${profilePanel}
            ${tableNote}
            ${commentsHtml}
            ${focusHtml}
            ${teacherPriHtml}
            ${parentActHtml}
            ${draft}
          </div>
          <div class="bs-modal-footer">
            <button class="btn no-print" style="background:#fff3e0;color:#e65100;" onclick="TeacherDevelopment.printResult()">🖨 Print</button>
            <button class="btn btn-blue no-print" onclick="TeacherDevelopment.closeResult()">Done</button>
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
    const child = SampleChildren.find(c => String(c.id) === String(childId));
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

  printResult() {
    window.print();
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
    if (this._domainObserver) {
      try { this._domainObserver.disconnect(); } catch (e) {}
      this._domainObserver = null;
    }
  },

  /** Highlight domain jump link for the section currently in view */
  _bindDomainSpy() {
    const jumps = document.querySelectorAll('.eccd-jump');
    const blocks = document.querySelectorAll('.eccd-domain-block');
    if (!jumps.length || !blocks.length) return;
    const byId = {};
    jumps.forEach(function (a) {
      const id = (a.getAttribute('href') || '').replace('#', '');
      if (id) byId[id] = a;
    });
    if (this._domainObserver) {
      try { this._domainObserver.disconnect(); } catch (e) {}
    }
    const root = document.querySelector('.eccd-form-scroll');
    this._domainObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        jumps.forEach(function (a) { a.classList.remove('eccd-jump-active'); });
        if (byId[id]) byId[id].classList.add('eccd-jump-active');
        en.target.classList.add('eccd-domain-active');
        blocks.forEach(function (b) {
          if (b.id !== id) b.classList.remove('eccd-domain-active');
        });
      });
    }, { root: root || null, rootMargin: '-15% 0px -50% 0px', threshold: 0.05 });
    blocks.forEach(function (b) { TeacherDevelopment._domainObserver.observe(b); });
  }
};
