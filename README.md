# AttendMS - Attendance Management System

AttendMS is a professional mobile application for educational institutions to track student attendance and manage leave requests. Built with Apache Cordova, it provides a seamless experience across Android devices.

## 🚀 Features

### 🎓 Student Portal
- **Dashboard:** View overall attendance percentage and subject-wise progress.
- **Detailed Reports:** Monthly attendance breakdown.
- **Leave Management:** Digital leave application and status tracking.

### 👨‍🏫 Faculty Portal
- **Schedule:** Daily class timetable at a glance.
- **Attendance Marking:** Quick-toggle interface to mark students present/absent.
- **Leave Approvals:** Review and process student leave requests with remarks.

### ⚙️ Admin Console
- **System Insights:** Real-time statistics on attendance and shortage alerts.
- **User Management:** Comprehensive CRUD for students and faculty accounts.
- **Global Settings:** Configure attendance thresholds and academic years.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js & npm
- Apache Cordova CLI (`npm install -g cordova`)
- Android Studio & Android SDK

### Setup Steps
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add Android platform:
   ```bash
   cordova platform add android
   ```
4. Build and run on device:
   ```bash
   cordova run android
   ```

## 📂 Project Structure
- `www/css/`: Design system and role-specific styles.
- `www/js/`: Core logic (API, Router, Auth, App).
- `www/screens/`: Role-based HTML views.
- `www/img/`: App assets.
