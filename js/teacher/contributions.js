/**
 * Teacher — Monthly parent contributions (C1 lean).
 * Separate from DSWD SFP commodities.
 */

const TeacherContributions = {
  yearMonth: null,
  sectionKey: 'all',
  defaultDue: 50,

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (!this.yearMonth && typeof ContributionStore !== 'undefined') {
      this.yearMonth = ContributionStore.currentYearMonth();
    } else if (!this.yearMonth) {
      const d = new Date();
      this.yearMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }
    this._draw();
  },

  _sections() {
    const base = [{ key: 'all', label: 'All classes' }];
    if (typeof ClassStore !== 'undefined' && ClassStore.options) {
      return base.concat(ClassStore.options(false));
    }
    return base.concat([
      { key: 'explorers', label: 'Little Explorers' },
      { key: 'stars', label: 'Little Stars' },
      { key: 'sunshine', label: 'Sunshine Group' }
    ]);
  },

  _children() {
    let list = typeof SampleChildren !== 'undefined' ? SampleChildren.slice() : [];
    if (this.sectionKey && this.sectionKey !== 'all') {
      list = list.filter(c => c.sectionKey === this.sectionKey);
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  _draw() {
    const children = this._children();
    const ym = this.yearMonth;
    const summary = typeof ContributionStore !== 'undefined'
      ? ContributionStore.summaryForMonth(ym)
      : { unpaid: 0, partial: 0, paid: 0, waived: 0, due: 0, collected: 0, count: 0 };

    const sectionOpts = this._sections().map(s =>
      `<option value="${s.key}" ${s.key === this.sectionKey ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const rows = children.map(c => {
      const rec = typeof ContributionStore !== 'undefined'
        ? ContributionStore.get(c.id, ym)
        : null;
      const due = rec ? rec.amountDue : this.defaultDue;
      const paid = rec ? rec.amountPaid : 0;
      const status = rec ? rec.status : 'unpaid';
      const notes = rec ? (rec.notes || '') : '';
      const paidAt = rec ? (rec.paidAt || '') : '';
      const statusColor = status === 'paid' ? 'var(--success)'
        : status === 'partial' ? 'var(--orange)'
        : status === 'waived' ? 'var(--primary)'
        : '#c62828';

      return `
        <tr data-child="${c.id}">
          <td>
            <strong>${c.name}</strong>
            <div class="text-muted" style="font-size:0.78rem;">${c.childCode || ''} · ${c.section || ''}</div>
          </td>
          <td>
            <input type="number" class="ecc-field-input contrib-due" data-id="${c.id}"
              min="0" step="1" value="${due}" style="width:90px;" />
          </td>
          <td>
            <input type="number" class="ecc-field-input contrib-paid" data-id="${c.id}"
              min="0" step="1" value="${paid}" style="width:90px;" />
          </td>
          <td>
            <select class="ecc-field-input contrib-status" data-id="${c.id}" style="min-width:110px;">
              ${['unpaid','partial','paid','waived'].map(s =>
                `<option value="${s}" ${status === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
            <div style="font-size:0.75rem;color:${statusColor};font-weight:600;margin-top:2px;" class="contrib-status-label">${status}</div>
          </td>
          <td>
            <input type="date" class="ecc-field-input contrib-paidat" data-id="${c.id}" value="${paidAt}" style="min-width:130px;" />
          </td>
          <td>
            <input type="text" class="ecc-field-input contrib-notes" data-id="${c.id}"
              value="${String(notes).replace(/"/g, '&quot;')}" placeholder="Receipt / note" style="min-width:120px;" />
          </td>
        </tr>`;
    }).join('');

    this._container.innerHTML = `
      ${UI.pageHeader('💵 Contributions', 'Monthly parent contributions (center fees). Separate from DSWD SFP food allocation.')}

      <div class="card" style="margin-bottom:1rem;">
        <div class="profile-grid">
          <div>
            <label class="ecc-field-label">Month</label>
            <input type="month" id="contrib-month" class="ecc-field-input" value="${ym}"
              onchange="TeacherContributions.onMonth(this.value)" />
          </div>
          <div>
            <label class="ecc-field-label">Class</label>
            <select id="contrib-section" class="ecc-field-input" onchange="TeacherContributions.onSection(this.value)">
              ${sectionOpts}
            </select>
          </div>
          <div>
            <label class="ecc-field-label">Default amount due (₱)</label>
            <input type="number" id="contrib-default-due" class="ecc-field-input" min="0" value="${this.defaultDue}"
              onchange="TeacherContributions.defaultDue=parseFloat(this.value)||0" />
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;">
          <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherContributions.applyDefaultDue()">Apply default due to empty rows</button>
          <button class="btn btn-blue" onclick="TeacherContributions.saveAll()">💾 Save month</button>
        </div>
      </div>

      <div class="dashboard-grid" style="margin-bottom:1rem;">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">${ym}</h3>
          <p style="margin:0.25rem 0;"><span class="success-text"><strong>${summary.paid}</strong> paid</span>
            · <span style="color:var(--orange);"><strong>${summary.partial}</strong> partial</span>
            · <span style="color:#c62828;"><strong>${summary.unpaid}</strong> unpaid</span>
            · <strong>${summary.waived}</strong> waived</p>
          <p class="text-muted" style="margin:0.25rem 0 0;font-size:0.88rem;">
            Collected ₱${Number(summary.collected).toLocaleString()} / due ₱${Number(summary.due).toLocaleString()}
          </p>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Children — ${ym}</h3>
        ${children.length ? `
          <div class="eccd-table-wrap">
            <table class="eccd-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Amount due</th>
                  <th>Amount paid</th>
                  <th>Status</th>
                  <th>Paid date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : `<p class="text-muted">No children in this filter.</p>`}
      </div>
    `;
  },

  onMonth(v) {
    this.yearMonth = v;
    this._draw();
  },

  onSection(v) {
    this.sectionKey = v;
    this._draw();
  },

  applyDefaultDue() {
    const due = parseFloat((document.getElementById('contrib-default-due') || {}).value) || this.defaultDue;
    this.defaultDue = due;
    document.querySelectorAll('.contrib-due').forEach(el => {
      if (el.value === '' || el.value === '0') el.value = due;
    });
    this._toast('Default due ₱' + due + ' applied where empty/zero');
  },

  saveAll() {
    if (typeof ContributionStore === 'undefined') {
      alert('Contribution store not loaded.');
      return;
    }
    const ym = (document.getElementById('contrib-month') || {}).value || this.yearMonth;
    const children = this._children();
    const rows = children.map(c => {
      const dueEl = document.querySelector(`.contrib-due[data-id="${c.id}"]`);
      const paidEl = document.querySelector(`.contrib-paid[data-id="${c.id}"]`);
      const statusEl = document.querySelector(`.contrib-status[data-id="${c.id}"]`);
      const paidAtEl = document.querySelector(`.contrib-paidat[data-id="${c.id}"]`);
      const notesEl = document.querySelector(`.contrib-notes[data-id="${c.id}"]`);
      return {
        childId: c.id,
        yearMonth: ym,
        amountDue: dueEl ? parseFloat(dueEl.value) || 0 : 0,
        amountPaid: paidEl ? parseFloat(paidEl.value) || 0 : 0,
        status: statusEl ? statusEl.value : undefined,
        paidAt: paidAtEl ? paidAtEl.value : '',
        notes: notesEl ? notesEl.value : ''
      };
    });
    const result = ContributionStore.saveMany(rows);
    this.yearMonth = ym;
    this._draw();
    this._toast(result.ok
      ? 'Saved contributions for ' + ym + ' (' + rows.length + ' children)'
      : 'Some rows may not have saved — check values');
  },

  _toast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }
};

if (typeof window !== 'undefined') window.TeacherContributions = TeacherContributions;
