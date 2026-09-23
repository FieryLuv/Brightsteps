/**
 * ChildRegistry — merges seed SampleChildren with teacher-enrolled children.
 * Supports walk-in encoding and future autofill from online applications.
 *
 * Key: brightsteps_enrolled_children_v1
 *
 * Online enrollment (future):
 *   ChildRegistry.enrollFromApplication(appPayload)
 *   → maps softcopy application fields into the same child shape, then save.
 */

const ChildRegistry = {
  KEY: 'brightsteps_enrolled_children_v1',
  _merged: false,

  _readEnrolled() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  _writeEnrolled(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  },

  /** Ensure SampleChildren includes persisted enrollments (call once at boot / before lists). */
  ensureMerged() {
    if (typeof SampleChildren === 'undefined') return;
    const enrolled = this._readEnrolled();
    enrolled.forEach(c => {
      if (!SampleChildren.some(x => x.id === c.id || (c.childCode && x.childCode === c.childCode))) {
        SampleChildren.push(c);
      }
    });
    this._merged = true;
  },

  all() {
    this.ensureMerged();
    return typeof SampleChildren !== 'undefined' ? SampleChildren : [];
  },

  nextId() {
    const all = this.all();
    const max = all.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
    return max + 1;
  },

  nextChildCode() {
    const all = this.all();
    let max = 0;
    all.forEach(c => {
      const m = String(c.childCode || '').match(/(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'NCDC-' + String(max + 1).padStart(3, '0');
  },

  /**
   * Age helpers from birth date (YYYY-MM-DD)
   */
  ageFromBirthDate(birthDate) {
    if (!birthDate) return { ageMonths: null, ageLabel: '' };
    const b = new Date(birthDate + 'T00:00:00');
    if (isNaN(b.getTime())) return { ageMonths: null, ageLabel: '' };
    const now = new Date();
    let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months -= 1;
    if (months < 0) months = 0;
    const y = Math.floor(months / 12);
    const m = months % 12;
    let ageLabel;
    if (y === 0) ageLabel = m + 'm';
    else if (m === 0) ageLabel = y + 'y';
    else ageLabel = y + 'y ' + m + 'm';
    return { ageMonths: months, ageLabel };
  },

  recordTypeFromAgeMonths(ageMonths) {
    if (ageMonths == null) return 1;
    return ageMonths <= 36 ? 1 : 2;
  },

  sectionFromKey(key) {
    const map = {
      explorers: 'Little Explorers',
      stars: 'Little Stars',
      sunshine: 'Sunshine Group'
    };
    return map[key] || 'Little Explorers';
  },

  /**
   * Normalize a form / application payload into a child record.
   * @param {object} data — flat or nested fields
   * @param {object} opts — { source: 'walk_in'|'online_application', applicationId }
   */
  buildChildRecord(data, opts = {}) {
    const id = data.id || this.nextId();
    const childCode = data.childCode || this.nextChildCode();
    const birthDate = data.birthDate || '';
    const age = this.ageFromBirthDate(birthDate);
    const ageMonths = data.ageMonths != null ? Number(data.ageMonths) : age.ageMonths;
    const ageLabel = data.ageLabel || age.ageLabel;
    const sectionKey = data.sectionKey || 'explorers';

    return {
      id,
      childCode,
      name: (data.name || '').trim(),
      sex: data.sex || 'Female',
      ageLabel,
      ageMonths,
      birthDate,
      section: data.section || this.sectionFromKey(sectionKey),
      sectionKey,
      status: data.status || 'on_track',
      statusLabel: data.statusLabel || 'On Track',
      focusArea: data.focusArea || null,
      parentName: (data.parentName || '').trim(),
      motherName: (data.motherName || '').trim(),
      fatherName: (data.fatherName || '').trim(),
      address: {
        barangay: (data.barangay != null ? data.barangay : (data.address && data.address.barangay)) || '',
        municipality: (data.municipality != null ? data.municipality : (data.address && data.address.municipality)) || 'Medina',
        province: (data.province != null ? data.province : (data.address && data.address.province)) || 'Misamis Oriental',
        region: (data.region != null ? data.region : (data.address && data.address.region)) || 'X'
      },
      siblings: data.siblings != null && data.siblings !== '' ? Number(data.siblings) : 0,
      birthOrder: data.birthOrder || '',
      recordType: data.recordType || this.recordTypeFromAgeMonths(ageMonths),
      // enrollment meta
      enrollmentSource: opts.source || data.enrollmentSource || 'walk_in',
      applicationId: opts.applicationId || data.applicationId || null,
      enrolledAt: data.enrolledAt || new Date().toISOString(),
      // optional health at enrollment (also can go to HealthStore)
      enrollmentHealth: data.enrollmentHealth || null
    };
  },

  /**
   * Persist enrollment and push into SampleChildren.
   */
  enroll(data, opts = {}) {
    const child = this.buildChildRecord(data, opts);
    if (!child.name) {
      return { ok: false, error: 'Child name is required.' };
    }
    if (!child.parentName && !child.motherName && !child.fatherName) {
      return { ok: false, error: 'At least one parent / guardian name is required.' };
    }

    this.ensureMerged();
    // avoid duplicate childCode
    if (SampleChildren.some(c => c.childCode === child.childCode && c.id !== child.id)) {
      child.childCode = this.nextChildCode();
    }

    SampleChildren.push(child);
    const enrolled = this._readEnrolled().filter(c => c.id !== child.id);
    enrolled.push(child);
    this._writeEnrolled(enrolled);

    return { ok: true, child };
  },

  /**
   * Future online admission: map approved application softcopy → enroll.
   * Keep field mapping in one place so the Add Child form can reuse applyPrefill.
   */
  mapApplicationToForm(application) {
    if (!application) return {};
    // Flexible mapping — online form may use different keys
    return {
      name: application.childName || application.name || '',
      sex: application.sex || application.gender || 'Female',
      birthDate: application.birthDate || application.dateOfBirth || '',
      sectionKey: application.sectionKey || application.preferredSection || 'explorers',
      parentName: application.guardianName || application.parentName || '',
      motherName: application.motherName || '',
      fatherName: application.fatherName || '',
      barangay: application.barangay || (application.address && application.address.barangay) || '',
      municipality: application.municipality || (application.address && application.address.municipality) || 'Medina',
      province: application.province || (application.address && application.address.province) || 'Misamis Oriental',
      region: application.region || (application.address && application.address.region) || 'X',
      siblings: application.siblings != null ? application.siblings : '',
      birthOrder: application.birthOrder || '',
      allergies: application.allergies || '',
      medicalConditions: application.medicalConditions || '',
      immunizations: application.immunizations || '',
      heightCm: application.heightCm || '',
      weightKg: application.weightKg || '',
      applicationId: application.id || application.applicationId || null
    };
  },

  /**
   * Enroll from an approved online application object.
   */
  enrollFromApplication(application) {
    const mapped = this.mapApplicationToForm(application);
    return this.enroll(mapped, {
      source: 'online_application',
      applicationId: mapped.applicationId
    });
  }
};

if (typeof window !== 'undefined') {
  window.ChildRegistry = ChildRegistry;
  // Merge enrolled children as soon as script loads (after sample-children.js)
  if (typeof SampleChildren !== 'undefined') {
    try { ChildRegistry.ensureMerged(); } catch (e) { /* ignore */ }
  }
}
