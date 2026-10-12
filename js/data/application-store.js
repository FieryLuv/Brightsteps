/**
 * ApplicationStore — online enrollment applications from Visitors.
 * Status: pending | approved | rejected | enrolled
 * Key: brightsteps_applications_v1
 */

const ApplicationStore = {
  KEY: 'brightsteps_applications_v1',

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

  listAll() {
    return this._read().sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  },

  listByStatus(status) {
    return this.listAll().filter(a => a.status === status);
  },

  get(id) {
    return this._read().find(a => a.id === id) || null;
  },

  submit(data) {
    const list = this._read();
    const id = data.id || `APP-${Date.now()}`;
    const record = {
      id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectReason: null,
      enrolledChildId: null,
      enrolledChildCode: null,
      // Child identity
      childName: (data.childName || '').trim(),
      lastName: (data.lastName || '').trim(),
      firstName: (data.firstName || '').trim(),
      middleInitial: (data.middleInitial || '').trim(),
      sex: data.sex || 'Female',
      birthDate: data.birthDate || '',
      preferredSection: data.preferredSection || 'explorers',
      birthOrder: data.birthOrder || '',
      registered: data.registered || 'No',
      bornAt: data.bornAt || '',
      motherTongue: data.motherTongue || '',
      otherDialects: data.otherDialects || '',
      // Family / contact
      guardianName: (data.guardianName || '').trim(),
      motherName: (data.motherName || '').trim(),
      motherLastName: (data.motherLastName || '').trim(),
      motherFirstName: (data.motherFirstName || '').trim(),
      motherMiddleInitial: (data.motherMiddleInitial || '').trim(),
      fatherName: (data.fatherName || '').trim(),
      fatherLastName: (data.fatherLastName || '').trim(),
      fatherFirstName: (data.fatherFirstName || '').trim(),
      fatherMiddleInitial: (data.fatherMiddleInitial || '').trim(),
      motherProfile: data.motherProfile || null,
      fatherProfile: data.fatherProfile || null,
      contactPhone: (data.contactPhone || '').trim(),
      contactEmail: (data.contactEmail || '').trim(),
      barangay: (data.barangay || '').trim(),
      municipality: (data.municipality || 'Medina').trim(),
      province: (data.province || 'Misamis Oriental').trim(),
      region: (data.region || 'X').trim(),
      siblings: data.siblings != null && data.siblings !== '' ? Number(data.siblings) : 0,
      siblingsDetail: Array.isArray(data.siblingsDetail) ? data.siblingsDetail : [],
      // Health / docs
      documents: data.documents || { eccdCard: false, motherChildBook: false, other: '', files: [] },
      allergies: data.allergies || '',
      medicalConditions: data.medicalConditions || '',
      immunizations: data.immunizations || '',
      vaccines: data.vaccines || null,
      heightCm: data.heightCm || '',
      weightKg: data.weightKg || '',
      physicalAttributes: data.physicalAttributes || null,
      priorEce: data.priorEce || null,
      transport: data.transport || [],
      accompanies: data.accompanies || [],
      notes: data.notes || ''
    };
    list.push(record);
    this._write(list);
    return record;
  },

  updateStatus(id, status, extra = {}) {
    const list = this._read();
    const idx = list.findIndex(a => a.id === id);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: extra.reviewedBy || list[idx].reviewedBy || 'Teacher',
      rejectReason: extra.rejectReason != null ? extra.rejectReason : list[idx].rejectReason,
      enrolledChildId: extra.enrolledChildId != null ? extra.enrolledChildId : list[idx].enrolledChildId,
      enrolledChildCode: extra.enrolledChildCode != null ? extra.enrolledChildCode : list[idx].enrolledChildCode
    };
    this._write(list);
    return list[idx];
  },

  pendingCount() {
    return this.listByStatus('pending').length;
  }
};

if (typeof window !== 'undefined') window.ApplicationStore = ApplicationStore;
