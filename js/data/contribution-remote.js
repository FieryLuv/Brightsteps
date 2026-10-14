/**
 * BrightSteps — Monthly contributions (C1) ↔ Supabase
 */
window.ContributionRemote = {
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
      childId: row.child_id,
      yearMonth: row.year_month,
      amountDue: row.amount_due != null ? Number(row.amount_due) : 0,
      amountPaid: row.amount_paid != null ? Number(row.amount_paid) : 0,
      status: row.status || 'unpaid',
      paidAt: row.paid_at || '',
      notes: row.notes || '',
      updatedAt: row.updated_at,
      _remote: true
    };
  },

  async upsert(record) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) return { ok: false, error: 'Not signed in.' };
    if (!record.childId || String(record.childId).length < 30) {
      return { ok: false, error: 'Child must be server UUID.' };
    }
    const row = {
      facility_id: this.FACILITY_ID,
      child_id: record.childId,
      year_month: record.yearMonth,
      amount_due: record.amountDue != null ? record.amountDue : 0,
      amount_paid: record.amountPaid != null ? record.amountPaid : 0,
      status: record.status || 'unpaid',
      notes: record.notes || '',
      paid_at: record.paidAt || null
    };
    if (!row.paid_at) row.paid_at = null;
    const { data, error } = await sb
      .from('contributions')
      .upsert(row, { onConflict: 'child_id,year_month' })
      .select('*')
      .single();
    if (error) {
      console.error('[ContributionRemote] upsert', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, record: this.rowToLocal(data) };
  },

  async fetchMonth(yearMonth) {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('contributions')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .eq('year_month', yearMonth);
    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  },

  async fetchAll() {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('contributions')
      .select('*')
      .eq('facility_id', this.FACILITY_ID);
    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  }
};
