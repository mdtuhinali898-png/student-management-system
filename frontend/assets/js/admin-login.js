// Admin Login JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('adminLoginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const loader = loginBtn.querySelector('.loader');
    
    // Default admin credentials (in production, use environment variables)
    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: '123456'
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        let valid = true;
        
        if (!username) {
            showError('usernameError', 'Username দিন।');
            valid = false;
        }
        if (!password) {
            showError('passwordError', 'Password দিন।');
            valid = false;
        }
        
        if (!valid) return;

        loginBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Check credentials (client-side for demo, use backend API in production)
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                // Create admin session
                sessionStorage.setItem('adminToken', 'admin-session-token-' + Date.now());
                sessionStorage.setItem('adminUser', JSON.stringify({
                    username: username,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Invalid username or password');
            }
        } catch (error) {
            showError('passwordError', error.message || 'Login failed. Please try again.');
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            loader.style.display = 'none';
        }
    });

    function showError(id, message) {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearErrors() {
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    }
});