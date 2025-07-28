// GitHub синхронізація для GDT Analytics
class GitHubSyncManager {
    constructor() {
        this.githubConfig = {
            owner: 'Maroksik',           // Змініть на ваш username
            repo: 'gdt-analytics-data',              // Назва репозиторію
            fileName: 'projects-data.json',          // Назва файлу з даними
            branch: 'main'                           // Гілка
        };
        
        // GitHub Personal Access Token (тільки для публічних repo)
        this.token = null; // Встановлюється користувачем
    }

    // === НАЛАШТУВАННЯ ===
    setToken(token) {
        this.token = token;
        localStorage.setItem('github-token', token);
    }

    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('github-token');
        }
        return this.token;
    }

    setConfig(owner, repo, fileName = 'projects-data.json') {
        this.githubConfig.owner = owner;
        this.githubConfig.repo = repo;
        this.githubConfig.fileName = fileName;
        
        localStorage.setItem('github-config', JSON.stringify(this.githubConfig));
    }

    // === ЗАВАНТАЖЕННЯ З GITHUB ===
    async downloadFromGitHub() {
        try {
            const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${this.githubConfig.fileName}`;
            
            console.log('Завантаження з GitHub:', url);
            
            const response = await fetch(url, {
                headers: this.getToken() ? {
                    'Authorization': `token ${this.getToken()}`,
                    'Accept': 'application/vnd.github.v3+json'
                } : {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Файл не знайдено на GitHub. Створіть файл або перевірте налаштування.');
                }
                throw new Error(`GitHub API помилка: ${response.status}`);
            }

            const data = await response.json();
            
            // Декодування Base64 контенту
            const content = atob(data.content.replace(/\n/g, ''));
            const jsonData = JSON.parse(content);
            
            console.log('Дані успішно завантажено з GitHub');
            return {
                success: true,
                data: jsonData,
                sha: data.sha // Потрібно для оновлення файлу
            };
            
        } catch (error) {
            console.error('Помилка завантаження з GitHub:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // === ВИВАНТАЖЕННЯ НА GITHUB ===
    async uploadToGitHub(data, commitMessage = null) {
        try {
            if (!this.getToken()) {
                throw new Error('GitHub токен не налаштований');
            }

            // Спочатку отримуємо поточний SHA файлу (якщо він існує)
            const currentFile = await this.downloadFromGitHub();
            
            const content = JSON.stringify(data, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${this.githubConfig.fileName}`;
            
            const body = {
                message: commitMessage || `Оновлення даних GDT Analytics - ${new Date().toLocaleString('uk-UA')}`,
                content: encodedContent,
                branch: this.githubConfig.branch
            };

            // Якщо файл існує, додаємо SHA для оновлення
            if (currentFile.success && currentFile.sha) {
                body.sha = currentFile.sha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.getToken()}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API помилка: ${response.status} - ${errorData.message}`);
            }

            console.log('Дані успішно вивантажено на GitHub');
            return { success: true };
            
        } catch (error) {
            console.error('Помилка вивантаження на GitHub:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // === СИНХРОНІЗАЦІЯ ===
    async syncWithGitHub(direction = 'download') {
        if (direction === 'download') {
            return await this.downloadAndMerge();
        } else {
            return await this.uploadCurrent();
        }
    }

    async downloadAndMerge() {
        const result = await this.downloadFromGitHub();
        
        if (!result.success) {
            return result;
        }

        try {
            // Перевіряємо чи існує dataManager
            if (!window.dataManager) {
                throw new Error('DataManager не ініціалізований');
            }

            // Зберігаємо поточні дані як backup
            const currentData = {
                projects: window.dataManager.getProjects() || [],
                clients: window.dataManager.getClients() || [],
                bases: window.dataManager.getBases() || []
            };
            
            localStorage.setItem('gdt-backup-before-sync', JSON.stringify(currentData));
            console.log('Backup створено:', currentData);

            // Завантажуємо нові дані
            const newData = result.data;
            console.log('Завантажені дані з GitHub:', newData);
            
            // Перевіряємо структуру даних
            if (!newData || typeof newData !== 'object') {
                throw new Error('Невірний формат даних з GitHub');
            }

            // Застосовуємо дані поетапно з перевіркою
            if (newData.projects) {
                if (Array.isArray(newData.projects)) {
                    window.dataManager.saveProjects(newData.projects);
                    console.log('Проекти завантажено:', newData.projects.length);
                } else {
                    console.warn('Проекти не є масивом, пропускаємо');
                }
            }
            
            

            // Оновлюємо інтерфейс
            if (window.uiManager && typeof window.uiManager.loadData === 'function') {
                window.uiManager.loadData();
                console.log('Інтерфейс оновлено');
            } else {
                console.warn('UIManager не доступний');
            }

            return {
                success: true,
                message: `Дані успішно синхронізовано з GitHub\nПроекти: ${newData.projects?.length || 0}\nЗамовники: ${newData.clients?.length || 0}\nБази: ${newData.bases?.length || 0}`
            };
            
        } catch (error) {
            console.error('Детальна помилка при застосуванні даних:', error);
            
            // Спробуємо відновити backup
            try {
                const backup = localStorage.getItem('gdt-backup-before-sync');
                if (backup) {
                    const backupData = JSON.parse(backup);
                    if (backupData.projects) window.dataManager.saveProjects(backupData.projects);
                    if (backupData.clients) window.dataManager.saveClients(backupData.clients);
                    if (backupData.bases) window.dataManager.saveBases(backupData.bases);
                    console.log('Backup автоматично відновлено');
                }
            } catch (backupError) {
                console.error('Помилка відновлення backup:', backupError);
            }
            
            return {
                success: false,
                error: `Помилка при застосуванні завантажених даних: ${error.message}`
            };
        }
    }

    async uploadCurrent() {
        const data = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            projects: window.dataManager.getProjects(),
            statistics: window.dataManager.calculateStatistics()
        };

        return await this.uploadToGitHub(data);
    }

    // === ВІДНОВЛЕННЯ BACKUP ===
    restoreBackup() {
        try {
            const backup = localStorage.getItem('gdt-backup-before-sync');
            if (!backup) {
                throw new Error('Backup не знайдено');
            }

            const data = JSON.parse(backup);
            
            if (data.projects) window.dataManager.saveProjects(data.projects);
            if (data.clients) window.dataManager.saveClients(data.clients);
            if (data.bases) window.dataManager.saveBases(data.bases);

            if (window.uiManager && window.uiManager.loadData) {
                window.uiManager.loadData();
            }

            return { success: true, message: 'Backup відновлено' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // === ТЕСТУВАННЯ І ДІАГНОСТИКА ===
    async testGitHubConnection() {
        console.log('🔍 Тестування з\'єднання з GitHub...');
        console.log('Конфігурація:', this.githubConfig);
        
        try {
            const result = await this.downloadFromGitHub();
            
            if (result.success) {
                console.log('✅ Файл знайдено на GitHub');
                console.log('📄 Структура даних:', result.data);
                
                // Перевіряємо структуру
                const data = result.data;
                const issues = [];
                
                if (!data.projects || !Array.isArray(data.projects)) {
                    issues.push('Поле "projects" відсутнє або не є масивом');
                }
                if (!data.clients || !Array.isArray(data.clients)) {
                    issues.push('Поле "clients" відсутнє або не є масивом');
                }
                if (!data.bases || !Array.isArray(data.bases)) {
                    issues.push('Поле "bases" відсутнє або не є масивом');
                }
                
                if (issues.length > 0) {
                    console.warn('⚠️ Проблеми зі структурою даних:', issues);
                    return {
                        success: false,
                        error: 'Невірна структура даних: ' + issues.join(', ')
                    };
                }
                
                return {
                    success: true,
                    message: `Тестування пройшло успішно!\nПроекти: ${data.projects.length}\nЗамовники: ${data.clients.length}\nБази: ${data.bases.length}`
                };
            } else {
                console.error('❌ Помилка завантаження:', result.error);
                return result;
            }
            
        } catch (error) {
            console.error('❌ Помилка тестування:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Створення тестового файлу з правильною структурою
    async createTestFile() {
        const testData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            projects: [
                {
                    id: 'test-1',
                    name: 'Тестовий проект',
                    client: 'Тест замовник',
                    base: 'Тест база',
                    createdAt: new Date().toISOString(),
                    description: 'Тестовий проект для перевірки синхронізації',
                    url: '',
                    whitePassed: true,
                    whitePassedDate: new Date().toISOString().split('T')[0],
                    whiteSpamDown: false,
                    whiteSpamDownDate: null,
                    whiteBanned: false,
                    whiteBannedDate: null,
                    grayPassed: false,
                    grayPassedDate: null,
                    grayReviewBanned: false,
                    grayReviewBannedDate: null,
                    grayBanned: false,
                    grayBannedDate: null
                }
            ],
            clients: ['Тест замовник', 'Замовник 1', 'Замовник 2'],
            bases: ['Тест база', 'База 1', 'База 2'],
            statistics: {
                total: 1,
                whitePassRate: 100,
                grayPassRate: 0
            }
        };

        return await this.uploadToGitHub(testData, 'Створення тестового файлу для GDT Analytics');
    }
    // Інструкції для налаштування GitHub синхронізації
    getSetupInstructions() {
        return `
🔧 НАЛАШТУВАННЯ GITHUB СИНХРОНІЗАЦІЇ:

1️⃣ Створіть новий публічний репозиторій на GitHub:
   - Назва: gdt-analytics-data (або будь-яка інша)
   - Тип: Public (для простоти) або Private (потрібен токен)

2️⃣ Отримайте Personal Access Token (для приватних repo):
   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token → repo (повні права на репозиторій)

3️⃣ Налаштуйте в додатку:
   - GitHub Username: ${this.githubConfig.owner}
   - Репозиторій: ${this.githubConfig.repo}
   - Токен: [якщо приватний репозиторій]

4️⃣ Використання:
   - "Завантажити" - отримати дані з GitHub
   - "Вивантажити" - відправити поточні дані на GitHub
        `;
    }
}

// === ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ СИНХРОНІЗАЦІЇ ===

// Ініціалізація GitHub менеджера
window.githubSync = new GitHubSyncManager();

// Функції для HTML
async function downloadFromGitHub() {
    const loadingMsg = showSyncMessage('Завантаження з GitHub...', 'info');
    
    try {
        const result = await window.githubSync.downloadAndMerge();
        
        hideSyncMessage(loadingMsg);
        
        if (result.success) {
            showSyncMessage('✅ Дані успішно завантажено з GitHub', 'success');
        } else {
            showSyncMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        hideSyncMessage(loadingMsg);
        showSyncMessage('❌ Помилка: ' + error.message, 'error');
    }
}

async function uploadToGitHub() {
    const loadingMsg = showSyncMessage('Вивантаження на GitHub...', 'info');
    
    try {
        const result = await window.githubSync.uploadCurrent();
        
        hideSyncMessage(loadingMsg);
        
        if (result.success) {
            showSyncMessage('✅ Дані успішно вивантажено на GitHub', 'success');
        } else {
            showSyncMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        hideSyncMessage(loadingMsg);
        showSyncMessage('❌ Помилка: ' + error.message, 'error');
    }
}

function openGitHubSettings() {
    const currentConfig = window.githubSync.githubConfig;
    const currentToken = window.githubSync.getToken() || '';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3>⚙️ Налаштування GitHub синхронізації</h3>
            
            <div class="form-group">
                <label>GitHub Username:</label>
                <input type="text" id="githubOwner" value="${currentConfig.owner}" placeholder="your-username">
            </div>
            
            <div class="form-group">
                <label>Назва репозиторію:</label>
                <input type="text" id="githubRepo" value="${currentConfig.repo}" placeholder="gdt-analytics-data">
            </div>
            
            <div class="form-group">
                <label>Назва файлу:</label>
                <input type="text" id="githubFileName" value="${currentConfig.fileName}" placeholder="projects-data.json">
            </div>
            
            <div class="form-group">
                <label>Personal Access Token (для приватних репозиторіїв):</label>
                <input type="password" id="githubToken" value="${currentToken}" placeholder="github_pat_...">
                <small style="color: #888;">Залиште порожнім для публічних репозиторіїв</small>
            </div>
            
            <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: #00d4ff; margin-bottom: 10px;">📋 Інструкції:</h4>
                <div style="font-size: 0.9rem; line-height: 1.4;">
                    ${window.githubSync.getSetupInstructions().replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="saveGitHubSettings()">Зберегти</button>
                <button class="btn btn-secondary" onclick="closeGitHubSettings()">Скасувати</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    window.currentGitHubModal = modal;
}

function saveGitHubSettings() {
    const owner = document.getElementById('githubOwner').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const fileName = document.getElementById('githubFileName').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    
    if (!owner || !repo || !fileName) {
        alert('Заповніть всі обов\'язкові поля');
        return;
    }
    
    window.githubSync.setConfig(owner, repo, fileName);
    if (token) {
        window.githubSync.setToken(token);
    }
    
    closeGitHubSettings();
    showSyncMessage('✅ Налаштування збережено', 'success');
}

function closeGitHubSettings() {
    if (window.currentGitHubModal) {
        document.body.removeChild(window.currentGitHubModal);
        window.currentGitHubModal = null;
    }
}

function restoreBackup() {
    if (confirm('Відновити дані з backup перед останньою синхронізацією?')) {
        const result = window.githubSync.restoreBackup();
        if (result.success) {
            showSyncMessage('✅ ' + result.message, 'success');
        } else {
            showSyncMessage('❌ ' + result.error, 'error');
        }
    }
}

// Утилітарні функції для повідомлень
function showSyncMessage(text, type = 'info') {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 15px 20px; border-radius: 8px; color: white; font-weight: bold;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    msg.textContent = text;
    document.body.appendChild(msg);
    
    if (type !== 'info') {
        setTimeout(() => hideSyncMessage(msg), 5000);
    }
    
    return msg;
}

function hideSyncMessage(msg) {
    if (msg && msg.parentNode) {
        msg.parentNode.removeChild(msg);
    }
}

async function testGitHubConnection() {
    const loadingMsg = showSyncMessage('Тестування з\'єднання з GitHub...', 'info');
    
    try {
        const result = await window.githubSync.testGitHubConnection();
        
        hideSyncMessage(loadingMsg);
        
        if (result.success) {
            showSyncMessage('✅ ' + result.message, 'success');
        } else {
            showSyncMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        hideSyncMessage(loadingMsg);
        showSyncMessage('❌ Помилка тестування: ' + error.message, 'error');
    }
}

async function createTestFile() {
    if (!confirm('Створити тестовий файл на GitHub? Це перезапише існуючі дані.')) {
        return;
    }
    
    const loadingMsg = showSyncMessage('Створення тестового файлу...', 'info');
    
    try {
        const result = await window.githubSync.createTestFile();
        
        hideSyncMessage(loadingMsg);
        
        if (result.success) {
            showSyncMessage('✅ Тестовий файл створено на GitHub', 'success');
        } else {
            showSyncMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        hideSyncMessage(loadingMsg);
        showSyncMessage('❌ Помилка створення файлу: ' + error.message, 'error');
    }
}

// Експорт функцій для глобального доступу
window.downloadFromGitHub = downloadFromGitHub;
window.uploadToGitHub = uploadToGitHub;
window.openGitHubSettings = openGitHubSettings;
window.saveGitHubSettings = saveGitHubSettings;
window.closeGitHubSettings = closeGitHubSettings;
window.restoreBackup = restoreBackup;
window.testGitHubConnection = testGitHubConnection;
window.createTestFile = createTestFile;