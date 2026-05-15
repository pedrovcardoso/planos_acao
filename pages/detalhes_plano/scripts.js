document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true);

    try {
        const requiredData = await obterDados(['acoes.txt', 'planos.txt', 'notificacoes.txt']);
        if (!requiredData) throw new Error("Não foi possível obter os dados.");

        jsonAcoes = requiredData['acoes.txt'];
        jsonPlanos = requiredData['planos.txt'];
        jsonNotificacoes = requiredData['notificacoes.txt'];

        const planId = getPlanIdFromURL();
        if (!planId) {
            alert("Nenhum ID de plano especificado na URL (param 'id').");
            toggleLoading(false);
            return;
        }

        const planData = jsonPlanos.find(p => p.ID == planId);
        if (!planData) {
            alert(`Plano não encontrado com ID: ${planId}`);
            toggleLoading(false);
            return;
        }

        const planActions = jsonAcoes.filter(a => a["Plano de ação"] === planData.Nome);
        window.currentPlanActions = planActions;
        ordenarJsonAcoes(planActions);

        renderPlanDetails(planData, planActions);

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
            loadScript('../../components/ui/custom-table.js')
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

        setupViewSwitcher();
        initTaskModal();
        initModalPlanos();

        const btnEditPlan = document.getElementById('btn-edit-plan');
        if (btnEditPlan) {
            btnEditPlan.addEventListener('click', () => {
                if (typeof openEditModalPlanos === 'function') {
                    openEditModalPlanos(planData.ID);
                } else {
                    console.error("Função openEditModalPlanos não encontrada.");
                }
            });
        }

        const btnDownloadExcel = document.getElementById('btn-download-excel');
        if (btnDownloadExcel) {
            btnDownloadExcel.addEventListener('click', () => exportPlanToExcel(planData));
        }

        const btnDownloadPdf = document.getElementById('btn-download-pdf');
        if (btnDownloadPdf) {
            btnDownloadPdf.addEventListener('click', () => exportPlanToPDF(planData));
        }

        const btnNewAction = document.getElementById('btn-nova-acao');
        if (btnNewAction) {
            btnNewAction.addEventListener('click', () => {
                if (typeof openModalForNewAction === 'function') {
                    openModalForNewAction(planData.Nome);
                } else {
                    console.error("Função openModalForNewAction não encontrada.");
                }
            });
        }

        document.getElementById('search-acoes-detalhes').addEventListener('input', function() {
            const searchVal = this.value.toLowerCase();
            const filtered = window.currentPlanActions.filter(a => 
                a.Atividade.toLowerCase().includes(searchVal) || 
                (a.Descrição && a.Descrição.toLowerCase().includes(searchVal))
            );
            
            if (typeof populateKanbanBoard === 'function') populateKanbanBoard(filtered);
            if (typeof populateActionsTable === 'function') populateActionsTable(filtered);
        });

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

function setButtonLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    if (isLoading) {
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = `
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent"></div>
            <span class="text-xs">Processando...</span>
        `;
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    }
}

function getPlanIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function renderPlanDetails(plan, actions) {
    document.getElementById('plan-title').innerText = plan.Nome || "Sem Título";
    const statusEl = document.getElementById('plan-status-badge');
    statusEl.innerText = plan.Status || "Desconhecido";
    statusEl.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColorClass(plan.Status)}`;
    const total = actions.length;
    const concluded = actions.filter(a => a.Status === 'Implementado').length;
    const percentage = total > 0 ? Math.round((concluded / total) * 100) : 0;

    document.getElementById('plan-progress-text').innerText = `${percentage}%`;
    document.getElementById('plan-progress-bar').style.width = `${percentage}%`;
    document.getElementById('completed-actions').innerText = concluded;
    document.getElementById('total-actions').innerText = total;

    const formatDate = (str) => {
        if (!str) return '--/--/----';
        const parts = str.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return str;
    };
    document.getElementById('plan-start-date').innerText = formatDate(plan["Data início"]);
    document.getElementById('plan-end-date').innerText = formatDate(plan["Data fim"]);

    document.getElementById('plan-sei-main').innerText = plan["Processo SEI"] || "N/A";
    const relatedSeis = plan["SEI relacionados"];
    const relatedContainer = document.getElementById('plan-sei-related-container');
    if (relatedSeis && relatedSeis !== '-') {
        document.getElementById('plan-sei-related').innerText = relatedSeis;
        relatedContainer.classList.remove('hidden');
    } else {
        relatedContainer.classList.add('hidden');
    }

    document.getElementById('plan-resolution').innerText = plan["Resolução"] || "--";
    document.getElementById('plan-tce-doc').innerText = plan["Documento TCE"] || "--";

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
            tag.className = "inline-flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-tight leading-none";
            tag.innerText = u;
            unitsContainer.appendChild(tag);
        });
    } else {
        unitsContainer.innerHTML = '<span class="text-sm text-slate-500 italic">Nenhuma unidade vinculada</span>';
    }

    const peopleContainer = document.getElementById('plan-people-list');
    peopleContainer.innerHTML = '';
    if (plan.objPessoas && plan.objPessoas.length > 0) {
        plan.objPessoas.forEach(p => {
            const div = document.createElement('div');
            const email = p.Email || "";

            div.className = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 pr-4 hover:bg-white hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group relative";

            if (email) {
                div.onclick = (e) => copyToClipboard(e, email);
                div.onmouseenter = (e) => showEmailTooltip(e, email);
                div.onmousemove = (e) => moveEmailTooltip(e);
                div.onmouseleave = () => hideEmailTooltip();
            }

            const initials = window.getInitialsFirstLast ? window.getInitialsFirstLast(p.Nome) : getInitials(p.Nome);

            div.innerHTML = `
                <div class="w-8 h-8 rounded-lg text-slate-600 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 shadow-sm" 
                     style="background-color: ${window.getUserColor ? window.getUserColor(email) : '#E2E8F0'}"
                     data-user-email="${email}">
                    ${initials}
                </div>
                <div class="flex flex-col leading-tight min-w-0">
                    <span class="text-sm font-semibold text-slate-700 group-hover:text-sky-700 transition-colors">${p.Nome}</span>
                    <span class="text-[10px] text-slate-400 font-medium">${p.Unidade || '-'}</span>
                </div>
            `;
            peopleContainer.appendChild(div);
        });
        if (window.loadUserPhotos) window.loadUserPhotos(peopleContainer);
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

function copyToClipboard(event, text) {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        const feedback = document.createElement('div');
        feedback.innerText = 'Copiado!';
        feedback.className = "fixed bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-[1000] transition-all duration-300 opacity-0";
        feedback.style.left = `${event.clientX}px`;
        feedback.style.top = `${event.clientY - 35}px`;

        document.body.appendChild(feedback);

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

    const activeClass = "px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 bg-sky-600 text-white shadow-md";
    const inactiveClass = "px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-300 flex items-center gap-2";

    btnKanban.addEventListener('click', () => {
        btnKanban.className = activeClass;
        btnTable.className = inactiveClass;

        viewKanban.classList.remove('hidden');
        viewTable.classList.add('hidden');
    });

    btnTable.addEventListener('click', () => {
        btnTable.className = activeClass;
        btnKanban.className = inactiveClass;

        viewTable.classList.remove('hidden');
        viewKanban.classList.add('hidden');
    });
}

async function exportPlanToExcel(plan) {
    setButtonLoading('btn-download-excel', true);
    try {
        const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detalhes do Plano');

    worksheet.getColumn('A').width = 25;
    worksheet.getColumn('B').width = 50;
    worksheet.getColumn('C').width = 40;
    worksheet.getColumn('D').width = 15;
    worksheet.getColumn('E').width = 15;
    worksheet.getColumn('F').width = 20;
    worksheet.getColumn('G').width = 30;
    worksheet.getColumn('H').width = 30;
    worksheet.getColumn('I').width = 50;

    worksheet.getColumn('D').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('E').numFmt = 'dd/mm/yyyy';
    
    worksheet.columns.forEach(col => {
        col.alignment = { vertical: 'middle', wrapText: true };
    });

    const addRow = (label, value, isHeader = false) => {
        const row = worksheet.addRow([label, value]);
        if (isHeader) {
            row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
            worksheet.mergeCells(`A${row.number}:B${row.number}`);
            row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
            row.getCell(1).font = { bold: true, color: { argb: 'FF334155' } };
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            row.getCell(2).font = { color: { argb: 'FF475569' } };
        }
        return row;
    };

    addRow(`Plano de Ação: ${plan.Nome}`, '', true);
    
    addRow('Status', plan.Status || '-');
    
    const formatDate = (str) => {
        if (!str) return '--/--/----';
        const parts = str.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return str;
    };
    
    addRow('Data de Início', formatDate(plan["Data início"]));
    addRow('Data Fim', formatDate(plan["Data fim"]));
    
    const total = window.currentPlanActions ? window.currentPlanActions.length : 0;
    const concluded = window.currentPlanActions ? window.currentPlanActions.filter(a => a.Status === 'Implementado').length : 0;
    const percentage = total > 0 ? Math.round((concluded / total) * 100) : 0;
    
    addRow('Progresso', `${percentage}% (${concluded} de ${total} ações concluídas)`);
    addRow('Processo SEI', plan["Processo SEI"] || '-');
    if (plan["SEI relacionados"] && plan["SEI relacionados"] !== '-') {
        addRow('SEI Relacionados', plan["SEI relacionados"]);
    }
    addRow('Resolução', plan.Resolução || '-');
    addRow('Documento TCE', plan["Documento TCE"] || '-');
    
    if (plan["Observações"] && plan["Observações"] !== '-') {
        addRow('Observações', plan["Observações"]);
    }
    if (plan["Documentos relacionados"] && plan["Documentos relacionados"] !== '-') {
        addRow('Documentos Relacionados', plan["Documentos relacionados"]);
    }

    const uniqueUnits = new Set();
    const peopleList = [];
    if (plan.objPessoas && Array.isArray(plan.objPessoas)) {
        plan.objPessoas.forEach(p => {
            if (p.Unidade) uniqueUnits.add(p.Unidade.trim());
            peopleList.push(`${p.Nome} (${p.Unidade || '-'})`);
        });
    }

    addRow('Unidades Envolvidas', Array.from(uniqueUnits).join(', ') || '-');
    addRow('Equipe Responsável', peopleList.join(', ') || '-');
    
    const linkRow = addRow('Link para o Site', window.location.href);
    const linkCell = linkRow.getCell(2);
    linkCell.value = window.location.href;
    linkCell.font = { color: { argb: 'FF0284C7' }, underline: true };

    const lastRow = linkRow;

    for (let i = 1; i <= lastRow.number; i++) {
        const row = worksheet.getRow(i);
        row.getCell(1).border = {
            top: {style:'thin', color: {argb:'FFE2E8F0'}},
            left: {style:'thin', color: {argb:'FFE2E8F0'}},
            bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
            right: {style:'thin', color: {argb:'FFE2E8F0'}}
        };
        if (!row.getCell(2).isMerged) {
            row.getCell(2).border = {
                top: {style:'thin', color: {argb:'FFE2E8F0'}},
                left: {style:'thin', color: {argb:'FFE2E8F0'}},
                bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
                right: {style:'thin', color: {argb:'FFE2E8F0'}}
            };
        }
    }

    worksheet.addRow([]);
    worksheet.addRow([]);

    const searchVal = document.getElementById('search-acoes-detalhes').value.toLowerCase();
    let actionsToExport = window.currentPlanActions || [];
    if (searchVal) {
        actionsToExport = actionsToExport.filter(a => 
            a.Atividade.toLowerCase().includes(searchVal) || 
            (a.Descrição && a.Descrição.toLowerCase().includes(searchVal))
        );
    }

    const getResponsaveis = (item) => {
        if (!plan.objPessoas || !Array.isArray(item.Unidades)) return '-';
        const resp = plan.objPessoas
            .filter(p => item.Unidades.includes(p.Unidade))
            .map(p => p.Nome);
        const uniqueResp = [...new Set(resp)];
        return uniqueResp.length > 0 ? uniqueResp.join(', ') : '-';
    };

    if (actionsToExport.length > 0) {
        const tableRows = actionsToExport.map(item => {
            const responsaveis = getResponsaveis(item);
            const dataInicio = item['Data de início'] ? new Date(item['Data de início'] + 'T12:00:00') : null;
            const dataFim = item['Data fim'] ? new Date(item['Data fim'] + 'T12:00:00') : null;

            return [
                item['Número da atividade'] || '',
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

        const startRow = worksheet.rowCount + 1;

        worksheet.addTable({
            name: 'AcoesTable',
            ref: `A${startRow}`,
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium9',
                showRowStripes: true,
            },
            columns: [
                { name: 'Nº Atividade', filterButton: true },
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
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `detalhes_plano_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;

    const typeMap = {
        description: 'Planilha Excel',
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
    };

    await saveFile(blob, fileName, typeMap);
    } catch (error) {
        console.error("Erro ao exportar Excel:", error);
    } finally {
        setButtonLoading('btn-download-excel', false);
    }
}

async function exportPlanToPDF(plan) {
    setButtonLoading('btn-download-pdf', true);
    try {
        const container = document.getElementById('plan-details-container');
        
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            windowWidth: 1280,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.textContent = 'body > div:last-child img { display: inline-block !important; }';
                clonedDoc.head.appendChild(style);

                const clonedContainer = clonedDoc.getElementById('plan-details-container');
                
                clonedContainer.querySelectorAll('.flex:not(.flex-col)').forEach(el => {
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                });

                clonedContainer.querySelectorAll('.flex-col').forEach(el => {
                    el.style.display = 'flex';
                    el.style.alignItems = 'flex-start';
                    el.style.justifyContent = 'center';
                    el.style.textAlign = 'left';
                    el.classList.remove('leading-tight');
                });

                clonedContainer.querySelectorAll('#plan-status-badge, #plan-sei-main, #plan-units-list span').forEach(el => {
                    el.style.display = 'inline-flex';
                    el.style.alignItems = 'center';
                    el.style.justifyContent = 'center';
                    el.style.lineHeight = '1';
                    el.style.paddingTop = '3px';
                    el.style.paddingBottom = '2px';
                    el.style.height = 'auto';
                    el.style.minHeight = '1.5em';
                });

                clonedContainer.querySelectorAll('.truncate, .overflow-hidden').forEach(el => {
                    el.classList.remove('truncate', 'overflow-hidden');
                    el.style.whiteSpace = 'normal';
                    el.style.overflow = 'visible';
                });
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        let startY = margin + imgHeight + 15;
        
        if (startY > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            startY = margin;
        }

        const searchVal = document.getElementById('search-acoes-detalhes').value.toLowerCase();
        let actionsToExport = window.currentPlanActions || [];
        if (searchVal) {
            actionsToExport = actionsToExport.filter(a => 
                a.Atividade.toLowerCase().includes(searchVal) || 
                (a.Descrição && a.Descrição.toLowerCase().includes(searchVal))
            );
        }

        const getResponsaveis = (item) => {
            if (!plan.objPessoas || !Array.isArray(item.Unidades)) return '-';
            const resp = plan.objPessoas
                .filter(p => item.Unidades.includes(p.Unidade))
                .map(p => p.Nome);
            const uniqueResp = [...new Set(resp)];
            return uniqueResp.length > 0 ? uniqueResp.join(', ') : '-';
        };

        if (actionsToExport.length > 0) {
            // Ensure we add the link to the first page footer before potential page breaks
            const currentPN = pdf.internal.getCurrentPageInfo().pageNumber;
            pdf.setPage(1);
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184);
            const linkText = `Link para acesso online: ${window.location.href}`;
            pdf.text(linkText, margin, pdf.internal.pageSize.getHeight() - 5);
            pdf.link(margin, pdf.internal.pageSize.getHeight() - 10, pdf.getTextWidth(linkText), 7, { url: window.location.href });
            pdf.setPage(currentPN);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 41, 59);
            pdf.text("Ações do Plano", margin, startY);
            startY += 5;

            const tableData = actionsToExport.map(item => {
                const responsaveis = getResponsaveis(item);
                const unidades = Array.isArray(item.Unidades) ? item.Unidades.join(', ') : (item.Unidades || '');
                const dataInicio = item['Data de início'] ? new Date(item['Data de início'] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
                const dataFim = item['Data fim'] ? new Date(item['Data fim'] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

                return [
                    item['Número da atividade'] || '',
                    item.Atividade || '',
                    unidades,
                    dataInicio,
                    dataFim,
                    item.Status || '',
                    responsaveis
                ];
            });

            pdf.autoTable({
                startY: startY,
                head: [['Nº', 'Atividade', 'Unidades', 'Início', 'Fim', 'Status', 'Responsáveis']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [2, 132, 199], fontStyle: 'bold' },
                styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [51, 65, 85] },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
        }

        // Add link only to the first page footer
        pdf.setPage(1);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const linkText = `Link para acesso online: ${window.location.href}`;
        pdf.text(linkText, margin, pdf.internal.pageSize.getHeight() - 5);
        pdf.link(margin, pdf.internal.pageSize.getHeight() - 10, pdf.getTextWidth(linkText), 7, { url: window.location.href });

        const fileName = `detalhes_plano_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        const blob = pdf.output('blob');

        const typeMap = {
            description: 'Documento PDF',
            accept: { 'application/pdf': ['.pdf'] }
        };

        await saveFile(blob, fileName, typeMap);
    } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
        setButtonLoading('btn-download-pdf', false);
    }
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

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    window.URL.revokeObjectURL(url);
}

