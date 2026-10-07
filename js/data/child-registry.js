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
    // Apply transfers stored in enrolled over sample seeds
    enrolled.forEach(c => {
      const idx = SampleChildren.findIndex(x => x.id === c.id || String(x.id) === String(c.id));
      if (idx >= 0 && c.sectionKey) {
        SampleChildren[idx].sectionKey = c.sectionKey;
        SampleChildren[idx].section = c.section || SampleChildren[idx].section;
      }
    });
    this.applyDeletions();
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
    if (typeof ClassStore !== 'undefined' && ClassStore.displayName) {
      const n = ClassStore.displayName(key);
      if (n && n !== key) return n;
    }
    const map = {
      explorers: 'Little Explorers',
      stars: 'Little Stars',
      sunshine: 'Sunshine Group'
    };
    return map[key] || key || 'Little Explorers';
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

    const lastName = (data.lastName || '').trim();
    const firstName = (data.firstName || '').trim();
    const middleInitial = (data.middleInitial || '').trim();
    let name = (data.name || '').trim();
    if (!name && (lastName || firstName)) {
      name = [firstName, middleInitial, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }

    // Phase A — ECCD Child Profile (personal + health)
    const vaccines = data.vaccines || {};
    const vaccineKeys = ['BCG', 'DPT', 'OralPolio', 'HepaB', 'Measles', 'Others'];
    const vaccinesNorm = {};
    vaccineKeys.forEach(k => {
      const v = vaccines[k] != null ? vaccines[k] : data['vaccine_' + k];
      vaccinesNorm[k] = (v === 'Yes' || v === 'No' || v === "Don't Know") ? v : (v || '');
    });

    return {
      id,
      childCode,
      name,
      lastName,
      firstName,
      middleInitial,
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
        region: (data.region != null ? data.region : (data.address && data.address.region)) || 'X',
        purok: (data.purok != null ? data.purok : (data.address && data.address.purok)) || ''
      },
      siblings: data.siblings != null && data.siblings !== '' ? Number(data.siblings) : 0,
      birthOrder: data.birthOrder || '',
      recordType: data.recordType || this.recordTypeFromAgeMonths(ageMonths),
      // Phase A ECCD profile
      registered: data.registered === true || data.registered === 'Yes' || data.registered === 'yes',
      bornAt: data.bornAt || '', // Hospital | Health Center | Home
      motherTongue: data.motherTongue || '',
      motherTongueOther: data.motherTongueOther || '',
      otherDialects: data.otherDialects || '',
      documents: {
        eccdCard: !!(data.documents && data.documents.eccdCard) || data.docEccdCard === true || data.docEccdCard === 'on',
        motherChildBook: !!(data.documents && data.documents.motherChildBook) || data.docMotherChildBook === true || data.docMotherChildBook === 'on',
        other: (data.documents && data.documents.other) || data.docOther || ''
      },
      vaccines: vaccinesNorm,
      // enrollment meta
      enrollmentSource: opts.source || data.enrollmentSource || 'walk_in',
      applicationId: opts.applicationId || data.applicationId || null,
      enrolledAt: data.enrolledAt || new Date().toISOString(),
      enrollmentHealth: data.enrollmentHealth || null,
      // Phases B–D placeholders (filled later)
      motherProfile: data.motherProfile || null,
      fatherProfile: data.fatherProfile || null,
      siblingsDetail: data.siblingsDetail || null,
      physicalAttributes: data.physicalAttributes || null,
      priorEce: data.priorEce || null,
      transport: data.transport || null,
      accompanies: data.accompanies || null,
      profileMeta: data.profileMeta || null
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
   * Update an enrolled or sample child in memory + enrolled storage.
   */
  updateChild(id, patch) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };
    SampleChildren[idx] = { ...SampleChildren[idx], ...patch };
    const enrolled = this._readEnrolled();
    const eIdx = enrolled.findIndex(c => c.id === id || String(c.id) === String(id));
    if (eIdx >= 0) {
      enrolled[eIdx] = { ...enrolled[eIdx], ...patch };
      this._writeEnrolled(enrolled);
    } else {
      // Persist sample-child edits so transfer/delete survives refresh
      enrolled.push(SampleChildren[idx]);
      this._writeEnrolled(enrolled);
    }
    return { ok: true, child: SampleChildren[idx] };
  },

  /**
   * Map an existing child record → Add/Edit form prefill shape.
   */
  childToFormPrefill(child) {
    if (!child) return {};
    const a = child.address || {};
    return {
      _editId: child.id,
      id: child.id,
      childCode: child.childCode,
      name: child.name || '',
      lastName: child.lastName || '',
      firstName: child.firstName || '',
      middleInitial: child.middleInitial || '',
      sex: child.sex || '',
      birthDate: child.birthDate || '',
      sectionKey: child.sectionKey || 'explorers',
      parentName: child.parentName || '',
      motherName: child.motherName || '',
      fatherName: child.fatherName || '',
      siblings: child.siblings,
      birthOrder: child.birthOrder || '',
      barangay: a.barangay || '',
      municipality: a.municipality || 'Medina',
      province: a.province || 'Misamis Oriental',
      region: a.region || 'X',
      heightCm: (child.enrollmentHealth && child.enrollmentHealth.heightCm) || '',
      weightKg: (child.enrollmentHealth && child.enrollmentHealth.weightKg) || '',
      allergies: (child.enrollmentHealth && child.enrollmentHealth.allergies) || '',
      medicalConditions: (child.enrollmentHealth && child.enrollmentHealth.medicalConditions) || '',
      registered: child.registered ? 'Yes' : 'No',
      bornAt: child.bornAt || '',
      motherTongue: child.motherTongue || '',
      motherTongueOther: child.motherTongueOther || '',
      otherDialects: child.otherDialects || '',
      documents: child.documents || {},
      vaccines: child.vaccines || {},
      motherProfile: child.motherProfile || null,
      fatherProfile: child.fatherProfile || null,
      physicalAttributes: child.physicalAttributes || null,
      siblingsDetail: child.siblingsDetail || null,
      priorEce: child.priorEce || null,
      transport: child.transport || [],
      accompanies: child.accompanies || [],
      profileMeta: child.profileMeta || null,
      applicationId: child.applicationId || null,
      enrollmentSource: child.enrollmentSource || 'walk_in'
    };
  },

  /**
   * Full replace of profile fields from the enrollment form while preserving
   * id, childCode, enrolledAt, application link, and development status fields.
   */
  updateFromForm(id, data, opts = {}) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };
    const existing = SampleChildren[idx];
    const rebuilt = this.buildChildRecord({
      ...data,
      id: existing.id,
      childCode: existing.childCode,
      enrolledAt: existing.enrolledAt,
      enrollmentSource: existing.enrollmentSource || data.enrollmentSource || opts.source || 'walk_in',
      applicationId: existing.applicationId || data.applicationId || null,
      status: existing.status,
      statusLabel: existing.statusLabel,
      focusArea: existing.focusArea
    }, {
      source: existing.enrollmentSource || opts.source || 'walk_in',
      applicationId: existing.applicationId || data.applicationId || null
    });
    rebuilt.updatedAt = new Date().toISOString();
    SampleChildren[idx] = rebuilt;
    const enrolled = this._readEnrolled().filter(c => c.id !== existing.id && String(c.id) !== String(existing.id));
    enrolled.push(rebuilt);
    this._writeEnrolled(enrolled);
    return { ok: true, child: rebuilt };
  },

  /**
   * Move one or more children to a class/section.
   */
  transferToClass(ids, sectionKey) {
    if (!sectionKey) return { ok: false, error: 'Target class is required.' };
    const section = this.sectionFromKey(sectionKey);
    const results = [];
    (ids || []).forEach(id => {
      results.push(this.updateChild(id, { sectionKey, section }));
    });
    const failed = results.filter(r => !r.ok);
    if (failed.length) {
      return { ok: false, error: failed[0].error, results };
    }
    return { ok: true, count: results.length, results };
  },

  /**
   * Remove child from active list. Soft-delete sample data by filtering out of SampleChildren;
   * removes from enrolled storage. Related assessment/health data is left (orphan) for safety.
   */
  removeChild(id) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const before = SampleChildren.length;
    const child = SampleChildren.find(c => c.id === id || String(c.id) === String(id));
    if (!child) return { ok: false, error: 'Child not found.' };

    for (let i = SampleChildren.length - 1; i >= 0; i--) {
      if (SampleChildren[i].id === id || String(SampleChildren[i].id) === String(id)) {
        SampleChildren.splice(i, 1);
      }
    }
    const enrolled = this._readEnrolled().filter(c => c.id !== id && String(c.id) !== String(id));
    this._writeEnrolled(enrolled);

    // Track deleted sample IDs so ensureMerged does not need special handling
    try {
      const KEY = 'brightsteps_deleted_children_v1';
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(id) && !list.includes(String(id))) {
        list.push(id);
        localStorage.setItem(KEY, JSON.stringify(list));
      }
    } catch (e) { /* ignore */ }

    return { ok: true, removed: child, before, after: SampleChildren.length };
  },

  removeChildren(ids) {
    const out = [];
    (ids || []).forEach(id => out.push(this.removeChild(id)));
    return { ok: out.every(r => r.ok), results: out, count: out.filter(r => r.ok).length };
  },

  /** Filter out previously deleted IDs after merge */
  applyDeletions() {
    if (typeof SampleChildren === 'undefined') return;
    try {
      const raw = localStorage.getItem('brightsteps_deleted_children_v1');
      if (!raw) return;
      const deleted = new Set(JSON.parse(raw).map(String));
      for (let i = SampleChildren.length - 1; i >= 0; i--) {
        if (deleted.has(String(SampleChildren[i].id))) {
          SampleChildren.splice(i, 1);
        }
      }
    } catch (e) { /* ignore */ }
  },

  /**
   * Future online admission: map approved application softcopy → enroll.
   * Keep field mapping in one place so the Add Child form can reuse applyPrefill.
   */
  /**
   * Split a free-text full name into first / middle / last when parts are missing.
   * Prefer explicit part fields from the online form.
   */
  _splitFullName(full) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: '', middleInitial: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], middleInitial: '', lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], middleInitial: '', lastName: parts[1] };
    return {
      firstName: parts[0],
      middleInitial: parts.slice(1, -1).map(p => p[0]).join('').slice(0, 5),
      lastName: parts[parts.length - 1]
    };
  },

  mapApplicationToForm(application) {
    if (!application) return {};
    // Child name parts — prefer structured fields
    let lastName = (application.lastName || '').trim();
    let firstName = (application.firstName || '').trim();
    let middleInitial = (application.middleInitial || '').trim();
    const fullChild = application.childName || application.name || '';
    if (!lastName && !firstName && fullChild) {
      const s = this._splitFullName(fullChild);
      firstName = s.firstName;
      middleInitial = s.middleInitial;
      lastName = s.lastName;
    }
    const displayName = fullChild || [firstName, middleInitial, lastName].filter(Boolean).join(' ').trim();

    // Mother — structured parts first; never dump full string into firstName only
    let mLast = (application.motherLastName || '').trim();
    let mFirst = (application.motherFirstName || '').trim();
    let mMid = (application.motherMiddleInitial || '').trim();
    const motherFull = (application.motherName || '').trim();
    if (!mLast && !mFirst && motherFull) {
      const s = this._splitFullName(motherFull);
      mFirst = s.firstName;
      mMid = s.middleInitial;
      mLast = s.lastName;
    }
    const motherDisplay = motherFull || [mFirst, mMid, mLast].filter(Boolean).join(' ').trim();

    let fLast = (application.fatherLastName || '').trim();
    let fFirst = (application.fatherFirstName || '').trim();
    let fMid = (application.fatherMiddleInitial || '').trim();
    const fatherFull = (application.fatherName || '').trim();
    if (!fLast && !fFirst && fatherFull) {
      const s = this._splitFullName(fatherFull);
      fFirst = s.firstName;
      fMid = s.middleInitial;
      fLast = s.lastName;
    }
    const fatherDisplay = fatherFull || [fFirst, fMid, fLast].filter(Boolean).join(' ').trim();

    return {
      name: displayName,
      lastName,
      firstName,
      middleInitial,
      sex: application.sex || application.gender || 'Female',
      birthDate: application.birthDate || application.dateOfBirth || '',
      sectionKey: application.sectionKey || application.preferredSection || 'explorers',
      parentName: application.guardianName || application.parentName || '',
      motherName: motherDisplay,
      fatherName: fatherDisplay,
      motherProfile: {
        ...(application.motherProfile || {}),
        lastName: mLast || (application.motherProfile && application.motherProfile.lastName) || '',
        firstName: mFirst || (application.motherProfile && application.motherProfile.firstName) || '',
        middleInitial: mMid || (application.motherProfile && application.motherProfile.middleInitial) || '',
        birthDate: (application.motherProfile && application.motherProfile.birthDate) || '',
        age: (application.motherProfile && application.motherProfile.age) || '',
        pregnant: (application.motherProfile && application.motherProfile.pregnant) || '',
        civilStatus: (application.motherProfile && application.motherProfile.civilStatus) || '',
        education: (application.motherProfile && application.motherProfile.education) || '',
        occupation: (application.motherProfile && application.motherProfile.occupation) || '',
        occupationOther: (application.motherProfile && application.motherProfile.occupationOther) || '',
        motherTongue: (application.motherProfile && application.motherProfile.motherTongue) || '',
        otherDialects: (application.motherProfile && application.motherProfile.otherDialects) || '',
        district: (application.motherProfile && application.motherProfile.district) || '',
        purok: (application.motherProfile && application.motherProfile.purok) || ''
      },
      fatherProfile: {
        ...(application.fatherProfile || {}),
        lastName: fLast || (application.fatherProfile && application.fatherProfile.lastName) || '',
        firstName: fFirst || (application.fatherProfile && application.fatherProfile.firstName) || '',
        middleInitial: fMid || (application.fatherProfile && application.fatherProfile.middleInitial) || '',
        birthDate: (application.fatherProfile && application.fatherProfile.birthDate) || '',
        age: (application.fatherProfile && application.fatherProfile.age) || '',
        civilStatus: (application.fatherProfile && application.fatherProfile.civilStatus) || '',
        education: (application.fatherProfile && application.fatherProfile.education) || '',
        occupation: (application.fatherProfile && application.fatherProfile.occupation) || '',
        occupationOther: (application.fatherProfile && application.fatherProfile.occupationOther) || '',
        motherTongue: (application.fatherProfile && application.fatherProfile.motherTongue) || '',
        otherDialects: (application.fatherProfile && application.fatherProfile.otherDialects) || '',
        district: (application.fatherProfile && application.fatherProfile.district) || '',
        purok: (application.fatherProfile && application.fatherProfile.purok) || ''
      },
      siblingsDetail: Array.isArray(application.siblingsDetail) ? application.siblingsDetail : [],
      barangay: application.barangay || (application.address && application.address.barangay) || '',
      municipality: application.municipality || (application.address && application.address.municipality) || 'Medina',
      province: application.province || (application.address && application.address.province) || 'Misamis Oriental',
      region: application.region || (application.address && application.address.region) || 'X',
      purok: application.purok || '',
      siblings: application.siblings != null ? application.siblings : '',
      birthOrder: application.birthOrder || '',
      allergies: application.allergies || '',
      medicalConditions: application.medicalConditions || '',
      immunizations: application.immunizations || '',
      heightCm: application.heightCm || '',
      weightKg: application.weightKg || '',
      registered: application.registered || 'No',
      bornAt: application.bornAt || '',
      motherTongue: application.motherTongue || '',
      motherTongueOther: application.motherTongueOther || '',
      otherDialects: application.otherDialects || '',
      documents: application.documents || {},
      vaccines: application.vaccines || null,
      transport: application.transport || [],
      accompanies: application.accompanies || [],
      physicalAttributes: application.physicalAttributes || null,
      priorEce: application.priorEce || null,
      applicationId: application.id || application.applicationId || null,
      enrollmentSource: 'online_application'
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
