/**
 * Visitor — online enrollment application (pending until teacher approval).
 * Fields align with ECCD child profile so teacher enrollment can autofill fully.
 */

const VisitorEnrollment = {
  render(container) {
    this._container = container;
    this._drawForm();
  },

  _drawForm() {
    const classOpts = (typeof ClassStore !== 'undefined' ? ClassStore.options(false) : [
      { key: 'explorers', label: 'Little Explorers (0–3 yrs)' },
      { key: 'stars', label: 'Little Stars (3–4 yrs)' },
      { key: 'sunshine', label: 'Sunshine Group (4–5 yrs)' }
    ]).map(s => `<option value="${s.key}">${s.label}</option>`).join('');

    this._container.innerHTML = `
      <div style="max-width:800px;margin:0 auto;">
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
              <label class="ecc-field-label">Last name *</label>
              <input type="text" id="v-child-last" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">First name *</label>
              <input type="text" id="v-child-first" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Middle initial</label>
              <input type="text" id="v-child-middle" class="ecc-field-input" maxlength="5" />
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
              <label class="ecc-field-label">Birth order</label>
              <input type="text" id="v-birth-order" class="ecc-field-input" placeholder="e.g. 1st" />
            </div>
            <div>
              <label class="ecc-field-label">Preferred section</label>
              <select id="v-section" class="ecc-field-input">${classOpts}</select>
            </div>
            <div>
              <label class="ecc-field-label">Registered birth?</label>
              <div style="padding-top:0.4rem;">
                <label style="margin-right:1rem;"><input type="radio" name="v-registered" value="Yes" /> Yes</label>
                <label><input type="radio" name="v-registered" value="No" checked /> No</label>
              </div>
            </div>
            <div>
              <label class="ecc-field-label">Born at</label>
              <select id="v-born-at" class="ecc-field-input">
                <option value="">—</option>
                <option value="Hospital">Hospital</option>
                <option value="Health Center">Health Center</option>
                <option value="Home">Home</option>
              </select>
            </div>
            <div>
              <label class="ecc-field-label">Mother tongue</label>
              <select id="v-tongue" class="ecc-field-input">
                <option value="">—</option>
                <option value="Tagalog">Tagalog</option>
                <option value="Visayan">Visayan</option>
                <option value="Ilocano">Ilocano</option>
                <option value="Bicolano">Bicolano</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label class="ecc-field-label">Other dialects</label>
              <input type="text" id="v-dialects" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Number of siblings</label>
              <input type="number" id="v-siblings" class="ecc-field-input" min="0" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">2. Parent / Guardian &amp; contact</h3>
          <div class="profile-grid">
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Primary guardian name * <span class="text-muted">(parent portal login)</span></label>
              <input type="text" id="v-guardian" class="ecc-field-input" placeholder="e.g. Mrs. Santos" />
            </div>
            <div>
              <label class="ecc-field-label">Mobile number *</label>
              <input type="tel" id="v-phone" class="ecc-field-input" placeholder="09XXXXXXXXX"
                maxlength="11" inputmode="numeric" pattern="[0-9]{11}"
                oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,11)" />
            </div>
            <div>
              <label class="ecc-field-label">Email <span class="text-muted">(optional)</span></label>
              <input type="email" id="v-email" class="ecc-field-input" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">3. Mother’s profile</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Last name</label>
              <input type="text" id="v-mother-last" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">First name</label>
              <input type="text" id="v-mother-first" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Middle initial</label>
              <input type="text" id="v-mother-middle" class="ecc-field-input" maxlength="5" />
            </div>
            <div>
              <label class="ecc-field-label">Date of birth</label>
              <input type="date" id="v-mother-birth" class="ecc-field-input"
                onchange="VisitorEnrollment._fillAgeFromBirth('v-mother-birth','v-mother-age')" />
            </div>
            <div>
              <label class="ecc-field-label">Age <span class="text-muted">(auto)</span></label>
              <input type="number" id="v-mother-age" class="ecc-field-input" min="0" readonly style="background:#f5f5f5;" />
            </div>
            <div>
              <label class="ecc-field-label">Pregnant?</label>
              <div style="padding-top:0.4rem;">
                <label style="margin-right:1rem;"><input type="radio" name="v-mother-pregnant" value="Yes" /> Yes</label>
                <label><input type="radio" name="v-mother-pregnant" value="No" checked /> No</label>
              </div>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Civil status</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.9rem;">
                ${['Single','Married','Separated','Widower','Live-in'].map(s =>
                  `<label><input type="radio" name="v-mother-civil" value="${s}" /> ${s}</label>`
                ).join('')}
              </div>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Educational attainment</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.55rem;padding-top:0.35rem;font-size:0.85rem;">
                ${['Elem. / Graduate','High School / Graduate','College / Graduate','Technical/Vocational Graduate','Masteral Unit/Degree','Doctoral Unit/Degree'].map(s =>
                  `<label><input type="radio" name="v-mother-edu" value="${s}" /> ${s}</label>`
                ).join('')}
              </div>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Occupational status</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.55rem;padding-top:0.35rem;font-size:0.85rem;align-items:center;">
                ${['Employed','Unemployed','OFW','Retired'].map(s =>
                  `<label><input type="radio" name="v-mother-occup" value="${s}" /> ${s}</label>`
                ).join('')}
                <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                  <input type="text" id="v-mother-occup-other" class="ecc-field-input" style="width:140px;" />
                </label>
              </div>
            </div>
            <div>
              <label class="ecc-field-label">Mother tongue</label>
              <select id="v-mother-tongue" class="ecc-field-input">
                <option value="">—</option>
                ${['Tagalog','Visayan','Ilocano','Bicolano','Others'].map(x => `<option value="${x}">${x}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="ecc-field-label">Other dialects</label>
              <input type="text" id="v-mother-dialects" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">District / Municipality</label>
              <input type="text" id="v-mother-district" class="ecc-field-input" value="Medina" />
            </div>
            <div>
              <label class="ecc-field-label">Purok / Zone</label>
              <input type="text" id="v-mother-purok" class="ecc-field-input" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">4. Father’s profile</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Last name</label>
              <input type="text" id="v-father-last" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">First name</label>
              <input type="text" id="v-father-first" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">Middle initial</label>
              <input type="text" id="v-father-middle" class="ecc-field-input" maxlength="5" />
            </div>
            <div>
              <label class="ecc-field-label">Date of birth</label>
              <input type="date" id="v-father-birth" class="ecc-field-input"
                onchange="VisitorEnrollment._fillAgeFromBirth('v-father-birth','v-father-age')" />
            </div>
            <div>
              <label class="ecc-field-label">Age <span class="text-muted">(auto)</span></label>
              <input type="number" id="v-father-age" class="ecc-field-input" min="0" readonly style="background:#f5f5f5;" />
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Civil status</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.65rem;padding-top:0.35rem;font-size:0.9rem;">
                ${['Single','Married','Separated','Widower','Live-in'].map(s =>
                  `<label><input type="radio" name="v-father-civil" value="${s}" /> ${s}</label>`
                ).join('')}
              </div>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Educational attainment</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.55rem;padding-top:0.35rem;font-size:0.85rem;">
                ${['Elem. / Graduate','High School / Graduate','College / Graduate','Technical/Vocational Graduate','Masteral Unit/Degree','Doctoral Unit/Degree'].map(s =>
                  `<label><input type="radio" name="v-father-edu" value="${s}" /> ${s}</label>`
                ).join('')}
              </div>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="ecc-field-label">Occupational status</label>
              <div style="display:flex;flex-wrap:wrap;gap:0.55rem;padding-top:0.35rem;font-size:0.85rem;align-items:center;">
                ${['Employed','Unemployed','OFW','Retired'].map(s =>
                  `<label><input type="radio" name="v-father-occup" value="${s}" /> ${s}</label>`
                ).join('')}
                <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                  <input type="text" id="v-father-occup-other" class="ecc-field-input" style="width:140px;" />
                </label>
              </div>
            </div>
            <div>
              <label class="ecc-field-label">Mother tongue</label>
              <select id="v-father-tongue" class="ecc-field-input">
                <option value="">—</option>
                ${['Tagalog','Visayan','Ilocano','Bicolano','Others'].map(x => `<option value="${x}">${x}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="ecc-field-label">Other dialects</label>
              <input type="text" id="v-father-dialects" class="ecc-field-input" />
            </div>
            <div>
              <label class="ecc-field-label">District / Municipality</label>
              <input type="text" id="v-father-district" class="ecc-field-input" value="Medina" />
            </div>
            <div>
              <label class="ecc-field-label">Purok / Zone</label>
              <input type="text" id="v-father-purok" class="ecc-field-input" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">4b. Siblings detail</h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Age, sex, and whether in school or out of school (up to 6 rows).</p>
          <div style="overflow-x:auto;">
            <table class="eccd-table" style="width:100%;font-size:0.88rem;">
              <thead>
                <tr><th>Age</th><th>Sex</th><th>Education</th></tr>
              </thead>
              <tbody>
                ${[0,1,2,3,4,5].map(() => `
                  <tr>
                    <td><input type="number" class="ecc-field-input v-sib-age" min="0" max="30" style="min-width:70px;" /></td>
                    <td>
                      <select class="ecc-field-input v-sib-sex">
                        <option value="">—</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </td>
                    <td>
                      <select class="ecc-field-input v-sib-edu">
                        <option value="">—</option>
                        <option value="In School">In School</option>
                        <option value="Out of School">Out of School</option>
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">5. Address</h3>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Barangay / Purok</label>
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
          <h3 style="margin-top:0;">6. Documents &amp; health</h3>
          <div style="margin-bottom:0.75rem;">
            <label class="ecc-field-label">Does the child have:</label>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;padding-top:0.35rem;">
              <label><input type="checkbox" id="v-doc-eccd" /> ECCD Card</label>
              <label><input type="checkbox" id="v-doc-mcb" /> Mother &amp; Child book</label>
              <label style="display:flex;align-items:center;gap:0.35rem;">Others:
                <input type="text" id="v-doc-other" class="ecc-field-input" style="width:160px;" />
              </label>
            </div>
            ${(typeof FileAttach !== 'undefined' ? FileAttach.documentsFieldHtml('v', []) : '')}
          </div>
          <div class="profile-grid">
            <div>
              <label class="ecc-field-label">Height (cm)</label>
              <input type="number" id="v-height" class="ecc-field-input" step="0.1" />
            </div>
            <div>
              <label class="ecc-field-label">Weight (kg)</label>
              <input type="number" id="v-weight" class="ecc-field-input" step="0.1" />
            </div>
            <div>
              <label class="ecc-field-label">Allergies</label>
              <input type="text" id="v-allergies" class="ecc-field-input" placeholder="None / list" />
            </div>
            <div>
              <label class="ecc-field-label">Medical conditions</label>
              <input type="text" id="v-conditions" class="ecc-field-input" />
            </div>
          </div>
          <p class="text-muted" style="font-size:0.85rem;margin:1rem 0 0.5rem;">Vaccination (Yes / No / Don’t Know)</p>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <tbody>
              ${this._vaxRow('BCG', 'BCG')}
              ${this._vaxRow('DPT', 'DPT')}
              ${this._vaxRow('OralPolio', 'Oral Polio')}
              ${this._vaxRow('HepaB', 'Hepa B')}
              ${this._vaxRow('Measles', 'Measles')}
              ${this._vaxRow('Others', 'Others')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">7. Physical attributes</h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">12.1 Physical deformity (check all that apply)</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;margin-bottom:1rem;font-size:0.9rem;">
            ${['Hare Lip','Cross-Eyed (Duling or Banlag)','Deaf','Blind','Disabled leg','Disabled Arm/Hand','Deformity in Fingers/Toes'].map(x =>
              `<label><input type="checkbox" class="v-deformity" value="${x}" /> ${x}</label>`
            ).join('')}
          </div>
          <p class="text-muted" style="font-size:0.85rem;">12.2 Problems with</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;margin-bottom:1rem;font-size:0.9rem;">
            ${['Behavior','Speaking','Hearing','Vision'].map(x =>
              `<label><input type="checkbox" class="v-problem" value="${x}" /> ${x}</label>`
            ).join('')}
          </div>
          <p class="text-muted" style="font-size:0.85rem;">12.3 Left handed</p>
          <div style="font-size:0.9rem;">
            <label style="margin-right:1rem;"><input type="radio" name="v-left-handed" value="Yes" /> Yes</label>
            <label><input type="radio" name="v-left-handed" value="No" checked /> No</label>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">8. Prior early childhood experience</h3>
          ${['Nursery','Kindergarten','Preparatory'].map(level => {
            const key = level.toLowerCase();
            const opts = ['Private Pre-School','Public Pre-School','Private Day Care','Public Day Care','Church-based','Home-based','Others'];
            return `
              <p style="font-weight:600;margin:0.75rem 0 0.35rem;">${level}</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;font-size:0.88rem;">
                ${opts.map(o => `<label><input type="checkbox" class="v-ece-${key}" value="${o}" /> ${o}</label>`).join('')}
              </div>`;
          }).join('')}
        </div>

        <div class="card">
          <h3 style="margin-top:0;">9. Transport &amp; who accompanies <span class="text-muted" style="font-weight:500;">(optional)</span></h3>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0;">Public transportation</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;margin-bottom:1rem;font-size:0.88rem;">
            ${['School bus','Jeep','Bus','Banca','Calesa','Tricycle','Pedicab','Habal-Habal','Others'].map(x =>
              `<label><input type="checkbox" class="v-transport" value="${x}" /> ${x}</label>`
            ).join('')}
          </div>
          <p class="text-muted" style="font-size:0.85rem;">Goes to school with</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;font-size:0.88rem;">
            ${['Mother','Father','Both Parents','Siblings','Relatives','Grandparents','Maid','None'].map(x =>
              `<label><input type="checkbox" class="v-accompany" value="${x}" /> ${x}</label>`
            ).join('')}
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">10. Notes</h3>
          <textarea id="v-notes" class="ecc-report-textarea" rows="2" placeholder="Anything the center should know…"></textarea>
        </div>

        <p id="v-error" style="color:#d32f2f;display:none;margin:0 0 0.75rem;"></p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end;margin-bottom:2rem;">
          <button class="btn btn-blue" onclick="VisitorEnrollment.submit()">Submit application</button>
          <button class="btn" style="background:#e8e8e8;color:#333;" onclick="BrightSteps.logout()">← Back to login</button>
        </div>
      </div>
    `;
  },

  _vaxRow(key, label) {
    return `<tr>
      <td style="padding:0.35rem 0.5rem;font-weight:600;width:110px;">${label}</td>
      <td style="padding:0.35rem 0.5rem;">
        <label style="margin-right:0.75rem;"><input type="radio" name="v-vax-${key}" value="Yes" /> Yes</label>
        <label style="margin-right:0.75rem;"><input type="radio" name="v-vax-${key}" value="No" /> No</label>
        <label><input type="radio" name="v-vax-${key}" value="Don't Know" /> Don't Know</label>
      </td>
    </tr>`;
  },

  _vaxVal(key) {
    const el = document.querySelector('input[name="v-vax-' + key + '"]:checked');
    return el ? el.value : '';
  },

  _checked(sel) {
    return Array.from(document.querySelectorAll(sel + ':checked')).map(el => el.value);
  },

  _joinName(first, middle, last) {
    return [first, middle, last].map(s => (s || '').trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  },

  _radio(name) {
    const el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  },

  _readSiblingsDetail() {
    const ages = document.querySelectorAll('.v-sib-age');
    const sexes = document.querySelectorAll('.v-sib-sex');
    const edus = document.querySelectorAll('.v-sib-edu');
    const rows = [];
    for (let i = 0; i < ages.length; i++) {
      const age = ages[i].value;
      const sex = sexes[i] ? sexes[i].value : '';
      const education = edus[i] ? edus[i].value : '';
      if (age !== '' || sex || education) {
        rows.push({
          age: age !== '' ? Number(age) : null,
          sex,
          education
        });
      }
    }
    return rows;
  },

  _fillAgeFromBirth(birthId, ageId) {
    const birthEl = document.getElementById(birthId);
    const ageEl = document.getElementById(ageId);
    if (!birthEl || !ageEl || !birthEl.value) {
      if (ageEl) ageEl.value = '';
      return;
    }
    const b = new Date(birthEl.value + 'T00:00:00');
    if (isNaN(b.getTime())) return;
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    ageEl.value = age >= 0 ? age : '';
  },

  _readPhysical() {
    const left = document.querySelector('input[name="v-left-handed"]:checked');
    return {
      deformities: this._checked('.v-deformity'),
      problems: this._checked('.v-problem'),
      leftHanded: left ? left.value : 'No'
    };
  },

  _readPriorEce() {
    return {
      nursery: this._checked('.v-ece-nursery'),
      kindergarten: this._checked('.v-ece-kindergarten'),
      preparatory: this._checked('.v-ece-preparatory')
    };
  },

  _readParentBlock(prefix) {
    const g = (id) => (document.getElementById(prefix + '-' + id) || {}).value || '';
    let occupation = this._radio(prefix + '-occup');
    const occupOther = g('occup-other');
    if (!occupation && occupOther) occupation = 'Others';
    return {
      lastName: g('last').trim(),
      firstName: g('first').trim(),
      middleInitial: g('middle').trim(),
      birthDate: g('birth'),
      age: g('age'),
      pregnant: prefix === 'v-mother' ? this._radio('v-mother-pregnant') : undefined,
      civilStatus: this._radio(prefix + '-civil'),
      education: this._radio(prefix + '-edu'),
      occupation,
      occupationOther: occupOther,
      motherTongue: g('tongue'),
      otherDialects: g('dialects'),
      district: g('district'),
      purok: g('purok')
    };
  },

  submit() {
    const err = document.getElementById('v-error');
    const show = (m) => {
      if (err) { err.style.display = 'block'; err.textContent = m; }
    };

    const childLast = (document.getElementById('v-child-last') || {}).value || '';
    const childFirst = (document.getElementById('v-child-first') || {}).value || '';
    const childMiddle = (document.getElementById('v-child-middle') || {}).value || '';
    const motherLast = (document.getElementById('v-mother-last') || {}).value || '';
    const motherFirst = (document.getElementById('v-mother-first') || {}).value || '';
    const motherMiddle = (document.getElementById('v-mother-middle') || {}).value || '';
    const fatherLast = (document.getElementById('v-father-last') || {}).value || '';
    const fatherFirst = (document.getElementById('v-father-first') || {}).value || '';
    const fatherMiddle = (document.getElementById('v-father-middle') || {}).value || '';
    const regEl = document.querySelector('input[name="v-registered"]:checked');

    const data = {
      lastName: childLast.trim(),
      firstName: childFirst.trim(),
      middleInitial: childMiddle.trim(),
      childName: this._joinName(childFirst, childMiddle, childLast),
      sex: (document.getElementById('v-sex') || {}).value,
      birthDate: (document.getElementById('v-birth') || {}).value,
      preferredSection: (document.getElementById('v-section') || {}).value,
      birthOrder: (document.getElementById('v-birth-order') || {}).value,
      registered: regEl ? regEl.value : 'No',
      bornAt: (document.getElementById('v-born-at') || {}).value,
      motherTongue: (document.getElementById('v-tongue') || {}).value,
      otherDialects: (document.getElementById('v-dialects') || {}).value,
      guardianName: (document.getElementById('v-guardian') || {}).value,
      contactPhone: (document.getElementById('v-phone') || {}).value,
      contactEmail: (document.getElementById('v-email') || {}).value,
      motherProfile: this._readParentBlock('v-mother'),
      fatherProfile: this._readParentBlock('v-father'),
      motherLastName: motherLast.trim(),
      motherFirstName: motherFirst.trim(),
      motherMiddleInitial: motherMiddle.trim(),
      motherName: this._joinName(motherFirst, motherMiddle, motherLast),
      fatherLastName: fatherLast.trim(),
      fatherFirstName: fatherFirst.trim(),
      fatherMiddleInitial: fatherMiddle.trim(),
      fatherName: this._joinName(fatherFirst, fatherMiddle, fatherLast),
      siblings: (document.getElementById('v-siblings') || {}).value,
      siblingsDetail: this._readSiblingsDetail(),
      barangay: (document.getElementById('v-barangay') || {}).value,
      municipality: (document.getElementById('v-municipality') || {}).value,
      province: (document.getElementById('v-province') || {}).value,
      region: (document.getElementById('v-region') || {}).value,
      documents: {
        eccdCard: !!(document.getElementById('v-doc-eccd') || {}).checked,
        motherChildBook: !!(document.getElementById('v-doc-mcb') || {}).checked,
        other: (document.getElementById('v-doc-other') || {}).value || '',
        files: (typeof FileAttach !== 'undefined' ? FileAttach.getDocs('v') : [])
      },
      heightCm: (document.getElementById('v-height') || {}).value,
      weightKg: (document.getElementById('v-weight') || {}).value,
      allergies: (document.getElementById('v-allergies') || {}).value,
      medicalConditions: (document.getElementById('v-conditions') || {}).value,
      vaccines: {
        BCG: this._vaxVal('BCG'),
        DPT: this._vaxVal('DPT'),
        OralPolio: this._vaxVal('OralPolio'),
        HepaB: this._vaxVal('HepaB'),
        Measles: this._vaxVal('Measles'),
        Others: this._vaxVal('Others')
      },
      physicalAttributes: this._readPhysical(),
      priorEce: this._readPriorEce(),
      transport: this._checked('.v-transport'),
      accompanies: this._checked('.v-accompany'),
      notes: (document.getElementById('v-notes') || {}).value
    };

    if ((data.siblings === '' || data.siblings == null) && data.siblingsDetail && data.siblingsDetail.length) {
      data.siblings = data.siblingsDetail.length;
    }

    if (!data.firstName.trim() && !data.lastName.trim() && !data.childName.trim()) {
      show('Child’s first or last name is required.');
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
    const phoneDigits = String(data.contactPhone).replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      show('Mobile number must be exactly 11 digits (e.g. 09171234567).');
      return;
    }
    data.contactPhone = phoneDigits;

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
