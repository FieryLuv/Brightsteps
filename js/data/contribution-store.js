/**
 * ContributionStore — monthly parent contributions (C1 lean).
 * Separate from DSWD SFP commodities.
 * Key: brightsteps_contributions_v1
 *
 * Record shape:
 *   { id, childId, yearMonth (YYYY-MM), amountDue, amountPaid, status, paidAt, notes, updatedAt }
 * status: unpaid | partial | paid | waived
 */

const ContributionStore = {
  KEY: 'brightsteps_contributions_v1',
  DEFAULT_AMOUNT: 0,

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

  _status(amountDue, amountPaid, explicit) {
    if (explicit === 'waived') return 'waived';
    const due = Number(amountDue) || 0;
    const paid = Number(amountPaid) || 0;
    if (due <= 0 && paid <= 0) return explicit || 'unpaid';
    if (paid <= 0) return 'unpaid';
    if (paid >= due) return 'paid';
    return 'partial';
  },

  listAll() {
    return this._read().sort((a, b) => (b.yearMonth || '').localeCompare(a.yearMonth || ''));
  },

  listByMonth(yearMonth) {
    return this._read().filter(r => r.yearMonth === yearMonth);
  },

  get(childId, yearMonth) {
    return this._read().find(
      r => String(r.childId) === String(childId) && r.yearMonth === yearMonth
    ) || null;
  },

  /**
   * Upsert contribution for one child × month.
   */
  save(entry) {
    const childId = entry.childId;
    const yearMonth = entry.yearMonth;
    if (!childId || !yearMonth) {
      return { ok: false, error: 'Child and month (YYYY-MM) are required.' };
    }
    const amountDue = entry.amountDue != null ? Number(entry.amountDue) : this.DEFAULT_AMOUNT;
    const amountPaid = entry.amountPaid != null ? Number(entry.amountPaid) : 0;
    const status = this._status(amountDue, amountPaid, entry.status);
    const list = this._read();
    const idx = list.findIndex(
      r => String(r.childId) === String(childId) && r.yearMonth === yearMonth
    );
    const record = {
      id: (idx >= 0 && list[idx].id) || `contrib-${childId}-${yearMonth}`,
      childId: String(childId),
      yearMonth,
      amountDue,
      amountPaid,
      status,
      paidAt: entry.paidAt || (status === 'paid' || status === 'partial' ? new Date().toISOString().slice(0, 10) : ''),
      notes: entry.notes || '',
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    this._write(list);
    if (typeof ContributionRemote !== 'undefined' && ContributionRemote.online()) {
      ContributionRemote.upsert(record).then(function (r) {
        if (!r.ok) console.error('[ContributionStore] remote failed', r.error);
        else console.info('[ContributionStore] synced', record.yearMonth);
      });
    }
    return { ok: true, record };
  },

  async hydrateMonth(yearMonth) {
    if (typeof ContributionRemote === 'undefined' || !ContributionRemote.online()) {
      return this.listByMonth(yearMonth);
    }
    const remote = await ContributionRemote.fetchMonth(yearMonth);
    if (!remote.ok) {
      console.warn('[ContributionStore] hydrate', remote.error);
      return this.listByMonth(yearMonth);
    }
    const list = this._read().filter(r => r.yearMonth !== yearMonth);
    (remote.list || []).forEach(function (r) { list.push(r); });
    this._write(list);
    return this.listByMonth(yearMonth);
  },

  /** Bulk save for a month grid. */
  saveMany(rows) {
    const results = (rows || []).map(r => this.save(r));
    const failed = results.filter(r => !r.ok);
    return { ok: failed.length === 0, count: results.length, failed };
  },

  summaryForMonth(yearMonth) {
    const rows = this.listByMonth(yearMonth);
    let unpaid = 0, partial = 0, paid = 0, waived = 0, due = 0, collected = 0;
    rows.forEach(r => {
      due += Number(r.amountDue) || 0;
      collected += Number(r.amountPaid) || 0;
      if (r.status === 'paid') paid++;
      else if (r.status === 'partial') partial++;
      else if (r.status === 'waived') waived++;
      else unpaid++;
    });
    return { unpaid, partial, paid, waived, due, collected, count: rows.length };
  },

  currentYearMonth() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
};

if (typeof window !== 'undefined') window.ContributionStore = ContributionStore;
