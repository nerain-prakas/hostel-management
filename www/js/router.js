/**
 * Hash-based Router for AttendMS
 */
const Router = {
    routes: {
        '#login': {
            file: 'screens/login.html',
            guard: null,
            init: initLogin
        },
        '#student-dashboard': {
            file: 'screens/student-dashboard.html',
            guard: 'student',
            init: initStudentDashboard
        },
        '#student-attendance': {
            file: 'screens/student-attendance.html',
            guard: 'student',
            init: initStudentAttendance
        },
        '#student-apply-leave': {
            file: 'screens/student-apply-leave.html',
            guard: 'student',
            init: initStudentApplyLeave
        },
        '#student-leave-status': {
            file: 'screens/student-leave-status.html',
            guard: 'student',
            init: initStudentLeaveStatus
        },
        '#faculty-dashboard': {
            file: 'screens/faculty-dashboard.html',
            guard: 'faculty',
            init: initFacultyDashboard
        },
        '#faculty-mark-attendance': {
            file: 'screens/faculty-mark-attendance.html',
            guard: 'faculty',
            init: initFacultyMarkAttendance
        },
        '#faculty-approve-leave': {
            file: 'screens/faculty-approve-leave.html',
            guard: 'faculty',
            init: initFacultyApproveLeave
        },
        '#admin-dashboard': {
            file: 'screens/admin-dashboard.html',
            guard: 'admin',
            init: initAdminDashboard
        },
        '#admin-manage-users': {
            file: 'screens/admin-manage-users.html',
            guard: 'admin',
            init: initAdminManageUsers
        },
        '#admin-settings': {
            file: 'screens/admin-settings.html',
            guard: 'admin',
            init: initAdminSettings
        }
    },

    /**
     * Navigates to a new route
     * @param {string} hash - The target hash
     */
    async navigate(hash) {
        const route = this.routes[hash] || this.routes['#login'];

        // Guard check
        if (route.guard) {
            const currentRole = Utils.decodeRole();
            if (!currentRole || currentRole !== route.guard) {
                Utils.showToast('Access denied. Please login.', 'error');
                window.location.hash = '#login';
                return;
            }
        }

        // Transition: Slide out current screen
        const app = document.getElementById('app');
        const currentScreen = app.querySelector('.screen');
        if (currentScreen) {
            currentScreen.classList.add('slide-out');
            await new Promise(r => setTimeout(r, 300));
        }

        // Fetch and inject HTML
        try {
            const response = await fetch(route.file);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();

            app.innerHTML = `<div class="screen slide-in">${html}</div>`;

            // Initialize screen logic
            if (route.init && typeof route.init === 'function') {
                route.init();
            }
        } catch (e) {
            console.error('Routing error:', e);
            if (window.location.protocol === 'file:') {
                Utils.showToast('CORS error: Please run using "npx serve www"', 'error');
            } else {
                Utils.showToast('Error loading screen', 'error');
            }
        }
    },

    /**
     * Initializes the router and listens for hash changes
     */
    init() {
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });

        // Initial route
        const initialHash = window.location.hash || '#login';
        this.navigate(initialHash);
    }
};
