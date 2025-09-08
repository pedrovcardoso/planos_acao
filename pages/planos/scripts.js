const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0) {
  const navType = navEntries[0].type;
  console.log("Tipo de navegação:", navType); 
  // valores possíveis: "navigate", "reload", "back_forward", "prerender"
}

//================================================================================
// busca os dados e inicia os scripts
//================================================================================
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

    fillStatCards(jsonPlanos)
    fillGanttData(jsonPlanos)
    gerarCards(jsonPlanos)
    setupFilters()

    toggleLoading(false)
})















//================================================================================
// cards numéricos da parte inicial da página
//================================================================================
function fillStatCards(jsonPlanos) {
  const statIds = {
    emAndamento: 'stat-emAndamento',
    acoesEmCurso: 'stat-acoesEmCurso',
    emDesenvolvimento: 'stat-emDesenvolvimento',
    emAtraso: 'stat-emAtraso'
  }

  const stats = {
    emAndamento: 0,
    acoesEmCurso: 0,
    emDesenvolvimento: 0,
    emAtraso: 0
  }

  // Contagem em jsonPlanos
  Object.values(jsonPlanos).forEach(({ Status }) => {
    if (Status === 'Em curso') stats.emAndamento++
    else if (Status === 'Em desenvolvimento') stats.emDesenvolvimento++
  })

  // Contagem em jsonAcoes
  Object.values(jsonAcoes).forEach(({ Status }) => {
    if (Status === 'Em curso') stats.acoesEmCurso++
    else if (Status === 'Pendente') stats.emAtraso++
  })

  // Atualiza DOM
  Object.entries(stats).forEach(([key, value]) => {
    const el = document.getElementById(statIds[key])
    if (el) el.innerText = value
  })
}















//================================================================================
// configurações gerais para criar o gantt
//================================================================================
function fillGanttData(jsonPlanos) {
  const root = document.documentElement;
  const monthWidth = parseInt(getComputedStyle(root).getPropertyValue('--month-width'))

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');

    ganttRowsContainer.innerHTML = ""
    taskListContainer.innerHTML = "";
    monthsHeader.innerHTML = "";
    ganttTimelineContainer.scrollLeft = 0;

//================================================================================
// Calcula e cria as colunas de meses
//================================================================================
    let minDate = new Date(Math.min(
        ...jsonPlanos
            .filter(task => task["Data início"])
            .map(task => new Date(task["Data início"]+'T10:00:00'))
    ));
    let maxDate = new Date(Math.max(
        ...jsonPlanos
            .filter(task => task["Data fim"] || task["Data início"])
            .map(task => new Date(task["Data fim"] ? task["Data fim"]+'T10:00:00' : task["Data início"]+'T10:00:00'))
    ));

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
        monthElement.className = 'flex-shrink-0 text-center text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap py-[10px] border-r border-[#e0e0e0] box-border w-[var(--month-width)]';
        monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        monthsHeader.appendChild(monthElement);
        timelineWidth += monthWidth;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    ganttRowsContainer.style.width = `${timelineWidth}px`;
    monthsHeader.style.width = `${timelineWidth}px`;
    
    function calculatePosition(date) {
        const targetDate = new Date(date+'T10:00:00');
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthsDiff = (year - firstMonth.getFullYear()) * 12 + (month - firstMonth.getMonth());
        const dayOfMonth = targetDate.getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOffset = (dayOfMonth / daysInMonth) * monthWidth;
        return (monthsDiff * monthWidth) + dayOffset;
    }

    const positionToday = calculatePosition(new Date().toLocaleDateString().split("/").reverse().join("-"));
    const todayBar = document.createElement('div');
    todayBar.id = 'todayBar';
    todayBar.className = 'absolute h-full border-l-2 border-dashed border-[lightcoral] z-[1]';
    ganttRowsContainer.appendChild(todayBar);
    todayBar.style.left = `${positionToday}px`;
    document.getElementById("todayBar").style.left = `${positionToday}px`;
    ganttTimelineContainer.scrollLeft = positionToday - 100;

//================================================================================
// Preenche os valores no gantt
//================================================================================
    jsonPlanos.forEach((task, index) => {
        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `
            <div>${task.Nome}</div>
            <div class="status-container"><div class="status-${(task.Status || '').replace(/\s+/g, '-')}">${task.Status || '-'}</div></div>
        `;
        taskListContainer.appendChild(taskRow);

        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'gantt-row-timeline';
        rowTimeline.dataset.rowIndex = index;

        if(task["Data início"] && task["Data fim"]){
            const startDate = task["Data início"]
            const endDate = task["Data fim"]
            const startOffset = calculatePosition(startDate);
            const endOffset = endDate ? calculatePosition(endDate) : startOffset+10;
            const durationWidth = endOffset - startOffset;

            const bar = document.createElement('div');
            bar.className = `absolute h-[20px] bg-[#3498db] rounded-[10px] top-1/2 -translate-y-1/2 z-[1] shadow-md`;
            bar.style.left = `${startOffset}px`;
            bar.style.width = `${durationWidth}px`;
            bar.title = `${task.Nome}: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
            const statusClass = `status-${task.Status.replace(/\s+/g, '-')}`;
            bar.classList.add(task.colorTag);

            rowTimeline.appendChild(bar);
        }

        ganttRowsContainer.appendChild(rowTimeline);
    });

//================================================================================
// resize das colunas
//================================================================================
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

//================================================================================
// Cabeçalho da linha de totais do gantt
//================================================================================
    taskListContainer.innerHTML += `
    <div class="gantt-row-task">
      <div style="grid-column: 1 / 3; color: gray;">
        <span style="font-weight: bold;">Total de ações:</span>
        <select id="select-heatmap">
          <option selected value="encerrando">encerrando no mês</option>
          <option value="acontecendo">acontecendo no mês</option>
        </select>
      </div>
    </div>`
    
  document.getElementById('select-heatmap').addEventListener("change", toggleHeatMap)

  toggleHeatMap()
}

//================================================================================
// Heatmap bakground timeline
//================================================================================
function toggleHeatMap(){
  const ganttRowsContainer = document.getElementById('gantt-rows');
  document.querySelectorAll(".gantt-heatmap").forEach(el => el.remove());
  document.querySelectorAll(".gantt-total-row").forEach(el => el.remove());

  const estilo = document.getElementById('select-heatmap').value;

  const heatMap = {};

  const root = document.documentElement;
  const monthWidth = parseInt(getComputedStyle(root).getPropertyValue('--month-width'))
  let minDate = new Date(Math.min(
      ...jsonPlanos
          .filter(task => task["Data início"])
          .map(task => new Date(task["Data início"]+'T10:00:00'))
  ));
  let maxDate = new Date(Math.max(
      ...jsonPlanos
          .filter(task => task["Data fim"] || task["Data início"])
          .map(task => new Date(task["Data fim"] ? task["Data fim"]+'T10:00:00' : task["Data início"]+'T10:00:00'))
  ));

  const today = new Date();
  today.setHours(0,0,0,0);

  if (minDate > today) minDate = new Date(today);
  if (maxDate < today) maxDate = new Date(today);

  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 2);

  let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let heatDate = new Date(firstMonth);
  let monthIndex = 0;

  while (heatDate <= maxDate) {
    const inicioDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth(), 1, 0, 0);
    const fimDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth() + 1, 0, 23, 59, 59, 999); 

    let count = 0;

    if (estilo === "encerrando") {
        jsonAcoes.forEach((acao, i) => {
            if (acao["Data fim"]) {
                const end = new Date(acao["Data fim"]+'T10:00:00');
                if (end >= inicioDoMes && end <= fimDoMes) {
                    count++;
                }
            }
        });
    }   else if (estilo === "acontecendo") {
      // conta quem está ativo em qualquer parte do mês
      jsonAcoes.forEach(acao => {
        if (acao["Data de início"] && acao["Data fim"]) {
          const start = new Date(acao["Data de início"]+'T10:00:00');
          const end = new Date(acao["Data fim"]+'T10:00:00');
          if (start <= fimDoMes && end >= inicioDoMes) {
            count++;
          }
        }
      });
    }

    const key = `${heatDate.getFullYear()}-${heatDate.getMonth()}`;
    heatMap[key] = count;

    heatDate.setMonth(heatDate.getMonth() + 1);
    monthIndex++;
  }

  const maxCount = Math.max(...Object.values(heatMap), 1);

  const totalMonths = monthIndex;
  const timelineWidth = totalMonths * monthWidth;

  heatDate = new Date(firstMonth);
  monthIndex = 0;
  while (heatDate <= maxDate) {
    const key = `${heatDate.getFullYear()}-${heatDate.getMonth()}`;
    const count = heatMap[key] || 0;

    const normalizedIntensity = count / maxCount;
    const color = `rgba(219, 37, 37, ${normalizedIntensity * 0.7})`;

    const heatDiv = document.createElement('div');
    heatDiv.className = 'gantt-heatmap';
    heatDiv.style.position = 'absolute';
    heatDiv.style.left = `${monthIndex * monthWidth}px`;
    heatDiv.style.top = '0';
    heatDiv.style.width = `${monthWidth}px`;
    heatDiv.style.height = '100%';
    heatDiv.style.background = color;
    heatDiv.style.pointerEvents = 'none';
    ganttRowsContainer.appendChild(heatDiv);

    heatDate.setMonth(heatDate.getMonth() + 1);
    monthIndex++;
  }

//================================================================================
// linha de totais
//================================================================================
  const totalRow = document.createElement('div');
  totalRow.className = 'flex absolute left-0 top-full h-[30px] bg-[#f8f8f8] border-t border-gray-300 z-[2] text-base items-center';
  totalRow.style.display = 'flex';
  totalRow.style.width = `${timelineWidth}px`;

  let totalDate = new Date(firstMonth);
  let totalIndex = 0;
  while (totalDate <= maxDate) {
      const key = `${totalDate.getFullYear()}-${totalDate.getMonth()}`;
      const count = heatMap[key] || 0;

      const cell = document.createElement('div');
      cell.className = 'h-full flex items-center justify-center font-bold text-gray-500';
      cell.style.width = `${monthWidth}px`;
      cell.style.textAlign = 'center';
      cell.textContent = count;

      totalRow.appendChild(cell);

      totalDate.setMonth(totalDate.getMonth() + 1);
      totalIndex++;
  }
  ganttRowsContainer.appendChild(totalRow);
}















//================================================================================
// Cria os cards dos planos de ação
//================================================================================
/**
 * Cria todos os cards com informações dos planos de ação.
 * @param {object} force - Se true, fecha o modal sem verificar.
 */
function gerarCards(jsonPlanos) {
  const container = document.querySelector('.card-container');
  if (!container) return;

  container.innerHTML = jsonPlanos.map(plano => {
    // Lógica para formatar as datas (sem alterações)
    const dataInicio = plano["Data início"] 
      ? plano["Data início"].includes('-') 
        ? plano["Data início"].split('-').reverse().join('/') 
        : plano["Data início"] 
      : '-';
    const dataFim = plano["Data fim"] 
      ? typeof plano["Data fim"] === "string" && plano["Data fim"].includes('-') 
        ? plano["Data fim"].split('-').reverse().join('/') 
        : plano["Data fim"] 
      : '-';

    // O encodeURIComponent garante que nomes com espaços ou caracteres especiais funcionem na URL
    const planoNomeEncoded = encodeURIComponent(plano.Nome);

    return `
      <div class="relative bg-white border border-slate-200 rounded-xl p-5 shadow-md flex flex-col
                  transition-all duration-300 hover:shadow-xl">
        
        <div class="absolute top-0 right-0 p-3">
          <div class="relative">
            <!-- Botão que abre o menu -->
            <button type="button" class="card-menu-button rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            <!-- O menu suspenso (dropdown), que começa escondido -->
            <div class="card-menu-dropdown hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-10">
              <div class="py-1">
                ${plano.Status!=='Em desenvolvimento' ? 
                  `<a href="../acoes/index.html?plano=${planoNomeEncoded}" class="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Ver Ações</a>` : 
                  '<span class="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 $pointer-events-none opacity-50 cursor-default">Ver ações</span>'}
                
                <button type="button" 
                        class="edit-plano-button block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        data-plan-id="${plano.ID}">
                  Editar
                </button>
                <button type="button" 
                        class="delete-plano-button block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        data-plan-id="${plano.ID}">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
                
        <div class="flex-grow">
          <!-- O "pr-8" (padding-right) evita que o título fique embaixo do menu -->
          <h2 class="pr-8 text-xl font-bold text-sky-700 tracking-wide">${plano.Nome}</h2>

          <div class="mt-3 space-y-1 text-sm text-slate-600">
            <p><strong class="font-semibold text-slate-700">Processo SEI:</strong> ${plano["Processo SEI"]}</p>
            <p><strong class="font-semibold text-slate-700">Documento TCE:</strong> ${plano["Documento TCE"]}</p>
          </div>
        </div>
        
        <div class="mt-4">
          <details class="text-sm group mb-3">
            <summary class="font-semibold !text-slate-500 cursor-pointer list-none flex items-center gap-2
                            hover:!text-slate-700 group-open:!text-sky-700">
              Mais detalhes
              <span class="inline-block text-lg font-bold !text-slate-400 transition-transform duration-300 group-open:rotate-90">›</span>
            </summary>
            <div class="mt-2 pt-2 pl-2 text-slate-500 border-l-2 border-slate-200 space-y-1">
              <p><strong class="font-medium text-slate-600">Resolução:</strong> ${plano.Resolução || '-'}</p>
              <p><strong class="font-medium text-slate-600">Coordenador:</strong> ${plano.Coordenador || '-'}</p>
              <p><strong class="font-medium text-slate-600">Unidades:</strong> ${plano.Unidades || '-'}</p>
              <p><strong class="font-medium text-slate-600">Equipe:</strong> ${plano.Equipe || '-'}</p>
              <p><strong class="font-medium text-slate-600">SEI relacionados:</strong> ${plano['SEI relacionados'] || '-'}</p>
              <p><strong class="font-medium text-slate-600">Documentos relacionados:</strong> ${plano['Documentos relacionados'] || '-'}</p>
              <p><strong class="font-medium text-slate-600">Observações:</strong> ${plano['Observações'] || '-'}</p>
            </div>
          </details>
        
          <div class="pt-3 border-t border-slate-200 flex justify-between text-sm">
            <p class="font-medium text-slate-500"><strong>Início:</strong> <span class="font-semibold text-slate-700">${dataInicio}</span></p>
            <p class="font-medium text-slate-500"><strong>Fim:</strong> <span class="font-semibold text-slate-700">${dataFim}</span></p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  const addCardHtml = `
      <button id="add-new-plano-button" type="button" 
              class="relative flex flex-col items-center justify-center 
                     border-2 border-dashed border-slate-300 rounded-xl p-5 
                     text-slate-400 hover:border-sky-500 hover:text-sky-600 
                     transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400">
        
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span class="mt-2 font-bold text-lg">Criar Novo Plano</span>
      </button>
    `;

    container.innerHTML += addCardHtml;

    // Ativa a interatividade dos menus e botões
    setupAddButton();
    setupCardMenus();
    
    setupModalUI()
}

/**
 * Adiciona o listener de clique ao botão "Criar Novo Plano".
 */
function setupAddButton() {
    const addButton = document.getElementById('add-new-plano-button');
    if (addButton) {
        // Chama a mesma função de abrir o modal, mas sem passar um nome de plano
        addButton.addEventListener('click', () => openEditModal());
    }
}

/**
 * Adiciona eventos no menu do card (três pontinhos).
 */
function setupCardMenus() {
  const allMenuButtons = document.querySelectorAll('.card-menu-button');

  allMenuButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Impede que o clique no botão feche o menu imediatamente (veja o listener do window)
      event.stopPropagation();
      
      const dropdown = button.nextElementSibling;
      const isHidden = dropdown.classList.contains('hidden');

      // Primeiro, fecha todos os outros menus abertos
      document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));

      // Se o menu clicado estava escondido, mostra ele
      if (isHidden) {
        dropdown.classList.remove('hidden');
      }
    });
  });

  // Listener global para fechar os menus se o usuário clicar fora deles
  window.addEventListener('click', () => {
    document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));
  });
}

// =================================================================
// Modal de edição
// =================================================================
let currentPlanId = null;
let hasChanges = false;
let isNewPlan = false;


function setupModalUI() {
  // --- Configuração dos botões de edição ---
  document.querySelectorAll('.edit-plano-button').forEach(button => {
    button.addEventListener('click', () => openEditModal(button.dataset.planId));
  });

  // --- Configuração dos botões de exclusão ---
  document.querySelectorAll('.delete-plano-button').forEach(button => {
    button.addEventListener('click', () => openDeleteConfirmationModal());
  });

  // --- Controles do modal de edição ---
  const modalForm = document.getElementById('modal-form');
  if (modalForm) {
    // Marca alterações sempre que houver input
    modalForm.addEventListener('input', () => (hasChanges = true));
  }

  const modalBtnMap = {
    'modal-btn-close': () => closeEditModal(),
    'modal-btn-cancel': () => closeEditModal(),
    'modal-btn-save': handleSave,
    'confirm-btn-no': () => document.getElementById('confirmation-modal').classList.add('hidden'),
    'confirm-btn-yes': () => closeEditModal(true)
  };

  Object.entries(modalBtnMap).forEach(([id, handler]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  });

  // --- Controles do modal de confirmação de exclusão ---
  const deleteModal = document.getElementById('delete-confirmation-modal');
  if (deleteModal) {
    const deleteBtnMap = {
      'delete-confirm-btn-no': () => deleteModal.classList.add('hidden'),
      'delete-confirm-btn-yes': handleDelete
    };

    Object.entries(deleteBtnMap).forEach(([id, handler]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', handler);
    });
  }
}

function openEditModal(planId) {
  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('modal-form');
  const modalTitle = modal.querySelector('h3');
  
  currentPlanId = planId;

  form.reset();

  if (isNewPlan) {
    // --- MODO DE CRIAÇÃO ---
    modalTitle.textContent = 'Criar Novo Plano de Ação';
    form.querySelector('[name="Status"]').value = 'Planejado';
  } else {
    // --- MODO DE EDIÇÃO ---
    modalTitle.textContent = 'Editar Plano de Ação';

    const planData = jsonPlanos.find(p => p.ID === currentPlanId);
    Object.entries(planData).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = value;
    });
  }

  hasChanges = false;
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeEditModal(force = false) {
    const confirmationModal = document.getElementById('confirmation-modal');
    const editModal = document.getElementById('edit-modal');
    const body = document.body;

    // Se houver alterações não salvas e não for forçado o fechamento, abre o modal de confirmação
    if (hasChanges && !force) {
        confirmationModal.classList.remove('hidden');
        return
    }
    
    const form = document.getElementById('modal-form');
    form.reset(); 
    
    editModal.classList.add('hidden');
    confirmationModal.classList.add('hidden');
    
    hasChanges = false;
    isNewPlan = false;
    
    editModal.removeAttribute('data-plan-id'); 
    
    body.classList.remove('overflow-hidden');
}

async function handleSave() {
  if (!hasChanges) {
    closeEditModal(true);
    return;
  }

  // Botões do modal
  const saveBtn = document.getElementById('modal-btn-save');
  const cancelBtn = document.getElementById('modal-btn-cancel');
  const closeBtn = document.getElementById('modal-btn-close');

  // Converte o formulário em objeto
  const form = document.getElementById('modal-form');
  const formData = new FormData(form);
  const updatedPlan = Object.fromEntries(formData.entries());

  // Validação de campos obrigatórios
  const camposObrigatorios = ['Nome', 'Status'];
  const camposInvalidos = [];

  camposObrigatorios.forEach(campo => {
    if (!updatedPlan[campo] || updatedPlan[campo].trim() === '') {
      camposInvalidos.push(campo);
    }
  });

  if (camposInvalidos.length > 0) {
    alert(
      `Os seguintes campos são obrigatórios e não foram preenchidos:\n- ${camposInvalidos.join('\n- ')}`
    );
    return;
  }

  // Desabilita botões enquanto salva
  [saveBtn, cancelBtn, closeBtn].forEach(btn => (btn.disabled = true));
  saveBtn.textContent = 'Salvando...';

  try {
    const action = isNewPlan ? 'create' : 'update';
    const id = isNewPlan ? '' : currentPlanId;

    const response = await salvarArquivoNoOneDrive(id, 'planos.txt', action, updatedPlan);

    if (response?.status === 200) {
      setSessionMirror(action, response.data.uuid, updatedPlan, "jsonPlanos");
      window.location.reload();
    } else {
      throw new Error(response?.message || 'Erro desconhecido ao salvar');
    }
  } catch (error) {
    console.error('Falha ao salvar a tarefa:', error);
    alert(`Ocorreu um erro ao salvar: ${error.message}`);
    [saveBtn, cancelBtn, closeBtn].forEach(btn => (btn.disabled = false));
    saveBtn.textContent = 'Salvar';
  }
}

async function handleDelete() {
    const confirmButton = document.getElementById('delete-confirm-btn-yes');
    const cancelButton = document.getElementById('delete-confirm-btn-no');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');

    // Estado inicial dos botões para evitar repetição
    const originalConfirmText = confirmButton.textContent;

    // Desabilita botões para prevenir múltiplos cliques e indica o estado de carregamento.
    [confirmButton, cancelButton].forEach(btn => (btn.disabled = true));
    confirmButton.textContent = 'Excluindo...';

    try {
        const response = await salvarArquivoNoOneDrive(currentPlanId, 'planos.txt', 'delete', '');
        if (response.status === 200) {
            setSessionMirror('delete', response.data.uuid, null, "jsonPlanos");
            window.location.reload();
        } else {
            const errorMessage = response.message || `Erro desconhecido (Status: ${response.status})`;
            alert(`Erro ao excluir: ${errorMessage}`);
            
            document.getElementById('modal-btn-save').disabled = false;
            document.getElementById('modal-btn-save').textContent = 'Salvar';
            document.getElementById('modal-btn-cancel').disabled = false;
            document.getElementById('modal-btn-close').disabled = false;
        }
    } catch (error) {
        console.error("Falha ao excluir a tarefa:", error);
        alert("Ocorreu um erro inesperado ao excluir a tarefa. Por favor, tente novamente.");
    } finally {
        [confirmButton, cancelButton].forEach(btn => (btn.disabled = false));
        confirmButton.textContent = originalConfirmText;
        deleteConfirmationModal.classList.add('hidden');
    }
}

function openDeleteConfirmationModal() {
    const planData = jsonPlanos.find(p => p.ID === currentPlanId);

    const modal = document.getElementById('delete-confirmation-modal');
    const nameSpan = document.getElementById('plano-to-delete-name');

    nameSpan.textContent = `"${planData.Nome}"`;

    modal.classList.remove('hidden');
}















//================================================================================
// painel de filtros
//================================================================================

// configurações gerais
const filtersConfig = [
    ["Unidades", "filter-Unidade"],
    ["Equipe", "filter-Equipe"]
]

function setupFilters() {
    // adiciona eventos para todos filtros listados em filtersConfig
    filtersConfig.forEach(([ , elementId ]) => {
        const el = document.getElementById(elementId)
        if (el) {
            el.addEventListener('change', aplicarFiltros)
        }
    })

    // período
    document.getElementById('filter-periodo')
        .addEventListener('change', function () {
            const inputsDiv = document.getElementById('periodo-especifico-inputs')
            inputsDiv.style.display = (this.value === 'especifico') ? 'flex' : 'none'
            if (this.value !== 'especifico') aplicarFiltros()
        })

    // período específico
    document.getElementById('filtrar-especifico')
        .addEventListener('click', aplicarFiltros)

    fillUnidadeFilter()
    fillEquipeFilter()
}

/**
 * Normaliza string para comparação
 */
function normalizeString(str) {
    if (!str) return ""
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "")
}

/**
 * Aplica todos os filtros ativos e atualiza as seções
 */
function aplicarFiltros() {
    let jsonFiltrado = [...jsonPlanos]

    // filtro por unidade
    filtersConfig.forEach(([chave, elementId]) => {
        const filterElement = document.getElementById(elementId)
        if (filterElement && filterElement.value !== '-') {
            jsonFiltrado = filterJson(jsonFiltrado, chave, normalizeString(filterElement.value))
        }
    })

    // filtro por período
    const periodo = document.getElementById('filter-periodo').value
    if (periodo && periodo !== '-') {
        jsonFiltrado = filtrarPorPeriodo(jsonFiltrado, periodo)
    }

    // aplica nas seções
    fillStatCards(jsonFiltrado)
    fillGanttData(jsonFiltrado)
    gerarCards(jsonFiltrado)
}

/**
 * Filtro genérico chave/valor
 */
function filterJson(json, chave, valor) {
    return json.filter(item => {
        if (typeof item[chave] === "string" && typeof valor === "string") {
            return normalizeString(item[chave]).includes(valor)
        }
        return item[chave] === valor
    })
}

/**
 * Limpa filtros
 */
function clearFilters() {
    filtersConfig.forEach(([, elementId]) => {
        document.getElementById(elementId).value = '-'
    })
    document.getElementById('filter-periodo').value = '-'
    document.getElementById('periodo-especifico-inputs').style.display = 'none'

    aplicarFiltros()
}

/**
 * Preenche filtro de unidades
 */
function fillUnidadeFilter() {
    const filtro = document.getElementById('filter-Unidade')
    let valores = []

    Object.values(jsonPlanos).forEach(item => {
        const unidades = item["Unidades"].split(', ')
        valores.push(...unidades)
    })

    valores = [...new Set(valores)].filter(v => v.trim() !== '').sort()

    valores.forEach(valor => {
        const option = document.createElement('option')
        option.value = normalizeString(valor)
        option.textContent = valor
        filtro.appendChild(option)
    })
}

/**
 * Preenche filtro de equipe
 */
function fillEquipeFilter() {
    const filtro = document.getElementById('filter-Equipe')
    let valores = []

    Object.values(jsonPlanos).forEach(item => {
        const unidades = item["Equipe"].split(', ')
        valores.push(...unidades)
    })

    valores = [...new Set(valores)].filter(v => v.trim() !== '').sort()

    valores.forEach(valor => {
        const option = document.createElement('option')
        option.value = normalizeString(valor)
        option.textContent = valor
        filtro.appendChild(option)
    })
}

/**
 * Filtra lista pelo período selecionado
 */
function filtrarPorPeriodo(lista, periodo) {
    let inicio, fim

    if (periodo === 'mes') {
        const now = new Date()
        inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    } else if (periodo === 'semana') {
        const now = new Date()
        inicio = new Date(now)
        inicio.setDate(now.getDate() - now.getDay() + 1)
        inicio.setHours(0, 0, 0, 0)
        fim = new Date(inicio)
        fim.setDate(inicio.getDate() + 4)
        fim.setHours(23, 59, 59, 999)

    } else if (periodo === 'especifico') {
        const inicioVal = document.getElementById('periodo-inicio').value
        const fimVal = document.getElementById('periodo-fim').value
        if (!inicioVal || !fimVal) return lista

        inicio = new Date(inicioVal); inicio.setHours(0, 0, 0, 0)
        fim = new Date(fimVal); fim.setHours(23, 59, 59, 999)
    }

    if (inicio && fim) {
        return lista.filter(task => {
            const start = new Date(task["Data início"])
            const end = new Date(task["Data fim"])
            return (start <= fim && end >= inicio)
        })
    }

    return lista
}