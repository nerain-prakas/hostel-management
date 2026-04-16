/**
 * Main Application Entry Point
 */
const App = {
    init() {
        if (window.cordova) {
            document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        } else {
            console.log('Cordova not detected, initializing for browser...');
            this.onDeviceReady();
        }
    },

    onDeviceReady() {
        console.log('AttendMS: Device Ready');

        // Set StatusBar color
        if (StatusBar) {
            StatusBar.backgroundColor = '#1A73E8';
        }

        // Network monitoring
        this.checkNetwork();
        document.addEventListener('online', () => {
            Utils.hideOfflineBanner();
        }, false);
        document.addEventListener('offline', () => {
            this.checkNetwork();
        }, false);

        // Start Router
        Router.init();
    },

    checkNetwork() {
        if (!Utils.isOnline()) {
            Utils.showOfflineBanner();
        } else {
            Utils.hideOfflineBanner();
        }
    }
};

/**
 * Student Dashboard Controller
 */
async function initStudentDashboard() {
    const container = document.getElementById('subjects-list');
    const notificationsContainer = document.getElementById('notifications-list');

    Utils.showSkeleton('subjects-list');

    try {
        const data = await API.getStudentDashboard();
        const overall = data.overall || {};
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        const notifications = Array.isArray(data.notifications) ? data.notifications : [];

        // Update Profile Name (Mock extraction)
        document.getElementById('user-name').textContent = 'John Doe';

        // Update Overall Progress Circle
        const overallPercent = Number(
            data.overallPercent ?? overall.attendancePercent ?? 0
        );
        const circle = document.getElementById('overall-progress');
        const percentText = document.getElementById('overall-percent');

        percentText.textContent = `${overallPercent}%`;
        const offset = 440 - (440 * overallPercent) / 100; // Simple circular SVG logic
        circle.style.strokeDashoffset = offset;

        const statusEl = document.getElementById('attendance-status');
        statusEl.textContent = overallPercent >= 75 ? 'Good' : 'Shortage';
        statusEl.className = `value ${overallPercent >= 75 ? 'text-success' : 'text-danger'}`;

        document.getElementById('total-subjects').textContent = subjects.length;

        // Render Subjects
        Utils.hideSkeleton('subjects-list');
        container.innerHTML = subjects.length ? subjects.map(sub => {
            const subjectName = sub.name || sub.subjectName || 'Subject';
            const percent = Number(sub.percent ?? sub.attendancePercent ?? 0);
            const attended = Number(sub.attended ?? sub.present ?? 0);
            const held = Number(sub.held ?? sub.total ?? 0);

            return `
            <div class="subject-card">
                <div class="subject-info">
                    <span class="subject-name">${subjectName}</span>
                    <span class="subject-percent">${percent}%</span>
                </div>
                <div class="subject-progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="subject-meta">
                    <span>${attended}/${held} Classes</span>
                </div>
            </div>
        `;
        }).join('') : '<div class="empty-state">No attendance data found.</div>';

        // Render Notifications
        if (notificationsContainer) {
            notificationsContainer.innerHTML = notifications.length ? notifications.map(note => `
            <div class="notification-item">
                <div class="note-icon">🔔</div>
                <div class="note-content">
                    <div class="note-text">${note.text}</div>
                    <div class="note-date">${Utils.formatDate(note.date)}</div>
                </div>
            </div>
        `).join('') : '<div class="empty-state">No notifications.</div>';
        }

    } catch (e) {
        console.error('Dashboard Load Error:', e);
        Utils.showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Student Attendance Controller
 */
async function initStudentAttendance() {
    const listContainer = document.getElementById('attendance-list');
    const monthSelect = document.getElementById('month-select');

    const loadData = async () => {
        Utils.showSkeleton('attendance-list');
        try {
            const data = await API.getAttendance(monthSelect.value);
            Utils.hideSkeleton('attendance-list');
            const rows = Array.isArray(data.rows) ? data.rows : (Array.isArray(data.subjects) ? data.subjects : []);

            listContainer.innerHTML = rows.length ? rows.map((sub) => {
                const subjectName = sub.subjectName || sub.name || 'Subject';
                const percent = Number(sub.percent ?? sub.attendancePercent ?? 0);
                const rowClass = percent < 75 ? 'row-shortage' : 'row-safe';
                return `
                <div class="report-row ${rowClass}">
                    <span class="sub-name">${subjectName}</span>
                    <span class="sub-percent">${percent}%</span>
                </div>
            `;
            }).join('') : '<div class="empty-state">No attendance records found.</div>';
        } catch (e) {
            Utils.showToast('Error loading attendance', 'error');
        }
    };

    monthSelect.onchange = loadData;
    loadData();
}

/**
 * Student Apply Leave Controller
 */
function initStudentApplyLeave() {
    const form = document.getElementById('leave-form');
    const submitBtn = document.getElementById('submit-leave-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const data = {
            type: document.getElementById('leave-type').value,
            from: document.getElementById('leave-from').value,
            to: document.getElementById('leave-to').value,
            reason: document.getElementById('leave-reason').value
        };

        // Loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        try {
            const result = await API.submitLeave(data);
            if (result.success) {
                Utils.showToast(`Leave application submitted successfully. ID: ${result.id}`, 'success');
                form.reset();
                Router.navigate('#student-leave-status');
            }
        } catch (e) {
            Utils.showToast('Error submitting leave application', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    };
}

/**
 * Student Leave Status Controller
 */
async function initStudentLeaveStatus() {
    const historyContainer = document.getElementById('leave-history');
    const pendingEl = document.getElementById('pending-count');
    const approvedEl = document.getElementById('approved-count');

    Utils.showSkeleton('leave-history');

    try {
        const data = await API.getLeaveStatus();
        Utils.hideSkeleton('leave-history');

        let pending = 0;
        let approved = 0;

        const html = data.requests.map(req => {
            if (req.status === 'Pending') pending++;
            if (req.status === 'Approved') approved++;

            const statusClass = req.status === 'Approved' ? 'status-approved' :
                               req.status === 'Pending' ? 'status-pending' : 'status-rejected';

            return `
                <div class="leave-card">
                    <div class="card-header">
                        <span class="req-id">${req.id}</span>
                        <span class="status-badge ${statusClass}">${req.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <span class="label">Type:</span> ${req.type}
                        </div>
                        <div class="row">
                            <span class="label">Dates:</span> ${req.from} to ${req.to}
                        </div>
                        <div class="row">
                            <span class="label">Reason:</span> ${req.reason}
                        </div>
                        ${req.comment ? `<div class="row"><span class="label">Remark:</span> ${req.comment}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        pendingEl.textContent = pending;
        approvedEl.textContent = approved;
        historyContainer.innerHTML = html;

    } catch (e) {
        console.error('Leave Status Load Error:', e);
        Utils.showToast('Failed to load leave history', 'error');
    }
}

/**
 * Faculty Dashboard Controller
 */
async function initFacultyDashboard() {
    const scheduleContainer = document.getElementById('faculty-schedule');
    const pendingCountEl = document.getElementById('pending-leave-count');

    Utils.showSkeleton('faculty-schedule');

    try {
        const data = await API.getFacultyDashboard();
        Utils.hideSkeleton('faculty-schedule');

        // Render Schedule
        scheduleContainer.innerHTML = data.schedule.map(item => `
            <div class="schedule-item">
                <div class="time-slot">${item.time}</div>
                <div class="class-info">
                    <div class="subject-name">${item.subject}</div>
                    <div class="room-name">📍 ${item.room}</div>
                </div>
                <div class="action-badge">Ongoing</div>
            </div>
        `).join('');

        pendingCountEl.textContent = data.pendingLeaveCount;

    } catch (e) {
        console.error('Faculty Dashboard Error:', e);
        Utils.showToast('Failed to load faculty dashboard', 'error');
    }
}

/**
 * Faculty Mark Attendance Controller
 */
async function initFacultyMarkAttendance() {
    const subjectSelect = document.getElementById('mark-subject');
    const dateInput = document.getElementById('mark-date');
    const listContainer = document.getElementById('student-marking-list');
    const saveBtn = document.getElementById('save-attendance-btn');
    const btnText = document.getElementById('save-btn-text');
    const btnSpinner = document.getElementById('save-btn-spinner');

    // Set today's date as default
    dateInput.value = new Date().toISOString().split('T')[0];

    const loadStudents = async () => {
        Utils.showSkeleton('student-marking-list');
        try {
            const data = await API.getStudentList(subjectSelect.value);
            Utils.hideSkeleton('student-marking-list');

            listContainer.innerHTML = data.students.map(student => `
                <div class="marking-row">
                    <div class="student-info">
                        <span class="student-name">${student.name}</span>
                        <span class="student-roll">${student.roll}</span>
                    </div>
                    <div class="status-toggle">
                        <label class="switch">
                            <input type="checkbox" class="attendance-check" data-id="${student.id}" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            Utils.showToast('Error loading student list', 'error');
        }
    };

    subjectSelect.onchange = loadStudents;
    loadStudents();

    saveBtn.onclick = async () => {
        const checkboxes = document.querySelectorAll('.attendance-check');
        const attendanceData = Array.from(checkboxes).map(cb => ({
            studentId: cb.dataset.id,
            present: cb.checked
        }));

        // Loading state
        saveBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        try {
            await API.markAttendance({
                subject: subjectSelect.value,
                date: dateInput.value,
                attendance: attendanceData
            });
            Utils.showToast('Attendance saved successfully', 'success');
        } catch (e) {
            Utils.showToast('Attendance save failed', 'error');
        } finally {
            saveBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    };
}

/**
 * Faculty Approve Leave Controller
 */
async function initFacultyApproveLeave() {
    const listContainer = document.getElementById('approval-list');

    Utils.showSkeleton('approval-list');

    try {
        const data = await API.getLeaveRequests();
        Utils.hideSkeleton('approval-list');

        listContainer.innerHTML = data.requests.map(req => `
            <div class="approval-card">
                <div class="card-header">
                    <div class="student-info">
                        <span class="name">${req.studentName}</span>
                        <span class="reason">${req.reason}</span>
                    </div>
                    <div class="dates">${req.from} to ${req.to}</div>
                </div>
                <div class="approval-actions">
                    <button class="btn-action approve" onclick="handleLeaveAction('${req.id}', 'Approved')">✅ Approve</button>
                    <button class="btn-action reject" onclick="handleLeaveAction('${req.id}', 'Rejected')">❌ Reject</button>
                </div>
            </div>
        `).join('');

        // Attach actions to global window object so inline onclick works
        window.handleLeaveAction = async (id, status) => {
            const comment = prompt('Optional: Enter a remark for the student');

            try {
                await API.approveLeave(id, status, comment || '');
                Utils.showToast(`Request ${status.toLowerCase()} successfully`, 'success');
                // Refresh list
                await initFacultyApproveLeave();
            } catch (e) {
                Utils.showToast('Approval failed', 'error');
            }
        };

    } catch (e) {
        console.error('Leave Approval Load Error:', e);
        Utils.showToast('Failed to load leave requests', 'error');
    }
}

/**
 * Admin Dashboard Controller
 */
async function initAdminDashboard() {
    Utils.showSkeleton('stat-students'); // We can use a general skeleton if we had a container

    try {
        const data = await API.getAdminStats();

        document.getElementById('stat-students').textContent = data.totalStudents;
        document.getElementById('stat-faculty').textContent = data.totalFaculty;
        document.getElementById('stat-today-percent').textContent = `${data.todayPercent}%`;
        document.getElementById('stat-shortage').textContent = data.belowThreshold;

    } catch (e) {
        console.error('Admin Dashboard Error:', e);
        Utils.showToast('Failed to load admin stats', 'error');
    }
}

/**
 * Admin User Management Controller
 */
async function initAdminManageUsers() {
    const roleFilter = document.getElementById('user-role-filter');
    const userList = document.getElementById('admin-user-list');
    const addUserBtn = document.getElementById('add-user-btn');
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');

    const loadUsers = async () => {
        Utils.showSkeleton('admin-user-list');
        try {
            const data = await API.getUsers(roleFilter.value);
            Utils.hideSkeleton('admin-user-list');

            userList.innerHTML = data.users.map(user => `
                <div class="user-row">
                    <div class="user-info">
                        <span class="name">${user.name}</span>
                        <span class="email">${user.email}</span>
                    </div>
                    <div class="user-status">
                        <span class="badge ${user.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${user.status}</span>
                    </div>
                    <div class="user-actions">
                        <button class="btn-action-icon edit" onclick="editUser('${user.id}')">✏️</button>
                        <button class="btn-action-icon delete" onclick="deleteUser('${user.id}')">🗑️</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            Utils.showToast('Error loading users', 'error');
        }
    };

    roleFilter.onchange = loadUsers;
    addUserBtn.onclick = () => {
        userModal.style.display = 'flex';
    };

    userForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            password: document.getElementById('user-password').value.trim()
        };

        try {
            await API.saveUser(data);
            Utils.showToast('User saved successfully', 'success');
            userModal.style.display = 'none';
            await loadUsers();
        } catch (e) {
            Utils.showToast('Error saving user', 'error');
        }
    };

    // Global actions for inline onclick
    window.editUser = async (id) => {
        Utils.showToast('Editing user ' + id, 'info');
        // In a real app, fetch user details and populate form
    };

    window.deleteUser = async (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await API.deleteUser(id);
                Utils.showToast('User deleted', 'success');
                await loadUsers();
            } catch (e) {
                Utils.showToast('Delete failed', 'error');
            }
        }
    };

    loadUsers();
}

/**
 * Admin Settings Controller
 */
async function initAdminSettings() {
    const form = document.getElementById('settings-form');
    const saveBtn = document.getElementById('save-settings-btn');
    const btnText = document.getElementById('settings-btn-text');
    const btnSpinner = document.getElementById('settings-btn-spinner');

    try {
        const settings = await API.getSettings();
        document.getElementById('min-percent').value = settings.minPercent;
        document.getElementById('academic-year').value = settings.academicYear;
        document.getElementById('alerts-enabled').checked = settings.alertsEnabled;
    } catch (e) {
        Utils.showToast('Error loading settings', 'error');
    }

    form.onsubmit = async (e) => {
        e.preventDefault();

        const data = {
            minPercent: document.getElementById('min-percent').value,
            academicYear: document.getElementById('academic-year').value,
            alertsEnabled: document.getElementById('alerts-enabled').checked,
            maintenanceMode: document.getElementById('maintenance-mode').checked
        };

        // Loading state
        saveBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        try {
            await API.saveSettings(data);
            Utils.showToast('Settings saved successfully', 'success');
        } catch (e) {
            Utils.showToast('Error saving settings', 'error');
        } finally {
            saveBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    };
}

// Start the app
App.init();
