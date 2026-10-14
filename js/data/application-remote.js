/**
 * BrightSteps — Online enrollment applications ↔ Supabase
 * Visitor submit uses anon/authenticated insert; teachers list via staff RLS.
 */
window.ApplicationRemote = {
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
    const p = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return Object.assign({}, p, {
      id: row.id,
      status: row.status || 'pending',
      submittedAt: row.created_at || p.submittedAt,
      reviewedAt: row.reviewed_at || null,
      reviewedBy: row.reviewed_by || null,
      enrolledChildId: row.enrolled_child_id || null,
      childName: row.child_name || p.childName || '',
      guardianName: row.guardian_name || p.guardianName || '',
      contactPhone: row.contact || p.contactPhone || '',
      rejectReason: p.rejectReason || null,
      enrolledChildCode: p.enrolledChildCode || null,
      _remote: true
    });
  },

  localToInsert(record) {
    return {
      facility_id: this.FACILITY_ID,
      status: record.status || 'pending',
      child_name: record.childName || '',
      guardian_name: record.guardianName || '',
      contact: record.contactPhone || record.contactEmail || '',
      payload: record
    };
  },

  async submit(record) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const row = this.localToInsert(record);
    // Prefer insert + return row. If SELECT/RLS blocks RETURNING, fall back to insert-only.
    let res = await sb.from('applications').insert(row).select('*').single();
    if (res.error && /row-level security|permission denied/i.test(res.error.message || '')) {
      console.warn('[ApplicationRemote] insert+select failed, retry insert-only', res.error.message);
      res = await sb.from('applications').insert(row);
      if (!res.error) {
        // No returned row — keep local-shaped record; teacher hydrate will pick up UUID later
        return { ok: true, application: Object.assign({}, record, { status: 'pending', _remotePending: true }) };
      }
    }
    if (res.error) {
      console.error('[ApplicationRemote] submit', res.error);
      return { ok: false, error: res.error.message };
    }
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) {
      return { ok: true, application: Object.assign({}, record, { status: 'pending', _remotePending: true }) };
    }
    return { ok: true, application: this.rowToLocal(data) };
  },

  async fetchAll() {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('applications')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[ApplicationRemote] fetchAll', error.message);
      return { ok: false, error: error.message, list: [] };
    }
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  },

  async updateStatus(id, status, extra) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    extra = extra || {};
    const patch = {
      status: status,
      reviewed_at: new Date().toISOString()
    };
    if (extra.enrolledChildId) patch.enrolled_child_id = extra.enrolledChildId;

    // Merge reject reason / codes into payload
    const { data: existing } = await sb.from('applications').select('payload').eq('id', id).maybeSingle();
    const payload = Object.assign({}, (existing && existing.payload) || {}, {
      rejectReason: extra.rejectReason != null ? extra.rejectReason : undefined,
      enrolledChildCode: extra.enrolledChildCode != null ? extra.enrolledChildCode : undefined,
      reviewedBy: extra.reviewedBy || 'Teacher'
    });
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    patch.payload = payload;

    const { data, error } = await sb
      .from('applications')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[ApplicationRemote] updateStatus', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, application: this.rowToLocal(data) };
  }
};
