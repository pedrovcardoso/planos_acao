// 1. Objeto de configuração usando classes do Tailwind
const kanbanColumnsConfig = [
    { status: 'Em desenvolvimento', headerClasses: 'bg-gray-200 text-gray-800' },
    { status: 'Planejado', headerClasses: 'bg-slate-300 text-slate-800' },
    { status: 'Em curso', headerClasses: 'bg-cyan-500 text-white' },
    { status: 'Pendente', headerClasses: 'bg-yellow-300 text-yellow-800' },
    { status: 'Implementado', headerClasses: 'bg-green-600 text-white' },
    { status: 'Em revisão', headerClasses: 'bg-orange-300 text-orange-900' }
];

/**
 * Cria e popula o quadro Kanban com altura máxima, cabeçalhos fixos e scrollbar horizontal sempre visível.
 * @param {Array<Object>} actionsData - O array de objetos de ações (jsonAcoes).
 */
function populateKanbanBoard(actionsData) {
    const container = document.getElementById('kanban-view');
    if (!container) {
        console.error("Container #kanban-view não encontrado.");
        return;
    }

    // --- 1. Agrupa as tarefas por status (sem alterações) ---
    const tasksByStatus = actionsData.reduce((acc, task) => {
        const status = task.Status || 'Sem Status';
        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
    }, {});

    // --- 2. Gera o HTML para cada coluna ---
    const columnsHtml = kanbanColumnsConfig.map(columnConfig => {
        const tasks = tasksByStatus[columnConfig.status] || [];

        const formatDate = (dateString) => {
            return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        };

        const cardsHtml = tasks.map(task => `
            <div 
                class="kanban-card group bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-sky-300 transition-all duration-200 relative overflow-hidden" 
                data-task-id="${task.ID}">
                
                <div class="flex flex-col gap-1.5">
                    <h4 class="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">
                        ${task.Atividade}
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
            <div class="w-72 flex-shrink-0 flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-inner">
                <div class="sticky top-0 z-10 kanban-column-header flex justify-between items-center px-3 py-2.5 font-bold rounded-t-xl shadow-sm ${columnConfig.headerClasses}">
                    <span class="uppercase tracking-wider text-[11px]">${columnConfig.status}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 bg-black/10 rounded-md backdrop-blur-sm">${tasks.length}</span>
                </div>
                <!-- CONTAINER DOS CARDS COM SCROLL VERTICAL -->
                <div class="kanban-cards-container flex-grow p-2.5 overflow-y-auto space-y-2.5">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }).join('');

    // --- 3. Monta a estrutura completa do quadro ---
    const fullKanbanHtml = `
        <div class="w-full h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            <div class="kanban-board flex-grow flex gap-4 overflow-x-auto pb-4 px-2">
                ${columnsHtml}
            </div>
        </div>
    `;

    // --- 4. Insere o quadro no container ---
    container.innerHTML = fullKanbanHtml;

    // --- 5. Adiciona os eventos de clique ---
    container.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('click', () => {
            const taskId = card.dataset.taskId;
            openTaskModal(taskId);
        });
    });
}