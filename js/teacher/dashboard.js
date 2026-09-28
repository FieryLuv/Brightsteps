/**
 * Teacher Dashboard — live counts from stores where available.
 */
const TeacherDashboard = {
  render(container) {
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const todayISO = new Date().toISOString().slice(0, 10);

    const total = (typeof SampleChildren !== 'undefined') ? SampleChildren.length : 0;
    const needsSupport = (SampleChildren || []).filter(c => c.status === 'needs_support');
    const onTrack = (SampleChildren || []).filter(c => c.status === 'on_track');
    const onTrackPct = total ? Math.round((onTrack.length / total) * 100) : 0;

    const pendingApps = (typeof ApplicationStore !== 'undefined')
      ? ApplicationStore.pendingCount()
      : 0;

    // Attendance today across all sections
    let attPresent = 0, attAbsent = 0, attSections = 0;
    if (typeof AttendanceStore !== 'undefined' && typeof SampleChildren !== 'undefined') {
      ['explorers', 'stars', 'sunshine'].forEach(sk => {
        const day = AttendanceStore.getDay(todayISO, sk);
        if (!day || !day.marks) return;
        attSections++;
        Object.values(day.marks).forEach(m => {
          if (m === 'P') attPresent++;
          else if (m === 'A') attAbsent++;
        });
      });
    }
    const attTotal = attPresent + attAbsent;
    const attRate = attTotal ? Math.round((attPresent / attTotal) * 100) : null;

    // Feeding participation from latest health records
    let feedYes = 0, feedKnown = 0;
    if (typeof HealthStore !== 'undefined' && typeof SampleChildren !== 'undefined') {
      SampleChildren.forEach(c => {
        const latest = HealthStore.getLatest(c.id);
        if (!latest) return;
        feedKnown++;
        if (latest.feedingParticipating) feedYes++;
      });
    }

    // Upcoming calendar
    let upcomingHtml = '<li class="text-muted">No upcoming events</li>';
    if (typeof CalendarStore !== 'undefined') {
      const up = CalendarStore.upcoming(4);
      if (up.length) {
        upcomingHtml = up.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return `<li><strong>${label}</strong> — ${e.title}${e.time ? ' (' + e.time + ')' : ''}</li>`;
        }).join('');
      }
    }

    const attentionList = needsSupport.length
      ? needsSupport.map(c => `
          <li style="margin-bottom:0.35rem;">
            <a href="#" onclick="event.preventDefault(); BrightSteps.navigate('children'); setTimeout(()=>TeacherChildren.openProfile(${c.id}),80)"
               style="color:var(--text); text-decoration:none; font-weight:600;">
              ${c.name}
            </a>
            <span style="color:var(--orange);"> — ${c.focusArea || 'Needs support'}</span>
          </li>
        `).join('')
      : `<li class="text-muted">No children currently flagged</li>`;

    const attStat = attRate != null
      ? `${attPresent} / ${attTotal}`
      : '—';
    const attBar = attRate != null ? attRate : 0;
    const attMsg = attRate != null
      ? (attRate >= 90 ? 'Strong attendance today.' : 'Attendance recorded for today.')
      : 'No attendance saved for today yet.';

    container.innerHTML = `
      <div class="flex justify-between items-center mb-3" style="flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>Good Morning, Teacher Irish! 👋</h1>
          <p class="text-muted">${today} | National Child Development Center — Medina</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <h3>📝 Enrollment Applications</h3>
          <p style="font-size:1.5rem;font-weight:700;color:${pendingApps ? 'var(--orange)' : 'var(--success)'};margin:0.35rem 0;">
            ${pendingApps} pending
          </p>
          <p class="text-muted" style="margin:0;">Visitor applications under Children.</p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('children')">Open Children</button>
        </div>

        <div class="card">
          <h3>Today's Attendance</h3>
          ${typeof UI !== 'undefined' ? UI.bigStat(attStat) : `<div style="font-size:1.8rem;font-weight:700;">${attStat}</div>`}
          ${typeof UI !== 'undefined' && attRate != null ? UI.progressBar(attBar) : ''}
          <p class="mt-2">${attMsg}${attSections ? ` <span class="text-muted">(${attSections} section${attSections > 1 ? 's' : ''})</span>` : ''}</p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('attendance')">Check Class Attendance</button>
        </div>

        <div class="card">
          <h3>🍎 Feeding Program</h3>
          <p><strong>Participating (latest records):</strong>
            ${feedKnown ? `${feedYes} / ${feedKnown}` : '— (no health records yet)'}</p>
          <p class="text-muted" style="font-size:0.85rem;margin:0;">From Health Records participation flag.</p>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('health')">Open Health Records</button>
        </div>

        <div class="card">
          <h3>Children Needing Attention</h3>
          <ul style="line-height:1.9; padding-left:1.2rem; margin:0.5rem 0 0.75rem;">
            ${attentionList}
          </ul>
          <button class="btn btn-blue mt-2" onclick="BrightSteps.navigate('children')">View All Children</button>
        </div>

        <div class="card">
          <h3>Quick Overview</h3>
          <p>
            <strong>Enrolled:</strong> ${total}<br>
            <strong>On Track:</strong> ${onTrack.length} (${onTrackPct}%)<br>
            <strong>Needs Support:</strong> ${needsSupport.length}
          </p>
          <button class="btn mt-2" onclick="BrightSteps.navigate('development')">Development Tracking</button>
        </div>

        <div class="card">
          <h3>Upcoming Events</h3>
          <ul style="line-height:2.1; padding-left:1.2rem;margin:0.5rem 0;">
            ${upcomingHtml}
          </ul>
          <button class="btn mt-2" onclick="BrightSteps.navigate('calendar')">Open Calendar</button>
        </div>
      </div>
    `;
  }
};
