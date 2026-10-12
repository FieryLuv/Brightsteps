/**
 * HealthStore — height, weight, BMI, nutrition & medical notes per child.
 * Key: brightsteps_health_v1
 */

const HealthStore = {
  KEY: 'brightsteps_health_v1',

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return { measurements: [], profiles: {} };
      const data = JSON.parse(raw);
      return {
        measurements: Array.isArray(data.measurements) ? data.measurements : [],
        profiles: data.profiles && typeof data.profiles === 'object' ? data.profiles : {}
      };
    } catch (e) {
      return { measurements: [], profiles: {} };
    }
  },

  _write(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * BMI (kg/m²) and simple child status labels.
   * Teacher can still override status.
   */
  computeBmi(heightCm, weightKg) {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const m = h / 100;
    const bmi = w / (m * m);
    return Math.round(bmi * 10) / 10;
  },

  suggestStatus(bmi) {
    if (bmi == null || isNaN(bmi)) return '';
    // Simplified classroom categories (not a clinical WHO z-score tool)
    if (bmi < 14) return 'Underweight';
    if (bmi < 18) return 'Normal';
    if (bmi < 21) return 'Overweight';
    return 'Obese';
  },

  /**
   * Map BMI to SFP nutrition status options (teacher may still override).
   * Not a clinical WHO assessment — for classroom prefill only.
   */
  suggestNutrition(bmi) {
    if (bmi == null || isNaN(bmi)) return '';
    if (bmi < 12.5) return 'Severely Underweight';
    if (bmi < 14) return 'Underweight';
    if (bmi < 18) return 'Normal';
    if (bmi < 21) return 'Overweight';
    return 'Obese';
  },

  /** Age label from birth date (years + months for under ~6 yrs). */
  ageLabelFromBirthDate(birthDate) {
    if (!birthDate) return '';
    const b = new Date(String(birthDate).slice(0, 10) + 'T00:00:00');
    if (isNaN(b.getTime())) return '';
    const now = new Date();
    let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months -= 1;
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years <= 0) return rem + (rem === 1 ? ' month' : ' months');
    if (rem === 0) return years + (years === 1 ? ' year' : ' years');
    return years + ' years ' + rem + ' months';
  },

  saveMeasurement(entry) {
    const data = this._read();
    const id = entry.id || `hm_${entry.childId}_${Date.now()}`;
    const record = {
      id,
      childId: entry.childId,
      childName: entry.childName || '',
      date: entry.date || new Date().toISOString().slice(0, 10),
      heightCm: entry.heightCm != null ? Number(entry.heightCm) : null,
      weightKg: entry.weightKg != null ? Number(entry.weightKg) : null,
      bmi: entry.bmi != null ? Number(entry.bmi) : null,
      status: entry.status || '',
      nutritionStatus: entry.nutritionStatus || '',
      feedingParticipating: entry.feedingParticipating !== false,
      notes: entry.notes || '',
      recordedBy: entry.recordedBy || 'Teacher',
      savedAt: new Date().toISOString()
    };
    data.measurements.push(record);
    this._write(data);
    return record;
  },

  listForChild(childId) {
    return this._read().measurements
      .filter(m => m.childId === childId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.savedAt || '').localeCompare(a.savedAt || ''));
  },

  getLatest(childId) {
    const list = this.listForChild(childId);
    return list.length ? list[0] : null;
  },

  getProfile(childId) {
    const data = this._read();
    return data.profiles[String(childId)] || {
      allergies: '',
      medicalConditions: '',
      immunizations: '',
      notes: ''
    };
  },

  saveProfile(childId, profile) {
    const data = this._read();
    data.profiles[String(childId)] = {
      allergies: profile.allergies || '',
      medicalConditions: profile.medicalConditions || '',
      immunizations: profile.immunizations || '',
      notes: profile.notes || '',
      updatedAt: new Date().toISOString()
    };
    this._write(data);
    return data.profiles[String(childId)];
  },

  listAllMeasurements() {
    return this._read().measurements;
  },

  summaryStats(childIds) {
    const ids = childIds || [];
    let withRecord = 0;
    let normal = 0;
    let under = 0;
    let over = 0;
    let feeding = 0;
    ids.forEach(id => {
      const latest = this.getLatest(id);
      if (!latest) return;
      withRecord++;
      const s = (latest.status || '').toLowerCase();
      if (s.includes('normal')) normal++;
      else if (s.includes('under')) under++;
      else if (s.includes('over') || s.includes('obese')) over++;
      if (latest.feedingParticipating) feeding++;
    });
    return { withRecord, normal, under, over, feeding, total: ids.length };
  }
};
