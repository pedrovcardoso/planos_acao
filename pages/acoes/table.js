const tableColumnConfig = [
    { key: 'Número da atividade', label: 'Nº Ativ.', className: 'text-center', width: 100, filterable: true },
    { key: 'Plano de ação', label: 'Plano de Ação', className: '', width: 150, filterable: true },
    { key: 'Atividade', label: 'Atividade', className: '', width: 400, filterable: true },
    { key: 'Descrição da atividade', label: 'Descrição da atividade', className: '', width: 200, filterable: true },
    { key: 'Data de início', label: 'Início', className: 'text-center', width: 150, filterable: true },
    { key: 'Data fim', label: 'Fim', className: 'text-center', width: 150, filterable: true },
    { key: 'Status', label: 'Status', className: 'text-center', width: 180, filterable: true },
    { key: 'Unidades', label: 'Unidades', className: '', width: 200, filterable: true },
    { key: 'Observações', label: 'Observações', className: '', width: 300, filterable: true }
];

function populateActionsTable(jsonAcoes) {
    const container = document.getElementById('table-container');
    if (!container) return;

    const plansUnitMap = new Map();
    if (Array.isArray(jsonPlanos)) {
        jsonPlanos.forEach(plan => {
            if (plan.Nome && Array.isArray(plan.objPessoas)) {
                const units = new Set(plan.objPessoas.map(person => person.Unidade));
                plansUnitMap.set(plan.Nome, units);
            }
        });
    }

    const totalTableWidth = tableColumnConfig.reduce((sum, col) => sum + col.width, 0);
    const colgroupHtml = tableColumnConfig.map(col => `<col style="width: ${col.width}px;">`).join('');

    const headerHtml = tableColumnConfig.map(col => {
        let filterHtml = '';
        if (col.filterable) {
            filterHtml = `
                <div class="table-filter-trigger flex-shrink-0 cursor-pointer p-1 rounded-md hover:bg-slate-200 transition-colors" data-key="${col.key}">
                    <ion-icon name="funnel-outline" class="filter-icon text-slate-400 pointer-events-none"></ion-icon>
                </div>`;
        }
        return `<th scope="col" class="px-5 py-3 ${col.className} relative">
                    <div class="flex items-center justify-between w-full gap-x-2">
                        <div class="table-span-header w-full line-clamp-2 min-w-0">${col.label}</div>
                        ${filterHtml}
                    </div>
                </th>`;
    }).join('');

    const bodyHtml = jsonAcoes.map(task => {
        const planUnits = plansUnitMap.get(task['Plano de ação']);
        let showWarning = false;
        if (planUnits && Array.isArray(task.Unidades) && task.Unidades.length > 0) {
            if (task.Unidades.some(taskUnit => !planUnits.has(taskUnit))) {
                showWarning = true;
            }
        }

        const cellsHtml = tableColumnConfig.map(col => {
            let cellContent = task[col.key] || '';
            let cellRawValue = Array.isArray(cellContent) ? cellContent.filter(Boolean).join('||') : (cellContent.toString() || '');
            let cellHtml;

            if (['Data de início', 'Data fim'].includes(col.key)) {
                cellContent = task[col.key] ? new Date(task[col.key] + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
                cellHtml = `<div class="line-clamp-3">${cellContent}</div>`;
            } else if (col.key === 'Status') {
                const statusClass = 'status-' + (task.Status || '').replace(/\s+/g, '-');
                const statusBadgeHtml = `<div class="${statusClass} flex justify-center items-center text-sm px-1.5 rounded h-6">${task.Status || '-'}</div>`;

                let warningIconHtml = '';
                if (showWarning) {
                    const tooltipText = "Esta atividade possui unidades que não<br>foram encontradas no plano de ação<br>correspondente.";
                    warningIconHtml = `
                        <div class="group relative flex items-center">
                            <svg class="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.625-1.09 2.072-1.09 2.698 0l6.827 11.972c.626 1.09-.147 2.429-1.349 2.429H2.779c-1.202 0-1.975-1.339-1.349-2.43L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-6a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                            <div class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-md bg-gray-800 p-2 text-center text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">${tooltipText}</div>
                        </div>`;
                }
                cellHtml = `<div class="flex justify-center items-center gap-x-2">${warningIconHtml}${statusBadgeHtml}</div>`;

            } else {
                if (Array.isArray(cellContent)) { cellContent = cellContent.join(', '); }
                cellHtml = `<div class="line-clamp-3">${cellContent || '-'}</div>`;
            }

            return `<td class="p-3 ${col.className}" data-key="${col.key}" data-value="${cellRawValue}">${cellHtml}</td>`;
        }).join('');

        return `<tr class="cursor-pointer hover:bg-slate-50 transition-colors divide-x divide-slate-200" data-task-id="${task.ID}">${cellsHtml}</tr>`;
    }).join('');

    const fullTableHtml = `<table id="actions-main-table" style="width: ${totalTableWidth}px; table-layout: fixed;">
            <colgroup>${colgroupHtml}</colgroup>
            <thead class="bg-slate-50 text-xs text-slate-700 uppercase border-b border-slate-200 sticky top-0 shadow-md z-10">
                <tr class="divide-x divide-slate-200">${headerHtml}</tr>
            </thead>
            <tbody class="divide-y divide-slate-200">${bodyHtml}</tbody>
        </table>`;

    container.innerHTML = fullTableHtml;

    container.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.table-filter-trigger')) return;
            openTaskModal(row.dataset.taskId);
        });
    });

    initializeTableFilters('actions-main-table');
    initializeTableResizing('actions-main-table'); 
    initializeTableReordering('actions-main-table');
}