document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true);

    try {
        // 1. Obter dados
        const requiredData = await obterDados(['acoes.txt', 'planos.txt', 'notificacoes.txt']);
        if (!requiredData) throw new Error("Não foi possível obter os dados.");

        jsonAcoes = requiredData['acoes.txt'];
        jsonPlanos = requiredData['planos.txt'];
        jsonNotificacoes = requiredData['notificacoes.txt'];

        // 2. Identificar qual plano exibir
        const planId = getPlanIdFromURL();
        if (!planId) {
            alert("Nenhum ID de plano especificado na URL (param 'id').");
            toggleLoading(false);
            return;
        }

        // Tenta achar com == para cobrir string/number mismatch
        const planData = jsonPlanos.find(p => p.ID == planId);
        if (!planData) {
            alert(`Plano não encontrado com ID: ${planId}`);
            toggleLoading(false);
            return;
        }

        // 3. Filtrar ações deste plano (usando o Nome do plano encontrado, já que as ações referenciam pelo Nome)
        // Atenção: As ações continuam ligadas pelo NOME do plano, não pelo ID, na estrutura atual.
        const planActions = jsonAcoes.filter(a => a["Plano de ação"] === planData.Nome);

        // 4. Renderizar a parte superior (Detalhes)
        renderPlanDetails(planData, planActions);

        // 5. Renderizar a parte inferior (Ações)
        // Precisamos garantir que as funções globais existam (carregadas de kanban.js/table.js)
        // Como importamos kanban.js e table.js no HTML, as funções populateKanbanBoard etc devem estar disponíveis.
        // Importante: Esses scripts podem depender de IDs específicos no DOM.
        // O index.html criado tenta replicar os IDs esperados (#kanban-view, #table-container).

        // Carrega dependências de script se necessário (ex: custom-table)
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve(src);
                script.onerror = () => reject(new Error(`Erro ao carregar script: ${src}`));
                document.head.appendChild(script);
            });
        }

        await Promise.all([
            loadScript('../../components/custom-table.js')
        ]);

        if (typeof populateKanbanBoard === 'function') {
            populateKanbanBoard(planActions);
        } else {
            console.warn("populateKanbanBoard não encontrada.");
        }

        if (typeof populateActionsTable === 'function') {
            populateActionsTable(planActions);
        } else {
            console.warn("populateActionsTable não encontrada.");
        }

        // Setup dos botões de troca de visualização
        setupViewSwitcher();

        // Setup Modal (o modal precisa de uma função global openTaskModal, 
        // mas kanban.js pode tentar chamar openTaskModal que está no main.js da outra página.
        // Precisamos definir um openTaskModal local simples aqui para não quebrar)
        window.openTaskModal = localOpenTaskModal;

    } catch (error) {
        console.error("Erro ao carregar página de detalhes:", error);
    } finally {
        toggleLoading(false);
    }
});

function toggleLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) {
        el.classList.toggle('hidden', !show);
    }
}

function getPlanIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function renderPlanDetails(plan, actions) {
    // Título
    document.getElementById('plan-title').innerText = plan.Nome || "Sem Título";

    // Status Badge
    const statusEl = document.getElementById('plan-status-badge');
    statusEl.innerText = plan.Status || "Desconhecido";
    statusEl.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColorClass(plan.Status)}`;

    // Progresso
    const total = actions.length;
    const concluded = actions.filter(a => a.Status === 'Implementado').length;
    const percentage = total > 0 ? Math.round((concluded / total) * 100) : 0;

    document.getElementById('plan-progress-text').innerText = `${percentage}%`;
    document.getElementById('plan-progress-bar').style.width = `${percentage}%`;
    document.getElementById('completed-actions').innerText = concluded;
    document.getElementById('total-actions').innerText = total;

    // Datas
    const formatDate = (str) => {
        if (!str) return '--/--/----';
        const parts = str.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return str;
    };
    document.getElementById('plan-start-date').innerText = formatDate(plan["Data início"]);
    document.getElementById('plan-end-date').innerText = formatDate(plan["Data fim"]);

    // SEIs
    document.getElementById('plan-sei-main').innerText = plan["Processo SEI"] || "N/A";
    const relatedSeis = plan["SEI relacionados"];
    const relatedContainer = document.getElementById('plan-sei-related-container');
    if (relatedSeis && relatedSeis !== '-') {
        document.getElementById('plan-sei-related').innerText = relatedSeis;
        relatedContainer.classList.remove('hidden');
    } else {
        relatedContainer.classList.add('hidden');
    }

    // Resolução e TCE
    document.getElementById('plan-resolution').innerText = plan["Resolução"] || "--";
    document.getElementById('plan-tce-doc').innerText = plan["Documento TCE"] || "--";

    // Observações e Docs Relacionados
    const obs = plan["Observações"];
    const docs = plan["Documentos relacionados"];
    const extraInfo = document.getElementById('plan-extra-info');
    let hasExtra = false;

    if (obs && obs !== '-') {
        document.getElementById('plan-observations').innerText = obs;
        document.getElementById('plan-obs-container').classList.remove('hidden');
        hasExtra = true;
    }
    if (docs && docs !== '-') {
        document.getElementById('plan-docs-related').innerText = docs;
        document.getElementById('plan-docs-related-container').classList.remove('hidden');
        hasExtra = true;
    }
    if (hasExtra) extraInfo.classList.remove('hidden');

    // Unidades
    const uniqueUnits = new Set();
    if (plan.objPessoas && Array.isArray(plan.objPessoas)) {
        plan.objPessoas.forEach(p => {
            if (p.Unidade) uniqueUnits.add(p.Unidade.trim());
        });
    }

    const unitsContainer = document.getElementById('plan-units-list');
    unitsContainer.innerHTML = '';
    if (uniqueUnits.size > 0) {
        uniqueUnits.forEach(u => {
            const tag = document.createElement('span');
            tag.className = "px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-tight";
            tag.innerText = u;
            unitsContainer.appendChild(tag);
        });
    } else {
        unitsContainer.innerHTML = '<span class="text-sm text-slate-500 italic">Nenhuma unidade vinculada</span>';
    }

    // Pessoas com Unidade e Email
    const peopleContainer = document.getElementById('plan-people-list');
    peopleContainer.innerHTML = '';
    if (plan.objPessoas && plan.objPessoas.length > 0) {
        plan.objPessoas.forEach(p => {
            const div = document.createElement('div');
            const email = p.Email || "";

            // Container do Chip: Mais discreto, sem gradientes fortes
            div.className = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 pr-4 hover:bg-white hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group relative";

            if (email) {
                div.onclick = (e) => copyToClipboard(e, email);
                div.onmouseenter = (e) => showEmailTooltip(e, email);
                div.onmousemove = (e) => moveEmailTooltip(e);
                div.onmouseleave = () => hideEmailTooltip();
            }

            const initials = getInitials(p.Nome);

            div.innerHTML = `
                <div class="w-8 h-8 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                    ${initials}
                </div>
                <div class="flex flex-col leading-tight min-w-0">
                    <span class="text-sm font-semibold text-slate-700 group-hover:text-sky-700 transition-colors truncate">${p.Nome}</span>
                    <span class="text-[10px] text-slate-400 font-medium">${p.Unidade || '-'}</span>
                </div>
            `;
            peopleContainer.appendChild(div);
        });
    } else {
        peopleContainer.innerHTML = '<span class="text-sm text-slate-500 italic">Ninguém atribuído</span>';
    }
}

let tooltipElement = null;
let tooltipHideTimeout = null;

function showEmailTooltip(event, email) {
    if (!email) return;

    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }

    if (tooltipElement) tooltipElement.remove();

    tooltipElement = document.createElement('div');
    tooltipElement.className = "fixed pointer-events-none z-[9999] bg-slate-800 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl opacity-0 transition-opacity duration-200";
    tooltipElement.innerText = email;
    // Posiciona acima do mouse (Y negativo)
    tooltipElement.style.left = `${event.clientX + 10}px`;
    tooltipElement.style.top = `${event.clientY - 30}px`;

    document.body.appendChild(tooltipElement);

    requestAnimationFrame(() => {
        tooltipElement.style.opacity = '1';
    });
}

function moveEmailTooltip(event) {
    if (!tooltipElement) return;
    tooltipElement.style.left = `${event.clientX + 10}px`;
    tooltipElement.style.top = `${event.clientY - 30}px`;
}

function hideEmailTooltip() {
    if (!tooltipElement) return;

    tooltipElement.style.opacity = '0';
    tooltipHideTimeout = setTimeout(() => {
        if (tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    }, 200);
}

// Função de cópia com notificação discreta (Estilo similar ao original do sistema)
function copyToClipboard(event, text) {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        // Cria um pequeno balão temporário na posição do clique
        const feedback = document.createElement('div');
        feedback.innerText = 'Copiado!';
        feedback.className = "fixed bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-[1000] transition-all duration-300 opacity-0";
        feedback.style.left = `${event.clientX}px`;
        feedback.style.top = `${event.clientY - 35}px`; // Subi um pouco mais para não sobrepor o mouse

        document.body.appendChild(feedback);

        // Animação suave
        requestAnimationFrame(() => {
            feedback.style.opacity = '1';
            feedback.style.transform = 'translateY(-5px)';
        });

        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-10px)';
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    });
}

function getStatusColorClass(status) {
    // Mapeamento simples de status para classes tailwind (bg/text)
    // Se quiser reutilizar o CSS global, pode usar as classes .status-Em-curso etc
    // Aqui retornando classes utilitárias para ficar independente OU as classes do CSS global se estiverem carregadas

    // Tentando usar as classes do arquivo styles.css se ele estiver carregado (está no head)
    // As classes lá são tipo .status-Em-curso { background-color: ... }
    // Mas aqui estamos aplicando num span, então precisamos garantir que funcione.
    // Para garantir visual bonito com Tailwind, vou mapear manualmente para classes Tailwind similar ao que fiz no script principal

    const map = {
        'Em desenvolvimento': 'bg-gray-100 text-gray-700 border border-gray-200',
        'Planejado': 'bg-slate-100 text-slate-700 border border-slate-200',
        'Em curso': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
        'Implementado': 'bg-green-100 text-green-700 border border-green-200',
        'Pendente': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        'Em revisão': 'bg-orange-100 text-orange-700 border border-orange-200',
        'Cancelado': 'bg-red-100 text-red-700 border border-red-200'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
}

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function setupViewSwitcher() {
    const btnKanban = document.getElementById('view-kanban-btn');
    const btnTable = document.getElementById('view-table-btn');
    const viewKanban = document.getElementById('kanban-view');
    const viewTable = document.getElementById('table-view');

    btnKanban.addEventListener('click', () => {
        // Toggle Buttons
        btnKanban.className = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-sky-50 text-sky-700";
        btnTable.className = "px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors";

        // Toggle Views
        viewKanban.classList.remove('hidden');
        viewTable.classList.add('hidden');
    });

    btnTable.addEventListener('click', () => {
        // Toggle Buttons
        btnTable.className = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-sky-50 text-sky-700";
        btnKanban.className = "px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors";

        // Toggle Views
        viewTable.classList.remove('hidden');
        viewKanban.classList.add('hidden');
    });
}

// Função local para abrir modal (usada pelo click no card do Kanban ou linha da tabela)
function localOpenTaskModal(id) {
    // Reutilizar lógica simples de preencher o modal
    const task = jsonAcoes.find(t => t.ID === id);
    if (!task) return;

    const modal = document.getElementById('task-modal-container');

    // Preenche campos
    document.getElementById('modal-view-atividade').innerText = task.Atividade;
    document.getElementById('modal-view-plano').innerText = task["Plano de ação"];
    document.getElementById('modal-view-status').innerText = task.Status;
    document.getElementById('modal-view-descricao').innerText = task["Descrição da atividade"] || '-';
    document.getElementById('modal-view-observacoes').innerText = task["Observações"] || '-';

    // Mostra modal
    modal.classList.remove('hidden');

    // Setup close button local
    const btnClose = document.getElementById('modal-btn-close');
    btnClose.onclick = () => {
        modal.classList.add('hidden');
    };

    // Fecha ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };
}
