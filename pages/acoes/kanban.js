// 1. Objeto de configuração usando classes do Tailwind
const kanbanColumnsConfig = [
    { status: 'Em desenvolvimento', headerClasses: 'bg-gray-200 text-gray-800' },
    { status: 'Planejado', headerClasses: 'bg-slate-300 text-slate-800' },
    { status: 'Pendente', headerClasses: 'bg-yellow-300 text-yellow-800' },
    { status: 'Em curso', headerClasses: 'bg-cyan-500 text-white' },
    { status: 'Implementado', headerClasses: 'bg-green-600 text-white' }
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
                class="kanban-card bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow" 
                data-task-id="${task.ID}">
                <span class="font-semibold text-slate-800 line-clamp-2">${task['Número da atividade']} - ${task.Atividade}</span>
                <span class="block text-sm font-semibold text-sky-600">${task['Plano de ação']}</span>
                <div class="text-xs text-slate-500 flex justify-between">
                    <p>Início: <strong>${formatDate(task['Data de início'])}</strong></p>
                    <p>Fim: <strong>${formatDate(task['Data fim'])}</strong></p>
                </div>
            </div>
        `).join('');

        return `
            <div class="w-80 flex-shrink-0 flex flex-col">
                <div class="sticky top-0 z-10 kanban-column-header flex justify-between items-center p-3 font-semibold rounded-t-xl ${columnConfig.headerClasses}">
                    <span>${columnConfig.status}</span>
                    <span class="text-sm font-bold px-2 py-0.5 bg-black/10 rounded-full">${tasks.length}</span>
                </div>
                <!-- CONTAINER DOS CARDS COM SCROLL VERTICAL -->
                <div class="kanban-cards-container bg-slate-100 rounded-b-xl flex-grow p-3 overflow-y-auto space-y-3">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }).join('');

    // --- 3. Monta a estrutura completa do quadro ---
    const fullKanbanHtml = `
        <div class="w-full max-h-[600px] flex flex-col bg-white rounded-lg shadow border border-slate-200">
            <div class="kanban-board flex-grow flex gap-4 overflow-x-scroll p-4">
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