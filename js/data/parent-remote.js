/**
 * BrightSteps — Parent multi-device login + hydrate via Supabase RPC
 * Does not require parent Auth users; uses SECURITY DEFINER parent_portal_login.
 */
window.ParentRemote = {
  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
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

    // Assessments
    if (typeof AssessmentStore !== 'undefined' && payload.assessments) {
      try {
        const local = payload.assessments.map(function (a) {
          return {
            childId: a.child_id,
            period: a.period,
            recordType: a.record_type,
            ageMonths: a.age_months,
            domains: a.domains || {},
            marks: a.marks || {},
            comments: a.comments || {},
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

    // Reports
    if (typeof ReportStore !== 'undefined' && payload.reports) {
      try {
        const local = payload.reports.map(function (r) {
          return {
            childId: r.child_id,
            period: r.period,
            status: r.status || 'approved',
            parentDraft: r.parent_draft || '',
            teacherNote: r.teacher_note || '',
            tips: r.tips || [],
            domains: r.domains || {},
            approvedAt: r.approved_at,
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
          map[key].marks[row.child_id] = row.mark;
          if (row.remarks) map[key].remarks[row.child_id] = row.remarks;
        });
        if (AttendanceStore._write) AttendanceStore._write(map);
      } catch (e) { console.warn('[ParentRemote] attendance hydrate', e); }
    }

    // Health
    if (typeof HealthStore !== 'undefined' && payload.health) {
      try {
        const data = HealthStore._read ? HealthStore._read() : { measurements: [], profiles: {} };
        (payload.health || []).forEach(function (row) {
          const m = {
            id: row.id,
            childId: row.child_id,
            date: row.recorded_at,
            heightCm: row.height_cm,
            weightKg: row.weight_kg,
            bmi: row.bmi,
            nutritionStatus: row.nutrition_status || '',
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
    if (typeof SfpStore !== 'undefined' && payload.sfp && SfpRemote && SfpRemote.rowToLocalBen) {
      try {
        const state = SfpStore._read ? SfpStore._read() : SfpStore.ensureSeed();
        (payload.sfp || []).forEach(function (row) {
          const local = SfpRemote.rowToLocalBen(row);
          if (local && local.childId) state.beneficiaries[String(local.childId)] = local;
        });
        if (SfpStore._write) SfpStore._write(state);
      } catch (e) { console.warn('[ParentRemote] sfp hydrate', e); }
    }
  }
};
