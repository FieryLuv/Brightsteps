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
      status: report.status || 'draft', // draft | approved
      approvedAt: report.approvedAt || null,
      updatedAt: new Date().toISOString()
    };

    const idx = list.findIndex(
      r => r.childId === record.childId && r.period === record.period
    );
    if (idx >= 0) list[idx] = { ...list[idx], ...record, id: list[idx].id };
    else list.push(record);

    this._write(list);
    return record;
  },

  listForChild(childId) {
    return this._read()
      .filter(r => r.childId === childId)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  },

  getApproved(childId) {
    return this.listForChild(childId).find(r => r.status === 'approved') || null;
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
