// --- Bloco de Configuração Inicial ---
(function () {
    // Objeto de configuração global
    const CONFIG = {
        primaryColor: 'sky'
    };

    // Classes de animação do Tailwind para um item sendo removido
    const REMOVING_CLASSES = [
        'transition-all', 'duration-200', 'ease-out',
        'max-h-0', 'opacity-0', '!p-0', '!m-0', '!border-0'
    ];

    // Objeto privado para armazenar os callbacks dos listeners
    const _eventListeners = {};

    // --- Lógica Interna do Componente ---

    function _normalizeText(text) {
        if (!text) return '';
        const normalized = text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalized.replace(/[^a-z0-9]/g, "");
    }

    function _fireChangeEvent(selectId) {
        if (_eventListeners[selectId]) {
            const currentValues = getCustomSelectValues(selectId);
            _eventListeners[selectId].forEach(callback => callback(currentValues));
        }
    }

    function _createActiveItem(text) {
        const item = document.createElement('a');
        item.className = 'flex items-center gap-1.5 bg-gray-200 text-gray-800 text-sm font-medium pl-2.5 pr-1.5 py-1 rounded select-active-item cursor-pointer';
        item.appendChild(document.createTextNode(text));
        const removeIcon = document.createElement('i');
        removeIcon.className = `flex items-center justify-center w-5 h-5 text-${CONFIG.primaryColor}-600 rounded-full hover:bg-gray-300`;
        removeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
        item.appendChild(removeIcon);
        return item;
    }

    function _createListItem(text) {
        const item = document.createElement('li');
        item.className = `px-3 py-2 text-gray-700 text-base cursor-pointer rounded-md hover:bg-${CONFIG.primaryColor}-600 hover:text-white`;
        item.textContent = text;
        return item;
    }

    function _updateDropdownMessages(selectContainer) {
        const list = selectContainer.querySelector('ul');
        const allSelectedMessage = list.querySelector('.all-selected-message');
        const noResultsMessage = list.querySelector('.no-results-message');
        const listItems = list.querySelectorAll('li:not(.all-selected-message):not(.no-results-message)');
        allSelectedMessage.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        if (listItems.length === 0) {
            allSelectedMessage.classList.remove('hidden');
        }
    }

    function _toggleDropdown(selectContainer, forceClose = false) {
        // [MODIFICADO] Seleciona o painel principal do dropdown
        const dropdownPanel = selectContainer.querySelector('.dropdown-panel');
        const arrow = selectContainer.querySelector('.arrow-icon');
        const searchInput = selectContainer.querySelector('.search-input');

        if (forceClose || selectContainer.classList.contains('is-open')) {
            selectContainer.classList.remove('is-open');
            dropdownPanel.classList.add('scale-95', 'opacity-0', 'invisible');
            arrow.classList.remove('rotate-180');
        } else {
            document.querySelectorAll('.custom-select-container.is-open').forEach(openSelect => {
                _toggleDropdown(openSelect, true);
            });
            selectContainer.classList.add('is-open');
            dropdownPanel.classList.remove('scale-95', 'opacity-0', 'invisible');
            arrow.classList.add('rotate-180');
            if (searchInput) searchInput.focus();
            _updateDropdownMessages(selectContainer);
        }
    }

    // --- Funções Públicas ---

    window.createCustomSelect = function (selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) { console.error(`Elemento com ID "${selectId}" não encontrado.`); return; }

        const parent = selectElement.parentElement;
        if (parent.querySelector(`.custom-select-container[data-select-id="${selectId}"]`)) {
            parent.querySelector(`.custom-select-container[data-select-id="${selectId}"]`).remove();
        }

        const selectContainer = document.createElement('div');
        selectContainer.className = 'relative w-full custom-select-container';
        selectContainer.dataset.selectId = selectId;

        const activeSelection = document.createElement('div');
        activeSelection.className = `relative z-10 flex items-start w-full rounded-md border border-slate-300 bg-white p-2 text-sm shadow-sm outline-none focus:border-${CONFIG.primaryColor}-500 focus:ring-1 focus:ring-${CONFIG.primaryColor}-500 min-h-[44px] cursor-pointer`;
        activeSelection.tabIndex = 0;

        const tagsWrapper = document.createElement('div');
        tagsWrapper.className = 'flex-1 flex flex-wrap items-center gap-1.5 tags-wrapper';

        // --- [ESTRUTURA MODIFICADA] ---

        // 1. Container principal do dropdown (antigo 'list')
        const dropdownPanel = document.createElement('div');
        dropdownPanel.className = 'dropdown-panel absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 origin-top transform scale-95 opacity-0 invisible transition-all duration-200 ease-out flex flex-col';

        // 2. Container da barra de pesquisa (fixo no topo do painel)
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'sticky top-0 p-2 bg-white z-10 relative';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Pesquisar...';
        searchInput.className = `w-full px-3 pr-8 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-${CONFIG.primaryColor}-500 focus:border-${CONFIG.primaryColor}-500 search-input`;
        const clearSearchBtn = document.createElement('div');
        clearSearchBtn.className = 'hidden absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400 hover:text-gray-600 p-1.5';
        clearSearchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
        searchWrapper.append(searchInput, clearSearchBtn);

        // 3. Container da lista (a parte que terá scroll)
        const listWrapper = document.createElement('div');
        listWrapper.className = 'max-h-60 overflow-y-auto';

        // 4. O elemento <ul> que contém os itens
        const listElement = document.createElement('ul');
        listElement.className = 'p-1';

        // Adiciona as mensagens de feedback ao <ul>
        const noResultsMessage = document.createElement('li');
        noResultsMessage.className = 'no-results-message hidden text-center p-2.5 text-gray-400';
        noResultsMessage.textContent = 'Nenhum resultado encontrado.';
        listElement.appendChild(noResultsMessage);

        const allSelectedMessage = document.createElement('li');
        allSelectedMessage.className = 'all-selected-message hidden text-center p-2.5 text-gray-400';
        allSelectedMessage.textContent = 'Todas as opções foram selecionadas.';
        listElement.appendChild(allSelectedMessage);

        // --- FIM DA ESTRUTURA MODIFICADA ---

        const placeholderSpan = document.createElement('span');
        placeholderSpan.className = 'absolute left-3 top-2.5 text-gray-400 transition-opacity duration-200 pointer-events-none';
        placeholderSpan.textContent = selectElement.dataset.placeholder || '';

        Array.from(selectElement.options).forEach(option => {
            if (option.selected) {
                tagsWrapper.appendChild(_createActiveItem(option.textContent));
                placeholderSpan.classList.add('opacity-0', 'invisible');
            } else {
                // Adiciona os itens ao <ul>
                listElement.appendChild(_createListItem(option.textContent));
            }
        });

        const arrow = document.createElement('div');
        arrow.className = 'arrow-icon self-center pl-2 transition-transform duration-300';
        arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`;

        activeSelection.append(placeholderSpan, tagsWrapper, arrow);

        // Monta a nova estrutura
        listWrapper.appendChild(listElement);
        dropdownPanel.append(searchWrapper, listWrapper);
        selectContainer.append(activeSelection, dropdownPanel);

        selectElement.style.display = 'none';
        parent.insertBefore(selectContainer, selectElement);

        // --- Lógica dos eventos (sem alterações necessárias) ---
        searchInput.addEventListener('input', () => {
            const searchTerm = _normalizeText(searchInput.value);
            // Seleciona os itens dentro do <ul> específico
            const items = listElement.querySelectorAll('li:not(.no-results-message):not(.all-selected-message)');
            let visibleItems = 0;

            items.forEach(item => {
                const itemIsVisible = _normalizeText(item.textContent).includes(searchTerm);
                item.classList.toggle('hidden', !itemIsVisible);
                if (itemIsVisible) visibleItems++;
            });

            const noResults = visibleItems === 0 && searchTerm.length > 0;
            noResultsMessage.classList.toggle('hidden', !noResults);
            clearSearchBtn.classList.toggle('hidden', searchInput.value.length === 0);
        });

        clearSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
        });

        searchWrapper.addEventListener('click', e => e.stopPropagation());
    };

    window.getCustomSelectValues = function (selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return [];
        return Array.from(selectElement.options).filter(o => o.selected).map(o => o.value);
    };

    window.onCustomSelectChange = function (selectId, callback) {
        if (!document.getElementById(selectId) || typeof callback !== 'function') return;
        if (!_eventListeners[selectId]) _eventListeners[selectId] = [];
        _eventListeners[selectId].push(callback);
    };

    document.addEventListener('click', function (e) {
        const selectContainer = e.target.closest('.custom-select-container');

        if (!selectContainer) {
            document.querySelectorAll('.custom-select-container.is-open').forEach(sc => _toggleDropdown(sc, true));
            return;
        }

        const selectId = selectContainer.dataset.selectId;
        const originalSelect = document.getElementById(selectId);

        if (e.target.closest('.select-active-item')) {
            const activeItem = e.target.closest('.select-active-item');
            const itemText = activeItem.firstChild.textContent.trim();
            selectContainer.querySelector('ul').appendChild(_createListItem(itemText));
            const option = Array.from(originalSelect.options).find(o => o.textContent.trim() === itemText);
            if (option) option.selected = false;
            activeItem.remove();
            if (getCustomSelectValues(selectId).length === 0) {
                selectContainer.querySelector('span').classList.remove('opacity-0', 'invisible');
            }
            _updateDropdownMessages(selectContainer);
            _fireChangeEvent(selectId);
            e.stopPropagation();
            return;
        }

        if (e.target.closest('li:not(.no-results-message):not(.all-selected-message)')) {
            const listItem = e.target.closest('li:not(.no-results-message):not(.all-selected-message)');
            const itemText = listItem.textContent.trim();
            selectContainer.querySelector('.tags-wrapper').appendChild(_createActiveItem(itemText));
            const option = Array.from(originalSelect.options).find(o => o.textContent.trim() === itemText);
            if (option) option.selected = true;

            listItem.classList.add(...REMOVING_CLASSES);
            listItem.addEventListener('transitionend', () => {
                listItem.remove();
                _updateDropdownMessages(selectContainer);
            }, { once: true });

            selectContainer.querySelector('span').classList.add('opacity-0', 'invisible');
            _fireChangeEvent(selectId);
            return;
        }

        _toggleDropdown(selectContainer);
    });
})();