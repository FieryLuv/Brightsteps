/**
 * Teacher — review online enrollment applications.
 * Approve → opens Add Child with autofill; after save, mark enrolled + show parent credentials.
 */

const TeacherApplications = {
  filter: 'pending',

  render(container) {
    this._container = container;
    if (typeof ChildRegistry !== 'undefined') ChildRegistry.ensureMerged();
    this._draw();
  },

  _draw() {
    const all = typeof ApplicationStore !== 'undefined' ? ApplicationStore.listAll() : [];
    const pending = all.filter(a => a.status === 'pending');
    const list = this.filter === 'all' ? all : all.filter(a => a.status === this.filter);

    const filters = [
      { key: 'pending', label: `Pending (${pending.length})` },
      { key: 'approved', label: 'Approved' },
      { key: 'enrolled', label: 'Enrolled' },
      { key: 'rejected', label: 'Rejected' },
      { key: 'all', label: 'All' }
    ].map(f => {
      const active = this.filter === f.key;
      return `<button class="btn ${active ? 'btn-blue' : ''}"
        style="${active ? '' : 'background:#e8e8e8;color:var(--text);'}"
        onclick="TeacherApplications.setFilter('${f.key}')">${f.label}</button>`;
    }).join('');

    const cards = list.length
      ? list.map(a => this._card(a)).join('')
      : `<div class="card"><p class="text-muted" style="margin:0;">No applications in this filter.</p></div>`;

    this._container.innerHTML = `
      ${UI.pageHeader('📝 Enrollment Applications', 'Review visitor applications. Approve to autofill enrollment; parent login is guardian name + Child ID.')}
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">${filters}</div>
      </div>
      ${cards}
    `;
  },

  setFilter(key) {
    this.filter = key;
    this._draw();
  },

  _statusBadge(status) {
    const colors = {
      pending: 'var(--orange)',
      approved: 'var(--primary)',
      enrolled: 'var(--success)',
      rejected: '#d32f2f'
    };
    return `<span style="font-size:0.8rem;font-weight:700;color:${colors[status] || 'var(--muted)'};text-transform:uppercase;">${status}</span>`;
  },

  _card(a) {
    const submitted = a.submittedAt
      ? new Date(a.submittedAt).toLocaleString()
      : '—';
    let actions = '';
    if (a.status === 'pending') {
      actions = `
        <button class="btn btn-blue" onclick="TeacherApplications.openReview('${a.id}')">Review</button>
        <button class="btn" style="background:#ffebee;color:#c62828;" onclick="TeacherApplications.reject('${a.id}')">Reject</button>`;
    } else if (a.status === 'approved') {
      actions = `
        <button class="btn btn-blue" onclick="TeacherApplications.continueEnroll('${a.id}')">Continue enrollment</button>`;
    } else if (a.status === 'enrolled') {
      actions = `
        <button class="btn" style="background:#e8f5e9;color:#2e7d32;" onclick="TeacherApplications.showCredentials('${a.id}')">Parent login details</button>`;
    }

    return `
      <div class="card">
        <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;">
          <div>
            <strong style="font-size:1.05rem;">${a.childName}</strong>
            <span class="text-muted" style="margin-left:0.5rem;font-size:0.85rem;">${a.id}</span>
          </div>
          ${this._statusBadge(a.status)}
        </div>
        <p class="text-muted" style="margin:0 0 0.5rem;font-size:0.9rem;">
          Guardian: <strong>${a.guardianName}</strong>
          · ${a.contactPhone || 'no phone'}
          · Submitted ${submitted}
        </p>
        <p style="margin:0 0 0.75rem;font-size:0.9rem;">
          ${a.sex} · DOB ${a.birthDate || '—'} · Preferred: ${a.preferredSection || '—'}
          ${a.enrolledChildCode ? ` · <strong>${a.enrolledChildCode}</strong>` : ''}
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">${actions}
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherApplications.openReview('${a.id}')">View</button>
        </div>
      </div>`;
  },

  openReview(id) {
    const a = ApplicationStore.get(id);
    if (!a) return;
    const html = `
      <div id="app-review-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:640px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.2rem;color:white;">Application — ${a.childName}</h2>
            <button class="bs-modal-close" onclick="TeacherApplications.closeReview()">×</button>
          </div>
          <div class="bs-modal-body">
            <p>${this._statusBadge(a.status)} · ${a.id}</p>
            <div class="profile-grid" style="font-size:0.95rem;">
              <div><span class="text-muted">Child</span><div><strong>${a.childName}</strong></div></div>
              <div><span class="text-muted">Sex / DOB</span><div>${a.sex} · ${a.birthDate}</div></div>
              <div><span class="text-muted">Guardian</span><div>${a.guardianName}</div></div>
              <div><span class="text-muted">Mobile</span><div>${a.contactPhone || '—'}</div></div>
              <div><span class="text-muted">Mother</span><div>${a.motherName || '—'}</div></div>
              <div><span class="text-muted">Father</span><div>${a.fatherName || '—'}</div></div>
              <div><span class="text-muted">Address</span><div>${[a.barangay, a.municipality, a.province].filter(Boolean).join(', ') || '—'}</div></div>
              <div><span class="text-muted">Section preference</span><div>${a.preferredSection}</div></div>
            </div>
            ${a.notes ? `<p style="margin-top:1rem;"><strong>Notes:</strong> ${a.notes}</p>` : ''}
            ${a.status === 'enrolled' ? `<p class="success-text" style="margin-top:1rem;">Enrolled as <strong>${a.enrolledChildCode}</strong></p>` : ''}
          </div>
          <div class="bs-modal-footer" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;">
            <button class="btn" style="background:#e8e8e8;color:#333;" onclick="TeacherApplications.closeReview()">Close</button>
            ${a.status === 'pending' ? `
              <button class="btn" style="background:#ffebee;color:#c62828;" onclick="TeacherApplications.reject('${a.id}')">Reject</button>
              <button class="btn btn-blue" onclick="TeacherApplications.approve('${a.id}')">Approve &amp; enroll…</button>
            ` : ''}
            ${a.status === 'approved' ? `
              <button class="btn btn-blue" onclick="TeacherApplications.continueEnroll('${a.id}')">Continue enrollment</button>
            ` : ''}
            ${a.status === 'enrolled' ? `
              <button class="btn btn-blue" onclick="TeacherApplications.showCredentials('${a.id}')">Parent login details</button>
            ` : ''}
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  closeReview() {
    const el = document.getElementById('app-review-overlay');
    if (el) el.remove();
  },

  approve(id) {
    ApplicationStore.updateStatus(id, 'approved', { reviewedBy: 'Teacher Irish' });
    this.closeReview();
    this.continueEnroll(id);
  },

  continueEnroll(id) {
    const a = ApplicationStore.get(id);
    if (!a) return;
    this.closeReview();
    // Map to Add Child form (same shape as online autofill)
    const mapped = typeof ChildRegistry !== 'undefined'
      ? ChildRegistry.mapApplicationToForm({
          id: a.id,
          applicationId: a.id,
          childName: a.childName,
          sex: a.sex,
          birthDate: a.birthDate,
          preferredSection: a.preferredSection,
          guardianName: a.guardianName,
          motherName: a.motherName,
          fatherName: a.fatherName,
          barangay: a.barangay,
          municipality: a.municipality,
          province: a.province,
          region: a.region,
          siblings: a.siblings,
          birthOrder: a.birthOrder,
          allergies: a.allergies,
          medicalConditions: a.medicalConditions,
          immunizations: a.immunizations,
          heightCm: a.heightCm,
          weightKg: a.weightKg
        })
      : {};

    // Hook: after successful enroll, mark application enrolled
    window._pendingApplicationEnroll = id;
    BrightSteps.navigate('children');
    setTimeout(() => {
      if (typeof TeacherChildren !== 'undefined' && TeacherChildren.openAddChild) {
        TeacherChildren.openAddChild(mapped);
        // Patch save to complete application — wrap once
        this._hookEnrollmentSave(id, a);
      }
    }, 100);
  },

  _hookEnrollmentSave(appId, application) {
    if (TeacherChildren._enrollmentHooked) return;
    const original = TeacherChildren.saveEnrollment.bind(TeacherChildren);
    TeacherChildren.saveEnrollment = function () {
      const beforeIds = new Set((typeof SampleChildren !== 'undefined' ? SampleChildren : []).map(c => c.id));
      original();
      // Find newly added child
      const after = typeof SampleChildren !== 'undefined' ? SampleChildren : [];
      const added = after.find(c => !beforeIds.has(c.id));
      const pendingId = window._pendingApplicationEnroll;
      if (added && pendingId) {
        ApplicationStore.updateStatus(pendingId, 'enrolled', {
          reviewedBy: 'Teacher Irish',
          enrolledChildId: added.id,
          enrolledChildCode: added.childCode
        });
        window._pendingApplicationEnroll = null;
        setTimeout(() => TeacherApplications.showCredentials(pendingId), 400);
      }
    };
    TeacherChildren._enrollmentHooked = true;
  },

  reject(id) {
    const reason = prompt('Reason for rejection (optional):', '') || '';
    ApplicationStore.updateStatus(id, 'rejected', {
      reviewedBy: 'Teacher Irish',
      rejectReason: reason
    });
    this.closeReview();
    this._draw();
  },

  showCredentials(id) {
    const a = ApplicationStore.get(id);
    if (!a) return;
    this.closeReview();
    const guardian = a.guardianName || '—';
    const code = a.enrolledChildCode || '—';
    const phone = a.contactPhone || '—';
    const html = `
      <div id="app-cred-overlay" class="bs-overlay">
        <div class="bs-modal-panel" style="max-width:520px;">
          <div class="bs-modal-header">
            <h2 style="margin:0;font-size:1.2rem;color:white;">Parent login details</h2>
            <button class="bs-modal-close" onclick="document.getElementById('app-cred-overlay').remove()">×</button>
          </div>
          <div class="bs-modal-body">
            <p>Share these with the guardian after enrollment is complete.</p>
            <div class="card" style="background:var(--primary-light);margin:0;">
              <p style="margin:0.35rem 0;"><strong>Parent / Guardian name:</strong> ${guardian}</p>
              <p style="margin:0.35rem 0;"><strong>Child ID:</strong> ${code}</p>
              <p style="margin:0.35rem 0;"><strong>Child:</strong> ${a.childName}</p>
            </div>
            <p style="margin-top:1rem;font-size:0.9rem;line-height:1.55;">
              <strong>Suggested delivery:</strong> SMS to <strong>${phone}</strong>
              (most reliable for local parents). Optional: printed slip at the center, or email if provided.
            </p>
            <p class="text-muted" style="font-size:0.85rem;">
              Message template:<br>
              <em>“NCDC Medina: ${a.childName} is enrolled. Parent portal login — Name: ${guardian}, Child ID: ${code}. Open BrightSteps → Parent / Guardian.”</em>
            </p>
          </div>
          <div class="bs-modal-footer">
            <button class="btn btn-blue" onclick="document.getElementById('app-cred-overlay').remove();TeacherApplications.render(document.getElementById('main-content'))">Done</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};

if (typeof window !== 'undefined') window.TeacherApplications = TeacherApplications;
