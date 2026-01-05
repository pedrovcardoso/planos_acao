const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0) {
  const navType = navEntries[0].type;
  console.log("Tipo de navegação:", navType);
  // valores possíveis: "navigate", "reload", "back_forward", "prerender"
}

function toggleLoading(show) {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    if (show) {
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }
}
document.addEventListener('DOMContentLoaded', async function () {
  toggleLoading(true);

  try {
    const requiredData = await obterDados(['acoes.txt', 'planos.txt', 'notificacoes.txt']);

    if (!requiredData) {
      throw new Error("Não foi possível obter os dados do projeto.");
    }

    jsonAcoes = requiredData['acoes.txt'];
    jsonPlanos = requiredData['planos.txt'];
    jsonNotificacoes = requiredData['notificacoes.txt'];

    ordenarJsonAcoes(jsonAcoes);
    ordenarJsonPlanos(jsonPlanos)

    initModalPlanos()
    setupSecaoIA()
    setupStatCards(jsonPlanos)
    fillGanttData(jsonPlanos)
    gerarCards(jsonPlanos)
    setupFilters()

  } catch (error) {
    console.error("Ocorreu um erro no carregamento da página:", error);
  } finally {
    toggleLoading(false);
  }
});

async function gerarPDFdaPagina() {
  console.log("Iniciando a geração do PDF...");

  // Usa sua função de loading para dar feedback visual
  if (typeof toggleLoading === 'function') {
    toggleLoading(true);
  }

  // Elemento que será capturado. document.body captura a página inteira.
  const elementoParaCapturar = document.body;

  // Esconde temporariamente o overlay de loading para não aparecer no PDF
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) loadingOverlay.classList.add('hidden');

  try {
    // Tira a "foto" da página inteira usando html2canvas
    const canvas = await html2canvas(elementoParaCapturar, {
      useCORS: true, // Permite carregar imagens de outras origens
      scale: 2,      // Aumenta a resolução para melhor qualidade
      logging: false,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.scrollHeight
    });

    console.log("Captura da página concluída, montando o PDF...");

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Configurações do PDF (usando jsPDF)
    // A orientação 'p' é retrato (portrait), 'l' é paisagem (landscape)
    const pdf = new window.jspdf.jsPDF({
      orientation: 'p',
      unit: 'px',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calcula a proporção para a imagem caber na largura do PDF
    const ratio = imgWidth / pdfWidth;
    const scaledHeight = imgHeight / ratio;

    let heightLeft = scaledHeight;
    let position = 0;

    // Adiciona a primeira página
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    // Adiciona mais páginas se o conteúdo for maior que uma página A4
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    // Gera um nome de arquivo dinâmico com a data
    const dataAtual = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `relatorio-planos-de-acao-${dataAtual}.pdf`;

    // Salva o arquivo
    pdf.save(nomeArquivo);
    console.log(`PDF "${nomeArquivo}" gerado com sucesso!`);

  } catch (error) {
    console.error("Ocorreu um erro ao gerar o PDF:", error);
    alert("Não foi possível gerar o PDF. Verifique o console para mais detalhes.");
  } finally {
    // Garante que o loading seja desativado e o overlay reexibido se necessário
    if (typeof toggleLoading === 'function') {
      toggleLoading(false);
    }
  }
}
















//================================================================================
// cards numéricos da parte inicial da página
//================================================================================
/**
 * Função auxiliar para atualizar o conteúdo de texto de um elemento HTML pelo seu ID.
 * @param {string} id - O ID do elemento a ser atualizado.
 * @param {string | number} text - O texto a ser inserido no elemento.
 */
function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  } else {
    console.warn(`Elemento com ID "${id}" não encontrado.`);
  }
}

/**
 * Retorna a forma singular ou plural de uma string com base em uma contagem.
 * @param {number} count - O número para determinar se a string deve ser singular ou plural.
 * @param {string} singular - A forma singular da palavra (ex: 'plano').
 * @param {string} plural - A forma plural da palavra (ex: 'planos').
 * @returns {string}
 */
function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

/**
 * Mostra ou oculta um elemento com base em uma contagem.
 * @param {number} count - Se 0, o elemento será oculto; caso contrário, será mostrado.
 * @param {string} elementId - O ID do elemento a ser manipulado.
 */
function toggleVisibility(count, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = count > 0 ? '' : 'none';
  }
}


/**
 * Formata uma duração em dias para uma string mais legível (ex: "15 dias" ou "2 meses").
 * @param {number} totalDays - O número total de dias.
 * @returns {string} A duração formatada.
 */
function formatarDuracao(totalDays) {
  if (isNaN(totalDays) || totalDays <= 0) {
    return 'N/A';
  }
  const diasPorMes = 30.44;
  if (totalDays >= diasPorMes) {
    const meses = Math.round(totalDays / diasPorMes);
    return `${meses} ${pluralize(meses, 'mês', 'meses')}`;
  } else {
    const dias = Math.round(totalDays);
    return `${dias} ${pluralize(dias, 'dia', 'dias')}`;
  }
}

/**
 * Processa os dados de planos e atualiza os cards de "Planos de Ação".
 * @param {Array} planos - O array de dados dos planos. Usa window.jsonPlanos como fallback.
 * @param {Array} acoes - O array de dados das ações. Usa window.jsonAcoes como fallback.
 */
function processPlanosData(planos = window.jsonPlanos, acoes = window.jsonAcoes) {
  if (!planos || planos.length === 0) return;

  let emCurso = 0, emDesenvolvimento = 0, concluidos = 0, pendentes = 0, aIniciar = 0;
  let totalDuracaoDias = 0, planosParaCalculoMedia = 0;
  const idsPlanosPendentes = new Set();

  planos.forEach(plano => {
    switch (plano.Status) {
      case 'Em curso': emCurso++; break;
      case 'Em desenvolvimento': emDesenvolvimento++; break;
      case 'Implementado': concluidos++; break;
      case 'Pendente': pendentes++; idsPlanosPendentes.add(plano.ID); break;
      case 'Planejado': aIniciar++; break;
    }
    const dataInicio = new Date(plano['Data início']);
    const dataFim = new Date(plano['Data fim']);
    if (!isNaN(dataInicio) && !isNaN(dataFim)) {
      const duracao = (dataFim - dataInicio) / (1000 * 60 * 60 * 24);
      if (duracao >= 0) {
        totalDuracaoDias += duracao;
        planosParaCalculoMedia++;
      }
    }
  });

  const acoesPendentes = acoes ? acoes.filter(acao => idsPlanosPendentes.has(acao['Plano de ação'])).length : 0;
  const tempoMedioDias = planosParaCalculoMedia > 0 ? totalDuracaoDias / planosParaCalculoMedia : 0;

  // Card 1: Em curso
  updateElementText('planos-emCurso', emCurso);
  updateElementText('label-planos-emCurso', pluralize(emCurso, 'plano em curso', 'planos em curso'));

  // Card 2: A Ser Iniciado (com detalhe de 'Em Desenvolvimento')
  updateElementText('planos-aIniciar', aIniciar);
  updateElementText('label-planos-aIniciar', pluralize(aIniciar, 'plano a ser iniciado', 'planos a serem iniciados'));
  updateElementText('planos-emDesenvolvimentoSub', emDesenvolvimento);
  toggleVisibility(emDesenvolvimento, 'container-emDesenvolvimento');

  // Cards secundários
  updateElementText('planos-totalCriados', planos.length);
  updateElementText('label-totalCriados', pluralize(planos.length, 'criado', 'criados'));

  updateElementText('planos-totalConcluidosSub', concluidos);
  updateElementText('label-totalConcluidos', pluralize(concluidos, 'concluído', 'concluídos'));
  toggleVisibility(concluidos, 'container-concluidos');

  updateElementText('planos-pendentes', pendentes);
  updateElementText('label-pendentes', pluralize(pendentes, 'pendente', 'pendentes'));

  updateElementText('planos-acoesPendentesSub', acoesPendentes);
  updateElementText('label-acoesPendentes', pluralize(acoesPendentes, 'ação', 'ações'));
  toggleVisibility(acoesPendentes, 'container-acoesPendentes');

  updateElementText('planos-tempoMedio', formatarDuracao(tempoMedioDias));
}

/**
 * Processa os dados de ações e atualiza os cards de "Ações".
 * @param {Array} acoes - O array de dados das ações. Usa window.jsonAcoes como fallback.
 */
function processAcoesData(acoes = window.jsonAcoes) {
  if (!acoes || acoes.length === 0) return;

  let emCurso = 0, emAtraso = 0, planejadas = 0, concluidas = 0, entregasNoMes = 0;
  let iniciamProximos30dias = 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data30dias = new Date();
  data30dias.setDate(hoje.getDate() + 30);

  const mesAtual = hoje.getMonth(), anoAtual = hoje.getFullYear();

  acoes.forEach(acao => {
    const dataFim = new Date(acao['Data fim']);
    if (dataFim.getMonth() === mesAtual && dataFim.getFullYear() === anoAtual) {
      entregasNoMes++;
    }
    switch (acao.Status) {
      case 'Em curso': emCurso++; break;
      case 'Implementado': concluidas++; break;
      case 'Pendente': emAtraso++; break;
      case 'Planejado':
        planejadas++;
        const dataInicio = new Date(acao['Data de início']);
        if (!isNaN(dataInicio) && dataInicio >= hoje && dataInicio <= data30dias) {
          iniciamProximos30dias++;
        }
        break;
    }
  });

  // Atualiza os cards da linha de destaque
  updateElementText('acoes-emCurso', emCurso);
  updateElementText('label-acoes-emCurso', pluralize(emCurso, 'ação em curso', 'ações em curso'));
  updateElementText('acoes-entregarMesSub', entregasNoMes);
  updateElementText('label-entregasMes', pluralize(entregasNoMes, 'entrega este mês', 'entregas este mês'));
  toggleVisibility(entregasNoMes, 'container-entregas');

  updateElementText('acoes-emAtraso', emAtraso);
  updateElementText('label-acoes-emAtraso', pluralize(emAtraso, 'ação em atraso', 'ações em atraso'));

  updateElementText('acoes-planejadas', planejadas);
  updateElementText('label-acoes-aIniciar', pluralize(planejadas, 'a ser iniciada', 'a serem iniciadas'));
  updateElementText('acoes-iniciam30dias', iniciamProximos30dias);
  toggleVisibility(iniciamProximos30dias, 'container-iniciam30dias');

  // Atualiza os novos cards de estatísticas
  updateElementText('acoes-totalCriadas', acoes.length);
  updateElementText('label-acoes-criadas', pluralize(acoes.length, 'criada', 'criadas'));

  updateElementText('acoes-totalConcluidas', concluidas);
  updateElementText('label-acoes-concluidas', pluralize(concluidas, 'concluída', 'concluídas'));
}

/**
 * Função principal para configurar e popular os cards de estatísticas.
 * @param {Array} [planosData=window.jsonPlanos] - Opcional. Dados dos planos.
 * @param {Array} [acoesData=window.jsonAcoes] - Opcional. Dados das ações.
 */
function setupStatCards(planosData = window.jsonPlanos, acoesData = window.jsonAcoes) {
  processPlanosData(planosData, acoesData);
  processAcoesData(acoesData);
}

// Exemplo de chamada:
// document.addEventListener('DOMContentLoaded', setupStatCards);















//================================================================================
// configurações gerais para criar o gantt
//================================================================================
function setupSecaoIA() {
  const sessionStorageKey = 'aiSummaryHTML';

  const aiSummarySection = document.getElementById('ai-summary-section');
  if (!aiSummarySection) {
    console.warn('Elemento #ai-summary-section não encontrado. A funcionalidade da IA não será carregada.');
    return;
  }

  const elements = {
    section: aiSummarySection,
    content: document.getElementById('ai-summary-content'),
    menuContainer: document.getElementById('ai-menu-container'),
    menuButton: document.getElementById('ai-menu-button'),
    menuDropdown: document.getElementById('ai-menu-dropdown'),
    regenerateButton: document.getElementById('ai-regenerate'),
    showPromptButton: document.getElementById('ai-show-prompt'),
    promptModal: document.getElementById('prompt-modal'),
    closeModalButton: document.getElementById('close-modal-button'),
    promptTextContainer: document.getElementById('prompt-text-container')
  };

  const promptText = `Você é um assistente de um sistema de controle e organização de grupos de trabalho. Sua tarefa é gerar um resumo HTML conciso e informativo sobre os principais acontecimentos recentes e futuros, com base nos dados fornecidos.

  **Contexto:**
  
  O sistema gerencia diversos grupos de trabalho, cada um com um "Plano de Ação" específico. Cada plano de ação é composto por várias "Ações" planejadas. As informações são armazenadas em dois arquivos JSON: 'jsonPlanos' e 'jsonAcoes'.
  
  **Estrutura dos Dados:**
  
  *   **'jsonPlanos'**: Contém informações sobre cada plano de ação, incluindo nome, status, datas e as pessoas envolvidas com suas respectivas unidades.
      '''json
      {
          "ID": "string",
          "Nome": "string",
          "Status": "string",
          "Resolução": "string",
          "Data início": "yyyy-mm-dd",
          "Data fim": "yyyy-mm-dd",
          "Observações": "",
          "Processo SEI": "string",
          "SEI relacionados": "",
          "Documento TCE": "string",
          "Documentos relacionados": "string",
          "objPessoas": [
              {
                  "Nome": "string",
                  "Email": "string",
                  "Unidade": "string",
                  "Coordenador": "booleano"
              }
          ]
      }
      '''
  
  *   **'jsonAcoes'**: Detalha cada ação planejada dentro de um plano de ação, incluindo descrição, status, unidades responsáveis e prazos.
      '''json
      {
          "ID": "string",
          "Plano de ação": "string",
          "Número da atividade": "string",
          "Atividade": "string",
          "Descrição da atividade": "string",
          "Status": "string",
          "Unidades": ["array de strings"],
          "Data de início": "yyyy-mm-dd",
          "Data fim": "yyyy-mm-dd",
          "Observações": "string"
      }
      '''
  
  **Valores de Status:**
  
  O campo "Status" pode conter os seguintes valores:
  *   **Em desenvolvimento**
  *   **Planejado**
  *   **Em curso**
  *   **Em revisão**
  *   **Pendente**: Indica que a atividade está em atraso.
  *   **Implementado**: Indica que a atividade foi concluída.
  
  **Como relacionar os dados:**
  
  1.  O campo 'jsonPlanos["Nome"]' se conecta com o campo 'jsonAcoes["Plano de ação"]'.
  2.  Para identificar os responsáveis por uma ação, utilize as unidades listadas em 'jsonAcoes["Unidades"]' e filtre as pessoas em 'jsonPlanos["objPessoas"]' que pertencem a essas unidades dentro do plano de ação correspondente.
  
  **Sua Tarefa:**
  
  Analise os dados dos dois arquivos JSON que serão fornecidos e gere um resumo dos pontos mais importantes que estão acontecendo.
  
  **Diretrizes para o Resumo:**
  
  *   **Formato de Saída:** Gere apenas o resumo em formato **HTML**.
  *   **Tags Permitidas:** Utilize as seguintes tags HTML: '<p>', '<br>', '<b>', '<i>', '<ul>', '<li>', '<ol>'. **É recomendado o uso de listas ('<ul>', '<ol>', '<li>') para organizar as informações de forma clara.**
  *   **Links para Planos de Ação:** Sempre que mencionar o nome de um plano de ação, ele deve estar dentro de uma tag '<a>' com o seguinte formato: '<a href="../acoes/index.html?plano_de_acao=NomePlanoEncoded">NomePlano</a>', onde 'NomePlanoEncoded' é o nome do plano codificado para URL.
  
  **Estrutura do Conteúdo:**
  
  1.  **Análise do Mês/Semestre:**
      *   Inicie com uma única frase que transmita um "sentimento" para o período atual, com base na quantidade de ações sendo iniciadas, em curso ou concluídas. Por exemplo: "<i>Este período está movimentado, com diversas ações importantes chegando em sua fase final.</i>".
  
  2.  **Principais Alertas:**
      *   Crie um parágrafo conciso para os alertas mais críticos. Destaque em negrito ('<b>') os pontos de atenção.
      *   Mencione planos com ações próximas da data de conclusão.
      *   Aponte planos que possuem ações com o status **Pendente**.
      *   Informe sobre planos ou ações que foram recentemente concluídos (status **Implementado**).
  
  3.  **Resumo dos Acontecimentos:**
      *   Elabore um resumo um pouco mais detalhado sobre os principais acontecimentos recentes e futuros.
      *   Foque em ações e planos de ação cujas datas de início ou fim ocorreram aproximadamente no **último mês** ou estão previstas para o **próximo mês**.
      *   Mencione planos de ação recém-iniciados ou finalizados, e ações importantes que estão em andamento ou prestes a começar.
  
  A seguir, estão os dados para sua análise. Gere apenas o resumo em formato HTML.`;


  // ----------------------------------------------------------------
  // 2. Funções Derivadas
  // ----------------------------------------------------------------

  /**
   * Aplica estilos Tailwind ao HTML bruto recebido da IA.
   * @param {string} htmlString - O HTML gerado pela IA.
   * @returns {string} O HTML com as classes de estilo aplicadas.
   */
  const sanitizeAndStyleAIHtml = (htmlString) => {
    // Cria um elemento temporário para manipular o DOM sem afetar a página
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // Adiciona classes para as listas terem marcadores
    tempDiv.querySelectorAll('ul').forEach(ul => {
      ul.classList.add('list-disc', 'list-inside', 'space-y-1');
    });
    tempDiv.querySelectorAll('ol').forEach(ol => {
      ol.classList.add('list-decimal', 'list-inside', 'space-y-1');
    });

    // Adiciona classes para sublinhar os links
    tempDiv.querySelectorAll('a').forEach(a => {
      a.classList.add('underline', 'text-sky-600', 'hover:text-sky-800', 'transition-colors');
    });

    return tempDiv.innerHTML;
  };

  /**
   * Busca o resumo da IA, aplica os estilos e salva no cache.
   */
  const fetchAiSummary = () => {
    const url = 'https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0bed85406ecc44c5977d05a3336e9b2b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=L4sL4qFUHHIMnbwunw0baFlcBknWeelupnxfboF4MBM';

    elements.content.innerHTML = `<div class="flex items-center justify-center p-4"><div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-sky-600 border-t-transparent mr-3"></div><p class="text-slate-500">Gerando novo resumo, isso pode levar alguns segundos...</p></div>`;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
        return response.text();
      })
      .then(rawHtml => {
        const styledHtml = sanitizeAndStyleAIHtml(rawHtml);
        elements.content.innerHTML = styledHtml;
        sessionStorage.setItem(sessionStorageKey, styledHtml); // Salva a versão já estilizada
      })
      .catch(error => {
        console.error('Falha ao buscar o resumo da IA:', error);
        elements.content.innerHTML = `<div class="text-center p-4 bg-red-50 text-red-700 rounded-lg"><p><b>Ocorreu um erro ao gerar o resumo.</b></p><p class="text-sm">Por favor, tente novamente mais tarde.</p></div>`;
      });
  };

  /**
   * Carrega o resumo, priorizando o cache da sessão.
   */
  const loadAiSummary = () => {
    const cachedSummary = sessionStorage.getItem(sessionStorageKey);
    if (cachedSummary) {
      elements.content.innerHTML = cachedSummary;
    } else {
      fetchAiSummary();
    }
  };

  /**
   * Configura todos os ouvintes de eventos.
   */
  const setupEventListeners = () => {
    elements.menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      elements.menuDropdown.classList.toggle('hidden');
    });

    elements.regenerateButton.addEventListener('click', (e) => {
      e.preventDefault();
      fetchAiSummary();
      elements.menuDropdown.classList.add('hidden');
    });

    elements.showPromptButton.addEventListener('click', (e) => {
      e.preventDefault();
      elements.promptModal.classList.remove('hidden');
      elements.menuDropdown.classList.add('hidden');
    });

    elements.closeModalButton.addEventListener('click', () => {
      elements.promptModal.classList.add('hidden');
    });

    elements.promptModal.addEventListener('click', (event) => {
      if (event.target === elements.promptModal) {
        elements.promptModal.classList.add('hidden');
      }
    });

    window.addEventListener('click', (event) => {
      if (!elements.menuContainer.contains(event.target)) {
        elements.menuDropdown.classList.add('hidden');
      }
    });
  };

  // ----------------------------------------------------------------
  // 3. Execução e Inicialização
  // ----------------------------------------------------------------

  elements.promptTextContainer.textContent = promptText;
  setupEventListeners();
  loadAiSummary();
}















//================================================================================
// configurações gerais para criar o gantt
//================================================================================
function fillGanttData(jsonPlanos) {
  const root = document.documentElement;
  const monthWidth = parseInt(getComputedStyle(root).getPropertyValue('--month-width'))

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const taskListContainer = document.getElementById('gantt-task-list');
  const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
  const monthsHeader = document.getElementById('gantt-months-header');
  const ganttRowsContainer = document.getElementById('gantt-rows');

  ganttRowsContainer.innerHTML = ""
  taskListContainer.innerHTML = "";
  monthsHeader.innerHTML = "";
  ganttTimelineContainer.scrollLeft = 0;

  //================================================================================
  // Calcula e cria as colunas de meses
  //================================================================================
  let minDate = new Date(Math.min(
    ...jsonPlanos
      .filter(task => task["Data início"])
      .map(task => new Date(task["Data início"] + 'T10:00:00'))
  ));
  let maxDate = new Date(Math.max(
    ...jsonPlanos
      .filter(task => task["Data fim"] || task["Data início"])
      .map(task => new Date(task["Data fim"] ? task["Data fim"] + 'T10:00:00' : task["Data início"] + 'T10:00:00'))
  ));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (minDate > today) minDate = new Date(today);
  if (maxDate < today) maxDate = new Date(today);

  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 2);

  let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let currentDate = new Date(firstMonth);
  let timelineWidth = 0;

  while (currentDate <= maxDate) {
    const monthElement = document.createElement('div');
    monthElement.className = 'flex-shrink-0 text-center text-sm font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap py-[10px] border-r border-[#e0e0e0] box-border w-[var(--month-width)]';
    monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    monthsHeader.appendChild(monthElement);
    timelineWidth += monthWidth;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  ganttRowsContainer.style.width = `${timelineWidth}px`;
  monthsHeader.style.width = `${timelineWidth}px`;

  function calculatePosition(date) {
    const targetDate = new Date(date + 'T10:00:00');
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthsDiff = (year - firstMonth.getFullYear()) * 12 + (month - firstMonth.getMonth());
    const dayOfMonth = targetDate.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOffset = (dayOfMonth / daysInMonth) * monthWidth;
    return (monthsDiff * monthWidth) + dayOffset;
  }

  const positionToday = calculatePosition(new Date().toLocaleDateString().split("/").reverse().join("-"));
  const todayBar = document.createElement('div');
  todayBar.id = 'todayBar';
  todayBar.className = 'absolute h-full border-l-2 border-dashed border-[lightcoral] z-[1]';
  ganttRowsContainer.appendChild(todayBar);
  todayBar.style.left = `${positionToday}px`;
  document.getElementById("todayBar").style.left = `${positionToday}px`;
  ganttTimelineContainer.scrollLeft = positionToday - 100;

  //================================================================================
  // Preenche os valores no gantt
  //================================================================================
  const statusColorMap = {
    'Em desenvolvimento': 'bg-gray-100 text-gray-700 border border-gray-200',
    'Planejado': 'bg-slate-100 text-slate-700 border border-slate-200',
    'Em curso': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    'Implementado': 'bg-green-100 text-green-700 border border-green-200',
    'Pendente': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Cancelado': 'bg-red-100 text-red-700 border border-red-200'
  };

  jsonPlanos.forEach((task, index) => {
    const statusClass = statusColorMap[task.Status] || 'bg-gray-100 text-gray-800';

    // Cálculo de progresso para o plano
    const acoesDoPlano = jsonAcoes.filter(acao => acao["Plano de ação"] === task.Nome);
    const totalAcoes = acoesDoPlano.length;
    const concluidas = acoesDoPlano.filter(acao => acao.Status === 'Implementado').length;
    const percentualConclusao = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

    const taskRow = document.createElement('div');
    taskRow.className = 'gantt-row-task';
    taskRow.dataset.rowIndex = index;
    taskRow.innerHTML = `
            <div class="font-medium text-slate-700 overflow-hidden text-ellipsis">${task.Nome}</div>
            <div class="status-container">
              <div class="${statusClass}">${task.Status || '-'}</div>
            </div>
        `;
    taskListContainer.appendChild(taskRow);

    const rowTimeline = document.createElement('div');
    rowTimeline.className = 'gantt-row-timeline';
    rowTimeline.dataset.rowIndex = index;

    if (task["Data início"] && task["Data fim"]) {
      const startDate = task["Data início"]
      const endDate = task["Data fim"]
      const startOffset = calculatePosition(startDate);
      const endOffset = endDate ? calculatePosition(endDate) : startOffset + 10;
      const durationWidth = endOffset - startOffset;

      const bar = document.createElement('div');
      // Cores base para a barra (track mais visível no heatmap)
      bar.className = `absolute h-[22px] gantt-bar-container rounded-[11px] top-1/2 -translate-y-1/2 z-[1] overflow-hidden`;
      bar.style.left = `${startOffset}px`;
      bar.style.width = `${durationWidth}px`;
      bar.title = `${task.Nome}: ${percentualConclusao}% concluído (${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()})`;

      // Cria a barra de progresso interno
      const progressOverlay = document.createElement('div');
      progressOverlay.className = `gantt-progress-bar bg-sky-600`;
      progressOverlay.style.width = `${percentualConclusao}%`;
      bar.appendChild(progressOverlay);

      rowTimeline.appendChild(bar);
    }

    ganttRowsContainer.appendChild(rowTimeline);
  });

  //================================================================================
  // resize das colunas
  //================================================================================
  const resizers = document.querySelectorAll('.gantt-tasks-header .resizer');
  let currentResizer;
  resizers.forEach(resizer => {
    resizer.addEventListener('mousedown', (e) => {
      currentResizer = e.target;
      e.preventDefault();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      function onMouseMove(e) {
        const root = document.documentElement;
        const prevSibling = currentResizer.parentElement;
        const rect = prevSibling.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 40) {
          const colIdentifier = prevSibling.dataset.col;
          if (colIdentifier === 'num') {
            root.style.setProperty('--col-num-width', `${newWidth}px`);
          } else if (colIdentifier === 'plano') {
            root.style.setProperty('--col-plano-width', `${newWidth}px`);
          } else if (colIdentifier === 'atividade') {
            root.style.setProperty('--col-atividade-width', `${newWidth}px`);
          } else if (colIdentifier === 'status') {
            root.style.setProperty('--col-status-width', `${newWidth}px`);
          }
        }
      }
      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    });
  });

  //================================================================================
  // Cabeçalho da linha de totais do gantt
  //================================================================================
  taskListContainer.innerHTML += `
    <div class="gantt-row-task">
      <div style="grid-column: 1 / 3; color: gray;">
        <span style="font-weight: bold;">Total de ações:</span>
        <select id="select-heatmap">
          <option selected value="encerrando">encerrando no mês</option>
          <option value="acontecendo">acontecendo no mês</option>
          <option value="desativado">heatmap desativado</option>
        </select>
      </div>
    </div>`

  document.getElementById('select-heatmap').addEventListener("change", toggleHeatMap)

  toggleHeatMap()
}

//================================================================================
// Heatmap bakground timeline
//================================================================================
function toggleHeatMap() {
  const ganttRowsContainer = document.getElementById('gantt-rows');
  document.querySelectorAll(".gantt-heatmap").forEach(el => el.remove());
  document.querySelectorAll(".gantt-total-row").forEach(el => el.remove());

  const estilo = document.getElementById('select-heatmap').value;

  if (estilo == "destivado") {
    return
  }

  const heatMap = {};

  const root = document.documentElement;
  const monthWidth = parseInt(getComputedStyle(root).getPropertyValue('--month-width'))
  let minDate = new Date(Math.min(
    ...jsonPlanos
      .filter(task => task["Data início"])
      .map(task => new Date(task["Data início"] + 'T10:00:00'))
  ));
  let maxDate = new Date(Math.max(
    ...jsonPlanos
      .filter(task => task["Data fim"] || task["Data início"])
      .map(task => new Date(task["Data fim"] ? task["Data fim"] + 'T10:00:00' : task["Data início"] + 'T10:00:00'))
  ));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (minDate > today) minDate = new Date(today);
  if (maxDate < today) maxDate = new Date(today);

  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 2);

  let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let heatDate = new Date(firstMonth);
  let monthIndex = 0;

  while (heatDate <= maxDate) {
    const inicioDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth(), 1, 0, 0);
    const fimDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth() + 1, 0, 23, 59, 59, 999);

    let count = 0;

    if (estilo === "encerrando") {
      jsonAcoes.forEach((acao, i) => {
        if (acao["Data fim"]) {
          const end = new Date(acao["Data fim"] + 'T10:00:00');
          if (end >= inicioDoMes && end <= fimDoMes) {
            count++;
          }
        }
      });
    } else if (estilo === "acontecendo") {
      // conta quem está ativo em qualquer parte do mês
      jsonAcoes.forEach(acao => {
        if (acao["Data de início"] && acao["Data fim"]) {
          const start = new Date(acao["Data de início"] + 'T10:00:00');
          const end = new Date(acao["Data fim"] + 'T10:00:00');
          if (start <= fimDoMes && end >= inicioDoMes) {
            count++;
          }
        }
      });
    }

    const key = `${heatDate.getFullYear()}-${heatDate.getMonth()}`;
    heatMap[key] = count;

    heatDate.setMonth(heatDate.getMonth() + 1);
    monthIndex++;
  }

  const maxCount = Math.max(...Object.values(heatMap), 1);

  const totalMonths = monthIndex;
  const timelineWidth = totalMonths * monthWidth;

  heatDate = new Date(firstMonth);
  monthIndex = 0;
  while (heatDate <= maxDate) {
    const key = `${heatDate.getFullYear()}-${heatDate.getMonth()}`;
    const count = heatMap[key] || 0;

    const normalizedIntensity = count / maxCount;
    const color = `rgba(219, 37, 37, ${normalizedIntensity * 0.7})`;

    const heatDiv = document.createElement('div');
    heatDiv.className = 'gantt-heatmap';
    heatDiv.style.position = 'absolute';
    heatDiv.style.left = `${monthIndex * monthWidth}px`;
    heatDiv.style.top = '0';
    heatDiv.style.width = `${monthWidth}px`;
    heatDiv.style.height = '100%';
    heatDiv.style.background = color;
    heatDiv.style.pointerEvents = 'none';
    ganttRowsContainer.appendChild(heatDiv);

    heatDate.setMonth(heatDate.getMonth() + 1);
    monthIndex++;
  }

  //================================================================================
  // linha de totais
  //================================================================================
  const totalRow = document.createElement('div');
  totalRow.className = 'flex absolute left-0 top-full h-[30px] bg-[#f8f8f8] border-t border-gray-300 z-[2] text-base items-center';
  totalRow.style.display = 'flex';
  totalRow.style.width = `${timelineWidth}px`;

  let totalDate = new Date(firstMonth);
  let totalIndex = 0;
  while (totalDate <= maxDate) {
    const key = `${totalDate.getFullYear()}-${totalDate.getMonth()}`;
    const count = heatMap[key] || 0;

    const cell = document.createElement('div');
    cell.className = 'h-full flex items-center justify-center font-bold text-gray-500';
    cell.style.width = `${monthWidth}px`;
    cell.style.textAlign = 'center';
    cell.textContent = count;

    totalRow.appendChild(cell);

    totalDate.setMonth(totalDate.getMonth() + 1);
    totalIndex++;
  }
  ganttRowsContainer.appendChild(totalRow);
}















//================================================================================
// Cria os cards dos planos de ação
//================================================================================
/**
 * Cria todos os cards com informações dos planos de ação.
 * @param {object} jsonPlanos - O objeto JSON contendo os dados dos planos.
 */
function gerarCards(jsonPlanos) {
  const container = document.querySelector('.card-container');
  if (!container) return;

  container.innerHTML = jsonPlanos.map(plano => {
    // Lógica para formatar as datas
    const dataInicio = plano["Data início"]
      ? plano["Data início"].includes('-')
        ? plano["Data início"].split('-').reverse().join('/')
        : plano["Data início"]
      : '-';
    const dataFim = plano["Data fim"]
      ? typeof plano["Data fim"] === "string" && plano["Data fim"].includes('-')
        ? plano["Data fim"].split('-').reverse().join('/')
        : plano["Data fim"]
      : '-';

    // Garante que nomes com espaços ou caracteres especiais funcionem na URL
    const planoNomeEncoded = encodeURIComponent(plano.Nome);

    // --- Lógica para calcular o resumo das ações ---
    const acoesDoPlano = jsonAcoes.filter(acao => acao["Plano de ação"] === plano.Nome);
    const totalAcoes = acoesDoPlano.length;
    const concluidas = acoesDoPlano.filter(acao => acao.Status === 'Implementado').length;
    const emAndamento = acoesDoPlano.filter(acao => acao.Status === 'Em curso').length;
    const percentualConclusao = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

    // Mapeia o status a uma cor para a tag, alinhado ao padrão visual original
    const statusColorMap = {
      // Baseado em #e0e0e0 (cinza neutro)
      'Em desenvolvimento': 'bg-gray-100 text-gray-700 border border-gray-200',

      // Baseado em #cfd4da (cinza frio/azulado)
      'Planejado': 'bg-slate-100 text-slate-700 border border-slate-200',

      // Baseado em #17a2b8 (ciano/azul)
      'Em curso': 'bg-cyan-100 text-cyan-700 border border-cyan-200',

      // Baseado em #198754 (verde)
      'Implementado': 'bg-green-100 text-green-700 border border-green-200',

      // Baseado em #ffdd57 (amarelo)
      'Pendente': 'bg-yellow-100 text-yellow-700 border border-yellow-200',

      // Cor para o status Cancelado
      'Cancelado': 'bg-red-100 text-red-700 border border-red-200'
    };
    const statusClass = statusColorMap[plano.Status] || 'bg-gray-100 text-gray-800';

    // --- Lógica condicional para o HTML do resumo das ações ---
    let resumoAcoesHtml = ''; // Inicia como string vazia
    if (plano.Status !== 'Em desenvolvimento') {
      // A seção só é criada se o status NÃO for 'Em desenvolvimento'
      resumoAcoesHtml = `
            <div class="pt-2 border-t border-slate-200 space-y-2">
                <!-- Números das Ações -->
                <div class="flex justify-between items-center text-sm text-slate-500">
                    <span class="font-bold">Ações:</span>
                    <div class="flex items-center gap-4 text-xs font-medium">
                        <span title="Total de Ações">Total: <strong class="text-slate-700 text-sm">${totalAcoes}</strong></span>
                        <span title="Ações Concluídas">Concluídas: <strong class="text-slate-700 text-sm">${concluidas}</strong></span>
                        <span title="Ações Em Curso">Em curso: <strong class="text-slate-700 text-sm">${emAndamento}</strong></span>
                    </div>
                </div>
                <!-- Barra de progresso -->
                <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-sky-700 w-10 text-right">${percentualConclusao}%</span>
                    <div class="w-full bg-slate-200 rounded-full h-1.5">
                        <div class="bg-sky-600 h-1.5 rounded-full" style="width: ${percentualConclusao}%" title="${percentualConclusao}% Concluído"></div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
      <div class="relative bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col
                  transition-all duration-300 hover:shadow-md">
        
        <div class="absolute top-0 right-0 p-2">
          <div class="relative">
            <!-- Botão que abre o menu -->
            <button type="button" class="card-menu-button rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            <!-- O menu suspenso (dropdown) -->
            <div class="card-menu-dropdown hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10">
              <div class="py-1">
                <a href="../detalhes_plano/index.html?id=${plano.ID}" class="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 font-semibold text-sky-700 bg-slate-50">
                    Ver Detalhes do Plano
                </a>
                
                <div class="border-t border-slate-100 my-1"></div>

                <button type="button" 
                        class="edit-plano-button block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        data-plan-id="${plano.ID}">
                  Editar
                </button>
                <button type="button" 
                        class="delete-plano-button block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        data-plan-id="${plano.ID}">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
                
        <div class="flex-grow">
          <a href="../detalhes_plano/index.html?id=${plano.ID}" class="pr-8 text-lg font-bold text-sky-800 tracking-normal hover:underline">${plano.Nome}</a>
          <div class="mt-2 space-y-1 text-sm text-slate-500">
            <p><strong class="font-medium text-slate-600">SEI de origem:</strong> ${plano["Processo SEI"]}</p>
            <p><strong class="font-medium text-slate-600">Documento TCE:</strong> ${plano["Documento TCE"]}</p>
          </div>
        </div>
        
        <div class="mt-4">
          <details class="text-sm group mb-3">
            <summary class="font-medium text-slate-500 cursor-pointer list-none flex items-center gap-1
                            hover:text-slate-700 group-open:text-sky-700">
              Mais detalhes
              <span class="inline-block text-base font-bold text-slate-400 transition-transform duration-300 group-open:rotate-90">›</span>
            </summary>
            <div class="mt-2 pt-2 pl-2 text-slate-500 border-l-2 border-slate-200 space-y-2">
              <p><strong class="font-medium text-slate-600">Resolução:</strong> ${plano.Resolução || '-'}</p>
              <div>
                <strong class="font-medium text-slate-600">Equipe:</strong>
                <ul class="ml-4 list-disc space-y-1 text-xs">
                  ${plano.objPessoas && plano.objPessoas.length > 0
        ? plano.objPessoas.map(pessoa => `
                      <li class="relative">
                        <span 
                          class="font-medium ${pessoa.Email ? 'text-blue-600 underline cursor-pointer' : 'text-slate-500'}" 
                          ${pessoa.Email ? `onmouseenter="cardShowTooltip(event, '${pessoa.Email}')" onmousemove="cardMoveTooltip(event)" onmouseleave="cardHideTooltip()" onclick="cardCopyEmail(event, '${pessoa.Email}')"` : ''}>
                          ${pessoa.Nome}</span>
                        <span class="text-slate-400">(${pessoa.Unidade || '-'})</span>
                        ${pessoa.Coordenador ? '<span class="text-slate-500 font-medium">[Coordenador]</span>' : ''}
                      </li>
                        `).join('')
        : '<li class="text-slate-400">Nenhuma equipe atribuída.</li>'
      }
                </ul>
              </div>
              <p><strong class="font-medium text-slate-600">SEI relacionados:</strong> ${plano['SEI relacionados'] || '-'}</p>
              <p><strong class="font-medium text-slate-600">Documentos relacionados:</strong> ${plano['Documentos relacionados'] || '-'}</p>
              <p><strong class="font-medium text-slate-600">Observações:</strong> ${plano['Observações'] || '-'}</p>
            </div>
          </details>
        
          <!-- Resumo das Ações (agora condicional e mais compacto) -->
          ${resumoAcoesHtml}
        
          <!-- Rodapé com Status e Datas -->
          <div class="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <div>
                  <span class="px-2 py-1 text-xs font-semibold rounded-md ${statusClass}">${plano.Status}</span>
              </div>
              <div class="flex gap-4 text-slate-500 font-medium">
                  <p><strong>Início:</strong> <span class="font-semibold text-slate-600">${dataInicio}</span></p>
                  <p><strong>Fim:</strong> <span class="font-semibold text-slate-600">${dataFim}</span></p>
              </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const addCardHtml = `
      <button id="add-new-plano-button" type="button" 
              class="relative flex flex-col items-center justify-center 
                     border-2 border-dashed border-slate-300 rounded-xl p-5 
                     text-slate-400 hover:border-sky-500 hover:text-sky-600 
                     transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400">
        
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span class="mt-2 font-bold text-lg">Criar Novo Plano</span>
      </button>
    `;

  container.innerHTML += addCardHtml;

  // Ativa a interatividade dos menus e botões
  setupAddButton();
  setupCardMenus();
}
let tooltipElement = null;
let hideTimeout = null;

function cardShowTooltip(event, email) {
  if (!email) return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (tooltipElement) {
    tooltipElement.remove();
  }

  tooltipElement = document.createElement('div');
  tooltipElement.textContent = email;
  tooltipElement.style.position = 'fixed';
  tooltipElement.style.left = event.clientX + 10 + 'px';
  tooltipElement.style.top = event.clientY + 20 + 'px';
  tooltipElement.style.background = '#1e293b'; // slate-700
  tooltipElement.style.color = '#fff';
  tooltipElement.style.padding = '2px 6px';
  tooltipElement.style.borderRadius = '4px';
  tooltipElement.style.fontSize = '0.75rem';
  tooltipElement.style.fontWeight = '500';
  tooltipElement.style.pointerEvents = 'none';
  tooltipElement.style.zIndex = '9999';
  tooltipElement.style.opacity = '0';
  tooltipElement.style.transition = 'opacity 0.2s';

  document.body.appendChild(tooltipElement);

  requestAnimationFrame(() => {
    tooltipElement.style.opacity = '1';
  });
}

function cardMoveTooltip(event) {
  if (!tooltipElement) return;
  tooltipElement.style.left = event.clientX + 10 + 'px';
  tooltipElement.style.top = event.clientY + 20 + 'px';
}

function cardHideTooltip() {
  if (!tooltipElement) return;

  tooltipElement.style.opacity = '0';

  hideTimeout = setTimeout(() => {
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
    hideTimeout = null;
  }, 200);
}

function cardCopyEmail(event, email) {
  if (!email) return;

  // Copia o email
  navigator.clipboard.writeText(email).then(() => {
    // Cria tooltip dinamicamente sobre o cursor
    let tooltip = document.createElement('span');
    tooltip.textContent = 'Email copiado!';
    tooltip.style.position = 'fixed';
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = (event.clientY - 25) + 'px';
    tooltip.style.background = '#1e293b'; // slate-700
    tooltip.style.color = '#fff';
    tooltip.style.padding = '2px 6px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '0.75rem';
    tooltip.style.fontWeight = '500';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s';

    document.body.appendChild(tooltip);

    // Força animação
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
    });

    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, 1200);
  });
}


/**
 * Adiciona o listener de clique ao botão "Criar Novo Plano".
 */
function setupAddButton() {
  const addButton = document.getElementById('add-new-plano-button');
  if (addButton) {
    addButton.addEventListener('click', () => { window.openModalForNewPlan(); });
  }
}

/**
 * Adiciona eventos no menu do card (três pontinhos).
 */
function setupCardMenus() {
  const allMenuButtons = document.querySelectorAll('.card-menu-button');

  allMenuButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Impede que o clique no botão feche o menu imediatamente (veja o listener do window)
      event.stopPropagation();

      const dropdown = button.nextElementSibling;
      const isHidden = dropdown.classList.contains('hidden');

      // Primeiro, fecha todos os outros menus abertos
      document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));

      // Se o menu clicado estava escondido, mostra ele
      if (isHidden) {
        dropdown.classList.remove('hidden');
      }
    });
  });

  // Listener global para fechar os menus se o usuário clicar fora deles
  window.addEventListener('click', () => {
    document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.add('hidden'));
  });
}

// Modal logic handled by modalPlanos.js















//================================================================================
// painel de filtros
//================================================================================

// configurações gerais
// [nome do filtro, id do select, está dentro do objPessoa]
const filtersConfig = [
  ["Unidade", "filter-Unidade", true],
  ["Nome", "filter-Nome", true]
]

function setupFilters() {
  // adiciona eventos para todos filtros listados em filtersConfig
  filtersConfig.forEach(([chave, elementId]) => {
    fillFilterObjPessoas(chave)

    if (window.onCustomSelectChange) {
      window.onCustomSelectChange(elementId, aplicarFiltros);
    } else {
      const el = document.getElementById(elementId)
      if (el) {
        el.addEventListener('change', aplicarFiltros)
      }
    }
  })

  // período
  document.getElementById('filter-periodo')
    .addEventListener('change', function () {
      const inputsDiv = document.getElementById('periodo-especifico-inputs')
      inputsDiv.style.display = (this.value === 'especifico') ? 'flex' : 'none'
      if (this.value !== 'especifico') aplicarFiltros()
    })

  // período específico
  document.getElementById('filtrar-especifico')
    .addEventListener('click', aplicarFiltros)
}

/**
 * Normaliza string para comparação
 */
function normalizeString(str) {
  if (!str) return ""
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "")
}

/**
 * Aplica todos os filtros ativos e atualiza as seções
 */
function aplicarFiltros() {
  let jsonFiltrado = [...jsonPlanos]

  // filtros (Unidade, Nome, etc.)
  filtersConfig.forEach(([chave, elementId, isObjPessoa]) => {
    const selectedValues = window.getCustomSelectValues ? window.getCustomSelectValues(elementId) : [];
    const filterElement = document.getElementById(elementId);
    if (!filterElement) return;

    const customComponent = document.querySelector(`.custom-select-container[data-select-id="${elementId}"]`);

    if (selectedValues.length === 0) {
      filterElement.classList.remove('filter-active');
      if (customComponent) customComponent.querySelector('.relative.z-10').classList.remove('border-sky-500', 'font-semibold');
      return;
    } else {
      jsonFiltrado = isObjPessoa
        ? filterJsonObjPessoa(jsonFiltrado, chave, selectedValues)
        : filterJson(jsonFiltrado, chave, selectedValues);

      filterElement.classList.add('filter-active');
      if (customComponent) customComponent.querySelector('.relative.z-10').classList.add('border-sky-500', 'font-semibold');
    }
  });

  // filtro por período
  const periodoElement = document.getElementById('filter-periodo')
  const periodo = periodoElement.value
  if (periodo && periodo !== '-') {
    jsonFiltrado = filtrarPorPeriodo(jsonFiltrado, periodo)
    periodoElement.classList.add('filter-active')
  } else {
    periodoElement.classList.remove('filter-active')
  }

  // aplica nas seções
  const acoesFiltradas = jsonAcoes.filter(a => jsonFiltrado.some(p => p.Nome === a['Plano de ação']));
  setupStatCards(jsonFiltrado, acoesFiltradas);
  fillGanttData(jsonFiltrado);
  gerarCards(jsonFiltrado);
}

/**
 * Filtro genérico chave/valor
 */
function filterJson(json, chave, valoresSelecionados) {
  return json.filter(item => {
    const val = normalizeString(item[chave]);
    return valoresSelecionados.includes(val);
  })
}

/**
 * Filtro genérico chave/valor para valores dentro do objeto pessoa
 */
function filterJsonObjPessoa(json, chave, valoresSelecionados) {
  return json.filter(item => {
    const pessoas = item.objPessoas;
    if (!Array.isArray(pessoas)) return false;

    // verifica se alguma pessoa dentro do array tem a chave com algum dos valores selecionados
    return pessoas.some(pessoa => {
      const val = normalizeString(pessoa[chave]);
      return valoresSelecionados.includes(val);
    });
  });
}

/**
 * Limpa filtros
 */
function clearFilters() {
  filtersConfig.forEach(([, elementId]) => {
    const el = document.getElementById(elementId);
    if (el) {
      Array.from(el.options).forEach(opt => opt.selected = false);
      if (window.createCustomSelect) window.createCustomSelect(elementId);
    }
  })
  document.getElementById('filter-periodo').value = '-'
  document.getElementById('periodo-especifico-inputs').style.display = 'none'

  aplicarFiltros()
}

/**
 * Preenche filtro de equipe
 */
function fillFilterObjPessoas(key) {
  const filtro = document.getElementById(`filter-${key}`)
  let valores = []

  Object.values(jsonPlanos).forEach(item => {
    const objPessoas = item.objPessoas || [];
    objPessoas.forEach(pessoa => {
      valores.push(pessoa[key]);
    });
  });

  valores = [...new Set(valores)].filter(v => v.trim() !== '').sort()

  valores.forEach(valor => {
    const option = document.createElement('option')
    option.value = normalizeString(valor)
    option.textContent = valor
    filtro.appendChild(option)
  })

  // Se o componente de multiple select estiver carregado, inicializa para este filtro
  if (window.createCustomSelect) {
    window.createCustomSelect(`filter-${key}`);
  }
}

/**
 * Filtra lista pelo período selecionado
 */
function filtrarPorPeriodo(lista, periodo) {
  let inicio, fim

  if (periodo === 'mes') {
    const now = new Date()
    inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  } else if (periodo === 'semana') {
    const now = new Date()
    inicio = new Date(now)
    inicio.setDate(now.getDate() - now.getDay() + 1)
    inicio.setHours(0, 0, 0, 0)
    fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 4)
    fim.setHours(23, 59, 59, 999)

  } else if (periodo === 'especifico') {
    const inicioVal = document.getElementById('periodo-inicio').value
    const fimVal = document.getElementById('periodo-fim').value
    if (!inicioVal || !fimVal) return lista

    inicio = new Date(inicioVal); inicio.setHours(0, 0, 0, 0)
    fim = new Date(fimVal); fim.setHours(23, 59, 59, 999)
  }

  if (inicio && fim) {
    return lista.filter(task => {
      const start = new Date(task["Data início"])
      const end = new Date(task["Data fim"])
      return (start <= fim && end >= inicio)
    })
  }

  return lista
}