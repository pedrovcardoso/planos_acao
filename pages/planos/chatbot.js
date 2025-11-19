// ===================================================================================
// ARQUIVO: chatbot.js
// DESCRIÇÃO: Cria e gerencia um chatbot de IA na página.
// ===================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ESTADO E CONFIGURAÇÃO ---
    const CHAT_API_URL = 'https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/36b9c2865eee4a19b73fee977d580e2c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1g4wq1WGZzFDdNQ7cgsycOB-OyH-7ry8bCRPGd6V1zw'; // <-- IMPORTANTE: Substitua pela URL do seu fluxo.
    const SESSION_STORAGE_KEY_HISTORY = 'chatbot_history';
    const SESSION_STORAGE_KEY_MEMORY = 'chatbot_memory';

    let state = {
        history: JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY_HISTORY)) || [],
        memory: sessionStorage.getItem(SESSION_STORAGE_KEY_MEMORY) || "Resumo da conversa até agora: Nenhum.",
        isChatOpen: false,
        isExpanded: false,
        isThinking: false,
    };

    // --- 2. CRIAÇÃO DA INTERFACE (UI) ---
    function createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatbot-container';
        chatContainer.className = 'fixed bottom-5 right-5 z-50';

        chatContainer.innerHTML = `
            <!-- Ícone flutuante -->
            <button id="chatbot-toggle-button" class="bg-sky-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-sky-700 transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.874 8.874 0 01-4.446-1.277L3.11 17.88A.5.5 0 012.5 17.5v-3.334A6.968 6.968 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.732 14.155A6.872 6.872 0 0010 15.5c3.037 0 5.5-2.463 5.5-5.5S13.037 4.5 10 4.5 4.5 6.963 4.5 10c0 .332.025.658.072.977l-.14.42a.5.5 0 00.56.62l.42-.14z" clip-rule="evenodd" />
                </svg>
            </button>

            <!-- Janela do Chat -->
            <div id="chatbot-window" class="hidden absolute bottom-20 right-0 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-500 origin-bottom-right">
                <!-- Cabeçalho -->
                <div class="flex-shrink-0 bg-slate-100 p-3 flex justify-between items-center rounded-t-2xl border-b border-slate-200">
                    <h3 class="text-lg font-bold text-slate-800">ChatBot</h3>
                    <div class="flex items-center gap-1 text-slate-500">
                        <button id="chatbot-download-btn" title="Baixar conversa" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="download-outline" class="text-xl"></ion-icon></button>
                        <button id="chatbot-expand-btn" title="Expandir" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="expand-outline" class="text-xl"></ion-icon></button>
                        <button id="chatbot-restart-btn" title="Reiniciar chat" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="refresh-outline" class="text-xl"></ion-icon></button>
                    </div>
                </div>

                <!-- Mensagens -->
                <div id="chatbot-messages" class="flex-grow p-4 overflow-y-auto space-y-4">
                    <!-- Mensagens serão injetadas aqui -->
                </div>

                <!-- Input -->
                <div class="flex-shrink-0 p-3 border-t border-slate-200">
                    <form id="chatbot-form" class="flex items-center gap-2">
                        <input type="text" id="chatbot-input" placeholder="Digite sua pergunta..." class="w-full bg-slate-100 border-transparent rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" autocomplete="off">
                        <button type="submit" class="bg-sky-600 text-white rounded-lg p-2.5 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                            <ion-icon name="send" class="text-xl"></ion-icon>
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
    }

    // --- 3. MANIPULAÇÃO DO DOM E EVENTOS ---

    /** Anexa os event listeners aos elementos do chat */
    function attachEventListeners() {
        document.getElementById('chatbot-toggle-button').addEventListener('click', toggleChat);
        document.getElementById('chatbot-form').addEventListener('submit', handleSendMessage);
        document.getElementById('chatbot-restart-btn').addEventListener('click', handleRestartChat);
        document.getElementById('chatbot-download-btn').addEventListener('click', handleDownloadChat);
        document.getElementById('chatbot-expand-btn').addEventListener('click', handleExpandChat);
    }

    /** Alterna a visibilidade da janela do chat */
    function toggleChat() {
        const window = document.getElementById('chatbot-window');
        const button = document.getElementById('chatbot-toggle-button');
        state.isChatOpen = !state.isChatOpen;
        
        if (state.isChatOpen) {
            window.classList.remove('hidden');
            // Animação de abertura
            setTimeout(() => {
                window.classList.add('scale-100', 'opacity-100');
                window.classList.remove('scale-95', 'opacity-0');
                button.classList.add('rotate-90');
            }, 10);
        } else {
            window.classList.add('scale-95', 'opacity-0');
            window.classList.remove('scale-100', 'opacity-100');
            button.classList.remove('rotate-90');
            setTimeout(() => window.classList.add('hidden'), 300);
        }
    }
    
    /** Expande ou contrai a janela do chat para o modo modal */
    function handleExpandChat() {
        const window = document.getElementById('chatbot-window');
        const icon = document.querySelector('#chatbot-expand-btn ion-icon');
        state.isExpanded = !state.isExpanded;
        
        if(state.isExpanded) {
            window.classList.add('w-[90vw]', 'h-[80vh]');
            icon.setAttribute('name', 'contract-outline');
        } else {
            window.classList.remove('w-[90vw]', 'h-[80vh]');
            icon.setAttribute('name', 'expand-outline');
        }
    }

    /** Lida com o envio de uma nova mensagem */
    async function handleSendMessage(event) {
        event.preventDefault();
        const input = document.getElementById('chatbot-input');
        const messageText = input.value.trim();
        if (messageText === '' || state.isThinking) return;

        const message = {
            sender: 'user',
            text: messageText,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToUI(message);
        addMessageToHistory(message);

        input.value = '';
        state.isThinking = true;
        toggleThinkingIndicator(true);

        const startTime = performance.now();
        
        try {
            const response = await callPowerAutomateAPI(messageText, state.memory);
            const endTime = performance.now();
            const responseTime = ((endTime - startTime) / 1000).toFixed(1);

            const aiMessage = {
                sender: 'assistant',
                text: response.aiResponse,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                responseTime: responseTime
            };
            
            addMessageToUI(aiMessage);
            addMessageToHistory(aiMessage, messageText); // Salva o par
            
            // Atualiza a memória
            state.memory = response.updatedMemory;
            sessionStorage.setItem(SESSION_STORAGE_KEY_MEMORY, state.memory);

        } catch (error) {
            console.error("Erro ao chamar a API:", error);
            const errorMessage = {
                sender: 'assistant',
                text: "Desculpe, não consegui processar sua solicitação. Tente novamente.",
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };
            addMessageToUI(errorMessage);
        } finally {
            state.isThinking = false;
            toggleThinkingIndicator(false);
        }
    }
    
    /** Reinicia a conversa, limpando o histórico e a memória */
    function handleRestartChat() {
        if (!confirm("Tem certeza que deseja apagar o histórico e reiniciar a conversa?")) {
            return;
        }
        state.history = [];
        state.memory = "Resumo da conversa até agora: Nenhum.";
        sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY_MEMORY);
        document.getElementById('chatbot-messages').innerHTML = '';
        addWelcomeMessage();
    }
    
    /** Gera e baixa a conversa atual como um arquivo .txt */
    function handleDownloadChat() {
        let conversationText = "Histórico do ChatBot\n";
        conversationText += "=======================\n\n";

        state.history.forEach(pair => {
            conversationText += `[${pair.user.timestamp}] Usuário: ${pair.user.text}\n`;
            if (pair.assistant) {
                conversationText += `[${pair.assistant.timestamp}] Assistente (resposta em ${pair.assistant.responseTime}s): ${pair.assistant.text}\n\n`;
            }
        });

        const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        a.download = `conversa_chatbot_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /** Adiciona uma mensagem à interface do chat */
    function addMessageToUI(message) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;

        let html = '';
        if (message.sender === 'user') {
            html = `
                <div class="flex flex-col items-end max-w-sm">
                    <div class="bg-sky-500 text-white p-3 rounded-lg rounded-br-none">
                        <p class="text-sm">${message.text}</p>
                    </div>
                    <span class="text-xs text-slate-400 mt-1">${message.timestamp}</span>
                </div>
            `;
        } else { // Assistant
            html = `
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 grid place-items-center"><ion-icon name="sparkles-outline" class="text-sky-600"></ion-icon></div>
                <div class="flex flex-col items-start max-w-sm">
                    <div class="bg-slate-100 text-slate-800 p-3 rounded-lg rounded-bl-none">
                        <p class="text-sm">${message.text}</p>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>${message.timestamp}</span>
                        ${message.responseTime ? `<span>(Resposta em ${message.responseTime}s)</span>` : ''}
                        <button class="regenerate-btn text-slate-400 hover:text-sky-600" title="Gerar novamente"><ion-icon name="reload-outline"></ion-icon></button>
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = html;
        messagesContainer.appendChild(messageDiv);
        
        // Atribui evento ao botão de regenerar recém-criado
        const regenBtn = messageDiv.querySelector('.regenerate-btn');
        if (regenBtn) {
            // Remove evento de botões anteriores para que apenas o último funcione
            document.querySelectorAll('.regenerate-btn').forEach((btn, index, arr) => {
                if(index < arr.length -1) {
                    btn.remove();
                }
            });
            regenBtn.addEventListener('click', handleRegenerateLastResponse);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /** Mostra/Esconde a animação de "digitando" */
    function toggleThinkingIndicator(show) {
        const existingIndicator = document.getElementById('thinking-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (show) {
            const messagesContainer = document.getElementById('chatbot-messages');
            const indicatorDiv = document.createElement('div');
            indicatorDiv.id = 'thinking-indicator';
            indicatorDiv.className = 'flex gap-2.5 justify-start';
            indicatorDiv.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 grid place-items-center"><ion-icon name="sparkles-outline" class="text-sky-600"></ion-icon></div>
                <div class="bg-slate-100 p-3 rounded-lg rounded-bl-none flex items-center space-x-1.5">
                    <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                </div>
            `;
            messagesContainer.appendChild(indicatorDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        document.getElementById('chatbot-form').querySelector('button').disabled = show;
        document.getElementById('chatbot-input').disabled = show;
    }
    
    /** Recria a última resposta da IA */
    async function handleRegenerateLastResponse() {
        if(state.isThinking || state.history.length === 0) return;
        
        // Remove a última resposta da IA do histórico e da UI
        const lastPair = state.history.pop();
        if(!lastPair || !lastPair.assistant) return;
        
        const lastUserMessage = lastPair.user;
        
        // Atualiza UI
        const messageElements = document.querySelectorAll('#chatbot-messages > div');
        if(messageElements.length > 0) messageElements[messageElements.length-1].remove();

        // Refaz a chamada
        state.isThinking = true;
        toggleThinkingIndicator(true);

        const startTime = performance.now();
        
        try {
            // Usa a mesma memória de antes
            const response = await callPowerAutomateAPI(lastUserMessage.text, state.memory);
            const endTime = performance.now();
            const responseTime = ((endTime - startTime) / 1000).toFixed(1);

            const aiMessage = {
                sender: 'assistant',
                text: response.aiResponse,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                responseTime: responseTime
            };
            
            addMessageToUI(aiMessage);
            // Salva o novo par
            addMessageToHistory(aiMessage, lastUserMessage.text);
            
            state.memory = response.updatedMemory;
            sessionStorage.setItem(SESSION_STORAGE_KEY_MEMORY, state.memory);

        } catch (error) {
             console.error("Erro ao regenerar resposta:", error);
            const errorMessage = {
                sender: 'assistant',
                text: "Ocorreu um erro ao tentar gerar a resposta novamente.",
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };
            addMessageToUI(errorMessage);
        } finally {
            state.isThinking = false;
            toggleThinkingIndicator(false);
        }
    }


    // --- 4. LÓGICA DE NEGÓCIO E API ---

    /** Salva uma mensagem no histórico da sessão */
    function addMessageToHistory(message, userMessageText = '') {
        if (message.sender === 'user') {
            // Inicia um novo par com a mensagem do usuário
            state.history.push({ user: message });
        } else if (message.sender === 'assistant' && state.history.length > 0) {
            // Adiciona a resposta da IA ao último par
            state.history[state.history.length - 1].assistant = message;
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY_HISTORY, JSON.stringify(state.history));
    }

    /** Carrega o histórico salvo na UI ao iniciar */
    function loadHistory() {
        if (state.history.length === 0) {
            addWelcomeMessage();
        } else {
            state.history.forEach(pair => {
                if (pair.user) addMessageToUI(pair.user);
                if (pair.assistant) addMessageToUI(pair.assistant);
            });
        }
    }

    /** Exibe a mensagem inicial do chatbot */
    function addWelcomeMessage() {
         const welcome = {
            sender: 'assistant',
            text: 'Olá! Como posso ajudar você a analisar os planos de ação hoje?',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToUI(welcome);
    }

    /** Faz a chamada para o fluxo do Power Automate */
    async function callPowerAutomateAPI(currentUserMessage, conversationMemory) {
        const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentUserMessage,
                conversationMemory
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Erro na API: ${response.statusText} - ${errorBody}`);
        }

        // Power Automate aninha a resposta dentro de um objeto. Pode ser necessário ajustar.
        const result = await response.json();
        return result; 
    }

    // --- 5. INICIALIZAÇÃO ---
    function init() {
        createChatInterface();
        attachEventListeners();
        loadHistory();
    }

    init();
});