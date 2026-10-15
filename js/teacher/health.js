/**
 * Teacher Health Records
 * Section list → child health cards → profile modal (measurements + medical notes)
 */

const TeacherHealth = {
  selectedSection: 'all',
  pendingChildId: null,
  pendingOpenProfile: false,

  sections: [
    { key: 'explorers', label: 'Little Explorers', ages: '0–3 yrs' },
    { key: 'stars', label: 'Little Stars', ages: '3–4 yrs' },
    { key: 'sunshine', label: 'Sunshine Group', ages: '4–5 yrs' }
  ],

  /** From Children: land on this child's class and open health profile */
  openForChild(childId, opts) {
    opts = opts || {};
    this.pendingChildId = childId;
    this.pendingOpenProfile = opts.openProfile !== false;
    if (this._container) {
      this._applyPendingChild();
      this._draw();
    }
  },

  _applyPendingChild() {
    if (this.pendingChildId == null) return;
    const id = this.pendingChildId;
    const openProfile = this.pendingOpenProfile;
    this.pendingChildId = null;
    this.pendingOpenProfile = false;

    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    const child = (typeof SampleChildren !== 'undefined')
      ? SampleChildren.find(c => String(c.id) === String(id))
      : null;
    if (!child) return;
    if (child.sectionKey) this.selectedSection = child.sectionKey;
    if (openProfile) {
      setTimeout(() => this.openProfile(child.id), 120);
    }
  },

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
    if (typeof SfpStore !== 'undefined') {
      SfpStore.ensureSeed();
      if (SfpStore.hydrateBeneficiaries) SfpStore.hydrateBeneficiaries().catch(function () {});
    }
    this._applyPendingChild();
    const finish = function () { TeacherHealth._draw(); };
    const load = async function () {
      if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
        await ChildrenRemote.ensureLoaded();
      } else if (typeof ChildRegistry !== 'undefined') {
        ChildRegistry.ensureMerged();
      }
      if (typeof HealthStore !== 'undefined' && HealthStore.hydrateForChild) {
        const kids = (typeof SampleChildren !== 'undefined') ? SampleChildren : [];
        for (let i = 0; i < kids.length; i++) {
          try { await HealthStore.hydrateForChild(kids[i].id); } catch (e) { /* ignore */ }
        }
      }
    };
    load().then(finish).catch(finish);
  },

  _childrenInSection() {
    let list = (typeof ChildRegistry !== 'undefined' && ChildRegistry.activeList)
      ? ChildRegistry.activeList()
      : (typeof SampleChildren !== 'undefined' ? SampleChildren.filter(c => c.archived !== true) : []);
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (q) {
      list = list.filter(c => {
        const blob = [c.name, c.childCode, c.parentName, c.section, c.ageLabel]
          .filter(Boolean).join(' ').toLowerCase();
        return blob.includes(q);
      });
      return list; // search across classes
    }
    if (this.selectedSection && this.selectedSection !== 'all') {
      list = list.filter(c => c.sectionKey === this.selectedSection);
    }
    return list;
  },

  _draw() {
    const children = this._childrenInSection();
    const allIds = children.map(c => c.id);
    const stats = typeof HealthStore !== 'undefined'
      ? HealthStore.summaryStats(allIds)
      : { withRecord: 0, normal: 0, under: 0, over: 0, feeding: 0, total: children.length };

    const sectionList = this._sectionList();
    const q = (this.searchQuery || '').trim();
    const sectionOpts =
      '<option value="all"' + (this.selectedSection === 'all' ? ' selected' : '') + '>All classes</option>' +
      sectionList.map(s => {
        const active = s.key === this.selectedSection;
        return '<option value="' + s.key + '"' + (active ? ' selected' : '') + '>' +
          s.label + (s.ages ? ' (' + s.ages + ')' : '') + '</option>';
      }).join('');

    const cards = children.map(c => this._childCard(c)).join('');
    const sectionLabel = this.selectedSection === 'all'
      ? 'All classes'
      : ((sectionList.find(s => s.key === this.selectedSection) || {}).label || this.selectedSection);

    this._container.innerHTML = `
      ${UI.pageHeader('❤️ Health Records', 'Height, weight, BMI, SFP beneficiary profile, and medical notes.')}

      <div class="card filter-bar-card">
        <div class="filter-bar">
          <div class="filter-bar-search">
            <label class="ecc-field-label" for="health-search">Search</label>
            <input type="search" id="health-search" class="ecc-field-input"
              placeholder="Name, Child ID, or parent"
              value="${String(this.searchQuery || '').replace(/"/g, '&quot;')}"
              oninput="TeacherHealth.onSearch(this.value)" />
          </div>
          <div class="filter-bar-class">
            <label class="ecc-field-label" for="health-section">Class / section</label>
            <select id="health-section" class="ecc-field-input"
              onchange="TeacherHealth.selectSection(this.value)">${sectionOpts}</select>
          </div>
          ${q ? `<button type="button" class="btn filter-bar-clear" style="background:#e8e8e8;" onclick="TeacherHealth.onSearch('')">Clear</button>` : ''}
        </div>
        ${q ? `<p class="text-muted" style="margin:0.65rem 0 0;font-size:0.85rem;">Search is across all classes · ${children.length} match(es)</p>` : ''}
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
          <p class="text-muted" style="margin:0;font-size:0.85rem;">Open a child → SFP Beneficiary Profile for full form.</p>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">${q ? 'Search results' : 'Children — ' + sectionLabel} (${children.length})</h3>
        ${children.length
          ? `<div class="dashboard-grid">${cards}</div>`
          : `<p class="text-muted">${q ? 'No children match that search.' : 'No children in this section.'}</p>`}
      </div>
    `;
  },

  onSearch(q) {
    this.searchQuery = q || '';
    this._draw();
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
        <button class="btn btn-blue" style="width:100%;" onclick="TeacherHealth.openProfile('${c.id}')">
          Open health record
        </button>
      </div>`;
  },

  openProfile(childId) {
    const child = SampleChildren.find(c => String(c.id) === String(childId));
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
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveMeasurement('${child.id}')">
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
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveProfile('${child.id}')">
                💾 Save medical profile
              </button>
            </div>

            <div class="card" style="margin-bottom:1rem;border-left:4px solid #2e7d32;">
              <h3 style="margin-top:0;">🥗 SFP Beneficiary Profile <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(Supplementary Feeding Program)</span></h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">
                Official Beneficiary Profile intake (Parts I–III). Identity is prefilled from enrollment and stays editable for this form / printout.
              </p>
              <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-weight:600;">
                <input type="checkbox" id="sfp-enrolled" ${sfp.enrolledInSfp !== false && (sfp.childId || sfp.consent || sfp.fourPs != null) ? 'checked' : (sfp.enrolledInSfp === false ? '' : '')} />
                Enrolled in Supplementary Feeding Program (SFP)
              </label>

              ${(() => {
                const a = child.address || {};
                const addrDefault = [a.purok, a.barangay, a.municipality || 'Medina', a.province || 'Misamis Oriental'].filter(Boolean).join(', ');
                const nameVal = sfp.beneficiaryName || child.name || '';
                const sexVal = sfp.beneficiarySex || child.sex || '';
                const birthVal = sfp.beneficiaryBirthDate || child.birthDate || '';
                const ageVal = sfp.beneficiaryAgeLabel || child.ageLabel || '';
                const addrVal = sfp.beneficiaryAddress || addrDefault;
                const officialParent = (() => {
                  const fromProfile = (prof) => {
                    if (!prof) return '';
                    const mid = (prof.middleInitial || '').trim();
                    const parts = [
                      (prof.firstName || '').trim(),
                      mid ? (mid.length === 1 ? mid + '.' : mid) : '',
                      (prof.lastName || '').trim()
                    ].filter(Boolean);
                    return parts.join(' ').replace(/\s+/g, ' ').trim();
                  };
                  return fromProfile(child.motherProfile) || String(child.motherName || '').trim()
                    || fromProfile(child.fatherProfile) || String(child.fatherName || '').trim()
                    || '';
                })();
                // Never auto-fill from guardian / parentName
                const parentVal = sfp.parentGuardianName || officialParent || '';
                const incomePrefill = (() => {
                  if (sfp.incomeSource) return sfp.incomeSource;
                  const m = child.motherProfile || {};
                  const f = child.fatherProfile || {};
                  return m.occupationOther || m.occupation || f.occupationOther || f.occupation || '';
                })();
                return `
              <div style="background:#f8faf8;border:1px solid #e0e8e0;border-radius:10px;padding:0.85rem 1rem;margin-bottom:1rem;">
                <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.35rem;">Child &amp; parent identity</div>
                <p class="text-muted" style="font-size:0.8rem;margin:0 0 0.75rem;">
                  Prefilled from enrollment. Parent line uses <strong>mother / father</strong> only (not guardian).
                  Class: <strong>${this._esc(child.section || child.sectionKey || '—')}</strong>
                </p>
                <div class="profile-grid">
                  <div>
                    <label class="ecc-field-label">Complete name of beneficiary</label>
                    <input type="text" id="sfp-ben-name" class="ecc-field-input" value="${this._esc(nameVal)}" />
                  </div>
                  <div>
                    <label class="ecc-field-label">Sex (M/F)</label>
                    <select id="sfp-ben-sex" class="ecc-field-input">
                      <option value="">—</option>
                      <option value="Male" ${sexVal === 'Male' || sexVal === 'M' ? 'selected' : ''}>Male</option>
                      <option value="Female" ${sexVal === 'Female' || sexVal === 'F' ? 'selected' : ''}>Female</option>
                    </select>
                  </div>
                  <div>
                    <label class="ecc-field-label">Date of birth</label>
                    <input type="date" id="sfp-ben-birth" class="ecc-field-input" value="${this._esc(birthVal)}"
                      onchange="TeacherHealth._recalcSfpAge()" />
                  </div>
                  <div>
                    <label class="ecc-field-label">Age of child (auto)</label>
                    <input type="text" id="sfp-ben-age" class="ecc-field-input" value="${this._esc(ageVal)}"
                      placeholder="From date of birth" />
                  </div>
                  <div style="grid-column:1 / -1;">
                    <label class="ecc-field-label">Address</label>
                    <input type="text" id="sfp-ben-address" class="ecc-field-input" value="${this._esc(addrVal)}" />
                  </div>
                  <div style="grid-column:1 / -1;">
                    <label class="ecc-field-label">Complete name of parent (mother / father)</label>
                    <input type="text" id="sfp-parent-name" class="ecc-field-input" value="${this._esc(parentVal)}"
                      placeholder="Official parent full name — not guardian alias" />
                  </div>
                </div>
              </div>`;
              })()}

              <h4 style="margin:0.5rem 0 0.75rem;font-size:0.95rem;">I. Child information (SFP flags)</h4>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Diagnosed disability?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-disability" value="Yes" ${chk(sfp.disability)} /> Yes</label>
                    <label><input type="radio" name="sfp-disability" value="No" ${chk(sfp.disability === false || (sfp.childId && !sfp.disability))} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">If yes, specify</label>
                  <input type="text" id="sfp-disability-spec" class="ecc-field-input" value="${this._esc(sfp.disabilitySpecify)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Child of solo parent?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-solo" value="Yes" ${chk(sfp.soloParent)} /> Yes</label>
                    <label><input type="radio" name="sfp-solo" value="No" ${chk(sfp.soloParent === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Monitored under EO 70?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-eo70" value="Yes" ${chk(sfp.eo70)} /> Yes</label>
                    <label><input type="radio" name="sfp-eo70" value="No" ${chk(sfp.eo70 === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Dewormed?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-deworm" value="Yes" ${chk(sfp.dewormed)} /> Yes</label>
                    <label><input type="radio" name="sfp-deworm" value="No" ${chk(sfp.dewormed === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Received Vitamin A?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-vita" value="Yes" ${chk(sfp.vitaminA)} /> Yes</label>
                    <label><input type="radio" name="sfp-vita" value="No" ${chk(sfp.vitaminA === false)} /> No</label>
                  </div>
                </div>
              </div>

              <h4 style="margin:1.25rem 0 0.75rem;font-size:0.95rem;">II. Parent / guardian information</h4>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Parent / guardian sex</label>
                  <select id="sfp-parent-sex" class="ecc-field-input">
                    <option value="">—</option>
                    <option value="Male" ${sfp.parentSex === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${sfp.parentSex === 'Female' ? 'selected' : ''}>Female</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Parent PSN / PhilSys No.</label>
                  <input type="text" id="sfp-psn" class="ecc-field-input" value="${this._esc(sfp.parentPsn)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Source of income</label>
                  <input type="text" id="sfp-income" class="ecc-field-input" value="${this._esc((() => {
                    if (sfp.incomeSource) return sfp.incomeSource;
                    const m = child.motherProfile || {};
                    const f = child.fatherProfile || {};
                    return m.occupationOther || m.occupation || f.occupationOther || f.occupation || '';
                  })())}" placeholder="Employed / Self-employed / occupation from parent profile" />
                </div>
                <div>
                  <label class="ecc-field-label">Indigenous People affiliation</label>
                  <input type="text" id="sfp-ip-aff" class="ecc-field-input" value="${this._esc(sfp.indigenousAffiliation)}" placeholder="If applicable" />
                </div>
                <div>
                  <label class="ecc-field-label">Indigenous People?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-ip" value="Yes" ${chk(sfp.indigenous)} /> Yes</label>
                    <label><input type="radio" name="sfp-ip" value="No" ${chk(sfp.indigenous === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">4Ps / MCCT beneficiary?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-4ps" value="Yes" ${chk(sfp.fourPs)} /> Yes</label>
                    <label><input type="radio" name="sfp-4ps" value="No" ${chk(sfp.fourPs === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">4Ps / MCCT ID No.</label>
                  <input type="text" id="sfp-4ps-id" class="ecc-field-input" value="${this._esc(sfp.fourPsId)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Parent person with disability?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-parent-pwd" value="Yes" ${chk(sfp.parentPwd)} /> Yes</label>
                    <label><input type="radio" name="sfp-parent-pwd" value="No" ${chk(sfp.parentPwd === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Previously attended FDS?</label>
                  <div class="yn-group">
                    <label><input type="radio" name="sfp-fds" value="Yes" ${chk(sfp.fdsAttended)} /> Yes</label>
                    <label><input type="radio" name="sfp-fds" value="No" ${chk(sfp.fdsAttended === false)} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">PES modules completed (if any)</label>
                  <input type="text" id="sfp-pes" class="ecc-field-input" value="${this._esc(sfp.pesModules)}" placeholder="e.g. 1, 2, 3" />
                </div>
              </div>

              <h4 style="margin:1.25rem 0 0.75rem;font-size:0.95rem;">Weighing / nutrition (entry &amp; after 6 months)</h4>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Entry weighing date</label>
                  <input type="date" id="sfp-entry-date" class="ecc-field-input" value="${this._esc(sfp.entryWeighDate)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry height (cm)</label>
                  <input type="number" id="sfp-entry-h" class="ecc-field-input" step="0.1"
                    value="${sfp.entryHeightCm != null ? sfp.entryHeightCm : (latest && latest.heightCm != null ? latest.heightCm : '')}"
                    oninput="TeacherHealth._recalcSfpNutrition('entry')" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry weight (kg)</label>
                  <input type="number" id="sfp-entry-w" class="ecc-field-input" step="0.1"
                    value="${sfp.entryWeightKg != null ? sfp.entryWeightKg : (latest && latest.weightKg != null ? latest.weightKg : '')}"
                    oninput="TeacherHealth._recalcSfpNutrition('entry')" />
                </div>
                <div>
                  <label class="ecc-field-label">Entry BMI (auto)</label>
                  <input type="text" id="sfp-entry-bmi" class="ecc-field-input" readonly placeholder="—" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 months — date</label>
                  <input type="date" id="sfp-6mo-date" class="ecc-field-input" value="${this._esc(sfp.after6moWeighDate)}" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 mo height (cm)</label>
                  <input type="number" id="sfp-6mo-h" class="ecc-field-input" step="0.1"
                    value="${sfp.after6moHeightCm != null ? sfp.after6moHeightCm : ''}"
                    oninput="TeacherHealth._recalcSfpNutrition('6mo')" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 mo weight (kg)</label>
                  <input type="number" id="sfp-6mo-w" class="ecc-field-input" step="0.1"
                    value="${sfp.after6moWeightKg != null ? sfp.after6moWeightKg : ''}"
                    oninput="TeacherHealth._recalcSfpNutrition('6mo')" />
                </div>
                <div>
                  <label class="ecc-field-label">After 6 mo BMI (auto)</label>
                  <input type="text" id="sfp-6mo-bmi" class="ecc-field-input" readonly placeholder="—" />
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
              <p class="text-muted" style="font-size:0.8rem;margin:0.35rem 0 0;">
                BMI and nutrition status update automatically from height × weight (classroom estimate — teacher can still change the status).
              </p>
              <div style="margin-top:1rem;padding:0.85rem 1rem;background:#f5f9fc;border-radius:8px;border:1px solid #d6e4f0;">
                <h4 style="margin:0 0 0.5rem;font-size:0.95rem;">III. Consent &amp; confidentiality</h4>
                <p class="text-muted" style="font-size:0.82rem;margin:0 0 0.75rem;line-height:1.45;">
                  Information on this intake may be processed for implementing, monitoring, and evaluating the
                  Supplementary Feeding Program (SFP), including nutritional status, parent/guardian information,
                  and coordination with partner agencies and LGUs, in accordance with the Data Privacy Act of 2012.
                  The parent/guardian has the right to be informed, to access, and to have personal data corrected.
                </p>
                <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.9rem;">
                  <input type="checkbox" id="sfp-consent" style="margin-top:3px;" ${chk(sfp.consent)} />
                  <span>I agree to participate in this assessment and allow my answers to be used as indicated above.</span>
                </label>
                <div class="profile-grid" style="margin-top:0.75rem;">
                  <div>
                    <label class="ecc-field-label">Signature over printed name</label>
                    <input type="text" id="sfp-consent-name" class="ecc-field-input" value="${this._esc(sfp.consentName || (() => {
                      const fromProfile = (prof) => {
                        if (!prof) return '';
                        const mid = (prof.middleInitial || '').trim();
                        const parts = [(prof.firstName || '').trim(), mid ? (mid.length === 1 ? mid + '.' : mid) : '', (prof.lastName || '').trim()].filter(Boolean);
                        return parts.join(' ').replace(/\s+/g, ' ').trim();
                      };
                      return fromProfile(child.motherProfile) || child.motherName || fromProfile(child.fatherProfile) || child.fatherName || '';
                    })())}" />
                  </div>
                  <div>
                    <label class="ecc-field-label">Consent date</label>
                    <input type="date" id="sfp-consent-date" class="ecc-field-input" value="${this._esc(sfp.consentDate || today)}" />
                  </div>
                </div>
              </div>
              <button class="btn btn-blue" style="margin-top:1rem;" onclick="TeacherHealth.saveSfpBeneficiary('${child.id}')">
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
    // Initial autofill for age / BMI / nutrition when values are present
    this._recalcSfpAge();
    this._recalcSfpNutrition('entry');
    this._recalcSfpNutrition('6mo');
    this._recalcBmi();
  },

  _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _recalcBmi() {
    if (typeof HealthStore === 'undefined') return;
    const h = parseFloat((document.getElementById('h-height') || {}).value);
    const w = parseFloat((document.getElementById('h-weight') || {}).value);
    const bmi = HealthStore.computeBmi(h, w);
    const bmiEl = document.getElementById('h-bmi');
    const statusEl = document.getElementById('h-status');
    const nutEl = document.getElementById('h-nutrition');
    if (bmiEl) bmiEl.value = bmi != null ? bmi : '';
    if (statusEl && bmi != null) {
      const suggested = HealthStore.suggestStatus(bmi);
      if (suggested) statusEl.value = suggested;
    }
    if (nutEl && bmi != null) {
      const nut = HealthStore.suggestNutrition(bmi);
      // Only auto-set if option exists on the select
      if (nut && Array.from(nutEl.options).some(o => o.value === nut)) {
        nutEl.value = nut;
      } else if (nut === 'Severely Underweight' || nut === 'Underweight') {
        nutEl.value = 'Underweight';
      } else if (nut === 'Obese' || nut === 'Overweight') {
        nutEl.value = 'Overweight';
      } else if (nut === 'Normal') {
        nutEl.value = 'Normal';
      }
    }
  },

  _recalcSfpAge() {
    const birth = (document.getElementById('sfp-ben-birth') || {}).value || '';
    const ageEl = document.getElementById('sfp-ben-age');
    if (!ageEl) return;
    if (typeof HealthStore !== 'undefined' && HealthStore.ageLabelFromBirthDate) {
      ageEl.value = HealthStore.ageLabelFromBirthDate(birth);
    } else if (typeof ChildRegistry !== 'undefined' && ChildRegistry.ageFromBirthDate) {
      const a = ChildRegistry.ageFromBirthDate(birth);
      ageEl.value = (a && a.ageLabel) || '';
    }
  },

  /** which: 'entry' | '6mo' */
  _recalcSfpNutrition(which) {
    if (typeof HealthStore === 'undefined') return;
    const isEntry = which !== '6mo';
    const h = parseFloat((document.getElementById(isEntry ? 'sfp-entry-h' : 'sfp-6mo-h') || {}).value);
    const w = parseFloat((document.getElementById(isEntry ? 'sfp-entry-w' : 'sfp-6mo-w') || {}).value);
    const bmi = HealthStore.computeBmi(h, w);
    const bmiEl = document.getElementById(isEntry ? 'sfp-entry-bmi' : 'sfp-6mo-bmi');
    const nutEl = document.getElementById(isEntry ? 'sfp-nut-entry' : 'sfp-nut-6mo');
    if (bmiEl) bmiEl.value = bmi != null ? bmi : '';
    if (nutEl && bmi != null) {
      const suggested = HealthStore.suggestNutrition(bmi);
      if (suggested && Array.from(nutEl.options).some(o => o.value === suggested)) {
        nutEl.value = suggested;
      }
    }
  },

  saveMeasurement(childId) {
    const child = SampleChildren.find(c => String(c.id) === String(childId));
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
      beneficiaryName: (document.getElementById('sfp-ben-name') || {}).value || '',
      beneficiarySex: (document.getElementById('sfp-ben-sex') || {}).value || '',
      beneficiaryBirthDate: (document.getElementById('sfp-ben-birth') || {}).value || '',
      beneficiaryAgeLabel: (document.getElementById('sfp-ben-age') || {}).value || '',
      beneficiaryAddress: (document.getElementById('sfp-ben-address') || {}).value || '',
      parentGuardianName: (document.getElementById('sfp-parent-name') || {}).value || '',
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
      parentSex: (document.getElementById('sfp-parent-sex') || {}).value || '',
      incomeSource: (document.getElementById('sfp-income') || {}).value || '',
      parentPwd: flag('sfp-parent-pwd'),
      fdsAttended: flag('sfp-fds'),
      pesModules: (document.getElementById('sfp-pes') || {}).value || '',
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
    // Sync H/W into health history:
    // - entry fields → update latest (or create first) record
    // - after 6 months (date + H or W) → append a NEW milestone record only
    if (typeof HealthStore !== 'undefined') {
      const child = SampleChildren.find(c => String(c.id) === String(childId));
      const entryH = num('sfp-entry-h');
      const entryW = num('sfp-entry-w');
      const entryDate = (document.getElementById('sfp-entry-date') || {}).value || '';
      if (entryH != null || entryW != null) {
        const bmi = HealthStore.computeBmi(entryH, entryW);
        HealthStore.saveMeasurement({
          childId,
          childName: child ? child.name : '',
          date: entryDate || undefined,
          heightCm: entryH,
          weightKg: entryW,
          bmi,
          nutritionStatus: (document.getElementById('sfp-nut-entry') || {}).value || '',
          feedingParticipating: enrolled,
          kind: 'sfp_entry',
          forceNew: false
        });
      }
      const m6H = num('sfp-6mo-h');
      const m6W = num('sfp-6mo-w');
      const m6Date = (document.getElementById('sfp-6mo-date') || {}).value || '';
      const m6Nut = (document.getElementById('sfp-nut-6mo') || {}).value || '';
      const hadComplete6mo = !!(m6Date && (m6H != null || m6W != null));
      if (hadComplete6mo) {
        const hist = HealthStore.listForChild(childId) || [];
        const already = hist.find(function (m) {
          return m.kind === 'sfp_6mo' && String(m.date || '') === String(m6Date);
        });
        const bmi6 = HealthStore.computeBmi(m6H, m6W);
        HealthStore.saveMeasurement({
          childId,
          childName: child ? child.name : '',
          date: m6Date,
          heightCm: m6H,
          weightKg: m6W,
          bmi: bmi6,
          nutritionStatus: m6Nut,
          feedingParticipating: enrolled,
          kind: 'sfp_6mo',
          forceNew: !already
        });
        // Clear after-6-months fields so a later accidental save does not stack rows.
        // Entry (before) fields stay; 6-mo point remains in health history.
        // Explicit clear (store no longer restores prev when these keys are present)
        SfpStore.saveBeneficiary(childId, Object.assign({}, result.beneficiary || {}, {
          after6moWeighDate: '',
          after6moHeightCm: null,
          after6moWeightKg: null,
          nutritionAfter6mo: ''
        }));
        // Clear form inputs immediately so reopen does not flash old values
        ['sfp-6mo-date','sfp-6mo-h','sfp-6mo-w','sfp-6mo-bmi','sfp-nut-6mo'].forEach(function (id) {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      } else if (enrolled) {
        const latest = HealthStore.getLatest(childId);
        if (latest) {
          HealthStore.saveMeasurement({
            childId,
            feedingParticipating: true,
            forceNew: false
          });
        }
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
