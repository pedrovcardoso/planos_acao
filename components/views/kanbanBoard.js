const kanbanColumnsConfig = [
    { status: 'Em desenvolvimento', headerClasses: 'bg-gray-200 text-gray-800' },
    { status: 'Planejado', headerClasses: 'bg-slate-300 text-slate-800' },
    { status: 'Em curso', headerClasses: 'bg-cyan-500 text-white' },
    { status: 'Pendente', headerClasses: 'bg-yellow-300 text-yellow-800' },
    { status: 'Implementado', headerClasses: 'bg-green-600 text-white' },
    { status: 'Em revisão', headerClasses: 'bg-orange-300 text-orange-900' }
];

let hideEmptyColumns = false;

function populateKanbanBoard(actionsData, containerId = 'kanban-view') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} não encontrado.`);
        return;
    }

    const tasksByStatus = actionsData.reduce((acc, task) => {
        const status = task.Status || 'Sem Status';
        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
    }, {});

    const filteredColumnsConfig = hideEmptyColumns
        ? kanbanColumnsConfig.filter(col => (tasksByStatus[col.status] || []).length > 0)
        : kanbanColumnsConfig;

    const columnsHtml = filteredColumnsConfig.map(columnConfig => {
        const tasks = tasksByStatus[columnConfig.status] || [];

        const formatDate = (dateString) => {
            return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        };

        const cardsHtml = tasks.map(task => `
            <div 
                class="kanban-card group bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-sky-300 transition-all duration-300 relative overflow-visible transform hover:-translate-y-1 hover:scale-[1.02]" 
                data-task-id="${task.ID}"
                draggable="true">
                
                <div class="absolute top-1 right-1 z-20">
                    <div class="relative">
                        <button type="button" 
                                class="card-menu-button p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none transition-colors"
                                onclick="event.stopPropagation()">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        <div class="card-menu-dropdown hidden absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl border border-slate-200 z-[100]">
                            <div class="py-1">
                                <button type="button" class="view-details-btn block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-semibold" data-task-id="${task.ID}">
                                    Ver detalhes
                                </button>
                                ${task.Status !== 'Implementado' ? `
                                <button type="button" class="mark-implemented-btn block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-semibold" data-task-id="${task.ID}">
                                    Marcar como implementado
                                </button>
                                ` : ''}
                                <div class="border-t border-slate-100 my-1"></div>
                                <button type="button" class="edit-btn block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100" data-task-id="${task.ID}">
                                    Editar
                                </button>
                                <button type="button" class="delete-btn block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold" data-task-id="${task.ID}">
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-1.5 pt-1">
                    <h4 class="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">
                        ${task["Número da atividade"]} - ${task.Atividade}
                    </h4>
                    
                    <div class="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600/80">
                        <ion-icon name="layers-outline" class="text-xs"></ion-icon>
                        <span class="truncate">${task['Plano de ação']}</span>
                    </div>

                    <div class="mt-1 pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                        <div class="flex items-center gap-1">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <span>${formatDate(task['Data de início'])}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <ion-icon name="flag-outline"></ion-icon>
                            <span>${formatDate(task['Data fim'])}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="kanban-column w-72 flex-shrink-0 flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-inner transition-all duration-500 ease-in-out opacity-0 translate-y-4 animate-in-active">
                <style>
                    @keyframes kanbanSlideIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-in-active {
                        animation: kanbanSlideIn 0.4s ease-out forwards;
                    }
                    .kanban-column {
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                </style>
                <div class="sticky top-0 z-10 kanban-column-header flex justify-between items-center px-3 py-2.5 font-bold rounded-t-xl shadow-sm ${columnConfig.headerClasses}">
                    <span class="uppercase tracking-wider text-[11px]">${columnConfig.status}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 bg-black/10 rounded-md backdrop-blur-sm">${tasks.length}</span>
                </div>
                <div class="kanban-cards-container flex-grow p-2.5 overflow-y-auto space-y-2.5 transition-all duration-300" data-status="${columnConfig.status}">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }).join('');

    const fullKanbanHtml = `
        <div class="w-full h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            <div class="flex justify-end mb-2 px-2">
                <label class="inline-flex items-center cursor-pointer group">
                    <span class="mr-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">Ocultar status vazios</span>
                    <div class="relative inline-flex items-center">
                        <input type="checkbox" id="hide-empty-columns-check" class="sr-only peer" ${hideEmptyColumns ? 'checked' : ''}>
                        <div class="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-500"></div>
                    </div>
                </label>
            </div>
            <div class="kanban-board flex-grow flex gap-4 overflow-x-auto pb-4 px-2">
                ${columnsHtml}
            </div>
        </div>
    `;

    container.innerHTML = fullKanbanHtml;

    const hideCheck = document.getElementById('hide-empty-columns-check');
    if (hideCheck) {
        hideCheck.addEventListener('change', (e) => {
            hideEmptyColumns = e.target.checked;
            populateKanbanBoard(actionsData, containerId);
        });
    }

    setupCardMenus(container);
    setupDragAndDrop(container);

    container.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-menu-button') || e.target.closest('.card-menu-dropdown')) return;

            const taskId = card.dataset.taskId;
            if (typeof openTaskModal === 'function') {
                openTaskModal(taskId);
            } else {
                console.error("Função openTaskModal não encontrada.");
            }
        });
    });
}

function setupCardMenus(container) {
    const allMenuButtons = container.querySelectorAll('.card-menu-button');

    allMenuButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = button.nextElementSibling;
            const isHidden = dropdown.classList.contains('hidden');
            const card = button.closest('.kanban-card');

            document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));
            document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('z-50'));

            if (isHidden) {
                dropdown.classList.remove('hidden');
                if (card) card.classList.add('z-50');
            }
        });
    });

    const closeMenus = () => {
        document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('z-50'));
    };
    window.removeEventListener('click', closeMenus);
    window.addEventListener('click', closeMenus);

    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal(btn.dataset.taskId);
        });
    });

    container.querySelectorAll('.mark-implemented-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const taskId = btn.dataset.taskId;
            const task = window.jsonAcoes.find(t => t.ID === taskId);

            if (task) {
                if (typeof window.task_togglePageInteractivity === 'function') {
                    window.task_togglePageInteractivity(false);
                }
                if (typeof window.toggleLoading === 'function') {
                    window.toggleLoading(true);
                }

                const originalHtml = btn.innerHTML;
                btn.innerHTML = `
                    <div class="flex items-center gap-2">
                        <svg class="animate-spin h-3 w-3 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processando...</span>
                    </div>
                `;

                const newData = { ...task, Status: 'Implementado' };
                try {
                    const res = await window.salvarArquivoNoOneDrive(taskId, 'acoes.txt', 'update', newData, 'jsonAcoes');
                    if (res.status === 200) {
                        window.location.reload();
                    } else {
                        throw new Error(res.message || "Erro no servidor");
                    }
                } catch (error) {
                    console.error("Erro ao atualizar status:", error);
                    alert("Erro ao marcar como implementado: " + error.message);

                    if (typeof window.task_togglePageInteractivity === 'function') {
                        window.task_togglePageInteractivity(true);
                    }
                    if (typeof window.toggleLoading === 'function') {
                        window.toggleLoading(false);
                    }
                    btn.innerHTML = originalHtml;
                }
            }
        });
    });

    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = btn.dataset.taskId;
            openTaskModal(taskId);
            if (typeof switchToEditMode === 'function') {
                switchToEditMode();
            }
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = btn.dataset.taskId;
            const task = window.jsonAcoes.find(t => t.ID === taskId);
            if (task && typeof window.openDeleteConfirmationModalTask === 'function') {
                window.openDeleteConfirmationModalTask(task);
            }
        });
    });
}

function setupDragAndDrop(container) {
    const cards = container.querySelectorAll('.kanban-card');
    const columns = container.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.taskId);
            card.classList.add('opacity-50', 'scale-95');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-50', 'scale-95');
            columns.forEach(col => col.classList.remove('bg-sky-50/50', 'border-sky-200'));
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('bg-sky-50/50', 'border-sky-200');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('bg-sky-50/50', 'border-sky-200');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('bg-sky-50/50', 'border-sky-200');

            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;

            const task = window.jsonAcoes.find(t => String(t.ID) === String(taskId));

            if (task && task.Status !== newStatus) {
                if (typeof window.task_togglePageInteractivity === 'function') {
                    window.task_togglePageInteractivity(false);
                }
                if (typeof window.toggleLoading === 'function') {
                    window.toggleLoading(true);
                }

                const newData = { ...task, Status: newStatus };

                try {
                    const res = await window.salvarArquivoNoOneDrive(taskId, 'acoes.txt', 'update', newData, 'jsonAcoes');
                    if (res.status === 200) {
                        window.location.reload();
                    } else {
                        throw new Error(res.message || "Erro ao atualizar status");
                    }
                } catch (error) {
                    console.error("Erro no drag and drop:", error);
                    alert("Erro ao mover card: " + error.message);
                    if (typeof window.task_togglePageInteractivity === 'function') {
                        window.task_togglePageInteractivity(true);
                    }
                    if (typeof window.toggleLoading === 'function') {
                        window.toggleLoading(false);
                    }
                }
            }
        });
    });
}

window.populateKanbanBoard = populateKanbanBoard;
