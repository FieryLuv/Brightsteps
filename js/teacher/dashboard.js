/**
 * Teacher Dashboard — live counts; cleaner card layout with aligned actions.
 */
const TeacherDashboard = {
  render(container) {
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const todayISO = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const total = (typeof SampleChildren !== 'undefined') ? SampleChildren.length : 0;
    const needsSupport = (SampleChildren || []).filter(c => c.status === 'needs_support');
    const onTrack = (SampleChildren || []).filter(c => c.status === 'on_track');
    const onTrackPct = total ? Math.round((onTrack.length / total) * 100) : 0;

    const pendingApps = (typeof ApplicationStore !== 'undefined')
      ? ApplicationStore.pendingCount()
      : 0;

    // Attendance today — use ClassStore keys when available
    let attPresent = 0, attAbsent = 0, attSections = 0;
    const sectionKeys = (typeof ClassStore !== 'undefined' && ClassStore.options)
      ? ClassStore.options(false).map(o => o.key)
      : ['explorers', 'stars', 'sunshine'];
    if (typeof AttendanceStore !== 'undefined' && typeof SampleChildren !== 'undefined') {
      sectionKeys.forEach(sk => {
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

    // SFP beneficiaries preferred; fall back to health feeding flag
    let feedYes = 0, feedKnown = 0;
    if (typeof SfpStore !== 'undefined') {
      const bens = SfpStore.listBeneficiaries();
      feedKnown = bens.length;
      feedYes = bens.length;
    }
    if (!feedKnown && typeof HealthStore !== 'undefined' && typeof SampleChildren !== 'undefined') {
      SampleChildren.forEach(c => {
        const latest = HealthStore.getLatest(c.id);
        if (!latest) return;
        feedKnown++;
        if (latest.feedingParticipating) feedYes++;
      });
    }

    let upcomingHtml = '<li class="text-muted">No upcoming events</li>';
    if (typeof CalendarStore !== 'undefined') {
      const up = CalendarStore.upcoming(4);
      if (up.length) {
        upcomingHtml = up.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return `<li><strong>${label}</strong> — ${e.title}${e.time ? ' · ' + e.time : ''}</li>`;
        }).join('');
      }
    }

    const attentionList = needsSupport.length
      ? needsSupport.slice(0, 5).map(c => `
          <li>
            <button type="button" class="dash-link"
              onclick="BrightSteps.navigate('children'); setTimeout(function(){ if (window.TeacherChildren) TeacherChildren.openProfile(${c.id}); }, 80)">
              ${c.name}
            </button>
            <span class="dash-tag">${c.focusArea || 'Needs support'}</span>
          </li>
        `).join('')
      : `<li class="text-muted">No children currently flagged</li>`;

    const attStat = attRate != null ? `${attPresent} / ${attTotal}` : '—';
    const attBar = attRate != null ? attRate : 0;
    const attMsg = attRate != null
      ? (attRate >= 90 ? 'Strong attendance today.' : 'Attendance recorded for today.')
      : 'No attendance saved for today yet.';

    const feedLine = feedKnown
      ? `${feedYes} / ${feedKnown}`
      : '—';
    const feedSub = feedKnown
      ? (typeof SfpStore !== 'undefined' && SfpStore.listBeneficiaries().length
          ? 'SFP beneficiaries on file'
          : 'From health participation flags')
      : 'No feeding records yet';

    container.innerHTML = `
      <div class="dash-hero">
        <div>
          <h1 class="dash-hero-title">${greeting}, Teacher Irish!</h1>
          <p class="text-muted dash-hero-sub">${today} · National Child Development Center — Medina</p>
        </div>
      </div>

      <div class="dash-quick no-print">
        <span class="dash-quick-label">Quick actions</span>
        <div class="dash-quick-btns">
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('children')">Children</button>
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('attendance')">Attendance</button>
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('development')">Development</button>
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('feeding')">SFP Feeding</button>
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('reports')">Reports</button>
          <button type="button" class="btn btn-outline" onclick="BrightSteps.navigate('calendar')">Calendar</button>
        </div>
      </div>

      <div class="dashboard-grid dash-stats">
        <div class="card dash-card">
          <div class="dash-card-body">
            <div class="dash-card-icon" aria-hidden="true">📝</div>
            <h3>Enrollment</h3>
            <p class="dash-metric ${pendingApps ? 'is-warn' : 'is-ok'}">${pendingApps} pending</p>
            <p class="text-muted dash-card-desc">Visitor applications waiting under Children.</p>
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('children')">Review applications</button>
          </div>
        </div>

        <div class="card dash-card">
          <div class="dash-card-body">
            <div class="dash-card-icon" aria-hidden="true">📅</div>
            <h3>Today’s attendance</h3>
            <p class="dash-metric">${attStat}</p>
            ${attRate != null
              ? `<div class="dash-progress"><div class="dash-progress-bar" style="width:${attBar}%"></div></div>
                 <p class="text-muted dash-card-desc">${attMsg}${attSections ? ' · ' + attSections + ' class' + (attSections > 1 ? 'es' : '') : ''}</p>`
              : `<p class="text-muted dash-card-desc">${attMsg}</p>`}
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('attendance')">Take attendance</button>
          </div>
        </div>

        <div class="card dash-card">
          <div class="dash-card-body">
            <div class="dash-card-icon" aria-hidden="true">🍎</div>
            <h3>Feeding / SFP</h3>
            <p class="dash-metric">${feedLine}</p>
            <p class="text-muted dash-card-desc">${feedSub}</p>
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('feeding')">Open SFP Feeding</button>
          </div>
        </div>

        <div class="card dash-card">
          <div class="dash-card-body">
            <div class="dash-card-icon" aria-hidden="true">📊</div>
            <h3>Enrollment snapshot</h3>
            <ul class="dash-stat-list">
              <li><span>Enrolled</span><strong>${total}</strong></li>
              <li><span>On track</span><strong>${onTrack.length} <span class="text-muted">(${onTrackPct}%)</span></strong></li>
              <li><span>Needs support</span><strong class="${needsSupport.length ? 'is-warn' : ''}">${needsSupport.length}</strong></li>
            </ul>
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('development')">Development tracking</button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid dash-secondary">
        <div class="card dash-card">
          <div class="dash-card-body">
            <h3>Children needing attention</h3>
            <ul class="dash-attention">${attentionList}</ul>
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('children')">View all children</button>
          </div>
        </div>

        <div class="card dash-card">
          <div class="dash-card-body">
            <h3>Upcoming events</h3>
            <ul class="dash-events">${upcomingHtml}</ul>
          </div>
          <div class="dash-card-actions">
            <button type="button" class="btn btn-blue" onclick="BrightSteps.navigate('calendar')">Open calendar</button>
          </div>
        </div>
      </div>
    `;
  }
};
