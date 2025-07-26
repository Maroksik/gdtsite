// Основна логіка для екрану аналітики
class AnalyticsApp {
    constructor() {
        this.currentView = 'grid';
        this.currentFilters = {};
        this.isInitialized = false;
    }

    // Ініціалізація додатка
    initialize() {
        if (this.isInitialized) return;
        
        this.createStars();
        this.setupEventListeners();
        this.loadData();
        this.initializeCharts();
        this.setupDateInputs();
        
        this.isInitialized = true;
    }

    // Створення зірок для фону
    createStars() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;

        const numStars = 100;
        starsContainer.innerHTML = '';

        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 2 + 's';
            starsContainer.appendChild(star);
        }
    }

    // Налаштування обробників подій
    setupEventListeners() {
        // Закриття модальних вікон по кліку поза ними
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    this.closeModal();
                }
            });
        });

        // Обробка Enter в формі проекту
        const projectModal = document.getElementById('projectModal');
        if (projectModal) {
            projectModal.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.saveProject();
                }
            });
        }

        // Автозбереження фільтрів
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.autoApplyFilters();
            });
        });
    }

    // Налаштування полів дат
    setupDateInputs() {
        const today = new Date().toISOString().split('T')[0];
        const projectCreatedDate = document.getElementById('projectCreatedDate');
        
        if (projectCreatedDate) {
            projectCreatedDate.value = today;
        }
    }

    // Завантаження даних
    loadData() {
        this.updateStatistics();
        this.loadProjects();
        this.updateCharts();
    }

    // Ініціалізація графіків
    initializeCharts() {
        if (window.analyticsChartsManager) {
            window.analyticsChartsManager.initializeCharts();
            window.analyticsChartsManager.setupResponsive();
        }
    }

    // Оновлення статистики
    updateStatistics() {
        const projects = this.getFilteredProjects();
        const stats = window.analyticsDataManager.calculateStatistics(projects);

        // Оновлення елементів статистики
        this.updateStatElement('totalProjects', stats.totalProjects);
        this.updateStatElement('whitePassRate', `${stats.whitePassRate}%`);
        this.updateStatElement('grayPassRate', `${stats.grayPassRate}%`);
        this.updateStatElement('avgLifespan', stats.avgLifespan);
        this.updateStatElement('totalBans', stats.totalBans);
    }

    // Допоміжна функція для оновлення статистики
    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Оновлення графіків
    updateCharts() {
        if (window.analyticsChartsManager && window.analyticsDataManager) {
            const chartData = window.analyticsDataManager.getChartData();
            window.analyticsChartsManager.updateAllCharts(chartData);
        }
    }

    // Завантаження проектів
    loadProjects() {
        const projects = this.getFilteredProjects();
        const container = document.getElementById('projectsGrid');
        
        if (!container) return;

        if (projects.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        container.className = `projects-grid ${this.currentView === 'list' ? 'list-view' : ''}`;
        container.innerHTML = projects.map(project => this.createProjectHTML(project)).join('');
    }

    // HTML для пустого стану
    getEmptyStateHTML() {
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #888;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                <h3>Немає проектів для відображення</h3>
                <p>Додайте проекти або змініть фільтри</p>
            </div>
        `;
    }

    // Створення HTML для проекту
    createProjectHTML(project) {
        const lifespan = window.analyticsDataManager.calculateProjectLifespan(project);
        const createdDate = new Date(project.createdAt).toLocaleDateString('uk-UA');
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-title">${project.name}</div>
                        <div class="project-meta">
                            Створено: ${createdDate} | Життя: ${lifespan} днів
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="action-btn info" onclick="analyticsApp.showProjectDetails('${project.id}')" title="Деталі">📊</button>
                        <button class="action-btn" onclick="analyticsApp.editProject('${project.id}')" title="Редагувати">✏️</button>
                        <button class="action-btn danger" onclick="analyticsApp.deleteProject('${project.id}')" title="Видалити">🗑️</button>
                    </div>
                </div>
                ${project.description ? `<p style="color: #ccc; margin-bottom: 15px; font-size: 0.9rem;">${project.description}</p>` : ''}
                ${project.url ? `<a href="${project.url}" target="_blank" style="color: #00d4ff; font-size: 0.8rem; text-decoration: none;">🔗 ${project.url}</a>` : ''}
                <div class="project-statuses">
                    ${this.createStatusHTML(project, 'whitePassed')}
                    ${this.createStatusHTML(project, 'whiteBanned')}
                    ${this.createStatusHTML(project, 'grayPassed')}
                    ${this.createStatusHTML(project, 'grayBanned')}
                </div>
            </div>
        `;
    }

    // Створення HTML для статусу
    createStatusHTML(project, statusType) {
        const status = project.statuses[statusType];
        const isActive = status.enabled ? 'active' : '';
        const icons = {
            whitePassed: '⚪✅',
            whiteBanned: '⚪❌',
            grayPassed: '⚫✅',
            grayBanned: '⚫❌'
        };
        const labels = {
            whitePassed: 'Біла ✓',
            whiteBanned: 'Біла ✗',
            grayPassed: 'Сіра ✓',
            grayBanned: 'Сіра ✗'
        };
        
        return `
            <div class="status-item ${isActive}">
                <div class="status-info">
                    <input type="checkbox" class="status-checkbox" 
                           ${status.enabled ? 'checked' : ''} 
                           onchange="analyticsApp.handleStatusChange('${project.id}', '${statusType}', this)">
                    <span class="status-label">${icons[statusType]} ${labels[statusType]}</span>
                </div>
                <div class="status-controls">
                    ${status.enabled ? `
                        <input type="date" class="date-input" 
                               value="${status.date || ''}" 
                               onchange="analyticsApp.handleDateChange('${project.id}', '${statusType}', this)">
                    ` : `
                        <span class="status-date">—</span>
                    `}
                </div>
            </div>
        `;
    }

    // Отримання відфільтрованих проектів
    getFilteredProjects() {
        return window.analyticsDataManager.filterProjects(this.currentFilters);
    }

    // Модальні вікна
    openAddProjectModal() {
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('modalTitle');
        
        if (title) title.textContent = '➕ Новий проект';
        
        // Очищення форми
        this.clearProjectForm();
        
        // Встановлення поточної дати
        const dateInput = document.getElementById('projectCreatedDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        if (modal) modal.style.display = 'block';
    }

    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) modal.style.display = 'none';
        this.clearProjectForm();
    }

    closeModal() {
        this.closeProjectModal();
        this.closeDetailsModal();
    }

    clearProjectForm() {
        const inputs = ['projectName', 'projectDescription', 'projectUrl', 'projectCreatedDate'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    }

    // Збереження проекту
    saveProject() {
        const name = document.getElementById('projectName')?.value.trim();
        const description = document.getElementById('projectDescription')?.value.trim();
        const url = document.getElementById('projectUrl')?.value.trim();
        const createdDate = document.getElementById('projectCreatedDate')?.value;
        
        if (!name) {
            alert('Введіть назву проекту');
            return;
        }
        
        if (!createdDate) {
            alert('Оберіть дату створення');
            return;
        }
        
        const projectData = {
            name,
            description,
            url,
            createdAt: new Date(createdDate).toISOString()
        };
        
        window.analyticsDataManager.addProject(projectData);
        this.loadData();
        this.closeProjectModal();
    }

    // Видалення проекту
    deleteProject(projectId) {
        const project = window.analyticsDataManager.getProjects().find(p => p.id === projectId);
        if (!project) return;
        
        if (confirm(`Видалити проект "${project.name}"?`)) {
            window.analyticsDataManager.deleteProject(projectId);
            this.loadData();
        }
    }

    // Редагування проекту (заглушка)
    editProject(projectId) {
        alert('Функція редагування буде додана в наступній версії');
    }

    // Обробка зміни статусу
    handleStatusChange(projectId, statusType, checkbox) {
        const enabled = checkbox.checked;
        const date = enabled ? new Date().toISOString().split('T')[0] : null;
        
        window.analyticsDataManager.updateProjectStatus(projectId, statusType, enabled, date);
        this.loadData();
    }

    // Обробка зміни дати
    handleDateChange(projectId, statusType, input) {
        const projects = window.analyticsDataManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (project && project.statuses[statusType].enabled) {
            project.statuses[statusType].date = input.value;
            window.analyticsDataManager.saveProjects(projects);
            this.updateStatistics();
            this.updateCharts();
        }
    }

    // Показ деталей проекту
    showProjectDetails(projectId) {
        const project = window.analyticsDataManager.getProjects().find(p => p.id === projectId);
        if (!project) return;

        const modal = document.getElementById('projectDetailsModal');
        const title = document.getElementById('detailsTitle');
        const content = document.getElementById('projectDetailsContent');
        
        if (title) title.textContent = `📊 ${project.name}`;
        if (content) content.innerHTML = this.createProjectDetailsHTML(project);
        if (modal) modal.style.display = 'block';
    }

    closeDetailsModal() {
        const modal = document.getElementById('projectDetailsModal');
        if (modal) modal.style.display = 'none';
    }

    // Створення HTML для деталей проекту
    createProjectDetailsHTML(project) {
        const lifespan = window.analyticsDataManager.calculateProjectLifespan(project);
        const createdDate = new Date(project.createdAt).toLocaleDateString('uk-UA');
        
        const timeline = [];
        Object.entries(project.statuses).forEach(([key, status]) => {
            if (status.enabled && status.date) {
                const labels = {
                    whitePassed: 'Пройшла біла частина',
                    whiteBanned: 'Бан білої частини',
                    grayPassed: 'Пройшла сіра частина',
                    grayBanned: 'Бан сірої частини'
                };
                timeline.push({
                    event: labels[key],
                    date: new Date(status.date).toLocaleDateString('uk-UA'),
                    type: key
                });
            }
        });
        
        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return `
            <div class="project-details">
                <div class="details-section">
                    <h4>📋 Основна інформація</h4>
                    <p><strong>Назва:</strong> ${project.name}</p>
                    <p><strong>Створено:</strong> ${createdDate}</p>
                    <p><strong>Тривалість життя:</strong> ${lifespan} днів</p>
                    ${project.description ? `<p><strong>Опис:</strong> ${project.description}</p>` : ''}
                    ${project.url ? `<p><strong>URL:</strong> <a href="${project.url}" target="_blank">${project.url}</a></p>` : ''}
                </div>
                
                <div class="details-section">
                    <h4>📈 Статистика</h4>
                    <p><strong>Біла частина:</strong> ${project.statuses.whitePassed.enabled ? '✅ Пройдена' : '❌ Не пройдена'}</p>
                    <p><strong>Сіра частина:</strong> ${project.statuses.grayPassed.enabled ? '✅ Пройдена' : '❌ Не пройдена'}</p>
                    <p><strong>Стан:</strong> ${this.getProjectStatus(project)}</p>
                </div>
            </div>
            
            ${timeline.length > 0 ? `
                <div class="details-section" style="grid-column: 1 / -1; margin-top: 20px;">
                    <h4>⏰ Часова лінія</h4>
                    ${timeline.map(item => `
                        <div class="timeline-item">
                            <span>${item.event}</span>
                            <span>${item.date}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    // Отримання статусу проекту
    getProjectStatus(project) {
        if (project.statuses.whiteBanned.enabled || project.statuses.grayBanned.enabled) {
            return '🚫 Забанений';
        }
        if (project.statuses.grayPassed.enabled) {
            return '🎉 Повністю пройдений';
        }
        if (project.statuses.whitePassed.enabled) {
            return '🟡 Частково пройдений';
        }
        return '🔄 Активний';
    }

    // Фільтри
    applyFilters() {
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        const status = document.getElementById('statusFilter')?.value;
        
        this.currentFilters = {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            status: status || 'all'
        };
        
        this.loadData();
    }

    autoApplyFilters() {
        setTimeout(() => this.applyFilters(), 300);
    }

    resetFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('statusFilter').value = 'all';
        
        this.currentFilters = {};
        this.loadData();
    }

    // Зміна виду
    setView(view) {
        this.currentView = view;
        
        // Оновлення кнопок
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
        
        this.loadProjects();
    }

    // Експорт аналітики
    exportAnalytics() {
        window.analyticsDataManager.exportData();
    }

    // Повернення на головну сторінку
    returnToMain() {
        if (window.analyticsChartsManager) {
            window.analyticsChartsManager.destroyCharts();
        }
        
        // Тут має бути логіка повернення на головну сторінку
        // Залежно від того, як інтегровано з основним сайтом
        if (typeof window.returnToMainSite === 'function') {
            window.returnToMainSite();
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Глобальні функції
window.openAddProjectModal = () => analyticsApp.openAddProjectModal();
window.closeProjectModal = () => analyticsApp.closeProjectModal();
window.closeModal = () => analyticsApp.closeModal();
window.saveProject = () => analyticsApp.saveProject();
window.applyFilters = () => analyticsApp.applyFilters();
window.resetFilters = () => analyticsApp.resetFilters();
window.setView = (view) => analyticsApp.setView(view);
window.exportAnalytics = () => analyticsApp.exportAnalytics();
window.returnToMain = () => analyticsApp.returnToMain();

// Ініціалізація додатка
const analyticsApp = new AnalyticsApp();

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    analyticsApp.initialize();
});

// Експорт для використання в інших файлах
window.analyticsApp = analyticsApp;