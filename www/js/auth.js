/**
 * Authentication Logic for AttendMS
 */
const Auth = {
    /**
     * Handles the login process
     * @param {Object} credentials - Email and password
     * @param {boolean} rememberMe - Whether to persist token in localStorage
     */
    async login(credentials, rememberMe) {
        try {
            const result = await API.login(credentials.email, credentials.password);

            if (rememberMe) {
                localStorage.setItem('attendms_token', result.token);
            } else {
                sessionStorage.setItem('attendms_token', result.token);
            }

            // Route based on role
            const role = result.role;
            if (role === 'student') {
                await Router.navigate('#student-dashboard');
            } else if (role === 'faculty') {
                await Router.navigate('#faculty-dashboard');
            } else if (role === 'admin') {
                await Router.navigate('#admin-dashboard');
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Logs out the user and clears tokens
     */
    logout() {
        localStorage.removeItem('attendms_token');
        sessionStorage.removeItem('attendms_token');
        Router.navigate('#login');
    }
};

/**
 * Login Screen Initialization
 */
function initLogin() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePass = document.getElementById('toggle-password');
    const loginBtn = document.getElementById('login-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const rememberMe = document.getElementById('remember-me');
    const formContainer = document.getElementById('login-form-container');

    if (!form) return;

    // Toggle password visibility
    togglePass.onclick = () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePass.textContent = type === 'password' ? '👁' : '🙈';
    };

    // Forgot password modal
    document.getElementById('forgot-password-link').onclick = (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-modal').style.display = 'flex';
    };

    document.getElementById('close-reset-modal').onclick = () => {
        document.getElementById('forgot-password-modal').style.display = 'none';
    };

    document.getElementById('submit-reset').onclick = async () => {
        const email = document.getElementById('reset-email').value;
        if (!email) {
            document.getElementById('reset-email-error').textContent = 'Email is required';
            return;
        }
        Utils.showToast('Reset link sent to your email', 'success');
        document.getElementById('forgot-password-modal').style.display = 'none';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        document.getElementById('email-error').textContent = '';
        document.getElementById('password-error').textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic validation
        let isValid = true;
        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'Invalid email format';
            isValid = false;
        }

        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required';
            isValid = false;
        }

        if (!isValid) return;

        // Loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        const result = await Auth.login({ email, password }, rememberMe.checked);

        if (result.success) {
            Utils.showToast('Login successful', 'success');
        } else {
            formContainer.classList.add('shake');
            setTimeout(() => formContainer.classList.remove('shake'), 400);
            document.getElementById('password-error').textContent = 'Invalid email or password';
            Utils.showToast('Login failed: ' + result.message, 'error');
        }

        loginBtn.disabled = false;
        btnText.style.display = 'block';
        btnSpinner.style.display = 'none';
    };
}
