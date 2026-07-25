let currentUser = 'teacher'; // 'teacher' or 'parent'

const pages = {
   dashboard: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
        <div>
            <h1 style="color: var(--dark-green);">Good Morning, Teacher Maria! 👋</h1>
            <p style="color:#555;">Tuesday, July 8, 2026 | National Child Development Center - Medina</p>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Attendance -->
        <div class="card">
            <h3>Today's Attendance</h3>
            <h2 style="color:#4CAF50; font-size:3rem; margin:10px 0;">26 / 28</h2>
            <div style="height:12px; background:#ddd; border-radius:10px; overflow:hidden;">
                <div style="width:93%; height:100%; background:linear-gradient(to right, #4CAF50, #2196F3);"></div>
            </div>
            <p style="margin-top:10px;"><strong>Excellent attendance today!</strong></p>
        </div>

        <!-- AI Insight -->
        <div class="card">
            <h3>🤖 AI Daily Insight</h3>
            <p><strong>3 children</strong> are showing strong progress in Cognitive development this week.</p>
            <button class="btn" onclick="showAIModal()">View Personalized Recommendations</button>
        </div>

        <!-- Feeding Program -->
        <div class="card">
            <h3>🍎 Feeding Program Status</h3>
            <p><strong>Today's Participation:</strong> 27/28 Children</p>
            <p style="color:#4CAF50"><strong>Meal Served:</strong> Vegetable Rice + Fruits</p>
            <button class="btn btn-blue" onclick="showFeedingModal()">Update Feeding Record</button>
        </div>

        <!-- Children Needing Attention -->
        <div class="card">
            <h3>Children Needing Attention</h3>
            <ul style="line-height:2.2;">
                <li>Omar Ahmed - Fine Motor Skills</li>
                <li>Sara Ali - Language Development</li>
            </ul>
            <button class="btn btn-blue" onclick="showAllChildrenModal()">View All Children</button>
        </div>

        <!-- Quick Stats -->
        <div class="card">
            <h3>Quick Overview</h3>
            <p><strong>Children On Track:</strong> 22/28<br>
               <strong>Average Development Score:</strong> 91%</p>
        </div>

        <!-- Upcoming Events -->
        <div class="card">
            <h3>Upcoming Events</h3>
            <ul style="line-height:2.2;">
                <li>📍 Parent-Teacher Meeting - Tomorrow 2:00 PM</li>
                <li>❤️ Health Check-up Day - Friday</li>
            </ul>
        </div>
    </div>

`,


    children: `
        <h2 style="color:#2196F3;">Children</h2>
        <input type="text" placeholder="Search by name or age..." style="width:100%; max-width:450px; padding:12px; border-radius:30px; margin-bottom:20px;">
        
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap:1.5rem;">
            <div class="card" onclick="openChildProfile(1)" style="cursor:pointer;">
                <strong>Amina Khalid</strong> (2y 8m) - Sunshine Group<br>
                <span style="color:#4CAF50">Development: On Track</span>
            </div>
            <div class="card" onclick="openChildProfile(2)" style="cursor:pointer;">
                <strong>Omar Ahmed</strong> (4y 2m) - Little Stars<br>
                <span style="color:#FF9800">Fine Motor: Needs Support</span>
            </div>
        </div>
    `,
  development: `
    <h2 style="color: var(--dark-green);">📈 Development Tracking</h2>
    <p style="margin-bottom: 2rem; color: #555;">Click on a child to view detailed progress charts.</p>

    <!-- Sample Classes / Sections -->
    <div class="card">
        <h3>Select Class / Section</h3>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <button class="btn" onclick="showSectionChildren('explorers')">Little Explorers (2–3 yrs)</button>
            <button class="btn" onclick="showSectionChildren('stars')">Little Stars (3–4 yrs)</button>
            <button class="btn btn-blue" onclick="showSectionChildren('sunshine')">Sunshine Group (4–5 yrs)</button>
        </div>
    </div>

    <!-- Children will appear here after clicking a section -->
    <div id="section-children-container" style="margin-top:1.5rem;"></div>

    <!-- Individual Progress -->
    <div id="child-progress-container" style="margin-top:2rem;"></div>

    
    <!-- Overall Class Charts -->
    <div class="card">
    <h3>Overall Class Development Snapshot</h3>
    <div id="class-overall-charts" style="display:flex; justify-content:center; margin-top:1rem;"></div>
    </div>

`,

health: `
    <h2 style="color: #2196F3;">❤️ Health Monitoring</h2>
    <p style="margin-bottom: 2rem; color: #555;">Track children's height, weight, growth, nutrition, and medical records.</p>

    <!-- Sections on top -->
    <div class="card">
        <h3>Select Class / Section</h3>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <button class="btn" onclick="showHealthSection('explorers')">Little Explorers (0–3 yrs)</button>
            <button class="btn" onclick="showHealthSection('stars')">Little Stars (3–4 yrs)</button>
            <button class="btn btn-blue" onclick="showHealthSection('sunshine')">Sunshine Group (4–5 yrs)</button>
        </div>
    </div>

    <!-- Children of selected section -->
    <div id="health-section-container" style="margin-top:1.5rem;"></div>

    <div class="card">
        <h3>Recent Health Summary</h3>
        <p><strong>Most children</strong> are in normal BMI range.</p>
        <p>Next Mass Immunization: August 2026</p>
    </div>

    <div class="card">
        <h3>Nutrition Status Overview</h3>
        <p>Feeding Program Participation: <strong>98%</strong> this month</p>
    </div>
`,
attendance: `
    <h2 style="color: #2196F3;">📅 Attendance Management</h2>
    <p style="margin-bottom: 2rem; color: #555;">Daily attendance recording, monthly reports, and absence alerts.</p>

   <!-- Sections on top -->
    <div class="card">
        <h3>Select Class / Section</h3>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <button class="btn" onclick="showAttendanceSection('explorers')">Little Explorers (2–3 yrs)</button>
            <button class="btn" onclick="showAttendanceSection('stars')">Little Stars (3–4 yrs)</button>
            <button class="btn btn-blue" onclick="showAttendanceSection('sunshine')">Sunshine Group (4–5 yrs)</button>
        </div>
    </div>

    <!-- Children of selected section -->
    <div id="attendance-section-container" style="margin-top:1.5rem;"></div>

    <!-- Monthly + Yearly Summary -->
    <div class="card">
        <h3>Attendance Summary</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
            <div>
                <h4>Monthly (July 2026)</h4>
                <p><strong>Attendance Rate:</strong> 93%</p>
                <p>Present Days: 20 / 22</p>
            </div>
            <div>
                <h4>Yearly (2026)</h4>
                <p><strong>Attendance Rate:</strong> 91%</p>
                <p>Present Days: 148 / 162</p>
            </div>
        </div>
        <button class="btn" style="margin-top:1.5rem;" onclick="openAttendanceHistory()">
            📜 View Detailed Attendance History
        </button>
    </div>

    <div class="card">
        <h3>Absence Alerts</h3>
        <p>3 children have been absent for more than 3 consecutive days.</p>
        <button class="btn btn-blue" onclick="showAbsenceModal()">View Absence Details</button>
    </div>
`,
reports: `
    <h2 style="color: var(--dark-green);">📊 Reports</h2>
    <p style="margin-bottom: 2rem; color: #555;">Generate and view various reports for children, class, and center performance.</p>

    <div class="card">
        <h3>Available Reports</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
            <div class="card" onclick="generateReportDemo('Student Development')">
                📄 Student Development Reports
            </div>
            <div class="card" onclick="generateReportDemo('AI Progress')">
                🤖 AI-Generated Progress Reports
            </div>
            <div class="card" onclick="generateReportDemo('Attendance')">
                📅 Attendance Reports
            </div>
            <div class="card" onclick="generateReportDemo('Health')">
                ❤️ Health & Nutrition Reports
            </div>
        </div>
    </div>

    <div class="card">
        <h3>Recent AI Insights</h3>
        <p>The AI system has generated <strong>12 new progress insights</strong> this month.</p>
        <button class="btn" onclick="showAIReportModal()">View Latest AI Reports</button>
    </div>
`,
calendar: `
    <h2 style="color: #2196F3;">🗓️ School Calendar</h2>
    <p style="margin-bottom: 2rem; color: #555;">Event scheduling, reminders, and parent notifications.</p>

    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <button class="btn" onclick="changeMonth(-1)">← Previous</button>
            <h3 id="calendar-month-title">July 2026</h3>
            <button class="btn" onclick="changeMonth(1)">Next →</button>
        </div>

        <div id="calendar-grid" style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px;"></div>
    </div>

    <div class="card">
        <h3>Upcoming Events</h3>
        <ul id="upcoming-events" style="line-height:2.2;">
            <li><strong>July 10</strong> – Parent-Teacher Meeting (2:00 PM)</li>
            <li><strong>July 15</strong> – Health & Nutrition Screening Day</li>
            <li><strong>July 22</strong> – Storytelling Session</li>
            <li><strong>July 28</strong> – End of Month Celebration</li>
        </ul>
        <button class="btn" style="margin-top:1rem;" onclick="openAddEventModal()">+ Add New Event</button>
    </div>
    
    <div class="card">
        <h3>Upcoming Parent Notifications</h3>
        <p>Reminder: Parent-Teacher Meeting this Friday</p>
    </div>
`,
parent: `
    <div style="background: linear-gradient(135deg, #E3F2FD, #E8F5E9); padding: 2rem; border-radius: 16px; margin-bottom: 2rem;">
        <h1 style="color: var(--dark-green); text-align: center;">Welcome, Mr. Khalid! 👨‍👧</h1>
        <p style="text-align: center; color: #555;">Amina Khalid • Sunshine Group</p>
    </div>

    <div class="dashboard-grid">
        <!-- Child Progress -->
        <div class="card">
            <h3>🌟 Amina's Progress</h3>
            <p><strong>Overall Score:</strong> 93%</p>
            <p>Strong in Social-Emotional Development</p>
            <button class="btn" onclick="showParentProgressModal()">View Full Progress Report</button>
        </div>

        <!-- AI Tips -->
        <div class="card">
            <h3>🤖 AI Tips for You</h3>
            <ul style="line-height:2;">
                <li>Practice counting games during playtime</li>
                <li>Read together for 15 minutes daily</li>
                <li>Encourage sharing with siblings</li>
            </ul>
        </div>

        <!-- Attendance -->
        <div class="card">
            <h3>📅 This Month's Attendance</h3>
            <p><strong>26 out of 28 days present</strong></p>
        </div>

        <!-- Announcements -->
        <div class="card">
            <h3>📢 School Announcements</h3>
            <p>Parent-Teacher Meeting on July 10, 2026 at 2:00 PM</p>
            <button class="btn btn-blue">View All Announcements</button>
        </div>

        <!-- Payment -->
        <div class="card">
            <h3>💰 Payment Status</h3>
            <p>Monthly Contribution for July: <strong style="color:#4CAF50">Paid ✓</strong></p>
            <button class="btn">View Ledger</button>
        </div>
    </div>
`,
};

// ====================== LOGIN ======================
function loginAs(role) {
    currentUser = role;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    if (role === 'teacher') {
        loadTeacherLayout();
    } else {
        loadParentLayout();
    }
}

function loadTeacherLayout() {
    document.getElementById('main-app').innerHTML = `
        <header>
            <div class="logo">🌱 BrightSteps</div>
            <div class="user-info">Teacher Maria • NCDC Medina</div>
        </header>
        <div class="container">
            <aside class="sidebar">
                <div class="nav-item active" onclick="navigate('dashboard')">🏠 Dashboard</div>
                <div class="nav-item" onclick="navigate('children')">👦 Children</div>
                <div class="nav-item" onclick="navigate('development')">📈 Development Tracking</div>
                <div class="nav-item" onclick="navigate('health')">❤️ Health Records</div>
                <div class="nav-item" onclick="navigate('attendance')">📅 Attendance</div>
                <div class="nav-item" onclick="navigate('reports')">📊 Reports & AI</div>
                <div class="nav-item" onclick="navigate('calendar')">🗓️ Calendar</div>
            </aside>
            <main class="main-content" id="main-content"></main>
        </div>
    `;
    navigate('dashboard');
}

function loadParentLayout() {
    document.getElementById('main-app').innerHTML = `
        <header style="background: linear-gradient(135deg, #4CAF50, #81D4FA);">
            <div class="logo">🌱 BrightSteps</div>
            <div class="user-info">Mr. Khalid • Parent of Amina</div>
        </header>
        <div style="padding:2rem;" id="main-content"></div>
    `;
    document.getElementById('main-content').innerHTML = pages.parent;
}

function navigate(page) {
    document.getElementById('main-content').innerHTML = pages[page] || "<h2>Module coming soon 🌱</h2>";
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(`'${page}'`)) item.classList.add('active');
    });

    // === ADD THIS BLOCK ===
    if (page === 'development') {
    
        setTimeout(() => createClassOverallCharts(), 300);   // Auto show class charts

        // Create charts for Amina
        createDomainCharts('amina-charts', 'amina-missing', [
            {name: "Physical", percent: 92, color: "#4CAF50"},
            {name: "Cognitive", percent: 96, color: "#2196F3"},
            {name: "Language", percent: 89, color: "#FF9800"},
            {name: "Social-Emotional", percent: 97, color: "#9C27B0"},
            {name: "Fine Motor", percent: 84, color: "#00BCD4"}
        ]);
    }
    if (page === 'calendar') {
    setTimeout(() => renderCalendar(), 100);
}
}

// Feeding Program Modal
function showFeedingModal() {
    alert("🍎 Feeding Program Record\n\nDate: July 8, 2026\nMeal: Vegetable Rice with Fruits\nAttendance: 27/28\n\nRecord updated successfully! (Demo)");
}

// All Children Modal
function showAllChildrenModal() {
    const html = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:2000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; width:85%; max-width:700px; border-radius:16px; padding:2rem; max-height:90vh; overflow:auto;">
                <h2>All Children (28)</h2>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:1rem; margin-top:1rem;">
                    <div class="card" onclick="openChildProfile(1);closeCurrentModal()">Amina Khalid - On Track</div>
                    <div class="card" onclick="openChildProfile(2);closeCurrentModal()">Omar Ahmed - Needs Support</div>
                </div>
                <button class="btn" style="margin-top:20px;" onclick="closeCurrentModal()">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeAllChildrenModal() {
   closeCurrentModal();
}

// === FULL CHILD PROFILE MODAL ===
function openChildProfile(id) {
    // Example in openChildProfile or showChildProgress
const childData = {
    1: { 
        name: "Amina Khalid", 
        age: "2 years 8 months", 
        class: "Little Explorers",
        type: 1   // 0-3 years
    },
    2: { 
        name: "Omar Ahmed", 
        age: "4 years 2 months", 
        class: "Sunshine Group",
        type: 2   // 3+ years
    }
};

    const child = childData[id] || { name: "Child", age: "", class: "", type: 1 };

    let checklistHTML = '';

if (child.type === 1) {// Checklist 1 - 0-3 years (6 columns)
    
checklistHTML = `
    <h3>ECCD Checklist - Gross Motor Domain Example</h3>
    <table style="width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.95em;">
        <thead>
            <tr style="background:#1a1a1a; color:white;">
                <th style="padding:12px; text-align:left;">Gross Motor</th>
                <th style="padding:12px; text-align:left;">Material/Procedure</th>
                <th colspan="6" style="text-align:center;">Present</th>
                <th style="padding:12px; text-align:left;">Comments</th>
            </tr>
            <tr style="background:#f0f0f0;">
                <th></th>
                <th></th>
                <th>1st</th><th>2nd</th><th>3rd</th><th>4th</th><th>5th</th><th>6th</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1. Infant lifts head when held standing</td>
                <td>PROCEDURE: Hold the child in an upright position and carefully remove your hand from the child's neck according to his ability to lift his head and keep it erect. <strong>Credit if the child occasionally lifts his head free of support.</strong> Parental report will suffice.</td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox" checked></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="text" placeholder="Comments..." style="width:100%;"></td>
            </tr>
            <!-- Add more rows following the same format -->
        </tbody>
    <thead>
            <tr style="background:#1a1a1a; color:white;">
                <th style="padding:12px; text-align:left;">Gross Motor</th>
                <th style="padding:12px; text-align:left;">Material/Procedure</th>
                <th colspan="6" style="text-align:center;">Present</th>
                <th style="padding:12px; text-align:left;">Comments</th>
            </tr>
            <tr style="background:#f0f0f0;">
                <th></th>
                <th></th>
                <th>1st</th><th>2nd</th><th>3rd</th><th>4th</th><th>5th</th><th>6th</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1. Infant lifts head when held standing</td>
                <td>PROCEDURE: Hold the child in an upright position and carefully remove your hand from the child's neck according to his ability to lift his head and keep it erect. <strong>Credit if the child occasionally lifts his head free of support.</strong> Parental report will suffice.</td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox" checked></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="checkbox"></td>
                <td><input type="text" placeholder="Comments..." style="width:100%;"></td>
            </tr>
            <!-- Add more rows following the same format -->
        </tbody>
    </table>
   <button class="btn" onclick="saveChecklist()" style="margin-top:1.5rem;">💾 Save ECCD Checklist</button>
    <button class="btn btn-blue" onclick="closeCurrentModal()" style="margin-left:10px;">Close</button>
</div>


                    
                </div>
            </div>
        </div>
    `;
    } else {
        // Checklist 2 - 3+ years (3 columns)
        checklistHTML = `
            <h3>ECCD Checklist 2 (3+ years)</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.95em;">
                <thead>
                    <tr style="background:#1a1a1a; color:white;">
                        <th style="padding:12px; text-align:left;">Domain</th>
                        <th style="padding:12px; text-align:left;">Material/Procedure</th>
                        <th colspan="3" style="text-align:center;">Present</th>
                        <th style="padding:12px; text-align:left;">Comments</th>
                    </tr>
                    <tr style="background:#f0f0f0;">
                        <th></th><th></th>
                        <th>1st</th><th>2nd</th><th>3rd</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gross Motor</td>
                        <td>Runs and jumps with both feet</td>
                        <td><input type="checkbox"></td><td><input type="checkbox" checked></td><td><input type="checkbox"></td>
                        <td><input type="text" placeholder="Comments..." style="width:100%;"></td>
                    </tr>
                    <tr>
                        <td>Fine Motor</td>
                        <td>Draws simple shapes</td>
                        <td><input type="checkbox"></td><td><input type="checkbox"></td><td><input type="checkbox" checked></td>
                        <td><input type="text" placeholder="Comments..." style="width:100%;"></td>
                    </tr>
                    <tr>
                        <td>Language</td>
                        <td>Uses 4-5 word sentences</td>
                        <td><input type="checkbox" checked></td><td><input type="checkbox"></td><td><input type="checkbox"></td>
                        <td><input type="text" placeholder="Comments..." style="width:100%;"></td>
                    </tr>
                    <!-- Add more domains: Self-Help, Receptive Language, Expressive Language, Cognitive, Social-Emotional -->
                </tbody>
            </table>
        `;
    }

    const modalHTML = `
       <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:95%;max-width:1100px;border-radius:16px;max-height:94vh;overflow:auto;">
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>${child.name} (${child.age})</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <!-- Sociodemographic Profile -->
                    <div class="card">
                        <h3 style="color:#1e3a8a;">Sociodemographic Profile</h3>
                        <p><strong>Indicate the complete sociodemographic profile of the child.</strong></p>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <div>
                                <label>Child's Name:</label><br>
                                <input type="text" value="Amina Khalid" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Sex:</label><br>
                                <input type="text" value="Female" style="width:100%; padding:8px;">
                            </div>
                        </div>
                        <div>
                            <label>Date of Birth:</label><br>
                            <input type="text" value="Month Day Year" style="width:100%; padding:8px; margin-bottom:10px;">
                        </div>

                        <div>
                            <label>Address:</label><br>
                            <input type="text" value="Barangay" style="width:100%; padding:8px; margin-bottom:5px;">
                            <input type="text" value="Municipality/City" style="width:100%; padding:8px; margin-bottom:5px;">
                            <input type="text" value="Province" style="width:100%; padding:8px; margin-bottom:5px;">
                            <input type="text" value="Region" style="width:100%; padding:8px;">
                        </div>

                        <div style="margin-top:15px;">
                            <label>Child's Handedness:</label><br>
                            <label><input type="checkbox" checked> Right</label>
                            <label><input type="checkbox"> Left</label>
                            <label><input type="checkbox"> Both</label>
                            <label><input type="checkbox"> Not yet established</label>
                        </div>

                        <div style="margin-top:15px;">
                            <label>Is the child presently studying?</label><br>
                            <label><input type="checkbox" checked> Yes</label>
                            <label><input type="checkbox"> No</label>
                        </div>

                        <div>
                            <label>If Yes, name of child's school / learning center / day care:</label><br>
                            <input type="text" value="Sunshine Learning Center" style="width:100%; padding:8px;">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:15px;">
                            <div>
                                <label>Father's Name:</label><br>
                                <input type="text" value="Ahmed Khalid" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Father's Age:</label><br>
                                <input type="text" value="38" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Father's Occupation:</label><br>
                                <input type="text" value="Teacher" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Father's Educational Attainment:</label><br>
                                <input type="text" value="College Graduate" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Mother's Name:</label><br>
                                <input type="text" value="Fatima Khalid" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Mother's Age:</label><br>
                                <input type="text" value="35" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Mother's Occupation:</label><br>
                                <input type="text" value="Housewife" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Mother's Educational Attainment:</label><br>
                                <input type="text" value="College Graduate" style="width:100%; padding:8px;">
                            </div>
                        </div>

                        <div style="margin-top:15px;">
                            <label>Child's Number of Siblings:</label><br>
                            <input type="text" value="2" style="width:100%; padding:8px;">
                        </div>
                        <div>
                            <label>Child's Birth Order (1st, 2nd, 3rd, etc.):</label><br>
                            <input type="text" value="1st" style="width:100%; padding:8px;">
                        </div>

                        <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                           <button class="btn" onclick="saveChecklist()">💾 Save Profile</button>
                        </div>
                    </div>
                    ${checklistHTML}
                </div>
                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                           <button class="btn" onclick="saveChecklist()">💾 Save Checklist</button>
                           <button class="btn btn-blue" onclick="closeCurrentModal()">Close</button>
                        </div>
            </div>
        </div>
`
    document.body.insertAdjacentHTML('beforeend', modalHTML);

}

function saveChecklist() {
    alert("✅ ECCD Checklist saved successfully for this child!\n\nData is now stored digitally and ready for AI analysis.");
}

function closeChildModal() {
    closeCurrentModal();

}

// Improved Child Development Modal
function openChildDevelopment(id) {
    const names = {1: "Amina Khalid", 2: "Omar Ahmed"};
    const name = names[id] || "Child";

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:92%;max-width:920px;border-radius:16px;max-height:94vh;overflow:auto;">
                
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>${name} - Individual Development Profile</h2>
                    <button onclick="closeCurrentModal()" style="font-size:30px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <!-- Progress Overview -->
                    <div class="card">
                        <h3>Current Progress Overview</h3>
                        <p><strong>Physical:</strong> 92% | <strong>Cognitive:</strong> 96% | <strong>Language:</strong> 89% | <strong>Social-Emotional:</strong> 97%</p>
                        <p><strong>Fine Motor:</strong> 84% | <strong>Gross Motor:</strong> 93%</p>
                    </div>

                    <!-- Milestone Checklist -->
                    <div class="card">
                        <h3>Developmental Milestone Checklist</h3>
                        <ul style="line-height:2.1;">
                            <li>✅ Walks up and down stairs (Gross Motor)</li>
                            <li>✅ Draws simple shapes (Fine Motor)</li>
                            <li>✅ Uses 4-5 word sentences (Language)</li>
                            <li>🔄 Sharing toys consistently (Social-Emotional) - In Progress</li>
                        </ul>
                    </div>

                    <!-- Observation -->
                    <div class="card">
                        <h3>Teacher Observation Notes</h3>
                        <textarea style="width:100%; height:130px; padding:12px; border:1px solid #ddd; border-radius:8px;" placeholder="Write your observations here..."></textarea>
                        <button class="btn" style="margin-top:12px;">Save Observation</button>
                    </div>

                    <!-- AI Suggestions -->
                    <div class="card">
                        <h3>AI Personalized Interventions</h3>
                        <ul>
                            <li>Recommend more fine motor activities (beading, cutting)</li>
                            <li>Suggest parent engagement: daily reading session</li>
                        </ul>
                    </div>
                </div>

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn" onclick="closeCurrentModal()">Close Profile</button>
                    <button class="btn btn-blue" style="margin-left:15px;">Approve & Print Report</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

}

// AI Recommendations Modal for Development
function showDevelopmentAIModal() {
    const html = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:2000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; padding:2rem; border-radius:16px; max-width:600px;">
                <h2>🤖 AI Development Recommendations</h2>
                <p><strong>Current Suggestions:</strong></p>
                <ul>
                    <li>Focus on fine motor activities for Omar (cutting, threading)</li>
                    <li>Language games for Sara and 2 other children</li>
                    <li>Group play to strengthen social skills</li>
                </ul>
                <button class="btn" onclick="closeCurrentModal()">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

}

function showSectionChildren(section) {

    document.getElementById('section-children-container').innerHTML = '';
    document.getElementById('child-progress-container').innerHTML = '';

    let html = '';

    if (section === 'explorers') {
        html = `
            <div class="card">
                <h3>Little Explorers (2–3 years) – Checklist Type 1</h3>
                <button class="btn" onclick="showChildProgress('Amina Khalid', 'amina')">
                    Amina Khalid (2y 8m)
                </button>
            </div>
        `;
    } 
    else if (section === 'stars') {
        html = `
            <div class="card">
                <h3>Little Stars (3–4 years)</h3>
                <p style="color:#777;">No sample children yet.</p>
            </div>
        `;
    } 
    else if (section === 'sunshine') {
        html = `
            <div class="card">
                <h3>Sunshine Group (4–5 years) – Checklist Type 2</h3>
                <button class="btn" onclick="showChildProgress('Omar Ahmed', 'omar')">
                    Omar Ahmed (4y 2m)
                </button>
            </div>
        `;
    }
    document.getElementById('section-children-container').innerHTML = html;
    createClassOverallCharts(section);
}

let currentViewedChildId = null;
function showChildProgress(name, id) {
    currentViewedChildId = id;
    const data = id === 'amina' ? [
    {name: "Gross Motor", percent: 72, color: "#4CAF50"},
    {name: "Fine Motor", percent: 65, color: "#2196F3"},
    {name: "Self-Help", percent: 88, color: "#FF9800"},
    {name: "Receptive Language", percent: 60, color: "#9C27B0"},
    {name: "Expressive Language", percent: 67, color: "#00BCD4"},
    {name: "Cognitive", percent: 74, color: "#FF5722"},
    {name: "Social-Emotional", percent: 66, color: "#8BC34A"}
] : [
    {name: "Gross Motor", percent: 72, color: "#4CAF50"},
    {name: "Fine Motor", percent: 85, color: "#2196F3"},
    {name: "Self-Help", percent: 78, color: "#FF9800"},
    {name: "Receptive Language", percent: 80, color: "#9C27B0"},
    {name: "Expressive Language", percent: 87, color: "#00BCD4"},
    {name: "Cognitive", percent: 94, color: "#FF5722"},
    {name: "Social-Emotional", percent: 96, color: "#8BC34A"}
];

    const container = document.getElementById('child-progress-container');
    container.innerHTML = `
        <div class="card">
            <h3>${name} - Domain Progress</h3>
            <div style="display:flex; flex-wrap:wrap; gap:2rem; align-items:start;">
                <div id="${id}-charts" style="display:flex; flex-wrap:wrap; gap:1.8rem;"></div>
                <div style="min-width:280px;">
                    <h4 style="color:#d32f2f;">Areas Needing Attention</h4>
                    <ul id="${id}-missing" style="line-height:2.2;"></ul>
                </div>
            </div>
            <div style="margin-top:1.5rem;">
                <button class="btn btn-blue" onclick="openCurrentChildProfile()">📋 Open Full Child Profile & ECCD Checklist</button>
            </div>
        </div>
    `;

    createDomainCharts(`${id}-charts`, `${id}-missing`, data);
}
function openCurrentChildProfile() {
    if (currentViewedChildId === 'amina') {
        openChildProfile(1);   // Amina
    } else if (currentViewedChildId === 'omar') {
        openChildProfile(2);   // Omar
    } else {
        openChildProfile(1);
    }
}
// Individual Pie Chart
function showChildProgressChart(id) {
    const names = {1: "Amina Khalid", 2: "Omar Ahmed"};
    const name = names[id] || "Child";

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:16px;max-width:800px;width:90%;">
                <h2>${name} - Progress Overview</h2>
                <canvas id="pieChart" width="500" height="400"></canvas>
                <button class="btn" onclick="closeCurrentModal()" style="margin-top:15px;">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Create Pie Chart
    setTimeout(() => {
        const ctx = document.getElementById('pieChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Physical', 'Cognitive', 'Language', 'Social-Emotional', 'Fine Motor'],
                datasets: [{
                    data: [92, 96, 89, 97, 84],
                    backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4']
                }]
            },
            options: { responsive: true }
        });
    }, 100);
}

// Class Bar Chart
window.onload = function() {
    // This will run after the page loads
    if (document.getElementById('classChart')) {
        const ctx = document.getElementById('classChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Physical', 'Cognitive', 'Language', 'Social-Emotional', 'Fine Motor'],
                datasets: [{
                    label: 'Class Average %',
                    data: [89, 93, 86, 94, 85],
                    backgroundColor: '#4CAF50'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }
};
function createDomainCharts(containerId, missingId, data) {
    const container = document.getElementById(containerId);
    const missingList = document.getElementById(missingId);
    if (!container || !missingList) return;

    container.innerHTML = '';
    missingList.innerHTML = '';

    data.forEach(domain => {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.innerHTML = `
            <div style="font-weight:600; margin-bottom:5px;">${domain.name}</div>
            <canvas width="140" height="140"></canvas>
            <div style="margin-top:5px; font-size:1.1em; font-weight:bold;">${domain.percent}%</div>
        `;
        container.appendChild(div);

        // Draw Pie Chart
        const ctx = div.querySelector('canvas').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                datasets: [{
                    data: [domain.percent, 100 - domain.percent],
                    backgroundColor: [domain.color, '#f0f0f0'],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });

        // Missing items
        if (domain.percent < 90) {
            const li = document.createElement('li');
            li.textContent = `${domain.name} - ${100 - domain.percent}% gap`;
            missingList.appendChild(li);
        }
    });
}
function createClassOverallCharts(section = 'sunshine') {
    const container = document.getElementById('class-overall-charts');
    if (!container) return;

    // Sample overall percentages per section
    const sectionData = {
        explorers: { achieved: 78, label: "Little Explorers (2–3 yrs)" },
        stars:     { achieved: 85, label: "Little Stars (3–4 yrs)" },
        sunshine:  { achieved: 91, label: "Sunshine Group (4–5 yrs)" }
    };

    const data = sectionData[section] || sectionData.sunshine;

    container.innerHTML = `
        <div style="text-align:center;">
            <div style="font-weight:600; margin-bottom:10px;">${data.label}</div>
            <canvas id="overallChart" width="280" height="280"></canvas>
            <div style="margin-top:12px; font-size:1.3em; font-weight:bold; color:#4CAF50;">
                ${data.achieved}% Achieved
            </div>
            <div style="color:#777; margin-top:4px;">
                ${100 - data.achieved}% Still in Progress
            </div>
        </div>
    `;

    // Draw the chart
    setTimeout(() => {
        const ctx = document.getElementById('overallChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Achieved', 'In Progress'],
                datasets: [{
                    data: [data.achieved, 100 - data.achieved],
                    backgroundColor: ['#4CAF50', '#e0e0e0'],
                    borderWidth: 4,
                    borderColor: '#fff'
                }]
            },
            options: {
                cutout: '68%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }, 50);
}
// Call this after loading the development page
// Example usage in navigate or onload
// Improved AI Modal
function showAIModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:16px;max-width:600px;width:90%;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h2>🤖 AI Personalized Recommendations</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;cursor:pointer;color:#666;">×</button>
                </div>
                <p><strong>For Amina Khalid:</strong></p>
                <ul>
                    <li>🧩 Shape puzzles and building blocks</li>
                    <li>🥦 Increase vegetable intake</li>
                    <li>📖 Daily storytelling activity</li>
                </ul>
                <button class="btn" onclick="closeCurrentModal()">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}
function showHealthSection(section) {
    const container = document.getElementById('health-section-container');
    container.innerHTML = '';

    let html = '';

    if (section === 'explorers') {
        html = `
            <div class="card">
                <h3>Little Explorers (2–3 years)</h3>
                <button class="btn" onclick="openHealthProfile(1)">Amina Khalid (2y 8m)</button>
                <button class="btn" onclick="openHealthProfile(3)">Laila Yusuf (2y 5m)</button>
            </div>
        `;
    } 
    else if (section === 'stars') {
        html = `
            <div class="card">
                <h3>Little Stars (3–4 years)</h3>
                <button class="btn" onclick="openHealthProfile(4)">Sara Ali (3y 7m)</button>
                <button class="btn" onclick="openHealthProfile(5)">Hassan Noor (3y 10m)</button>
            </div>
        `;
    } 
    else if (section === 'sunshine') {
        html = `
            <div class="card">
                <h3>Sunshine Group (4–5 years)</h3>
                <button class="btn" onclick="openHealthProfile(2)">Omar Ahmed (4y 2m)</button>
                <button class="btn" onclick="openHealthProfile(6)">Yusuf Hassan (4y 6m)</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

function openHealthProfile(id) {
    const names = {
        1: { name: "Amina Khalid", age: "2 years 8 months" },
        2: { name: "Omar Ahmed", age: "4 years 2 months" }
    };
   const child = names[id] || { name: "Child", age: "" };

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:90%;max-width:900px;border-radius:16px;max-height:92vh;overflow:auto;">
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>${child.name} – Health Record</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>
                
                <div style="padding:2rem;">
                    <!-- Current Summary -->
                    <div class="card">
                        <h3>Current Health Summary</h3>
                        <p><strong>Age:</strong> ${child.age}</p>
                        <p><strong>Height:</strong> 92 cm &nbsp;&nbsp; <strong>Weight:</strong> 13.8 kg &nbsp;&nbsp; <strong>BMI:</strong> Normal</p>
                        <p><strong>Last Updated:</strong> July 10, 2026</p>
                    </div>you

                    <div class="card">
                    <h3>Growth Chart Summary</h3>
                    
                        <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:center;">
                            <!-- Line Chart -->
                            <div style="flex:1; min-width:300px;">
                                <canvas id="growthChart" height="180">${drawGrowthChart()}</canvas>
                            </div>
                    
                            <!-- Summary Text -->
                            <div style="flex:1; min-width:250px;">
                                <p><strong>Height:</strong> 92 cm (Normal range)</p>
                                <p><strong>Weight:</strong> 13.8 kg (Healthy)</p>
                                <p style="margin-top:1rem; color:#4CAF50;">
                                    <strong>Summary:</strong> Consistent growth in both height and weight.  
                                    The child is following a healthy growth trajectory according to age standards.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <h3>Medical Information</h3>
                        <p><strong>Immunization:</strong> Up to date<br>
                           <strong>Allergies:</strong> None<br>
                           <strong>Medical Conditions:</strong> None</p>
                    </div>

                    <div class="card">
                        <h3>Nutrition Status</h3>
                        <p>Good appetite. Participating well in feeding program.</p>
                    </div>
                </div>
                     <!-- Detailed Update Form -->
                    <div class="card">
                        <h3>Update Health Record</h3>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <div>
                                <label>Date of Measurement</label><br>
                                <input type="date" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Recorded By</label><br>
                                <input type="text" value="Teacher Maria" style="width:100%; padding:8px;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1.5rem; margin-top:1.5rem;">
                            <div>
                                <label>Height (cm)</label><br>
                                <input type="number" placeholder="e.g. 92" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>Weight (kg)</label><br>
                                <input type="number" step="0.1" placeholder="e.g. 13.8" style="width:100%; padding:8px;">
                            </div>
                            <div>
                                <label>BMI Status</label><br>
                                <select style="width:100%; padding:8px;">
                                    <option>Normal</option>
                                    <option>Underweight</option>
                                    <option>Overweight</option>
                                    <option>Obese</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-top:1.5rem;">
                            <label>Nutrition Status</label><br>
                            <select style="width:100%; padding:8px;">
                                <option>Normal</option>
                                <option>Under-nourished</option>
                                <option>At Risk</option>
                                <option>Over-nourished</option>
                            </select>
                        </div>

                        <div style="margin-top:1.5rem;">
                            <label>Immunization Status</label><br>
                            <select style="width:100%; padding:8px;">
                                <option>Up to date</option>
                                <option>Incomplete</option>
                                <option>Not started</option>
                            </select>
                        </div>

                        <div style="margin-top:1.5rem;">
                            <label>Allergies</label><br>
                            <input type="text" placeholder="None / List allergies" style="width:100%; padding:8px;">
                        </div>

                        <div style="margin-top:1.5rem;">
                            <label>Medical Conditions / Notes</label><br>
                            <textarea style="width:100%; height:100px; padding:8px;" placeholder="Any medical conditions, recent illness, or observations..."></textarea>
                        </div>

                        <div style="margin-top:1.5rem;">
                            <label>Medication Records</label><br>
                            <textarea style="width:100%; height:80px; padding:8px;" placeholder="Current medications if any..."></textarea>
                        </div>
                    </div>
                    <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn" onclick="closeCurrentModal()">Close</button>
                    <button class="btn btn-blue" style="margin-left:15px;">Update Records</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}
function drawGrowthChart() {
    setTimeout(() => {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Mar', 'May', 'Jul'],
                datasets: [
                    {
                        label: 'Height (cm)',
                        data: [86, 88, 90, 92],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Weight (kg)',
                        data: [12.1, 12.7, 13.2, 13.8],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    }, 100);
}
function showAttendanceSection(section) {
    const container = document.getElementById('attendance-section-container');
    container.innerHTML = '';


    if (section === 'explorers') {
        openAttendanceSheet(className = "explorers")
    } 
    else if (section === 'stars') {
        openAttendanceSheet(className = "stars")
    } 
    else if (section === 'sunshine') {
       openAttendanceSheet(className = "sunshine")
    }

    container.innerHTML = html;
}
function openAttendanceHistory(section = 'sunshine', monthOffset = 0) {
    // Simple month handling for demo
    const months = [
        { name: "May 2026", days: 20 },
        { name: "June 2026", days: 21 },
        { name: "July 2026", days: 22 }
    ];
    
    const currentIndex = 2 + monthOffset; // July is index 2
    const safeIndex = Math.max(0, Math.min(months.length - 1, currentIndex));
    const currentMonth = months[safeIndex];

    const sectionNames = {
        explorers: "Little Explorers (0–3 yrs)",
        stars: "Little Stars (3–4 yrs)",
        sunshine: "Sunshine Group (4–5 yrs)"
    };

    // Sample children per section
    const childrenData = {
        explorers: ["Amina Khalid", "Laila Yusuf", "Rayan Malik"],
        stars: ["Sara Ali", "Hassan Noor", "Maya Khan"],
        sunshine: ["Omar Ahmed", "Yusuf Hassan", "Zainab Faris", "Ibrahim Saleh"]
    };

    const children = childrenData[section] || childrenData.sunshine;

    // Generate simple P/A pattern for demo
    let rows = '';
    children.forEach((name, index) => {
        let cells = '';
        for (let d = 1; d <= 15; d++) {   // showing 15 sample days for compactness
            const isAbsent = (index + d) % 7 === 0;
            cells += `<td style="text-align:center; color:${isAbsent ? '#d32f2f' : '#4CAF50'};">${isAbsent ? 'A' : 'P'}</td>`;
        }
        rows += `
            <tr>
                <td style="padding:8px; font-weight:600; background:#f8f9fa; position:sticky; left:0;">${name}</td>
                ${cells}
                <td style="text-align:center; font-weight:bold;">13</td>
                <td style="text-align:center; font-weight:bold;">87%</td>
            </tr>
        `;
    });

   const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:96%;max-width:1200px;border-radius:16px;max-height:94vh;overflow:auto;">
                
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>Attendance History</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <!-- Controls -->
                    <div class="card" style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; justify-content:space-between;">
                        <div>
                            <strong>Section:</strong>
                            <select id="historySection" onchange="changeHistorySection(this.value)" style="padding:8px; margin-left:8px;">
                                <option value="explorers" ${section === 'explorers' ? 'selected' : ''}>Little Explorers</option>
                                <option value="stars" ${section === 'stars' ? 'selected' : ''}>Little Stars</option>
                                <option value="sunshine" ${section === 'sunshine' ? 'selected' : ''}>Sunshine Group</option>
                            </select>
                        </div>
                        <div>
                            <button class="btn" onclick="openAttendanceHistory('${section}', ${monthOffset - 1})">← Previous Month</button>
                            <strong style="margin:0 15px;">${currentMonth.name}</strong>
                            <button class="btn" onclick="openAttendanceHistory('${section}', ${monthOffset + 1})">Next Month →</button>
                        </div>
                    </div>

                    <!-- Attendance Grid -->
                    <div class="card">
                        <h3>${sectionNames[section]} – ${currentMonth.name}</h3>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.9em; min-width:900px;">
                                <thead>
                                    <tr style="background:#1a1a1a; color:white;">
                                        <th style="padding:10px; text-align:left;">Child Name</th>
                                        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                                        <th>6</th><th>7</th><th>8</th><th>9</th><th>10</th>
                                        <th>11</th><th>12</th><th>13</th><th>14</th><th>15</th>
                                        <th>Total</th>
                                        <th>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                        <div style="margin-top:1rem;">
                            <strong>Legend:</strong> 
                            <span style="color:#4CAF50; font-weight:bold;">P</span> = Present &nbsp;&nbsp; 
                            <span style="color:#d32f2f; font-weight:bold;">A</span> = Absent
                        </div>
                    </div>
                </div>

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn btn-blue" onclick="closeCurrentModal()">Close</button>
                </div>
            </div>
        </div>
    `;
 closeCurrentModal();
    document.body.insertAdjacentHTML('beforeend', html);
}

function changeHistorySection(newSection) {
    openAttendanceHistory(newSection, 0);
}

function openAttendanceSheet(section) {
    const sectionChildren = {
        explorers: [
            { name: "Amina Khalid", status: "present" },
            { name: "Laila Yusuf", status: "present" },
            { name: "Rayan Malik", status: "absent", reason: "Sick" }
        ],
        stars: [
            { name: "Sara Ali", status: "present" },
            { name: "Hassan Noor", status: "present" },
            { name: "Maya Khan", status: "absent", reason: "Family trip" }
        ],
        sunshine: [
            { name: "Omar Ahmed", status: "present" },
            { name: "Yusuf Hassan", status: "present" },
            { name: "Zainab Faris", status: "absent", reason: "Sick" },
            { name: "Ibrahim Saleh", status: "present" }
        ]
    };

    const children = sectionChildren[section] || sectionChildren.sunshine;
    const sectionNames = {
        explorers: "Little Explorers (2–3 yrs)",
        stars: "Little Stars (3–4 yrs)",
        sunshine: "Sunshine Group (4–5 yrs)"
    };

    let rows = '';
    children.forEach((child, index) => {
        rows += `
            <tr>
                <td style="padding:10px;">${index + 1}</td>
                <td>${child.name}</td>
                <td style="text-align:center;">
                    <input type="checkbox" ${child.status === 'present' ? 'checked' : ''}>
                </td>
                <td style="text-align:center;">
                    <input type="checkbox" ${child.status === 'absent' ? 'checked' : ''}>
                </td>
                <td>
                    <input type="text" value="${child.reason || ''}" placeholder="Remarks..." style="width:100%; padding:6px;">
                </td>
            </tr>
        `;
    });

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:95%;max-width:1100px;border-radius:16px;max-height:94vh;overflow:auto;">
                
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>Attendance Sheet – ${sectionNames[section]}</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <div class="card">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f0f0f0;">
                                    <th style="padding:12px; text-align:left;">#</th>
                                    <th style="padding:12px; text-align:left;">Child Name</th>
                                    <th style="padding:12px; text-align:center;">Present</th>
                                    <th style="padding:12px; text-align:center;">Absent</th>
                                    <th style="padding:12px; text-align:left;">Reason / Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn" onclick="alert('Attendance saved successfully!')">💾 Save Attendance</button>
                    <button class="btn btn-blue" onclick="closeCurrentModal()" style="margin-left:15px;">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

}

function showAbsenceModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:16px;max-width:600px;width:90%;">
                <h2>Absence Alerts</h2>
                <ul>
                    <li>Omar Ahmed - 5 consecutive days absent (Follow up recommended)</li>
                    <li>Sara Ali - Sick leave note submitted</li>
                </ul>
                <button class="btn" onclick="closeCurrentModal()">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}
function generateReportDemo(type) {
    alert(`📊 ${type} Report Generated Successfully!\n\nThe report is ready for review and printing. (Demo Mode)`);
}

function showAIReportModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:16px;max-width:650px;width:90%;">
                <h2>🤖 Latest AI-Generated Reports</h2>
                <ul style="line-height:2.2;">
                    <li>Amina Khalid - Strong Cognitive Growth</li>
                    <li>Class Summary - Language Development Needs Attention</li>
                    <li>Monthly Intervention Recommendations Ready</li>
                </ul>
                <button class="btn" onclick="closeCurrentModal()">Close</button>
                <button class="btn btn-blue" style="margin-left:10px;" onclick="alert('Report opened for preview')">Preview Report</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

let currentMonth = 6; // July (0-indexed)
let currentYear = 2026;

const sampleEvents = {
    "2026-7-10": "Parent-Teacher Meeting",
    "2026-7-15": "Health Screening Day",
    "2026-7-22": "Storytelling Session",
    "2026-7-28": "End of Month Celebration",
    "2026-8-5": "First Day of August Activities"
};

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-month-title');
    if (!grid || !title) return;

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Days of week header
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let html = days.map(d => `<div style="text-align:center; font-weight:600; padding:8px; background:#f0f0f0;">${d}</div>`).join('');

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += `<div style="padding:12px;"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${currentYear}-${currentMonth + 1}-${day}`;
        const hasEvent = sampleEvents[key];
        const bg = hasEvent ? "linear-gradient(135deg, #4CAF50, #2196F3)" : "#fff";
        const color = hasEvent ? "white" : "#333";
        const border = hasEvent ? "none" : "1px solid #ddd";

        html += `
            <div onclick="showDayEvents(${day})" 
                 style="padding:12px; text-align:center; border-radius:10px; cursor:pointer; 
                        background:${bg}; color:${color}; border:${border}; font-weight:${hasEvent ? '600' : '400'};">
                ${day}
                ${hasEvent ? '<div style="font-size:0.7em; margin-top:4px;">●</div>' : ''}
            </div>
        `;
    }

    grid.innerHTML = html;
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function showDayEvents(day) {
    const key = `${currentYear}-${currentMonth + 1}-${day}`;
    const eventTitle = sampleEvents[key];

    if (!eventTitle) {
        alert("No events scheduled on this day.");
        return;
    }

    // Sample extra details for demo
    const eventDetails = {
        "2026-7-10": {
            time: "2:00 PM – 4:00 PM",
            type: "Parent Meeting",
            audience: "All Parents & Teachers",
            notes: "Discuss children’s progress for the first half of the year."
        },
        "2026-7-15": {
            time: "9:00 AM – 12:00 NN",
            type: "Health Activity",
            audience: "All Children",
            notes: "Height, weight, and basic health screening."
        },
        "2026-7-22": {
            time: "10:00 AM",
            type: "Special Activity",
            audience: "All Classes",
            notes: "Interactive storytelling session with guest reader."
        },
        "2026-7-28": {
            time: "1:00 PM – 3:00 PM",
            type: "Celebration",
            audience: "Parents & Children",
            notes: "End of month celebration and progress sharing."
        }
    };

    const details = eventDetails[key] || {
        time: "All day",
        type: "General",
        audience: "All",
        notes: "No additional notes."
    };

    const monthNames = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:90%;max-width:520px;border-radius:16px;overflow:hidden;">
                
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>📅 Event Details</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <h3 style="color:var(--dark-green); margin-bottom:1rem;">${eventTitle}</h3>
                    
                    <p><strong>Date:</strong> ${monthNames[currentMonth]} ${day}, ${currentYear}</p>
                    <p><strong>Time:</strong> ${details.time}</p>
                    <p><strong>Type:</strong> ${details.type}</p>
                    <p><strong>Audience:</strong> ${details.audience}</p>
                    
                    <div style="margin-top:1.2rem; padding:1rem; background:#f8f9fa; border-radius:10px;">
                        <strong>Notes:</strong><br>
                        ${details.notes}
                    </div>
                </div>

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn btn-blue" onclick="closeCurrentModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openAddEventModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:90%;max-width:600px;border-radius:16px;overflow:auto;">
                
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>+ Add New Event</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>

                <div style="padding:2rem;">
                    <div class="card">
                        <div style="margin-bottom:1.2rem;">
                            <label><strong>Event Title</strong></label><br>
                            <input type="text" id="eventTitle" placeholder="e.g. Parent-Teacher Meeting" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label><strong>Date</strong></label><br>
                                <input type="date" id="eventDate" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                            </div>
                            <div>
                                <label><strong>Time</strong></label><br>
                                <input type="time" id="eventTime" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                            </div>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label><strong>Event Type</strong></label><br>
                            <select id="eventType" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                                <option>General Announcement</option>
                                <option>Parent Meeting</option>
                                <option>Health Activity</option>
                                <option>Celebration / Special Event</option>
                                <option>Holiday</option>
                            </select>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label><strong>Target Audience</strong></label><br>
                            <select id="eventAudience" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                                <option>All Parents & Teachers</option>
                                <option>Teachers Only</option>
                                <option>Specific Class / Section</option>
                                <option>Parents Only</option>
                            </select>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label><strong>Description / Notes</strong></label><br>
                            <textarea id="eventNotes" rows="4" placeholder="Additional details about the event..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
                        </div>

                        <div>
                            <label>
                                <input type="checkbox" id="notifyParents" checked> 
                                Send notification to parents
                            </label>
                        </div>
                    </div>
                </div>

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn" onclick="saveEvent()">💾 Save Event</button>
                    <button class="btn btn-blue" onclick="closeCurrentModal()" style="margin-left:15px;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function saveEvent() {
    const title = document.getElementById('eventTitle').value;
    if (!title) {
        alert("Please enter an event title.");
        return;
    }
    alert("✅ Event saved successfully!\n\nThe event will now appear highlighted on the calendar.");
    closeCurrentModal();
}

function showParentProgressModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:20px;max-width:720px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
                
                <!-- Header -->
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <h2 style="color:var(--dark-green);">🌟 Amina Khalid's Progress Report</h2>
                    <p style="color:#555;">July 2026 Summary</p>
                </div>

                <!-- Progress Circles / Bars -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap:1rem; margin-bottom:2rem;">
                    <div style="text-align:center;">
                        <div style="font-size:2.2rem; font-weight:bold; color:#4CAF50;">92%</div>
                        <div>Physical</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:2.2rem; font-weight:bold; color:#4CAF50;">96%</div>
                        <div>Cognitive</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:2.2rem; font-weight:bold; color:#2196F3;">89%</div>
                        <div>Language</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:2.2rem; font-weight:bold; color:#4CAF50;">97%</div>
                        <div>Social-Emotional</div>
                    </div>
                </div>

                <div class="card">
                    <h3 style="color:var(--dark-green);">Teacher's Note</h3>
                    <p>Amina is doing wonderfully! She shows great creativity during art activities and is very kind with her friends.</p>
                </div>

                <div class="card">
                    <h3 style="color:var(--dark-green);">AI Suggestion for Parents</h3>
                    <p>Continue daily reading time together. Amina especially enjoys storybooks with animals.</p>
                </div>

                <div style="text-align:center; margin-top:1.5rem;">
                    <button class="btn" onclick="closeCurrentModal()">Close Report</button>
                    <button class="btn btn-blue" style="margin-left:15px;" onclick="alert('Report downloaded (Demo)')">Download PDF</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}
// Standardized Close Function
function closeCurrentModal() {
    const modals = document.querySelectorAll('div[style*="z-index:2000"], div[style*="z-index:1000"]');
    modals.forEach(modal => {
        if (modal) modal.remove();
    });
}
function generateAIReport() { /* same */ }

window.onload = () => navigate('dashboard');