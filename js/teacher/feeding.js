/**
 * Teacher — SFP Feeding
 * Phase 3: 20-day menu reference
 * Phase 4: Hot meal daily log (-A style)
 * Phase 5 UI shell ready for NUTRICombo (next)
 */

const TeacherFeeding = {
  tab: 'hot', // hot | menu | alt
  sectionKey: 'explorers',
  date: new Date().toISOString().slice(0, 10),
  dayNumber: 1,
  altDate: new Date().toISOString().slice(0, 10),
  deliveryNumber: 2,
  quantityDefault: 2,

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (typeof SfpStore !== 'undefined') SfpStore.ensureSeed();
    this._draw();
  },

  _sections() {
    if (typeof ClassStore !== 'undefined' && ClassStore.options) {
      return ClassStore.options(false);
    }
    return [
      { key: 'explorers', label: 'Little Explorers' },
      { key: 'stars', label: 'Little Stars' },
      { key: 'sunshine', label: 'Sunshine Group' }
    ];
  },

  _children() {
    return (typeof SampleChildren !== 'undefined' ? SampleChildren : [])
      .filter(c => c.sectionKey === this.sectionKey);
  },

  _draw() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : null;
    const cycleLabel = cycle
      ? `${cycle.cycleLabel || ('Cycle ' + cycle.cycleNumber)} · SY ${cycle.schoolYear || '—'}`
      : 'SFP cycle not configured';

    const tabs = [
      { key: 'hot', label: '🍲 Hot meal log (-A)' },
      { key: 'menu', label: '📋 Cycle menu' },
      { key: 'alt', label: '🧃 NUTRICombo (-C)' }
    ].map(t => {
      const active = this.tab === t.key;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherFeeding.setTab('${t.key}')">${t.label}</button>`;
    }).join('');

    let body = '';
    if (this.tab === 'menu') body = this._menuHtml();
    else if (this.tab === 'alt') body = this._altLogHtml();
    else body = this._hotLogHtml();

    this._container.innerHTML = `
      ${UI.pageHeader('🍎 SFP Feeding', 'Supplementary Feeding Program — menu reference and daily feeding logs for DSWD liquidation.')}
      <div class="card" style="margin-bottom:1rem;">
        <p style="margin:0 0 0.5rem;"><strong>Active cycle:</strong> ${cycleLabel}</p>
        <p class="text-muted" style="margin:0;font-size:0.88rem;">
          Facility: ${(cycle && cycle.facilityName) || 'NCDC Medina'}
          ${cycle && cycle.startDate ? ' · Feeding started: ' + cycle.startDate : ' · Set start date under cycle settings later'}
        </p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">${tabs}</div>
      ${body}
    `;
  },

  setTab(key) {
    this.tab = key;
    this._draw();
  },

  // ── Phase 3: Menu reference ──────────────────────────────────────

  _menuHtml() {
    const rows = (typeof SfpMenu !== 'undefined' ? SfpMenu.list() : []).map(d => `
      <tr style="${d.isAlternative ? 'background:#fff8e1;' : ''}">
        <td style="font-weight:700;">Day ${d.dayNumber}</td>
        <td>${d.weekday}</td>
        <td>${d.dish}</td>
        <td>${d.isAlternative ? '<span style="color:var(--orange);font-weight:600;">Alternative</span>' : 'Hot meal'}</td>
      </tr>
    `).join('');

    return `
      <div class="card">
        <h3 style="margin-top:0;">${(typeof SfpMenu !== 'undefined' && SfpMenu.cycleLabel) || '15th Cycle'} — 20 Days Cycle Menu</h3>
        <p class="text-muted" style="font-size:0.88rem;margin-top:0;">
          Official DSWD Field Office X template. Day numbers match the Food Allocation Matrix (-A).
          Saturday/Sunday use Alternative Foods Products (often NUTRICombo track).
        </p>
        <div class="eccd-table-wrap">
          <table class="eccd-table">
            <thead>
              <tr><th>Day</th><th>Weekday</th><th>Menu</th><th>Type</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4" class="text-muted">Menu data not loaded</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  },

  // ── Phase 4: Hot meal log ────────────────────────────────────────

  _hotLogHtml() {
    const menu = typeof SfpMenu !== 'undefined' ? SfpMenu.get(this.dayNumber) : { dish: '—', isAlternative: false };
    const sectionOpts = this._sections().map(s =>
      `<option value="${s.key}" ${s.key === this.sectionKey ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const children = this._children();
    const existing = typeof SfpStore !== 'undefined'
      ? SfpStore.getHotMealDay(null, this.dayNumber, this.date)
      : null;
    const statusMap = {};
    if (existing && existing.childStatuses) {
      existing.childStatuses.forEach(cs => {
        statusMap[String(cs.childId)] = cs.status;
      });
    }

    // Prefer attendance present if available
    let attMarks = {};
    if (typeof AttendanceStore !== 'undefined') {
      const day = AttendanceStore.getDay(this.date, this.sectionKey);
      if (day && day.marks) attMarks = day.marks;
    }

    const rows = children.map(c => {
      let st = statusMap[String(c.id)] || '';
      if (!st && attMarks[c.id] === 'A') st = 'absent';
      if (!st && attMarks[c.id] === 'P') st = 'fed';
      return `
        <tr>
          <td><strong>${c.name}</strong>
            <div class="text-muted" style="font-size:0.78rem;">${c.childCode || ''}</div>
          </td>
          <td style="white-space:nowrap;">
            <label style="margin-right:0.5rem;"><input type="radio" name="feed-${c.id}" value="fed" ${st === 'fed' ? 'checked' : ''} /> Fed</label>
            <label style="margin-right:0.5rem;"><input type="radio" name="feed-${c.id}" value="not_fed" ${st === 'not_fed' ? 'checked' : ''} /> Not fed</label>
            <label><input type="radio" name="feed-${c.id}" value="absent" ${st === 'absent' ? 'checked' : ''} /> Absent</label>
          </td>
        </tr>`;
    }).join('');

    const recent = typeof SfpStore !== 'undefined'
      ? SfpStore.listHotMealDays().slice(-8).reverse()
      : [];
    const recentRows = recent.map(d => {
      const fed = (d.childStatuses || []).filter(x => x.status === 'fed').length;
      const total = (d.childStatuses || []).length;
      return `<tr>
        <td>Day ${d.dayNumber}</td>
        <td>${d.actualDate}</td>
        <td style="font-size:0.85rem;">${d.menuLabel || '—'}</td>
        <td>${fed} / ${total} fed</td>
      </tr>`;
    }).join('');

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Hot meal log <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(Form -A style)</span></h3>
        <div class="profile-grid">
          <div>
            <label class="ecc-field-label">Actual date of feeding</label>
            <input type="date" id="feed-date" class="ecc-field-input" value="${this.date}"
              onchange="TeacherFeeding.onDateChange(this.value)" />
          </div>
          <div>
            <label class="ecc-field-label">Feeding day number (cycle)</label>
            <input type="number" id="feed-day-num" class="ecc-field-input" min="1" max="120" value="${this.dayNumber}"
              onchange="TeacherFeeding.onDayChange(this.value)" />
          </div>
          <div>
            <label class="ecc-field-label">Class / section</label>
            <select id="feed-section" class="ecc-field-input" onchange="TeacherFeeding.onSectionChange(this.value)">
              ${sectionOpts}
            </select>
          </div>
          <div>
            <label class="ecc-field-label">Menu for this day</label>
            <input type="text" class="ecc-field-input" readonly style="background:#f5f9fc;font-weight:600;"
              value="${(menu.dish || '—').replace(/"/g, '&quot;')}" />
            ${menu.isAlternative ? '<p class="text-muted" style="margin:0.25rem 0 0;font-size:0.8rem;">Marked alternative on cycle menu — use NUTRICombo tab if packaging was served.</p>' : ''}
          </div>
        </div>
        <div class="profile-grid" style="margin-top:0.75rem;">
          <div>
            <label class="ecc-field-label">Commodities received (optional)</label>
            <input type="text" id="feed-commodities" class="ecc-field-input"
              value="${existing && existing.commoditiesNote ? String(existing.commoditiesNote).replace(/"/g, '&quot;') : ''}"
              placeholder="e.g. Rice, chicken, string beans" />
          </div>
          <div>
            <label class="ecc-field-label">Food committee / notes (optional)</label>
            <input type="text" id="feed-committee" class="ecc-field-input"
              value="${existing && existing.committeeNote ? String(existing.committeeNote).replace(/"/g, '&quot;') : ''}"
              placeholder="Signatures / remarks" />
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem;">
        <div class="flex justify-between items-center" style="margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">
          <h3 style="margin:0;">Children — mark feeding</h3>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button class="btn" style="background:#e8f5e9;color:#2e7d32;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.markAll('fed')">All fed</button>
            <button class="btn" style="background:#fff3e0;color:#e65100;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.markAll('not_fed')">All not fed</button>
            <button class="btn" style="background:#eceff1;color:#455a64;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.markAll('absent')">All absent</button>
          </div>
        </div>
        ${children.length ? `
          <div class="eccd-table-wrap">
            <table class="eccd-table">
              <thead><tr><th>Child</th><th>Status</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherFeeding.saveHotLog()">💾 Save hot meal log</button>
        ` : `<p class="text-muted">No children in this section.</p>`}
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Recent hot meal days</h3>
        <div class="eccd-table-wrap">
          <table class="eccd-table">
            <thead><tr><th>Day #</th><th>Date</th><th>Menu</th><th>Fed</th></tr></thead>
            <tbody>${recentRows || '<tr><td colspan="4" class="text-muted">No logs yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  },

  onDateChange(v) {
    this.date = v;
    this._draw();
  },

  onDayChange(v) {
    this.dayNumber = Math.max(1, parseInt(v, 10) || 1);
    this._draw();
  },

  onSectionChange(v) {
    this.sectionKey = v;
    this._draw();
  },

  markAll(status) {
    this._children().forEach(c => {
      const el = document.querySelector(`input[name="feed-${c.id}"][value="${status}"]`);
      if (el) el.checked = true;
    });
  },

  saveHotLog() {
    if (typeof SfpStore === 'undefined') {
      alert('SFP store not loaded.');
      return;
    }
    const date = (document.getElementById('feed-date') || {}).value || this.date;
    const dayNumber = parseInt((document.getElementById('feed-day-num') || {}).value, 10) || this.dayNumber;
    const children = this._children();
    const childStatuses = children.map(c => {
      const el = document.querySelector(`input[name="feed-${c.id}"]:checked`);
      return {
        childId: c.id,
        childName: c.name,
        status: el ? el.value : 'absent'
      };
    });
    const menu = typeof SfpMenu !== 'undefined' ? SfpMenu.get(dayNumber) : null;
    const result = SfpStore.saveHotMealDay({
      dayNumber,
      actualDate: date,
      menuLabel: menu ? menu.dish : '',
      childStatuses,
      commoditiesNote: (document.getElementById('feed-commodities') || {}).value || '',
      committeeNote: (document.getElementById('feed-committee') || {}).value || ''
    });
    if (!result.ok) {
      alert(result.error || 'Could not save.');
      return;
    }
    this.date = date;
    this.dayNumber = dayNumber;
    this._toast('Hot meal log saved — Day ' + dayNumber + ' (' + date + ')');
    this._draw();
  },

  // ── Phase 5: NUTRICombo / Alternative meal (-C) ─────────────────

  _altLogHtml() {
    const sectionOpts = this._sections().map(s =>
      `<option value="${s.key}" ${s.key === this.sectionKey ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    // Prefer SFP beneficiaries; fall back to section children
    let children = this._children();
    if (typeof SfpStore !== 'undefined') {
      const bens = SfpStore.listBeneficiaries();
      const benIds = new Set(bens.map(b => String(b.childId)));
      const inSection = children.filter(c => benIds.has(String(c.id)));
      if (inSection.length) children = inSection;
    }

    // Existing delivery for this date
    let existing = null;
    if (typeof SfpStore !== 'undefined') {
      existing = SfpStore.listAltDeliveries().find(d => d.actualDate === this.altDate) || null;
    }
    const receiptMap = {};
    if (existing && existing.receipts) {
      existing.receipts.forEach(r => {
        receiptMap[String(r.childId)] = r;
      });
    }

    const rows = children.map(c => {
      const r = receiptMap[String(c.id)] || {};
      const qty = r.quantity != null ? r.quantity : this.quantityDefault;
      const received = r.received !== false; // default yes when logging delivery
      const signed = !!r.parentSigned;
      const parent = r.parentName || c.parentName || c.motherName || c.fatherName || '';
      return `
        <tr>
          <td>
            <strong>${c.name}</strong>
            <div class="text-muted" style="font-size:0.78rem;">${c.childCode || ''}</div>
          </td>
          <td>
            <input type="text" class="ecc-field-input alt-parent" data-id="${c.id}"
              value="${String(parent).replace(/"/g, '&quot;')}" style="min-width:120px;" />
          </td>
          <td style="width:70px;">
            <input type="number" class="ecc-field-input alt-qty" data-id="${c.id}" min="0" max="20"
              value="${qty}" style="width:64px;" />
          </td>
          <td style="text-align:center;">
            <input type="checkbox" class="alt-received" data-id="${c.id}" ${received ? 'checked' : ''} />
          </td>
          <td style="text-align:center;">
            <input type="checkbox" class="alt-signed" data-id="${c.id}" ${signed ? 'checked' : ''} />
          </td>
        </tr>`;
    }).join('');

    const recent = typeof SfpStore !== 'undefined'
      ? SfpStore.listAltDeliveries().slice().reverse().slice(0, 8)
      : [];
    const recentRows = recent.map(d => {
      const recv = (d.receipts || []).filter(x => x.received).length;
      const signed = (d.receipts || []).filter(x => x.parentSigned).length;
      return `<tr>
        <td>${d.deliveryNumber != null ? d.deliveryNumber : '—'}</td>
        <td>${d.actualDate}</td>
        <td>${recv} received</td>
        <td>${signed} signed</td>
      </tr>`;
    }).join('');

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">NUTRICombo / Alternative meal <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(Form -C style)</span></h3>
        <p class="text-muted" style="font-size:0.88rem;margin-top:0;">
          Per-child receipt of alternative meals (e.g. high-protein cookie 60g &amp; nutri juice 200mL),
          with parent/guardian signature — matches the Food Allocation Matrix -C.
        </p>
        <div class="profile-grid">
          <div>
            <label class="ecc-field-label">Date of actual feeding / delivery</label>
            <input type="date" id="alt-date" class="ecc-field-input" value="${this.altDate}"
              onchange="TeacherFeeding.onAltDateChange(this.value)" />
          </div>
          <div>
            <label class="ecc-field-label">Delivery number</label>
            <input type="number" id="alt-delivery-num" class="ecc-field-input" min="1" max="20"
              value="${this.deliveryNumber}" />
          </div>
          <div>
            <label class="ecc-field-label">Default quantity per child</label>
            <input type="number" id="alt-qty-default" class="ecc-field-input" min="1" max="10"
              value="${this.quantityDefault}"
              onchange="TeacherFeeding.quantityDefault=parseInt(this.value,10)||2" />
          </div>
          <div>
            <label class="ecc-field-label">Class / section</label>
            <select id="alt-section" class="ecc-field-input" onchange="TeacherFeeding.onSectionChange(this.value)">
              ${sectionOpts}
            </select>
          </div>
          <div style="grid-column:1 / -1;">
            <label class="ecc-field-label">Particulars</label>
            <input type="text" id="alt-particulars" class="ecc-field-input"
              value="NUTRI-COMBO (High Protein Cookie 60g &amp; Nutri Juice 200mL)" />
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem;">
        <div class="flex justify-between items-center" style="margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">
          <h3 style="margin:0;">Beneficiaries — receipt &amp; signature</h3>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button class="btn" style="background:#e8f5e9;color:#2e7d32;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.altMarkAll(true, true)">All received + signed</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.altMarkAll(true, false)">All received</button>
            <button class="btn" style="background:#eceff1;color:#455a64;padding:4px 12px;font-size:0.82rem;"
              onclick="TeacherFeeding.altMarkAll(false, false)">Clear all</button>
          </div>
        </div>
        <p class="text-muted" style="font-size:0.82rem;margin-top:0;">
          List prefers children marked as <strong>SFP beneficiaries</strong> in this section (Health → SFP profile).
          If none, all children in the section are shown.
        </p>
        ${children.length ? `
          <div class="eccd-table-wrap">
            <table class="eccd-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Parent / Guardian</th>
                  <th>Qty</th>
                  <th>Received</th>
                  <th>Parent signed</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherFeeding.saveAltLog()">
            💾 Save NUTRICombo delivery
          </button>
        ` : `<p class="text-muted">No children in this section. Enroll children or pick another class.</p>`}
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Recent alternative deliveries</h3>
        <div class="eccd-table-wrap">
          <table class="eccd-table">
            <thead><tr><th>Delivery #</th><th>Date</th><th>Received</th><th>Signed</th></tr></thead>
            <tbody>${recentRows || '<tr><td colspan="4" class="text-muted">No deliveries yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  },

  onAltDateChange(v) {
    this.altDate = v;
    this._draw();
  },

  altMarkAll(received, signed) {
    document.querySelectorAll('.alt-received').forEach(el => { el.checked = !!received; });
    document.querySelectorAll('.alt-signed').forEach(el => { el.checked = !!signed; });
  },

  saveAltLog() {
    if (typeof SfpStore === 'undefined') {
      alert('SFP store not loaded.');
      return;
    }
    const date = (document.getElementById('alt-date') || {}).value || this.altDate;
    const deliveryNumber = parseInt((document.getElementById('alt-delivery-num') || {}).value, 10);
    const particulars = (document.getElementById('alt-particulars') || {}).value ||
      'NUTRI-COMBO (High Protein Cookie 60g & Nutri Juice 200mL)';

    let children = this._children();
    if (typeof SfpStore !== 'undefined') {
      const benIds = new Set(SfpStore.listBeneficiaries().map(b => String(b.childId)));
      const inSection = children.filter(c => benIds.has(String(c.id)));
      if (inSection.length) children = inSection;
    }

    const receipts = children.map(c => {
      const id = String(c.id);
      const parentEl = document.querySelector(`.alt-parent[data-id="${c.id}"]`);
      const qtyEl = document.querySelector(`.alt-qty[data-id="${c.id}"]`);
      const recvEl = document.querySelector(`.alt-received[data-id="${c.id}"]`);
      const sigEl = document.querySelector(`.alt-signed[data-id="${c.id}"]`);
      return {
        childId: c.id,
        childName: c.name,
        parentName: parentEl ? parentEl.value : (c.parentName || ''),
        quantity: qtyEl ? (parseInt(qtyEl.value, 10) || 0) : this.quantityDefault,
        received: !!(recvEl && recvEl.checked),
        parentSigned: !!(sigEl && sigEl.checked)
      };
    });

    const result = SfpStore.saveAltDelivery({
      deliveryNumber: isNaN(deliveryNumber) ? null : deliveryNumber,
      actualDate: date,
      particulars,
      receipts
    });
    if (!result.ok) {
      alert(result.error || 'Could not save.');
      return;
    }
    this.altDate = date;
    if (!isNaN(deliveryNumber)) this.deliveryNumber = deliveryNumber;
    const nRecv = receipts.filter(r => r.received).length;
    this._toast('NUTRICombo delivery saved — ' + nRecv + ' received (' + date + ')');
    this._draw();
  },

  _toast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }
};

if (typeof window !== 'undefined') window.TeacherFeeding = TeacherFeeding;
