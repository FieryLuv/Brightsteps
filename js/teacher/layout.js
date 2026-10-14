/**
 * Teacher shell: header + sidebar + main.
 * ⋮ menu: Profile | Staff management (Head only) | Logout
 */

const TeacherLayout = {
  render(user) {
    const profile = typeof TeacherStore !== 'undefined' ? TeacherStore.get() : {};
    const displayName = (profile.fullName || user.name || 'Teacher').trim();
    const roleTag = profile.isHead ? 'Head Teacher' : (profile.position || 'Faculty');
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="app-header teacher-header">
        <div class="header-left">
          <button type="button" class="nav-toggle no-print" aria-label="Open menu"
            onclick="TeacherLayout.toggleNav()">☰</button>
          <div class="logo">🌱 BrightSteps</div>
        </div>
        <div class="user-info" style="position:relative;">
          <span class="user-info-text">${displayName} · ${roleTag}</span>
          <button type="button" class="btn-header-menu no-print" aria-label="Menu"
            onclick="TeacherLayout.toggleSettingsMenu(event)">⋮</button>
          <div id="teacher-settings-menu" class="parent-settings-menu" hidden>
            <button type="button" class="parent-settings-item" onclick="TeacherLayout.openProfile()">👤 My profile</button>
            ${profile.isHead
              ? `<button type="button" class="parent-settings-item" onclick="TeacherLayout.openStaffManager()">👥 Staff management</button>`
              : ''}
            <button type="button" class="parent-settings-item" onclick="TeacherLayout.closeSettingsMenu(); BrightSteps.logout()">🚪 Logout</button>
          </div>
        </div>
      </header>
      <div class="container">
        <div class="sidebar-backdrop no-print" onclick="TeacherLayout.closeNav()"></div>
        <aside class="sidebar" id="teacher-sidebar">
          <div class="sidebar-mobile-title no-print">Menu</div>
          <div class="nav-item active" data-nav="dashboard" onclick="TeacherLayout.nav('dashboard')">🏠 Dashboard</div>
          <div class="nav-item" data-nav="children" onclick="TeacherLayout.nav('children')">👦 Children</div>
          <div class="nav-item" data-nav="development" onclick="TeacherLayout.nav('development')">📈 Development</div>
          <div class="nav-item" data-nav="health" onclick="TeacherLayout.nav('health')">❤️ Health Records</div>
          <div class="nav-item" data-nav="feeding" onclick="TeacherLayout.nav('feeding')">🍎 SFP Feeding</div>
          <div class="nav-item" data-nav="attendance" onclick="TeacherLayout.nav('attendance')">📅 Attendance</div>
          <div class="nav-item" data-nav="contributions" onclick="TeacherLayout.nav('contributions')">💵 Contributions</div>
          <div class="nav-item" data-nav="reports" onclick="TeacherLayout.nav('reports')">📊 Reports</div>
          <div class="nav-item" data-nav="calendar" onclick="TeacherLayout.nav('calendar')">🗓️ Calendar</div>
        </aside>
        <main class="main-content" id="main-content"></main>
      </div>
    `;
    document.addEventListener('click', this._onDocClick);
    this._showPendingTransferBanner();
  },

  _showPendingTransferBanner() {
    const existing = document.getElementById('head-transfer-banner');
    if (existing) existing.remove();
    if (typeof TeacherStore === 'undefined') return;
    const pend = TeacherStore.getPendingHeadTransfer();
    if (!pend || pend.status !== 'pending') return;
    const state = TeacherStore.getState();
    if (state.currentStaffId !== pend.toId) return;
    const from = TeacherStore.listAllStaff().find(s => s.id === pend.fromId);
    const fromName = from ? from.fullName : 'Head Teacher';
    const bar = document.createElement('div');
    bar.id = 'head-transfer-banner';
    bar.className = 'no-print';
    bar.style.cssText = 'background:#e8f5e9;border-bottom:2px solid #81c784;padding:0.65rem 1rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;justify-content:space-between;';
    bar.innerHTML = '<span style="font-size:0.9rem;"><strong>' + TeacherLayout._esc(fromName) +
      '</strong> proposed you as the next <strong>Head Teacher / Admin</strong>.</span>' +
      '<span style="display:flex;gap:0.4rem;">' +
      '<button type="button" class="btn btn-blue" style="font-size:0.82rem;padding:0.3rem 0.7rem;" onclick="TeacherLayout.acceptPendingTransfer()">Accept</button>' +
      '<button type="button" class="btn" style="font-size:0.82rem;padding:0.3rem 0.7rem;background:#ffebee;color:#c62828;" onclick="TeacherLayout.declinePendingTransfer()">Decline</button>' +
      '</span>';
    const header = document.querySelector('.teacher-header');
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
  },

  _onDocClick(e) {
    const menu = document.getElementById('teacher-settings-menu');
    if (!menu || menu.hidden) return;
    if (e.target.closest && (e.target.closest('#teacher-settings-menu') || e.target.closest('.btn-header-menu'))) return;
    menu.hidden = true;
  },

  toggleSettingsMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('teacher-settings-menu');
    if (!menu) return;
    menu.hidden = !menu.hidden;
  },

  closeSettingsMenu() {
    const menu = document.getElementById('teacher-settings-menu');
    if (menu) menu.hidden = true;
  },

  openProfile() {
    this.closeSettingsMenu();
    const p = typeof TeacherStore !== 'undefined' ? TeacherStore.get() : {};
    const isHead = !!p.isHead;
    const existing = document.getElementById('teacher-profile-overlay');
    if (existing) existing.remove();

    const facilityBlock = isHead ? `
            <h4 style="margin:1.1rem 0 0.5rem;font-size:0.95rem;">Facility / address (Part I) — Head only</h4>
            <div class="profile-grid">
              <div style="grid-column:1 / -1;">
                <label class="ecc-field-label">Name of facility</label>
                <input type="text" id="tp-center" class="ecc-field-input" value="${TeacherLayout._esc(p.centerName)}" />
              </div>
              <div>
                <label class="ecc-field-label">Facility category</label>
                <select id="tp-fac-cat" class="ecc-field-input">
                  <option value="CDC" ${p.facilityCategory !== 'SNP' ? 'selected' : ''}>CDC</option>
                  <option value="SNP" ${p.facilityCategory === 'SNP' ? 'selected' : ''}>SNP</option>
                </select>
              </div>
              <div>
                <label class="ecc-field-label">Province</label>
                <input type="text" id="tp-province" class="ecc-field-input" value="${TeacherLayout._esc(p.province)}" />
              </div>
              <div>
                <label class="ecc-field-label">District</label>
                <input type="text" id="tp-district" class="ecc-field-input" value="${TeacherLayout._esc(p.district)}" />
              </div>
              <div>
                <label class="ecc-field-label">City / Municipality</label>
                <input type="text" id="tp-muni" class="ecc-field-input" value="${TeacherLayout._esc(p.municipality)}" />
              </div>
              <div>
                <label class="ecc-field-label">Barangay</label>
                <input type="text" id="tp-barangay" class="ecc-field-input" value="${TeacherLayout._esc(p.barangay)}" />
              </div>
              <div style="grid-column:1 / -1;">
                <label class="ecc-field-label">Facility address (street / purok)</label>
                <input type="text" id="tp-address" class="ecc-field-input" value="${TeacherLayout._esc(p.address)}" />
              </div>
              <div>
                <label class="ecc-field-label">With wash facility?</label>
                <div class="yn-group">
                  <label><input type="radio" name="tp-wash" value="Yes" ${p.withWashFacility === true ? 'checked' : ''} /> Yes</label>
                  <label><input type="radio" name="tp-wash" value="No" ${p.withWashFacility === false ? 'checked' : ''} /> No</label>
                </div>
              </div>
              <div>
                <label class="ecc-field-label">With community garden?</label>
                <div class="yn-group">
                  <label><input type="radio" name="tp-garden" value="Yes" ${p.withCommunityGarden === true ? 'checked' : ''} /> Yes</label>
                  <label><input type="radio" name="tp-garden" value="No" ${p.withCommunityGarden === false ? 'checked' : ''} /> No</label>
                </div>
              </div>
            </div>` : `
            <p class="text-muted" style="font-size:0.85rem;margin:1rem 0 0;">
              Facility settings (barangay, wash facility, etc.) are managed by the <strong>Head Teacher</strong>.
            </p>`;

    const html = `
      <div id="teacher-profile-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:560px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.15rem;color:white;">My profile</h2>
            <button type="button" class="bs-modal-close" onclick="document.getElementById('teacher-profile-overlay').remove()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted" style="margin-top:0;font-size:0.88rem;">
              ${isHead
                ? 'You are signed in as <strong>Head Teacher / Admin</strong>. Facility fields feed SFP Part I.'
                : 'Faculty profile. Staff roster is managed by the Head Teacher.'}
            </p>
            <h4 style="margin:0 0 0.5rem;font-size:0.95rem;">Personal</h4>
            <div class="profile-grid">
              <div style="grid-column:1 / -1;">
                <label class="ecc-field-label">Full name</label>
                <input type="text" id="tp-fullName" class="ecc-field-input" value="${TeacherLayout._esc(p.fullName)}" />
              </div>
              <div>
                <label class="ecc-field-label">Position</label>
                <input type="text" id="tp-position" class="ecc-field-input" value="${TeacherLayout._esc(p.position)}"
                  ${isHead ? 'readonly style="background:#f5f5f5;"' : ''} />
              </div>
              <div>
                <label class="ecc-field-label">Sex</label>
                <select id="tp-sex" class="ecc-field-input">
                  <option value="">—</option>
                  <option value="Female" ${p.sex === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Male" ${p.sex === 'Male' ? 'selected' : ''}>Male</option>
                </select>
              </div>
              <div>
                <label class="ecc-field-label">Employee / ID no.</label>
                <input type="text" id="tp-emp" class="ecc-field-input" value="${TeacherLayout._esc(p.employeeId)}" />
              </div>
              <div>
                <label class="ecc-field-label">Phone</label>
                <input type="text" id="tp-phone" class="ecc-field-input" value="${TeacherLayout._esc(p.phone)}" />
              </div>
              <div>
                <label class="ecc-field-label">Email</label>
                <input type="email" id="tp-email" class="ecc-field-input" value="${TeacherLayout._esc(p.email)}" />
              </div>
              <div>
                <label class="ecc-field-label">Username (future login)</label>
                <input type="text" id="tp-user" class="ecc-field-input" value="${TeacherLayout._esc(p.username)}" />
              </div>
              <div>
                <label class="ecc-field-label">Password</label>
                <input type="password" id="tp-pass" class="ecc-field-input" placeholder="Leave blank to keep" autocomplete="new-password" />
              </div>
            </div>
            ${facilityBlock}
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById('teacher-profile-overlay').remove()">Cancel</button>
            <button type="button" class="btn btn-blue" onclick="TeacherLayout.saveProfile()">💾 Save</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveProfile() {
    if (typeof TeacherStore === 'undefined') return;
    const val = (id) => ((document.getElementById(id) || {}).value || '').trim();
    const radio = (name) => {
      const el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    };
    const ynBool = (name) => {
      const v = radio(name);
      if (v === 'Yes') return true;
      if (v === 'No') return false;
      return null;
    };
    const isHead = TeacherStore.isHead();
    const patch = {
      fullName: val('tp-fullName'),
      position: isHead ? 'Head Teacher / Admin' : val('tp-position'),
      sex: val('tp-sex'),
      employeeId: val('tp-emp'),
      phone: val('tp-phone'),
      email: val('tp-email'),
      username: val('tp-user')
    };
    if (val('tp-pass')) { patch.password = val('tp-pass'); patch.passwordHint = '••••••••'; }
    if (isHead) {
      patch.centerName = val('tp-center');
      patch.facilityCategory = val('tp-fac-cat') || 'CDC';
      patch.province = val('tp-province');
      patch.district = val('tp-district');
      patch.municipality = val('tp-muni');
      patch.barangay = val('tp-barangay');
      patch.address = val('tp-address');
      patch.withWashFacility = ynBool('tp-wash');
      patch.withCommunityGarden = ynBool('tp-garden');
    }
    TeacherStore.save(patch);
    const overlay = document.getElementById('teacher-profile-overlay');
    if (overlay) overlay.remove();
    this._refreshHeader();
    this._toast('Profile saved');
  },

  openStaffManager() {
    this.closeSettingsMenu();
    if (typeof TeacherStore === 'undefined' || !TeacherStore.isHead()) {
      alert('Only the Head Teacher can manage staff.');
      return;
    }
    this._renderStaffManager();
  },

  _renderStaffManager() {
    const existing = document.getElementById('teacher-staff-overlay');
    if (existing) existing.remove();

    const state = TeacherStore.getState();
    const staff = TeacherStore.listStaff();
    const archived = typeof TeacherStore.listArchivedStaff === 'function'
      ? TeacherStore.listArchivedStaff()
      : [];
    const headId = state.headStaffId;
    const currentId = state.currentStaffId;

    const rows = staff.map(s => {
      const isHead = s.id === headId;
      const isSelf = s.id === currentId;
      return `<tr>
        <td>
          <strong>${TeacherLayout._esc(s.fullName)}</strong>
          ${isHead ? ' <span style="font-size:0.75rem;background:#e8f5e9;color:#2e7d32;padding:0.15rem 0.45rem;border-radius:999px;">Head</span>' : ''}
          ${isSelf ? ' <span class="text-muted" style="font-size:0.75rem;">(you)</span>' : ''}
          <div class="text-muted" style="font-size:0.78rem;">${TeacherLayout._esc(s.position || '')} · @${TeacherLayout._esc(s.username || '—')}</div>
        </td>
        <td style="white-space:nowrap;text-align:right;">
          ${!isHead ? `<button type="button" class="btn" style="font-size:0.78rem;padding:0.25rem 0.5rem;background:#e3f2fd;color:#1565c0;"
            onclick="TeacherLayout.proposeTransfer('${s.id}')">Propose as Head</button>` : ''}
          ${!isSelf ? `<button type="button" class="btn" style="font-size:0.78rem;padding:0.25rem 0.5rem;background:#f5f5f5;"
            onclick="TeacherLayout.switchStaff('${s.id}')">Sign in as</button>` : ''}
          ${!isHead && !isSelf ? `<button type="button" class="btn" style="font-size:0.78rem;padding:0.25rem 0.5rem;background:#fff3e0;color:#e65100;"
            onclick="TeacherLayout.archiveStaff('${s.id}')">📦 Archive</button>` : ''}
        </td>
      </tr>`;
    }).join('');

    const archivedRows = archived.map(s => `
      <tr style="opacity:0.92;">
        <td>
          <strong>${TeacherLayout._esc(s.fullName)}</strong>
          <span style="font-size:0.72rem;background:#eceff1;color:#546e7a;padding:0.12rem 0.4rem;border-radius:999px;margin-left:0.25rem;">Archived</span>
          <div class="text-muted" style="font-size:0.78rem;">${TeacherLayout._esc(s.position || '')} · @${TeacherLayout._esc(s.username || '—')}</div>
        </td>
        <td style="text-align:right;">
          <button type="button" class="btn" style="font-size:0.78rem;padding:0.25rem 0.5rem;background:#e8f5e9;color:#2e7d32;"
            onclick="TeacherLayout.restoreStaff('${s.id}')">↩ Restore</button>
        </td>
      </tr>`).join('');

    const html = `
      <div id="teacher-staff-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:620px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.15rem;color:white;">Staff management</h2>
            <button type="button" class="bs-modal-close" onclick="document.getElementById('teacher-staff-overlay').remove()">×</button>
          </div>
          <div class="bs-modal-body">
            <p class="text-muted" style="margin-top:0;font-size:0.88rem;">
              Only <strong>one Head Teacher / Admin</strong> at a time. Proposing a new head requires
              the head password; the appointed teacher must <strong>Accept</strong> or <strong>Decline</strong>.
              Archive soft-deactivates faculty (login blocked); restore anytime.
            </p>
            ${(() => {
              const pend = TeacherStore.getPendingHeadTransfer();
              if (!pend || pend.status !== 'pending') return '';
              const to = TeacherStore.listStaff().find(s => s.id === pend.toId);
              const name = to ? to.fullName : 'Appointee';
              return '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:0.65rem 0.85rem;margin-bottom:0.75rem;font-size:0.88rem;">' +
                'Pending transfer to <strong>' + TeacherLayout._esc(name) + '</strong>. ' +
                '<button type="button" class="btn" style="font-size:0.78rem;padding:0.2rem 0.5rem;margin-left:0.35rem;" onclick="TeacherLayout.cancelPendingTransfer()">Cancel proposal</button></div>';
            })()}
            <div class="eccd-table-wrap" style="margin-bottom:1rem;">
              <table class="eccd-table">
                <thead><tr><th>Active staff</th><th style="text-align:right;">Actions</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="2">No staff</td></tr>'}</tbody>
              </table>
            </div>
            ${archived.length ? `
            <h4 style="margin:0 0 0.5rem;font-size:0.95rem;">Archived staff</h4>
            <div class="eccd-table-wrap" style="margin-bottom:1rem;">
              <table class="eccd-table">
                <thead><tr><th>Staff</th><th style="text-align:right;">Actions</th></tr></thead>
                <tbody>${archivedRows}</tbody>
              </table>
            </div>` : ''}
            <h4 style="margin:0 0 0.5rem;font-size:0.95rem;">Add faculty</h4>
            <div class="profile-grid">
              <div>
                <label class="ecc-field-label">Full name *</label>
                <input type="text" id="staff-add-name" class="ecc-field-input" />
              </div>
              <div>
                <label class="ecc-field-label">Username</label>
                <input type="text" id="staff-add-user" class="ecc-field-input" placeholder="auto from first name" />
              </div>
              <div>
                <label class="ecc-field-label">Position</label>
                <input type="text" id="staff-add-pos" class="ecc-field-input" value="CDW / Teacher" />
              </div>
              <div>
                <label class="ecc-field-label">Phone</label>
                <input type="text" id="staff-add-phone" class="ecc-field-input" />
              </div>
            </div>
            <button type="button" class="btn btn-blue" style="margin-top:0.75rem;" onclick="TeacherLayout.addFaculty()">＋ Add faculty</button>
          </div>
          <div class="bs-modal-footer" style="display:flex;justify-content:flex-end;">
            <button type="button" class="btn" style="background:#e8e8e8;" onclick="document.getElementById('teacher-staff-overlay').remove()">Close</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  addFaculty() {
    const name = ((document.getElementById('staff-add-name') || {}).value || '').trim();
    const username = ((document.getElementById('staff-add-user') || {}).value || '').trim();
    const position = ((document.getElementById('staff-add-pos') || {}).value || '').trim();
    const phone = ((document.getElementById('staff-add-phone') || {}).value || '').trim();
    const result = TeacherStore.addFaculty({ fullName: name, username, position, phone });
    if (!result.ok) {
      alert(result.error || 'Could not add faculty.');
      return;
    }
    this._toast('Faculty added: ' + result.staff.fullName);
    this._renderStaffManager();
  },

  switchStaff(staffId) {
    const result = TeacherStore.setCurrentStaff(staffId);
    if (!result.ok) {
      alert(result.error || 'Could not switch.');
      return;
    }
    const overlay = document.getElementById('teacher-staff-overlay');
    if (overlay) overlay.remove();
    if (typeof BrightSteps !== 'undefined') {
      const u = { name: result.staff.fullName, role: 'teacher', center: 'NCDC Medina' };
      this.render(u);
      if (BrightSteps.navigate) BrightSteps.navigate('dashboard');
    } else {
      this._refreshHeader();
      this._showPendingTransferBanner();
    }
    this._toast('Signed in as ' + result.staff.fullName);
  },

  archiveStaff(staffId) {
    if (!confirm('Archive this faculty member?\n\nThey cannot log in while archived. Profile stays on file and can be restored.')) return;
    const result = TeacherStore.archiveStaff
      ? TeacherStore.archiveStaff(staffId)
      : TeacherStore.removeStaff(staffId);
    if (!result.ok) {
      alert(result.error || 'Could not archive staff.');
      return;
    }
    this._toast('Staff archived');
    this._renderStaffManager();
  },

  restoreStaff(staffId) {
    if (!confirm('Restore this faculty member to the active roster?')) return;
    const result = TeacherStore.restoreStaff(staffId);
    if (!result.ok) {
      alert(result.error || 'Could not restore staff.');
      return;
    }
    this._toast('Staff restored');
    this._renderStaffManager();
  },

  removeStaff(staffId) {
    this.archiveStaff(staffId);
  },

  proposeTransfer(staffId) {
    const staff = TeacherStore.listStaff().find(s => s.id === staffId);
    const name = staff ? staff.fullName : 'this person';
    const pwd = prompt(
      'Propose Head Teacher role to ' + name + '?\n\n' +
      'They must Accept or Decline.\n\n' +
      'Enter YOUR Head Teacher password to confirm:'
    );
    if (pwd == null) return;
    const result = TeacherStore.proposeHeadTransfer(staffId, pwd);
    if (!result.ok) {
      alert(result.error || 'Could not propose transfer.');
      return;
    }
    this._toast('Transfer proposed to ' + (result.appointeeName || name) + ' — waiting for accept/decline');
    this._renderStaffManager();
  },

  cancelPendingTransfer() {
    const pwd = prompt('Enter Head Teacher password to cancel the pending transfer:');
    if (pwd == null) return;
    const result = TeacherStore.cancelHeadTransfer(pwd);
    if (!result.ok) {
      alert(result.error || 'Could not cancel.');
      return;
    }
    this._toast('Pending transfer cancelled');
    this._renderStaffManager();
  },

  acceptPendingTransfer() {
    const pwd = prompt('Enter YOUR password to accept Head Teacher role:');
    if (pwd == null) return;
    const result = TeacherStore.acceptHeadTransfer(pwd);
    if (!result.ok) {
      alert(result.error || 'Could not accept.');
      return;
    }
    this._toast('You are now Head Teacher / Admin');
    const b = document.getElementById('head-transfer-banner');
    if (b) b.remove();
    // Full shell rebuild so ⋮ menu gains Staff management
    this._rebuildShellAfterRoleChange();
  },

  declinePendingTransfer() {
    const pwd = prompt('Enter YOUR password to decline the Head Teacher appointment:');
    if (pwd == null) return;
    const result = TeacherStore.declineHeadTransfer(pwd);
    if (!result.ok) {
      alert(result.error || 'Could not decline.');
      return;
    }
    this._toast('Head transfer declined');
    const b = document.getElementById('head-transfer-banner');
    if (b) b.remove();
  },

  /** Rebuild header/sidebar after head role changes (menu is rendered once at login). */
  _rebuildShellAfterRoleChange() {
    const p = typeof TeacherStore !== 'undefined' ? TeacherStore.get() : {};
    const user = {
      name: p.fullName || 'Teacher',
      role: 'teacher',
      staffRole: p.isHead ? 'head' : 'faculty',
      isHead: !!p.isHead,
      center: p.centerName || 'NCDC Medina'
    };
    if (typeof BrightSteps !== 'undefined' && BrightSteps.getUser) {
      // Keep app currentUser in sync if exposed later
      try {
        const cu = BrightSteps.getUser();
        if (cu) {
          cu.name = user.name;
          cu.isHead = user.isHead;
          cu.staffRole = user.staffRole;
        }
      } catch (e) { /* ignore */ }
    }
    this.render(user);
    if (typeof BrightSteps !== 'undefined' && BrightSteps.navigate) {
      BrightSteps.navigate('dashboard');
    }
  },

  _refreshHeader() {
    if (typeof TeacherStore === 'undefined') return;
    const p = TeacherStore.get();
    const roleTag = p.isHead ? 'Head Teacher' : (p.position || 'Faculty');
    const text = document.querySelector('.user-info-text');
    if (text) text.textContent = (p.fullName || 'Teacher') + ' · ' + roleTag;

    // Rebuild ⋮ menu so Staff management appears/disappears with role
    const menu = document.getElementById('teacher-settings-menu');
    if (menu) {
      menu.innerHTML =
        '<button type="button" class="parent-settings-item" onclick="TeacherLayout.openProfile()">👤 My profile</button>' +
        (p.isHead
          ? '<button type="button" class="parent-settings-item" onclick="TeacherLayout.openStaffManager()">👥 Staff management</button>'
          : '') +
        '<button type="button" class="parent-settings-item" onclick="TeacherLayout.closeSettingsMenu(); BrightSteps.logout()">🚪 Logout</button>';
    }
  },

  _toast(msg) {
    const t = document.createElement('div');
    t.className = 'ecc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  },

  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  },

  nav(route) {
    this.closeNav();
    this.closeSettingsMenu();
    if (typeof BrightSteps !== 'undefined') BrightSteps.navigate(route);
  },

  toggleNav() {
    document.body.classList.toggle('nav-open');
  },

  closeNav() {
    document.body.classList.remove('nav-open');
  },

  setActive(route) {
    document.querySelectorAll('.sidebar .nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-nav') === route);
    });
  }
};

if (typeof window !== 'undefined') window.TeacherLayout = TeacherLayout;
