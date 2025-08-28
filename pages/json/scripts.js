const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0) {
  const navType = navEntries[0].type;
  console.log("Tipo de navegação:", navType); 
  // valores possíveis: "navigate", "reload", "back_forward", "prerender"
}

const columnConfig = {
    "planos.json": ["ID", "Descricao", "Data de início", "Data fim", "Status"],
    "acoes.json": ["Número da atividade", "Atividade", "Plano de ação", "Status", "Data de início", "Data fim", "Observações", "Responsável", "Unidades envolvidas"]
};

const statusOptions = ["A iniciar", "Não iniciado", "Pendente", "Em curso", "Concluído", "Finalizado", "Implementado"];

//================================================================================
// busca os dados e inicia os scripts
//================================================================================
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

async function obterDadosDoOneDrive() {
  // Cole a URL do seu fluxo do Power Automate aqui
  const powerAutomateUrl = "https://prod-38.westus.logic.azure.com:443/workflows/6ff0e17beffa412d9fc6fbf256861ea8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_w4h7w76Nqxz1GjX-fqN4x6rQpE1aW8RRposrxufrzw";

  try {
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na requisição HTTP: ${response.status} ${response.statusText}`);
    }

    // Converte a resposta para JSON
    const dados = await response.json();

    jsonAcoes = JSON.parse(dados.acoes);
    jsonPlanos = JSON.parse(dados.planos);

  } catch (error) {
    console.error("Falha ao obter os dados do Power Automate:", error);
    return null;
  }
}

let jsonAcoes
let jsonPlanos

document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true)

    jsonAcoes = sessionStorage.getItem("jsonAcoes");
    jsonPlanos = sessionStorage.getItem("jsonPlanos");

    // se não existir, busca do OneDrive
    if (!jsonAcoes || jsonAcoes === "null" || !jsonPlanos || jsonPlanos === "null") {
      await obterDadosDoOneDrive();

      sessionStorage.setItem("jsonAcoes", JSON.stringify(jsonAcoes));
      sessionStorage.setItem("jsonPlanos", JSON.stringify(jsonPlanos));
      console.log('dados resgatados do onedrive e armazenados no sessionstorage')
    } else {
      jsonAcoes = JSON.parse(jsonAcoes);
      jsonPlanos = JSON.parse(jsonPlanos);
      console.log('dados resgatados do sessionstorage')
    }

    const params = new URLSearchParams(window.location.search);
    const nomeArquivoJson = params.get('arquivo');
    const nomeArquivoEl = document.getElementById('nome-arquivo');
    const tabelaContainerEl = document.getElementById('tabela-container');
    const btnSalvar = document.getElementById('btn-salvar');

    if (!nomeArquivoJson) {
        nomeArquivoEl.textContent = 'Nenhum arquivo especificado.';
        tabelaContainerEl.innerHTML = '<p class="p-8 text-center text-red-500">Adicione `?arquivo=nome_do_arquivo.json` à URL.</p>';
        btnSalvar.disabled = true;
        return;
    }

    nomeArquivoEl.textContent = nomeArquivoJson + '.json';
    
    carregarEExibirJson(nomeArquivoJson);

    btnSalvar.addEventListener('click', () => {
        const dadosAtualizados = extrairDadosDaTabela();
        const conteudoJsonString = JSON.stringify(dadosAtualizados, null, 2);

        btnSalvar.disabled = true;
        btnSalvar.querySelector('span') ? btnSalvar.querySelector('span').textContent = 'Salvando...' : btnSalvar.textContent = 'Salvando...';

        salvarArquivoNoOneDrive(nomeArquivoJson+'.txt', conteudoJsonString)
            .finally(() => {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293zM3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" /><path fill-rule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 011 1v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clip-rule="evenodd" /></svg> Salvar Alterações`;
            });
    });

    toggleLoading(false)
})

const powerAutomateUrl = "https://prod-174.westus.logic.azure.com:443/workflows/dcc988d813ef43bc8e73a81dd0afc678/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ahd0ynI2hDZJMplv9YsNuug7HzjPuWm4MSNDb-VG-vI";

async function salvarArquivoNoOneDrive(nome, conteudo) {
    const dadosParaEnviar = { nomeArquivo: nome, conteudoArquivo: conteudo };
    try {
        const response = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnviar)
        });
        if (!response.ok) throw new Error(`Erro na requisição HTTP: ${response.status}`);
        const resultado = await response.json();
        sessionStorage.clear()
        window.location.reload()
        return resultado;
    } catch (error) {
        console.error("Falha ao enviar os dados para o Power Automate:", error);
        alert('Erro ao salvar os dados.')
        return null;
    }
}

async function carregarEExibirJson(nomeArquivo) {
    const tabelaContainerEl = document.getElementById('tabela-container');
    try {
        const dadosJson = (nomeArquivo == 'acoes' ? jsonAcoes : jsonPlanos)

        const columnOrder = columnConfig[nomeArquivo] || (dadosJson.length > 0 ? Object.keys(dadosJson[0]) : []);
        
        tabelaContainerEl.innerHTML = criarTabelaEditavel(dadosJson, columnOrder);
        initColumnResizing();

    } catch (error) {
        console.error('Erro ao carregar o JSON:', error);
        tabelaContainerEl.innerHTML = `<p class="p-8 text-center text-red-500">Falha ao carregar o arquivo "${nomeArquivo}".</p>`;
        document.getElementById('btn-salvar').disabled = true;
    }
}

function criarTabelaEditavel(dados, columnOrder) {
    if (!Array.isArray(dados) || dados.length === 0) {
        return '<p class="p-8 text-center text-slate-500">O arquivo JSON está vazio ou não é um array.</p>';
    }

    let headerHtml = columnOrder.map(h => 
        `<th class="p-3 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap" style="width: 200px;">
            ${h}
            <div class="resizer"></div>
        </th>`
    ).join('');
    
    let rowsHtml = dados.map((item, index) => {
        let cellsHtml = columnOrder.map(header => {
            const valor = item[header] !== undefined && item[header] !== null ? item[header] : '';
            let cellContent = '';

            switch (header.toLowerCase()) {
                case 'data de início':
                case 'data fim':
                    cellContent = `<input type="date" data-key="${header}" value="${valor}" class="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">`;
                    break;
                case 'status':
                    const optionsHtml = statusOptions.map(opt => `<option value="${opt}" ${valor === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    cellContent = `<select data-key="${header}" class="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">${optionsHtml}</select>`;
                    break;
                default:
                    cellContent = `<textarea data-key="${header}" rows="2" class="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">${valor}</textarea>`;
            }
            return `<td class="p-3 border-t border-slate-200 align-top">${cellContent}</td>`;
        }).join('');
        return `<tr data-index="${index}">${cellsHtml}</tr>`;
    }).join('');

    // ▼▼▼ ALTERAÇÃO PRINCIPAL AQUI ▼▼▼
    // A classe "min-w-full" foi removida.
    return `<table id="tabela-edicao" class="border-collapse" style="width: ${columnOrder.length*200}px">
                <thead class="bg-slate-50"><tr>${headerHtml}</tr></thead>
                <tbody class="bg-white">${rowsHtml}</tbody>
            </table>`;
    // ▲▲▲ FIM DA ALTERAÇÃO ▲▲▲
}

function extrairDadosDaTabela() {
    const linhas = document.querySelectorAll('#tabela-edicao tbody tr');
    const dadosAtualizados = [];
    linhas.forEach(linha => {
        const inputs = linha.querySelectorAll('[data-key]');
        const novoItem = {};
        inputs.forEach(input => {
            const key = input.getAttribute('data-key');
            novoItem[key] = input.value;
        });
        dadosAtualizados.push(novoItem);
    });
    return dadosAtualizados;
}

function initColumnResizing() {
    const table = document.getElementById('tabela-edicao');
    if (!table) return;

    // Seleciona todas as "alças" de redimensionamento
    const resizers = table.querySelectorAll('.resizer');
    
    let th; // A coluna (header) sendo redimensionada
    let startX; // Posição inicial do mouse no eixo X
    let startWidth; // Largura inicial da coluna

    resizers.forEach(resizer => {
        // Evento que dispara quando o usuário clica na alça
        resizer.addEventListener('mousedown', (e) => {
            // Impede que o evento padrão (como seleção de texto) aconteça
            e.preventDefault();

            th = e.target.parentElement;
            startX = e.pageX;
            startWidth = th.offsetWidth;
            
            // Adiciona listeners globais para movimento e soltura do mouse
            document.documentElement.addEventListener('mousemove', onMouseMove);
            document.documentElement.addEventListener('mouseup', onMouseUp);
        });
    });

    // Função chamada continuamente enquanto o mouse é movido
    function onMouseMove(e) {
        const newWidth = startWidth + (e.pageX - startX);
        // Garante que a coluna tenha uma largura mínima para não desaparecer
        if (newWidth > 200) { 
            th.style.width = `${newWidth}px`;
            console.log(newWidth)
        }
    }

    // Função chamada quando o usuário solta o botão do mouse
    function onMouseUp() {
        // Remove os listeners globais para parar o redimensionamento
        document.documentElement.removeEventListener('mousemove', onMouseMove);
        document.documentElement.removeEventListener('mouseup', onMouseUp);
    }
}
