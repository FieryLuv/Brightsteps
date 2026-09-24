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
        <div class="login-card">
          <div class="brand">🌱 BrightSteps</div>
          <p class="tagline">Child Development Monitoring System<br>National Child Development Center — Medina</p>
          <div class="role-buttons">
            <button class="role-btn teacher" onclick="BrightSteps.login('teacher')">👩‍🏫  Login as Teacher</button>
            <button class="role-btn parent"  onclick="BrightSteps.showParentLogin()">👨‍👧  Login as Parent / Guardian</button>
            <button class="role-btn" style="background:#fff3e0;border:2px solid #ffb74d;"
              onclick="BrightSteps.login('visitor')">👋  Visitor — Apply for Enrollment</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Parent login form:
   * - Guardian name (required) — matches parentName / motherName / fatherName
   * - Child ID optional (e.g. NCDC-001) — opens that child directly when name also matches
   * One guardian can have several enrolled children.
   */
  function showParentLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-screen">
        <div class="login-card" style="max-width:440px;">
          <div class="brand">🌱 BrightSteps</div>
          <p class="tagline">Parent / Guardian access</p>
          <p class="text-muted" style="font-size:0.9rem;margin:0 0 1.25rem;line-height:1.45;">
            Enter the guardian name on the child’s enrollment record.
            Optionally add the <strong>Child ID</strong> (e.g. NCDC-001) to open one child directly.
            If you have more than one child at the center, you can switch between them after login.
          </p>
          <div style="text-align:left;">
            <label class="ecc-field-label">Parent / Guardian name</label>
            <input type="text" id="parent-guardian-name" class="ecc-field-input" placeholder="e.g. Mr. Khalid or Fatima Khalid"
              autocomplete="name" />
            <label class="ecc-field-label" style="margin-top:1rem;">Child ID <span class="text-muted">(optional)</span></label>
            <input type="text" id="parent-child-code" class="ecc-field-input" placeholder="e.g. NCDC-001"
              autocomplete="off" />
            <p id="parent-login-error" style="color:#d32f2f;font-size:0.85rem;margin:0.75rem 0 0;display:none;"></p>
          </div>
          <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:0.6rem;">
            <button class="btn btn-blue" style="width:100%;" onclick="BrightSteps.submitParentLogin()">Continue</button>
            <button class="btn" style="width:100%;background:#e8e8e8;color:var(--text);" onclick="BrightSteps.showLogin()">← Back</button>
          </div>
          <div style="margin-top:1.25rem;padding:0.85rem;background:#f5f9fc;border-radius:10px;text-align:left;font-size:0.82rem;color:var(--muted);">
            <strong>Demo:</strong><br>
            Guardian <code>Mr. Khalid</code> or <code>Fatima Khalid</code> → Amina (NCDC-001) &amp; Rayan (NCDC-009)<br>
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

  function _guardianMatches(child, guardianName) {
    const g = _norm(guardianName);
    if (!g) return false;
    const fields = [child.parentName, child.motherName, child.fatherName];
    return fields.some(f => {
      const n = _norm(f);
      if (!n) return false;
      // allow partial match either way (e.g. "Khalid" matches "Mr. Khalid")
      return n === g || n.includes(g) || g.includes(n);
    });
  }

  function findChildrenForGuardian(guardianName, childCode) {
    const list = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const code = _norm(childCode).toUpperCase().replace(/\s+/g, '');

    if (code) {
      const byCode = list.find(c => _norm(c.childCode).toUpperCase() === code || String(c.id) === code.replace(/^ncdc-0*/, ''));
      if (!byCode) return { error: 'No child found with that Child ID.', children: [] };
      if (!_guardianMatches(byCode, guardianName)) {
        return {
          error: 'That Child ID does not match this guardian name. Check the name on the enrollment record.',
          children: []
        };
      }
      return { error: null, children: [byCode] };
    }

    const matches = list.filter(c => _guardianMatches(c, guardianName));
    if (!matches.length) {
      return {
        error: 'No enrolled children found for that guardian name. Try the name as written on the child’s record (e.g. Mr. Khalid, Fatima Khalid).',
        children: []
      };
    }
    return { error: null, children: matches };
  }

  function submitParentLogin() {
    const nameEl = document.getElementById('parent-guardian-name');
    const codeEl = document.getElementById('parent-child-code');
    const errEl = document.getElementById('parent-login-error');
    const guardianName = (nameEl && nameEl.value || '').trim();
    const childCode = (codeEl && codeEl.value || '').trim();

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
    currentRole = 'parent';
    currentUser = {
      name: guardianName,
      role: 'parent',
      center: 'NCDC Medina',
      children,
      activeChildId: children[0].id,
      childName: children[0].name
    };

    if (children.length === 1) {
      ParentLayout.render(currentUser);
    } else {
      // Multi-child: still enter portal with first selected; header shows switcher
      ParentLayout.render(currentUser);
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
      <header class="parent-header">
        <div class="logo">🌱 BrightSteps</div>
        <div class="user-info">
          Visitor · Enrollment
          <button class="btn" style="margin-left:1rem; padding:0.3rem 0.7rem; font-size:0.8rem;" onclick="BrightSteps.logout()">Exit</button>
        </div>
      </header>
      <div style="padding:1.75rem 2rem; overflow-y:auto; height:calc(100vh - var(--header-height));" id="main-content"></div>
    `;
    if (typeof VisitorEnrollment !== 'undefined') {
      VisitorEnrollment.render(document.getElementById('main-content'));
    } else {
      document.getElementById('main-content').innerHTML =
        '<div class="card"><p>Enrollment form failed to load. Hard-refresh the page.</p></div>';
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

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      const onclick = item.getAttribute('onclick') || '';
      if (onclick.includes(`'${page}'`)) item.classList.add('active');
    });

    const routes = {
      dashboard: () => TeacherDashboard.render(main),
      children: () => TeacherChildren.render(main),
      development: () => TeacherDevelopment.render(main),
      health: () => TeacherHealth.render(main),
      attendance: () => TeacherAttendance.render(main),
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
    findChildrenForGuardian
  };
})();
