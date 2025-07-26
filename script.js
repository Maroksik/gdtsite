// Конфігурація
const CONFIG = {
    starCount: 100,
    validCredentials: {
        'admin': '120521',

    },
    defaultLinks: [
        { name: 'GitHub', url: 'https://github.com', icon: '📂' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '❓' },
        { name: 'CodePen', url: 'https://codepen.io', icon: '✏️' },
        { name: 'Netlify', url: 'https://netlify.com', icon: '🚀' }
    ],
    defaultTeam: [
        { name: 'Адміністратор', role: 'Team Lead', email: 'admin@gdt.team', github: 'admin' }
    ]
};

// Зберігання даних
const DataStore = {
    getQuickLinks: () => JSON.parse(localStorage.getItem('gdtQuickLinks') || JSON.stringify(CONFIG.defaultLinks)),
    setQuickLinks: (links) => localStorage.setItem('gdtQuickLinks', JSON.stringify(links)),
    
    getRepositories: () => JSON.parse(localStorage.getItem('gdtRepositories') || '[]'),
    setRepositories: (repos) => localStorage.setItem('gdtRepositories', JSON.stringify(repos)),
    
    getTeamMembers: () => JSON.parse(localStorage.getItem('gdtTeamMembers') || JSON.stringify(CONFIG.defaultTeam)),
    setTeamMembers: (members) => localStorage.setItem('gdtTeamMembers', JSON.stringify(members))
};

// Створення зірок для фону
function createStars() {
    const starsContainer = document.getElementById('stars');
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

// Система авторизації
function login(username, password) {
    return CONFIG.validCredentials[username] === password;
}

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('gdtLoggedIn');
    if (isLoggedIn === 'true') {
        showMainContent();
    }
}

function showMainContent() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadAllData();
}

function logout() {
    sessionStorage.removeItem('gdtLoggedIn');
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').reset();
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}

// Анімація помилки входу
function showLoginError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const loginBox = document.querySelector('.login-box');
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    loginBox.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        loginBox.style.animation = 'slideIn 0.8s ease-out';
    }, 500);
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
        document.getElementById('errorMessage').style.display = 'none';
    } else {
        showLoginError('Невірний логін або пароль!');
    }
}

// Швидкі посилання
function loadQuickLinks() {
    const links = DataStore.getQuickLinks();
    const container = document.getElementById('quickLinksGrid');
    
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

// Репозиторії
function loadRepositories() {
    const repos = DataStore.getRepositories();
    const container = document.getElementById('repositoriesList');
    
    if (repos.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Немає доданих репозиторіїв</p>';
        return;
    }
    
    container.innerHTML = repos.map(repo => `
        <div class="repo-item">
            <div class="repo-info">
                <a href="https://github.com/${repo.name}" target="_blank">${repo.name}</a>
                <small>Додано: ${new Date(repo.added).toLocaleDateString('uk-UA')}</small>
            </div>
            <div class="repo-actions">
                <button class="repo-btn" onclick="openRepo('${repo.name}')">Відкрити</button>
                <button class="repo-btn" onclick="copyRepoUrl('${repo.name}')">Копіювати</button>
                <button class="repo-btn danger" onclick="deleteRepo('${repo.name}')">Видалити</button>
            </div>
        </div>
    `).join('');
}

function addRepository() {
    const input = document.getElementById('repoInput');
    const repoName = input.value.trim();
    
    if (!repoName) {
        alert('Введіть назву репозиторію у форматі username/repository');
        return;
    }
    
    if (!repoName.includes('/')) {
        alert('Назва має бути у форматі username/repository');
        return;
    }
    
    const repos = DataStore.getRepositories();
    
    if (repos.some(repo => repo.name === repoName)) {
        alert('Цей репозиторій вже додано');
        return;
    }
    
    repos.push({
        name: repoName,
        added: new Date().toISOString()
    });
    
    DataStore.setRepositories(repos);
    loadRepositories();
    input.value = '';
}

function openRepo(repoName) {
    window.open(`https://github.com/${repoName}`, '_blank');
}

function copyRepoUrl(repoName) {
    const url = `https://github.com/${repoName}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('URL скопійовано в буфер обміну');
    });
}

function deleteRepo(repoName) {
    if (confirm(`Видалити репозиторій "${repoName}"?`)) {
        const repos = DataStore.getRepositories().filter(repo => repo.name !== repoName);
        DataStore.setRepositories(repos);
        loadRepositories();
    }
}

// Команда




// Модальні вікна
function openLinksManager() {
    document.getElementById('linksModal').style.display = 'block';
}

function openTeamManager() {
    document.getElementById('teamModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('linksModal').style.display = 'none';
    document.getElementById('teamModal').style.display = 'none';
    clearModalInputs();
}

function clearModalInputs() {
    ['linkName', 'linkUrl', 'linkIcon', 'memberName', 'memberRole', 'memberEmail', 'memberGithub']
        .forEach(id => {
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
    links.push({ name, url, icon });
    DataStore.setQuickLinks(links);
    loadQuickLinks();
    closeModal();
}

function saveMember() {
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const github = document.getElementById('memberGithub').value.trim();
    
    if (!name || !role || !email || !github) {
        alert('Заповніть всі поля');
        return;
    }
    
    const members = DataStore.getTeamMembers();
    members.push({ name, role, email, github });
    DataStore.setTeamMembers(members);
    loadTeamMembers();
    closeModal();
}

// Налаштування
function exportData() {
    const data = {
        quickLinks: DataStore.getQuickLinks(),
        repositories: DataStore.getRepositories(),
        teamMembers: DataStore.getTeamMembers(),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdt-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.quickLinks) DataStore.setQuickLinks(data.quickLinks);
                if (data.repositories) DataStore.setRepositories(data.repositories);
                if (data.teamMembers) DataStore.setTeamMembers(data.teamMembers);
                
                loadAllData();
                alert('Дані успішно імпортовано');
            } catch (error) {
                alert('Помилка при імпорті файлу');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function resetData() {
    if (confirm('Ви впевнені? Це видалить всі збережені дані.')) {
        localStorage.removeItem('gdtQuickLinks');
        localStorage.removeItem('gdtRepositories');
        localStorage.removeItem('gdtTeamMembers');
        loadAllData();
        alert('Дані скинуто');
    }
}

// Завантаження всіх даних
function loadAllData() {
    loadQuickLinks();
    loadRepositories();
    loadTeamMembers();
}

// Закриття модальних вікон по кліку поза ними
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

// Ініціалізація
function init() {
    createStars();
    checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const usernameField = document.getElementById('username');
    if (usernameField && document.getElementById('loginContainer').style.display !== 'none') {
        usernameField.focus();
    }
}

// Додати цей код в кінець вашого основного script.js файлу

// Функція для показу екрану аналітики
function showAnalytics() {
    // Приховати основний контент
    document.getElementById('mainContent').style.display = 'none';
    
    // Створити екран аналітики
    createAnalyticsScreen();
}

// Повернення на головну сторінку з аналітики
function returnToMainSite() {
    const analyticsScreen = document.getElementById('analyticsScreen');
    if (analyticsScreen) {
        analyticsScreen.remove();
    }
    document.getElementById('mainContent').style.display = 'block';
}

// Створення екрану аналітики
function createAnalyticsScreen() {
    // Перевірка, чи вже існує екран аналітики
    if (document.getElementById('analyticsScreen')) {
        return;
    }

    const analyticsHTML = `
        <div id="analyticsScreen" class="analytics-screen">
            <!-- Завантаження CSS для аналітики -->
            <link rel="stylesheet" href="analytics.css">
            
            <div class="main-content">
                <div class="header">
                    <button class="back-btn" onclick="returnToMainSite()">← Назад</button>
                    <h1>📊 Аналітика пилок</h1>
                    <p>Детальний моніторинг прохідності проектів та статистика</p>
                </div>

                <!-- Загальна статистика -->
                <div class="analytics-overview">
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <div class="stat-number" id="totalProjects">0</div>
                            <div class="stat-label">Всього проектів</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⚪</div>
                        <div class="stat-info">
                            <div class="stat-number" id="whitePassRate">0%</div>
                            <div class="stat-label">Прохідність білої</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⚫</div>
                        <div class="stat-info">
                            <div class="stat-number" id="grayPassRate">0%</div>
                            <div class="stat-label">Прохідність сірої</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-number" id="avgLifespan">0</div>
                            <div class="stat-label">Середнє життя (днів)</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">❌</div>
                        <div class="stat-info">
                            <div class="stat-number" id="totalBans">0</div>
                            <div class="stat-label">Всього банів</div>
                        </div>
                    </div>
                </div>

                <!-- Графіки -->
                <div class="charts-section">
                    <div class="chart-container">
                        <h3>📊 Прохідність по етапах</h3>
                        <canvas id="passRateChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>📈 Динаміка проектів по часу</h3>
                        <canvas id="timelineChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>🥧 Статуси проектів</h3>
                        <canvas id="statusChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>⏰ Тривалість життя проектів</h3>
                        <canvas id="lifespanChart"></canvas>
                    </div>
                </div>

                <!-- Панель управління -->
                <div class="control-panel">
                    <div class="filters-section">
                        <h3>🔍 Фільтри</h3>
                        <div class="filter-group">
                            <label for="dateFrom">Від дати:</label>
                            <input type="date" id="dateFrom" class="filter-input">
                        </div>
                        <div class="filter-group">
                            <label for="dateTo">До дати:</label>
                            <input type="date" id="dateTo" class="filter-input">
                        </div>
                        <div class="filter-group">
                            <label for="statusFilter">Статус:</label>
                            <select id="statusFilter" class="filter-input">
                                <option value="all">Всі</option>
                                <option value="active">Активні</option>
                                <option value="banned">Забанені</option>
                                <option value="passed">Пройшли</option>
                            </select>
                        </div>
                        <button class="filter-btn" onclick="analyticsApp.applyFilters()">Застосувати</button>
                        <button class="reset-btn" onclick="analyticsApp.resetFilters()">Скинути</button>
                    </div>
                    
                    <div class="actions-section">
                        <button class="add-project-btn" onclick="analyticsApp.openAddProjectModal()">
                            ➕ Додати проект
                        </button>
                        <button class="export-btn" onclick="analyticsApp.exportAnalytics()">
                            📤 Експорт
                        </button>
                    </div>
                </div>

                <!-- Список проектів -->
                <div class="projects-section">
                    <div class="section-header">
                        <h3>📋 Проекти</h3>
                        <div class="view-toggle">
                            <button class="toggle-btn active" onclick="analyticsApp.setView('grid')" data-view="grid">🔳</button>
                            <button class="toggle-btn" onclick="analyticsApp.setView('list')" data-view="list">📋</button>
                        </div>
                    </div>
                    <div class="projects-grid" id="projectsGrid">
                        <!-- Проекти будуть додані тут через JavaScript -->
                    </div>
                </div>
            </div>

            <!-- Модальне вікно додавання проекту -->
            <div id="projectModal" class="modal">
                <div class="modal-content">
                    <h3 id="modalTitle">➕ Новий проект</h3>
                    <div class="modal-form">
                        <input type="text" id="projectName" placeholder="Назва проекту" class="modal-input" required>
                        <textarea id="projectDescription" placeholder="Опис проекту (необов'язково)" class="modal-input" rows="3"></textarea>
                        <input type="url" id="projectUrl" placeholder="URL проекту (необов'язково)" class="modal-input">
                        
                        <div class="form-group">
                            <label>Дата створення:</label>
                            <input type="date" id="projectCreatedDate" class="modal-input" required>
                        </div>
                        
                        <div class="modal-buttons">
                            <button onclick="analyticsApp.saveProject()" class="save-btn">Зберегти</button>
                            <button onclick="analyticsApp.closeProjectModal()" class="cancel-btn">Скасувати</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Модальне вікно деталей проекту -->
            <div id="projectDetailsModal" class="modal">
                <div class="modal-content large">
                    <h3 id="detailsTitle">📊 Деталі проекту</h3>
                    <div id="projectDetailsContent">
                        <!-- Контент буде заповнений через JavaScript -->
                    </div>
                    <div class="modal-buttons">
                        <button onclick="analyticsApp.closeDetailsModal()" class="cancel-btn">Закрити</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', analyticsHTML);
    
    // Завантаження скриптів для аналітики
    loadAnalyticsScripts().then(() => {
        // Ініціалізація аналітики після завантаження скриптів
        if (window.analyticsApp) {
            window.analyticsApp.initialize();
        }
    });
}

// Завантаження скриптів для аналітики
function loadAnalyticsScripts() {
    return new Promise((resolve) => {
        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
            'analytics-data.js',
            'analytics-charts.js',
            'analytics.js'
        ];
        
        let loadedCount = 0;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    resolve();
                }
            };
            script.onerror = () => {
                console.warn(`Не вдалося завантажити скрипт: ${src}`);
                loadedCount++;
                if (loadedCount === scripts.length) {
                    resolve();
                }
            };
            document.head.appendChild(script);
        });
    });
}

// Додавання CSS для аналітики динамічно
function loadAnalyticsCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'analytics.css';
    document.head.appendChild(link);
}

// Додати функції до глобальних функцій
window.showAnalytics = showAnalytics;
window.returnToMainSite = returnToMainSite;

// Запуск
document.addEventListener('DOMContentLoaded', init);

// Глобальні функції
window.addRepository = addRepository;
window.deleteQuickLink = deleteQuickLink;
window.openRepo = openRepo;
window.copyRepoUrl = copyRepoUrl;
window.deleteRepo = deleteRepo;
window.deleteMember = deleteMember;
window.openLinksManager = openLinksManager;
window.openTeamManager = openTeamManager;
window.closeModal = closeModal;
window.saveLink = saveLink;
window.saveMember = saveMember;
window.exportData = exportData;
window.importData = importData;
window.resetData = resetData;
window.logout = logout;