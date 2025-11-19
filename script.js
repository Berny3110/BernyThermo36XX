// script.js - VERSION FINALE AVEC INTELLIGENCE DE CYCLE (Simulation Gemini)

function initializeApp() {
    // === RÉFÉRENCES DOM ===
    const degreesScroll = document.getElementById('degrees-scroll');
    const dixiemesScroll = document.getElementById('dixiemes-scroll');
    const unitesScroll = document.getElementById('unites-scroll');
    const saveButton = document.getElementById('save-button');
    const temperatureList = document.getElementById('temperature-list');
    const currentDisplay = document.getElementById('current-display');
    const clearButton = document.getElementById('clear-history');
    const addManualBtn = document.getElementById('add-manual-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const chartCanvas = document.getElementById('monthly-chart');
    const chartTitle = document.getElementById('chart-title');

    // Éléments cycle
    const startCycleBtn = document.getElementById('start-cycle-btn');
    const endCycleBtn = document.getElementById('cycle-end-btn');
    const cycleInfo = document.getElementById('cycle-info');

    // Modals
    const addManualModal = document.getElementById('add-manual-modal');
    const addDateInput = document.getElementById('add-date-input');
    const addManualOk = document.getElementById('add-manual-ok');
    const addManualCancel = document.getElementById('add-manual-cancel');
    const addDegreesScroll = document.getElementById('add-degrees-scroll');
    const addDixiemesScroll = document.getElementById('add-dixiemes-scroll');
    const addUnitesScroll = document.getElementById('add-unites-scroll');
    const addCurrentDisplay = document.getElementById('add-current-display');

    const editModal = document.getElementById('edit-modal');
    const editDateInput = document.getElementById('edit-date-input');
    const editOk = document.getElementById('edit-ok');
    const editCancel = document.getElementById('edit-cancel');
    const editDegreesScroll = document.getElementById('edit-degrees-scroll');
    const editDixiemesScroll = document.getElementById('edit-dixiemes-scroll');
    const editUnitesScroll = document.getElementById('edit-unites-scroll');
    const editCurrentDisplay = document.getElementById('edit-current-display');

    // === CONFIG ROUES ===
    const BUFFER = 10;
    const ITEM_HEIGHT = 60;

    const createConfig = (scrolls) => ({
        degrees: { element: scrolls.degrees, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36, format: v => v.toString().padStart(2,'0'), buffer: BUFFER },
        dixiemes: { element: scrolls.dixiemes, min: 0, max: 9, step: 1, defaultValue: 3, currentValue: 3, format: v => v, buffer: BUFFER },
        unites:   { element: scrolls.unites,   min: 0, max: 9, step: 1, defaultValue: 0, currentValue: 0, format: v => v, buffer: BUFFER }
    });

    const config = createConfig({ degrees: degreesScroll, dixiemes: dixiemesScroll, unites: unitesScroll });
    const addConfig = createConfig({ degrees: addDegreesScroll, dixiemes: addDixiemesScroll, unites: addUnitesScroll });
    const editConfig = createConfig({ degrees: editDegreesScroll, dixiemes: editDixiemesScroll, unites: editUnitesScroll });

    // === DONNÉES ===
    let temperatures = JSON.parse(localStorage.getItem('temperatures_v2') || '[]');
    let cycleStartDate = localStorage.getItem('cycleStartDate');
    let chart = null;
    let editingIndex = -1;

    // === GESTION DU CYCLE ===
    function updateCycleDisplay() {
        if (!cycleStartDate) {
            cycleInfo.textContent = "Aucun cycle en cours";
            startCycleBtn.style.display = 'block';
            endCycleBtn.style.display = 'none';
        } else {
            const days = Math.floor((Date.now() - new Date(cycleStartDate)) / 86400000) + 1;
            cycleInfo.textContent = `Cycle en cours — Jour ${days}`;
            startCycleBtn.style.display = 'none';
            endCycleBtn.style.display = 'block';
        }
    }

    function startNewCycle() {
        if (cycleStartDate && !confirm("Un cycle est déjà en cours. Le terminer et en commencer un nouveau ?")) return;
        cycleStartDate = new Date().toISOString();
        localStorage.setItem('cycleStartDate', cycleStartDate);
        updateCycleDisplay();
        alert("Nouveau cycle lancé ! Aujourd’hui = Jour 1");
    }

    function endCycle() {
        if (confirm("Terminer ce cycle et recommencer un nouveau ?")) {
            localStorage.removeItem('cycleStartDate');
            cycleStartDate = null;
            updateCycleDisplay();
        }
    }

    function getCycleDay(timestamp) {
        if (!cycleStartDate) return null;
        const diff = new Date(timestamp) - new Date(cycleStartDate);
        if (diff < 0) return null;
        return Math.floor(diff / 86400000) + 1;
    }

    startCycleBtn.addEventListener('click', startNewCycle);
    endCycleBtn.addEventListener('click', endCycle);

    // === INTELLIGENCE DE CYCLE (CERVEAU) ===
    function analyzeCycleLogic(temps) {
        if (temps.length < 5) return null; // Pas assez de données pour une vraie analyse

        // Trier par date
        const sorted = [...temps].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let shiftIndex = -1;
        let coverLine = 0;

        // On cherche le décalage thermique (Règle simplifiée : 3 températures > aux 6 précédentes)
        // Nous adaptons un peu si nous avons moins de 6 jours avant
        for (let i = 1; i < sorted.length - 2; i++) {
            // On regarde jusqu'à 6 jours avant
            const startIndex = Math.max(0, i - 6);
            const preDays = sorted.slice(startIndex, i).map(t => t.value);
            const post3 = sorted.slice(i, i + 3).map(t => t.value);
            
            if (preDays.length < 3) continue; // Il faut au moins 3 jours avant pour comparer

            const maxPre = Math.max(...preDays);
            const minPost3 = Math.min(...post3);

            // Si les 3 jours suivants sont tous supérieurs au max des précédents
            if (minPost3 > maxPre) {
                shiftIndex = i;
                coverLine = maxPre + 0.05; // Ligne de couverture estimée
                break; // On a trouvé le premier décalage
            }
        }

        if (shiftIndex !== -1) {
            const shiftDate = new Date(sorted[shiftIndex].timestamp);
            const dayOfCycle = getCycleDay(sorted[shiftIndex].timestamp);
            
            // Calcul jours phase lutéale (post-ovulation)
            const lastDate = new Date(sorted[sorted.length - 1].timestamp);
            // Différence en ms convertie en jours
            const diffTime = Math.abs(lastDate - shiftDate);
            const lutealDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

            return {
                detected: true,
                shiftDate: shiftDate,
                shiftIndex: shiftIndex, // Index dans le tableau filtré du cycle
                dayOfCycle: dayOfCycle,
                lutealDays: lutealDays,
                coverLine: coverLine
            };
        }

        return { detected: false };
    }

    // === GRAPHE ET ANALYSE ===
    function updateGraph() {
        const aiContainer = document.getElementById('ai-analysis-container');
        const aiContent = document.getElementById('ai-content');

        if (temperatures.length === 0) {
            chartTitle.textContent = "Aucune donnée";
            aiContainer.classList.add('hidden');
            if (chart) chart.destroy();
            return;
        }

        // Filtrer sur le cycle actuel
        const relevantTemps = cycleStartDate 
            ? temperatures.filter(t => new Date(t.timestamp) >= new Date(cycleStartDate))
            : temperatures;

        if (relevantTemps.length === 0) {
             if (chart) chart.destroy();
             return;
        }

        relevantTemps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // --- Lancer l'Analyse ---
        const analysis = analyzeCycleLogic(relevantTemps);
        
        // Mise à jour UI Analyse
        if (cycleStartDate && analysis) {
            aiContainer.classList.remove('hidden');
            if (analysis.detected) {
                aiContent.innerHTML = `
                    <span class="phase-tag phase-luteal">Phase Lutéale</span>
                    Décalage thermique détecté à <strong>J${analysis.dayOfCycle}</strong>.<br>
                    Vous êtes en plateau haut depuis environ ${analysis.lutealDays} jours.
                `;
            } else {
                aiContent.innerHTML = `
                    <span class="phase-tag phase-follicular">Phase Folliculaire</span>
                    Pas de décalage thermique confirmé pour l'instant.
                `;
            }
        } else {
             aiContainer.classList.add('hidden');
        }

        // Préparation données Chart
        const labels = relevantTemps.map((t, i) => {
            const day = getCycleDay(t.timestamp) || '?';
            return `J${day}`;
        });
        const dataValues = relevantTemps.map(t => t.value);

        chartTitle.textContent = `Cycle en cours — ${relevantTemps.length} mesure${relevantTemps.length > 1 ? 's' : ''}`;

        if (chart) chart.destroy();

        // Plugin Chart.js pour dessiner la ligne verticale
        const verticalLinePlugin = {
            id: 'verticalLine',
            beforeDraw: (chart) => {
                if (analysis && analysis.detected) {
                    const ctx = chart.ctx;
                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;
                    
                    // Trouver la position X de l'index du décalage
                    // Attention: analysis.shiftIndex correspond à l'index dans relevantTemps
                    const xPos = xAxis.getPixelForTick(analysis.shiftIndex);
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = '#a21caf'; // Couleur violette
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]); // Pointillés
                    ctx.moveTo(xPos, yAxis.top);
                    ctx.lineTo(xPos, yAxis.bottom);
                    ctx.stroke();
                    
                    // Label "OV?"
                    ctx.fillStyle = '#a21caf';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 10px Inter';
                    ctx.fillText('OVULATION ?', xPos, yAxis.top - 5);
                    ctx.restore();
                }
            }
        };

        chart = new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Température (°C)',
                    data: dataValues,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 800 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)}°C` }
                    }
                },
                scales: {
                    y: {
                        min: 35.8,
                        max: 37.5, 
                        ticks: { callback: value => value.toFixed(2) + '°C' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' }
                    },
                    x: { grid: { display: false } }
                },
                layout: {
                    padding: { top: 20 } 
                }
            },
            plugins: [verticalLinePlugin] 
        });
    }

    // === RENDU HISTORIQUE ===
    function renderHistory() {
        temperatureList.innerHTML = '';
        if (temperatures.length === 0) {
            temperatureList.innerHTML = '<li style="text-align:center;color:var(--text-muted);padding:20px;">Aucune mesure</li>';
            if (chart) chart.destroy();
            updateCycleDisplay();
            return;
        }

        temperatures.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let currentDayKey = null;
        temperatures.forEach((temp, i) => {
            const date = new Date(temp.timestamp);
            const dayKey = date.toLocaleDateString('fr-FR');
            const cycleDay = getCycleDay(temp.timestamp);

            if (dayKey !== currentDayKey) {
                const sep = document.createElement('li');
                sep.classList.add('day-separator');
                sep.textContent = `${dayKey}${cycleDay ? ` — Jour ${cycleDay} du cycle` : ''}`;
                temperatureList.appendChild(sep);
                currentDayKey = dayKey;
            }

            const li = document.createElement('li');
            const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <div>
                    <span>${timeStr}</span>
                    <span class="temp-value">${temp.value.toFixed(2)}°C</span>
                    ${cycleDay ? `<small style="color:var(--accent-color);font-weight:600;"> • Jour ${cycleDay}</small>` : ''}
                </div>
                <div class="temp-actions">
                    <button onclick="editTemp(${i})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTemp(${i})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            temperatureList.appendChild(li);
        });

        updateGraph();
        updateCycleDisplay();
    }

    // === SAUVEGARDE PRINCIPALE ===
    saveButton.addEventListener('click', () => {
        if (!cycleStartDate) {
            alert("Lancez d’abord un cycle avec le bouton ci-dessous !");
            return;
        }

        const today = new Date().toLocaleDateString('fr-FR');
        const existingToday = temperatures.find(t => 
            new Date(t.timestamp).toLocaleDateString('fr-FR') === today
        );

        if (existingToday) {
            const confirmReplace = confirm(
                `Vous avez déjà pris une température aujourd’hui (${existingToday.value.toFixed(2)}°C).\n\n` +
                `Voulez-vous vraiment l’écraser avec ${getCurrentTemp().toFixed(2)}°C ?`
            );
            if (!confirmReplace) {
                alert("Enregistrement annulé.");
                return;
            }
            const index = temperatures.indexOf(existingToday);
            temperatures.splice(index, 1);
        }

        const value = getCurrentTemp();
        const entry = { value, timestamp: new Date().toISOString() };

        temperatures.push(entry);
        localStorage.setItem('temperatures_v2', JSON.stringify(temperatures));
        renderHistory();

        const day = getCycleDay(entry.timestamp);
        saveButton.textContent = `Enregistré ! Jour ${day}`;
        setTimeout(() => {
            resetMainWheel();
            saveButton.textContent = "Enregistrer la Température";
        }, 1800);
    });

    function getCurrentTemp() {
        return config.degrees.currentValue + config.dixiemes.currentValue/10 + config.unites.currentValue/100;
    }

    function resetMainWheel() {
        Object.values(config).forEach(c => c.currentValue = c.defaultValue);
        ['degrees','dixiemes','unites'].forEach(k => {
            renderSelector(config[k]);
            initSwipe(config[k]);
        });
        updateCurrentDisplay();
    }

    // === ROUES ===
    function renderSelector(cfg) {
        const { element, min, max, step, format, buffer, currentValue } = cfg;
        element.innerHTML = '';
        for (let i = 0; i < buffer; i++) element.innerHTML += '<div class="value dummy" style="height:60px"></div>';
        for (let i = max; i >= min; i -= step) element.innerHTML += `<div class="value" style="height:60px">${format(i)}</div>`;
        for (let i = 0; i < buffer; i++) element.innerHTML += '<div class="value dummy" style="height:60px"></div>';

        const offsetIndex = (max - currentValue) / step;
        const fullIndex = buffer + offsetIndex;
        const children = element.children;
        if (children[fullIndex]) {
            children[fullIndex].classList.add('current-value');
            element.style.transform = `translateY(-${(fullIndex - 1.5) * 60}px)`;
            cfg.startIndex = fullIndex;
        }
    }

    function initSwipe(cfg, isModal = false) {
        const { element, min, max, step, buffer } = cfg;
        let startY = 0;
        let currentIndex = cfg.startIndex || buffer + (max - cfg.defaultValue) / step;
        const total = (max - min) / step + 1;
        let isDragging = false;

        const update = (newIndex) => {
            const dataIndex = ((newIndex - buffer) % total + total) % total;
            cfg.currentValue = max - dataIndex * step;
            element.style.transform = `translateY(-${(newIndex - 1.5) * 60}px)`;
            element.querySelectorAll('.value').forEach(el => el.classList.remove('current-value'));
            const wrapped = buffer + dataIndex;
            if (element.children[wrapped]) element.children[wrapped].classList.add('current-value');
            if (!isModal) updateCurrentDisplay();
            else if (addCurrentDisplay && isModal) updateAddCurrentDisplay();
            else if (editCurrentDisplay && isModal) updateEditCurrentDisplay();
        };
        update(currentIndex);

        const startDrag = (e) => {
            isDragging = true;
            startY = e.touches?.[0].clientY || e.clientY;
            element.style.transition = 'none';
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const y = e.touches?.[0].clientY || e.clientY;
            const diff = startY - y;
            const offset = (currentIndex - 1.5) * 60;
            element.style.transform = `translateY(-${offset + diff}px)`;
        };

        const endDrag = (event) => {
            if (!isDragging) return;
            isDragging = false;
            element.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';

            const finalY = event?.changedTouches?.[0]?.clientY || event?.clientY;
            if (finalY !== undefined) {
                const diff = startY - finalY;
                const steps = Math.round(diff / 60);
                currentIndex += steps;
            }

            currentIndex = ((currentIndex - buffer) % total + total) % total + buffer;
            update(currentIndex);
        };

        element.addEventListener('touchstart', startDrag, { passive: false });
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchmove', drag, { passive: false });
        element.addEventListener('mousemove', drag);
        element.addEventListener('touchend', endDrag);
        element.addEventListener('mouseup', endDrag);
        element.addEventListener('mouseleave', endDrag);
    }

    function updateCurrentDisplay() {
        const val = config.degrees.currentValue + config.dixiemes.currentValue/10 + config.unites.currentValue/100;
        currentDisplay.textContent = val.toFixed(2) + '°C';
    }
    function updateAddCurrentDisplay() {
        const val = addConfig.degrees.currentValue + addConfig.dixiemes.currentValue/10 + addConfig.unites.currentValue/100;
        addCurrentDisplay.textContent = val.toFixed(2) + '°C';
    }
    function updateEditCurrentDisplay() {
        const val = editConfig.degrees.currentValue + editConfig.dixiemes.currentValue/10 + editConfig.unites.currentValue/100;
        editCurrentDisplay.textContent = val.toFixed(2) + '°C';
    }

    // === MODALS (Ajout manuel + Édition) ===
    addManualBtn.addEventListener('click', () => {
        addManualModal.style.display = 'flex';
        addDateInput.value = new Date().toISOString().slice(0,16);
        ['degrees','dixiemes','unites'].forEach(k => {
            addConfig[k].currentValue = addConfig[k].defaultValue;
            renderSelector(addConfig[k]);
            initSwipe(addConfig[k], true);
        });
        updateAddCurrentDisplay();
    });

    addManualOk.addEventListener('click', () => {
        const value = addConfig.degrees.currentValue + addConfig.dixiemes.currentValue/10 + addConfig.unites.currentValue/100;
        const timestamp = addDateInput.value ? new Date(addDateInput.value + ':00').toISOString() : new Date().toISOString();
        temperatures.push({ value, timestamp });
        localStorage.setItem('temperatures_v2', JSON.stringify(temperatures));
        addManualModal.style.display = 'none';
        renderHistory();
    });

    addManualCancel.addEventListener('click', () => addManualModal.style.display = 'none');

    window.editTemp = index => {
        const t = temperatures[index];
        editingIndex = index;
        editDateInput.value = new Date(t.timestamp).toISOString().slice(0,16);
        editConfig.degrees.currentValue = Math.floor(t.value);
        editConfig.dixiemes.currentValue = Math.floor((t.value % 1)*10);
        editConfig.unites.currentValue = Math.round((t.value % 0.1)*100);
        ['degrees','dixiemes','unites'].forEach(k => {
            renderSelector(editConfig[k]);
            initSwipe(editConfig[k], true);
        });
        updateEditCurrentDisplay();
        editModal.style.display = 'flex';
    };

    editOk.addEventListener('click', () => {
        const value = editConfig.degrees.currentValue + editConfig.dixiemes.currentValue/10 + editConfig.unites.currentValue/100;
        const timestamp = editDateInput.value ? new Date(editDateInput.value + ':00').toISOString() : temperatures[editingIndex].timestamp;
        temperatures[editingIndex] = { value, timestamp };
        localStorage.setItem('temperatures_v2', JSON.stringify(temperatures));
        editModal.style.display = 'none';
        renderHistory();
    });

    editCancel.addEventListener('click', () => editModal.style.display = 'none');

    window.deleteTemp = index => {
        if (confirm('Supprimer cette mesure ?')) {
            temperatures.splice(index, 1);
            localStorage.setItem('temperatures_v2', JSON.stringify(temperatures));
            renderHistory();
        }
    };

    clearButton.addEventListener('click', () => {
        if (confirm('Vider tout l’historique ?')) {
            temperatures = [];
            localStorage.removeItem('temperatures_v2');
            renderHistory();
        }
    });

    // === THÈME ===
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        if (chart) updateGraph();
    });

    // === INIT ===
    ['degrees','dixiemes','unites'].forEach(k => {
        renderSelector(config[k]);
        initSwipe(config[k]);
    });
    updateCurrentDisplay();
    renderHistory();
    updateCycleDisplay();
}

document.addEventListener('DOMContentLoaded', initializeApp);