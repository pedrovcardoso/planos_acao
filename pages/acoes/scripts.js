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

        await Promise.all([
            loadScript('../../components/ui/multiple_select.js'),
            loadScript('../../components/ui/custom-table.js')
        ]);
        setupFilters();
        initTaskModal();
        setupViewSwitcher();

        const btnNovaAtividade = document.getElementById('btn-nova-atividade');
        if (btnNovaAtividade) {
            btnNovaAtividade.addEventListener('click', () => window.openModalForNewAction());
        }

        filtrarValores();

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
    const btnKanban = document.getElementById('view-kanban-btn');
    const btnTable = document.getElementById('view-table-btn');

    const viewKanban = document.getElementById('kanban-view');
    const viewTable = document.getElementById('table-view');

    const setActive = (activeBtn, otherBtn) => {
        activeBtn.className = "px-4 py-2 rounded-md text-sm font-medium transition-colors bg-sky-50 text-sky-700";
        if (otherBtn) otherBtn.className = "px-4 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors";
    };

    const setView = (activeView, otherView) => {
        activeView.style.display = 'block';
        if (otherView) otherView.style.display = 'none';
    };

    if (btnKanban) {
        btnKanban.addEventListener('click', () => {
            setActive(btnKanban, btnTable);
            setView(viewKanban, viewTable);
        });
    }

    if (btnTable) {
        btnTable.addEventListener('click', () => {
            setActive(btnTable, btnKanban);
            setView(viewTable, viewKanban);
        });
    }
}










const filtersConfig = [
    { nome: "Plano de ação", id: "filter-planoAcao", objPessoa: false },
    { nome: "Status", id: "filter-Status", objPessoa: false },
    { nome: "Nome", id: "filter-Nome", objPessoa: true },
    { nome: "Unidade", id: "filter-Unidade", objPessoa: true }
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
    filtersConfig.forEach(filter => {
        if (filter.objPessoa) {
            fillFilterObjPessoas(filter.nome);
        } else {
            const selectElement = document.getElementById(filter.id);
            if (!selectElement) return;

            const opcoes = Object.values(jsonAcoes)
                .map(value => value[filter.nome])
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

        createCustomSelect(filter.id);
        onCustomSelectChange(filter.id, filtrarValores);
    });

    document.getElementById('filter-periodo').addEventListener('change', function () {
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        inputsDiv.style.display = this.value === 'especifico' ? 'flex' : 'none';
        if (this.value !== 'especifico') {
            filtrarValores();
        }
    });

    document.getElementById('filtrar-especifico').addEventListener('click', filtrarValores);

    setFilterFromUrl();
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

function setFilterFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let filterApplied = false;

    filtersConfig.forEach(filter => {
        const paramValue = params.get(normalizeString(filter.nome));
        if (!paramValue) return;

        const selectElement = document.getElementById(filter.id);
        if (!selectElement) return;

        const valorNormalizado = normalizeString(decodeURIComponent(paramValue));
        const optionToSelect = Array.from(selectElement.options).find(opt => opt.value === valorNormalizado);

        if (optionToSelect) {
            optionToSelect.selected = true;
            createCustomSelect(filter.id);
            filterApplied = true;
        }
    });

    if (filterApplied) {
        filtrarValores();
    }
}

function filterJson(json, chave, valoresSelecionados) {
    return json.filter(item => {
        const itemValores = (item[chave] || '').split(',').map(v => normalizeString(v.trim()));
        return itemValores.some(v => valoresSelecionados.includes(v));
    });
}

function atualizarVisualizacoes(dados) {
    populateKanbanBoard(dados);
    populateActionsTable(dados);
}

function filtrarValores() {
    let jsonFiltrado = [...jsonAcoes];

    filtersConfig.forEach(filter => {
        const selectedValues = getCustomSelectValues(filter.id);
        const customComponent = document.querySelector(`.custom-select-container[data-select-id="${filter.id}"]`);

        if (!selectedValues || selectedValues.length === 0) {
            if (customComponent) customComponent.querySelector('.relative.z-10').classList.remove('border-sky-500', 'font-semibold');
            return;
        }

        if (filter.objPessoa) {
            const validPlanUnitKeys = new Set();
            Object.values(jsonPlanos).forEach(plan => {
                (plan.objPessoas || []).forEach(pessoa => {
                    if (selectedValues.includes(normalizeString(pessoa[filter.nome]))) {
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
            jsonFiltrado = filterJson(jsonFiltrado, filter.nome, selectedValues);
        }

        if (customComponent) customComponent.querySelector('.relative.z-10').classList.add('border-sky-500', 'font-semibold');
    });

    jsonFiltrado = filtrarPeriodo(jsonFiltrado);
    atualizarVisualizacoes(jsonFiltrado);
}

function clearFilters() {
    filtersConfig.forEach(filter => {
        const element = document.getElementById(filter.id);
        if (element) {
            Array.from(element.options).forEach(opt => opt.selected = false);
            createCustomSelect(filter.id);
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
    const filterElement = document.getElementById('filter-periodo');
    const value = filterElement.value;
    let dataInicio, dataFim;
    const agora = new Date();

    switch (value) {
        case 'semana':
            filterElement.classList.add('filter-active');
            const primeiroDia = new Date(agora);
            primeiroDia.setDate(agora.getDate() - agora.getDay() + 1);
            dataInicio = primeiroDia;
            const ultimoDia = new Date(primeiroDia);
            ultimoDia.setDate(primeiroDia.getDate() + 4);
            dataFim = ultimoDia;
            break;
        case 'mes':
            filterElement.classList.add('filter-active');
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
            dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
            break;
        case 'especifico':
            filterElement.classList.add('filter-active');
            const inicioInput = document.getElementById('periodo-inicio').value;
            const fimInput = document.getElementById('periodo-fim').value;
            if (inicioInput && fimInput) {
                dataInicio = new Date(inicioInput);
                dataFim = new Date(fimInput);
            }
            break;
        default:
            filterElement.classList.remove('filter-active');
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




function ordenarJsonAcoes(dados) {
    dados.sort((a, b) => {
        const numA = parseFloat(a['Número da atividade']) || 0;
        const numB = parseFloat(b['Número da atividade']) || 0;
        return numA - numB;
    });
}
