/**
 * BrightSteps — Children ↔ Supabase
 * Maps DB rows ↔ app child objects. Used when BsSupabase session is online.
 */
window.ChildrenRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',
  _cache: null,
  _loadedAt: 0,

  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
  },

  rowToChild(row) {
    if (!row) return null;
    return {
      id: row.id,
      childCode: row.child_code || '',
      name: row.full_name || '',
      firstName: row.first_name || '',
      middleInitial: row.middle_initial || '',
      lastName: row.last_name || '',
      sex: row.sex || 'Female',
      birthDate: row.birth_date || '',
      ageMonths: row.age_months,
      ageLabel: row.age_label || '',
      sectionKey: row.section_key || '',
      section: row.section_label || row.section_key || '',
      recordType: row.record_type || 1,
      parentName: row.parent_name || '',
      motherName: row.mother_name || '',
      fatherName: row.father_name || '',
      address: {
        barangay: row.barangay || '',
        municipality: row.municipality || 'Medina',
        province: row.province || 'Misamis Oriental',
        region: row.region || 'X',
        purok: row.purok || ''
      },
      siblings: row.siblings_count || 0,
      birthOrder: row.birth_order || '',
      archived: row.archived === true,
      archivedAt: row.archived_at || null,
      archiveReason: row.archive_reason || '',
      vaccines: row.vaccines || {},
      documents: row.documents || {},
      photo: row.photo_path ? { path: row.photo_path } : null,
      motherProfile: row.mother_profile || null,
      fatherProfile: row.father_profile || null,
      siblingsDetail: row.siblings_detail || null,
      physicalAttributes: row.physical_attributes || null,
      priorEce: row.prior_ece || null,
      transport: row.transport || null,
      accompanies: row.accompanies || null,
      profileMeta: row.profile_meta || null,
      enrollmentHealth: row.enrollment_health || null,
      enrollmentSource: row.enrollment_source || 'walk_in',
      applicationId: row.application_id || null,
      parentLoginName: row.parent_login_name || '',
      parentPassword: row.parent_password || '',
      status: row.status || 'on_track',
      statusLabel: row.status_label || 'On Track',
      focusArea: row.focus_area || null,
      enrolledAt: row.enrolled_at || row.created_at,
      _remote: true
    };
  },

  childToRow(child, facilityId) {
    const addr = child.address || {};
    return {
      facility_id: facilityId || this.FACILITY_ID,
      child_code: child.childCode || child.child_code,
      first_name: child.firstName || '',
      middle_initial: child.middleInitial || '',
      last_name: child.lastName || '',
      full_name: child.name || child.full_name || '',
      sex: child.sex || 'Female',
      birth_date: child.birthDate || child.birth_date || null,
      age_months: child.ageMonths != null ? child.ageMonths : null,
      age_label: child.ageLabel || '',
      section_key: child.sectionKey || '',
      section_label: child.section || '',
      record_type: child.recordType || 1,
      parent_name: child.parentName || '',
      mother_name: child.motherName || '',
      father_name: child.fatherName || '',
      barangay: addr.barangay || child.barangay || '',
      municipality: addr.municipality || child.municipality || 'Medina',
      province: addr.province || child.province || 'Misamis Oriental',
      region: addr.region || 'X',
      purok: addr.purok || '',
      siblings_count: child.siblings != null ? Number(child.siblings) : 0,
      birth_order: child.birthOrder || '',
      archived: child.archived === true,
      vaccines: child.vaccines || {},
      documents: child.documents || {},
      mother_profile: child.motherProfile || {},
      father_profile: child.fatherProfile || {},
      siblings_detail: child.siblingsDetail || [],
      physical_attributes: child.physicalAttributes || {},
      prior_ece: child.priorEce || {},
      transport: child.transport || {},
      accompanies: child.accompanies || {},
      profile_meta: child.profileMeta || {},
      enrollment_health: child.enrollmentHealth || {},
      enrollment_source: child.enrollmentSource || 'walk_in',
      parent_login_name: child.parentLoginName || child.parentName || '',
      parent_password: child.parentPassword || '',
      status: child.status || 'on_track',
      status_label: child.statusLabel || 'On Track',
      focus_area: child.focusArea || null
    };
  },

  /**
   * Load all children for the facility into memory + SampleChildren when online.
   */
  async fetchAll() {
    if (!this.online()) return { ok: false, error: 'offline', children: [] };
    const sb = BsSupabase.get();
    if (!sb) return { ok: false, error: 'no client', children: [] };

    // Online mode: do not keep demo seed rows in memory
    this._applyToSampleChildren([]);

    const { data, error } = await sb
      .from('children')
      .select('*')
      .eq('facility_id', this.FACILITY_ID)
      .order('full_name');

    if (error) {
      console.warn('[ChildrenRemote] fetchAll', error.message);
      return { ok: false, error: error.message, children: [] };
    }

    const children = (data || []).map(r => this.rowToChild(r));
    this._cache = children;
    this._loadedAt = Date.now();
    this._applyToSampleChildren(children);
    // Drop local-only enrolled cache so offline merge cannot revive old demo rows later
    try {
      localStorage.setItem('brightsteps_enrolled_children_v1', JSON.stringify(children));
    } catch (e) { /* ignore */ }
    return { ok: true, children };
  },

  /**
   * Call before any teacher module lists children while online.
   * Skips network if fetched within the last 15s.
   */
  async ensureLoaded(force) {
    if (!this.online()) return { ok: false, error: 'offline' };
    if (!force && this._cache && (Date.now() - this._loadedAt) < 15000) {
      this._applyToSampleChildren(this._cache);
      return { ok: true, children: this._cache, cached: true };
    }
    return this.fetchAll();
  },

  _applyToSampleChildren(children) {
    if (typeof SampleChildren === 'undefined') return;
    // Replace in-memory list with remote rows when online mode is active
    SampleChildren.length = 0;
    children.forEach(c => SampleChildren.push(c));
  },

  async insert(child) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    // Session required for RLS (authenticated role)
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) {
      return { ok: false, error: 'Not signed in to Supabase. Log out and sign in with your staff email again.' };
    }
    const row = this.childToRow(child);
    // Empty strings → null for date columns
    if (!row.birth_date) row.birth_date = null;
    console.info('[ChildrenRemote] insert payload', row.full_name, row.child_code, row.facility_id);
    const { data, error } = await sb.from('children').insert(row).select('*').single();
    if (error) {
      console.error('[ChildrenRemote] insert error', error);
      return { ok: false, error: error.message || JSON.stringify(error) };
    }
    const mapped = this.rowToChild(data);
    if (typeof SampleChildren !== 'undefined') {
      const i = SampleChildren.findIndex(c => String(c.id) === String(mapped.id));
      if (i >= 0) SampleChildren[i] = mapped;
      else SampleChildren.push(mapped);
    }
    return { ok: true, child: mapped };
  },

  async update(id, patchChild) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const row = this.childToRow(patchChild);
    delete row.facility_id; // don't reassign facility casually
    const { data, error } = await sb
      .from('children')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return { ok: false, error: error.message };
    const mapped = this.rowToChild(data);
    if (typeof SampleChildren !== 'undefined') {
      const i = SampleChildren.findIndex(c => String(c.id) === String(id));
      if (i >= 0) SampleChildren[i] = mapped;
    }
    return { ok: true, child: mapped };
  },

  async setArchived(id, archived, reason) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('children')
      .update({
        archived: !!archived,
        archived_at: archived ? new Date().toISOString() : null,
        archive_reason: reason || ''
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return { ok: false, error: error.message };
    const mapped = this.rowToChild(data);
    if (typeof SampleChildren !== 'undefined') {
      const i = SampleChildren.findIndex(c => String(c.id) === String(id));
      if (i >= 0) SampleChildren[i] = mapped;
    }
    return { ok: true, child: mapped };
  }
,

  async hardDelete(id) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { error } = await sb.from('children').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
};
