// Глобальні змінні для керування станом
let currentScreen = 'login'; // 'login', 'main', 'analytics'
let analyticsInitialized = false;

// Конфігурація
const CONFIG = {
    starCount: 100,
    validCredentials: {
        'admin': '120521',
    }
};

// Зберігання даних
const DataStore = {
    getQuickLinks: () => JSON.parse(localStorage.getItem('gdtQuickLinks') || '[]'),
    setQuickLinks: (links) => localStorage.setItem('gdtQuickLinks', JSON.stringify(links))
};

// Створення зірок для фону
function createStars(containerId = 'stars') {
    const starsContainer = document.getElementById(containerId);
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    const numStars = CONFIG.starCount;

    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        starsContainer.appendChild(star);
    }
}

// Функції переходу між екранами
function showScreen(screenName) {
    console.log(`Перехід до екрану: ${screenName}`);
    
    // Приховати всі екрани
    const screens = ['loginContainer', 'mainContent', 'analyticsScreen'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Показати потрібний екран
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.style.display = screenName === 'loginContainer' ? 'flex' : 'block';
        currentScreen = screenName.replace('Container', '').replace('Screen', '');
        
        // Прокрутити до початку сторінки
        window.scrollTo(0, 0);
        
        console.log(`Активний екран: ${currentScreen}`);
    } else {
        console.error(`Екран ${screenName} не знайдено`);
    }
}

// Система авторизації
function login(username, password) {
    return CONFIG.validCredentials[username] === password;
}

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('gdtLoggedIn');
    if (isLoggedIn === 'true') {
        showMainContent();
    } else {
        showScreen('loginContainer');
    }
}

function showMainContent() {
    showScreen('mainContent');
    loadQuickLinks();
}

function logout() {
    console.log('Вихід з системи');
    sessionStorage.removeItem('gdtLoggedIn');
    showScreen('loginContainer');
    document.getElementById('loginForm').reset();
    
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
    currentScreen = 'login';
    analyticsInitialized = false;
}

// Показати екран аналітики
function showAnalytics() {
    console.log('Перехід до аналітики...');
    showScreen('analyticsScreen');
    
    // Створити зірки для аналітики
    createStars('analyticsStars');
    
    // Ініціалізувати аналітику, якщо ще не ініціалізована
    if (!analyticsInitialized) {
        setTimeout(() => {
            initializeAnalytics();
            analyticsInitialized = true;
        }, 100);
    } else {
        // Якщо вже ініціалізована, просто оновити дані
        if (window.analyticsApp) {
            window.analyticsApp.loadData();
        }
    }
}

// Повернення на головну сторінку
function returnToMain() {
    console.log('Повернення на головну...');
    showScreen('mainContent');
}

// Ініціалізація аналітики
function initializeAnalytics() {
    console.log('Ініціалізація аналітики...');
    
    // Перевірити, чи завантажений Chart.js
    if (typeof Chart === 'undefined') {
        console.error('Chart.js не завантажено!');
        return;
    }

    try {
        // Ініціалізувати менеджери даних та графіків
        if (typeof AnalyticsDataManager !== 'undefined') {
            window.analyticsDataManager = new AnalyticsDataManager();
            console.log('AnalyticsDataManager ініціалізовано');
        }
        
        if (typeof AnalyticsChartsManager !== 'undefined') {
            window.analyticsChartsManager = new AnalyticsChartsManager();
            window.analyticsChartsManager.initializeCharts();
            window.analyticsChartsManager.setupResponsive();
            console.log('AnalyticsChartsManager ініціалізовано');
        }

        // Ініціалізувати додаток аналітики
        if (typeof AnalyticsApp !== 'undefined') {
            window.analyticsApp = new AnalyticsApp();
            window.analyticsApp.initialize();
            console.log('AnalyticsApp ініціалізовано');
        }
        
        console.log('Аналітика успішно ініціалізована');
    } catch (error) {
        console.error('Помилка ініціалізації аналітики:', error);
    }
}

// Обробка форми входу
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showLoginError('Будь ласка, заповніть всі поля!');
        return;
    }

    if (login(username, password)) {
        sessionStorage.setItem('gdtLoggedIn', 'true');
        showMainContent();
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    } else {
        showLoginError('Невірний логін або пароль!');
    }
}

function showLoginError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const loginBox = document.querySelector('.login-box');
    
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    if (loginBox) {
        loginBox.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginBox.style.animation = 'slideIn 0.8s ease-out';
        }, 500);
    }
}

// Швидкі посилання
function loadQuickLinks() {
    const links = DataStore.getQuickLinks();
    const container = document.getElementById('quickLinksGrid');
    
    if (!container) return;
    
    if (links.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #888;">
                <p>Немає збережених посилань</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = links.map(link => `
        <a href="${link.url}" target="_blank" class="quick-link">
            <span class="quick-link-icon">${link.icon}</span>
            <span class="quick-link-name">${link.name}</span>
            <button class="delete-btn" onclick="deleteQuickLink('${link.name}', event)">×</button>
        </a>
    `).join('');
}

function deleteQuickLink(name, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm(`Видалити посилання "${name}"?`)) {
        const links = DataStore.getQuickLinks().filter(link => link.name !== name);
        DataStore.setQuickLinks(links);
        loadQuickLinks();
    }
}

// Модальні вікна
function openLinksManager() {
    const modal = document.getElementById('linksModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Очистити поля форми
    ['linkName', 'linkUrl', 'linkIcon'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
}

function saveLink() {
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const icon = document.getElementById('linkIcon').value.trim() || '🔗';
    
    if (!name || !url) {
        alert('Заповніть назву та URL');
        return;
    }
    
    const links = DataStore.getQuickLinks();
    
    // Перевірити, чи не існує вже таке посилання
    if (links.some(link => link.name === name)) {
        alert('Посилання з такою назвою вже існує');
        return;
    }
    
    links.push({ name, url, icon });
    DataStore.setQuickLinks(links);
    loadQuickLinks();
    closeModal();
    
    console.log('Додано посилання:', { name, url, icon });
}

// Ініціалізація
function init() {
    console.log('Ініціалізація додатка...');
    
    // Створити зірки для головної сторінки
    createStars('stars');
    
    // Перевірити авторизацію
    checkAuth();
    
    // Додати обробник форми входу
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Фокус на поле логіну
    const usernameField = document.getElementById('username');
    if (usernameField && currentScreen === 'login') {
        usernameField.focus();
    }

    // Закриття модальних вікон по кліку поза ними
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });

    // Обробка клавіші Escape для закриття модальних вікон
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    console.log('Додаток ініціалізовано');
}

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', init);

// Глобальні функції для викликів з HTML
window.showAnalytics = showAnalytics;
window.returnToMain = returnToMain;
window.logout = logout;
window.deleteQuickLink = deleteQuickLink;
window.openLinksManager = openLinksManager;
window.closeModal = closeModal;
window.saveLink = saveLink;

// Функції для аналітики (будуть використовуватися коли аналітика ініціалізована)
window.openAddProjectModal = () => {
    if (window.analyticsApp && window.analyticsApp.openAddProjectModal) {
        window.analyticsApp.openAddProjectModal();
    } else {
        console.warn('Analytics app not initialized');
    }
};

window.closeProjectModal = () => {
    if (window.analyticsApp && window.analyticsApp.closeProjectModal) {
        window.analyticsApp.closeProjectModal();
    }
};

window.saveProject = () => {
    if (window.analyticsApp && window.analyticsApp.saveProject) {
        window.analyticsApp.saveProject();
    }
};

window.applyFilters = () => {
    if (window.analyticsApp && window.analyticsApp.applyFilters) {
        window.analyticsApp.applyFilters();
    }
};

window.resetFilters = () => {
    if (window.analyticsApp && window.analyticsApp.resetFilters) {
        window.analyticsApp.resetFilters();
    }
};

window.setView = (view) => {
    if (window.analyticsApp && window.analyticsApp.setView) {
        window.analyticsApp.setView(view);
    }
};

window.exportAnalytics = () => {
    if (window.analyticsApp && window.analyticsApp.exportAnalytics) {
        window.analyticsApp.exportAnalytics();
    }
};

window.closeDetailsModal = () => {
    if (window.analyticsApp && window.analyticsApp.closeDetailsModal) {
        window.analyticsApp.closeDetailsModal();
    }
};

console.log('Navigation script loaded successfully');