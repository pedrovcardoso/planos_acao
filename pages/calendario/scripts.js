let currentDate = new Date();
let rawData = { planos: [], acoes: [], notificacoes: [] };
let isCalendarMode = false;

document.addEventListener('DOMContentLoaded', async function () {
    toggleLoading(true);

    try {
        await loadScript('../../components/ui/multiple_select.js');
        setupViewSwitcher();

        const requiredData = await obterDados(['acoes.txt', 'planos.txt', 'notificacoes.txt']);
        if (!requiredData) throw new Error("Erro de dados.");

        rawData.acoes = requiredData['acoes.txt'];
        rawData.planos = requiredData['planos.txt'];
        rawData.notificacoes = requiredData['notificacoes.txt'];

        setupFilters(rawData);
        setupFilterListeners();
        applyFiltersAndRender();

    } catch (error) {
        console.error(error);
    } finally {
        toggleLoading(false);
    }
});

function toggleLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(src);
        s.onerror = () => reject(new Error(`Erro: ${src}`));
        document.head.appendChild(s);
    });
}

function setupViewSwitcher() {
    const btnList = document.getElementById('btn-view-list');
    const btnCal = document.getElementById('btn-view-calendar');
    const contList = document.getElementById('view-container-list');
    const contCal = document.getElementById('view-container-calendar');

    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'calendar') {
        isCalendarMode = true;
    } else {
        isCalendarMode = false;
    }

    const setUrlParam = (mode) => {
        const url = new URL(window.location);
        url.searchParams.set('view', mode);
        window.history.replaceState({}, '', url);
    };

    const updateUI = () => {
        const active = "text-sky-600 border-sky-600 bg-white hover:bg-slate-50";
        const inactive = "text-slate-400 border-transparent bg-white hover:text-sky-600 hover:bg-slate-50";

        if (!isCalendarMode) {
            btnList.className = `flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${active}`;
            btnCal.className = `flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${inactive}`;
            contList.classList.remove('hidden');
            contCal.classList.add('hidden');
        } else {
            btnCal.className = `flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${active}`;
            btnList.className = `flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${inactive}`;
            contCal.classList.remove('hidden');
            contList.classList.add('hidden');
        }
        applyFiltersAndRender();
    };

    btnList.addEventListener('click', () => {
        isCalendarMode = false;
        setUrlParam('list');
        updateUI();
    });

    btnCal.addEventListener('click', () => {
        isCalendarMode = true;
        setUrlParam('calendar');
        updateUI();
    });

    updateUI();
}

window.changeMonth = function (delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    applyFiltersAndRender();
}

window.toggleFilterChip = function (btn) {
    btn.classList.toggle('active');
    applyFiltersAndRender();
}

window.closeDayModal = function () {
    document.getElementById('day-details-modal').classList.add('hidden');
    document.getElementById('day-details-modal').classList.remove('flex');
}

function normalizeEvents(planos, acoes, notificacoes) {
    let events = [];
    planos.forEach(p => {
        if (p['Data início']) events.push(createObj(p['Data início'], 'planos', p.Nome, p, { label: 'PLANO', class: 'bg-purple-100 text-purple-700' }, { label: 'INÍCIO', class: 'bg-green-100 text-green-700' }));
        if (p['Data fim']) events.push(createObj(p['Data fim'], 'planos', p.Nome, p, { label: 'PLANO', class: 'bg-purple-100 text-purple-700' }, { label: 'PRAZO', class: 'bg-red-100 text-red-700' }));
    });
    acoes.forEach(a => {
        const nomeComposto = `${a['Plano de ação']} | ${a.Atividade}`;
        const bg = { label: 'AÇÃO', class: 'bg-sky-100 text-sky-700' };

        if (a['Data de início']) events.push(createObj(a['Data de início'], 'acoes', nomeComposto, a, bg, { label: 'INÍCIO', class: 'bg-green-100 text-green-700' }));
        if (a['Data fim']) events.push(createObj(a['Data fim'], 'acoes', nomeComposto, a, bg, { label: 'PRAZO', class: 'bg-red-100 text-red-700' }));
    });
    notificacoes.forEach(n => {
        if (n.data) {
            const action = acoes.find(a => a.ID === n.idAcao);
            let nomeComposto = 'Ação desconhecida';
            if (action) {
                nomeComposto = `${action['Plano de ação']} | ${action.Atividade}`;
            }

            let status = { label: n.tipo.toUpperCase(), class: 'bg-slate-100 text-slate-600' };
            if (n.tipo === 'inicio') status = { label: 'INÍCIO', class: 'bg-teal-100 text-teal-700' };
            if (n.tipo === 'aviso') status = { label: 'AVISO', class: 'bg-orange-100 text-orange-700' };
            if (n.tipo === 'pendencia') status = { label: 'PENDENTE', class: 'bg-red-100 text-red-700' };

            events.push(createObj(n.data, 'notificacoes', nomeComposto, { ...n, parent: action },
                { label: 'NOTIF.', class: 'bg-amber-100 text-amber-700' }, status));
        }
    });

    return events;
}

function createObj(dateStr, type, title, raw, badge1, badge2) {
    return {
        dateStr,
        dateObj: new Date(dateStr + 'T12:00:00'),
        type, title, raw, badge1, badge2
    };
}

function filterEvents(all) {
    const chips = Array.from(document.querySelectorAll('.filter-chip.active')).map(b => b.dataset.type);

    const getVals = (id) => (window.getCustomSelectValues ? window.getCustomSelectValues(id) : []);

    const sPlanos = getVals('filter-planos');
    const sResp = getVals('filter-responsavel');
    const sUnit = getVals('filter-unidade');

    const norm = s => s ? s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    return all.filter(ev => {
        if (!chips.includes(ev.type)) return false;

        let plano = '', units = [], people = [];

        if (ev.type === 'planos') {
            plano = ev.raw.Nome;
            if (ev.raw.objPessoas) {
                units = ev.raw.objPessoas.map(p => p.Unidade);
                people = ev.raw.objPessoas.map(p => p.Nome);
            }
        } else if (ev.type === 'acoes') {
            plano = ev.raw['Plano de ação'];
            units = ev.raw.Unidades || [];
            const parent = rawData.planos.find(p => p.Nome === plano);
            if (parent && parent.objPessoas) people = parent.objPessoas.map(p => p.Nome);
        } else if (ev.type === 'notificacoes' && ev.raw.parent) {
            plano = ev.raw.parent['Plano de ação'];
            units = ev.raw.parent.Unidades || [];
            const parent = rawData.planos.find(p => p.Nome === plano);
            if (parent && parent.objPessoas) people = parent.objPessoas.map(p => p.Nome);
        }

        if (sPlanos.length && !sPlanos.some(v => norm(plano) === norm(v))) return false;
        if (sUnit.length && !units.some(u => sUnit.some(v => norm(u) === norm(v)))) return false;
        if (sResp.length && !people.some(p => sResp.some(v => norm(p) === norm(v)))) return false;

        return true;
    });
}

window.applyFiltersAndRender = function () {
    const all = normalizeEvents(rawData.planos, rawData.acoes, rawData.notificacoes);
    const filtered = filterEvents(all);

    document.getElementById('current-period-display').textContent = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const cM = currentDate.getMonth();
    const cY = currentDate.getFullYear();
    const currentEvents = filtered.filter(e => e.dateObj.getMonth() === cM && e.dateObj.getFullYear() === cY);
    currentEvents.sort((a, b) => a.dateObj - b.dateObj);

    const emptyEl = document.getElementById('empty-state');
    if (currentEvents.length === 0 && !isCalendarMode) {
        emptyEl.classList.remove('hidden');
        emptyEl.classList.add('flex');
    } else {
        emptyEl.classList.add('hidden');
        emptyEl.classList.remove('flex');
    }

    if (!isCalendarMode) {
        renderListView(currentEvents);
    } else {
        renderCalendarView(currentEvents, cM, cY);
    }
}

function renderListView(events) {
    const container = document.getElementById('view-container-list');
    container.innerHTML = '';

    const grouped = {};
    events.forEach(ev => {
        if (!grouped[ev.dateStr]) grouped[ev.dateStr] = [];
        grouped[ev.dateStr].push(ev);
    });

    Object.keys(grouped).sort().forEach((dateStr, idx) => {
        const dayEvents = grouped[dateStr];
        const dateObj = new Date(dateStr + 'T12:00:00');
        const dayNum = dateObj.getDate();
        const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();

        const itemsHtml = dayEvents.map(ev => {
            const unit = (ev.raw.Unidades && ev.raw.Unidades.length > 0) ? ev.raw.Unidades[0] : '';
            return `
            <div class="mb-5 last:mb-0 transform transition-transform duration-200 hover-sutil">
                <div class="flex flex-wrap gap-2 mb-1">
                     <!-- Badge Tipo -->
                     <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ev.badge1.class}">${ev.badge1.label}</span>
                     <!-- Badge Status/Prazo -->
                     <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ev.badge2.class}">${ev.badge2.label}</span>
                     <!-- Badge Unidade (Movida para cá) -->
                     ${unit ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white text-slate-500 border border-slate-200 shadow-sm">${unit}</span>` : ''}
                </div>
                <h4 class="text-sm font-semibold text-slate-800 leading-snug break-words">
                    ${ev.title}
                </h4>
            </div>
            `;
        }).join('');

        const wrapper = document.createElement('div');
        wrapper.className = "flex animate-entry relative";
        wrapper.style.animationDelay = `${idx * 50}ms`;

        wrapper.innerHTML = `
            <!-- Data -->
            <div class="flex-shrink-0 z-10">
                 <div class="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center text-slate-700 shadow-sm border border-slate-200">
                    <span class="text-3xl font-bold leading-none">${dayNum}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">${weekDay}</span>
                 </div>
            </div>
            <!-- Linha Pontilhada -->
            <div class="relative hidden sm:flex justify-center w-12">
                 <div class="h-full border-l-2 border-dashed border-slate-300"></div>
            </div>
            <!-- Eventos -->
            <div class="flex-1 pt-1 pl-4 sm:pl-0">
                ${itemsHtml}
            </div>
        `;
        container.appendChild(wrapper);
    });
}

function renderCalendarView(monthEvents, month, year) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const lastDayInfo = new Date(year, month + 1, 0);
    const lastD = lastDayInfo.getDate();
    const startWeek = new Date(year, month, 1).getDay();

    for (let i = 0; i < startWeek; i++) {
        const d = document.createElement('div');
        d.className = "opacity-0";
        grid.appendChild(d);
    }

    for (let d = 1; d <= lastD; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const evs = monthEvents.filter(e => e.dateStr === dateStr);

        const cell = document.createElement('div');
        cell.className = "bg-white p-2 min-h-[100px] hover:bg-slate-50 transition cursor-pointer flex flex-col group overflow-hidden relative";
        cell.onclick = () => openDayModal(dateStr, evs);

        let content = `<span class="block text-right text-xs font-bold text-slate-400 mb-1 group-hover:text-slate-600">${d}</span>`;

        evs.slice(0, 3).forEach(ev => {
            const color = ev.badge1.class.includes('purple') ? 'bg-purple-500' : (ev.badge1.class.includes('sky') ? 'bg-sky-500' : 'bg-amber-500');
            content += `
            <div class="flex items-center gap-1.5 mb-1 last:mb-0">
               <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}"></div>
               <span class="text-[9px] text-slate-600 truncate font-medium select-none">${ev.title}</span>
            </div>`;
        });

        if (evs.length > 3) {
            content += `<div class="mt-auto pt-1"><span class="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">+${evs.length - 3}</span></div>`;
        }

        cell.innerHTML = content;
        grid.appendChild(cell);
    }
}

function setupFilters(d) {
    const planos = new Set(), resps = new Set(), units = new Set();
    d.planos.forEach(p => {
        if (p.Nome) planos.add(p.Nome);
        (p.objPessoas || []).forEach(o => { if (o.Nome) resps.add(o.Nome); if (o.Unidade) units.add(o.Unidade); });
    });

    const pop = (id, set) => {
        const s = document.getElementById(id);
        [...set].sort().forEach(v => s.appendChild(new Option(v, v)));
        if (window.createCustomSelect) window.createCustomSelect(id);
    };
    pop('filter-planos', planos);
    pop('filter-responsavel', resps);
    pop('filter-unidade', units);
}

function setupFilterListeners() {
    if (window.onCustomSelectChange) {
        ['filter-planos', 'filter-responsavel', 'filter-unidade'].forEach(id => {
            window.onCustomSelectChange(id, applyFiltersAndRender);
        });
    }
}

window.clearFilters = function () {
    document.querySelectorAll('.filter-chip').forEach(b => {
        if (b.dataset.type === 'notificacoes') b.classList.remove('active');
        else b.classList.add('active');
    });
    ['filter-planos', 'filter-responsavel', 'filter-unidade'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { Array.from(el.options).forEach(o => o.selected = false); if (window.createCustomSelect) window.createCustomSelect(id); }
    });
    applyFiltersAndRender();
}

window.openDayModal = function (dateStr, evs) {
    if (!evs.length) return;
    const modal = document.getElementById('day-details-modal');
    const list = document.getElementById('modal-events-list');

    document.getElementById('modal-date-title').textContent = new Date(dateStr + 'T12:00:00')
        .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    list.innerHTML = evs.map(ev => `
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <div class="flex flex-wrap gap-2 mb-2">
                 <span class="${ev.badge1.class} px-2 py-0.5 rounded text-[10px] font-bold uppercase">${ev.badge1.label}</span>
                 <span class="${ev.badge2.class} px-2 py-0.5 rounded text-[10px] font-bold uppercase">${ev.badge2.label}</span>
            </div>
            <p class="font-semibold text-sm text-slate-800 mb-1">${ev.title}</p>
            ${(ev.raw.Unidades && ev.raw.Unidades[0]) ? `<p class="text-xs text-slate-500 font-medium">${ev.raw.Unidades[0]}</p>` : ''}
        </div>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}