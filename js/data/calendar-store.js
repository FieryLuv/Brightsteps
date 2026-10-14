/**
 * CalendarStore — center events.
 * Key: brightsteps_calendar_v1
 * Online: Supabase calendar_events is source of truth (no demo seed).
 */

const CalendarStore = {
  KEY: 'brightsteps_calendar_v1',

  /** Demo only when offline and storage empty */
  defaults: [],

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
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
    const prefix = year + '-' + String(monthIndex + 1).padStart(2, '0');
    return this.listAll().filter(e => (e.date || '').startsWith(prefix));
  },

  getByDate(dateStr) {
    return this.listAll().filter(e => e.date === dateStr);
  },

  save(event) {
    const list = this._read();
    const id = event.id || ('ev_' + Date.now());
    const record = {
      id,
      date: event.date,
      title: event.title || 'Event',
      time: event.time || '',
      type: event.type || 'Event',
      audience: event.audience || '',
      notes: event.notes || ''
    };
    const idx = list.findIndex(e => String(e.id) === String(id));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    this._write(list);

    if (typeof CalendarRemote !== 'undefined' && CalendarRemote.online()) {
      CalendarRemote.upsert(record).then(function (r) {
        if (!r.ok) {
          console.error('[CalendarStore] remote save failed', r.error);
          return;
        }
        if (r.event) {
          const list2 = CalendarStore._read();
          const i = list2.findIndex(e => String(e.id) === String(record.id));
          if (i >= 0) list2[i] = r.event;
          else list2.push(r.event);
          // Drop temp local id if server returned UUID
          if (String(record.id) !== String(r.event.id)) {
            const j = list2.findIndex(e => String(e.id) === String(record.id));
            if (j >= 0) list2.splice(j, 1);
            if (!list2.some(e => String(e.id) === String(r.event.id))) list2.push(r.event);
          }
          CalendarStore._write(list2);
        }
        console.info('[CalendarStore] synced event');
      });
    }
    return record;
  },

  remove(id) {
    const list = this._read().filter(e => String(e.id) !== String(id));
    this._write(list);
    if (typeof CalendarRemote !== 'undefined' && CalendarRemote.online()) {
      CalendarRemote.remove(id).then(function (r) {
        if (!r.ok) console.warn('[CalendarStore] remote delete failed', r.error);
      });
    }
  },

  async hydrateAll() {
    if (typeof CalendarRemote === 'undefined' || !CalendarRemote.online()) {
      return this.listAll();
    }
    const remote = await CalendarRemote.fetchAll();
    if (!remote.ok) {
      console.warn('[CalendarStore] hydrate failed', remote.error);
      return this.listAll();
    }
    this._write(remote.list || []);
    return this.listAll();
  },

  upcoming(limit) {
    const today = new Date().toISOString().slice(0, 10);
    return this.listAll().filter(e => e.date >= today).slice(0, limit || 8);
  }
};

if (typeof window !== 'undefined') window.CalendarStore = CalendarStore;
