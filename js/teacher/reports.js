/**
 * Teacher Reports — parent-friendly progress reports from ECCD assessments.
 * Teacher reviews the draft, edits notes/tips, then approves for the Parent Portal.
 */

const TeacherReports = {
  render(container) {
    const children = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
    const rows = children.map(c => {
      const history = typeof AssessmentStore !== 'undefined'
        ? AssessmentStore.listForChild(c.id)
        : [];
      const latest = history.length ? history[history.length - 1] : null;
      const report = latest && typeof ReportStore !== 'undefined'
        ? ReportStore.get(c.id, latest.period)
        : null;
      const approved = typeof ReportStore !== 'undefined'
        ? ReportStore.getApproved(c.id)
        : null;

      let statusHtml = '<span class="text-muted">No assessment yet</span>';
      if (approved) {
        statusHtml = `<span class="success-text">✓ Approved (${approved.period})</span>`;
      } else if (report && report.status === 'draft') {
        statusHtml = `<span style="color:var(--orange);">Draft (${report.period})</span>`;
      } else if (latest) {
        statusHtml = `<span style="color:var(--primary);">Ready to draft (${latest.period})</span>`;
      }

      const action = latest
        ? `<button class="btn btn-blue" onclick="TeacherReports.openEditor(${c.id})">Open report</button>`
        : `<button class="btn" style="background:#e0e0e0;color:#666;" disabled>Encode checklist first</button>`;

      return `
        <tr>
          <td><strong>${c.name}</strong><div class="text-muted" style="font-size:0.8rem;">${c.section} · ${c.ageLabel}</div></td>
          <td>${c.parentName || '—'}</td>
          <td>${history.length ? history.map(h => h.period).join(', ') : '—'}</td>
          <td>${statusHtml}</td>
          <td>${action}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      ${UI.pageHeader('📊 Reports', 'Parent-friendly progress reports from ECCD assessments. Review, edit, and approve before parents see them.')}
      <div class="card">
        <div class="eccd-table-wrap">
          <table class="eccd-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Parent</th>
                <th>Assessments</th>
                <th>Report status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">No children loaded.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _buildDraft(child, assessment) {
    const insight = assessment.insight || {};
    const finalScores = assessment.finalScores || null;

    let domains = [];
    if (finalScores && finalScores.domains) {
      domains = Object.keys(finalScores.domains).map(code => {
        const d = finalScores.domains[code];
        const name = (typeof ScoreProfile !== 'undefined' && ScoreProfile.DOMAIN_NAMES[code])
          || code;
        const sc = d.scaled;
        const n = sc !== '' && sc != null ? Number(sc) : null;
        return {
          code,
          name,
          raw: d.raw,
          scaled: sc,
          label: n != null && !isNaN(n)
            ? (n >= 14 ? 'Advanced' : n >= 7 ? 'Average' : 'Needs support')
            : '—'
        };
      });
    } else if (insight.domains) {
      domains = insight.domains.map(d => ({
        code: d.code,
        name: d.name,
        raw: d.raw,
        scaled: d.scaled,
        label: d.interpretation ? d.interpretation.label : (d.percent != null ? d.percent + '%' : '—')
      }));
    }

    const standardScore = finalScores && finalScores.standardScore != null
      ? finalScores.standardScore
      : insight.standardScore;
    const sumScaled = finalScores && finalScores.sumOfScaledScores != null
      ? finalScores.sumOfScaledScores
      : insight.sumOfScaledScores;
    const overallLabel = (finalScores && finalScores.interpretation)
      || (insight.overallInterpretation && insight.overallInterpretation.label)
      || '—';

    const strengths = insight.strengths || [];
    const needs = insight.needs || [];

    const tips = [];
    if (needs.length) {
      needs.slice(0, 3).forEach(n => tips.push('Support at home: ' + n));
    }
    tips.push('Read or tell stories together for 10–15 minutes daily');
    tips.push('Encourage outdoor play and movement games');
    if (tips.length < 4) {
      tips.push('Praise effort and practice everyday self-help skills (dressing, feeding)');
    }

    const parentDraft = insight.parentFriendlyDraft
      || [
        'Assessment period: ' + assessment.period + '.',
        overallLabel !== '—' ? 'Overall: ' + overallLabel + '.' : '',
        strengths.length ? 'Strengths: ' + strengths.slice(0, 3).join('; ') + '.' : '',
        needs.length ? 'Areas to support: ' + needs.slice(0, 3).join('; ') + '.' : '',
        'Your child\'s teacher can explain these results and suggest simple activities at home.'
      ].filter(Boolean).join(' ');

    const teacherNote = strengths.length
      ? child.name + ' shows progress in ' + strengths.slice(0, 2).join(' and ') + '. Continue encouraging learning through play.'
      : child.name + ' is being monitored with the ECCD checklist. Please see the domain summary and tips below.';

    return {
      domains,
      standardScore,
      sumOfScaledScores: sumScaled,
      overallLabel,
      strengths,
      needs,
      parentDraft,
      teacherNote,
      tips: tips.slice(0, 5)
    };
  },

  openEditor(childId) {
    const child = SampleChildren.find(c => c.id === childId);
    if (!child) return;

    const history = AssessmentStore.listForChild(childId);
    if (!history.length) {
      alert('No saved assessment for this child yet. Encode and save the ECCD checklist first.');
      return;
    }

    const assessment = [...history].reverse().find(a => a.finalized) || history[history.length - 1];
    const existing = ReportStore.get(childId, assessment.period);
    const draft = this._buildDraft(child, assessment);

    const teacherNote = existing && existing.teacherNote ? existing.teacherNote : draft.teacherNote;
    const parentDraft = existing && existing.parentDraft ? existing.parentDraft : draft.parentDraft;
    const tipsText = existing && existing.tips && existing.tips.length
      ? existing.tips.join('\n')
      : draft.tips.join('\n');

    const domainPills = draft.domains.map(d => {
      const color = d.label === 'Advanced' || (typeof d.scaled === 'number' && d.scaled >= 14)
        ? 'var(--primary)'
        : d.label === 'Needs support' || (typeof d.scaled === 'number' && d.scaled < 7)
          ? '#d32f2f'
          : 'var(--success)';
      const main = d.scaled != null && d.scaled !== '' ? 'SS ' + d.scaled : d.label;
      return '<div style="text-align:center;background:#f8f9fa;padding:0.85rem;border-radius:10px;">' +
        '<div style="font-size:1.25rem;font-weight:700;color:' + color + ';">' + main + '</div>' +
        '<div style="font-size:0.78rem;color:var(--muted);">' + d.name + '</div>' +
        '<div style="font-size:0.72rem;color:var(--muted);">' + d.label + '</div></div>';
    }).join('');

    const statusLabel = existing && existing.status === 'approved'
      ? '<span class="success-text">✓ Already approved</span>'
      : existing
        ? '<span style="color:var(--orange);">Draft saved</span>'
        : '<span class="text-muted">New draft</span>';

    const html =
      '<div id="report-editor-overlay" class="bs-overlay">' +
      '<div class="bs-modal-panel ecc-modal-wide">' +
      '<div class="bs-modal-header">' +
      '<h2 style="margin:0;font-size:1.25rem;color:white;">Progress Report — ' + child.name + '</h2>' +
      '<button onclick="TeacherReports.closeEditor()" class="bs-modal-close">×</button></div>' +
      '<div class="bs-modal-body">' +
      '<p class="text-muted" style="margin-bottom:1rem;">Period <strong>' + assessment.period +
      '</strong> · ' + child.ageLabel + ' · Record ' + child.recordType + ' · ' + statusLabel +
      (assessment.finalized ? ' · <span class="success-text">Teacher-finalized scores</span>' : '') + '</p>' +
      '<div class="card" style="margin-bottom:1rem;"><h3 style="margin-top:0;">Domain summary</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0.75rem;">' +
      (domainPills || '<p class="text-muted">No domain scores.</p>') + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:1rem;">' +
      '<div><span class="text-muted">Sum of Scaled</span><div style="font-size:1.4rem;font-weight:700;color:var(--primary-dark);">' +
      (draft.sumOfScaledScores != null ? draft.sumOfScaledScores : '—') + '</div></div>' +
      '<div><span class="text-muted">Standard Score</span><div style="font-size:1.4rem;font-weight:700;color:var(--success);">' +
      (draft.standardScore != null ? draft.standardScore : '—') + '</div></div>' +
      '<div style="flex:1;"><span class="text-muted">Overall</span><div style="font-weight:600;">' +
      draft.overallLabel + '</div></div></div></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">👩‍🏫 Teacher’s note (shown to parent)</label>' +
      '<textarea id="report-teacher-note" rows="3" class="ecc-report-textarea">' + this._esc(teacherNote) + '</textarea></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">📝 Parent-friendly summary</label>' +
      '<textarea id="report-parent-draft" rows="4" class="ecc-report-textarea">' + this._esc(parentDraft) + '</textarea></div>' +
      '<div class="card" style="margin-bottom:1rem;"><label style="font-weight:600;display:block;margin-bottom:0.35rem;">💡 Tips & activities (one per line)</label>' +
      '<textarea id="report-tips" rows="5" class="ecc-report-textarea">' + this._esc(tipsText) + '</textarea></div>' +
      '</div><div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">' +
      '<button class="btn" style="background:#e0e0e0;color:#333;" onclick="TeacherReports.closeEditor()">Cancel</button>' +
      '<button class="btn btn-blue" onclick="TeacherReports.saveDraft(' + child.id + ', \'' + assessment.period + '\')">Save draft</button>' +
      '<button class="btn" style="background:var(--success);" onclick="TeacherReports.approve(' + child.id + ', \'' + assessment.period + '\')">✓ Approve for parent</button>' +
      '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    this._pendingAssessment = assessment;
    this._pendingDraft = draft;
  },

  _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _readForm(childId, period) {
    const child = SampleChildren.find(c => c.id === childId);
    const assessment = this._pendingAssessment;
    const base = this._pendingDraft || this._buildDraft(child, assessment);
    const teacherNote = (document.getElementById('report-teacher-note') || {}).value || '';
    const parentDraft = (document.getElementById('report-parent-draft') || {}).value || '';
    const tipsRaw = (document.getElementById('report-tips') || {}).value || '';
    const tips = tipsRaw.split('\n').map(t => t.trim()).filter(Boolean);
    return {
      childId: childId,
      childName: child.name,
      period: period,
      recordType: child.recordType,
      ageMonths: child.ageMonths,
      domainScores: base.domains,
      standardScore: base.standardScore,
      sumOfScaledScores: base.sumOfScaledScores,
      overallLabel: base.overallLabel,
      teacherNote: teacherNote,
      tips: tips,
      parentDraft: parentDraft
    };
  },

  saveDraft(childId, period) {
    const payload = this._readForm(childId, period);
    payload.status = 'draft';
    payload.approvedAt = null;
    ReportStore.save(payload);
    this.closeEditor();
    const main = document.getElementById('main-content') || document.querySelector('.main-content');
    if (main) this.render(main);
    this._toast('Draft saved. Approve when ready for the parent portal.');
  },

  approve(childId, period) {
    const payload = this._readForm(childId, period);
    payload.status = 'approved';
    payload.approvedAt = new Date().toISOString();
    ReportStore.save(payload);
    this.closeEditor();
    const main = document.getElementById('main-content') || document.querySelector('.main-content');
    if (main) this.render(main);
    this._toast('Report approved — visible on the Parent Portal for this child.');
  },

  closeEditor() {
    const el = document.getElementById('report-editor-overlay');
    if (el) el.remove();
    this._pendingAssessment = null;
    this._pendingDraft = null;
  },

  _toast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ecc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2800);
  }
};
