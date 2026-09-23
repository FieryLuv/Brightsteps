/**
 * Teacher Attendance — daily sheet by section, history, absence alerts.
 */

const TeacherAttendance = {
  selectedSection: 'explorers',
  selectedDate: new Date().toISOString().slice(0, 10),

  sections: [
    { key: 'explorers', label: 'Little Explorers', ages: '0–3 yrs' },
    { key: 'stars', label: 'Little Stars', ages: '3–4 yrs' },
    { key: 'sunshine', label: 'Sunshine Group', ages: '4–5 yrs' }
  ],

  render(container) {
    this._container = container;
    this._draw();
  },

  _children() {
    return (typeof SampleChildren !== 'undefined' ? SampleChildren : [])
      .filter(c => c.sectionKey === this.selectedSection);
  },

  _monthPrefix() {
    return (this.selectedDate || '').slice(0, 7);
  },

  _draw() {
    const children = this._children();
    const ids = children.map(c => c.id);
    const stats = typeof AttendanceStore !== 'undefined'
      ? AttendanceStore.sectionStats(this.selectedSection, ids, this._monthPrefix())
      : { present: 0, absent: 0, total: 0, rate: null, daysRecorded: 0, alerts: [] };

    const sectionBtns = this.sections.map(s => {
      const active = s.key === this.selectedSection;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherAttendance.selectSection('${s.key}')">${s.label}</button>`;
    }).join('');

    const alertNames = (stats.alerts || []).map(a => {
      const c = SampleChildren.find(x => x.id === a.childId);
      return c ? `${c.name} (${a.consecutive} consecutive days)` : '';
    }).filter(Boolean);

    const monthLabel = this._monthPrefix()
      ? new Date(this._monthPrefix() + '-01').toLocaleString('en', { month: 'long', year: 'numeric' })
      : 'This month';

    this._container.innerHTML = `
      ${UI.pageHeader('📅 Attendance', 'Daily attendance recording, monthly history, and absence alerts.')}

      <div class="card">
        <h3 style="margin-top:0;">Select Class / Section</h3>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">${sectionBtns}</div>
      </div>

      <div class="dashboard-grid" style="margin:1.25rem 0;">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">${monthLabel} summary</h3>
          <p style="margin:0.35rem 0;"><strong>Attendance rate:</strong> ${stats.rate != null ? stats.rate + '%' : '— (no records yet)'}</p>
          <p style="margin:0.35rem 0;">Present marks: <strong class="success-text">${stats.present}</strong>
            · Absent: <strong style="color:#d32f2f;">${stats.absent}</strong></p>
          <p class="text-muted" style="margin:0;font-size:0.85rem;">Days recorded this month: ${stats.daysRecorded}</p>
        </div>
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Absence alerts</h3>
          ${alertNames.length
            ? `<ul style="margin:0.5rem 0 0;padding-left:1.2rem;line-height:1.8;">${alertNames.map(n => `<li>${n}</li>`).join('')}</ul>
               <p class="text-muted" style="font-size:0.85rem;margin:0.5rem 0 0;">3+ consecutive absences (from most recent records).</p>`
            : `<p class="text-muted" style="margin:0;">No consecutive absence alerts for this section.</p>`}
        </div>
      </div>

      <div class="card">
        <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-end;justify-content:space-between;margin-bottom:1rem;">
          <div>
            <h3 style="margin:0 0 0.5rem;">Daily attendance sheet</h3>
            <p class="text-muted" style="margin:0;font-size:0.9rem;">Mark Present (P) or Absent (A) for the selected date, then save.</p>
          </div>
          <div style="display:flex;gap:0.75rem;align-items:flex-end;flex-wrap:wrap;">
            <div>
              <label class="ecc-field-label">Date</label>
              <input type="date" id="att-date" class="ecc-field-input" value="${this.selectedDate}"
                onchange="TeacherAttendance.onDateChange(this.value)" style="min-width:160px;" />
            </div>
            <button class="btn btn-blue" onclick="TeacherAttendance.saveSheet()">💾 Save attendance</button>
            <button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="TeacherAttendance.openHistory()">📜 Monthly history</button>
          </div>
        </div>
        ${this._sheetHtml(children)}
      </div>
    `;

    this._loadDayIntoSheet(children);
  },

  _sheetHtml(children) {
    if (!children.length) {
      return `<p class="text-muted">No children in this section.</p>`;
    }
    const rows = children.map((c, i) => `
      <tr data-child="${c.id}">
        <td>${i + 1}</td>
        <td><strong>${c.name}</strong><div class="text-muted" style="font-size:0.78rem;">${c.ageLabel}</div></td>
        <td style="text-align:center;">
          <label class="att-radio"><input type="radio" name="att-${c.id}" value="P" /> <span class="success-text">P</span></label>
        </td>
        <td style="text-align:center;">
          <label class="att-radio"><input type="radio" name="att-${c.id}" value="A" /> <span style="color:#d32f2f;">A</span></label>
        </td>
        <td><input type="text" class="ecc-field-input att-remark" data-child="${c.id}" placeholder="Reason / remarks" /></td>
      </tr>`).join('');

    return `
      <div class="eccd-table-wrap">
        <table class="eccd-table att-sheet-table">
          <thead>
            <tr>
              <th style="width:3rem;">#</th>
              <th>Child Name</th>
              <th style="text-align:center;">Present</th>
              <th style="text-align:center;">Absent</th>
              <th>Reason / Remarks</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="text-muted" style="margin-top:0.75rem;font-size:0.85rem;">
        <span class="success-text" style="font-weight:700;">P</span> = Present &nbsp;&nbsp;
        <span style="color:#d32f2f;font-weight:700;">A</span> = Absent
      </p>`;
  },

  _loadDayIntoSheet(children) {
    const day = AttendanceStore.getDay(this.selectedDate, this.selectedSection);
    if (!day) {
      // default all Present for convenience
      children.forEach(c => {
        const p = document.querySelector(`input[name="att-${c.id}"][value="P"]`);
        if (p) p.checked = true;
      });
      return;
    }
    children.forEach(c => {
      const mark = day.marks && day.marks[c.id];
      if (mark === 'A') {
        const a = document.querySelector(`input[name="att-${c.id}"][value="A"]`);
        if (a) a.checked = true;
      } else if (mark === 'P') {
        const p = document.querySelector(`input[name="att-${c.id}"][value="P"]`);
        if (p) p.checked = true;
      }
      const remark = document.querySelector(`.att-remark[data-child="${c.id}"]`);
      if (remark && day.remarks && day.remarks[c.id]) remark.value = day.remarks[c.id];
    });
  },

  selectSection(key) {
    this.selectedSection = key;
    this._draw();
  },

  onDateChange(val) {
    this.selectedDate = val;
    this._draw();
  },

  saveSheet() {
    const children = this._children();
    const marks = {};
    const remarks = {};
    children.forEach(c => {
      const checked = document.querySelector(`input[name="att-${c.id}"]:checked`);
      if (checked) marks[c.id] = checked.value;
      const remark = document.querySelector(`.att-remark[data-child="${c.id}"]`);
      if (remark && remark.value.trim()) remarks[c.id] = remark.value.trim();
    });

    if (!Object.keys(marks).length) {
      alert('Mark at least one child Present or Absent.');
      return;
    }

    AttendanceStore.saveDay({
      date: this.selectedDate,
      sectionKey: this.selectedSection,
      marks,
      remarks
    });

    this._toast('Attendance saved for ' + this.selectedDate);
    this._draw();
  },

  openHistory() {
    const children = this._children();
    const ids = children.map(c => c.id);
    const month = this._monthPrefix();
    const days = AttendanceStore.listForSection(this.selectedSection)
      .filter(d => !month || (d.date || '').startsWith(month))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Collect unique dates (up to 22 for readability)
    const dates = days.map(d => d.date);
    const stats = AttendanceStore.sectionStats(this.selectedSection, ids, month);

    let headerDates = dates.map(d => {
      const dayNum = d.slice(8);
      return `<th style="text-align:center;font-size:0.75rem;min-width:2rem;">${dayNum}</th>`;
    }).join('');

    const rows = children.map(c => {
      const cells = dates.map(date => {
        const day = days.find(d => d.date === date);
        const m = day && day.marks && day.marks[c.id];
        if (m === 'P') return `<td style="text-align:center;color:var(--success);font-weight:700;">P</td>`;
        if (m === 'A') return `<td style="text-align:center;color:#d32f2f;font-weight:700;">A</td>`;
        return `<td style="text-align:center;color:#bbb;">—</td>`;
      }).join('');
      const pc = stats.perChild[c.id] || { present: 0, absent: 0 };
      const tot = pc.present + pc.absent;
      const pct = tot ? Math.round((pc.present / tot) * 100) + '%' : '—';
      return `<tr>
        <td style="position:sticky;left:0;background:#fff;font-weight:600;">${c.name}</td>
        ${cells}
        <td style="text-align:center;font-weight:700;">${pc.present}</td>
        <td style="text-align:center;font-weight:700;">${pct}</td>
      </tr>`;
    }).join('');

    const sectionLabel = (this.sections.find(s => s.key === this.selectedSection) || {}).label || '';
    const monthLabel = month
      ? new Date(month + '-01').toLocaleString('en', { month: 'long', year: 'numeric' })
      : 'All time';

    const html = `
      <div id="att-history-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">Attendance History — ${sectionLabel}</h2>
            <button class="bs-modal-close" onclick="TeacherAttendance.closeHistory()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted">${monthLabel} · ${dates.length} day(s) recorded</p>
            ${dates.length ? `
              <div class="eccd-table-wrap">
                <table class="eccd-table">
                  <thead>
                    <tr>
                      <th style="position:sticky;left:0;background:#f0f0f0;">Child</th>
                      ${headerDates}
                      <th style="text-align:center;">Present</th>
                      <th style="text-align:center;">%</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>` : `<p class="text-muted">No attendance saved for this month yet. Use the daily sheet and Save attendance.</p>`}
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="TeacherAttendance.closeHistory()">Close</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  closeHistory() {
    const el = document.getElementById('att-history-overlay');
    if (el) el.remove();
  },

  _toast(msg) {
    const t = document.createElement('div');
    t.className = 'ecc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
};
