/**
 * Teacher Reports — parent-friendly progress reports from ECCD assessments.
 * Teacher reviews the draft, edits notes/tips, then approves for the Parent Portal.
 */

const TeacherReports = {
  tab: 'eccd', // eccd | sfp

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    if (typeof SfpStore !== 'undefined') SfpStore.ensureSeed();
    this._draw();
  },

  setTab(key) {
    this.tab = key;
    this._draw();
  },

  _draw() {
    const tabs = [
      { key: 'eccd', label: '📈 ECCD progress (parents)' },
      { key: 'sfp', label: '🍎 SFP / MSWDO' }
    ].map(t => {
      const active = this.tab === t.key;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherReports.setTab('${t.key}')">${t.label}</button>`;
    }).join('');

    const body = this.tab === 'sfp' ? this._sfpReportsHtml() : this._eccdReportsHtml();

    this._container.innerHTML = `
      ${UI.pageHeader('📊 Reports', 'ECCD parent progress reports and DSWD SFP forms for MSWDO / liquidation.')}
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">${tabs}</div>
      ${body}
    `;
  },

  _eccdReportsHtml() {
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

    return `
      <div class="card">
        <p class="text-muted" style="margin-top:0;">Parent-friendly progress reports from ECCD assessments. Review, edit, and approve before parents see them.</p>
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
      </div>`;
  },

  _sfpReportsHtml() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : null;
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const hotDays = typeof SfpStore !== 'undefined' ? SfpStore.countHotFeedingDays() : 0;
    const altDays = typeof SfpStore !== 'undefined' ? SfpStore.countAltFeedingDays() : 0;
    const benCount = stats ? stats.beneficiaries.total : 0;
    const today = new Date().toISOString().slice(0, 10);

    return `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">SFP cycle snapshot</h3>
        <p style="margin:0.35rem 0;"><strong>${(cycle && cycle.cycleLabel) || '—'}</strong>
          · SY ${(cycle && cycle.schoolYear) || '—'}
          · ${(cycle && cycle.facilityName) || 'NCDC Medina'}</p>
        <p style="margin:0.35rem 0;">Beneficiaries on file: <strong>${benCount}</strong>
          · Hot meal days logged: <strong>${hotDays}</strong>
          · NUTRICombo deliveries: <strong>${altDays}</strong></p>
        <p class="text-muted" style="margin:0.5rem 0 0;font-size:0.85rem;">
          Counts come from Health → SFP profiles and SFP Feeding logs. Print forms use browser Print → Save as PDF.
        </p>
      </div>

      <div class="dashboard-grid" style="margin-bottom:1rem;">
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Certification -A <span class="text-muted" style="font-weight:500;font-size:0.85rem;">Hot meals</span></h3>
          <p class="text-muted" style="font-size:0.88rem;">For liquidation — children who received cooked meals over a period.</p>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Period start</label>
              <input type="date" id="cert-a-start" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Period end</label>
              <input type="date" id="cert-a-end" class="ecc-field-input" value="${today}" />
            </div>
            <div>
              <label class="ecc-field-label">Feeding days (override)</label>
              <input type="number" id="cert-a-days" class="ecc-field-input" min="0" placeholder="Auto: ${hotDays}" />
            </div>
            <div>
              <label class="ecc-field-label"># of children (override)</label>
              <input type="number" id="cert-a-n" class="ecc-field-input" min="0" placeholder="Auto: ${benCount || '—'}" />
            </div>
          </div>
          <button class="btn btn-blue" style="margin-top:0.75rem;" onclick="TeacherReports.printCertA()">🖨 Print Certification -A</button>
        </div>
        <div class="card" style="margin:0;">
          <h3 style="margin-top:0;">Certification -C <span class="text-muted" style="font-weight:500;font-size:0.85rem;">NUTRICombo</span></h3>
          <p class="text-muted" style="font-size:0.88rem;">For liquidation — alternative meals (NUTRICombo) received.</p>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Period / delivery date</label>
              <input type="date" id="cert-c-date" class="ecc-field-input" value="${today}" />
            </div>
            <div>
              <label class="ecc-field-label">Feeding days (override)</label>
              <input type="number" id="cert-c-days" class="ecc-field-input" min="0" placeholder="Auto: ${altDays}" />
            </div>
            <div>
              <label class="ecc-field-label"># of children (override)</label>
              <input type="number" id="cert-c-n" class="ecc-field-input" min="0" placeholder="Auto: ${benCount || '—'}" />
            </div>
          </div>
          <button class="btn btn-blue" style="margin-top:0.75rem;" onclick="TeacherReports.printCertC()">🖨 Print Certification -C</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Consolidated Report (Figures)</h3>
        <p class="text-muted" style="font-size:0.88rem;margin-top:0;">
          MSWDO format — physical status + nutritional status (entry vs after 6 months).
          Auto-filled from SFP beneficiary flags where available.
        </p>
        <button class="btn btn-blue" onclick="TeacherReports.printConsolidation()">🖨 Print consolidation report</button>
      </div>`;
  },

  _printWindow(title, bodyHtml) {
    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!w) {
      alert('Please allow pop-ups to print SFP forms.');
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:16px;}
        h1,h2,h3,p{text-align:center;margin:4px 0;}
        table{width:100%;border-collapse:collapse;margin-top:10px;}
        th,td{border:1px solid #000;padding:5px;vertical-align:top;}
        .label{font-weight:bold;}
        .sub{padding-left:20px;}
        .sig{margin-top:48px;display:flex;justify-content:space-between;gap:24px;}
        .sig div{text-align:center;flex:1;}
        .left{text-align:left;}
        @media print{button{display:none;}}
      </style></head><body>
      ${bodyHtml}
      <p style="text-align:center;margin-top:24px;"><button onclick="window.print()">Print / Save as PDF</button></p>
      </body></html>`);
    w.document.close();
  },

  printCertA() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const hotDays = typeof SfpStore !== 'undefined' ? SfpStore.countHotFeedingDays() : 0;
    const nEl = document.getElementById('cert-a-n');
    const dEl = document.getElementById('cert-a-days');
    const start = (document.getElementById('cert-a-start') || {}).value || '________';
    const end = (document.getElementById('cert-a-end') || {}).value || '________';
    const n = (nEl && nEl.value) ? nEl.value : (stats ? stats.beneficiaries.total : '____');
    const days = (dEl && dEl.value) ? dEl.value : (hotDays || '____');
    const facility = (cycle && cycle.facilityName) || 'National Child Development Center — Medina';
    const cycleNum = (cycle && (cycle.cycleNumber || cycle.cycleLabel)) || '15th';

    const body = `
      <p>Republic of the Philippines</p>
      <p>Department of Social Welfare and Development</p>
      <p>Field Office X</p>
      <h2>CERTIFICATION</h2>
      <p class="left" style="margin-top:24px;line-height:1.7;text-align:left;">
        This is to certify that the total <strong>${n}</strong> Day Care Children have received and
        consumed the foods prepared and served at <strong>${facility}</strong>
        for the period of <strong>${start}</strong> to <strong>${end}</strong>
        for a total of <strong>${days}</strong> feeding days.
      </p>
      <p class="left" style="text-align:left;margin-top:16px;">
        This certification is issued for liquidation purposes only. (For the ${cycleNum} cycle implementation)
      </p>
      <div class="sig">
        <div><br><br>_________________________<br>Signature over Printed name of CDW</div>
        <div><br><br>_________________________<br>Signature over Printed name of<br>CDWF / C/MSWDO</div>
      </div>
      <p style="margin-top:32px;font-size:10px;color:#444;">Form style: DSWD FO X — Certification -A (Hot meals)</p>`;
    this._printWindow('SFP Certification -A', body);
  },

  printCertC() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    const stats = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const altDays = typeof SfpStore !== 'undefined' ? SfpStore.countAltFeedingDays() : 0;
    const nEl = document.getElementById('cert-c-n');
    const dEl = document.getElementById('cert-c-days');
    const date = (document.getElementById('cert-c-date') || {}).value || '________';
    const n = (nEl && nEl.value) ? nEl.value : (stats ? stats.beneficiaries.total : '____');
    const days = (dEl && dEl.value) ? dEl.value : (altDays || '____');
    const facility = (cycle && cycle.facilityName) || 'NCDC Medina';
    const cycleNum = (cycle && (cycle.cycleNumber || cycle.cycleLabel)) || '15th';

    const body = `
      <p>Republic of the Philippines</p>
      <p>Department of Social Welfare and Development</p>
      <p>Field Office X</p>
      <h2>CERTIFICATION</h2>
      <p class="left" style="margin-top:24px;line-height:1.7;text-align:left;">
        This is to certify that the total <strong>${n}</strong> Day Care Children have received and
        consumed alternative meals (NUTRICombo) at <strong>${facility}</strong>
        for the period of <strong>${date}</strong>
        for a total of <strong>${days}</strong> feeding days.
      </p>
      <p class="left" style="text-align:left;margin-top:16px;">
        This certification is issued for liquidation purposes only. (For the ${cycleNum} cycle implementation)
      </p>
      <div class="sig">
        <div><br><br>_________________________<br>Signature over Printed name of CDW</div>
        <div><br><br>_________________________<br>Signature over Printed name of<br>CDWF / C/MSWDO</div>
      </div>
      <p style="margin-top:32px;font-size:10px;color:#444;">Form style: DSWD FO X — Certification -C (NUTRICombo)</p>`;
    this._printWindow('SFP Certification -C', body);
  },

  printConsolidation() {
    const cycle = typeof SfpStore !== 'undefined' ? SfpStore.getActiveCycle() : {};
    const s = typeof SfpStore !== 'undefined' ? SfpStore.statsForConsolidation() : null;
    const z = (b) => (b && b.total != null ? b.total : '');
    const m = (b) => (b && b.male != null ? b.male : '');
    const f = (b) => (b && b.female != null ? b.female : '');
    const age = (y) => (s && s.ageBands && s.ageBands[y]) ? s.ageBands[y] : { total: '', male: '', female: '' };

    const body = `
      <p>Republic of the Philippines</p>
      <p>Region X</p>
      <p>Province of Misamis Oriental</p>
      <p>Municipality of MEDINA</p>
      <h3>MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE</h3>
      <p><b>Supplementary Feeding Program</b></p>
      <p>${(cycle && cycle.cycleLabel) || '15th Cycle'} Implementation</p>
      <p>SY ${(cycle && cycle.schoolYear) || '—'}</p>
      <h3>CONSOLIDATED REPORT (FIGURES)</h3>

      <h3>CONSOLIDATED PHYSICAL STATUS REPORT</h3>
      <table>
        <tr><td class="label">Total No. of Beneficiaries:</td><td>${s ? z(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Male Beneficiaries:</td><td>${s ? m(s.beneficiaries) : ''}</td></tr>
        <tr><td class="sub">No. of Female Beneficiaries:</td><td>${s ? f(s.beneficiaries) : ''}</td></tr>
        <tr><td class="label">Total No. of CDCs/SNPs:</td><td>1</td></tr>
        <tr><td class="sub">No. of CDCs:</td><td>1</td></tr>
        <tr><td class="sub">No. of SNPs:</td><td>0</td></tr>
        <tr><td class="label">Total No. Of Children Beneficiaries (Age Bracket):</td><td></td></tr>
        <tr><td class="sub">2 yrs. Old:</td><td>${z(age(2))}</td></tr>
        <tr><td class="sub">3 yrs. Old:</td><td>${z(age(3))}</td></tr>
        <tr><td class="sub">4 yrs. Old:</td><td>${z(age(4))}</td></tr>
        <tr><td class="sub">5 yrs. Old:</td><td>${z(age(5))}</td></tr>
        <tr><td class="label">Total No. of 4Ps Beneficiaries:</td><td>${s ? z(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.fourPs) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.fourPs) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Disability Beneficiaries:</td><td>${s ? z(s.disability) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.disability) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.disability) : ''}</td></tr>
        <tr><td class="label">Total No. of Indigenous Child Beneficiaries:</td><td>${s ? z(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.indigenous) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.indigenous) : ''}</td></tr>
        <tr><td class="label">Total No. of Child with Solo Parent:</td><td>${s ? z(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.soloParent) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.soloParent) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Dewormed:</td><td>${s ? z(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.dewormed) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.dewormed) : ''}</td></tr>
        <tr><td class="label">Total No. of Child Supplemented with Vitamin A:</td><td>${s ? z(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Male:</td><td>${s ? m(s.vitaminA) : ''}</td></tr>
        <tr><td class="sub">Female:</td><td>${s ? f(s.vitaminA) : ''}</td></tr>
      </table>

      <h3 style="margin-top:20px;">CONSOLIDATED NUTRITIONAL STATUS REPORT</h3>
      <p><b>Total no. of Beneficiaries Weighed: ${s ? z(s.beneficiaries) : '__________'}</b></p>
      <p class="left" style="text-align:left;font-size:11px;">
        Detailed weight-for-age / height-for-age / weight-for-length breakdowns can be completed from
        entry vs after-6-months measurements recorded on each SFP beneficiary profile.
        (Teacher may fill remaining cells on the printed form if needed.)
      </p>
      <table>
        <tr>
          <th rowspan="2">Nutritional Status Indicator</th>
          <th colspan="2">Upon Entry</th>
          <th colspan="2">After 6 Mos.</th>
        </tr>
        <tr><th>Male</th><th>Female</th><th>Male</th><th>Female</th></tr>
        <tr><th colspan="5">WEIGHT-FOR-AGE (UNDERWEIGHT)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Underweight (UW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Underweight (SUW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Overweight (OW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><th colspan="5">HEIGHT-FOR-AGE (STUNTING)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Stunted (S)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Stunted (SS)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Tall (T)</td><td></td><td></td><td></td><td></td></tr>
        <tr><th colspan="5">WEIGHT-FOR-LENGTH (WASTING)</th></tr>
        <tr><td>Normal (N)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Wasted (W)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Severely Wasted (SW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Overweight (OW)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Obese (OB)</td><td></td><td></td><td></td><td></td></tr>
      </table>

      <p style="margin-top:28px;text-align:left;">I hereby certify that the above information is true and correct.</p>
      <div class="sig">
        <div><b>Prepared by:</b><br><br>_________________________<br>ECCD / SFP Focal Person</div>
        <div><b>Noted by:</b><br><br>_________________________<br>MSWDO — MEDINA</div>
      </div>`;
    this._printWindow('SFP Consolidated Report', body);
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
    const parentActivities = insight.parentActivities || [];
    const teacherPriorities = insight.teacherPriorities || [];

    const tips = [];
    parentActivities.forEach(pa => {
      (pa.activities || []).slice(0, 2).forEach(a => {
        tips.push(pa.domainName + ': ' + a);
      });
    });
    if (!tips.length && needs.length) {
      needs.slice(0, 3).forEach(n => tips.push('Support at home: ' + n));
    }
    if (tips.length < 3) {
      tips.push('Read or tell stories together for 10–15 minutes daily');
      tips.push('Encourage outdoor play and movement games');
    }
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

    const priorityLines = teacherPriorities
      .filter(tp => tp.domainCode !== 'OVERALL')
      .slice(0, 3)
      .map(tp => tp.domainName + ': ' + ((tp.priorities && tp.priorities[0]) || tp.reason));
    const teacherNote = priorityLines.length
      ? 'Learning priorities — ' + priorityLines.join(' · ')
      : (strengths.length
        ? child.name + ' shows progress in ' + strengths.slice(0, 2).join(' and ') + '. Continue encouraging learning through play.'
        : child.name + ' is being monitored with the ECCD checklist. Please see the domain summary and tips below.');

    return {
      domains,
      standardScore,
      sumOfScaledScores: sumScaled,
      overallLabel,
      strengths,
      needs,
      parentActivities,
      teacherPriorities,
      parentDraft,
      teacherNote,
      tips: tips.slice(0, 6)
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
    this.tab = 'eccd';
    this._toast('Report approved — visible on the Parent Portal for this child.');
  },

  printEditor() {
    window.print();
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
