/**
 * Children module — list, search, filter, and full child profile modal.
 * Visual language matched to the original mockup + established design system.
 */

const TeacherChildren = {
  filterText: '',
  filterSection: 'all',
  /** 'active' | 'archived' */
  listMode: 'active',
  selectedIds: [],

  render(container) {
    this.container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      this.container.innerHTML = '<div class="card" style="padding:1.5rem;"><p class="text-muted" style="margin:0;">Loading children from server…</p></div>';
      ChildrenRemote.ensureLoaded(true).then(function (res) {
        if (!res.ok) console.warn('[Children] remote load failed, using local', res.error);
        const done = function () { TeacherChildren._draw(); };
        if (typeof ApplicationStore !== 'undefined' && ApplicationStore.hydrateAll) {
          ApplicationStore.hydrateAll().then(done).catch(done);
        } else done();
      }).catch(function (err) {
        console.warn('[Children] remote load error', err);
        TeacherChildren._draw();
      });
      return;
    }
    this._draw();
  },

  _draw() {
    const children = this._filtered();
    const sections = (typeof ClassStore !== 'undefined')
      ? ClassStore.options(true)
      : [
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

    const pendingBlock = this.listMode === 'active'
      ? this._pendingApplicationsHtml(pending, approvedWait)
      : '';

    const archivedCount = typeof ChildRegistry !== 'undefined'
      ? ChildRegistry.archivedList().length
      : 0;
    const activeCount = typeof ChildRegistry !== 'undefined'
      ? ChildRegistry.activeList().length
      : SampleChildren.filter(c => c.archived !== true).length;

    let listHtml;
    if (this.listMode === 'credentials') {
      listHtml = children.length
        ? this._credentialsTable(children)
        : `<div class="card children-empty">
             <div style="font-size:2rem; margin-bottom:0.5rem;">🔑</div>
             <p style="margin:0 0 0.35rem; font-weight:600;">No parent accounts found</p>
             <p class="text-muted" style="margin:0 0 1rem; font-size:0.9rem;">Enroll a child first, then share credentials via Messenger manually.</p>
           </div>`;
    } else {
      listHtml = children.length
        ? `<div class="children-grid">${children.map(c => this._card(c)).join('')}</div>`
        : `<div class="card children-empty">
             <div style="font-size:2rem; margin-bottom:0.5rem;">${this.listMode === 'archived' ? '📦' : '🔍'}</div>
             <p style="margin:0 0 0.35rem; font-weight:600; color:var(--text);">
               ${this.listMode === 'archived' ? 'No archived children' : 'No children found'}
             </p>
             <p class="text-muted" style="margin:0 0 1rem; font-size:0.9rem;">
               ${this.listMode === 'archived'
                 ? 'Archived children are inactive but their records stay available to restore.'
                 : 'Try a different name, age, or section filter.'}
             </p>
             ${this.listMode === 'archived'
               ? `<button class="btn btn-blue" onclick="TeacherChildren.setListMode('active')">← Back to active</button>`
               : `<button class="btn" onclick="TeacherChildren.clearFilters()">Clear filters</button>`}
           </div>`;
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3" style="flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>👦 Children</h1>
          <p class="text-muted">Enroll children, review online applications, and open profiles.</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
          <button class="btn" style="background:#e8f5e9;color:#2e7d32;" onclick="TeacherChildren.openCreateClass()">+ Create Class</button>
          <button class="btn btn-blue" onclick="TeacherChildren.openAddChild()">+ Add Child</button>
        </div>
      </div>

      ${pendingBlock}

      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;">
        <button class="btn ${this.listMode === 'active' ? 'btn-blue' : ''}"
          style="${this.listMode !== 'active' ? 'background:#e8e8e8;color:var(--text);' : ''}"
          onclick="TeacherChildren.setListMode('active')">Active (${activeCount})</button>
        <button class="btn ${this.listMode === 'archived' ? 'btn-blue' : ''}"
          style="${this.listMode !== 'archived' ? 'background:#e8e8e8;color:var(--text);' : ''}"
          onclick="TeacherChildren.setListMode('archived')">📦 Archived (${archivedCount})</button>
        <button class="btn ${this.listMode === 'credentials' ? 'btn-blue' : ''}"
          style="${this.listMode !== 'credentials' ? 'background:#e8e8e8;color:var(--text);' : ''}"
          onclick="TeacherChildren.setListMode('credentials')">🔑 Parent accounts</button>
      </div>

      <div class="card filter-bar-card" style="margin-bottom:1rem;">
        <div class="filter-bar">
          <div class="filter-bar-search">
            <label class="ecc-field-label" for="child-search">Search</label>
            <input id="child-search" type="search" class="ecc-field-input"
              placeholder="Name, Child ID, age, or parent..."
              value="${String(this.filterText || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="filter-bar-class">
            <label class="ecc-field-label" for="child-section">Class / section</label>
            <select id="child-section" class="ecc-field-input"
              onchange="TeacherChildren.setSection(this.value)">
              ${sections.map(s =>
                '<option value="' + s.key + '"' +
                (this.filterSection === s.key ? ' selected' : '') + '>' +
                s.label + '</option>'
              ).join('')}
            </select>
          </div>
        </div>
      </div>

      ${this.listMode === 'credentials' ? '' : this._bulkBarHtml(children)}

      <p class="text-muted mb-2" style="font-size:0.9rem;">
        ${this.listMode === 'credentials'
          ? `Parent portal accounts · <strong>${children.length}</strong> record(s) · share login via Messenger manually`
          : `Showing <strong>${children.length}</strong> ${this.listMode === 'archived' ? 'archived' : 'active'} child(ren) · ${activeCount} active · ${archivedCount} archived`}
      </p>
      ${this.listMode === 'credentials' ? `
        <div class="card" style="margin-bottom:1rem;padding:0.85rem 1rem;background:#e3f2fd;border:1px solid #90caf9;">
          <p style="margin:0;font-size:0.9rem;line-height:1.5;">
            <strong>How to share:</strong> Open a row → <em>View / copy</em> → paste the message in
            <strong>Facebook Messenger</strong> to the guardian. Automated Messenger sending is not free; teachers send manually.
          </p>
        </div>` : ''}

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
    const q = (this.filterText || '').trim().toLowerCase();
    const mode = this.listMode;
    let base = [];
    if (typeof ChildRegistry !== 'undefined') {
      if (mode === 'archived') base = ChildRegistry.archivedList();
      else if (mode === 'credentials') base = ChildRegistry.dedupeList(ChildRegistry.all());
      else base = ChildRegistry.activeList();
    } else if (typeof SampleChildren !== 'undefined') {
      base = SampleChildren.slice();
    }
    return base.filter(c => {
      const isArchived = c.archived === true;
      if (mode === 'active' && isArchived) return false;
      if (mode === 'archived' && !isArchived) return false;
      const matchSection = this.filterSection === 'all' || c.sectionKey === this.filterSection;
      const hay = [
        c.name, c.childCode, c.parentName, c.parentLoginName, c.motherName, c.fatherName,
        c.ageLabel, c.section, c.focusArea, c.contactPhone, c.phone
      ].map(x => String(x || '').toLowerCase()).join(' ');
      return matchSection && (!q || hay.includes(q));
    });
  },

  setListMode(mode) {
    if (mode === 'archived') this.listMode = 'archived';
    else if (mode === 'credentials') this.listMode = 'credentials';
    else this.listMode = 'active';
    this.selectedIds = [];
    this._draw();
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


  _radioGroup(name, options, selected) {
    return options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      const checked = selected === val ? 'checked' : '';
      return `<label style="display:inline-flex;align-items:center;gap:0.35rem;margin-right:0.85rem;font-size:0.9rem;cursor:pointer;">
        <input type="radio" name="${name}" value="${val}" ${checked} /> ${label}
      </label>`;
    }).join('');
  },

  _vaccineRow(key, label, selected) {
    const opts = ['Yes', 'No', "Don't Know"];
    const radios = opts.map(o => {
      const checked = selected === o ? 'checked' : '';
      return `<label style="display:inline-flex;align-items:center;gap:0.3rem;margin-right:0.75rem;font-size:0.88rem;">
        <input type="radio" name="enroll-vax-${key}" value="${o}" ${checked} /> ${o}
      </label>`;
    }).join('');
    return `<tr>
      <td style="padding:0.4rem 0.5rem;font-weight:600;width:110px;">${label}</td>
      <td style="padding:0.4rem 0.5rem;">${radios}</td>
    </tr>`;
  },

  /* ---------- Create Class ---------- */

  openCreateClass() {
    this.closeModal();
    const existing = (typeof ClassStore !== 'undefined')
      ? ClassStore.listAll()
      : [];
    const listRows = existing.map(c => {
      const badge = c.isSample
        ? '<span style="font-size:0.75rem;background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:10px;">Sample</span>'
        : '<span style="font-size:0.75rem;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;">Custom</span>';
      const status = c.active === false
        ? '<span style="color:#d32f2f;font-size:0.8rem;">Inactive</span>'
        : '<span class="success-text" style="font-size:0.8rem;">Active</span>';
      return `<tr>
        <td style="padding:0.45rem 0.5rem;"><strong>${c.name}</strong> ${badge}</td>
        <td style="padding:0.45rem 0.5rem;">${c.ageLabel || '—'}</td>
        <td style="padding:0.45rem 0.5rem;">${status}</td>
        <td style="padding:0.45rem 0.5rem;">
          ${c.active === false
            ? `<button class="btn" style="padding:4px 10px;font-size:0.8rem;" onclick="TeacherChildren.reactivateClass('${c.key}')">Reactivate</button>`
            : `<button class="btn" style="padding:4px 10px;font-size:0.8rem;background:#ffebee;color:#c62828;" onclick="TeacherChildren.deactivateClass('${c.key}')">Deactivate</button>`}
        </td>
      </tr>`;
    }).join('');

    const html = `
      <div id="bs-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:640px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">Classes / Sections</h2>
            <button class="bs-modal-close" onclick="TeacherChildren.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">
            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">+ Create class</h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">
                Create classes for each group (age range and description help teachers filter the list).
              </p>
              <div class="profile-grid">
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Class name *</label>
                  <input type="text" id="class-name" class="ecc-field-input" placeholder="e.g. Afternoon Stars" />
                </div>
                <div>
                  <label class="ecc-field-label">Age from (years)</label>
                  <input type="number" id="class-age-min" class="ecc-field-input" min="0" max="6" step="0.5" placeholder="e.g. 2" />
                </div>
                <div>
                  <label class="ecc-field-label">Age to (years)</label>
                  <input type="number" id="class-age-max" class="ecc-field-input" min="0" max="6" step="0.5" placeholder="e.g. 4" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Description <span class="text-muted">(optional)</span></label>
                  <input type="text" id="class-desc" class="ecc-field-input" placeholder="Short note for teachers" />
                </div>
              </div>
              <p id="class-error" style="color:#d32f2f;display:none;margin:0.5rem 0 0;"></p>
              <button class="btn btn-blue mt-2" onclick="TeacherChildren.saveNewClass()">Save class</button>
            </div>
            <div class="card" style="margin-bottom:0;">
              <h3 style="margin-top:0;">Existing classes</h3>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                  <thead>
                    <tr style="text-align:left;border-bottom:1px solid var(--border);">
                      <th style="padding:0.4rem 0.5rem;">Name</th>
                      <th style="padding:0.4rem 0.5rem;">Age range</th>
                      <th style="padding:0.4rem 0.5rem;">Status</th>
                      <th style="padding:0.4rem 0.5rem;"></th>
                    </tr>
                  </thead>
                  <tbody>${listRows || '<tr><td colspan="4" class="text-muted">No classes</td></tr>'}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="TeacherChildren.closeModal();TeacherChildren._draw()">Done</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this._bindModalDismiss();
  },

  saveNewClass() {
    const err = document.getElementById('class-error');
    const show = (m) => {
      if (err) { err.style.display = 'block'; err.textContent = m; }
    };
    if (typeof ClassStore === 'undefined') {
      show('Class store not loaded.');
      return;
    }
    const result = ClassStore.create({
      name: (document.getElementById('class-name') || {}).value,
      ageMinYears: (document.getElementById('class-age-min') || {}).value,
      ageMaxYears: (document.getElementById('class-age-max') || {}).value,
      description: (document.getElementById('class-desc') || {}).value
    });
    if (!result.ok) {
      show(result.error || 'Could not save.');
      return;
    }
    this.closeModal();
    this.openCreateClass();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Class created: ' + result.class.name;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  },

  deactivateClass(key) {
    if (!confirm('Deactivate this class? Enrolled children keep their section; it will no longer appear in new enrollment filters.')) return;
    ClassStore.deactivate(key);
    this.closeModal();
    this.openCreateClass();
  },

  reactivateClass(key) {
    ClassStore.update(key, { active: true });
    this.closeModal();
    this.openCreateClass();
  },

  /* ---------- Add / Enroll Child ---------- */

  /**
   * @param {object} [prefill] — optional mapped application fields for autofill
   *   (from online enrollment approval via ChildRegistry.mapApplicationToForm)
   */
  openEditChild(id) {
    const child = SampleChildren.find(c => String(c.id) === String(id));
    if (!child) {
      alert('Child not found.');
      return;
    }
    const prefill = ChildRegistry.childToFormPrefill(child);
    // Latest health measurement / profile if available
    if (typeof HealthStore !== 'undefined') {
      const latest = HealthStore.getLatest && HealthStore.getLatest(child.id);
      const profile = HealthStore.getProfile && HealthStore.getProfile(child.id);
      if (latest) {
        if (latest.heightCm != null) prefill.heightCm = latest.heightCm;
        if (latest.weightKg != null) prefill.weightKg = latest.weightKg;
      }
      if (profile) {
        if (profile.allergies) prefill.allergies = profile.allergies;
        if (profile.medicalConditions) prefill.medicalConditions = profile.medicalConditions;
        if (profile.vaccines) prefill.vaccines = profile.vaccines;
      }
    }
    this.openAddChild(prefill);
  },

  openAddChild(prefill) {
    this.closeModal();
    const p = prefill || {};
    const isEdit = !!(p._editId || p.id);
    const editId = p._editId || p.id || '';
    const codePreview = isEdit && p.childCode
      ? p.childCode
      : (typeof ChildRegistry !== 'undefined' ? ChildRegistry.nextChildCode() : 'NCDC-—');
    const today = new Date().toISOString().slice(0, 10);
    const source = p.enrollmentSource || (p.applicationId ? 'online_application' : 'walk_in');

    const html = `
      <div id="bs-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel ecc-modal-wide">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.25rem;color:white;">${isEdit ? 'Edit Child Profile' : '+ Enroll Child'}</h2>
            <button class="bs-modal-close" onclick="TeacherChildren.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted" style="margin-top:0;">
              ${isEdit
                ? 'Update the ECCD profile fields for this enrolled child. Child ID stays the same.'
                : 'Walk-in: encode from the hard-copy form. Online application: fields can be auto-filled after approval, then the teacher reviews and saves.'}
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;align-items:center;">
              <span style="font-size:0.85rem;background:#e3f2fd;color:var(--primary-dark);padding:4px 10px;border-radius:20px;">
                Child ID: <strong id="enroll-code-preview">${codePreview}</strong>
              </span>
              <span style="font-size:0.85rem;background:#f5f5f5;padding:4px 10px;border-radius:20px;">
                Source: <strong id="enroll-source-label">${source === 'online_application' ? 'Online application' : 'Walk-in'}${isEdit ? ' · Editing' : ''}</strong>
              </span>
              ${p.applicationId ? `<span class="text-muted" style="font-size:0.85rem;">Application: ${p.applicationId}</span>` : ''}
            </div>
            <input type="hidden" id="enroll-source" value="${source}" />
            <input type="hidden" id="enroll-application-id" value="${p.applicationId || ''}" />
            <input type="hidden" id="enroll-edit-id" value="${editId}" />

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">1. Personal information <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(ECCD Child Profile)</span></h3>
              ${(typeof FileAttach !== 'undefined'
                ? FileAttach.photoFieldHtml('enroll', p.photo || null)
                : '')}
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Last name</label>
                  <input type="text" id="enroll-last" class="ecc-field-input" value="${this._escAttr(p.lastName)}" />
                </div>
                <div>
                  <label class="ecc-field-label">First name</label>
                  <input type="text" id="enroll-first" class="ecc-field-input" value="${this._escAttr(p.firstName)}" />
                </div>
                <div>
                  <label class="ecc-field-label">Middle initial</label>
                  <input type="text" id="enroll-middle" class="ecc-field-input" value="${this._escAttr(p.middleInitial)}" maxlength="1" oninput="this.value=this.value.replace(/[^A-Za-z]/g,'').slice(0,1).toUpperCase()" />
                </div>
                <div>
                  <label class="ecc-field-label">Full name (display) *</label>
                  <input type="text" id="enroll-name" class="ecc-field-input" value="${this._escAttr(p.name)}" placeholder="Auto-filled from parts if left blank" />
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
                    onchange="TeacherChildren._onBirthChange()" oninput="TeacherChildren._onBirthChange()" />
                </div>
                <div>
                  <label class="ecc-field-label">Age (auto)</label>
                  <input type="text" id="enroll-age-label" class="ecc-field-input" readonly style="background:#f5f5f5;" placeholder="—" />
                </div>
                <div>
                  <label class="ecc-field-label">Birth order</label>
                  <input type="text" id="enroll-birth-order" class="ecc-field-input" value="${this._escAttr(p.birthOrder)}" placeholder="e.g. 1" />
                </div>
                <div>
                  <label class="ecc-field-label">Registered</label>
                  <div style="padding-top:0.45rem;">
                    <label style="margin-right:1rem;"><input type="radio" name="enroll-registered" value="Yes" ${p.registered === true || p.registered === 'Yes' ? 'checked' : ''} /> Yes</label>
                    <label><input type="radio" name="enroll-registered" value="No" ${p.registered === false || p.registered === 'No' ? 'checked' : (!p.registered ? 'checked' : '')} /> No</label>
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">Born at</label>
                  <select id="enroll-born-at" class="ecc-field-input">
                    <option value="">—</option>
                    <option value="Hospital" ${p.bornAt === 'Hospital' ? 'selected' : ''}>Hospital</option>
                    <option value="Health Center" ${p.bornAt === 'Health Center' ? 'selected' : ''}>Health Center</option>
                    <option value="Home" ${p.bornAt === 'Home' ? 'selected' : ''}>Home</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Mother tongue</label>
                  <select id="enroll-tongue" class="ecc-field-input">
                    <option value="">—</option>
                    ${['Tagalog','Visayan','Ilocano','Bicolano'].map(x => `<option value="${x}" ${p.motherTongue === x ? 'selected' : ''}>${x}</option>`).join('')}
                    <option value="Others" ${p.motherTongue === 'Others' ? 'selected' : ''}>Others</option>
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Mother tongue (if Others)</label>
                  <input type="text" id="enroll-tongue-other" class="ecc-field-input" value="${this._escAttr(p.motherTongueOther)}" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Other dialects spoken at home</label>
                  <input type="text" id="enroll-dialects" class="ecc-field-input" value="${this._escAttr(p.otherDialects)}" placeholder="e.g. English" />
                </div>
                <div>
                  <label class="ecc-field-label">Class / Section *</label>
                  <select id="enroll-section" class="ecc-field-input">
                    ${(typeof ClassStore !== 'undefined' ? ClassStore.options(false) : [
                        { key: 'explorers', label: 'Little Explorers (0–3 yrs)' },
                        { key: 'stars', label: 'Little Stars (3–4 yrs)' },
                        { key: 'sunshine', label: 'Sunshine Group (4–5 yrs)' }
                      ]).map(s => `<option value="${s.key}" ${(p.sectionKey || 'explorers') === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
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
                  <input type="text" id="enroll-parent" class="ecc-field-input" value="${this._escAttr(p.parentName)}" placeholder="Guardian full name" />
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
              <h3 style="margin-top:0;">3. Mother’s Profile <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(Form 1.B)</span></h3>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Last name</label>
                  <input type="text" id="m-last" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.lastName) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">First name</label>
                  <input type="text" id="m-first" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.firstName) || p.motherName || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Middle initial</label>
                  <input type="text" id="m-middle" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.middleInitial) || '')}" maxlength="1" oninput="this.value=this.value.replace(/[^A-Za-z]/g,'').slice(0,1).toUpperCase()" />
                </div>
                <div>
                  <label class="ecc-field-label">Date of birth</label>
                  <input type="date" id="m-birth" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.birthDate) || '')}"
                    onchange="TeacherChildren._fillAgeFromBirth('m-birth','m-age')" />
                </div>
                <div>
                  <label class="ecc-field-label">Age</label>
                  <input type="number" id="m-age" class="ecc-field-input" min="0" value="${this._escAttr((p.motherProfile && p.motherProfile.age) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Pregnant?</label>
                  <div style="padding-top:0.4rem;">
                    <label style="margin-right:1rem;"><input type="radio" name="m-pregnant" value="Yes" ${(p.motherProfile && p.motherProfile.pregnant === 'Yes') ? 'checked' : ''} /> Yes</label>
                    <label><input type="radio" name="m-pregnant" value="No" ${!(p.motherProfile && p.motherProfile.pregnant === 'Yes') ? 'checked' : ''} /> No</label>
                  </div>
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Civil status</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;padding-top:0.35rem;font-size:0.9rem;">
                    ${['Single','Married','Separated','Widower','Live-in'].map(s => `
                      <label><input type="radio" name="m-civil" value="${s}" ${(p.motherProfile && p.motherProfile.civilStatus === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">District / Municipality</label>
                  <input type="text" id="m-district" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.district) || p.municipality || 'Medina')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Purok / Zone</label>
                  <input type="text" id="m-purok" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.purok) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Mother tongue</label>
                  <select id="m-tongue" class="ecc-field-input">
                    <option value="">—</option>
                    ${['Tagalog','Visayan','Ilocano','Bicolano','Others'].map(x => `<option value="${x}" ${(p.motherProfile && p.motherProfile.motherTongue === x) ? 'selected' : ''}>${x}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Other dialects</label>
                  <input type="text" id="m-dialects" class="ecc-field-input" value="${this._escAttr((p.motherProfile && p.motherProfile.otherDialects) || '')}" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Educational attainment</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.88rem;">
                    ${['Elem. / Graduate','High School / Graduate','College / Graduate','Technical/Vocational Graduate','Masteral Unit/Degree','Doctoral Unit/Degree'].map(s => `
                      <label><input type="radio" name="m-edu" value="${s}" ${(p.motherProfile && p.motherProfile.education === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                  </div>
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Occupational status</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.88rem;align-items:center;">
                    ${['Employed','Unemployed','OFW','Retired'].map(s => `
                      <label><input type="radio" name="m-occup" value="${s}" ${(p.motherProfile && p.motherProfile.occupation === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                    <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                      <input type="text" id="m-occup-other" class="ecc-field-input" style="width:140px;" value="${this._escAttr((p.motherProfile && p.motherProfile.occupationOther) || '')}" />
                    </label>
                  </div>
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Preferred age to put child in Day Care Center</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;padding-top:0.35rem;font-size:0.9rem;">
                    ${['Below 1 year old','1 year old','2 years old','3 years old','4 years old'].map(s => `
                      <label><input type="radio" name="m-daycare-age" value="${s}" ${(p.motherProfile && p.motherProfile.daycareAge === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">4. Father’s Profile <span class="text-muted" style="font-weight:500;font-size:0.85rem;">(Form 1.A)</span></h3>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Last name</label>
                  <input type="text" id="f-last" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.lastName) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">First name</label>
                  <input type="text" id="f-first" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.firstName) || p.fatherName || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Middle initial</label>
                  <input type="text" id="f-middle" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.middleInitial) || '')}" maxlength="1" oninput="this.value=this.value.replace(/[^A-Za-z]/g,'').slice(0,1).toUpperCase()" />
                </div>
                <div>
                  <label class="ecc-field-label">Date of birth</label>
                  <input type="date" id="f-birth" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.birthDate) || '')}"
                    onchange="TeacherChildren._fillAgeFromBirth('f-birth','f-age')" />
                </div>
                <div>
                  <label class="ecc-field-label">Age</label>
                  <input type="number" id="f-age" class="ecc-field-input" min="0" value="${this._escAttr((p.fatherProfile && p.fatherProfile.age) || '')}" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Civil status</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;padding-top:0.35rem;font-size:0.9rem;">
                    ${['Single','Married','Separated','Widower','Live-in'].map(s => `
                      <label><input type="radio" name="f-civil" value="${s}" ${(p.fatherProfile && p.fatherProfile.civilStatus === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                  </div>
                </div>
                <div>
                  <label class="ecc-field-label">District / Municipality</label>
                  <input type="text" id="f-district" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.district) || p.municipality || 'Medina')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Purok / Zone</label>
                  <input type="text" id="f-purok" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.purok) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Mother tongue</label>
                  <select id="f-tongue" class="ecc-field-input">
                    <option value="">—</option>
                    ${['Tagalog','Visayan','Ilocano','Bicolano','Others'].map(x => `<option value="${x}" ${(p.fatherProfile && p.fatherProfile.motherTongue === x) ? 'selected' : ''}>${x}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="ecc-field-label">Other dialects</label>
                  <input type="text" id="f-dialects" class="ecc-field-input" value="${this._escAttr((p.fatherProfile && p.fatherProfile.otherDialects) || '')}" />
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Educational attainment</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.88rem;">
                    ${['Elem. / Graduate','High School / Graduate','College / Graduate','Technical/Vocational Graduate','Masteral Unit/Degree','Doctoral Unit/Degree'].map(s => `
                      <label><input type="radio" name="f-edu" value="${s}" ${(p.fatherProfile && p.fatherProfile.education === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                  </div>
                </div>
                <div style="grid-column:1 / -1;">
                  <label class="ecc-field-label">Occupational status</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.88rem;align-items:center;">
                    ${['Employed','Unemployed','OFW','Retired'].map(s => `
                      <label><input type="radio" name="f-occup" value="${s}" ${(p.fatherProfile && p.fatherProfile.occupation === s) ? 'checked' : ''} /> ${s}</label>
                    `).join('')}
                    <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                      <input type="text" id="f-occup-other" class="ecc-field-input" style="width:140px;" value="${this._escAttr((p.fatherProfile && p.fatherProfile.occupationOther) || '')}" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">5. Height, weight &amp; documents</h3>
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
                  <label class="ecc-field-label">Does the child have:</label>
                  <div style="display:flex;flex-wrap:wrap;gap:1rem;padding-top:0.35rem;">
                    <label><input type="checkbox" id="enroll-doc-eccd" ${(p.documents && p.documents.eccdCard) ? 'checked' : ''} /> ECCD Card</label>
                    <label><input type="checkbox" id="enroll-doc-mcb" ${(p.documents && p.documents.motherChildBook) ? 'checked' : ''} /> Mother &amp; Child book</label>
                    <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                      <input type="text" id="enroll-doc-other" class="ecc-field-input" style="width:180px;" value="${this._escAttr((p.documents && p.documents.other) || '')}" />
                    </label>
                  </div>
                  ${(typeof FileAttach !== 'undefined'
                    ? FileAttach.documentsFieldHtml('enroll', (p.documents && p.documents.files) || [])
                    : '')}
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">6. Vaccination and other health data</h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Yes / No / Don’t Know — as on the ECCD Child Profile.</p>
              <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <tbody>
                  ${this._vaccineRow('BCG', 'BCG', (p.vaccines && p.vaccines.BCG) || '')}
                  ${this._vaccineRow('DPT', 'DPT', (p.vaccines && p.vaccines.DPT) || '')}
                  ${this._vaccineRow('OralPolio', 'Oral Polio', (p.vaccines && p.vaccines.OralPolio) || '')}
                  ${this._vaccineRow('HepaB', 'Hepa B', (p.vaccines && p.vaccines.HepaB) || '')}
                  ${this._vaccineRow('Measles', 'Measles', (p.vaccines && p.vaccines.Measles) || '')}
                  ${this._vaccineRow('Others', 'Others', (p.vaccines && p.vaccines.Others) || '')}
                </tbody>
              </table>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">7. Physical attributes</h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">12.1 Physical deformity (check all that apply)</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;margin-bottom:1rem;font-size:0.9rem;">
                ${['Hare Lip','Cross-Eyed (Duling or Banlag)','Deaf','Blind','Disabled leg','Disabled Arm/Hand','Deformity in Fingers/Toes'].map(x => `
                  <label><input type="checkbox" class="enroll-deformity" value="${x}" ${(p.physicalAttributes && (p.physicalAttributes.deformities||[]).includes(x)) ? 'checked' : ''} /> ${x}</label>
                `).join('')}
              </div>
              <p class="text-muted" style="font-size:0.85rem;">12.2 Problems with</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;margin-bottom:1rem;font-size:0.9rem;">
                ${['Behavior','Speaking','Hearing','Vision'].map(x => `
                  <label><input type="checkbox" class="enroll-problem" value="${x}" ${(p.physicalAttributes && (p.physicalAttributes.problems||[]).includes(x)) ? 'checked' : ''} /> ${x}</label>
                `).join('')}
              </div>
              <p class="text-muted" style="font-size:0.85rem;">12.3 Left handed</p>
              <div style="font-size:0.9rem;">
                <label style="margin-right:1rem;"><input type="radio" name="enroll-left-handed" value="Yes" ${(p.physicalAttributes && p.physicalAttributes.leftHanded === 'Yes') ? 'checked' : ''} /> Yes</label>
                <label><input type="radio" name="enroll-left-handed" value="No" ${!(p.physicalAttributes && p.physicalAttributes.leftHanded === 'Yes') ? 'checked' : ''} /> No</label>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">8. Siblings detail</h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Age, sex, and whether in school or out of school (up to 6 rows).</p>
              <div style="overflow-x:auto;">
                <table class="eccd-table" style="width:100%;font-size:0.88rem;">
                  <thead>
                    <tr>
                      <th>Age</th>
                      <th>Sex</th>
                      <th>Education</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[0,1,2,3,4,5].map(i => {
                      const row = (p.siblingsDetail && p.siblingsDetail[i]) || {};
                      return `<tr>
                        <td><input type="number" class="ecc-field-input sib-age" min="0" max="30" value="${row.age != null ? row.age : ''}" style="min-width:70px;" /></td>
                        <td>
                          <select class="ecc-field-input sib-sex">
                            <option value="">—</option>
                            <option value="Male" ${row.sex === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${row.sex === 'Female' ? 'selected' : ''}>Female</option>
                          </select>
                        </td>
                        <td>
                          <select class="ecc-field-input sib-edu">
                            <option value="">—</option>
                            <option value="In School" ${row.education === 'In School' ? 'selected' : ''}>In School</option>
                            <option value="Out of School" ${row.education === 'Out of School' ? 'selected' : ''}>Out of School</option>
                          </select>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">9. Prior early childhood experience</h3>
              ${['Nursery','Kindergarten','Preparatory'].map(level => {
                const key = level.toLowerCase();
                const selected = (p.priorEce && p.priorEce[key]) || [];
                const opts = ['Private Pre-School','Public Pre-School','Private Day Care','Public Day Care','Church-based','Home-based','Others'];
                return `
                  <p style="font-weight:600;margin:0.75rem 0 0.35rem;">${level}</p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;font-size:0.88rem;">
                    ${opts.map(o => `
                      <label><input type="checkbox" class="enroll-ece-${key}" value="${o}" ${selected.includes(o) ? 'checked' : ''} /> ${o}</label>
                    `).join('')}
                  </div>`;
              }).join('')}
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">10. Transportation &amp; accompaniment</h3>
              <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Public transportation (check all that apply)</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;margin-bottom:1rem;font-size:0.88rem;">
                ${['School bus','Jeep','Bus','Banca','Calesa','Tricycle','Pedicab','Habal-Habal','Others'].map(x => `
                  <label><input type="checkbox" class="enroll-transport" value="${x}" ${(p.transport || []).includes(x) ? 'checked' : ''} /> ${x}</label>
                `).join('')}
              </div>
              <p class="text-muted" style="font-size:0.85rem;">Goes to school with</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;font-size:0.88rem;">
                ${['Mother','Father','Both Parents','Siblings','Relatives','Grandparents','Maid','None'].map(x => `
                  <label><input type="checkbox" class="enroll-accompany" value="${x}" ${(p.accompanies || []).includes(x) ? 'checked' : ''} /> ${x}</label>
                `).join('')}
              </div>
            </div>

            <div class="card" style="margin-bottom:1rem;">
              <h3 style="margin-top:0;">11. Form sign-off</h3>
              <div class="profile-grid">
                <div>
                  <label class="ecc-field-label">Name of respondent</label>
                  <input type="text" id="enroll-respondent" class="ecc-field-input" value="${this._escAttr((p.profileMeta && p.profileMeta.respondent) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Name of CDT</label>
                  <input type="text" id="enroll-cdt" class="ecc-field-input" value="${this._escAttr((p.profileMeta && p.profileMeta.cdtName) || '')}" />
                </div>
                <div>
                  <label class="ecc-field-label">Date conducted</label>
                  <input type="date" id="enroll-conducted" class="ecc-field-input" value="${this._escAttr((p.profileMeta && p.profileMeta.dateConducted) || '')}" />
                </div>
              </div>
            </div>

            <p id="enroll-error" style="color:#d32f2f;display:none;margin:0 0 0.5rem;"></p>
          </div>
          <div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherChildren.closeModal()">Cancel</button>
            
            <button class="btn btn-blue" onclick="TeacherChildren.saveEnrollment()">${isEdit ? '💾 Save changes' : '💾 Save enrollment'}</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    this._bindModalDismiss();
    this._onBirthChange();
    // Edit profile: recompute age from stored DOB immediately
    if (isEdit) setTimeout(function () { TeacherChildren._onBirthChange(); }, 0);
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

  /** Checked values for a class selector (e.g. .enroll-transport). */
  _readChecked(sel) {
    return Array.from(document.querySelectorAll(sel + ':checked')).map(el => el.value);
  },

  _readRadio(name) {
    const el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  },

  /**
   * Mother (prefix m) / Father (prefix f) profile fields on enroll form.
   */
  _readParentProfile(prefix) {
    const g = (id) => {
      const el = document.getElementById(prefix + '-' + id);
      return el && el.value != null ? String(el.value).trim() : '';
    };
    let occupation = this._readRadio(prefix + '-occup');
    const occupationOther = g('occup-other');
    if (!occupation && occupationOther) occupation = 'Others';
    const profile = {
      lastName: g('last'),
      firstName: g('first'),
      middleInitial: g('middle'),
      birthDate: g('birth'),
      age: g('age'),
      civilStatus: this._readRadio(prefix + '-civil'),
      education: this._readRadio(prefix + '-edu'),
      occupation,
      occupationOther,
      motherTongue: g('tongue'),
      otherDialects: g('dialects'),
      district: g('district'),
      purok: g('purok')
    };
    if (prefix === 'm') {
      profile.pregnant = this._readRadio('m-pregnant') || '';
    }
    return profile;
  },

  _readPhysical() {
    const left = document.querySelector('input[name="enroll-left-handed"]:checked');
    return {
      deformities: this._readChecked('.enroll-deformity'),
      problems: this._readChecked('.enroll-problem'),
      leftHanded: left ? left.value : 'No'
    };
  },

  _readSiblingsDetail() {
    // Form uses .sib-age / .sib-sex / .sib-edu (not enroll-sib-*)
    const ages = document.querySelectorAll('.sib-age');
    const sexes = document.querySelectorAll('.sib-sex');
    const edus = document.querySelectorAll('.sib-edu');
    const rows = [];
    const n = Math.max(ages.length, sexes.length, edus.length);
    for (let i = 0; i < n; i++) {
      const age = ages[i] && ages[i].value != null ? String(ages[i].value).trim() : '';
      const sex = sexes[i] && sexes[i].value != null ? String(sexes[i].value).trim() : '';
      const education = edus[i] && edus[i].value != null ? String(edus[i].value).trim() : '';
      if (age || sex || education) {
        rows.push({ age, sex, education });
      }
    }
    return rows;
  },

  _readPriorEce() {
    return {
      nursery: this._readChecked('.enroll-ece-nursery'),
      kindergarten: this._readChecked('.enroll-ece-kindergarten'),
      preparatory: this._readChecked('.enroll-ece-preparatory')
    };
  },

  /**
   * Simulate approving an online application → autofill the form (future flow).
   */
  /** @deprecated Demo helper — not shown in UI. Kept for local dev only. */
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

  async saveEnrollment() {
    const errEl = document.getElementById('enroll-error');
    const showErr = (msg) => {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = msg;
        try { errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
      }
      console.warn('[BrightSteps] enroll save:', msg);
    };

    const vaxVal = (key) => {
      const el = document.querySelector('input[name="enroll-vax-' + key + '"]:checked');
      return el ? el.value : '';
    };
    const regEl = document.querySelector('input[name="enroll-registered"]:checked');
    let name = (document.getElementById('enroll-name') || {}).value;
    const lastName = (document.getElementById('enroll-last') || {}).value;
    const firstName = (document.getElementById('enroll-first') || {}).value;
    const middleInitial = (document.getElementById('enroll-middle') || {}).value;
    if (!name || !String(name).trim()) {
      name = [firstName, middleInitial, lastName].filter(Boolean).join(' ').trim();
    }

    const data = {
      name,
      lastName,
      firstName,
      middleInitial,
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
      registered: regEl ? regEl.value : 'No',
      bornAt: (document.getElementById('enroll-born-at') || {}).value,
      motherTongue: (document.getElementById('enroll-tongue') || {}).value,
      motherTongueOther: (document.getElementById('enroll-tongue-other') || {}).value,
      otherDialects: (document.getElementById('enroll-dialects') || {}).value,
      documents: {
        eccdCard: !!(document.getElementById('enroll-doc-eccd') || {}).checked,
        motherChildBook: !!(document.getElementById('enroll-doc-mcb') || {}).checked,
        other: (document.getElementById('enroll-doc-other') || {}).value || '',
        files: (typeof FileAttach !== 'undefined' ? FileAttach.getDocs('enroll') : [])
      },
      photo: (typeof FileAttach !== 'undefined' ? FileAttach.getPhoto('enroll') : null),
      vaccines: {
        BCG: vaxVal('BCG'),
        DPT: vaxVal('DPT'),
        OralPolio: vaxVal('OralPolio'),
        HepaB: vaxVal('HepaB'),
        Measles: vaxVal('Measles'),
        Others: vaxVal('Others')
      },
      motherProfile: TeacherChildren._readParentProfile('m'),
      fatherProfile: TeacherChildren._readParentProfile('f'),
      physicalAttributes: TeacherChildren._readPhysical(),
      siblingsDetail: TeacherChildren._readSiblingsDetail(),
      priorEce: TeacherChildren._readPriorEce(),
      transport: TeacherChildren._readChecked('.enroll-transport'),
      accompanies: TeacherChildren._readChecked('.enroll-accompany'),
      profileMeta: {
        respondent: (document.getElementById('enroll-respondent') || {}).value || '',
        cdtName: (document.getElementById('enroll-cdt') || {}).value || '',
        dateConducted: (document.getElementById('enroll-conducted') || {}).value || ''
      },
      applicationId: (document.getElementById('enroll-application-id') || {}).value || null
    };
    // Update siblings count from detail rows if count empty
    if ((data.siblings === '' || data.siblings == null) && data.siblingsDetail && data.siblingsDetail.length) {
      data.siblings = data.siblingsDetail.length;
    }
    // Sync mother/father display names from profiles if blank
    if ((!data.motherName || !String(data.motherName).trim()) && data.motherProfile) {
      const mp = data.motherProfile;
      data.motherName = [mp.firstName, mp.middleInitial, mp.lastName].filter(Boolean).join(' ').trim();
    }
    if ((!data.fatherName || !String(data.fatherName).trim()) && data.fatherProfile) {
      const fp = data.fatherProfile;
      data.fatherName = [fp.firstName, fp.middleInitial, fp.lastName].filter(Boolean).join(' ').trim();
    }
    if ((!data.parentName || !String(data.parentName).trim())) {
      data.parentName = data.motherName || data.fatherName || '';
    }
    // immunizations summary for health store
    const vaxDone = Object.keys(data.vaccines).filter(k => data.vaccines[k] === 'Yes');
    data.immunizations = vaxDone.length ? ('Yes: ' + vaxDone.join(', ')) : '';

    const source = (document.getElementById('enroll-source') || {}).value || 'walk_in';

    if (!data.name || !String(data.name).trim()) {
      showErr('Child’s name is required.');
      return;
    }
    if (!data.birthDate) {
      showErr('Date of birth is required.');
      return;
    }
    const editIdEarly = (document.getElementById('enroll-edit-id') || {}).value || '';
    const isEditSave = !!(editIdEarly);
    if (!isEditSave && data.applicationId && typeof ApplicationStore !== 'undefined') {
      const app = ApplicationStore.get(data.applicationId);
      if (app && app.status === 'enrolled') {
        showErr('This application is already enrolled (Child ID: ' + (app.enrolledChildCode || '—') + '). Use the existing child instead of saving again.');
        return;
      }
    }
    if (!isEditSave && data.applicationId && typeof SampleChildren !== 'undefined') {
      const existingAppChild = SampleChildren.find(c =>
        c.applicationId && String(c.applicationId) === String(data.applicationId)
      );
      if (existingAppChild) {
        showErr('A child was already created from this application: ' +
          (existingAppChild.name || '') + ' (' + (existingAppChild.childCode || '') + ').');
        return;
      }
    }
    if (typeof ChildRegistry !== 'undefined' && ChildRegistry.ageFromBirthDate) {
      const age = ChildRegistry.ageFromBirthDate(data.birthDate);
      data.ageMonths = age.ageMonths;
      data.ageLabel = age.ageLabel || data.ageLabel;
      if (ChildRegistry.recordTypeFromAgeMonths) {
        data.recordType = ChildRegistry.recordTypeFromAgeMonths(age.ageMonths);
      }
    }
    if (data.middleInitial != null) {
      data.middleInitial = String(data.middleInitial).replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();
    }
    if (!data.parentName && !data.motherName && !data.fatherName) {
      showErr('Enter at least one parent / guardian name.');
      return;
    }

    const editId = (document.getElementById('enroll-edit-id') || {}).value;
    const isEdit = !!(editId && String(editId).trim());

    // Explicit photo remove → do not restore previous
    const photoCleared = typeof FileAttach !== 'undefined' && FileAttach.wasPhotoCleared('enroll');
    if (photoCleared) data.photo = null;

    let result;
    this._enrollSaving = true;
    const saveBtns = document.querySelectorAll('#bs-modal-overlay button.btn-blue');
    saveBtns.forEach(function (b) { b.disabled = true; b.dataset._prevLabel = b.textContent; b.textContent = 'Saving…'; });
    try {
      if (isEdit) {
        result = ChildRegistry.updateFromForm(editId, data, {
          source,
          applicationId: data.applicationId,
          keepPhoto: !photoCleared,
          keepDocs: true
        });
        if (result && result.ok && typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
          ChildrenRemote.update(editId, result.child).then(function (r) {
            if (!r.ok) console.warn('[Children] remote update failed', r.error);
          });
        }
      } else if (typeof ChildRegistry.enrollAsync === 'function') {
        result = await ChildRegistry.enrollAsync(data, { source, applicationId: data.applicationId });
      } else {
        result = ChildRegistry.enroll(data, { source, applicationId: data.applicationId });
      }
    } catch (err) {
      console.error('saveEnrollment', err);
      this._enrollSaving = false;
      saveBtns.forEach(function (b) { b.disabled = false; b.textContent = b.dataset._prevLabel || 'Save'; });
      showErr((err && err.message) ? err.message : 'Unexpected error while saving.');
      return;
    }

    if (!result || !result.ok) {
      this._enrollSaving = false;
      saveBtns.forEach(function (b) { b.disabled = false; b.textContent = b.dataset._prevLabel || 'Save'; });
      showErr((result && result.error) || (isEdit ? 'Could not save changes.' : 'Could not save enrollment.'));
      return;
    }
    this._enrollSaving = false;

    const child = result.child;

    // Health: seed on enroll; on edit update profile + optional new measurement if H/W given
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
          notes: isEdit ? 'Updated from profile edit' : 'Recorded at enrollment',
          recordedBy: isEdit ? 'Teacher (profile edit)' : 'Teacher (enrollment)'
        });
      }
      if (data.allergies || data.medicalConditions || data.immunizations || data.vaccines) {
        HealthStore.saveProfile(child.id, {
          allergies: data.allergies || '',
          medicalConditions: data.medicalConditions || '',
          immunizations: data.immunizations || '',
          vaccines: data.vaccines || null,
          notes: isEdit ? 'Updated from profile edit' : 'From enrollment'
        });
      }
    }

    this.closeModal();
    this._draw();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = isEdit
      ? ('Updated ' + child.name + ' (' + child.childCode + ')')
      : ('Enrolled ' + child.name + ' (' + child.childCode + ')');
    if (result.strippedAttachments) {
      toast.textContent += ' · Large files were skipped (browser storage limit).';
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);

    // Complete online application → enrolled + show parent login credentials
    if (typeof ActivityStore !== 'undefined') ActivityStore.notifyChanged();
    if (!isEdit && data.applicationId && typeof ApplicationStore !== 'undefined') {
      ApplicationStore.updateStatus(data.applicationId, 'enrolled', {
        reviewedBy: 'Teacher Irish',
        enrolledChildId: child.id,
        enrolledChildCode: child.childCode
      });
      window._pendingApplicationEnroll = null;
      if (typeof TeacherApplications !== 'undefined' && TeacherApplications.showCredentials) {
        setTimeout(() => TeacherApplications.showCredentials(data.applicationId), 500);
      }
    }
  },

  showAddChildDemo() {
    this.openAddChild();
  },

  _card(c) {
    const archived = c.archived === true;
    const isSupport = c.status === 'needs_support';
    const statusColor = archived ? '#757575' : (isSupport ? 'var(--orange)' : 'var(--success)');
    const statusText = archived
      ? 'Archived / inactive'
      : (isSupport
        ? `${c.focusArea || 'Area'}: Needs Support`
        : 'Development: On Track');
    const checked = this.selectedIds.map(String).includes(String(c.id)) ? 'checked' : '';

    const actions = archived
      ? `<button class="btn" style="padding:4px 10px;font-size:0.78rem;background:#e8f5e9;color:#2e7d32;"
            onclick="TeacherChildren.confirmRestore(['${c.id}'])">↩ Restore</button>
          <button class="btn" style="padding:4px 10px;font-size:0.78rem;background:#ffebee;color:#c62828;"
            onclick="TeacherChildren.confirmPermanentDelete(['${c.id}'])">🗑 Delete permanently</button>`
      : `<button class="btn" style="padding:4px 10px;font-size:0.78rem;background:#e8f5e9;color:#2e7d32;"
            onclick="TeacherChildren.openEditChild('${c.id}')">Edit</button>
          <button class="btn" style="padding:4px 10px;font-size:0.78rem;"
            onclick="TeacherChildren.openTransfer(['${c.id}'])">Transfer</button>
          <button class="btn" style="padding:4px 10px;font-size:0.78rem;background:#fff3e0;color:#e65100;"
            onclick="TeacherChildren.confirmArchive(['${c.id}'])">📦 Archive</button>`;

    return `
      <div class="card child-card" style="position:relative;${archived ? 'opacity:0.92;border-style:dashed;' : ''}">
        <label style="position:absolute;top:10px;left:10px;z-index:2;cursor:pointer;"
          onclick="event.stopPropagation();">
          <input type="checkbox" ${checked}
            onchange="TeacherChildren.toggleSelect('${c.id}', this.checked)"
            title="Select for bulk actions" />
        </label>
        <div onclick="TeacherChildren.openProfile('${c.id}')" style="cursor:pointer;padding-left:1.4rem;">
          <div class="child-card-avatar-row">
            ${(typeof FileAttach !== 'undefined' ? FileAttach.avatarHtml(c, 44) : (c.sex === 'Female' ? '👧' : '👦'))}
            <div style="min-width:0;flex:1;">
              <div class="flex justify-between items-center" style="margin-bottom:0.15rem;">
                <strong style="font-size:1.05rem; color:var(--text);">${c.name}</strong>
                ${archived ? '<span style="font-size:0.72rem;background:#eceff1;color:#546e7a;padding:0.15rem 0.45rem;border-radius:999px;">Archived</span>' : ''}
              </div>
              <div style="color:var(--muted); font-size:0.92rem; margin-bottom:0.35rem;">
                ${c.ageLabel || ''} • ${c.section || ''}
              </div>
              <span style="color:${statusColor}; font-weight:600; font-size:0.9rem;">${statusText}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:0.35rem;margin-top:0.75rem;padding-top:0.5rem;border-top:1px solid var(--border);flex-wrap:wrap;"
          onclick="event.stopPropagation();">
          ${actions}
        </div>
      </div>
    `;
  },

  _bulkBarHtml(visibleChildren) {
    const n = this.selectedIds.length;
    const archivedMode = this.listMode === 'archived';
    if (!n) {
      return `
        <div class="card" style="margin-bottom:1rem;padding:0.75rem 1rem;background:#fafafa;">
          <p class="text-muted" style="margin:0;font-size:0.88rem;">
            ${archivedMode
              ? 'Select archived children to <strong>restore</strong> them to the active list.'
              : 'Select children to <strong>transfer class</strong> or <strong>archive</strong> (soft-delete). Records stay available under Archived.'}
          </p>
        </div>`;
    }
    return `
      <div class="card" style="margin-bottom:1rem;border-left:4px solid var(--primary);padding:0.85rem 1rem;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;">
          <strong>${n} selected</strong>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${archivedMode
              ? `<button class="btn" style="background:#e8f5e9;color:#2e7d32;" onclick="TeacherChildren.confirmRestore(TeacherChildren.selectedIds.slice())">↩ Restore</button>
                 <button class="btn" style="background:#ffebee;color:#c62828;" onclick="TeacherChildren.confirmPermanentDelete(TeacherChildren.selectedIds.slice())">🗑 Delete permanently</button>`
              : `<button class="btn btn-blue" onclick="TeacherChildren.openTransfer(TeacherChildren.selectedIds.slice())">⇄ Transfer class</button>
                 <button class="btn" style="background:#fff3e0;color:#e65100;" onclick="TeacherChildren.confirmArchive(TeacherChildren.selectedIds.slice())">📦 Archive</button>`}
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherChildren.clearSelection()">Clear</button>
          </div>
        </div>
      </div>`;
  },

  toggleSelect(id, on) {
    const sid = String(id);
    if (on) {
      if (!this.selectedIds.map(String).includes(sid)) this.selectedIds.push(id);
    } else {
      this.selectedIds = this.selectedIds.filter(x => String(x) !== sid);
    }
    this._draw();
  },

  clearSelection() {
    this.selectedIds = [];
    this._draw();
  },

  openTransfer(ids) {
    if (!ids || !ids.length) {
      alert('Select at least one child.');
      return;
    }
    this.closeModal();
    const classOpts = (typeof ClassStore !== 'undefined' ? ClassStore.options(false) : [
      { key: 'explorers', label: 'Little Explorers (0–3 yrs)' },
      { key: 'stars', label: 'Little Stars (3–4 yrs)' },
      { key: 'sunshine', label: 'Sunshine Group (4–5 yrs)' }
    ]).map(s => `<option value="${s.key}">${s.label}</option>`).join('');

    const names = ids.map(id => {
      const c = SampleChildren.find(x => x.id === id || String(x.id) === String(id));
      return c ? c.name : id;
    });

    const html = `
      <div id="bs-modal-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:480px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.2rem;color:white;">Transfer class</h2>
            <button class="bs-modal-close" onclick="TeacherChildren.closeModal()">×</button>
          </div>
          <div class="bs-modal-body">
            <p style="margin-top:0;">Move <strong>${ids.length}</strong> child(ren) to another class:</p>
            <p class="text-muted" style="font-size:0.88rem;">${names.join(', ')}</p>
            <label class="ecc-field-label">New class / section</label>
            <select id="transfer-section" class="ecc-field-input">${classOpts}</select>
            <p id="transfer-error" style="color:#d32f2f;display:none;margin:0.5rem 0 0;"></p>
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherChildren.closeModal()">Cancel</button>
            <button class="btn btn-blue" onclick="TeacherChildren.applyTransfer([${ids.map(id => typeof id === 'string' ? `'${id}'` : id).join(',')}])">Transfer</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this._bindModalDismiss();
  },

  async applyTransfer(ids) {
    const sectionKey = (document.getElementById('transfer-section') || {}).value;
    const err = document.getElementById('transfer-error');
    if (!sectionKey) {
      if (err) { err.style.display = 'block'; err.textContent = 'Choose a class.'; }
      return;
    }
    const result = ChildRegistry.transferToClass(ids, sectionKey);
    if (!result.ok) {
      if (err) { err.style.display = 'block'; err.textContent = result.error || 'Transfer failed.'; }
      return;
    }
    // Wait for server write so refresh/poll does not revert the class
    if (typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online() && ChildrenRemote.update) {
      for (let i = 0; i < (ids || []).length; i++) {
        const id = ids[i];
        const child = (typeof SampleChildren !== 'undefined')
          ? SampleChildren.find(c => String(c.id) === String(id))
          : null;
        if (child) {
          try {
            const r = await ChildrenRemote.update(child.id, child);
            if (!r.ok) console.warn('[Transfer] remote failed', r.error);
          } catch (e) {
            console.warn('[Transfer] remote error', e);
          }
        }
      }
    }
    this.selectedIds = [];
    this.closeModal();
    this._draw();
    const label = (typeof ChildRegistry !== 'undefined' && ChildRegistry.sectionFromKey)
      ? ChildRegistry.sectionFromKey(sectionKey) : sectionKey;
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Transferred ' + result.count + ' child(ren) to ' + label;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2800);
  },

  confirmArchive(ids) {
    if (!ids || !ids.length) {
      alert('Select at least one child.');
      return;
    }
    const names = ids.map(id => {
      const c = SampleChildren.find(x => x.id === id || String(x.id) === String(id));
      return c ? c.name : id;
    });
    if (!confirm(
      'Archive ' + ids.length + ' child(ren)?\n\n' + names.join(', ') + '\n\n' +
      'They leave Active lists (attendance, development, health, feeding).\n' +
      'Profile and history (checklist, attendance, health) are KEPT.\n' +
      'You can restore them later from Archived.'
    )) {
      return;
    }
    const result = ChildRegistry.archiveChildren(ids);
    this.selectedIds = this.selectedIds.filter(id => !ids.map(String).includes(String(id)));
    this.closeModal();
    this._draw();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Archived ' + result.count + ' child(ren)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  },

  confirmRestore(ids) {
    if (!ids || !ids.length) {
      alert('Select at least one child.');
      return;
    }
    const names = ids.map(id => {
      const c = SampleChildren.find(x => x.id === id || String(x.id) === String(id));
      return c ? c.name : id;
    });
    if (!confirm(
      'Restore ' + ids.length + ' child(ren) to Active?\n\n' + names.join(', ') + '\n\n' +
      'Their profile and past records stay the same as before archiving.'
    )) {
      return;
    }
    const result = ChildRegistry.restoreChildren(ids);
    this.selectedIds = this.selectedIds.filter(id => !ids.map(String).includes(String(id)));
    this.closeModal();
    this.listMode = 'active';
    this._draw();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Restored ' + result.count + ' child(ren)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  },

  /**
   * Permanent delete — double confirmation. Irreversible.
   */
  confirmPermanentDelete(ids) {
    if (!ids || !ids.length) {
      alert('Select at least one child.');
      return;
    }
    const names = ids.map(id => {
      const c = SampleChildren.find(x => x.id === id || String(x.id) === String(id));
      return c ? c.name : String(id);
    });
    if (!confirm(
      '⚠ PERMANENT DELETE\n\n' +
      'You are about to permanently remove:\n' + names.join(', ') + '\n\n' +
      'This cannot be undone.\n' +
      'The child record and related data in the database will be deleted.\n\n' +
      'Prefer Archive if you only need them inactive.'
    )) {
      return;
    }
    if (!confirm(
      'Final confirmation\n\n' +
      'Type OK in the next step is not required, but this is your last chance.\n\n' +
      'Delete permanently: ' + names.join(', ') + '?'
    )) {
      return;
    }
    const result = ChildRegistry.permanentDeleteChildren
      ? ChildRegistry.permanentDeleteChildren(ids)
      : ChildRegistry.removeChildren(ids);
    this.selectedIds = this.selectedIds.filter(id => !ids.map(String).includes(String(id)));
    this.closeModal();
    this._draw();
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = 'Permanently deleted ' + result.count + ' child(ren)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },



  _credentialsTable(children) {
    const rows = children.map(c => {
      const guardian = c.parentLoginName || c.parentName || '—';
      const code = c.childCode || '—';
      const phone = c.contactPhone || c.phone || c.motherContact || c.fatherContact || '—';
      const hasPass = !!(c.parentPassword && String(c.parentPassword).length);
      const status = c.archived ? '<span style="color:#757575;">Archived</span>' : '<span class="success-text">Active</span>';
      const idAttr = String(c.id).replace(/'/g, "\\'");
      return '<tr>' +
        '<td><strong>' + (c.name || '—') + '</strong>' +
        '<div class="text-muted" style="font-size:0.8rem;">' + (c.section || c.sectionKey || '') + '</div></td>' +
        '<td><code>' + code + '</code></td>' +
        '<td>' + guardian + '</td>' +
        '<td>' + (hasPass ? 'Set by parent' : 'None (name + Child ID only)') + '</td>' +
        '<td>' + phone + '</td>' +
        '<td>' + status + '</td>' +
        '<td style="white-space:nowrap;">' +
        '<button type="button" class="btn" style="padding:4px 10px;font-size:0.78rem;background:#e3f2fd;color:#1565c0;" ' +
        'onclick="TeacherChildren.showCredentialSlip(\'' + idAttr + '\')">View / copy</button></td></tr>';
    }).join('');
    return (
      '<div class="card" style="padding:0;overflow:auto;">' +
      '<table class="eccd-table" style="margin:0;font-size:0.9rem;">' +
      '<thead><tr><th>Child</th><th>Child ID</th><th>Guardian login name</th><th>Password</th><th>Contact</th><th>Status</th><th></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>'
    );
  },

  showCredentialSlip(childId) {
    const child = (typeof SampleChildren !== 'undefined')
      ? SampleChildren.find(c => String(c.id) === String(childId))
      : null;
    if (!child) {
      alert('Child not found.');
      return;
    }
    const guardian = child.parentLoginName || child.parentName || '—';
    const code = child.childCode || '—';
    const phone = child.contactPhone || child.phone || '—';
    const portalUrl = (typeof location !== 'undefined' && location.origin) ? location.origin : 'BrightSteps';
    const msg = 'NCDC Medina BrightSteps: ' + (child.name || 'Your child') +
      ' is enrolled. Parent portal — Guardian name: ' + guardian +
      ', Child ID: ' + code +
      '. Open ' + portalUrl + ' → Parent / Guardian. Optional password can be set later in Settings.';
    const prev = document.getElementById('child-cred-overlay');
    if (prev) prev.remove();
    const html =
      '<div id="child-cred-overlay" class="bs-overlay">' +
      '<div class="bs-modal-panel" style="max-width:540px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.2rem;color:white;">Parent login details</h2>' +
      '<button class="bs-modal-close" onclick="document.getElementById(\'child-cred-overlay\').remove()">×</button>' +
      '</div><div class="bs-modal-body">' +
      '<p style="margin-top:0;">Share with the guardian via <strong>Facebook Messenger</strong> (manual send).</p>' +
      '<div class="card" style="background:var(--primary-light);margin:0;">' +
      '<p style="margin:0.35rem 0;"><strong>Child:</strong> ' + (child.name || '—') + '</p>' +
      '<p style="margin:0.35rem 0;"><strong>Guardian login name:</strong> ' + guardian + '</p>' +
      '<p style="margin:0.35rem 0;"><strong>Child ID:</strong> ' + code + '</p>' +
      '<p style="margin:0.35rem 0;"><strong>Password:</strong> ' +
      (child.parentPassword ? '(set by parent — do not re-share from teacher screen)' : 'None by default') + '</p>' +
      '<p style="margin:0.35rem 0;"><strong>Contact on file:</strong> ' + phone + '</p>' +
      '<p style="margin:0.35rem 0;"><strong>Status:</strong> ' + (child.archived ? 'Archived' : 'Active') + '</p>' +
      '</div>' +
      '<p style="margin-top:1rem;font-size:0.88rem;" class="text-muted">Message template:</p>' +
      '<textarea id="child-cred-msg" class="ecc-field-input" rows="4" readonly style="font-size:0.88rem;">' +
      msg.replace(/</g, '&lt;') + '</textarea></div>' +
      '<div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">' +
      '<button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById(\'child-cred-overlay\').remove()">Close</button>' +
      '<button type="button" class="btn btn-blue" onclick="TeacherChildren.copyCredentialMessage()">📋 Copy message</button>' +
      '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  },

  copyCredentialMessage() {
    const el = document.getElementById('child-cred-msg');
    if (!el) return;
    const text = el.value || '';
    const done = function () {
      const toast = document.createElement('div');
      toast.className = 'ecc-toast';
      toast.textContent = 'Copied — paste into Messenger.';
      document.body.appendChild(toast);
      setTimeout(function () { toast.remove(); }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        el.select();
        try { document.execCommand('copy'); } catch (e) {}
        done();
      });
    } else {
      el.select();
      try { document.execCommand('copy'); } catch (e) {}
      done();
    }
  },

  /* ---------- Profile modal ---------- */

  openProfile(id) {
    const child = SampleChildren.find(c => String(c.id) === String(id));
    if (!child) {
      console.warn('[Children] openProfile: child not found', id);
      return;
    }
    this.closeModal();

    const paint = function () {
      TeacherChildren._renderProfileModal(child);
    };
    const jobs = [];
    if (String(child.id).length > 20) {
      if (typeof HealthStore !== 'undefined' && HealthStore.hydrateForChild) {
        jobs.push(HealthStore.hydrateForChild(child.id).catch(function () {}));
      }
      if (typeof AttendanceStore !== 'undefined' && AttendanceStore.hydrateForChild) {
        jobs.push(AttendanceStore.hydrateForChild(child.id).catch(function () {}));
      }
    }
    if (jobs.length) {
      Promise.all(jobs).then(paint).catch(paint);
      return;
    }
    paint();
  },

  _renderProfileModal(child) {
    const statusColor = child.status === 'needs_support' ? 'var(--orange)' : 'var(--success)';
    const statusText = child.status === 'needs_support'
      ? `${child.focusArea || 'Area'}: Needs Support`
      : 'On Track';

    const html = `
      <div id="bs-modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div style="background:white;width:95%;max-width:960px;border-radius:16px;max-height:94vh;display:flex;flex-direction:column;overflow:hidden;">

          <div style="padding:1.25rem 1.5rem;background:var(--primary);color:white;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;gap:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.85rem;min-width:0;">
              ${(typeof FileAttach !== 'undefined' ? FileAttach.avatarHtml(child, 56) : '')}
              <div style="min-width:0;">
                <h2 style="margin:0;font-size:1.35rem;color:white;">${child.name}</h2>
                <div style="opacity:0.9;font-size:0.9rem;margin-top:2px;">${child.ageLabel} • ${child.section}</div>
              </div>
            </div>
            <button onclick="TeacherChildren.closeModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;line-height:1;">×</button>
          </div>

          <div class="child-tabs-bar" style="flex-shrink:0;overflow-x:auto;">
            <button class="child-tab active" data-tab="overview" onclick="TeacherChildren.switchTab(this,'overview')">Overview</button>
            <button class="child-tab" data-tab="profile" onclick="TeacherChildren.switchTab(this,'profile')">ECCD Profile</button>
            <button class="child-tab" data-tab="development" onclick="TeacherChildren.switchTab(this,'development')">Development</button>
            <button class="child-tab" data-tab="attendance" onclick="TeacherChildren.switchTab(this,'attendance')">Attendance</button>
            <button class="child-tab" data-tab="health" onclick="TeacherChildren.switchTab(this,'health')">Health</button>
          </div>

          <div id="child-modal-body" style="padding:1.5rem 1.75rem;overflow-y:auto;flex:1;">
            ${this._tabOverview(child, statusColor, statusText)}
          </div>

          <div class="no-print" style="padding:1rem 1.5rem;border-top:1px solid var(--border);background:#fafafa;display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;flex-shrink:0;">
            ${child.archived
              ? `<button class="btn" style="background:#e8f5e9;color:#2e7d32;" onclick="TeacherChildren.confirmRestore(['${child.id}'])">↩ Restore to active</button>
                 <button class="btn" style="background:#ffebee;color:#c62828;" onclick="TeacherChildren.confirmPermanentDelete(['${child.id}'])">🗑 Delete permanently</button>`
              : `<button class="btn" style="background:#e8f5e9;color:#2e7d32;" onclick="TeacherChildren.closeModal();TeacherChildren.openEditChild('${child.id}')">✏️ Edit profile</button>
            <button class="btn" style="background:#e3f2fd;color:#1565c0;" onclick="TeacherChildren.closeModal();TeacherChildren.openTransfer(['${child.id}'])">⇄ Transfer class</button>
            <button class="btn" style="background:#fff3e0;color:#e65100;" onclick="TeacherChildren.confirmArchive(['${child.id}'])">📦 Archive</button>`}
            <button class="btn" style="background:#fff8e1;color:#f57f17;" onclick="TeacherChildren.printEccdForms()">🖨 Print ECCD forms</button>
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
          <button class="btn btn-blue" onclick="TeacherChildren.goModule('development', '${child.id}', true)">📈 Open Development Tracking</button>
          <button class="btn" onclick="TeacherChildren.goModule('attendance', '${child.id}')">📅 Attendance</button>
          <button class="btn" onclick="TeacherChildren.goModule('health', '${child.id}', true)">❤️ Health Records</button>
        </div>
      </div>
    `;
  },

  _tabProfile(child) {
    const a = child.address || {};
    const docs = child.documents || {};
    const vax = child.vaccines || {};
    const vaxRows = ['BCG', 'DPT', 'OralPolio', 'HepaB', 'Measles', 'Others'].map(k => {
      const label = k === 'OralPolio' ? 'Oral Polio' : (k === 'HepaB' ? 'Hepa B' : k);
      return `<tr><td style="padding:0.3rem 0.5rem;font-weight:600;">${label}</td>
        <td style="padding:0.3rem 0.5rem;">${vax[k] || '—'}</td></tr>`;
    }).join('');
    const nameParts = [child.lastName, child.firstName, child.middleInitial].filter(Boolean).join(' / ') || '—';

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">ECCD Child Profile — Personal</h3>
        <p class="text-muted" style="font-size:0.85rem;">Phase A fields from enrollment. Full edit in later phases.</p>
        <div class="profile-grid" style="font-size:0.95rem;">
          <div><span class="text-muted">Display name</span><div><strong>${child.name}</strong></div></div>
          <div><span class="text-muted">Last / First / M.I.</span><div>${nameParts}</div></div>
          <div><span class="text-muted">Sex</span><div>${child.sex}</div></div>
          <div><span class="text-muted">Date of birth</span><div>${child.birthDate || '—'} (${child.ageLabel})</div></div>
          <div><span class="text-muted">Birth order</span><div>${child.birthOrder || '—'}</div></div>
          <div><span class="text-muted">Registered</span><div>${child.registered ? 'Yes' : 'No'}</div></div>
          <div><span class="text-muted">Born at</span><div>${child.bornAt || '—'}</div></div>
          <div><span class="text-muted">Mother tongue</span><div>${child.motherTongue || '—'}${child.motherTongueOther ? ' (' + child.motherTongueOther + ')' : ''}</div></div>
          <div><span class="text-muted">Other dialects</span><div>${child.otherDialects || '—'}</div></div>
          <div><span class="text-muted">Documents on file</span><div>
            ${docs.eccdCard ? 'ECCD Card · ' : ''}${docs.motherChildBook ? 'Mother & Child book · ' : ''}${docs.other || '—'}
          </div></div>
        </div>
        <div style="margin-top:0.85rem;">
          <span class="text-muted" style="font-size:0.88rem;">Digital attachments (optional)</span>
          ${(typeof FileAttach !== 'undefined' ? FileAttach.docsListHtml(docs) : '')}
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Vaccination</h3>
        <table style="width:100%;max-width:360px;border-collapse:collapse;font-size:0.9rem;">
          <tbody>${vaxRows || '<tr><td class="text-muted">No vaccine data recorded</td></tr>'}</tbody>
        </table>
      </div>
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Family &amp; address</h3>
        <div class="profile-grid">
          <div><span class="text-muted">Guardian</span><div>${child.parentName || '—'}</div></div>
          <div><span class="text-muted">Mother</span><div>${child.motherName || '—'}</div></div>
          <div><span class="text-muted">Father</span><div>${child.fatherName || '—'}</div></div>
          <div><span class="text-muted">Siblings (count)</span><div>${child.siblings ?? '—'}</div></div>
          <div><span class="text-muted">Barangay</span><div>${a.barangay || '—'}</div></div>
          <div><span class="text-muted">Municipality</span><div>${a.municipality || '—'}</div></div>
          <div><span class="text-muted">Province</span><div>${a.province || '—'}</div></div>
          <div><span class="text-muted">Region</span><div>${a.region || '—'}</div></div>
        </div>
      </div>
      ${this._parentProfileCard('Mother’s Profile (Form 1.B)', child.motherProfile)}
      ${this._parentProfileCard('Father’s Profile (Form 1.A)', child.fatherProfile)}
      ${this._phaseCCards(child)}
    `;
  },

  _phaseCCards(child) {
    const phys = child.physicalAttributes || {};
    const sibs = child.siblingsDetail || [];
    const ece = child.priorEce || {};
    const transport = child.transport || [];
    const accompanies = child.accompanies || [];
    const meta = child.profileMeta || {};

    const physHtml = `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Physical attributes</h3>
        <p style="margin:0.35rem 0;"><strong>Deformities:</strong> ${(phys.deformities && phys.deformities.length) ? phys.deformities.join(', ') : 'None recorded'}</p>
        <p style="margin:0.35rem 0;"><strong>Problems:</strong> ${(phys.problems && phys.problems.length) ? phys.problems.join(', ') : 'None recorded'}</p>
        <p style="margin:0.35rem 0;"><strong>Left handed:</strong> ${phys.leftHanded || '—'}</p>
      </div>`;

    let sibHtml = '';
    if (sibs.length) {
      const rows = sibs.map(s => `<tr>
        <td style="padding:0.3rem 0.5rem;">${s.age != null ? s.age : '—'}</td>
        <td style="padding:0.3rem 0.5rem;">${s.sex || '—'}</td>
        <td style="padding:0.3rem 0.5rem;">${s.education || '—'}</td>
      </tr>`).join('');
      sibHtml = `
        <div class="card" style="margin-bottom:1rem;">
          <h3 style="margin-top:0;">Siblings detail</h3>
          <table style="width:100%;max-width:420px;border-collapse:collapse;font-size:0.9rem;">
            <thead><tr><th style="text-align:left;padding:0.3rem 0.5rem;">Age</th>
              <th style="text-align:left;padding:0.3rem 0.5rem;">Sex</th>
              <th style="text-align:left;padding:0.3rem 0.5rem;">Education</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    const eceLine = (label, arr) =>
      `<p style="margin:0.35rem 0;"><strong>${label}:</strong> ${(arr && arr.length) ? arr.join(', ') : '—'}</p>`;
    const eceHtml = `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Prior early childhood experience</h3>
        ${eceLine('Nursery', ece.nursery)}
        ${eceLine('Kindergarten', ece.kindergarten)}
        ${eceLine('Preparatory', ece.preparatory)}
      </div>`;

    const moveHtml = `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">Transportation &amp; accompaniment</h3>
        <p style="margin:0.35rem 0;"><strong>Transport:</strong> ${transport.length ? transport.join(', ') : '—'}</p>
        <p style="margin:0.35rem 0;"><strong>Goes with:</strong> ${accompanies.length ? accompanies.join(', ') : '—'}</p>
      </div>`;

    const metaHtml = (meta.respondent || meta.cdtName || meta.dateConducted) ? `
      <div class="card" style="margin-bottom:0;">
        <h3 style="margin-top:0;">Form sign-off</h3>
        <p style="margin:0.35rem 0;"><strong>Respondent:</strong> ${meta.respondent || '—'}</p>
        <p style="margin:0.35rem 0;"><strong>CDT:</strong> ${meta.cdtName || '—'}</p>
        <p style="margin:0.35rem 0;"><strong>Date conducted:</strong> ${meta.dateConducted || '—'}</p>
      </div>` : '';

    return physHtml + sibHtml + eceHtml + moveHtml + metaHtml +
      `<div class="no-print" style="margin-top:0.75rem;">
        <button class="btn" style="background:#fff3e0;color:#e65100;" onclick="TeacherChildren.printEccdForms()">🖨 Print ECCD Child / Mother / Father forms</button>
      </div>`;
  },

  _parentProfileCard(title, profile) {
    if (!profile || !(profile.firstName || profile.lastName || profile.civilStatus || profile.education)) {
      return `<div class="card" style="margin-bottom:1rem;"><h3 style="margin-top:0;">${title}</h3>
        <p class="text-muted" style="margin:0;">No details recorded yet.</p></div>`;
    }
    const name = [profile.firstName, profile.middleInitial, profile.lastName].filter(Boolean).join(' ') || '—';
    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">${title}</h3>
        <div class="profile-grid" style="font-size:0.95rem;">
          <div><span class="text-muted">Name</span><div><strong>${name}</strong></div></div>
          <div><span class="text-muted">DOB / Age</span><div>${profile.birthDate || '—'} ${profile.age ? '(' + profile.age + ')' : ''}</div></div>
          ${profile.pregnant != null ? `<div><span class="text-muted">Pregnant</span><div>${profile.pregnant || '—'}</div></div>` : ''}
          <div><span class="text-muted">Civil status</span><div>${profile.civilStatus || '—'}</div></div>
          <div><span class="text-muted">Address</span><div>${[profile.purok, profile.district].filter(Boolean).join(', ') || '—'}</div></div>
          <div><span class="text-muted">Mother tongue</span><div>${profile.motherTongue || '—'}</div></div>
          <div><span class="text-muted">Other dialects</span><div>${profile.otherDialects || '—'}</div></div>
          <div><span class="text-muted">Education</span><div>${profile.education || '—'}</div></div>
          <div><span class="text-muted">Occupation</span><div>${profile.occupation || '—'}${profile.occupationOther ? ' (' + profile.occupationOther + ')' : ''}</div></div>
          ${profile.daycareAge ? `<div><span class="text-muted">Day care age preference</span><div>${profile.daycareAge}</div></div>` : ''}
        </div>
      </div>`;
  },

  _tabDevelopment(child) {
    const recordLabel = child.recordType === 1
      ? 'ECCD Checklist — Child’s Record 1 (0–36 months)'
      : 'ECCD Checklist — Child’s Record 2 (3+ years)';

    const snap = (typeof UI !== 'undefined' && UI.childDomainSnapshot)
      ? UI.childDomainSnapshot(child.id)
      : [];
    const hasData = snap.some(d => d.percent != null);
    const period = hasData && snap[0] && snap[0].period ? snap[0].period : null;

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
          Domain rings use the child’s latest saved ECCD evaluation (Present items ÷ domain total).
        </p>
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.goModule('development', '${child.id}', true)">
          Open Development Tracking
        </button>
      </div>
      <div class="card" style="margin-bottom:0;">
        <h3>Domain Snapshot</h3>
        ${hasData
          ? `<p class="text-muted" style="margin:0.35rem 0 1rem;font-size:0.88rem;">
               Latest evaluation${period ? ': <strong>' + period + '</strong>' : ''}.
               Percent = items marked Present in that domain.
             </p>`
          : `<p class="text-muted" style="margin:0.35rem 0 1rem;font-size:0.88rem;">
               No saved assessment yet. Encode the ECCD checklist in Development Tracking to fill these rings.
             </p>`}
        ${typeof UI !== 'undefined' ? UI.domainDonutGrid(snap) : ''}
      </div>
    `;
  },

  _tabAttendance(child) {
    const now = new Date();
    const monthPrefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const monthLabel = now.toLocaleString('en', { month: 'long', year: 'numeric' });
    let present = 0, absent = 0, total = 0;
    let recent = [];
    if (typeof AttendanceStore !== 'undefined' && AttendanceStore.listForChild) {
      const rows = AttendanceStore.listForChild(child.id) || [];
      rows.forEach(function (r) {
        if (!(r.date || '').startsWith(monthPrefix)) return;
        total++;
        if (r.status === 'P') present++;
        else if (r.status === 'A') absent++;
      });
      recent = rows.slice(0, 8);
    }
    const rate = total > 0 ? Math.round((present / total) * 100) : null;
    const recentHtml = recent.length
      ? '<ul style="margin:0.5rem 0 0;padding-left:1.2rem;line-height:1.7;font-size:0.9rem;">' +
        recent.map(function (r) {
          const label = r.status === 'P' ? 'Present' : (r.status === 'A' ? 'Absent' : r.status);
          const color = r.status === 'P' ? 'var(--success)' : (r.status === 'A' ? '#d32f2f' : 'inherit');
          return '<li><strong>' + (r.date || '') + '</strong> — <span style="color:' + color + ';">' + label + '</span>' +
            (r.remark ? ' <span class="text-muted">(' + r.remark + ')</span>' : '') + '</li>';
        }).join('') + '</ul>'
      : '<p class="text-muted" style="margin:0.5rem 0 0;font-size:0.9rem;">No attendance records yet for this child.</p>';

    return `
      <div class="card" style="margin-bottom:0;">
        <h3>Attendance Overview</h3>
        <p class="text-muted" style="margin-bottom:1rem;">${monthLabel} for <strong>${child.name}</strong></p>
        <div class="dashboard-grid" style="margin-bottom:1rem;">
          <div style="text-align:center;background:var(--primary-light);padding:1rem;border-radius:12px;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--primary-dark);">${present} / ${total || '—'}</div>
            <div style="font-size:0.85rem;">Days present this month</div>
          </div>
          <div style="text-align:center;background:var(--light-green);padding:1rem;border-radius:12px;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--success);">${rate != null ? rate + '%' : '—'}</div>
            <div style="font-size:0.85rem;">Attendance rate</div>
          </div>
        </div>
        <h4 style="margin:0 0 0.25rem;font-size:0.95rem;">Recent days</h4>
        ${recentHtml}
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.goModule('attendance', '${child.id}')">Open Attendance</button>
      </div>
    `;
  },

  _tabHealth(child) {
    let latest = null;
    if (typeof HealthStore !== 'undefined' && HealthStore.getLatest) {
      latest = HealthStore.getLatest(child.id);
    }
    const h = latest && latest.heightCm != null ? latest.heightCm + ' cm' : '—';
    const w = latest && latest.weightKg != null ? latest.weightKg + ' kg' : '—';
    const bmi = latest && latest.bmi != null ? latest.bmi : null;
    const status = (latest && (latest.status || latest.nutritionStatus || '')).trim() || '—';
    const statusLower = status.toLowerCase();
    const statusColor = statusLower.includes('normal') ? 'var(--success)'
      : (statusLower.includes('under') || statusLower.includes('severe')) ? 'var(--orange)'
      : (statusLower.includes('over') || statusLower.includes('obese')) ? '#d32f2f'
      : 'var(--muted)';
    const measured = latest && latest.date ? ('Last measured: ' + latest.date) : 'No measurement on file yet.';

    return `
      <div class="card" style="margin-bottom:0;">
        <h3>Health Snapshot</h3>
        <div class="dashboard-grid" style="margin-bottom:1rem;">
          <div style="text-align:center;background:var(--soft-green);padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${h}</div>
            <div style="font-size:0.85rem;">Height</div>
          </div>
          <div style="text-align:center;background:var(--primary-light);padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--primary-dark);">${w}</div>
            <div style="font-size:0.85rem;">Weight</div>
          </div>
          <div style="text-align:center;background:#fefce8;padding:1rem;border-radius:12px;">
            <div style="font-size:1.5rem;font-weight:700;color:${statusColor};">${bmi != null ? bmi : '—'}</div>
            <div style="font-size:0.85rem;">BMI${status !== '—' ? ' · ' + status : ''}</div>
          </div>
        </div>
        <p class="text-muted" style="font-size:0.9rem;margin:0 0 0.75rem;">${measured}</p>
        <button class="btn btn-blue mt-2" onclick="TeacherChildren.goModule('health', '${child.id}', true)">Open Health Records</button>
      </div>
    `;
  },

  /**
   * Navigate to Development / Attendance / Health while keeping the selected child.
   * openDetail: open checklist (dev) or health profile (health).
   */
  goModule(module, childId, openDetail) {
    this.closeModal();
    if (module === 'development' && typeof TeacherDevelopment !== 'undefined') {
      TeacherDevelopment.pendingChildId = childId;
      TeacherDevelopment.pendingOpenChecklist = !!openDetail;
    } else if (module === 'health' && typeof TeacherHealth !== 'undefined') {
      TeacherHealth.pendingChildId = childId;
      TeacherHealth.pendingOpenProfile = !!openDetail;
    } else if (module === 'attendance' && typeof TeacherAttendance !== 'undefined') {
      TeacherAttendance.pendingChildId = childId;
    }
    if (typeof BrightSteps !== 'undefined') BrightSteps.navigate(module);
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
