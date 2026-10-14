/**
 * Teacher Calendar — monthly grid, PH holidays, upcoming events, add event.
 * Rules:
 *  - Cannot add events on dates before today
 *  - Today + event → green highlight
 *  - Past event → yellow highlight, view-only (non-editable)
 *  - Future event → blue highlight
 *  - Official PH holidays shown on the grid
 */

const TeacherCalendar = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-11

  /** Local calendar YYYY-MM-DD (avoids UTC shift) */
  _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  _isPast(dateStr) {
    return dateStr < this._todayStr();
  },

  _isToday(dateStr) {
    return dateStr === this._todayStr();
  },

  /**
   * Philippine national / special non-working holidays for a year.
   * Easter-based: Maundy Thursday, Good Friday.
   */
  _holidaysForYear(year) {
    const easter = this._easterDate(year);
    const goodFri = new Date(easter);
    goodFri.setDate(easter.getDate() - 2);
    const maundy = new Date(easter);
    maundy.setDate(easter.getDate() - 3);

    const fmt = (d) => d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');

    // National Heroes Day = last Monday of August
    const heroes = new Date(year, 7, 31);
    while (heroes.getDay() !== 1) heroes.setDate(heroes.getDate() - 1);

    const list = [
      { date: year + '-01-01', title: "New Year's Day" },
      { date: fmt(maundy), title: 'Maundy Thursday' },
      { date: fmt(goodFri), title: 'Good Friday' },
      { date: year + '-04-09', title: 'Araw ng Kagitingan' },
      { date: year + '-05-01', title: 'Labor Day' },
      { date: year + '-06-12', title: 'Independence Day' },
      { date: year + '-08-21', title: 'Ninoy Aquino Day' },
      { date: fmt(heroes), title: 'National Heroes Day' },
      { date: year + '-11-01', title: "All Saints' Day" },
      { date: year + '-11-30', title: 'Bonifacio Day' },
      { date: year + '-12-08', title: 'Feast of the Immaculate Conception' },
      { date: year + '-12-25', title: 'Christmas Day' },
      { date: year + '-12-30', title: 'Rizal Day' },
      { date: year + '-12-31', title: "New Year's Eve" }
    ];
    return list;
  },

  /** Anonymous Gregorian algorithm for Easter Sunday */
  _easterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  },

  _holidaysInMonth(year, monthIndex) {
    const prefix = year + '-' + String(monthIndex + 1).padStart(2, '0');
    return this._holidaysForYear(year).filter(h => h.date.startsWith(prefix));
  },

  render(container) {
    this._container = container;
    if (typeof CalendarStore === 'undefined') {
      container.innerHTML =
        (typeof UI !== 'undefined' ? UI.pageHeader('🗓️ Calendar', 'Center events and activity schedule.') : '<h2>Calendar</h2>') +
        '<div class="card"><p style="color:#d32f2f;">Calendar data module failed to load. Hard-refresh (Ctrl+Shift+R).</p></div>';
      return;
    }
    const draw = function () {
      try {
        TeacherCalendar._draw();
      } catch (err) {
        console.error('[TeacherCalendar]', err);
        container.innerHTML = '<div class="card"><h2>Calendar error</h2><p class="text-muted">' +
          (err && err.message ? err.message : err) + '</p></div>';
      }
    };
    if (typeof CalendarStore.hydrateAll === 'function' &&
        typeof CalendarRemote !== 'undefined' && CalendarRemote.online()) {
      CalendarStore.hydrateAll().then(draw).catch(draw);
      return;
    }
    draw();
  },

  _draw() {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const title = monthNames[this.viewMonth] + ' ' + this.viewYear;
    const events = CalendarStore.listForMonth(this.viewYear, this.viewMonth);
    const holidays = this._holidaysInMonth(this.viewYear, this.viewMonth);
    const holidayByDate = {};
    holidays.forEach(h => { holidayByDate[h.date] = h; });
    const upcoming = CalendarStore.upcoming(6);
    const todayStr = this._todayStr();

    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(d => '<div class="cal-dow">' + d + '</div>').join('');

    let cells = '';
    for (let i = 0; i < startPad; i++) {
      cells += '<div class="cal-cell cal-empty"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.viewYear + '-' +
        String(this.viewMonth + 1).padStart(2, '0') + '-' +
        String(day).padStart(2, '0');
      const dayEvents = events.filter(e => e.date === dateStr);
      const holiday = holidayByDate[dateStr];
      const hasEvent = dayEvents.length > 0;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      let stateClass = '';
      if (hasEvent && isToday) stateClass = 'cal-event-today';
      else if (hasEvent && isPast) stateClass = 'cal-event-past';
      else if (hasEvent && isFuture) stateClass = 'cal-has-event';
      if (isToday && !hasEvent) stateClass += ' cal-today';
      if (holiday) stateClass += ' cal-holiday';
      if (isPast && !hasEvent && !holiday) stateClass += ' cal-past-day';

      const labels = [];
      if (holiday) labels.push(holiday.title);
      dayEvents.forEach(e => labels.push(e.title));
      const titleAttr = labels.join(', ').replace(/"/g, '&quot;');
      const labelHtml = labels.length
        ? '<span class="cal-event-label">' + String(labels[0]).replace(/</g, '&lt;') +
          (labels.length > 1 ? ' +' + (labels.length - 1) : '') + '</span>'
        : '';

      cells +=
        '<div class="cal-cell ' + stateClass.trim() + '"' +
        ' role="button" tabindex="0"' +
        ' title="' + titleAttr + '"' +
        " onclick=\"TeacherCalendar.onDayClick('" + dateStr + "')\"" +
        " onkeydown=\"if(event.key==='Enter')TeacherCalendar.onDayClick('" + dateStr + "')\">" +
        '<span class="cal-daynum">' + day + '</span>' +
        (hasEvent || holiday ? '<span class="cal-dot"></span>' : '') +
        labelHtml +
        '</div>';
    }

    const upcomingList = upcoming.length
      ? upcoming.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return '<li><strong>' + label + '</strong> – ' + e.title +
            (e.time ? ' (' + e.time + ')' : '') + '</li>';
        }).join('')
      : '<li class="text-muted">No upcoming events. Add one below.</li>';

    const monthHolidayNote = holidays.length
      ? '<p class="text-muted" style="margin:0.5rem 0 0;font-size:0.85rem;">🇵🇭 Holidays this month: ' +
        holidays.map(h => h.title + ' (' + h.date.slice(8) + ')').join(', ') + '</p>'
      : '';

    this._container.innerHTML =
      UI.pageHeader('🗓️ Calendar', 'Center events, PH holidays, and activity schedule.') +
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;">' +
          '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="TeacherCalendar.changeMonth(-1)">← Previous</button>' +
          '<h3 id="calendar-month-title" style="margin:0;">' + title + '</h3>' +
          '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="TeacherCalendar.changeMonth(1)">Next →</button>' +
        '</div>' +
        '<div class="cal-grid">' + dow + cells + '</div>' +
        '<div class="cal-legend" style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.85rem;font-size:0.8rem;color:var(--muted);">' +
          '<span><span class="cal-legend-swatch cal-event-today"></span> Today (event)</span>' +
          '<span><span class="cal-legend-swatch cal-event-past"></span> Past event (view only)</span>' +
          '<span><span class="cal-legend-swatch cal-has-event"></span> Upcoming event</span>' +
          '<span><span class="cal-legend-swatch cal-holiday"></span> Holiday</span>' +
        '</div>' +
        '<p class="text-muted" style="margin-top:0.5rem;font-size:0.85rem;">Click a day to view or add an event. Past dates cannot receive new events.</p>' +
        monthHolidayNote +
      '</div>' +
      '<div class="dashboard-grid">' +
        '<div class="card" style="margin:0;">' +
          '<h3 style="margin-top:0;">Upcoming events</h3>' +
          '<ul style="line-height:2;padding-left:1.2rem;margin:0;">' + upcomingList + '</ul>' +
          '<button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherCalendar.openAddModal()">+ Add New Event</button>' +
        '</div>' +
        '<div class="card" style="margin:0;">' +
          '<h3 style="margin-top:0;">This month (' + events.length + ' events)</h3>' +
          (events.length
            ? '<ul style="line-height:1.9;padding-left:1.2rem;margin:0;">' + events.map(e => {
                const past = e.date < todayStr;
                return '<li' + (past ? ' class="cal-list-past"' : '') + '><strong>' + e.date.slice(8) +
                  '</strong> – ' + e.title +
                  (past ? ' <span class="text-muted" style="font-size:0.8rem;">(past)</span>' : '') +
                  '</li>';
              }).join('') + '</ul>'
            : '<p class="text-muted" style="margin:0;">No center events this month yet.</p>') +
        '</div>' +
      '</div>';
  },

  changeMonth(delta) {
    this.viewMonth += delta;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this._draw();
  },

  onDayClick(dateStr) {
    const events = CalendarStore.getByDate(dateStr);
    const holidays = this._holidaysForYear(Number(dateStr.slice(0, 4)))
      .filter(h => h.date === dateStr);
    const past = this._isPast(dateStr);

    if (events.length || holidays.length) {
      this._showEventDetails(dateStr, events, holidays, past);
      return;
    }
    if (past) {
      this._toast('Cannot add events on past dates.');
      return;
    }
    this.openAddModal(dateStr);
  },

  _showEventDetails(dateStr, events, holidays, past) {
    holidays = holidays || [];
    const holBlocks = holidays.map(h =>
      '<div class="card" style="margin-bottom:0.75rem;border-left:4px solid #c62828;">' +
        '<h3 style="margin:0 0 0.35rem;color:#b71c1c;">🇵🇭 ' + h.title + '</h3>' +
        '<p style="margin:0;" class="text-muted">Official holiday · ' + dateStr + '</p>' +
      '</div>'
    ).join('');

    const blocks = events.map(e =>
      '<div class="card" style="margin-bottom:0.75rem;' +
        (past ? 'opacity:0.92;border-left:4px solid #f9a825;' : '') + '">' +
        '<h3 style="margin:0 0 0.5rem;color:var(--primary-dark);">' + e.title +
          (past ? ' <span style="font-size:0.8rem;color:#f57f17;">(past · view only)</span>' : '') +
        '</h3>' +
        '<p style="margin:0.25rem 0;"><strong>Date:</strong> ' + e.date + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Time:</strong> ' + (e.time || '—') + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Type:</strong> ' + (e.type || '—') + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Audience:</strong> ' + (e.audience || '—') + '</p>' +
        (e.notes
          ? '<div style="margin-top:0.75rem;padding:0.75rem;background:#f8f9fa;border-radius:8px;"><strong>Notes:</strong><br>' +
            e.notes + '</div>'
          : '') +
      '</div>'
    ).join('');

    let footer =
      '<button class="btn btn-blue" onclick="TeacherCalendar.closeModal()">Close</button>';
    if (!past) {
      footer =
        '<button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherCalendar.closeModal();TeacherCalendar.openAddModal(\'' +
        dateStr + '\')">+ Add another</button>' + footer;
    }

    const html =
      '<div id="cal-modal-overlay" class="bs-overlay">' +
      '<div class="bs-modal-panel" style="max-width:520px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.2rem;color:white;">' +
      (past ? 'Past · ' : '') + dateStr + '</h2>' +
      '<button class="bs-modal-close" onclick="TeacherCalendar.closeModal()">×</button></div>' +
      '<div class="bs-modal-body">' + holBlocks + blocks +
      (past && events.length
        ? '<p class="text-muted" style="font-size:0.85rem;margin:0.5rem 0 0;">Past events are view-only and cannot be edited.</p>'
        : '') +
      '</div>' +
      '<div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">' + footer +
      '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  },

  openAddModal(prefillDate) {
    const today = this._todayStr();
    let dateVal = prefillDate || today;
    if (dateVal < today) {
      this._toast('Cannot add events on past dates.');
      dateVal = today;
    }
    const html =
      '<div id="cal-modal-overlay" class="bs-overlay">' +
      '<div class="bs-modal-panel" style="max-width:560px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.2rem;color:white;">+ Add New Event</h2>' +
      '<button class="bs-modal-close" onclick="TeacherCalendar.closeModal()">×</button></div>' +
      '<div class="bs-modal-body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
        '<div><label class="ecc-field-label">Date</label>' +
        '<input type="date" id="cal-date" class="ecc-field-input" value="' + dateVal + '" min="' + today + '" /></div>' +
        '<div><label class="ecc-field-label">Time</label>' +
        '<input type="text" id="cal-time" class="ecc-field-input" placeholder="e.g. 2:00 PM" /></div>' +
      '</div>' +
      '<div style="margin-top:1rem;"><label class="ecc-field-label">Title</label>' +
      '<input type="text" id="cal-title" class="ecc-field-input" placeholder="Event title" /></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">' +
        '<div><label class="ecc-field-label">Type</label>' +
        '<select id="cal-type" class="ecc-field-input">' +
          '<option>Meeting</option><option>Health</option><option>Activity</option>' +
          '<option>Event</option><option>Holiday</option></select></div>' +
        '<div><label class="ecc-field-label">Audience</label>' +
        '<input type="text" id="cal-audience" class="ecc-field-input" placeholder="e.g. Parents & Teachers" /></div>' +
      '</div>' +
      '<div style="margin-top:1rem;"><label class="ecc-field-label">Notes</label>' +
      '<textarea id="cal-notes" class="ecc-report-textarea" rows="3" placeholder="Optional details"></textarea></div>' +
      '<p class="text-muted" style="font-size:0.8rem;margin:0.75rem 0 0;">Only today and future dates are allowed.</p>' +
      '</div>' +
      '<div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">' +
      '<button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherCalendar.closeModal()">Cancel</button>' +
      '<button class="btn btn-blue" onclick="TeacherCalendar.saveEvent()">Save event</button>' +
      '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveEvent() {
    const title = ((document.getElementById('cal-title') || {}).value || '').trim();
    const date = (document.getElementById('cal-date') || {}).value;
    if (!title || !date) {
      alert('Please enter a title and date.');
      return;
    }
    if (date < this._todayStr()) {
      alert('Events cannot be scheduled on past dates. Choose today or a future date.');
      return;
    }
    CalendarStore.save({
      date: date,
      title: title,
      time: (document.getElementById('cal-time') || {}).value || '',
      type: (document.getElementById('cal-type') || {}).value || 'Event',
      audience: (document.getElementById('cal-audience') || {}).value || '',
      notes: (document.getElementById('cal-notes') || {}).value || ''
    });
    const parts = date.split('-').map(Number);
    this.viewYear = parts[0];
    this.viewMonth = parts[1] - 1;
    this.closeModal();
    this._draw();
    this._toast('Event saved');
  },

  closeModal() {
    const el = document.getElementById('cal-modal-overlay');
    if (el) el.remove();
  },

  _toast(msg) {
    const t = document.createElement('div');
    t.className = 'ecc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
};

if (typeof window !== 'undefined') window.TeacherCalendar = TeacherCalendar;
