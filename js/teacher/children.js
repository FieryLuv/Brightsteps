/**
 * Children module — list, search, filter, and full child profile modal.
 * Visual language matched to the original mockup + established design system.
 */

const TeacherChildren = {
  filterText: '',
  filterSection: 'all',

  render(container) {
    this.container = container;
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
          <p class="text-muted">View profiles, development status, and open individual child records.</p>
        </div>
        <button class="btn btn-blue" onclick="TeacherChildren.showAddChildDemo()">+ Add Child</button>
      </div>

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
        Showing <strong>${children.length}</strong> of ${SampleChildren.length} children
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

  showAddChildDemo() {
    alert('Add Child (demo)\n\nEnrollment form will be connected in a later module.\nFor now, sample children are loaded from sample-children.js.');
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
