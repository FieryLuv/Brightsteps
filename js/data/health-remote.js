/**
 * BrightSteps — Health measurements ↔ Supabase (health_records)
 * Medical profile fields (allergies, etc.) stored in payload JSONB on latest row
 * and mirrored in LocalStorage profiles for offline UI.
 */
window.HealthRemote = {
  FACILITY_ID: 'a0000000-0000-4000-8000-000000000001',

  online() {
    if (typeof BsSupabase === 'undefined' || !BsSupabase.isConfigured()) return false;
    if (!BsSupabase.ready) {
      try { BsSupabase.init(); } catch (e) { /* ignore */ }
    }
    return !!BsSupabase.ready;
  },

  rowToLocal(row) {
    if (!row) return null;
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
      id: row.id,
      childId: row.child_id,
      childName: payload.childName || '',
      date: row.recorded_at || (row.created_at || '').slice(0, 10),
      heightCm: row.height_cm != null ? Number(row.height_cm) : null,
      weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
      bmi: row.bmi != null ? Number(row.bmi) : null,
      status: payload.status || '',
      nutritionStatus: row.nutrition_status || '',
      feedingParticipating: row.feeding_participating !== false,
      notes: row.notes || '',
      recordedBy: payload.recordedBy || 'Teacher',
      savedAt: row.created_at,
      _remote: true,
      _profile: {
        allergies: payload.allergies || '',
        medicalConditions: payload.medicalConditions || '',
        immunizations: payload.immunizations || '',
        notes: payload.profileNotes || ''
      }
    };
  },

  measurementToRow(m, profile) {
    profile = profile || {};
    return {
      facility_id: this.FACILITY_ID,
      child_id: m.childId,
      recorded_at: m.date || new Date().toISOString().slice(0, 10),
      height_cm: m.heightCm != null ? m.heightCm : null,
      weight_kg: m.weightKg != null ? m.weightKg : null,
      bmi: m.bmi != null ? m.bmi : null,
      nutrition_status: m.nutritionStatus || m.status || '',
      notes: m.notes || '',
      feeding_participating: m.feedingParticipating !== false,
      payload: {
        childName: m.childName || '',
        status: m.status || '',
        recordedBy: m.recordedBy || 'Teacher',
        kind: m.kind || 'routine',
        allergies: profile.allergies || '',
        medicalConditions: profile.medicalConditions || '',
        immunizations: profile.immunizations || '',
        profileNotes: profile.notes || ''
      }
    };
  },

  async updateMeasurement(id, m, profile) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) return { ok: false, error: 'Not signed in to Supabase.' };
    if (!id || String(id).length < 30) {
      return this.insertMeasurement(m, profile);
    }
    const row = this.measurementToRow(m, profile);
    delete row.facility_id;
    delete row.child_id;
    const { data, error } = await sb
      .from('health_records')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[HealthRemote] update', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, measurement: this.rowToLocal(data) };
  },

  async insertMeasurement(m, profile) {
    if (!this.online()) return { ok: false, error: 'offline' };
    const sb = BsSupabase.get();
    const { data: sess } = await sb.auth.getSession();
    if (!sess || !sess.session) return { ok: false, error: 'Not signed in to Supabase.' };
    if (!m.childId || String(m.childId).length < 30) {
      return { ok: false, error: 'Child must be server-enrolled (UUID).' };
    }
    const row = this.measurementToRow(m, profile);
    const { data, error } = await sb.from('health_records').insert(row).select('*').single();
    if (error) {
      console.error('[HealthRemote] insert', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, measurement: this.rowToLocal(data) };
  },

  async listForChild(childId) {
    if (!this.online()) return { ok: false, error: 'offline', list: [] };
    const sb = BsSupabase.get();
    const { data, error } = await sb
      .from('health_records')
      .select('*')
      .eq('child_id', childId)
      .order('recorded_at', { ascending: false });
    if (error) return { ok: false, error: error.message, list: [] };
    return { ok: true, list: (data || []).map(r => this.rowToLocal(r)) };
  }
};
