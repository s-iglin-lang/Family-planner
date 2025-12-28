// ===== ДАННЫЕ =====

const users = [
    { name: "Сергей",  pin: "1405", isAdmin: true },
    { name: "Валерия", pin: "1111", isAdmin: false }
];

let currentUser = null;

const categories = [
    { id: "home",   name: "Дом",      icon: "🏠", color: "#4caf50" },
    { id: "work",   name: "Работа",   icon: "💼", color: "#2196f3" },
    { id: "shop",   name: "Покупки",  icon: "🛒", color: "#ff9800" },
    { id: "other",  name: "Другое",   icon: "⭐",  color: "#9c27b0" }
];

const MONTH_NAMES_RU = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

const userCategoryAccess = {
    "1405": ["home", "work", "shop", "other"], // PIN Сергея
    "1111": ["home", "shop", "other"]          // PIN Валерии
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДАТ =====

function getTodayString() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

function getTomorrowString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

function formatDateRus(dateStr) {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
}

function startOfDay(d) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
}

function isInCurrentMonth(date) {
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
    );
}

// ===== ТЕСТОВЫЕ ЗАДАЧИ + localStorage =====

const defaultTasks = [];

const TASKS_STORAGE_KEY = "family_planner_tasks";
const LAST_USER_KEY = "family_planner_last_user";

let tasks = loadTasksFromStorage();

function loadTasksFromStorage() {
    try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        if (!raw) {
            return [...defaultTasks];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...defaultTasks];
        }
        return parsed;
    } catch (e) {
        console.warn("Не удалось прочитать задачи из localStorage:", e);
        return [...defaultTasks];
    }
}

function saveTasksToStorage() {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.warn("Не удалось сохранить задачи в localStorage:", e);
    }
}

// ===== ОБЩИЕ ФУНКЦИИ (НЕ DOM) =====

function getAccessibleCategoriesForCurrentUser() {
    if (!currentUser) return [];
    const allowedIds = userCategoryAccess[currentUser.pin] || [];
    return categories.filter(cat => allowedIds.includes(cat.id));
}

function showCategoriesForCurrentUser() {
    const accessible = getAccessibleCategoriesForCurrentUser();
    if (accessible.length === 0) {
        alert("Нет доступных категорий");
        return;
    }

    const lines = accessible.map(cat => `${cat.icon} ${cat.name}`);
    alert("Ваши категории:\n\n" + lines.join("\n"));
}

function showCompletedTasksForCurrentUser() {
    if (!currentUser) return;

    const visible = getVisibleTasksForCurrentUser();
    const completed = visible.filter(t => t.completed);

    if (completed.length === 0) {
        alert("Пока нет выполненных задач.");
        return;
    }

    const lines = completed.map(task => {
        const category = categories.find(c => c.id === task.categoryId);
        const dateStr = formatDateRus(task.date);
        let timePart = "";
        if (task.timeStart && task.timeEnd) {
            timePart = `${task.timeStart}–${task.timeEnd}`;
        } else if (task.timeStart) {
            timePart = task.timeStart;
        } else if (task.timeEnd) {
            timePart = task.timeEnd;
        }
        const catLabel = category ? `${category.icon} ${category.name}` : "";
        return `${dateStr} ${timePart ? timePart + " " : ""}- ${catLabel} ${task.title}`;
    });

    alert("Выполненные задачи:\n\n" + lines.join("\n"));
}

function getVisibleTasksForCurrentUser() {
    if (!currentUser) return [];

    return tasks.filter(task => {
        const allowedIds = userCategoryAccess[currentUser.pin] || [];
        if (!allowedIds.includes(task.categoryId)) return false;

        if (task.visibility === "shared") return true;
        if (task.visibility === "personal") return task.owner === currentUser.name;
        return false;
    });
}

function createTaskElement(task) {
    const div = document.createElement("div");
    div.className = "task-item";
    div.dataset.id = String(task.id);

    const category = categories.find(c => c.id === task.categoryId);

    let timePart = "";
    if (task.timeStart && task.timeEnd) {
        timePart = `${task.timeStart}–${task.timeEnd}`;
    } else if (task.timeStart) {
        timePart = task.timeStart;
    } else if (task.timeEnd) {
        timePart = task.timeEnd;
    }

    const prizePart = task.prizeText
        ? `🎁 ${task.prizeText}`
        : "";

    const visibilityLabel = task.visibility === "personal" ? "Лично" : "Общая";

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:6px;">
                <span class="task-complete-toggle" data-id="${task.id}" style="width:16px; height:16px; border-radius:8px; border:2px solid rgba(255,255,255,0.4); display:inline-flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; background:${task.completed ? 'rgba(76,175,80,0.2)' : 'transparent'};">
                    ${task.completed ? "✓" : ""}
                </span>
                <span>${category ? category.icon : ""} ${task.title}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:11px; opacity:0.8;">${visibilityLabel}</span>
                <button class="task-edit-button" data-id="${task.id}" style="border:none; background:transparent; color:#fff; font-size:14px; cursor:pointer; padding:2px 4px; opacity:0.8;">✏️</button>
                <button class="task-delete-button" data-id="${task.id}" style="border:none; background:transparent; color:#f66; font-size:14px; cursor:pointer; padding:2px 4px; opacity:0.8;">🗑️</button>
            </div>
        </div>
        <div style="font-size:11px; opacity:0.8; ${task.completed ? 'text-decoration: line-through; opacity:0.6;' : ''}">
            ${timePart}
        </div>
        ${prizePart ? `<div style="font-size:11px; margin-top:2px; ${task.completed ? 'text-decoration: line-through; opacity:0.6;' : ''}">${prizePart}</div>` : ""}
    `;

    return div;
}

// ===== ВСЁ, ЧТО СВЯЗАНО С DOM =====

document.addEventListener("DOMContentLoaded", () => {
    // ЭКРАН ВХОДА
    const loginScreen = document.getElementById("login-screen");
    const mainScreen = document.getElementById("main-screen");
    const loginNameInput = document.getElementById("login-name");
    const loginPinInput = document.getElementById("login-pin");
    const loginButton = document.getElementById("login-button");
    const loginMessage = document.getElementById("login-message");

    // ВЕРХНЯЯ ПАНЕЛЬ И МЕНЮ
    const menuButton = document.getElementById("menu-button");
    const sideMenu = document.getElementById("side-menu");
    const currentUserLabel = document.getElementById("current-user");
    const sideMenuItems = document.querySelectorAll("#side-menu li");
    
    // ГРУППЫ ЗАДАЧ
    const taskGroupHeaders = document.querySelectorAll(".task-group-header");

    // ФОРМА ЗАДАЧИ
    const addTaskButton = document.getElementById("add-task-button");
    const taskFormContainer = document.getElementById("task-form-container");
    const taskTitleInput = document.getElementById("task-title");
    const taskCategorySelect = document.getElementById("task-category");
    const taskVisibilitySelect = document.getElementById("task-visibility");
    const taskDateInput = document.getElementById("task-date");
    const taskTimeStartInput = document.getElementById("task-time-start");
    const taskTimeEndInput = document.getElementById("task-time-end");
    const taskPrizeInput = document.getElementById("task-prize");
    const taskSaveButton = document.getElementById("task-save-button");
    const taskCancelButton = document.getElementById("task-cancel-button");
    const taskFormMessage = document.getElementById("task-form-message");
    const taskDescriptionInput = document.getElementById("task-description");

    // Модальное окно подробностей
    const taskDetailsModal = document.getElementById("task-details-modal");
    const detailsCloseButton = document.getElementById("details-close-button");
    const detailsTitle = document.getElementById("details-title");
    const detailsDate = document.getElementById("details-date");
    const detailsTime = document.getElementById("details-time");
    const detailsCategory = document.getElementById("details-category");
    const detailsVisibility = document.getElementById("details-visibility");
    const detailsPrize = document.getElementById("details-prize");
    const detailsDescription = document.getElementById("details-description");

    // КАЛЕНДАРЬ
    const calendarPanel = document.getElementById("calendar-panel");
    const calendarCloseButton = document.getElementById("calendar-close-button");
    const calendarMonthLabel = document.getElementById("calendar-month-label");
    const calendarPrevMonth = document.getElementById("calendar-prev-month");
    const calendarNextMonth = document.getElementById("calendar-next-month");
    const calendarGrid = document.getElementById("calendar-grid");
    const calendarTooltip = document.getElementById("calendar-tooltip");

    let calendarYear = new Date().getFullYear();
    let calendarMonth = new Date().getMonth(); // 0-11

    let editingTaskId = null;

    // ===== КАЛЕНДАРЬ (месяц + tooltip) =====

    function renderCalendarMonth() {
        if (!calendarGrid || !calendarMonthLabel) return;

        calendarGrid.innerHTML = "";

        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
        const firstWeekday = (firstDay.getDay() + 6) % 7; // Пн=0, ..., Вс=6
        const daysInMonth = lastDay.getDate();
        const prevMonthLastDay = new Date(calendarYear, calendarMonth, 0).getDate();

        const visible = getVisibleTasksForCurrentUser();
        const tasksByDate = {};
        visible.forEach(task => {
            if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
            tasksByDate[task.date].push(task);
        });

        calendarMonthLabel.textContent =
            `${MONTH_NAMES_RU[calendarMonth]} ${calendarYear}`;

        const todayStr = getTodayString();

        for (let cellIndex = 0; cellIndex < 42; cellIndex++) {
            const cell = document.createElement("div");
            cell.className = "calendar-day-cell";

            let dayNumber;
            let cellDate;

            if (cellIndex < firstWeekday) {
                // дни предыдущего месяца
                dayNumber = prevMonthLastDay - firstWeekday + 1 + cellIndex;
                const d = new Date(calendarYear, calendarMonth - 1, dayNumber);
                cellDate = d.toISOString().slice(0,10);
                cell.classList.add("other-month");
            } else if (cellIndex >= firstWeekday + daysInMonth) {
                // дни следующего месяца
                dayNumber = cellIndex - (firstWeekday + daysInMonth) + 1;
                const d = new Date(calendarYear, calendarMonth + 1, dayNumber);
                cellDate = d.toISOString().slice(0,10);
                cell.classList.add("other-month");
            } else {
                // текущий месяц
                dayNumber = cellIndex - firstWeekday + 1;
                const d = new Date(calendarYear, calendarMonth, dayNumber);
                cellDate = d.toISOString().slice(0,10);
            }

            if (cellDate === todayStr) {
                cell.classList.add("today");
            }

            cell.textContent = dayNumber;

            if (tasksByDate[cellDate] && tasksByDate[cellDate].length > 0) {
                cell.classList.add("has-tasks");

                cell.addEventListener("mouseenter", (e) => {
                    showCalendarTooltip(e.currentTarget, cellDate, tasksByDate[cellDate]);
                });
                cell.addEventListener("mouseleave", () => {
                    hideCalendarTooltip();
                });
            }

            calendarGrid.appendChild(cell);
        }
    }

    function openTaskDetails(task) {
        if (!taskDetailsModal) return;

        const category = categories.find(c => c.id === task.categoryId);
        const dateStr = formatDateRus(task.date);

        let timePart = "";
        if (task.timeStart && task.timeEnd) {
            timePart = `${task.timeStart}–${task.timeEnd}`;
        } else if (task.timeStart) {
            timePart = task.timeStart;
        } else if (task.timeEnd) {
            timePart = task.timeEnd;
        } else {
            timePart = "—";
        }

        const visibilityText = task.visibility === "personal" ? "Личная" :
                               task.visibility === "shared" ? "Общая" : "—";

        detailsTitle.textContent = task.title;
        detailsDate.textContent = dateStr;
        detailsTime.textContent = timePart;
        detailsCategory.textContent = category ? `${category.icon} ${category.name}` : "—";
        detailsVisibility.textContent = visibilityText;
        detailsPrize.textContent = task.prizeText ? task.prizeText : "—";
        detailsDescription.textContent = task.description ? task.description : "—";

        taskDetailsModal.classList.remove("hidden");
    }

    function closeTaskDetails() {
        if (!taskDetailsModal) return;
        taskDetailsModal.classList.add("hidden");
    }

    // Закрытие модалки по крестику
    if (detailsCloseButton) {
        detailsCloseButton.addEventListener("click", () => {
            closeTaskDetails();
        });
    }

    // Закрытие модалки по клику на фон
    if (taskDetailsModal) {
        taskDetailsModal.addEventListener("click", (event) => {
            if (event.target.classList.contains("task-details-backdrop")) {
                closeTaskDetails();
            }
        });
    }

    function handleTaskDetailsClick(event) {
        const editBtn = event.target.closest(".task-edit-button");
        const deleteBtn = event.target.closest(".task-delete-button");
        const toggleEl = event.target.closest(".task-complete-toggle");

        // Если клик по ✏️, 🗑️ или галочке — выходим, этим занимаются другие обработчики
        if (editBtn || deleteBtn || toggleEl) {
            return;
        }

        const taskItem = event.target.closest(".task-item");
        if (!taskItem) return;

        const id = Number(taskItem.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        openTaskDetails(task);
    }

    function showCalendarTooltip(cellEl, dateStr, tasksForDate) {
        if (!calendarTooltip || !calendarPanel) return;

        calendarTooltip.innerHTML = "";

        const dateEl = document.createElement("div");
        dateEl.className = "calendar-tooltip-date";
        dateEl.textContent = formatDateRus(dateStr);
        calendarTooltip.appendChild(dateEl);

        tasksForDate.forEach(task => {
            const category = categories.find(c => c.id === task.categoryId);
            let timePart = "";
            if (task.timeStart && task.timeEnd) {
                timePart = `${task.timeStart}–${task.timeEnd}`;
            } else if (task.timeStart) {
                timePart = task.timeStart;
            } else if (task.timeEnd) {
                timePart = task.timeEnd;
            }
            const catLabel = category ? `${category.icon} ${category.name}` : "";

            const line = document.createElement("div");
            line.className = "calendar-tooltip-task";
            line.textContent =
                (timePart ? timePart + " " : "") +
                (catLabel ? catLabel + " " : "") +
                task.title;

            calendarTooltip.appendChild(line);
        });

        const rect = cellEl.getBoundingClientRect();
        const panelRect = calendarPanel.getBoundingClientRect();
        const offsetLeft = rect.left - panelRect.left;

        calendarTooltip.style.left = `${offsetLeft}px`;
        calendarTooltip.style.bottom = "0";

        calendarTooltip.classList.remove("hidden");
    }

    function hideCalendarTooltip() {
        if (!calendarTooltip) return;
        calendarTooltip.classList.add("hidden");
    }

    if (calendarPrevMonth) {
        calendarPrevMonth.addEventListener("click", () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            renderCalendarMonth();
        });
    }

    if (calendarNextMonth) {
        calendarNextMonth.addEventListener("click", () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderCalendarMonth();
        });
    }

    if (calendarCloseButton) {
        calendarCloseButton.addEventListener("click", () => {
            calendarPanel.classList.add("hidden");
            hideCalendarTooltip();
        });
    }

    // ===== ОБНОВЛЕНИЕ ДАТ «СЕГОДНЯ / ЗАВТРА» =====

    function updateGroupDateLabels() {
        const todayStr = getTodayString();
        const tomorrowStr = getTomorrowString();

        const todayDateLabel = document.getElementById("label-today-date");
        const tomorrowDateLabel = document.getElementById("label-tomorrow-date");

        if (todayDateLabel) {
            todayDateLabel.textContent = formatDateRus(todayStr);
        }
        if (tomorrowDateLabel) {
            tomorrowDateLabel.textContent = formatDateRus(tomorrowStr);
        }
    }

    // ===== РЕНДЕР ЗАДАЧ =====

    function renderTasksForCurrentUser() {
        const tasksTodayEl = document.getElementById("tasks-today");
        const tasksTomorrowEl = document.getElementById("tasks-tomorrow");
        const tasksWeekEl = document.getElementById("tasks-week");
        const tasksMonthEl = document.getElementById("tasks-month");

        tasksTodayEl.innerHTML = "";
        tasksTomorrowEl.innerHTML = "";
        tasksWeekEl.innerHTML = "";
        tasksMonthEl.innerHTML = "";

        const visible = getVisibleTasksForCurrentUser();
        const today = new Date();
        const todayStr = getTodayString();
        const tomorrowStr = getTomorrowString();

        visible.forEach(task => {
            // Выполненные задачи НЕ показываем в обычных списках
            if (task.completed) {
                return;
            }

            const taskDate = new Date(task.date);
            const diffDays = Math.floor((taskDate - startOfDay(today)) / (1000 * 60 * 60 * 24));

            const itemEl = createTaskElement(task);

            if (task.date === todayStr) {
                tasksTodayEl.appendChild(itemEl);
            } else if (task.date === tomorrowStr) {
                tasksTomorrowEl.appendChild(itemEl);
            }

            if (diffDays >= 2 && diffDays <= 6) {
                tasksWeekEl.appendChild(itemEl.cloneNode(true));
            }

            if (
                isInCurrentMonth(taskDate) &&
                task.date !== todayStr &&
                task.date !== tomorrowStr
            ) {
                tasksMonthEl.appendChild(itemEl.cloneNode(true));
            }
        });
    }

    // ===== ОБРАБОТЧИКИ ЗАДАЧ =====

    function handleTaskEditClick(event) {
        const editBtn = event.target.closest(".task-edit-button");
        if (!editBtn) return;

        event.stopPropagation();

        const id = Number(editBtn.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        openTaskForm(task);
    }

    function handleCompleteToggleClick(event) {
        const toggleEl = event.target.closest(".task-complete-toggle");
        if (!toggleEl) return;

        const id = Number(toggleEl.dataset.id);
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        const current = tasks[taskIndex].completed === true;
        tasks[taskIndex].completed = !current;

        saveTasksToStorage();
        renderTasksForCurrentUser();
    }

    function handleTaskDeleteClick(event) {
        const deleteBtn = event.target.closest(".task-delete-button");
        if (!deleteBtn) return;

        event.stopPropagation();

        const id = Number(deleteBtn.dataset.id);
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        const task = tasks[taskIndex];

        if (!confirm(`Удалить задачу:\n\n${task.title}?`)) {
            return;
        }

        tasks.splice(taskIndex, 1);
        saveTasksToStorage();
        renderTasksForCurrentUser();
    }

    // ===== ПОКАЗ / ВЫХОД =====

    function showMainScreen() {
        loginScreen.classList.add("hidden");
        mainScreen.classList.remove("hidden");
        calendarPanel.classList.add("hidden");
        currentUserLabel.textContent = `Профиль: ${currentUser.name}`;
        renderTasksForCurrentUser();
    }

    function handleLogout() {
        currentUser = null;
        mainScreen.classList.add("hidden");
        loginScreen.classList.remove("hidden");
        loginNameInput.value = "";
        loginPinInput.value = "";
        loginMessage.textContent = "";
        sideMenu.classList.add("hidden");
    }

    // ===== ФОРМА ЗАДАЧ =====

    function openTaskForm(task = null) {
        const accessibleCategories = getAccessibleCategoriesForCurrentUser();
        taskCategorySelect.innerHTML = "";
        accessibleCategories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = `${cat.icon} ${cat.name}`;
            taskCategorySelect.appendChild(option);
        });

        if (task) {
            editingTaskId = task.id;

            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || "";
            taskCategorySelect.value = task.categoryId;
            if (task.visibility === "personal" || task.visibility === "shared") {
                taskVisibilitySelect.value = task.visibility;
            } else {
                taskVisibilitySelect.value = "personal";
            }
            taskDateInput.value = task.date;
            taskTimeStartInput.value = task.timeStart || "";
            taskTimeEndInput.value = task.timeEnd || "";
            taskPrizeInput.value = task.prizeText || "";
        } else {
            editingTaskId = null;

            taskTitleInput.value = "";
            taskDescriptionInput.value = "";
            taskVisibilitySelect.value = "personal";
            taskDateInput.value = getTodayString();
            taskTimeStartInput.value = "";
            taskTimeEndInput.value = "";
            taskPrizeInput.value = "";
        }
        taskFormMessage.textContent = "";
        taskFormContainer.classList.remove("hidden");
    }

    function closeTaskForm() {
        editingTaskId = null;
        taskFormContainer.classList.add("hidden");
    }

    // ===== ЛОГИН =====

    function doLogin() {
        const name = loginNameInput.value.trim();
        const pin = loginPinInput.value.trim();

        const user = users.find(
            u => u.name.toLowerCase() === name.toLowerCase() && u.pin === pin
        );

        if (!user) {
            loginMessage.textContent = "Неверное имя или пин-код";
            return;
        }

        loginMessage.textContent = "";
        currentUser = user;
        showMainScreen();

        try {
            localStorage.setItem(LAST_USER_KEY, JSON.stringify({
                name: user.name,
                pin: user.pin
            }));
        } catch (e) {
            console.warn("Не удалось сохранить данные последнего пользователя:", e);
        }
    }

    loginButton.addEventListener("click", doLogin);
    loginNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") doLogin();
    });
    loginPinInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") doLogin();
    });

    // ===== МЕНЮ =====

    menuButton.addEventListener("click", () => {
        sideMenu.classList.toggle("hidden");
    });

    sideMenuItems.forEach(item => {
        item.addEventListener("click", () => {
            const menuType = item.dataset.menu;

            if (menuType === "categories") {
                showCategoriesForCurrentUser();
            } else if (menuType === "calendar") {
                if (!currentUser || !calendarPanel) return;
                calendarPanel.classList.remove("hidden");
                renderCalendarMonth();
            } else if (menuType === "completed") {
                showCompletedTasksForCurrentUser();
            } else if (menuType === "reset") {
                if (confirm("Стереть ВСЕ задачи? Это нельзя отменить.")) {
                    tasks = [];
                    localStorage.removeItem(TASKS_STORAGE_KEY);
                    renderTasksForCurrentUser();
                }
            } else if (menuType === "logout") {
                calendarPanel.classList.add("hidden");
                handleLogout();
                return;
            }

            sideMenu.classList.add("hidden");
        });
    });

    document.addEventListener("click", (event) => {
        const clickInsideMenu = sideMenu.contains(event.target);
        const clickOnMenuButton = menuButton.contains(event.target);

        if (!clickInsideMenu && !clickOnMenuButton) {
            sideMenu.classList.add("hidden");
        }
    });

    // Кнопка "+"
    if (addTaskButton) {
        addTaskButton.addEventListener("click", () => {
            if (!currentUser) return;

            if (taskFormContainer.classList.contains("hidden")) {
                openTaskForm();
            } else {
                closeTaskForm();
            }
        });
    }

    // Кнопки формы
    taskCancelButton.addEventListener("click", () => {
        closeTaskForm();
    });

    taskSaveButton.addEventListener("click", () => {
        if (!currentUser) return;

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const categoryId = taskCategorySelect.value;
        const visibility = taskVisibilitySelect.value || "personal";
        const date = taskDateInput.value;
        const timeStart = taskTimeStartInput.value;
        const timeEnd = taskTimeEndInput.value;
        const prizeText = taskPrizeInput.value.trim();

        if (!title) {
            taskFormMessage.textContent = "Введите название задачи";
            return;
        }
        if (!categoryId) {
            taskFormMessage.textContent = "Выберите категорию";
            return;
        }

        let owner = null;
        if (visibility === "personal") {
            owner = currentUser.name;
        }

        if (editingTaskId !== null) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title,
                    description,
                    categoryId,
                    visibility,
                    owner,
                    date: date || getTodayString(),
                    timeStart: timeStart || "",
                    timeEnd: timeEnd || "",
                    prizeText
                };
            }
        } else {
            const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

            const newTask = {
                id: newId,
                title,
                description,
                categoryId,
                visibility,
                owner,
                date: date || getTodayString(),
                timeStart: timeStart || "",
                timeEnd: timeEnd || "",
                prizeText,
                completed: false
            };

            tasks.push(newTask);
        }

        saveTasksToStorage();
        closeTaskForm();
        renderTasksForCurrentUser();
    });

    // Сворачивание / разворачивание групп
    taskGroupHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const group = header.dataset.group;
            const listElement = document.getElementById(`tasks-${group}`);
            if (!listElement) return;

            listElement.style.display =
                listElement.style.display === "none" ? "block" : "none";
        });
    });

    // ===== ИНИЦИАЛИЗАЦИЯ =====

    function init() {
        try {
            const rawLast = localStorage.getItem(LAST_USER_KEY);
            if (rawLast) {
                const last = JSON.parse(rawLast);
                if (last && typeof last.name === "string" && typeof last.pin === "string") {
                    loginNameInput.value = last.name;
                    loginPinInput.value = last.pin;
                }
            }
        } catch (e) {
            console.warn("Не удалось прочитать данные последнего пользователя:", e);
        }

        loginScreen.classList.remove("hidden");
        mainScreen.classList.add("hidden");
        updateGroupDateLabels();
        document.getElementById("tasks-month").style.display = "none";

        taskFormContainer.classList.add("hidden");

        const lists = [
            document.getElementById("tasks-today"),
            document.getElementById("tasks-tomorrow"),
            document.getElementById("tasks-week"),
            document.getElementById("tasks-month"),
        ];

        lists.forEach(listEl => {
            listEl.addEventListener("click", handleTaskEditClick);
            listEl.addEventListener("click", handleCompleteToggleClick);
            listEl.addEventListener("click", handleTaskDeleteClick);
            listEl.addEventListener("click", handleTaskDetailsClick);
        });
    }

    init();
});