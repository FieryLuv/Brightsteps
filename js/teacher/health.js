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

  render(container) {
    this._container = container;
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

    const sectionBtns = this.sections.map(s => {
      const active = s.key === this.selectedSection;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherHealth.selectSection('${s.key}')">${s.label} (${s.ages})</button>`;
    }).join('');

    const cards = children.map(c => this._childCard(c)).join('');

    this._container.innerHTML = `
      ${UI.pageHeader('❤️ Health Records', 'Height, weight, BMI, nutrition participation, and medical notes.')}

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
          <h3 style="margin-top:0;">🍎 Feeding program</h3>
          <p style="margin:0.35rem 0;"><strong>${stats.feeding}</strong> / ${stats.withRecord || stats.total} marked as participating (latest record)</p>
          <p class="text-muted" style="margin:0;font-size:0.85rem;">Update participation when recording height/weight.</p>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Children — ${this.sections.find(s => s.key === this.selectedSection).label}</h3>
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
    return `
      <div class="card child-card" style="margin-bottom:0;">
        <div class="flex justify-between items-center" style="margin-bottom:0.35rem;">
          <strong>${c.name}</strong>
          <span style="font-size:0.85rem;color:var(--muted);">${c.ageLabel}</span>
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
