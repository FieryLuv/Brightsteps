/**
 * BrightSteps — Core Application
 * Router, role state, and shared utilities.
 * Keeps teacher / parent / visitor cleanly separated.
 */

const BrightSteps = (() => {
  let currentRole = null; // 'teacher' | 'parent' | 'visitor'
  let currentUser = null;

  const users = {
    teacher: { name: 'Teacher Irish', role: 'teacher', center: 'NCDC Medina' }
  };

  function init() {
    showLogin();
  }

  function showLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-screen">
        <div class="login-card login-card-roles">
          <div class="login-identity login-identity-simple">
            <div class="login-identity-text" style="text-align:center;width:100%;">
              <div class="brand">🌱 BrightSteps</div>
              <p class="login-ncdc-line">National Child Development Center — Medina</p>
              <p class="login-place-line">Misamis Oriental</p>
            </div>
          </div>
          <p class="tagline">Child Development Monitoring System<br>Choose how you want to continue</p>
          <div class="role-buttons">
            <button class="role-btn teacher" onclick="BrightSteps.login('teacher')">👩‍🏫  Login as Teacher</button>
            <button class="role-btn parent"  onclick="BrightSteps.showParentLogin()">👨‍👧  Login as Parent / Guardian</button>
            <button class="role-btn role-btn-visitor"
              onclick="BrightSteps.login('visitor')">👋  Visitor — About &amp; Enrollment</button>
          </div>
          <p class="login-footnote">Community-based early learning for children ages 0–4</p>
        </div>
      </div>
    `;
  }

  /**
   * Parent login form:
   * Credentials given after enrollment = Guardian name + Child ID (no password by default).
   * Matching is case-insensitive; titles like Mr./Mrs./Ms. are ignored.
   * If the parent later sets a password in Settings, that password is also required.
   */
  function showParentLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-screen">
        <div class="login-card login-card-roles" style="max-width:440px;">
          <div class="login-identity login-identity-simple login-identity-compact">
            <div class="login-identity-text" style="text-align:center;width:100%;">
              <div class="brand" style="font-size:1.45rem;">🌱 BrightSteps</div>
              <p class="login-ncdc-line">Parent / Guardian access</p>
            </div>
          </div>
          <p class="text-muted" style="font-size:0.9rem;margin:0 0 1.25rem;line-height:1.45;text-align:left;">
            Use the <strong>guardian name</strong> and <strong>Child ID</strong> given after enrollment.
            Titles (Mr./Mrs.) and capital letters do not matter.
            If you set a password in Settings, enter it below as well.
          </p>
          <div style="text-align:left;">
            <label class="ecc-field-label">Parent / Guardian name</label>
            <input type="text" id="parent-guardian-name" class="ecc-field-input" placeholder="e.g. Mr. Khalid or Fatima Khalid"
              autocomplete="username" />
            <label class="ecc-field-label" style="margin-top:1rem;">Child ID <span class="text-muted">(recommended)</span></label>
            <input type="text" id="parent-child-code" class="ecc-field-input" placeholder="e.g. NCDC-001"
              autocomplete="off" />
            <label class="ecc-field-label" style="margin-top:1rem;">Password <span class="text-muted">(only if you set one)</span></label>
            <input type="password" id="parent-password" class="ecc-field-input" placeholder="Leave blank if not set"
              autocomplete="current-password" />
            <p id="parent-login-error" style="color:#d32f2f;font-size:0.85rem;margin:0.75rem 0 0;display:none;"></p>
          </div>
          <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:0.6rem;">
            <button class="btn btn-blue" style="width:100%;" onclick="BrightSteps.submitParentLogin()">Continue</button>
            <button class="btn" style="width:100%;background:#e8e8e8;color:var(--text);" onclick="BrightSteps.showLogin()">← Back</button>
          </div>
          <div style="margin-top:1.25rem;padding:0.85rem;background:#f5f9fc;border-radius:10px;text-align:left;font-size:0.82rem;color:var(--muted);">
            <strong>Demo:</strong><br>
            Guardian <code>Mr. Khalid</code> or <code>Khalid</code> → Amina (NCDC-001) &amp; Rayan (NCDC-009)<br>
            Guardian <code>Mrs. Ahmed</code> + Child ID <code>NCDC-002</code> → Omar only
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const el = document.getElementById('parent-guardian-name');
      if (el) el.focus();
    }, 50);
  }

  function _norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Strip common titles so "Mr. Khalid" and "Khalid" match the same record. */
  function _stripHonorific(s) {
    return _norm(s)
      .replace(/^(mr|mrs|ms|miss|dr|eng|atty)\.?\s+/i, '')
      .trim();
  }

  /**
   * Whole-word / token match only — never character substrings.
   * Prevents "Ali" matching inside "Khalid" (false sibling bug).
   * Allows: "Khalid" ↔ "Mr. Khalid", "Fatima" ↔ "Fatima Khalid".
   */
  function _nameTokensMatch(a, b) {
    const na = _stripHonorific(a);
    const nb = _stripHonorific(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const wa = na.split(/\s+/).filter(Boolean);
    const wb = nb.split(/\s+/).filter(Boolean);
    if (!wa.length || !wb.length) return false;

    // Single token equals any full token on the other side
    if (wa.length === 1 && wb.includes(wa[0])) return true;
    if (wb.length === 1 && wa.includes(wb[0])) return true;

    // All tokens of the shorter name appear as tokens of the longer
    const [shorter, longer] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
    if (shorter.every(t => longer.includes(t))) {
      // Require a meaningful token (length ≥ 4) or multi-token to avoid weak hits
      return shorter.length >= 2 || shorter.some(t => t.length >= 4);
    }
    return false;
  }

  function _guardianMatches(child, guardianName) {
    const g = _stripHonorific(guardianName);
    if (!g) return false;
    const fields = [
      child.parentLoginName,
      child.parentName,
      child.motherName,
      child.fatherName,
      child.guardianName
    ];
    return fields.some(f => f && _nameTokensMatch(f, guardianName));
  }

  function findChildrenForGuardian(guardianName, childCode) {
    const list = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const code = _norm(childCode).toUpperCase().replace(/\s+/g, '');

    if (code) {
      const byCode = list.find(c => {
        const cc = _norm(c.childCode).toUpperCase().replace(/\s+/g, '');
        return cc === code || String(c.id) === code.replace(/^ncdc-0*/i, '');
      });
      if (!byCode) return { error: 'No child found with that Child ID.', children: [] };
      if (!_guardianMatches(byCode, guardianName)) {
        return {
          error: 'That Child ID does not match this guardian name. Use the name from the enrollment credentials slip.',
          children: []
        };
      }
      return { error: null, children: [byCode] };
    }

    const matches = list.filter(c => _guardianMatches(c, guardianName));
    if (!matches.length) {
      return {
        error: 'No enrolled children found for that guardian name. Try the name from the credentials given after enrollment.',
        children: []
      };
    }
    return { error: null, children: matches };
  }

  function submitParentLogin() {
    const nameEl = document.getElementById('parent-guardian-name');
    const codeEl = document.getElementById('parent-child-code');
    const passEl = document.getElementById('parent-password');
    const errEl = document.getElementById('parent-login-error');
    const guardianName = (nameEl && nameEl.value || '').trim();
    const childCode = (codeEl && codeEl.value || '').trim();
    const password = (passEl && passEl.value || '');

    if (!guardianName) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = 'Please enter the parent or guardian name.';
      }
      return;
    }

    const result = findChildrenForGuardian(guardianName, childCode);
    if (result.error) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = result.error;
      }
      return;
    }

    const children = result.children;
    // If any matched child has a password set, require it (same password shared across siblings under this guardian)
    const requiredPass = children.map(c => c.parentPassword).find(p => p && String(p).length);
    if (requiredPass) {
      if (password !== String(requiredPass)) {
        if (errEl) {
          errEl.style.display = 'block';
          errEl.textContent = password
            ? 'Incorrect password. Use the password you set in Settings, or ask the teacher to reset it.'
            : 'A password is set for this account. Enter it to continue.';
        }
        return;
      }
    }

    const displayName = (children[0].parentLoginName || children[0].parentName || guardianName || '').trim();
    currentRole = 'parent';
    currentUser = {
      name: displayName || guardianName,
      role: 'parent',
      center: 'NCDC Medina',
      children,
      activeChildId: children[0].id,
      childName: children[0].name
    };

    ParentLayout.render(currentUser);
  }

  function openParentSettings() {
    if (typeof ParentLayout !== 'undefined' && ParentLayout.openSettings) {
      ParentLayout.openSettings();
    }
  }

  function selectChild(childId) {
    if (!currentUser || currentUser.role !== 'parent') return;
    const child = (currentUser.children || []).find(c => c.id === childId);
    if (!child) return;
    currentUser.activeChildId = child.id;
    currentUser.childName = child.name;
    ParentLayout.render(currentUser);
  }

  function login(role) {
    if (role === 'parent') {
      showParentLogin();
      return;
    }
    if (role === 'visitor') {
      currentRole = 'visitor';
      currentUser = { name: 'Visitor', role: 'visitor', center: 'NCDC Medina' };
      showVisitorShell();
      return;
    }
    currentRole = role;
    currentUser = users[role];
    if (role === 'teacher') {
      TeacherLayout.render(currentUser);
      navigate('dashboard');
    }
  }

  function showVisitorShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="parent-header visitor-header app-header">
        <div class="header-left">
          <div class="logo">🌱 BrightSteps</div>
        </div>
        <nav class="visitor-nav" aria-label="Visitor">
          <button type="button" class="visitor-nav-btn is-active" id="visitor-nav-about" onclick="BrightSteps.showVisitorAbout()">About NCDC</button>
          <button type="button" class="visitor-nav-btn" id="visitor-nav-enroll" onclick="BrightSteps.showVisitorEnrollment()">Enrollment</button>
        </nav>
        <div class="user-info">
          <span class="user-info-text">Visitor</span>
          <button class="btn btn-header-logout" onclick="BrightSteps.logout()">Exit</button>
        </div>
      </header>
      <div class="visitor-main" id="main-content"></div>
    `;
    showVisitorAbout();
  }

  function _setVisitorNav(page) {
    const about = document.getElementById('visitor-nav-about');
    const enroll = document.getElementById('visitor-nav-enroll');
    if (about) about.classList.toggle('is-active', page === 'about');
    if (enroll) enroll.classList.toggle('is-active', page === 'enrollment');
  }

  function showVisitorAbout() {
    const main = document.getElementById('main-content');
    if (!main) return;
    _setVisitorNav('about');
    main.className = 'visitor-main';
    if (typeof VisitorAbout !== 'undefined') {
      VisitorAbout.render(main);
    } else {
      main.innerHTML = '<div class="card" style="margin:1.5rem;"><p>About page failed to load. Hard-refresh the page.</p></div>';
    }
  }

  function showVisitorEnrollment() {
    const main = document.getElementById('main-content');
    if (!main) return;
    _setVisitorNav('enrollment');
    if (typeof VisitorAbout !== 'undefined' && VisitorAbout.destroy) VisitorAbout.destroy();
    main.className = 'visitor-main visitor-main-form';
    if (typeof VisitorEnrollment !== 'undefined') {
      VisitorEnrollment.render(main);
    } else {
      main.innerHTML = '<div class="card" style="margin:1.5rem;"><p>Enrollment form failed to load. Hard-refresh the page.</p></div>';
    }
  }

  function logout() {
    currentRole = null;
    currentUser = null;
    showLogin();
  }

  function navigate(page) {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (typeof TeacherLayout !== 'undefined') {
      if (TeacherLayout.setActive) TeacherLayout.setActive(page);
      if (TeacherLayout.closeNav) TeacherLayout.closeNav();
    } else {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const onclick = item.getAttribute('onclick') || '';
        if (onclick.includes(`'${page}'`)) item.classList.add('active');
      });
    }

    const routes = {
      dashboard: () => TeacherDashboard.render(main),
      children: () => TeacherChildren.render(main),
      development: () => TeacherDevelopment.render(main),
      health: () => TeacherHealth.render(main),
      feeding: () => TeacherFeeding.render(main),
      attendance: () => TeacherAttendance.render(main),
      contributions: () => TeacherContributions.render(main),
      reports: () => TeacherReports.render(main),
      calendar: () => TeacherCalendar.render(main),
      applications: () => TeacherChildren.render(main) /* merged into Children */
    };

    if (routes[page]) {
      try {
        routes[page]();
      } catch (err) {
        console.error('[BrightSteps] navigate error:', page, err);
        main.innerHTML = `<div class="card"><h2>Could not open this module</h2>
          <p class="text-muted">${(err && err.message) ? err.message : 'Unknown error'}</p>
          <p class="text-muted" style="font-size:0.85rem;">Try a hard refresh (Ctrl+Shift+R).</p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('dashboard')">← Dashboard</button>
        </div>`;
      }
    } else {
      main.innerHTML = `<div class="card"><h2>Module coming soon 🌱</h2><p class="text-muted">This section is under construction.</p></div>`;
    }
  }

  function getUser() {
    return currentUser;
  }

  function getRole() {
    return currentRole;
  }

  function getActiveChild() {
    if (!currentUser || currentUser.role !== 'parent') return null;
    const list = currentUser.children || [];
    return list.find(c => c.id === currentUser.activeChildId) || list[0] || null;
  }

  return {
    init,
    login,
    logout,
    navigate,
    getUser,
    getRole,
    getActiveChild,
    showLogin,
    showParentLogin,
    submitParentLogin,
    selectChild,
    findChildrenForGuardian,
    showVisitorAbout,
    showVisitorEnrollment,
    openParentSettings
  };
})();
