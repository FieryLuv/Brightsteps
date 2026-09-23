/**
 * CalendarStore — center events.
 * Key: brightsteps_calendar_v1
 */

const CalendarStore = {
  KEY: 'brightsteps_calendar_v1',

  defaults: [
    { id: 'e1', date: '2026-09-25', title: 'Parent-Teacher Meeting', time: '2:00 PM', type: 'Meeting', audience: 'Parents & Teachers', notes: 'Quarterly progress discussion.' },
    { id: 'e2', date: '2026-09-28', title: 'Health & Nutrition Screening', time: '9:00 AM', type: 'Health', audience: 'All children', notes: 'Height, weight, and nutrition check.' },
    { id: 'e3', date: '2026-10-05', title: 'Storytelling Session', time: '10:00 AM', type: 'Activity', audience: 'All sections', notes: 'Guest reader from the community.' },
    { id: 'e4', date: '2026-10-12', title: 'End of Month Celebration', time: '1:00 PM', type: 'Event', audience: 'Families', notes: 'Simple program and recognition.' }
  ],

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) {
        this._write(this.defaults);
        return this.defaults.slice();
      }
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : this.defaults.slice();
    } catch (e) {
      return this.defaults.slice();
    }
  },

  _write(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  },

  listAll() {
    return this._read().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  },

  listForMonth(year, monthIndex) {
    // monthIndex 0-11
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    return this.listAll().filter(e => (e.date || '').startsWith(prefix));
  },

  getByDate(dateStr) {
    return this.listAll().filter(e => e.date === dateStr);
  },

  save(event) {
    const list = this._read();
    const id = event.id || `ev_${Date.now()}`;
    const record = {
      id,
      date: event.date,
      title: event.title || 'Event',
      time: event.time || '',
      type: event.type || 'Event',
      audience: event.audience || '',
      notes: event.notes || ''
    };
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    this._write(list);
    return record;
  },

  remove(id) {
    const list = this._read().filter(e => e.id !== id);
    this._write(list);
  },

  upcoming(limit) {
    const today = new Date().toISOString().slice(0, 10);
    return this.listAll().filter(e => e.date >= today).slice(0, limit || 8);
  }
};

if (typeof window !== 'undefined') window.CalendarStore = CalendarStore;
