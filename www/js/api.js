/**
 * API Layer for AttendMS
 * Handles all network requests to the backend.
 */

const API_CONFIG = {
    REAL_API: false, // Set to true to use live backend
    BASE_URL: 'https://api.attendms.edu/v1'
};

/**
 * Mock API responses with artificial delay
 */
const Mocks = {
    login: (email, password) => {
        if (email === 'admin@test.com' && password === 'admin123') {
            return { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiQWRtaW4gVXNlciJ9.signature', role: 'admin', name: 'Admin User' };
        } else if (email === 'faculty@test.com' && password === 'faculty123') {
            return { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZmFjdWx0eSIsIm5hbWUiOiJEci4gU21pdGgifQ.signature', role: 'faculty', name: 'Dr. Smith' };
        } else if (email === 'student@test.com' && password === 'student123') {
            return { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3R1ZGVudCIsIm5hbWUiOiJKb2huIERvZSJ9.signature', role: 'student', name: 'John Doe' };
        }
        throw new Error('Invalid credentials');
    },
    getStudentDashboard: () => ({
        overallPercent: 72,
        subjects: [
            { name: 'Mathematics', attended: 15, held: 20, percent: 75 },
            { name: 'Physics', attended: 12, held: 20, percent: 60 },
            { name: 'Computer Science', attended: 18, held: 20, percent: 90 },
        ],
        notifications: [
            { id: 1, text: 'Shortage alert for Physics', date: '2026-04-01' },
            { id: 2, text: 'New timetable uploaded', date: '2026-03-25' },
        ],
        warnings: ['Physics attendance is below 75%']
    }),
    getAttendance: (month) => {
        const baseAttendance = [
            { name: 'Mathematics', held: 20, attended: 15, percent: 75 },
            { name: 'Physics', held: 20, attended: 12, percent: 60 },
            { name: 'Computer Science', held: 20, attended: 18, percent: 90 },
        ];

        // Simple variation based on month string
        const modifier = month ? month.split('-')[1] : '04';
        const offset = parseInt(modifier) || 0;

        return {
            subjects: baseAttendance.map(s => {
                const variation = (offset % 3) - 1; // -1, 0, or 1
                const attended = Math.max(0, Math.min(s.held, s.attended + variation));
                const percent = Math.round((attended / s.held) * 100);
                return { ...s, attended, percent };
            })
        };
    },
    submitLeave: (data) => ({ success: true, id: 'LV-' + Math.floor(Math.random() * 1000) }),
    getLeaveStatus: () => ({
        requests: [
            { id: 'LV-101', type: 'Medical', from: '2026-04-01', to: '2026-04-03', reason: 'Severe Flu', status: 'Approved', comment: 'Medical certificate verified' },
            { id: 'LV-102', type: 'Personal', from: '2026-04-10', to: '2026-04-11', reason: 'Family function', status: 'Pending', comment: '' },
        ]
    }),
    getFacultyDashboard: () => ({
        schedule: [
            { time: '09:00 AM', subject: 'Physics', room: 'Lab 1' },
            { time: '11:00 AM', subject: 'Applied Math', room: 'Room 204' },
        ],
        pendingLeaveCount: 5
    }),
    getStudentList: (subject) => ({
        students: [
            { id: 'S101', name: 'Alice Johnson', roll: '2021CS01' },
            { id: 'S102', name: 'Bob Smith', roll: '2021CS02' },
            { id: 'S103', name: 'Charlie Brown', roll: '2021CS03' },
        ]
    }),
    markAttendance: (data) => ({ success: true }),
    getLeaveRequests: () => ({
        requests: [
            { id: 'LV-102', studentName: 'John Doe', from: '2026-04-10', to: '2026-04-11', type: 'Personal', reason: 'Family function' },
        ]
    }),
    approveLeave: (id, status, comment) => ({ success: true }),
    getAdminStats: () => ({
        totalStudents: 1200,
        totalFaculty: 85,
        todayPercent: 88,
        belowThreshold: 142
    }),
    getUsers: (role) => {
        const users = role === 'student'
            ? [{ id: 'S1', name: 'Alice', email: 'alice@test.com', status: 'Active' }]
            : [{ id: 'F1', name: 'Dr. Smith', email: 'smith@test.com', status: 'Active' }];
        return { users };
    },
    saveUser: (data) => ({ success: true }),
    deleteUser: (id) => ({ success: true }),
    saveSettings: (data) => ({ success: true }),
    getSettings: () => ({
        minPercent: 75,
        alertsEnabled: true,
        academicYear: '2025-2026'
    })
};

/**
 * Main API Interface
 */
const API = {
    async _request(endpoint, method = 'GET', body = null) {
        if (!API_CONFIG.REAL_API) {
            // Artificial delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Map endpoint to mock functions
            const map = {
                '/auth/login': () => Mocks.login(body.email, body.password),
                '/student/dashboard': () => Mocks.getStudentDashboard(),
                '/student/attendance': () => Mocks.getAttendance(this._getQueryParam('month')),
                '/student/leave/submit': () => Mocks.submitLeave(body),
                '/student/leave/status': () => Mocks.getLeaveStatus(),
                '/faculty/dashboard': () => Mocks.getFacultyDashboard(),
                '/faculty/students': () => Mocks.getStudentList(this._getQueryParam('subject')),
                '/faculty/attendance/mark': () => Mocks.markAttendance(body),
                '/faculty/leave/requests': () => Mocks.getLeaveRequests(),
                '/faculty/leave/approve': () => Mocks.approveLeave(body.id, body.status, body.comment),
                '/admin/stats': () => Mocks.getAdminStats(),
                '/admin/users': () => Mocks.getUsers(this._getQueryParam('role')),
                '/admin/user/save': () => Mocks.saveUser(body),
                '/admin/user/delete': () => Mocks.deleteUser(body.id),
                '/admin/settings/save': () => Mocks.saveSettings(body),
                '/admin/settings/get': () => Mocks.getSettings(),
            };

            if (map[endpoint]) return map[endpoint]();
            throw new Error('Endpoint not found in mocks');
        }

        // Real API implementation
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const token = Utils.getToken();
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    _getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Public methods
    async login(email, password) { return this._request('/auth/login', 'POST', { email, password }); },
    async getStudentDashboard() { return this._request('/student/dashboard'); },
    async getAttendance(month) { return this._request('/student/attendance'); },
    async submitLeave(data) { return this._request('/student/leave/submit', 'POST', data); },
    async getLeaveStatus() { return this._request('/student/leave/status'); },
    async getFacultyDashboard() { return this._request('/faculty/dashboard'); },
    async getStudentList(subject) { return this._request('/faculty/students'); },
    async markAttendance(data) { return this._request('/faculty/attendance/mark', 'POST', data); },
    async getLeaveRequests() { return this._request('/faculty/leave/requests'); },
    async approveLeave(id, status, comment) { return this._request('/faculty/leave/approve', 'POST', { id, status, comment }); },
    async getAdminStats() { return this._request('/admin/stats'); },
    async getUsers(role) { return this._request('/admin/users'); },
    async saveUser(data) { return this._request('/admin/user/save', 'POST', data); },
    async deleteUser(id) { return this._request('/admin/user/delete', 'POST', { id }); },
    async saveSettings(data) { return this._request('/admin/settings/save', 'POST', data); },
    async getSettings() { return this._request('/admin/settings/get'); }
};
