document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementleri ---
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const matrixGrid = document.getElementById('matrixGrid');
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');
    const urgencyAndImportanceToggles = document.querySelectorAll('input[name="urgency"], input[name="importance"]');

    // --- Tarih ve Saat Güncelleme ---
    const updateDateTime = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        dateEl.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    };
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // --- Veri Yönetimi ---
    const STORAGE_KEY = 'platformFinal_Tasks';
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const saveTasks = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    // --- Ana Fonksiyonlar ---
    const getQuadrantKey = (task) => {
        if (task.isUrgent && task.isImportant) return 'q1';
        if (!task.isUrgent && task.isImportant) return 'q2';
        if (task.isUrgent && !task.isImportant) return 'q3';
        return 'q4';
    };

    const updateQuadrantHighlight = () => {
        const isUrgent = document.querySelector('input[name="urgency"]:checked').value === 'urgent';
        const isImportant = document.querySelector('input[name="importance"]:checked').value === 'important';

        let targetQuadrantId;
        if (isUrgent && isImportant) targetQuadrantId = 'q1';
        else if (!isUrgent && isImportant) targetQuadrantId = 'q2';
        else if (isUrgent && !isImportant) targetQuadrantId = 'q3';
        else targetQuadrantId = 'q4';

        // Önce tüm vurguları kaldır
        document.querySelectorAll('.quadrant').forEach(q => q.classList.remove('is-targeted'));

        // Sonra doğru olanı vurgula
        const targetQuadrant = document.getElementById(targetQuadrantId);
        if (targetQuadrant && !matrixGrid.classList.contains('expanded-view')) {
             targetQuadrant.classList.add('is-targeted');
        }
    };

    const renderUI = () => {
        const quadrants = {
            q1: { list: document.querySelector('#q1 .task-list'), badgeEl: document.querySelector('#q1 .task-count-badge'), textEl: document.querySelector('#q1 .task-count-text') },
            q2: { list: document.querySelector('#q2 .task-list'), badgeEl: document.querySelector('#q2 .task-count-badge'), textEl: document.querySelector('#q2 .task-count-text') },
            q3: { list: document.querySelector('#q3 .task-list'), badgeEl: document.querySelector('#q3 .task-count-badge'), textEl: document.querySelector('#q3 .task-count-text') },
            q4: { list: document.querySelector('#q4 .task-list'), badgeEl: document.querySelector('#q4 .task-count-badge'), textEl: document.querySelector('#q4 .task-count-text') },
        };
        
        Object.values(quadrants).forEach(q => q.list.innerHTML = '');

        const tasksByQuadrant = { q1: [], q2: [], q3: [], q4: [] };
        tasks.forEach(task => tasksByQuadrant[getQuadrantKey(task)].push(task));

        for (const key in quadrants) {
            const q = quadrants[key];
            const quadrantTasks = tasksByQuadrant[key];
            
            q.badgeEl.textContent = quadrantTasks.length;
            q.textEl.textContent = `${quadrantTasks.length} iş`;

            const tasksToPreview = quadrantTasks.slice(-2).reverse();
            tasksToPreview.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `<span>${task.text.replace(/[&<>"']/g, match => `&#${match.charCodeAt(0)};`)}</span>`;
                q.list.appendChild(li);
            });
        }
        updateQuadrantHighlight(); 
    };

    const handleFocusView = (clickedQuadrant) => {
        const currentlyActive = document.querySelector('.quadrant.active');
        if (currentlyActive) currentlyActive.classList.remove('active');
        
        document.querySelectorAll('.quadrant').forEach(q => q.classList.remove('is-targeted'));

        matrixGrid.classList.add('expanded-view');
        clickedQuadrant.classList.add('active');
        renderFullListFor(clickedQuadrant.id);
    };

    const renderFullListFor = (quadrantId) => {
        const quadrant = document.getElementById(quadrantId);
        const listEl = quadrant.querySelector('.task-list');
        listEl.innerHTML = '';

        const quadrantTasks = tasks.filter(task => getQuadrantKey(task) === quadrantId).reverse();
        
        if (quadrantTasks.length === 0) {
            listEl.innerHTML = '<p class="task-item-full" style="justify-content: center; color: var(--text-secondary);">Bu kategoride iş yok.</p>';
        } else {
            quadrantTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item-full';
                li.dataset.id = task.id;

                const creationDate = new Date(task.id);
                const now = new Date();
                const diffTime = Math.abs(now - creationDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                const formattedDate = creationDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const waitingText = diffDays === 0 ? `bugün eklendi` : `${diffDays} gündür bekliyor`;

                li.innerHTML = `
                    <div class="task-content">
                        <span>${task.text.replace(/[&<>"']/g, match => `&#${match.charCodeAt(0)};`)}</span>
                        <p class="task-meta">Tarih: ${formattedDate} (${waitingText})</p>
                    </div>
                    <button class="delete-btn" title="İşi Sil">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>`;
                listEl.appendChild(li);
            });
        }
    };

    const exitFocusView = () => {
        matrixGrid.classList.remove('expanded-view');
        document.querySelector('.quadrant.active')?.classList.remove('active');
        renderUI();
    };

    // --- Olay Dinleyicileri ---
    urgencyAndImportanceToggles.forEach(toggle => {
        toggle.addEventListener('change', updateQuadrantHighlight);
    });

    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;
        const isUrgent = document.querySelector('input[name="urgency"]:checked').value === 'urgent';
        const isImportant = document.querySelector('input[name="importance"]:checked').value === 'important';
        
        tasks.push({ id: Date.now(), text, isUrgent, isImportant });
        saveTasks();
        renderUI();
        taskForm.reset();
        taskInput.focus();
        updateQuadrantHighlight(); 
    });
    
    matrixGrid.addEventListener('click', e => {
        const clickedQuadrant = e.target.closest('.quadrant');
        const backBtn = e.target.closest('.back-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (deleteBtn) {
            e.stopPropagation();
            const taskId = Number(deleteBtn.closest('.task-item-full').dataset.id);
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            
            const activeQuadrantId = document.querySelector('.quadrant.active').id;
            renderFullListFor(activeQuadrantId);
            const badgeEl = document.querySelector(`#${activeQuadrantId} .task-count-badge`);
            const textEl = document.querySelector(`#${activeQuadrantId} .task-count-text`);
            const currentCount = tasks.filter(t => getQuadrantKey(t) === activeQuadrantId).length;
            badgeEl.textContent = currentCount;
            textEl.textContent = `${currentCount} iş`;
            return;
        }

        if (backBtn) {
             e.stopPropagation();
             exitFocusView();
             return;
        }

        if (clickedQuadrant && !matrixGrid.classList.contains('expanded-view')) {
            handleFocusView(clickedQuadrant);
        }
    });

    // --- İlk Yükleme ---
    renderUI();
});