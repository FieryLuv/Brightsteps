/**
 * Visitor — online enrollment application (pending until teacher approval).
 */

const VisitorEnrollment = {
  render(container) {
    this._container = container;
    this._drawForm();
  },

  _drawForm() {
    this._container.innerHTML = `
      <div style="max-width:720px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <h1 style="margin:0 0 0.35rem;">🌱 Online Enrollment Application</h1>
          <p class="text-muted" style="margin:0;">National Child Development Center — Medina</p>
          <p class="text-muted" style="margin:0.5rem 0 0;font-size:0.9rem;">
            Submit this form to apply. Your application stays <strong>on hold</strong> until a teacher reviews and approves it.
            In-person steps may still be required at the center.
          </p>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">1. Child information</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Child’s full name *</label>
              <input type="text" id="v-child-name" class="ecc-field-input" placeholder="Given name + family name" />
            </div>
            <div>
              <label class="ecc-field-label">Sex *</label>
              <select id="v-sex" class="ecc-field-input">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div>
              <label class="ecc-field-label">Date of birth *</label>
              <input type="date" id="v-birth" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Preferred section</label>
              <select id="v-section" class="ecc-field-input">
                <option value="explorers">Little Explorers (0–3 yrs)</option>
                <option value="stars">Little Stars (3–4 yrs)</option>
                <option value="sunshine">Sunshine Group (4–5 yrs)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">2. Parent / Guardian &amp; contact</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Primary guardian name *</label>
              <input type="text" id="v-guardian" class="ecc-field-input" placeholder="Name used for parent portal login" />
            </div>
            <div>
              <label class="ecc-field-label">Mobile number *</label>
              <input type="tel" id="v-phone" class="ecc-field-input" placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label class="ecc-field-label">Email <span class="text-muted">(optional)</span></label>
              <input type="email" id="v-email" class="ecc-field-input" placeholder="optional" />
            </div>
            <div>
              <label class="ecc-field-label">Mother’s name</label>
              <input type="text" id="v-mother" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Father’s name</label>
              <input type="text" id="v-father" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Number of siblings</label>
              <input type="number" id="v-siblings" class="ecc-field-input" min="0" />
            </div>
            <div>
              <label class="ecc-field-label">Birth order</label>
              <input type="text" id="v-birth-order" class="ecc-field-input" placeholder="e.g. 1st" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">3. Address</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Barangay</label>
              <input type="text" id="v-barangay" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Municipality</label>
              <input type="text" id="v-municipality" class="ecc-field-input" value="Medina" />
            </div>
            <div>
              <label class="ecc-field-label">Province</label>
              <input type="text" id="v-province" class="ecc-field-input" value="Misamis Oriental" />
            </div>
            <div>
              <label class="ecc-field-label">Region</label>
              <input type="text" id="v-region" class="ecc-field-input" value="X" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">4. Health <span class="text-muted" style="font-weight:500;">(optional)</span></h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Allergies</label>
              <input type="text" id="v-allergies" class="ecc-field-input" placeholder="None / list" />
            </div>
            <div>
              <label class="ecc-field-label">Medical conditions</label>
              <input type="text" id="v-conditions" class="ecc-field-input" />
            </div>
            <div style="grid-column:1/-1;">
              <label class="ecc-field-label">Additional notes</label>
              <textarea id="v-notes" class="ecc-report-textarea" rows="2" placeholder="Anything the center should know…"></textarea>
            </div>
          </div>
        </div>

        <p id="v-error" style="color:#d32f2f;display:none;"></p>
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:2rem;">
          <button class="btn btn-blue" onclick="VisitorEnrollment.submit()">Submit application</button>
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="BrightSteps.logout()">← Back to login</button>
        </div>
      </div>
    `;
  },

  submit() {
    const err = document.getElementById('v-error');
    const show = (m) => {
      if (err) { err.style.display = 'block'; err.textContent = m; }
    };
    const data = {
      childName: (document.getElementById('v-child-name') || {}).value,
      sex: (document.getElementById('v-sex') || {}).value,
      birthDate: (document.getElementById('v-birth') || {}).value,
      preferredSection: (document.getElementById('v-section') || {}).value,
      guardianName: (document.getElementById('v-guardian') || {}).value,
      contactPhone: (document.getElementById('v-phone') || {}).value,
      contactEmail: (document.getElementById('v-email') || {}).value,
      motherName: (document.getElementById('v-mother') || {}).value,
      fatherName: (document.getElementById('v-father') || {}).value,
      siblings: (document.getElementById('v-siblings') || {}).value,
      birthOrder: (document.getElementById('v-birth-order') || {}).value,
      barangay: (document.getElementById('v-barangay') || {}).value,
      municipality: (document.getElementById('v-municipality') || {}).value,
      province: (document.getElementById('v-province') || {}).value,
      region: (document.getElementById('v-region') || {}).value,
      allergies: (document.getElementById('v-allergies') || {}).value,
      medicalConditions: (document.getElementById('v-conditions') || {}).value,
      notes: (document.getElementById('v-notes') || {}).value
    };

    if (!data.childName || !String(data.childName).trim()) {
      show('Child’s name is required.');
      return;
    }
    if (!data.birthDate) {
      show('Date of birth is required.');
      return;
    }
    if (!data.guardianName || !String(data.guardianName).trim()) {
      show('Guardian name is required (this becomes the parent login name).');
      return;
    }
    if (!data.contactPhone || !String(data.contactPhone).trim()) {
      show('Mobile number is required so the center can send your Child ID after approval.');
      return;
    }

    const rec = ApplicationStore.submit(data);
    this._showSuccess(rec);
  },

  _showSuccess(rec) {
    this._container.innerHTML = `
      <div style="max-width:560px;margin:2rem auto;text-align:center;">
        <div class="card">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">✅</div>
          <h2 style="margin:0 0 0.75rem;">Application submitted</h2>
          <p class="text-muted">Reference: <strong>${rec.id}</strong></p>
          <p style="line-height:1.6;">
            Status: <strong style="color:var(--orange);">Pending review</strong><br>
            A teacher will review your application. After approval and enrollment,
            you will receive parent access details (guardian name + Child ID), typically via
            <strong>SMS</strong> to <strong>${rec.contactPhone || 'your mobile'}</strong>.
          </p>
          <p class="text-muted" style="font-size:0.9rem;">
            You may still need to complete in-person requirements at NCDC Medina.
          </p>
          <button class="btn btn-blue" style="margin-top:1rem;" onclick="BrightSteps.logout()">Back to login</button>
        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') window.VisitorEnrollment = VisitorEnrollment;
