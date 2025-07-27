// Менеджер даних для проектів
class ProjectDataManager {
    constructor() {
        this.storageKey = 'gdtProjects';
        this.clientsKey = 'gdtClients';
        this.basesKey = 'gdtBases';
        this.currentEditId = null;
        this.currentFilters = {};
        
        this.initDefaultData();
    }

    // Ініціалізація базових даних
    initDefaultData() {
        // Ініціалізація базових замовників
        if (!localStorage.getItem(this.clientsKey)) {
            const defaultClients = ['Замовник 1', 'Замовник 2', 'Замовник 3'];
            this.saveClients(defaultClients);
        }
        
        // Ініціалізація базових баз діжок
        if (!localStorage.getItem(this.basesKey)) {
            const defaultBases = ['База 1', 'База 2', 'База 3', 'Власна база'];
            this.saveBases(defaultBases);
        }
    }

    // === ПРОЕКТИ ===
    getProjects() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Помилка завантаження проектів:', error);
            return [];
        }
    }

    saveProjects(projects) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
            return true;
        } catch (error) {
            console.error('Помилка збереження проектів:', error);
            return false;
        }
    }

    addProject(projectData) {
        const projects = this.getProjects();
        const newProject = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...projectData,
            createdAt: projectData.createdAt || new Date().toISOString()
        };
        
        projects.push(newProject);
        this.saveProjects(projects);
        console.log('Проект додано:', newProject);
        return newProject;
    }

    updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            this.saveProjects(projects);
            console.log('Проект оновлено:', projectId);
            return projects[index];
        }
        console.warn('Проект не знайдено:', projectId);
        return null;
    }

    deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        
        if (filteredProjects.length !== projects.length) {
            this.saveProjects(filteredProjects);
            console.log('Проект видалено:', projectId);
            return true;
        }
        console.warn('Проект для видалення не знайдено:', projectId);
        return false;
    }

    // === ЗАМОВНИКИ ===
    getClients() {
        try {
            const data = localStorage.getItem(this.clientsKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Помилка завантаження замовників:', error);
            return [];
        }
    }

    saveClients(clients) {
        try {
            localStorage.setItem(this.clientsKey, JSON.stringify(clients));
            return true;
        } catch (error) {
            console.error('Помилка збереження замовників:', error);
            return false;
        }
    }

    addClient(name) {
        const clients = this.getClients();
        if (!clients.includes(name)) {
            clients.push(name);
            this.saveClients(clients);
            console.log('Замовника додано:', name);
            return true;
        }
        console.warn('Замовник вже існує:', name);
        return false;
    }

    deleteClient(name) {
        const clients = this.getClients();
        const filtered = clients.filter(c => c !== name);
        this.saveClients(filtered);
        console.log('Замовника видалено:', name);
    }

    // === БАЗИ ДІЖОК ===
    getBases() {
        try {
            const data = localStorage.getItem(this.basesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Помилка завантаження баз:', error);
            return [];
        }
    }

    saveBases(bases) {
        try {
            localStorage.setItem(this.basesKey, JSON.stringify(bases));
            return true;
        } catch (error) {
            console.error('Помилка збереження баз:', error);
            return false;
        }
    }

    addBase(name) {
        const bases = this.getBases();
        if (!bases.includes(name)) {
            bases.push(name);
            this.saveBases(bases);
            console.log('Базу додано:', name);
            return true;
        }
        console.warn('База вже існує:', name);
        return false;
    }

    deleteBase(name) {
        const bases = this.getBases();
        const filtered = bases.filter(b => b !== name);
        this.saveBases(filtered);
        console.log('Базу видалено:', name);
    }

    // === ФІЛЬТРАЦІЯ ===
    filterProjects(filters = {}) {
        let projects = this.getProjects();
        
        if (filters.dateFrom) {
            const dateFrom = new Date(filters.dateFrom);
            projects = projects.filter(p => new Date(p.createdAt) >= dateFrom);
        }
        
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59);
            projects = projects.filter(p => new Date(p.createdAt) <= dateTo);
        }
        
        if (filters.client) {
            projects = projects.filter(p => p.client === filters.client);
        }
        
        if (filters.base) {
            projects = projects.filter(p => p.base === filters.base);
        }
        
        if (filters.status) {
            projects = projects.filter(p => this.getProjectStatus(p) === filters.status);
        }
        
        return projects;
    }

    // === НОВИЙ СТАТУС ПРОЕКТУ ===
    getProjectStatus(project) {
        // Перевірка на бани
        if (project.whiteBanned || project.grayBanned || project.grayReviewBanned) {
            return 'banned';
        }
        
        // Якщо є спам диз білої частини
        if (project.whiteSpamDown) {
            return 'white-spam-down';
        }
        
        // Якщо пройшла сіра частина
        if (project.grayPassed) {
            return 'gray-completed';
        }
        
        // Якщо пройшла біла частина
        if (project.whitePassed) {
            return 'white-passed';
        }
        
        // Активний проект (нічого не пройшов)
        return 'active';
    }

    // === РОЗРАХУНОК ТРИВАЛОСТІ ЖИТТЯ ===
    calculateWhiteLifespan(project) {
        if (!project.whitePassed || !project.whitePassedDate) {
            return 0;
        }
        
        const whiteStartDate = new Date(project.whitePassedDate);
        let whiteEndDate = new Date(); // За замовчуванням поточна дата
        
        // Знаходимо найранішу дату завершення білої частини
        const endDates = [];
        
        if (project.whiteBanned && project.whiteBannedDate) {
            endDates.push(new Date(project.whiteBannedDate));
        }
        
        if (project.grayBanned && project.grayBannedDate) {
            endDates.push(new Date(project.grayBannedDate));
        }
        
        if (project.grayReviewBanned && project.grayReviewBannedDate) {
            endDates.push(new Date(project.grayReviewBannedDate));
        }
        
        if (endDates.length > 0) {
            whiteEndDate = new Date(Math.min(...endDates));
        }
        
        const diffTime = whiteEndDate - whiteStartDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }

    calculateGrayLifespan(project) {
        if (!project.grayPassed || !project.grayPassedDate) {
            return 0;
        }
        
        const grayStartDate = new Date(project.grayPassedDate);
        let grayEndDate = new Date(); // За замовчуванням поточна дата
        
        // Знаходимо дату завершення сірої частини
        if (project.grayBanned && project.grayBannedDate) {
            grayEndDate = new Date(project.grayBannedDate);
        }
        
        const diffTime = grayEndDate - grayStartDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }

    // === НОВА СТАТИСТИКА ===
    calculateStatistics(projects = null) {
        if (!projects) {
            projects = this.getProjects();
        }

        const stats = {
            total: projects.length,
            active: 0,
            whitePassed: 0,
            whiteSpamDown: 0,
            whiteBanned: 0,
            grayPassed: 0,
            grayBanned: 0,
            grayReviewBanned: 0,
            
            // Процентні показники
            whitePassRate: 0,     // % проходження білої частини
            grayPassRate: 0,      // % проходження сірої частини від тих що пройшли білу
            
            // Середнє життя
            whiteAvgLife: 0,
            grayAvgLife: 0
        };

        if (projects.length === 0) {
            return stats;
        }

        let whiteLifeTotal = 0, whiteLifeCount = 0;
        let grayLifeTotal = 0, grayLifeCount = 0;

        projects.forEach(project => {
            const status = this.getProjectStatus(project);
            
            // Підрахунок за статусами
            if (status === 'active') stats.active++;
            else if (status === 'white-spam-down') stats.whiteSpamDown++;
            else if (status === 'white-passed') stats.whitePassed++;
            else if (status === 'gray-completed') stats.grayPassed++;
            else if (status === 'banned') {
                if (project.whiteBanned) stats.whiteBanned++;
                if (project.grayBanned) stats.grayBanned++;
                if (project.grayReviewBanned) stats.grayReviewBanned++;
            }
            
            // Підрахунок пройдених білих частин
            if (project.whitePassed) {
                stats.whitePassed++;
                
                // Розрахунок середнього життя білої частини
                const whiteLife = this.calculateWhiteLifespan(project);
                if (whiteLife > 0) {
                    whiteLifeTotal += whiteLife;
                    whiteLifeCount++;
                }
            }
            
            // Підрахунок пройдених сірих частин
            if (project.grayPassed) {
                // Розрахунок середнього життя сірої частини
                const grayLife = this.calculateGrayLifespan(project);
                if (grayLife > 0) {
                    grayLifeTotal += grayLife;
                    grayLifeCount++;
                }
            }
        });

        // Розрахунок відсотка проходження білої частини
        // Білу частину пройшли ті, хто має whitePassed = true
        // Не пройшли - ті хто має whiteSpamDown = true або whiteBanned = true
        const whiteTriedTotal = stats.whitePassed + stats.whiteSpamDown + stats.whiteBanned;
        stats.whitePassRate = whiteTriedTotal > 0 ? Math.round((stats.whitePassed / whiteTriedTotal) * 100) : 0;
        
        // Розрахунок відсотка проходження сірої частини
        // Сіру частину можуть пройти тільки ті, хто пройшов білу
        // З тих хто пройшов білу, сіру пройшли ті хто має grayPassed = true
        const grayTriedTotal = stats.grayPassed + stats.grayBanned + stats.grayReviewBanned;
        stats.grayPassRate = stats.whitePassed > 0 ? Math.round((stats.grayPassed / stats.whitePassed) * 100) : 0;

        // Середнє життя
        stats.whiteAvgLife = whiteLifeCount > 0 ? Math.round(whiteLifeTotal / whiteLifeCount) : 0;
        stats.grayAvgLife = grayLifeCount > 0 ? Math.round(grayLifeTotal / grayLifeCount) : 0;

        return stats;
    }

    // Статистика по замовниках
    getClientStats() {
        const projects = this.getProjects();
        const clients = this.getClients();
        const clientStats = {};

        clients.forEach(client => {
            const clientProjects = projects.filter(p => p.client === client);
            const stats = this.calculateStatistics(clientProjects);
            
            clientStats[client] = {
                total: stats.total,
                whitePassRate: stats.whitePassRate,
                grayPassRate: stats.grayPassRate,
                averagePassRate: Math.round((stats.whitePassRate + stats.grayPassRate) / 2)
            };
        });

        return clientStats;
    }

    // Статистика по базах
    getBaseStats() {
        const projects = this.getProjects();
        const bases = this.getBases();
        const baseStats = {};

        bases.forEach(base => {
            const baseProjects = projects.filter(p => p.base === base);
            const stats = this.calculateStatistics(baseProjects);
            
            baseStats[base] = {
                total: stats.total,
                whitePassRate: stats.whitePassRate,
                grayPassRate: stats.grayPassRate,
                averagePassRate: Math.round((stats.whitePassRate + stats.grayPassRate) / 2)
            };
        });

        return baseStats;
    }

    // === ЕКСПОРТ ДАНИХ ===
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            projects: this.getProjects(),
            clients: this.getClients(),
            bases: this.getBases(),
            statistics: this.calculateStatistics()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gdt-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Дані експортовано');
    }

    // === ІМПОРТ ДАНИХ ===
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.projects && Array.isArray(data.projects)) {
                        this.saveProjects(data.projects);
                    }
                    if (data.clients && Array.isArray(data.clients)) {
                        this.saveClients(data.clients);
                    }
                    if (data.bases && Array.isArray(data.bases)) {
                        this.saveBases(data.bases);
                    }
                    
                    console.log('Дані імпортовано успішно');
                    resolve(data);
                } catch (error) {
                    console.error('Помилка парсингу файлу:', error);
                    reject(new Error('Невірний формат файлу'));
                }
            };
            
            reader.onerror = () => {
                console.error('Помилка читання файлу');
                reject(new Error('Помилка читання файлу'));
            };
            
            reader.readAsText(file);
        });
    }

    // === ТЕСТОВІ ДАНІ ===
    createSampleData() {
        const sampleProjects = [
            {
                name: 'Успішний проект',
                client: 'Замовник 1',
                base: 'База 1',
                description: 'Проект який пройшов обидві частини',
                url: 'https://example1.com',
                createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: true,
                whitePassedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                whiteSpamDown: false,
                whiteBanned: false,
                grayPassed: true,
                grayPassedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                grayBanned: false,
                grayReviewBanned: false
            },
            {
                name: 'Проект з спам низом',
                client: 'Замовник 2',
                base: 'База 2',
                description: 'Проект який отримав спам низ',
                url: 'https://example2.com',
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: false,
                whiteSpamDown: true,
                whiteSpamDownDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                whiteBanned: false,
                grayPassed: false,
                grayBanned: false,
                grayReviewBanned: false
            },
            {
                name: 'Забанений на ревю',
                client: 'Замовник 1',
                base: 'База 3',
                description: 'Проект забанений на ревю сірої частини',
                url: 'https://banned.com',
                createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: true,
                whitePassedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                whiteSpamDown: false,
                whiteBanned: false,
                grayPassed: false,
                grayReviewBanned: true,
                grayReviewBannedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                grayBanned: false
            }
        ];

        sampleProjects.forEach(project => {
            this.addProject(project);
        });

        console.log('Тестові дані створено');
        return sampleProjects;
    }
}

// Глобальний екземпляр менеджера даних
window.dataManager = new ProjectDataManager();