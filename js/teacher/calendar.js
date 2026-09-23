/**
 * Teacher Calendar — monthly grid, upcoming events, add event.
 */

const TeacherCalendar = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-11

  render(container) {
    this._container = container;
    if (typeof CalendarStore === 'undefined') {
      container.innerHTML = `
        ${typeof UI !== 'undefined' ? UI.pageHeader('🗓️ Calendar', 'Center events and activity schedule.') : '<h2>Calendar</h2>'}
        <div class="card">
          <p style="color:#d32f2f;">Calendar data module failed to load. Hard-refresh the page (Ctrl+Shift+R).</p>
          <button class="btn btn-blue" onclick="BrightSteps.navigate('dashboard')">← Dashboard</button>
        </div>`;
      return;
    }
    try {
      this._draw();
    } catch (err) {
      console.error('[TeacherCalendar]', err);
      container.innerHTML = `
        <div class="card">
          <h2>Calendar error</h2>
          <p class="text-muted">${err && err.message ? err.message : err}</p>
          <button class="btn btn-blue" onclick="BrightSteps.navigate('dashboard')">← Dashboard</button>
        </div>`;
    }
  },

  _draw() {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const title = `${monthNames[this.viewMonth]} ${this.viewYear}`;
    const events = CalendarStore.listForMonth(this.viewYear, this.viewMonth);
    const upcoming = CalendarStore.upcoming(6);

    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startPad = first.getDay(); // 0 Sun
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);

    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(d => `<div class="cal-dow">${d}</div>`).join('');

    let cells = '';
    for (let i = 0; i < startPad; i++) {
      cells += `<div class="cal-cell cal-empty"></div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = dateStr === todayStr;
      const has = dayEvents.length > 0;
      const titles = dayEvents.map(e => e.title).join(', ').replace(/"/g, '&quot;');
      cells += `
        <div class="cal-cell ${isToday ? 'cal-today' : ''} ${has ? 'cal-has-event' : ''}"
          role="button" tabindex="0"
          onclick="TeacherCalendar.onDayClick('${dateStr}')"
          onkeydown="if(event.key==='Enter')TeacherCalendar.onDayClick('${dateStr}')">
          <span class="cal-daynum">${day}</span>
          ${has ? `<span class="cal-dot" title="${titles}"></span>` : ''}
          ${has ? `<span class="cal-event-label">${dayEvents[0].title.replace(/</g,'&lt;')}</span>` : ''}
        </div>`;
    }

    const upcomingList = upcoming.length
      ? upcoming.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return `<li><strong>${label}</strong> – ${e.title}${e.time ? ' (' + e.time + ')' : ''}</li>`;
        }).join('')
      : '<li class="text-muted">No upcoming events. Add one below.</li>';

    this._container.innerHTML = `
      ${UI.pageHeader('🗓️ Calendar', 'Center events, parent meetings, and activity schedule.')}

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;">
          <button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="TeacherCalendar.changeMonth(-1)">← Previous</button>
          <h3 id="calendar-month-title" style="margin:0;">${title}</h3>
          <button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="TeacherCalendar.changeMonth(1)">Next →</button>
        </div>
        <div class="cal-grid">
          ${dow}
          ${cells}
        </div>
        <p class="text-muted" style="margin-top:0.75rem;font-size:0.85rem;">Click a day to view or add an event. Days with events are highlighted.</p>
      </div>

      <div class="dashboard-grid">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Upcoming events</h3>
          <ul style="line-height:2;padding-left:1.2rem;margin:0;">${upcomingList}</ul>
          <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherCalendar.openAddModal()">+ Add New Event</button>
        </div>
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">This month (${events.length})</h3>
          ${events.length
            ? `<ul style="line-height:1.9;padding-left:1.2rem;margin:0;">${events.map(e =>
                `<li><strong>${e.date.slice(8)}</strong> – ${e.title} <span class="text-muted" style="font-size:0.85rem;">${e.type || ''}</span></li>`
              ).join('')}</ul>`
            : `<p class="text-muted" style="margin:0;">No events this month yet.</p>`}
        </div>
      </div>
    `;
  },

  changeMonth(delta) {
    this.viewMonth += delta;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this._draw();
  },

  onDayClick(dateStr) {
    const events = CalendarStore.getByDate(dateStr);
    if (events.length) {
      this._showEventDetails(dateStr, events);
    } else {
      this.openAddModal(dateStr);
    }
  },

  _showEventDetails(dateStr, events) {
    const blocks = events.map(e => `
      <div class="card" style="margin-bottom:0.75rem;">
        <h3 style="margin:0 0 0.5rem;color:var(--primary-dark);">${e.title}</h3>
        <p style="margin:0.25rem 0;"><strong>Date:</strong> ${e.date}</p>
        <p style="margin:0.25rem 0;"><strong>Time:</strong> ${e.time || '—'}</p>
        <p style="margin:0.25rem 0;"><strong>Type:</strong> ${e.type || '—'}</p>
        <p style="margin:0.25rem 0;"><strong>Audience:</strong> ${e.audience || '—'}</p>
        ${e.notes ? `<div style="margin-top:0.75rem;padding:0.75rem;background:#f8f9fa;border-radius:8px;"><strong>Notes:</strong><br>${e.notes}</div>` : ''}
      </div>`).join('');

    const html = `
      <div id="cal-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:520px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.2rem;color:white;">Events — ${dateStr}</h2>
            <button class="bs-modal-close" onclick="TeacherCalendar.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">${blocks}</div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherCalendar.closeModal();TeacherCalendar.openAddModal('${dateStr}')">+ Add another</button>
            <button class="btn btn-blue" onclick="TeacherCalendar.closeModal()">Close</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  openAddModal(prefillDate) {
    const dateVal = prefillDate || new Date().toISOString().slice(0, 10);
    const html = `
      <div id="cal-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:560px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.2rem;color:white;">+ Add New Event</h2>
            <button class="bs-modal-close" onclick="TeacherCalendar.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div>
                <label class="ecc-field-label">Date</label>
                <input type="date" id="cal-date" class="ecc-field-input" value="${dateVal}" />
              </div>
              <div>
                <label class="ecc-field-label">Time</label>
                <input type="text" id="cal-time" class="ecc-field-input" placeholder="e.g. 2:00 PM" />
              </div>
            </div>
            <div style="margin-top:1rem;">
              <label class="ecc-field-label">Title</label>
              <input type="text" id="cal-title" class="ecc-field-input" placeholder="Event title" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
              <div>
                <label class="ecc-field-label">Type</label>
                <select id="cal-type" class="ecc-field-input">
                  <option>Meeting</option>
                  <option>Health</option>
                  <option>Activity</option>
                  <option>Event</option>
                  <option>Holiday</option>
                </select>
              </div>
              <div>
                <label class="ecc-field-label">Audience</label>
                <input type="text" id="cal-audience" class="ecc-field-input" placeholder="e.g. Parents & Teachers" />
              </div>
            </div>
            <div style="margin-top:1rem;">
              <label class="ecc-field-label">Notes</label>
              <textarea id="cal-notes" class="ecc-report-textarea" rows="3" placeholder="Optional details"></textarea>
            </div>
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherCalendar.closeModal()">Cancel</button>
            <button class="btn btn-blue" onclick="TeacherCalendar.saveEvent()">Save event</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveEvent() {
    const title = ((document.getElementById('cal-title') || {}).value || '').trim();
    const date = (document.getElementById('cal-date') || {}).value;
    if (!title || !date) {
      alert('Please enter a title and date.');
      return;
    }
    CalendarStore.save({
      date,
      title,
      time: (document.getElementById('cal-time') || {}).value || '',
      type: (document.getElementById('cal-type') || {}).value || 'Event',
      audience: (document.getElementById('cal-audience') || {}).value || '',
      notes: (document.getElementById('cal-notes') || {}).value || ''
    });
    // Jump view to that month
    const [y, m] = date.split('-').map(Number);
    this.viewYear = y;
    this.viewMonth = m - 1;
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
    setTimeout(() => t.remove(), 2200);
  }
};

if (typeof window !== 'undefined') window.TeacherCalendar = TeacherCalendar;
