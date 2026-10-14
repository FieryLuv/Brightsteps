/**
 * Teacher Attendance — daily sheet by section, history, absence alerts.
 */

const TeacherAttendance = {
  selectedSection: 'explorers',
  selectedDate: new Date().toISOString().slice(0, 10),
  histYear: new Date().getFullYear(),
  histMonth: new Date().getMonth(), // 0-11 for monthly history sheet
  pendingChildId: null,

  /** From Children: open this child's class attendance sheet */
  openForChild(childId) {
    this.pendingChildId = childId;
    if (this._container) {
      this._applyPendingChild();
      this._draw();
    }
  },

  _applyPendingChild() {
    if (this.pendingChildId == null) return;
    const id = this.pendingChildId;
    this.pendingChildId = null;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    const child = (typeof SampleChildren !== 'undefined')
      ? SampleChildren.find(c => String(c.id) === String(id))
      : null;
    if (child && child.sectionKey) this.selectedSection = child.sectionKey;
  },

  get sections() {
    if (typeof ClassStore !== 'undefined') {
      return ClassStore.listActive().map(c => ({
        key: c.key,
        label: c.name,
        ages: c.ageLabel || ''
      }));
    }
    return [
      { key: 'explorers', label: 'Little Explorers', ages: '0–3 yrs' },
      { key: 'stars', label: 'Little Stars', ages: '3–4 yrs' },
      { key: 'sunshine', label: 'Sunshine Group', ages: '4–5 yrs' }
    ];
  },

  render(container) {
    this._container = container;
    this._applyPendingChild();
    const afterKids = function () {
      if (typeof AttendanceStore !== 'undefined' && AttendanceStore.hydrateDay &&
          typeof AttendanceRemote !== 'undefined' && AttendanceRemote.online()) {
        AttendanceStore.hydrateDay(TeacherAttendance.selectedDate, TeacherAttendance.selectedSection).then(function () {
          TeacherAttendance._draw();
        }).catch(function () { TeacherAttendance._draw(); });
        return;
      }
      TeacherAttendance._draw();
    };
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      ChildrenRemote.ensureLoaded().then(afterKids).catch(afterKids);
      return;
    }
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    afterKids();
  },

  _children() {
    const list = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    return list.filter(c => c.sectionKey === this.selectedSection);
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

    const sectionOpts = this.sections.map(s => {
      const active = s.key === this.selectedSection;
      return '<option value="' + s.key + '"' + (active ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');

    const alertNames = (stats.alerts || []).map(a => {
      const c = SampleChildren.find(x => String(x.id) === String(a.childId));
      return c ? `${c.name} (${a.consecutive} consecutive days)` : '';
    }).filter(Boolean);

    const monthLabel = this._monthPrefix()
      ? new Date(this._monthPrefix() + '-01').toLocaleString('en', { month: 'long', year: 'numeric' })
      : 'This month';

    this._container.innerHTML = `
      ${UI.pageHeader('📅 Attendance', 'Daily attendance recording, monthly history, and absence alerts.')}

      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-end;">
          <div style="min-width:200px;flex:1;">
            <label class="ecc-field-label">Class / section</label>
            <select class="ecc-field-input" onchange="TeacherAttendance.selectSection(this.value)">${sectionOpts}</select>
          </div>
        </div>
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
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherAttendance.openPrintPicker('daily')">🖨️ Print daily</button>
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
      this._wireAbsentNotes();
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
    this._wireAbsentNotes();
  },

  selectSection(key) {
    this.selectedSection = key;
    if (typeof AttendanceStore !== 'undefined' && AttendanceStore.hydrateDay &&
        typeof AttendanceRemote !== 'undefined' && AttendanceRemote.online()) {
      AttendanceStore.hydrateDay(this.selectedDate, this.selectedSection).then(function () {
        TeacherAttendance._draw();
      }).catch(function () { TeacherAttendance._draw(); });
      return;
    }
    this._draw();
  },

  onDateChange(val) {
    this.selectedDate = val;
    if (typeof AttendanceStore !== 'undefined' && AttendanceStore.hydrateDay &&
        typeof AttendanceRemote !== 'undefined' && AttendanceRemote.online()) {
      AttendanceStore.hydrateDay(this.selectedDate, this.selectedSection).then(() => this._draw()).catch(() => this._draw());
      return;
    }
    this._draw();
  },


  _wireAbsentNotes() {
    const rows = document.querySelectorAll('input[type="radio"][name^="att-"]');
    rows.forEach(function (radio) {
      radio.addEventListener('change', function () {
        const name = radio.name;
        const childId = name.replace(/^att-/, '');
        const remark = document.querySelector('.att-remark[data-child="' + childId + '"]');
        if (!remark) return;
        const abs = document.querySelector('input[name="' + name + '"][value="A"]:checked');
        if (abs) {
          remark.classList.add('is-required');
          remark.placeholder = 'Required: reason for absence';
        } else {
          remark.classList.remove('is-required');
          remark.placeholder = 'Reason / remarks';
        }
      });
    });
  },
  async saveSheet() {
    const children = this._children();
    const marks = {};
    const remarks = {};
    children.forEach(c => {
      const checked = document.querySelector('input[name="att-' + c.id + '"]:checked');
      if (checked) marks[c.id] = checked.value;
      const remark = document.querySelector('.att-remark[data-child="' + c.id + '"]');
      if (remark && remark.value.trim()) remarks[c.id] = remark.value.trim();
      // Require note when Absent
      if (checked && checked.value === 'A') {
        const note = (remark && remark.value.trim()) || '';
        if (!note) {
          alert('Please add a note for absent child: ' + (c.name || c.id));
          throw new Error('absent-note-required');
        }
      }
    });

    if (!Object.keys(marks).length) {
      alert('Mark at least one child Present or Absent.');
      return;
    }

    try {
      const result = await AttendanceStore.saveDayAsync({
        date: this.selectedDate,
        sectionKey: this.selectedSection,
        marks,
        remarks
      });
      if (result && result.remoteError) {
        alert('Saved locally, but server sync failed: ' + result.remoteError);
      } else {
        this._toast('Attendance saved for ' + this.selectedDate +
          (result && result.remoteCount != null ? ' · synced ' + result.remoteCount + ' to server' : ''));
      }
    } catch (e) {
      if (e && e.message === 'absent-note-required') return;
      console.error(e);
      alert('Could not save attendance.');
      return;
    }
    this._draw();
  },

  /** Weekday school days (Mon–Fri) for histYear/histMonth as YYYY-MM-DD list */
  _histSchoolDays() {
    const y = this.histYear;
    const m = this.histMonth;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m, d);
      const wd = dt.getDay(); // 0 Sun … 6 Sat
      if (wd === 0 || wd === 6) continue;
      out.push(y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'));
    }
    return out;
  },

  openHistory() {
    // Sync history month from the daily sheet date when opening fresh
    if (this.selectedDate && /^\d{4}-\d{2}/.test(this.selectedDate)) {
      const parts = this.selectedDate.split('-');
      this.histYear = parseInt(parts[0], 10);
      this.histMonth = parseInt(parts[1], 10) - 1;
    }
    this._renderHistory();
  },

  changeHistMonth(delta) {
    this.histMonth += delta;
    if (this.histMonth > 11) { this.histMonth = 0; this.histYear++; }
    if (this.histMonth < 0) { this.histMonth = 11; this.histYear--; }
    this._renderHistory();
  },

  histGoThisMonth() {
    const now = new Date();
    this.histYear = now.getFullYear();
    this.histMonth = now.getMonth();
    this._renderHistory();
  },

  /**
   * Monthly Attendance Sheet — paper-style grid (Mon–Fri columns, week color bands).
   */
  _renderHistory() {
    const existing = document.getElementById('att-history-overlay');
    if (existing) existing.remove();

    const children = this._children();
    const ids = children.map(c => c.id);
    const month = this.histYear + '-' + String(this.histMonth + 1).padStart(2, '0');
    const schoolDays = this._histSchoolDays();
    const days = (typeof AttendanceStore !== 'undefined')
      ? AttendanceStore.listForSection(this.selectedSection)
          .filter(d => (d.date || '').startsWith(month))
      : [];
    const byDate = {};
    days.forEach(d => { byDate[d.date] = d; });

    const stats = (typeof AttendanceStore !== 'undefined')
      ? AttendanceStore.sectionStats(this.selectedSection, ids, month)
      : { present: 0, absent: 0, rate: null, daysRecorded: 0, perChild: {} };

    // Week color bands (matches paper monthly sheet feel)
    const weekColors = ['#fce4ec', '#ffe0b2', '#fff9c4', '#e8f5e9', '#e3f2fd', '#f3e5f5'];
    const dayMeta = schoolDays.map(dateStr => {
      const dayNum = parseInt(dateStr.slice(8), 10);
      const wd = new Date(dateStr + 'T12:00:00').getDay(); // 1 Mon … 5 Fri
      const weekIndex = Math.floor((dayNum + new Date(this.histYear, this.histMonth, 1).getDay() - 1) / 7);
      return { dateStr, dayNum, wd, weekIndex: Math.max(0, weekIndex) };
    });

    const headerDates = dayMeta.map(dm => {
      const letter = ['', 'M', 'T', 'W', 'T', 'F'][dm.wd] || '';
      const bg = weekColors[dm.weekIndex % weekColors.length];
      return `<th class="att-hist-day" style="text-align:center;font-size:0.72rem;min-width:1.7rem;background:${bg};padding:4px 2px;">
        <div style="font-weight:700;">${letter}</div>
        <div>${dm.dayNum}</div>
      </th>`;
    }).join('');

    const rows = children.length
      ? children.map(c => {
          let presentCount = 0;
          let absentCount = 0;
          const cells = dayMeta.map(dm => {
            const day = byDate[dm.dateStr];
            const m = day && day.marks && day.marks[c.id];
            const bg = weekColors[dm.weekIndex % weekColors.length];
            if (m === 'P') {
              presentCount++;
              return `<td style="text-align:center;color:var(--success);font-weight:700;background:${bg};">P</td>`;
            }
            if (m === 'A') {
              absentCount++;
              return `<td style="text-align:center;color:#d32f2f;font-weight:700;background:${bg};">A</td>`;
            }
            return `<td style="text-align:center;color:#ccc;background:${bg};">·</td>`;
          }).join('');
          const tot = presentCount + absentCount;
          const pct = tot ? Math.round((presentCount / tot) * 100) + '%' : '—';
          return `<tr>
            <td class="att-hist-name" style="position:sticky;left:0;background:#fff;font-weight:600;white-space:nowrap;">${c.name}</td>
            ${cells}
            <td style="text-align:center;font-weight:700;">${presentCount}</td>
            <td style="text-align:center;font-weight:700;">${absentCount}</td>
            <td style="text-align:center;font-weight:700;">${pct}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="${schoolDays.length + 4}" style="text-align:center;color:var(--muted);">No children in this section.</td></tr>`;

    const sectionLabel = (this.sections.find(s => s.key === this.selectedSection) || {}).label || '';
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const monthLabel = monthNames[this.histMonth] + ' ' + this.histYear;
    const recordedCount = schoolDays.filter(d => byDate[d]).length;

    const html = `
      <div id="att-history-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide" style="max-width:min(1100px,96vw);">
          <div class="bs-modal-header no-print">
            <h2 style="margin:0;font-size:1.2rem;color:white;">Monthly Attendance Sheet — ${sectionLabel}</h2>
            <button class="bs-modal-close" onclick="TeacherAttendance.closeHistory()">×</button>
          </div>
          <div class="bs-modal-body">
            <div class="no-print" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;">
              <button type="button" class="btn" style="background:#e8e8e8;color:#333;padding:6px 12px;"
                onclick="TeacherAttendance.changeHistMonth(-1)">‹</button>
              <strong style="min-width:11rem;text-align:center;">${monthLabel}</strong>
              <button type="button" class="btn" style="background:#e8e8e8;color:#333;padding:6px 12px;"
                onclick="TeacherAttendance.changeHistMonth(1)">›</button>
              <button type="button" class="btn btn-blue" style="padding:6px 12px;font-size:0.85rem;"
                onclick="TeacherAttendance.histGoThisMonth()">This month</button>
            </div>

            <div id="att-monthly-preview">
              <div style="text-align:center;margin-bottom:0.75rem;">
                <h2 style="margin:0;font-size:1.35rem;letter-spacing:0.02em;">MONTHLY ATTENDANCE SHEET</h2>
                <p style="margin:0.35rem 0 0;font-size:0.95rem;">
                  <strong>NCDC Medina</strong> · ${sectionLabel} · <strong>${monthLabel}</strong>
                </p>
                <p class="text-muted" style="margin:0.25rem 0 0;font-size:0.85rem;">
                  ${recordedCount} of ${schoolDays.length} school days recorded
                  · Rate: ${stats.rate != null ? stats.rate + '%' : '—'}
                </p>
              </div>
              <div class="eccd-table-wrap att-hist-wrap">
                <table class="eccd-table att-hist-table">
                  <thead>
                    <tr>
                      <th class="att-hist-name" style="position:sticky;left:0;background:#e8eaf6;z-index:1;">Student Name</th>
                      ${headerDates}
                      <th style="text-align:center;font-size:0.75rem;background:#e8eaf6;">P</th>
                      <th style="text-align:center;font-size:0.75rem;background:#e8eaf6;">A</th>
                      <th style="text-align:center;font-size:0.75rem;background:#e8eaf6;">%</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
              <p class="text-muted" style="font-size:0.8rem;margin:0.75rem 0 0;">
                <strong>P</strong> = Present &nbsp;·&nbsp; <strong style="color:#d32f2f;">A</strong> = Absent &nbsp;·&nbsp; · = not recorded
                &nbsp;·&nbsp; Columns are Mon–Fri only (weekends omitted).
              </p>
            </div>
          </div>
          <div class="bs-modal-footer no-print" style="display:flex;gap:0.5rem;justify-content:flex-end;flex-wrap:wrap;">
            <button class="btn" style="background:#e8e8e8;" onclick="TeacherAttendance.closeHistory()">Close</button>
            <button class="btn btn-blue" onclick="TeacherAttendance.openPrintPicker('monthly')">🖨️ Print monthly</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /**
   * Print picker — daily and monthly are separate.
   * scope: 'daily' | 'monthly'
   * User chooses current section or All sections on one printout.
   */
  openPrintPicker(scope) {
    const existing = document.getElementById('att-print-picker');
    if (existing) existing.remove();

    const isDaily = scope === 'daily';
    const title = isDaily ? 'Print daily attendance' : 'Print monthly attendance';
    const dateOrMonth = isDaily
      ? ('Date: <strong>' + this.selectedDate + '</strong>')
      : (() => {
          const names = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
          return 'Month: <strong>' + names[this.histMonth] + ' ' + this.histYear + '</strong>';
        })();

    const sectionOpts = this.sections.map(s =>
      '<option value="' + s.key + '"' +
      (s.key === this.selectedSection ? ' selected' : '') + '>' + s.label + '</option>'
    ).join('');

    const html =
      '<div id="att-print-picker" class="bs-overlay no-print">' +
      '<div class="bs-modal-panel" style="max-width:420px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.1rem;color:white;">' + title + '</h2>' +
      '<button type="button" class="bs-modal-close" onclick="document.getElementById(\'att-print-picker\').remove()">×</button>' +
      '</div>' +
      '<div class="bs-modal-body">' +
      '<p class="text-muted" style="margin-top:0;">' + dateOrMonth + '</p>' +
      '<p style="margin:0 0 0.75rem;font-size:0.9rem;">Choose which class(es) to include. Daily and monthly sheets print as separate documents.</p>' +
      '<label class="ecc-field-label">Sections to print</label>' +
      '<select id="att-print-scope" class="ecc-field-input">' +
      '<option value="one">One section only</option>' +
      '<option value="all">All sections (one sheet)</option>' +
      '</select>' +
      '<div id="att-print-section-wrap" style="margin-top:0.75rem;">' +
      '<label class="ecc-field-label">Section</label>' +
      '<select id="att-print-section" class="ecc-field-input">' + sectionOpts + '</select>' +
      '</div>' +
      '</div>' +
      '<div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;flex-wrap:wrap;">' +
      '<button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById(\'att-print-picker\').remove()">Cancel</button>' +
      '<button type="button" class="btn btn-blue" onclick="TeacherAttendance.confirmPrint(\'' + scope + '\')">🖨️ Print</button>' +
      '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);

    const scopeEl = document.getElementById('att-print-scope');
    const wrap = document.getElementById('att-print-section-wrap');
    if (scopeEl && wrap) {
      scopeEl.addEventListener('change', () => {
        wrap.style.display = scopeEl.value === 'all' ? 'none' : 'block';
      });
    }
  },

  confirmPrint(scope) {
    const scopeEl = document.getElementById('att-print-scope');
    const secEl = document.getElementById('att-print-section');
    const mode = scopeEl ? scopeEl.value : 'one';
    const sectionKey = secEl ? secEl.value : this.selectedSection;

    const sections = mode === 'all'
      ? this.sections.slice()
      : this.sections.filter(s => s.key === sectionKey);

    if (!sections.length) {
      alert('No section selected.');
      return;
    }

    const picker = document.getElementById('att-print-picker');
    if (picker) picker.remove();

    if (scope === 'daily') {
      this._printDaily(sections);
    } else {
      this._printMonthly(sections);
    }
  },

  _childrenInSection(sectionKey) {
    const list = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    return list.filter(c => c.sectionKey === sectionKey);
  },

  /**
   * Print without pop-ups: write into a hidden iframe and call print() on it.
   * Works even when the browser blocks window.open.
   */
  _printWindow(title, bodyHtml, landscape) {
    const page = landscape ? 'landscape' : 'portrait';
    const docHtml =
      '<!DOCTYPE html><html><head><title>' + title + '</title><style>' +
      'body{font-family:system-ui,sans-serif;padding:14px;color:#222;}' +
      'table{border-collapse:collapse;width:100%;font-size:11px;}' +
      'th,td{border:1px solid #bbb;padding:4px 5px;}' +
      'th{background:#e8eaf6;}' +
      'h1{margin:0 0 4px;text-align:center;font-size:1.25rem;}' +
      'h2{margin:1.25rem 0 0.35rem;font-size:1.05rem;border-bottom:1px solid #ccc;padding-bottom:4px;}' +
      'h2:first-of-type{margin-top:0.5rem;}' +
      'p.meta{text-align:center;margin:2px 0 10px;font-size:0.9rem;}' +
      'p.note{font-size:0.8rem;color:#555;margin:6px 0 0;}' +
      '.section-block{page-break-inside:avoid;margin-bottom:1.5rem;}' +
      '@page{size:' + page + ';margin:10mm;}' +
      '@media print{body{padding:0;}}' +
      '</style></head><body>' + bodyHtml + '</body></html>';

    let iframe = document.getElementById('att-print-frame');
    if (iframe) iframe.remove();

    iframe = document.createElement('iframe');
    iframe.id = 'att-print-frame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    idoc.open();
    idoc.write(docHtml);
    idoc.close();

    const trigger = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('[BrightSteps] print failed', e);
        // Last resort: inject visible print area on current page
        this._printFallback(bodyHtml);
      }
    };

    // Allow layout to settle inside the iframe
    setTimeout(trigger, 200);
  },

  _printFallback(bodyHtml) {
    const old = document.getElementById('att-print-fallback');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'att-print-fallback';
    wrap.className = 'att-print-only';
    wrap.innerHTML = bodyHtml;
    document.body.appendChild(wrap);
    document.body.classList.add('att-printing');
    window.print();
    setTimeout(() => {
      wrap.remove();
      document.body.classList.remove('att-printing');
    }, 800);
  },

  /** Daily sheet only — one date, one or all sections */
  _printDaily(sections) {
    const date = this.selectedDate;
    let body = '<h1>DAILY ATTENDANCE SHEET</h1>' +
      '<p class="meta"><strong>NCDC Medina</strong> · Date: <strong>' + date + '</strong></p>';

    sections.forEach(sec => {
      const children = this._childrenInSection(sec.key);
      const day = (typeof AttendanceStore !== 'undefined')
        ? AttendanceStore.getDay(date, sec.key)
        : null;

      let present = 0;
      let absent = 0;
      const rows = children.length
        ? children.map((c, i) => {
            const mark = day && day.marks ? day.marks[c.id] : null;
            const remark = day && day.remarks ? (day.remarks[c.id] || '') : '';
            let status = '—';
            if (mark === 'P') { status = 'Present'; present++; }
            else if (mark === 'A') { status = 'Absent'; absent++; }
            return '<tr><td style="text-align:center;">' + (i + 1) + '</td>' +
              '<td>' + c.name + '</td>' +
              '<td style="text-align:center;font-weight:700;">' + status + '</td>' +
              '<td>' + (remark || '—') + '</td></tr>';
          }).join('')
        : '<tr><td colspan="4" style="text-align:center;">No children in this section.</td></tr>';

      body +=
        '<div class="section-block">' +
        '<h2>' + sec.label + (sec.ages ? ' (' + sec.ages + ')' : '') + '</h2>' +
        '<p class="note">Present: ' + present + ' · Absent: ' + absent +
        ' · Recorded: ' + (day ? 'yes' : 'not saved for this date') + '</p>' +
        '<table><thead><tr>' +
        '<th style="width:2.5rem;">#</th><th>Child Name</th>' +
        '<th style="text-align:center;width:5rem;">Status</th><th>Remarks</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    });

    this._printWindow('Daily Attendance — ' + date, body, false);
  },

  /** Monthly sheet only — one month, one or all sections */
  _printMonthly(sections) {
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const monthLabel = monthNames[this.histMonth] + ' ' + this.histYear;
    const month = this.histYear + '-' + String(this.histMonth + 1).padStart(2, '0');
    const schoolDays = this._histSchoolDays();
    const weekColors = ['#fce4ec', '#ffe0b2', '#fff9c4', '#e8f5e9', '#e3f2fd', '#f3e5f5'];
    const dayMeta = schoolDays.map(dateStr => {
      const dayNum = parseInt(dateStr.slice(8), 10);
      const wd = new Date(dateStr + 'T12:00:00').getDay();
      const weekIndex = Math.floor((dayNum + new Date(this.histYear, this.histMonth, 1).getDay() - 1) / 7);
      return { dateStr, dayNum, wd, weekIndex: Math.max(0, weekIndex) };
    });

    const headerDates = dayMeta.map(dm => {
      const letter = ['', 'M', 'T', 'W', 'T', 'F'][dm.wd] || '';
      const bg = weekColors[dm.weekIndex % weekColors.length];
      return '<th style="text-align:center;font-size:9px;background:' + bg + ';">' +
        letter + '<br>' + dm.dayNum + '</th>';
    }).join('');

    let body = '<h1>MONTHLY ATTENDANCE SHEET</h1>' +
      '<p class="meta"><strong>NCDC Medina</strong> · <strong>' + monthLabel + '</strong></p>';

    sections.forEach(sec => {
      const children = this._childrenInSection(sec.key);
      const days = (typeof AttendanceStore !== 'undefined')
        ? AttendanceStore.listForSection(sec.key).filter(d => (d.date || '').startsWith(month))
        : [];
      const byDate = {};
      days.forEach(d => { byDate[d.date] = d; });
      const recordedCount = schoolDays.filter(d => byDate[d]).length;

      const rows = children.length
        ? children.map(c => {
            let presentCount = 0;
            let absentCount = 0;
            const cells = dayMeta.map(dm => {
              const day = byDate[dm.dateStr];
              const m = day && day.marks && day.marks[c.id];
              const bg = weekColors[dm.weekIndex % weekColors.length];
              if (m === 'P') {
                presentCount++;
                return '<td style="text-align:center;font-weight:700;color:#2e7d32;background:' + bg + ';">P</td>';
              }
              if (m === 'A') {
                absentCount++;
                return '<td style="text-align:center;font-weight:700;color:#c62828;background:' + bg + ';">A</td>';
              }
              return '<td style="text-align:center;color:#ccc;background:' + bg + ';">·</td>';
            }).join('');
            const tot = presentCount + absentCount;
            const pct = tot ? Math.round((presentCount / tot) * 100) + '%' : '—';
            return '<tr><td style="font-weight:600;white-space:nowrap;">' + c.name + '</td>' +
              cells +
              '<td style="text-align:center;font-weight:700;">' + presentCount + '</td>' +
              '<td style="text-align:center;font-weight:700;">' + absentCount + '</td>' +
              '<td style="text-align:center;font-weight:700;">' + pct + '</td></tr>';
          }).join('')
        : '<tr><td colspan="' + (schoolDays.length + 4) + '" style="text-align:center;">No children in this section.</td></tr>';

      body +=
        '<div class="section-block">' +
        '<h2>' + sec.label + (sec.ages ? ' (' + sec.ages + ')' : '') + '</h2>' +
        '<p class="note">' + recordedCount + ' of ' + schoolDays.length + ' school days recorded</p>' +
        '<table><thead><tr>' +
        '<th>Student Name</th>' + headerDates +
        '<th style="text-align:center;">P</th><th style="text-align:center;">A</th><th style="text-align:center;">%</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="note">P = Present · A = Absent · · = not recorded · Mon–Fri only</p>' +
        '</div>';
    });

    this._printWindow('Monthly Attendance — ' + monthLabel, body, true);
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
