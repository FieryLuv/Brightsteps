/**
 * BrightSteps — ECCD assessments ↔ Supabase
 */
window.AssessmentRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',

  online() {
    return typeof BsSupabase !== 'undefined' && BsSupabase.isConfigured() && BsSupabase.ready;
  },

  rowToLocal(row) {
    if (!row) return null;
    return {
      id: row.id,
      childId: row.child_id,
      childName: '',
      recordType: row.record_type,
      ageMonths: row.age_months,
      period: row.period,
      savedAt: row.saved_at || row.updated_at,
      domainScores: row.domain_scores || {},
      insight: row.insight || null,
      responses: row.responses || null,
      itemResults: row.item_results || null,
      finalScores: row.final_scores || null,
      finalized: row.finalized === true,
      finalizedAt: row.finalized_at || null,
      _remote: true
    };
  },

  localToRow(a) {
    return {
      facility_id: this.FACILITY_ID,
      child_id: a.childId,
      period: a.period,
      record_type: a.recordType != null ? a.recordType : null,
      age_months: a.ageMonths != null ? a.ageMonths : null,
      domain_scores: a.domainScores || {},
      responses: a.responses || {},
      item_results: a.itemResults || a.item_results || [],
      insight: a.insight || {},
      final_scores: a.finalScores || null,
      finalized: a.finalized === true,
      finalized_at: a.finalizedAt || null,
      saved_at: a.savedAt || new Date().toISOString()
    };
  },

  async upsert(assessment) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) {
      return { ok: false, error: 'Not signed in to Supabase.' };
    }
    const row = this.localToRow(assessment);
    if (!row.child_id || !row.period) {
      return { ok: false, error: 'child_id and period required' };
    }
    // UUID child ids only
    if (String(row.child_id).length < 30) {
      return { ok: false, error: 'Child must be saved on server first (UUID id). Re-open Children and use a server-enrolled child.' };
    }

    const { data, error } = await sb
      .from('assessments')
      .upsert(row, { onConflict: 'child_id,period' })
      .select('*')
      .single();

    if (error) {
      console.error('[AssessmentRemote] upsert', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, assessment: this.rowToLocal(data) };
  },

  async listForChild(childId) {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('assessments')
      .select('*')
      .eq('child_id', childId)
      .order('period');

    if (error) {
      console.warn('[AssessmentRemote] listForChild', error.message);
      return { ok: false, error: error.message, list: [] };
    }
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  },

  async fetchAllForFacility() {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('assessments')
      .select('*')
      .eq('facility_id', this.FACILITY_ID);

    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  }
};
