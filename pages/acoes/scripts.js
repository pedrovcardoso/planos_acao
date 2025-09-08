function toggleLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true)
    
    // const param = 'cachebuster';

    // // Verifica se o parâmetro existe na URL
    // const urlParams = new URLSearchParams(window.location.search);
    // if (!urlParams.has(param)) {
    //     // Se não existir, limpa o sessionStorage
    //     sessionStorage.clear();
    //     console.log('Parâmetro não encontrado. sessionStorage limpo.');
    // } else {
    //     console.log('Parâmetro encontrado:', urlParams.get(param));
    // }

    jsonAcoes = sessionStorage.getItem("jsonAcoes");
    jsonPlanos = sessionStorage.getItem("jsonPlanos");

    // se não existir, busca do OneDrive
    if (!jsonAcoes || jsonAcoes === "null" || !jsonPlanos || jsonPlanos === "null") {
      await obterDadosDoOneDrive();

      sessionStorage.setItem("jsonAcoes", JSON.stringify(jsonAcoes));
      sessionStorage.setItem("jsonPlanos", JSON.stringify(jsonPlanos));
      console.log('dados resgatados do onedrive e armazenados no sessionstorage')
    } else {
      jsonAcoes = JSON.parse(jsonAcoes);
      jsonPlanos = JSON.parse(jsonPlanos);
      console.log('dados resgatados do sessionstorage')
    }
    ordenarJsonAcoes(jsonAcoes)

    setupViewSwitcher();
    setupModalControls();
    setupGantt();
    setupFilters()

    fillGanttData(jsonAcoes)
    populateActionsTable(jsonAcoes)
    populateKanbanBoard(jsonAcoes)

    setPlanoFilterFromUrl()
    toggleLoading(false)
});


function setupViewSwitcher() {
    const radioButtons = document.querySelectorAll('input[name="option"]');
    const viewSections = document.querySelectorAll('.view-section');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            // Esconde todas as seções
            viewSections.forEach(section => {
                section.classList.remove('active');
            });

            // Mostra a seção correspondente
            const selectedViewId = this.id + '-view';
            const selectedView = document.getElementById(selectedViewId);
            if (selectedView) {
                selectedView.classList.add('active');
            }
        });
    });
}















// =================================================================
// PAINEL DE FILTROS
// =================================================================

const filtersConfig = [
    ["Plano de ação", "filter-planoAcao"],
    ["Status", "filter-Status"],
    ["Responsável", "filter-Responsavel"],
    ["Unidades envolvidas", "filter-Orgao"]
];

// Nenhuma alteração necessária nesta função.
function normalizeString(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")                 // separa acentos
        .replace(/[\u0300-\u036f]/g, "")  // remove acentos
        .replace(/\s+/g, "_")             // troca espaços por _
        .replace(/[^\w_]/g, "");          // remove caracteres especiais
}

/**
 * Configura os listeners de eventos e popula os seletores de filtro.
 */
function setupFilters() {
    // Popula os seletores de filtro com opções únicas.
    filtersConfig.forEach(([chave, elementId]) => {
        const selectElement = document.getElementById(elementId);
        if (!selectElement) return;

        // transforma em array e "achata" os valores que foram separados por vírgula
        const opcoes = Object.values(jsonAcoes)
            .map(value => value[chave]) // pega o campo
            .filter(Boolean) // remove undefined/null
            .flatMap(v => v.split(', ').map(item => item.trim())); // divide e tira espaços extras

        const opcoesUnicas = [...new Set(opcoes)].sort((a, b) =>
            a.localeCompare(b, 'pt', { sensitivity: 'base' })
        );

        opcoesUnicas.forEach(valor => {
            const option = new Option(valor, normalizeString(valor));
            selectElement.add(option);
        });

        selectElement.addEventListener('change', filtrarValores);
    });

    // Configura o listener para o seletor de período.
    document.getElementById('filter-periodo').addEventListener('change', function() {
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        inputsDiv.style.display = this.value === 'especifico' ? 'flex' : 'none';
        
        // Sempre chama a função principal de filtro para outras opções.
        if (this.value !== 'especifico') {
            filtrarValores();
        }
    });
    
    // Configura o listener para o botão de filtro específico.
    document.getElementById('filtrar-especifico').addEventListener('click', filtrarValores);
    setPlanoFilterFromUrl()
}

/**
 * Verifica se tem algum parametro na URL com o plano de ação.
 */
function setPlanoFilterFromUrl() {
    // 1. Pega os parâmetros da URL atual
    const params = new URLSearchParams(window.location.search);
    
    // 2. Procura por um parâmetro chamado 'plano'
    const planoNome = params.get('plano');

    // 3. Se não houver parâmetro 'plano', a função para aqui
    if (!planoNome) {
        return;
    }

    // 4. Encontra o elemento <select> na página
    const selectElement = document.getElementById('filter-planoAcao');

    // 5. Se o elemento <select> existir...
    if (selectElement) {
        const decodedPlanoNome = decodeURIComponent(planoNome);
        
        selectElement.value = normalizeString(decodedPlanoNome);

        // (Opcional) Dispara um evento de 'change' para que qualquer
        // filtro que dependa do select seja acionado imediatamente.
        selectElement.dispatchEvent(new Event('change'));
        
    } else {
        console.warn("Elemento <select> com id 'filter-planoAcao' não foi encontrado na página.");
    }
}

/**
 * Filtra um array de objetos JSON com base em uma chave e valor.
 * (Mantida para seguir a estrutura original, embora possa ser integrada em `filtrarValores`).
 */
function filterJson(json, chave, valorNormalizado) {
    return json.filter(item => {
        const itemNormalizado = normalizeString(item[chave] || '');
        return itemNormalizado.includes(valorNormalizado);
    });
}


/**
 * Função auxiliar para atualizar todas as visualizações com os dados filtrados.
 * @param {Array} dados - O array de dados para popular as visualizações.
 */
function atualizarVisualizacoes(dados) {
    fillGanttData(dados);
    populateKanbanBoard(dados);
    populateActionsTable(dados);
}

/**
 * Função central que aplica TODOS os filtros (de categoria e período) e atualiza a interface.
 */
function filtrarValores() {
    let jsonFiltrado = [...jsonAcoes]; // Começa com uma cópia dos dados originais.

    // 1. Aplica filtros de categoria (Plano de Ação, Status, etc.).
    filtersConfig.forEach(([chave, elementId]) => {
        const filterElement = document.getElementById(elementId);
        if (filterElement && filterElement.value !== '-') {
            jsonFiltrado = filterJson(jsonFiltrado, chave, filterElement.value);
        }
    });

    // 2. Aplica o filtro de período.
    jsonFiltrado = filtrarPeriodo(jsonFiltrado);

    // 3. Atualiza todas as visualizações com o resultado final.
    atualizarVisualizacoes(jsonFiltrado);
}

/**
 * Filtra um array de dados com base no período selecionado.
 * Esta função agora atua como um "helper", recebendo dados e retornando-os filtrados.
 * @param {Array} dadosParaFiltrar - O array de ações a ser filtrado.
 * @returns {Array} O array de ações filtrado por período.
 */
function filtrarPeriodo(dadosParaFiltrar) {
    const value = document.getElementById('filter-periodo').value;
    let dataInicio, dataFim;

    const agora = new Date();

    switch (value) {
        case 'semana':
            const primeiroDia = new Date(agora);
            primeiroDia.setDate(agora.getDate() - agora.getDay() + 1);
            dataInicio = primeiroDia;
            
            const ultimoDia = new Date(primeiroDia);
            ultimoDia.setDate(primeiroDia.getDate() + 4);
            dataFim = ultimoDia;
            break;
        
        case 'mes':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
            dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
            break;

        case 'especifico':
            const inicioInput = document.getElementById('periodo-inicio').value;
            const fimInput = document.getElementById('periodo-fim').value;
            if (inicioInput && fimInput) {
                dataInicio = new Date(inicioInput);
                dataFim = new Date(fimInput);
            }
            break;

        default:
            // Se não for um filtro de período, retorna os dados como estão.
            return dadosParaFiltrar;
    }

    if (!dataInicio || !dataFim) {
        return dadosParaFiltrar; // Retorna sem filtrar se as datas forem inválidas.
    }

    // Normaliza as horas para garantir que o dia inteiro seja incluído.
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);

    return dadosParaFiltrar.filter(task => {
        // Adiciona um fuso horário para evitar problemas de conversão.
        const start = new Date(task["Data de início"] + 'T00:00:00');
        const end = new Date(task["Data fim"] + 'T23:59:59');
        return start <= dataFim && end >= dataInicio;
    });
}

/**
 * Limpa todos os filtros e reexibe os dados originais.
 */
function clearFilters() {
    filtersConfig.forEach(([chave, elementId]) => {
        document.getElementById(elementId).value = '-';
    });
    document.getElementById('filter-periodo').value = '-';
    document.getElementById('periodo-inicio').value = '';
    document.getElementById('periodo-fim').value = '';
    document.getElementById('periodo-especifico-inputs').style.display = 'none';
    
    history.replaceState(null, '', window.location.pathname);

    filtrarValores();
}














// =================================================================
// LÓGICA DO KANBAN
// =================================================================

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















// =================================================================
// LÓGICA DA TABELA
// =================================================================
const tableColumnConfig = [
    { key: 'Número da atividade', label: 'Nº Ativ.', className: 'text-center', width: 80 },
    { key: 'Plano de ação', label: 'Plano de Ação', className: '', width: 150 },
    { key: 'Atividade', label: 'Atividade', className: '', width: 400 },
    { key: 'Descrição da atividade', label: 'Descrição da atividade', className: '', width: 200 },
    { key: 'Data de início', label: 'Início', className: 'text-center', width: 150 },
    { key: 'Data fim', label: 'Fim', className: 'text-center', width: 150 },
    { key: 'Status', label: 'Status', className: 'text-center', width: 160 },
    { key: 'Responsável', label: 'Responsável', className: '', width: 200 },
    { key: 'E-mail', label: 'E-mail', className: '', width: 200 },
    { key: 'Unidades envolvidas', label: 'Unidades envolvidas', className: '', width: 200 },
    { key: 'Observações', label: 'Observações', className: '', width: 300 }
];

/**
 * Cria e popula a tabela de ações com base no objeto de configuração.
 * A função gera a tabela inteira e a insere no DOM.
 * @param {Array<Object>} actionsData - O array de objetos de ações (jsonAcoes).
 */
function populateActionsTable(actionsData) {
    const container = document.getElementById('table-container');
    if (!container) {
        console.error("Container #table-container não encontrado.");
        return;
    }

    // Calcula a largura total da tabela somando as larguras de cada coluna
    const totalTableWidth = tableColumnConfig.reduce((sum, col) => sum + col.width, 0);

    // [MELHORIA] Gera as tags <col> para definir a largura de forma otimizada
    const colgroupHtml = tableColumnConfig.map(col => 
        `<col style="width: ${col.width}px;">`
    ).join('');

    // Gera o HTML do cabeçalho (Thead), sem a necessidade de width em cada <th>
    const headerHtml = tableColumnConfig.map(col => 
        `<th scope="col" class="px-5 py-3 ${col.className}">${col.label}</th>`
    ).join('');

    // Gera o HTML do corpo da tabela (Tbody)
    const bodyHtml = actionsData.map(task => {
        const cellsHtml = tableColumnConfig.map(col => {
            let cellContent = task[col.key] || '-';
            
            // Formatações especiais
            if (['Data de início', 'Data fim'].includes(col.key)) {
                cellContent = task[col.key] ? new Date(task[col.key] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
            } else if (col.key === 'Status') {
                const statusClass = 'status-' + (task.Status || '').replace(/\s+/g, '-');
                cellContent = `<div class="status-container"><div class="${statusClass}">${task.Status}</div></div>`;
            }

            // O div interno ajuda a controlar o conteúdo que pode vazar (overflow)
            return `<td class="p-3 ${col.className}"><div class="line-clamp-3">${cellContent}</div></td>`;
        }).join('');

        return `<tr class="cursor-pointer hover:bg-slate-50 transition-colors divide-x divide-slate-200" data-task-id="${task.ID}">
                    ${cellsHtml}
                </tr>`;
    }).join('');

    // Monta a estrutura completa da tabela
    const fullTableHtml = `
        <table style="width: ${totalTableWidth}px; table-layout: fixed;">
            <colgroup>
                ${colgroupHtml}
            </colgroup>
            <thead class="bg-slate-50 text-xs text-slate-700 uppercase border-b border-slate-200 sticky top-0 shadow-md">
                <tr class="divide-x divide-slate-200">${headerHtml}</tr>
            </thead>
            <tbody class="divide-y divide-slate-200">${bodyHtml}</tbody>
        </table>
    `;

    // Insere a tabela no container
    container.innerHTML = fullTableHtml;

    container.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', () => {
            const taskId = row.dataset.taskId;
            openTaskModal(taskId);
        });
    });
}















// =================================================================
// GANTT CHART
// =================================================================
function fillGanttData(jsonAcoes){
    const monthWidth = 80; 
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');

    taskListContainer.innerHTML = "";
    monthsHeader.innerHTML = "";
    ganttRowsContainer.innerHTML = "<div id='todayBar'></div>";
    ganttTimelineContainer.scrollLeft = 0;

    let minDate = new Date(Math.min(...jsonAcoes.map(task => new Date(task["Data de início"]+'T10:00:00'))));
    let maxDate = new Date(Math.max(...jsonAcoes.map(task => new Date(task["Data fim"] ? task["Data fim"]+'T10:00:00' : task["Data de início"]+'T10:00:00'))));

    const today = new Date();
    today.setHours(0,0,0,0);

    if (minDate > today) minDate = new Date(today);
    if (maxDate < today) maxDate = new Date(today);

    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 2);

    let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    let currentDate = new Date(firstMonth);
    let timelineWidth = 0;

    while (currentDate <= maxDate) {
        const monthElement = document.createElement('div');
        monthElement.className = 'gantt-month';
        monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        monthsHeader.appendChild(monthElement);
        timelineWidth += monthWidth;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    ganttRowsContainer.style.width = `${timelineWidth}px`;
    monthsHeader.style.width = `${timelineWidth}px`;
    
    function calculatePosition(date) {
        const targetDate = new Date(date);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthsDiff = (year - firstMonth.getFullYear()) * 12 + (month - firstMonth.getMonth());
        const dayOfMonth = targetDate.getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOffset = (dayOfMonth / daysInMonth) * monthWidth;
        return (monthsDiff * monthWidth) + dayOffset;
    }

    const positionToday = calculatePosition(new Date().toLocaleDateString().split("/").reverse().join("-"));
    document.getElementById("todayBar").style.left = `${positionToday}px`;
    ganttTimelineContainer.scrollLeft = positionToday - 100; // Centraliza o "Hoje" na tela

    jsonAcoes.forEach((task, index) => {
        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'gantt-row-timeline';
        rowTimeline.dataset.rowIndex = index;

        const startDate = task["Data de início"]+'T10:00:00';
        const endDate = task["Data fim"]+'T10:00:00'
        const startOffset = calculatePosition(startDate);
        const endOffset = endDate ? calculatePosition(endDate) : startOffset+10;
        const durationWidth = endOffset - startOffset;

        const bar = document.createElement('div');
        bar.className = 'absolute h-[25px] bg-[#3498db] rounded-[10px] top-1/2 -translate-y-1/2 z-[1] shadow-md';
        bar.style.left = `${startOffset}px`;
        bar.style.width = `${durationWidth}px`;
        bar.title = `${task.Atividade}: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        const statusClass = `status-${task.Status.replace(/\s+/g, '-')}`;
        bar.classList.add(task.colorTag);
        bar.addEventListener('click', ()=>{openTaskModal(task.ID)})

        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `<div class="text-center">${task["Número da atividade"]}</div>
                                <div>${task["Plano de ação"]}</div>                     
                                <div>${task.Atividade}</div><div class="status-container">
                                <div class="${statusClass}">${task.Status}</div></div>`;
        taskListContainer.appendChild(taskRow);
        taskRow.addEventListener('click', () => {
            openTaskModal(task.ID);
        });

        rowTimeline.appendChild(bar);
        ganttRowsContainer.appendChild(rowTimeline);
            
        document.querySelectorAll('.gantt-row-task, .gantt-row-timeline').forEach(row => {
            row.addEventListener('mouseenter', () => {
                const rowIndex = row.dataset.rowIndex;
                document.querySelectorAll(`[data-row-index='${rowIndex}']`).forEach(el => el.classList.add('hovered'));
            });
            row.addEventListener('mouseleave', () => {
                const rowIndex = row.dataset.rowIndex;
                document.querySelectorAll(`[data-row-index='${rowIndex}']`).forEach(el => el.classList.remove('hovered'));
            });
        });
    });
}

function setupGantt(){
    setupGanttScroll()
    setupResizerGantt()
}

function setupResizerGantt(){
    const resizers = document.querySelectorAll('.gantt-tasks-header .resizer');
    let currentResizer;
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            currentResizer = e.target;
            e.preventDefault(); 
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            function onMouseMove(e) {
                const root = document.documentElement;
                const prevSibling = currentResizer.parentElement;
                const rect = prevSibling.getBoundingClientRect();
                const newWidth = e.clientX - rect.left;
                if (newWidth > 40) { 
                   const colIdentifier = prevSibling.dataset.col;
                    if (colIdentifier === 'num') {
                        root.style.setProperty('--col-num-width', `${newWidth}px`);
                    } else if (colIdentifier === 'plano') {
                        root.style.setProperty('--col-plano-width', `${newWidth}px`);
                    } else if (colIdentifier === 'atividade') {
                        root.style.setProperty('--col-atividade-width', `${newWidth}px`);
                    } else if (colIdentifier === 'status') {
                        root.style.setProperty('--col-status-width', `${newWidth}px`);
                    }
                }
            }
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        });
    });
}

function setupGanttScroll(){
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');

    let isSyncingScroll = false;
    taskListContainer.addEventListener('scroll', () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        ganttTimelineContainer.scrollTop = taskListContainer.scrollTop;
        requestAnimationFrame(() => { isSyncingScroll = false; });
    });
    ganttTimelineContainer.addEventListener('scroll', () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        taskListContainer.scrollTop = ganttTimelineContainer.scrollTop;
        requestAnimationFrame(() => { isSyncingScroll = false; });
    });
}















// =================================================================
// LÓGICA REESTRUTURADA E FINAL DO MODAL DE AÇÕES
// =================================================================

// --- Variáveis de estado do Modal ---

// Armazena a tarefa atualmente exibida/editada no modal.
let currentTask = null; 
// Flag para detectar se houve alguma alteração no formulário.
let hasChanges = false;
// Flag para diferenciar entre modo de criação e edição.
let isNewTaskMode = false

/**
 * Configura todos os listeners de eventos para os controles dos modais.
 */
function setupModalControls() {
    populatePlanosSelect()

    // Botões principais do modal
    document.getElementById('modal-btn-close').addEventListener('click', closeModal);
    document.getElementById('modal-btn-view-close').addEventListener('click', () => closeModal());
    document.getElementById('modal-btn-edit').addEventListener('click', switchToEditMode);
    document.getElementById('modal-btn-cancel').addEventListener('click', () => switchToViewMode());
    document.getElementById('modal-btn-save').addEventListener('click', handleSave);
    document.getElementById('modal-btn-delete').addEventListener('click', openDeleteConfirmation);
    document.getElementById('btn-nova-atividade').addEventListener('click', openModalForNewTask)
    
    // Detecta alterações no formulário
    document.getElementById('modal-edit-form').addEventListener('input', () => {
        hasChanges = true;
    });

    // Botões do modal de confirmação
    document.getElementById('confirm-btn-no').addEventListener('click', () => {
        document.getElementById('confirmation-modal').classList.add('hidden');
    });
    document.getElementById('confirm-btn-yes').addEventListener('click', () => {
        switchToViewMode(true);
    });

    document.getElementById('delete-confirm-btn-no').addEventListener('click', () => {
        document.getElementById('delete-confirmation-modal').classList.add('hidden');
    });
    document.getElementById('delete-confirm-btn-yes').addEventListener('click', handleDeleteTask);
}

/**
 * Popula o seletor de Planos de Ação no modal.
 * Esta função é chamada por setupModalControls.
 */
function populatePlanosSelect() {
    const selectPlanos = document.getElementById('edit-plano');
    // Retorna cedo se o elemento não for encontrado
    if (!selectPlanos) return;

    // Extrai os nomes únicos dos planos usando map e Set de forma concisa.
    const nomesDosPlanos = [...new Set(Object.values(jsonPlanos).map(plano => plano.Nome))];

    // Limpa quaisquer opções existentes (importante para evitar duplicatas).
    selectPlanos.innerHTML = '';

    // Adiciona uma opção padrão "Selecione"
    const defaultOption = new Option('Selecione um plano', '');
    defaultOption.selected = true;
    defaultOption.disabled = true;
    defaultOption.hidden = true;
    selectPlanos.add(defaultOption);

    // Adiciona cada plano como uma nova opção.
    nomesDosPlanos.forEach(nomeDoPlano => {
        // new Option(textoVisivel, valorDoAtributoValue)
        const option = new Option(nomeDoPlano, nomeDoPlano);
        selectPlanos.add(option);
    });
}


/**
 * Função principal para abrir o modal com os dados de uma tarefa.
 * @param {object} task - O objeto da tarefa clicada.
 */
function openTaskModal(id) {
    isNewTaskMode = false;
    task = jsonAcoes.filter(t => t.ID === id)[0];

    document.getElementById('task-modal-container').setAttribute('data-task-id', task.ID);

    switchToViewMode(true);
    document.getElementById('task-modal-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

/**
 * Preenche todos os campos do modo de visualização.
 */
function populateViewMode(task) {
    const id = document.getElementById('task-modal-container').dataset.taskId
    task = jsonAcoes.filter(t => t.ID === id)[0];

    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '-';
    };
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
    };

    setElementText('modal-view-plano', task['Plano de ação']);
    setElementText('modal-view-atividade', task['Número da atividade'] +' - '+ task['Atividade']);
    setElementText('modal-view-data-inicio', formatDate(task['Data de início']));
    setElementText('modal-view-data-fim', formatDate(task['Data fim']));
    setElementText('modal-view-descricao', task['Descrição da atividade']);
    setElementText('modal-view-responsavel', task['Responsável']);
    setElementText('modal-view-email', task['E-mail']);
    setElementText('modal-view-unidades', task['Unidades envolvidas']);
    setElementText('modal-view-observacoes', task['Observações']);

    const statusEl = document.getElementById('modal-view-status');
    if (statusEl) {
        statusEl.innerText = task.Status;
        statusEl.className = 'status-' + (task.Status || '').replace(/\s+/g, '-');
    }
    
    // 1. Lógica do line-clamp no título da atividade
    const atividadeTitle = document.getElementById('modal-view-atividade');
    atividadeTitle.classList.add('line-clamp-3', 'cursor-pointer');
    // Remove listeners antigos para evitar duplicação
    const newTitle = atividadeTitle.cloneNode(true);
    atividadeTitle.parentNode.replaceChild(newTitle, atividadeTitle);
    newTitle.addEventListener('click', () => {
        newTitle.classList.toggle('line-clamp-3');
    });
}

/**
 * Preenche o formulário do modo de edição.
 */
function populateEditMode() {
    const id = document.getElementById('task-modal-container').dataset.taskId
    task = jsonAcoes.filter(t => t.ID === id)[0];

    const form = document.getElementById('modal-edit-form');
    Object.keys(task).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = task[key];
    });

    const planoSelect = document.getElementById('edit-plano');
    if (planoSelect) {
        planoSelect.innerHTML = jsonPlanos.map(plano => `<option value="${plano.Nome}">${plano.Nome}</option>`).join('');
        planoSelect.value = task['Plano de ação'];
    }
}

/**
 * Alterna para o modo de edição.
 */
function switchToEditMode() {
    populateEditMode(currentTask);
    
    document.getElementById('modal-view-plano').classList.add('hidden');
    document.getElementById('modal-view-atividade').innerText = 'Editar Ação';

    document.getElementById('view-mode-content').classList.add('hidden');
    document.getElementById('view-mode-buttons').classList.add('hidden');
    
    document.getElementById('edit-mode-content').classList.remove('hidden');
    document.getElementById('edit-mode-buttons').classList.remove('hidden');

    hasChanges = false; // Reseta a flag de alterações ao entrar no modo de edição.
}

/**
 * Alterna de volta para o modo de visualização.
 * @param {boolean} force - Se true, ignora a verificação de alterações.
 */
function switchToViewMode(force = false) {
    const confirmationModal = document.getElementById('confirmation-modal');
    const editContent = document.getElementById('edit-mode-content');
    const editButtons = document.getElementById('edit-mode-buttons');
    const viewContent = document.getElementById('view-mode-content');
    const viewButtons = document.getElementById('view-mode-buttons');
    const modalViewPlano = document.getElementById('modal-view-plano');

    if (hasChanges && !force) {
        confirmationModal.classList.remove('hidden');
        return;
    }

    if (isNewTaskMode) {
        closeModal(true);
        return;
    }

    populateViewMode(currentTask);

    modalViewPlano.classList.remove('hidden');

    editContent.classList.add('hidden');
    editButtons.classList.add('hidden');

    viewContent.classList.remove('hidden');
    viewButtons.classList.remove('hidden');

    confirmationModal.classList.add('hidden');
    hasChanges = false;
}


/**
 * Abre o modal em modo de criação para uma nova tarefa.
 */
function openModalForNewTask() {
    isNewTaskMode = true;
    currentTask = {};

    // Limpa o formulário de edição para garantir que não haja dados antigos.
    clearEditForm();

    // Configura a aparência do modal para "Criar".
    document.getElementById('modal-view-plano').classList.add('hidden');
    document.getElementById('modal-view-atividade').innerText = 'Criar Nova Ação';

    // Esconde a visualização e mostra diretamente o formulário de edição.
    document.getElementById('view-mode-content').classList.add('hidden');
    document.getElementById('view-mode-buttons').classList.add('hidden');
    document.getElementById('edit-mode-content').classList.remove('hidden');
    document.getElementById('edit-mode-buttons').classList.remove('hidden');

    // Abre o container principal do modal.
    document.getElementById('task-modal-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    hasChanges = false; // Reseta a flag de alterações.
}


/**
 * Limpa os campos do formulário de edição.
 */
function clearEditForm() {
    const form = document.getElementById('modal-edit-form');
    form.reset();

    document.getElementById('task-modal-container').removeAttribute('data-task-id')
    
    document.getElementById('edit-status'). value = 'Selecione um valor'

    populatePlanosSelect()
}

function openDeleteConfirmation() {
    const id = document.getElementById('task-modal-container').dataset.taskId
    task = jsonAcoes.filter(t => t.ID === id)[0];

    // Popula o nome da atividade no modal de confirmação para clareza.
    const taskNameToDelete = document.getElementById('plano-to-delete-name');
    taskNameToDelete.textContent = `"${task['Atividade']}"`;
    
    // Mostra o modal de confirmação de exclusão.
    document.getElementById('delete-confirmation-modal').classList.remove('hidden');
}

async function handleDeleteTask() {
    const confirmButton = document.getElementById('delete-confirm-btn-yes');
    const cancelButton = document.getElementById('delete-confirm-btn-no');

    // Desabilita botões para prevenir múltiplos cliques.
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    confirmButton.textContent = 'Excluindo...';

    // Guarda uma cópia da tarefa caso o salvamento falhe e precisemos reverter.
    const id = document.getElementById('task-modal-container').getAttribute('data-task-id')

    try {
        const response = await salvarArquivoNoOneDrive(id, 'acoes.txt', 'delete', '');
        if(response.status === 200){
            setSessionMirror('delete', response.data.uuid, null, "jsonAcoes");
            window.location.reload();
        } else if(response.status === 400){
            alert(`Erro ao salvar: ${response.message}`);
            document.getElementById('modal-btn-save').disabled = false;
            document.getElementById('modal-btn-save').textContent = 'Salvar';
            document.getElementById('modal-btn-cancel').disabled = false;
            document.getElementById('modal-btn-close').disabled = false;
        }
    } catch (error) {
        console.error("Falha ao excluir a tarefa:", error);
        alert("Ocorreu um erro ao excluir a tarefa. A alteração foi revertida.");

    } finally {
        // Garante que os botões sejam reativados e o modal fechado, mesmo se houver erro.
        confirmButton.disabled = false;
        cancelButton.disabled = false;
        confirmButton.textContent = 'Sim, Excluir';
        document.getElementById('delete-confirmation-modal').classList.add('hidden');
    }
}

/**
 * Fecha completamente o modal.
 * Reseta o estado `isNewTaskMode` ao fechar.
 * @param {boolean} force - Se true, ignora a verificação de alterações.
 */
function closeModal(force = false) {
    const editContent = document.getElementById('edit-mode-content');
    const taskModal = document.getElementById('task-modal-container');
    const confirmationModal = document.getElementById('confirmation-modal');

    if (!editContent.classList.contains('hidden') && hasChanges && !force) {
        confirmationModal.classList.remove('hidden');
        return;
    }

    taskModal.classList.add('hidden');
    confirmationModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    isNewTaskMode = false;
    hasChanges = false;
}

async function handleSave() {
    if (!hasChanges) {
        if (!isNewTaskMode) {
            switchToViewMode(true);
        }
        return;
    }

    const btnSave = document.getElementById('modal-btn-save');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnClose = document.getElementById('modal-btn-close');

    [btnSave, btnCancel, btnClose].forEach(btn => btn.disabled = true);
    document.getElementById('modal-btn-save').textContent = 'Salvando...';

    const form = document.getElementById('modal-edit-form');
    const id = document.getElementById('task-modal-container').getAttribute('data-task-id')
    const formData = new FormData(form);
    const taskData = {};
    formData.forEach((value, key) => {
        taskData[key] = value;
    });

    // Validação de campos obrigatórios
    const camposObrigatorios = ['Número da atividade', 'Plano de ação', 'Atividade', 'Status'];
    const camposInvalidos = [];

    camposObrigatorios.forEach(campo => {
        if (!taskData[campo] || taskData[campo].trim() === '') {
        camposInvalidos.push(campo);
        }
        [btnSave, btnCancel, btnClose].forEach(btn => btn.disabled = false);
        document.getElementById('modal-btn-save').textContent = 'Salvar Alterações';
    });

    if (camposInvalidos.length > 0) {
        alert(
        `Os seguintes campos são obrigatórios e não foram preenchidos:\n- ${camposInvalidos.join('\n- ')}`
        );
        [btnSave, btnCancel, btnClose].forEach(btn => btn.disabled = false);
        document.getElementById('modal-btn-save').textContent = 'Salvar Alterações';
        return;
    }
    
    try {
        let response
        if (isNewTaskMode) {
            // --- LÓGICA DE CRIAÇÃO ---
            response = await salvarArquivoNoOneDrive('', 'acoes.txt', 'create', taskData)
        } else {
            // --- LÓGICA DE EDIÇÃO (Existente) ---
            response = await salvarArquivoNoOneDrive(id, 'acoes.txt', 'update', taskData)
        }

        if(response.status === 200){
            console.log(response)
            setSessionMirror(isNewTaskMode?'create':'update', response.data.uuid, taskData, "jsonAcoes");
            window.location.reload();
        } else if(response.status === 400){
            alert(`Erro ao salvar: ${response.message}`);
            document.getElementById('modal-btn-save').disabled = false;
            document.getElementById('modal-btn-save').textContent = 'Salvar';
            document.getElementById('modal-btn-cancel').disabled = false;
            document.getElementById('modal-btn-close').disabled = false;
        }
    } catch (error) {
        console.error("Falha ao salvar a tarefa:", error);
        alert(`Ocorreu um erro ao salvar: ${error.message}`);
    }
}