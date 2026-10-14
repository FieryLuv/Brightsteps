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
      return { ok: true };
    } catch (e) {
      // Quota: strip heavy attachments and retry once
      try {
        const slim = (list || []).map(c => {
          const copy = { ...c };
          if (copy.photo && copy.photo.dataUrl) {
            copy.photo = { name: copy.photo.name || 'photo', type: copy.photo.type || '', size: copy.photo.size || 0, dataUrl: null, stripped: true };
          }
          if (copy.documents && Array.isArray(copy.documents.files)) {
            copy.documents = {
              ...copy.documents,
              files: copy.documents.files.map(f => ({
                name: f.name, type: f.type, size: f.size, dataUrl: null, stripped: true
              }))
            };
          }
          return copy;
        });
        localStorage.setItem(this.KEY, JSON.stringify(slim));
        return { ok: true, strippedAttachments: true };
      } catch (e2) {
        console.error('ChildRegistry._writeEnrolled failed', e2);
        return { ok: false, error: 'Could not save to browser storage (storage full or blocked).' };
      }
    }
  },

  /**
   * Merge persisted enrollments into SampleChildren.
   * Enrolled records fully overwrite seed rows with the same id (so profile edits stick).
   */
  ensureMerged() {
    if (typeof SampleChildren === 'undefined') return;
    // Online session: ChildrenRemote owns the in-memory list (no demo seeds).
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      this._merged = true;
      return;
    }
    const enrolled = this._readEnrolled();
    enrolled.forEach(c => {
      const idx = SampleChildren.findIndex(
        x => x.id === c.id || String(x.id) === String(c.id) ||
          (c.childCode && x.childCode && x.childCode === c.childCode)
      );
      if (idx >= 0) {
        SampleChildren[idx] = { ...SampleChildren[idx], ...c };
      } else {
        SampleChildren.push(c);
      }
    });
    this.applyDeletions();
    this._merged = true;
  },

  all() {
    this.ensureMerged();
    return typeof SampleChildren !== 'undefined' ? SampleChildren : [];
  },

  /** Enrolled children who are not archived (default working set). */
  activeList() {
    return this.all().filter(c => c.archived !== true);
  },

  /** Soft-deleted / inactive children. */
  archivedList() {
    return this.all().filter(c => c.archived === true);
  },

  isArchived(childOrId) {
    if (childOrId && typeof childOrId === 'object') return childOrId.archived === true;
    const c = this.all().find(x => x.id === childOrId || String(x.id) === String(childOrId));
    return !!(c && c.archived === true);
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
        other: (data.documents && data.documents.other) || data.docOther || '',
        files: Array.isArray(data.documents && data.documents.files)
          ? data.documents.files
          : (Array.isArray(data.docFiles) ? data.docFiles : [])
      },
      photo: data.photo && data.photo.dataUrl ? data.photo : (data.photo || null),
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
    // Keep health snapshot on the child record
    if (!data.enrollmentHealth && (data.heightCm || data.weightKg || data.allergies || data.medicalConditions)) {
      data.enrollmentHealth = {
        heightCm: data.heightCm || '',
        weightKg: data.weightKg || '',
        allergies: data.allergies || '',
        medicalConditions: data.medicalConditions || ''
      };
    }
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
    const enrolled = this._readEnrolled().filter(c => c.id !== child.id && String(c.id) !== String(child.id));
    enrolled.push(child);
    const write = this._writeEnrolled(enrolled);
    if (!write.ok) {
      // roll back in-memory push
      const i = SampleChildren.findIndex(c => c.id === child.id);
      if (i >= 0) SampleChildren.splice(i, 1);
      return { ok: false, error: write.error || 'Could not save enrollment to browser storage.' };
    }
    // Dual-write to Supabase when online (async fire — caller may refresh list)
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      ChildrenRemote.insert(child).then(function (remote) {
        if (remote.ok && remote.child) {
          const idx = SampleChildren.findIndex(c => c.id === child.id || String(c.id) === String(child.id));
          if (idx >= 0) SampleChildren[idx] = remote.child;
          console.info('[ChildRegistry] synced enroll to Supabase', remote.child.childCode);
        } else {
          console.warn('[ChildRegistry] Supabase enroll failed', remote.error);
        }
      });
    }
    return { ok: true, child, strippedAttachments: !!write.strippedAttachments };
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
    let write;
    if (eIdx >= 0) {
      enrolled[eIdx] = { ...enrolled[eIdx], ...patch };
      write = this._writeEnrolled(enrolled);
    } else {
      // Persist sample-child edits so transfer/delete survives refresh
      enrolled.push(SampleChildren[idx]);
      write = this._writeEnrolled(enrolled);
    }
    if (write && write.ok === false) {
      return { ok: false, error: write.error || 'Could not save.' };
    }
    return { ok: true, child: SampleChildren[idx], strippedAttachments: !!(write && write.strippedAttachments) };
  },

  /**
   * Parent-limited update: profile photo + digital document files only.
   * Does not change names, demographics, health text flags, etc.
   */
  updateParentAttachments(id, payload = {}) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };
    const existing = SampleChildren[idx];
    const docs = { ...(existing.documents || {}) };

    if (payload.files !== undefined) {
      docs.files = Array.isArray(payload.files) ? payload.files : [];
    }

    const patch = {
      documents: docs,
      updatedAt: new Date().toISOString(),
      parentAttachmentsUpdatedAt: new Date().toISOString()
    };

    if (payload.clearPhoto) {
      patch.photo = null;
    } else if (payload.photo !== undefined) {
      patch.photo = payload.photo && payload.photo.dataUrl ? payload.photo : payload.photo;
    }

    return this.updateChild(id, patch);
  },

  /**
   * Parent Settings: login name, optional password, and optional photo on the active child.
   * Child ID remains center-controlled and is never changed here.
   */
  updateParentCredentials(id, payload = {}) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };

    const patch = {
      updatedAt: new Date().toISOString(),
      parentCredentialsUpdatedAt: new Date().toISOString()
    };

    if (payload.parentLoginName !== undefined) {
      const name = String(payload.parentLoginName || '').trim();
      if (!name) return { ok: false, error: 'Login name is required.' };
      patch.parentLoginName = name;
      // Keep parentName aligned so teacher views and older matches stay consistent
      patch.parentName = name;
    }

    if (payload.clearPassword) {
      patch.parentPassword = '';
    } else if (payload.parentPassword !== undefined && payload.parentPassword !== null && String(payload.parentPassword).length) {
      patch.parentPassword = String(payload.parentPassword);
    }

    if (payload.clearPhoto) {
      patch.photo = null;
    } else if (payload.photo !== undefined) {
      patch.photo = payload.photo && payload.photo.dataUrl ? payload.photo : payload.photo;
    }

    const result = this.updateChild(id, patch);
    // Multi-device: push login name / password to Supabase when online
    if (result && result.ok && typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      const child = result.child;
      if (child && child.id && String(child.id).length > 30) {
        ChildrenRemote.update(child.id, child).then(function (r) {
          if (!r.ok) console.warn('[ChildRegistry] parent credentials remote', r.error);
          else console.info('[ChildRegistry] parent credentials synced');
        });
      }
    }
    return result;
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
      photo: child.photo || null,
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
    if (idx < 0) return { ok: false, error: 'Child not found. Try refreshing the page.' };
    const existing = SampleChildren[idx];

    if (!data.enrollmentHealth && (data.heightCm || data.weightKg || data.allergies || data.medicalConditions)) {
      data.enrollmentHealth = {
        heightCm: data.heightCm || '',
        weightKg: data.weightKg || '',
        allergies: data.allergies || '',
        medicalConditions: data.medicalConditions || ''
      };
    }
    // Keep prior photo if form sent null but child already had one and no explicit clear
    if ((data.photo == null || data.photo === '') && existing.photo && opts.keepPhoto !== false) {
      data.photo = existing.photo;
    }
    if ((!data.documents || !data.documents.files || !data.documents.files.length) &&
        existing.documents && existing.documents.files && existing.documents.files.length &&
        opts.keepDocs !== false) {
      data.documents = {
        ...(data.documents || {}),
        files: existing.documents.files
      };
    }

    const rebuilt = this.buildChildRecord({
      ...data,
      id: existing.id,
      childCode: existing.childCode,
      enrolledAt: existing.enrolledAt || existing.enrolledAt,
      enrollmentSource: existing.enrollmentSource || data.enrollmentSource || opts.source || 'walk_in',
      applicationId: existing.applicationId || data.applicationId || null,
      status: existing.status,
      statusLabel: existing.statusLabel,
      focusArea: existing.focusArea,
      motherProfile: data.motherProfile != null ? data.motherProfile : existing.motherProfile,
      fatherProfile: data.fatherProfile != null ? data.fatherProfile : existing.fatherProfile
    }, {
      source: existing.enrollmentSource || opts.source || 'walk_in',
      applicationId: existing.applicationId || data.applicationId || null
    });
    rebuilt.updatedAt = new Date().toISOString();
    SampleChildren[idx] = rebuilt;
    const enrolled = this._readEnrolled().filter(
      c => c.id !== existing.id && String(c.id) !== String(existing.id)
    );
    enrolled.push(rebuilt);
    const write = this._writeEnrolled(enrolled);
    if (!write.ok) {
      return { ok: false, error: write.error || 'Could not save changes to browser storage.' };
    }
    return {
      ok: true,
      child: rebuilt,
      strippedAttachments: !!write.strippedAttachments
    };
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
   * Soft-archive: keep record + history, hide from active lists.
   * Prefer this over removeChild for normal “inactive” / transfer-out cases.
   */
  archiveChild(id, reason) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };
    const next = Object.assign({}, SampleChildren[idx], {
      archived: true,
      archivedAt: new Date().toISOString(),
      archiveReason: reason || ''
    });
    SampleChildren[idx] = next;
    this._persistChildRecord(next);
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      ChildrenRemote.setArchived(id, true, reason || '').then(function (r) {
        if (!r.ok) console.warn('[ChildRegistry] remote archive failed', r.error);
      });
    }
    return { ok: true, child: next };
  },

  archiveChildren(ids, reason) {
    const out = [];
    (ids || []).forEach(id => out.push(this.archiveChild(id, reason)));
    return { ok: out.every(r => r.ok), results: out, count: out.filter(r => r.ok).length };
  },

  /** Restore an archived child to the active list. */
  restoreChild(id) {
    this.ensureMerged();
    if (typeof SampleChildren === 'undefined') return { ok: false, error: 'No children list.' };
    const idx = SampleChildren.findIndex(c => c.id === id || String(c.id) === String(id));
    if (idx < 0) return { ok: false, error: 'Child not found.' };
    const next = Object.assign({}, SampleChildren[idx], {
      archived: false,
      archivedAt: null,
      archiveReason: '',
      restoredAt: new Date().toISOString()
    });
    SampleChildren[idx] = next;
    this._persistChildRecord(next);
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      ChildrenRemote.setArchived(id, false, '').then(function (r) {
        if (!r.ok) console.warn('[ChildRegistry] remote restore failed', r.error);
      });
    }
    return { ok: true, child: next };
  },

  restoreChildren(ids) {
    const out = [];
    (ids || []).forEach(id => out.push(this.restoreChild(id)));
    return { ok: out.every(r => r.ok), results: out, count: out.filter(r => r.ok).length };
  },

  /** Upsert full child into enrolled LocalStorage (works for seed + enrolled). */
  _persistChildRecord(child) {
    if (!child || child.id == null) return;
    const enrolled = this._readEnrolled();
    const i = enrolled.findIndex(c => c.id === child.id || String(c.id) === String(child.id));
    if (i >= 0) enrolled[i] = child;
    else enrolled.push(child);
    this._writeEnrolled(enrolled);
  },

  /**
   * Hard-remove from active list (legacy). Prefer archiveChild for soft-delete.
   * Related assessment/health data is left for safety.
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


  /**
   * Online-first enroll when Supabase is connected. Falls back to local enroll.
   * Returns a Promise when online.
   */
  async enrollAsync(data, opts) {
    opts = opts || {};
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      const built = this.buildChildRecord(data, opts);
      if (!built.name) return { ok: false, error: 'Child name is required.' };
      // Let DB generate UUID — strip numeric local id
      delete built.id;
      const remote = await ChildrenRemote.insert(built);
      if (!remote.ok) {
        console.error('[ChildRegistry] online enroll failed', remote.error);
        // Do NOT silently fall back — empty Supabase table was caused by this.
        return {
          ok: false,
          error: 'Could not save to server: ' + (remote.error || 'unknown') +
            '. Run supabase/003_fix_children_access.sql, confirm your profile has facility_id, then try again.'
        };
      }
      // Also keep a local copy for offline resilience
      try {
        const enrolled = this._readEnrolled().filter(c => String(c.id) !== String(remote.child.id));
        enrolled.push(remote.child);
        this._writeEnrolled(enrolled);
      } catch (e) { /* ignore */ }
      return { ok: true, child: remote.child, remote: true };
    }
    return this.enroll(data, opts);
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
   * Uses enrollAsync when online so the child is stored in Supabase.
   */
  enrollFromApplication(application) {
    const mapped = this.mapApplicationToForm(application);
    const opts = {
      source: 'online_application',
      applicationId: mapped.applicationId
    };
    if (typeof this.enrollAsync === 'function') {
      return this.enrollAsync(mapped, opts);
    }
    return this.enroll(mapped, opts);
  }
};

if (typeof window !== 'undefined') {
  window.ChildRegistry = ChildRegistry;
  // Merge enrolled children as soon as script loads (after sample-children.js)
  if (typeof SampleChildren !== 'undefined') {
    try { ChildRegistry.ensureMerged(); } catch (e) { /* ignore */ }
  }
}
