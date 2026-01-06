function initModalAcoes() {
    const modalHtml = `
        <section id="modal-container">
            <section id="task-modal-container"
                class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                    <div class="flex items-start justify-between p-4 border-b border-slate-200">
                        <div>
                            <span id="modal-view-plano" class="block text-sm font-semibold text-sky-600"></span>
                            <h2 id="modal-view-atividade" class="text-2xl font-bold text-slate-800"></h2>
                        </div>
                        <button id="modal-btn-close-task" type="button"
                            class="text-slate-500 hover:text-red-600 transition-colors rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 ">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div id="view-mode-content" class="p-6 space-y-4 overflow-y-auto">
                        <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-slate-500">Status:</p>
                                <div class="flex justify-center items-center">
                                    <div id="modal-view-status"
                                        class="flex justify-center items-center text-sm px-1.5 rounded h-6">
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <p class="font-medium text-slate-500">Início: <strong id="modal-view-data-inicio"
                                        class="font-semibold text-slate-700"></strong></p>
                                <p class="font-medium text-slate-500">Fim: <strong id="modal-view-data-fim"
                                        class="font-semibold text-slate-700"></strong></p>
                            </div>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-slate-200">
                            <div><span class="block text-sm font-medium text-slate-500 mb-1">Descrição da
                                    atividade</span><span id="modal-view-descricao"
                                    class="block text-base text-slate-800"></span></div>
                            <div><span class="block text-sm font-medium text-slate-500 mb-1">Observações</span><span
                                    id="modal-view-observacoes"
                                    class="block text-base text-slate-800 whitespace-pre-wrap"></span></div>
                        </div>

                        <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                            <h4 class="mb-2 items-center gap-2 text-base font-semibold text-slate-700">
                                <ion-icon name="people" class="text-lg"></ion-icon> Unidade responsável
                            </h4>
                            <div class="flex-1 flex flex-wrap items-center gap-1.5" id="unidades-view-container">
                            </div>
                        </div>
                        <div id="multi-select-container" class="md:col-span-2">
                        </div>

                        <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                            <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                <ion-icon name="notifications"></ion-icon>
                                Notificações
                            </h4>
                        </div>
                        <div id="notifications-list" class="space-y-4"></div>
                    </div>

                    <div id="edit-mode-content" class="hidden p-6 overflow-y-auto">
                        <form id="modal-edit-form" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div class="md:col-span-2">
                                <input type="text" id="edit-atividade" name="Atividade"
                                    class="w-full bg-transparent border-none p-0 text-2xl font-bold text-slate-800 focus:ring-0 placeholder-slate-400 -mx-2 px-2 hover:bg-slate-50 rounded-lg"
                                    placeholder="Nome da Atividade">
                            </div>
                            <div class="md:col-span-2">
                                <label for="edit-descricao"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Descrição da atividade</label>
                                <textarea id="edit-descricao" name="Descrição da atividade" rows="2"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <div class="md:col-span-2">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                                    <div class="col-span-1">
                                        <label for="edit-numero-atividade"
                                            class="block text-sm font-semibold text-slate-500 mb-1">Nº da Atividade</label>
                                        <input type="text" id="edit-numero-atividade" name="Número da atividade"
                                            class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                    </div>
                                    <div class="col-span-2">
                                        <label for="edit-status"
                                            class="block text-sm font-semibold text-slate-500 mb-1">Status</label>
                                        <select id="edit-status" name="Status"
                                            class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                            <option selected disabled hidden>Selecione um valor</option>
                                            <option>Em desenvolvimento</option>
                                            <option>Planejado</option>
                                            <option>Em curso</option>
                                            <option>Em revisão</option>
                                            <option>Pendente</option>
                                            <option>Implementado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="md:col-span-2">
                                <label for="edit-plano" class="block text-sm font-semibold text-slate-500 mb-1">Plano de
                                    Ação</label>
                                <select id="edit-plano" name="Plano de ação"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                </select>
                            </div>

                            <div>
                                <label for="edit-data-inicio" class="block text-sm font-semibold text-slate-500 mb-1">Data
                                    de início</label>
                                <input type="date" id="edit-data-inicio" name="Data de início"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div>
                                <label for="edit-data-fim" class="block text-sm font-semibold text-slate-500 mb-1">Data
                                    fim</label>
                                <input type="date" id="edit-data-fim" name="Data fim"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>

                            <div class="md:col-span-2">
                                <label for="edit-observacoes"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Observações</label>
                                <textarea id="edit-observacoes" name="Observações" rows="3"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="people" class="text-lg"></ion-icon> Unidade responsável
                                </h4>
                            </div>
                            <div id="unidades-container" class="md:col-span-2">
                                <select multiple data-placeholder="Selecionar unidades" id="unidades-multi-select">
                                </select>
                            </div>

                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="notifications"></ion-icon>
                                    Notificações
                                </h4>
                            </div>
                            <div id="notifications-edit-list"
                                class="w-full col-span-2 pt-2 flex flex-row flex-wrap gap-4 justify-between">
                                <template id="notification-template">
                                    <div
                                        class="container-notificacao flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md w-full max-w-[340px]">

                                        <div class="flex flex-col gap-1">
                                            <div class="flex items-center justify-between">
                                                <label class="block text-sm font-medium text-slate-500">Tipo de Alerta</label>

                                                <div class="action-slot">
                                                    <button type="button"
                                                        class="btn-delete-notification rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                                        title="Excluir esta notificação">
                                                        <svg class="h-5 w-5 pointer-events-none" fill="none"
                                                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div class="status-slot hidden">
                                                    <span
                                                        class="status-badge bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-md">Enviado</span>
                                                </div>
                                            </div>

                                            <div class="editable-view w-full">
                                                <div class="flex items-center gap-2">
                                                    <div class="notification-icon-container flex-shrink-0 rounded-full p-2 bg-slate-100 text-slate-500">
                                                        <!-- Ícone injetado via JS -->
                                                    </div>
                                                    <select
                                                        class="notification-type w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20">
                                                        <option value="inicio">Alerta de início</option>
                                                        <option value="aviso" selected>Alerta de aviso</option>
                                                        <option value="pendencia">Alerta de pendência</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="sent-view-text sent-type hidden w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 flex items-center gap-2">
                                                <div class="notification-icon-container-locked flex-shrink-0 rounded-full p-1">
                                                    <!-- Ícone injetado via JS -->
                                                </div>
                                                <span class="sent-type-text"></span>
                                            </div>
                                        </div>

                                        <div class="flex flex-col gap-1">
                                            <label class="block text-sm font-medium text-slate-500">Data</label>
                                            <div class="editable-view">
                                                <input type="date"
                                                    class="notification-date w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
                                            </div>
                                            <p
                                                class="sent-view-text sent-date hidden w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                            </p>
                                        </div>

                                        <div class="flex flex-col gap-1">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-1">
                                                    <h5 class="text-sm font-medium text-slate-500">Destinatários</h5>
                                                    <div class="info-tooltip relative ml-1 flex items-center">
                                                        <button type="button"
                                                            class="group flex items-center text-slate-500 hover:text-slate-700 focus:outline-none"
                                                            aria-describedby="tooltip-destinatarios">
                                                            <ion-icon name="information-circle" class="w-4 h-4"></ion-icon>

                                                            <span id="tooltip-destinatarios" role="tooltip"
                                                                class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 px-3 py-2 text-xs text-white bg-gray-700 rounded shadow-lg whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity before:content-[''] before:absolute before:-top-1  before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-gray-700 pointer-events-none">
                                                                Para adicionar novas pessoas, acrescente na lista dos
                                                                integrantes do plano de ação.
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <button type="button"
                                                    class="btn-toggle-all text-[9px] font-medium text-slate-400 hover:text-sky-600 uppercase tracking-tight editable-view transition-colors">Marcar
                                                    todos</button>
                                            </div>

                                            <div
                                                class="recipients-container max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white">
                                                <ul class="recipients-list-editable divide-y divide-slate-200"></ul>
                                                <div class="recipients-list-sent hidden flex flex-col p-2 space-y-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <div class="mt-4">
                                <button id="add-notification-btn-task" type="button"
                                    class="w-full flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-100 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clip-rule="evenodd" />
                                    </svg>
                                    Adicionar Notificação
                                </button>
                            </div>
                        </form>
                    </div>

                    <div
                        class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                        <button id="modal-btn-delete-task" type="button"
                            class=" text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 hover:text-red-800 disabled:cursor-not-allowed text-sm flex items-center space-x-2">
                            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.59 2.25 6.68 3.204 6.68 4.384v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <span>Excluir</span>
                        </button>
                        <div>
                            <div id="view-mode-buttons" class="flex items-center space-x-3">
                                <button id="modal-btn-view-close-task" type="button"
                                    class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Fechar</button>
                                <button id="modal-btn-edit-task" type="button"
                                    class="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700">Editar</button>
                            </div>
                            <div id="edit-mode-buttons" class="hidden">
                                <button id="modal-btn-cancel-task" type="button"
                                    class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed">Cancelar</button>
                                <button id="modal-btn-save-task" type="button"
                                    class="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 disabled:cursor-not-allowed">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="confirmation-modal-task"
                    class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <h3 class="text-lg font-bold text-slate-800">Descartar Alterações?</h3>
                            <p class="mt-2 text-sm text-slate-600">Você fez alterações que não foram salvas. Tem certeza de
                                que deseja sair?</p>
                        </div>
                        <div
                            class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                            <button id="confirm-btn-no-task" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">
                                Não
                            </button>
                            <button id="confirm-btn-yes-task" type="button"
                                class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                                Sim, Descartar
                            </button>
                        </div>
                    </div>
                </div>

                <div id="delete-confirmation-modal-task"
                    class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <div class="flex items-center">
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
                            <button id="delete-confirm-btn-no-task" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed">
                                Cancelar
                            </button>
                            <button id="delete-confirm-btn-yes-task" type="button"
                                class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 disabled:cursor-not-allowed">
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>

                <div id="date-change-confirmation-modal-task"
                    class="hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <h3 id="modal-title-task" class="text-lg font-bold text-slate-800"></h3>
                            <p id="modal-message-task" class="mt-2 text-sm text-slate-700"></p>
                        </div>
                        <div
                            class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                            <button id="modal-btn-cancel-notification-task" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">
                                Cancelar
                            </button>
                            <button id="modal-btn-confirm-notification-task" type="button"
                                class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    setupModalAcoesLogic();
}

let currentTask = null;
let courrentNotificacoesTask = [];
let deletedNotificationIds = [];
let hasChanges = false;
let isNewTaskMode = false;

function setupModalAcoesLogic() {
    document.body.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-open-task]');
        if (trigger) {
            const taskId = trigger.dataset.openTask;
            openTaskModal(taskId);
        }
    });

    const btnMap = {
        'modal-btn-close-task': () => closeModal(),
        'modal-btn-view-close-task': () => closeModal(),
        'modal-btn-edit-task': switchToEditMode,
        'modal-btn-cancel-task': () => switchToViewMode(),
        'modal-btn-save-task': handleSaveAction,
        'modal-btn-delete-task': openDeleteConfirmation,
        'confirm-btn-no-task': () => document.getElementById('confirmation-modal-task').classList.add('hidden'),
        'confirm-btn-yes-task': () => switchToViewMode(true),
        'delete-confirm-btn-no-task': () => document.getElementById('delete-confirmation-modal-task').classList.add('hidden'),
        'delete-confirm-btn-yes-task': handleDeleteTask,
        'add-notification-btn-task': () => { createNotificacao(); hasChanges = true; }
    };

    Object.entries(btnMap).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });

    const editForm = document.getElementById('modal-edit-form');
    if (editForm) {
        editForm.addEventListener('input', () => (hasChanges = true));
    }

    const containerNotificacao = document.getElementById('notifications-edit-list');
    if (containerNotificacao) {
        containerNotificacao.addEventListener('click', function (event) {
            const deleteButton = event.target.closest('.btn-delete-notification');
            if (deleteButton) {
                const notificationToDelete = deleteButton.closest('.container-notificacao');
                deleteNotification(notificationToDelete);
                hasChanges = true;
            }
        });

        containerNotificacao.addEventListener('change', function (event) {
            const target = event.target;
            if (target.matches('.notification-type, .notification-date, .recipients-list input[type="checkbox"]')) {
                hasChanges = true;
            }
        });
    }

    const dataInicioInput = document.getElementById('edit-data-inicio');
    if (dataInicioInput) {
        dataInicioInput.addEventListener('focusout', async function (event) {
            const id = document.getElementById('task-modal-container').dataset.taskId;
            const novaData = event.target.value;
            await gerenciarNotificacaoPorData(id, novaData, 'inicio');
            await verificarNotificacaoLongoPrazo();
        });
    }

    const dataFimInput = document.getElementById('edit-data-fim');
    if (dataFimInput) {
        dataFimInput.addEventListener('focusout', async function (event) {
            const id = document.getElementById('task-modal-container').dataset.taskId;
            const novaData = event.target.value;

            const calcularDataPendencia = (dataFim) => {
                const data = new Date(dataFim + 'T00:00:00');
                data.setDate(data.getDate() + 1);
                return data.toISOString().split('T')[0];
            };

            await gerenciarNotificacaoPorData(id, novaData, 'pendencia', calcularDataPendencia);
            await verificarNotificacaoLongoPrazo();
        });
    }
}

function openTaskModal(id) {
    const notifications = window.jsonNotificacoes.filter(n => n.idAcao === id).map(n => n.ID);
    console.log('Abrindo Ação ID:', id, 'Notificações associadas:', notifications);

    isNewTaskMode = false;
    currentTask = window.jsonAcoes.find(t => t.ID === id);
    if (!currentTask) return;

    document.getElementById('task-modal-container').setAttribute('data-task-id', id);

    switchToViewMode(true);
    document.getElementById('task-modal-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function switchToViewMode(force = false) {
    const confirmationModal = document.getElementById('confirmation-modal-task');
    if (hasChanges && !force) {
        confirmationModal.classList.remove('hidden');
        return;
    }

    if (isNewTaskMode) {
        closeModal(true);
        return;
    }

    populateViewMode(currentTask);

    document.getElementById('modal-view-plano').classList.remove('hidden');
    document.getElementById('edit-mode-content').classList.add('hidden');
    document.getElementById('edit-mode-buttons').classList.add('hidden');
    document.getElementById('view-mode-content').classList.remove('hidden');
    document.getElementById('view-mode-buttons').classList.remove('hidden');
    confirmationModal.classList.add('hidden');
    hasChanges = false;
}

function populateViewMode(task) {
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '-';
    };
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
    };

    setElementText('modal-view-plano', task['Plano de ação']);
    setElementText('modal-view-atividade', (task['Número da atividade'] || '') + ' - ' + (task['Atividade'] || ''));
    setElementText('modal-view-data-inicio', formatDate(task['Data de início']));
    setElementText('modal-view-data-fim', formatDate(task['Data fim']));
    setElementText('modal-view-descricao', task['Descrição da atividade']);
    setElementText('modal-view-observacoes', task['Observações']);

    const statusEl = document.getElementById('modal-view-status');
    if (statusEl) {
        statusEl.innerText = task.Status;
        statusEl.className = 'status-' + (task.Status || '').replace(/\s+/g, '-') + ' flex justify-center items-center text-sm px-1.5 rounded h-6';
    }

    const unidadesContainer = document.getElementById('unidades-view-container');
    unidadesContainer.innerHTML = '';
    const unidades = task['Unidades'] || [];
    if (unidades.length > 0) {
        unidades.forEach(unidade => {
            unidadesContainer.innerHTML += `
                <span class="flex items-center gap-1.5 bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-1 rounded">
                    ${unidade}
                </span>`;
        });
    } else {
        unidadesContainer.innerHTML = `<span class="text-gray-500 italic">Nenhuma unidade cadastrada</span>`;
    }

    courrentNotificacoesTask = window.jsonNotificacoes.filter(n => n.idAcao === task.ID);
    populateViewNotificacoes(courrentNotificacoesTask);
}

function populateViewNotificacoes(notificacoes) {
    const container = document.getElementById("notifications-list");
    container.innerHTML = "";

    notificacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

    if (notificacoes.length === 0) {
        container.innerHTML = `<span class="text-gray-500 italic">Nenhuma notificação cadastrada</span>`;
        return;
    }

    notificacoes.forEach(notif => {
        const acao = window.jsonAcoes.find(a => a.ID === notif.idAcao);
        if (!acao) return;

        const plano = window.jsonPlanos.find(p => p.Nome === acao["Plano de ação"]);
        if (!plano) return;

        const destinatarios = (plano.objPessoas || []).filter(pessoa =>
            (notif.mailList || []).includes(pessoa.Email)
        );

        let colorClasses = "";
        let iconSVG = "";

        switch (notif.tipo) {
            case "inicio":
                colorClasses = "bg-green-100 text-green-700";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" /></svg>`;
                break;
            case "aviso":
                colorClasses = "bg-sky-100 text-sky-700";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>`;
                break;
            case "pendencia":
                colorClasses = "bg-amber-100 text-amber-600";
                iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.001-1.742 3.001H4.42c-1.532 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
                break;
            default:
                colorClasses = "bg-slate-100 text-slate-700";
        }

        const notifDiv = document.createElement("div");
        notifDiv.className = "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md";

        const initials = (nome) => {
            const p = nome.trim().split(" ");
            return (p[0][0] + p[p.length - 1][0]).toUpperCase();
        };

        const dataExtenso = (isoDate) => {
            if (!isoDate) return '-';
            const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
            const [ano, mes, dia] = isoDate.split("-");
            return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
        };

        notifDiv.innerHTML = `
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="flex min-w-0 items-center gap-4">
                    <div class="flex-shrink-0 rounded-full ${colorClasses} p-2">${iconSVG}</div>
                    <div class="min-w-0">
                        <p class="truncate font-semibold text-slate-800">${dataExtenso(notif.data)}</p>
                        <div class="flex flex-col gap-1">
                            <p class="text-sm text-slate-500">Alerta de ${notif.tipo}</p>
                            <div class="flex">
                                ${notif.status === 'enviado' ? '<span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Enviado</span>' : (notif.status === 'cancelado' ? '<span class="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/20">Cancelado</span>' : '')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-auto md:max-w-xs">
                    <p class="mb-2 text-xs font-medium uppercase text-slate-500 md:text-right">Destinatários</p>
                    <div class="flex items-center md:justify-end">
                        ${destinatarios.map((p, idx) => `<span title="${p.Nome}" class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-700 ring-2 ring-white ${idx > 0 ? "-ml-3" : ""}">${initials(p.Nome)}</span>`).join("")}
                    </div>
                </div>
            </div>`;
        container.appendChild(notifDiv);
    });
}

function switchToEditMode() {
    clearEditList();
    populateEditMode();

    document.getElementById('modal-view-plano').classList.add('hidden');
    document.getElementById('modal-view-atividade').innerText = isNewTaskMode ? 'Criar Nova Ação' : 'Editar Ação';

    document.getElementById('view-mode-content').classList.add('hidden');
    document.getElementById('view-mode-buttons').classList.add('hidden');

    document.getElementById('edit-mode-content').classList.remove('hidden');
    document.getElementById('edit-mode-buttons').classList.remove('hidden');

    hasChanges = false;
}

function clearEditList() {
    const container = document.getElementById("notifications-edit-list");
    [...container.children].forEach(child => {
        if (child.tagName.toLowerCase() !== "template") container.removeChild(child);
    });
}

function populateEditMode() {
    const id = document.getElementById('task-modal-container').dataset.taskId;
    const task = isNewTaskMode ? {} : window.jsonAcoes.find(t => t.ID === id);
    const form = document.getElementById('modal-edit-form');

    if (!isNewTaskMode) {
        Object.keys(task).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = task[key];
        });
    }

    populatePlanosSelect(task['Plano de ação']);
    atualizarUnidades(task['Plano de ação'], task.Unidades || []);

    if (!isNewTaskMode) {
        const notificacoes = window.jsonNotificacoes.filter(n => n.idAcao === id)
            .sort((a, b) => new Date(a.data) - new Date(b.data));
        notificacoes.forEach(createNotificacao);
    }
}

function populatePlanosSelect(selectedPlano = '') {
    const select = document.getElementById('edit-plano');
    if (!select) return;

    const options = [...new Set(window.jsonPlanos.map(p => p.Nome).filter(Boolean))].sort();
    select.innerHTML = '<option value="" selected disabled hidden>Selecione um plano...</option>' +
        options.map(nome => `<option value="${nome}" ${nome === selectedPlano ? 'selected' : ''}>${nome}</option>`).join('');

    select.onchange = (e) => {
        atualizarUnidades(e.target.value);
        hasChanges = true;
    };
}

function atualizarUnidades(nomePlano, unidadesIniciais = []) {
    const container = document.getElementById('unidades-container');
    container.innerHTML = '';

    if (!nomePlano) {
        container.innerHTML = '<span class="text-gray-500 italic">Selecione um plano de ação para exibir as unidades</span>';
        return;
    }

    const plan = window.jsonPlanos.find(p => p.Nome === nomePlano);
    const uniqueUnidades = [...new Set((plan?.objPessoas || []).map(p => p.Unidade.trim()).filter(u => u && u !== '-'))].sort();

    if (uniqueUnidades.length === 0) {
        container.innerHTML = '<span class="text-gray-500 italic">Nenhuma unidade cadastrada para este plano.</span>';
        return;
    }

    const select = document.createElement('select');
    select.id = 'unidades-multi-select';
    select.name = 'Unidades';
    select.multiple = true;

    uniqueUnidades.forEach(u => {
        const opt = new Option(u, u);
        if (unidadesIniciais.includes(u)) opt.selected = true;
        select.appendChild(opt);
    });

    container.appendChild(select);
    window.createCustomSelect('unidades-multi-select');

    window.onCustomSelectChange('unidades-multi-select', () => {
        document.querySelectorAll('.recipients-list-editable').forEach(list => {
            if (list.closest('.container-notificacao').querySelector('.status-slot').classList.contains('hidden')) {
                populateTabelaNotificacoes(list, []);
            }
        });
        hasChanges = true;
    });
}

function createNotificacao(notificacao = {}) {
    const template = document.getElementById('notification-template');
    const container = document.getElementById('notifications-edit-list');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.container-notificacao');

    if (notificacao.ID) {
        card.dataset.notificationId = notificacao.ID;
        card.dataset.originalData = JSON.stringify({
            tipo: notificacao.tipo,
            data: notificacao.data,
            mailList: [...(notificacao.mailList || [])].sort()
        });
    }

    const status = notificacao.status || 'planejado';
    const isLocked = status === 'enviado' || status === 'cancelado';

    const editViews = clone.querySelectorAll('.editable-view');
    const sentViews = clone.querySelectorAll('.sent-view-text');
    const actionSlot = clone.querySelector('.action-slot');
    const statusSlot = clone.querySelector('.status-slot');
    const recEdit = clone.querySelector('.recipients-list-editable');
    const recSent = clone.querySelector('.recipients-list-sent');

    if (isLocked) {
        actionSlot.classList.add('hidden');
        statusSlot.classList.remove('hidden');
        editViews.forEach(v => v.classList.add('hidden'));
        sentViews.forEach(v => v.classList.remove('hidden'));
        recEdit.classList.add('hidden');
        recSent.classList.remove('hidden');

        const badge = clone.querySelector('.status-badge');
        badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        badge.className = `status-badge text-xs font-medium px-2.5 py-0.5 rounded-md ${status === 'enviado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`;

        const iconContainerLocked = clone.querySelector('.notification-icon-container-locked');

        clone.querySelector('.sent-type-text').textContent = `Alerta de ${notificacao.tipo}`;
        updateNotificationIcon(iconContainerLocked, notificacao.tipo);

        clone.querySelector('.sent-date').textContent = notificacao.data ? new Date(notificacao.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

        (notificacao.mailList || []).forEach(email => {
            const p = document.createElement('p');
            p.className = 'w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';
            p.textContent = email;
            recSent.appendChild(p);
        });
    } else {
        const typeSelect = clone.querySelector('.notification-type');
        const iconContainer = clone.querySelector('.notification-icon-container');

        typeSelect.value = notificacao.tipo || 'aviso';
        clone.querySelector('.notification-date').value = notificacao.data || '';
        populateTabelaNotificacoes(recEdit, notificacao.mailList || []);

        const updateIcon = () => updateNotificationIcon(iconContainer, typeSelect.value);
        typeSelect.addEventListener('change', updateIcon);
        updateIcon();

        const toggleBtn = clone.querySelector('.btn-toggle-all');
        toggleBtn.onclick = () => {
            const checks = recEdit.querySelectorAll('input[type="checkbox"]');
            const all = Array.from(checks).every(c => c.checked);
            checks.forEach(c => c.checked = !all);
            toggleBtn.textContent = !all ? 'Desmarcar todos' : 'Marcar todos';
            hasChanges = true;
        };
    }

    container.appendChild(clone);
}

function updateNotificationIcon(container, type) {
    let colorClasses = "";
    let iconSVG = "";

    switch (type) {
        case "inicio":
            colorClasses = "bg-green-100 text-green-700";
            iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" /></svg>`;
            break;
        case "aviso":
            colorClasses = "bg-sky-100 text-sky-700";
            iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>`;
            break;
        case "pendencia":
            colorClasses = "bg-amber-100 text-amber-600";
            iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.001-1.742 3.001H4.42c-1.532 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
            break;
        default:
            colorClasses = "bg-slate-100 text-slate-700";
            iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`;
    }

    container.innerHTML = iconSVG;
    container.className = `notification-icon-container flex-shrink-0 rounded-full p-1 ${colorClasses}`; // Reduced padding to p-1 for smaller look
}

function populateTabelaNotificacoes(listEl, mailList = []) {
    const unidades = window.getCustomSelectValues('unidades-multi-select') || [];
    const planoNome = document.getElementById('edit-plano').value;
    const plan = window.jsonPlanos.find(p => p.Nome === planoNome);
    const pessoas = (plan?.objPessoas || []).filter(p => unidades.includes(p.Unidade));

    if (!planoNome) {
        listEl.innerHTML = '<li class="p-2 text-slate-600 italic text-sm">Selecione um plano primeiro.</li>';
        return;
    }

    if (pessoas.length === 0) {
        listEl.innerHTML = '<li class="p-2 text-slate-600 italic text-sm">Selecione unidades para ver destinatários.</li>';
        return;
    }

    listEl.innerHTML = pessoas.map(p => `
        <li class="p-2 hover:bg-slate-50">
            <label class="flex items-center justify-between gap-4 cursor-pointer">
                <div class="text-sm flex-1 min-w-0">
                    <p class="font-semibold text-slate-800 truncate">${p.Nome}</p>
                    <p class="text-slate-600 truncate">${p.Email}</p>
                </div>
                <input type="checkbox" ${mailList.length === 0 || mailList.includes(p.Email) ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500">
            </label>
        </li>`).join('');
}

function deleteNotification(el) {
    const id = el.dataset.notificationId;
    if (id) deletedNotificationIds.push(id);
    el.remove();
}

function closeModal(force = false) {
    if (!document.getElementById('edit-mode-content').classList.contains('hidden') && hasChanges && !force) {
        document.getElementById('task-confirmation-modal-task').classList.remove('hidden');
        return;
    }
    document.getElementById('task-modal-container').classList.add('hidden');
    document.getElementById('confirmation-modal-task').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    hasChanges = false;
    isNewTaskMode = false;
}

function openModalForNewAction() {
    isNewTaskMode = true;
    currentTask = {};
    document.getElementById('modal-edit-form').reset();
    document.getElementById('notifications-edit-list').innerHTML = '';
    switchToEditMode();
    document.getElementById('task-modal-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function openDeleteConfirmation() {
    const id = document.getElementById('task-modal-container').dataset.taskId;
    const task = window.jsonAcoes.find(t => t.ID === id);
    document.getElementById('plano-to-delete-name').textContent = `"${task.Atividade}"`;
    document.getElementById('delete-confirmation-modal-task').classList.remove('hidden');
}

async function handleDeleteTask() {
    const id = document.getElementById('task-modal-container').dataset.taskId;
    try {
        const res = await window.salvarArquivoNoOneDrive(id, 'acoes.txt', 'delete', '', 'jsonAcoes');
        if (res.status === 200) window.location.reload();
    } catch (e) {
        alert("Erro ao excluir.");
    }
}

async function handleSaveAction() {
    const id = document.getElementById('task-modal-container').dataset.taskId;
    const form = document.getElementById('modal-edit-form');
    const formData = new FormData(form);
    const data = { ...Object.fromEntries(formData.entries()), Unidades: window.getCustomSelectValues('unidades-multi-select') || [] };

    try {
        const mode = isNewTaskMode ? 'create' : 'update';
        const res = await window.salvarArquivoNoOneDrive(id || '', 'acoes.txt', mode, data, 'jsonAcoes');
        if (res.status === 200) {
            const notifications = getNotificationsFromDOM();
            for (const n of notifications) {
                const nMode = n.ID ? 'update' : 'create';
                await window.salvarArquivoNoOneDrive(n.ID || '', 'notificacoes.txt', nMode, n, 'jsonNotificacoes');
            }
            for (const nid of deletedNotificationIds) {
                await window.salvarArquivoNoOneDrive(nid, 'notificacoes.txt', 'delete', '', 'jsonNotificacoes');
            }
            window.location.reload();
        }
    } catch (e) {
        alert("Erro ao salvar.");
    }
}

function getNotificationsFromDOM() {
    return Array.from(document.querySelectorAll('#notifications-edit-list .container-notificacao'))
        .filter(el => el.querySelector('.status-slot').classList.contains('hidden'))
        .map(el => ({
            ID: el.dataset.notificationId,
            idAcao: document.getElementById('task-modal-container').dataset.taskId,
            tipo: el.querySelector('.notification-type').value,
            data: el.querySelector('.notification-date').value,
            mailList: Array.from(el.querySelectorAll('.recipients-list-editable input:checked')).map(i => i.closest('label').querySelector('.text-slate-600').textContent.trim()),
            status: 'planejado'
        }));
}

async function gerenciarNotificacaoPorData(idAcao, novaData, tipo, calcFn) {
    if (!novaData) return;
    const targetDate = calcFn ? calcFn(novaData) : novaData;
    const confirmed = await window.confirm(`Deseja criar/atualizar notificação de ${tipo} para ${targetDate}?`);
    if (confirmed) {
        const existing = Array.from(document.querySelectorAll('#notifications-edit-list .container-notificacao'))
            .find(el => el.querySelector('.notification-type').value === tipo);
        if (existing) {
            existing.querySelector('.notification-date').value = targetDate;
        } else {
            createNotificacao({ tipo: tipo, data: targetDate, idAcao: idAcao });
        }
        hasChanges = true;
    }
}

async function verificarNotificacaoLongoPrazo() {
}

window.openTaskModal = openTaskModal;
window.initModalAcoes = initModalAcoes;
window.openModalForNewAction = openModalForNewAction;
