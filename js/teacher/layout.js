/**
 * Teacher shell: header + sidebar + main content area.
 * Mobile/tablet: collapsible drawer nav.
 */

const TeacherLayout = {
  render(user) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="app-header">
        <div class="header-left">
          <button type="button" class="nav-toggle no-print" aria-label="Open menu"
            onclick="TeacherLayout.toggleNav()">☰</button>
          <div class="logo">🌱 BrightSteps</div>
        </div>
        <div class="user-info">
          <span class="user-info-text">${user.name} • ${user.center}</span>
          <button class="btn btn-header-logout" onclick="BrightSteps.logout()">Logout</button>
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
  },

  nav(route) {
    this.closeNav();
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
