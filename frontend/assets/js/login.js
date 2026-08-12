document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const studentIdInput = document.getElementById('studentId');
    const phoneInput = document.getElementById('phone');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const loader = loginBtn.querySelector('.loader');
    const apiBase = window.location.protocol === 'http:' && window.location.hostname === 'localhost' ? 'http://localhost:5002/api' : '/api';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();
        const studentId = studentIdInput.value.trim();
        const phone = phoneInput.value.trim();
        let valid = true;
        if (!studentId) { showError('studentIdError', 'Student ID দিন।'); valid = false; }
        if (!phone || phone.replace(/\D/g, '').length < 10) { showError('phoneError', 'সঠিক registered phone number দিন।'); valid = false; }
        if (!valid) return;

        loginBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        try {
            const response = await fetch(`${apiBase}/student-portal/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, phone })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Login failed');
            sessionStorage.setItem('studentPortalToken', data.token);
            sessionStorage.setItem('studentPortalStudent', JSON.stringify(data.student));
            window.location.href = 'student-dashboard.html';
        } catch (error) {
            showError('phoneError', error.message || 'Login করা যায়নি। আবার চেষ্টা করুন।');
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            loader.style.display = 'none';
        }
    });
    function showError(id, message) { document.getElementById(id).textContent = message; }
    function clearErrors() { document.querySelectorAll('.error-msg').forEach(el => el.textContent = ''); }
});
