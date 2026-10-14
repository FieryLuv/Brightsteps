/**
 * ReportStore — parent-friendly progress reports (teacher approved).
 * Key: brightsteps_reports_v1
 */

const ReportStore = {
  KEY: 'brightsteps_reports_v1',

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

  /**
   * Save or replace report for child + period.
   */
  /** Evaluation period order for sorting (1st … 6th). */
  periodRank(period) {
    const map = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
    return map[period] || 99;
  },

  save(report) {
    const list = this._read();
    const id = report.id || `r_${report.childId}_${report.period}_${Date.now()}`;
    const record = {
      id,
      childId: report.childId,
      childName: report.childName || '',
      period: report.period,
      recordType: report.recordType,
      ageMonths: report.ageMonths,
      domainScores: report.domainScores || [],
      standardScore: report.standardScore != null ? report.standardScore : null,
      sumOfScaledScores: report.sumOfScaledScores != null ? report.sumOfScaledScores : null,
      overallLabel: report.overallLabel || '',
      teacherNote: report.teacherNote || '',
      tips: report.tips || [],
      parentDraft: report.parentDraft || '',
      strengths: report.strengths || [],
      needs: report.needs || [],
      teacherComments: report.teacherComments || [],
      focusItems: report.focusItems || [],
      status: report.status || 'draft', // draft | approved
      approvedAt: report.approvedAt || null,
      updatedAt: new Date().toISOString()
    };

    const idx = list.findIndex(
      r => String(r.childId) === String(record.childId) && r.period === record.period
    );
    if (idx >= 0) list[idx] = { ...list[idx], ...record, id: list[idx].id };
    else list.push(record);

    this._write(list);

    if (typeof ReportRemote !== 'undefined' && ReportRemote.online()) {
      ReportRemote.upsert(record).then(function (r) {
        if (!r.ok) {
          console.error('[ReportStore] remote save failed', r.error);
          record._remoteError = r.error;
        } else {
          console.info('[ReportStore] synced to Supabase', record.period, record.status);
        }
      });
    }
    return record;
  },

  async hydrateForChild(childId) {
    if (typeof ReportRemote === 'undefined' || !ReportRemote.online()) {
      return this.listForChild(childId);
    }
    const remote = await ReportRemote.listForChild(childId);
    if (!remote.ok) {
      console.warn('[ReportStore] hydrate failed', remote.error);
      return this.listForChild(childId);
    }
    const list = this._read().filter(r => String(r.childId) !== String(childId));
    remote.list.forEach(function (r) { list.push(r); });
    this._write(list);
    return this.listForChild(childId);
  },

  listForChild(childId) {
    return this._read()
      .filter(r => String(r.childId) === String(childId))
      .sort((a, b) => this.periodRank(a.period) - this.periodRank(b.period));
  },

  /** All approved reports for a child, one per evaluation period, oldest → newest. */
  listApprovedForChild(childId) {
    return this.listForChild(childId).filter(r => r.status === 'approved');
  },

  /** Latest approved period (highest 1st…6th rank). */
  getApproved(childId) {
    const approved = this.listApprovedForChild(childId);
    if (!approved.length) return null;
    return approved[approved.length - 1];
  },

  getApprovedPeriod(childId, period) {
    return this.listApprovedForChild(childId).find(r => r.period === period) || null;
  },

  get(childId, period) {
    return this._read().find(r => r.childId === childId && r.period === period) || null;
  },

  listAll() {
    return this._read();
  },

  listApproved() {
    return this._read().filter(r => r.status === 'approved');
  }
};
