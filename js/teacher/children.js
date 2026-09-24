/**
 * Children module — list, search, filter, and full child profile modal.
 * Visual language matched to the original mockup + established design system.
 */

const TeacherChildren = {
  filterText: '',
  filterSection: 'all',

  render(container) {
    this.container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    this._draw();
  },

  _draw() {
    const children = this._filtered();
    const sections = [
      { key: 'all', label: 'All' },
      { key: 'explorers', label: 'Little Explorers (0–3)' },
      { key: 'stars', label: 'Little Stars (3–4)' },
      { key: 'sunshine', label: 'Sunshine Group (4–5)' }
    ];

    const pending = (typeof ApplicationStore !== 'undefined')
      ? ApplicationStore.listByStatus('pending')
      : [];
    const approvedWait = (typeof ApplicationStore !== 'undefined')
      ? ApplicationStore.listByStatus('approved')
      : [];

    const pendingBlock = this._pendingApplicationsHtml(pending, approvedWait);

    const listHtml = children.length
      ? `<div class="children-grid">${children.map(c => this._card(c)).join('')}</div>`
      : `<div class="card children-empty">
           <div style="font-size:2rem; margin-bottom:0.5rem;">🔍</div>
           <p style="margin:0 0 0.35rem; font-weight:600; color:var(--text);">No children found</p>
           <p class="text-muted" style="margin:0 0 1rem; font-size:0.9rem;">
             Try a different name, age, or section filter.
           </p>
           <button class="btn" onclick="TeacherChildren.clearFilters()">Clear filters</button>
         </div>`;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3" style="flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>👦 Children</h1>
          <p class="text-muted">Enroll children, review online applications, and open profiles.</p>
        </div>
        <button class="btn btn-blue" onclick="TeacherChildren.openAddChild()">+ Add Child</button>
      </div>

      ${pendingBlock}

      <div class="card" style="margin-bottom:1.25rem;">
        <div class="flex flex-wrap gap-1 items-center" style="justify-content:space-between;">
          <input
            id="child-search"
            type="text"
            placeholder="Search by name, age, or section..."
            value="${this.filterText}"
            style="flex:1; min-width:220px; max-width:420px; padding:12px 18px; border-radius:30px; border:1px solid var(--border); font-size:0.95rem;"
          />
          <div class="flex flex-wrap gap-1">
            ${sections.map(s => `
              <button
                class="btn ${this.filterSection === s.key ? 'btn-blue' : ''}"
                style="${this.filterSection !== s.key ? 'background:#e8e8e8;color:var(--text);' : ''}"
                onclick="TeacherChildren.setSection('${s.key}')"
              >${s.label}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <p class="text-muted mb-2" style="font-size:0.9rem;">
        Showing <strong>${children.length}</strong> of ${SampleChildren.length} enrolled children
      </p>

      ${listHtml}
    `;

    const search = document.getElementById('child-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.filterText = e.target.value;
        this._draw();
        const again = document.getElementById('child-search');
        if (again) {
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }
      });
    }
  },

  _filtered() {
    const q = this.filterText.trim().toLowerCase();
    return SampleChildren.filter(c => {
      const matchSection = this.filterSection === 'all' || c.sectionKey === this.filterSection;
      const matchText = !q ||
        c.name.toLowerCase().includes(q) ||
        c.ageLabel.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        (c.focusArea && c.focusArea.toLowerCase().includes(q));
      return matchSection && matchText;
    });
  },

  setSection(key) {
    this.filterSection = key;
    this._draw();
  },

  clearFilters() {
    this.filterText = '';
    this.filterSection = 'all';
    this._draw();
  },


  _pendingApplicationsHtml(pending, approvedWait) {
    const hasPending = pending && pending.length;
    const hasApproved = approvedWait && approvedWait.length;
    if (!hasPending && !hasApproved) {
      return `
        <div class="card" style="margin-bottom:1.25rem;border-left:4px solid var(--border);">
          <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:0.5rem;">
            <div>
              <h3 style="margin:0;">📝 Online applications</h3>
              <p class="text-muted" style="margin:0.35rem 0 0;font-size:0.9rem;">
                No pending visitor applications. Use <strong>+ Add Child</strong> for walk-in enrollment.
              </p>
            </div>
          </div>
        </div>`;
    }

    const row = (a, isApproved) => `
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--border);">
        <div>
          <strong>${a.childName}</strong>
          <span class="text-muted" style="font-size:0.85rem;margin-left:0.35rem;">${a.id}</span>
          <div class="text-muted" style="font-size:0.85rem;margin-top:0.2rem;">
            Guardian: ${a.guardianName || '—'} · ${a.contactPhone || 'no phone'}
            · DOB ${a.birthDate || '—'}
            ${isApproved ? ' · <span style="color:var(--primary);font-weight:600;">Approved — finish enrollment</span>' : ''}
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${isApproved
            ? `<button class="btn btn-blue" onclick="TeacherApplications.continueEnroll('${a.id}')">Complete enrollment</button>`
            : `<button class="btn btn-blue" onclick="TeacherApplications.approve('${a.id}')">Approve & enroll</button>
               <button class="btn" style="background:#ffebee;color:#c62828;" onclick="TeacherApplications.reject('${a.id}')">Reject</button>`}
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherApplications.openReview('${a.id}')">View</button>
        </div>
      </div>`;

    const pendingRows = (pending || []).map(a => row(a, false)).join('');
    const approvedRows = (approvedWait || []).map(a => row(a, true)).join('');

    return `
      <div class="card" style="margin-bottom:1.25rem;border-left:4px solid var(--orange);">
        <h3 style="margin:0 0 0.35rem;">📝 Online applications
          ${hasPending ? `<span style="font-size:0.85rem;font-weight:600;color:var(--orange);"> · ${pending.length} pending</span>` : ''}
        </h3>
        <p class="text-muted" style="margin:0 0 0.75rem;font-size:0.9rem;">
          Visitor requests stay on hold until you approve. Approval opens <strong>Add Child</strong> with fields auto-filled.
          Walk-in families use <strong>+ Add Child</strong> only.
        </p>
        ${pendingRows}
        ${approvedRows}
      </div>`;
  },

  /* ---------- Add / Enroll Child ---------- */

  /**
   * @param {object} [prefill] — optional mapped application fields for autofill
   *   (from online enrollment approval via ChildRegistry.mapApplicationToForm)
   */
  openAddChild(prefill) {
    this.closeModal();
    const p = prefill || {};
    const codePreview = typeof ChildRegistry !== 'undefined'
      ? ChildRegistry.nextChildCode()
      : 'NCDC-—';
    const today = new Date().toISOString().slice(0, 10);
    const source = p.applicationId ? 'online_application' : 'walk_in';

    const html = `
      <div id="bs-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">+ Enroll Child</h2>
            <button class="bs-modal-close" onclick="TeacherChildren.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted" style="margin-top:0;">
              Walk-in: encode from the hard-copy form.
              Online application (future): fields can be auto-filled after approval, then the teacher reviews and saves.
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;align-items:center;">
              <span style="font-size:0.85rem;background:#e3f2fd;color:var(--primary-dark);padding:4px 10px;border-radius:20px;">
                Child ID (auto): <strong id="enroll-code-preview">${codePreview}</strong>
              </span>
              <span style="font-size:0.85rem;background:#f5f5f5;padding:4px 10px;border-radius:20px;">
                Source: <strong id="enroll-source-label">${source === 'online_application' ? 'Online application' : 'Walk-in'}</strong>
              </span>
              ${p.applicationId ? `<span class="text-muted" style="font-size:0.85rem;">Application: ${p.applicationId}</span>` : ''}
            </div>
            <input type="hidden" id="enroll-source" value="${source}" />
            <input type="hidden" id="enroll-application-id" value="${p.applicationId || ''}" />

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">1. Child identity</h3>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Child’s full name *</label>
                  <input type="text" id="enroll-name" class="ecc-field-input" value="${this._escAttr(p.name)}" placeholder="Given name + family name" />
                </div>
                <div>
                  <label class="ecc-field-label">Sex *</label>
                  <select id="enroll-sex" class="ecc-field-input">
                    <option value="Female" ${p.sex === 'Male' ? '' : 'selected'}>Female</option>
                    <option value="Male" ${p.sex === 'Male' ? 'selected' : ''}>Male</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Date of birth *</label>
                  <input type="date" id="enroll-birth" class="ecc-field-input" value="${this._escAttr(p.birthDate)}"
                    onchange="TeacherChildren._onBirthChange()" />
                </div>
                <div>
                  <label class="ecc-field-label">Age (auto)</label>
                  <input type="text" id="enroll-age-label" class="ecc-field-input" readonly style="background:#f5f5f5;" placeholder="—" />
                </div>
                <div>
                  <label class="ecc-field-label">Class / Section *</label>
                  <select id="enroll-section" class="ecc-field-input">
                    <option value="explorers" ${(p.sectionKey || 'explorers') === 'explorers' ? 'selected' : ''}>Little Explorers (0–3 yrs)</option>
                    <option value="stars" ${p.sectionKey === 'stars' ? 'selected' : ''}>Little Stars (3–4 yrs)</option>
                    <option value="sunshine" ${p.sectionKey === 'sunshine' ? 'selected' : ''}>Sunshine Group (4–5 yrs)</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">ECCD Record (auto from age)</label>
                  <input type="text" id="enroll-record" class="ecc-field-input" readonly style="background:#f5f5f5;" value="Record 1 (0–36 mo)" />
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">2. Family &amp; address</h3>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Primary parent / guardian *</label>
                  <input type="text" id="enroll-parent" class="ecc-field-input" value="${this._escAttr(p.parentName)}" placeholder="e.g. Mr. Khalid" />
                </div>
                <div>
                  <label class="ecc-field-label">Mother’s name</label>
                  <input type="text" id="enroll-mother" class="ecc-field-input" value="${this._escAttr(p.motherName)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Father’s name</label>
                  <input type="text" id="enroll-father" class="ecc-field-input" value="${this._escAttr(p.fatherName)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Number of siblings</label>
                  <input type="number" id="enroll-siblings" class="ecc-field-input" min="0" value="${p.siblings != null && p.siblings !== '' ? p.siblings : ''}" />
                </div>
                <div>
                  <label class="ecc-field-label">Birth order</label>
                  <input type="text" id="enroll-birth-order" class="ecc-field-input" value="${this._escAttr(p.birthOrder)}" placeholder="e.g. 1st, 2nd" />
                </div>
                <div>
                  <label class="ecc-field-label">Barangay</label>
                  <input type="text" id="enroll-barangay" class="ecc-field-input" value="${this._escAttr(p.barangay)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Municipality / City</label>
                  <input type="text" id="enroll-municipality" class="ecc-field-input" value="${this._escAttr(p.municipality || 'Medina')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Province</label>
                  <input type="text" id="enroll-province" class="ecc-field-input" value="${this._escAttr(p.province || 'Misamis Oriental')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Region</label>
                  <input type="text" id="enroll-region" class="ecc-field-input" value="${this._escAttr(p.region || 'X')}" />
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">3. Health at enrollment <span class="text-muted" style="font-weight:500;font-size:0.9rem;">(optional)</span></h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Saved to Health Records when provided.</p>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Height (cm)</label>
                  <input type="number" id="enroll-height" class="ecc-field-input" step="0.1" value="${this._escAttr(p.heightCm)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Weight (kg)</label>
                  <input type="number" id="enroll-weight" class="ecc-field-input" step="0.1" value="${this._escAttr(p.weightKg)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Allergies</label>
                  <input type="text" id="enroll-allergies" class="ecc-field-input" value="${this._escAttr(p.allergies)}" placeholder="None / list" />
                </div>
                <div>
                  <label class="ecc-field-label">Medical conditions</label>
                  <input type="text" id="enroll-conditions" class="ecc-field-input" value="${this._escAttr(p.medicalConditions)}" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Immunizations</label>
                  <input type="text" id="enroll-immun" class="ecc-field-input" value="${this._escAttr(p.immunizations)}" placeholder="e.g. Up to date" />
                </div>
              </div>
            </div>

            <p id="enroll-error" style="color:#d32f2f;display:none;margin:0 0 0.5rem;"></p>
          </div>
          <div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherChildren.closeModal()">Cancel</button>
            <button class="btn" style="background:#fff3e0;color:#e65100;" onclick="TeacherChildren.demoAutofillOnline()">Demo: autofill online app</button>
            <button class="btn btn-blue" onclick="TeacherChildren.saveEnrollment()">💾 Save enrollment</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    this._bindModalDismiss();
    this._onBirthChange();
  },

  _escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  },

  _onBirthChange() {
    const birth = (document.getElementById('enroll-birth') || {}).value;
    if (typeof ChildRegistry === 'undefined' || !birth) return;
    const age = ChildRegistry.ageFromBirthDate(birth);
    const ageEl = document.getElementById('enroll-age-label');
    const recEl = document.getElementById('enroll-record');
    if (ageEl) ageEl.value = age.ageLabel || '—';
    if (recEl) {
      const rt = ChildRegistry.recordTypeFromAgeMonths(age.ageMonths);
      recEl.value = rt === 1 ? 'Record 1 (0–36 mo)' : 'Record 2 (37+ mo)';
    }
  },

  /**
   * Simulate approving an online application → autofill the form (future flow).
   */
  demoAutofillOnline() {
    const sampleApp = {
      id: 'APP-2026-0142',
      childName: 'Samira Noor',
      sex: 'Female',
      birthDate: '2023-06-20',
      preferredSection: 'explorers',
      guardianName: 'Mrs. Noor',
      motherName: 'Hana Noor',
      fatherName: 'Noor Hassan',
      barangay: 'Poblacion',
      municipality: 'Medina',
      province: 'Misamis Oriental',
      region: 'X',
      siblings: 2,
      birthOrder: '4th',
      allergies: 'None',
      medicalConditions: '',
      immunizations: 'Up to date',
      heightCm: 88,
      weightKg: 12.5
    };
    this.closeModal();
    const mapped = ChildRegistry.mapApplicationToForm(sampleApp);
    this.openAddChild(mapped);
  },

  saveEnrollment() {
    const errEl = document.getElementById('enroll-error');
    const showErr = (msg) => {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = msg;
      }
    };

    const data = {
      name: (document.getElementById('enroll-name') || {}).value,
      sex: (document.getElementById('enroll-sex') || {}).value,
      birthDate: (document.getElementById('enroll-birth') || {}).value,
      sectionKey: (document.getElementById('enroll-section') || {}).value,
      parentName: (document.getElementById('enroll-parent') || {}).value,
      motherName: (document.getElementById('enroll-mother') || {}).value,
      fatherName: (document.getElementById('enroll-father') || {}).value,
      siblings: (document.getElementById('enroll-siblings') || {}).value,
      birthOrder: (document.getElementById('enroll-birth-order') || {}).value,
      barangay: (document.getElementById('enroll-barangay') || {}).value,
      municipality: (document.getElementById('enroll-municipality') || {}).value,
      province: (document.getElementById('enroll-province') || {}).value,
      region: (document.getElementById('enroll-region') || {}).value,
      heightCm: (document.getElementById('enroll-height') || {}).value,
      weightKg: (document.getElementById('enroll-weight') || {}).value,
      allergies: (document.getElementById('enroll-allergies') || {}).value,
      medicalConditions: (document.getElementById('enroll-conditions') || {}).value,
      immunizations: (document.getElementById('enroll-immun') || {}).value,
      applicationId: (document.getElementById('enroll-application-id') || {}).value || null
    };

    const source = (document.getElementById('enroll-source') || {}).value || 'walk_in';

    if (!data.name || !String(data.name).trim()) {
      showErr('Child’s name is required.');
      return;
    }
    if (!data.birthDate) {
      showErr('Date of birth is required.');
      return;
    }
    if (!data.parentName && !data.motherName && !data.fatherName) {
      showErr('Enter at least one parent / guardian name.');
      return;
    }

    const result = ChildRegistry.enroll(data, {
      source,
      applicationId: data.applicationId
    });

    if (!result.ok) {
      showErr(result.error || 'Could not save enrollment.');
      return;
    }

    const child = result.child;

    // Optional health seed
    if (typeof HealthStore !== 'undefined') {
      const h = parseFloat(data.heightCm);
      const w = parseFloat(data.weightKg);
      if (!isNaN(h) || !isNaN(w)) {
        const bmi = HealthStore.computeBmi(h, w);
        HealthStore.saveMeasurement({
          childId: child.id,
          childName: child.name,
          date: new Date().toISOString().slice(0, 10),
          heightCm: isNaN(h) ? null : h,
          weightKg: isNaN(w) ? null : w,
          bmi,
          status: bmi != null ? HealthStore.suggestStatus(bmi) : 'Normal',
          nutritionStatus: 'Normal',
          feedingParticipating: true,
          notes: 'Recorded at enrollment',
          recordedBy: 'Teacher (enrollment)'
        });
      }
      if (data.allergies || data.medicalConditions || data.immunizations) {
        HealthStore.saveProfile(child.id, {
          allergies: data.allergies || '',
          medicalConditions: data.medicalConditions || '',
          immunizations: data.immunizations || '',
          notes: 'From enrollment'
        });
      }
    }

    this.closeModal();
    this._draw();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Enrolled ' + child.name + ' (' + child.childCode + ')';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  },

  showAddChildDemo() {
    this.openAddChild();
  },

  _card(c) {
    const isSupport = c.status === 'needs_support';
    const statusColor = isSupport ? 'var(--orange)' : 'var(--success)';
    const statusText = isSupport
      ? `${c.focusArea || 'Area'}: Needs Support`
      : 'Development: On Track';

    return `
      <div class="card child-card" onclick="TeacherChildren.openProfile(${c.id})">
        <div class="flex justify-between items-center" style="margin-bottom:0.4rem;">
          <strong style="font-size:1.05rem; color:var(--text);">${c.name}</strong>
          <span style="font-size:0.8rem; color:var(--muted);">${c.sex === 'Female' ? '👧' : '👦'}</span>
        </div>
        <div style="color:var(--muted); font-size:0.92rem; margin-bottom:0.55rem;">
          ${c.ageLabel} • ${c.section}
        </div>
        <span style="color:${statusColor}; font-weight:600; font-size:0.9rem;">${statusText}</span>
      </div>
    `;
  },

  /* ---------- Profile modal ---------- */

  openProfile(id) {
    const child = SampleChildren.find(c => c.id === id);
    if (!child) return;
    this.closeModal();

    const statusColor = child.status === 'needs_support' ? 'var(--orange)' : 'var(--success)';
    const statusText = child.status === 'needs_support'
      ? `${child.focusArea || 'Area'}: Needs Support`
      : 'On Track';

    const html = `
      <div id="bs-modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div style="background:white;width:95%;max-width:960px;border-radius:16px;max-height:94vh;display:flex;flex-direction:column;overflow:hidden;">

          <div style="padding:1.25rem 1.5rem;background:var(--primary);color:white;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
              <h2 style="margin:0;font-size:1.35rem;color:white;">${child.name}</h2>
              <div style="opacity:0.9;font-size:0.9rem;margin-top:2px;">${child.ageLabel} • ${child.section}</div>
            </div>
            <button onclick="TeacherChildren.closeModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;line-height:1;">×</button>
          </div>

          <div style="display:flex;gap:0;border-bottom:1px solid var(--border);background:#fafafa;flex-shrink:0;padding:0 1rem;overflow-x:auto;">
            <button class="child-tab active" data-tab="overview" onclick="TeacherChildren.switchTab(this,'overview')">Overview</button>
            <button class="child-tab" data-tab="profile" onclick="TeacherChildren.switchTab(this,'profile')">Sociodemographic</button>
            <button class="child-tab" data-tab="development" onclick="TeacherChildren.switchTab(this,'development')">Development</button>
            <button class="child-tab" data-tab="attendance" onclick="TeacherChildren.switchTab(this,'attendance')">Attendance</button>
            <button class="child-tab" data-tab="health" onclick="TeacherChildren.switchTab(this,'health')">Health</button>
          </div>

          <div id="child-modal-body" style="padding:1.5rem 1.75rem;overflow-y:auto;flex:1;">
            ${this._tabOverview(child, statusColor, statusText)}
          </div>

          <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);background:#fafafa;text-align:right;flex-shrink:0;">
            <button class="btn btn-blue" onclick="TeacherChildren.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this._currentChild = child;
    this._bindModalDismiss();
  },

  _bindModalDismiss() {
    // Escape key
    this._onKeyDown = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._onKeyDown);

    // Click on overlay backdrop only (not the white panel)
    const overlay = document.getElementById('bs-modal-overlay');
    if (overlay) {
      this._onOverlayClick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
      overlay.addEventListener('click', this._onOverlayClick);
    }
  },

  switchTab(btn, tab) {
    document.querySelectorAll('.child-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const body = document.getElementById('child-modal-body');
    const child = this._currentChild;
    if (!body || !child) return;

    const statusColor = child.status === 'needs_support' ? 'var(--orange)' : 'var(--success)';
    const statusText = child.status === 'needs_support'
      ? `${child.focusArea || 'Area'}: Needs Support`
      : 'On Track';

    const map = {
      overview: () => this._tabOverview(child, statusColor, statusText),
      profile: () => this._tabProfile(child),
      development: () => this._tabDevelopment(child),
      attendance: () => this._tabAttendance(child),
      health: () => this._tabHealth(child)
    };
    body.innerHTML = map[tab] ? map[tab]() : '';
  },

  _tabOverview(child, statusColor, statusText) {
    return `
      <div class="dashboard-grid" style="margin-bottom:0;">
        <div class="card" style="margin-bottom:0;">
          <h3>Status</h3>
          <div style="font-size:1.4rem;font-weight:700;color:${statusColor};margin:0.4rem 0;">${statusText}</div>
          <p style="margin:0;font-size:0.9rem;">Based on latest developmental assessment</p>
        </div>
        <div class="card" style="margin-bottom:0;">
          <h3>Class / Section</h3>
          <div style="font-size:1.25rem;font-weight:700;color:var(--primary-dark);margin:0.4rem 0;">${child.section}</div>
          <p style="margin:0;font-size:0.9rem;">Age: ${child.ageLabel}</p>
        </div>
        <div class="card" style="margin-bottom:0;">
          <h3>Parent / Guardian</h3>
          <div style="font-size:1.15rem;font-weight:600;margin:0.4rem 0;">${child.parentName}</div>
          <p style="margin:0;font-size:0.9rem;">Primary contact</p>
        </div>
      </div>

      <div class="card" style="margin-top:1.25rem;">
        <h3>Quick Actions</h3>
        <div class="flex flex-wrap gap-1 mt-2">
          <button class="btn btn-blue" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('development')">📈 Open Development Tracking</button>
          <button class="btn" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('attendance')">📅 Attendance</button>
          <button class="btn" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('health')">❤️ Health Records</button>
        </div>
      </div>
    `;
  },

  _tabProfile(child) {
    const a = child.address || {};
    return `
      <div class="card" style="margin-bottom:0;">
        <h3>Sociodemographic Profile</h3>
        <p class="text-muted" style="margin-bottom:1.25rem;font-size:0.9rem;">
          Indicate the complete sociodemographic profile of the child. (Editable — save will connect to backend later.)
        </p>

        <div class="profile-grid">
          <div>
            <label>Child's Name</label>
            <input type="text" value="${child.name}" />
          </div>
          <div>
            <label>Sex</label>
            <input type="text" value="${child.sex}" />
          </div>
          <div>
            <label>Date of Birth</label>
            <input type="text" value="${child.birthDate || ''}" />
          </div>
          <div>
            <label>Age</label>
            <input type="text" value="${child.ageLabel}" readonly style="background:#f5f5f5;" />
          </div>
          <div>
            <label>Barangay</label>
            <input type="text" value="${a.barangay || ''}" />
          </div>
          <div>
            <label>Municipality / City</label>
            <input type="text" value="${a.municipality || ''}" />
          </div>
          <div>
            <label>Province</label>
            <input type="text" value="${a.province || ''}" />
          </div>
          <div>
            <label>Region</label>
            <input type="text" value="${a.region || ''}" />
          </div>
          <div>
            <label>Father's Name</label>
            <input type="text" value="${child.fatherName || ''}" />
          </div>
          <div>
            <label>Mother's Name</label>
            <input type="text" value="${child.motherName || ''}" />
          </div>
          <div>
            <label>Number of Siblings</label>
            <input type="text" value="${child.siblings ?? ''}" />
          </div>
          <div>
            <label>Birth Order</label>
            <input type="text" value="${child.birthOrder || ''}" />
          </div>
        </div>

        <div style="margin-top:1.5rem;text-align:right;">
          <button class="btn btn-blue" onclick="alert('Profile saved (demo). Will connect to backend later.')">💾 Save Profile</button>
        </div>
      </div>
    `;
  },

  _tabDevelopment(child) {
    const recordLabel = child.recordType === 1
      ? 'ECCD Checklist — Child’s Record 1 (0–36 months)'
      : 'ECCD Checklist — Child’s Record 2 (3+ years)';

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3>Development Summary</h3>
        <p><strong>Instrument:</strong> ${recordLabel}</p>
        <p style="margin-top:0.5rem;">
          Status:
          <span style="font-weight:700;color:${child.status === 'needs_support' ? 'var(--orange)' : 'var(--success)'};">
            ${child.status === 'needs_support' ? (child.focusArea + ' — Needs Support') : 'On Track'}
          </span>
        </p>
        <p class="text-muted" style="margin-top:0.75rem;font-size:0.9rem;">
          Full digital checklist encoding and rule-based domain insights will live in the Development Tracking module.
        </p>
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('development')">
          Open Development Tracking
        </button>
      </div>
      <div class="card" style="margin-bottom:0;">
        <h3>Domain Snapshot (sample)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;margin-top:0.75rem;">
          ${this._domainPill('Gross Motor', 92, 'var(--success)')}
          ${this._domainPill('Fine Motor', child.focusArea === 'Fine Motor' ? 68 : 85, child.focusArea === 'Fine Motor' ? 'var(--orange)' : 'var(--primary)')}
          ${this._domainPill('Self-Help', 88, 'var(--orange)')}
          ${this._domainPill('Language', child.focusArea === 'Language' ? 70 : 90, child.focusArea === 'Language' ? 'var(--orange)' : 'var(--purple)')}
          ${this._domainPill('Cognitive', 94, 'var(--cyan)')}
          ${this._domainPill('Social-Emotional', 96, 'var(--lime)')}
        </div>
      </div>
    `;
  },

  _domainPill(label, pct, color) {
    return `
      <div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:10px;">
        <div style="font-size:1.4rem;font-weight:700;color:${color};">${pct}%</div>
        <div style="font-size:0.8rem;color:var(--muted);">${label}</div>
      </div>
    `;
  },

  _tabAttendance(child) {
    return `
      <div class="card" style="margin-bottom:0;">
        <h3>Attendance Overview</h3>
        <p class="text-muted" style="margin-bottom:1rem;">Recent attendance for <strong>${child.name}</strong></p>
        <div class="dashboard-grid" style="margin-bottom:1rem;">
          <div style="text-align:center;background:var(--primary-light);padding:1rem;border-radius:12px;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--primary-dark);">22 / 24</div>
            <div style="font-size:0.85rem;">Days present this month</div>
          </div>
          <div style="text-align:center;background:var(--light-green);padding:1rem;border-radius:12px;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--success);">92%</div>
            <div style="font-size:0.85rem;">Attendance rate</div>
          </div>
        </div>
        <p class="text-muted" style="font-size:0.9rem;">Full monthly sheet and history will be available in the Attendance module.</p>
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('attendance')">Open Attendance</button>
      </div>
    `;
  },

  _tabHealth(child) {
    return `
      <div class="card" style="margin-bottom:0;">
        <h3>Health Snapshot</h3>
        <div class="dashboard-grid" style="margin-bottom:1rem;">
          <div style="text-align:center;background:var(--soft-green);padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--success);">—</div>
            <div style="font-size:0.85rem;">Height</div>
          </div>
          <div style="text-align:center;background:var(--primary-light);padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--primary-dark);">—</div>
            <div style="font-size:0.85rem;">Weight</div>
          </div>
          <div style="text-align:center;background:#fefce8;padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--orange);">Normal</div>
            <div style="font-size:0.85rem;">BMI Status</div>
          </div>
        </div>
        <p class="text-muted" style="font-size:0.9rem;">Detailed growth charts, nutrition and medical records will be managed in Health Records.</p>
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.closeModal(); BrightSteps.navigate('health')">Open Health Records</button>
      </div>
    `;
  },

  closeModal() {
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
    if (this._onOverlayClick) {
      const overlay = document.getElementById('bs-modal-overlay');
      if (overlay) overlay.removeEventListener('click', this._onOverlayClick);
      this._onOverlayClick = null;
    }
    const el = document.getElementById('bs-modal-overlay');
    if (el) el.remove();
    this._currentChild = null;
  }
};
