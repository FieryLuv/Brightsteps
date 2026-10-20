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
            <button class="role-btn teacher" onclick="BrightSteps.showTeacherLogin()">👩‍🏫  Login as Teacher / Head</button>
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
   * Teacher / Head Teacher login — same portal for all staff.
   * Head sees Staff management; faculty does not. One facility shared by all.
   */
  function showTeacherLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-screen">
        <div class="login-card login-card-roles" style="max-width:440px;">
          <div class="login-identity login-identity-simple login-identity-compact">
            <div class="login-identity-text" style="text-align:center;width:100%;">
              <div class="brand" style="font-size:1.45rem;">🌱 BrightSteps</div>
              <p class="login-ncdc-line">Teacher / Head Teacher access</p>
            </div>
          </div>
          <p class="text-muted" style="font-size:0.9rem;margin:0 0 1.25rem;line-height:1.45;text-align:left;">
            All staff use the same portal. <strong>Head Teacher</strong> can manage staff and facility settings;
            other teachers use the same modules without staff management.
          </p>
          <div style="text-align:left;">
            <label class="ecc-field-label">Email or username</label>
            <input type="text" id="teacher-username" class="ecc-field-input"
              placeholder="Email or username"
              autocomplete="username" />
            <label class="ecc-field-label" style="margin-top:1rem;">Password</label>
            <input type="password" id="teacher-password" class="ecc-field-input" placeholder="Password"
              autocomplete="current-password"
              onkeydown="if(event.key==='Enter')BrightSteps.submitTeacherLogin()" />
            <p id="teacher-login-error" style="color:#d32f2f;font-size:0.85rem;margin:0.75rem 0 0;display:none;"></p>
            <p id="teacher-login-mode" class="text-muted" style="font-size:0.78rem;margin:0.5rem 0 0;"></p>
          </div>
          <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:0.6rem;">
            <button class="btn btn-blue" style="width:100%;" id="teacher-login-btn" onclick="BrightSteps.submitTeacherLogin()">Sign in</button>
            <button class="btn" style="width:100%;background:#e8e8e8;color:var(--text);" onclick="BrightSteps.showLogin()">← Back</button>
          </div>
          <p class="text-muted" style="font-size:0.82rem;margin:1rem 0 0;text-align:left;line-height:1.45;">
            Use the email and password assigned by the Head Teacher (or center administrator).
          </p>
        </div>
      </div>
    `;
    setTimeout(() => {
      const el = document.getElementById('teacher-username');
      if (el) el.focus();
      const modeEl = document.getElementById('teacher-login-mode');
      if (modeEl && typeof BsSupabase !== 'undefined') {
        modeEl.textContent = BsSupabase.isConfigured()
          ? BsSupabase.statusLabel()
          : '';
      }
    }, 50);
  }

  function _enterTeacherSession(staff, isHead, source) {
    currentRole = 'teacher';
    currentUser = {
      name: staff.fullName || staff.username || staff.email || 'Teacher',
      role: 'teacher',
      staffRole: isHead ? 'head' : 'faculty',
      isHead: !!isHead,
      staffId: staff.id,
      authSource: source || 'local',
      center: (typeof TeacherStore !== 'undefined' && typeof TeacherStore.getFacility === 'function'
        ? (TeacherStore.getFacility().centerName || 'NCDC Medina')
        : 'NCDC Medina')
    };
    if (typeof TeacherLayout === 'undefined') {
      alert('TeacherLayout not loaded. Hard-refresh the page.');
      return;
    }
    const finishEnter = function () {
      TeacherLayout.render(currentUser);
      navigate('dashboard');
    };
    if (source === 'supabase' && typeof ChildrenRemote !== 'undefined' && ChildrenRemote.online()) {
      ChildrenRemote.ensureLoaded(true).then(finishEnter).catch(finishEnter);
      return;
    }
    finishEnter();
  }

  /**
   * Prefer Supabase Auth when configured (email + password).
   * Falls back to LocalStorage TeacherStore (username + password).
   */
  async function submitTeacherLogin() {
    const username = ((document.getElementById('teacher-username') || {}).value || '').trim();
    const password = ((document.getElementById('teacher-password') || {}).value || '').trim();
    const errEl = document.getElementById('teacher-login-error');
    const btn = document.getElementById('teacher-login-btn');
    const showErr = (msg) => {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = msg;
      } else {
        alert(msg);
      }
    };
    if (errEl) errEl.style.display = 'none';
    if (!username || !password) {
      showErr('Enter email/username and password.');
      return;
    }

    const online = typeof BsSupabase !== 'undefined' && BsSupabase.isConfigured();
    if (online) {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Signing in…';
      }
      try {
        // Supabase Auth uses email. If user typed a short username, try common pattern
        // or ask them to use the Auth email from step 3.
        let email = username;
        if (!username.includes('@')) {
          // Optional username → Auth email aliases (supabase-config usernameEmailMap)
          const aliases = (window.BRIGHTSTEPS_SUPABASE && window.BRIGHTSTEPS_SUPABASE.usernameEmailMap) || {};
          email = aliases[username.toLowerCase()] || username;
          if (!email.includes('@')) {
            showErr('Online login needs the email from Supabase Authentication → Users (not the old offline username).');
            return;
          }
        }
        const result = await BsSupabase.signIn(email, password);
        if (!result.ok) {
          // Fall back to local TeacherStore login if online auth fails
          if (!username.includes('@') && typeof TeacherStore !== 'undefined' && TeacherStore.authenticate) {
            const local = TeacherStore.authenticate(username, password);
            if (local.ok) {
              if (TeacherStore.clearRemoteSession) TeacherStore.clearRemoteSession();
              _enterTeacherSession(local.staff, !!local.isHead, 'local');
              return;
            }
          }
          showErr(result.error || 'Online login failed.');
          return;
        }
        const profile = result.profile || {};
        const isHead = profile.is_head === true || profile.role === 'head';
        if (typeof TeacherStore !== 'undefined' && TeacherStore.applyRemoteProfile) {
          TeacherStore.applyRemoteProfile(profile);
        }
        _enterTeacherSession({
          id: profile.id || (result.user && result.user.id),
          fullName: profile.full_name || (result.user && result.user.email) || 'Teacher',
          username: profile.username || '',
          email: (result.user && result.user.email) || email
        }, isHead, 'supabase');
        return;
      } catch (e) {
        showErr(e.message || 'Online login error.');
        return;
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Sign in';
        }
      }
    }

    // Offline / LocalStorage path
    if (typeof TeacherStore === 'undefined') {
      showErr('TeacherStore not loaded. Hard-refresh (Ctrl+Shift+R).');
      return;
    }
    if (typeof TeacherStore.authenticate !== 'function') {
      showErr('TeacherStore.authenticate missing — hard-refresh.');
      return;
    }
    if (TeacherStore.clearRemoteSession) TeacherStore.clearRemoteSession();
    const result = TeacherStore.authenticate(username, password);
    if (!result.ok) {
      showErr(result.error || 'Login failed.');
      return;
    }
    _enterTeacherSession(result.staff, !!result.isHead, 'local');
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
            <input type="text" id="parent-guardian-name" class="ecc-field-input" placeholder="Guardian name from enrollment"
              autocomplete="username" />
            <label class="ecc-field-label" style="margin-top:1rem;">Child ID <span class="text-muted">(recommended)</span></label>
            <input type="text" id="parent-child-code" class="ecc-field-input" placeholder="Child ID from enrollment"
              autocomplete="off" />
            <label class="ecc-field-label" style="margin-top:1rem;">Password <span class="text-muted">(only if you set one)</span></label>
            <input type="password" id="parent-password" class="ecc-field-input" placeholder="Optional"
              autocomplete="current-password" />
            <p id="parent-login-error" style="color:#d32f2f;font-size:0.85rem;margin:0.75rem 0 0;display:none;"></p>
          </div>
          <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:0.6rem;">
            <button class="btn btn-blue" style="width:100%;" onclick="BrightSteps.submitParentLogin()">Continue</button>
            <button class="btn" style="width:100%;background:#e8e8e8;color:var(--text);" onclick="BrightSteps.showLogin()">← Back</button>
          </div>
          <p class="text-muted" style="font-size:0.82rem;margin:1rem 0 0;text-align:left;line-height:1.45;">
            Ask the teacher if you need your Child ID or help resetting a password.
          </p>
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
    const list = (typeof SampleChildren !== 'undefined' ? SampleChildren : [])
      .filter(c => c && c.archived !== true);
    const code = _norm(childCode).toUpperCase().replace(/\s+/g, '');

    // Child ID verifies access; then load ALL siblings under the same guardian family.
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
      const family = list.filter(c =>
        _guardianMatches(c, guardianName) || _sameParentFamily(c, byCode)
      );
      // Prefer verified child first in the list
      const ordered = [byCode].concat(family.filter(c => String(c.id) !== String(byCode.id)));
      return { error: null, children: ordered };
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

  /** Siblings may share parentLoginName / parentName / mother / father even if login typed form differs slightly. */
  function _sameParentFamily(a, b) {
    if (!a || !b) return false;
    const keys = ['parentLoginName', 'parentName', 'motherName', 'fatherName'];
    for (let i = 0; i < keys.length; i++) {
      const ka = _norm(a[keys[i]]);
      const kb = _norm(b[keys[i]]);
      if (ka && kb && ka === kb) return true;
    }
    return false;
  }

  async function submitParentLogin() {
    const nameEl = document.getElementById('parent-guardian-name');
    const codeEl = document.getElementById('parent-child-code');
    const passEl = document.getElementById('parent-password');
    const errEl = document.getElementById('parent-login-error');
    const guardianName = (nameEl && nameEl.value || '').trim();
    const childCode = (codeEl && codeEl.value || '').trim();
    const password = (passEl && passEl.value || '');

    function showErr(msg) {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = msg; }
    }

    if (!guardianName) {
      showErr('Please enter the parent or guardian name.');
      return;
    }

    function enterParent(children) {
      if (!children || !children.length) {
        showErr('No enrolled children found for those credentials.');
        return;
      }
      // Prefer the Child ID entered at login as the active child when present
      const codeNorm = (childCode || '').trim().toUpperCase().replace(/\s+/g, '');
      let active = children[0];
      if (codeNorm) {
        const hit = children.find(c => {
          const cc = String(c.childCode || '').trim().toUpperCase().replace(/\s+/g, '');
          return cc === codeNorm;
        });
        if (hit) active = hit;
      }
      const displayName = (active.parentLoginName || active.parentName || guardianName || '').trim();
      currentRole = 'parent';
      currentUser = {
        name: displayName || guardianName,
        role: 'parent',
        center: 'NCDC Medina',
        children: children,
        activeChildId: active.id,
        childName: active.name
      };
      ParentLayout.render(currentUser);
    }

    // Prefer server login so other devices get the same children + reports
    if (typeof ParentRemote !== 'undefined' && ParentRemote.online()) {
      try {
        if (errEl) { errEl.style.display = 'none'; }
        const remote = await ParentRemote.login(guardianName, childCode, password);
        if (!remote.ok) {
          showErr(remote.error || 'Could not sign in.');
          return;
        }
        ParentRemote.applyHydration(remote);
        if (ParentRemote.saveSession) ParentRemote.saveSession(guardianName, childCode, password);
        enterParent(remote.children);
        return;
      } catch (e) {
        console.warn('[parent login] remote failed, trying local', e);
      }
    }

    // LocalStorage fallback (same browser as teacher)
    const result = findChildrenForGuardian(guardianName, childCode);
    if (result.error) {
      showErr(result.error);
      return;
    }
    const children = result.children;
    const requiredPass = children.map(c => c.parentPassword).find(p => p && String(p).length);
    if (requiredPass) {
      if (password !== String(requiredPass)) {
        showErr(password
          ? 'Incorrect password. Use the password you set in Settings, or ask the teacher to reset it.'
          : 'A password is set for this account. Enter it to continue.');
        return;
      }
    }
    enterParent(children);
  }

  function openParentSettings() {
    if (typeof ParentLayout !== 'undefined' && ParentLayout.openSettings) {
      ParentLayout.openSettings();
    }
  }

  function selectChild(childId) {
    if (!currentUser || currentUser.role !== 'parent') return;
    const child = (currentUser.children || []).find(c => String(c.id) === String(childId));
    if (!child) {
      console.warn('[BrightSteps] selectChild: child not found', childId);
      return;
    }
    currentUser.activeChildId = child.id;
    currentUser.childName = child.name || '';
    try {
      if (typeof ParentLayout !== 'undefined' && ParentLayout.render) {
        ParentLayout.render(currentUser);
      }
    } catch (e) {
      console.error('[BrightSteps] selectChild render failed', e);
      alert('Could not switch child. Try Refresh or log in again.');
    }
  }

  function login(role) {
    if (role === 'parent') {
      showParentLogin();
      return;
    }
    if (role === 'teacher') {
      showTeacherLogin();
      return;
    }
    if (role === 'visitor') {
      currentRole = 'visitor';
      currentUser = { name: 'Visitor', role: 'visitor', center: 'NCDC Medina' };
      showVisitorShell();
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
    if (typeof ParentRemote !== 'undefined' && ParentRemote.clearSession) ParentRemote.clearSession();
    // continued
    return _bsLogoutBody();
  }
  function _bsLogoutBody() {
    currentRole = null;
    currentUser = null;
    if (typeof TeacherStore !== 'undefined' && TeacherStore.clearRemoteSession) {
      TeacherStore.clearRemoteSession();
    }
    if (typeof BsSupabase !== 'undefined' && BsSupabase.signOut) {
      BsSupabase.signOut().catch(function () { /* ignore */ });
    }
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
    return list.find(c => String(c.id) === String(currentUser.activeChildId)) || list[0] || null;
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
    showTeacherLogin,
    submitTeacherLogin,
    showParentLogin,
    submitParentLogin,
    selectChild,
    findChildrenForGuardian,
    showVisitorAbout,
    showVisitorEnrollment,
    openParentSettings
  };
})();
