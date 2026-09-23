/**
 * AssessmentStore — persist ECCD assessments in localStorage.
 * Key: brightsteps_assessments_v1
 *
 * Each assessment:
 * {
 *   id, childId, childName, recordType, ageMonths, period,
 *   savedAt, domainScores, insight, responses (optional snapshot)
 * }
 */

const AssessmentStore = {
  KEY: 'brightsteps_assessments_v1',

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('[AssessmentStore] read failed', e);
      return [];
    }
  },

  _write(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.warn('[AssessmentStore] write failed', e);
      return false;
    }
  },

  /**
   * Save or replace assessment for same child + period.
   * @returns {object} saved record
   */
  save(assessment) {
    const list = this._read();
    const id =
      assessment.id ||
      `a_${assessment.childId}_${assessment.period}_${Date.now()}`;

    const existingIdx = list.findIndex(
      a => a.childId === assessment.childId && a.period === assessment.period
    );
    const existing = existingIdx >= 0 ? list[existingIdx] : null;

    const record = {
      id: (existing && existing.id) || id,
      childId: assessment.childId,
      childName: assessment.childName || (existing && existing.childName) || '',
      recordType: assessment.recordType != null
        ? assessment.recordType
        : (existing && existing.recordType),
      ageMonths: assessment.ageMonths != null
        ? assessment.ageMonths
        : (existing && existing.ageMonths),
      period: assessment.period,
      savedAt: assessment.savedAt || new Date().toISOString(),
      domainScores: assessment.domainScores || (existing && existing.domainScores) || {},
      insight: assessment.insight !== undefined
        ? assessment.insight
        : (existing && existing.insight) || null,
      responses: assessment.responses !== undefined
        ? assessment.responses
        : (existing && existing.responses) || null,
      // Teacher final overrides (editable score sheet)
      finalScores: assessment.finalScores !== undefined
        ? assessment.finalScores
        : (existing && existing.finalScores) || null,
      finalized: assessment.finalized !== undefined
        ? assessment.finalized
        : (existing && existing.finalized) || false,
      finalizedAt: assessment.finalizedAt !== undefined
        ? assessment.finalizedAt
        : (existing && existing.finalizedAt) || null
    };

    if (existingIdx >= 0) list[existingIdx] = record;
    else list.push(record);

    this._write(list);
    return record;
  },

  listForChild(childId) {
    return this._read()
      .filter(a => a.childId === childId)
      .sort((a, b) => {
        // period order: 1st < 2nd < ...
        const order = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
        const pa = order[a.period] || 99;
        const pb = order[b.period] || 99;
        if (pa !== pb) return pa - pb;
        return (a.savedAt || '').localeCompare(b.savedAt || '');
      });
  },

  getLatest(childId) {
    const list = this.listForChild(childId);
    return list.length ? list[list.length - 1] : null;
  },

  get(childId, period) {
    return this._read().find(a => a.childId === childId && a.period === period) || null;
  },

  listAll() {
    return this._read();
  },

  clearChild(childId) {
    const list = this._read().filter(a => a.childId !== childId);
    this._write(list);
  },

  clearAll() {
    localStorage.removeItem(this.KEY);
  }
};
