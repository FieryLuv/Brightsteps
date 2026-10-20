/**
 * Teacher activity badges — red dots track real pending work.
 * Children / Dashboard: number of pending applications (0 = no dot).
 */
const ActivityStore = {
  KEY: 'brightsteps_activity_seen_v1',

  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  },

  _write(obj) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(obj || {}));
    } catch (e) { /* ignore */ }
  },

  /** Kept for API compatibility; badges use live pending counts. */
  markSeen(key) {
    const s = this._read();
    s[key] = new Date().toISOString();
    this._write(s);
  },

  pendingApplications() {
    if (typeof ApplicationStore === 'undefined') return 0;
    try {
      return (ApplicationStore.listByStatus('pending') || []).length;
    } catch (e) {
      return 0;
    }
  },

  pendingTransferForMe() {
    if (typeof TeacherStore === 'undefined') return false;
    const p = TeacherStore.getPendingHeadTransfer && TeacherStore.getPendingHeadTransfer();
    if (!p || p.status !== 'pending') return false;
    const cur = TeacherStore._read ? TeacherStore._read().currentStaffId : null;
    return !!(cur && String(cur) === String(p.toId));
  },

  /** Always mirrors actual pending applications (0 = no red dot). */
  childrenBadge() {
    const n = this.pendingApplications();
    return n > 0 ? n : 0;
  },

  transferBadge() {
    return this.pendingTransferForMe() ? 1 : 0;
  },

  badges() {
    return {
      children: this.childrenBadge(),
      transfer: this.transferBadge()
    };
  },

  /** Call after approve / reject / enroll so dots refresh immediately. */
  notifyChanged() {
    if (typeof TeacherLayout !== 'undefined' && TeacherLayout.updateBadges) {
      TeacherLayout.updateBadges();
    }
  }
};

if (typeof window !== 'undefined') window.ActivityStore = ActivityStore;
