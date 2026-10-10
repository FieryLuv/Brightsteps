/**
 * Parent Portal dashboard
 * - Approved progress report
 * - Health summary (from teacher Health Records)
 * - Attendance summary (from teacher Attendance)
 */

const ParentDashboard = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-11
  _user: null,
  _container: null,

  render(container, user) {
    this._container = container;
    this._user = user;

    // Resolve active child from login (supports multi-child guardians)
    let child = null;
    if (user && user.children && user.children.length) {
      child = user.children.find(c => c.id === user.activeChildId) || user.children[0];
    } else if (typeof SampleChildren !== 'undefined') {
      const childName = user.childName || 'Amina Khalid';
      child = SampleChildren.find(c => c.name === childName) || SampleChildren[0];
    }

    const childName = child ? child.name : (user.childName || 'Child');
    const ageLabel = child ? child.ageLabel : '';
    const section = child ? child.section : '';
    const childCode = child && child.childCode ? child.childCode : '';

    container.innerHTML =
      this._welcome(user, childName, section, ageLabel, childCode) +
      this._profileBlock(childName, ageLabel, section, childCode) +
      this._progressCard(child) +
      this._healthCard(child) +
      this._sfpCard(child) +
      this._contribCard(child) +
      this._attendanceCard(child) +
      this._upcomingCard();
  },

  _welcome(user, childName, section, ageLabel, childCode) {
    const multi = user.children && user.children.length > 1
      ? ' <span class="text-muted">(' + user.children.length + ' children enrolled)</span>'
      : '';
    return (
      '<div style="background:var(--primary-light);padding:1.75rem;border-radius:16px;margin-bottom:1.75rem;text-align:center;">' +
      '<h1 style="margin-bottom:0.35rem;">Welcome, ' + (user.name || 'Parent') + '! 👨‍👧</h1>' +
      '<p class="text-muted">Viewing <strong>' + childName + '</strong>' +
      (childCode ? ' · ' + childCode : '') +
      (section ? ' • ' + section : '') +
      (ageLabel ? ' (' + ageLabel + ')' : '') + multi + '</p></div>'
    );
  },

  _profileBlock(childName, ageLabel, section, childCode) {
    return (
      '<div style="text-align:center;margin-bottom:2rem;">' +
      '<div style="width:110px;height:110px;border-radius:50%;background:var(--primary);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:white;font-size:2.8rem;box-shadow:0 6px 20px rgba(0,0,0,0.12);">👧</div>' +
      '<h2 style="margin:0;">' + childName + '</h2>' +
      '<p class="text-muted">' +
      [childCode, ageLabel, section].filter(Boolean).join(' • ') +
      '</p></div>'
    );
  },

  /** Selected evaluation period for progress report (parent). */
  reportPeriod: null,

  selectReportPeriod(period) {
    this.reportPeriod = period;
    if (this._container && this._user) this.render(this._container, this._user);
  },

  _progressCard(child) {
    if (!child || typeof ReportStore === 'undefined') {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>🌟 Progress Report</h3>' +
        '<p class="text-muted">No approved progress report yet.</p></div>'
      );
    }

    const approvedList = ReportStore.listApprovedForChild
      ? ReportStore.listApprovedForChild(child.id)
      : (ReportStore.getApproved(child.id) ? [ReportStore.getApproved(child.id)] : []);

    if (approvedList.length) {
      let approved = approvedList[approvedList.length - 1];
      if (this.reportPeriod) {
        const match = approvedList.find(r => r.period === this.reportPeriod);
        if (match) approved = match;
        else this.reportPeriod = approved.period;
      } else {
        this.reportPeriod = approved.period;
      }

      const periodTabs = approvedList.length > 1
        ? '<div class="no-print" style="display:flex;flex-wrap:wrap;gap:0.4rem;justify-content:center;margin-bottom:1rem;">' +
          approvedList.map(r => {
            const active = r.period === approved.period;
            return '<button class="btn ' + (active ? 'btn-blue' : '') + '" style="' +
              (active ? '' : 'background:#e8e8e8;color:var(--text);') +
              'padding:6px 14px;font-size:0.85rem;" onclick="ParentDashboard.selectReportPeriod(\'' +
              r.period + '\')">' + r.period + ' Evaluation</button>';
          }).join('') +
          '</div>'
        : '';

      const pills = (approved.domainScores || []).map(d => {
        const main = d.scaled != null && d.scaled !== '' ? 'SS ' + d.scaled : (d.label || '—');
        const color = d.label === 'Advanced' ? 'var(--primary)'
          : d.label === 'Needs support' ? '#d32f2f'
          : 'var(--success)';
        return '<div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:' + color + ';">' +
          main + '</div><div style="font-size:0.85rem;">' + (d.name || d.code) + '</div></div>';
      }).join('');

      const tips = (approved.tips || []).map(t => '<li>' + t + '</li>').join('');
      const comments = (approved.teacherComments || []).map(c =>
        '<li><strong>' + (c.itemTitle || '') + '</strong>' +
        (c.present ? '' : ' <span class="text-muted">(still developing)</span>') +
        ': ' + (c.comment || '') + '</li>'
      ).join('');
      const approvedDate = approved.approvedAt
        ? new Date(approved.approvedAt).toLocaleDateString()
        : '';

      return (
        '<div class="card mb-3">' +
        '<div class="no-print" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<span class="text-muted" style="font-size:0.85rem;">' +
        (approvedList.length > 1
          ? approvedList.length + ' approved evaluations — select a period'
          : 'Approved evaluation') +
        '</span>' +
        '<button class="btn" style="background:#fff3e0;color:#e65100;" onclick="window.print()">🖨 Print report</button></div>' +
        periodTabs +
        '<h3 style="text-align:center;">🌟 Progress Report – ' + approved.period + ' Evaluation</h3>' +
        (approved.overallLabel
          ? '<p style="text-align:center;margin:0.5rem 0 1rem;"><strong>' + approved.overallLabel + '</strong>' +
            (approved.standardScore != null ? ' · Standard Score: ' + approved.standardScore : '') + '</p>'
          : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:1rem;margin:1rem 0;">' +
        (pills || '<p class="text-muted" style="text-align:center;">Domain scores will appear after the teacher approves a report.</p>') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-top:1rem;">' +
        '<div style="background:#f8f9fa;padding:1.1rem;border-radius:12px;">' +
        '<h4 style="color:var(--primary-dark);margin:0 0 0.5rem;">👩‍🏫 Teacher\u2019s Note</h4>' +
        '<p style="margin:0;font-size:0.95rem;">' + (approved.teacherNote || '—') + '</p></div>' +
        '<div style="background:#e8f5e9;padding:1.1rem;border-radius:12px;">' +
        '<h4 style="color:#2e7d32;margin:0 0 0.5rem;">💡 Tips & Activity Suggestions</h4>' +
        '<ul style="padding-left:1.1rem;margin:0;line-height:1.7;font-size:0.95rem;">' +
        (tips || '<li>Talk with your child\u2019s teacher for home activity ideas.</li>') +
        '</ul></div></div>' +
        (comments
          ? '<div style="margin-top:1.25rem;padding:1rem;background:#fff8e1;border-radius:12px;border-left:4px solid #f9a825;">' +
            '<h4 style="margin:0 0 0.5rem;color:#f57f17;">📝 Teacher comments on skills</h4>' +
            '<ul style="padding-left:1.1rem;margin:0;line-height:1.7;font-size:0.95rem;">' + comments + '</ul></div>'
          : '') +
        (approved.parentDraft
          ? '<div style="margin-top:1.25rem;padding:1rem;background:var(--primary-light);border-radius:12px;">' +
            '<h4 style="margin:0 0 0.5rem;color:var(--primary-dark);">Summary</h4>' +
            '<p style="margin:0;font-size:0.95rem;">' + approved.parentDraft + '</p></div>'
          : '') +
        (approvedDate
          ? '<p class="text-muted" style="text-align:center;margin-top:1rem;font-size:0.85rem;">Approved by teacher on ' + approvedDate + '</p>'
          : '') +
        '</div>'
      );
    }

      const latestAssess = child && typeof AssessmentStore !== 'undefined'
      ? AssessmentStore.getLatest(child.id)
      : null;
    let waitMsg = 'No approved progress report yet. Once the teacher completes and approves an ECCD assessment report, it will appear here.';
    if (latestAssess) {
      waitMsg = 'Your child’s teacher has recorded the <strong>' + latestAssess.period +
        '</strong> evaluation' +
        (latestAssess.finalized ? ' (finalized)' : '') +
        '. It will appear here after the teacher reviews and <strong>approves</strong> the parent progress report.';
    }
    return (
      '<div class="card mb-3" style="text-align:center;">' +
      '<h3>🌟 Progress Report</h3>' +
      '<p class="text-muted">' + waitMsg + '</p></div>'
    );
  },

  _healthCard(child) {
    if (!child || typeof HealthStore === 'undefined') {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>❤️ Health Summary</h3>' +
        '<p class="text-muted">Health records are not available yet.</p></div>'
      );
    }

    const latest = HealthStore.getLatest(child.id);
    const profile = HealthStore.getProfile(child.id);
    const history = HealthStore.listForChild(child.id);

    if (!latest && !profile.allergies && !profile.medicalConditions && !profile.immunizations) {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>❤️ Health Summary</h3>' +
        '<p class="text-muted">No health measurements recorded yet. When the teacher saves height, weight, or medical notes, they will show here.</p></div>'
      );
    }

    const statusColor = latest && (latest.status || '').toLowerCase().includes('normal')
      ? 'var(--success)'
      : latest && (latest.status || '').toLowerCase().includes('under')
        ? 'var(--orange)'
        : latest ? '#d32f2f' : 'var(--muted)';

    const metrics = latest
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0.85rem;margin:1rem 0;">' +
        '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
        '<div style="font-size:1.5rem;font-weight:700;color:var(--success);">' +
        (latest.heightCm != null ? latest.heightCm + ' cm' : '—') + '</div>' +
        '<div class="text-muted">Height</div></div>' +
        '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
        '<div style="font-size:1.5rem;font-weight:700;color:var(--primary);">' +
        (latest.weightKg != null ? latest.weightKg + ' kg' : '—') + '</div>' +
        '<div class="text-muted">Weight</div></div>' +
        '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
        '<div style="font-size:1.5rem;font-weight:700;color:' + statusColor + ';">' +
        (latest.status || '—') + '</div>' +
        '<div class="text-muted">BMI Status' +
        (latest.bmi != null ? ' (' + latest.bmi + ')' : '') + '</div></div>' +
        '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
        '<div style="font-size:1.5rem;font-weight:700;color:#7b1fa2;">' +
        (function() {
          if (child && typeof SfpStore !== 'undefined') {
            var b = SfpStore.getBeneficiary(child.id);
            if (b && b.enrolledInSfp !== false && (b.childId || b.consent)) return 'Yes';
            if (b && b.enrolledInSfp === false) return 'No';
          }
          return latest.feedingParticipating ? 'Yes' : 'No';
        })() + '</div>' +
        '<div class="text-muted">Feeding program</div></div></div>' +
        '<p class="text-muted" style="text-align:center;font-size:0.85rem;margin:0 0 0.75rem;">Last measured: ' +
        (latest.date || '—') +
        (latest.nutritionStatus ? ' · Nutrition: ' + latest.nutritionStatus : '') + '</p>'
      : '<p class="text-muted" style="text-align:center;">No height/weight measurement yet.</p>';

    const medical =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:0.5rem;">' +
      '<div style="background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<h4 style="margin:0 0 0.4rem;color:var(--primary-dark);">Medical notes</h4>' +
      '<p style="margin:0.2rem 0;font-size:0.9rem;"><strong>Allergies:</strong> ' +
      (profile.allergies || 'None recorded') + '</p>' +
      '<p style="margin:0.2rem 0;font-size:0.9rem;"><strong>Conditions:</strong> ' +
      (profile.medicalConditions || 'None recorded') + '</p>' +
      '<p style="margin:0.2rem 0;font-size:0.9rem;"><strong>Immunizations:</strong> ' +
      (profile.immunizations || 'Not recorded') + '</p></div>' +
      '<div style="background:#e8f5e9;padding:1rem;border-radius:12px;">' +
      '<h4 style="margin:0 0 0.4rem;color:#2e7d32;">Nutrition</h4>' +
      '<p style="margin:0;font-size:0.9rem;">' +
      (latest && latest.notes
        ? latest.notes
        : latest && latest.nutritionStatus
          ? 'Status: ' + latest.nutritionStatus
          : 'No nutrition notes yet.') +
      '</p></div></div>';

    // Mini history (last 3)
    let hist = '';
    if (history.length > 1) {
      const rows = history.slice(0, 5).map(m =>
        '<tr><td>' + (m.date || '—') + '</td><td>' +
        (m.heightCm != null ? m.heightCm : '—') + '</td><td>' +
        (m.weightKg != null ? m.weightKg : '—') + '</td><td>' +
        (m.status || '—') + '</td></tr>'
      ).join('');
      hist =
        '<div style="margin-top:1rem;">' +
        '<h4 style="margin:0 0 0.5rem;">Recent measurements</h4>' +
        '<div class="eccd-table-wrap"><table class="eccd-table">' +
        '<thead><tr><th>Date</th><th>Height</th><th>Weight</th><th>Status</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;">❤️ Health Summary</h3>' +
      metrics + medical + hist + '</div>'
    );
  },

  /**
   * Minimal SFP view for parents — no other children's data, no matrices.
   */
  _contribCard(child) {
    if (!child || typeof ContributionStore === 'undefined') {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>💵 Monthly contribution</h3>' +
        '<p class="text-muted">Contribution status will appear when the center records payments.</p></div>'
      );
    }
    const ym = ContributionStore.currentYearMonth();
    const rec = ContributionStore.get(child.id, ym);
    if (!rec) {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>💵 Monthly contribution</h3>' +
        '<p class="text-muted" style="margin:0.35rem 0;">No record for <strong>' + ym + '</strong> yet.</p>' +
        '<p class="text-muted" style="margin:0;font-size:0.88rem;">Ask the teacher about this month’s contribution.</p></div>'
      );
    }
    const color = rec.status === 'paid' ? 'var(--success)'
      : rec.status === 'partial' ? 'var(--orange)'
      : rec.status === 'waived' ? 'var(--primary)'
      : '#c62828';
    const label = (rec.status || 'unpaid').charAt(0).toUpperCase() + (rec.status || 'unpaid').slice(1);
    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;">💵 Monthly contribution</h3>' +
      '<p style="text-align:center;margin:0.35rem 0;" class="text-muted">' + ym + '</p>' +
      '<p style="text-align:center;margin:0.5rem 0;">' +
      '<span style="font-size:1.25rem;font-weight:700;color:' + color + ';">' + label + '</span></p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;max-width:320px;margin:0.75rem auto 0;">' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.75rem;border-radius:10px;">' +
      '<div style="font-weight:700;">₱' + Number(rec.amountDue || 0).toLocaleString() + '</div>' +
      '<div class="text-muted" style="font-size:0.8rem;">Amount due</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.75rem;border-radius:10px;">' +
      '<div style="font-weight:700;">₱' + Number(rec.amountPaid || 0).toLocaleString() + '</div>' +
      '<div class="text-muted" style="font-size:0.8rem;">Amount paid</div></div></div>' +
      (rec.paidAt ? '<p class="text-muted" style="text-align:center;font-size:0.85rem;margin:0.75rem 0 0;">Paid date: ' + rec.paidAt + '</p>' : '') +
      (rec.notes ? '<p class="text-muted" style="text-align:center;font-size:0.85rem;margin:0.35rem 0 0;">' + rec.notes + '</p>' : '') +
      '</div>'
    );
  },

    _sfpCard(child) {
    if (!child || typeof SfpStore === 'undefined') {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>🍎 Supplementary Feeding (SFP)</h3>' +
        '<p class="text-muted">When the center enrolls your child in the feeding program, a short summary will appear here.</p></div>'
      );
    }
    const b = SfpStore.getBeneficiary(child.id);
    const enrolled = b && b.enrolledInSfp !== false && (b.childId || b.consent || b.fourPs != null || b.dewormed != null);
    if (!enrolled) {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>🍎 Supplementary Feeding (SFP)</h3>' +
        '<p style="margin:0.5rem 0;font-size:1.1rem;"><strong style="color:var(--muted);">Not enrolled</strong></p>' +
        '<p class="text-muted" style="margin:0;font-size:0.9rem;">Ask the teacher if your child will join the DSWD Supplementary Feeding Program.</p></div>'
      );
    }

    const cycle = SfpStore.getActiveCycle();
    const cycleLine = cycle
      ? ((cycle.cycleLabel || ('Cycle ' + cycle.cycleNumber)) + (cycle.schoolYear ? ' · SY ' + cycle.schoolYear : ''))
      : '';

    const yesNo = (v) => (v === true ? 'Yes' : (v === false ? 'No' : '—'));
    const entryH = b.entryHeightCm != null ? b.entryHeightCm + ' cm' : '—';
    const entryW = b.entryWeightKg != null ? b.entryWeightKg + ' kg' : '—';
    const entryDate = b.entryWeighDate || '—';

    // Recent hot meal: was this child fed on latest days?
    const hotDays = SfpStore.listHotMealDays().slice(-5).reverse();
    let fedNote = '';
    if (hotDays.length) {
      const bits = hotDays.map(d => {
        const st = (d.childStatuses || []).find(x => String(x.childId) === String(child.id));
        if (!st) return null;
        const label = st.status === 'fed' ? 'Fed' : (st.status === 'not_fed' ? 'Not fed' : 'Absent');
        return d.actualDate + ': ' + label;
      }).filter(Boolean);
      if (bits.length) {
        fedNote = '<p style="margin:0.75rem 0 0;font-size:0.88rem;"><strong>Recent feeding days:</strong> ' +
          bits.join(' · ') + '</p>';
      }
    }

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;">🍎 Supplementary Feeding (SFP)</h3>' +
      '<p style="text-align:center;margin:0.35rem 0;"><span style="background:#e8f5e9;color:#2e7d32;font-weight:700;padding:4px 12px;border-radius:16px;">Enrolled</span></p>' +
      (cycleLine ? '<p class="text-muted" style="text-align:center;margin:0.35rem 0;font-size:0.9rem;">' + cycleLine + '</p>' : '') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.75rem;margin:1rem 0;">' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:12px;">' +
      '<div style="font-weight:700;">' + entryDate + '</div><div class="text-muted" style="font-size:0.8rem;">Entry weighing</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:12px;">' +
      '<div style="font-weight:700;">' + entryH + '</div><div class="text-muted" style="font-size:0.8rem;">Entry height</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:12px;">' +
      '<div style="font-weight:700;">' + entryW + '</div><div class="text-muted" style="font-size:0.8rem;">Entry weight</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:12px;">' +
      '<div style="font-weight:700;">' + yesNo(b.dewormed) + '</div><div class="text-muted" style="font-size:0.8rem;">Dewormed</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:12px;">' +
      '<div style="font-weight:700;">' + yesNo(b.vitaminA) + '</div><div class="text-muted" style="font-size:0.8rem;">Vitamin A</div></div>' +
      '</div>' +
      fedNote +
      '<p class="text-muted" style="text-align:center;font-size:0.82rem;margin:0.75rem 0 0;">' +
      'Details are managed by the center for the DSWD feeding program. Contact the teacher for questions.</p></div>'
    );
  },

    _attendanceCard(child) {
    if (!child || typeof AttendanceStore === 'undefined') {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>📅 Attendance</h3>' +
        '<p class="text-muted">Attendance records are not available yet.</p></div>'
      );
    }

    const records = AttendanceStore.listForChild(child.id);
    if (!records.length) {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>📅 Attendance</h3>' +
        '<p class="text-muted">No attendance recorded yet for your child. When the teacher saves the daily attendance sheet, it will appear here.</p></div>'
      );
    }

    const present = records.filter(r => r.status === 'P').length;
    const absent = records.filter(r => r.status === 'A').length;
    const total = present + absent;
    const rate = total ? Math.round((present / total) * 100) : 0;

    // Current month filter
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const monthRecs = records.filter(r => (r.date || '').startsWith(monthPrefix));
    const mPresent = monthRecs.filter(r => r.status === 'P').length;
    const mAbsent = monthRecs.filter(r => r.status === 'A').length;
    const mTotal = mPresent + mAbsent;
    const mRate = mTotal ? Math.round((mPresent / mTotal) * 100) : null;

    // Recent consecutive absences
    const sorted = records.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let streak = 0;
    for (const r of sorted) {
      if (r.status === 'A') streak++;
      else break;
    }

    const recentRows = sorted.slice(0, 10).map(r => {
      const color = r.status === 'P' ? 'var(--success)' : '#d32f2f';
      const label = r.status === 'P' ? 'Present' : 'Absent';
      return '<tr><td>' + (r.date || '—') + '</td>' +
        '<td style="text-align:center;font-weight:700;color:' + color + ';">' + label + '</td>' +
        '<td style="font-size:0.85rem;">' + (r.remark || '—') + '</td></tr>';
    }).join('');

    const monthName = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;">📅 Attendance Record</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.85rem;margin:1rem 0;">' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--success);">' + present + '</div>' +
      '<div class="text-muted">Days present</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:#d32f2f;">' + absent + '</div>' +
      '<div class="text-muted">Days absent</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--primary);">' + rate + '%</div>' +
      '<div class="text-muted">Overall rate</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--primary-dark);">' +
      (mRate != null ? mRate + '%' : '—') + '</div>' +
      '<div class="text-muted">' + monthName + '</div></div></div>' +
      (streak >= 3
        ? '<p style="text-align:center;color:#d32f2f;font-weight:600;">Note: ' + streak +
          ' consecutive absences recorded recently. Please coordinate with the teacher.</p>'
        : '') +
      '<h4 style="margin:0.75rem 0 0.5rem;">Recent days</h4>' +
      '<div class="eccd-table-wrap"><table class="eccd-table">' +
      '<thead><tr><th>Date</th><th style="text-align:center;">Status</th><th>Remarks</th></tr></thead>' +
      '<tbody>' + recentRows + '</tbody></table></div></div>'
    );
  },

  /**
   * Parent calendar — same markers as teacher calendar (read-only).
   * Events come from CalendarStore (what the teacher sets).
   */
  _upcomingCard() {
    if (typeof CalendarStore === 'undefined') {
      return (
        '<div class="card" style="text-align:center;">' +
        '<h3>🗓️ Center Calendar</h3>' +
        '<p class="text-muted" style="margin:0;">Calendar is not available right now.</p></div>'
      );
    }

    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const title = monthNames[this.viewMonth] + ' ' + this.viewYear;
    const events = CalendarStore.listForMonth(this.viewYear, this.viewMonth);
    const upcoming = CalendarStore.upcoming(6);
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);

    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');

    let cells = '';
    for (let i = 0; i < startPad; i++) {
      cells += '<div class="cal-cell cal-empty"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.viewYear + '-' +
        String(this.viewMonth + 1).padStart(2, '0') + '-' +
        String(day).padStart(2, '0');
      const dayEvents = events.filter(function (e) { return e.date === dateStr; });
      const isToday = dateStr === todayStr;
      const has = dayEvents.length > 0;
      const titles = dayEvents.map(function (e) { return e.title; }).join(', ').replace(/"/g, '&quot;');
      const firstTitle = has
        ? String(dayEvents[0].title || '').replace(/</g, '&lt;')
        : '';
      cells +=
        '<div class="cal-cell ' + (isToday ? 'cal-today ' : '') + (has ? 'cal-has-event' : '') + '" ' +
        'role="button" tabindex="0" ' +
        'onclick="ParentDashboard.onDayClick(\'' + dateStr + '\')" ' +
        'onkeydown="if(event.key===\'Enter\')ParentDashboard.onDayClick(\'' + dateStr + '\')">' +
        '<span class="cal-daynum">' + day + '</span>' +
        (has ? '<span class="cal-dot" title="' + titles + '"></span>' : '') +
        (has ? '<span class="cal-event-label">' + firstTitle + '</span>' : '') +
        '</div>';
    }

    const upcomingList = upcoming.length
      ? upcoming.map(function (e) {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return '<li><strong>' + label + '</strong> – ' + e.title +
            (e.time ? ' <span class="text-muted">(' + e.time + ')</span>' : '') + '</li>';
        }).join('')
      : '<li class="text-muted">No upcoming events posted by the center yet.</li>';

    const monthList = events.length
      ? events.map(function (e) {
          return '<li><strong>' + e.date.slice(8) + '</strong> – ' + e.title +
            (e.type ? ' <span class="text-muted" style="font-size:0.85rem;">' + e.type + '</span>' : '') +
            '</li>';
        }).join('')
      : '<p class="text-muted" style="margin:0;">No events this month.</p>';

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;margin-top:0;">🗓️ Center Calendar</h3>' +
      '<p class="text-muted" style="text-align:center;margin:0 0 1rem;font-size:0.9rem;">' +
      'Same schedule set by the teacher. Click a highlighted day for details.</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;">' +
      '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="ParentDashboard.changeMonth(-1)">← Previous</button>' +
      '<h3 style="margin:0;font-size:1.1rem;">' + title + '</h3>' +
      '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="ParentDashboard.changeMonth(1)">Next →</button>' +
      '</div>' +
      '<div class="cal-grid">' + dow + cells + '</div>' +
      '<p class="text-muted" style="margin-top:0.75rem;font-size:0.85rem;">' +
      'Days with events are highlighted with a blue marker, same as the teacher calendar.</p>' +
      '</div>' +
      '<div class="dashboard-grid">' +
      '<div class="card" style="margin:0;">' +
      '<h3 style="margin-top:0;">Upcoming events</h3>' +
      '<ul style="line-height:2;padding-left:1.2rem;margin:0;">' + upcomingList + '</ul></div>' +
      '<div class="card" style="margin:0;">' +
      '<h3 style="margin-top:0;">This month (' + events.length + ')</h3>' +
      (events.length
        ? '<ul style="line-height:1.9;padding-left:1.2rem;margin:0;">' + monthList + '</ul>'
        : monthList) +
      '</div></div>'
    );
  },

  changeMonth(delta) {
    this.viewMonth += delta;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    if (this._container && this._user) {
      this.render(this._container, this._user);
    }
  },

  onDayClick(dateStr) {
    if (typeof CalendarStore === 'undefined') return;
    const events = CalendarStore.getByDate(dateStr);
    if (!events.length) {
      this._toast('No events on this day.');
      return;
    }
    const blocks = events.map(function (e) {
      return (
        '<div class="card" style="margin-bottom:0.75rem;">' +
        '<h3 style="margin:0 0 0.5rem;color:var(--primary-dark);">' + e.title + '</h3>' +
        '<p style="margin:0.25rem 0;"><strong>Date:</strong> ' + e.date + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Time:</strong> ' + (e.time || '—') + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Type:</strong> ' + (e.type || '—') + '</p>' +
        '<p style="margin:0.25rem 0;"><strong>Audience:</strong> ' + (e.audience || '—') + '</p>' +
        (e.notes
          ? '<div style="margin-top:0.75rem;padding:0.75rem;background:#f8f9fa;border-radius:8px;"><strong>Notes:</strong><br>' +
            e.notes + '</div>'
          : '') +
        '</div>'
      );
    }).join('');

    const html =
      '<div id="parent-cal-modal" class="bs-overlay">' +
      '<div class="bs-modal-panel" style="max-width:520px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.2rem;color:white;">Events — ' + dateStr + '</h2>' +
      '<button class="bs-modal-close" onclick="ParentDashboard.closeDayModal()">×</button></div>' +
      '<div class="bs-modal-body">' + blocks + '</div>' +
      '<div class="bs-modal-footer">' +
      '<button class="btn btn-blue" onclick="ParentDashboard.closeDayModal()">Close</button>' +
      '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  },

  closeDayModal() {
    const el = document.getElementById('parent-cal-modal');
    if (el) el.remove();
  },

  _toast(msg) {
    const t = document.createElement('div');
    t.className = 'ecc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }
};

if (typeof window !== 'undefined') window.ParentDashboard = ParentDashboard;
