/**
 * Teacher Reports — parent-friendly progress reports from ECCD assessments.
 * Teacher reviews the draft, edits notes/tips, then approves for the Parent Portal.
 */

function reportFill(val, blank) {
  blank = blank || '______________';
  if (val != null && String(val).trim() !== '' && String(val) !== blank && !/^_+$/.test(String(val).trim())) {
    return '<strong class="report-fill">' + String(val) + '</strong>';
  }
  return '<strong class="report-blank">' + blank + '</strong>';
}

const TeacherReports = {
  tab: 'eccd', // eccd | sfp

  render(container) {
    this._container = container;
    if (typeof SfpStore !== 'undefined') SfpStore.ensureSeed();
    const draw = function () { TeacherReports._draw(); };
    const load = async function () {
      if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
        await ChildrenRemote.ensureLoaded();
      } else if (typeof ChildRegistry !== 'undefined') {
        ChildRegistry.ensureMerged();
      }
      // Pull assessments from server so Open period buttons appear after refresh
      if (typeof AssessmentRemote !== 'undefined' && AssessmentRemote.online() &&
          typeof AssessmentStore !== 'undefined' && AssessmentStore.hydrateForChild) {
        const kids = (typeof SampleChildren !== 'undefined') ? SampleChildren : [];
        for (let i = 0; i < kids.length; i++) {
          try { await AssessmentStore.hydrateForChild(kids[i].id); } catch (e) { /* ignore */ }
        }
      }
      if (typeof ReportRemote !== 'undefined' && ReportRemote.online() &&
          typeof ReportStore !== 'undefined' && ReportStore.hydrateForChild) {
        const kids = (typeof SampleChildren !== 'undefined') ? SampleChildren : [];
        for (let i = 0; i < kids.length; i++) {
          try { await ReportStore.hydrateForChild(kids[i].id); } catch (e) { /* ignore */ }
        }
      }
    };
    load().then(draw).catch(draw);
  },

  setTab(key) {
    this.tab = key;
    this._draw();
  },

  _draw() {
    const tabs = [
      { key: 'eccd', label: '📈 ECCD progress (parents)' },
      { key: 'sfp', label: '🍎 SFP / MSWDO' }
    ].map(t => {
      const active = this.tab === t.key;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherReports.setTab('${t.key}')">${t.label}</button>`;
    }).join('');

    const body = this.tab === 'sfp' ? this._sfpReportsHtml() : this._eccdReportsHtml();

    this._container.innerHTML = `
      ${UI.pageHeader('📊 Reports', 'ECCD parent progress reports and SFP forms for MSWDO / liquidation.')}
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">${tabs}</div>
      ${body}
    `;
  },

  _eccdReportsHtml() {
    // Active children only — archived keep prior assessments/reports in storage
    const children = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    const periodOrder = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
    const rows = children.map(c => {
      const history = typeof AssessmentStore !== 'undefined'
        ? AssessmentStore.listForChild(c.id).slice().sort((a, b) =>
            (periodOrder[a.period] || 99) - (periodOrder[b.period] || 99))
        : [];

      if (!history.length) {
        return `
        <tr>
          <td><strong>${c.name}</strong><div class="text-muted" style="font-size:0.8rem;">${c.section} · ${c.ageLabel}</div></td>
          <td>${c.parentName || '—'}</td>
          <td><span class="text-muted">No assessment yet</span>
            <button class="btn" style="background:#e0e0e0;color:#666;margin-left:0.5rem;" disabled>Encode checklist first</button></td>
        </tr>`;
      }

      const periodCells = history.map(h => {
        const rep = typeof ReportStore !== 'undefined' ? ReportStore.get(c.id, h.period) : null;
        let badge = '<span class="text-muted">Ready</span>';
        if (rep && rep.status === 'approved') {
          badge = '<span class="success-text">✓ Approved (editable)</span>';
        } else if (rep && rep.status === 'draft') {
          badge = '<span style="color:var(--orange);">Draft</span>';
        }
        const label = rep && rep.status === 'approved' ? 'Edit ' + h.period : 'Open ' + h.period;
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin:0.25rem 0;flex-wrap:wrap;">
          <strong style="min-width:2.5rem;">${h.period}</strong>
          ${badge}
          ${h.finalized ? '<span class="text-muted" style="font-size:0.78rem;">scores finalized</span>' : ''}
          <button class="btn btn-blue" style="padding:4px 12px;font-size:0.82rem;"
            onclick="TeacherReports.openEditor('${c.id}', '${h.period}')">${label}</button>
        </div>`;
      }).join('');

      return `
        <tr>
          <td><strong>${c.name}</strong><div class="text-muted" style="font-size:0.8rem;">${c.section} · ${c.ageLabel}</div></td>
          <td>${c.parentName || '—'}</td>
          <td>${periodCells}</td>
        </tr>`;
    }).join('');

    return `
      <div class="card">
        <p class="text-muted" style="margin-top:0;">
          Parent progress reports by evaluation period. <strong>Approved reports stay editable</strong>
          so teachers can update tips or notes later and refresh the parent view.
        </p>
        <div class="eccd-table-wrap">
          <table class="eccd-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Parent</th>
                <th>Evaluation periods</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="3">No children loaded.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  _sfpReportsHtml() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : null;
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const hotDays = typeof SfpStore !== 'undefined' ? SfpStore.countHotFeedingDays() : 0;
    const altDays = typeof SfpStore !== 'undefined' ? SfpStore.countAltFeedingDays() : 0;
    const benCount = stats ? stats.beneficiaries.total : 0;
    const today = new Date().toISOString().slice(0, 10);

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">SFP cycle snapshot</h3>
        <p style="margin:0.35rem 0;"><strong>${(cycle && cycle.cycleLabel) || '—'}</strong>
          · SY ${(cycle && cycle.schoolYear) || '—'}
          · ${(cycle && cycle.facilityName) || 'NCDC Medina'}</p>
        <p style="margin:0.35rem 0;">Beneficiaries on file: <strong>${benCount}</strong>
          · Hot meal days logged: <strong>${hotDays}</strong>
          · NUTRICombo deliveries: <strong>${altDays}</strong></p>
        <p class="text-muted" style="margin:0.5rem 0 0;font-size:0.85rem;">
          Counts come from Health → SFP profiles and SFP Feeding logs. Print forms use browser Print → Save as PDF.
        </p>
      </div>

      <div class="dashboard-grid" style="margin-bottom:1rem;">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Certification -A <span class="text-muted" style="font-weight:500;font-size:0.85rem;">Hot meals</span></h3>
          <p class="text-muted" style="font-size:0.88rem;">For liquidation — children who received cooked meals over a period.</p>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Period start</label>
              <input type="date" id="cert-a-start" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Period end</label>
              <input type="date" id="cert-a-end" class="ecc-field-input" value="${today}" />
            </div>
            <div>
              <label class="ecc-field-label">Feeding days (override)</label>
              <input type="number" id="cert-a-days" class="ecc-field-input" min="0" placeholder="Auto: ${hotDays}" />
            </div>
            <div>
              <label class="ecc-field-label"># of children (override)</label>
              <input type="number" id="cert-a-n" class="ecc-field-input" min="0" placeholder="Auto: ${benCount || '—'}" />
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;">
            <button class="btn btn-blue" onclick="TeacherReports.openSfpPrintPicker('packA')">🖨 Print Cert + Matrix -A</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherReports.openSfpPrintPicker('certA')">Cert only</button>
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.openSfpPrintPicker('matrixA')">Matrix only</button>
          </div>
          <p class="text-muted" style="font-size:0.8rem;margin:0.5rem 0 0;">
            Choose one class or all classes before printing. Matrix rows come from SFP Feeding → Hot meal logs.
          </p>
        </div>
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Certification -C <span class="text-muted" style="font-weight:500;font-size:0.85rem;">NUTRICombo</span></h3>
          <p class="text-muted" style="font-size:0.88rem;">For liquidation — alternative meals (NUTRICombo) received.</p>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Period / delivery date</label>
              <input type="date" id="cert-c-date" class="ecc-field-input" value="${today}" />
            </div>
            <div>
              <label class="ecc-field-label">Feeding days (override)</label>
              <input type="number" id="cert-c-days" class="ecc-field-input" min="0" placeholder="Auto: ${altDays}" />
            </div>
            <div>
              <label class="ecc-field-label"># of children (override)</label>
              <input type="number" id="cert-c-n" class="ecc-field-input" min="0" placeholder="Auto: ${benCount || '—'}" />
            </div>
            <div>
              <label class="ecc-field-label">Matrix delivery</label>
              <select id="cert-c-delivery" class="ecc-field-input">
                <option value="">Latest delivery</option>
                ${(typeof SfpStore !== 'undefined' ? SfpStore.listAltDeliveries() : []).map(d =>
                  `<option value="${d.id}">#${d.deliveryNumber != null ? d.deliveryNumber : '—'} · ${d.actualDate} (${(d.receipts||[]).length} children)</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;">
            <button class="btn btn-blue" onclick="TeacherReports.openSfpPrintPicker('packC')">🖨 Print Cert + Matrix -C</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherReports.openSfpPrintPicker('certC')">Cert only</button>
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.openSfpPrintPicker('matrixC')">Matrix only</button>
          </div>
          <p class="text-muted" style="font-size:0.8rem;margin:0.5rem 0 0;">
            Choose one class or all classes before printing. Matrix rows come from NUTRICombo deliveries.
          </p>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">SFP Beneficiary Profile</h3>
        <p class="text-muted" style="font-size:0.88rem;margin-top:0;">
          Print the official-style Beneficiary Profile (Parts I–III). Part I is filled from cycle / worker
          settings; Part II–III from each child’s SFP profile (identity prefilled from enrollment).
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
          <button class="btn btn-blue" onclick="TeacherReports.openBeneficiaryPrintPicker()">🖨 Print beneficiary profile(s)</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Consolidated Report (Figures)</h3>
        <p class="text-muted" style="font-size:0.88rem;margin-top:0;">
          MSWDO format — physical status + nutritional status (entry vs after 6 months).
          Auto-filled from SFP beneficiary flags where available.
        </p>
        <button class="btn btn-blue" onclick="TeacherReports.printConsolidation()">🖨 Print consolidation report</button>
      </div>`;
  },

  /**
   * In-page print preview (no pop-up). Avoids blocked window.open.
   * @param {string} title
   * @param {string} bodyHtml
   * @param {{ paper?: 'a4'|'legal' }} [opts] — a4 = bond A4 (consolidation); legal = long bond (matrices)
   */
  _printWindow(title, bodyHtml, opts) {
    const existing = document.getElementById('sfp-print-overlay');
    if (existing) existing.remove();

    const paper = (opts && opts.paper) || 'a4';
    const paperClass = paper === 'legal' ? 'sfp-print-page--legal' : 'sfp-print-page--a4';
    const paperHint = paper === 'legal' ? 'Long bond (8.5×13 in)' : 'A4 bond · 1 in margins';

    const overlay = document.createElement('div');
    overlay.id = 'sfp-print-overlay';
    overlay.setAttribute('data-paper', paper);
    overlay.innerHTML = `
      <div class="sfp-print-backdrop no-print" onclick="if(event.target===this)TeacherReports.closeSfpPrint()"></div>
      <div class="sfp-print-shell">
        <div class="sfp-print-toolbar no-print">
          <strong style="color:white;flex:1;">${title}</strong>
          <span style="color:rgba(255,255,255,0.9);font-size:0.85rem;">${paperHint}</span>
          <button class="btn" style="background:white;color:var(--primary-dark);" onclick="TeacherReports.doSfpPrint()">🖨 Print / Save as PDF</button>
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.closeSfpPrint()">Close</button>
        </div>
        <div class="sfp-print-page ${paperClass}" id="sfp-print-page">
          ${bodyHtml}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('sfp-print-open');
    if (paper === 'legal') document.body.classList.add('sfp-print-legal');
    else document.body.classList.add('sfp-print-a4');
  },

  doSfpPrint() {
    window.print();
  },

  closeSfpPrint() {
    const el = document.getElementById('sfp-print-overlay');
    if (el) el.remove();
    document.body.classList.remove('sfp-print-open', 'sfp-print-a4', 'sfp-print-legal');
  },

  _cycleMeta() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    const tp = typeof TeacherStore !== 'undefined' ? TeacherStore.get() : {};
    const teacherName = (typeof TeacherStore !== 'undefined' && TeacherStore.workerName)
      ? TeacherStore.workerName()
      : '';
    return {
      cycle: cycle || {},
      province: (cycle && cycle.province) || tp.province || 'MISAMIS ORIENTAL',
      municipality: (cycle && cycle.municipality) || tp.municipality || 'MEDINA',
      barangay: (cycle && cycle.barangay) || tp.barangay || '',
      district: (cycle && cycle.district) || tp.district || '',
      facility: (cycle && cycle.facilityName) || tp.centerName || 'National Child Development Center — Medina',
      facilityAddress: tp.address || '',
      worker: (cycle && cycle.workerName) || teacherName || '',
      startDate: (cycle && cycle.startDate) || '',
      cycleLabel: (cycle && (cycle.cycleLabel || cycle.cycleNumber)) || '15th',
      schoolYear: (cycle && cycle.schoolYear) || ''
    };
  },

  /** Official parent name only (mother → father). Never guardian / parentName alone. */
  _officialParentName(child) {
    if (!child) return '';
    const fromProfile = (prof) => {
      if (!prof) return '';
      const mid = (prof.middleInitial || '').trim();
      const parts = [
        (prof.firstName || '').trim(),
        mid ? (mid.length === 1 ? mid + '.' : mid) : '',
        (prof.lastName || '').trim()
      ].filter(Boolean);
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    };
    const mother = fromProfile(child.motherProfile) || String(child.motherName || '').trim();
    if (mother) return mother;
    const father = fromProfile(child.fatherProfile) || String(child.fatherName || '').trim();
    return father || '';
  },

  _sectionOptions() {
    if (typeof ClassStore !== 'undefined' && ClassStore.listActive) {
      return ClassStore.listActive().map(c => ({
        key: c.key,
        label: c.name || c.label || c.key
      }));
    }
    return [
      { key: 'explorers', label: 'Little Explorers' },
      { key: 'stars', label: 'Little Stars' },
      { key: 'sunshine', label: 'Sunshine Group' }
    ];
  },

  _sectionLabel(key) {
    const s = this._sectionOptions().find(x => x.key === key);
    return s ? s.label : (key || 'All classes');
  },

  /** Beneficiaries limited to one section (by child's sectionKey), or all if sectionKey is null.
   *  Archived children are excluded from operational SFP lists (history stays in storage). */
  _beneficiariesForSection(sectionKey) {
    const bens = typeof SfpStore !== 'undefined' ? SfpStore.listBeneficiaries() : [];
    const list = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    const activeIds = new Set(list.map(c => String(c.id)));
    let out = bens.filter(b => activeIds.has(String(b.childId)));
    if (!sectionKey) return out;
    return out.filter(b => {
      const c = list.find(x => String(x.id) === String(b.childId));
      return c && c.sectionKey === sectionKey;
    });
  },

  _childSectionKey(childId) {
    const c = (typeof SampleChildren !== 'undefined' ? SampleChildren : [])
      .find(x => String(x.id) === String(childId));
    return c ? c.sectionKey : null;
  },

  /**
   * @param {{ sectionKey?: string|null }} opts
   * sectionKey = one class; null/undefined = all beneficiaries (center-wide).
   */
  _certABodyHtml(opts) {
    opts = opts || {};
    const sectionKey = opts.sectionKey != null && opts.sectionKey !== '' ? opts.sectionKey : null;
    const meta = this._cycleMeta();
    const bens = this._beneficiariesForSection(sectionKey);
    const hotDays = typeof SfpStore !== 'undefined' ? SfpStore.countHotFeedingDays() : 0;
    const nEl = document.getElementById('cert-a-n');
    const dEl = document.getElementById('cert-a-days');
    const start = (document.getElementById('cert-a-start') || {}).value || '________';
    const end = (document.getElementById('cert-a-end') || {}).value || '________';
    // Override applies only for single all-center print without section split
    const useOverride = !sectionKey && nEl && nEl.value;
    const n = useOverride ? nEl.value : (bens.length || '____');
    const days = (dEl && dEl.value) ? dEl.value : (hotDays || '____');
    const periodLine = (start && start !== '________') || (end && end !== '________')
      ? `${start} to ${end}`
      : '________________________';
    const classLine = sectionKey
      ? `<p class="cert-body" style="margin-top:0;margin-bottom:10px;"><strong>Class / Section:</strong> ${this._sectionLabel(sectionKey)}</p>`
      : `<p class="cert-body" style="margin-top:0;margin-bottom:10px;"><strong>Class / Section:</strong> All classes</p>`;
    return `
      ${this._dswdCertHeader('-A')}
      <h2 class="cert-title">CERTIFICATION</h2>
      ${classLine}
      <p class="cert-body">
        This is to certify that the total <u>&nbsp;&nbsp;<strong>${n}</strong>&nbsp;&nbsp;</u>
        (<em># OF CHILDREN</em>) Day Care Children have received and
        consumed the foods prepared and served at
        <u>&nbsp;&nbsp;<strong>${meta.facility}</strong>&nbsp;&nbsp;</u>
        (<em>(NAME OF CHILD DEVELOPMENT CENTER/SNP)</em>
        for the period of
        <u>&nbsp;&nbsp;<strong>${periodLine}</strong>&nbsp;&nbsp;</u>
        (<em>(DATE OF FEEDING-ONCE A DAY FEEDING)</em>
        for a total of <u>&nbsp;&nbsp;<strong>${days}</strong>&nbsp;&nbsp;</u> feeding days.
      </p>
      <p class="cert-body" style="margin-top:18px;">
        This certification is issued for liquidation purposes only.
        (For the ${meta.cycleLabel} cycle implementation)
      </p>
      <div class="sig cert-sig">
        <div><br><br><br>_________________________<br><strong>Signature over Printed name of CDW</strong></div>
        <div><br><br><br>_________________________<br><strong>Signature over Printed name of<br>CDWF / C/MSWDO</strong></div>
      </div>
      ${this._dswdCertFooter()}`;
  },

  _certCBodyHtml(opts) {
    opts = opts || {};
    const sectionKey = opts.sectionKey != null && opts.sectionKey !== '' ? opts.sectionKey : null;
    const meta = this._cycleMeta();
    const bens = this._beneficiariesForSection(sectionKey);
    const altDays = typeof SfpStore !== 'undefined' ? SfpStore.countAltFeedingDays() : 0;
    const nEl = document.getElementById('cert-c-n');
    const dEl = document.getElementById('cert-c-days');
    const date = (document.getElementById('cert-c-date') || {}).value || '________';
    const useOverride = !sectionKey && nEl && nEl.value;
    const n = useOverride ? nEl.value : (bens.length || '____');
    const days = (dEl && dEl.value) ? dEl.value : (altDays || '____');
    const classLine = sectionKey
      ? `<p class="cert-body" style="margin-top:0;margin-bottom:10px;"><strong>Class / Section:</strong> ${this._sectionLabel(sectionKey)}</p>`
      : `<p class="cert-body" style="margin-top:0;margin-bottom:10px;"><strong>Class / Section:</strong> All classes</p>`;
    return `
      ${this._dswdCertHeader('-C')}
      <h2 class="cert-title">CERTIFICATION</h2>
      ${classLine}
      <p class="cert-body">
        This is to certify that the total <u>&nbsp;&nbsp;<strong>${n}</strong>&nbsp;&nbsp;</u>
        (<em># OF CHILDREN</em>) Day Care Children have received and
        consumed alternative meals (NUTRICombo) at
        <u>&nbsp;&nbsp;<strong>${meta.facility}</strong>&nbsp;&nbsp;</u>
        (<em>(NAME OF CHILD DEVELOPMENT CENTER/SNP)</em>
        for the period of
        <u>&nbsp;&nbsp;<strong>${date}</strong>&nbsp;&nbsp;</u>
        (<em>(DATE OF FEEDING-ONCE A DAY FEEDING)</em>
        for a total of <u>&nbsp;&nbsp;<strong>${days}</strong>&nbsp;&nbsp;</u> feeding days.
      </p>
      <p class="cert-body" style="margin-top:18px;">
        This certification is issued for liquidation purposes only.
        (For the ${meta.cycleLabel} cycle implementation)
      </p>
      <div class="sig cert-sig">
        <div><br><br><br>_________________________<br><strong>Signature over Printed name of CDW</strong></div>
        <div><br><br><br>_________________________<br><strong>Signature over Printed name of<br>CDWF / C/MSWDO</strong></div>
      </div>
      ${this._dswdCertFooter()}`;
  },

  _matrixAHtml(opts) {
    opts = opts || {};
    const sectionKey = opts.sectionKey != null && opts.sectionKey !== '' ? opts.sectionKey : null;
    const meta = this._cycleMeta();
    const bens = this._beneficiariesForSection(sectionKey);
    const nEl = document.getElementById('cert-a-n');
    const useOverride = !sectionKey && nEl && nEl.value;
    const n = useOverride ? nEl.value : (bens.length || '');
    const days = typeof SfpStore !== 'undefined' ? SfpStore.listHotMealDays() : [];
    const start = (document.getElementById('cert-a-start') || {}).value || '';
    const end = (document.getElementById('cert-a-end') || {}).value || '';
    let filtered = days;
    if (start) filtered = filtered.filter(d => !d.actualDate || d.actualDate >= start);
    if (end) filtered = filtered.filter(d => !d.actualDate || d.actualDate <= end);

    // When a section is selected, note fed counts from childStatuses for that section
    const sectionIds = sectionKey
      ? new Set(bens.map(b => String(b.childId)))
      : null;

    const rows = filtered.length
      ? filtered.map(d => {
          const items = (d.commoditiesNote || '').trim()
            || (d.menuLabel ? d.menuLabel : '—');
          const itemsHtml = String(items).split(/[,;]+/).map(s => s.trim()).filter(Boolean)
            .map(s => `<div>${s}</div>`).join('') || '—';
          let sectionNote = '';
          if (sectionIds && Array.isArray(d.childStatuses) && d.childStatuses.length) {
            const fed = d.childStatuses.filter(cs =>
              sectionIds.has(String(cs.childId)) && cs.status === 'fed'
            ).length;
            const total = d.childStatuses.filter(cs => sectionIds.has(String(cs.childId))).length;
            if (total) sectionNote = `<div style="font-size:9px;color:#555;margin-top:2px;">Fed ${fed}/${total} in section</div>`;
          }
          return `<tr>
            <td style="text-align:center;font-weight:700;">${d.dayNumber}</td>
            <td style="text-align:center;">${d.actualDate || ''}</td>
            <td style="font-size:11px;">${itemsHtml}</td>
            <td style="font-size:11px;">${d.menuLabel || '—'}${sectionNote}</td>
            <td style="font-size:10px;">${d.committeeNote || ''}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="5" style="text-align:center;padding:16px;">No hot meal logs for this period.
           Encode days under <em>SFP Feeding → Hot meal log</em>.</td></tr>`;

    const classLine = sectionKey ? this._sectionLabel(sectionKey) : 'All classes';

    return `
      ${this._dswdCertHeader('-A')}
      <h2 class="cert-title" style="font-size:14px;text-decoration:none;">
        National Child Development Center — Medina<br>
        <span style="font-size:12px;font-weight:600;">Supplementary Feeding Program ${meta.cycleLabel} Cycle Implementation</span>
      </h2>
      <h3 style="text-align:center;margin:6px 0 10px;font-size:13px;">FOOD ALLOCATION MATRIX — HOT MEALS</h3>
      <table class="sfp-meta-table">
        <tr><td><strong>Province:</strong> ${meta.province}</td>
            <td><strong>City/Municipality:</strong> ${meta.municipality}</td></tr>
        <tr><td><strong>Location/Barangay:</strong> ${reportFill(meta.barangay , '______________')}</td>
            <td><strong>Number of Children beneficiaries:</strong> ${reportFill(n , '____')}</td></tr>
        <tr><td colspan="2"><strong>Name of Child Development Center:</strong> ${meta.facility}</td></tr>
        <tr><td><strong>Class / Section:</strong> ${classLine}</td>
            <td><strong>Date started the feeding:</strong> ${reportFill(meta.startDate , '______________')}</td></tr>
        <tr><td colspan="2"><strong>Name of Child Development Worker:</strong> ${reportFill(meta.worker , '______________')}</td></tr>
      </table>
      <table class="sfp-matrix-table">
        <thead>
          <tr>
            <th style="width:8%;">DAY OF FEEDING</th>
            <th style="width:12%;">ACTUAL DATE OF FEEDING</th>
            <th style="width:28%;">ITEMS/FOODS RECEIVED</th>
            <th style="width:28%;">MENU</th>
            <th style="width:24%;">FOOD COMMITTEE / DCSPG NAME AND SIGNATURE</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sig cert-sig" style="margin-top:28px;">
        <div>_________________________<br><strong>Prepared by:</strong><br>CDW / DCSPG President</div>
        <div>_________________________<br><strong>Reviewed by:</strong><br>C/MSWDO / Focal Person / CDW Federated President</div>
      </div>
      ${this._dswdCertFooter()}`;
  },

  _matrixCHtml(opts) {
    opts = opts || {};
    const sectionKey = opts.sectionKey != null && opts.sectionKey !== '' ? opts.sectionKey : null;
    const meta = this._cycleMeta();
    const deliveries = typeof SfpStore !== 'undefined' ? SfpStore.listAltDeliveries() : [];
    const selId = (document.getElementById('cert-c-delivery') || {}).value || '';
    let delivery = null;
    if (selId) delivery = deliveries.find(d => d.id === selId) || null;
    if (!delivery && deliveries.length) delivery = deliveries[deliveries.length - 1];

    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const childById = {};
    children.forEach(c => { childById[String(c.id)] = c; });

    const nEl = document.getElementById('cert-c-n');
    const useOverride = !sectionKey && nEl && nEl.value;

    // Prefer receipts on the selected delivery; if empty, merge all deliveries for the cycle
    let receipts = (delivery && delivery.receipts) ? delivery.receipts.slice() : [];
    if (!receipts.length && deliveries.length) {
      const map = {};
      deliveries.forEach(d => {
        (d.receipts || []).forEach(r => {
          if (r && r.childId != null) map[String(r.childId)] = Object.assign({ _fromDate: d.actualDate }, r);
        });
      });
      receipts = Object.values(map);
      if (!delivery && deliveries.length) delivery = deliveries[deliveries.length - 1];
    }

    // Filter by child's class (not only SFP beneficiary list — receipts may include section kids)
    if (sectionKey) {
      receipts = receipts.filter(r => {
        const c = r.childId != null ? childById[String(r.childId)] : null;
        if (c) return c.sectionKey === sectionKey;
        const byName = children.find(x => x.name === r.childName);
        return byName && byName.sectionKey === sectionKey;
      });
    }

    // Sort: section then name (stable for "all")
    receipts.sort((a, b) => {
      const ca = a.childId != null ? childById[String(a.childId)] : null;
      const cb = b.childId != null ? childById[String(b.childId)] : null;
      const sa = (ca && ca.sectionKey) || '';
      const sb = (cb && cb.sectionKey) || '';
      if (sa !== sb) return sa.localeCompare(sb);
      return String(a.childName || '').localeCompare(String(b.childName || ''));
    });

    const nBen = useOverride
      ? nEl.value
      : (receipts.length || this._beneficiariesForSection(sectionKey).length || '');

    let rows = '';
    if (receipts.length) {
      rows = receipts.map(r => {
        const sig = r.parentSigned ? '(Signed)' : '';
        const c = r.childId != null ? childById[String(r.childId)] : null;
        const secNote = (!sectionKey && c && c.section)
          ? `<div style="font-size:9px;color:#666;">${c.section}</div>`
          : '';
        return `<tr>
          <td style="font-size:10px;">${(delivery && delivery.particulars) || 'NUTRI-COMBO'}</td>
          <td style="text-align:center;">${r.quantity != null ? r.quantity : ''}</td>
          <td>${r.childName || r.childId || ''}${secNote}</td>
          <td>${r.parentName || ''}</td>
          <td style="text-align:center;font-size:10px;">${sig}</td>
        </tr>`;
      }).join('');
    } else {
      rows = `<tr><td colspan="5" style="text-align:center;padding:16px;">No NUTRICombo receipts
        ${sectionKey ? 'for this class' : ''} found.
        Save under <em>SFP Feeding → NUTRICombo</em> for each class (same date merges into one delivery).</td></tr>`;
    }

    const delNum = delivery && delivery.deliveryNumber != null ? delivery.deliveryNumber : '____';
    const delDate = delivery && delivery.actualDate ? delivery.actualDate : '______________';
    const classLine = sectionKey ? this._sectionLabel(sectionKey) : 'All classes';

    return `
      ${this._dswdCertHeader('-C')}
      <h2 class="cert-title" style="font-size:14px;text-decoration:none;">
        National Child Development Center — Medina<br>
        <span style="font-size:12px;font-weight:600;">Supplementary Feeding Program ${meta.cycleLabel} Cycle Implementation</span>
      </h2>
      <h3 style="text-align:center;margin:6px 0 4px;font-size:13px;">FOOD ALLOCATION MATRIX — ${delNum} DELIVERY</h3>
      <p style="text-align:center;margin:0 0 10px;font-size:11px;">
        <strong>ALTERNATIVE MEAL — NUTRI COMBO</strong> (High Protein Cookie 60g &amp; Nutri Juice 200mL)
      </p>
      <table class="sfp-meta-table">
        <tr><td><strong>Province:</strong> ${meta.province}</td>
            <td><strong>City/Municipality:</strong> ${meta.municipality}</td></tr>
        <tr><td><strong>Location/Barangay:</strong> ${reportFill(meta.barangay , '______________')}</td>
            <td><strong>Number of Children beneficiaries:</strong> ${reportFill(nBen , '____')}</td></tr>
        <tr><td colspan="2"><strong>Name of Child Development Center:</strong> ${meta.facility}</td></tr>
        <tr><td><strong>Class / Section:</strong> ${classLine}</td>
            <td><strong>Date of actual feeding:</strong> ${delDate}</td></tr>
        <tr><td><strong>Name of Child Development Worker:</strong> ${reportFill(meta.worker , '______________')}</td>
            <td><strong>Date started (${meta.cycleLabel} cycle):</strong> ${reportFill(meta.startDate , '______________')}</td></tr>
      </table>
      <table class="sfp-matrix-table">
        <thead>
          <tr>
            <th style="width:22%;">PARTICULARS</th>
            <th style="width:10%;">QUANTITY</th>
            <th style="width:26%;">NAME OF CHILD</th>
            <th style="width:26%;">NAME OF PARENT/GUARDIAN</th>
            <th style="width:16%;">SIGNATURE</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sig cert-sig" style="margin-top:28px;">
        <div>_________________________<br><strong>Prepared by:</strong><br>CDW / DCSPG President</div>
        <div>_________________________<br><strong>Reviewed by:</strong><br>C/MSWDO / Focal Person / CDW Federated President</div>
      </div>
      ${this._dswdCertFooter()}`;
  },

  /**
   * Print picker for Cert / Matrix -A and -C.
   * kind: certA | matrixA | packA | certC | matrixC | packC
   */
  openSfpPrintPicker(kind) {
    const existing = document.getElementById('sfp-section-print-picker');
    if (existing) existing.remove();

    const labels = {
      certA: 'Print Certification -A (hot meals)',
      matrixA: 'Print Food Allocation Matrix -A',
      packA: 'Print Cert + Matrix -A',
      certC: 'Print Certification -C (NUTRICombo)',
      matrixC: 'Print Food Allocation Matrix -C',
      packC: 'Print Cert + Matrix -C'
    };
    const title = labels[kind] || 'Print SFP form';
    const sectionOpts = this._sectionOptions().map(s =>
      `<option value="${s.key}">${s.label}</option>`
    ).join('');

    const html =
      `<div id="sfp-section-print-picker" class="bs-overlay no-print">
        <div class="bs-modal-panel" style="max-width:440px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.1rem;color:white;">${title}</h2>
            <button type="button" class="bs-modal-close" onclick="document.getElementById('sfp-section-print-picker').remove()">×</button>
          </div>
          <div class="bs-modal-body">
            <p style="margin-top:0;font-size:0.9rem;">
              <strong>One section</strong> — only that class’s children.<br>
              <strong>All sections</strong> — one combined list of every child (not separate pages per class).
            </p>
            <label class="ecc-field-label">Sections to print</label>
            <select id="sfp-print-scope" class="ecc-field-input">
              <option value="one">One section only</option>
              <option value="all">All sections (one combined list)</option>
            </select>
            <div id="sfp-print-section-wrap" style="margin-top:0.75rem;">
              <label class="ecc-field-label">Section</label>
              <select id="sfp-print-section" class="ecc-field-input">${sectionOpts}</select>
            </div>
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;flex-wrap:wrap;">
            <button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById('sfp-section-print-picker').remove()">Cancel</button>
            <button type="button" class="btn btn-blue" onclick="TeacherReports.confirmSfpPrint('${kind}')">🖨 Print</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const scopeEl = document.getElementById('sfp-print-scope');
    const wrap = document.getElementById('sfp-print-section-wrap');
    if (scopeEl && wrap) {
      scopeEl.addEventListener('change', () => {
        wrap.style.display = scopeEl.value === 'all' ? 'none' : 'block';
      });
    }
  },

  confirmSfpPrint(kind) {
    const scopeEl = document.getElementById('sfp-print-scope');
    const secEl = document.getElementById('sfp-print-section');
    const mode = scopeEl ? scopeEl.value : 'one';
    const sectionKey = secEl ? secEl.value : null;
    const picker = document.getElementById('sfp-section-print-picker');
    if (picker) picker.remove();

    if (mode === 'one' && !sectionKey) {
      alert('No section selected.');
      return;
    }

    // "all" → one combined matrix/cert (sectionKey null), not one page per class
    this._runSfpPrint(kind, { mode, sectionKey: mode === 'all' ? null : sectionKey });
  },

  /**
   * @param {string} kind
   * @param {{ mode: 'one'|'all', sectionKey?: string|null }} scope
   * - one: single class filter
   * - all: one combined document (all children), not one page per class
   */
  _runSfpPrint(kind, scope) {
    const isAll = scope && scope.mode === 'all';
    const opts = {
      sectionKey: isAll ? null : (scope && scope.sectionKey) || null
    };
    const parts = [];

    if (kind === 'certA') {
      parts.push(`<div class="sfp-print-section">${this._certABodyHtml(opts)}</div>`);
    } else if (kind === 'matrixA') {
      parts.push(`<div class="sfp-print-section">${this._matrixAHtml(opts)}</div>`);
    } else if (kind === 'packA') {
      parts.push(`<div class="sfp-print-section">${this._certABodyHtml(opts)}</div>`);
      parts.push('<div class="sfp-page-break"></div>');
      parts.push(`<div class="sfp-print-section">${this._matrixAHtml(opts)}</div>`);
    } else if (kind === 'certC') {
      parts.push(`<div class="sfp-print-section">${this._certCBodyHtml(opts)}</div>`);
    } else if (kind === 'matrixC') {
      parts.push(`<div class="sfp-print-section">${this._matrixCHtml(opts)}</div>`);
    } else if (kind === 'packC') {
      parts.push(`<div class="sfp-print-section">${this._certCBodyHtml(opts)}</div>`);
      parts.push('<div class="sfp-page-break"></div>');
      parts.push(`<div class="sfp-print-section">${this._matrixCHtml(opts)}</div>`);
    }

    const titles = {
      certA: 'SFP Certification -A',
      matrixA: 'SFP Food Allocation Matrix -A',
      packA: 'SFP Cert + Matrix -A',
      certC: 'SFP Certification -C',
      matrixC: 'SFP Food Allocation Matrix -C',
      packC: 'SFP Cert + Matrix -C'
    };
    const suffix = isAll
      ? ' (all classes)'
      : (opts.sectionKey ? ` (${this._sectionLabel(opts.sectionKey)})` : '');
    // Matrices (and packs that include them) use long bond; certificates stay A4
    const paper = (kind === 'matrixA' || kind === 'matrixC' || kind === 'packA' || kind === 'packC')
      ? 'legal'
      : 'a4';
    this._printWindow((titles[kind] || 'SFP form') + suffix, parts.join(''), { paper });
  },

  // Back-compat wrappers (open picker)
  printMatrixA() { this.openSfpPrintPicker('matrixA'); },
  printMatrixC() { this.openSfpPrintPicker('matrixC'); },
  printPackA() { this.openSfpPrintPicker('packA'); },
  printPackC() { this.openSfpPrintPicker('packC'); },
  printCertA() { this.openSfpPrintPicker('certA'); },
  printCertC() { this.openSfpPrintPicker('certC'); },

  /** Resolve identity: SFP snapshot first, then child profile. Parent = official parent only. */
  _benIdentity(child, sfp) {
    sfp = sfp || {};
    const a = (child && child.address) || {};
    const addrDefault = [a.purok, a.barangay, a.municipality || 'Medina', a.province || 'Misamis Oriental']
      .filter(Boolean).join(', ');
    const officialParent = this._officialParentName(child);
    return {
      name: sfp.beneficiaryName || (child && child.name) || '—',
      sex: sfp.beneficiarySex || (child && child.sex) || '—',
      birthDate: sfp.beneficiaryBirthDate || (child && child.birthDate) || '—',
      ageLabel: sfp.beneficiaryAgeLabel || (child && child.ageLabel) || '—',
      address: sfp.beneficiaryAddress || addrDefault || '—',
      // Prefer saved SFP parent line; else official mother/father only (not guardian)
      parentName: sfp.parentGuardianName || officialParent || '—',
      section: (child && (child.section || child.sectionKey)) || '—'
    };
  },

  _yn(v) {
    if (v === true || v === 'Yes') return 'Yes';
    if (v === false || v === 'No') return 'No';
    return '—';
  },

  /**
   * One child Beneficiary Profile — layout aligned to the paper SFP form.
   * Part I = worker/facility. Part II–III = child + parent + consent.
   */
  _beneficiaryProfileHtml(child, sfp) {
    sfp = sfp || {};
    const meta = this._cycleMeta();
    const cycle = meta.cycle || {};
    const idn = this._benIdentity(child, sfp);
    const box = (v, yes) => {
      const on = v === true || v === 'Yes';
      if (yes) return on ? '☑' : '☐';
      return on ? '☐' : (v === false || v === 'No' ? '☑' : '☐');
    };
    const line = (val, minW) => {
      const t = (val && String(val) !== '—') ? String(val) : '';
      return '<span style="display:inline-block;min-width:' + (minW || '8rem') +
        ';border-bottom:1px solid #222;padding:0 4px 1px;">' + (t || '&nbsp;') + '</span>';
    };
    const cat = cycle.facilityCategory || 'CDC';
    const wash = cycle.withWashFacility;
    const garden = cycle.withCommunityGarden;
    const regDate = (child && (child.enrolledAt || child.registeredAt || child.createdAt))
      ? String(child.enrolledAt || child.registeredAt || child.createdAt).slice(0, 10)
      : '';

    return `
      <div class="sfp-print-section ben-profile-sheet">
        <div class="ben-profile-head">
          <div class="ben-profile-rep">Republic of the Philippines</div>
          <div class="ben-profile-lgu">Municipality of Medina · Misamis Oriental</div>
          <div class="ben-profile-title">
            SUPPLEMENTARY FEEDING PROGRAM BENEFICIARY PROFILE
          </div>
        </div>

        <div class="ben-profile-part">
          Part I - (FOR CHILD DEVELOPMENT WORKER ONLY - DO NOT FILL OUT)
        </div>
        <div style="margin-bottom:2px;">
          Province: ${line(meta.province || 'Misamis Oriental', '10rem')}
          &nbsp; District: ${line(meta.district, '6rem')}
          &nbsp; City/Municipality: ${line(meta.municipality || 'Medina', '8rem')}
        </div>
        <div style="margin-bottom:2px;">
          Barangay: ${line(meta.barangay, '10rem')}
          &nbsp; Name of Facility: ${line(meta.facility, '16rem')}
        </div>
        ${meta.facilityAddress ? `<div style="margin-bottom:2px;">Facility address: ${line(meta.facilityAddress, '22rem')}</div>` : ''}
        <div style="margin-bottom:2px;">
          Date of Registration: ${line(regDate, '8rem')}
          &nbsp; Facility Category:
          ${cat === 'CDC' ? '☑' : '☐'} CDC &nbsp; ${cat === 'SNP' ? '☑' : '☐'} SNP
        </div>
        <div style="margin-bottom:2px;">
          Complete Name of CDC/SNP Worker: ${line(meta.worker, '18rem')}
        </div>
        <div style="margin-bottom:8px;">
          With Wash Facility: ${wash === true ? '☑' : '☐'} Yes &nbsp; ${wash === false ? '☑' : '☐'} No
          &nbsp;&nbsp; With Community Garden: ${garden === true ? '☑' : '☐'} Yes &nbsp; ${garden === false ? '☑' : '☐'} No
        </div>

        <div class="ben-profile-part">
          Part II - (FOR PARENTS)
        </div>
        <div style="font-weight:700;margin:4px 0;">I.&nbsp;&nbsp;Child Information:</div>
        <div style="margin-bottom:2px;">
          Complete Name of Beneficiary: ${line(idn.name, '16rem')}
          &nbsp; Sex (M/F): ${line(idn.sex, '4rem')}
        </div>
        <div style="margin-bottom:2px;">
          Address: ${line(idn.address, '28rem')}
        </div>
        <div style="margin-bottom:2px;">
          Does the child have diagnosed disability:
          ${box(sfp.disability, true)} Yes &nbsp; ${box(sfp.disability, false)} No
        </div>
        <div style="margin-bottom:2px;">
          If yes, please indicate specific disability: ${line(sfp.disabilitySpecify, '18rem')}
        </div>
        <div style="margin-bottom:2px;">
          Child of Solo Parent: ${box(sfp.soloParent, true)} Yes &nbsp; ${box(sfp.soloParent, false)} No
          &nbsp;&nbsp; Child Monitored Under EO 70: ${box(sfp.eo70, true)} Yes &nbsp; ${box(sfp.eo70, false)} No
        </div>
        <div style="margin-bottom:2px;">
          Date of Birth (MM/DD/YYYY): ${line(idn.birthDate, '8rem')}
          &nbsp; Age of Child in Years: ${line(idn.ageLabel, '6rem')}
        </div>
        <div style="margin-bottom:2px;">
          Date of Weighing (MM/DD/YYYY): ${line(sfp.entryWeighDate, '8rem')}
          &nbsp; Height (in cm): ${line(sfp.entryHeightCm != null ? sfp.entryHeightCm : '', '4rem')}
          &nbsp; Weight (in kg): ${line(sfp.entryWeightKg != null ? sfp.entryWeightKg : '', '4rem')}
        </div>
        <div style="margin-bottom:8px;">
          Has the child been dewormed? ${box(sfp.dewormed, true)} Yes &nbsp; ${box(sfp.dewormed, false)} No
          &nbsp;&nbsp; Received Vitamin A Supplement? ${box(sfp.vitaminA, true)} Yes &nbsp; ${box(sfp.vitaminA, false)} No
        </div>

        <div style="font-weight:700;margin:8px 0 4px;">II.&nbsp;&nbsp;Parent or Guardian Information:</div>
        <div style="margin-bottom:2px;">
          Complete Name of Parent/Guardian: ${line(idn.parentName, '16rem')}
          &nbsp; Sex (M/F): ${line(sfp.parentSex, '4rem')}
        </div>
        <div style="margin-bottom:2px;">
          PSN/PhilSys Number: ${line(sfp.parentPsn, '12rem')}
        </div>
        <div style="margin-bottom:2px;">
          Source of Income (Employed/Self Employed): ${line(sfp.incomeSource, '14rem')}
        </div>
        <div style="margin-bottom:2px;">
          Indigenous People Affiliation: ${line(sfp.indigenousAffiliation, '12rem')}
          &nbsp; 4Ps/MCCT ID No.: ${line(sfp.fourPsId, '8rem')}
        </div>
        <div style="margin-bottom:2px;">
          Person with Disability: ${box(sfp.parentPwd, true)} Yes &nbsp; ${box(sfp.parentPwd, false)} No
          &nbsp;&nbsp; Previously attended FDS: ${box(sfp.fdsAttended, true)} Yes &nbsp; ${box(sfp.fdsAttended, false)} No
        </div>
        <div style="margin-bottom:10px;">
          If yes, please indicate the Modules of PES completed: ${line(sfp.pesModules, '16rem')}
        </div>

        <div class="ben-profile-part ben-profile-part--iii">
          PART III - CONSENT &amp; CONFIDENTIALITY CLAUSE
        </div>
        <p class="ben-profile-consent">
          All information collected through this intake sheet shall be maintained in a secured database and may
          be processed manually or electronically for the purpose of implementing, monitoring, and evaluating
          the Supplementary Feeding Program (SFP). This includes tracking the nutritional status of children
          beneficiaries, validating parent/guardian information, and coordinating with partner agencies and local
          government units (LGUs) for the effective delivery of services. Further, any controlled disclosure or
          sharing of personal or sensitive personal information with development partners, other government
          agencies, nutrition evaluators, researchers, or other stakeholders shall be carried out in accordance
          with the Data Privacy Act of 2012. Your personal data may also be validated against existing
          databases of other social welfare and protection programs to ensure accurate targeting and avoid
          duplication of benefits. You have the right to the processing of your personal data, the right to access
          your personal data that we will process, and the right to have your personal data corrected.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-top:12px;">
          <div style="flex:1;">
            <div style="margin-bottom:4px;">${sfp.consent ? '☑' : '☐'} I agree to participate in this assessment and</div>
            <div style="padding-left:1.1rem;">allow my answers to be used as indicated above.</div>
          </div>
          <div style="text-align:center;min-width:12rem;">
            <div style="border-bottom:1px solid #222;min-height:1.4rem;margin-bottom:2px;font-weight:600;">
              ${sfp.consentName || '&nbsp;'}
            </div>
            <div style="font-size:10px;">Signature over Printed Name</div>
            <div style="font-size:10px;margin-top:4px;">Date: ${reportFill(sfp.consentDate, '____________')}</div>
          </div>
        </div>
      </div>`;
  },

  openBeneficiaryPrintPicker() {
    const existing = document.getElementById('sfp-ben-print-picker');
    if (existing) existing.remove();

    const bens = typeof SfpStore !== 'undefined' ? SfpStore.listBeneficiaries() : [];
    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const byId = {};
    children.forEach(c => { byId[String(c.id)] = c; });

    const childOpts = bens.map(b => {
      const c = byId[String(b.childId)];
      const label = (b.beneficiaryName || (c && c.name) || ('Child #' + b.childId)) +
        (c && c.section ? ' · ' + c.section : '');
      return `<option value="${b.childId}">${label}</option>`;
    }).join('');

    const sectionOpts = this._sectionOptions().map(s =>
      `<option value="${s.key}">${s.label}</option>`
    ).join('');

    const html =
      `<div id="sfp-ben-print-picker" class="bs-overlay no-print">
        <div class="bs-modal-panel" style="max-width:460px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.1rem;color:white;">Print Beneficiary Profile</h2>
            <button type="button" class="bs-modal-close" onclick="document.getElementById('sfp-ben-print-picker').remove()">×</button>
          </div>
          <div class="bs-modal-body">
            <p style="margin-top:0;font-size:0.9rem;">
              Print one child, one class, or all enrolled SFP beneficiaries (one profile per page).
            </p>
            <label class="ecc-field-label">Scope</label>
            <select id="ben-print-scope" class="ecc-field-input">
              <option value="one">One child</option>
              <option value="section">One section (all enrolled in class)</option>
              <option value="all">All enrolled beneficiaries</option>
            </select>
            <div id="ben-print-child-wrap" style="margin-top:0.75rem;">
              <label class="ecc-field-label">Child</label>
              <select id="ben-print-child" class="ecc-field-input">
                ${childOpts || '<option value="">No SFP beneficiaries saved yet</option>'}
              </select>
            </div>
            <div id="ben-print-section-wrap" style="margin-top:0.75rem;display:none;">
              <label class="ecc-field-label">Section</label>
              <select id="ben-print-section" class="ecc-field-input">${sectionOpts}</select>
            </div>
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById('sfp-ben-print-picker').remove()">Cancel</button>
            <button type="button" class="btn btn-blue" onclick="TeacherReports.confirmBeneficiaryPrint()">🖨 Print</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const scopeEl = document.getElementById('ben-print-scope');
    const childWrap = document.getElementById('ben-print-child-wrap');
    const secWrap = document.getElementById('ben-print-section-wrap');
    if (scopeEl) {
      scopeEl.addEventListener('change', () => {
        const v = scopeEl.value;
        if (childWrap) childWrap.style.display = v === 'one' ? 'block' : 'none';
        if (secWrap) secWrap.style.display = v === 'section' ? 'block' : 'none';
      });
    }
  },

  confirmBeneficiaryPrint() {
    const scope = (document.getElementById('ben-print-scope') || {}).value || 'one';
    const childId = (document.getElementById('ben-print-child') || {}).value;
    const sectionKey = (document.getElementById('ben-print-section') || {}).value;
    const picker = document.getElementById('sfp-ben-print-picker');
    if (picker) picker.remove();

    const bens = typeof SfpStore !== 'undefined' ? SfpStore.listBeneficiaries() : [];
    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const byId = {};
    children.forEach(c => { byId[String(c.id)] = c; });

    let list = [];
    if (scope === 'one') {
      const b = bens.find(x => String(x.childId) === String(childId));
      if (!b) {
        alert('No SFP beneficiary selected. Save an SFP profile under Health first.');
        return;
      }
      list = [b];
    } else if (scope === 'section') {
      list = bens.filter(b => {
        const c = byId[String(b.childId)];
        return c && c.sectionKey === sectionKey;
      });
    } else {
      list = bens.slice();
    }

    if (!list.length) {
      alert('No enrolled SFP beneficiaries match this selection.');
      return;
    }

    const parts = list.map((b, i) => {
      const child = byId[String(b.childId)] || { id: b.childId, name: b.beneficiaryName };
      const block = this._beneficiaryProfileHtml(child, b);
      return (i > 0 ? '<div class="sfp-page-break"></div>' : '') + block;
    }).join('');

    const title = list.length === 1
      ? 'SFP Beneficiary Profile — ' + (list[0].beneficiaryName || list[0].childId)
      : 'SFP Beneficiary Profiles (' + list.length + ')';
    // A4 bond · 1 in margins · 11/12 pt (see CSS .sfp-print-page--a4 + .sfp-ben-profile)
    this._printWindow(title, '<div class="sfp-ben-profile-wrap">' + parts + '</div>', { paper: 'a4' });
  },

    /** Certificate letterhead — NCDC Medina only (no DSWD branding). */
  _dswdCertHeader(formCode) {
    return `
      <div class="dswd-letterhead ncdc-cert-letterhead">
        <div class="dswd-lh-top" style="justify-content:center;text-align:center;">
          <div class="dswd-lh-center" style="flex:1;">
            <div class="dswd-rep">Republic of the Philippines</div>
            <div class="dswd-dept">Municipality of Medina · Misamis Oriental</div>
            <div class="dswd-fo">National Child Development Center — Medina</div>
            <div class="dswd-fo-sub">Supplementary Feeding Program</div>
          </div>
          ${formCode ? `<div class="dswd-form-code">${formCode}</div>` : ''}
        </div>
        <div class="dswd-lh-line"></div>
      </div>`;
  },

  _dswdCertFooter() {
    return `
      <div class="dswd-footer">
        <div class="dswd-footer-line"></div>
        <p class="dswd-footer-text">
          National Child Development Center — Medina, Misamis Oriental<br>
          For MSWDO / center liquidation records
        </p>
        <p class="dswd-footer-page">PAGE 1 of 1</p>
      </div>`;
  },

  _mswdoHeader(cycleLabel, schoolYear) {
    return `
      <div class="mswdo-letterhead">
        <p class="mswdo-rep">Republic of the Philippines</p>
        <p>Region X</p>
        <p>Province of Misamis Oriental</p>
        <p>Municipality of <strong>MEDINA</strong></p>
        <h3 class="mswdo-office">MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE</h3>
        <div class="mswdo-banner">
          <strong>Supplementary Feeding Program</strong><br>
          ${(cycleLabel || '15th Cycle')} Implementation<br>
          SY ${(schoolYear || '—')}
        </div>
      </div>`;
  },

  printConsolidation() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    const s = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const z = (b) => (b && b.total != null ? b.total : '');
    const m = (b) => (b && b.male != null ? b.male : '');
    const f = (b) => (b && b.female != null ? b.female : '');
    const age = (y) => (s && s.ageBands && s.ageBands[y]) ? s.ageBands[y] : { total: '', male: '', female: '' };

    const body = `
      ${this._mswdoHeader(
        (cycle && cycle.cycleLabel) || '15th Cycle',
        (cycle && cycle.schoolYear) || '—'
      )}
      <h3 class="cert-title" style="margin-top:12px;">CONSOLIDATED REPORT (FIGURES)</h3>

      <h3>CONSOLIDATED PHYSICAL STATUS REPORT</h3>
      <table class="sfp-consol-figures">
        <colgroup><col class="sfp-consol-label-col" /><col class="sfp-consol-value-col" /></colgroup>
        <tr><td class="label">Total No. of Beneficiaries:</td><td class="sfp-consol-num">${s ? z(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Male Beneficiaries:</td><td class="sfp-consol-num">${s ? m(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Female Beneficiaries:</td><td class="sfp-consol-num">${s ? f(s.beneficiaries) : ''}</td></tr>
        <tr><td class="label">Total No. of CDCs/SNPs:</td><td class="sfp-consol-num">1</td></tr>
        <tr><td class="sub">No. of CDCs:</td><td class="sfp-consol-num">1</td></tr>
        <tr><td class="sub">No. of SNPs:</td><td class="sfp-consol-num">0</td></tr>
        <tr><td class="label">Total No. Of Children Beneficiaries (Age Bracket):</td><td class="sfp-consol-num"></td></tr>
        <tr><td class="sub">2 yrs. Old:</td><td class="sfp-consol-num">${z(age(2))}</td></tr>
        <tr><td class="sub">3 yrs. Old:</td><td class="sfp-consol-num">${z(age(3))}</td></tr>
        <tr><td class="sub">4 yrs. Old:</td><td class="sfp-consol-num">${z(age(4))}</td></tr>
        <tr><td class="sub">5 yrs. Old:</td><td class="sfp-consol-num">${z(age(5))}</td></tr>
        <tr><td class="label">Total No. of 4Ps Beneficiaries:</td><td class="sfp-consol-num">${s ? z(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.fourPs) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Disability Beneficiaries:</td><td class="sfp-consol-num">${s ? z(s.disability) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.disability) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.disability) : ''}</td></tr>
        <tr><td class="label">Total No. of Indigenous Child Beneficiaries:</td><td class="sfp-consol-num">${s ? z(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.indigenous) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Solo Parent:</td><td class="sfp-consol-num">${s ? z(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.soloParent) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Dewormed:</td><td class="sfp-consol-num">${s ? z(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.dewormed) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Supplemented with Vitamin A:</td><td class="sfp-consol-num">${s ? z(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td class="sfp-consol-num">${s ? m(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td class="sfp-consol-num">${s ? f(s.vitaminA) : ''}</td></tr>
      </table>

      <h3 style="margin-top:20px;">CONSOLIDATED NUTRITIONAL STATUS REPORT</h3>
      <p><b>Total no. of Beneficiaries Weighed: ${s ? z(s.beneficiaries) : '__________'}</b></p>
      <p class="left" style="text-align:left;font-size:11px;">
        Detailed weight-for-age / height-for-age / weight-for-length breakdowns can be completed from
        entry vs after-6-months measurements recorded on each SFP beneficiary profile.
        (Teacher may fill remaining cells on the printed form if needed.)
      </p>
      <table>
        <tr>
          <th rowspan="2">Nutritional Status Indicator</th>
          <th colspan="2">Upon Entry</th>
          <th colspan="2">After 6 Mos.</th>
        </tr>
        <tr><th>Male</th><th>Female</th><th>Male</th><th>Female</th></tr>
        <tr><th colspan="5">WEIGHT-FOR-AGE (UNDERWEIGHT)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Underweight (UW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Underweight (SUW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Overweight (OW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><th colspan="5">HEIGHT-FOR-AGE (STUNTING)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Stunted (S)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Stunted (SS)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Tall (T)</td><td></td><td></td><td></td><td></td></tr>
        <tr><th colspan="5">WEIGHT-FOR-LENGTH (WASTING)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Wasted (W)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Wasted (SW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Overweight (OW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Obese (OB)</td><td></td><td></td><td></td><td></td></tr>
      </table>

      <p style="margin-top:28px;text-align:left;">I hereby certify that the above information is true and correct.</p>
      <div class="sig">
        <div><b>Prepared by:</b><br><br>_________________________<br>ECCD / SFP Focal Person</div>
        <div><b>Noted by:</b><br><br>_________________________<br>MSWDO — MEDINA</div>
      </div>`;
    // Long bond for consolidated physical / nutritional status report
    this._printWindow('SFP Consolidated Report', body, { paper: 'legal' });
  },


  /**
   * Rebuild item-level results from saved assessment.responses + catalog
   * so older saves still yield tips and comments when possible.
   */
  _itemResultsFromAssessment(assessment) {
    const responses = assessment.responses || {};
    const recordType = assessment.recordType || 1;
    let catalog = null;
    if (typeof TeacherDevelopment !== 'undefined' && TeacherDevelopment.catalog) {
      catalog = TeacherDevelopment.catalog;
    }
    if (!catalog) return [];
    const recordKey = recordType === 2 ? 'record2' : 'record1';
    const record = catalog.records && catalog.records[recordKey];
    if (!record || !record.domains) return [];
    const period = assessment.period || '1st';
    const childId = assessment.childId;
    const out = [];
    (catalog.domains || []).forEach(d => {
      const items = record.domains[d.code] || [];
      items.forEach(it => {
        const presentKey = childId + ':' + it.item_id + ':' + period;
        const commentKey = childId + ':' + it.item_id + ':comment';
        out.push({
          domainCode: d.code,
          domainName: d.name,
          itemId: it.item_id,
          title: it.title || it.item_id,
          present: !!responses[presentKey],
          comment: responses[commentKey] != null ? String(responses[commentKey]).trim() : ''
        });
      });
    });
    return out;
  },

  _buildDraft(child, assessment) {
    const insight = assessment.insight || {};
    const finalScores = assessment.finalScores || null;

    let domains = [];
    if (finalScores && finalScores.domains) {
      const ds = assessment.domainScores || {};
      domains = Object.keys(finalScores.domains).map(code => {
        const d = finalScores.domains[code];
        const name = (typeof ScoreProfile !== 'undefined' && ScoreProfile.DOMAIN_NAMES[code])
          || code;
        const sc = d.scaled;
        const n = sc !== '' && sc != null ? Number(sc) : null;
        const src = ds[code] || {};
        let percent = src.percent != null ? Math.round(Number(src.percent)) : null;
        if (percent == null && src.total > 0 && src.present != null) {
          percent = Math.round((Number(src.present) / Number(src.total)) * 100);
        }
        return {
          code,
          name,
          raw: d.raw != null ? d.raw : src.present,
          total: src.total != null ? src.total : null,
          percent,
          scaled: sc,
          label: n != null && !isNaN(n)
            ? (n >= 14 ? 'Advanced' : n >= 7 ? 'Average' : 'Needs support')
            : '—'
        };
      });
    } else if (insight.domains) {
      domains = insight.domains.map(d => ({
        code: d.code,
        name: d.name,
        raw: d.raw,
        total: d.total != null ? d.total : null,
        percent: d.percent != null ? d.percent : (d.total > 0 && d.raw != null
          ? Math.round((Number(d.raw) / Number(d.total)) * 100) : null),
        scaled: d.scaled,
        label: d.interpretation ? d.interpretation.label : (d.percent != null ? d.percent + '%' : '—')
      }));
    }

    const standardScore = finalScores && finalScores.standardScore != null
      ? finalScores.standardScore
      : insight.standardScore;
    const sumScaled = finalScores && finalScores.sumOfScaledScores != null
      ? finalScores.sumOfScaledScores
      : insight.sumOfScaledScores;
    const overallLabel = (finalScores && finalScores.interpretation)
      || (insight.overallInterpretation && insight.overallInterpretation.label)
      || '—';

    const strengths = insight.strengths || [];
    const needs = insight.needs || [];
    const parentActivities = insight.parentActivities || [];
    const teacherPriorities = insight.teacherPriorities || [];

    let teacherComments = Array.isArray(insight.teacherComments) ? insight.teacherComments.slice() : [];
    let focusItems = Array.isArray(insight.focusItems) ? insight.focusItems.slice() : [];
    if ((!teacherComments.length || !focusItems.length) && assessment.responses) {
      const items = this._itemResultsFromAssessment(assessment);
      if (!focusItems.length) {
        focusItems = items.filter(it => !it.present).slice(0, 10).map(it => ({
          domainCode: it.domainCode,
          domainName: it.domainName,
          itemId: it.itemId,
          itemTitle: it.title
        }));
      }
      if (!teacherComments.length) {
        teacherComments = items.filter(it => it.comment).map(it => ({
          domainCode: it.domainCode,
          domainName: it.domainName,
          itemId: it.itemId,
          itemTitle: it.title,
          comment: it.comment,
          present: it.present
        }));
      }
    }

    const tips = [];
    if (Array.isArray(insight.tipLines) && insight.tipLines.length) {
      insight.tipLines.forEach(line => tips.push(line));
    }
    parentActivities.forEach(pa => {
      (pa.activities || []).slice(0, 2).forEach(a => {
        const line = pa.domainName + ': ' + a;
        if (tips.indexOf(line) < 0) tips.push(line);
      });
    });
    focusItems.slice(0, 5).forEach(fi => {
      tips.push('Practice: "' + fi.itemTitle + '" (' + fi.domainName + ').');
    });
    teacherComments.slice(0, 5).forEach(c => {
      tips.push('Teacher note on "' + c.itemTitle + '": ' + c.comment);
    });
    // de-dupe
    const seenTips = new Set();
    const uniqueTips = [];
    tips.forEach(line => {
      if (!seenTips.has(line)) { seenTips.add(line); uniqueTips.push(line); }
    });
    while (uniqueTips.length < 3) {
      const filler = [
        'Read or tell stories together for 10–15 minutes daily.',
        'Encourage outdoor play and movement games.',
        'Praise effort and practice everyday self-help skills (dressing, feeding).'
      ];
      filler.forEach(f => { if (uniqueTips.length < 4 && uniqueTips.indexOf(f) < 0) uniqueTips.push(f); });
      break;
    }

    // Prefer engine narrative draft (domain advice). Only rebuild if empty.
    let parentDraft = insight.parentFriendlyDraft || '';
    if (!parentDraft) {
      parentDraft = [
        'This note is based on the ' + assessment.period + ' ECCD developmental checklist evaluation.',
        overallLabel !== '—' ? overallLabel + '.' : '',
        'Continue playful learning at home—reading, outdoor play, and everyday self-help—and ask the teacher which skills to practice next.'
      ].filter(Boolean).join(' ');
    }

    // Teacher's note stays blank by default — optional for the teacher to write
    const teacherNote = '';

    return {
      domains,
      standardScore,
      sumOfScaledScores: sumScaled,
      overallLabel,
      strengths,
      needs,
      parentActivities,
      teacherPriorities,
      teacherComments,
      focusItems,
      parentDraft,
      teacherNote,
      tips: uniqueTips.slice(0, 10)
    };
  },

  openEditor(childId, period) {
    const child = SampleChildren.find(c => String(c.id) === String(childId));
    if (!child) return;

    const history = AssessmentStore.listForChild(childId);
    if (!history.length) {
      alert('No saved assessment for this child yet. Encode and save the ECCD checklist first.');
      return;
    }

    let assessment = period
      ? (history.find(a => a.period === period) || AssessmentStore.get(childId, period))
      : null;
    if (!assessment) {
      const order = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
      const sorted = history.slice().sort((a, b) => (order[a.period] || 99) - (order[b.period] || 99));
      assessment = sorted[sorted.length - 1];
    }
    const existing = ReportStore.get(childId, assessment.period);
    const draft = this._buildDraft(child, assessment);

    // Prefer saved report text when editing (including approved).
    // Fall back to engine draft only when nothing was saved yet.
    const existingTips = existing && existing.tips && existing.tips.length ? existing.tips : [];
    const hasSaved = !!(existing && (existing.teacherNote || existing.parentDraft || existingTips.length));
    // Optional field — blank for new reports; keep only if teacher already typed one
    const teacherNote = (existing && existing.teacherNote) ? existing.teacherNote : '';
    const parentDraft = hasSaved && existing.parentDraft
      ? existing.parentDraft
      : draft.parentDraft;
    const tipsText = existingTips.length
      ? existingTips.join('\n')
      : (draft.tips || []).join('\n');

    const domainPills = draft.domains.map(d => {
      const color = d.label === 'Advanced' || (typeof d.scaled === 'number' && d.scaled >= 14)
        ? 'var(--primary)'
        : d.label === 'Needs support' || (typeof d.scaled === 'number' && d.scaled < 7)
          ? '#d32f2f'
          : 'var(--success)';
      const main = d.scaled != null && d.scaled !== '' ? 'SS ' + d.scaled : d.label;
      return '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:10px;">' +
        '<div style="font-size:1.25rem;font-weight:700;color:' + color + ';">' + main + '</div>' +
        '<div style="font-size:0.78rem;color:var(--muted);">' + d.name + '</div>' +
        '<div style="font-size:0.72rem;color:var(--muted);">' + d.label + '</div></div>';
    }).join('');

    const statusLabel = existing && existing.status === 'approved'
      ? '<span class="success-text">✓ Approved — still editable</span>'
      : existing
        ? '<span style="color:var(--orange);">Draft saved</span>'
        : '<span class="text-muted">New draft</span>';

    const html =
      '<div id="report-editor-overlay" class="bs-overlay">' +
      '<div class="bs-modal-panel ecc-modal-wide">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.25rem;color:white;">Progress Report — ' + child.name + '</h2>' +
      '<button onclick="TeacherReports.closeEditor()" class="bs-modal-close">×</button></div>' +
      '<div class="bs-modal-body">' +
      '<p class="text-muted" style="margin-bottom:1rem;">Period <strong>' + assessment.period +
      '</strong> · ' + child.ageLabel + ' · Record ' + child.recordType + ' · ' + statusLabel +
      (assessment.finalized ? ' · <span class="success-text">Teacher-finalized scores</span>' : '') + '</p>' +
      '<div class="card" style="margin-bottom:1rem;"><h3 style="margin-top:0;">Domain summary</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0.75rem;">' +
      (domainPills || '<p class="text-muted">No domain scores.</p>') + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:1rem;">' +
      '<div><span class="text-muted">Sum of Scaled</span><div style="font-size:1.4rem;font-weight:700;color:var(--primary-dark);">' +
      (draft.sumOfScaledScores != null ? draft.sumOfScaledScores : '—') + '</div></div>' +
      '<div><span class="text-muted">Standard Score</span><div style="font-size:1.4rem;font-weight:700;color:var(--success);">' +
      (draft.standardScore != null ? draft.standardScore : '—') + '</div></div>' +
      '<div style="flex:1;"><span class="text-muted">Overall</span><div style="font-weight:600;">' +
      draft.overallLabel + '</div></div></div></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">👩‍🏫 Teacher’s note (shown to parent)</label>' +
      '<textarea id="report-teacher-note" rows="3" class="ecc-report-textarea">' + this._esc(teacherNote) + '</textarea></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">📝 Parent-friendly summary</label>' +
      '<textarea id="report-parent-draft" rows="4" class="ecc-report-textarea">' + this._esc(parentDraft) + '</textarea></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">💡 Tips & activities (one per line — from checklist gaps + teacher comments)</label>' +
      '<textarea id="report-tips" rows="8" class="ecc-report-textarea">' + this._esc(tipsText) + '</textarea></div>' +
      (draft.teacherComments && draft.teacherComments.length
        ? '<div class="card" style="margin-bottom:1rem;border-left:4px solid #f9a825;"><h3 style="margin-top:0;">Checklist teacher comments</h3><ul style="margin:0;padding-left:1.2rem;font-size:0.9rem;">' +
          draft.teacherComments.slice(0, 10).map(function(c) {
            return '<li><strong>' + c.itemTitle + '</strong>' +
              (c.present ? '' : ' <span class="text-muted">(not yet present)</span>') +
              ': ' + c.comment + '</li>';
          }).join('') +
          '</ul><p class="text-muted" style="font-size:0.8rem;margin:0.5rem 0 0;">These feed the parent tips and summary. Edit tips/notes above if needed before approve.</p></div>'
        : '<div class="card" style="margin-bottom:1rem;"><p class="text-muted" style="margin:0;font-size:0.88rem;">No checklist comments found for this period. Add comments on unchecked items in Development Tracking, then re-save the assessment for richer parent tips.</p></div>') +
      '</div><div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">' +
      '<button class="btn" style="background:#e0e0e0;color:#333;" onclick="TeacherReports.closeEditor()">Cancel</button>' +
      '<button class="btn btn-blue" onclick="TeacherReports.saveDraft(\'' + String(child.id).replace(/'/g, '') + '\', \'' + assessment.period + '\')">' +
      (existing && existing.status === 'approved' ? 'Save changes (keep approved)' : 'Save draft') + '</button>' +
      '<button class="btn" style="background:var(--success);" onclick="TeacherReports.approve(\'' + String(child.id).replace(/'/g, '') + '\', \'' + assessment.period + '\')">' +
      (existing && existing.status === 'approved' ? '✓ Update parent view' : '✓ Approve for parent') + '</button>' +
      '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    this._pendingAssessment = assessment;
    this._pendingDraft = draft;
  },

  _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _readForm(childId, period) {
    const child = SampleChildren.find(c => String(c.id) === String(childId));
    const assessment = this._pendingAssessment;
    const base = this._pendingDraft || this._buildDraft(child, assessment);
    const teacherNote = (document.getElementById('report-teacher-note') || {}).value || '';
    const parentDraft = (document.getElementById('report-parent-draft') || {}).value || '';
    const tipsRaw = (document.getElementById('report-tips') || {}).value || '';
    const tips = tipsRaw.split('\n').map(t => t.trim()).filter(Boolean);
    return {
      childId: childId,
      childName: child.name,
      period: period,
      recordType: child.recordType,
      ageMonths: child.ageMonths,
      domainScores: base.domains,
      standardScore: base.standardScore,
      sumOfScaledScores: base.sumOfScaledScores,
      overallLabel: base.overallLabel,
      teacherNote: teacherNote,
      tips: tips,
      parentDraft: parentDraft,
      strengths: base.strengths || [],
      needs: base.needs || [],
      teacherComments: base.teacherComments || [],
      focusItems: base.focusItems || []
    };
  },

  saveDraft(childId, period) {
    const payload = this._readForm(childId, period);
    const prev = ReportStore.get(childId, period);
    if (prev && prev.status === 'approved') {
      payload.status = 'approved';
      payload.approvedAt = prev.approvedAt || new Date().toISOString();
      ReportStore.save(payload);
      this.closeEditor();
      const main = document.getElementById('main-content') || document.querySelector('.main-content');
      if (main) this.render(main);
      this._toast('Changes saved — parent view for ' + period + ' stays approved.');
    } else {
      payload.status = 'draft';
      payload.approvedAt = null;
      ReportStore.save(payload);
      this.closeEditor();
      const main = document.getElementById('main-content') || document.querySelector('.main-content');
      if (main) this.render(main);
      this._toast('Draft saved. Approve when ready for the parent portal.');
    }
  },

  approve(childId, period) {
    const payload = this._readForm(childId, period);
    const prev = ReportStore.get(childId, period);
    payload.status = 'approved';
    payload.approvedAt = new Date().toISOString();
    ReportStore.save(payload);
    this.closeEditor();
    const main = document.getElementById('main-content') || document.querySelector('.main-content');
    if (main) this.render(main);
    this.tab = 'eccd';
    this._toast(prev && prev.status === 'approved'
      ? 'Parent view updated for ' + period + ' evaluation.'
      : 'Report approved — visible on the Parent Portal for this child.');
  },

  printEditor() {
    window.print();
  },

  closeEditor() {
    const el = document.getElementById('report-editor-overlay');
    if (el) el.remove();
    this._pendingAssessment = null;
    this._pendingDraft = null;
  },

  _toast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2800);
  }
};
