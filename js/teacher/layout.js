/**
 * Teacher shell: header + sidebar + main content area.
 * Matches the structure from the original mockup.
 */

const TeacherLayout = {
  render(user) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header>
        <div class="logo">🌱 BrightSteps</div>
        <div class="user-info">
          ${user.name} • ${user.center}
          <button class="btn" style="margin-left:1rem; padding:0.3rem 0.7rem; font-size:0.8rem;" onclick="BrightSteps.logout()">Logout</button>
        </div>
      </header>
      <div class="container">
        <aside class="sidebar">
          <div class="nav-item active" onclick="BrightSteps.navigate('dashboard')">🏠 Dashboard</div>
          <div class="nav-item" onclick="BrightSteps.navigate('children')">👦 Children</div>
          <div class="nav-item" onclick="BrightSteps.navigate('applications')">📝 Applications</div>
          <div class="nav-item" onclick="BrightSteps.navigate('development')">📈 Development Tracking</div>
          <div class="nav-item" onclick="BrightSteps.navigate('health')">❤️ Health Records</div>
          <div class="nav-item" onclick="BrightSteps.navigate('attendance')">📅 Attendance</div>
          <div class="nav-item" onclick="BrightSteps.navigate('reports')">📊 Reports</div>
          <div class="nav-item" onclick="BrightSteps.navigate('calendar')">🗓️ Calendar</div>
        </aside>
        <main class="main-content" id="main-content"></main>
      </div>
    `;
  }
};
