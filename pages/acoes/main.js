document.addEventListener('DOMContentLoaded', async function () {
  toggleLoading(true);

  try {
    const requiredData = await obterDados(['acoes.txt', 'planos.txt', 'notificacoes.txt']);

    if (!requiredData) {
      throw new Error("Não foi possível obter os dados do projeto.");
    }

    jsonAcoes = requiredData['acoes.txt'];
    jsonPlanos = requiredData['planos.txt'];
    jsonNotificacoes = requiredData['notificacoes.txt'];

    ordenarJsonAcoes(jsonAcoes);

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(src);
            script.onerror = () => reject(new Error(`Erro ao carregar script: ${src}`));
            document.head.appendChild(script);
        });
    }

    Promise.all([
        loadScript('../../components/multiple_select.js'),
        loadScript('../../components/custom-table.js')
    ]).then(() => {
        setupFilters();
        fillGanttData(jsonAcoes);
        populateActionsTable(jsonAcoes);
        populateKanbanBoard(jsonAcoes);

        setPlanoFilterFromUrl();
        toggleLoading(false);
    }).catch(err => {
        console.error(err);
    });      

    setupViewSwitcher();
    setupModalControls();
    setupGantt();

  } catch (error) {
    console.error("Ocorreu um erro no carregamento da página:", error);
  } finally {
    toggleLoading(false);
  }
});

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

function setupViewSwitcher() {
    const radioButtons = document.querySelectorAll('input[name="option"]');
    const viewSections = document.querySelectorAll('.view-section');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            // Esconde todas as seções
            viewSections.forEach(section => {
                section.style.display = 'none';
            });

            // Mostra a seção correspondente
            const selectedViewId = this.id + '-view';
            const selectedView = document.getElementById(selectedViewId);
            if (selectedView) {
                selectedView.style.display = 'block';
            }
        });
    });
}










// =================================================================
// PAINEL DE FILTROS
// =================================================================

const filtersConfig = [
    // [nome do filtro, id do select, está dentro do objPessoa]
    ["Plano de ação", "filter-planoAcao", false],
    ["Status", "filter-Status", false],
    ["Nome", "filter-Nome", true],
    ["Unidade", "filter-Unidade", true]
];

function normalizeString(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "");
}

function setupFilters() {
    filtersConfig.forEach(([chave, elementId, isObjPessoa]) => {
        if (isObjPessoa) {
            fillFilterObjPessoas(chave);
        } else {
            const selectElement = document.getElementById(elementId);
            if (!selectElement) return;

            const opcoes = Object.values(jsonAcoes)
                .map(value => value[chave])
                .filter(Boolean)
                .flatMap(v => v.split(', ').map(item => item.trim()));

            const opcoesUnicas = [...new Set(opcoes)].sort((a, b) =>
                a.localeCompare(b, 'pt', { sensitivity: 'base' })
            );

            opcoesUnicas.forEach(valor => {
                const option = new Option(valor, normalizeString(valor));
                selectElement.add(option);
            });
        }

        createCustomSelect(elementId);
        onCustomSelectChange(elementId, filtrarValores);
    });

    document.getElementById('filter-periodo').addEventListener('change', function () {
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        inputsDiv.style.display = this.value === 'especifico' ? 'flex' : 'none';
        if (this.value !== 'especifico') {
            filtrarValores();
        }
    });
    document.getElementById('filtrar-especifico').addEventListener('click', filtrarValores);

    setPlanoFilterFromUrl();
}

function fillFilterObjPessoas(key) {
    const filtro = document.getElementById(`filter-${key}`);
    if (!filtro) return;

    const valores = new Set();

    Object.values(jsonPlanos).forEach(plan => {
        const objPessoas = plan.objPessoas || [];
        objPessoas.forEach(pessoa => {
            if (pessoa[key] && pessoa[key].trim() !== '') {
                valores.add(pessoa[key].trim());
            }
        });
    });

    const valoresOrdenados = [...valores].sort((a, b) =>
        a.localeCompare(b, 'pt', { sensitivity: 'base' })
    );

    valoresOrdenados.forEach(valor => {
        const option = new Option(valor, normalizeString(valor));
        filtro.appendChild(option);
    });
}

function setPlanoFilterFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const planoNome = params.get('plano');
    if (!planoNome) return;

    const selectElement = document.getElementById('filter-planoAcao');
    if (selectElement) {
        const valorNormalizado = normalizeString(decodeURIComponent(planoNome));
        const optionToSelect = Array.from(selectElement.options).find(opt => opt.value === valorNormalizado);

        if (optionToSelect) {
            optionToSelect.selected = true;
            createCustomSelect('filter-planoAcao');
            filtrarValores();
        }
    }
}

function filterJson(json, chave, valoresSelecionados) {
    return json.filter(item => {
        const itemValores = (item[chave] || '').split(',').map(v => normalizeString(v.trim()));
        return itemValores.some(v => valoresSelecionados.includes(v));
    });
}

function atualizarVisualizacoes(dados) {
    fillGanttData(dados);
    populateKanbanBoard(dados);
    populateActionsTable(dados);
}

function filtrarValores() {
    let jsonFiltrado = [...jsonAcoes];

    filtersConfig.forEach(([chave, elementId, isObjPessoa]) => {
        const selectedValues = getCustomSelectValues(elementId);
        const customComponent = document.querySelector(`.custom-select-container[data-select-id="${elementId}"]`);

        if (!selectedValues || selectedValues.length === 0) {
            if (customComponent) customComponent.querySelector('.relative.z-10').classList.remove('border-sky-500', 'font-semibold');
            return;
        }

        if (isObjPessoa) {
            const validPlanUnitKeys = new Set();

            Object.values(jsonPlanos).forEach(plan => {
                (plan.objPessoas || []).forEach(pessoa => {
                    if (selectedValues.includes(normalizeString(pessoa[chave]))) {
                        const key = `${plan.Nome}|${pessoa.Unidade}`;
                        validPlanUnitKeys.add(key);
                    }
                });
            });

            jsonFiltrado = jsonFiltrado.filter(action => {
                const actionPlan = action['Plano de ação'];
                const actionUnits = action.Unidades || [];

                return actionUnits.some(unit => {
                    const testKey = `${actionPlan}|${unit}`;
                    return validPlanUnitKeys.has(testKey);
                });
            });

        } else {
            jsonFiltrado = filterJson(jsonFiltrado, chave, selectedValues);
        }

        if (customComponent) customComponent.querySelector('.relative.z-10').classList.add('border-sky-500', 'font-semibold');
    });

    jsonFiltrado = filtrarPeriodo(jsonFiltrado);
    atualizarVisualizacoes(jsonFiltrado);
}

function clearFilters() {
    filtersConfig.forEach(([chave, elementId]) => {
        const element = document.getElementById(elementId);
        if (element) {
            Array.from(element.options).forEach(opt => opt.selected = false);
            createCustomSelect(elementId);
        }
    });

    document.getElementById('filter-periodo').value = '-';
    document.getElementById('periodo-inicio').value = '';
    document.getElementById('periodo-fim').value = '';
    document.getElementById('periodo-especifico-inputs').style.display = 'none';

    history.replaceState(null, '', window.location.pathname);

    filtrarValores();
}

function filtrarPeriodo(dadosParaFiltrar) {
    const filterElement = document.getElementById('filter-periodo')
    const value = filterElement.value;
    let dataInicio, dataFim;

    const agora = new Date();

    switch (value) {
        case 'semana':
            filterElement.classList.add('filter-active')
            const primeiroDia = new Date(agora);
            primeiroDia.setDate(agora.getDate() - agora.getDay() + 1);
            dataInicio = primeiroDia;
            
            const ultimoDia = new Date(primeiroDia);
            ultimoDia.setDate(primeiroDia.getDate() + 4);
            dataFim = ultimoDia;
            break;
        
        case 'mes':
            filterElement.classList.add('filter-active')
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
            dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
            break;

        case 'especifico':
            filterElement.classList.add('filter-active')
            const inicioInput = document.getElementById('periodo-inicio').value;
            const fimInput = document.getElementById('periodo-fim').value;
            if (inicioInput && fimInput) {
                dataInicio = new Date(inicioInput);
                dataFim = new Date(fimInput);
            }
            break;

        default:
            filterElement.classList.remove('filter-active')
            return dadosParaFiltrar;
    }

    if (!dataInicio || !dataFim) {
        return dadosParaFiltrar;
    }

    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);

    return dadosParaFiltrar.filter(task => {
        const start = new Date(task["Data de início"] + 'T00:00:00');
        const end = new Date(task["Data fim"] + 'T23:59:59');
        return start <= dataFim && end >= dataInicio;
    });
}










// =================================================================
// LÓGICA REESTRUTURADA E FINAL DO MODAL DE AÇÕES
// =================================================================

let currentTask = null; 
let courrentNotificacoesTask = {}
let deletedNotificationIds = [];
let hasChanges = false;
let isNewTaskMode = false

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

    document.getElementById('add-notification-btn').addEventListener('click', function() {
        createNotificacao()
        hasChanges = true;
    });

    const containerNotificacao = document.getElementById('notifications-edit-list');

    if (!containerNotificacao) return;

    containerNotificacao.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.btn-delete-notification');
        if (deleteButton) {
            const notificationToDelete = deleteButton.closest('.container-notificacao');
            deleteNotification(notificationToDelete);
            hasChanges = true;
        }
    });

    containerNotificacao.addEventListener('change', function(event) {
        const target = event.target;
        if (target.matches('.notification-type, .notification-date, .recipients-list input[type="checkbox"]')) {
            hasChanges = true;
        }
    });
}

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

function openTaskModal(id) {
    isNewTaskMode = false;
    task = jsonAcoes.filter(t => t.ID === id)[0];

    document.getElementById('task-modal-container').setAttribute('data-task-id', task.ID);

    switchToViewMode(true);
    document.getElementById('task-modal-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

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
    setElementText('modal-view-observacoes', task['Observações']);

    const statusEl = document.getElementById('modal-view-status');
    const defaultStatusClass = 'flex justify-center items-center text-sm px-1.5 rounded h-6'
    if (statusEl) {
        statusEl.innerText = task.Status;
        statusEl.className = 'status-' + (task.Status || '').replace(/\s+/g, '-') + ' ' + defaultStatusClass;
    }

    const unidadesContainer = document.getElementById('unidades-view-container');
    unidadesContainer.innerHTML = ''
    const unidades = task['Unidades'];
    if (unidades && unidades.length > 0) {
        unidades.forEach(unidade => {
            unidadesContainer.innerHTML += `
        <span class="flex items-center gap-1.5 bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-1 rounded">
            ${unidade}
        </span>
        `;
            });
        } else {
            unidadesContainer.innerHTML = `
        <span class="text-gray-500 italic">Nenhuma unidade cadastrada</span>
        `;
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

    courrentNotificacoesTask = jsonNotificacoes.filter(a => a.idAcao === id)
    populateViewNotificacoes(courrentNotificacoesTask)
}

function formatarDataExtenso(isoDate) {
    const meses = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
    ];
    const [ano, mes, dia] = isoDate.split("-");
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}

function populateViewNotificacoes(courrentNotificacoesTask) {
    const container = document.getElementById("notifications-list");
    container.innerHTML = "";

    if (courrentNotificacoesTask.length === 0) container.innerHTML = `<span class="text-gray-500 italic">Nenhuma notificação cadastrada</span>`

    courrentNotificacoesTask.forEach(notif => {
        const acao = jsonAcoes.find(a => a.ID === notif.idAcao);
        if (!acao) return;

        const plano = jsonPlanos.find(p => p.Nome === acao["Plano de ação"]);
        if (!plano) return;

        const destinatarios = plano.objPessoas.filter(pessoa =>
            notif.mailList.includes(pessoa.Email)
        );

        let colorClasses = "";
        let iconSVG = "";

        switch (notif.tipo) {
            case "inicio":
                colorClasses = "bg-green-100 text-green-700";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                           </svg>`;
                break;
            case "aviso":
                colorClasses = "bg-sky-100 text-sky-700";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                           </svg>`;
                break;
            case "pendencia":
                colorClasses = "bg-amber-100 text-amber-600";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.001-1.742 3.001H4.42c-1.532 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                           </svg>`;
                break;
            default:
                colorClasses = "bg-slate-100 text-slate-700";
        }

        const notifDiv = document.createElement("div");
        notifDiv.className = "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md";

        function getInitials(nome) {
            const partes = nome.trim().split(" ");
            const primeira = partes[0][0].toUpperCase();
            const ultima = partes[partes.length - 1][0].toUpperCase();
            return primeira + ultima;
        }

        notifDiv.innerHTML = `
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="flex min-w-0 items-center gap-4">
                    <div class="flex-shrink-0 rounded-full ${colorClasses} p-2">${iconSVG}</div>
                    <div class="min-w-0">
                        <p class="truncate font-semibold text-slate-800" title="${formatarDataExtenso(notif.data)}">
                            ${formatarDataExtenso(notif.data)}
                        </p>
                        <p class="text-sm text-slate-500">Alerta de ${notif.tipo}</p>
                    </div>
                </div>

                <div class="w-full md:w-auto md:max-w-xs">
                    <p class="mb-2 text-xs font-medium uppercase text-slate-500 md:text-right">Destinatários</p>
                    <div class="flex items-center md:justify-end">
                        ${destinatarios.map((pessoa, idx) => `
                            <span title="${pessoa.Nome}" 
                                  class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-700 ring-2 ring-white ${idx > 0 ? "-ml-3" : ""}">
                                  ${getInitials(pessoa.Nome)}
                            </span>
                        `).join("")}
                    </div>

                    ${destinatarios.length > 0
                ? `
                        <details class="group mt-2">
                            <summary class="list-none cursor-pointer text-right">
                                <span class="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-800">
                                    Ver lista completa
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200 group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </summary>
                            <div class="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50/50">
                                <ul class="divide-y divide-slate-200">
                                    ${destinatarios.map(pessoa => `
                                        <li class="p-3 text-sm">
                                            <p class="font-semibold text-slate-800">${pessoa.Nome}</p>
                                            <p class="text-slate-600">${pessoa.Email}</p>
                                            <p class="text-xs text-slate-500">${pessoa.Unidade}</p>
                                        </li>
                                    `).join("")}
                                </ul>
                            </div>
                        </details>
                        `
                : ""
            }
                </div>
            </div>
        `;

        container.appendChild(notifDiv);
    });
}

function deleteNotification(notificationElement) {
    if (notificationElement) {
        const notificationId = notificationElement.dataset.notificationId;
        
        // Se a notificação tinha um ID (ou seja, já existia no banco),
        // adiciona o ID à lista de exclusão.
        if (notificationId) {
            deletedNotificationIds.push(notificationId);
        }

        notificationElement.remove();
        hasChanges = true;
    }
}

function createNotificacao(notificacao = {}) {
    const template = document.getElementById('notification-template');
    const container = document.getElementById('notifications-edit-list');
    const clone = template.content.cloneNode(true);

    // --- Seletores dos Elementos Principais ---
    const card = clone.querySelector('.container-notificacao');
    const status = notificacao.status || "";
    if (notificacao.ID) {
        card.dataset.notificationId = notificacao.ID;
    }

    // --- Seletores para alternância de visibilidade ---
    const editableViews = clone.querySelectorAll('.editable-view');
    const sentViews = clone.querySelectorAll('.sent-view-text');
    const actionSlot = clone.querySelector('.action-slot');
    const statusSlot = clone.querySelector('.status-slot');
    const infoTooltip = clone.querySelector('.info-tooltip');
    const recipientsEditable = clone.querySelector('.recipients-list-editable');
    const recipientsSent = clone.querySelector('.recipients-list-sent');

    if (status === "enviado") {
        // --- MODO ENVIADO (Inalterado) ---
        actionSlot.classList.add('hidden');
        statusSlot.classList.remove('hidden');
        infoTooltip.classList.add('hidden');
        editableViews.forEach(el => el.classList.add('hidden'));
        sentViews.forEach(el => el.classList.remove('hidden'));
        recipientsEditable.classList.add('hidden');
        recipientsSent.classList.remove('hidden');

        const dataFormatada = notificacao.data ? new Date(notificacao.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
        clone.querySelector('.sent-type').textContent = notificacao.tipo.charAt(0).toUpperCase() + notificacao.tipo.slice(1);
        clone.querySelector('.sent-date').textContent = dataFormatada;

        if (notificacao.mailList && notificacao.mailList.length > 0) {
            notificacao.mailList.forEach(email => {
                const p = document.createElement('p');
                p.className = 'w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';
                p.textContent = email;
                recipientsSent.appendChild(p);
            });
        } else {
             recipientsSent.innerHTML = '<p class="px-3 py-2 text-sm text-slate-500 italic">Nenhum destinatário.</p>';
        }

    } else {
        // --- MODO EDITÁVEL ---
        actionSlot.classList.remove('hidden');
        statusSlot.classList.add('hidden');
        infoTooltip.classList.remove('hidden');
        editableViews.forEach(el => el.classList.remove('hidden'));
        sentViews.forEach(el => el.classList.add('hidden'));
        recipientsEditable.classList.remove('hidden');
        recipientsSent.classList.add('hidden');

        clone.querySelector('.notification-type').value = notificacao.tipo || 'aviso';
        clone.querySelector('.notification-date').value = notificacao.data || '';

        // ALTERAÇÃO AQUI: Passamos a mailList para a função de popular a tabela.
        // Usamos '|| []' para garantir que sempre seja um array, mesmo para notificações novas.
        populateTabelaNotificacoes(recipientsEditable, notificacao.mailList || []);
    }
    
    container.appendChild(clone);
    if (!notificacao.ID) {
        hasChanges = true; 
    }
}

function populateTabelaNotificacoes(recipientsListElement, mailList = []) {
    // A lógica para obter 'pessoas' permanece a mesma
    const unidades = getCustomSelectValues('unidades-multi-select') || [];
    const taskContainer = document.getElementById('task-modal-container');
    if (!taskContainer) return;

    const id = taskContainer.dataset.taskId;
    if (!id) return;

    const task = jsonAcoes.find(t => t.ID === id);
    const plan = jsonPlanos.find(t => task && t.Nome === task["Plano de ação"]);
    const pessoas = plan && plan.objPessoas ? plan.objPessoas.filter(p => unidades.includes(p.Unidade)) : [];

    recipientsListElement.innerHTML = ''; 

    if (pessoas.length === 0) {
        recipientsListElement.innerHTML = `<li class="p-2 text-slate-600 italic text-sm">
                                               Selecione a unidade responsável para exibir os destinatários.
                                           </li>`;
    } else {
        // ALTERAÇÃO AQUI: A lógica de renderização do checkbox foi atualizada.
        const listItemsHTML = pessoas.map(pessoa => {
            // Para cada pessoa, verificamos se o email dela está na mailList fornecida.
            const isChecked = mailList.includes(pessoa.Email);

            // Usamos a variável 'isChecked' para adicionar ou não o atributo 'checked'.
            return `
                <li class="p-2 hover:bg-slate-50">
                    <label class="flex items-center justify-between gap-4 cursor-pointer">
                        <div class="text-sm flex-1 min-w-0">
                            <p class="font-semibold text-slate-800 truncate">${pessoa.Nome}</p>
                            <p class="text-slate-600 truncate">${pessoa.Email}</p>
                            <p class="text-xs text-slate-500 truncate">${pessoa.Unidade}</p>
                        </div>
                        <input type="checkbox" ${isChecked ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                    </label>
                </li>
            `;
        }).join('');
        recipientsListElement.innerHTML = listItemsHTML;
    }
}

function switchToEditMode() {
    const container = document.getElementById("notifications-edit-list");
    [...container.children].forEach(child => {
        if (child.tagName.toLowerCase() !== "template") {
            container.removeChild(child);
        }
    });

    populateEditMode(currentTask);
    
    document.getElementById('modal-view-plano').classList.add('hidden');
    document.getElementById('modal-view-atividade').innerText = 'Editar Ação';

    document.getElementById('view-mode-content').classList.add('hidden');
    document.getElementById('view-mode-buttons').classList.add('hidden');
    
    document.getElementById('edit-mode-content').classList.remove('hidden');
    document.getElementById('edit-mode-buttons').classList.remove('hidden');

    hasChanges = false;
}

function populateEditMode() {
    const id = document.getElementById('task-modal-container').dataset.taskId
    task = jsonAcoes.find(t => t.ID === id);
    plan = jsonPlanos.find(t => t.Nome === task["Plano de ação"]);

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

    const multSelect = document.getElementById('unidades-multi-select')
    const fragment = document.createDocumentFragment();
    const uniqueUnidades = [...new Set(plan.objPessoas.map(p => p.Unidade.trim()))].sort();

    uniqueUnidades.forEach(unidade => {
        const option = document.createElement('option');
        option.value = unidade;
        option.innerText = unidade;
        option.selected = task.Unidades.includes(unidade) ? true : false;
        fragment.appendChild(option);
    });
    multSelect.innerHTML = "";
    multSelect.appendChild(fragment);
    
    createCustomSelect('unidades-multi-select');

    onCustomSelectChange('unidades-multi-select', (values) => {
        populateTabelaNotificacoes(values);
        hasChanges = true;
    });

    const notificacoes = jsonNotificacoes.filter(n => n.idAcao === id);
    notificacoes.forEach(notificacao => {
        createNotificacao(notificacao)
    });
}

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

    let currentTask = null; 
    let courrentNotificacoesTask = {}
    let hasChanges = false;
    let isNewTaskMode = false
}

function clearEditForm() {
    const form = document.getElementById('modal-edit-form');
    form.reset();

    document.getElementById('task-modal-container').removeAttribute('data-task-id')
    
    document.getElementById('edit-status'). value = 'Selecione um valor'

    populatePlanosSelect()
}

function getNotificationsDataFromDOM() {
    const container = document.getElementById('notifications-edit-list');
    if (!container) {
        console.warn('Contêiner de notificações #notifications-edit-list não encontrado.');
        return [];
    }

    const notificationElements = container.querySelectorAll('.container-notificacao');
    const notificationsData = [];

    notificationElements.forEach(element => {
        // --- ETAPA 1: FILTRAR OS CARDS ---
        // Identifica o slot de status. Se ele NÃO estiver escondido, significa
        // que este é um card "Enviado" e deve ser ignorado.
        const statusSlot = element.querySelector('.status-slot');
        if (statusSlot && !statusSlot.classList.contains('hidden')) {
            return; // Pula para a próxima iteração (equivalente a 'continue' em um for loop).
        }

        // --- ETAPA 2: EXTRAIR DADOS (APENAS DE CARDS EDITÁVEIS) ---
        const notificationId = element.dataset.notificationId || null;
        
        // Lê os valores dos inputs que estão na visão editável.
        const tipo = element.querySelector('.notification-type').value;
        const data = element.querySelector('.notification-date').value;

        // Encontra os checkboxes marcados DENTRO da lista de edição.
        const recipientCheckboxes = element.querySelectorAll('.recipients-list-editable input[type="checkbox"]:checked');

        const mailList = Array.from(recipientCheckboxes).map(checkbox => {
            const label = checkbox.closest('label');
            if (label) {
                // A estrutura para encontrar o e-mail dentro do label permanece a mesma.
                const emailElement = label.querySelector('p.text-slate-600'); 
                return emailElement ? emailElement.textContent.trim() : null;
            }
            return null;
        }).filter(email => email !== null);

        // Monta o objeto final com os dados da notificação editável.
        notificationsData.push({
            id: notificationId,
            idAcao: document.getElementById('task-modal-container').getAttribute('data-task-id'),
            tipo: tipo,
            data: data,
            mailList: mailList
        });
    });

    return notificationsData;
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
    btnSave.textContent = 'Salvando...';

    try {
        const id = document.getElementById('task-modal-container').getAttribute('data-task-id');
        const form = document.getElementById('modal-edit-form');
        
        const formData = new FormData(form);
        const taskData = {
            ...Object.fromEntries(formData.entries()),
            Unidades: getCustomSelectValues('unidades-multi-select') || []
        };

        const camposObrigatorios = ['Número da atividade', 'Plano de ação', 'Atividade', 'Status'];
        const camposInvalidos = camposObrigatorios.filter(campo => !taskData[campo] || taskData[campo].trim() === '');

        if (camposInvalidos.length > 0) {
            alert(`Os seguintes campos são obrigatórios e não foram preenchidos:\n- ${camposInvalidos.join('\n- ')}`);
            [btnSave, btnCancel, btnClose].forEach(btn => btn.disabled = false);
            btnSave.textContent = 'Salvar Alterações';
            return;
        }

        const notificationsData = getNotificationsDataFromDOM(id);

        const taskSaveMode = isNewTaskMode ? 'create' : 'update';
        const taskResponse = await salvarArquivoNoOneDrive(id, 'acoes.txt', taskSaveMode, taskData);

        if (!taskResponse || taskResponse.status !== 200) {
            const message = taskResponse ? taskResponse.message : 'Falha ao salvar a tarefa principal.';
            throw new Error(message);
        }

        for (const notification of notificationsData) {
            const notificationId = notification.id || '';
            const mode = notificationId ? 'update' : 'create';
            const response = await salvarArquivoNoOneDrive(notificationId, 'notificacoes.txt', mode, notification);
            if (!response || response.status !== 200) {
                const message = response ? response.message : `Falha ao salvar a notificação.`;
                throw new Error(message);
            }
        }

        for (const notificationId of deletedNotificationIds) {
            const response = await salvarArquivoNoOneDrive(notificationId, 'notificacoes.txt', 'delete', '');
            if (!response || response.status !== 200) {
                const message = response ? response.message : `Falha ao deletar a notificação.`;
                throw new Error(message);
            }
        }

        deletedNotificationIds = [];
        setSessionMirror(taskSaveMode, taskResponse.data.uuid, taskData, "jsonAcoes");
        window.location.reload();

    } catch (error) {
        console.error("Falha ao salvar:", error);
        alert(`Ocorreu um erro ao salvar: ${error.message}`);
        
        [btnSave, btnCancel, btnClose].forEach(btn => btn.disabled = false);
        btnSave.textContent = 'Salvar Alterações';
    }
}

function saveNotificacoes(){
    document.querySelectorAll('container-notificacao')
}