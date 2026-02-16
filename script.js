// Конфигурация API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8086/api/v1',
    ENDPOINTS: {
        VENDING_MACHINES: '/VendingMachines',
        MAINTENANCE: '/Maintenance',
        USERS: '/Users',
        PRODUCTS: '/Products',
        SALES: '/Sales',
        ADD_VENDING_MACHINE: '/VendingMachines',
        ADD_MAINTENANCE: '/Maintenance',
        ADD_USER: '/Users',
        ADD_PRODUCT: '/Products',
        ADD_SALE: '/Sales'
    }
};

// Глобальные переменные
let appData = {
    vendingMachines: [],
    maintenance: [],
    users: [],
    products: [],
    sales: [],
    currentUser: null,
    calendarView: 'year',
    selectedTA: null,
    currentDate: new Date()
};

// Утилиты для уведомлений
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 5000);
}

// Модальные окна
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// API сервис
const ApiService = {
    async request(endpoint, method = 'GET', data = null) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            showNotification(`Ошибка соединения с сервером: ${error.message}`, 'error');
            throw error;
        }
    },
    get(endpoint) { return this.request(endpoint, 'GET'); },
    post(endpoint, data) { return this.request(endpoint, 'POST', data); }
};

// ---------- АВТОРИЗАЦИЯ ----------
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error');

    if (!email || !password) {
        showNotification('Введите email и пароль', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: email, password: password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || 'Ошибка входа';
            errorDiv.style.display = 'block';
            return;
        }

        // Успешный вход
        appData.currentUser = data; // { UserID, FullName, Role }
        localStorage.setItem('currentUser', JSON.stringify(data));
        document.getElementById('current-user').textContent = `Пользователь: ${data.FullName}`;
        hideModal('login-modal');
        errorDiv.style.display = 'none';
        await initApp(); // Загружаем все данные и показываем интерфейс
        showNotification('Добро пожаловать!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('login-error').textContent = 'Сетевая ошибка';
        document.getElementById('login-error').style.display = 'block';
    }
}

// ---------- ЗАГРУЗКА ДАННЫХ ПОСЛЕ ВХОДА ----------
async function initApp() {
    await loadInitialData();
    updateTASelect();
    setupNavigation();
    setupEventHandlers();
    await loadSelectOptions();
    await renderVendingMachinesTable();
    showNotification('Приложение успешно загружено', 'success');
    renderCalendar();
}

async function loadInitialData() {
    try {
        const [vendingMachines, maintenance, users, products, sales] = await Promise.all([
            ApiService.get(API_CONFIG.ENDPOINTS.VENDING_MACHINES),
            ApiService.get(API_CONFIG.ENDPOINTS.MAINTENANCE),
            ApiService.get(API_CONFIG.ENDPOINTS.USERS),
            ApiService.get(API_CONFIG.ENDPOINTS.PRODUCTS),
            ApiService.get(API_CONFIG.ENDPOINTS.SALES)
        ]);

        appData.vendingMachines = Array.isArray(vendingMachines) ? vendingMachines : [];
        appData.maintenance = Array.isArray(maintenance) ? maintenance : [];
        appData.users = Array.isArray(users) ? users : [];
        appData.products = Array.isArray(products) ? products : [];
        appData.sales = Array.isArray(sales) ? sales : [];

        console.log('Data loaded:', {
            vendingMachines: appData.vendingMachines.length,
            maintenance: appData.maintenance.length,
            users: appData.users.length
        });
    } catch (error) {
        console.error('Failed to load data, using demo data', error);
        loadDemoData();
        showNotification('Используются демо-данные. Сервер недоступен.', 'warning');
    }
}

function loadDemoData() {
    // Демо-данные на случай недоступности API
    appData.vendingMachines = [
        {
            "Location": "г. Санкт‑Петербург, Невский пр., д. 50, ТЦ «Галерея», 2‑й этаж.",
            "Model": "VendCore X‑200.",
            "PaymentType": "Карта",
            "FullIncome": 1250000.00,
            "SerialNumber": "SC123456789",
            "InventoryNumber": "INV‑2025‑001",
            "Manufacturer": "ООО «ВендТех»",
            "ManufactureDate": "2025-05-01",
            "DateOfCommissioning": "2025-05-10",
            "LastVerificationDate": "2025-06-15",
            "VerificationInterval": 6,
            "ResourceHours": 2500,
            "DateOfNextFixing": "2026-08-01",
            "MaintenanceTimeHours": 4,
            "StatusName": "Работает",
            "CountryName": "Россия",
            "InventoryDate": "2025-07-20",
            "LastCheckedByUser": "Иванов Алексей Петрович"
        }
    ];
    
    appData.maintenance = [
        {
            "NoteID": 1,
            "MachineID": 3,
            "MaintenanceDate": "2026-01-22",
            "Description": "Плановое ТО: очистка камер, проверка датчиков, смазка механизмов",
            "Problems": "Загрязнение датчиков наличия товара, ложные срабатывания",
            "DoneByUser": "Сидоров Дмитрий Викторович"
        }
    ];
    
    appData.users = [
        {
            "UserID": 1,
            "FullName": "Иванов Алексей Петрович",
            "Contacts": "alex.ivanov@example.com, +7 916 123‑45‑67",
            "Role": "Администратор"
        }
    ];
    
    appData.products = [
        {
            "ProductID": 1,
            "Name": "Кофе «Эспрессо»",
            "Description": "Эспрессо из 100 % арабики, без добавок. Объём: 250 мл",
            "Price": 120.00,
            "InStock": 18,
            "MinStock": 5,
            "PropensityToSell": 3.5
        }
    ];
    
    appData.sales = [
        {
            "SaleID": 1,
            "ProductName": "Кофе «Эспрессо»",
            "MachineID": 2,
            "Quantity": 1,
            "SaleSum": 120.00,
            "PaymentTypeName": "Карта",
            "SaleDateTime": "2026-01-22T08:15:30"
        }
    ];
    
    document.getElementById('current-user').textContent = `Пользователь: ${appData.currentUser.FullName}`;
}

// ---------- ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ----------
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            appData.currentUser = JSON.parse(savedUser);
            document.getElementById('current-user').textContent = `Пользователь: ${appData.currentUser.FullName}`;
            hideModal('login-modal');
            initApp(); // загружаем данные
        } catch (e) {
            console.error('Invalid saved user', e);
            localStorage.removeItem('currentUser');
            showModal('login-modal');
        }
    } else {
        // Нет сессии — показываем окно входа, ничего не загружаем
        showModal('login-modal');
    }

    // Обработчик формы входа
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });

    // Кнопка выхода
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('currentUser');
            location.reload(); // перезагружаем страницу, вернёмся к окну входа
        }
    });
});

async function loadSelectOptions() {
    // Загрузка данных для выпадающих списков
    // В реальном приложении здесь будут API запросы для получения справочников
    // Пока используем статические данные из вставок
    
    // Типы оплаты
    const paymentTypes = [
        { id: 1, name: 'Наличные' },
        { id: 2, name: 'Карта' },
        { id: 3, name: 'QR' },
        { id: 4, name: 'Наличные+карта' }
    ];
    
    // Статусы аппаратов
    const machineStatuses = [
        { id: 1, name: 'Работает' },
        { id: 2, name: 'Вышел из строя' },
        { id: 3, name: 'В ремонте/на обслуживании' }
    ];
    
    // Страны
    const countries = [
        { id: 1, name: 'Россия' },
        { id: 2, name: 'Великобритания' },
        { id: 3, name: 'Китай' },
        { id: 4, name: 'Южная Корея' },
        { id: 5, name: 'Германия' },
        { id: 6, name: 'США' },
        { id: 7, name: 'Италия' },
        { id: 8, name: 'Турция' },
        { id: 9, name: 'Япония' },
        { id: 10, name: 'Тайвань' }
    ];
    
    // Заполняем выпадающие списки
    const paymentSelect = document.getElementById('vm-payment-type');
    paymentTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        paymentSelect.appendChild(option);
    });
    
    const statusSelect = document.getElementById('vm-status');
    machineStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.id;
        option.textContent = status.name;
        statusSelect.appendChild(option);
    });
    
    const countrySelect = document.getElementById('vm-country');
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
    
    // Пользователи
    const userSelect = document.getElementById('vm-user');
    const requestUserSelect = document.getElementById('request-employee');
    const maintenanceUserSelect = document.getElementById('maintenance-employee');
    
    appData.users.forEach(user => {
        [userSelect, requestUserSelect, maintenanceUserSelect].forEach(select => {
            const option = document.createElement('option');
            option.value = user.UserID;
            option.textContent = user.FullName;
            if (select) select.appendChild(option.cloneNode(true));
        });
    });
    
    // Торговые аппараты
    const taSelect = document.getElementById('request-ta');
    const maintenanceTaSelect = document.getElementById('maintenance-ta');
    const calendarTaSelect = document.getElementById('ta-select');
    
    appData.vendingMachines.forEach((vm, index) => {
        [taSelect, maintenanceTaSelect, calendarTaSelect].forEach(select => {
            const option = document.createElement('option');
            option.value = index + 1; // Временное значение, так как API не возвращает MachineID
            option.textContent = `${vm.Model} - ${vm.Location.substring(0, 30)}...`;
            if (select) select.appendChild(option.cloneNode(true));
        });
    });
}

// Навигация между разделами
function setupNavigation() {
    document.getElementById('menu-ta').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('ta');
    });
    
    document.getElementById('menu-calendar').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('calendar');
    });
    
    document.getElementById('menu-schedule').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('schedule');
    });
    
    // Переключатели вида календаря
    document.getElementById('view-all').addEventListener('click', function() {
        document.getElementById('view-all').classList.add('active');
        document.getElementById('view-single').classList.remove('active');
        document.getElementById('ta-filter').style.display = 'none';
        appData.selectedTA = null;
        renderCalendar();
    });
    
    document.getElementById('view-single').addEventListener('click', function() {
        document.getElementById('view-all').classList.remove('active');
        document.getElementById('view-single').classList.add('active');
        document.getElementById('ta-filter').style.display = 'flex';
        renderCalendar();
    });
    
    document.getElementById('ta-select').addEventListener('change', function() {
        appData.selectedTA = this.value;
        renderCalendar();
    });
}

function setupEventHandlers() {
    // Загрузка CSV файла
    document.getElementById('upload-btn').addEventListener('click', function() {
        document.getElementById('csv-file').click();
    });
    
    document.getElementById('csv-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = (file.size / 1024).toFixed(2) + ' КБ';
            document.getElementById('file-info').style.display = 'block';
            document.getElementById('process-btn').disabled = false;
        }
    });
    
    document.getElementById('process-btn').addEventListener('click', processCSVFile);
    
    // Добавление торгового аппарата
    document.getElementById('add-vm-btn').addEventListener('click', function() {
        showModal('add-vm-modal');
    });
    
    document.getElementById('add-vm-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await addVendingMachine();
    });
    
    // Создание заявки
    document.getElementById('create-request-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await addMaintenanceRequest();
    });
    
    // Добавление ТО
    document.getElementById('add-maintenance-btn').addEventListener('click', function() {
        showModal('add-maintenance-modal');
    });
    
    document.getElementById('add-maintenance-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await addMaintenanceRecord();
    });
    
    // Выход из системы
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            showNotification('Выход выполнен', 'info');
            // В реальном приложении здесь будет редирект на страницу входа
        }
    });
    
    // Установка даты по умолчанию в формах
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('request-date').value = today;
    document.getElementById('maintenance-date').value = today;
    document.getElementById('vm-manufacture-date').value = today;
    document.getElementById('vm-commission-date').value = today;
}

function showPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Удалить активный класс у всех пунктов меню
    document.querySelectorAll('.nav-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Показать выбранную страницу
    switch(pageId) {
        case 'ta':
            document.getElementById('ta-content').style.display = 'block';
            document.getElementById('menu-ta').classList.add('active');
            break;
        case 'calendar':
            document.getElementById('calendar-content').style.display = 'block';
            document.getElementById('menu-calendar').classList.add('active');
            renderCalendar();
            break;
        case 'schedule':
            document.getElementById('schedule-content').style.display = 'block';
            document.getElementById('menu-schedule').classList.add('active');
            renderWorkSchedule();
            break;
    }
}

// === ФУНКЦИОНАЛ РАЗДЕЛА "ТОРГОВЫЕ АППАРАТЫ" ===
async function renderVendingMachinesTable() {
    const tableBody = document.getElementById('ta-table-body');
    tableBody.innerHTML = '';
    
    if (appData.vendingMachines.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Нет данных о торговых аппаратах</td></tr>';
        return;
    }
    
    appData.vendingMachines.forEach((vm, index) => {
        const row = document.createElement('tr');
        const nextFixingDate = vm.DateOfNextFixing ? new Date(vm.DateOfNextFixing) : null;
        const today = new Date();
        
        // Определяем статус следующего ТО
        let statusClass = '';
        let statusText = '';
        
        if (nextFixingDate) {
            const diffTime = nextFixingDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                statusClass = 'status-inactive';
                statusText = 'Просрочено';
            } else if (diffDays <= 5) {
                statusClass = 'status-inactive';
                statusText = 'Скоро';
            } else {
                statusClass = 'status-active';
                statusText = 'По плану';
            }
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td title="${vm.Location}">${vm.Location.substring(0, 30)}...</td>
            <td>${vm.Model}</td>
            <td>${vm.PaymentType || 'Не указан'}</td>
            <td>${formatCurrency(vm.FullIncome)}</td>
            <td class="${vm.StatusName === 'Работает' ? 'status-active' : 'status-inactive'}">
                ${vm.StatusName}
            </td>
            <td>${vm.CountryName}</td>
            <td>${formatDate(vm.LastVerificationDate)}</td>
            <td class="${statusClass}">${nextFixingDate ? formatDate(nextFixingDate) : 'Не указано'}</td>
            <td>
                <button onclick="viewMaintenance(${index})" style="padding: 4px 8px; font-size: 12px;">ТО</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(amount);
}

async function addVendingMachine() {
    try {
        const formData = {
            Location: document.getElementById('vm-location').value,
            Model: document.getElementById('vm-model').value,
            PaymentTypeID: parseInt(document.getElementById('vm-payment-type').value),
            FullIncome: parseFloat(document.getElementById('vm-income').value) || 0,
            SerialNumber: document.getElementById('vm-serial').value,
            InventoryNumber: document.getElementById('vm-inventory').value,
            Manufacturer: document.getElementById('vm-manufacturer').value,
            ManufactureDate: document.getElementById('vm-manufacture-date').value,
            DateOfCommissioning: document.getElementById('vm-commission-date').value,
            LastVerificationDate: document.getElementById('vm-commission-date').value,
            VerificationInterval: 6,
            ResourceHours: 2000,
            DateOfNextFixing: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
            MaintenanceTimeHours: 4,
            MachineStatusID: parseInt(document.getElementById('vm-status').value),
            CountryID: parseInt(document.getElementById('vm-country').value),
            InventoryDate: new Date().toISOString().split('T')[0],
            LastCheckedByUserID: parseInt(document.getElementById('vm-user').value)
        };
        
        const response = await ApiService.post(API_CONFIG.ENDPOINTS.ADD_VENDING_MACHINE, formData);
        
        if (response.message) {
            showNotification('Торговый аппарат успешно добавлен', 'success');
            hideModal('add-vm-modal');
            
            // Перезагружаем данные
            await loadInitialData();
            await renderVendingMachinesTable();
            
            // Сбрасываем форму
            document.getElementById('add-vm-form').reset();
        } else {
            throw new Error(response.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('Error adding vending machine:', error);
        showNotification(`Ошибка при добавлении аппарата: ${error.message}`, 'error');
    }
}

async function processCSVFile() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Пожалуйста, выберите файл для загрузки', 'warning');
        return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('validation-errors').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    
    try {
        // Создаем FormData для отправки файла
        const formData = new FormData();
        formData.append('file', file);
        
        // Отправляем файл на сервер
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADD_VENDING_MACHINE}`, {
            method: 'POST',
            body: formData
            // Не устанавливаем Content-Type, чтобы браузер установил его автоматически с boundary
        });
        
        const result = await response.json();
        
        document.getElementById('loading').style.display = 'none';
        
        if (response.status === 201 || response.status === 207) {
            if (result.success) {
                // Успешная загрузка
                document.getElementById('processed-count').textContent = result.processed;
                document.getElementById('success-message').style.display = 'block';
                
                showNotification(result.message, 'success');
                
                // Перезагружаем данные
                await loadInitialData();
                await renderVendingMachinesTable();
                resetUploadForm();
                
                // Если есть ошибки (статус 207), показываем их
                if (response.status === 207 && result.errors && result.errors.length > 0) {
                    const errorList = document.getElementById('error-list');
                    errorList.innerHTML = '';
                    
                    // Показываем первые 10 ошибок
                    result.errors.slice(0, 10).forEach(error => {
                        const li = document.createElement('li');
                        li.textContent = error;
                        errorList.appendChild(li);
                    });
                    
                    if (result.errors.length > 10) {
                        const li = document.createElement('li');
                        li.textContent = `... и еще ${result.errors.length - 10} ошибок`;
                        errorList.appendChild(li);
                    }
                    
                    document.getElementById('validation-errors').style.display = 'block';
                    showNotification(`Загружено с ошибками: ${result.message}`, 'warning');
                }
            } else {
                // Ошибки при обработке
                const errorList = document.getElementById('error-list');
                errorList.innerHTML = '';
                
                if (result.errors && result.errors.length > 0) {
                    result.errors.slice(0, 10).forEach(error => {
                        const li = document.createElement('li');
                        li.textContent = error;
                        errorList.appendChild(li);
                    });
                    
                    if (result.errors.length > 10) {
                        const li = document.createElement('li');
                        li.textContent = `... и еще ${result.errors.length - 10} ошибок`;
                        errorList.appendChild(li);
                    }
                } else {
                    const li = document.createElement('li');
                    li.textContent = result.message || 'Неизвестная ошибка';
                    errorList.appendChild(li);
                }
                
                document.getElementById('validation-errors').style.display = 'block';
                showNotification(result.message || 'Ошибка при загрузке файла', 'error');
            }
        } else {
            // Серверная ошибка
            const errorList = document.getElementById('error-list');
            errorList.innerHTML = '';
            
            const li = document.createElement('li');
            li.textContent = result.error || `Ошибка сервера: ${response.status}`;
            errorList.appendChild(li);
            
            document.getElementById('validation-errors').style.display = 'block';
            showNotification(result.error || `Ошибка сервера: ${response.status}`, 'error');
        }
        
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        
        const errorList = document.getElementById('error-list');
        errorList.innerHTML = '';
        
        const li = document.createElement('li');
        li.textContent = `Сетевая ошибка: ${error.message}`;
        errorList.appendChild(li);
        
        document.getElementById('validation-errors').style.display = 'block';
        showNotification(`Сетевая ошибка: ${error.message}`, 'error');
        console.error('CSV upload error:', error);
    }
}

function resetUploadForm() {
    document.getElementById('csv-file').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('process-btn').disabled = true;
}

function viewMaintenance(vmIndex) {
    const vm = appData.vendingMachines[vmIndex];
    const vmMaintenance = appData.maintenance.filter(m => m.MachineID === vmIndex + 1);
    
    let message = `Техническое обслуживание аппарата: ${vm.Model}\n`;
    message += `Местоположение: ${vm.Location}\n\n`;
    
    if (vmMaintenance.length > 0) {
        message += 'История ТО:\n';
        vmMaintenance.forEach(m => {
            message += `${formatDate(m.MaintenanceDate)}: ${m.Description}\n`;
            if (m.Problems) {
                message += `  Проблемы: ${m.Problems}\n`;
            }
            message += '\n';
        });
    } else {
        message += 'Нет записей о техническом обслуживании';
    }
    
    alert(message);
}

function editVendingMachine(vmIndex) {
    const vm = appData.vendingMachines[vmIndex];
    showNotification(`Редактирование аппарата ${vm.Model} - функционал в разработке`, 'info');
}

// === ФУНКЦИОНАЛ РАЗДЕЛА "КАЛЕНДАРЬ ОБСЛУЖИВАНИЯ" ===
function renderCalendar() {
    const calendarView = document.getElementById('calendar-view');
    
    if (appData.calendarView === 'year') {
        renderYearCalendar(calendarView);
    } else if (appData.calendarView === 'month') {
        renderMonthCalendar(calendarView);
    } else {
        renderWeekCalendar(calendarView);
    }
}

function renderYearCalendar(container) {
    container.innerHTML = '<div class="year-calendar" id="year-calendar"></div>';
    const yearContainer = document.getElementById('year-calendar');
    
    const currentYear = appData.currentDate.getFullYear();
    
    // Фиксированная дата для сравнения - 16 февраля 2026
    const targetDate = new Date('2026-02-16');
    targetDate.setHours(0, 0, 0, 0);
    
    // Границы для желтого периода
    const yellowStart = new Date('2026-02-16');
    yellowStart.setHours(0, 0, 0, 0);
    const yellowEnd = new Date('2026-02-21');
    yellowEnd.setHours(23, 59, 59, 999);
    
    // Получаем выбранный ТА
    const selectedTA = appData.selectedTA;
    console.log('Выбранный ТА:', selectedTA);
    
    // Фильтруем аппараты для отображения
    let vendingMachinesToShow = [];
    if (selectedTA && selectedTA !== '') {
        // Показываем только выбранный ТА
        const selectedIndex = parseInt(selectedTA) - 1;
        if (selectedIndex >= 0 && selectedIndex < appData.vendingMachines.length) {
            vendingMachinesToShow = [appData.vendingMachines[selectedIndex]];
            console.log('Показываем только ТА:', vendingMachinesToShow[0].Model);
        }
    } else {
        // Показываем все ТА
        vendingMachinesToShow = appData.vendingMachines;
        console.log('Показываем все ТА');
    }
    
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        
        const monthTitle = document.createElement('div');
        monthTitle.className = 'month-title';
        monthTitle.textContent = getMonthName(month) + ' ' + currentYear;
        monthContainer.appendChild(monthTitle);
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = воскресенье
        
        // Корректировка для понедельника как первого дня недели
        const adjustedStartDay = startingDay === 0 ? 6 : startingDay - 1;
        
        // Пустые ячейки для дней предыдущего месяца
        for (let i = 0; i < adjustedStartDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            monthGrid.appendChild(emptyCell);
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = day;
            
            const cellDate = new Date(currentYear, month, day);
            cellDate.setHours(0, 0, 0, 0);
            
            // Формируем строку даты для поиска событий
            const dateStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Получаем события для этой даты с учетом выбранного ТА
            const events = getServiceEventsForDate(dateStr, vendingMachinesToShow);
            
            // Если есть события - окрашиваем ячейку
            if (events.length > 0) {
                // Определяем цвет на основе даты события
                if (cellDate < targetDate) {
                    // Дата раньше 16 февраля 2026 - КРАСНЫЙ
                    dayCell.style.backgroundColor = '#e74c3c';
                    dayCell.style.color = 'white';
                    dayCell.classList.add('overdue');
                } 
                else if (cellDate >= yellowStart && cellDate <= yellowEnd) {
                    // Дата с 16 по 21 февраля 2026 - ЖЕЛТЫЙ
                    dayCell.style.backgroundColor = '#f1c40f';
                    dayCell.style.color = '#333';
                    dayCell.classList.add('upcoming');
                }
                else if (cellDate > yellowEnd) {
                    // Дата позже 21 февраля 2026 - ЗЕЛЕНЫЙ
                    dayCell.style.backgroundColor = '#27ae60';
                    dayCell.style.color = 'white';
                    dayCell.classList.add('planned');
                }
                
                // Добавляем подсказку с информацией о событиях
                const tooltip = document.createElement('div');
                tooltip.className = 'calendar-tooltip';
                
                let tooltipText = '';
                if (selectedTA && selectedTA !== '') {
                    // Для одного ТА - краткая информация
                    tooltipText = `📅 ${events[0].vmName}\n${events[0].description}`;
                } else {
                    // Для всех ТА - список всех событий
                    tooltipText = '📅 События ТО:\n';
                    events.forEach(event => {
                        tooltipText += `• ${event.vmName}\n  ${event.description}\n`;
                    });
                }
                
                tooltip.textContent = tooltipText;
                dayCell.appendChild(tooltip);
            } else {
                // Если событий нет - ячейка без фона
                dayCell.style.backgroundColor = 'transparent';
                dayCell.style.color = '#333';
            }
            
            // Если сегодня (для выделения границей)
            if (cellDate.toDateString() === targetDate.toDateString()) {
                dayCell.classList.add('today');
                dayCell.style.border = '2px solid #3498db';
            }
            
            monthGrid.appendChild(dayCell);
        }
        
        monthContainer.appendChild(monthGrid);
        yearContainer.appendChild(monthContainer);
    }
}

function getServiceEventsForDate(dateStr, vendingMachinesToShow = null) {
    const events = [];
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    // Используем переданный список аппаратов или все, если не указан
    let vendingMachines = vendingMachinesToShow || appData.vendingMachines;
    
    // Если выбран конкретный ТА, но список не передан - используем фильтрацию по selectedTA
    if (!vendingMachinesToShow && appData.selectedTA && appData.selectedTA !== '') {
        const selectedIndex = parseInt(appData.selectedTA) - 1;
        if (selectedIndex >= 0 && selectedIndex < appData.vendingMachines.length) {
            vendingMachines = [appData.vendingMachines[selectedIndex]];
        }
    }
    
    console.log(`Поиск событий для даты ${dateStr} по ${vendingMachines.length} аппаратам`);
    
    // Проверяем даты следующего ТО из данных аппаратов
    vendingMachines.forEach((vm, index) => {
        // Проверяем разные возможные названия поля с датой ТО
        let nextFixingDateStr = vm.DateOfNextFixing || vm.dateOfNextFixing || vm.nextFixingDate;
        
        if (nextFixingDateStr) {
            try {
                const nextFixingDate = new Date(nextFixingDateStr);
                nextFixingDate.setHours(0, 0, 0, 0);
                
                if (!isNaN(nextFixingDate.getTime()) && 
                    nextFixingDate.toDateString() === checkDate.toDateString()) {
                    
                    console.log(`✅ Найдено событие: ${vm.Model} на ${nextFixingDateStr}`);
                    
                    events.push({
                        vmName: vm.Model || 'Неизвестный аппарат',
                        description: `📍 ${vm.Location || 'местоположение не указано'}\n   📅 Плановое ТО`,
                        type: 'maintenance',
                        date: nextFixingDateStr
                    });
                }
            } catch (error) {
                console.warn(`Ошибка обработки даты ТО: ${nextFixingDateStr}`, error);
            }
        }
    });
    
    // Также проверяем записи о выполненном ТО из истории
    if (appData.maintenance && Array.isArray(appData.maintenance)) {
        appData.maintenance.forEach(maintenance => {
            try {
                const maintenanceDate = new Date(maintenance.MaintenanceDate);
                maintenanceDate.setHours(0, 0, 0, 0);
                
                if (!isNaN(maintenanceDate.getTime()) && 
                    maintenanceDate.toDateString() === checkDate.toDateString()) {
                    
                    // Находим аппарат для этого обслуживания
                    const vm = vendingMachines.find(v => 
                        (v.MachineID && v.MachineID == maintenance.MachineID) || 
                        (maintenance.MachineID && appData.vendingMachines.indexOf(v) + 1 == maintenance.MachineID)
                    );
                    
                    // Если аппарат найден в текущем списке (или если показываем все)
                    if (vm) {
                        console.log(`✅ Найдена запись о выполненном ТО на ${maintenance.MaintenanceDate}`);
                        
                        events.push({
                            vmName: vm.Model || `Аппарат #${maintenance.MachineID}`,
                            description: `🔧 Выполнено: ${maintenance.Description || 'ТО'}\n   ${maintenance.Problems ? '⚠️ ' + maintenance.Problems : ''}`,
                            type: 'completed',
                            date: maintenance.MaintenanceDate
                        });
                    }
                }
            } catch (error) {
                console.warn(`Ошибка обработки даты обслуживания`, error);
            }
        });
    }
    
    return events;
}

function updateTASelect() {
    const taSelect = document.getElementById('ta-select');
    if (!taSelect) return;
    
    taSelect.innerHTML = '<option value="">-- Все ТА --</option>';
    
    appData.vendingMachines.forEach((vm, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Индекс + 1 как ID
        option.textContent = `${vm.Model} - ${vm.Location.substring(0, 30)}...`;
        taSelect.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если было
    if (appData.selectedTA) {
        taSelect.value = appData.selectedTA;
    }
}

function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

function renderMonthCalendar(container) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">Для просмотра календаря выберите "Год"</div>';
}

function renderWeekCalendar(container) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">Для просмотра календаря выберите "Год"</div>';
}

// === ФУНКЦИОНАЛ РАЗДЕЛА "ГРАФИК РАБОТ" ===
async function renderWorkSchedule() {
    const scheduleContainer = document.getElementById('employee-schedule');
    scheduleContainer.innerHTML = '';
    
    if (appData.users.length === 0) {
        scheduleContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Нет данных о сотрудниках</div>';
        return;
    }
    
    // Группируем техническое обслуживание по исполнителям
    const maintenanceByEmployee = {};
    appData.maintenance.forEach(m => {
        if (!maintenanceByEmployee[m.DoneByUser]) {
            maintenanceByEmployee[m.DoneByUser] = [];
        }
        maintenanceByEmployee[m.DoneByUser].push(m);
    });
    
    // Отображаем карточки сотрудников
    appData.users.forEach(user => {
        if (user.Role === 'Оператор' || user.Role === 'Администратор') {
            const employeeMaintenance = maintenanceByEmployee[user.FullName] || [];
            const recentMaintenance = employeeMaintenance
                .sort((a, b) => new Date(b.MaintenanceDate) - new Date(a.MaintenanceDate))
                .slice(0, 5); // Показываем последние 5 записей
            
            const employeeCard = document.createElement('div');
            employeeCard.className = 'employee-card';
            
            employeeCard.innerHTML = `
                <div class="employee-header">
                    <div class="employee-name">${user.FullName}</div>
                    <div class="task-count">${employeeMaintenance.length} задач</div>
                </div>
                <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 10px;">
                    Роль: ${user.Role}, Контакты: ${user.Contacts}
                </div>
                <div style="font-size: 13px; margin-bottom: 15px;">
                    Всего выполнено ТО: ${employeeMaintenance.length}
                </div>
                <div>
                    <div style="font-weight: bold; margin-bottom: 10px;">Последние задания:</div>
                    ${recentMaintenance.length > 0 ? recentMaintenance.map(task => {
                        const vm = appData.vendingMachines[task.MachineID - 1];
                        return `
                            <div class="task-item">
                                <div><strong>${formatDate(task.MaintenanceDate)}</strong> - ${vm ? vm.Model : 'Аппарат #' + task.MachineID}</div>
                                <div style="font-size: 12px; color: #666;">${task.Description.substring(0, 50)}...</div>
                                ${task.Problems ? `<div style="font-size: 11px; color: #e74c3c;">Проблемы: ${task.Problems.substring(0, 30)}...</div>` : ''}
                            </div>
                        `;
                    }).join('') : '<div style="font-size: 12px; color: #7f8c8d; padding: 10px; text-align: center;">Нет выполненных заданий</div>'}
                </div>
            `;
            
            scheduleContainer.appendChild(employeeCard);
        }
    });
}

async function addMaintenanceRequest() {
    try {
        const formData = {
            MachineID: parseInt(document.getElementById('request-ta').value),
            MaintenanceDate: document.getElementById('request-date').value,
            Description: document.getElementById('request-description').value,
            Problems: document.getElementById('request-problems').value || '',
            DoneByUserID: parseInt(document.getElementById('request-employee').value)
        };
        
        const response = await ApiService.post(API_CONFIG.ENDPOINTS.ADD_MAINTENANCE, formData);
        
        if (response.message) {
            showNotification('Заявка на обслуживание успешно создана', 'success');
            hideModal('create-request-modal');
            
            // Перезагружаем данные
            await loadInitialData();
            await renderWorkSchedule();
            
            // Сбрасываем форму
            document.getElementById('create-request-form').reset();
            
            // Устанавливаем дату по умолчанию
            document.getElementById('request-date').value = new Date().toISOString().split('T')[0];
        } else {
            throw new Error(response.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('Error adding maintenance request:', error);
        showNotification(`Ошибка при создании заявки: ${error.message}`, 'error');
    }
}

async function addMaintenanceRecord() {
    try {
        const formData = {
            MachineID: parseInt(document.getElementById('maintenance-ta').value),
            MaintenanceDate: document.getElementById('maintenance-date').value,
            Description: document.getElementById('maintenance-description').value,
            Problems: document.getElementById('maintenance-problems').value || '',
            DoneByUserID: parseInt(document.getElementById('maintenance-employee').value)
        };
        
        const response = await ApiService.post(API_CONFIG.ENDPOINTS.ADD_MAINTENANCE, formData);
        
        if (response.message) {
            showNotification('Запись о техническом обслуживании успешно добавлена', 'success');
            hideModal('add-maintenance-modal');
            
            // Перезагружаем данные
            await loadInitialData();
            await renderWorkSchedule();
            await renderVendingMachinesTable();
            
            // Сбрасываем форму
            document.getElementById('add-maintenance-form').reset();
            
            // Устанавливаем дату по умолчанию
            document.getElementById('maintenance-date').value = new Date().toISOString().split('T')[0];
        } else {
            throw new Error(response.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('Error adding maintenance record:', error);
        showNotification(`Ошибка при добавлении ТО: ${error.message}`, 'error');
    }
}

// Глобальные функции для вызова из HTML
window.viewMaintenance = viewMaintenance;
window.editVendingMachine = editVendingMachine;
window.showModal = showModal;
window.hideModal = hideModal;

// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar when menu item is clicked
    document.getElementById('menu-calendar').addEventListener('click', function(e) {
        e.preventDefault();
        loadCalendarData();
    });

    // View selector buttons
    document.getElementById('view-all').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('view-single').classList.remove('active');
        document.getElementById('ta-filter').style.display = 'none';
        loadCalendarData(); // Reload calendar with all TAs
    });

    document.getElementById('view-single').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('view-all').classList.remove('active');
        document.getElementById('ta-filter').style.display = 'flex';
        loadCalendarData(); // Reload calendar with selected TA
    });

    // Period selector
    document.getElementById('period-select').addEventListener('change', function() {
        showCalendarView(this.value);
    });

    // Initialize with all TAs view
    document.getElementById('view-all').classList.add('active');
});

// Function to get maintenance data from appData
function getMaintenanceData() {
    // Combine maintenance data with vending machine information
    if (!appData || !appData.maintenance || !Array.isArray(appData.maintenance)) {
        console.warn('Maintenance data not available or not an array');
        return [];
    }
    
    if (!appData || !appData.vendingMachines || !Array.isArray(appData.vendingMachines)) {
        console.warn('Vending machines data not available or not an array');
        return appData.maintenance.map(maint => ({
            id: maint.MaintenanceID || maint.id || Math.random(),
            machineId: maint.MachineID,
            model: 'Unknown Model',
            location: 'Unknown Location',
            franchiser: 'Unknown Manufacturer',
            date: maint.MaintenanceDate || maint.Date
        })).filter(item => item.date);
    }
    
    return appData.maintenance.map(maint => {
        // Find corresponding vending machine
        const vm = appData.vendingMachines.find(vm => vm.MachineID === maint.MachineID);
        
        return {
            id: maint.MaintenanceID || maint.id || Math.random(),
            machineId: maint.MachineID,
            model: vm ? vm.Model : 'Unknown Model',
            location: vm ? vm.Location : 'Unknown Location',
            franchiser: vm ? vm.Manufacturer : 'Unknown Manufacturer',
            date: maint.MaintenanceDate || maint.Date
        };
    }).filter(item => item.date); // Only include items with a date
}

async function loadCalendarData() {
    try {
        // Show loading indicator
        const loadingEl = document.getElementById('calendar-loading');
        const containerEl = document.getElementById('calendar-container');
        
        if (!loadingEl || !containerEl) {
            console.error('Calendar elements not found');
            return;
        }
        
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';

        // Wait a bit to ensure data is loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        // DEBUG: Log date calculations
        debugDateCalculation();

        // Hide loading, show calendar
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

        // Determine which view to show based on period selection
        const period = document.getElementById('period-select')?.value || 'year';
        showCalendarView(period);
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showNotification('Ошибка при загрузке календаря обслуживания', 'error');
    }
}

function showCalendarView(viewType) {
    // Make sure calendar container is visible
    const calendarContainer = document.getElementById('calendar-container');
    if (calendarContainer) {
        calendarContainer.style.display = 'block';
    } else {
        console.error('Calendar container not found');
        return;
    }

    // Hide all views
    const yearView = document.getElementById('year-view');
    const monthView = document.getElementById('month-view');
    const weekView = document.getElementById('week-view');
    
    if (yearView) yearView.style.display = 'none';
    if (monthView) monthView.style.display = 'none';
    if (weekView) weekView.style.display = 'none';

    switch(viewType) {
        case 'year':
            renderYearView();
            if (yearView) yearView.style.display = 'grid';
            break;
        case 'month':
            renderMonthView();
            if (monthView) monthView.style.display = 'block';
            break;
        case 'week':
            renderWeekView();
            if (weekView) weekView.style.display = 'block';
            break;
    }
}

function renderYearView() {
    const yearContainer = document.getElementById('year-view');
    if (!yearContainer) {
        console.error('Year view container not found');
        return;
    }
    yearContainer.innerHTML = ''; // Clear previous content

    const today = new Date();
    const year = today.getFullYear();

    // Create 12 month containers
    for (let month = 0; month < 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-container';
        
        const monthTitle = document.createElement('div');
        monthTitle.className = 'month-title';
        monthTitle.textContent = getMonthName(month) + ' ' + year;
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Calculate days for this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            monthGrid.appendChild(emptyCell);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            
            const fullDate = new Date(year, month, day);
            const dateStr = fullDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            
            dayCell.textContent = day;
            
            // Check if this date has maintenance events
            const events = getEventsForDate(dateStr);
            if (events.length > 0) {
                // Apply color based on event type
                const eventType = determineEventType(dateStr);
                dayCell.classList.add(eventType);
                
                // Add tooltip with TA info
                const tooltip = document.createElement('div');
                tooltip.className = 'calendar-tooltip';
                tooltip.innerHTML = createTooltipContent(events);
                dayCell.appendChild(tooltip);
            }
            
            monthGrid.appendChild(dayCell);
        }
        
        monthDiv.appendChild(monthTitle);
        monthDiv.appendChild(monthGrid);
        yearContainer.appendChild(monthDiv);
    }
}

function renderMonthView() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Update month title
    const monthTitle = document.getElementById('current-month-title');
    if (!monthTitle) {
        console.error('Month title element not found');
        return;
    }
    monthTitle.textContent = getMonthName(month) + ' ' + year;
    
    const monthGrid = document.getElementById('month-grid');
    if (!monthGrid) {
        console.error('Month grid element not found');
        return;
    }
    monthGrid.innerHTML = ''; // Clear previous content
    
    // Add day headers
    const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach(header => {
        const headerCell = document.createElement('div');
        headerCell.className = 'day-header';
        headerCell.textContent = header;
        headerCell.style.fontWeight = 'bold';
        headerCell.style.textAlign = 'center';
        headerCell.style.padding = '5px';
        monthGrid.appendChild(headerCell);
    });
    
    // Calculate days for this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adjust for Monday as first day of week (Sunday is 0)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        monthGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        
        const fullDate = new Date(year, month, day);
        const dateStr = fullDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        dayCell.textContent = day;
        
        // Check if this date has maintenance events
        const events = getEventsForDate(dateStr);
        if (events.length > 0) {
            // Apply color based on event type
            const eventType = determineEventType(dateStr);
            dayCell.classList.add(eventType);
            
            // Add tooltip with TA info
            const tooltip = document.createElement('div');
            tooltip.className = 'calendar-tooltip';
            tooltip.innerHTML = createTooltipContent(events);
            dayCell.appendChild(tooltip);
        }
        
        // Highlight today
        if (fullDate.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        monthGrid.appendChild(dayCell);
    }
}

function renderWeekView() {
    const today = new Date();
    const weekStart = getWeekStart(today);
    
    // Update week title
    const weekTitle = document.getElementById('current-week-title');
    if (!weekTitle) {
        console.error('Week title element not found');
        return;
    }
    weekTitle.textContent = 
        `Неделя ${getWeekNumber(today)}, ${today.getFullYear()}`;
    
    const weekGrid = document.getElementById('week-grid');
    if (!weekGrid) {
        console.error('Week grid element not found');
        return;
    }
    weekGrid.innerHTML = ''; // Clear previous content
    
    // Add day headers and day cells for 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '5px';
        dayHeader.textContent = `${getDayOfWeek(date)}, ${date.getDate()} ${getMonthNameShort(date.getMonth())}`;
        weekGrid.appendChild(dayHeader);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        
        const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // Check if this date has maintenance events
        const events = getEventsForDate(dateStr);
        if (events.length > 0) {
            // Apply color based on event type
            const eventType = determineEventType(dateStr);
            dayCell.classList.add(eventType);
            
            // Add tooltip with TA info
            const tooltip = document.createElement('div');
            tooltip.className = 'calendar-tooltip';
            tooltip.innerHTML = createTooltipContent(events);
            dayCell.appendChild(tooltip);
        }
        
        // Highlight today
        if (date.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        weekGrid.appendChild(dayCell);
    }
}

// Helper functions
function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

function getMonthNameShort(monthIndex) {
    const months = [
        'янв', 'фев', 'мар', 'апр', 'май', 'июн',
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    return months[monthIndex];
}

function getDayOfWeek(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
}

function getWeekStart(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
}

function getEventsForDate(dateStr) {
    // Filter maintenance events for the specific date
    return getMaintenanceData().filter(event => event.date === dateStr);
}

// Функция для определения типа события на основе даты относительно 16 февраля 2026
function determineEventType(dateStr) {
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0); // Сбрасываем время
    
    // Фиксированная дата - 16 февраля 2026
    const targetDate = new Date('2026-02-16');
    targetDate.setHours(0, 0, 0, 0);
    
    // Вычисляем разницу в днях
    const timeDiff = eventDate.getTime() - targetDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log(`Дата события: ${dateStr}, день ${dayDiff} от 16.02.2026`);
    
    if (dayDiff < 0) {
        return 'overdue'; // Красный - дата раньше 16 февраля
    } else if (dayDiff >= 0 && dayDiff <= 5) {
        // С 16 по 21 февраля включительно (0-5 дней)
        return 'upcoming'; // Желтый
    } else {
        return 'planned'; // Зеленый - позже 21 февраля
    }
}

// Debug function to test date calculation
function debugDateCalculation() {
    const today = new Date();
    console.log('Current date:', today.toISOString().split('T')[0]);
    console.log('App data maintenance count:', appData?.maintenance?.length || 0);
    console.log('App data vending machines count:', appData?.vendingMachines?.length || 0);
    
    const maintenanceData = getMaintenanceData();
    console.log('Filtered maintenance data count:', maintenanceData.length);
    
    maintenanceData.forEach(event => {
        const eventType = determineEventType(event.date);
        const eventDate = new Date(event.date);
        const timeDiff = eventDate.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        console.log(`${event.date} (${event.model}): ${eventType}, days diff: ${dayDiff}`);
    });
}

function createTooltipContent(events) {
    let content = '<div style="font-weight: bold; margin-bottom: 5px;">Обслуживание ТА:</div>';
    events.forEach(event => {
        content += `<div><strong>Модель:</strong> ${event.model}</div>`;
        content += `<div><strong>Место:</strong> ${event.location}</div>`;
        content += `<div><strong>Франчайзер:</strong> ${event.franchiser}</div>`;
        content += '<hr style="margin: 5px 0;">';
    });
    return content;
}