/**
 * Teacher Health Records
 * Section list → child health cards → profile modal (measurements + medical notes)
 */

const TeacherHealth = {
  selectedSection: 'explorers',

  sections: [
    { key: 'explorers', label: 'Little Explorers', ages: '0–3 yrs' },
    { key: 'stars', label: 'Little Stars', ages: '3–4 yrs' },
    { key: 'sunshine', label: 'Sunshine Group', ages: '4–5 yrs' }
  ],

  _sectionList() {
    if (typeof ClassStore !== 'undefined' && ClassStore.options) {
      return ClassStore.options(false).map(o => ({
        key: o.key,
        label: o.label.split('(')[0].trim(),
        ages: (o.label.match(/\(([^)]+)\)/) || [])[1] || ''
      }));
    }
    return this.sections;
  },

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (typeof SfpStore !== 'undefined') SfpStore.ensureSeed();
    this._draw();
  },

  _childrenInSection() {
    return (typeof SampleChildren !== 'undefined' ? SampleChildren : [])
      .filter(c => c.sectionKey === this.selectedSection);
  },

  _draw() {
    const children = this._childrenInSection();
    const allIds = children.map(c => c.id);
    const stats = typeof HealthStore !== 'undefined'
      ? HealthStore.summaryStats(allIds)
      : { withRecord: 0, normal: 0, under: 0, over: 0, feeding: 0, total: children.length };

    const sectionList = this._sectionList();
    const sectionBtns = sectionList.map(s => {
      const active = s.key === this.selectedSection;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherHealth.selectSection('${s.key}')">${s.label}${s.ages ? ' (' + s.ages + ')' : ''}</button>`;
    }).join('');

    const cards = children.map(c => this._childCard(c)).join('');

    this._container.innerHTML = `
      ${UI.pageHeader('❤️ Health Records', 'Height, weight, BMI, SFP beneficiary profile, and medical notes.')}

      <div class="card">
        <h3 style="margin-top:0;">Select Class / Section</h3>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">${sectionBtns}</div>
      </div>

      <div class="dashboard-grid" style="margin:1.25rem 0;">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Section summary</h3>
          <p style="margin:0.35rem 0;"><strong>${stats.withRecord}</strong> / ${stats.total} children have a measurement on file</p>
          <p style="margin:0.35rem 0;">BMI status: <span class="success-text">${stats.normal} normal</span>
            · <span style="color:var(--orange);">${stats.under} underweight</span>
            · <span style="color:#d32f2f;">${stats.over} overweight/obese</span></p>
        </div>
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">🍎 SFP / Feeding</h3>
          <p style="margin:0.35rem 0;"><strong>${typeof SfpStore !== 'undefined' ? SfpStore.listBeneficiaries().filter(b => children.some(c => String(c.id) === String(b.childId))).length : stats.feeding}</strong> / ${children.length} SFP beneficiaries in this section</p>
          <p class="text-muted" style="margin:0;font-size:0.85rem;">Open a child → SFP Beneficiary Profile. Daily feeding logs come in the next phase.</p>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Children — ${(sectionList.find(s => s.key === this.selectedSection) || {}).label || this.selectedSection}</h3>
        ${children.length
          ? `<div class="dashboard-grid">${cards}</div>`
          : `<p class="text-muted">No children in this section.</p>`}
      </div>
    `;
  },

  selectSection(key) {
    this.selectedSection = key;
    this._draw();
  },

  _childCard(c) {
    const latest = typeof HealthStore !== 'undefined' ? HealthStore.getLatest(c.id) : null;
    let metrics = '<p class="text-muted" style="margin:0 0 0.75rem;font-size:0.85rem;">No measurement yet</p>';
    if (latest) {
      const statusColor = (latest.status || '').toLowerCase().includes('normal')
        ? 'var(--success)'
        : (latest.status || '').toLowerCase().includes('under')
          ? 'var(--orange)'
          : '#d32f2f';
      metrics = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.75rem;font-size:0.88rem;">
          <div><span class="text-muted">Height</span><div style="font-weight:700;">${latest.heightCm != null ? latest.heightCm + ' cm' : '—'}</div></div>
          <div><span class="text-muted">Weight</span><div style="font-weight:700;">${latest.weightKg != null ? latest.weightKg + ' kg' : '—'}</div></div>
          <div><span class="text-muted">BMI</span><div style="font-weight:700;">${latest.bmi != null ? latest.bmi : '—'}</div></div>
          <div><span class="text-muted">Status</span><div style="font-weight:700;color:${statusColor};">${latest.status || '—'}</div></div>
        </div>
        <p class="text-muted" style="margin:0 0 0.75rem;font-size:0.78rem;">Last: ${latest.date || '—'}</p>`;
    }
    const sfp = typeof SfpStore !== 'undefined' ? SfpStore.getBeneficiary(c.id) : null;
    const sfpBadge = sfp && sfp.enrolledInSfp !== false
      ? '<span style="font-size:0.72rem;font-weight:700;color:#2e7d32;background:#e8f5e9;padding:2px 8px;border-radius:12px;">SFP</span>'
      : '<span style="font-size:0.72rem;color:var(--muted);">—</span>';
    return `
      <div class="card child-card" style="margin-bottom:0;">
        <div class="flex justify-between items-center" style="margin-bottom:0.35rem;">
          <strong>${c.name}</strong>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            ${sfpBadge}
            <span style="font-size:0.85rem;color:var(--muted);">${c.ageLabel}</span>
          </span>
        </div>
        ${metrics}
        <button class="btn btn-blue" style="width:100%;" onclick="TeacherHealth.openProfile(${c.id})">
          Open health record
        </button>
      </div>`;
  },

  openProfile(childId) {
    const child = SampleChildren.find(c => c.id === childId);
    if (!child) return;

    const history = HealthStore.listForChild(childId);
    const latest = history[0] || null;
    const profile = HealthStore.getProfile(childId);
    const today = new Date().toISOString().slice(0, 10);
    const sfp = (typeof SfpStore !== 'undefined' && SfpStore.getBeneficiary(childId)) || {};
    const yn = (v) => (v === true || v === 'Yes' ? 'Yes' : (v === false || v === 'No' ? 'No' : ''));
    const chk = (cond) => (cond ? 'checked' : '');

    const histRows = history.length
      ? history.map(m => `
          <tr>
            <td>${m.date || '—'}</td>
            <td>${m.heightCm != null ? m.heightCm : '—'}</td>
            <td>${m.weightKg != null ? m.weightKg : '—'}</td>
            <td>${m.bmi != null ? m.bmi : '—'}</td>
            <td>${m.status || '—'}</td>
            <td style="font-size:0.8rem;">${m.nutritionStatus || '—'}</td>
            <td style="font-size:0.78rem;color:var(--muted);">${m.recordedBy || ''}</td>
          </tr>`).join('')
      : '<tr><td colspan="7" class="text-muted">No measurements yet</td></tr>';

    const latestBlock = latest
      ? `<div class="dashboard-grid" style="margin-bottom:1rem;">
           <div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:10px;">
             <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${latest.heightCm != null ? latest.heightCm + ' cm' : '—'}</div>
             <div class="text-muted">Height</div>
           </div>
           <div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:10px;">
             <div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${latest.weightKg != null ? latest.weightKg + ' kg' : '—'}</div>
             <div class="text-muted">Weight</div>
           </div>
           <div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:10px;">
             <div style="font-size:1.5rem;font-weight:700;color:var(--orange);">${latest.status || '—'}</div>
             <div class="text-muted">BMI Status${latest.bmi != null ? ' (' + latest.bmi + ')' : ''}</div>
           </div>
           <div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:10px;">
             <div style="font-size:1.5rem;font-weight:700;color:var(--purple, #7b1fa2);">${latest.feedingParticipating ? 'Yes' : 'No'}</div>
             <div class="text-muted">Feeding program</div>
           </div>
         </div>`
      : `<p class="text-muted">No measurements recorded yet. Add one below.</p>`;

    const html = `
      <div id="health-profile-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">Health Record — ${child.name}</h2>
            <button class="bs-modal-close" onclick="TeacherHealth.closeProfile()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted" style="margin-bottom:1rem;">${child.ageLabel} · ${child.section} · Parent: ${child.parentName || '—'}</p>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">Latest measurement</h3>
              ${latestBlock}
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">Update health record</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                  <label class="ecc-field-label">Date of measurement</label>
                  <input type="date" id="h-date" class="ecc-field-input" value="${today}" />
                </div>
                <div>
                  <label class="ecc-field-label">Recorded by</label>
                  <input type="text" id="h-by" class="ecc-field-input" value="Teacher" />
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1rem;">
                <div>
                  <label class="ecc-field-label">Height (cm)</label>
                  <input type="number" id="h-height" class="ecc-field-input" step="0.1" placeholder="e.g. 92"
                    oninput="TeacherHealth._recalcBmi()" />
                </div>
                <div>
                  <label class="ecc-field-label">Weight (kg)</label>
                  <input type="number" id="h-weight" class="ecc-field-input" step="0.1" placeholder="e.g. 13.8"
                    oninput="TeacherHealth._recalcBmi()" />
                </div>
                <div>
                  <label class="ecc-field-label">BMI (auto)</label>
                  <input type="text" id="h-bmi" class="ecc-field-input" readonly placeholder="—" />
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
                <div>
                  <label class="ecc-field-label">BMI status</label>
                  <select id="h-status" class="ecc-field-input">
                    <option value="Normal">Normal</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Overweight">Overweight</option>
                    <option value="Obese">Obese</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Nutrition status</label>
                  <select id="h-nutrition" class="ecc-field-input">
                    <option value="Normal">Normal</option>
                    <option value="At risk">At risk</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Stunted">Stunted</option>
                    <option value="Wasted">Wasted</option>
                    <option value="Overweight">Overweight</option>
                  </select>
                </div>
              </div>
              <div style="margin-top:1rem;">
                <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                  <input type="checkbox" id="h-feeding" checked />
                  Participating in feeding program
                </label>
              </div>
              <div style="margin-top:1rem;">
                <label class="ecc-field-label">Notes</label>
                <textarea id="h-notes" class="ecc-report-textarea" rows="2" placeholder="Appetite, observations…"></textarea>
              </div>
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveMeasurement(${child.id})">
                💾 Save measurement
              </button>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">Medical profile</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                  <label class="ecc-field-label">Allergies</label>
                  <input type="text" id="h-allergies" class="ecc-field-input" value="${this._esc(profile.allergies)}" placeholder="None / list allergies" />
                </div>
                <div>
                  <label class="ecc-field-label">Medical conditions</label>
                  <input type="text" id="h-conditions" class="ecc-field-input" value="${this._esc(profile.medicalConditions)}" placeholder="None / list conditions" />
                </div>
              </div>
              <div style="margin-top:1rem;">
                <label class="ecc-field-label">Immunizations</label>
                <input type="text" id="h-immun" class="ecc-field-input" value="${this._esc(profile.immunizations)}" placeholder="e.g. Up to date / due for booster" />
              </div>
              <div style="margin-top:1rem;">
                <label class="ecc-field-label">Other medical notes</label>
                <textarea id="h-mednotes" class="ecc-report-textarea" rows="2">${this._esc(profile.notes)}</textarea>
              </div>
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveProfile(${child.id})">
                💾 Save medical profile
              </button>
            </div>

            <div class="card" style="margin-bottom:1rem;border-left:4px solid #2e7d32;">
              <h3 style="margin-top:0;">🥗 SFP Beneficiary Profile <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(DSWD Supplementary Feeding)</span></h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">
                Matches the official Beneficiary Profile intake. Used for MSWDO consolidation reports.
                Prefills child identity from enrollment where possible.
              </p>
              <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-weight:600;">
                <input type="checkbox" id="sfp-enrolled" ${sfp.enrolledInSfp !== false && (sfp.childId || sfp.consent || sfp.fourPs != null) ? 'checked' : (sfp.enrolledInSfp === false ? '' : '')} />
                Enrolled in Supplementary Feeding Program (SFP)
              </label>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Diagnosed disability?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-disability" value="Yes" ${chk(sfp.disability)} /> Yes</label>
                    <label><input type="radio" name="sfp-disability" value="No" ${chk(sfp.disability === false || (sfp.childId && !sfp.disability))} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">If yes, specify</label>
                  <input type="text" id="sfp-disability-spec" class="ecc-field-input" value="${this._esc(sfp.disabilitySpecify)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Child of solo parent?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-solo" value="Yes" ${chk(sfp.soloParent)} /> Yes</label>
                    <label><input type="radio" name="sfp-solo" value="No" ${chk(sfp.soloParent === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Monitored under EO 70?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-eo70" value="Yes" ${chk(sfp.eo70)} /> Yes</label>
                    <label><input type="radio" name="sfp-eo70" value="No" ${chk(sfp.eo70 === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Dewormed?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-deworm" value="Yes" ${chk(sfp.dewormed)} /> Yes</label>
                    <label><input type="radio" name="sfp-deworm" value="No" ${chk(sfp.dewormed === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Received Vitamin A?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-vita" value="Yes" ${chk(sfp.vitaminA)} /> Yes</label>
                    <label><input type="radio" name="sfp-vita" value="No" ${chk(sfp.vitaminA === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">4Ps / MCCT beneficiary?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-4ps" value="Yes" ${chk(sfp.fourPs)} /> Yes</label>
                    <label><input type="radio" name="sfp-4ps" value="No" ${chk(sfp.fourPs === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">4Ps / MCCT ID No.</label>
                  <input type="text" id="sfp-4ps-id" class="ecc-field-input" value="${this._esc(sfp.fourPsId)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Indigenous People?</label>
                  <div style="padding-top:0.35rem;">
                    <label style="margin-right:0.75rem;"><input type="radio" name="sfp-ip" value="Yes" ${chk(sfp.indigenous)} /> Yes</label>
                    <label><input type="radio" name="sfp-ip" value="No" ${chk(sfp.indigenous === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">IP affiliation</label>
                  <input type="text" id="sfp-ip-aff" class="ecc-field-input" value="${this._esc(sfp.indigenousAffiliation)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Parent PSN / PhilSys No.</label>
                  <input type="text" id="sfp-psn" class="ecc-field-input" value="${this._esc(sfp.parentPsn)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Parent income source</label>
                  <input type="text" id="sfp-income" class="ecc-field-input" value="${this._esc(sfp.incomeSource)}" placeholder="Employed / Self-employed / …" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry weighing date</label>
                  <input type="date" id="sfp-entry-date" class="ecc-field-input" value="${this._esc(sfp.entryWeighDate)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry height (cm)</label>
                  <input type="number" id="sfp-entry-h" class="ecc-field-input" step="0.1" value="${sfp.entryHeightCm != null ? sfp.entryHeightCm : (latest && latest.heightCm != null ? latest.heightCm : '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry weight (kg)</label>
                  <input type="number" id="sfp-entry-w" class="ecc-field-input" step="0.1" value="${sfp.entryWeightKg != null ? sfp.entryWeightKg : (latest && latest.weightKg != null ? latest.weightKg : '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 months — date</label>
                  <input type="date" id="sfp-6mo-date" class="ecc-field-input" value="${this._esc(sfp.after6moWeighDate)}" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 mo height (cm)</label>
                  <input type="number" id="sfp-6mo-h" class="ecc-field-input" step="0.1" value="${sfp.after6moHeightCm != null ? sfp.after6moHeightCm : ''}" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 mo weight (kg)</label>
                  <input type="number" id="sfp-6mo-w" class="ecc-field-input" step="0.1" value="${sfp.after6moWeightKg != null ? sfp.after6moWeightKg : ''}" />
                </div>
                <div>
                  <label class="ecc-field-label">Nutrition status (entry)</label>
                  <select id="sfp-nut-entry" class="ecc-field-input">
                    <option value="">—</option>
                    ${['Normal','Underweight','Severely Underweight','Overweight','Stunted','Severely Stunted','Wasted','Severely Wasted','Obese'].map(x =>
                      `<option value="${x}" ${sfp.nutritionEntry === x ? 'selected' : ''}>${x}</option>`
                    ).join('')}
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Nutrition status (after 6 mo)</label>
                  <select id="sfp-nut-6mo" class="ecc-field-input">
                    <option value="">—</option>
                    ${['Normal','Underweight','Severely Underweight','Overweight','Stunted','Severely Stunted','Wasted','Severely Wasted','Obese'].map(x =>
                      `<option value="${x}" ${sfp.nutritionAfter6mo === x ? 'selected' : ''}>${x}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <div style="margin-top:1rem;padding:0.75rem;background:#f5f9fc;border-radius:8px;">
                <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.9rem;">
                  <input type="checkbox" id="sfp-consent" style="margin-top:3px;" ${chk(sfp.consent)} />
                  <span>Parent/guardian agrees to SFP data processing (Consent &amp; Confidentiality clause — Data Privacy Act of 2012).</span>
                </label>
                <div class="profile-grid" style="margin-top:0.75rem;">
                  <div>
                    <label class="ecc-field-label">Consent signed by</label>
                    <input type="text" id="sfp-consent-name" class="ecc-field-input" value="${this._esc(sfp.consentName || child.parentName || '')}" />
                  </div>
                  <div>
                    <label class="ecc-field-label">Consent date</label>
                    <input type="date" id="sfp-consent-date" class="ecc-field-input" value="${this._esc(sfp.consentDate || today)}" />
                  </div>
                </div>
              </div>
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveSfpBeneficiary(${child.id})">
                💾 Save SFP beneficiary profile
              </button>
            </div>

            <div class="card" style="margin-bottom:0;">
              <h3 style="margin-top:0;">Measurement history</h3>
              <div class="eccd-table-wrap">
                <table class="eccd-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Height</th><th>Weight</th><th>BMI</th><th>Status</th><th>Nutrition</th><th>By</th>
                    </tr>
                  </thead>
                  <tbody>${histRows}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="TeacherHealth.closeProfile()">Close</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    if (latest && latest.status) {
      const sel = document.getElementById('h-status');
      if (sel) {
        const opt = Array.from(sel.options).find(o => o.value === latest.status);
        if (opt) sel.value = latest.status;
      }
    }
  },

  _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _recalcBmi() {
    const h = parseFloat((document.getElementById('h-height') || {}).value);
    const w = parseFloat((document.getElementById('h-weight') || {}).value);
    const bmi = HealthStore.computeBmi(h, w);
    const bmiEl = document.getElementById('h-bmi');
    const statusEl = document.getElementById('h-status');
    if (bmiEl) bmiEl.value = bmi != null ? bmi : '';
    if (statusEl && bmi != null) {
      const suggested = HealthStore.suggestStatus(bmi);
      if (suggested) statusEl.value = suggested;
    }
  },

  saveMeasurement(childId) {
    const child = SampleChildren.find(c => c.id === childId);
    if (!child) return;

    const heightCm = parseFloat((document.getElementById('h-height') || {}).value);
    const weightKg = parseFloat((document.getElementById('h-weight') || {}).value);
    if (isNaN(heightCm) && isNaN(weightKg)) {
      alert('Enter at least height or weight.');
      return;
    }

    const bmi = HealthStore.computeBmi(heightCm, weightKg);
    HealthStore.saveMeasurement({
      childId,
      childName: child.name,
      date: (document.getElementById('h-date') || {}).value,
      heightCm: isNaN(heightCm) ? null : heightCm,
      weightKg: isNaN(weightKg) ? null : weightKg,
      bmi,
      status: (document.getElementById('h-status') || {}).value || '',
      nutritionStatus: (document.getElementById('h-nutrition') || {}).value || '',
      feedingParticipating: !!(document.getElementById('h-feeding') || {}).checked,
      notes: (document.getElementById('h-notes') || {}).value || '',
      recordedBy: (document.getElementById('h-by') || {}).value || 'Teacher'
    });

    this.closeProfile();
    this._draw();
    this.openProfile(childId);
    this._toast('Measurement saved for ' + child.name);
  },

  saveProfile(childId) {
    HealthStore.saveProfile(childId, {
      allergies: (document.getElementById('h-allergies') || {}).value || '',
      medicalConditions: (document.getElementById('h-conditions') || {}).value || '',
      immunizations: (document.getElementById('h-immun') || {}).value || '',
      notes: (document.getElementById('h-mednotes') || {}).value || ''
    });
    this._toast('Medical profile saved');
  },

  _radio(name) {
    const el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  },

  saveSfpBeneficiary(childId) {
    if (typeof SfpStore === 'undefined') {
      alert('SFP store not loaded.');
      return;
    }
    const yes = (name) => this._radio(name) === 'Yes';
    const no = (name) => this._radio(name) === 'No';
    const flag = (name) => {
      const v = this._radio(name);
      if (v === 'Yes') return true;
      if (v === 'No') return false;
      return false;
    };
    const num = (id) => {
      const v = parseFloat((document.getElementById(id) || {}).value);
      return isNaN(v) ? null : v;
    };
    const enrolled = !!(document.getElementById('sfp-enrolled') || {}).checked;
    const result = SfpStore.saveBeneficiary(childId, {
      enrolledInSfp: enrolled,
      disability: flag('sfp-disability'),
      disabilitySpecify: (document.getElementById('sfp-disability-spec') || {}).value || '',
      soloParent: flag('sfp-solo'),
      eo70: flag('sfp-eo70'),
      dewormed: flag('sfp-deworm'),
      vitaminA: flag('sfp-vita'),
      fourPs: flag('sfp-4ps'),
      fourPsId: (document.getElementById('sfp-4ps-id') || {}).value || '',
      indigenous: flag('sfp-ip'),
      indigenousAffiliation: (document.getElementById('sfp-ip-aff') || {}).value || '',
      parentPsn: (document.getElementById('sfp-psn') || {}).value || '',
      incomeSource: (document.getElementById('sfp-income') || {}).value || '',
      entryWeighDate: (document.getElementById('sfp-entry-date') || {}).value || '',
      entryHeightCm: num('sfp-entry-h'),
      entryWeightKg: num('sfp-entry-w'),
      after6moWeighDate: (document.getElementById('sfp-6mo-date') || {}).value || '',
      after6moHeightCm: num('sfp-6mo-h'),
      after6moWeightKg: num('sfp-6mo-w'),
      nutritionEntry: (document.getElementById('sfp-nut-entry') || {}).value || '',
      nutritionAfter6mo: (document.getElementById('sfp-nut-6mo') || {}).value || '',
      consent: !!(document.getElementById('sfp-consent') || {}).checked,
      consentName: (document.getElementById('sfp-consent-name') || {}).value || '',
      consentDate: (document.getElementById('sfp-consent-date') || {}).value || ''
    });
    if (!result.ok) {
      alert(result.error || 'Could not save SFP profile.');
      return;
    }
    // Keep health measurement participation in sync when enrolled
    if (enrolled && typeof HealthStore !== 'undefined') {
      const latest = HealthStore.getLatest(childId);
      if (latest) {
        HealthStore.saveMeasurement({ ...latest, feedingParticipating: true });
      }
    }
    this._toast(enrolled ? 'SFP beneficiary profile saved' : 'SFP profile updated (not enrolled)');
    this.closeProfile();
    this._draw();
    this.openProfile(childId);
  },

  closeProfile() {
    const el = document.getElementById('health-profile-overlay');
    if (el) el.remove();
  },

  _toast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }
};
