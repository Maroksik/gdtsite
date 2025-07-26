// Управління графіками для аналітики
class AnalyticsChartsManager {
    constructor() {
        this.charts = {};
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };
        
        console.log('AnalyticsChartsManager ініціалізовано');
    }

    // Ініціалізація всіх графіків
    initializeCharts() {
        console.log('Ініціалізація графіків...');
        
        // Перевіряємо наявність Chart.js
        if (typeof Chart === 'undefined') {
            console.error('Chart.js не завантажено!');
            return;
        }
        
        try {
            this.initPassRateChart();
            this.initTimelineChart();
            this.initStatusChart();
            this.initLifespanChart();
            console.log('Всі графіки ініціалізовано успішно');
        } catch (error) {
            console.error('Помилка ініціалізації графіків:', error);
        }
    }

    // Графік прохідності
    initPassRateChart() {
        const ctx = document.getElementById('passRateChart');
        if (!ctx) {
            console.warn('Елемент passRateChart не знайдено');
            return;
        }

        try {
            this.charts.passRate = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Біла частина', 'Сіра частина'],
                    datasets: [{
                        label: 'Прохідність (%)',
                        data: [0, 0],
                        backgroundColor: [
                            'rgba(255, 255, 255, 0.8)',
                            'rgba(128, 128, 128, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 255, 255, 1)',
                            'rgba(128, 128, 128, 1)'
                        ],
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#cccccc',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        ...this.defaultOptions.plugins,
                        tooltip: {
                            ...this.defaultOptions.plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y}%`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('Графік прохідності ініціалізовано');
        } catch (error) {
            console.error('Помилка ініціалізації графіка прохідності:', error);
        }
    }

    // Графік часової лінії
    initTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) {
            console.warn('Елемент timelineChart не знайдено');
            return;
        }

        try {
            this.charts.timeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    ...this.defaultOptions,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    elements: {
                        line: {
                            tension: 0.4
                        },
                        point: {
                            radius: 4,
                            hoverRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#cccccc',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
            console.log('Графік часової лінії ініціалізовано');
        } catch (error) {
            console.error('Помилка ініціалізації графіка часової лінії:', error);
        }
    }

    // Кругова діаграма статусів
    initStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) {
            console.warn('Елемент statusChart не знайдено');
            return;
        }

        try {
            this.charts.status = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Активні', 'Пройшли білу', 'Пройшли сіру', 'Забанені'],
                    datasets: [{
                        data: [0, 0, 0, 0],
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
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '50%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                font: {
                                    size: 12
                                },
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: 'rgba(0, 212, 255, 0.5)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('Графік статусів ініціалізовано');
        } catch (error) {
            console.error('Помилка ініціалізації графіка статусів:', error);
        }
    }

    // Графік тривалості життя
    initLifespanChart() {
        const ctx = document.getElementById('lifespanChart');
        if (!ctx) {
            console.warn('Елемент lifespanChart не знайдено');
            return;
        }

        try {
            this.charts.lifespan = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['0-7 днів', '1-2 тижні', '2-4 тижні', '1-3 місяці', '3+ місяці'],
                    datasets: [{
                        label: 'Кількість проектів',
                        data: [0, 0, 0, 0, 0],
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
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#cccccc',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#cccccc',
                                maxRotation: 45
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            console.log('Графік тривалості життя ініціалізовано');
        } catch (error) {
            console.error('Помилка ініціалізації графіка тривалості життя:', error);
        }
    }

    // Оновлення всіх графіків
    updateAllCharts(chartData) {
        console.log('Оновлення всіх графіків з даними:', chartData);
        
        if (chartData.passRateData) {
            this.updatePassRateChart(chartData.passRateData);
        }
        if (chartData.timelineData) {
            this.updateTimelineChart(chartData.timelineData);
        }
        if (chartData.statusData) {
            this.updateStatusChart(chartData.statusData);
        }
        if (chartData.lifespanData) {
            this.updateLifespanChart(chartData.lifespanData);
        }
    }

    // Оновлення графіка прохідності
    updatePassRateChart(data) {
        if (this.charts.passRate) {
            try {
                this.charts.passRate.data = data;
                this.charts.passRate.update('active');
                console.log('Графік прохідності оновлено');
            } catch (error) {
                console.error('Помилка оновлення графіка прохідності:', error);
            }
        }
    }

    // Оновлення графіка часової лінії
    updateTimelineChart(data) {
        if (this.charts.timeline) {
            try {
                this.charts.timeline.data = data;
                this.charts.timeline.update('active');
                console.log('Графік часової лінії оновлено');
            } catch (error) {
                console.error('Помилка оновлення графіка часової лінії:', error);
            }
        }
    }

    // Оновлення графіка статусів
    updateStatusChart(data) {
        if (this.charts.status) {
            try {
                this.charts.status.data = data;
                this.charts.status.update('active');
                console.log('Графік статусів оновлено');
            } catch (error) {
                console.error('Помилка оновлення графіка статусів:', error);
            }
        }
    }

    // Оновлення графіка тривалості життя
    updateLifespanChart(data) {
        if (this.charts.lifespan) {
            try {
                this.charts.lifespan.data = data;
                this.charts.lifespan.update('active');
                console.log('Графік тривалості життя оновлено');
            } catch (error) {
                console.error('Помилка оновлення графіка тривалості життя:', error);
            }
        }
    }

    // Знищення всіх графіків
    destroyCharts() {
        console.log('Знищення всіх графіків...');
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                try {
                    chart.destroy();
                } catch (error) {
                    console.error('Помилка знищення графіка:', error);
                }
            }
        });
        this.charts = {};
        console.log('Всі графіки знищено');
    }

    // Експорт графіка як зображення
    exportChart(chartName, filename) {
        const chart = this.charts[chartName];
        if (!chart) {
            console.warn(`Графік ${chartName} не знайдено`);
            return;
        }

        try {
            const url = chart.toBase64Image();
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `chart-${chartName}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log(`Графік ${chartName} експортовано`);
        } catch (error) {
            console.error('Помилка експорту графіка:', error);
        }
    }

    // Налаштування адаптивності
    setupResponsive() {
        if (typeof ResizeObserver === 'undefined') {
            console.warn('ResizeObserver не підтримується');
            return;
        }

        try {
            const resizeObserver = new ResizeObserver(entries => {
                Object.values(this.charts).forEach(chart => {
                    if (chart) {
                        try {
                            chart.resize();
                        } catch (error) {
                            console.error('Помилка ресайзу графіка:', error);
                        }
                    }
                });
            });

            // Спостереження за контейнерами графіків
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                resizeObserver.observe(container);
            });
            
            console.log('Адаптивність графіків налаштовано');
        } catch (error) {
            console.error('Помилка налаштування адаптивності:', error);
        }
    }

    // Анімації графіків
    animateCharts() {
        Object.values(this.charts).forEach((chart, index) => {
            if (chart) {
                setTimeout(() => {
                    try {
                        chart.update('active');
                    } catch (error) {
                        console.error('Помилка анімації графіка:', error);
                    }
                }, index * 200);
            }
        });
        console.log('Запущено анімацію графіків');
    }

    // Оновлення теми графіків
    updateTheme(isDark = true) {
        const textColor = isDark ? '#ffffff' : '#333333';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        Object.values(this.charts).forEach(chart => {
            if (chart && chart.options) {
                try {
                    if (chart.options.plugins && chart.options.plugins.legend) {
                        chart.options.plugins.legend.labels.color = textColor;
                    }
                    
                    if (chart.options.scales) {
                        if (chart.options.scales.x) {
                            chart.options.scales.x.ticks.color = textColor;
                            chart.options.scales.x.grid.color = gridColor;
                        }
                        if (chart.options.scales.y) {
                            chart.options.scales.y.ticks.color = textColor;
                            chart.options.scales.y.grid.color = gridColor;
                        }
                    }
                    
                    chart.update();
                } catch (error) {
                    console.error('Помилка оновлення теми графіка:', error);
                }
            }
        });
        console.log('Тему графіків оновлено');
    }
}

// Глобальний екземпляр менеджера графіків
console.log('Створюємо глобальний екземпляр AnalyticsChartsManager');
window.analyticsChartsManager = new AnalyticsChartsManager();