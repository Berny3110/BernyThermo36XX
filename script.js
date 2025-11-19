// script.js - Version CORRIGÉE & COMPLÈTE

function initializeApp() {
    // === 1. REFERENCES DOM ===
    const dom = {
        // Main
        display: document.getElementById('current-display'),
        saveBtn: document.getElementById('save-button'),
        list: document.getElementById('temperature-list'),
        chartCtx: document.getElementById('monthly-chart').getContext('2d'),
        themeBtn: document.getElementById('theme-toggle'),
        todayDate: document.getElementById('today-date'),
        
        // Cycle
        cycleBtn: document.getElementById('start-cycle-btn'),
        endCycleBtn: document.getElementById('cycle-end-btn'),
        cycleStatus: document.getElementById('cycle-status-container'),
        cycleInfo: document.getElementById('cycle-info'),
        
        // Buttons / Actions
        addManualBtn: document.getElementById('add-manual-btn'),
        clearBtn: document.getElementById('clear-history'),

        // Modals
        modals: {
            cycle: document.getElementById('cycle-date-modal'),
            edit: document.getElementById('edit-modal'),
            manual: document.getElementById('add-manual-modal')
        },
        inputs: {
            cycleStart: document.getElementById('cycle-start-input'),
            editDate: document.getElementById('edit-date-input'),
            manualDate: document.getElementById('add-date-input')
        },
        modalBtns: {
            cycleOk: document.getElementById('cycle-date-ok'),
            cycleCancel: document.getElementById('cycle-date-cancel'),
            editOk: document.getElementById('edit-ok'),
            editCancel: document.getElementById('edit-cancel'),
            manualOk: document.getElementById('add-manual-ok'),
            manualCancel: document.getElementById('add-manual-cancel')
        }
    };

    // Date header
    dom.todayDate.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // === 2. CONFIGURATION ROUES ===
    const BUFFER = 5; 
    const ITEM_HEIGHT = 60;

    // Helper pour créer une config de roue
    const createWheelConfig = (idPrefix, defaults) => ({
        degrees: { element: document.getElementById(`${idPrefix}degrees-scroll`),  min: 34, max: 42, step: 1, defaultValue: defaults.d, currentValue: defaults.d, format: v => v, buffer: BUFFER },
        dixiemes: { element: document.getElementById(`${idPrefix}dixiemes-scroll`), min: 0, max: 9, step: 1, defaultValue: defaults.dx, currentValue: defaults.dx, format: v => v, buffer: BUFFER },
        unites:   { element: document.getElementById(`${idPrefix}unites-scroll`),   min: 0, max: 9, step: 1, defaultValue: defaults.u, currentValue: defaults.u, format: v => v, buffer: BUFFER }
    });

    // 3 Configs distinctes : Principale, Ajout Manuel, Édition
    const config = createWheelConfig('', {d: 36, dx: 6, u: 0});
    const manualConfig = createWheelConfig('add-', {d: 36, dx: 6, u: 0});
    const editConfig = createWheelConfig('edit-', {d: 36, dx: 6, u: 0});

    // Données
    let temperatures = JSON.parse(localStorage.getItem('temperatures_v2') || '[]');
    let cycleStartDate = localStorage.getItem('cycleStartDate');
    let chart = null;
    let editingIndex = -1; // Pour savoir quelle mesure on modifie

    // === 3. GESTION CYCLES ===
    function updateCycleUI() {
        if (!cycleStartDate) {
            dom.cycleBtn.classList.remove('hidden');
            dom.cycleStatus.classList.add('hidden');
        } else {
            dom.cycleBtn.classList.add('hidden');
            dom.cycleStatus.classList.remove('hidden');
            const start = new Date(cycleStartDate);
            const diffTime = Math.abs(new Date() - start);
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            dom.cycleInfo.innerHTML = `J${days} <small>(Début: ${start.toLocaleDateString('fr-FR', {day:'numeric', month:'short'})})</small>`;
        }
    }

    dom.cycleBtn.addEventListener('click', () => {
        cycleStartDate = new Date().toISOString();
        localStorage.setItem('cycleStartDate', cycleStartDate);
        updateCycleUI();
        updateGraph();
    });

    dom.endCycleBtn.addEventListener('click', () => {
        if(confirm("Terminer ce cycle ?")) {
            localStorage.removeItem('cycleStartDate');
            cycleStartDate = null;
            updateCycleUI();
            updateGraph();
        }
    });

    // Edit Cycle Date
    dom.cycleInfo.addEventListener('click', () => {
        if(!cycleStartDate) return;
        dom.inputs.cycleStart.value = new Date(cycleStartDate).toISOString().split('T')[0];
        dom.modals.cycle.style.display = 'flex';
    });
    dom.modalBtns.cycleCancel.addEventListener('click', () => dom.modals.cycle.style.display = 'none');
    dom.modalBtns.cycleOk.addEventListener('click', () => {
        if (dom.inputs.cycleStart.value) {
            cycleStartDate = new Date(dom.inputs.cycleStart.value).toISOString();
            localStorage.setItem('cycleStartDate', cycleStartDate);
            updateCycleUI();
            updateGraph();
            dom.modals.cycle.style.display = 'none';
        }
    });

    // === 4. LOGIQUE ROUES (SWIPE) ===
    function getVal(cfg) { return cfg.degrees.currentValue + cfg.dixiemes.currentValue/10 + cfg.unites.currentValue/100; }

    function renderSelector(cfg) {
        const { element, min, max, step, format, buffer, currentValue } = cfg;
        element.innerHTML = '';
        for (let i = 0; i < buffer; i++) element.innerHTML += '<div class="value dummy"></div>';
        for (let i = max; i >= min; i -= step) element.innerHTML += `<div class="value">${format(i)}</div>`;
        for (let i = 0; i < buffer; i++) element.innerHTML += '<div class="value dummy"></div>';

        const offset = ((max - currentValue)/step + buffer - 1.5) * ITEM_HEIGHT;
        element.style.transform = `translateY(-${offset}px)`;
        
        setTimeout(() => {
            const values = element.querySelectorAll('.value:not(.dummy)');
            values.forEach(v => v.classList.remove('current-value'));
            const idx = (max - currentValue)/step;
            if(values[idx]) values[idx].classList.add('current-value');
        }, 50);
    }

    function initSwipe(cfg, callbackDisplay) {
        const { element, min, max, step, buffer } = cfg;
        let startY = 0, currentY = 0, isDragging = false;
        let currentIndex = (max - cfg.currentValue) / step;

        const updateVisuals = (yOffset, index) => {
            element.style.transform = `translateY(-${yOffset}px)`;
            const values = element.querySelectorAll('.value:not(.dummy)');
            values.forEach(v => v.classList.remove('current-value'));
            if(values[index]) values[index].classList.add('current-value');
            cfg.currentValue = max - (index * step);
            if(callbackDisplay) callbackDisplay();
        };

        const onStart = (e) => {
            isDragging = true;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            const style = window.getComputedStyle(element);
            currentY = -(new WebKitCSSMatrix(style.transform).m42);
            element.style.transition = 'none';
        };
        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            element.style.transform = `translateY(-${currentY + (startY - y)}px)`;
        };
        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            element.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            currentIndex += Math.round((startY - y) / ITEM_HEIGHT);
            const total = (max - min) / step + 1;
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex >= total) currentIndex = total - 1;
            updateVisuals((currentIndex + buffer - 1.5) * ITEM_HEIGHT, currentIndex);
        };

        element.addEventListener('touchstart', onStart, {passive: false});
        element.addEventListener('touchmove', onMove, {passive: false});
        element.addEventListener('touchend', onEnd);
        element.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }

    // Helpers d'affichage
    const updateMainDisp = () => dom.display.textContent = getVal(config).toFixed(2) + '°C';
    const updateManDisp = () => document.getElementById('add-current-display').textContent = getVal(manualConfig).toFixed(2) + '°C';
    const updateEditDisp = () => document.getElementById('edit-current-display').textContent = getVal(editConfig).toFixed(2) + '°C';

    // === 5. EVENTS MODALES (MANUEL & EDIT) ===
    
    // --- AJOUT MANUEL ---
    dom.addManualBtn.addEventListener('click', () => {
        dom.inputs.manualDate.value = new Date().toISOString().slice(0,16);
        // Reset roues
        ['degrees','dixiemes','unites'].forEach(k => {
            manualConfig[k].currentValue = manualConfig[k].defaultValue;
            renderSelector(manualConfig[k]);
            initSwipe(manualConfig[k], updateManDisp);
        });
        updateManDisp();
        dom.modals.manual.style.display = 'flex';
    });

    dom.modalBtns.manualCancel.addEventListener('click', () => dom.modals.manual.style.display = 'none');
    
    dom.modalBtns.manualOk.addEventListener('click', () => {
        const val = getVal(manualConfig);
        const ts = dom.inputs.manualDate.value ? new Date(dom.inputs.manualDate.value).toISOString() : new Date().toISOString();
        temperatures.push({ value: val, timestamp: ts });
        saveData();
        dom.modals.manual.style.display = 'none';
    });

    // --- EDITION ---
    // (Exposé globalement pour être appelé depuis le HTML généré)
    window.editTemp = (index) => {
        editingIndex = index; // Index dans le tableau TRIÉ affiché ? Attention au tri.
        // Pour simplifier, on va retrouver l'objet dans le tableau global
        // On va trier temperatures avant d'afficher la liste pour que les index correspondent
        temperatures.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const t = temperatures[index];
        dom.inputs.editDate.value = new Date(t.timestamp).toISOString().slice(0,16);
        
        // Set values
        editConfig.degrees.currentValue = Math.floor(t.value);
        editConfig.dixiemes.currentValue = Math.floor((t.value % 1)*10);
        editConfig.unites.currentValue = Math.round((t.value % 0.1)*100);
        
        ['degrees','dixiemes','unites'].forEach(k => {
            renderSelector(editConfig[k]);
            initSwipe(editConfig[k], updateEditDisp);
        });
        updateEditDisp();
        dom.modals.edit.style.display = 'flex';
    };

    dom.modalBtns.editCancel.addEventListener('click', () => dom.modals.edit.style.display = 'none');
    
    dom.modalBtns.editOk.addEventListener('click', () => {
        if (editingIndex > -1) {
            const val = getVal(editConfig);
            const ts = dom.inputs.editDate.value ? new Date(dom.inputs.editDate.value).toISOString() : temperatures[editingIndex].timestamp;
            temperatures[editingIndex] = { value: val, timestamp: ts };
            saveData();
            dom.modals.edit.style.display = 'none';
            editingIndex = -1;
        }
    });

    // === 6. CORE FUNCTIONS ===
    function saveData() {
        localStorage.setItem('temperatures_v2', JSON.stringify(temperatures));
        renderList();
        updateGraph();
    }

    dom.saveBtn.addEventListener('click', () => {
        temperatures.push({ value: getVal(config), timestamp: new Date().toISOString() });
        saveData();
        dom.saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sauvegardé !';
        setTimeout(() => dom.saveBtn.innerHTML = '<i class="fas fa-check"></i> Enregistrer', 2000);
    });

    dom.clearBtn.addEventListener('click', () => {
        if(confirm('Tout effacer ?')) {
            temperatures = [];
            saveData();
        }
    });

    window.deleteTemp = (index) => {
        if(confirm("Supprimer ?")) {
            temperatures.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            temperatures.splice(index, 1);
            saveData();
        }
    };

    function renderList() {
        dom.list.innerHTML = '';
        temperatures.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        temperatures.forEach((t, i) => {
            const li = document.createElement('li');
            const d = new Date(t.timestamp);
            li.innerHTML = `
                <div onclick="editTemp(${i})" style="cursor:pointer; flex:1">
                    <div class="temp-val">${t.value.toFixed(2)}°C</div>
                    <div class="temp-time">${d.toLocaleDateString()} à ${d.getHours()}h${d.getMinutes().toString().padStart(2,'0')} <i class="fas fa-pen" style="font-size:0.7em; opacity:0.5"></i></div>
                </div>
                <button onclick="deleteTemp(${i})" class="icon-btn-small danger"><i class="fas fa-times"></i></button>
            `;
            dom.list.appendChild(li);
        });
    }

    // === 7. ANALYSE & GRAPH ===
    function analyzeCycle(temps) {
        if(temps.length < 5) return null;
        const sorted = [...temps].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 6; i < sorted.length - 2; i++) {
            const pre = sorted.slice(i-6, i).map(t=>t.value);
            const post = sorted.slice(i, i+3).map(t=>t.value);
            if(Math.min(...post) > Math.max(...pre)) {
                const day = Math.floor((new Date(sorted[i].timestamp) - new Date(cycleStartDate))/86400000) + 1;
                return { detected: true, day: day };
            }
        }
        return { detected: false };
    }

    function updateGraph() {
        if(chart) chart.destroy();
        const relevant = cycleStartDate ? temperatures.filter(t => new Date(t.timestamp) >= new Date(cycleStartDate)) : temperatures;
        if(relevant.length === 0) { document.getElementById('ai-analysis-container').classList.add('hidden'); return; }
        
        relevant.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // IA Check
        const aiBox = document.getElementById('ai-analysis-container');
        if(cycleStartDate) {
            const analysis = analyzeCycle(relevant);
            if(analysis && analysis.detected) {
                aiBox.classList.remove('hidden');
                document.getElementById('ai-content').innerHTML = `<strong>Phase Lutéale</strong><br>Décalage à J${analysis.day}.`;
            } else { aiBox.classList.add('hidden'); }
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const color = isDark ? '#818cf8' : '#6366f1';
        
        chart = new Chart(dom.chartCtx, {
            type: 'line',
            data: {
                labels: relevant.map(t => cycleStartDate ? `J${Math.floor((new Date(t.timestamp)-new Date(cycleStartDate))/86400000)+1}` : new Date(t.timestamp).getDate()),
                datasets: [{
                    data: relevant.map(t => t.value),
                    borderColor: color, backgroundColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.2)',
                    fill: true, tension: 0.4, pointRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: {display:false} },
                scales: { y: { min: 35.8, max: 37.8 }, x: { grid: {display:false} } }
            }
        });
    }

    // Thème
    dom.themeBtn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateGraph();
    });

    // INIT
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    ['degrees','dixiemes','unites'].forEach(k => {
        renderSelector(config[k]);
        initSwipe(config[k], updateMainDisp);
    });
    updateCycleUI();
    renderList();
    setTimeout(updateGraph, 500);
}

document.addEventListener('DOMContentLoaded', initializeApp);