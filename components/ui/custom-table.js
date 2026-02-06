(function () {
    let activeFilters = {};
    const CONFIG = { primaryColor: 'sky' };

    function closeOpenFilterMenu() {
        const existingMenu = document.querySelector('.table-filter-menu');
        if (existingMenu) existingMenu.remove();
    }

    function applyTableFilters(table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            let isVisible = true;
            for (const key in activeFilters) {
                const requiredValues = activeFilters[key];
                if (requiredValues.length === 0) continue;
                const cell = row.querySelector(`td[data-key="${key}"]`);
                const cellValue = cell ? cell.dataset.value : '';
                const cellValues = cellValue.split('||');
                const matchFound = cellValues.some(val => requiredValues.includes(val));
                if (!matchFound) {
                    isVisible = false;
                    break;
                }
            }
            row.style.display = isVisible ? '' : 'none';
        });
    }

    function openFilterMenu(triggerElement, table) {
        closeOpenFilterMenu();
        const key = triggerElement.dataset.key;
        const headerCell = triggerElement.closest('th');

        const values = new Set();
        table.querySelectorAll('tbody tr').forEach(row => {
            const cell = row.querySelector(`td[data-key="${key}"]`);
            if (cell && cell.dataset.value) {
                cell.dataset.value.split('||').forEach(val => val && values.add(val));
            }
        });
        const sortedValues = [...values].sort((a, b) => a.localeCompare(b, 'pt'));

        const menu = document.createElement('div');
        menu.className = 'table-filter-menu absolute top-full left-0 mt-1 z-30 w-72 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-2 flex flex-col max-h-80';

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'relative mb-2';
        searchWrapper.innerHTML = `
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ion-icon name="search-outline" class="text-slate-400"></ion-icon>
            </div>
            <input type="text" placeholder="Pesquisar..." class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-${CONFIG.primaryColor}-500">
        `;

        const listContainer = document.createElement('div');
        listContainer.className = 'flex-1 overflow-y-auto custom-scrollbar';

        const currentFilterValues = activeFilters[key] || [];
        sortedValues.forEach(value => {
            const isChecked = currentFilterValues.includes(value);
            listContainer.innerHTML += `
                <label class="flex items-center p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors overflow-hidden">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} value="${value}" class="peer hidden">
                    
                    <div class="mr-3 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300 peer-checked:border-${CONFIG.primaryColor}-500 peer-checked:bg-${CONFIG.primaryColor}-500 transition duration-150">
                        <svg class="hidden h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>

                    <span class="line-clamp-2 text-sm text-left font-semibold">${value}</span>
                </label>`;
        });

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex items-center justify-between pt-2 border-t border-slate-200 mt-1';
        actionsContainer.innerHTML = `
            <button class="select-all-btn text-sm text-${CONFIG.primaryColor}-600 hover:text-${CONFIG.primaryColor}-800 transition-colors">Selecionar Todos</button>
            <button class="clear-filter-btn text-sm text-slate-500 hover:text-slate-800 transition-colors">Limpar Filtro</button>
        `;

        menu.append(searchWrapper, listContainer, actionsContainer);
        headerCell.appendChild(menu);

        menu.addEventListener('click', e => e.stopPropagation());
        const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
        const searchInput = searchWrapper.querySelector('input');
        const filterIcon = triggerElement.querySelector('.filter-icon');

        listContainer.querySelectorAll('.peer').forEach(peer => {
            const customBox = peer.nextElementSibling;
            const svg = customBox.querySelector('svg');
            peer.addEventListener('change', () => {
                svg.classList.toggle('hidden', !peer.checked);
            });
            svg.classList.toggle('hidden', !peer.checked);
        });

        const updateFilterState = () => {
            const selectedValues = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);
            activeFilters[key] = selectedValues;
            const allOptionsCount = checkboxes.length;
            const hasActiveFilter = selectedValues.length > 0 && selectedValues.length < allOptionsCount;
            filterIcon.name = hasActiveFilter ? 'funnel' : 'funnel-outline';
            filterIcon.classList.toggle(`text-${CONFIG.primaryColor}-500`, hasActiveFilter);
            if (!hasActiveFilter) delete activeFilters[key];
            applyTableFilters(table);
        };

        checkboxes.forEach(cb => cb.addEventListener('change', updateFilterState));
        menu.querySelector('.clear-filter-btn').addEventListener('click', () => {
            checkboxes.forEach(cb => { cb.checked = false; cb.dispatchEvent(new Event('change')); });
            updateFilterState();
        });
        menu.querySelector('.select-all-btn').addEventListener('click', () => {
            const isAnyUnchecked = [...checkboxes].some(cb => !cb.checked);
            checkboxes.forEach(cb => { cb.checked = isAnyUnchecked; cb.dispatchEvent(new Event('change')); });
            updateFilterState();
        });
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            listContainer.querySelectorAll('label').forEach(label => {
                const text = label.querySelector('span').textContent.toLowerCase();
                label.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    window.initializeTableFilters = function (tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        table.addEventListener('click', function (e) {
            const trigger = e.target.closest('.table-filter-trigger');
            if (trigger) {
                e.stopPropagation();
                if (trigger.closest('th').querySelector('.table-filter-menu')) {
                    closeOpenFilterMenu();
                } else {
                    openFilterMenu(trigger, table);
                }
            }
        });
        document.addEventListener('click', closeOpenFilterMenu);
    };

    window.initializeTableResizing = function (tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const headers = table.querySelectorAll('thead th');

        headers.forEach((header, index) => {
            if (index === headers.length - 1) {
                return;
            }

            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'cursor-col-resize absolute top-0 bottom-0 w-[3px] z-10 hover:bg-slate-300';
            resizeHandle.style.right = '-2px';

            header.appendChild(resizeHandle);

            resizeHandle.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                e.preventDefault();

                const startX = e.pageX;
                const col = table.querySelector(`colgroup col:nth-child(${index + 1})`);
                const startColWidth = col.offsetWidth;
                const startTableWidth = table.offsetWidth;

                const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.pageX - startX;
                    const newColWidth = startColWidth + deltaX;
                    const minWidth = 100;
                    if (newColWidth > minWidth) {
                        col.style.width = newColWidth + 'px';
                        table.style.width = (startTableWidth + deltaX) + 'px';
                    }
                };

                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
        });
    };

    window.initializeTableReordering = function (tableId) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`Tabela com id "${tableId}" não encontrada.`);
            return;
        }

        let sourceTh = null;
        let sourceIndex = -1;
        let cloneTh = null;
        let dropMarker = null;

        table.querySelectorAll('thead th .table-span-header').forEach(spanHeader => {
            const th = spanHeader.closest('th');
            if (!th) return;

            spanHeader.classList.add('cursor-grab');

            spanHeader.addEventListener('mousedown', (e) => {
                if (e.target.closest('.table-filter-trigger') || e.target.closest('.resize-handle')) {
                    return;
                }
                e.preventDefault();

                sourceTh = th;
                sourceIndex = Array.from(sourceTh.parentElement.children).indexOf(sourceTh);

                sourceTh.classList.add('opacity-50');

                createClone(e);
                createDropMarker();

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp, { once: true });
            });
        });

        function createClone(e) {
            cloneTh = sourceTh.cloneNode(true);
            cloneTh.classList.add(
                'absolute', 'z-[1000]', 'pointer-events-none',
                'bg-white', 'shadow-xl', 'border', 'border-slate-200'
            );

            cloneTh.style.width = `${sourceTh.offsetWidth}px`;
            cloneTh.style.height = `${sourceTh.offsetHeight}px`;
            document.body.appendChild(cloneTh);
            updateClonePosition(e);
        }

        function createDropMarker() {
            dropMarker = document.createElement('div');

            dropMarker.classList.add(
                'absolute',
                'z-10',
                'w-1',
                'bg-slate-300',
                'hidden',
                'h-[580px]'
            );

            table.appendChild(dropMarker);
        }

        function handleMouseMove(e) {
            if (!cloneTh) return;

            document.body.classList.add('cursor-grabbing', 'select-none');

            updateClonePosition(e);
            updateDropMarker(e);
        }

        function updateClonePosition(e) {
            cloneTh.style.left = `${e.pageX - cloneTh.offsetWidth / 2}px`;
            cloneTh.style.top = `${e.pageY - cloneTh.offsetHeight / 2}px`;
        }

        function updateDropMarker(e) {
            const headers = Array.from(table.querySelectorAll('thead th'));
            let targetTh = null;
            let insertBefore = false;

            for (const th of headers) {
                if (th === sourceTh) continue;

                const rect = th.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;

                if (e.clientX >= rect.left && e.clientX <= rect.right) {
                    targetTh = th;
                    insertBefore = e.clientX < midX;
                    break;
                }
            }

            if (targetTh) {
                const thead = table.querySelector('thead');
                const tbody = table.querySelector('tbody');
                if (!thead || !tbody) return;

                const theadRect = thead.getBoundingClientRect();
                const markerTop = theadRect.top;

                const targetRect = targetTh.getBoundingClientRect();

                const markerX = insertBefore ? targetRect.left : targetRect.right;
                dropMarker.style.top = `${markerTop + window.scrollY}px`;
                dropMarker.style.left = `${markerX + window.scrollX - (dropMarker.offsetWidth / 2)}px`;

                dropMarker.classList.remove('hidden');
            } else {
                dropMarker.classList.add('hidden');
            }
        }

        function handleMouseUp(e) {
            if (!sourceTh || !dropMarker || dropMarker.classList.contains('hidden')) {
                cleanup();
                return;
            }

            const headers = Array.from(sourceTh.parentElement.children);
            let targetTh = null;
            let insertBefore = false;

            for (const th of headers) {
                if (th === sourceTh) continue;
                const rect = th.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right) {
                    targetTh = th;
                    insertBefore = e.clientX < (rect.left + rect.width / 2);
                    break;
                }
            }

            if (targetTh) {
                const targetIndex = headers.indexOf(targetTh);
                reorderTable(sourceIndex, targetIndex, insertBefore);
            }

            cleanup();
        }

        function reorderTable(fromIndex, toIndex, insertBefore) {
            if (fromIndex === toIndex || (fromIndex === toIndex - 1 && !insertBefore)) return;

            table.querySelectorAll('tr').forEach(row => {
                const cells = Array.from(row.children);
                const sourceCell = cells[fromIndex];
                const targetCell = cells[toIndex];

                if (insertBefore) {
                    row.insertBefore(sourceCell, targetCell);
                } else {
                    row.insertBefore(sourceCell, targetCell.nextElementSibling);
                }
            });

            const colgroup = table.querySelector('colgroup');
            if (colgroup) {
                const cols = Array.from(colgroup.children);
                const sourceCol = cols[fromIndex];
                const targetCol = cols[toIndex];

                if (insertBefore) {
                    colgroup.insertBefore(sourceCol, targetCol);
                } else {
                    colgroup.insertBefore(sourceCol, targetCol.nextElementSibling);
                }
            }
        }

        function cleanup() {
            if (sourceTh) {
                sourceTh.classList.remove('opacity-50');
            }
            if (cloneTh) {
                cloneTh.remove();
            }
            if (dropMarker) {
                dropMarker.remove();
            }

            document.body.classList.remove('cursor-grabbing', 'select-none');

            sourceTh = null;
            cloneTh = null;
            dropMarker = null;
            sourceIndex = -1;
            document.removeEventListener('mousemove', handleMouseMove);
        }
    };
})();