// Керування інтерфейсом користувача
class UIManager {
    constructor() {
        this.modals = {
            project: 'projectModal',
            clients: 'clientsModal',
            bases: 'basesModal'
        };
    }

    // === СТВОРЕННЯ ЗІРОК ===
    createStars() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;
        
        starsContainer.innerHTML = '';
        const numStars = 100;

        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 2 + 's';
            starsContainer.appendChild(star);
        }
    }

    // === ЗАВАНТАЖЕННЯ ДАНИХ ===
    updateStatistics() {
        const projects = window.dataManager.filterProjects(window.dataManager.currentFilters);
        const stats = window.dataManager.calculateStatistics(projects);
        const clientStats = window.dataManager.getClientStats();
        const baseStats = window.dataManager.getBaseStats();

        // Основна статистика
        this.updateElement('totalProjects', stats.total);
        this.updateElement('activeProjects', stats.active);
        this.updateElement('spamDownProjects', stats.whiteSpamDown);
        this.updateElement('bannedProjects', stats.whiteBanned + stats.grayBanned + stats.grayReviewBanned);

        // Біла частина
        this.updateElement('whitePassRate', stats.whitePassRate + '%');
        this.updateElement('whitePassed', stats.whitePassed);
        this.updateElement('whiteSpamDown', stats.whiteSpamDown);
        this.updateElement('whiteBanned', stats.whiteBanned);
        this.updateElement('whiteAvgLife', stats.whiteAvgLife);

        // Сіра частина
        this.updateElement('grayPassRate', stats.grayPassRate + '%');
        this.updateElement('grayPassed', stats.grayPassed);
        this.updateElement('grayReviewBanned', stats.grayReviewBanned);
        this.updateElement('grayBanned', stats.grayBanned);
        this.updateElement('grayAvgLife', stats.grayAvgLife);

        // Статистика по замовниках
        this.updateClientStats(clientStats);

        // Статистика по базах
        this.updateBaseStats(baseStats);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateClientStats(clientStats) {
        const clientEntries = Object.entries(clientStats);
        const clientsCount = clientEntries.length;
        let bestClient = '—', worstClient = '—', avgClientRate = 0;
        
        if (clientEntries.length > 0) {
            clientEntries.sort((a, b) => b[1].averagePassRate - a[1].averagePassRate);
            bestClient = clientEntries[0][0] + ' (' + clientEntries[0][1].averagePassRate + '%)';
            worstClient = clientEntries[clientEntries.length - 1][0] + ' (' + clientEntries[clientEntries.length - 1][1].averagePassRate + '%)';
            avgClientRate = Math.round(clientEntries.reduce((sum, [, data]) => sum + data.averagePassRate, 0) / clientEntries.length);
        }

        this.updateElement('clientsCount', clientsCount);
        document.getElementById('clientsStats').innerHTML = `
            Найкращий: ${bestClient}<br>
            Найгірший: ${worstClient}<br>
            Середня прохідність: ${avgClientRate}%
        `;
    }

    updateBaseStats(baseStats) {
        const baseEntries = Object.entries(baseStats);
        const basesCount = baseEntries.length;
        let bestBase = '—', worstBase = '—', avgBaseRate = 0;
        
        if (baseEntries.length > 0) {
            baseEntries.sort((a, b) => b[1].averagePassRate - a[1].averagePassRate);
            bestBase = baseEntries[0][0] + ' (' + baseEntries[0][1].averagePassRate + '%)';
            worstBase = baseEntries[baseEntries.length - 1][0] + ' (' + baseEntries[baseEntries.length - 1][1].averagePassRate + '%)';
            avgBaseRate = Math.round(baseEntries.reduce((sum, [, data]) => sum + data.averagePassRate, 0) / baseEntries.length);
        }

        this.updateElement('basesCount', basesCount);
        document.getElementById('basesStats').innerHTML = `
            Найкраща база: ${bestBase}<br>
            Найгірша база: ${worstBase}<br>
            Середня прохідність: ${avgBaseRate}%
        `;
    }

    // === ЗАВАНТАЖЕННЯ ПРОЕКТІВ ===
    loadProjects() {
        const projects = window.dataManager.filterProjects(window.dataManager.currentFilters);
        const tbody = document.getElementById('projectsTableBody');
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('projectsTable');

        this.updateElement('projectsCount', projects.length);
        this.updateElement('totalProjectsCount', window.dataManager.getProjects().length);

        if (projects.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = projects.map(project => this.createProjectRow(project)).join('');
    }

    createProjectRow(project) {
        const status = window.dataManager.getProjectStatus(project);
        const whiteLifespan = window.dataManager.calculateWhiteLifespan(project);
        const grayLifespan = window.dataManager.calculateGrayLifespan(project);
        const createdDate = new Date(project.createdAt).toLocaleDateString('uk-UA');

        const statusBadges = {
            'active': '<span class="status-badge status-active">Активний</span>',
            'white-passed': '<span class="status-badge status-white-passed">Біла пройдена</span>',
            'white-spam-down': '<span class="status-badge" style="background: rgba(255, 165, 0, 0.3); color: #ffa500;">Спам низ</span>',
            'gray-completed': '<span class="status-badge status-completed">Сіра пройдена</span>',
            'banned': '<span class="status-badge status-banned">Забанений</span>'
        };

        // Статус білої частини
        let whiteStatus = '⏳ В процесі';
        if (project.whitePassed) {
            whiteStatus = `✅ Пройшла ${project.whitePassedDate ? new Date(project.whitePassedDate).toLocaleDateString('uk-UA') : ''}`;
        } else if (project.whiteSpamDown) {
            whiteStatus = `📉 Спам низ ${project.whiteSpamDownDate ? new Date(project.whiteSpamDownDate).toLocaleDateString('uk-UA') : ''}`;
        } else if (project.whiteBanned) {
            whiteStatus = `❌ Бан ${project.whiteBannedDate ? new Date(project.whiteBannedDate).toLocaleDateString('uk-UA') : ''}`;
        }

        // Статус сірої частини
        let grayStatus = '—';
        if (project.whitePassed && !project.whiteSpamDown) {
            if (project.grayPassed) {
                grayStatus = `✅ Пройшла ${project.grayPassedDate ? new Date(project.grayPassedDate).toLocaleDateString('uk-UA') : ''}`;
            } else if (project.grayReviewBanned) {
                grayStatus = `⚠️ Бан на ревю ${project.grayReviewBannedDate ? new Date(project.grayReviewBannedDate).toLocaleDateString('uk-UA') : ''}`;
            } else if (project.grayBanned) {
                grayStatus = `❌ Бан ${project.grayBannedDate ? new Date(project.grayBannedDate).toLocaleDateString('uk-UA') : ''}`;
            } else {
                grayStatus = '⏳ В процесі';
            }
        }

        return `
            <tr>
                <td>
                    <strong>${project.name}</strong>
                    ${project.url ? `<br><a href="${project.url}" target="_blank" style="color: #00d4ff; font-size: 0.8rem;">🔗 Перейти</a>` : ''}
                </td>
                <td>${project.client || '—'}</td>
                <td>${project.base || '—'}</td>
                <td>${createdDate}</td>
                <td>${whiteStatus}</td>
                <td>${grayStatus}</td>
                <td>${statusBadges[status] || statusBadges.active}</td>
                <td>${whiteLifespan || '—'}</td>
                <td>${grayLifespan || '—'}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editProject('${project.id}')" title="Редагувати">✏️</button>
                        <button class="action-btn delete" onclick="deleteProject('${project.id}')" title="Видалити">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // === ЗАВАНТАЖЕННЯ СЕЛЕКТІВ ===
    loadSelectOptions() {
        const clients = window.dataManager.getClients();
        const bases = window.dataManager.getBases();

        // Завантаження замовників в селекти
        this.loadOptionsToSelect('projectClient', clients, 'Оберіть замовника');
        this.loadOptionsToSelect('clientFilter', clients, 'Всі замовники');

        // Завантаження баз в селекти
        this.loadOptionsToSelect('projectBase', bases, 'Оберіть базу');
        this.loadOptionsToSelect('baseFilter', bases, 'Всі бази');
    }

    loadOptionsToSelect(selectId, options, placeholder) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        if (currentValue) select.value = currentValue;
    }

    // === МОДАЛЬНІ ВІКНА ===
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal() {
        Object.values(this.modals).forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
        window.dataManager.currentEditId = null;
    }

    // === МОДАЛЬНЕ ВІКНО ПРОЕКТУ ===
    openProjectModal(projectId = null) {
        const title = document.getElementById('projectModalTitle');
        
        window.dataManager.currentEditId = projectId;
        
        if (projectId) {
            title.textContent = '✏️ Редагування проекту';
            const project = window.dataManager.getProjects().find(p => p.id === projectId);
            if (project) {
                this.fillProjectForm(project);
            }
        } else {
            title.textContent = '➕ Новий проект';
            this.clearProjectForm();
            document.getElementById('projectCreatedDate').value = new Date().toISOString().split('T')[0];
        }
        
        this.setupStatusCheckboxes();
        this.openModal('projectModal');
    }

    fillProjectForm(project) {
        const fields = {
            'projectName': project.name || '',
            'projectClient': project.client || '',
            'projectBase': project.base || '',
            'projectCreatedDate': project.createdAt ? project.createdAt.split('T')[0] : '',
            'projectUrl': project.url || '',
            'projectDescription': project.description || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Біла частина
        this.setCheckboxAndDate('whitePassedCheck', 'whitePassedDate', project.whitePassed, project.whitePassedDate);
        this.setCheckboxAndDate('whiteSpamDownCheck', 'whiteSpamDownDate', project.whiteSpamDown, project.whiteSpamDownDate);
        this.setCheckboxAndDate('whiteBannedCheck', 'whiteBannedDate', project.whiteBanned, project.whiteBannedDate);
        
        // Сіра частина
        this.setCheckboxAndDate('grayPassedCheck', 'grayPassedDate', project.grayPassed, project.grayPassedDate);
        this.setCheckboxAndDate('grayReviewBannedCheck', 'grayReviewBannedDate', project.grayReviewBanned, project.grayReviewBannedDate);
        this.setCheckboxAndDate('grayBannedCheck', 'grayBannedDate', project.grayBanned, project.grayBannedDate);
        
        // Оновлюємо доступність сірої частини
        this.updateGraySection();
    }

    setCheckboxAndDate(checkboxId, dateId, checked, date) {
        const checkbox = document.getElementById(checkboxId);
        const dateInput = document.getElementById(dateId);
        
        if (checkbox) checkbox.checked = !!checked;
        if (dateInput) {
            dateInput.value = date || '';
            dateInput.disabled = !checked;
        }
    }

    clearProjectForm() {
        const inputIds = ['projectName', 'projectClient', 'projectBase', 'projectCreatedDate', 'projectUrl', 'projectDescription'];
        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const checkboxIds = [
            'whitePassedCheck', 'whiteSpamDownCheck', 'whiteBannedCheck',
            'grayPassedCheck', 'grayReviewBannedCheck', 'grayBannedCheck'
        ];
        const dateIds = [
            'whitePassedDate', 'whiteSpamDownDate', 'whiteBannedDate',
            'grayPassedDate', 'grayReviewBannedDate', 'grayBannedDate'
        ];
        
        checkboxIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.checked = false;
        });
        
        dateIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
                element.disabled = true;
            }
        });
        
        // Блокуємо сіру частину за замовчуванням
        this.updateGraySection();
    }

    setupStatusCheckboxes() {
        const whiteCheckboxes = [
            { check: 'whitePassedCheck', date: 'whitePassedDate' },
            { check: 'whiteSpamDownCheck', date: 'whiteSpamDownDate' },
            { check: 'whiteBannedCheck', date: 'whiteBannedDate' }
        ];

        const grayCheckboxes = [
            { check: 'grayPassedCheck', date: 'grayPassedDate' },
            { check: 'grayReviewBannedCheck', date: 'grayReviewBannedDate' },
            { check: 'grayBannedCheck', date: 'grayBannedDate' }
        ];

        // Біла частина
        whiteCheckboxes.forEach(({ check, date }) => {
            const checkbox = document.getElementById(check);
            const dateInput = document.getElementById(date);
            
            if (checkbox && dateInput) {
                checkbox.addEventListener('change', () => {
                    dateInput.disabled = !checkbox.checked;
                    if (checkbox.checked && !dateInput.value) {
                        dateInput.value = new Date().toISOString().split('T')[0];
                    } else if (!checkbox.checked) {
                        dateInput.value = '';
                    }
                    
                    // Оновлюємо доступність сірої частини при зміні білої
                    this.updateGraySection();
                    
                    // Взаємовиключення для білої частини
                    if (checkbox.checked && check !== 'whitePassedCheck') {
                        document.getElementById('whitePassedCheck').checked = false;
                        document.getElementById('whitePassedDate').value = '';
                        document.getElementById('whitePassedDate').disabled = true;
                    }
                    if (checkbox.checked && check === 'whitePassedCheck') {
                        ['whiteSpamDownCheck', 'whiteBannedCheck'].forEach(otherId => {
                            const otherCheckbox = document.getElementById(otherId);
                            const otherDate = document.getElementById(otherId.replace('Check', 'Date'));
                            if (otherCheckbox) {
                                otherCheckbox.checked = false;
                                if (otherDate) {
                                    otherDate.value = '';
                                    otherDate.disabled = true;
                                }
                            }
                        });
                    }
                });
            }
        });

        // Сіра частина
        grayCheckboxes.forEach(({ check, date }) => {
            const checkbox = document.getElementById(check);
            const dateInput = document.getElementById(date);
            
            if (checkbox && dateInput) {
                checkbox.addEventListener('change', () => {
                    dateInput.disabled = !checkbox.checked;
                    if (checkbox.checked && !dateInput.value) {
                        dateInput.value = new Date().toISOString().split('T')[0];
                    } else if (!checkbox.checked) {
                        dateInput.value = '';
                    }
                    
                    // Взаємовиключення для сірої частини
                    if (checkbox.checked && check !== 'grayPassedCheck') {
                        document.getElementById('grayPassedCheck').checked = false;
                        document.getElementById('grayPassedDate').value = '';
                        document.getElementById('grayPassedDate').disabled = true;
                    }
                    if (checkbox.checked && check === 'grayPassedCheck') {
                        ['grayReviewBannedCheck', 'grayBannedCheck'].forEach(otherId => {
                            const otherCheckbox = document.getElementById(otherId);
                            const otherDate = document.getElementById(otherId.replace('Check', 'Date'));
                            if (otherCheckbox) {
                                otherCheckbox.checked = false;
                                if (otherDate) {
                                    otherDate.value = '';
                                    otherDate.disabled = true;
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    updateGraySection() {
        const whitePassedCheck = document.getElementById('whitePassedCheck');
        const whiteSpamDownCheck = document.getElementById('whiteSpamDownCheck');
        
        const grayCheckboxes = ['grayPassedCheck', 'grayReviewBannedCheck', 'grayBannedCheck'];
        const grayDates = ['grayPassedDate', 'grayReviewBannedDate', 'grayBannedDate'];
        
        // Сіра частина доступна тільки якщо пройшла біла і немає спам низу
        const grayEnabled = whitePassedCheck && whitePassedCheck.checked && (!whiteSpamDownCheck || !whiteSpamDownCheck.checked);
        
        grayCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.disabled = !grayEnabled;
                if (!grayEnabled) {
                    checkbox.checked = false;
                }
            }
        });
        
        grayDates.forEach(id => {
            const dateInput = document.getElementById(id);
            if (dateInput) {
                dateInput.disabled = true;
                if (!grayEnabled) {
                    dateInput.value = '';
                }
            }
        });
    }

    // === МОДАЛЬНЕ ВІКНО ЗАМОВНИКІВ ===
    openClientsModal() {
        this.loadClientsList();
        this.openModal('clientsModal');
    }

    loadClientsList() {
        const clients = window.dataManager.getClients();
        const container = document.getElementById('clientsList');
        
        if (container) {
            container.innerHTML = clients.map(client => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; margin-bottom: 5px;">
                    <span>${client}</span>
                    <button class="action-btn delete" onclick="deleteClient('${client}')" title="Видалити">🗑️</button>
                </div>
            `).join('');
        }
    }

    // === МОДАЛЬНЕ ВІКНО БАЗ ===
    openBasesModal() {
        this.loadBasesList();
        this.openModal('basesModal');
    }

    loadBasesList() {
        const bases = window.dataManager.getBases();
        const container = document.getElementById('basesList');
        
        if (container) {
            container.innerHTML = bases.map(base => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; margin-bottom: 5px;">
                    <span>${base}</span>
                    <button class="action-btn delete" onclick="deleteBase('${base}')" title="Видалити">🗑️</button>
                </div>
            `).join('');
        }
    }

    // === ФІЛЬТРИ ===
    applyFilters() {
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        const client = document.getElementById('clientFilter')?.value;
        const base = document.getElementById('baseFilter')?.value;
        const status = document.getElementById('statusFilter')?.value;
        
        window.dataManager.currentFilters = {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            client: client || null,
            base: base || null,
            status: status || null
        };
        
        console.log('Застосовано фільтри:', window.dataManager.currentFilters);
        this.loadData();
    }

    resetFilters() {
        const filterIds = ['dateFrom', 'dateTo', 'clientFilter', 'baseFilter', 'statusFilter'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        window.dataManager.currentFilters = {};
        this.loadData();
        console.log('Фільтри скинуто');
    }

    // === ЗАГАЛЬНЕ ЗАВАНТАЖЕННЯ ДАНИХ ===
    loadData() {
        this.updateStatistics();
        this.loadProjects();
        this.loadSelectOptions();
    }

    // === ІНІЦІАЛІЗАЦІЯ ОБРОБНИКІВ ПОДІЙ ===
    initEventListeners() {
        // Автозастосування фільтрів
        const filterInputs = document.querySelectorAll('#dateFrom, #dateTo, #clientFilter, #baseFilter, #statusFilter');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                setTimeout(() => this.applyFilters(), 300);
            });
        });

        // Закриття модальних вікон по кліку поза ними
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Обробка клавіші Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });

        // Обробка Enter в модальних формах
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.target.closest('.modal')) {
                const modal = event.target.closest('.modal');
                if (modal.id === 'projectModal') {
                    event.preventDefault();
                    window.saveProject();
                } else if (modal.id === 'clientsModal' && event.target.id === 'newClientName') {
                    event.preventDefault();
                    window.addClient();
                } else if (modal.id === 'basesModal' && event.target.id === 'newBaseName') {
                    event.preventDefault();
                    window.addBase();
                }
            }
        });
    }
}

// Глобальний екземпляр UI менеджера
window.uiManager = new UIManager();