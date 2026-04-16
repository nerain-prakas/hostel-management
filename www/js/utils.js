/**
 * utility functions for AttendMS
 */
const Utils = {
    /**
     * Displays a toast notification
     * @param {string} message - The message to show
     * @param {string} type - 'success' | 'error' | 'info'
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Injects skeleton shimmer HTML into a container
     * @param {string} containerId - The ID of the element to show skeletons in
     */
    showSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create basic generic skeletons based on common patterns
        const skeletonHTML = `
            <div class="skeleton" style="height: 20px; width: 60%; margin-bottom: 15px;"></div>
            <div class="skeleton" style="height: 100px; width: 100%; margin-bottom: 15px;"></div>
            <div class="skeleton" style="height: 20px; width: 40%; margin-bottom: 15px;"></div>
            <div class="skeleton" style="height: 100px; width: 100%; margin-bottom: 15px;"></div>
        `;
        container.innerHTML = skeletonHTML;
    },

    /**
     * Removes skeleton loaders
     */
    hideSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
    },

    /**
     * Formats a date string to DD MMM YYYY
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    },

    /**
     * Reads auth token from localStorage/sessionStorage
     * @returns {string|null} Token or null
     */
    getToken() {
        return localStorage.getItem('attendms_token') || sessionStorage.getItem('attendms_token');
    },

    /**
     * Resolves role from stored login state
     * @returns {string|null} role
     */
    decodeRole() {
        const storedRole = localStorage.getItem('attendms_role') || sessionStorage.getItem('attendms_role');
        if (storedRole) {
            return storedRole;
        }

        // Backward compatibility: if an old JWT token is present, decode role from payload.
        const token = this.getToken();
        if (!token) return null;
        try {
            if (!token.includes('.')) {
                return null;
            }
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + c.charCodeAt(0).toString(16);
            }).join(''));
            return JSON.parse(jsonPayload).role;
        } catch (e) {
            console.error('Token decode error', e);
            return null;
        }
    },

    /**
     * Checks if device is online using cordova plugin
     * @returns {boolean}
     */
    isOnline() {
        if (navigator.connection) {
            return navigator.connection.type !== 'none';
        }
        return navigator.onLine;
    },

    /**
     * Shows the offline banner
     */
    showOfflineBanner() {
        if (document.getElementById('offline-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = 'position:fixed; top:0; left:0; right:0; background:var(--danger-color); color:white; text-align:center; padding:10px; z-index:10000; font-size:0.9rem;';
        banner.textContent = 'You are currently offline. Some features may be unavailable.';
        document.body.prepend(banner);
    },

    /**
     * Hides the offline banner
     */
    hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) banner.remove();
    }
};
