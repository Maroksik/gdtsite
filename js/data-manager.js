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

    // === СТАТУС ПРОЕКТУ ===
    getProjectStatus(project) {
        if (project.whiteBanned || project.grayBanned) {
            return 'banned';
        }
        if (project.grayPassed) {
            return 'completed';
        }
        if (project.whitePassed) {
            return 'gray-passed';
        }
        return 'active';
    }

    // === ТРИВАЛІСТЬ ЖИТТЯ ===
    calculateLifespan(project) {
        const createdDate = new Date(project.createdAt);
        let endDate = new Date();
        
        // Якщо є дати банів, використовуємо найранішу
        const banDates = [];
        if (project.whiteBanned && project.whiteBannedDate) {
            banDates.push(new Date(project.whiteBannedDate));
        }
        if (project.grayBanned && project.grayBannedDate) {
            banDates.push(new Date(project.grayBannedDate));
        }
        
        if (banDates.length > 0) {
            endDate = new Date(Math.min(...banDates));
        }
        
        const diffTime = endDate - createdDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }

    // === СТАТИСТИКА ===
    calculateStatistics(projects = null) {
        if (!projects) {
            projects = this.getProjects();
        }

        const stats = {
            total: projects.length,
            active: 0,
            completed: 0,
            banned: 0,
            whitePassed: 0,
            whiteBanned: 0,
            grayPassed: 0,
            grayBanned: 0,
            whitePassRate: 0,
            grayPassRate: 0,
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
            
            stats[status]++;
            
            if (project.whitePassed) {
                stats.whitePassed++;
                if (project.whitePassedDate) {
                    const whiteLife = Math.ceil((new Date(project.whitePassedDate) - new Date(project.createdAt)) / (1000 * 60 * 60 * 24));
                    if (whiteLife > 0) {
                        whiteLifeTotal += whiteLife;
                        whiteLifeCount++;
                    }
                }
            }
            
            if (project.whiteBanned) {
                stats.whiteBanned++;
            }
            
            if (project.grayPassed) {
                stats.grayPassed++;
                if (project.grayPassedDate) {
                    const grayLife = Math.ceil((new Date(project.grayPassedDate) - new Date(project.createdAt)) / (1000 * 60 * 60 * 24));
                    if (grayLife > 0) {
                        grayLifeTotal += grayLife;
                        grayLifeCount++;
                    }
                }
            }
            
            if (project.grayBanned) {
                stats.grayBanned++;
            }
        });

        // Прохідність
        const whiteTotal = stats.whitePassed + stats.whiteBanned;
        const grayTotal = stats.grayPassed + stats.grayBanned;
        
        stats.whitePassRate = whiteTotal > 0 ? Math.round((stats.whitePassed / whiteTotal) * 100) : 0;
        stats.grayPassRate = grayTotal > 0 ? Math.round((stats.grayPassed / grayTotal) * 100) : 0;

        // Середня тривалість життя
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
                passRate: Math.round(((stats.whitePassed + stats.grayPassed) / Math.max(stats.total, 1)) * 50)
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
                passRate: Math.round(((stats.whitePassed + stats.grayPassed) / Math.max(stats.total, 1)) * 100)
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
                name: 'Тестовий проект 1',
                client: 'Замовник 1',
                base: 'База 1',
                description: 'Опис першого тестового проекту',
                url: 'https://example1.com',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: true,
                whitePassedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                whiteBanned: false,
                grayPassed: true,
                grayPassedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                grayBanned: false
            },
            {
                name: 'Тестовий проект 2',
                client: 'Замовник 2',
                base: 'База 2',
                description: 'Опис другого тестового проекту',
                url: 'https://example2.com',
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: true,
                whitePassedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                whiteBanned: false,
                grayPassed: false,
                grayBanned: false
            },
            {
                name: 'Забанений проект',
                client: 'Замовник 1',
                base: 'База 3',
                description: 'Проект який отримав бан',
                url: 'https://banned.com',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                whitePassed: false,
                whiteBanned: true,
                whiteBannedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                grayPassed: false,
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