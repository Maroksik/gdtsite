// Основний додаток
class App {
    constructor() {
        this.isInitialized = false;
    }

    // Ініціалізація додатка
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Ініціалізація GDT Analytics...');
        
        // Створення зірок
        window.uiManager.createStars();
        
        // Ініціалізація авторизації
        initAuth();
        
        // Ініціалізація обробників подій
        window.uiManager.initEventListeners();
        
        this.isInitialized = true;
        console.log('✅ GDT Analytics ініціалізовано успішно');
    }
}

// === ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ HTML ===

// Завантаження даних
function loadData() {
    if (window.uiManager) {
        window.uiManager.loadData();
    }
}

// Проекти
function openProjectModal(projectId = null) {
    if (window.uiManager) {
        window.uiManager.openProjectModal(projectId);
    }
}

function saveProject() {
    const name = document.getElementById('projectName')?.value.trim();
    const client = document.getElementById('projectClient')?.value;
    const base = document.getElementById('projectBase')?.value;
    const createdDate = document.getElementById('projectCreatedDate')?.value;
    
    if (!name || !client || !base || !createdDate) {
        alert('Заповніть обов\'язкові поля: назва, замовник, база діжок, дата створення');
        return;
    }
    
    const projectData = {
        name,
        client,
        base,
        createdAt: new Date(createdDate).toISOString(),
        url: document.getElementById('projectUrl')?.value.trim() || '',
        description: document.getElementById('projectDescription')?.value.trim() || '',
        
        // Біла частина
        whitePassed: document.getElementById('whitePassedCheck')?.checked || false,
        whitePassedDate: document.getElementById('whitePassedDate')?.value || null,
        whiteSpamDown: document.getElementById('whiteSpamDownCheck')?.checked || false,
        whiteSpamDownDate: document.getElementById('whiteSpamDownDate')?.value || null,
        whiteBanned: document.getElementById('whiteBannedCheck')?.checked || false,
        whiteBannedDate: document.getElementById('whiteBannedDate')?.value || null,
        
        // Сіра частина
        grayPassed: document.getElementById('grayPassedCheck')?.checked || false,
        grayPassedDate: document.getElementById('grayPassedDate')?.value || null,
        grayReviewBanned: document.getElementById('grayReviewBannedCheck')?.checked || false,
        grayReviewBannedDate: document.getElementById('grayReviewBannedDate')?.value || null,
        grayBanned: document.getElementById('grayBannedCheck')?.checked || false,
        grayBannedDate: document.getElementById('grayBannedDate')?.value || null
    };
    
    // Валідація логіки
    if (projectData.whiteSpamDown && projectData.whitePassed) {
        alert('Проект не може одночасно пройти білу частину і отримати спам низ');
        return;
    }
    
    if (projectData.grayPassed && !projectData.whitePassed) {
        alert('Сіра частина може пройти тільки якщо пройшла біла частина');
        return;
    }
    
    try {
        if (window.dataManager.currentEditId) {
            window.dataManager.updateProject(window.dataManager.currentEditId, projectData);
            console.log('✅ Проект оновлено:', window.dataManager.currentEditId);
        } else {
            window.dataManager.addProject(projectData);
            console.log('✅ Проект додано:', projectData.name);
        }
        
        loadData();
        closeModal();
    } catch (error) {
        console.error('❌ Помилка збереження проекту:', error);
        alert('Помилка збереження проекту');
    }
}

function editProject(projectId) {
    openProjectModal(projectId);
}

function deleteProject(projectId) {
    const project = window.dataManager.getProjects().find(p => p.id === projectId);
    if (!project) return;
    
    if (confirm(`Видалити проект "${project.name}"?`)) {
        try {
            window.dataManager.deleteProject(projectId);
            loadData();
            console.log('✅ Проект видалено:', project.name);
        } catch (error) {
            console.error('❌ Помилка видалення проекту:', error);
            alert('Помилка видалення проекту');
        }
    }
}

// Замовники
function openClientsModal() {
    if (window.uiManager) {
        window.uiManager.openClientsModal();
    }
}

function addClient() {
    const name = document.getElementById('newClientName')?.value.trim();
    if (!name) {
        alert('Введіть назву замовника');
        return;
    }
    
    try {
        if (window.dataManager.addClient(name)) {
            document.getElementById('newClientName').value = '';
            window.uiManager.loadClientsList();
            window.uiManager.loadSelectOptions();
            console.log('✅ Замовника додано:', name);
        } else {
            alert('Замовник з такою назвою вже існує');
        }
    } catch (error) {
        console.error('❌ Помилка додавання замовника:', error);
        alert('Помилка додавання замовника');
    }
}

function deleteClient(name) {
    if (confirm(`Видалити замовника "${name}"?`)) {
        try {
            window.dataManager.deleteClient(name);
            window.uiManager.loadClientsList();
            window.uiManager.loadSelectOptions();
            console.log('✅ Замовника видалено:', name);
        } catch (error) {
            console.error('❌ Помилка видалення замовника:', error);
            alert('Помилка видалення замовника');
        }
    }
}

// Бази діжок
function openBasesModal() {
    if (window.uiManager) {
        window.uiManager.openBasesModal();
    }
}

function addBase() {
    const name = document.getElementById('newBaseName')?.value.trim();
    if (!name) {
        alert('Введіть назву бази діжок');
        return;
    }
    
    try {
        if (window.dataManager.addBase(name)) {
            document.getElementById('newBaseName').value = '';
            window.uiManager.loadBasesList();
            window.uiManager.loadSelectOptions();
            console.log('✅ Базу додано:', name);
        } else {
            alert('База з такою назвою вже існує');
        }
    } catch (error) {
        console.error('❌ Помилка додавання бази:', error);
        alert('Помилка додавання бази');
    }
}

function deleteBase(name) {
    if (confirm(`Видалити базу "${name}"?`)) {
        try {
            window.dataManager.deleteBase(name);
            window.uiManager.loadBasesList();
            window.uiManager.loadSelectOptions();
            console.log('✅ Базу видалено:', name);
        } catch (error) {
            console.error('❌ Помилка видалення бази:', error);
            alert('Помилка видалення бази');
        }
    }
}

// Модальні вікна
function closeModal() {
    if (window.uiManager) {
        window.uiManager.closeModal();
    }
}

// Фільтри
function applyFilters() {
    if (window.uiManager) {
        window.uiManager.applyFilters();
    }
}

function resetFilters() {
    if (window.uiManager) {
        window.uiManager.resetFilters();
    }
}

// Експорт
function exportData() {
    try {
        window.dataManager.exportData();
        console.log('✅ Дані експортовано');
    } catch (error) {
        console.error('❌ Помилка експорту:', error);
        alert('Помилка експорту даних');
    }
}

// === ДЕМО ДАНІ ===
function createSampleData() {
    if (confirm('Створити тестові дані? (Це додасть приклади проектів)')) {
        try {
            window.dataManager.createSampleData();
            loadData();
            console.log('✅ Тестові дані створено');
        } catch (error) {
            console.error('❌ Помилка створення тестових даних:', error);
            alert('Помилка створення тестових даних');
        }
    }
}

// === ДОДАТКОВІ УТИЛІТИ ===
function clearAllData() {
    if (confirm('УВАГА! Це видалить ВСІ дані (проекти, замовники, бази). Продовжити?')) {
        if (confirm('Ви впевнені? Цю дію неможливо скасувати!')) {
            try {
                localStorage.removeItem(window.dataManager.storageKey);
                localStorage.removeItem(window.dataManager.clientsKey);
                localStorage.removeItem(window.dataManager.basesKey);
                
                // Переініціалізація базових даних
                window.dataManager.initDefaultData();
                loadData();
                
                console.log('✅ Всі дані очищено');
                alert('Всі дані очищено');
            } catch (error) {
                console.error('❌ Помилка очищення даних:', error);
                alert('Помилка очищення даних');
            }
        }
    }
}

// Імпорт даних
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        window.dataManager.importData(file)
            .then(() => {
                loadData();
                alert('Дані успішно імпортовано');
                console.log('✅ Дані імпортовано');
            })
            .catch(error => {
                console.error('❌ Помилка імпорту:', error);
                alert('Помилка імпорту: ' + error.message);
            });
    };
    
    input.click();
}

// === ГЛОБАЛЬНІ ЗМІННІ ===
window.loadData = loadData;
window.openProjectModal = openProjectModal;
window.saveProject = saveProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.openClientsModal = openClientsModal;
window.addClient = addClient;
window.deleteClient = deleteClient;
window.openBasesModal = openBasesModal;
window.addBase = addBase;
window.deleteBase = deleteBase;
window.closeModal = closeModal;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.exportData = exportData;
window.createSampleData = createSampleData;
window.clearAllData = clearAllData;
window.importData = importData;

// === ІНІЦІАЛІЗАЦІЯ ===
const app = new App();

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM завантажено');
    app.init();
});

// Експорт для використання в інших файлах
window.app = app;