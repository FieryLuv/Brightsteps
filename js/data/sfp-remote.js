/**
 * BrightSteps — SFP (beneficiaries, hot meals, NUTRICombo) ↔ Supabase
 */
window.SfpRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',
  _cycleUuid: null,

  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
  },

  async ensureCycle(localCycle) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) return { ok: false, error: 'Not signed in.' };

    // Prefer existing active cycle for facility
    const { data: existing } = await sb
      .from('sfp_cycles')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (existing) {
      this._cycleUuid = existing.id;
      return { ok: true, cycle: existing };
    }

    const c = localCycle || {};
    const row = {
      facility_id: this.FACILITY_ID,
      cycle_number: c.cycleNumber || 15,
      cycle_label: c.cycleLabel || '15th Cycle',
      school_year: c.schoolYear || '2025-2026',
      worker_name: c.workerName || '',
      facility_name: c.facilityName || 'National Child Development Center — Medina',
      facility_category: c.facilityCategory || 'CDC',
      province: c.province || 'Misamis Oriental',
      municipality: c.municipality || 'Medina',
      barangay: c.barangay || '',
      with_wash_facility: c.withWashFacility === true,
      with_community_garden: c.withCommunityGarden === true,
      is_active: true
    };
    const { data, error } = await sb.from('sfp_cycles').insert(row).select('*').single();
    if (error) return { ok: false, error: error.message };
    this._cycleUuid = data.id;
    return { ok: true, cycle: data };
  },

  async upsertBeneficiary(childId, ben) {
    if (!this.online()) return { ok: false, error: 'offline' };
    if (!childId || String(childId).length < 30) {
      return { ok: false, error: 'Child must be server UUID.' };
    }
    const sb = BsSupabase.get();
    const cyc = await this.ensureCycle(typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : null);
    if (!cyc.ok) return cyc;

    const flags = {
      disability: !!ben.disability,
      disabilitySpecify: ben.disabilitySpecify || '',
      soloParent: !!ben.soloParent,
      eo70: !!ben.eo70,
      dewormed: !!ben.dewormed,
      vitaminA: !!ben.vitaminA,
      fourPs: !!ben.fourPs,
      fourPsId: ben.fourPsId || '',
      indigenous: !!ben.indigenous,
      indigenousAffiliation: ben.indigenousAffiliation || '',
      parentPsn: ben.parentPsn || '',
      parentSex: ben.parentSex || '',
      incomeSource: ben.incomeSource || '',
      parentPwd: !!ben.parentPwd,
      fdsAttended: !!ben.fdsAttended,
      pesModules: ben.pesModules || ''
    };
    const consent = {
      consent: !!ben.consent,
      consentDate: ben.consentDate || '',
      consentName: ben.consentName || ''
    };
    const row = {
      child_id: childId,
      facility_id: this.FACILITY_ID,
      cycle_id: cyc.cycle.id,
      beneficiary_name: ben.beneficiaryName || '',
      beneficiary_sex: ben.beneficiarySex || '',
      beneficiary_birth_date: ben.beneficiaryBirthDate || null,
      beneficiary_age_label: ben.beneficiaryAgeLabel || '',
      beneficiary_address: ben.beneficiaryAddress || '',
      parent_name: ben.parentGuardianName || '',
      flags,
      entry_height: ben.entryHeightCm != null ? ben.entryHeightCm : null,
      entry_weight: ben.entryWeightKg != null ? ben.entryWeightKg : null,
      entry_nutrition: ben.nutritionEntry || '',
      six_mo_height: ben.after6moHeightCm != null ? ben.after6moHeightCm : null,
      six_mo_weight: ben.after6moWeightKg != null ? ben.after6moWeightKg : null,
      six_mo_nutrition: ben.nutritionAfter6mo || '',
      consent,
      payload: {
        entryWeighDate: ben.entryWeighDate || '',
        after6moWeighDate: ben.after6moWeighDate || '',
        notes: ben.notes || ''
      },
      enrolled: ben.enrolledInSfp !== false
    };
    if (!row.beneficiary_birth_date) row.beneficiary_birth_date = null;

    const { data, error } = await sb
      .from('sfp_beneficiaries')
      .upsert(row, { onConflict: 'child_id,cycle_id' })
      .select('*')
      .single();
    if (error) {
      console.error('[SfpRemote] beneficiary', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, beneficiary: data };
  },

  statusToDb(s) {
    const v = String(s || '').toLowerCase();
    if (v === 'fed' || v === 'Fed') return 'Fed';
    if (v === 'absent' || v === 'Absent') return 'Absent';
    return 'Not fed';
  },

  async saveHotMealDay(day) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    await this.ensureCycle();
    const statuses = day.childStatuses || [];
    const rows = [];
    statuses.forEach(cs => {
      if (!cs.childId || String(cs.childId).length < 30) return;
      rows.push({
        facility_id: this.FACILITY_ID,
        child_id: cs.childId,
        section_key: cs.sectionKey || '',
        log_date: day.actualDate,
        status: this.statusToDb(cs.status),
        menu_label: day.menuLabel || ''
      });
    });
    if (!rows.length) return { ok: true, count: 0 };
    const { data, error } = await sb
      .from('sfp_hot_meal_logs')
      .upsert(rows, { onConflict: 'child_id,log_date' })
      .select('id');
    if (error) {
      console.error('[SfpRemote] hot meal', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, count: (data || []).length };
  },

  async saveAltDelivery(delivery) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    await this.ensureCycle();
    const receipts = delivery.receipts || [];
    let count = 0;
    for (let i = 0; i < receipts.length; i++) {
      const r = receipts[i];
      if (!r.childId || String(r.childId).length < 30) continue;
      const row = {
        facility_id: this.FACILITY_ID,
        child_id: r.childId,
        section_key: r.sectionKey || '',
        delivery_no: delivery.deliveryNumber != null ? delivery.deliveryNumber : null,
        qty: r.quantity != null ? r.quantity : null,
        received: !!r.received,
        parent_signed: !!r.parentSigned,
        delivered_at: delivery.actualDate || null,
        notes: delivery.particulars || ''
      };
      const { error } = await sb.from('sfp_nutricombo_deliveries').insert(row);
      if (error) console.warn('[SfpRemote] nutricombo row', error.message);
      else count++;
    }
    return { ok: true, count };
  },

  async fetchBeneficiaries() {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('sfp_beneficiaries')
      .select('*')
      .eq('facility_id', this.FACILITY_ID);
    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: data || [] };
  },

  rowToLocalBen(row) {
    if (!row) return null;
    const flags = row.flags || {};
    const consent = row.consent || {};
    const payload = row.payload || {};
    return {
      childId: row.child_id,
      enrolledInSfp: row.enrolled !== false,
      beneficiaryName: row.beneficiary_name || '',
      beneficiarySex: row.beneficiary_sex || '',
      beneficiaryBirthDate: row.beneficiary_birth_date || '',
      beneficiaryAgeLabel: row.beneficiary_age_label || '',
      beneficiaryAddress: row.beneficiary_address || '',
      parentGuardianName: row.parent_name || '',
      disability: !!flags.disability,
      disabilitySpecify: flags.disabilitySpecify || '',
      soloParent: !!flags.soloParent,
      eo70: !!flags.eo70,
      dewormed: !!flags.dewormed,
      vitaminA: !!flags.vitaminA,
      fourPs: !!flags.fourPs,
      fourPsId: flags.fourPsId || '',
      indigenous: !!flags.indigenous,
      indigenousAffiliation: flags.indigenousAffiliation || '',
      parentPsn: flags.parentPsn || '',
      parentSex: flags.parentSex || '',
      incomeSource: flags.incomeSource || '',
      parentPwd: !!flags.parentPwd,
      fdsAttended: !!flags.fdsAttended,
      pesModules: flags.pesModules || '',
      entryWeighDate: payload.entryWeighDate || '',
      entryHeightCm: row.entry_height,
      entryWeightKg: row.entry_weight,
      after6moWeighDate: payload.after6moWeighDate || '',
      after6moHeightCm: row.six_mo_height,
      after6moWeightKg: row.six_mo_weight,
      nutritionEntry: row.entry_nutrition || '',
      nutritionAfter6mo: row.six_mo_nutrition || '',
      consent: !!consent.consent,
      consentDate: consent.consentDate || '',
      consentName: consent.consentName || '',
      notes: payload.notes || '',
      _remote: true
    };
  }
};
