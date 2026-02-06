document.addEventListener('DOMContentLoaded', () => {
    const CHAT_API_URL = 'https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/36b9c2865eee4a19b73fee977d580e2c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1g4wq1WGZzFDdNQ7cgsycOB-OyH-7ry8bCRPGd6V1zw';
    const SESSION_STORAGE_KEY_HISTORY = 'chatbot_history';

    let state = {
        history: JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY_HISTORY)) || [],
        isChatOpen: false,
        isExpanded: false,
        isThinking: false,
        messageIdCounter: 0,
    };

    function createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatbot-container';
        chatContainer.className = 'fixed bottom-5 right-5 z-50';
        chatContainer.innerHTML = `
            <button id="chatbot-toggle-button" class="bg-sky-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-sky-700 transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                <ion-icon name="chatbubbles-outline" class="text-3xl"></ion-icon>
            </button>
            <div id="chatbot-window" class="hidden absolute bottom-20 right-0 w-[400px] h-[75vh] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right scale-95 opacity-0 border border-slate-200">
                <div class="flex-shrink-0 bg-slate-100 p-3 flex justify-between items-center rounded-t-2xl border-b border-slate-200">
                    <h3 class="text-lg font-bold text-slate-800">ChatBot</h3>
                    <div class="flex items-center gap-1 text-slate-500">
                        <button id="chatbot-download-btn" title="Baixar conversa" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="download-outline" class="text-xl"></ion-icon></button>
                        <button id="chatbot-expand-btn" title="Expandir" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="expand-outline" class="text-xl"></ion-icon></button>
                        <button id="chatbot-restart-btn" title="Reiniciar chat" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="refresh-outline" class="text-xl"></ion-icon></button>
                        <button id="chatbot-close-btn" title="Fechar chat" class="p-2 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"><ion-icon name="close-outline" class="text-xl"></ion-icon></button>
                    </div>
                </div>
                <div id="chatbot-messages" class="flex-grow p-4 overflow-y-auto space-y-4"></div>
                <div class="flex-shrink-0 p-3 border-t border-slate-200 bg-white rounded-b-2xl">
                    <form id="chatbot-form" class="flex items-center gap-2">
                        <input type="text" id="chatbot-input" placeholder="Digite sua pergunta..." class="w-full bg-slate-100 border-transparent rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" autocomplete="off">
                        <button type="submit" class="bg-sky-600 text-white rounded-lg p-2.5 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                            <ion-icon name="send" class="text-xl"></ion-icon>
                        </button>
                    </form>
                </div>
            </div>
            <div id="chatbot-confirmation-modal" class="hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-slate-800">Confirmar Ação</h3>
                        <p id="chatbot-confirmation-message" class="mt-2 text-sm text-slate-600"></p>
                    </div>
                    <div class="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-x-3">
                        <button id="chatbot-confirm-btn-no" type="button" class="bg-white text-slate-700 font-bold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Não</button>
                        <button id="chatbot-confirm-btn-yes" type="button" class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">Sim</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
    }

    function attachEventListeners() {
        document.getElementById('chatbot-toggle-button').addEventListener('click', toggleChat);
        document.getElementById('chatbot-close-btn').addEventListener('click', toggleChat); // Adicione esta linha
        document.getElementById('chatbot-form').addEventListener('submit', handleSendMessage);
        document.getElementById('chatbot-restart-btn').addEventListener('click', handleRestartChat);
        document.getElementById('chatbot-download-btn').addEventListener('click', handleDownloadChat);
        document.getElementById('chatbot-expand-btn').addEventListener('click', handleExpandChat);
    }

    function toggleChat() {
        const windowEl = document.getElementById('chatbot-window');
        const buttonEl = document.getElementById('chatbot-toggle-button');
        state.isChatOpen = !state.isChatOpen;

        if (state.isChatOpen) {
            windowEl.classList.remove('hidden');
            setTimeout(() => {
                windowEl.classList.add('scale-100', 'opacity-100');
                windowEl.classList.remove('scale-95', 'opacity-0');
                buttonEl.classList.add('scale-90');
                const messagesContainer = document.getElementById('chatbot-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
        } else {
            windowEl.classList.add('scale-95', 'opacity-0');
            windowEl.classList.remove('scale-100', 'opacity-100');
            buttonEl.classList.remove('scale-90');
            setTimeout(() => windowEl.classList.add('hidden'), 300);
        }
    }

    function handleExpandChat() {
        const windowEl = document.getElementById('chatbot-window');
        const iconEl = document.querySelector('#chatbot-expand-btn ion-icon');
        state.isExpanded = !state.isExpanded;

        if (state.isExpanded) {
            windowEl.classList.add('w-[90vw]', 'h-[80vh]');
            iconEl.setAttribute('name', 'contract-outline');
        } else {
            windowEl.classList.remove('w-[90vw]', 'h-[80vh]');
            iconEl.setAttribute('name', 'expand-outline');
        }
        
        loadHistory();
    }
    
    function parseMarkdownToHTML(text) {
        if (!text) return '';
        let html = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');

        const listRegex = /(?:<br>)*(?:- (?:.*?)(?=<br>|$))+/g;
        html = html.replace(listRegex, (match) => {
            const lines = match.split('<br>').filter(line => line.trim().startsWith('- '));
            if (lines.length === 0) return match; 

            const listItems = lines.map(item => {
                const content = item.trim().substring(2).trim();
                return `<li>${content}</li>`;
            }).join('');
            
            return `<ul class="list-disc list-inside space-y-1">${listItems}</ul>`;
        });
        
        return html;
    }

    async function processAndSend(userMessageText, messageId) {
        state.isThinking = true;
        toggleThinkingIndicator(true);
        const startTime = performance.now();
        
        try {
            const response = await callPowerAutomateAPI(userMessageText, JSON.stringify(state.history));
            const endTime = performance.now();
            const responseTime = ((endTime - startTime) / 1000).toFixed(1);

            const aiMessage = {
                id: messageId,
                sender: 'assistant',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                responseTime: responseTime,
                isDownloadable: response.type === 'file' && response.csvContent,
                text: response.type === 'file' ? response.message : response.content,
                csvContent: response.csvContent,
                filename: response.filename
            };
            
            addMessageToUI(aiMessage);
            addMessageToHistory(aiMessage);
            
        } catch (error) {
            console.error("Erro na comunicação com a IA:", error);
            addMessageToUI({
                id: messageId,
                sender: 'assistant',
                text: "Desculpe, não consegui me comunicar com o servidor. Verifique a conexão e tente novamente.",
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        } finally {
            state.isThinking = false;
            toggleThinkingIndicator(false);
        }
    }

    async function handleSendMessage(event) {
        event.preventDefault();
        const inputEl = document.getElementById('chatbot-input');
        const messageText = inputEl.value.trim();
        if (messageText === '' || state.isThinking) return;

        state.messageIdCounter++;
        const userMessage = {
            id: state.messageIdCounter,
            sender: 'user',
            text: messageText,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        addMessageToUI(userMessage);
        addMessageToHistory(userMessage);
        inputEl.value = '';

        await processAndSend(userMessage.text, userMessage.id);
    }

    function handleRestartChat() {
        showConfirmationModal(
            "Tem certeza que deseja apagar o histórico e reiniciar a conversa?",
            () => {
                state.history = [];
                state.messageIdCounter = 0;
                sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
                loadHistory(); // Reload to show welcome message
            }
        );
    }

    function showConfirmationModal(message, onConfirm) {
        const modalEl = document.getElementById('chatbot-confirmation-modal');
        document.getElementById('chatbot-confirmation-message').textContent = message;

        const yesBtn = document.getElementById('chatbot-confirm-btn-yes');
        const noBtn = document.getElementById('chatbot-confirm-btn-no');

        const confirmHandler = () => { onConfirm(); hideConfirmationModal(); };
        const cancelHandler = () => { hideConfirmationModal(); };

        yesBtn.onclick = confirmHandler;
        noBtn.onclick = cancelHandler;
        modalEl.classList.remove('hidden');
    }

    function hideConfirmationModal() {
        const modalEl = document.getElementById('chatbot-confirmation-modal');
        modalEl.classList.add('hidden');
        document.getElementById('chatbot-confirm-btn-yes').onclick = null;
        document.getElementById('chatbot-confirm-btn-no').onclick = null;
    }

    function addMessageToHistory(message) {
        state.history.push(message);
        sessionStorage.setItem(SESSION_STORAGE_KEY_HISTORY, JSON.stringify(state.history));
    }

    function loadHistory() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';

        if (state.history.length === 0) {
            const welcomeMsg = { 
                id: 0, 
                sender: 'assistant', 
                text: 'Olá! Como posso ajudar você a analisar os planos de ação hoje?', 
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
            };
            addMessageToHistory(welcomeMsg);
            addMessageToUI(welcomeMsg);
        } else {
            state.history.forEach(addMessageToUI);
            const lastMessage = state.history[state.history.length - 1];
            state.messageIdCounter = lastMessage ? lastMessage.id : 0;
        }
    }

    async function callPowerAutomateAPI(currentUserMessage, conversationHistory) {
        const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUserMessage, conversationHistory })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.statusText} - ${errorBody}`);
        }
        return await response.json();
    }
    
    function addMessageToUI(message) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        const maxWidthClass = state.isExpanded ? 'max-w-2xl' : 'max-w-sm';

        messageDiv.className = `flex gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;

        let contentHtml = '';
        if (message.sender === 'user') {
            contentHtml = `<div class="bg-sky-500 text-white p-3 rounded-lg rounded-br-none"><div class="text-sm">${parseMarkdownToHTML(message.text)}</div></div>`;
        } else {
            let messageBody = `<div class="text-sm">${parseMarkdownToHTML(message.text)}</div>`;
            if (message.isDownloadable) {
                messageBody += `
                    <a class="chatbot-download-link mt-2 flex items-center gap-2 text-green-700 font-bold border border-green-400 hover:bg-green-50 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                       data-csv-content="${encodeURIComponent(message.csvContent)}"
                       data-filename="${message.filename}">
                        <ion-icon name="document-text-outline" class="text-xl"></ion-icon>
                        <span>${message.filename}</span>
                    </a>`;
            }
            contentHtml = `<div class="bg-slate-100 text-slate-800 p-3 rounded-lg rounded-bl-none">${messageBody}</div>`;
        }

        const timeStampHtml = `<span class="text-xs text-slate-400 mt-1">${message.timestamp}${message.responseTime ? ` (${message.responseTime}s)` : ''}</span>`;
        const regenButtonHtml = (message.sender === 'assistant' && message.id > 0)
            ? `<button class="regenerate-btn text-slate-400 hover:text-sky-600" title="Gerar novamente"><ion-icon name="reload-outline"></ion-icon></button>` : '';

        if (message.sender === 'user') {
            messageDiv.innerHTML = `<div class="flex flex-col items-end ${maxWidthClass}">${contentHtml}${timeStampHtml}</div>`;
        } else {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 grid place-items-center"><ion-icon name="sparkles-outline" class="text-sky-600"></ion-icon></div>
                <div class="flex flex-col items-start ${maxWidthClass}">
                    ${contentHtml}
                    <div class="flex items-center gap-2 mt-1">${timeStampHtml}${regenButtonHtml}</div>
                </div>`;
        }
        messagesContainer.appendChild(messageDiv);

        if (message.isDownloadable) {
            const downloadLink = messageDiv.querySelector('.chatbot-download-link');
            downloadLink.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const csvData = decodeURIComponent(target.dataset.csvContent);
                const fileName = target.dataset.filename;
                triggerCSVDownload(csvData, fileName);
            });
        }
        
        const regenBtn = messageDiv.querySelector('.regenerate-btn');
        if (regenBtn) {
            document.querySelectorAll('.regenerate-btn').forEach((btn, i, arr) => { if (i < arr.length - 1) btn.remove(); });
            regenBtn.addEventListener('click', () => handleRegenerateLastResponse(message.id));
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function toggleThinkingIndicator(show) {
        let indicator = document.getElementById('thinking-indicator');
        if (indicator) indicator.remove();

        if (show) {
            const container = document.getElementById('chatbot-messages');
            indicator = document.createElement('div');
            indicator.id = 'thinking-indicator';
            indicator.className = 'flex gap-2.5 justify-start';
            indicator.innerHTML = `<div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 grid place-items-center"><ion-icon name="sparkles-outline" class="text-sky-600"></ion-icon></div><div class="bg-slate-100 p-3 rounded-lg rounded-bl-none flex items-center space-x-1.5"><div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div></div>`;
            container.appendChild(indicator);
            container.scrollTop = container.scrollHeight;
        }
        document.getElementById('chatbot-form').querySelector('button').disabled = show;
        document.getElementById('chatbot-input').disabled = show;
    }

    async function handleRegenerateLastResponse(messageId) {
        if (state.isThinking || !messageId) return;
        
        const userMessageToRegen = state.history.find(msg => msg.id === messageId && msg.sender === 'user');
        if (!userMessageToRegen) return;

        state.history = state.history.filter(msg => !(msg.id === messageId && msg.sender === 'assistant'));
        
        loadHistory();
        
        await processAndSend(userMessageToRegen.text, userMessageToRegen.id);
    }
    
    function triggerCSVDownload(csvContent, filename) {
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleDownloadChat() {
        let text = "Histórico do ChatBot\n=======================\n\n";
        let currentId = null;
        state.history.forEach(msg => {
            if (msg.id !== currentId && msg.id !== 0) {
                if (currentId !== null) text += "\n";
                currentId = msg.id;
            }
            if (msg.sender === 'user') {
                text += `[${msg.timestamp}] Usuário: ${msg.text}\n`;
            } else if (msg.id > 0) {
                text += `[${msg.timestamp}] Assistente (${msg.responseTime}s): ${msg.text.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "")}\n`;
            }
        });
        triggerCSVDownload(text, `conversa_chatbot_${new Date().toISOString().slice(0, 10)}.txt`);
    }

    function init() {
        createChatInterface();
        attachEventListeners();
        loadHistory();
    }

    init();
});