/**
 * BrightSteps — Parent multi-device login + hydrate via Supabase RPC
 * Does not require parent Auth users; uses SECURITY DEFINER parent_portal_login.
 */
window.ParentRemote = {
  online() {
    if (typeof BsSupabase === 'undefined') return false;
    if (!BsSupabase.isConfigured()) return false;
    try {
      const client = BsSupabase.get();
      return !!client;
    } catch (e) {
      return false;
    }
  },

  /** Human-readable reason when online() is false */
  offlineReason() {
    if (typeof BsSupabase === 'undefined') return 'Supabase client script not loaded.';
    if (!BsSupabase.isConfigured()) {
      return 'Supabase is not configured on this site (empty url/key in supabase-config.js).';
    }
    try {
      const c = BsSupabase.get();
      if (!c) return BsSupabase.lastError || 'Supabase init failed.';
    } catch (e) {
      return (e && e.message) || 'Supabase init error.';
    }
    return '';
  },

  dbChildToLocal(row) {
    if (!row) return null;
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.rowToChild) {
      const c = ChildrenRemote.rowToChild(row);
      c.parentPassword = row.parent_password || '';
      return c;
    }
    return {
      id: row.id,
      childCode: row.child_code || '',
      name: row.full_name || '',
      ageLabel: row.age_label || '',
      section: row.section_label || row.section_key || '',
      sectionKey: row.section_key || '',
      parentName: row.parent_name || '',
      parentLoginName: row.parent_login_name || '',
      parentPassword: row.parent_password || '',
      _remote: true
    };
  },

  /**
   * @returns {Promise<{ok, error?, children?, ...}>}
   */
  async login(guardian, childCode, password) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data, error } = await sb.rpc('parent_portal_login', {
      p_guardian: guardian || '',
      p_child_code: childCode || '',
      p_password: password || ''
    });
    if (error) {
      console.error('[ParentRemote] login', error);
      return { ok: false, error: error.message };
    }
    if (!data || data.ok === false) {
      return { ok: false, error: (data && data.error) || 'Login failed.' };
    }
    return {
      ok: true,
      children: (data.children || []).map(r => this.dbChildToLocal(r)),
      reports: data.reports || [],
      assessments: data.assessments || [],
      attendance: data.attendance || [],
      health: data.health || [],
      contributions: data.contributions || [],
      sfp: data.sfp || []
    };
  },

  /**
   * Write RPC payload into LocalStorage stores so ParentDashboard can render as before.
   */
  applyHydration(payload) {
    if (!payload || !payload.ok) return;

    // Children into SampleChildren / registry
    if (payload.children && payload.children.length && typeof SampleChildren !== 'undefined') {
      payload.children.forEach(function (c) {
        const idx = SampleChildren.findIndex(x => String(x.id) === String(c.id) ||
          (c.childCode && x.childCode === c.childCode));
        if (idx >= 0) SampleChildren[idx] = Object.assign({}, SampleChildren[idx], c);
        else SampleChildren.push(c);
      });
      try {
        localStorage.setItem('brightsteps_enrolled_children_v1', JSON.stringify(SampleChildren));
      } catch (e) { /* ignore */ }
    }

    // Assessments — include domainScores for parent domain snapshot donuts
    if (typeof AssessmentStore !== 'undefined' && payload.assessments) {
      try {
        const local = payload.assessments.map(function (a) {
          if (typeof AssessmentRemote !== 'undefined' && AssessmentRemote.rowToLocal) {
            return AssessmentRemote.rowToLocal(a);
          }
          return {
            childId: a.child_id,
            period: a.period,
            recordType: a.record_type,
            ageMonths: a.age_months,
            domainScores: a.domain_scores || {},
            responses: a.responses || {},
            itemResults: a.item_results || [],
            insight: a.insight || {},
            finalScores: a.final_scores || null,
            finalized: a.finalized,
            savedAt: a.saved_at || a.created_at
          };
        });
        const existing = AssessmentStore._read ? AssessmentStore._read() : [];
        const byKey = {};
        existing.forEach(function (x) { byKey[String(x.childId) + '|' + x.period] = x; });
        local.forEach(function (x) { byKey[String(x.childId) + '|' + x.period] = x; });
        const merged = Object.keys(byKey).map(k => byKey[k]);
        if (AssessmentStore._write) AssessmentStore._write(merged);
        else localStorage.setItem('brightsteps_assessments_v1', JSON.stringify(merged));
      } catch (e) { console.warn('[ParentRemote] assessments hydrate', e); }
    }

    // Reports — full row (domain scores, tips, strengths, needs) for parent snapshot
    if (typeof ReportStore !== 'undefined' && payload.reports) {
      try {
        const local = payload.reports.map(function (r) {
          if (typeof ReportRemote !== 'undefined' && ReportRemote.rowToLocal) {
            return ReportRemote.rowToLocal(r);
          }
          return {
            childId: r.child_id,
            period: r.period,
            recordType: r.record_type,
            ageMonths: r.age_months,
            domainScores: r.domain_scores || [],
            standardScore: r.standard_score,
            sumOfScaledScores: r.sum_of_scaled,
            overallLabel: r.overall_label || '',
            teacherNote: r.teacher_note || '',
            parentDraft: r.parent_draft || '',
            tips: r.tips || [],
            strengths: r.strengths || [],
            needs: r.needs || [],
            teacherComments: r.teacher_comments || [],
            focusItems: r.focus_items || [],
            status: r.status || 'approved',
            approvedAt: r.approved_at,
            updatedAt: r.updated_at,
            savedAt: r.updated_at || r.created_at
          };
        });
        const existing = ReportStore._read ? ReportStore._read() : [];
        const byKey = {};
        existing.forEach(function (x) { byKey[String(x.childId) + '|' + x.period] = x; });
        local.forEach(function (x) { byKey[String(x.childId) + '|' + x.period] = x; });
        if (ReportStore._write) ReportStore._write(Object.keys(byKey).map(k => byKey[k]));
      } catch (e) { console.warn('[ParentRemote] reports hydrate', e); }
    }

    // Attendance — convert rows into day map shape
    if (typeof AttendanceStore !== 'undefined' && payload.attendance) {
      try {
        const map = AttendanceStore._read ? AttendanceStore._read() : {};
        (payload.attendance || []).forEach(function (row) {
          const date = row.attend_date;
          const sectionKey = row.section_key || 'all';
          const key = date + '|' + sectionKey;
          if (!map[key]) {
            map[key] = { date: date, sectionKey: sectionKey, marks: {}, remarks: {}, savedAt: new Date().toISOString() };
          }
          const cid = String(row.child_id);
          map[key].marks[cid] = row.mark;
          if (row.remarks) map[key].remarks[cid] = row.remarks;
        });
        if (AttendanceStore._write) AttendanceStore._write(map);
      } catch (e) { console.warn('[ParentRemote] attendance hydrate', e); }
    }

    // Health
    if (typeof HealthStore !== 'undefined' && payload.health) {
      try {
        const data = HealthStore._read ? HealthStore._read() : { measurements: [], profiles: {} };
        (payload.health || []).forEach(function (row) {
          const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
          const m = {
            id: row.id,
            childId: row.child_id,
            date: row.recorded_at || row.date || '',
            heightCm: row.height_cm != null ? Number(row.height_cm) : null,
            weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
            bmi: row.bmi != null ? Number(row.bmi) : null,
            status: payload.status || row.nutrition_status || '',
            nutritionStatus: row.nutrition_status || payload.status || '',
            notes: row.notes || '',
            feedingParticipating: row.feeding_participating !== false,
            savedAt: row.created_at,
            _remote: true
          };
          const idx = data.measurements.findIndex(x => String(x.id) === String(m.id));
          if (idx >= 0) data.measurements[idx] = m;
          else data.measurements.push(m);
        });
        if (HealthStore._write) HealthStore._write(data);
      } catch (e) { console.warn('[ParentRemote] health hydrate', e); }
    }

    // Contributions
    if (typeof ContributionStore !== 'undefined' && payload.contributions) {
      try {
        const list = ContributionStore._read ? ContributionStore._read() : [];
        (payload.contributions || []).forEach(function (row) {
          const rec = {
            id: row.id,
            childId: row.child_id,
            yearMonth: row.year_month,
            amountDue: row.amount_due,
            amountPaid: row.amount_paid,
            status: row.status,
            paidAt: row.paid_at || '',
            notes: row.notes || ''
          };
          const idx = list.findIndex(x => String(x.childId) === String(rec.childId) && x.yearMonth === rec.yearMonth);
          if (idx >= 0) list[idx] = rec;
          else list.push(rec);
        });
        if (ContributionStore._write) ContributionStore._write(list);
      } catch (e) { console.warn('[ParentRemote] contrib hydrate', e); }
    }

    // SFP beneficiaries
    if (typeof SfpStore !== 'undefined' && payload.sfp && typeof SfpRemote !== 'undefined' && SfpRemote.rowToLocalBen) {
      try {
        const state = SfpStore._read ? SfpStore._read() : (SfpStore.ensureSeed ? SfpStore.ensureSeed() : { beneficiaries: {} });
        if (!state.beneficiaries) state.beneficiaries = {};
        (payload.sfp || []).forEach(function (row) {
          const local = SfpRemote.rowToLocalBen(row);
          if (local && local.childId) state.beneficiaries[String(local.childId)] = local;
        });
        if (SfpStore._write) SfpStore._write(state);
      } catch (e) { console.warn('[ParentRemote] sfp hydrate', e); }
    }
  },

  SESSION_KEY: 'brightsteps_parent_session_v1',

  saveSession(guardian, childCode, password) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        guardian: guardian || '',
        childCode: childCode || '',
        password: password || '',
        at: new Date().toISOString()
      }));
    } catch (e) { /* ignore */ }
  },

  loadSession() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  },

  clearSession() {
    try { localStorage.removeItem(this.SESSION_KEY); } catch (e) { /* ignore */ }
  },

  /** Re-fetch family data using stored session credentials */
  async refresh() {
    const s = this.loadSession();
    if (!s || !s.guardian) return { ok: false, error: 'No parent session. Please log in again.' };
    const remote = await this.login(s.guardian, s.childCode, s.password);
    if (remote.ok) this.applyHydration(remote);
    return remote;
  }
};

if (typeof window !== 'undefined') window.ParentRemote = window.ParentRemote;

console.info('[BrightSteps] ParentRemote ready');
