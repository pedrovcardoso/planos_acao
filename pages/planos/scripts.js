//================================================================================
// busca os dados e inicia os scripts
//================================================================================
async function carregarJson() {
  const respostaAcoes = await fetch("../../assets/data/acoes.json");
  jsonAcoes = await respostaAcoes.json();

  const respostaPlanos = await fetch("../../assets/data/planos.json");
  jsonPlanos = await respostaPlanos.json();
}

document.addEventListener('DOMContentLoaded', async function () {
    await carregarJson()

    gerarCards()
    fillGanttData()
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
function gerarCards() {
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
function fillGanttData() {
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
// hamburguer header
//================================================================================
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');

  const icons = mobileMenuButton.querySelectorAll('svg');
  icons.forEach(icon => icon.classList.toggle('hidden'));
});