/**
 * Teacher Dashboard
 * Visual structure matched to the original mockup.
 * Wired to SampleChildren for attention list and overview counts.
 */

const TeacherDashboard = {
  render(container) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const total = SampleChildren.length;
    const needsSupport = SampleChildren.filter(c => c.status === 'needs_support');
    const onTrack = SampleChildren.filter(c => c.status === 'on_track');
    const onTrackPct = total ? Math.round((onTrack.length / total) * 100) : 0;

    const attentionList = needsSupport.length
      ? needsSupport.map(c => `
          <li style="margin-bottom:0.35rem;">
            <a href="#" onclick="event.preventDefault(); TeacherChildren.openProfile(${c.id})"
               style="color:var(--text); text-decoration:none; font-weight:600;">
              ${c.name}
            </a>
            <span style="color:var(--orange);"> — ${c.focusArea || 'Needs support'}</span>
          </li>
        `).join('')
      : `<li class="text-muted">No children currently flagged</li>`;

    container.innerHTML = `
      <div class="flex justify-between items-center mb-3" style="flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>Good Morning, Teacher Irish! 👋</h1>
          <p class="text-muted">${today} | National Child Development Center — Medina</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Attendance -->
        <div class="card">
          <h3>Today's Attendance</h3>
          ${UI.bigStat('26 / 28')}
          ${UI.progressBar(93)}
          <p class="mt-2"><strong>Excellent attendance today!</strong></p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('attendance')">Check Class Attendance</button>
        </div>

        <!-- Feeding Program -->
        <div class="card">
          <h3>🍎 Feeding Program Status</h3>
          <p><strong>Today's Participation:</strong> 27/28 Children</p>
          <p class="text-green"><strong>Meal Served:</strong> Vegetable Rice + Fruits</p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('health')">Open Health Records</button>
        </div>

        <!-- Children Needing Attention (from SampleChildren) -->
        <div class="card">
          <h3>Children Needing Attention</h3>
          <ul style="line-height:1.9; padding-left:1.2rem; margin:0.5rem 0 0.75rem;">
            ${attentionList}
          </ul>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('children')">View All Children</button>
        </div>

        <!-- Quick Stats (from SampleChildren) -->
        <div class="card">
          <h3>Quick Overview</h3>
          <p>
            <strong>Children On Track:</strong> ${onTrack.length}/${total}<br>
            <strong>Needs Support:</strong> ${needsSupport.length}<br>
            <strong>On-Track Rate:</strong> ${onTrackPct}%
          </p>
          <button class="btn mt-2" onclick="BrightSteps.navigate('children')">Open Children</button>
        </div>

        <!-- Upcoming Events -->
        <div class="card">
          <h3>Upcoming Events</h3>
          <ul style="line-height:2.1; padding-left:1.2rem;">
            <li>📍 Parent-Teacher Meeting — Tomorrow 2:00 PM</li>
            <li>❤️ Health Check-up Day — Friday</li>
          </ul>
          <button class="btn mt-2" onclick="BrightSteps.navigate('calendar')">Open Calendar</button>
        </div>
      </div>
    `;
  }
};
