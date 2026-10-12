/**
 * SfpStore — Supplementary Feeding Program (DSWD SFP) data for NCDC Medina.
 * Keys: brightsteps_sfp_v1
 *
 * Supports lean v1:
 *  - Cycle config
 *  - Per-child beneficiary profile (flags + consent)
 *  - Hot meal days (-A style): day #, date, per-child Fed/Not fed/Absent
 *  - Alternative / NUTRICombo deliveries (-C style): per-child receipt + parent signed
 */

const SfpStore = {
  KEY: 'brightsteps_sfp_v1',

  _defaultState() {
    return {
      cycles: [],
      activeCycleId: null,
      beneficiaries: {},   // childId -> profile
      feedingDays: [],     // hot meal day logs
      altDeliveries: []    // nutricombo deliveries
    };
  },

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._defaultState();
      const data = JSON.parse(raw);
      return {
        cycles: Array.isArray(data.cycles) ? data.cycles : [],
        activeCycleId: data.activeCycleId || null,
        beneficiaries: data.beneficiaries && typeof data.beneficiaries === 'object' ? data.beneficiaries : {},
        feedingDays: Array.isArray(data.feedingDays) ? data.feedingDays : [],
        altDeliveries: Array.isArray(data.altDeliveries) ? data.altDeliveries : []
      };
    } catch (e) {
      return this._defaultState();
    }
  },

  _write(state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  },

  /** Ensure a default 15th-cycle record exists for Medina NCDC. */
  ensureSeed() {
    const state = this._read();
    if (state.cycles.length) return state;
    const cycle = {
      id: 'sfp-15th-2025',
      cycleNumber: 15,
      cycleLabel: '15th Cycle',
      schoolYear: '2025-2026',
      facilityName: 'National Child Development Center — Medina',
      facilityCategory: 'CDC',
      province: 'Misamis Oriental',
      municipality: 'Medina',
      barangay: '',
      workerName: '',
      startDate: '',
      targetFeedingDays: 120,
      withWashFacility: null,
      withCommunityGarden: null,
      createdAt: new Date().toISOString()
    };
    state.cycles.push(cycle);
    state.activeCycleId = cycle.id;
    this._write(state);
    return state;
  },

  getActiveCycle() {
    const state = this.ensureSeed();
    return state.cycles.find(c => c.id === state.activeCycleId) || state.cycles[0] || null;
  },

  listCycles() {
    return this.ensureSeed().cycles.slice();
  },

  saveCycle(patch) {
    const state = this.ensureSeed();
    const id = patch.id || state.activeCycleId;
    const idx = state.cycles.findIndex(c => c.id === id);
    if (idx < 0) return { ok: false, error: 'Cycle not found.' };
    state.cycles[idx] = { ...state.cycles[idx], ...patch, id: state.cycles[idx].id };
    this._write(state);
    return { ok: true, cycle: state.cycles[idx] };
  },

  // ── Beneficiary profile ──────────────────────────────────────────

  getBeneficiary(childId) {
    const state = this._read();
    return state.beneficiaries[String(childId)] || null;
  },

  saveBeneficiary(childId, data) {
    const state = this.ensureSeed();
    const id = String(childId);
    const prev = state.beneficiaries[id] || {};
    state.beneficiaries[id] = {
      childId: id,
      enrolledInSfp: data.enrolledInSfp !== false,
      // Snapshot of identity (prefilled from child, editable on SFP form)
      beneficiaryName: data.beneficiaryName != null ? data.beneficiaryName : (prev.beneficiaryName || ''),
      beneficiarySex: data.beneficiarySex != null ? data.beneficiarySex : (prev.beneficiarySex || ''),
      beneficiaryBirthDate: data.beneficiaryBirthDate != null ? data.beneficiaryBirthDate : (prev.beneficiaryBirthDate || ''),
      beneficiaryAgeLabel: data.beneficiaryAgeLabel != null ? data.beneficiaryAgeLabel : (prev.beneficiaryAgeLabel || ''),
      beneficiaryAddress: data.beneficiaryAddress != null ? data.beneficiaryAddress : (prev.beneficiaryAddress || ''),
      parentGuardianName: data.parentGuardianName != null ? data.parentGuardianName : (prev.parentGuardianName || ''),
      disability: data.disability === true || data.disability === 'Yes',
      disabilitySpecify: data.disabilitySpecify || '',
      soloParent: data.soloParent === true || data.soloParent === 'Yes',
      eo70: data.eo70 === true || data.eo70 === 'Yes',
      dewormed: data.dewormed === true || data.dewormed === 'Yes',
      vitaminA: data.vitaminA === true || data.vitaminA === 'Yes',
      fourPs: data.fourPs === true || data.fourPs === 'Yes',
      fourPsId: data.fourPsId || '',
      indigenous: data.indigenous === true || data.indigenous === 'Yes',
      indigenousAffiliation: data.indigenousAffiliation || '',
      parentPsn: data.parentPsn || '',
      parentSex: data.parentSex || '',
      incomeSource: data.incomeSource || '',
      parentPwd: data.parentPwd === true || data.parentPwd === 'Yes',
      fdsAttended: data.fdsAttended === true || data.fdsAttended === 'Yes',
      pesModules: data.pesModules || '',
      entryWeighDate: data.entryWeighDate || prev.entryWeighDate || '',
      entryHeightCm: data.entryHeightCm != null ? data.entryHeightCm : prev.entryHeightCm,
      entryWeightKg: data.entryWeightKg != null ? data.entryWeightKg : prev.entryWeightKg,
      after6moWeighDate: data.after6moWeighDate || prev.after6moWeighDate || '',
      after6moHeightCm: data.after6moHeightCm != null ? data.after6moHeightCm : prev.after6moHeightCm,
      after6moWeightKg: data.after6moWeightKg != null ? data.after6moWeightKg : prev.after6moWeightKg,
      nutritionEntry: data.nutritionEntry || prev.nutritionEntry || '',
      nutritionAfter6mo: data.nutritionAfter6mo || prev.nutritionAfter6mo || '',
      consent: data.consent === true || data.consent === 'Yes',
      consentDate: data.consentDate || prev.consentDate || '',
      consentName: data.consentName || prev.consentName || '',
      notes: data.notes || prev.notes || '',
      updatedAt: new Date().toISOString()
    };
    this._write(state);
    return { ok: true, beneficiary: state.beneficiaries[id] };
  },

  listBeneficiaries() {
    const state = this._read();
    return Object.values(state.beneficiaries).filter(b => b.enrolledInSfp !== false);
  },

  // ── Hot meal feeding days (-A) ───────────────────────────────────

  /**
   * Save or replace a hot-meal day log.
   * @param {object} entry
   *   cycleId, dayNumber, actualDate, menuLabel,
   *   childStatuses: [{ childId, status: 'fed'|'not_fed'|'absent' }],
   *   commoditiesNote, committeeNote
   */
  saveHotMealDay(entry) {
    const state = this.ensureSeed();
    const cycleId = entry.cycleId || state.activeCycleId;
    const dayNumber = Number(entry.dayNumber);
    const actualDate = entry.actualDate || '';
    if (!dayNumber || !actualDate) {
      return { ok: false, error: 'Feeding day number and actual date are required.' };
    }
    const menu = typeof SfpMenu !== 'undefined' ? SfpMenu.get(dayNumber) : null;
    const record = {
      id: entry.id || `hot-${cycleId}-${dayNumber}-${actualDate}`,
      cycleId,
      mode: 'hot',
      dayNumber,
      actualDate,
      menuLabel: entry.menuLabel || (menu && menu.dish) || '',
      childStatuses: Array.isArray(entry.childStatuses) ? entry.childStatuses : [],
      commoditiesNote: entry.commoditiesNote || '',
      committeeNote: entry.committeeNote || '',
      savedAt: new Date().toISOString()
    };
    const idx = state.feedingDays.findIndex(
      d => d.cycleId === cycleId && d.dayNumber === dayNumber && d.actualDate === actualDate
    );
    if (idx >= 0) state.feedingDays[idx] = record;
    else state.feedingDays.push(record);
    this._write(state);
    return { ok: true, day: record };
  },

  getHotMealDay(cycleId, dayNumber, actualDate) {
    const state = this._read();
    return state.feedingDays.find(
      d => d.cycleId === (cycleId || state.activeCycleId) &&
        d.dayNumber === Number(dayNumber) &&
        (!actualDate || d.actualDate === actualDate)
    ) || null;
  },

  listHotMealDays(cycleId) {
    const state = this._read();
    const cid = cycleId || state.activeCycleId;
    return state.feedingDays
      .filter(d => d.cycleId === cid)
      .sort((a, b) => (a.dayNumber - b.dayNumber) || (a.actualDate || '').localeCompare(b.actualDate || ''));
  },

  countHotFeedingDays(cycleId) {
    return this.listHotMealDays(cycleId).length;
  },

  // ── Alternative / NUTRICombo (-C) ────────────────────────────────

  /**
   * @param {object} entry
   *   cycleId, deliveryNumber, actualDate, quantityDefault,
   *   receipts: [{ childId, childName, parentName, quantity, received, parentSigned }]
   */
  saveAltDelivery(entry) {
    const state = this.ensureSeed();
    const cycleId = entry.cycleId || state.activeCycleId;
    const actualDate = entry.actualDate || '';
    if (!actualDate) return { ok: false, error: 'Delivery date is required.' };
    const incoming = Array.isArray(entry.receipts) ? entry.receipts : [];
    const record = {
      id: entry.id || `alt-${cycleId}-${actualDate}`,
      cycleId,
      mode: 'nutricombo',
      deliveryNumber: entry.deliveryNumber != null ? Number(entry.deliveryNumber) : null,
      actualDate,
      particulars: entry.particulars || 'NUTRI-COMBO (High Protein Cookie 60g & Nutri Juice 200mL)',
      receipts: incoming,
      savedAt: new Date().toISOString()
    };

    // Same cycle + date: MERGE receipts by childId so logging one class
    // does not wipe children from other classes saved the same day.
    const same = state.altDeliveries.findIndex(
      d => d.cycleId === cycleId && d.actualDate === actualDate
    );
    if (same >= 0) {
      const prev = state.altDeliveries[same];
      const map = {};
      (prev.receipts || []).forEach(r => {
        if (r && r.childId != null) map[String(r.childId)] = r;
      });
      incoming.forEach(r => {
        if (r && r.childId != null) map[String(r.childId)] = r;
      });
      record.id = prev.id || record.id;
      if (record.deliveryNumber == null && prev.deliveryNumber != null) {
        record.deliveryNumber = prev.deliveryNumber;
      }
      if (!entry.particulars && prev.particulars) record.particulars = prev.particulars;
      record.receipts = Object.values(map);
      state.altDeliveries[same] = record;
    } else {
      const idx = state.altDeliveries.findIndex(d => d.id === record.id);
      if (idx >= 0) state.altDeliveries[idx] = record;
      else state.altDeliveries.push(record);
    }
    this._write(state);
    return { ok: true, delivery: record };
  },

  listAltDeliveries(cycleId) {
    const state = this._read();
    const cid = cycleId || state.activeCycleId;
    return state.altDeliveries
      .filter(d => d.cycleId === cid)
      .sort((a, b) => (a.actualDate || '').localeCompare(b.actualDate || ''));
  },

  countAltFeedingDays(cycleId) {
    return this.listAltDeliveries(cycleId).length;
  },

  // ── Aggregates for reports ───────────────────────────────────────

  statsForConsolidation() {
    const bens = this.listBeneficiaries();
    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const byId = {};
    children.forEach(c => { byId[String(c.id)] = c; });

    const empty = () => ({ total: 0, male: 0, female: 0 });
    const add = (bucket, sex) => {
      bucket.total++;
      if (sex === 'Male') bucket.male++;
      else if (sex === 'Female') bucket.female++;
    };

    const totals = empty();
    const fourPs = empty();
    const disability = empty();
    const indigenous = empty();
    const soloParent = empty();
    const dewormed = empty();
    const vitaminA = empty();
    const ageBands = { 2: empty(), 3: empty(), 4: empty(), 5: empty() };

    bens.forEach(b => {
      const child = byId[String(b.childId)];
      const sex = child ? child.sex : '';
      add(totals, sex);
      if (b.fourPs) add(fourPs, sex);
      if (b.disability) add(disability, sex);
      if (b.indigenous) add(indigenous, sex);
      if (b.soloParent) add(soloParent, sex);
      if (b.dewormed) add(dewormed, sex);
      if (b.vitaminA) add(vitaminA, sex);

      let ageY = null;
      if (child && child.birthDate) {
        const bd = new Date(child.birthDate + 'T00:00:00');
        if (!isNaN(bd.getTime())) {
          const t = new Date();
          ageY = t.getFullYear() - bd.getFullYear();
          const m = t.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && t.getDate() < bd.getDate())) ageY--;
        }
      } else if (child && child.ageMonths != null) {
        ageY = Math.floor(Number(child.ageMonths) / 12);
      }
      if (ageY != null && ageBands[ageY]) add(ageBands[ageY], sex);
    });

    return {
      beneficiaries: totals,
      fourPs,
      disability,
      indigenous,
      soloParent,
      dewormed,
      vitaminA,
      ageBands,
      hotFeedingDays: this.countHotFeedingDays(),
      altFeedingDays: this.countAltFeedingDays()
    };
  }
};

if (typeof window !== 'undefined') {
  window.SfpStore = SfpStore;
  try { SfpStore.ensureSeed(); } catch (e) { /* ignore */ }
}
