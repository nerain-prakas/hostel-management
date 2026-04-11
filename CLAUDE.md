# AttendMS - Project Guide

## Project Overview
AttendMS is a role-based Attendance Management System built as an Apache Cordova mobile application. It provides tailored experiences for Students, Faculty, and Administrators.

## Technical Architecture
- **Frontend:** Vanilla JS, HTML5, CSS3 (Custom Properties).
- **Routing:** Hash-based router with role-guards.
- **API:** Mock API layer with artificial latency and `REAL_API` toggle.
- **State:** JWT tokens stored in `localStorage` (Remember Me) or `sessionStorage`.

## Role Responsibilities
- **Student:** View overall/subject attendance, apply for leave, track leave status.
- **Faculty:** View daily schedule, mark attendance via student list, approve/reject leave requests.
- **Admin:** Monitor system stats, manage users (CRUD), configure global thresholds.

## Development Workflow
1. **Adding a Screen:**
   - Create `.html` file in `www/screens/`.
   - Add route definition in `router.js`.
   - Implement `init<ScreenName>()` function in `app.js`.
2. **API Changes:**
   - Update `Mocks` in `api.js` for testing.
   - Update `API` interface methods.

## Design System
- **Primary Color:** `#1A73E8` (Blue)
- **Success Color:** `#34A853` (Green)
- **Danger Color:** `#EA4335` (Red)
- **Transitions:** Slide-in/Slide-out screens.
- **Feedback:** Toasts and Skeleton Loaders.
