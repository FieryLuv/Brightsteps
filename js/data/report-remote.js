/**
 * BrightSteps — Progress reports ↔ Supabase (progress_reports table)
 */
window.ReportRemote = {
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
      period: row.period,
      recordType: row.record_type,
      ageMonths: row.age_months,
      domainScores: row.domain_scores || [],
      standardScore: row.standard_score,
      sumOfScaledScores: row.sum_of_scaled,
      overallLabel: row.overall_label || '',
      teacherNote: row.teacher_note || '',
      parentDraft: row.parent_draft || '',
      tips: row.tips || [],
      strengths: row.strengths || [],
      needs: row.needs || [],
      teacherComments: row.teacher_comments || [],
      focusItems: row.focus_items || [],
      status: row.status || 'draft',
      approvedAt: row.approved_at || null,
      updatedAt: row.updated_at,
      _remote: true
    };
  },

  localToRow(r) {
    return {
      facility_id: this.FACILITY_ID,
      child_id: r.childId,
      period: r.period,
      record_type: r.recordType != null ? r.recordType : null,
      age_months: r.ageMonths != null ? r.ageMonths : null,
      domain_scores: r.domainScores || [],
      standard_score: r.standardScore != null ? r.standardScore : null,
      sum_of_scaled: r.sumOfScaledScores != null ? r.sumOfScaledScores : null,
      overall_label: r.overallLabel || '',
      teacher_note: r.teacherNote || '',
      parent_draft: r.parentDraft || '',
      tips: r.tips || [],
      strengths: r.strengths || [],
      needs: r.needs || [],
      teacher_comments: r.teacherComments || [],
      focus_items: r.focusItems || [],
      status: r.status || 'draft',
      approved_at: r.approvedAt || null
    };
  },

  async upsert(report) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) {
      return { ok: false, error: 'Not signed in to Supabase.' };
    }
    const row = this.localToRow(report);
    if (!row.child_id || !row.period) {
      return { ok: false, error: 'child_id and period required' };
    }
    if (String(row.child_id).length < 30) {
      return { ok: false, error: 'Child must be a server-enrolled UUID.' };
    }

    const { data, error } = await sb
      .from('progress_reports')
      .upsert(row, { onConflict: 'child_id,period' })
      .select('*')
      .single();

    if (error) {
      console.error('[ReportRemote] upsert', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, report: this.rowToLocal(data) };
  },

  async listForChild(childId) {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('progress_reports')
      .select('*')
      .eq('child_id', childId)
      .order('period');

    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  }
};
