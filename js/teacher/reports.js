/**
 * Teacher Reports — parent-friendly progress reports from ECCD assessments.
 * Teacher reviews the draft, edits notes/tips, then approves for the Parent Portal.
 */

const TeacherReports = {
  tab: 'eccd', // eccd | sfp

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (typeof SfpStore !== 'undefined') SfpStore.ensureSeed();
    this._draw();
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
      ${UI.pageHeader('📊 Reports', 'ECCD parent progress reports and DSWD SFP forms for MSWDO / liquidation.')}
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">${tabs}</div>
      ${body}
    `;
  },

  _eccdReportsHtml() {
    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
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
            onclick="TeacherReports.openEditor(${c.id}, '${h.period}')">${label}</button>
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
            <button class="btn btn-blue" onclick="TeacherReports.printPackA()">🖨 Print Cert + Matrix -A</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherReports.printCertA()">Cert only</button>
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.printMatrixA()">Matrix only</button>
          </div>
          <p class="text-muted" style="font-size:0.8rem;margin:0.5rem 0 0;">Matrix rows come from SFP Feeding → Hot meal logs (day #, menu, commodities, notes).</p>
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
            <button class="btn btn-blue" onclick="TeacherReports.printPackC()">🖨 Print Cert + Matrix -C</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherReports.printCertC()">Cert only</button>
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.printMatrixC()">Matrix only</button>
          </div>
          <p class="text-muted" style="font-size:0.8rem;margin:0.5rem 0 0;">Matrix rows come from SFP Feeding → NUTRICombo deliveries (child, parent, qty, signature).</p>
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
   */
  _printWindow(title, bodyHtml) {
    const existing = document.getElementById('sfp-print-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'sfp-print-overlay';
    overlay.innerHTML = `
      <div class="sfp-print-backdrop no-print" onclick="if(event.target===this)TeacherReports.closeSfpPrint()"></div>
      <div class="sfp-print-shell">
        <div class="sfp-print-toolbar no-print">
          <strong style="color:white;flex:1;">${title}</strong>
          <button class="btn" style="background:white;color:var(--primary-dark);" onclick="TeacherReports.doSfpPrint()">🖨 Print / Save as PDF</button>
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherReports.closeSfpPrint()">Close</button>
        </div>
        <div class="sfp-print-page" id="sfp-print-page">
          ${bodyHtml}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('sfp-print-open');
  },

  doSfpPrint() {
    window.print();
  },

  closeSfpPrint() {
    const el = document.getElementById('sfp-print-overlay');
    if (el) el.remove();
    document.body.classList.remove('sfp-print-open');
  },

  _cycleMeta() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    return {
      cycle: cycle || {},
      province: (cycle && cycle.province) || 'MISAMIS ORIENTAL',
      municipality: (cycle && cycle.municipality) || 'MEDINA',
      barangay: (cycle && cycle.barangay) || '',
      facility: (cycle && cycle.facilityName) || 'National Child Development Center — Medina',
      worker: (cycle && cycle.workerName) || '',
      startDate: (cycle && cycle.startDate) || '',
      cycleLabel: (cycle && (cycle.cycleLabel || cycle.cycleNumber)) || '15th',
      schoolYear: (cycle && cycle.schoolYear) || ''
    };
  },

  _certABodyHtml() {
    const meta = this._cycleMeta();
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const hotDays = typeof SfpStore !== 'undefined' ? SfpStore.countHotFeedingDays() : 0;
    const nEl = document.getElementById('cert-a-n');
    const dEl = document.getElementById('cert-a-days');
    const start = (document.getElementById('cert-a-start') || {}).value || '________';
    const end = (document.getElementById('cert-a-end') || {}).value || '________';
    const n = (nEl && nEl.value) ? nEl.value : (stats ? stats.beneficiaries.total : '____');
    const days = (dEl && dEl.value) ? dEl.value : (hotDays || '____');
    const periodLine = (start && start !== '________') || (end && end !== '________')
      ? `${start} to ${end}`
      : '________________________';
    return `
      ${this._dswdCertHeader('-A')}
      <h2 class="cert-title">CERTIFICATION</h2>
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

  _certCBodyHtml() {
    const meta = this._cycleMeta();
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const altDays = typeof SfpStore !== 'undefined' ? SfpStore.countAltFeedingDays() : 0;
    const nEl = document.getElementById('cert-c-n');
    const dEl = document.getElementById('cert-c-days');
    const date = (document.getElementById('cert-c-date') || {}).value || '________';
    const n = (nEl && nEl.value) ? nEl.value : (stats ? stats.beneficiaries.total : '____');
    const days = (dEl && dEl.value) ? dEl.value : (altDays || '____');
    return `
      ${this._dswdCertHeader('-C')}
      <h2 class="cert-title">CERTIFICATION</h2>
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

  _matrixAHtml() {
    const meta = this._cycleMeta();
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const n = (document.getElementById('cert-a-n') || {}).value
      || (stats ? stats.beneficiaries.total : '');
    const days = typeof SfpStore !== 'undefined' ? SfpStore.listHotMealDays() : [];
    const start = (document.getElementById('cert-a-start') || {}).value || '';
    const end = (document.getElementById('cert-a-end') || {}).value || '';
    let filtered = days;
    if (start) filtered = filtered.filter(d => !d.actualDate || d.actualDate >= start);
    if (end) filtered = filtered.filter(d => !d.actualDate || d.actualDate <= end);

    const rows = filtered.length
      ? filtered.map(d => {
          const items = (d.commoditiesNote || '').trim()
            || (d.menuLabel ? d.menuLabel : '—');
          const itemsHtml = String(items).split(/[,;]+/).map(s => s.trim()).filter(Boolean)
            .map(s => `<div>${s}</div>`).join('') || '—';
          return `<tr>
            <td style="text-align:center;font-weight:700;">${d.dayNumber}</td>
            <td style="text-align:center;">${d.actualDate || ''}</td>
            <td style="font-size:11px;">${itemsHtml}</td>
            <td style="font-size:11px;">${d.menuLabel || '—'}</td>
            <td style="font-size:10px;">${d.committeeNote || ''}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="5" style="text-align:center;padding:16px;">No hot meal logs for this period.
           Encode days under <em>SFP Feeding → Hot meal log</em>.</td></tr>`;

    return `
      ${this._dswdCertHeader('-A')}
      <h2 class="cert-title" style="font-size:14px;text-decoration:none;">
        DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT<br>
        <span style="font-size:12px;font-weight:600;">Supplementary Feeding Program ${meta.cycleLabel} Cycle Implementation</span>
      </h2>
      <h3 style="text-align:center;margin:6px 0 10px;font-size:13px;">FOOD ALLOCATION MATRIX — HOT MEALS</h3>
      <table class="sfp-meta-table">
        <tr><td><strong>Province:</strong> ${meta.province}</td>
            <td><strong>City/Municipality:</strong> ${meta.municipality}</td></tr>
        <tr><td><strong>Location/Barangay:</strong> ${meta.barangay || '______________'}</td>
            <td><strong>Number of Children beneficiaries:</strong> ${n || '____'}</td></tr>
        <tr><td colspan="2"><strong>Name of Child Development Center:</strong> ${meta.facility}</td></tr>
        <tr><td><strong>Name of Child Development Worker:</strong> ${meta.worker || '______________'}</td>
            <td><strong>Date started the feeding:</strong> ${meta.startDate || '______________'}</td></tr>
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

  _matrixCHtml() {
    const meta = this._cycleMeta();
    const deliveries = typeof SfpStore !== 'undefined' ? SfpStore.listAltDeliveries() : [];
    const selId = (document.getElementById('cert-c-delivery') || {}).value || '';
    let delivery = null;
    if (selId) delivery = deliveries.find(d => d.id === selId) || null;
    if (!delivery && deliveries.length) delivery = deliveries[deliveries.length - 1];

    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const nOverride = (document.getElementById('cert-c-n') || {}).value;
    const nBen = nOverride || (delivery && delivery.receipts ? delivery.receipts.length : (stats ? stats.beneficiaries.total : ''));

    let rows = '';
    if (delivery && delivery.receipts && delivery.receipts.length) {
      rows = delivery.receipts.map(r => {
        const sig = r.parentSigned ? '(Signed)' : '';
        return `<tr>
          <td style="font-size:10px;">${delivery.particulars || 'NUTRI-COMBO'}</td>
          <td style="text-align:center;">${r.quantity != null ? r.quantity : ''}</td>
          <td>${r.childName || r.childId || ''}</td>
          <td>${r.parentName || ''}</td>
          <td style="text-align:center;font-size:10px;">${sig}</td>
        </tr>`;
      }).join('');
    } else {
      rows = `<tr><td colspan="5" style="text-align:center;padding:16px;">No NUTRICombo delivery selected or logged.
        Encode under <em>SFP Feeding → NUTRICombo</em>.</td></tr>`;
    }

    const delNum = delivery && delivery.deliveryNumber != null ? delivery.deliveryNumber : '____';
    const delDate = delivery && delivery.actualDate ? delivery.actualDate : '______________';

    return `
      ${this._dswdCertHeader('-C')}
      <h2 class="cert-title" style="font-size:14px;text-decoration:none;">
        DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT<br>
        <span style="font-size:12px;font-weight:600;">Supplementary Feeding Program ${meta.cycleLabel} Cycle Implementation</span>
      </h2>
      <h3 style="text-align:center;margin:6px 0 4px;font-size:13px;">FOOD ALLOCATION MATRIX — ${delNum} DELIVERY</h3>
      <p style="text-align:center;margin:0 0 10px;font-size:11px;">
        <strong>ALTERNATIVE MEAL — NUTRI COMBO</strong> (High Protein Cookie 60g &amp; Nutri Juice 200mL)
      </p>
      <table class="sfp-meta-table">
        <tr><td><strong>Province:</strong> ${meta.province}</td>
            <td><strong>City/Municipality:</strong> ${meta.municipality}</td></tr>
        <tr><td><strong>Location/Barangay:</strong> ${meta.barangay || '______________'}</td>
            <td><strong>Number of Children beneficiaries:</strong> ${nBen || '____'}</td></tr>
        <tr><td colspan="2"><strong>Name of Child Development Center:</strong> ${meta.facility}</td></tr>
        <tr><td><strong>Name of Child Development Worker:</strong> ${meta.worker || '______________'}</td>
            <td><strong>Date of actual feeding:</strong> ${delDate}</td></tr>
        <tr><td colspan="2"><strong>Date started the feeding (${meta.cycleLabel} cycle):</strong> ${meta.startDate || '______________'}</td></tr>
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

  printMatrixA() {
    this._printWindow('SFP Food Allocation Matrix -A', this._matrixAHtml());
  },

  printMatrixC() {
    this._printWindow('SFP Food Allocation Matrix -C', this._matrixCHtml());
  },

  printPackA() {
    const body = `
      <div class="sfp-print-section">${this._certABodyHtml()}</div>
      <div class="sfp-page-break"></div>
      <div class="sfp-print-section">${this._matrixAHtml()}</div>`;
    this._printWindow('SFP Cert + Matrix -A', body);
  },

  printPackC() {
    const body = `
      <div class="sfp-print-section">${this._certCBodyHtml()}</div>
      <div class="sfp-page-break"></div>
      <div class="sfp-print-section">${this._matrixCHtml()}</div>`;
    this._printWindow('SFP Cert + Matrix -C', body);
  },

    /** DSWD FO X letterhead matching paper certificates (text/CSS banner). */
  _dswdCertHeader(formCode) {
    return `
      <div class="dswd-letterhead">
        <div class="dswd-lh-top">
          <div class="dswd-lh-brand">
            <div class="dswd-logo-mark">
              <div class="dswd-logo-text">DSWD</div>
              <div class="dswd-logo-sub">Department of Social Welfare<br>and Development</div>
            </div>
          </div>
          <div class="dswd-lh-center">
            <div class="dswd-rep">Republic of the Philippines</div>
            <div class="dswd-dept">Department of Social Welfare and Development</div>
            <div class="dswd-fo">Field Office X</div>
            <div class="dswd-fo-sub">Northern Mindanao</div>
          </div>
          <div class="dswd-form-code">${formCode || ''}</div>
        </div>
        <div class="dswd-lh-line"></div>
      </div>`;
  },

  _dswdCertFooter() {
    return `
      <div class="dswd-footer">
        <div class="dswd-footer-line"></div>
        <p class="dswd-footer-text">
          DSWD Field Office X, Masterson Ave., Upper Carmen, Cagayan de Oro City, Philippines (9000)<br>
          Website: https://fo10.dswd.gov.ph/ &nbsp;|&nbsp; Tel Nos.: (088) 565 5795
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

  printCertA() {
    this._printWindow('SFP Certification -A', this._certABodyHtml());
  },

  printCertC() {
    this._printWindow('SFP Certification -C', this._certCBodyHtml());
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
      <table>
        <tr><td class="label">Total No. of Beneficiaries:</td><td>${s ? z(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Male Beneficiaries:</td><td>${s ? m(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Female Beneficiaries:</td><td>${s ? f(s.beneficiaries) : ''}</td></tr>
        <tr><td class="label">Total No. of CDCs/SNPs:</td><td>1</td></tr>
        <tr><td class="sub">No. of CDCs:</td><td>1</td></tr>
        <tr><td class="sub">No. of SNPs:</td><td>0</td></tr>
        <tr><td class="label">Total No. Of Children Beneficiaries (Age Bracket):</td><td></td></tr>
        <tr><td class="sub">2 yrs. Old:</td><td>${z(age(2))}</td></tr>
        <tr><td class="sub">3 yrs. Old:</td><td>${z(age(3))}</td></tr>
        <tr><td class="sub">4 yrs. Old:</td><td>${z(age(4))}</td></tr>
        <tr><td class="sub">5 yrs. Old:</td><td>${z(age(5))}</td></tr>
        <tr><td class="label">Total No. of 4Ps Beneficiaries:</td><td>${s ? z(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.fourPs) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Disability Beneficiaries:</td><td>${s ? z(s.disability) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.disability) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.disability) : ''}</td></tr>
        <tr><td class="label">Total No. of Indigenous Child Beneficiaries:</td><td>${s ? z(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.indigenous) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Solo Parent:</td><td>${s ? z(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.soloParent) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Dewormed:</td><td>${s ? z(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.dewormed) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Supplemented with Vitamin A:</td><td>${s ? z(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.vitaminA) : ''}</td></tr>
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
    this._printWindow('SFP Consolidated Report', body);
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
      domains = Object.keys(finalScores.domains).map(code => {
        const d = finalScores.domains[code];
        const name = (typeof ScoreProfile !== 'undefined' && ScoreProfile.DOMAIN_NAMES[code])
          || code;
        const sc = d.scaled;
        const n = sc !== '' && sc != null ? Number(sc) : null;
        return {
          code,
          name,
          raw: d.raw,
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

    let parentDraft = insight.parentFriendlyDraft || '';
    if (!parentDraft || (teacherComments.length && parentDraft.indexOf('Teacher observations') < 0)) {
      parentDraft = [
        'Assessment period: ' + assessment.period + '.',
        overallLabel !== '—' ? 'Overall: ' + overallLabel + '.' : '',
        strengths.length ? 'Strengths: ' + strengths.slice(0, 3).join('; ') + '.' : '',
        needs.length ? 'Areas to support: ' + needs.slice(0, 3).join('; ') + '.' : '',
        focusItems.length
          ? 'Skills still developing (examples): ' + focusItems.slice(0, 5).map(fi => fi.itemTitle).join('; ') + '.'
          : '',
        teacherComments.length
          ? 'Teacher observations: ' + teacherComments.slice(0, 4).map(c => '"' + c.itemTitle + '" — ' + c.comment).join(' | ') + '.'
          : '',
        "Your child's teacher can explain these results and suggest simple activities at home."
      ].filter(Boolean).join(' ');
    }

    const priorityLines = teacherPriorities
      .filter(tp => tp.domainCode !== 'OVERALL')
      .slice(0, 3)
      .map(tp => tp.domainName + ': ' + ((tp.priorities && tp.priorities[0]) || tp.reason));
    let teacherNote = priorityLines.length
      ? 'Learning priorities — ' + priorityLines.join(' · ')
      : (strengths.length
        ? child.name + ' shows progress in ' + strengths.slice(0, 2).join(' and ') + '. Continue encouraging learning through play.'
        : child.name + ' is being monitored with the ECCD checklist. Please see the domain summary and tips below.');
    if (teacherComments.length) {
      teacherNote += ' Checklist comments — ' + teacherComments.slice(0, 3).map(c => c.itemTitle + ': ' + c.comment).join(' · ');
    }

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
    const child = SampleChildren.find(c => c.id === childId);
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
    const teacherNote = hasSaved && existing.teacherNote
      ? existing.teacherNote
      : draft.teacherNote;
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
      '<button class="btn btn-blue" onclick="TeacherReports.saveDraft(' + child.id + ', \'' + assessment.period + '\')">' +
      (existing && existing.status === 'approved' ? 'Save changes (keep approved)' : 'Save draft') + '</button>' +
      '<button class="btn" style="background:var(--success);" onclick="TeacherReports.approve(' + child.id + ', \'' + assessment.period + '\')">' +
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
    const child = SampleChildren.find(c => c.id === childId);
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
