// js/user-auth.js

class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
        this.init();
    }

    init() {
        this.updateAuthUI();
        this.attachEventListeners();
    }

    saveSession(user) {
        this.currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        this.updateAuthUI();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        this.updateAuthUI();
        alert('You have been successfully logged out.');
        window.location.href = 'index.html';
    }

    register(name, email, password) {
        // Simple mock registration storage
        const users = JSON.parse(localStorage.getItem('registered_users')) || [];
        const existing = users.find(u => u.email === email);

        if (existing) {
            alert('An account with this email already exists.');
            return false;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(users));

        // Auto login after registration
        this.saveSession({ name, email });
        alert(`Welcome, ${name}! Your account has been created.`);
        window.location.href = 'index.html';
        return true;
    }

    login(email, password) {
        const users = JSON.parse(localStorage.getItem('registered_users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert('Invalid email or password.');
            return false;
        }

        this.saveSession({ name: user.name, email: user.email });
        alert(`Welcome back, ${user.name}!`);
        window.location.href = 'index.html';
        return true;
    }

    updateAuthUI() {
        const loginNavItems = document.querySelectorAll('.auth-guest-only');
        const logoutNavItems = document.querySelectorAll('.auth-user-only');
        const userNameElements = document.querySelectorAll('.user-profile-name');

        if (this.currentUser) {
            loginNavItems.forEach(el => el.style.display = 'none');
            logoutNavItems.forEach(el => el.style.display = 'block');
            userNameElements.forEach(el => el.textContent = this.currentUser.name);
        } else {
            loginNavItems.forEach(el => el.style.display = 'block');
            logoutNavItems.forEach(el => el.style.display = 'none');
        }
    }

    attachEventListeners() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const pass = document.getElementById('login-password').value.trim();
                this.login(email, pass);
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const pass = document.getElementById('reg-password').value.trim();
                this.register(name, email, pass);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
}

// Global instance
const auth = new AuthManager();
