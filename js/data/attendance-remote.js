/**
 * BrightSteps — Attendance ↔ Supabase
 */
window.AttendanceRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',

  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
  },

  /**
   * Load marks for a section + date into { marks, remarks } shape used by AttendanceStore.
   */
  async fetchDay(date, sectionKey) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('attendance')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .eq('attend_date', date)
      .eq('section_key', sectionKey);

    if (error) return { ok: false, error: error.message };

    const marks = {};
    const remarks = {};
    (data || []).forEach(row => {
      marks[row.child_id] = row.mark;
      if (row.remarks) remarks[row.child_id] = row.remarks;
    });
    return { ok: true, marks, remarks, rows: data || [] };
  },

  /**
   * Upsert all marks for a day/section.
   * @param {{ date, sectionKey, marks: Object, remarks: Object }} payload
   */
  async saveDay(payload) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) {
      return { ok: false, error: 'Not signed in to Supabase.' };
    }
    const date = payload.date;
    const sectionKey = payload.sectionKey;
    const marks = payload.marks || {};
    const remarks = payload.remarks || {};
    const rows = [];
    Object.keys(marks).forEach(function (childId) {
      if (String(childId).length < 30) {
        console.warn('[AttendanceRemote] skip non-UUID child', childId);
        return;
      }
      rows.push({
        facility_id: AttendanceRemote.FACILITY_ID,
        child_id: childId,
        section_key: sectionKey,
        attend_date: date,
        mark: marks[childId],
        remarks: remarks[childId] || ''
      });
    });

    if (!rows.length) return { ok: false, error: 'No server children to save (need UUID ids).' };

    const { data, error } = await sb
      .from('attendance')
      .upsert(rows, { onConflict: 'child_id,attend_date' })
      .select('id');

    if (error) {
      console.error('[AttendanceRemote] saveDay', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, count: (data || []).length };
  },

  async fetchMonth(sectionKey, yearMonth) {
    if (!this.online()) return { ok: false, error: 'offline', rows: [] };
    const sb = BsSupabase.get();
    const start = yearMonth + '-01';
    // rough end
    const { data, error } = await sb
      .from('attendance')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .eq('section_key', sectionKey)
      .gte('attend_date', start)
      .lte('attend_date', yearMonth + '-31');

    if (error) return { ok: false, error: error.message, rows: [] };
    return { ok: true, rows: data || [] };
  }
};
