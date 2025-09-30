function fillGanttData(jsonAcoes){
    const monthWidth = 80; 
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');
    const monthsHeader = document.getElementById('gantt-months-header');
    const ganttRowsContainer = document.getElementById('gantt-rows');

    taskListContainer.innerHTML = "";
    monthsHeader.innerHTML = "";
    ganttRowsContainer.innerHTML = `<div id="todayBar" class="h-full w-px border-l-2 border-dashed border-[lightcoral] absolute z-10"></div>`;
    ganttTimelineContainer.scrollLeft = 0;

    let minDate = new Date(Math.min(...jsonAcoes.map(task => new Date(task["Data de início"]+'T10:00:00'))));
    let maxDate = new Date(Math.max(...jsonAcoes.map(task => new Date(task["Data fim"] ? task["Data fim"]+'T10:00:00' : task["Data de início"]+'T10:00:00'))));

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
        monthElement.className = 'flex-shrink-0 text-center font-bold py-2.5 border-r border-gray-200 box-border w-20"';
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
        rowTimeline.className = 'gantt-row-timeline border-b border-gray-200 relative transition-colors duration-200 h-10 box-border';
        rowTimeline.dataset.rowIndex = index;

        const startDate = task["Data de início"]+'T10:00:00';
        const endDate = task["Data fim"]+'T10:00:00'
        const startOffset = calculatePosition(startDate);
        const endOffset = endDate ? calculatePosition(endDate) : startOffset+10;
        const durationWidth = endOffset - startOffset;

        const bar = document.createElement('div');
        bar.className = 'absolute h-[25px] bg-[#3498db] rounded-[10px] top-1/2 -translate-y-1/2 z-[1] shadow-md';
        bar.style.left = `${startOffset}px`;
        bar.style.width = `${durationWidth}px`;
        bar.title = `${task.Atividade}: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        const statusClass = `status-${task.Status.replace(/\s+/g, '-')}`;
        bar.classList.add(task.colorTag);
        bar.addEventListener('click', ()=>{openTaskModal(task.ID)})

        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-row-task flex items-center border-b border-gray-200 transition-colors duration-200 h-10 box-border';
        taskRow.dataset.rowIndex = index;
        taskRow.innerHTML = `<div class="text-center px-3 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-200 box-border h-full leading-[40px]">${task["Número da atividade"]}</div>
                                <div class="px-3 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-200 box-border h-full leading-[40px]">${task["Plano de ação"]}</div>                     
                                <div class="px-3 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-200 box-border h-full leading-[40px]">${task.Atividade}</div>
                                <div class="flex justify-center items-center px-3 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-200 box-border h-full leading-[40px]">
                                    <div class="${statusClass} flex justify-center items-center text-sm px-1.5 rounded h-6">${task.Status}</div></div>`;
        taskListContainer.appendChild(taskRow);
        taskRow.addEventListener('click', () => {
            openTaskModal(task.ID);
        });

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

function setupGantt(){
    setupGanttScroll()
    setupResizerGantt()
}

function setupResizerGantt(){
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
}

function setupGanttScroll(){
    const taskListContainer = document.getElementById('gantt-task-list');
    const ganttTimelineContainer = document.getElementById('gantt-timeline-container');

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
}