/**
 * Teacher activity badges — pending applications, role transfers, etc.
 * Red dots clear when the module is opened (seen count stored).
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

  /**
   * Mark a module as seen. For children/dashboard, stores the current pending
   * application count so the badge stays clear until NEW pending apps arrive.
   */
  markSeen(key) {
    const s = this._read();
    s[key] = new Date().toISOString();
    if (key === 'children' || key === 'dashboard') {
      s.seenPendingApps = this.pendingApplications();
    }
    if (key === 'transfer') {
      s.seenTransferAt = new Date().toISOString();
    }
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

  /**
   * Badge count for Children: only NEW pending apps since last visit to Children/Dashboard.
   */
  childrenBadge() {
    const pending = this.pendingApplications();
    const seen = this._read();
    const dismissed = typeof seen.seenPendingApps === 'number' ? seen.seenPendingApps : -1;
    // Never visited → show all pending; after visit → only growth in count
    if (dismissed < 0) return pending;
    return Math.max(0, pending - dismissed);
  },

  transferBadge() {
    if (!this.pendingTransferForMe()) return 0;
    const seen = this._read();
    // Hide until a new proposal (clear seenTransfer when propose sets pending)
    if (seen.seenTransferAt) return 0;
    return 1;
  },

  badges() {
    return {
      children: this.childrenBadge(),
      transfer: this.transferBadge()
    };
  }
};

if (typeof window !== 'undefined') window.ActivityStore = ActivityStore;
