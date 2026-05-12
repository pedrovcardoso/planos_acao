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
        window.jsonPlanos = jsonPlanos;
        window.currentFilteredData = [];

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

        const btnDownloadExcel = document.getElementById('download-excel');
        if (btnDownloadExcel) {
            btnDownloadExcel.addEventListener('click', exportToExcel);
        }

        const btnDownloadPdf = document.getElementById('download-pdf');
        if (btnDownloadPdf) {
            btnDownloadPdf.addEventListener('click', exportToPDF);
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
        activeBtn.className = "px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 bg-sky-600 text-white shadow-md";
        if (otherBtn) otherBtn.className = "px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-300 flex items-center gap-2";
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

    document.getElementById('toggle-filters').addEventListener('click', function () {
        const filtersContainer = document.getElementById('filters-container');
        const chevron = document.getElementById('filter-chevron');
        const isHidden = filtersContainer.classList.toggle('hidden');
        
        if (isHidden) {
            chevron.style.transform = 'rotate(0deg)';
        } else {
            chevron.style.transform = 'rotate(180deg)';
        }
    });

    document.getElementById('search-atividades').addEventListener('input', filtrarValores);

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

            if (filter.nome === 'Status') {
                const filtersContainer = document.getElementById('filters-container');
                const chevron = document.getElementById('filter-chevron');
                if (filtersContainer && filtersContainer.classList.contains('hidden')) {
                    filtersContainer.classList.remove('hidden');
                    if (chevron) chevron.style.transform = 'rotate(180deg)';
                }
            }
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
    const plansMap = new Map();
    if (Array.isArray(window.jsonPlanos)) {
        window.jsonPlanos.forEach(plan => {
            if (plan.Nome) plansMap.set(plan.Nome, plan);
        });
    }

    dados.forEach(item => {
        const plan = plansMap.get(item['Plano de ação']);
        let resolvedResponsaveis = [];
        if (plan && plan.objPessoas && Array.isArray(item.Unidades)) {
            resolvedResponsaveis = plan.objPessoas
                .filter(p => item.Unidades.includes(p.Unidade))
                .map(p => p.Nome);
            resolvedResponsaveis = [...new Set(resolvedResponsaveis)];
        }
        item.Responsaveis = resolvedResponsaveis;
    });

    window.currentFilteredData = dados;
    populateKanbanBoard(dados);
    populateActionsTable(dados);
}

async function exportToExcel() {
    if (!window.currentFilteredData || window.currentFilteredData.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const appliedFilters = getAppliedFiltersString();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ações');

    // Cabeçalho de metadados
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'RELATÓRIO DE AÇÕES - PLANOS DE AÇÃO';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Exportado em: ${new Date().toLocaleString('pt-BR')}`;
    worksheet.getCell('A2').font = { size: 10, color: { argb: 'FF64728B' } };
    
    worksheet.mergeCells('A3:J3');
    worksheet.getCell('A3').value = `Filtros aplicados: ${appliedFilters || 'Nenhum'}`;
    worksheet.getCell('A3').font = { size: 10, italic: true, color: { argb: 'FF475569' } };

    // Dados da tabela
    const tableRows = window.currentFilteredData.map(item => {
        const responsaveis = Array.isArray(item.Responsaveis) ? item.Responsaveis.join(', ') : '-';
        
        // Conversão de datas para objeto Date (ExcelJS reconhece e formata melhor)
        const dataInicio = item['Data de início'] ? new Date(item['Data de início'] + 'T12:00:00') : null;
        const dataFim = item['Data fim'] ? new Date(item['Data fim'] + 'T12:00:00') : null;

        return [
            item['Número da atividade'] || '',
            item['Plano de ação'] || '',
            item.Atividade || '',
            item['Descrição da atividade'] || '',
            dataInicio,
            dataFim,
            item.Status || '',
            Array.isArray(item.Unidades) ? item.Unidades.join(', ') : (item.Unidades || ''),
            responsaveis,
            item.Observações || ''
        ];
    });

    // Criar a Tabela Nativa do Excel
    worksheet.addTable({
        name: 'AcoesTable',
        ref: 'A5',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: [
            { name: 'Nº Atividade', filterButton: true },
            { name: 'Plano de Ação', filterButton: true },
            { name: 'Atividade', filterButton: true },
            { name: 'Descrição', filterButton: true },
            { name: 'Data Início', filterButton: true },
            { name: 'Data Fim', filterButton: true },
            { name: 'Status', filterButton: true },
            { name: 'Unidades', filterButton: true },
            { name: 'Responsáveis', filterButton: true },
            { name: 'Observações', filterButton: true }
        ],
        rows: tableRows,
    });

    // Ajustar larguras, alinhamentos e formatos das colunas
    const colConfig = [
        { key: 'A', width: 15, align: 'center' },             // Nº Atividade
        { key: 'B', width: 30, align: 'left' },               // Plano de Ação
        { key: 'C', width: 50, align: 'left' },               // Atividade
        { key: 'D', width: 40, align: 'left' },               // Descrição
        { key: 'E', width: 15, align: 'center', fmt: 'dd/mm/yyyy' }, // Data Início
        { key: 'F', width: 15, align: 'center', fmt: 'dd/mm/yyyy' }, // Data Fim
        { key: 'G', width: 20, align: 'center' },             // Status
        { key: 'H', width: 30, align: 'left' },               // Unidades
        { key: 'I', width: 30, align: 'left' },               // Responsáveis
        { key: 'J', width: 50, align: 'left' }                // Observações
    ];

    colConfig.forEach(conf => {
        const column = worksheet.getColumn(conf.key);
        column.width = conf.width;
        column.alignment = { horizontal: conf.align, vertical: 'middle' };
        if (conf.fmt) {
            column.numFmt = conf.fmt;
        }
    });

    // Garantir que o cabeçalho da tabela mantenha o alinhamento (ExcelJS às vezes reseta no addTable)
    const headerRow = worksheet.getRow(5);
    headerRow.eachCell((cell, colNumber) => {
        const conf = colConfig[colNumber - 1];
        if (conf) {
            cell.alignment = { horizontal: conf.align, vertical: 'middle' };
        }
    });

    // Gerar o buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `acoes_planos_de_acao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;

    const typeMap = {
        description: 'Planilha Excel',
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
    };

    await saveFile(blob, fileName, typeMap);
}

function exportToPDF() {
    if (!window.currentFilteredData || window.currentFilteredData.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const appliedFilters = getAppliedFiltersString();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Ações - Planos de Ação", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
    
    // Filtros aplicados no PDF
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const splitFilters = doc.splitTextToSize(`Filtros aplicados: ${appliedFilters || 'Nenhum'}`, 270);
    doc.text(splitFilters, 14, 28);

    const tableData = window.currentFilteredData.map(item => {
        const responsaveis = Array.isArray(item.Responsaveis) ? item.Responsaveis.join(', ') : '-';
        const unidades = Array.isArray(item.Unidades) ? item.Unidades.join(', ') : (item.Unidades || '');
        const dataInicio = item['Data de início'] ? new Date(item['Data de início'] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        const dataFim = item['Data fim'] ? new Date(item['Data fim'] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

        return [
            item['Número da atividade'] || '',
            item['Plano de ação'] || '',
            item.Atividade || '',
            unidades,
            dataInicio,
            dataFim,
            item.Status || '',
            responsaveis
        ];
    });

    doc.autoTable({
        startY: 32 + (splitFilters.length * 4),
        head: [['Nº', 'Plano', 'Atividade', 'Unidades', 'Início', 'Fim', 'Status', 'Responsáveis']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [51, 65, 85] },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 35 },
            2: { cellWidth: 65 },
            3: { cellWidth: 35 },
            4: { cellWidth: 22 },
            5: { cellWidth: 22 },
            6: { cellWidth: 30 },
            7: { cellWidth: 45 }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const pdfName = `acoes_planos_de_acao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    const blob = doc.output('blob');

    const typeMap = {
        description: 'Documento PDF',
        accept: { 'application/pdf': ['.pdf'] }
    };

    saveFile(blob, pdfName, typeMap);
}

async function saveFile(blob, suggestedName, typeMap) {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [typeMap]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("Erro ao usar File System Access API:", err);
        }
    }

    // Fallback para download direto
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    window.URL.revokeObjectURL(url);
}

function getAppliedFiltersString() {
    const applied = [];
    
    const searchVal = document.getElementById('search-atividades').value;
    if (searchVal) applied.push(`Pesquisa: "${searchVal}"`);
    
    const periodo = document.getElementById('filter-periodo').value;
    if (periodo !== '-') {
        if (periodo === 'especifico') {
            const ini = document.getElementById('periodo-inicio').value;
            const fim = document.getElementById('periodo-fim').value;
            if (ini && fim) applied.push(`Período: ${ini} a ${fim}`);
        } else {
            applied.push(`Período: ${periodo === 'mes' ? 'Mês atual' : 'Semana atual'}`);
        }
    }
    
    filtersConfig.forEach(f => {
        if (typeof getCustomSelectValues === 'function') {
            const selected = getCustomSelectValues(f.id);
            if (selected && selected.length > 0) {
                const select = document.getElementById(f.id);
                const names = Array.from(select.options)
                    .filter(opt => selected.includes(opt.value))
                    .map(opt => opt.text);
                applied.push(`${f.nome}: ${names.join(', ')}`);
            }
        }
    });
    
    return applied.join(' | ');
}

function filtrarValores() {
    let jsonFiltrado = [...jsonAcoes];

    const searchVal = document.getElementById('search-atividades').value.toLowerCase();
    if (searchVal) {
        jsonFiltrado = jsonFiltrado.filter(a => 
            a.Atividade.toLowerCase().includes(searchVal) || 
            a['Plano de ação'].toLowerCase().includes(searchVal)
        );
    }

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