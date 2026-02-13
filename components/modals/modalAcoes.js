function initTaskModal() {
    const modalHtml = `
        <style>
            @keyframes slideUpEvident {
                0% { transform: translateY(30px); }
                100% { transform: translateY(0); }
            }
            @keyframes slideDownEvident {
                0% { transform: translateY(-30px); }
                100% { transform: translateY(0); }
            }
            .animate-slide-up-evident { animation: slideUpEvident 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; z-index: 10; }
            .animate-slide-down-evident { animation: slideDownEvident 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; z-index: 10; }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin { animation: spin 1s linear infinite; }
            
            .glow-temp { position: relative; }
            .glow-temp::after {
                content: ''; position: absolute; inset: -2px; border-radius: 12px;
                z-index: -1; opacity: 0; animation: 0.8s ease-out;
            }

            .loading-overlay {
                position: absolute; inset: 0; background: rgba(255,255,255,0.5);
                backdrop-filter: blur(1px); z-index: 100; display: flex;
                align-items: center; justify-content: center; border-radius: inherit;
            }
        </style>
        <section id="task-modal-root">
            <section id="task-container"
                class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                    <div class="flex items-start justify-between p-4 border-b border-slate-200">
                        <div id="task-header-view">
                            <span id="task-view-plano" class="block text-sm font-semibold text-sky-600"></span>
                            <h2 id="task-view-atividade" class="text-2xl font-bold text-slate-800"></h2>
                        </div>
                        <div id="task-header-edit" class="hidden">
                            <h2 class="text-2xl font-bold text-slate-800">Editar Ação</h2>
                        </div>
                        <button id="task-btn-close" type="button"
                            class="text-slate-500 hover:text-red-600 transition-colors rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 ">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div id="task-view-mode-content" class="p-6 space-y-4 overflow-y-auto">
                        <div class="flex flex-col items-end w-full">
                            <div class="w-full flex flex-wrap items-center justify-between gap-4 text-sm">
                                <div class="flex items-center gap-2">
                                    <p class="font-medium text-slate-500">Status:</p>
                                    <div class="flex justify-center items-center">
                                        <div id="task-view-status"
                                            class="flex justify-center items-center text-sm px-1.5 rounded h-6">
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <p class="font-medium text-slate-500">Início: <strong id="task-view-data-inicio"
                                            class="font-semibold text-slate-700"></strong></p>
                                    <p class="font-medium text-slate-500">Fim: <strong id="task-view-data-fim"
                                            class="font-semibold text-slate-700"></strong></p>
                                </div>
                            </div>
                            <div id="task-view-history-trigger-container" class="hidden">
                                <button id="task-btn-open-history-view" type="button" class="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-xs font-semibold py-1 px-2 rounded-md hover:bg-sky-50 transition-colors">
                                    <ion-icon name="time-outline" class="text-base"></ion-icon>
                                    Histórico de Datas
                                </button>
                            </div>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-slate-200">
                            <div><span class="block text-sm font-medium text-slate-500 mb-1">Descrição da
                                    ação</span><span id="task-view-descricao"
                                    class="block text-base text-slate-800"></span></div>
                            <div><span class="block text-sm font-medium text-slate-500 mb-1">Observações</span><span
                                    id="task-view-observacoes"
                                    class="block text-base text-slate-800 whitespace-pre-wrap"></span></div>
                        </div>

                        <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                            <h4 class="mb-2 items-center gap-2 text-base font-semibold text-slate-700">
                                <ion-icon name="people" class="text-lg"></ion-icon> Unidade responsável
                            </h4>
                            <div class="flex-1 flex flex-wrap items-center gap-1.5" id="task-unidades-view-container">
                            </div>
                        </div>
                        <div id="task-multi-select-container" class="md:col-span-2">
                        </div>

                        <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                            <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                <ion-icon name="notifications"></ion-icon>
                                Notificações
                            </h4>
                        </div>
                        <div id="task-notifications-list" class="space-y-4"></div>
                        

                    </div>

                    <div id="task-edit-mode-content" class="hidden p-6 overflow-y-auto">
                        <form id="task-edit-form" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div class="md:col-span-2">
                                <input type="text" id="task-edit-atividade" name="Atividade"
                                    class="w-full bg-transparent border-none p-0 text-2xl font-bold text-slate-800 focus:ring-0 placeholder-slate-400 -mx-2 px-2 hover:bg-slate-50 rounded-lg"
                                    placeholder="Nome da Ação">
                            </div>
                            <div class="md:col-span-2">
                                <label for="task-edit-descricao"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Descrição da ação</label>
                                <textarea id="task-edit-descricao" name="Descrição da atividade" rows="2"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <div class="md:col-span-2">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                                    <div class="col-span-1">
                                        <label for="task-edit-numero-atividade"
                                            class="block text-sm font-semibold text-slate-500 mb-1">Nº da Ação</label>
                                        <input type="text" id="task-edit-numero-atividade" name="Número da atividade"
                                            class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                    </div>
                                    <div class="col-span-2">
                                        <label for="task-edit-status"
                                            class="block text-sm font-semibold text-slate-500 mb-1">Status</label>
                                        <select id="task-edit-status" name="Status"
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
                                <label for="task-edit-plano" class="block text-sm font-semibold text-slate-500 mb-1">Plano de
                                    Ação</label>
                                <select id="task-edit-plano" name="Plano de ação"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                                </select>
                            </div>

                            <div>
                                <label for="task-edit-data-inicio" class="block text-sm font-semibold text-slate-500 mb-1">Data
                                    de início</label>
                                <input type="date" id="task-edit-data-inicio" name="Data de início"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>
                            <div>
                                <label for="task-edit-data-fim" class="block text-sm font-semibold text-slate-500 mb-1">Data
                                    fim</label>
                                <input type="date" id="task-edit-data-fim" name="Data fim"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500">
                            </div>

                            <div class="md:col-span-2 text-right">
                                <button type="button" id="task-btn-manage-history" class="text-sm text-sky-600 hover:text-sky-800 hover:underline flex items-center justify-end gap-1 ml-auto">
                                    <ion-icon name="time-outline"></ion-icon> Gerenciar Histórico de Datas
                                </button>
                            </div>

                            <div class="md:col-span-2">
                                <label for="task-edit-observacoes"
                                    class="block text-sm font-semibold text-slate-500 mb-1">Observações</label>
                                <textarea id="task-edit-observacoes" name="Observações" rows="3"
                                    class="block w-full rounded-md border border-slate-150 bg-white p-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"></textarea>
                            </div>

                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="people" class="text-lg"></ion-icon> Unidade responsável
                                </h4>
                            </div>
                            <div id="task-unidades-container" class="md:col-span-2">
                                <select multiple data-placeholder="Selecionar unidades" id="task-unidades-multi-select">
                                </select>
                            </div>

                            <div class="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                <h4 class="flex items-center gap-2 text-base font-semibold text-slate-700">
                                    <ion-icon name="notifications"></ion-icon>
                                    Notificações
                                </h4>
                            </div>
                            <template id="task-notification-template">
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
                                                        aria-describedby="task-tooltip-destinatarios">
                                                        <ion-icon name="information-circle" class="w-4 h-4"></ion-icon>

                                                        <span id="task-tooltip-destinatarios" role="tooltip"
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
                            <div id="task-notifications-edit-list"
                                class="w-full col-span-2 pt-2 flex flex-row flex-wrap gap-4 justify-between">
                            </div>

                            <div class="mt-4">
                                <button id="task-add-notification-btn" type="button"
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
                        class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl space-x-3">
                        <button id="task-btn-delete-task" type="button"
                            class=" text-red-700 font-bold py-2 px-4 rounded-xl hover:bg-red-200 hover:text-red-800 disabled:cursor-not-allowed text-sm flex items-center space-x-2">
                            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.59 2.25 6.68 3.204 6.68 4.384v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <span>Excluir</span>
                        </button>
                        <div>
                            <div id="task-view-mode-buttons" class="flex items-center space-x-3">
                                <button id="task-btn-view-close" type="button"
                                    class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Fechar</button>
                                <button id="task-btn-edit-task" type="button"
                                    class="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700">Editar</button>
                            </div>
                            <div id="task-edit-mode-buttons" class="hidden flex flex-col items-end gap-2">
                                <div class="flex items-center space-x-3">
                                    <button id="task-btn-cancel-task" type="button"
                                        class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed text-sm">Cancelar</button>
                                    <button id="task-btn-save-task" type="button"
                                        class="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 disabled:cursor-not-allowed text-sm">Salvar</button>
                                </div>
                                <span id="task-main-msg" class="text-[11px] text-red-500 font-medium hidden italic flex items-center gap-1">
                                    <ion-icon name="alert-circle"></ion-icon>
                                    <span class="msg-text"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div id="task-confirmation-modal"
                    class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <h3 class="text-lg font-bold text-slate-800">Descartar Alterações?</h3>
                            <p class="mt-2 text-sm text-slate-600">Você fez alterações que não foram salvas. Tem certeza de
                                que deseja sair?</p>
                        </div>
                        <div
                            class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl space-x-3">
                            <button id="task-confirm-btn-no" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-xl border border-slate-300 hover:bg-slate-100">
                                Não
                            </button>
                            <button id="task-confirm-btn-yes" type="button"
                                class="bg-red-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-red-700">
                                Sim, Descartar
                            </button>
                        </div>
                    </div>
                </div>

                <div id="task-delete-confirmation-modal"
                    class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
                                    Tem certeza de que deseja excluir a ação <strong id="task-to-delete-name"
                                        class="font-bold text-slate-800"></strong>?
                                </p>
                                <p class="mt-2 text-sm font-semibold text-red-700 bg-red-50 p-3 rounded-xl">
                                    Esta ação é permanente e não poderá ser revertida pelo usuário.
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl space-x-3">
                            <button id="task-delete-confirm-btn-no" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed">
                                Cancelar
                            </button>
                            <button id="task-delete-confirm-btn-yes" type="button"
                                class="bg-red-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-red-700 disabled:cursor-not-allowed">
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>

                <div id="task-date-change-confirmation-modal"
                    class="hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <h3 id="task-modal-title" class="text-lg font-bold text-slate-800"></h3>
                            <p id="task-modal-message" class="mt-2 text-sm text-slate-700"></p>
                        </div>
                        <div
                            class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl space-x-3">
                            <button id="task-modal-btn-cancel-notification" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-6 rounded-xl border border-slate-300 hover:bg-slate-100">
                                Cancelar
                            </button>
                            <button id="task-modal-btn-confirm-notification" type="button"
                                class="bg-sky-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-sky-700">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>

                <div id="task-history-modal"
                    class="hidden fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div class="flex items-center justify-between p-5 border-b border-slate-200">
                             <div class="flex items-center gap-4">
                                <h3 class="text-xl font-bold text-slate-800">Linha do Tempo</h3>
                             </div>
                        </div>

                        <div class="p-6 overflow-y-auto space-y-6">
                            <div id="task-history-timeline-container" class="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                <!-- Modern Timeline Items -->
                                <div id="task-history-current-item" class="relative">
                                    <div class="absolute left-[-25px] top-1.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white ring-4 ring-sky-100"></div>
                                    <div class="bg-sky-50 border border-sky-100 rounded-xl p-4 shadow-sm">
                                         <div class="flex items-center justify-between mb-2">
                                            <span class="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">Estado Atual</span>
                                         </div>
                                         <div class="flex flex-wrap items-center gap-4 text-slate-800">
                                            <div class="flex flex-col">
                                                <span class="text-[10px] text-sky-600 font-bold uppercase font-sans">Início</span>
                                                <span id="task-history-current-start-card" class="text-base font-bold">-</span>
                                            </div>
                                            <ion-icon name="arrow-forward-outline" class="text-sky-300 text-xl"></ion-icon>
                                            <div class="flex flex-col">
                                                <span class="text-[10px] text-sky-600 font-bold uppercase font-sans">Conclusão</span>
                                                <span id="task-history-current-end-card" class="text-base font-bold">-</span>
                                            </div>
                                         </div>
                                    </div>
                                </div>

                                <div id="task-history-list-content" class="space-y-8">
                                    <!-- History Logic will populate this -->
                                </div>
                            </div>
                            
                            <div id="task-history-edit-content" class="hidden"></div>

                        </div>
                        <div id="task-history-footer" class="p-4 border-t border-slate-200 bg-slate-50 text-right rounded-b-2xl">
                            <button id="task-history-btn-done" type="button" class="bg-white border border-slate-300 text-slate-700 font-bold py-2 px-6 rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-sm">
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>

                <div id="task-history-prompt-modal"
                    class="hidden fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div class="p-6">
                            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ion-icon name="alert-circle-outline" class="text-sky-600"></ion-icon> Registrar Mudança?
                            </h3>
                            <p class="mt-2 text-sm text-slate-600 leading-relaxed">Deseja salvar as datas anteriores no histórico? Se sim, informe o motivo:</p>
                            
                            <div class="mt-4">
                                <input type="text" id="task-history-prompt-input" 
                                    class="block w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-sky-500 focus:border-sky-500 px-4 py-3" 
                                    placeholder="Ex: Novo cronograma acordado...">
                            </div>
                        </div>
                        <div class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl gap-3">
                            <button id="task-history-prompt-btn-no" type="button"
                                class="bg-white text-slate-700 font-bold py-2 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm transition-colors">
                                Não Registrar
                            </button>
                            <button id="task-history-prompt-btn-yes" type="button"
                                class="bg-sky-600 text-white font-bold py-2 px-5 rounded-xl hover:bg-sky-700 text-sm shadow-md transition-all">
                                Confirmar e Salvar
                            </button>
                        </div>
                </div>
            </div>
        </section>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    setupTaskModalLogic();
}


let task_current = null;
let task_hasChanges = false;
let task_isNewMode = false;
let task_deletedNotificationIds = [];
let task_initialDates = { inicio: '', fim: '' };
let task_inlineEditingIndice = null; // null means no item is being edited inline
let task_historySortDesc = false; // Changed to false by default for manual order
let task_pendingSaveData = null;


function setupTaskModalLogic() {
    document.body.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-open-task]');
        if (trigger) {
            const taskId = trigger.dataset.openTask;
            openTaskModal(taskId);
        }
    });

    const btnMap = {
        'task-btn-close': () => task_closeModal(),
        'task-btn-view-close': () => task_closeModal(),
        'task-btn-edit-task': task_switchToEditMode,
        'task-btn-cancel-task': () => task_switchToViewMode(),
        'task-btn-save-task': task_handleSave,
        'task-btn-delete-task': () => openDeleteConfirmationModalTask(task_current),
        'task-confirm-btn-no': () => document.getElementById('task-confirmation-modal').classList.add('hidden'),
        'task-confirm-btn-yes': () => task_switchToViewMode(true),
        'task-delete-confirm-btn-no': () => document.getElementById('task-delete-confirmation-modal').classList.add('hidden'),
        'task-delete-confirm-btn-yes': task_handleDeleteTask,
        'task-add-notification-btn': () => { task_addNotificationItem(); task_hasChanges = true; },
        'task-btn-open-history-view': () => openTaskHistoryModal(false),
        'task-btn-manage-history': () => openTaskHistoryModal(true),
        'task-history-btn-close': closeTaskHistoryModal,
        'task-history-btn-close-top': closeTaskHistoryModal,
        'task-history-btn-done': closeTaskHistoryModal,
        'task-history-btn-toggle-order': task_toggleHistoryOrder
    };


    Object.entries(btnMap).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });

    // History Prompt Buttons
    const btnPromptYes = document.getElementById('task-history-prompt-btn-yes');
    const btnPromptNo = document.getElementById('task-history-prompt-btn-no');
    if (btnPromptYes) btnPromptYes.addEventListener('click', () => task_handleHistoryPrompt(true));
    if (btnPromptNo) btnPromptNo.addEventListener('click', () => task_handleHistoryPrompt(false));

    // Close History Modal from Top X
    const btnCloseTaskHistoryTop = document.getElementById('task-history-btn-close-top');
    if (btnCloseTaskHistoryTop) btnCloseTaskHistoryTop.addEventListener('click', closeTaskHistoryModal);

    const editForm = document.getElementById('task-edit-form');
    if (editForm) {
        editForm.addEventListener('input', () => (task_hasChanges = true));
    }

    const containerNotificacao = document.getElementById('task-notifications-edit-list');
    if (containerNotificacao) {
        containerNotificacao.addEventListener('click', function (event) {
            const deleteButton = event.target.closest('.btn-delete-notification');
            if (deleteButton) {
                const notificationToDelete = deleteButton.closest('.container-notificacao');
                task_deleteNotification(notificationToDelete);
                task_hasChanges = true;
            }
        });

        containerNotificacao.addEventListener('change', function (event) {
            const target = event.target;
            if (target.matches('.notification-type, .notification-date, .recipients-list input[type="checkbox"]')) {
                task_hasChanges = true;
            }
        });
    }

    const dataInicioInput = document.getElementById('task-edit-data-inicio');
    if (dataInicioInput) {
        dataInicioInput.addEventListener('focusout', async function (event) {
            const id = task_current.ID;
            const novaData = event.target.value;
            await task_gerenciarNotificacaoPorData(id, novaData, 'inicio');
            await task_verificarNotificacaoLongoPrazo(id, novaData, document.getElementById('task-edit-data-fim').value);
        });
        dataInicioInput.addEventListener('change', (e) => task_detectDateChange('inicio', e.target.value));
    }

    const dataFimInput = document.getElementById('task-edit-data-fim');
    if (dataFimInput) {
        dataFimInput.addEventListener('focusout', async function (event) {
            const id = task_current.ID;
            const novaData = event.target.value;

            const calcularDataPendencia = (dataFim) => {
                const data = new Date(dataFim + 'T00:00:00');
                data.setDate(data.getDate() + 1);
                return data.toISOString().split('T')[0];
            };

            await task_gerenciarNotificacaoPorData(id, novaData, 'pendencia', calcularDataPendencia);
            await task_verificarNotificacaoLongoPrazo(id, document.getElementById('task-edit-data-inicio').value, novaData);
        });
        dataFimInput.addEventListener('input', task_syncHistoryCurrentState);
    }

    if (dataInicioInput) {
        dataInicioInput.addEventListener('input', task_syncHistoryCurrentState);
    }
}

function task_syncHistoryCurrentState() {
    const historyData = task_current["Datas anteriores"] || [];

    const startCard = document.getElementById('task-history-current-start-card');
    const endCard = document.getElementById('task-history-current-end-card');

    if (historyData.length === 0) {
        // Se não há histórico, usar datas atuais do formulário
        const startVal = document.getElementById('task-edit-data-inicio')?.value || task_current["Data de início"];
        const endVal = document.getElementById('task-edit-data-fim')?.value || task_current["Data fim"];

        if (startCard) startCard.textContent = startVal ? formatDate(startVal) : 'Não definida';
        if (endCard) endCard.textContent = endVal ? formatDate(endVal) : 'Não definida';
    } else {
        // Buscar registro com maior índice (mais recente)
        const ultimoRegistro = historyData.reduce((max, reg) =>
            reg.indice > max.indice ? reg : max
            , historyData[0]);

        if (startCard) startCard.textContent = ultimoRegistro.inicio ? formatDate(ultimoRegistro.inicio) : 'Não definida';
        if (endCard) endCard.textContent = ultimoRegistro.fim ? formatDate(ultimoRegistro.fim) : 'Não definida';
    }
}

function task_toggleHistoryOrder() {
    task_historySortDesc = !task_historySortDesc;
    const orderText = document.getElementById('task-history-order-text');
    if (orderText) {
        orderText.textContent = task_historySortDesc ? 'Recentes primeiro' : 'Antigos primeiro';
    }
    const isEditMode = !document.getElementById('task-history-edit-content').classList.contains('hidden');
    task_renderHistoryModalContent(isEditMode);
}

function openTaskModal(taskId) {
    const task = window.jsonAcoes.find(t => t.ID === taskId);
    if (!task) return;

    task_current = task;
    task_isNewMode = false;
    task_hasChanges = false;
    task_deletedNotificationIds = [];
    task_initialDates = {
        inicio: task["Data de início"] || '',
        fim: task["Data fim"] || ''
    };

    task_switchToViewMode();
    document.getElementById('task-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function openCreateTaskModal(defaultPlanoName = '') {
    task_current = {
        ID: '',
        Atividade: '',
        "Descrição da atividade": '',
        "Número da atividade": '',
        Status: 'Planejado',
        "Plano de ação": defaultPlanoName,
        "Data de início": '',
        "Data fim": '',
        Observações: '',
        Unidades: []
    };
    task_isNewMode = true;
    task_hasChanges = false;
    task_deletedNotificationIds = [];
    task_initialDates = { inicio: '', fim: '' };

    task_switchToEditMode();
    document.getElementById('task-container').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function task_switchToViewMode(force = false) {
    const confirmationModal = document.getElementById('task-confirmation-modal');
    if (task_hasChanges && !force) {
        confirmationModal.classList.remove('hidden');
        return;
    }

    if (task_isNewMode) {
        task_closeModal(true);
        return;
    }

    const task = task_current;

    document.getElementById('task-view-mode-content').classList.remove('hidden');
    document.getElementById('task-edit-mode-content').classList.add('hidden');
    document.getElementById('task-view-mode-buttons').classList.remove('hidden');
    document.getElementById('task-edit-mode-buttons').classList.add('hidden');

    document.getElementById('task-header-view').classList.remove('hidden');
    document.getElementById('task-header-edit').classList.add('hidden');

    document.getElementById('task-view-plano').textContent = task["Plano de ação"] || 'Sem Plano';
    document.getElementById('task-view-atividade').textContent = (task['Número da atividade'] ? task['Número da atividade'] + ' - ' : '') + (task.Atividade || 'Sem Título');
    document.getElementById('task-view-data-inicio').textContent = task["Data de início"] ? formatDate(task["Data de início"]) : '-';
    document.getElementById('task-view-data-fim').textContent = task["Data fim"] ? formatDate(task["Data fim"]) : '-';
    document.getElementById('task-view-descricao').textContent = task["Descrição da atividade"] || '-';
    document.getElementById('task-view-observacoes').textContent = task.Observações || '-';

    const statusBadge = document.getElementById('task-view-status');
    statusBadge.textContent = task.Status || 'N/A';
    statusBadge.className = `flex justify-center items-center text-sm px-1.5 rounded h-6 ${getStatusClasses(task.Status)}`;

    const unitsContainer = document.getElementById('task-unidades-view-container');
    unitsContainer.innerHTML = '';
    if (task.Unidades && Array.isArray(task.Unidades) && task.Unidades.length > 0) {
        task.Unidades.forEach(unit => {
            const span = document.createElement('span');
            span.className = "flex items-center gap-1.5 bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-1 rounded";
            span.textContent = unit;
            unitsContainer.appendChild(span);
        });
    } else {
        unitsContainer.innerHTML = `<span class="text-gray-500 italic">Nenhuma unidade cadastrada</span>`;
    }

    task_renderNotificationsViewList(task.ID);

    // Render History
    // Show history trigger only if it exists
    const historyTrigger = document.getElementById('task-view-history-trigger-container');
    if (task["Datas anteriores"] && Array.isArray(task["Datas anteriores"]) && task["Datas anteriores"].length > 0) {
        historyTrigger.classList.remove('hidden');
    } else {
        historyTrigger.classList.add('hidden');
    }
    confirmationModal.classList.add('hidden');
    task_hasChanges = false;
}

function getStatusClasses(status) {
    switch (status) {
        case 'Concluído': return 'bg-green-100 text-green-800';
        case 'Em Andamento': return 'bg-blue-100 text-blue-800';
        case 'Atrasado': return 'bg-red-100 text-red-800';
        case 'Planejado': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const formatDate = (dateString) => {
    return dateString ? new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
};

function task_renderNotificationsViewList(taskId) {
    const list = document.getElementById('task-notifications-list');
    list.innerHTML = '';

    const taskNotifications = window.jsonNotificacoes.filter(n => n.idAcao === taskId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (taskNotifications.length === 0) {
        list.innerHTML = '<p class="text-sm text-slate-500 italic">Nenhuma notificação configurada.</p>';
        return;
    }

    taskNotifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md";

        const testTask = window.jsonAcoes.find(a => a.ID === notif.idAcao);
        const plano = window.jsonPlanos.find(p => p.Nome === testTask["Plano de ação"]);
        const destinatarios = (plano?.objPessoas || []).filter(pessoa =>
            (notif.mailList || []).includes(pessoa.Email)
        );

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

        item.innerHTML = `
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
        list.appendChild(item);
    });
}

function task_switchToEditMode() {
    const task = task_current;

    document.getElementById('task-view-mode-content').classList.add('hidden');
    document.getElementById('task-edit-mode-content').classList.remove('hidden');
    document.getElementById('task-view-mode-buttons').classList.add('hidden');
    document.getElementById('task-edit-mode-buttons').classList.remove('hidden');

    document.getElementById('task-header-view').classList.add('hidden');
    document.getElementById('task-header-edit').classList.remove('hidden');

    const form = document.getElementById('task-edit-form');
    form.querySelector('#task-edit-atividade').value = task.Atividade || '';
    form.querySelector('#task-edit-descricao').value = task["Descrição da atividade"] || '';
    form.querySelector('#task-edit-numero-atividade').value = task["Número da atividade"] || '';
    form.querySelector('#task-edit-status').value = task.Status || 'Planejado';
    form.querySelector('#task-edit-data-inicio').value = task["Data de início"] || '';
    form.querySelector('#task-edit-data-fim').value = task["Data fim"] || '';
    form.querySelector('#task-edit-observacoes').value = task.Observações || '';

    const planSelect = form.querySelector('#task-edit-plano');
    planSelect.innerHTML = '<option value="">Selecione um plano...</option>';
    if (window.jsonPlanos && Array.isArray(window.jsonPlanos)) {
        window.jsonPlanos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.Nome;
            option.textContent = p.Nome;
            if (p.Nome === task["Plano de ação"]) option.selected = true;
            planSelect.appendChild(option);
        });
    }
    planSelect.onchange = (e) => {
        task_atualizarUnidades(e.target.value);
        task_hasChanges = true;
    };
    task_atualizarUnidades(task["Plano de ação"], task.Unidades || []);

    task_renderNotificationsEditList(task.ID);



    task_hasChanges = false;
}



function task_atualizarUnidades(nomePlano, unidadesIniciais = []) {
    const container = document.getElementById('task-unidades-container');
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
    select.id = 'task-unidades-multi-select';
    select.name = 'Unidades';
    select.multiple = true;

    uniqueUnidades.forEach(u => {
        const opt = new Option(u, u);
        if (unidadesIniciais.includes(u)) opt.selected = true;
        select.appendChild(opt);
    });

    container.appendChild(select);
    window.createCustomSelect('task-unidades-multi-select');

    window.onCustomSelectChange('task-unidades-multi-select', () => {
        document.querySelectorAll('#task-notifications-edit-list .recipients-list-editable').forEach(list => {
            if (list.closest('.container-notificacao').querySelector('.status-slot').classList.contains('hidden')) {
                task_populateTabelaNotificacoes(list, []);
            }
        });
        task_hasChanges = true;
    });
}

function task_renderNotificationsEditList(taskId) {
    const container = document.getElementById('task-notifications-edit-list');
    container.innerHTML = '';

    const notificacoes = window.jsonNotificacoes.filter(n => n.idAcao === taskId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

    notificacoes.forEach(task_addNotificationItem);
}

function task_addNotificationItem(notificacao = {}) {
    const template = document.getElementById('task-notification-template');
    const container = document.getElementById('task-notifications-edit-list');
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
        task_updateNotificationIcon(notificacao.tipo, iconContainerLocked);

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
        const dateInput = clone.querySelector('.notification-date');

        typeSelect.value = notificacao.tipo || 'aviso';
        dateInput.value = notificacao.data || '';
        task_populateTabelaNotificacoes(recEdit, notificacao.mailList || []);

        const updateIcon = () => task_updateNotificationIcon(typeSelect.value, iconContainer);
        typeSelect.addEventListener('change', (e) => {
            task_updateNotificationIcon(e.target.value, iconContainer);
            task_hasChanges = true;
        });
        dateInput.addEventListener('input', () => (task_hasChanges = true));
        updateIcon();

        const toggleBtn = clone.querySelector('.btn-toggle-all');
        toggleBtn.onclick = () => {
            const checks = recEdit.querySelectorAll('input[type="checkbox"]');
            const all = Array.from(checks).every(c => c.checked);
            checks.forEach(c => c.checked = !all);
            toggleBtn.textContent = !all ? 'Desmarcar todos' : 'Marcar todos';
            task_hasChanges = true;
        };
    }

    container.appendChild(clone);
}

function task_updateNotificationIcon(type, container) {
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
    container.className = `notification-icon-container flex-shrink-0 rounded-full p-1 ${colorClasses}`;
}

function task_populateTabelaNotificacoes(listEl, mailList = []) {
    const unidades = window.getCustomSelectValues('task-unidades-multi-select') || [];
    const planoNome = document.getElementById('task-edit-plano').value;
    const plan = window.jsonPlanos.find(p => p.Nome === planoNome);
    const pessoas = (plan?.objPessoas || []).filter(p => unidades.includes(p.Unidade.trim()));

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

function task_deleteNotification(el) {
    const id = el.dataset.notificationId;
    if (id) task_deletedNotificationIds.push(id);
    el.remove();
}

function task_closeModal(force = false) {
    if (task_hasChanges && !force) {
        document.getElementById('task-confirmation-modal').classList.remove('hidden');
        return;
    }

    document.getElementById('task-container').classList.add('hidden');
    document.getElementById('task-confirmation-modal').classList.add('hidden');
    document.getElementById('task-edit-form').reset();
    task_current = null;
    task_hasChanges = false;
    task_isNewMode = false;
    task_deletedNotificationIds = [];
    document.body.classList.remove('overflow-hidden');
}

window.openDeleteConfirmationModalTask = function (task) {
    task_current = task;
    const modal = document.getElementById('task-delete-confirmation-modal');
    document.getElementById('task-to-delete-name').textContent = `"${task.Atividade}"`;
    modal.classList.remove('hidden');
}

async function task_handleDeleteTask() {
    const id = task_current.ID;
    const deleteBtn = document.getElementById('task-delete-confirm-btn-yes');

    task_togglePageInteractivity(false);

    if (deleteBtn) {
        deleteBtn.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Excluindo...</span>
            </div>
        `;
    }

    try {
        const res = await window.salvarArquivoNoOneDrive(id, 'acoes.txt', 'delete', '', 'jsonAcoes');
        if (res.status === 200) window.location.reload();
    } catch (e) {
        alert("Erro ao excluir.");
        task_togglePageInteractivity(true);
        if (deleteBtn) deleteBtn.textContent = 'Sim, Excluir';
    }
}

async function task_handleSave() {
    const form = document.getElementById('task-edit-form');
    const formData = new FormData(form);
    const updatedTask = Object.fromEntries(formData.entries());

    // 1. Validar campos obrigatórios
    const requiredFields = [
        { key: "Número da atividade", label: "Nº da Ação" },
        { key: "Plano de ação", label: "Plano de Ação" },
        { key: "Atividade", label: "Atividade" },
        { key: "Status", label: "Status" },
        { key: "Data de início", label: "Data de Início" },
        { key: "Data fim", label: "Data Fim" }
    ];

    const missingFields = requiredFields.filter(f => !updatedTask[f.key] || updatedTask[f.key].trim() === "");

    if (missingFields.length > 0) {
        const labels = missingFields.map(f => f.label).join(", ");
        task_showMainError(`Os seguintes campos são obrigatórios: ${labels}`);
        return;
    }

    // 2. Verificar se houve alterações (apenas se não for modo criação)
    if (!task_isNewMode && !task_hasChanges) {
        task_switchToViewMode();
        return;
    }

    updatedTask.Unidades = window.getCustomSelectValues ? window.getCustomSelectValues('task-unidades-multi-select') : [];

    const notifications = task_getNotificationsDataFromDOM();

    const hasEmptyDate = notifications.some(n => !n.data);
    if (hasEmptyDate) {
        task_showMainError("Preencha todas as datas de notificação ou remova as pendentes.");
        return;
    }

    // Check for date changes to trigger history prompt
    const dateChanged = !task_isNewMode && (
        updatedTask["Data de início"] !== task_initialDates.inicio ||
        updatedTask["Data fim"] !== task_initialDates.fim
    );

    if (dateChanged) {
        task_pendingSaveData = updatedTask;
        task_showHistoryPromptModal();
        return;
    }

    await task_performSave(updatedTask);
}

async function task_performSave(updatedTask) {
    const notifications = task_getNotificationsDataFromDOM();

    // Persist History Data (from memory, manipulated by modal)
    if (task_isNewMode) {
        updatedTask["Datas anteriores"] = [{
            indice: 0,
            inicio: updatedTask["Data de início"],
            fim: updatedTask["Data fim"],
            motivo: 'Registro inicial'
        }];
    } else if (task_current["Datas anteriores"]) {
        updatedTask["Datas anteriores"] = task_current["Datas anteriores"];
    }

    const saveBtn = document.getElementById('task-btn-save-task');
    task_togglePageInteractivity(false);
    saveBtn.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Salvando...</span>
        </div>
    `;

    try {
        const action = task_isNewMode ? 'create' : 'update';
        const id = task_isNewMode ? '' : task_current.ID;

        const response = await window.salvarArquivoNoOneDrive(id, 'acoes.txt', action, updatedTask, 'jsonAcoes');

        if (response?.status === 200) {
            const newTaskId = task_isNewMode ? response.data.ID : task_current.ID;

            const notificationsToSave = notifications.filter(n => !n.ID);
            const notificationsToUpdate = notifications.filter(n => n.ID);
            const notificationsToDelete = task_deletedNotificationIds;

            for (const notif of notificationsToUpdate) {
                const originalDataStr = document.querySelector(`[data-notification-id="${notif.ID}"]`).dataset.originalData;
                const originalData = JSON.parse(originalDataStr);
                const currentData = { tipo: notif.tipo, data: notif.data, mailList: [...notif.mailList].sort() };

                if (JSON.stringify(originalData) !== JSON.stringify(currentData)) {
                    await window.salvarArquivoNoOneDrive(notif.ID, 'notificacoes.txt', 'update', { ...notif, idAcao: newTaskId }, 'jsonNotificacoes');
                }
            }

            for (const notif of notificationsToSave) {
                await window.salvarArquivoNoOneDrive('', 'notificacoes.txt', 'create', { ...notif, idAcao: newTaskId }, 'jsonNotificacoes');
            }

            for (const notifId of notificationsToDelete) {
                await window.salvarArquivoNoOneDrive(notifId, 'notificacoes.txt', 'delete', {}, 'jsonNotificacoes');
            }

            window.location.reload();
        } else {
            throw new Error(response?.message || 'Erro ao salvar ação');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        task_showMainError('Falha ao salvar: ' + error.message);
        task_togglePageInteractivity(true);
        saveBtn.textContent = 'Salvar';
    }
}

function task_showMainError(msg) {
    const errorSpan = document.getElementById('task-main-msg');
    errorSpan.querySelector('.msg-text').textContent = msg;
    errorSpan.classList.remove('hidden');
    setTimeout(() => {
        if (!errorSpan.classList.contains('hidden') && errorSpan.querySelector('.msg-text').textContent === msg) {
            errorSpan.classList.add('hidden');
        }
    }, 5000);
}

function task_showHistoryPromptModal() {
    const modal = document.getElementById('task-history-prompt-modal');
    const input = document.getElementById('task-history-prompt-input');

    input.value = '';
    modal.classList.remove('hidden');
    input.focus();
}

async function task_handleHistoryPrompt(confirmed) {
    const modal = document.getElementById('task-history-prompt-modal');
    const input = document.getElementById('task-history-prompt-input');

    if (confirmed && task_pendingSaveData) {
        const motivo = input.value.trim();

        if (!motivo) {
            // Exibe erro: Motivo é obrigatório
            alert('O motivo da alteração é obrigatório.');
            return;
        }

        if (!task_current["Datas anteriores"]) {
            task_current["Datas anteriores"] = [];
        }

        const isFirstChange = task_current["Datas anteriores"].length === 0;

        if (isFirstChange) {
            // Primeira alteração: adicionar registro das datas antigas
            task_current["Datas anteriores"].push({
                indice: 0,
                inicio: task_initialDates.inicio,
                fim: task_initialDates.fim,
                motivo: "Data inicialmente prevista"
            });
        }

        // Adicionar registro das datas novas
        const proximoIndice = task_current["Datas anteriores"].length;

        task_current["Datas anteriores"].push({
            indice: proximoIndice,
            inicio: task_pendingSaveData["Data de início"],
            fim: task_pendingSaveData["Data fim"],
            motivo: motivo
        });
    }

    modal.classList.add('hidden');

    if (task_pendingSaveData) {
        const updatedTask = task_pendingSaveData;
        task_pendingSaveData = null;
        await task_performSave(updatedTask);
    }
}

// --- History Modal Functions ---

let task_tempStart = '';
let task_tempEnd = '';
let task_tempReason = '';

function openTaskHistoryModal(isEditMode) {
    const modal = document.getElementById('task-history-modal');
    const titleView = modal.querySelector('h3');

    modal.classList.remove('hidden');
    task_inlineEditingIndice = null; // Reset inline editing state

    if (isEditMode) {
        titleView.innerHTML = 'Gerenciar Linha do Tempo';
        task_renderHistoryModalContent(true);
    } else {
        titleView.innerHTML = 'Histórico de alteração de datas';
        task_renderHistoryModalContent(false);
    }
}

function closeTaskHistoryModal() {
    document.getElementById('task-history-modal').classList.add('hidden');
}

function task_renderHistoryModalContent(isEditMode = false) {
    const container = document.getElementById('task-history-list-content');
    const historyData = task_current["Datas anteriores"] || [];

    if (historyData.length === 0) {
        container.innerHTML = '<p class="text-slate-400 italic text-sm py-4">Nenhum registro anterior encontrado.</p>';
        return;
    }

    // Ordenar por índice DECRESCENTE (maior índice primeiro = mais recente no topo)
    let sortedHistory = [...historyData].sort((a, b) => b.indice - a.indice);

    // Encontrar maior índice
    const maxIndice = Math.max(...historyData.map(h => h.indice));

    // Variáveis para controlar animação de troca (lidas do contexto global)
    const movedUp = window.task_lastMovedIndiceUp;
    const movedDown = window.task_lastMovedIndiceDown;

    // Limpar após ler
    window.task_lastMovedIndiceUp = null;
    window.task_lastMovedIndiceDown = null;

    container.innerHTML = sortedHistory.map((h) => {
        const isPrimeiro = h.indice === 0; // Não pode decrementar mais
        const isUltimo = h.indice === maxIndice; // Não pode incrementar mais
        const isEditing = task_inlineEditingIndice === h.indice;

        // Determinar classe de animação
        let animClass = "";
        let glowClass = "";
        if (h.indice === movedUp) {
            animClass = "animate-slide-up-evident";
            glowClass = "glow-temp";
        }
        if (h.indice === movedDown) {
            animClass = "animate-slide-down-evident";
            glowClass = "glow-temp";
        }

        return `
            <div class="relative group ${animClass} ${glowClass}">
                <div class="absolute left-[-25px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-sky-400 transition-colors shadow-sm"></div>
                <div class="bg-white border ${isEditing ? 'border-sky-400 ring-2 ring-sky-50' : 'border-slate-200'} rounded-xl p-4 shadow-sm hover:shadow-md transition-all group-hover:border-slate-300">
                    <div class="flex items-start justify-between mb-2">
                         <div class="flex flex-col gap-2 w-full">
                              ${isEditing ? `
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-[9px] font-bold text-sky-600 uppercase">Data Início</label>
                                        <input type="date" id="inline-edit-start-${h.indice}" value="${h.inicio}" class="text-sm border-slate-200 rounded-lg p-1.5 focus:ring-sky-500">
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="text-[9px] font-bold text-sky-600 uppercase">Data Fim</label>
                                        <input type="date" id="inline-edit-end-${h.indice}" value="${h.fim}" class="text-sm border-slate-200 rounded-lg p-1.5 focus:ring-sky-500">
                                    </div>
                                </div>
                              ` : `
                                <div class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <span class="px-2 py-0.5 bg-slate-50 rounded border border-slate-100">${formatDate(h.inicio)}</span>
                                    <ion-icon name="arrow-forward-outline" class="text-slate-300"></ion-icon>
                                    <span class="px-2 py-0.5 bg-slate-50 rounded border border-slate-100">${formatDate(h.fim)}</span>
                                </div>
                              `}
                          </div>
                         ${isEditMode ? `
                            <div class="flex items-center gap-1">
                                ${isEditing ? `
                                    <button type="button" class="text-green-500 hover:text-green-600 transition-colors p-1" onclick="task_saveInlineHistoryEdit(${h.indice})" title="Confirmar">
                                        <ion-icon name="checkmark-circle-outline" class="text-xl"></ion-icon>
                                    </button>
                                    <button type="button" class="text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="task_cancelInlineHistoryEdit()" title="Cancelar">
                                        <ion-icon name="close-circle-outline" class="text-xl"></ion-icon>
                                    </button>
                                ` : `
                                    ${!isPrimeiro ? `
                                        <button type="button" class="text-slate-300 hover:text-sky-600 transition-colors p-1" onclick="task_decrementHistoryIndex(${h.indice})" title="Mover para cima (decrementar índice)">
                                            <ion-icon name="arrow-down-outline" class="text-sm"></ion-icon>
                                        </button>
                                    ` : '<span class="w-6"></span>'}
                                    ${!isUltimo ? `
                                        <button type="button" class="text-slate-300 hover:text-sky-600 transition-colors p-1" onclick="task_incrementHistoryIndex(${h.indice})" title="Mover para baixo (incrementar índice)">
                                            <ion-icon name="arrow-up-outline" class="text-sm"></ion-icon>
                                        </button>
                                    ` : '<span class="w-6"></span>'}
                                    <button type="button" class="text-slate-300 hover:text-sky-500 transition-colors p-1" onclick="task_editHistoryItem(${h.indice})" title="Editar">
                                        <ion-icon name="create-outline" class="text-base"></ion-icon>
                                    </button>
                                    <button type="button" class="text-slate-400 hover:text-red-500 transition-colors p-1 ml-1" onclick="task_removeHistoryItem(${h.indice})" title="Remover">
                                        <ion-icon name="trash-outline" class="text-base"></ion-icon>
                                    </button>
                                `}
                            </div>
                         ` : ''}
                    </div>
                    
                    <div class="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
                        <span class="text-[10px] text-slate-400 font-bold uppercase mr-1">Justificativa:</span>
                        ${isEditing ? `
                            <input type="text" id="inline-edit-reason-${h.indice}" value="${h.motivo || ''}" class="w-full text-sm border-slate-200 rounded-lg p-1.5 mt-1 focus:ring-sky-500" placeholder="Motivo da alteração...">
                        ` : `
                            <span class="text-slate-600">${h.motivo || 'Nenhuma justificativa registrada.'}</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    task_syncHistoryCurrentState();
}

// Incrementar índice (move para baixo visualmente, pois ordem é decrescente)
window.task_incrementHistoryIndex = function (currentIndex) {
    const history = task_current["Datas anteriores"];
    const registroAtual = history.find(h => h.indice === currentIndex);

    if (!registroAtual) return;

    // Encontrar o registro com índice imediatamente superior
    const proximoIndice = currentIndex + 1;
    const registroProximo = history.find(h => h.indice === proximoIndice);

    if (!registroProximo) return; // Já é o último (maior índice)

    // Na visualização Decrescente:
    // Incrementar o índice faz o item SUBIR na lista (maior índice fica em cima)
    window.task_lastMovedIndiceUp = proximoIndice;
    window.task_lastMovedIndiceDown = currentIndex;

    // Trocar os índices
    registroAtual.indice = proximoIndice;
    registroProximo.indice = currentIndex;

    task_hasChanges = true;
    task_renderHistoryModalContent(true);
};

// Decrementar índice (move para cima visualmente, pois ordem é decrescente)
window.task_decrementHistoryIndex = function (currentIndex) {
    const history = task_current["Datas anteriores"];
    const registroAtual = history.find(h => h.indice === currentIndex);

    if (!registroAtual || currentIndex === 0) return; // Já é o primeiro (índice 0)

    // Encontrar o registro com índice imediatamente inferior
    const indiceAnterior = currentIndex - 1;
    const registroAnterior = history.find(h => h.indice === indiceAnterior);

    if (!registroAnterior) return;

    // Na visualização Decrescente:
    // Decrementar o índice faz o item DESCER na lista
    window.task_lastMovedIndiceDown = indiceAnterior;
    window.task_lastMovedIndiceUp = currentIndex;

    // Trocar os índices
    registroAtual.indice = indiceAnterior;
    registroAnterior.indice = currentIndex;

    task_hasChanges = true;
    task_renderHistoryModalContent(true);
};

// Reindexar para garantir sequência 0, 1, 2, 3...
function task_reindexHistory() {
    const history = task_current["Datas anteriores"];

    // Ordena por índice atual
    history.sort((a, b) => a.indice - b.indice);

    // Recalcula índices sequenciais
    history.forEach((h, i) => {
        h.indice = i;
    });
}

window.task_editHistoryItem = function (indice) {
    task_inlineEditingIndice = indice;
    task_renderHistoryModalContent(true);
};

window.task_saveInlineHistoryEdit = function (indice) {
    const entry = task_current["Datas anteriores"].find(h => h.indice === indice);
    if (!entry) return;

    const newStart = document.getElementById(`inline-edit-start-${indice}`).value;
    const newEnd = document.getElementById(`inline-edit-end-${indice}`).value;
    const newReason = document.getElementById(`inline-edit-reason-${indice}`).value;

    if (!newStart && !newEnd) {
        alert("Preencha ao menos uma data.");
        return;
    }

    entry.inicio = newStart;
    entry.fim = newEnd;
    entry.motivo = newReason;

    task_inlineEditingIndice = null;
    task_hasChanges = true;
    task_renderHistoryModalContent(true);
};

window.task_cancelInlineHistoryEdit = function () {
    task_inlineEditingIndice = null;
    task_renderHistoryModalContent(true);
};

function task_showHistoryError(msg) {
    const errorSpan = document.getElementById('task-history-msg');
    errorSpan.querySelector('.msg-text').textContent = msg;
    errorSpan.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (!errorSpan.classList.contains('hidden') && errorSpan.querySelector('.msg-text').textContent === msg) {
            errorSpan.classList.add('hidden');
        }
    }, 5000);
}

window.task_removeHistoryItem = function (indice) {
    const history = task_current["Datas anteriores"];
    const index = history.findIndex(h => h.indice === indice);

    if (index === -1) return;

    history.splice(index, 1);

    // Reindexar para manter sequência após remoção
    task_reindexHistory();

    task_hasChanges = true;
    task_renderHistoryModalContent(true);
};

function task_showConfirmationNotificacaoModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
    const modal = document.getElementById('task-date-change-confirmation-modal');
    const modalTitle = document.getElementById('task-modal-title');
    const modalMessage = document.getElementById('task-modal-message');
    const confirmBtn = document.getElementById('task-modal-btn-confirm-notification');
    const cancelBtn = document.getElementById('task-modal-btn-cancel-notification');

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    modal.classList.remove('hidden');

    return new Promise((resolve) => {
        let confirmHandler, cancelHandler;

        const cleanupAndClose = (confirmation) => {
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            modal.classList.add('hidden');
            resolve(confirmation);
        };

        confirmHandler = () => cleanupAndClose(true);
        cancelHandler = () => cleanupAndClose(false);

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
    });
}

function task_handleUpdateAndPruneNotifications(tipoNotificacao, novaData) {
    const allNotificationCards = document.querySelectorAll('#task-notifications-edit-list .container-notificacao');
    const matchingCards = Array.from(allNotificationCards).filter(card => {
        const typeSelect = card.querySelector('.notification-type');
        return typeSelect && typeSelect.value === tipoNotificacao;
    });

    if (matchingCards.length === 0) return;

    const cardToKeep = matchingCards[0];
    const dateInput = cardToKeep.querySelector('.notification-date');
    if (dateInput) {
        dateInput.value = novaData;
    }

    if (matchingCards.length > 1) {
        const cardsToDelete = matchingCards.slice(1);
        cardsToDelete.forEach(cardToDelete => {
            const notificationId = cardToDelete.dataset.notificationId;
            if (notificationId) {
                task_deletedNotificationIds.push(notificationId);
            }
            cardToDelete.remove();
        });
    }

    task_hasChanges = true;
}

async function task_gerenciarNotificacaoPorData(idAcao, novaData, tipoNotificacao, calculoDataFn = null) {
    if (!novaData) return;

    const dataNotificacao = calculoDataFn ? calculoDataFn(novaData) : novaData;
    const dataFormatada = new Date(dataNotificacao + 'T00:00:00').toLocaleDateString('pt-BR');

    const notificacoesNoDOM = task_getNotificationsDataFromDOM();

    const existeNotificacaoIdentica = notificacoesNoDOM.some(
        n => n.tipo === tipoNotificacao && n.data === dataNotificacao
    );

    if (existeNotificacaoIdentica) {
        return;
    }

    const existeNotificacaoDoTipo = notificacoesNoDOM.some(n => n.tipo === tipoNotificacao);

    if (existeNotificacaoDoTipo) {
        const confirmed = await task_showConfirmationNotificacaoModal({
            title: 'Atualizar Notificação?',
            message: `Encontramos notificações do tipo "${tipoNotificacao}".<br>Deseja atualizar a data para ${dataFormatada}? <br><i class="text-slate-400">(Apenas uma será mantida)</i>`,
            confirmText: 'Sim, Atualizar'
        });
        if (confirmed) {
            task_handleUpdateAndPruneNotifications(tipoNotificacao, dataNotificacao);
        }
    } else {
        const confirmed = await task_showConfirmationNotificacaoModal({
            title: 'Criar Notificação?',
            message: `Não há notificação de "${tipoNotificacao}".<br>Deseja criar uma nova com a data ${dataFormatada}?`,
            confirmText: 'Sim, Criar'
        });
        if (confirmed) {
            const novaNotificacao = { tipo: tipoNotificacao, data: dataNotificacao, idAcao: idAcao, status: 'editavel', mailList: [] };
            task_addNotificationItem(novaNotificacao);
        }
    }
}

async function task_verificarNotificacaoLongoPrazo(idAcao, dataInicioStr, dataFimStr) {
    if (!dataInicioStr || !dataFimStr) return;

    const dataInicio = new Date(dataInicioStr + 'T00:00:00');
    const dataFim = new Date(dataFimStr + 'T00:00:00');
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
        const dataNotificacao = new Date(dataFim);
        dataNotificacao.setDate(dataNotificacao.getDate() - 7);
        const dataNotificacaoStr = dataNotificacao.toISOString().split('T')[0];
        const dataFormatada = new Date(dataNotificacaoStr + 'T00:00:00').toLocaleDateString('pt-BR');

        const notifications = task_getNotificationsDataFromDOM();

        const existeNotificacaoIdentica = notifications.some(
            n => n.tipo === 'aviso' && n.data === dataNotificacaoStr
        );

        if (existeNotificacaoIdentica) {
            return;
        }

        const existeNotificacaoDoTipo = notifications.some(n => n.tipo === 'aviso');

        if (existeNotificacaoDoTipo) {

            const confirmed = await task_showConfirmationNotificacaoModal({
                title: 'Atualizar Aviso?',
                message: `O prazo desta tarefa é longo.<br>Deseja atualizar a data dos avisos para ${dataFormatada}, 7 dias antes da conclusão? <br><i class="text-slate-400">(Apenas um será mantido)</i>`,
                confirmText: 'Sim, Atualizar'
            });
            if (confirmed) {
                task_handleUpdateAndPruneNotifications('aviso', dataNotificacaoStr);
            }
        } else {
            const confirmed = await task_showConfirmationNotificacaoModal({
                title: 'Criar Notificação de Aviso?',
                message: `O prazo desta tarefa é longo.<br>Deseja criar um aviso automático para o dia ${dataFormatada}, 7 dias antes da conclusão?`,
                confirmText: 'Sim, Criar Aviso'
            });
            if (confirmed) {
                const novaNotificacao = { tipo: 'aviso', data: dataNotificacaoStr, idAcao: idAcao, status: 'editavel', mailList: [] };
                task_addNotificationItem(novaNotificacao);
            }
        }
    }
}

function task_getNotificationsDataFromDOM() {
    return Array.from(document.querySelectorAll('#task-notifications-edit-list .container-notificacao'))
        .filter(el => el.querySelector('.status-slot').classList.contains('hidden'))
        .map(el => ({
            ID: el.dataset.notificationId,
            idAcao: task_current.ID,
            tipo: el.querySelector('.notification-type').value,
            data: el.querySelector('.notification-date').value,
            mailList: Array.from(el.querySelectorAll('.recipients-list-editable input:checked')).map(i => i.closest('label').querySelector('.text-slate-600').textContent.trim()),
            status: 'planejado'
        }));
}

window.openTaskModal = openTaskModal;
window.initTaskModal = initTaskModal;
window.openModalForNewAction = openCreateTaskModal;
window.openDeleteConfirmationModalTask = window.openDeleteConfirmationModalTask;
window.task_togglePageInteractivity = task_togglePageInteractivity;

function task_togglePageInteractivity(enabled) {
    const elements = document.querySelectorAll('input, select, checkbox, textarea, button');
    elements.forEach(el => {
        el.disabled = !enabled;
    });

    const customSelects = document.querySelectorAll('.custom-select-container');
    customSelects.forEach(cs => {
        if (!enabled) {
            cs.classList.add('pointer-events-none', 'opacity-70', 'grayscale-[0.5]');
        } else {
            cs.classList.remove('pointer-events-none', 'opacity-70', 'grayscale-[0.5]');
        }
    });
}
