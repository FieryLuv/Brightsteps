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
                <strong>Amina Khalid</strong> (4y 3m) - Sunshine Group<br>
                <span style="color:#4CAF50">Development: On Track</span>
            </div>
            <div class="card" onclick="openChildProfile(2)" style="cursor:pointer;">
                <strong>Omar Ahmed</strong> (3y 10m) - Little Stars<br>
                <span style="color:#FF9800">Fine Motor: Needs Support</span>
            </div>
        </div>
    `,
    development: `
    <h2 style="color: var(--dark-green);">📈 Development Tracking</h2>
    <p style="margin-bottom: 2rem; color: #555;">Track Physical, Cognitive, Language, Social-Emotional, Fine & Gross Motor development with AI support.</p>

    <div class="card">
        <h3>Select Child to Track</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn" onclick="openChildDevelopment(1)">Amina Khalid (4y 3m)</button>
            <button class="btn" onclick="openChildDevelopment(2)">Omar Ahmed (3y 10m)</button>
            <button class="btn btn-blue" onclick="alert('Full list of children would appear here')">All Children</button>
        </div>
    </div>

    <div class="card">
        <h3>AI-Generated Developmental Insights</h3>
        <p>The system has identified <strong>4 children</strong> who may benefit from targeted interventions this month.</p>
        <button class="btn" onclick="showDevelopmentAIModal()">View AI Recommendations</button>
    </div>

    <div class="card">
        <h3>Overall Class Development Summary</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#f0f0f0;">
                <th style="padding:10px; text-align:left;">Domain</th>
                <th style="padding:10px;">Average Progress</th>
                <th style="padding:10px;">Status</th>
            </tr>
            <tr>
                <td style="padding:10px;">Physical Development</td>
                <td style="padding:10px; text-align:center;">89%</td>
                <td style="padding:10px; color:#4CAF50;">On Track</td>
            </tr>
            <tr>
                <td style="padding:10px;">Cognitive Development</td>
                <td style="padding:10px; text-align:center;">93%</td>
                <td style="padding:10px; color:#4CAF50;">On Track</td>
            </tr>
            <tr>
                <td style="padding:10px;">Language Development</td>
                <td style="padding:10px; text-align:center;">86%</td>
                <td style="padding:10px; color:#FF9800;">Monitor</td>
            </tr>
        </table>
    </div>
`,
health: `
    <h2 style="color: #2196F3;">❤️ Health Monitoring</h2>
    <p style="margin-bottom: 2rem; color: #555;">Track children's height, weight, growth, nutrition, and medical records.</p>

    <div class="card">
        <h3>Select Child</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn" onclick="openHealthProfile(1)">Amina Khalid</button>
            <button class="btn" onclick="openHealthProfile(2)">Omar Ahmed</button>
            <button class="btn btn-blue" onclick="alert('Full health list would appear here')">All Children</button>
        </div>
    </div>

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

    <div class="card">
        <h3>Today's Attendance</h3>
        <h2 style="color:#4CAF50; font-size: 2.8rem;">26 / 28</h2>
        <p><strong>2 children absent</strong> - Reason: Sick</p>
        <button class="btn" onclick="markAttendanceDemo()">Mark / Update Attendance</button>
    </div>

    <div class="card">
        <h3>Monthly Attendance Summary</h3>
        <p><strong>Overall Rate:</strong> 94% (July 2026)</p>
        <ul>
            <li>Amina Khalid - 100%</li>
            <li>Omar Ahmed - 87%</li>
        </ul>
    </div>

    <div class="card">
        <h3>Absence Alerts</h3>
        <p>3 children have been absent for more than 3 consecutive days.</p>
        <button class="btn btn-blue" onclick="showAbsenceModal()">View Absence Details</button>
    </div>
`,
reports: `
    <h2 style="color: var(--dark-green);">📊 Reports & AI Insights</h2>
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
        <h3>July 2026 - Upcoming Events</h3>
        <ul style="line-height: 2.4;">
            <li><strong>July 10</strong> - Parent-Teacher Meeting (2:00 PM)</li>
            <li><strong>July 15</strong> - Health & Nutrition Screening Day</li>
            <li><strong>July 22</strong> - Mid-Month Storytelling Session</li>
            <li><strong>July 28</strong> - End of Month Celebration & Progress Sharing</li>
        </ul>
    </div>

    <div class="card">
        <h3>Quick Actions</h3>
        <button class="btn" onclick="addEventDemo()">+ Add New Event</button>
        <button class="btn btn-blue" style="margin-left:15px;" onclick="showCalendarModal()">View Full Calendar</button>
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
    const childData = {
        1: { name: "Amina Khalid", age: "4 years 3 months", class: "Sunshine Group", status: "On Track" },
        2: { name: "Omar Ahmed", age: "3 years 10 months", class: "Little Stars", status: "Needs Support" }
    };

    const child = childData[id] || { name: "Child" };

    const modalHTML = `
       <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:95%;max-width:1100px;border-radius:16px;max-height:94vh;overflow:auto;">
                <!-- Header -->
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>${child.name || 'Child'}</h2>
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
                    </div>
<div class="card">
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
function openHealthProfile(id) {
    const names = {1: "Amina Khalid", 2: "Omar Ahmed"};
    const name = names[id] || "Child";

    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;width:90%;max-width:900px;border-radius:16px;max-height:92vh;overflow:auto;">
                <div style="padding:1.5rem;background:linear-gradient(to right,#4CAF50,#2196F3);color:white;display:flex;justify-content:space-between;align-items:center;">
                    <h2>${name} - Health Record</h2>
                    <button onclick="closeCurrentModal()" style="font-size:28px;background:none;border:none;color:white;cursor:pointer;">×</button>
                </div>
                
                <div style="padding:2rem;">
                    <div class="card">
                        <h3>Latest Measurements</h3>
                        <p><strong>Height:</strong> 102 cm &nbsp;&nbsp; <strong>Weight:</strong> 16.5 kg &nbsp;&nbsp; <strong>BMI:</strong> Normal</p>
                        <p><strong>Last Recorded:</strong> July 1, 2026</p>
                    </div>

                    <div class="card">
                        <h3>Growth Chart Summary</h3>
                        <p>(Growth chart visualization would be displayed here)</p>
                        <p>Consistent growth in height and weight.</p>
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

                <div style="padding:1.5rem; text-align:center; border-top:1px solid #ddd;">
                    <button class="btn" onclick="closeCurrentModal()">Close</button>
                    <button class="btn btn-blue" style="margin-left:15px;">Update Records</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}
function markAttendanceDemo() {
    alert("✅ Attendance marked successfully!\n\nYou can record individual child attendance here with notes.");
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
function addEventDemo() {
    alert("📅 New Event Creation Form would open here.\n\nYou can schedule events and automatically notify parents.");
}

function showCalendarModal() {
    const html = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:2rem;border-radius:16px;max-width:700px;width:90%;">
                <h2>🗓️ Full School Calendar</h2>
                <p>July 2026</p>
                <ul>
                    <li>10 Jul - Parent-Teacher Meeting</li>
                    <li>15 Jul - Health Screening</li>
                    <li>28 Jul - Progress Sharing Day</li>
                </ul>
                <button class="btn" onclick="closeCurrentModal()">Close Calendar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
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