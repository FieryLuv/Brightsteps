/**
 * BrightSteps — Calendar events ↔ Supabase
 */
window.CalendarRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',

  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
  },

  rowToLocal(row) {
    if (!row) return null;
    return {
      id: row.id,
      date: row.event_date,
      title: row.title || 'Event',
      time: row.event_time || '',
      type: row.event_type || 'Event',
      audience: row.audience || '',
      notes: row.description || '',
      _remote: true
    };
  },

  localToRow(ev) {
    return {
      facility_id: this.FACILITY_ID,
      title: ev.title || 'Event',
      event_date: ev.date,
      event_time: ev.time || '',
      event_type: ev.type || 'Event',
      audience: ev.audience || '',
      description: ev.notes || ''
    };
  },

  async upsert(ev) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) return { ok: false, error: 'Not signed in.' };

    const row = this.localToRow(ev);
    const isUuid = ev.id && String(ev.id).length > 30;

    if (isUuid) {
      const { data, error } = await sb
        .from('calendar_events')
        .update(row)
        .eq('id', ev.id)
        .select('*')
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, event: this.rowToLocal(data) };
    }

    const { data, error } = await sb
      .from('calendar_events')
      .insert(row)
      .select('*')
      .single();
    if (error) {
      console.error('[CalendarRemote] insert', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, event: this.rowToLocal(data) };
  },

  async remove(id) {
    if (!this.online()) return { ok: false, error: 'offline' };
    if (!id || String(id).length < 30) return { ok: true, skipped: true };
    const sb = BsSupabase.get();
    const { error } = await sb.from('calendar_events').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async fetchAll() {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('calendar_events')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .order('event_date');
    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  }
};
