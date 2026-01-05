function initModalPlanos() {
    const modalHtml = `
        <section id="modal">
            <!-- Modal de edição -->
            <div id="edit-modal-plan"
                class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <!-- Cabeçalho do Modal -->
                    <div class="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <h3 class="text-xl font-bold text-slate-800">Editar Plano de Ação</h3>
                        <button id="modal-btn-close-plan" type="button"
                            class="text-slate-500 hover:text-red-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <ion-icon name="close-outline" class="text-2xl"></ion-icon>
                        </button>
                    </div>

                    <!-- Corpo do Modal -->
                    <div class="p-5 overflow-y-auto">
                        <form id="modal-form" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <!-- Título Editável -->
                            <div class="md:col-span-2">
                                <input type="text" id="edit-Nome" name="Nome"
                                    class="w-full bg-transparent border-none p-0 text-2xl font-bold text-sky-700 focus:ring-0 placeholder-slate-400 -mx-2 px-2 hover:bg-slate-50 rounded-lg"
                                    placeholder="Nome do Plano de Ação">
                            </div>
                            <!-- Campos Principais -->
                            <div>
                                <label for="edit-Status"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Status</label>
                                <select id="edit-Status" name="Status"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                    <option value="Em desenvolvimento">Em desenvolvimento</option>
                                    <option value="Planejado">Planejado</option>
                                    <option value="Em curso">Em curso</option>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Implementado">Implementado</option>
                                </select>
                            </div>
                            <div>
                                <label for="edit-Resolução"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Resolução</label>
                                <input type="text" id="edit-Resolução" name="Resolução"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div>
                                <label for="edit-Data-inicio"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Data de início</label>
                                <input type="date" id="edit-Data-inicio" name="Data início"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div>
                                <label for="edit-Data-fim"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Data fim</label>
                                <input type="date" id="edit-Data-fim" name="Data fim"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div class="md:col-span-2">
                                <label for="edit-Observacoes"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Observações</label>
                                <textarea id="edit-Observacoes" name="Observações" rows="2"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <!-- Seção SEI -->
                            <div class="md:col-span-2 flex items-center gap-2 pt-4 border-t border-slate-200 mt-2">
                                <img src="../../assets/images/logo_sei_mg.png" class="h-6 w-auto object-contain"
                                    alt="Logo SEI">
                            </div>
                            <div>
                                <label for="edit-Processo-SEI"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Processo SEI de
                                    origem</label>
                                <input type="text" id="edit-Processo-SEI" name="Processo SEI"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div class="md:col-span-2">
                                <label for="edit-SEI-relacionados"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Outros SEI
                                    relacionados</label>
                                <textarea id="edit-SEI-relacionados" name="SEI relacionados" rows="2"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <!-- Seção Equipe -->
                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="people" class="text-lg"></ion-icon> Equipe responsável
                                </h4>
                            </div>
                            <div class="md:col-span-2">
                                <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                                    <table id="tabelaPessoas" class="min-w-full divide-y divide-slate-200">
                                        <thead class="bg-slate-50">
                                            <tr>
                                                <th scope="col"
                                                    class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Nome</th>
                                                <th scope="col"
                                                    class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Email</th>
                                                <th scope="col"
                                                    class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Unidade</th>
                                                <th scope="col"
                                                    class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Coordenador</th>
                                                <th scope="col" class="relative px-4 py-3"><span
                                                        class="sr-only">Remover</span></th>
                                            </tr>
                                        </thead>
                                        <tbody id="corpoTabelaPessoas" class="bg-white divide-y divide-slate-200">
                                        </tbody>
                                    </table>
                                </div>
                                <div class="mt-3 text-right">
                                    <button type="button" id="btnAdicionarPessoa"
                                        class="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-800 text-sm font-medium rounded-md hover:bg-sky-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-sky-300 transition-colors">
                                        <ion-icon name="add-outline" class="text-base"></ion-icon> Adicionar Pessoa
                                    </button>
                                </div>
                            </div>

                            <!-- Seção Documentos -->
                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="documents" class="text-lg"></ion-icon>
                                    Documentos
                                </h4>
                            </div>
                            <div class="md:col-span-2">
                                <label for="edit-Documento-TCE"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Documento TCE</label>
                                <input type="text" id="edit-Documento-TCE" name="Documento TCE"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div class="md:col-span-2">
                                <label for="edit-Documentos-relacionados"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Documentos
                                    relacionados</label>
                                <textarea id="edit-Documentos-relacionados" name="Documentos relacionados" rows="2"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>
                        </form>
                    </div>

                    <!-- Rodapé do Modal -->
                    <div
                        class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3 flex-shrink-0">
                        <button id="modal-btn-cancel-plan" type="button"
                            class="bg-white text-slate-700 font-semibold py-2 px-5 rounded-lg border border border-slate-150 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                            Cancelar
                        </button>
                        <button id="modal-btn-save-plan" type="button"
                            class="bg-sky-600 text-white font-semibold py-2 px-5 rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmação para descartar alterações -->
            <div id="confirmation-modal-plan"
                class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-slate-800">Descartar Alterações?</h3>
                        <p class="mt-2 text-sm text-slate-600">Você fez alterações que não foram salvas. Tem certeza
                            de que deseja sair?</p>
                    </div>
                    <div
                        class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                        <button id="confirm-btn-no-plan" type="button"
                            class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">
                            Não
                        </button>
                        <button id="confirm-btn-yes-plan" type="button"
                            class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                            Sim, Descartar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmação de exclusão -->
            <div id="delete-confirmation-modal-plan"
                class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                    <div class="p-6">
                        <div class="flex items-center">
                            <!-- Ícone de Alerta -->
                            <div
                                class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div class="ml-4 text-left">
                                <h3 class="text-lg font-bold text-slate-800">Confirmar Exclusão</h3>
                            </div>
                        </div>
                        <div class="mt-4">
                            <p class="text-sm text-slate-600">
                                Tem certeza de que deseja excluir o plano de ação: <strong id="plano-to-delete-name"
                                    class="font-bold text-slate-800"></strong>?
                            </p>
                            <p class="mt-2 text-sm font-semibold text-red-700 bg-red-50 p-3 rounded-md">
                                Esta ação é permanente e não poderá ser revertida pelo usuário.
                            </p>
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                        <button id="delete-confirm-btn-no-plan" type="button"
                            class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed">
                            Cancelar
                        </button>
                        <button id="delete-confirm-btn-yes-plan" type="button"
                            class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 disabled:cursor-not-allowed">
                            Sim, Excluir
                        </button>
                    </div>
                </div>
            </div>
            <!-- Modal do prompt de visãoi geral -->
            <div id="prompt-modal"
                class="hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-lg font-semibold text-slate-800">Detalhes do Prompt</h3>
                        <button id="close-modal-button"
                            class="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                            <ion-icon name="close-outline" class="text-2xl"></ion-icon>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto">
                        <p class="text-sm text-slate-600 mb-4">
                            Model: GPT-4.1 mini
                        </p>
                        <pre
                            class="bg-slate-100 text-slate-800 text-xs p-4 rounded-lg whitespace-pre-wrap font-mono"><code id="prompt-text-container"></code></pre>
                    </div>
                </div>
            </div>
        </section>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    setupModalPlanosLogic();
}

let currentPlanId = null;
let hasChangesPlanos = false;
let isNewPlan = false;

function setupModalPlanosLogic() {
    // --- Configuração dos botões de edição ---
    // Como os botões podem ser gerados dinamicamente nos cards, 
    // precisamos usar delegação de eventos ou re-atachar.
    // Para simplificar, vamos expor funções globais ou delegar no body.

    document.body.addEventListener('click', (event) => {
        const editBtn = event.target.closest('.edit-plano-button');
        if (editBtn) {
            openEditModal(editBtn.dataset.planId);
        }

        const deleteBtn = event.target.closest('.delete-plano-button');
        if (deleteBtn) {
            openDeleteConfirmationModal(deleteBtn.dataset.planId);
        }
    });

    // --- Controles do modal de edição ---
    const modalForm = document.getElementById('modal-form');
    if (modalForm) {
        modalForm.addEventListener('input', () => (hasChangesPlanos = true));
    }

    const modalBtnMap = {
        'modal-btn-close-plan': () => closeEditModalPlan(),
        'modal-btn-cancel-plan': () => closeEditModalPlan(),
        'modal-btn-save-plan': handleSave,
        'confirm-btn-no-plan': () => document.getElementById('confirmation-modal-plan').classList.add('hidden'),
        'confirm-btn-yes-plan': () => closeEditModalPlan(true)
    };

    Object.entries(modalBtnMap).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });


    // --- Controles do modal de confirmação de exclusão ---
    const deleteModal = document.getElementById('delete-confirmation-modal-plan');
    if (deleteModal) {
        const deleteBtnMap = {
            'delete-confirm-btn-no-plan': () => { deleteModal.classList.add('hidden'); currentPlanId = '' },
            'delete-confirm-btn-yes-plan': handleDelete
        };

        Object.entries(deleteBtnMap).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', handler);
        });
    }

    // --- controles da tabela ---
    const btnAdicionar = document.getElementById('btnAdicionarPessoa');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => adicionarLinhaPessoa());
    }
}

function adicionarLinhaPessoa(pessoaData = {}) {
    const corpoTabela = document.getElementById('corpoTabelaPessoas');
    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td class="px-4 py-2 whitespace-nowrap">
          <input type="text" name="nome" value="${pessoaData.Nome || ''}" 
            class="mt-1 block w-full p-2 border border-slate-150 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
        </td>
        <td class="px-4 py-2 whitespace-nowrap">
          <input type="email" name="email" value="${pessoaData.Email || ''}" 
            class="mt-1 block w-full p-2 border border-slate-150 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
        </td>
        <td class="px-4 py-2 whitespace-nowrap">
          <input type="text" name="unidade" value="${pessoaData.Unidade || ''}" 
            class="mt-1 block w-full p-2 border border-slate-150 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
        </td>
        <td class="px-2 py-2 text-center">
          <input type="checkbox" name="coordenador" 
            class="h-5 w-5 text-sky-600 border border-slate-150 rounded focus:ring-sky-500" 
            ${pessoaData.Coordenador ? 'checked' : ''}>
        </td>
        <td class="px-4 py-2 text-right">
          <button type="button" class="remover-linha text-red-600 hover:text-red-800">
            <ion-icon name="trash" class="text-base"></ion-icon>
          </button>
        </td>`;

    corpoTabela.appendChild(novaLinha);
    novaLinha.addEventListener('input', () => (hasChangesPlanos = true));

    novaLinha.querySelector('.remover-linha').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const linha = btn.closest('tr');
        linha.remove();
        hasChangesPlanos = true;

        const linhasRestantes = corpoTabela.querySelectorAll('tr');
        if (linhasRestantes.length === 0) {
            adicionarLinhaPessoa();
        }
    });
}

function openEditModal(planId) {
    const modal = document.getElementById('edit-modal-plan');
    const form = document.getElementById('modal-form');
    const modalTitle = modal.querySelector('h3');

    currentPlanId = planId;
    isNewPlan = !planId;

    form.reset();

    if (isNewPlan) {
        modalTitle.textContent = 'Criar Novo Plano de Ação';
        form.querySelector('[name="Status"]').value = 'Planejado';
        adicionarLinhaPessoa();
    } else {
        modalTitle.textContent = 'Editar Plano de Ação';
        const planData = window.jsonPlanos.find(p => p.ID === currentPlanId);
        fillModalEdicao(planData);
    }

    hasChangesPlanos = false;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function fillModalEdicao(planData) {
    const form = document.getElementById('modal-form');
    const corpoTabela = document.getElementById('corpoTabelaPessoas');
    corpoTabela.innerHTML = '';

    const pessoas = planData.objPessoas || [];
    if (pessoas.length === 0) {
        adicionarLinhaPessoa();
    } else {
        pessoas.forEach(pessoa => {
            adicionarLinhaPessoa(pessoa);
        });
    }

    Object.entries(planData).forEach(([key, value]) => {
        if (key !== 'objPessoas') {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = value;
        }
    });
}

function closeEditModalPlan(force = false) {
    const confirmationModal = document.getElementById('confirmation-modal-plan');
    const editModal = document.getElementById('edit-modal-plan');
    const body = document.body;

    if (hasChangesPlanos && !force) {
        confirmationModal.classList.remove('hidden');
        return;
    }

    const form = document.getElementById('modal-form');
    form.reset();

    editModal.classList.add('hidden');
    confirmationModal.classList.add('hidden');

    document.getElementById('corpoTabelaPessoas').innerHTML = '';

    hasChangesPlanos = false;
    isNewPlan = false;

    editModal.removeAttribute('data-plan-id');
    body.classList.remove('overflow-hidden');
}

async function handleSave() {
    if (!hasChangesPlanos) {
        closeEditModalPlan(true);
        return;
    }

    const saveBtn = document.getElementById('modal-btn-save-plan');
    const cancelBtn = document.getElementById('modal-btn-cancel-plan');
    const closeBtn = document.getElementById('modal-btn-close-plan');

    const form = document.getElementById('modal-form');
    const formData = new FormData(form);

    ['nome', 'email', 'unidade', 'coordenador'].forEach(v => { formData.delete(v); });

    const corpoTabela = document.getElementById('corpoTabelaPessoas');
    const linhasTabela = corpoTabela.querySelectorAll('tr');
    const objPessoas = [];

    linhasTabela.forEach(linha => {
        const nome = linha.querySelector('input[name="nome"]').value;
        const email = linha.querySelector('input[name="email"]').value;
        const unidade = linha.querySelector('input[name="unidade"]').value;
        const coordenador = linha.querySelector('input[name="coordenador"]').checked;

        objPessoas.push({
            Nome: nome,
            Email: email,
            Unidade: unidade,
            Coordenador: coordenador
        });
    });

    formData.append('objPessoas', JSON.stringify(objPessoas));
    const updatedPlan = Object.fromEntries(formData.entries());
    updatedPlan.objPessoas = JSON.parse(updatedPlan.objPessoas);

    const camposObrigatorios = ['Nome', 'Status', 'Data início', 'Data fim'];
    const camposInvalidos = [];

    camposObrigatorios.forEach(campo => {
        if (!updatedPlan[campo] || updatedPlan[campo].trim() === '') {
            camposInvalidos.push(campo);
        }
    });

    if (camposInvalidos.length > 0) {
        alert(`Os seguintes campos são obrigatórios e não foram preenchidos:\n- ${camposInvalidos.join('\n- ')}`);
        return;
    }

    [saveBtn, cancelBtn, closeBtn].forEach(btn => (btn.disabled = true));
    saveBtn.textContent = 'Salvando...';

    try {
        const action = isNewPlan ? 'create' : 'update';
        const id = isNewPlan ? '' : currentPlanId;

        const oldPlan = !isNewPlan ? window.jsonPlanos.find(p => p.ID === currentPlanId) : null;

        const response = await window.salvarArquivoNoOneDrive(id, 'planos.txt', action, updatedPlan, 'jsonPlanos');

        if (response?.status === 200) {
            await sincronizarNotificacoesComPessoasDoPlano(oldPlan, updatedPlan);
            window.location.reload();
        } else {
            throw new Error(response?.message || 'Erro desconhecido ao salvar');
        }
    } catch (error) {
        console.error('Falha ao salvar o plano:', error);
        alert(`Ocorreu um erro ao salvar: ${error.message}`);
        [saveBtn, cancelBtn, closeBtn].forEach(btn => (btn.disabled = false));
        saveBtn.textContent = 'Salvar Alterações';
    }
}

async function handleDelete() {
    const confirmButton = document.getElementById('delete-confirm-btn-yes-plan');
    const cancelButton = document.getElementById('delete-confirm-btn-no-plan');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal-plan');

    const originalConfirmText = confirmButton.textContent;

    [confirmButton, cancelButton].forEach(btn => (btn.disabled = true));
    confirmButton.textContent = 'Excluindo...';

    try {
        const response = await window.salvarArquivoNoOneDrive(currentPlanId, 'planos.txt', 'delete', '', 'jsonPlanos');
        if (response.status === 200) {
            window.location.reload();
        } else {
            const errorMessage = response.message || `Erro desconhecido (Status: ${response.status})`;
            alert(`Erro ao excluir: ${errorMessage}`);
            [confirmButton, cancelButton].forEach(btn => (btn.disabled = false));
        }
    } catch (error) {
        console.error("Falha ao excluir o plano:", error);
        alert("Ocorreu um erro inesperado ao excluir o plano. Por favor, tente novamente.");
        [confirmButton, cancelButton].forEach(btn => (btn.disabled = false));
    } finally {
        confirmButton.textContent = originalConfirmText;
        deleteConfirmationModal.classList.add('hidden');
    }
}

function openDeleteConfirmationModal(idPlan) {
    const planData = window.jsonPlanos.find(p => p.ID === idPlan);
    currentPlanId = idPlan;
    const modal = document.getElementById('delete-confirmation-modal-plan');
    const nameSpan = document.getElementById('plano-to-delete-name');
    nameSpan.textContent = `"${planData.Nome}"`;
    modal.classList.remove('hidden');
}

async function sincronizarNotificacoesComPessoasDoPlano(oldPlan, newPlan) {
    if (!oldPlan || !newPlan || isNewPlan) return;

    const oldPessoas = oldPlan.objPessoas || [];
    const newPessoas = newPlan.objPessoas || [];

    const added = newPessoas.filter(np => !oldPessoas.some(op => op.Email === np.Email));
    const removed = oldPessoas.filter(op => !newPessoas.some(np => np.Email === op.Email));
    const unitChanged = newPessoas.filter(np => {
        const op = oldPessoas.find(o => o.Email === np.Email);
        return op && op.Unidade !== np.Unidade;
    });

    if (added.length === 0 && removed.length === 0 && unitChanged.length === 0) return;

    const acoesDoPlano = window.jsonAcoes.filter(a => a['Plano de ação'] === oldPlan.Nome);
    if (acoesDoPlano.length === 0) return;

    const notificationSaves = [];

    for (const acao of acoesDoPlano) {
        const actionUnits = acao.Unidades || [];
        const actionNotifications = window.jsonNotificacoes.filter(n => n.idAcao === acao.ID && n.status === 'planejado');

        for (const notif of actionNotifications) {
            let modified = false;
            let currentMailList = [...(notif.mailList || [])];

            removed.forEach(p => {
                if (currentMailList.includes(p.Email)) {
                    currentMailList = currentMailList.filter(email => email !== p.Email);
                    modified = true;
                }
            });

            added.forEach(p => {
                if (actionUnits.includes(p.Unidade) && !currentMailList.includes(p.Email)) {
                    currentMailList.push(p.Email);
                    modified = true;
                }
            });

            unitChanged.forEach(p => {
                const isEmailInList = currentMailList.includes(p.Email);
                const isNewUnitInAction = actionUnits.includes(p.Unidade);

                if (isEmailInList && !isNewUnitInAction) {
                    currentMailList = currentMailList.filter(email => email !== p.Email);
                    modified = true;
                } else if (!isEmailInList && isNewUnitInAction) {
                    currentMailList.push(p.Email);
                    modified = true;
                }
            });

            if (modified) {
                notif.mailList = currentMailList;
                notificationSaves.push(window.salvarArquivoNoOneDrive(notif.ID, 'notificacoes.txt', 'update', notif, 'jsonNotificacoes'));
            }
        }
    }

    if (notificationSaves.length > 0) {
        await Promise.all(notificationSaves);
    }
}

// Expondo as funções necessárias globalmente para os botões "Novo Plano" nas páginas
window.openEditModalPlanos = openEditModal;
window.initModalPlanos = initModalPlanos;
