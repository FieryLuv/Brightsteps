/**
 * AttendanceStore — daily attendance by section/date + remarks.
 * Key: brightsteps_attendance_v1
 *
 * records: { "YYYY-MM-DD|sectionKey": { date, sectionKey, marks: { childId: 'P'|'A' }, remarks: { childId: string }, savedAt } }
 */

const AttendanceStore = {
  KEY: 'brightsteps_attendance_v1',

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  },

  _write(map) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(map));
      return true;
    } catch (e) {
      return false;
    }
  },

  _key(date, sectionKey) {
    return `${date}|${sectionKey}`;
  },

  getDay(date, sectionKey) {
    const map = this._read();
    return map[this._key(date, sectionKey)] || null;
  },

  saveDay({ date, sectionKey, marks, remarks }) {
    const map = this._read();
    const key = this._key(date, sectionKey);
    map[key] = {
      date,
      sectionKey,
      marks: marks || {},
      remarks: remarks || {},
      savedAt: new Date().toISOString()
    };
    this._write(map);
    return map[key];
  },

  /** All day records for a section (any date) */
  listForSection(sectionKey) {
    const map = this._read();
    return Object.values(map)
      .filter(r => r.sectionKey === sectionKey)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  /** Marks for one child across all saved days */
  listForChild(childId) {
    const map = this._read();
    const out = [];
    Object.values(map).forEach(day => {
      if (day.marks && day.marks[childId] != null) {
        out.push({
          date: day.date,
          sectionKey: day.sectionKey,
          status: day.marks[childId],
          remark: (day.remarks && day.remarks[childId]) || ''
        });
      }
    });
    return out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  /**
   * Stats for children in a section over optional date prefix (YYYY-MM).
   */
  sectionStats(sectionKey, childIds, monthPrefix) {
    const days = this.listForSection(sectionKey).filter(d =>
      !monthPrefix || (d.date || '').startsWith(monthPrefix)
    );
    let present = 0;
    let absent = 0;
    const perChild = {};
    childIds.forEach(id => { perChild[id] = { present: 0, absent: 0 }; });

    days.forEach(day => {
      childIds.forEach(id => {
        const m = day.marks && day.marks[id];
        if (m === 'P') {
          present++;
          perChild[id].present++;
        } else if (m === 'A') {
          absent++;
          perChild[id].absent++;
        }
      });
    });

    const total = present + absent;
    const rate = total ? Math.round((present / total) * 100) : null;

    // Consecutive absence alerts (from most recent dates)
    const alerts = [];
    childIds.forEach(id => {
      const history = this.listForChild(id)
        .filter(h => h.sectionKey === sectionKey)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      let streak = 0;
      for (const h of history) {
        if (h.status === 'A') streak++;
        else break;
      }
      if (streak >= 3) {
        alerts.push({ childId: id, consecutive: streak });
      }
    });

    return { present, absent, total, rate, daysRecorded: days.length, perChild, alerts };
  }
};
