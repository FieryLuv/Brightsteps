/**
 * Teacher activity badges — pending applications, role transfers, etc.
 * Seen state in LocalStorage so red dots clear when the module is opened.
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

  markSeen(key) {
    const s = this._read();
    s[key] = new Date().toISOString();
    this._write(s);
  },

  /** Pending online applications (always show count until opened). */
  pendingApplications() {
    if (typeof ApplicationStore === 'undefined') return 0;
    try {
      return (ApplicationStore.listByStatus('pending') || []).length;
    } catch (e) {
      return 0;
    }
  },

  /** Head transfer waiting for this teacher. */
  pendingTransferForMe() {
    if (typeof TeacherStore === 'undefined') return false;
    const p = TeacherStore.getPendingHeadTransfer && TeacherStore.getPendingHeadTransfer();
    if (!p || p.status !== 'pending') return false;
    const cur = TeacherStore._read ? TeacherStore._read().currentStaffId : null;
    return cur && String(cur) === String(p.toId);
  },

  childrenBadge() {
    return this.pendingApplications();
  },

  /** Snapshot for sidebar. */
  badges() {
    return {
      children: this.childrenBadge(),
      transfer: this.pendingTransferForMe() ? 1 : 0
    };
  }
};

if (typeof window !== 'undefined') window.ActivityStore = ActivityStore;
