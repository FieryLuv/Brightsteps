/**
 * Parent Portal dashboard
 * - Approved progress report
 * - Health summary (from teacher Health Records)
 * - Attendance summary (from teacher Attendance)
 */

const ParentDashboard = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-11 calendar
  attYear: new Date().getFullYear(),
  attMonth: new Date().getMonth(), // 0-11 attendance filter
  _user: null,
  _container: null,

  render(container, user) {
    this._container = container;
    this._user = user;

    const paint = function () {
      let child = null;
      if (user && user.children && user.children.length) {
        child = user.children.find(c => c.id === user.activeChildId) || user.children[0];
      } else if (typeof SampleChildren !== 'undefined') {
        const childName = user.childName || '';
        child = SampleChildren.find(c => c.name === childName) || SampleChildren[0];
      }

      const childName = child ? child.name : (user.childName || 'Child');
      const ageLabel = child ? child.ageLabel : '';
      const section = child ? child.section : '';
      const childCode = child && child.childCode ? child.childCode : '';

      container.innerHTML =
        ParentDashboard._welcome(user, childName, section, ageLabel, childCode) +
        ParentDashboard._profileBlock(child, childName, ageLabel, section, childCode) +
        ParentDashboard._progressCard(child) +
        ParentDashboard._healthCard(child) +
        ParentDashboard._sfpCard(child) +
        ParentDashboard._contribCard(child) +
        ParentDashboard._attendanceCard(child) +
        ParentDashboard._upcomingCard();
    };

    // Load center calendar from Supabase when configured (works for parent/anon)
    if (typeof CalendarStore !== 'undefined' && CalendarStore.hydrateAll &&
        typeof CalendarRemote !== 'undefined' && CalendarRemote.online()) {
      CalendarStore.hydrateAll().then(paint).catch(paint);
      return;
    }
    paint();
  },

  _welcome(user, childName, section, ageLabel, childCode) {
    const multi = user.children && user.children.length > 1
      ? ' <span class="text-muted">(' + user.children.length + ' children enrolled)</span>'
      : '';
    return (
      '<div style="background:var(--primary-light);padding:1.75rem;border-radius:16px;margin-bottom:1.75rem;text-align:center;">' +
      '<h1 style="margin-bottom:0.35rem;">Welcome, ' + (user.name || 'Parent') + '! 👨‍👧</h1>' +
      '<p class="text-muted" style="margin-bottom:0.85rem;">Viewing <strong>' + childName + '</strong>' +
      (childCode ? ' · ' + childCode : '') +
      (section ? ' • ' + section : '') +
      (ageLabel ? ' (' + ageLabel + ')' : '') + multi + '</p>' +
      '<button type="button" class="btn btn-blue" id="parent-refresh-btn" ' +
      'onclick="ParentDashboard.refreshFromServer()" style="font-size:0.9rem;">' +
      '↻ Refresh latest from center</button>' +
      '<p id="parent-refresh-msg" class="text-muted" style="margin:0.5rem 0 0;font-size:0.8rem;"></p>' +
      '</div>'
    );
  },

  async refreshFromServer() {
    const msg = document.getElementById('parent-refresh-msg');
    const btn = document.getElementById('parent-refresh-btn');
    function setMsg(text, isErr) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.style.color = isErr ? '#d32f2f' : 'var(--muted)';
    }
    if (typeof ParentRemote === 'undefined') {
      setMsg('Parent sync script missing. Push latest code and hard-refresh.', true);
      return;
    }
    // Force client init before checking
    if (typeof BsSupabase !== 'undefined') {
      try { BsSupabase.get(); } catch (e) { /* ignore */ }
    }
    if (!ParentRemote.online()) {
      const why = (ParentRemote.offlineReason && ParentRemote.offlineReason()) ||
        (typeof BsSupabase !== 'undefined' ? (BsSupabase.lastError || BsSupabase.statusLabel()) : 'unknown');
      setMsg('Not connected: ' + why, true);
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
    setMsg('Loading reports, attendance, health, SFP, contributions…');
    try {
      const remote = await ParentRemote.refresh();
      if (!remote.ok) {
        setMsg(remote.error || 'Could not refresh. Try logging in again.', true);
        if (btn) { btn.disabled = false; btn.textContent = '↻ Refresh latest from center'; }
        return;
      }
      // Keep current user identity; refresh child list from server
      if (this._user && remote.children && remote.children.length) {
        const prevId = this._user.activeChildId;
        this._user.children = remote.children;
        const still = remote.children.find(c => String(c.id) === String(prevId));
        this._user.activeChildId = still ? still.id : remote.children[0].id;
        this._user.childName = (still || remote.children[0]).name;
        this._user.name = remote.children[0].parentLoginName || remote.children[0].parentName || this._user.name;
      }
      if (typeof CalendarStore !== 'undefined' && CalendarStore.hydrateAll) {
        try { await CalendarStore.hydrateAll(); } catch (e) { /* ignore */ }
      }
      if (this._container && this._user) {
        this.render(this._container, this._user);
      }
      // Message after re-render
      setTimeout(function () {
        const m2 = document.getElementById('parent-refresh-msg');
        if (m2) {
          m2.textContent = 'Updated ' + new Date().toLocaleTimeString() +
            ' · reports, attendance, health, SFP, contributions, calendar';
          m2.style.color = 'var(--success, #2e7d32)';
        }
      }, 50);
    } catch (e) {
      console.error('[ParentDashboard] refresh', e);
      setMsg((e && e.message) || 'Refresh failed.', true);
      if (btn) { btn.disabled = false; btn.textContent = '↻ Refresh latest from center'; }
    }
  },

  _profileBlock(child, childName, ageLabel, section, childCode) {
    const avatar = (typeof FileAttach !== 'undefined' && child)
      ? FileAttach.avatarHtml(child, 110)
      : '<div style="width:110px;height:110px;border-radius:50%;background:var(--primary);margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-size:2.8rem;">👧</div>';
    const docsNote = child && child.documents && child.documents.files && child.documents.files.length
      ? child.documents.files.length + ' file(s) on file'
      : 'No digital documents yet';
    return (
      '<div style="text-align:center;margin-bottom:2rem;">' +
      '<div style="margin:0 auto 1rem;display:inline-block;box-shadow:0 6px 20px rgba(0,0,0,0.12);border-radius:50%;">' +
      avatar + '</div>' +
      '<h2 style="margin:0;">' + childName + '</h2>' +
      '<p class="text-muted" style="margin-bottom:0.35rem;">' +
      [childCode, ageLabel, section].filter(Boolean).join(' • ') +
      '</p>' +
      '<p class="text-muted" style="font-size:0.85rem;margin:0;">' + docsNote +
      ' · use header ⋮ for photo &amp; documents</p>' +
      '</div>'
    );
  },

  openAttachmentsEditor(childId) {
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    const child = (typeof SampleChildren !== 'undefined')
      ? SampleChildren.find(c => String(c.id) === String(childId))
      : null;
    if (!child) {
      alert('Child record not found. Try logging in again.');
      return;
    }

    const existing = document.getElementById('parent-attach-overlay');
    if (existing) existing.remove();

    const photoHtml = typeof FileAttach !== 'undefined'
      ? FileAttach.photoFieldHtml('parent', child.photo || null)
      : '';
    const docsHtml = typeof FileAttach !== 'undefined'
      ? FileAttach.documentsFieldHtml('parent', (child.documents && child.documents.files) || [])
      : '';

    const html =
      '<div id="parent-attach-overlay" class="bs-overlay no-print">' +
      '<div class="bs-modal-panel" style="max-width:520px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.15rem;color:white;">Photo &amp; documents</h2>' +
      '<button type="button" class="bs-modal-close" onclick="ParentDashboard.closeAttachmentsEditor()">×</button>' +
      '</div>' +
      '<div class="bs-modal-body">' +
      '<p class="text-muted" style="margin-top:0;font-size:0.9rem;">' +
      'For <strong>' + (child.name || 'your child') + '</strong>. Only a profile picture and optional file uploads. ' +
      'Paper copies can still be submitted in person at NCDC Medina.</p>' +
      photoHtml +
      docsHtml +
      '<p id="parent-attach-error" style="color:#d32f2f;display:none;margin:0.75rem 0 0;"></p>' +
      '</div>' +
      '<div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">' +
      '<button type="button" class="btn" style="background:#e8e8e8;color:#333;" onclick="ParentDashboard.closeAttachmentsEditor()">Cancel</button>' +
      '<button type="button" class="btn btn-blue" onclick="ParentDashboard.saveAttachments(' +
      JSON.stringify(String(childId)) + ')">Save</button>' +
      '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  },

  closeAttachmentsEditor() {
    const el = document.getElementById('parent-attach-overlay');
    if (el) el.remove();
  },

  saveAttachments(childId) {
    const errEl = document.getElementById('parent-attach-error');
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

    const photoCleared = typeof FileAttach !== 'undefined' && FileAttach.wasPhotoCleared('parent');
    const photo = typeof FileAttach !== 'undefined' ? FileAttach.getPhoto('parent') : null;
    const files = typeof FileAttach !== 'undefined' ? FileAttach.getDocs('parent') : [];

    const payload = {
      files: files,
      clearPhoto: !!photoCleared
    };
    if (!photoCleared) payload.photo = photo;

    let result;
    try {
      result = ChildRegistry.updateParentAttachments(childId, payload);
    } catch (e) {
      console.error(e);
      showErr((e && e.message) || 'Could not save.');
      return;
    }

    if (!result || !result.ok) {
      showErr((result && result.error) || 'Could not save.');
      return;
    }

    // Refresh parent session child list from SampleChildren
    if (this._user && this._user.children && typeof SampleChildren !== 'undefined') {
      this._user.children = this._user.children.map(c => {
        const fresh = SampleChildren.find(s => String(s.id) === String(c.id));
        return fresh || c;
      });
    }

    this.closeAttachmentsEditor();
    if (this._container && this._user) this.render(this._container, this._user);

    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = result.strippedAttachments
      ? 'Saved (some large files skipped due to storage limits).'
      : 'Photo & documents updated.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
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

      // Domain donuts: prefer checklist % from that period's assessment; fall back to report fields
      const donutDomains = (typeof UI !== 'undefined' && UI.DOMAIN_SNAP)
        ? (function() {
            let percents = {};
            if (typeof AssessmentStore !== 'undefined') {
              const a = AssessmentStore.get(child.id, approved.period)
                || (UI.latestAssessmentForChild && UI.latestAssessmentForChild(child.id));
              if (a) percents = UI.domainPercentsFromAssessment(a) || {};
            }
            const byCode = {};
            (approved.domainScores || []).forEach(function(d) {
              if (d && d.code) byCode[d.code] = d;
            });
            return UI.DOMAIN_SNAP.map(function(meta) {
              const rep = byCode[meta.code] || {};
              let pct = percents[meta.code];
              if (pct == null && rep.percent != null) pct = Math.round(Number(rep.percent));
              if (pct == null && rep.raw != null && rep.total > 0) {
                pct = Math.round((Number(rep.raw) / Number(rep.total)) * 100);
              }
              return {
                code: meta.code,
                name: rep.name || meta.name,
                color: meta.color,
                percent: pct != null && !isNaN(pct) ? pct : null,
                scaled: rep.scaled,
                label: rep.label
              };
            });
          })()
        : [];
      const donutsHtml = (typeof UI !== 'undefined' && UI.domainDonutGrid)
        ? UI.domainDonutGrid(donutDomains)
        : '';
      const hasDonutData = donutDomains.some(function(d) { return d.percent != null; });

      const tips = (approved.tips || []).map(t => '<li>' + t + '</li>').join('');
      const comments = (approved.teacherComments || []).map(c =>
        '<li><strong>' + (c.itemTitle || '') + '</strong>' +
        (c.present ? '' : ' <span class="text-muted">(still developing)</span>') +
        ': ' + (c.comment || '') + '</li>'
      ).join('');
      const strengthsList = (approved.strengths || []).map(s =>
        '<span style="display:inline-block;margin:0.2rem 0.35rem 0.2rem 0;padding:0.25rem 0.6rem;border-radius:999px;font-size:0.82rem;background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7;">' + s + '</span>'
      ).join('');
      const needsList = (approved.needs || []).map(n =>
        '<span style="display:inline-block;margin:0.2rem 0.35rem 0.2rem 0;padding:0.25rem 0.6rem;border-radius:999px;font-size:0.82rem;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;">' + n + '</span>'
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
        '<div style="text-align:center;padding:0.75rem 1rem;margin-bottom:1rem;border-radius:14px;background:linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 100%);border:1px solid #c8e6c9;">' +
        '<h3 style="margin:0 0 0.35rem;">🌟 Progress Report – ' + approved.period + ' Evaluation</h3>' +
        (approved.overallLabel
          ? '<p style="margin:0;font-size:1.05rem;"><strong>' + approved.overallLabel + '</strong>' +
            (approved.standardScore != null ? ' · Standard Score: ' + approved.standardScore : '') + '</p>'
          : '') +
        '</div>' +
        ((strengthsList || needsList)
          ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem;">' +
            '<div style="background:#f1f8f4;padding:0.85rem;border-radius:12px;border-left:4px solid #43a047;">' +
            '<h4 style="margin:0 0 0.4rem;color:#2e7d32;">✓ Strengths</h4>' +
            (strengthsList || '<span class="text-muted" style="font-size:0.88rem;">—</span>') + '</div>' +
            '<div style="background:#fff8f0;padding:0.85rem;border-radius:12px;border-left:4px solid #fb8c00;">' +
            '<h4 style="margin:0 0 0.4rem;color:#e65100;">◎ Areas to support</h4>' +
            (needsList || '<span class="text-muted" style="font-size:0.88rem;">—</span>') + '</div></div>'
          : '') +
        '<div style="margin:1.25rem 0 0.5rem;">' +
        '<h4 style="text-align:center;margin:0 0 0.35rem;color:var(--primary-dark);">Domain snapshot</h4>' +
        '<p class="text-muted" style="text-align:center;font-size:0.85rem;margin:0 0 1rem;">' +
        (hasDonutData
          ? 'Share of skills marked Present in each area for this evaluation.'
          : 'Domain rings appear when checklist scores are available for this period.') +
        '</p>' +
        (donutsHtml || '<p class="text-muted" style="text-align:center;">Domain scores will appear after the teacher approves a report.</p>') +
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
          ? '<div style="margin-top:1.25rem;padding:1rem;background:#e3f2fd;border-radius:12px;border:1px solid #90caf9;">' +
            '<h4 style="margin:0 0 0.5rem;color:var(--primary-dark);">Summary for the family</h4>' +
            '<p style="margin:0;font-size:0.95rem;line-height:1.5;">' + approved.parentDraft + '</p></div>'
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

    const statusText = (latest && (latest.status || latest.nutritionStatus || '')).trim() || '—';
    const statusLower = statusText.toLowerCase();
    const statusColor = statusLower.includes('normal')
      ? 'var(--success)'
      : (statusLower.includes('under') || statusLower.includes('severe'))
        ? 'var(--orange)'
        : (statusLower.includes('over') || statusLower.includes('obese'))
          ? '#d32f2f'
          : 'var(--muted)';
    const bmiDisplay = (latest && latest.bmi != null && !isNaN(Number(latest.bmi)))
      ? Number(latest.bmi)
      : null;

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
        (bmiDisplay != null ? bmiDisplay : '—') + '</div>' +
        '<div class="text-muted">BMI' +
        (statusText !== '—' ? ' · ' + statusText : '') + '</div></div>' +
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
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const monthPrefix = this.attYear + '-' + String(this.attMonth + 1).padStart(2, '0');
    const monthLabel = monthNames[this.attMonth] + ' ' + this.attYear;

    // Month navigator (always shown so parents can browse even before first save)
    const nav =
      '<div class="parent-att-nav no-print" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin:0.75rem 0 1rem;flex-wrap:wrap;">' +
      '<button type="button" class="btn" style="background:#e8e8e8;color:#333;padding:6px 12px;" ' +
      'onclick="ParentDashboard.changeAttMonth(-1)" aria-label="Previous month">‹</button>' +
      '<strong style="min-width:10rem;text-align:center;">' + monthLabel + '</strong>' +
      '<button type="button" class="btn" style="background:#e8e8e8;color:#333;padding:6px 12px;" ' +
      'onclick="ParentDashboard.changeAttMonth(1)" aria-label="Next month">›</button>' +
      '<button type="button" class="btn btn-blue" style="padding:6px 12px;font-size:0.85rem;" ' +
      'onclick="ParentDashboard.attGoThisMonth()">This month</button>' +
      '</div>';

    if (!records.length) {
      return (
        '<div class="card mb-3" style="text-align:center;">' +
        '<h3>📅 Attendance Record</h3>' +
        nav +
        '<p class="text-muted">No attendance recorded yet for your child. When the teacher saves the daily attendance sheet, it will appear here.</p></div>'
      );
    }

    const present = records.filter(r => r.status === 'P').length;
    const absent = records.filter(r => r.status === 'A').length;
    const total = present + absent;
    const rate = total ? Math.round((present / total) * 100) : 0;

    const monthRecs = records
      .filter(r => (r.date || '').startsWith(monthPrefix))
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const mPresent = monthRecs.filter(r => r.status === 'P').length;
    const mAbsent = monthRecs.filter(r => r.status === 'A').length;
    const mTotal = mPresent + mAbsent;
    const mRate = mTotal ? Math.round((mPresent / mTotal) * 100) : null;

    // Consecutive absences from most recent overall
    const sortedAll = records.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let streak = 0;
    for (const r of sortedAll) {
      if (r.status === 'A') streak++;
      else break;
    }

    const dayRows = monthRecs.length
      ? monthRecs.map(r => {
          const color = r.status === 'P' ? 'var(--success)' : '#d32f2f';
          const label = r.status === 'P' ? 'Present' : 'Absent';
          return '<tr><td>' + (r.date || '—') + '</td>' +
            '<td style="text-align:center;font-weight:700;color:' + color + ';">' + label + '</td>' +
            '<td style="font-size:0.85rem;">' + (r.remark || '—') + '</td></tr>';
        }).join('')
      : '<tr><td colspan="3" style="text-align:center;color:var(--muted);">No attendance recorded in ' +
        monthLabel + '.</td></tr>';

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;margin-bottom:0.25rem;">📅 Attendance Record</h3>' +
      nav +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0.85rem;margin:0 0 1rem;">' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--success);">' + mPresent + '</div>' +
      '<div class="text-muted">Present</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:#d32f2f;">' + mAbsent + '</div>' +
      '<div class="text-muted">Absent</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--primary);">' +
      (mRate != null ? mRate + '%' : '—') + '</div>' +
      '<div class="text-muted">Month rate</div></div>' +
      '<div style="text-align:center;background:#f8f9fa;padding:1rem;border-radius:12px;">' +
      '<div style="font-size:1.6rem;font-weight:700;color:var(--primary-dark);">' + rate + '%</div>' +
      '<div class="text-muted">Overall rate</div></div></div>' +
      (streak >= 3
        ? '<p style="text-align:center;color:#d32f2f;font-weight:600;">Note: ' + streak +
          ' consecutive absences recorded recently. Please coordinate with the teacher.</p>'
        : '') +
      '<h4 style="margin:0.5rem 0 0.5rem;">Days in ' + monthLabel + '</h4>' +
      '<div class="eccd-table-wrap"><table class="eccd-table">' +
      '<thead><tr><th>Date</th><th style="text-align:center;">Status</th><th>Remarks</th></tr></thead>' +
      '<tbody>' + dayRows + '</tbody></table></div>' +
      '<p class="text-muted" style="font-size:0.8rem;margin:0.75rem 0 0;text-align:center;">' +
      'Overall: ' + present + ' present · ' + absent + ' absent across all recorded days</p></div>'
    );
  },

  changeAttMonth(delta) {
    this.attMonth += delta;
    if (this.attMonth > 11) { this.attMonth = 0; this.attYear++; }
    if (this.attMonth < 0) { this.attMonth = 11; this.attYear--; }
    if (this._container && this._user) this.render(this._container, this._user);
  },

  attGoThisMonth() {
    const now = new Date();
    this.attYear = now.getFullYear();
    this.attMonth = now.getMonth();
    if (this._container && this._user) this.render(this._container, this._user);
  },

  /** Local YYYY-MM-DD */
  _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  _easterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  },

  _holidaysForYear(year) {
    const easter = this._easterDate(year);
    const goodFri = new Date(easter); goodFri.setDate(easter.getDate() - 2);
    const maundy = new Date(easter); maundy.setDate(easter.getDate() - 3);
    const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const heroes = new Date(year, 7, 31);
    while (heroes.getDay() !== 1) heroes.setDate(heroes.getDate() - 1);
    return [
      { date: year + '-01-01', title: "New Year's Day" },
      { date: fmt(maundy), title: 'Maundy Thursday' },
      { date: fmt(goodFri), title: 'Good Friday' },
      { date: year + '-04-09', title: 'Araw ng Kagitingan' },
      { date: year + '-05-01', title: 'Labor Day' },
      { date: year + '-06-12', title: 'Independence Day' },
      { date: year + '-08-21', title: 'Ninoy Aquino Day' },
      { date: fmt(heroes), title: 'National Heroes Day' },
      { date: year + '-11-01', title: "All Saints' Day" },
      { date: year + '-11-30', title: 'Bonifacio Day' },
      { date: year + '-12-08', title: 'Feast of the Immaculate Conception' },
      { date: year + '-12-25', title: 'Christmas Day' },
      { date: year + '-12-30', title: 'Rizal Day' },
      { date: year + '-12-31', title: "New Year's Eve" }
    ];
  },

  /**
   * Parent calendar — matches teacher markers (read-only).
   * Events from CalendarStore / Supabase; PH holidays displayed.
   */
  _upcomingCard() {
    if (typeof CalendarStore === 'undefined') {
      return '<div class="card" style="text-align:center;"><h3>🗓️ Center Calendar</h3>' +
        '<p class="text-muted" style="margin:0;">Calendar is not available right now.</p></div>';
    }

    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const title = monthNames[this.viewMonth] + ' ' + this.viewYear;
    const events = CalendarStore.listForMonth(this.viewYear, this.viewMonth);
    const prefix = this.viewYear + '-' + String(this.viewMonth + 1).padStart(2, '0');
    const holidays = this._holidaysForYear(this.viewYear).filter(h => h.date.startsWith(prefix));
    const holidayByDate = {};
    holidays.forEach(h => { holidayByDate[h.date] = h; });
    const upcoming = CalendarStore.upcoming(6);
    const todayStr = this._todayStr();

    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(d => '<div class="cal-dow">' + d + '</div>').join('');

    let cells = '';
    for (let i = 0; i < startPad; i++) cells += '<div class="cal-cell cal-empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.viewYear + '-' + String(this.viewMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const dayEvents = events.filter(e => e.date === dateStr);
      const holiday = holidayByDate[dateStr];
      const hasEvent = dayEvents.length > 0;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      let stateClass = '';
      if (hasEvent && isToday) stateClass = 'cal-event-today';
      else if (hasEvent && isPast) stateClass = 'cal-event-past';
      else if (hasEvent) stateClass = 'cal-has-event';
      if (isToday && !hasEvent) stateClass += ' cal-today';
      if (holiday) stateClass += ' cal-holiday';

      const labels = [];
      if (holiday) labels.push(holiday.title);
      dayEvents.forEach(e => labels.push(e.title));
      const firstTitle = labels.length ? String(labels[0]).replace(/</g, '&lt;') : '';

      cells +=
        '<div class="cal-cell ' + stateClass.trim() + '" role="button" tabindex="0" ' +
        "onclick=\"ParentDashboard.onDayClick('" + dateStr + "')\">" +
        '<span class="cal-daynum">' + day + '</span>' +
        (hasEvent || holiday ? '<span class="cal-dot"></span>' : '') +
        (labels.length ? '<span class="cal-event-label">' + firstTitle +
          (labels.length > 1 ? ' +' + (labels.length - 1) : '') + '</span>' : '') +
        '</div>';
    }

    const upcomingList = upcoming.length
      ? upcoming.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return '<li><strong>' + label + '</strong> – ' + e.title +
            (e.time ? ' <span class="text-muted">(' + e.time + ')</span>' : '') + '</li>';
        }).join('')
      : '<li class="text-muted">No upcoming events posted by the center yet.</li>';

    return (
      '<div class="card mb-3">' +
      '<h3 style="text-align:center;margin-top:0;">🗓️ Center Calendar</h3>' +
      '<p class="text-muted" style="text-align:center;margin:0 0 1rem;font-size:0.9rem;">' +
      'Same schedule as the teacher portal (read-only). Includes Philippine holidays.</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem;">' +
      '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="ParentDashboard.changeMonth(-1)">← Previous</button>' +
      '<h3 style="margin:0;font-size:1.1rem;">' + title + '</h3>' +
      '<button class="btn" style="background:#e8e8e8;color:var(--text);" onclick="ParentDashboard.changeMonth(1)">Next →</button>' +
      '</div>' +
      '<div class="cal-grid">' + dow + cells + '</div>' +
      '<div class="cal-legend" style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.85rem;font-size:0.8rem;color:var(--muted);">' +
      '<span><span class="cal-legend-swatch cal-event-today"></span> Today (event)</span>' +
      '<span><span class="cal-legend-swatch cal-event-past"></span> Past event</span>' +
      '<span><span class="cal-legend-swatch cal-has-event"></span> Upcoming</span>' +
      '<span><span class="cal-legend-swatch cal-holiday"></span> Holiday</span>' +
      '</div></div>' +
      '<div class="dashboard-grid">' +
      '<div class="card" style="margin:0;"><h3 style="margin-top:0;">Upcoming events</h3>' +
      '<ul style="line-height:2;padding-left:1.2rem;margin:0;">' + upcomingList + '</ul></div>' +
      '<div class="card" style="margin:0;"><h3 style="margin-top:0;">This month</h3>' +
      (events.length
        ? '<ul style="line-height:1.9;padding-left:1.2rem;margin:0;">' + events.map(e =>
            '<li><strong>' + e.date.slice(8) + '</strong> – ' + e.title + '</li>').join('') + '</ul>'
        : '<p class="text-muted" style="margin:0;">No center events this month.</p>') +
      '</div></div>'
    );
  },

  changeMonth(delta) {
    this.viewMonth += delta;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    if (this._container && this._user) this.render(this._container, this._user);
  },

  onDayClick(dateStr) {
    if (typeof CalendarStore === 'undefined') return;
    const events = CalendarStore.getByDate(dateStr);
    const year = Number(dateStr.slice(0, 4));
    const holidays = this._holidaysForYear(year).filter(h => h.date === dateStr);
    if (!events.length && !holidays.length) {
      this._toast('No events on this day.');
      return;
    }
    const past = dateStr < this._todayStr();
    const holBlocks = holidays.map(h =>
      '<div class="card" style="margin-bottom:0.75rem;border-left:4px solid #c62828;">' +
      '<h3 style="margin:0 0 0.35rem;color:#b71c1c;">🇵🇭 ' + h.title + '</h3>' +
      '<p style="margin:0;" class="text-muted">Official holiday · ' + dateStr + '</p></div>'
    ).join('');
    const blocks = events.map(e =>
      '<div class="card" style="margin-bottom:0.75rem;' + (past ? 'border-left:4px solid #f9a825;' : '') + '">' +
      '<h3 style="margin:0 0 0.5rem;color:var(--primary-dark);">' + e.title +
      (past ? ' <span style="font-size:0.8rem;color:#f57f17;">(past)</span>' : '') + '</h3>' +
      '<p style="margin:0.25rem 0;"><strong>Date:</strong> ' + e.date + '</p>' +
      '<p style="margin:0.25rem 0;"><strong>Time:</strong> ' + (e.time || '—') + '</p>' +
      '<p style="margin:0.25rem 0;"><strong>Type:</strong> ' + (e.type || '—') + '</p>' +
      '<p style="margin:0.25rem 0;"><strong>Audience:</strong> ' + (e.audience || '—') + '</p>' +
      (e.notes ? '<div style="margin-top:0.75rem;padding:0.75rem;background:#f8f9fa;border-radius:8px;"><strong>Notes:</strong><br>' + e.notes + '</div>' : '') +
      '</div>'
    ).join('');
    const html =
      '<div id="parent-cal-modal" class="bs-overlay">' +
      '<div class="bs-modal-panel" style="max-width:520px;">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.2rem;color:white;">' + dateStr + '</h2>' +
      '<button class="bs-modal-close" onclick="ParentDashboard.closeDayModal()">×</button></div>' +
      '<div class="bs-modal-body">' + holBlocks + blocks + '</div>' +
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
