const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0) {
  const navType = navEntries[0].type;
  console.log("Tipo de navegação:", navType); 
  // valores possíveis: "navigate", "reload", "back_forward", "prerender"
}

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

    gerarCards(jsonPlanos)
    fillGanttData(jsonPlanos)
    fillUnidadeFilter()

    document.getElementById('filter-Unidade').addEventListener('change', filtrarValores)
    
    document.getElementById('filter-periodo').addEventListener('change', function() {
        const value = this.value;
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        if (value === 'especifico') {
            inputsDiv.style.display = 'flex';
        } else {
            inputsDiv.style.display = 'none';
            filtrarPeriodo();
        }
    });

    document.getElementById('filtrar-especifico').addEventListener('click', function() {
        const inicio = document.getElementById('periodo-inicio').value;
        const fim = document.getElementById('periodo-fim').value;
        if (!inicio || !fim) return;
    
        const firstDay = new Date(inicio);
        firstDay.setHours(0,0,0,0);
        const lastDay = new Date(fim);
        lastDay.setHours(23,59,59,999);
    
        const filtered = jsonPlanos.filter(task => {
            const start = new Date(task["Data início"]);
            const end = new Date(task["Data fim"]);
            return (start <= lastDay && end >= firstDay);
        });
    
        fillGanttData(filtered);
    });
    toggleLoading(false)
})

// const jsonAcoes = '##JSON_ACOES_PLACEHOLDER##';
// const jsonPlanos = '##JSON_PLANOS_PLACEHOLDER##';

// document.addEventListener('DOMContentLoaded', async function () {
//     gerarCards()
//     fillGanttData()
// })

//================================================================================
// Cria os cards dos planos de ação
//================================================================================
function gerarCards(jsonPlanos) {
  const container = document.querySelector('.card-container');
  if (!container) return;

  container.innerHTML = jsonPlanos.map(plano => {
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

  return `
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-md flex flex-col
                transition-all duration-300 hover:shadow-xl">
                
      <div class="flex-grow">
        <h2 class="text-xl font-bold text-sky-700 tracking-wide">${plano.Nome}</h2>

        <div class="mt-3 space-y-1 text-sm text-slate-600">
          <p>
            <strong class="font-semibold text-slate-700">Processo SEI:</strong>
            ${plano["Processo SEI"]}
          </p>
          <p>
            <strong class="font-semibold text-slate-700">Documento TCE:</strong>
            ${plano["Documento TCE"]}
          </p>
        </div>
      </div>
      
      <div class="mt-4">
        <details class="text-sm group mb-3">
          <summary class="font-semibold !text-slate-500 cursor-pointer list-none flex items-center gap-2
                          hover:!text-slate-700 group-open:!text-sky-700">
            Mais detalhes
            <span class="inline-block text-lg font-bold !text-slate-400 transition-transform duration-300 group-open:rotate-90">›</span>
          </summary>
          <div class="mt-2 pt-2 pl-2 text-slate-500 border-l-2 border-slate-200 space-y-1">
            <p><strong class="font-medium text-slate-600">Resolução:</strong> ${plano.Resolução || '-'}</p>
            <p><strong class="font-medium text-slate-600">Coordenador:</strong> ${plano.Coordenador || '-'}</p>
            <p><strong class="font-medium text-slate-600">Unidades:</strong> ${plano.Unidades || '-'}</p>
            <p><strong class="font-medium text-slate-600">Equipe:</strong> ${plano.Equipe || '-'}</p>
          </div>
        </details>
      
        <div class="pt-3 border-t border-slate-200 flex justify-between text-sm">
          <p class="font-medium text-slate-500">
            <strong>Início:</strong>
            <span class="font-semibold text-slate-700">${dataInicio}</span>
          </p>
          <p class="font-medium text-slate-500">
            <strong>Fim:</strong>
            <span class="font-semibold text-slate-700">${dataFim}</span>
          </p>
        </div>
      </div>
    </div>
  `;
  }).join('');
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

    taskListContainer.innerHTML = "";
    monthsHeader.innerHTML = "";
    ganttRowsContainer.innerHTML = "<div id='todayBar'></div>";
    ganttTimelineContainer.scrollLeft = 0;

//================================================================================
// Calcula e cria as colunas de meses
//================================================================================
    let minDate = new Date(Math.min(
        ...jsonPlanos
            .filter(task => task["Data início"])
            .map(task => new Date(task["Data início"]))
    ));
    let maxDate = new Date(Math.max(
        ...jsonPlanos
            .filter(task => task["Data fim"] || task["Data início"])
            .map(task => new Date(task["Data fim"] ? task["Data fim"] : task["Data início"]))
    ));

    const today = new Date();
    today.setHours(0,0,0,0);

    if (minDate > today) minDate = new Date(today);
    if (maxDate < today) maxDate = new Date(today);

    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 2);

    let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    let currentDate = new Date(firstMonth);
    let timelineWidth = 0;

    while (currentDate <= maxDate) {
        const monthElement = document.createElement('div');
        monthElement.className = 'gantt-month';
        monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        monthsHeader.appendChild(monthElement);
        timelineWidth += monthWidth;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    ganttRowsContainer.style.width = `${timelineWidth}px`;
    monthsHeader.style.width = `${timelineWidth}px`;
    
    function calculatePosition(date) {
        const targetDate = new Date(date);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthsDiff = (year - firstMonth.getFullYear()) * 12 + (month - firstMonth.getMonth());
        const dayOfMonth = targetDate.getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOffset = (dayOfMonth / daysInMonth) * monthWidth;
        return (monthsDiff * monthWidth) + dayOffset;
    }

    const positionToday = calculatePosition(new Date().toLocaleDateString().split("/").reverse().join("-"));
    document.getElementById("todayBar").style.left = `${positionToday}px`;
    ganttTimelineContainer.scrollLeft = positionToday - 100;

//================================================================================
// Preenche os valores no gantt
//================================================================================
    jsonPlanos.forEach((task, index) => {
        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `
            <div>${task.Nome}</div>
            <div class="status-container"><div class="status-${(task.Status || '').replace(/\s+/g, '-')}">${task.Status || '-'}</div></div>
        `;
        taskListContainer.appendChild(taskRow);

        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'gantt-row-timeline';
        rowTimeline.dataset.rowIndex = index;

        const startDate = task["Data início"];
        const endDate = task["Data fim"]
        const startOffset = calculatePosition(startDate);
        const endOffset = endDate ? calculatePosition(endDate) : startOffset+10;
        const durationWidth = endOffset - startOffset;

        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.left = `${startOffset}px`;
        bar.style.width = `${durationWidth}px`;
        bar.title = `${task.Nome}: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        const statusClass = `status-${task.Status.replace(/\s+/g, '-')}`;
        bar.classList.add(task.colorTag);

        rowTimeline.appendChild(bar);
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
// Linha de totais do gantt
//================================================================================
    taskListContainer.innerHTML += `
    <div class="gantt-row-task">
      <div style="grid-column: 1 / 3; color: gray;">
        <span style="font-weight: bold;">Total de entregas:</span>
        <select id="select-heatmap">
          <option selected value="encerrando">encerrando no mês</option>
          <option value="acontecendo">acontecendo no mês</option>
        </select>
      </div>
    </div>`
    
  document.getElementById('select-heatmap').addEventListener("change", toggleHeatMap)

  toggleHeatMap()
}

//================================================================================
// Heatmap bakground timeline
//================================================================================
function toggleHeatMap(){
  const ganttRowsContainer = document.getElementById('gantt-rows');
  document.querySelectorAll(".gantt-heatmap").forEach(el => el.remove());
  document.querySelectorAll(".gantt-total-row").forEach(el => el.remove());

  const estilo = document.getElementById('select-heatmap').value;

  const heatMap = {};

  const root = document.documentElement;
  const monthWidth = parseInt(getComputedStyle(root).getPropertyValue('--month-width'))
  let minDate = new Date(Math.min(
      ...jsonPlanos
          .filter(task => task["Data início"])
          .map(task => new Date(task["Data início"]))
  ));
  let maxDate = new Date(Math.max(
      ...jsonPlanos
          .filter(task => task["Data fim"] || task["Data início"])
          .map(task => new Date(task["Data fim"] ? task["Data fim"] : task["Data início"]))
  ));

  const today = new Date();
  today.setHours(0,0,0,0);

  if (minDate > today) minDate = new Date(today);
  if (maxDate < today) maxDate = new Date(today);

  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 2);

  let firstMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let heatDate = new Date(firstMonth);
  let monthIndex = 0;

  while (heatDate <= maxDate) {
    const inicioDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth(), 1);
    const fimDoMes = new Date(heatDate.getFullYear(), heatDate.getMonth() + 1, 0);

    let count = 0;

    if (estilo === "encerrando") {
      // conta apenas quem termina no mês
      jsonAcoes.forEach(acao => {
        if (acao["Data fim"]) {
          const end = new Date(acao["Data fim"]);
          if (end >= inicioDoMes && end <= fimDoMes) {
            count++;
          }
        }
      });

    } else if (estilo === "acontecendo") {
      // conta quem está ativo em qualquer parte do mês
      jsonAcoes.forEach(acao => {
        if (acao["Data de início"] && acao["Data fim"]) {
          const start = new Date(acao["Data de início"]);
          const end = new Date(acao["Data fim"]);
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
  totalRow.className = 'gantt-total-row';
  totalRow.style.display = 'flex';
  totalRow.style.width = `${timelineWidth}px`;

  let totalDate = new Date(firstMonth);
  let totalIndex = 0;
  while (totalDate <= maxDate) {
      const key = `${totalDate.getFullYear()}-${totalDate.getMonth()}`;
      const count = heatMap[key] || 0;

      const cell = document.createElement('div');
      cell.className = 'gantt-total-cell';
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
// painel de filtros
//================================================================================
// configurações gerais
const filtersConfig = [
    ["Unidades", "filter-Unidade"]
]

function filterJson(json, chave, valor) {
    return json.filter(item => {
        if (typeof item[chave] === "string" && typeof valor === "string") {
            return normalizeString(item[chave]).includes(normalizeString(valor));
        }
        return item[chave] === valor;
    });
}

function normalizeString(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")                 // separa acentos
        .replace(/[\u0300-\u036f]/g, "")  // remove acentos
        .replace(/\s+/g, "_")             // troca espaços por _
        .replace(/[^\w_]/g, "");          // remove caracteres especiais
}
// --------------------------------
// criando/configurando filtros
function fillUnidadeFilter() {
  const filtro = document.getElementById('filter-Unidade');

  let valores = [];
  Object.keys(jsonPlanos).forEach(key => {
    const unidades = jsonPlanos[key]["Unidades"].split(', ');
    valores.push(...unidades);
  });

  valores = [...new Set(valores)];
  valores = valores.filter(v => v && v.trim() != '').sort();

  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = normalizeString(valor);
    option.textContent = valor;
    filtro.appendChild(option);
  })
}

// --------------------------------
// executando filtro
function filtrarValores(){
    let jsonFiltrado = jsonPlanos;

    filtersConfig.forEach(([chave, elementId]) => {
        const filterElement = document.getElementById(elementId);
        if (filterElement && filterElement.value !== '-') {
            jsonFiltrado = filterJson(jsonFiltrado, chave, normalizeString(filterElement.value));
        }
    });

    fillGanttData(jsonFiltrado);
    gerarCards(jsonFiltrado);
}

function clearFilters(){
    filtersConfig.forEach(([chave, elementId]) => {
        document.getElementById(elementId).value = '-'
    });
    document.getElementById('filter-periodo').value = '-'
    document.getElementById('periodo-especifico-inputs').style.display = 'none'
    
    filtrarValores()
}

function filtrarPeriodo() {
    const select = document.getElementById('filter-periodo')

    const value = select.value;
    let filtered = jsonPlanos;

    if (value === 'mes') {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        filtered = jsonPlanos.filter(task => {
            const start = new Date(task["Data início"]);
            const end = new Date(task["Data fim"]);
            return (
                (start <= monthEnd && end >= monthStart)
            );
        });
    } else if (value === 'semana') {
        const now = new Date();
        const firstDay = new Date(now);
        firstDay.setDate(now.getDate() - now.getDay() + 1);
        firstDay.setHours(0,0,0,0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 4);
        lastDay.setHours(23,59,59,999);
        filtered = jsonPlanos.filter(task => {
            const start = new Date(task["Data início"]);
            const end = new Date(task["Data fim"]);
            return (
                (start <= lastDay && end >= firstDay)
            );
        });
    }

    fillGanttData(filtered);
};