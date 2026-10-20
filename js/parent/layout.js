/**
 * Parent shell — header + optional multi-child switcher + full-width content.
 * Header ⋮ menu: Personal information (photo + login) and Documents (requirements).
 */

const ParentLayout = {
  render(user) {
    const app = document.getElementById('app');
    const children = user.children || [];
    const active = children.find(c => String(c.id) === String(user.activeChildId)) || children[0];
    const activeCode = active && active.childCode ? active.childCode : '';

    let switcher = '';
    if (children.length > 1) {
      const chips = children.map(c => {
        const isActive = active && String(c.id) === String(active.id);
        const idAttr = String(c.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const name = this._esc(c.name || 'Child');
        const code = c.childCode ? ' · ' + this._esc(c.childCode) : '';
        return '<button type="button" class="btn child-chip' + (isActive ? ' btn-blue' : '') + '"' +
          ' onclick="BrightSteps.selectChild(\'' + idAttr + '\')">' + name +
          '<span class="child-chip-code">' + code + '</span></button>';
      }).join('');
      switcher = `
        <div class="parent-child-switcher no-print">
          <span class="parent-child-label">Your children:</span>
          <div class="parent-child-chips">${chips}</div>
        </div>`;
    }

    app.innerHTML = `
      <header class="parent-header app-header">
        <div class="header-left">
          <div class="logo">🌱 BrightSteps</div>
        </div>
        <div class="user-info">
          <span class="user-info-text">${this._esc(user.name)} · Parent / Guardian
          ${activeCode ? `<span class="user-code">(${this._esc(activeCode)})</span>` : ''}</span>
          <button type="button" class="btn btn-header-menu" title="Menu"
            aria-label="Menu" onclick="ParentLayout.toggleSettingsMenu(event)">⋮</button>
          <button class="btn btn-header-logout" onclick="BrightSteps.logout()">Logout</button>
        </div>
        <div id="parent-settings-menu" class="parent-settings-menu" hidden>
          <button type="button" class="parent-settings-item" onclick="ParentLayout.openPersonalInfo()">👤 Personal information</button>
          <button type="button" class="parent-settings-item" onclick="ParentLayout.openDocuments()">📎 Documents</button>
        </div>
      </header>
      ${switcher}
      <div class="parent-main" id="main-content"></div>
    `;
    ParentDashboard.render(document.getElementById('main-content'), user);
  },

  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  toggleSettingsMenu(ev) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    const menu = document.getElementById('parent-settings-menu');
    if (!menu) return;
    const open = menu.hasAttribute('hidden');
    if (open) {
      menu.removeAttribute('hidden');
      const closer = (e) => {
        if (menu.contains(e.target)) return;
        menu.setAttribute('hidden', '');
        document.removeEventListener('click', closer);
      };
      setTimeout(() => document.addEventListener('click', closer), 0);
    } else {
      menu.setAttribute('hidden', '');
    }
  },

  _closeMenu() {
    const menu = document.getElementById('parent-settings-menu');
    if (menu) menu.setAttribute('hidden', '');
  },

  /** Photo + login name / optional password */
  openPersonalInfo() {
    this._closeMenu();

    const user = typeof BrightSteps !== 'undefined' ? BrightSteps.getUser() : null;
    if (!user || user.role !== 'parent') return;
    const children = user.children || [];
    const active = children.find(c => String(c.id) === String(user.activeChildId)) || children[0];
    if (!active) return;

    const loginName = active.parentLoginName || active.parentName || user.name || '';
    const hasPassword = !!(active.parentPassword && String(active.parentPassword).length);
    const codes = children.map(c => c.childCode || c.id).filter(Boolean).join(', ');

    const photoHtml = typeof FileAttach !== 'undefined'
      ? FileAttach.photoFieldHtml('parent-settings', active.photo || null)
      : '<p class="text-muted">Photo upload unavailable.</p>';

    const existing = document.getElementById('parent-settings-overlay');
    if (existing) existing.remove();
    const existingDocs = document.getElementById('parent-attach-overlay');
    if (existingDocs) existingDocs.remove();

    const html = `
      <div id="parent-settings-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:520px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.15rem;color:white;">Personal information</h2>
            <button class="bs-modal-close" onclick="document.getElementById('parent-settings-overlay').remove()">×</button>
          </div>
          <div class="bs-modal-body" style="display:flex;flex-direction:column;gap:1.1rem;">
            <section>
              <h3 style="margin:0 0 0.5rem;font-size:0.95rem;color:var(--primary);">Profile photo</h3>
              <p class="text-muted" style="font-size:0.85rem;margin:0 0 0.6rem;">
                Shown on your parent portal for <strong>${this._esc(active.name || 'your child')}</strong>.
              </p>
              ${photoHtml}
            </section>

            <section>
              <h3 style="margin:0 0 0.5rem;font-size:0.95rem;color:var(--primary);">Login credentials</h3>
              <p class="text-muted" style="font-size:0.85rem;margin:0 0 0.75rem;line-height:1.45;">
                After enrollment the center gives you a <strong>guardian name</strong> + <strong>Child ID</strong>.
                You can change the login name and set an optional password here.
                Titles (Mr./Mrs.) and capital letters do not matter when signing in.
              </p>
              <label class="ecc-field-label">Login name (username)</label>
              <input type="text" id="ps-login-name" class="ecc-field-input" value="${this._esc(loginName)}"
                autocomplete="username" />
              <label class="ecc-field-label" style="margin-top:0.75rem;">Child ID(s)</label>
              <input type="text" class="ecc-field-input" value="${this._esc(codes)}" disabled
                style="opacity:0.85;background:#f5f5f5;" />
              <p class="text-muted" style="font-size:0.8rem;margin:0.35rem 0 0;">Child ID is fixed by the center and cannot be changed here.</p>

              <label class="ecc-field-label" style="margin-top:0.9rem;">
                ${hasPassword ? 'New password' : 'Set password'} <span class="text-muted">(optional)</span>
              </label>
              <input type="password" id="ps-password" class="ecc-field-input"
                placeholder="${hasPassword ? 'Leave blank to keep current password' : 'Leave blank for name + Child ID only'}"
                autocomplete="new-password" />
              <label class="ecc-field-label" style="margin-top:0.75rem;">Confirm password</label>
              <input type="password" id="ps-password2" class="ecc-field-input" placeholder="Repeat password"
                autocomplete="new-password" />
              ${hasPassword ? `
              <label style="display:flex;align-items:center;gap:0.5rem;margin-top:0.75rem;font-size:0.9rem;">
                <input type="checkbox" id="ps-clear-password" />
                Remove password (go back to name + Child ID only)
              </label>` : ''}
              <p id="ps-error" style="color:#d32f2f;font-size:0.85rem;margin:0.6rem 0 0;display:none;"></p>
            </section>
          </div>
          <div class="bs-modal-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;flex-wrap:wrap;">
            <button class="btn" style="background:#e8e8e8;" onclick="document.getElementById('parent-settings-overlay').remove()">Cancel</button>
            <button class="btn btn-blue" onclick="ParentLayout.savePersonalInfo()">Save</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** Requirements / document file attachments only */
  openDocuments() {
    this._closeMenu();

    const user = typeof BrightSteps !== 'undefined' ? BrightSteps.getUser() : null;
    if (!user || user.role !== 'parent') return;
    const children = user.children || [];
    const active = children.find(c => String(c.id) === String(user.activeChildId)) || children[0];
    if (!active) return;

    const existing = document.getElementById('parent-attach-overlay');
    if (existing) existing.remove();
    const existingPi = document.getElementById('parent-settings-overlay');
    if (existingPi) existingPi.remove();

    const docsHtml = typeof FileAttach !== 'undefined'
      ? FileAttach.documentsFieldHtml('parent-docs', (active.documents && active.documents.files) || [])
      : '<p class="text-muted">Document upload unavailable.</p>';

    const html =
      '<div id="parent-attach-overlay" class="bs-overlay no-print">' +
      '<div class="bs-modal-panel" style="max-width:520px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.15rem;color:white;">Documents</h2>' +
      '<button type="button" class="bs-modal-close" onclick="document.getElementById(\'parent-attach-overlay\').remove()">×</button>' +
      '</div>' +
      '<div class="bs-modal-body">' +
      '<p class="text-muted" style="margin-top:0;font-size:0.9rem;line-height:1.45;">' +
      'Upload requirement files for <strong>' + this._esc(active.name || 'your child') + '</strong> ' +
      '(e.g. birth certificate, medical records). Paper copies can still be submitted in person at NCDC Medina.</p>' +
      docsHtml +
      '<p id="parent-docs-error" style="color:#d32f2f;display:none;margin:0.75rem 0 0;"></p>' +
      '</div>' +
      '<div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">' +
      '<button type="button" class="btn" style="background:#e8e8e8;color:#333;" onclick="document.getElementById(\'parent-attach-overlay\').remove()">Cancel</button>' +
      '<button type="button" class="btn btn-blue" onclick="ParentLayout.saveDocuments(' +
      JSON.stringify(String(active.id)) + ')">Save documents</button>' +
      '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  },

  savePersonalInfo() {
    const user = typeof BrightSteps !== 'undefined' ? BrightSteps.getUser() : null;
    if (!user || user.role !== 'parent') return;
    const children = user.children || [];
    if (!children.length) return;

    const errEl = document.getElementById('ps-error');
    const showErr = (msg) => {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = msg;
      }
    };

    const loginName = ((document.getElementById('ps-login-name') || {}).value || '').trim();
    if (!loginName) {
      showErr('Login name is required.');
      return;
    }

    const pass1 = ((document.getElementById('ps-password') || {}).value || '');
    const pass2 = ((document.getElementById('ps-password2') || {}).value || '');
    const clearPass = !!(document.getElementById('ps-clear-password') || {}).checked;

    if (pass1 || pass2) {
      if (pass1 !== pass2) {
        showErr('Passwords do not match.');
        return;
      }
      if (pass1.length < 4) {
        showErr('Password must be at least 4 characters.');
        return;
      }
    }

    const active = children.find(c => String(c.id) === String(user.activeChildId)) || children[0];
    const photoCleared = typeof FileAttach !== 'undefined' && FileAttach.wasPhotoCleared('parent-settings');
    const photo = typeof FileAttach !== 'undefined' ? FileAttach.getPhoto('parent-settings') : null;

    let lastError = null;
    children.forEach(c => {
      if (typeof ChildRegistry === 'undefined' || !ChildRegistry.updateParentCredentials) {
        lastError = 'Credential update is not available.';
        return;
      }
      const payload = { parentLoginName: loginName };
      if (clearPass) {
        payload.parentPassword = '';
        payload.clearPassword = true;
      } else if (pass1) {
        payload.parentPassword = pass1;
      }
      if (String(c.id) === String(active.id)) {
        if (photoCleared) payload.clearPhoto = true;
        else if (photo) payload.photo = photo;
      }
      const result = ChildRegistry.updateParentCredentials(c.id, payload);
      if (!result || result.ok === false) {
        lastError = (result && result.error) || 'Could not save.';
      }
    });

    if (lastError) {
      showErr(lastError);
      return;
    }

    if (typeof SampleChildren !== 'undefined') {
      const ids = new Set(children.map(c => String(c.id)));
      user.children = SampleChildren.filter(c => ids.has(String(c.id)));
      user.name = loginName;
      const still = user.children.find(c => String(c.id) === String(user.activeChildId)) || user.children[0];
      if (still) {
        user.activeChildId = still.id;
        user.childName = still.name;
      }
    }

    const overlay = document.getElementById('parent-settings-overlay');
    if (overlay) overlay.remove();
    this.render(user);
  },

  saveDocuments(childId) {
    const errEl = document.getElementById('parent-docs-error');
    const showErr = (msg) => {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = msg;
      } else {
        alert(msg);
      }
    };

    if (typeof ChildRegistry === 'undefined') {
      showErr('Save is not available right now.');
      return;
    }

    const files = typeof FileAttach !== 'undefined' ? FileAttach.getDocs('parent-docs') : [];
    let result;
    try {
      result = ChildRegistry.updateParentAttachments(childId, { files: files });
    } catch (e) {
      console.error(e);
      showErr((e && e.message) || 'Could not save.');
      return;
    }

    if (!result || !result.ok) {
      showErr((result && result.error) || 'Could not save.');
      return;
    }

    const user = typeof BrightSteps !== 'undefined' ? BrightSteps.getUser() : null;
    if (user && user.children && typeof SampleChildren !== 'undefined') {
      user.children = user.children.map(c => {
        const fresh = SampleChildren.find(s => String(s.id) === String(c.id));
        return fresh || c;
      });
    }

    const overlay = document.getElementById('parent-attach-overlay');
    if (overlay) overlay.remove();
    if (user) this.render(user);

    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = result.strippedAttachments
      ? 'Saved (some large files skipped due to storage limits).'
      : 'Documents updated.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  },

  // Back-compat aliases
  openSettings() {
    this.openPersonalInfo();
  },
  saveSettings() {
    this.savePersonalInfo();
  }
};

if (typeof window !== 'undefined') window.ParentLayout = ParentLayout;
