/**
 * Visitor — About NCDC Medina landing page
 * Hero fade slideshow, brief history, enrollment CTA, links, map.
 */

const VisitorAbout = {
  _slides: [
    { src: 'assets/visitor/ncdc-entrance.jpg', alt: 'NCDC Medina entrance' },
    { src: 'assets/visitor/ncdc-play-1.jpg', alt: 'Play area with swings' },
    { src: 'assets/visitor/ncdc-play-3.jpg', alt: 'Covered playground' },
    { src: 'assets/visitor/ncdc-play-2.jpg', alt: 'Playground and classroom entrance' },
    { src: 'assets/visitor/ncdc-interior.jpg', alt: 'National Child Development Center entrance interior' },
    { src: 'assets/visitor/ncdc-class-main.jpg', alt: 'Main classroom with colorful tables' },
    { src: 'assets/visitor/ncdc-class-tables.jpg', alt: 'Learning tables along the window wall' },
    { src: 'assets/visitor/ncdc-class-corner.jpg', alt: 'Classroom learning corner' },
    { src: 'assets/visitor/ncdc-class-activity.jpg', alt: 'Activity area and learning shelves' },
    { src: 'assets/visitor/ncdc-class-overview.jpg', alt: 'Classroom overview with mini library' },
    { src: 'assets/visitor/ncdc-spiritual-corner.jpg', alt: 'Quiet area and spiritual corner' }
  ],
  _timer: null,
  _index: 0,

  render(container) {
    this._container = container;
    this._index = 0;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._draw();
    this._startSlideshow();
  },

  destroy() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _draw() {
    const slidesHtml = this._slides
      .map(
        (s, i) =>
          `<div class="visitor-slide${i === 0 ? ' is-active' : ''}" data-i="${i}">
            <img src="${s.src}" alt="${s.alt}" loading="${i === 0 ? 'eager' : 'lazy'}" />
          </div>`
      )
      .join('');

    const dotsHtml = this._slides
      .map((_, i) => `<button type="button" class="visitor-dot${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`)
      .join('');

    this._container.innerHTML = `
      <div class="visitor-about">
        <!-- Hero slideshow -->
        <section class="visitor-hero">
          <div class="visitor-slides" id="visitor-slides">
            ${slidesHtml}
          </div>
          <div class="visitor-hero-overlay">
            <div class="visitor-hero-content">
              <p class="visitor-kicker">National Child Development Center</p>
              <h1>Welcome to NCDC Medina</h1>
              <p class="visitor-hero-lead">
                A community-based center for children 0–4 years — early learning, care, and family support in Medina, Misamis Oriental.
              </p>
              <div class="visitor-hero-actions">
                <button type="button" class="btn btn-green visitor-cta" onclick="BrightSteps.showVisitorEnrollment()">
                  Apply for Enrollment
                </button>
                <a href="#visitor-about-ncdc" class="btn visitor-cta-secondary">Learn more</a>
              </div>
            </div>
          </div>
          <div class="visitor-dots" id="visitor-dots">${dotsHtml}</div>
        </section>

        <!-- About NCDC -->
        <section class="visitor-section" id="visitor-about-ncdc">
          <div class="visitor-section-inner">
            <h2>About NCDC Medina</h2>
            <p>
              The <strong>National Child Development Center (NCDC)</strong> in Medina is a community-based early childhood facility
              under the Early Childhood Care and Development (ECCD) system. It serves children from birth to four years old
              through play-based early learning, developmental monitoring, health and nutrition support, and partnership with families.
            </p>
            <p>
              NCDCs are the flagship venues of the ECCD Council for integrated services — Early Learning Programs
              (including infant–toddler and pre-kindergarten sessions), family support, and developmentally appropriate materials —
              so every young child in the community has a strong start.
            </p>
            <div class="visitor-highlights">
              <div class="visitor-highlight-card">
                <span class="visitor-hi-icon">👶</span>
                <h3>Ages 0–4</h3>
                <p>Holistic care and early learning for infants, toddlers, and preschoolers.</p>
              </div>
              <div class="visitor-highlight-card">
                <span class="visitor-hi-icon">📋</span>
                <h3>ECCD Checklist</h3>
                <p>Teachers monitor development across domains using the national checklist.</p>
              </div>
              <div class="visitor-highlight-card">
                <span class="visitor-hi-icon">🥗</span>
                <h3>Feeding &amp; health</h3>
                <p>Supplementary feeding and basic health records support growth and wellbeing.</p>
              </div>
              <div class="visitor-highlight-card">
                <span class="visitor-hi-icon">👨‍👩‍👧</span>
                <h3>Family partnership</h3>
                <p>Parents stay informed and involved in their child’s progress at the center.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Brief history / ECCD -->
        <section class="visitor-section visitor-section-alt">
          <div class="visitor-section-inner visitor-two-col">
            <div>
              <h2>ECCD &amp; why it matters</h2>
              <p>
                <strong>Early Childhood Care and Development (ECCD)</strong> covers health, nutrition, early education, and social services
                for children below five. The Philippines institutionalized a national ECCD system through laws such as the Early Years Act,
                so communities can deliver consistent, quality programs for the youngest learners.
              </p>
              <p>
                The <strong>ECCD Council</strong> sets policy and standards and works with local government units to establish NCDCs
                nationwide. Each center is meant to be a hub for early learning and a resource for parents and caregivers in the locality.
              </p>
              <p class="text-muted" style="font-size:0.9rem;margin-top:0.75rem;">
                Medina’s NCDC follows the same green-and-blue identity used across NCDCs for easy recognition, with a welcoming play area
                and classroom spaces for daily sessions.
              </p>
            </div>
            <div class="visitor-links-card">
              <h3 style="margin-top:0;">Learn more</h3>
              <ul class="visitor-ext-links">
                <li>
                  <a href="https://eccdcouncil.gov.ph/" target="_blank" rel="noopener noreferrer">
                    ECCD Council <span aria-hidden="true">↗</span>
                  </a>
                  <span class="visitor-link-desc">National policies, NCDC program, and early childhood standards</span>
                </li>
                <li>
                  <a href="https://eccdcouncil.gov.ph/ncdc/" target="_blank" rel="noopener noreferrer">
                    About National Child Development Centers <span aria-hidden="true">↗</span>
                  </a>
                  <span class="visitor-link-desc">How NCDCs serve communities as flagship ECCD venues</span>
                </li>
                <li>
                  <a href="https://www.dswd.gov.ph/" target="_blank" rel="noopener noreferrer">
                    DSWD <span aria-hidden="true">↗</span>
                  </a>
                  <span class="visitor-link-desc">Department of Social Welfare and Development</span>
                </li>
                <li>
                  <a href="https://www.facebook.com/search/top?q=MSWDO%20Medina%20Misamis%20Oriental" target="_blank" rel="noopener noreferrer">
                    MSWDO / CSWD Medina <span aria-hidden="true">↗</span>
                  </a>
                  <span class="visitor-link-desc">Municipal social welfare office — local child &amp; family services</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Map -->
        <section class="visitor-section">
          <div class="visitor-section-inner">
            <h2>Location</h2>
            <p class="text-muted" style="margin-top:0;">
              <strong>20 Medina By-Pass Rd</strong>, Medina, Misamis Oriental, Northern Mindanao.
              Visit the center during office hours for enrollment follow-up and in-person requirements.
            </p>
            <div class="visitor-map-wrap">
              <iframe
                title="Map of NCDC Medina"
                src="https://maps.google.com/maps?q=8.913836,125.023616&z=18&output=embed"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen>
              </iframe>
            </div>
            <p style="margin-top:0.75rem;font-size:0.9rem;">
              <a href="https://www.google.com/maps?q=8.913836,125.023616&z=18" target="_blank" rel="noopener noreferrer">
                Open in Google Maps ↗
              </a>
            </p>
          </div>
        </section>

        <!-- Bottom CTA -->
        <section class="visitor-cta-band">
          <div class="visitor-section-inner" style="text-align:center;">
            <h2 style="margin-bottom:0.5rem;">Ready to enroll your child?</h2>
            <p class="text-muted" style="max-width:32rem;margin:0 auto 1.25rem;">
              Submit an online application. A teacher will review it; approved applications are used to complete enrollment at the center.
            </p>
            <button type="button" class="btn btn-green visitor-cta" onclick="BrightSteps.showVisitorEnrollment()">
              Start enrollment application
            </button>
          </div>
        </section>
      </div>
    `;

    // Dot clicks
    this._container.querySelectorAll('.visitor-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-i'), 10);
        this._goTo(i);
        this._restartTimer();
      });
    });
  },

  _goTo(i) {
    const slides = this._container.querySelectorAll('.visitor-slide');
    const dots = this._container.querySelectorAll('.visitor-dot');
    if (!slides.length) return;
    this._index = ((i % slides.length) + slides.length) % slides.length;
    slides.forEach((el, idx) => el.classList.toggle('is-active', idx === this._index));
    dots.forEach((el, idx) => el.classList.toggle('is-active', idx === this._index));
  },

  _startSlideshow() {
    this._restartTimer();
  },

  _restartTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this._goTo(this._index + 1);
    }, 4500);
  }
};
