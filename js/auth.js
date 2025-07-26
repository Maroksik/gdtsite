// Система авторизації
class AuthManager {
    constructor() {
        this.validCredentials = {
            'admin': '120521'
        };
        this.sessionKey = 'gdtLoggedIn';
    }

    // Перевірка облікових даних
    login(username, password) {
        return this.validCredentials[username] === password;
    }

    // Збереження сесії
    saveSession() {
        sessionStorage.setItem(this.sessionKey, 'true');
    }

    // Перевірка активної сесії
    isLoggedIn() {
        return sessionStorage.getItem(this.sessionKey) === 'true';
    }

    // Видалення сесії
    logout() {
        sessionStorage.removeItem(this.sessionKey);
    }
}

// Глобальний екземпляр менеджера авторизації
const authManager = new AuthManager();

// Функції авторизації
function checkAuth() {
    if (authManager.isLoggedIn()) {
        showMainContent();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    
    // Фокус на поле логіну
    setTimeout(() => {
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.focus();
        }
    }, 100);
}

function showMainContent() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Завантажуємо дані після входу
    if (window.loadData) {
        window.loadData();
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showLoginError('Будь ласка, заповніть всі поля!');
        return;
    }

    if (authManager.login(username, password)) {
        authManager.saveSession();
        showMainContent();
        hideLoginError();
        console.log('Успішний вхід користувача:', username);
    } else {
        showLoginError('Невірний логін або пароль!');
        console.warn('Невдала спроба входу:', username);
    }
}

function logout() {
    authManager.logout();
    showLoginScreen();
    
    // Очищення форми
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
    
    hideLoginError();
    console.log('Користувач вийшов з системи');
}

function showLoginError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const loginBox = document.querySelector('.login-box');
    
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // Анімація струсування
    if (loginBox) {
        loginBox.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginBox.style.animation = 'slideIn 0.8s ease-out';
        }, 500);
    }
}

function hideLoginError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Ініціалізація авторизації
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Перевірка авторизації при завантаженні
    checkAuth();
}

// Глобальні функції для HTML
window.logout = logout;
window.checkAuth = checkAuth;