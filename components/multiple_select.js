// --- Bloco de Configuração Inicial ---
(function() {
    // 1) Adiciona o estilo necessário para a animação no <head>
    const style = document.createElement('style');
    style.textContent = `
        .list-item-removing {
            transition: all 0.2s ease-out;
            max-height: 0 !important;
            opacity: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin: 0 !important;
            border: 0 !important;
        }
    `;
    document.head.appendChild(style);

    // --- Lógica Interna do Componente ---

    function _createActiveItem(text) {
        const item = document.createElement('a');
        item.className = 'flex items-center gap-1.5 bg-gray-200 text-gray-800 text-sm font-medium pl-2.5 pr-1.5 py-1 rounded select-active-item cursor-pointer';
        item.appendChild(document.createTextNode(text));
        
        const removeIcon = document.createElement('i');
        removeIcon.className = 'flex items-center justify-center w-5 h-5 text-indigo-600 rounded-full hover:bg-gray-300';
        removeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
        item.appendChild(removeIcon);
        
        return item;
    }

    function _createListItem(text) {
        const item = document.createElement('li');
        item.className = 'px-3 py-2 text-gray-700 text-base cursor-pointer rounded-md hover:bg-indigo-600 hover:text-white';
        item.textContent = text;
        return item;
    }

    function _toggleDropdown(selectContainer, forceClose = false) {
        const list = selectContainer.querySelector('ul');
        const arrow = selectContainer.querySelector('.arrow-icon');
        if (forceClose || selectContainer.classList.contains('is-open')) {
            selectContainer.classList.remove('is-open');
            list.classList.add('scale-95', 'opacity-0', 'invisible');
            arrow.classList.remove('rotate-180');
        } else {
            document.querySelectorAll('.custom-select-container.is-open').forEach(openSelect => {
                _toggleDropdown(openSelect, true);
            });
            selectContainer.classList.add('is-open');
            list.classList.remove('scale-95', 'opacity-0', 'invisible');
            arrow.classList.add('rotate-180');
        }
    }

    // --- Funções Públicas ---

    /**
     * Transforma um <select> HTML padrão em um componente customizado.
     * @param {string} selectId O ID do elemento <select> a ser transformado.
     */
    window.createCustomSelect = function(selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`Elemento com ID "${selectId}" não encontrado.`);
            return;
        }

        const selectContainer = document.createElement('div');
        selectContainer.className = 'relative w-full custom-select-container';
        selectContainer.dataset.selectId = selectId;

        const activeSelection = document.createElement('div');
        // Alterado para items-start para alinhar corretamente quando houver quebra de linha
        activeSelection.className = 'relative z-20 flex items-start p-2 w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500';

        // NOVO: Wrapper para os itens selecionados (tags)
        const tagsWrapper = document.createElement('div');
        tagsWrapper.className = 'flex-1 flex flex-wrap items-center gap-1.5 tags-wrapper';

        const list = document.createElement('ul');
        list.className = 'absolute z-40 top-full left-0 right-0 mt-2 p-1 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 origin-top transform scale-95 opacity-0 invisible transition-all duration-200 ease-out';
        
        const placeholderSpan = document.createElement('span');
        placeholderSpan.className = 'absolute left-3 top-[11px] text-gray-400 transition-opacity duration-200 pointer-events-none';
        placeholderSpan.textContent = selectElement.dataset.placeholder || '';
        
        // Popula o tagsWrapper em vez do activeSelection diretamente
        Array.from(selectElement.options).forEach(option => {
            if (option.selected) {
                tagsWrapper.appendChild(_createActiveItem(option.textContent));
                placeholderSpan.classList.add('opacity-0', 'invisible');
            } else {
                list.appendChild(_createListItem(option.textContent));
            }
        });

        const arrow = document.createElement('div');
        // Removido o posicionamento absoluto. Agora é um item flexível.
        arrow.className = 'arrow-icon self-center pl-2 transition-transform duration-300';
        arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`;
        
        // Monta a estrutura corrigida
        activeSelection.appendChild(placeholderSpan);
        activeSelection.appendChild(tagsWrapper);
        activeSelection.appendChild(arrow);
        
        selectContainer.append(activeSelection, list);
        
        const parent = selectElement.parentElement;
        const existingComponent = parent.querySelector(`.custom-select-container[data-select-id="${selectId}"]`);
        if (existingComponent) {
            // Se encontrar, remove-o antes de criar um novo
            parent.removeChild(existingComponent);
        }

        selectElement.style.display = 'none';
        selectElement.parentElement.insertBefore(selectContainer, selectElement);
    };

    /**
     * Resgata os valores selecionados de um componente customizado.
     * @param {string} selectId O ID do elemento <select> original.
     * @returns {string[]} Um array com os valores das opções selecionadas.
     */
    window.getCustomSelectValues = function(selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`Elemento com ID "${selectId}" não encontrado.`);
            return [];
        }
        return Array.from(selectElement.options)
            .filter(option => option.selected)
            .map(option => option.value);
    };

    // --- Manipulador de Eventos Global ---
    document.addEventListener('click', function(e) {
        const selectContainer = e.target.closest('.custom-select-container');

        if (!selectContainer) {
            document.querySelectorAll('.custom-select-container.is-open').forEach(openSelect => {
                _toggleDropdown(openSelect, true);
            });
            return;
        }

        const originalSelect = document.getElementById(selectContainer.dataset.selectId);
        
        const activeItem = e.target.closest('.select-active-item');
        if (activeItem) {
            const itemText = activeItem.firstChild.textContent.trim();
            selectContainer.querySelector('ul').appendChild(_createListItem(itemText));
            Array.from(originalSelect.options).find(o => o.textContent === itemText).selected = false;
            activeItem.remove();
            
            if (getCustomSelectValues(originalSelect.id).length === 0) {
                selectContainer.querySelector('span').classList.remove('opacity-0', 'invisible');
            }
            e.stopPropagation();
            return;
        }

        const listItem = e.target.closest('li');
        if (listItem) {
            // Adiciona o novo item ao 'tagsWrapper'
            selectContainer.querySelector('.tags-wrapper').appendChild(_createActiveItem(listItem.textContent));
            Array.from(originalSelect.options).find(o => o.textContent === listItem.textContent).selected = true;
            listItem.classList.add('list-item-removing');
            listItem.addEventListener('transitionend', () => listItem.remove(), { once: true });
            selectContainer.querySelector('span').classList.add('opacity-0', 'invisible');
            return;
        }

        _toggleDropdown(selectContainer);
    });

})();