// Управління даними для аналітики пилок
class AnalyticsDataManager {
    constructor() {
        this.storageKey = 'analyticsProjects';
        this.defaultProject = {
            id: null,
            name: '',
            description: '',
            url: '',
            createdAt: new Date().toISOString(),
            statuses: {
                whitePassed: { enabled: false, date: null },
                whiteBanned: { enabled: false, date: null },
                grayPassed: { enabled: false, date: null },
                grayBanned: { enabled: false, date: null }
            }
        };
    }

    // Отримання всіх проектів
    getProjects() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Помилка завантаження проектів:', error);
            return [];
        }
    }

    // Збереження проектів
    saveProjects(projects) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
            return true;
        } catch (error) {
            console.error('Помилка збереження проектів:', error);
            return false;
        }
    }

    // Додавання нового проекту
    addProject(projectData) {
        const projects = this.getProjects();
        const newProject = {
            ...this.defaultProject,
            ...projectData,
            id: this.generateId(),
            createdAt: projectData.createdAt || new Date().toISOString()
        };
        
        projects.push(newProject);
        this.saveProjects(projects);
        return newProject;
    }

    // Оновлення проекту
    updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            this.saveProjects(projects);
            return projects[index];
        }
        return null;
    }

    // Видалення проекту
    deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        
        if (filteredProjects.length !== projects.length) {
            this.saveProjects(filteredProjects);
            return true;
        }
        return false;
    }

    // Оновлення статусу проекту
    updateProjectStatus(projectId, statusType, enabled, date = null) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            if (!date && enabled) {
                date = new Date().toISOString().split('T')[0];
            }
            
            project.statuses[statusType] = { enabled, date };
            this.saveProjects(projects);
            return true;
        }
        return false;
    }

    // Генерація унікального ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Фільтрація проектів
    filterProjects(filters = {}) {
        let projects = this.getProjects();
        
        // Фільтр по даті
        if (filters.dateFrom) {
            projects = projects.filter(p => p.createdAt >= filters.dateFrom);
        }
        
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59);
            projects = projects.filter(p => new Date(p.createdAt) <= dateTo);
        }
        
        // Фільтр по статусу
        if (filters.status && filters.status !== 'all') {
            switch (filters.status) {
                case 'active':
                    projects = projects.filter(p => 
                        !p.statuses.whiteBanned.enabled && 
                        !p.statuses.grayBanned.enabled
                    );
                    break;
                case 'banned':
                    projects = projects.filter(p => 
                        p.statuses.whiteBanned.enabled || 
                        p.statuses.grayBanned.enabled
                    );
                    break;
                case 'passed':
                    projects = projects.filter(p => 
                        p.statuses.whitePassed.enabled || 
                        p.statuses.grayPassed.enabled
                    );
                    break;
            }
        }
        
        return projects;
    }

    // Обчислення статистики
    calculateStatistics(projects = null) {
        if (!projects) {
            projects = this.getProjects();
        }

        const stats = {
            totalProjects: projects.length,
            whitePassed: 0,
            whiteBanned: 0,
            grayPassed: 0,
            grayBanned: 0,
            whitePassRate: 0,
            grayPassRate: 0,
            avgLifespan: 0,
            totalBans: 0
        };

        if (projects.length === 0) {
            return stats;
        }

        let totalLifespan = 0;
        let projectsWithLifespan = 0;

        projects.forEach(project => {
            // Підрахунок статусів
            if (project.statuses.whitePassed.enabled) stats.whitePassed++;
            if (project.statuses.whiteBanned.enabled) stats.whiteBanned++;
            if (project.statuses.grayPassed.enabled) stats.grayPassed++;
            if (project.statuses.grayBanned.enabled) stats.grayBanned++;

            // Підрахунок тривалості життя
            const lifespan = this.calculateProjectLifespan(project);
            if (lifespan > 0) {
                totalLifespan += lifespan;
                projectsWithLifespan++;
            }
        });

        // Прохідність
        const whiteTotal = stats.whitePassed + stats.whiteBanned;
        const grayTotal = stats.grayPassed + stats.grayBanned;
        
        stats.whitePassRate = whiteTotal > 0 ? 
            Math.round((stats.whitePassed / whiteTotal) * 100) : 0;
        stats.grayPassRate = grayTotal > 0 ? 
            Math.round((stats.grayPassed / grayTotal) * 100) : 0;

        // Середня тривалість життя
        stats.avgLifespan = projectsWithLifespan > 0 ? 
            Math.round(totalLifespan / projectsWithLifespan) : 0;

        // Загальна кількість банів
        stats.totalBans = stats.whiteBanned + stats.grayBanned;

        return stats;
    }

    // Обчислення тривалості життя проекту (в днях)
    calculateProjectLifespan(project) {
        const createdDate = new Date(project.createdAt);
        let endDate = null;

        // Знаходимо найраніший бан або поточну дату
        const banDates = [];
        
        if (project.statuses.whiteBanned.enabled && project.statuses.whiteBanned.date) {
            banDates.push(new Date(project.statuses.whiteBanned.date));
        }
        
        if (project.statuses.grayBanned.enabled && project.statuses.grayBanned.date) {
            banDates.push(new Date(project.statuses.grayBanned.date));
        }

        if (banDates.length > 0) {
            endDate = new Date(Math.min(...banDates));
        } else {
            endDate = new Date(); // Якщо немає банів, використовуємо поточну дату
        }

        const diffTime = endDate - createdDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }

    // Отримання даних для графіків
    getChartData() {
        const projects = this.getProjects();
        const stats = this.calculateStatistics(projects);

        return {
            passRateData: {
                labels: ['Біла частина', 'Сіра частина'],
                datasets: [{
                    label: 'Прохідність (%)',
                    data: [stats.whitePassRate, stats.grayPassRate],
                    backgroundColor: [
                        'rgba(255, 255, 255, 0.8)',
                        'rgba(128, 128, 128, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 255, 255, 1)',
                        'rgba(128, 128, 128, 1)'
                    ],
                    borderWidth: 2
                }]
            },

            timelineData: this.getTimelineData(projects),
            
            statusData: {
                labels: ['Активні', 'Пройшли білу', 'Пройшли сіру', 'Забанені'],
                datasets: [{
                    data: [
                        projects.filter(p => !p.statuses.whiteBanned.enabled && !p.statuses.grayBanned.enabled).length,
                        stats.whitePassed,
                        stats.grayPassed,
                        stats.totalBans
                    ],
                    backgroundColor: [
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(255, 255, 255, 0.8)',
                        'rgba(128, 128, 128, 0.8)',
                        'rgba(255, 71, 87, 0.8)'
                    ],
                    borderColor: [
                        'rgba(0, 212, 255, 1)',
                        'rgba(255, 255, 255, 1)',
                        'rgba(128, 128, 128, 1)',
                        'rgba(255, 71, 87, 1)'
                    ],
                    borderWidth: 2
                }]
            },

            lifespanData: this.getLifespanData(projects)
        };
    }

    // Дані для графіка часової лінії
    getTimelineData(projects) {
        const monthlyData = {};
        
        projects.forEach(project => {
            const date = new Date(project.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    created: 0,
                    whitePassed: 0,
                    grayPassed: 0,
                    banned: 0
                };
            }
            
            monthlyData[monthKey].created++;
            
            if (project.statuses.whitePassed.enabled) {
                monthlyData[monthKey].whitePassed++;
            }
            if (project.statuses.grayPassed.enabled) {
                monthlyData[monthKey].grayPassed++;
            }
            if (project.statuses.whiteBanned.enabled || project.statuses.grayBanned.enabled) {
                monthlyData[monthKey].banned++;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        
        return {
            labels: sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('uk-UA', { 
                    year: 'numeric', 
                    month: 'short' 
                });
            }),
            datasets: [
                {
                    label: 'Створено',
                    data: sortedMonths.map(month => monthlyData[month].created),
                    borderColor: 'rgba(0, 212, 255, 1)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true
                },
                {
                    label: 'Пройшли білу',
                    data: sortedMonths.map(month => monthlyData[month].whitePassed),
                    borderColor: 'rgba(255, 255, 255, 1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fill: false
                },
                {
                    label: 'Пройшли сіру',
                    data: sortedMonths.map(month => monthlyData[month].grayPassed),
                    borderColor: 'rgba(128, 128, 128, 1)',
                    backgroundColor: 'rgba(128, 128, 128, 0.1)',
                    fill: false
                },
                {
                    label: 'Забанені',
                    data: sortedMonths.map(month => monthlyData[month].banned),
                    borderColor: 'rgba(255, 71, 87, 1)',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    fill: false
                }
            ]
        };
    }

    // Дані для графіка тривалості життя
    getLifespanData(projects) {
        const lifespanRanges = {
            '0-7 днів': 0,
            '1-2 тижні': 0,
            '2-4 тижні': 0,
            '1-3 місяці': 0,
            '3+ місяці': 0
        };

        projects.forEach(project => {
            const lifespan = this.calculateProjectLifespan(project);
            
            if (lifespan <= 7) {
                lifespanRanges['0-7 днів']++;
            } else if (lifespan <= 14) {
                lifespanRanges['1-2 тижні']++;
            } else if (lifespan <= 30) {
                lifespanRanges['2-4 тижні']++;
            } else if (lifespan <= 90) {
                lifespanRanges['1-3 місяці']++;
            } else {
                lifespanRanges['3+ місяці']++;
            }
        });

        return {
            labels: Object.keys(lifespanRanges),
            datasets: [{
                label: 'Кількість проектів',
                data: Object.values(lifespanRanges),
                backgroundColor: [
                    'rgba(255, 71, 87, 0.8)',
                    'rgba(255, 165, 0, 0.8)',
                    'rgba(255, 235, 59, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(0, 212, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 71, 87, 1)',
                    'rgba(255, 165, 0, 1)',
                    'rgba(255, 235, 59, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(0, 212, 255, 1)'
                ],
                borderWidth: 2
            }]
        };
    }

    // Експорт даних
    exportData() {
        const projects = this.getProjects();
        const stats = this.calculateStatistics(projects);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            statistics: stats,
            projects: projects.map(project => ({
                ...project,
                lifespan: this.calculateProjectLifespan(project)
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Імпорт даних
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.projects && Array.isArray(data.projects)) {
                        this.saveProjects(data.projects);
                        resolve(data);
                    } else {
                        reject(new Error('Невірний формат файлу'));
                    }
                } catch (error) {
                    reject(new Error('Помилка парсингу файлу'));
                }
            };
            
            reader.onerror = () => reject(new Error('Помилка читання файлу'));
            reader.readAsText(file);
        });
    }
}

// Глобальний екземпляр менеджера даних
window.analyticsDataManager = new AnalyticsDataManager();