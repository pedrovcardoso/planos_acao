async function carregarJson() {
  const respostaAcoes = await fetch("/sef/dados/acoes.json");
  jsonAcoes = await respostaAcoes.json();

  const respostaPlanos = await fetch("/sef/dados/planos.json");
  jsonPlanos = await respostaPlanos.json();

  console.log(jsonAcoes, jsonPlanos);
}

// const jsonAcoes = '##JSON_ACOES_PLACEHOLDER##';
// const jsonPlanos = '##JSON_PLANOS_PLACEHOLDER##';

const filtersConfig = [
    ["Plano de ação", "filter-planoAcao"],
    ["Status", "filter-Status"],
    ["Responsável", "filter-Responsavel"],
    ["Unidades envolvidas", "filter-Orgao"]
]

document.addEventListener('DOMContentLoaded', async function () {
    await carregarJson()

    fillGanttData(jsonAcoes)

    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');
    
    filtersConfig.forEach(filterValue=>{
        const options = []
        Object.values(jsonAcoes).forEach(value=>{
            options.push(value[filterValue[0]])    
        })
        const optionsDistinc = new Set(options)
        const selectElement = document.getElementById(filterValue[1])
        optionsDistinc.forEach(value=>{
            selectElement.innerHTML += `<option value=${normalizeString(value)}>${value}</option>`
        })
        selectElement.addEventListener('change', ()=>{filtrarValores()})
    })

    document.getElementById('filter-periodo').addEventListener('change', function() {
        const value = this.value;
        const inputsDiv = document.getElementById('periodo-especifico-inputs');
        if (value === 'especifico') {
            inputsDiv.style.display = 'flex';
        } else {
            inputsDiv.style.display = 'none';
            filtrarPeriodo(); // chama o filtro normal para outras opções
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
    
        const filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]);
            const end = new Date(task["Data fim"]);
            return (start <= lastDay && end >= firstDay);
        });
    
        fillGanttData(filtered);
    });

    let isSyncingScroll = false;
    taskListContainer.addEventListener('scroll', () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        ganttTimelineContainer.scrollTop = taskListContainer.scrollTop;
        requestAnimationFrame(() => { isSyncingScroll = false; });
    });
    ganttTimelineContainer.addEventListener('scroll', () => {
        if (isSyncingScroll) return;
        isSyncingScroll = true;
        taskListContainer.scrollTop = ganttTimelineContainer.scrollTop;
        requestAnimationFrame(() => { isSyncingScroll = false; });
    });

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
});

function filterJson(json, chave, valor) {
    return json.filter(item => {
        // comparação flexível: se valor é string, ignora maiúscula/minúscula
        if (typeof item[chave] === "string" && typeof valor === "string") {
            return normalizeString(item[chave]) === normalizeString(valor);
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

function filtrarValores(){
    let jsonFiltrado = jsonAcoes;

    filtersConfig.forEach(([chave, elementId]) => {
        const filterElement = document.getElementById(elementId);
        if (filterElement && filterElement.value !== '-') {
            jsonFiltrado = filterJson(jsonFiltrado, chave, normalizeString(filterElement.value));
        }
    });

    fillGanttData(jsonFiltrado);
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
    let filtered = jsonAcoes;

    if (value === 'mes') {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]);
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
        filtered = jsonAcoes.filter(task => {
            const start = new Date(task["Data de início"]);
            const end = new Date(task["Data fim"]);
            return (
                (start <= lastDay && end >= firstDay)
            );
        });
    }

    fillGanttData(filtered);
};

function fillModal(task) {
    const dataInicioFormatada = task['Data de início'] 
        ? new Date(task['Data de início']).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
        : '-';
    
    const dataFimFormatada = task['Data fim'] 
        ? new Date(task['Data fim']).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
        : '-';
    
    // --- 2. CONSTRUÇÃO DO HTML ---
    document.getElementById('data_inicio').innerText = dataInicioFormatada
    document.getElementById('data_fim').innerText = dataFimFormatada

    const statusElement = document.getElementById('status');
    statusElement.innerText = task.Status;
    statusElement.className = '';
    statusElement.classList.add('status-'+task.Status.replace(/\s+/g, '-'));

    const camposExcluidos = ["Data de início", "Data fim", "Status", "Número da atividade"];

    Object.keys(task).forEach(key => {
        if (!camposExcluidos.includes(key)) {
            console.log(key)
            let value = task[key] === '' ? '-' : task[key];
            document.getElementById(key.toLowerCase().replace(/\s+/g, '_')).innerText = value
        }
    });
    
    const modal = document.getElementById('modal');
    const backdrop = document.getElementById('modal-backdrop');

    modal.classList.add('active');
    backdrop.classList.add('active');

    const titleElement = document.getElementById('modal-activity-title');
    titleElement.classList.add('line-clamp-3');
    titleElement.addEventListener('click', () => {
        titleElement.classList.toggle('line-clamp-3');
    });

    document.getElementById('modal-close-btn').onclick = closeModal;
    backdrop.onclick = closeModal;
}

function closeModal() {
    const modal = document.getElementById('modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    modal.classList.remove('active');
    backdrop.classList.remove('active');
}

function fillGanttData(jsonAcoes){
    const monthWidth = 150; 
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');

    taskListContainer.innerHTML = "";
    monthsHeader.innerHTML = "";
    ganttRowsContainer.innerHTML = "<div id='todayBar'></div>";
    ganttTimelineContainer.scrollLeft = 0;

    let minDate = new Date(Math.min(...jsonAcoes.map(task => new Date(task["Data de início"]))));
    let maxDate = new Date(Math.max(...jsonAcoes.map(task => new Date(task["Data fim"] ? task["Data fim"] : task["Data de início"]))));

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
    ganttTimelineContainer.scrollLeft = positionToday - 100; // Centraliza o "Hoje" na tela

    jsonAcoes.forEach((task, index) => {
        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'gantt-row-timeline';
        rowTimeline.dataset.rowIndex = index;

        const startDate = task["Data de início"];
        const endDate = task["Data fim"]
        const startOffset = calculatePosition(startDate);
        const endOffset = endDate ? calculatePosition(endDate) : startOffset+10;
        const durationWidth = endOffset - startOffset;

        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.left = `${startOffset}px`;
        bar.style.width = `${durationWidth}px`;
        bar.title = `${task.Atividade}: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        const statusClass = `status-${task.Status.replace(/\s+/g, '-')}`;
        bar.classList.add(task.colorTag);
        bar.addEventListener('click', ()=>{fillModal(task)})

        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `<div>${task["Número da atividade"]}</div>
                                <div>${task["Plano de ação"]}</div>                     
                                <div>${task.Atividade}</div><div class="status-container">
                                <div class="${statusClass}">${task.Status}</div></div>`;
        taskListContainer.appendChild(taskRow);

        rowTimeline.appendChild(bar);
        ganttRowsContainer.appendChild(rowTimeline);
        
        document.querySelectorAll('.gantt-row-task, .gantt-row-timeline').forEach(row => {
        row.addEventListener('mouseenter', () => {
            const rowIndex = row.dataset.rowIndex;
            document.querySelectorAll(`[data-row-index='${rowIndex}']`).forEach(el => el.classList.add('hovered'));
        });
        row.addEventListener('mouseleave', () => {
            const rowIndex = row.dataset.rowIndex;
            document.querySelectorAll(`[data-row-index='${rowIndex}']`).forEach(el => el.classList.remove('hovered'));
        });
    });
    });
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