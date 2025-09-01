const filtersConfig = [
    ["Plano de ação", "filter-planoAcao"],
    ["Status", "filter-Status"],
    ["Responsável", "filter-Responsavel"],
    ["Unidades envolvidas", "filter-Orgao"]
]

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

async function obterDadosDoOneDrive() {
  // Cole a URL do seu fluxo do Power Automate aqui
  const powerAutomateUrl = "https://prod-38.westus.logic.azure.com:443/workflows/6ff0e17beffa412d9fc6fbf256861ea8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_w4h7w76Nqxz1GjX-fqN4x6rQpE1aW8RRposrxufrzw";

  try {
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na requisição HTTP: ${response.status} ${response.statusText}`);
    }

    // Converte a resposta para JSON
    const dados = await response.json();

    jsonAcoes = JSON.parse(dados.acoes);
    jsonPlanos = JSON.parse(dados.planos);

  } catch (error) {
    console.error("Falha ao obter os dados do Power Automate:", error);
    return null;
  }
}

let jsonAcoes
let jsonPlanos

document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true)

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

    fillGanttData(jsonAcoes)
    populateKanbanBoard(jsonAcoes)

    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');
    
    filtersConfig.forEach(filterValue=>{
        const options = []
        Object.values(jsonAcoes).forEach(value=>{
            options.push(value[filterValue[0]])    
        })
        const optionsDistinc = new Set(options)
        const selectElement = document.getElementById(filterValue[1])
        optionsDistinc.forEach(value=>{
            selectElement.innerHTML += `<option value=${normalizeString(value)}>${value}</option>`
        })
        selectElement.addEventListener('change', ()=>{filtrarValores()})
    })

    document.getElementById('filter-periodo').addEventListener('change', function() {
        const value = this.value;
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        if (value === 'especifico') {
            inputsDiv.style.display = 'flex';
        } else {
            inputsDiv.style.display = 'none';
            filtrarPeriodo(); // chama o filtro normal para outras opções
        }
    });
    
    document.getElementById('filtrar-especifico').addEventListener('click', function() {
        const inicio = document.getElementById('periodo-inicio').value;
        const fim = document.getElementById('periodo-fim').value;
        if (!inicio || !fim) return;
    
        const firstDay = new Date(inicio);
        firstDay.setHours(0,0,0,0);
        const lastDay = new Date(fim);
        lastDay.setHours(23,59,59,999);
    
        const filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]+'T10:00:00');
            const end = new Date(task["Data fim"]+'T10:00:00');
            return (start <= lastDay && end >= firstDay);
        });
    
        fillGanttData(filtered);
        populateKanbanBoard(filtered)
    });

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
    setupViewSwitcher();
    setPlanoFilterFromUrl()
    setupModalControls();
    populateActionsTable(jsonAcoes)
    populateKanbanBoard(jsonAcoes)
    toggleLoading(false)
});

/**
 * Configura os botões do seletor de visualização (Gantt, Tabela, Kanban).
 */
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

// Para garantir que o script rode após o carregamento da página:
document.addEventListener('DOMContentLoaded', setupViewSwitcher);

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

function filterJson(json, chave, valor) {
    return json.filter(item => {
        // comparação flexível: se valor é string, ignora maiúscula/minúscula
        if (typeof item[chave] === "string" && typeof valor === "string") {
            return normalizeString(item[chave]) === normalizeString(valor);
        }
        return item[chave] === valor;
    });
}

function normalizeString(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")                 // separa acentos
        .replace(/[\u0300-\u036f]/g, "")  // remove acentos
        .replace(/\s+/g, "_")             // troca espaços por _
        .replace(/[^\w_]/g, "");          // remove caracteres especiais
}

function filtrarValores(){
    let jsonFiltrado = jsonAcoes;

    filtersConfig.forEach(([chave, elementId]) => {
        const filterElement = document.getElementById(elementId);
        if (filterElement && filterElement.value !== '-') {
            jsonFiltrado = filterJson(jsonFiltrado, chave, normalizeString(filterElement.value));
        }
    });

    fillGanttData(jsonFiltrado);
    populateKanbanBoard(jsonFiltrado);
}

function clearFilters(){
    filtersConfig.forEach(([chave, elementId]) => {
        document.getElementById(elementId).value = '-'
    });
    document.getElementById('filter-periodo').value = '-'
    document.getElementById('periodo-especifico-inputs').style.display = 'none'
    
    filtrarValores()
}

function filtrarPeriodo() {
    const select = document.getElementById('filter-periodo')

    const value = select.value;
    let filtered = jsonAcoes;

    if (value === 'mes') {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]+'T10:00:00');
            const end = new Date(task["Data fim"]+'T10:00:00');
            return (
                (start <= monthEnd && end >= monthStart)
            );
        });
    } else if (value === 'semana') {
        const now = new Date();
        const firstDay = new Date(now);
        firstDay.setDate(now.getDate() - now.getDay() + 1);
        firstDay.setHours(0,0,0,0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 4);
        lastDay.setHours(23,59,59,999);
        filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]+'T10:00:00');
            const end = new Date(task["Data fim"]+'T10:00:00');
            return (
                (start <= lastDay && end >= firstDay)
            );
        });
    }

    fillGanttData(filtered);
    populateKanbanBoard(filtered)
};

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
        bar.addEventListener('click', ()=>{openTaskModal(task)})

        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `<div class="text-center">${task["Número da atividade"]}</div>
                                <div>${task["Plano de ação"]}</div>                     
                                <div>${task.Atividade}</div><div class="status-container">
                                <div class="${statusClass}">${task.Status}</div></div>`;
        taskListContainer.appendChild(taskRow);
        taskRow.addEventListener('click', () => {
            openTaskModal(task);
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


// =================================================================
// LÓGICA REESTRUTURADA E FINAL DO MODAL DE AÇÕES
// =================================================================

let currentTask = null;
let hasChanges = false;
// Supondo que 'jsonAcoes' e 'jsonPlanos' estejam disponíveis
// e que você tenha uma função 'salvarAcoesNoOneDrive'

/**
 * Função principal para abrir o modal.
 * @param {object} task - O objeto da tarefa clicada.
 */
function openTaskModal(task) {
    currentTask = task;
    populateViewMode(task);
    switchToViewMode(true);
    document.getElementById('task-modal-container').classList.remove('hidden');
    // 4. Bloqueia o scroll do body
    document.body.classList.add('overflow-hidden');
}

/**
 * Preenche todos os campos do modo de visualização.
 */
function populateViewMode(task) {
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '-';
    };
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
    };

    setElementText('modal-view-plano', task['Plano de ação']);
    setElementText('modal-view-atividade', task['Atividade']);
    setElementText('modal-view-data-inicio', formatDate(task['Data de início']));
    setElementText('modal-view-data-fim', formatDate(task['Data fim']));
    setElementText('modal-view-responsavel', task['Responsável']);
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
function populateEditMode(task) {
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
    // 3. Altera o cabeçalho para "Editar Ação"
    document.getElementById('modal-view-plano').classList.add('hidden');
    document.getElementById('modal-view-atividade').innerText = 'Editar Ação';

    populateEditMode(currentTask);
    
    document.getElementById('view-mode-content').classList.add('hidden');
    document.getElementById('view-mode-buttons').classList.add('hidden');
    
    document.getElementById('edit-mode-content').classList.remove('hidden');
    document.getElementById('edit-mode-buttons').classList.remove('hidden');

    hasChanges = false;
}

/**
 * Alterna de volta para o modo de visualização.
 * @param {boolean} force - Se true, ignora a verificação de alterações.
 */
function switchToViewMode(force = false) {
    // 2. Verifica se há alterações antes de voltar
    if (hasChanges && !force) {
        document.getElementById('confirmation-modal').classList.remove('hidden');
        return; // Para a execução e espera a decisão do usuário
    }

    // Repopula o cabeçalho original
    document.getElementById('modal-view-plano').classList.remove('hidden');
    populateViewMode(currentTask); // Repopula tudo para garantir consistência

    document.getElementById('edit-mode-content').classList.add('hidden');
    document.getElementById('edit-mode-buttons').classList.add('hidden');

    document.getElementById('view-mode-content').classList.remove('hidden');
    document.getElementById('view-mode-buttons').classList.remove('hidden');
    
    // Fecha o modal de confirmação, caso esteja aberto
    document.getElementById('confirmation-modal').classList.add('hidden');
    hasChanges = false;
}

/**
 * Fecha completamente o modal e restaura o scroll.
 */
function closeModal() {
    // Se estiver em modo de edição, verifica alterações antes de fechar
    if (!document.getElementById('edit-mode-content').classList.contains('hidden')) {
        if (hasChanges) {
            document.getElementById('confirmation-modal').classList.remove('hidden');
            return;
        }
    }
    
    document.getElementById('task-modal-container').classList.add('hidden');
    document.getElementById('confirmation-modal').classList.add('hidden');
    // 4. Libera o scroll do body
    document.body.classList.remove('overflow-hidden');
}

/**
 * Salva as alterações feitas no formulário.
 */
function handleSave() {
    if (!hasChanges) {
        switchToViewMode(true);
        return;
    }

    // Seleciona todos os botões que precisam ser desabilitados
    const saveButton = document.getElementById('modal-btn-save');
    const cancelButton = document.getElementById('modal-btn-cancel');
    const closeButton = document.getElementById('modal-btn-close');

    const form = document.getElementById('modal-edit-form');
    const formData = new FormData(form);
    const updatedTask = { ...currentTask };

    formData.forEach((value, key) => {
        updatedTask[key] = value;
    });

    const taskIndex = jsonAcoes.findIndex(t => t['Número da atividade'] === currentTask['Número da atividade']);
    if (taskIndex > -1) {
        jsonAcoes[taskIndex] = updatedTask;
    } else {
        alert("Erro: Tarefa original não encontrada!");
        return;
    }

    const conteudoParaSalvar = JSON.stringify(jsonAcoes, null, 2);

    // Desabilita a UI ANTES de iniciar o salvamento
    saveButton.disabled = true;
    cancelButton.disabled = true;
    closeButton.disabled = true;
    saveButton.textContent = 'Salvando...';
    
    // 6. Chama a função de salvamento real
    salvarArquivoNoOneDrive(conteudoParaSalvar)
}

/**
 * Configura todos os listeners de eventos para os controles dos modais.
 */
function setupModalControls() {
    // Botões principais do modal
    document.getElementById('modal-btn-close').addEventListener('click', closeModal);
    document.getElementById('modal-btn-view-close').addEventListener('click', () => closeModal()); // 5. Botão fechar
    document.getElementById('modal-btn-edit').addEventListener('click', switchToEditMode);
    document.getElementById('modal-btn-cancel').addEventListener('click', () => switchToViewMode());
    document.getElementById('modal-btn-save').addEventListener('click', handleSave);
    
    // Detecta alterações no formulário
    document.getElementById('modal-edit-form').addEventListener('input', () => {
        hasChanges = true;
    });

    // Botões do modal de confirmação
    document.getElementById('confirm-btn-no').addEventListener('click', () => {
        document.getElementById('confirmation-modal').classList.add('hidden');
    });
    document.getElementById('confirm-btn-yes').addEventListener('click', () => {
        // Decide se deve fechar o modal ou apenas voltar para o modo de visualização
        if (!document.getElementById('task-modal-container').classList.contains('hidden')) {
            switchToViewMode(true); // Força a volta para o modo de visualização
            if (!document.getElementById('edit-mode-content').classList.contains('hidden')) {
                 // Se o botão de fechar (X) foi clicado enquanto em modo de edição
                 closeModal();
            }
        }
    });
}

const powerAutomateUrl = "https://prod-174.westus.logic.azure.com:443/workflows/dcc988d813ef43bc8e73a81dd0afc678/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ahd0ynI2hDZJMplv9YsNuug7HzjPuWm4MSNDb-VG-vI";

async function salvarArquivoNoOneDrive(conteudo) {
    const nome = 'acoes.txt'; // O nome correto do arquivo
    const dadosParaEnviar = { nomeArquivo: nome, conteudoArquivo: conteudo };
    try {
        const response = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnviar)
        });
        if (!response.ok) throw new Error(`Erro na requisição HTTP: ${response.status}`);
        const resultado = await response.json();
        sessionStorage.clear();
        window.location.reload();
        return resultado;
    } catch (error) {
        console.error("Falha ao enviar os dados para o Power Automate:", error);
        alert('Erro ao salvar os dados.');
        return null;
    }
}

// =================================================================
// CONFIGURAÇÃO E LÓGICA DA VISUALIZAÇÃO DE AÇÕES
// =================================================================

// 1. Objeto de configuração da tabela (seu novo formato)
// 1. Objeto de configuração da tabela (seu novo formato)
const tableColumnConfig = [
    { key: 'Número da atividade', label: 'Nº Ativ.', className: 'text-center', width: 100 },
    { key: 'Plano de ação', label: 'Plano de Ação', className: '', width: 200 },
    { key: 'Atividade', label: 'Atividade', className: '', width: 500 },
    { key: 'Data de início', label: 'Início', className: 'text-center', width: 150 },
    { key: 'Data fim', label: 'Fim', className: 'text-center', width: 150 },
    { key: 'Status', label: 'Status', className: 'text-center', width: 160 },
    { key: 'Responsável', label: 'Responsável', className: '', width: 200 },
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

        return `<tr class="cursor-pointer hover:bg-slate-50 transition-colors divide-x divide-slate-200" data-task="${encodeURIComponent(JSON.stringify(task))}">
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
            const task = JSON.parse(decodeURIComponent(row.dataset.task));
            openTaskModal(task);
        });
    });
}

// =================================================================
// LÓGICA REFAZERADA DO KANBAN COM TAILWIND CSS
// =================================================================

// 1. Objeto de configuração usando classes do Tailwind
const kanbanColumnsConfig = [
    { status: 'Em desenvolvimento', headerClasses: 'bg-gray-200 text-gray-800' },
    { status: 'Planejado', headerClasses: 'bg-slate-300 text-slate-800' },
    { status: 'Pendente', headerClasses: 'bg-yellow-300 text-yellow-800' },
    { status: 'Em curso', headerClasses: 'bg-cyan-500 text-white' },
    { status: 'Implementado', headerClasses: 'bg-green-600 text-white' }
    // As cores foram mapeadas para as classes do Tailwind mais próximas.
    // Ex: #e0e0e0 -> bg-gray-200, #17a2b8 -> bg-cyan-500
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
        
        const cardsHtml = tasks.map(task => `
            <div 
                class="kanban-card bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow" 
                data-task="${encodeURIComponent(JSON.stringify(task))}"
            >
                <p class="font-semibold text-slate-800 line-clamp-2">${task.Atividade}</p>
                <p class="mt-2 text-xs text-slate-500">${task['Plano de ação']}</p>
            </div>
        `).join('');

        return `
            <div class="w-80 flex-shrink-0 flex flex-col">
                <!-- CABEÇALHO FIXO (STICKY) -->
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
            const task = JSON.parse(decodeURIComponent(card.dataset.task));
            openTaskModal(task);
        });
    });
}