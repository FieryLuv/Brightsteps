/**
 * TeacherStore — multi-staff + single Head Teacher / Admin.
 *
 * - Head Teacher (admin): only one. Can add/remove faculty, transfer head role.
 * - Faculty (CDW / teacher): operate the system; cannot manage staff roster.
 * Facility fields feed SFP Beneficiary Profile Part I.
 * Staff accounts: prefer Supabase Auth; local TeacherStore is offline fallback.
 */
const TeacherStore = {
  KEY: 'brightsteps_teacher_state_v3',
  LEGACY_KEY: 'brightsteps_teacher_profile_v1',
  OLD_KEYS: ['brightsteps_teacher_state_v2'],

  _facilityDefaults() {
    return {
      centerName: 'National Child Development Center — Medina',
      facilityCategory: 'CDC',
      province: 'Misamis Oriental',
      district: '',
      municipality: 'Medina',
      barangay: '',
      address: '',
      withWashFacility: true,
      withCommunityGarden: false
    };
  },

  _newStaff(patch) {
    const id = (patch && patch.id) || ('staff_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    return {
      id,
      fullName: (patch && patch.fullName) || '',
      // staffRole: 'head' | 'faculty'
      staffRole: (patch && patch.staffRole) === 'head' ? 'head' : 'faculty',
      position: (patch && patch.position) || (patch && patch.staffRole === 'head' ? 'Head Teacher / Admin' : 'CDW / Teacher'),
      sex: (patch && patch.sex) || '',
      email: (patch && patch.email) || '',
      phone: (patch && patch.phone) || '',
      employeeId: (patch && patch.employeeId) || '',
      username: (patch && patch.username) || '',
      password: (patch && patch.password) || 'changeme',
      passwordHint: (patch && patch.passwordHint) || '••••••••',
      active: patch && patch.active === false ? false : true,
      createdAt: (patch && patch.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  _seedState() {
    // NCDC Medina staff — Irish Abordo is Head; Maria Santos is faculty CDW
    const head = this._newStaff({
      id: 'staff_irish_abordo',
      fullName: 'Irish Abordo',
      staffRole: 'head',
      position: 'Head Teacher / Admin',
      sex: 'Female',
      email: 'irish.abordo@ncdc.medina.local',
      phone: '09XX-XXX-XXXX',
      employeeId: 'NCDC-HT-001',
      username: 'irish',
      password: 'Abordo2026'
    });
    const faculty = this._newStaff({
      id: 'staff_maria_santos',
      fullName: 'Maria Santos',
      staffRole: 'faculty',
      position: 'CDW / Teacher',
      sex: 'Female',
      email: 'maria.santos@ncdc.medina.local',
      phone: '09XX-XXX-XXXX',
      employeeId: 'NCDC-CDW-001',
      username: 'maria',
      password: 'Santos2026'
    });
    return {
      facility: this._facilityDefaults(),
      staff: [head, faculty],
      headStaffId: head.id,
      currentStaffId: head.id,
      pendingHeadTransfer: null,
      updatedAt: new Date().toISOString()
    };
  },

  _migrateLegacy() {
    try {
      const raw = localStorage.getItem(this.LEGACY_KEY);
      if (!raw) return null;
      const old = JSON.parse(raw);
      const fac = this._facilityDefaults();
      Object.keys(fac).forEach(k => {
        if (old[k] != null && old[k] !== '') fac[k] = old[k];
      });
      const head = this._newStaff({
        id: 'staff_head_migrated',
        fullName: old.fullName || 'Maria Santos',
        staffRole: 'head',
        position: old.position || 'Head Teacher / Admin',
        sex: old.sex || '',
        email: old.email || '',
        phone: old.phone || '',
        employeeId: old.employeeId || 'NCDC-HEAD-001',
        username: 'head',
        password: 'head123'
      });
      return {
        facility: fac,
        staff: [head],
        headStaffId: head.id,
        currentStaffId: head.id,
        pendingHeadTransfer: null,
        updatedAt: new Date().toISOString()
      };
    } catch (e) {
      return null;
    }
  },

  /**
   * Normalize structure only — never rewrite usernames or passwords.
   * Login credentials belong to the person; transfer only changes role.
   */
  _normalizeState(state) {
    if (!state.staff) state.staff = [];
    if (!state.facility) state.facility = this._facilityDefaults();
    if (!('pendingHeadTransfer' in state)) state.pendingHeadTransfer = null;

    // Prefer explicit headStaffId; else staff with staffRole head; else first active
    let head = state.staff.find(s => s.id === state.headStaffId && s.active !== false);
    if (!head) {
      head = state.staff.find(s => s.staffRole === 'head' && s.active !== false)
        || state.staff.find(s => s.active !== false)
        || state.staff[0];
    }
    if (head) {
      state.headStaffId = head.id;
      // Align role flags with headStaffId only (do not touch login fields)
      state.staff = state.staff.map(s => {
        if (s.id === state.headStaffId) {
          return Object.assign({}, s, {
            staffRole: 'head',
            position: s.position && s.position !== 'CDW / Teacher'
              ? s.position
              : 'Head Teacher / Admin'
          });
        }
        if (s.staffRole === 'head') {
          return Object.assign({}, s, {
            staffRole: 'faculty',
            position: s.position === 'Head Teacher / Admin' ? 'CDW / Teacher' : (s.position || 'CDW / Teacher')
          });
        }
        return s;
      });
    }

    // Missing password only — leave existing passwords alone
    state.staff = state.staff.map(s => {
      if (s.password == null || s.password === '') {
        return Object.assign({}, s, { password: 'changeme' });
      }
      return s;
    });

    if (!state.currentStaffId || !state.staff.some(s => s.id === state.currentStaffId && s.active !== false)) {
      state.currentStaffId = state.headStaffId || (state.staff[0] && state.staff[0].id) || null;
    }
    return state;
  },

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        let state = JSON.parse(raw);
        if (!state.staff || !state.staff.length) {
          state = this._seedState();
          this._write(state);
          return state;
        }
        return this._normalizeState(state);
      }
      // Drop obsolete demo keys (v2 head/teacher accounts)
      if (this.OLD_KEYS) {
        this.OLD_KEYS.forEach(k => {
          try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
        });
      }
      const migrated = this._migrateLegacy();
      let state = migrated || this._seedState();
      // Prefer fresh seed with Irish / Maria over single-profile legacy
      if (migrated && (!migrated.staff || migrated.staff.length < 2)) {
        state = this._seedState();
      }
      state = this._normalizeState(state);
      this._write(state);
      return state;
    } catch (e) {
      const state = this._seedState();
      this._write(state);
      return state;
    }
  },

  _write(state) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },

  _syncCycle(facility, workerName) {
    if (typeof SfpStore === 'undefined' || !SfpStore.getActiveCycle || !SfpStore.saveCycle) return;
    const cycle = SfpStore.getActiveCycle();
    if (!cycle) return;
    const f = facility || this._facilityDefaults();
    SfpStore.saveCycle({
      id: cycle.id,
      workerName: workerName || cycle.workerName,
      facilityName: f.centerName || cycle.facilityName,
      facilityCategory: f.facilityCategory || cycle.facilityCategory,
      province: f.province || cycle.province,
      municipality: f.municipality || cycle.municipality,
      barangay: f.barangay != null ? f.barangay : cycle.barangay,
      withWashFacility: f.withWashFacility,
      withCommunityGarden: f.withCommunityGarden
    });
  },

  // ── Public API ───────────────────────────────────────────────────

  getState() {
    return this._read();
  },

  /**
   * Combined view: current staff + facility (backward compatible with get()).
   */
  get() {
    const state = this._read();
    const staff = state.staff.find(s => s.id === state.currentStaffId) ||
      state.staff.find(s => s.id === state.headStaffId) ||
      state.staff[0] ||
      this._newStaff({ fullName: 'Teacher', staffRole: 'head' });
    return Object.assign({}, state.facility, staff, {
      role: staff.position || (staff.staffRole === 'head' ? 'Head Teacher / Admin' : 'CDW / Teacher'),
      isHead: staff.id === state.headStaffId || staff.staffRole === 'head'
    });
  },

  getCurrentStaff() {
    const state = this._read();
    return state.staff.find(s => s.id === state.currentStaffId) || null;
  },

  isHead() {
    // Online Supabase session (profile.role / is_head mirrored at login)
    if (this._remoteSession && this._remoteSession.active) {
      return !!this._remoteSession.isHead;
    }
    const state = this._read();
    const cur = state.staff.find(s => s.id === state.currentStaffId);
    return !!(cur && cur.id === state.headStaffId);
  },

  /**
   * After Supabase Auth success — drive isHead / greeting from remote profile
   * without replacing the whole LocalStorage staff roster yet.
   */
  applyRemoteProfile(profile) {
    if (!profile) return;
    this._remoteSession = {
      active: true,
      id: profile.id,
      fullName: profile.full_name || '',
      username: profile.username || '',
      role: profile.role || 'faculty',
      isHead: profile.is_head === true || profile.role === 'head',
      facilityId: profile.facility_id || null
    };
  },

  clearRemoteSession() {
    this._remoteSession = null;
  },

  getRemoteSession() {
    return this._remoteSession || null;
  },

  listStaff() {
    return this._read().staff.filter(s => s.active !== false).slice();
  },

  listAllStaff() {
    return this._read().staff.slice();
  },

  setCurrentStaff(staffId) {
    const state = this._read();
    const s = state.staff.find(x => x.id === staffId);
    if (!s || s.active === false) return { ok: false, error: 'Staff not found.' };
    state.currentStaffId = staffId;
    this._write(state);
    return { ok: true, staff: s };
  },

  /**
   * Update current user's personal fields and/or facility (facility only if head).
   */
  save(patch) {
    const state = this._read();
    const curId = state.currentStaffId;
    const idx = state.staff.findIndex(s => s.id === curId);
    if (idx < 0) return { ok: false, error: 'No current staff.' };

    const personalKeys = [
      'fullName', 'position', 'sex', 'email', 'phone', 'employeeId', 'username', 'passwordHint', 'password'
    ];
    const nextStaff = Object.assign({}, state.staff[idx]);
    personalKeys.forEach(k => {
      if (patch[k] != null && patch[k] !== '') nextStaff[k] = patch[k];
    });
    nextStaff.updatedAt = new Date().toISOString();
    state.staff[idx] = nextStaff;

    const isHead = nextStaff.id === state.headStaffId;
    if (isHead) {
      const fac = Object.assign({}, state.facility);
      const facKeys = [
        'centerName', 'facilityCategory', 'province', 'district', 'municipality',
        'barangay', 'address', 'withWashFacility', 'withCommunityGarden'
      ];
      facKeys.forEach(k => {
        if (patch[k] != null) fac[k] = patch[k];
      });
      state.facility = fac;
      this._syncCycle(fac, nextStaff.fullName);
    } else {
      this._syncCycle(state.facility, this.getHead().fullName);
    }

    this._write(state);
    return { ok: true, profile: this.get() };
  },

  getHead() {
    const state = this._read();
    return state.staff.find(s => s.id === state.headStaffId) || state.staff[0] || null;
  },

  getFacility() {
    return Object.assign({}, this._read().facility);
  },

  /**
   * Head only — add faculty member.
   */
  addFaculty(data) {
    if (!this.isHead()) return { ok: false, error: 'Only the Head Teacher can add faculty.' };
    const name = (data && data.fullName || '').trim();
    if (!name) return { ok: false, error: 'Full name is required.' };
    const state = this._read();
    const username = (data.username || '').trim() || name.split(/\s+/)[0].toLowerCase();
    if (state.staff.some(s => s.username && s.username.toLowerCase() === username.toLowerCase() && s.active !== false)) {
      return { ok: false, error: 'Username already in use.' };
    }
    const staff = this._newStaff({
      fullName: name,
      staffRole: 'faculty',
      position: (data.position || 'CDW / Teacher').trim(),
      sex: data.sex || '',
      email: data.email || '',
      phone: data.phone || '',
      employeeId: data.employeeId || '',
      username
    });
    state.staff.push(staff);
    this._write(state);
    return { ok: true, staff };
  },

  listArchivedStaff() {
    return this._read().staff.filter(s => s.active === false).slice();
  },

  /**
   * Head only — soft-archive faculty (cannot archive self or current head).
   * Login is blocked while archived; profile remains restorable.
   */
  archiveStaff(staffId) {
    if (!this.isHead()) return { ok: false, error: 'Only the Head Teacher can archive staff.' };
    const state = this._read();
    if (staffId === state.headStaffId) {
      return { ok: false, error: 'Transfer the Head Teacher role first before archiving this account.' };
    }
    if (staffId === state.currentStaffId) {
      return { ok: false, error: 'Cannot archive the account you are signed in as.' };
    }
    const idx = state.staff.findIndex(s => s.id === staffId);
    if (idx < 0) return { ok: false, error: 'Staff not found.' };
    state.staff[idx] = Object.assign({}, state.staff[idx], {
      active: false,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this._write(state);
    return { ok: true, staff: state.staff[idx] };
  },

  /** Head only — restore archived faculty to active roster. */
  restoreStaff(staffId) {
    if (!this.isHead()) return { ok: false, error: 'Only the Head Teacher can restore staff.' };
    const state = this._read();
    const idx = state.staff.findIndex(s => s.id === staffId);
    if (idx < 0) return { ok: false, error: 'Staff not found.' };
    state.staff[idx] = Object.assign({}, state.staff[idx], {
      active: true,
      archivedAt: null,
      restoredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this._write(state);
    return { ok: true, staff: state.staff[idx] };
  },

  /** @deprecated Prefer archiveStaff — soft-delete alias. */
  removeStaff(staffId) {
    return this.archiveStaff(staffId);
  },

  /** Head only — permanent remove of archived (or any non-head) faculty. Irreversible locally. */
  permanentDeleteStaff(staffId) {
    if (!this.isHead()) return { ok: false, error: 'Only the Head Teacher can permanently delete staff.' };
    const list = this.listAll();
    const s = list.find(x => String(x.id) === String(staffId));
    if (!s) return { ok: false, error: 'Staff not found.' };
    if (s.role === 'head' || s.isHead) return { ok: false, error: 'Cannot delete the Head Teacher account. Transfer head first.' };
    const me = this.currentStaff && this.currentStaff();
    if (me && String(me.id) === String(staffId)) return { ok: false, error: 'Cannot delete the account you are signed in as.' };
    const next = list.filter(x => String(x.id) !== String(staffId));
    this._writeAll(next);
    return { ok: true, removed: s };
  },

  verifyPassword(staffId, password) {
    const state = this._read();
    const s = state.staff.find(x => x.id === staffId);
    if (!s) return false;
    const expected = s.password != null ? String(s.password) : 'changeme';
    return String(password || '') === expected;
  },

  /**
   * Staff login (head or faculty) — same portal.
   * Username match is case-insensitive; password is exact.
   */
  authenticate(username, password) {
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '').trim();
    if (!u || !p) return { ok: false, error: 'Enter username and password.' };

    const state = this._read();
    const staff = state.staff.find(
      s => s.active !== false && String(s.username || '').trim().toLowerCase() === u
    );

    if (!staff) {
      return { ok: false, error: 'Username not found.' };
    }

    const expected = String(staff.password != null ? staff.password : '').trim();
    if (p !== expected) {
      return { ok: false, error: 'Incorrect password.' };
    }

    state.currentStaffId = staff.id;
    this._write(state);
    return {
      ok: true,
      staff,
      isHead: staff.id === state.headStaffId || staff.staffRole === 'head'
    };
  },

  

  getPendingHeadTransfer() {
    const state = this._read();
    return state.pendingHeadTransfer || null;
  },

  /**
   * Head only — propose transfer. Requires current head password.
   * Appointee must Accept or Decline (does not apply immediately).
   */
  proposeHeadTransfer(newHeadId, headPassword) {
    if (!this.isHead()) return { ok: false, error: 'Only the current Head Teacher can propose a transfer.' };
    const state = this._read();
    if (!this.verifyPassword(state.headStaffId, headPassword)) {
      return { ok: false, error: 'Incorrect Head Teacher password. Transfer not proposed.' };
    }
    if (newHeadId === state.headStaffId) return { ok: false, error: 'Already the Head Teacher.' };
    const next = state.staff.find(s => s.id === newHeadId && s.active !== false);
    if (!next) return { ok: false, error: 'Staff not found or inactive.' };
    if (state.pendingHeadTransfer && state.pendingHeadTransfer.status === 'pending') {
      return { ok: false, error: 'A transfer is already pending. Cancel it first or wait for a response.' };
    }
    state.pendingHeadTransfer = {
      fromId: state.headStaffId,
      toId: newHeadId,
      proposedAt: new Date().toISOString(),
      status: 'pending'
    };
    this._write(state);
    return { ok: true, pending: state.pendingHeadTransfer, appointeeName: next.fullName };
  },

  /** Head can cancel a pending proposal. */
  cancelHeadTransfer(headPassword) {
    if (!this.isHead()) return { ok: false, error: 'Only the Head Teacher can cancel a pending transfer.' };
    const state = this._read();
    if (!this.verifyPassword(state.headStaffId, headPassword)) {
      return { ok: false, error: 'Incorrect Head Teacher password.' };
    }
    state.pendingHeadTransfer = null;
    this._write(state);
    return { ok: true };
  },

  /**
   * Appointee accepts — applies transfer. Requires appointee password.
   */
  acceptHeadTransfer(appointeePassword) {
    let state = this._read();
    const pending = state.pendingHeadTransfer;
    if (!pending || pending.status !== 'pending') {
      return { ok: false, error: 'No pending head transfer.' };
    }
    if (state.currentStaffId !== pending.toId) {
      return { ok: false, error: 'Only the appointed teacher can accept this transfer. Sign in as the appointee first.' };
    }
    if (!this.verifyPassword(pending.toId, appointeePassword)) {
      return { ok: false, error: 'Incorrect password. Enter your own login password to confirm acceptance.' };
    }
    const next = state.staff.find(s => s.id === pending.toId && s.active !== false);
    if (!next) return { ok: false, error: 'Appointed staff not found.' };

    state.staff = state.staff.map(s => {
      if (s.id === pending.fromId) {
        return Object.assign({}, s, {
          staffRole: 'faculty',
          position: s.position === 'Head Teacher / Admin' ? 'CDW / Teacher' : s.position,
          updatedAt: new Date().toISOString()
        });
      }
      if (s.id === pending.toId) {
        return Object.assign({}, s, {
          staffRole: 'head',
          position: 'Head Teacher / Admin',
          updatedAt: new Date().toISOString()
        });
      }
      return s;
    });
    state.headStaffId = pending.toId;
    state.currentStaffId = pending.toId;
    state.pendingHeadTransfer = null;
    // Role only — usernames/passwords of both people stay the same
    state = this._normalizeState(state);
    this._write(state);
    this._syncCycle(state.facility, next.fullName);
    return { ok: true, head: this.getHead() };
  },

  /** Appointee declines. */
  declineHeadTransfer(appointeePassword) {
    const state = this._read();
    const pending = state.pendingHeadTransfer;
    if (!pending || pending.status !== 'pending') {
      return { ok: false, error: 'No pending head transfer.' };
    }
    if (state.currentStaffId !== pending.toId) {
      return { ok: false, error: 'Only the appointed teacher can decline this transfer.' };
    }
    if (!this.verifyPassword(pending.toId, appointeePassword)) {
      return { ok: false, error: 'Incorrect password. Response not recorded.' };
    }
    state.pendingHeadTransfer = null;
    this._write(state);
    return { ok: true };
  },

  /** Immediate transfer (legacy) — prefer proposeHeadTransfer. */
  transferHead(newHeadId, headPassword) {
    const proposed = this.proposeHeadTransfer(newHeadId, headPassword);
    return proposed;
  },

  updateStaffById(staffId, patch) {
    if (!this.isHead() && staffId !== this._read().currentStaffId) {
      return { ok: false, error: 'Not allowed.' };
    }
    const state = this._read();
    const idx = state.staff.findIndex(s => s.id === staffId);
    if (idx < 0) return { ok: false, error: 'Staff not found.' };
    const keys = ['fullName', 'position', 'sex', 'email', 'phone', 'employeeId', 'username', 'passwordHint', 'password'];
    const next = Object.assign({}, state.staff[idx]);
    keys.forEach(k => {
      if (patch[k] != null && patch[k] !== '') next[k] = patch[k];
    });
    // Never change staffRole / headStaffId here — use propose/accept transfer
    next.updatedAt = new Date().toISOString();
    state.staff[idx] = next;
    this._write(state);
    return { ok: true, staff: next };
  },

  workerName() {
    const head = this.getHead();
    return (head && head.fullName || '').trim() || '';
  }
};

if (typeof window !== 'undefined') window.TeacherStore = TeacherStore;
