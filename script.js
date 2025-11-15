// script.js (Version Réécrite : Modal Unifié Édition + Fixes UX)

// --- LOGIQUE PRINCIPALE ---

function initializeApp() {
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

    // Modal Ajout Manuel refs
    const addManualModal = document.getElementById('add-manual-modal');
    const addDateInput = document.getElementById('add-date-input');
    const addManualOk = document.getElementById('add-manual-ok');
    const addManualCancel = document.getElementById('add-manual-cancel');
    const addDegreesScroll = document.getElementById('add-degrees-scroll');
    const addDixiemesScroll = document.getElementById('add-dixiemes-scroll');
    const addUnitesScroll = document.getElementById('add-unites-scroll');
    const addCurrentDisplay = document.getElementById('add-current-display');

    // Modal Édition refs (Nouveau : Unifié Date + Temp)
    const editModal = document.getElementById('edit-modal');
    const editDateInput = document.getElementById('edit-date-input');
    const editOk = document.getElementById('edit-ok');
    const editCancel = document.getElementById('edit-cancel');
    const editDegreesScroll = document.getElementById('edit-degrees-scroll');
    const editDixiemesScroll = document.getElementById('edit-dixiemes-scroll');
    const editUnitesScroll = document.getElementById('edit-unites-scroll');
    const editCurrentDisplay = document.getElementById('edit-current-display');

    // Configuration (3 roulettes principales)
    const BUFFER = 5;
    const SELECTOR_HEIGHT = 80;
    const config = {
        degrees: {
            element: degreesScroll, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36,
            format: (val) => val.toString().padStart(2, '0'),
            buffer: BUFFER
        },
        dixiemes: {
            element: dixiemesScroll, min: 0, max: 9, step: 1, defaultValue: 3, currentValue: 3,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        },
        unites: {
            element: unitesScroll, min: 0, max: 9, step: 1, defaultValue: 0, currentValue: 0,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        }
    };

    // Config roulettes ajout manuel (copie)
    const addConfig = {
        degrees: {
            element: addDegreesScroll, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36,
            format: (val) => val.toString().padStart(2, '0'),
            buffer: BUFFER
        },
        dixiemes: {
            element: addDixiemesScroll, min: 0, max: 9, step: 1, defaultValue: 3, currentValue: 3,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        },
        unites: {
            element: addUnitesScroll, min: 0, max: 9, step: 1, defaultValue: 0, currentValue: 0,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        }
    };

    // Config roulettes édition (copie : Nouveau)
    const editConfig = {
        degrees: {
            element: editDegreesScroll, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36,
            format: (val) => val.toString().padStart(2, '0'),
            buffer: BUFFER
        },
        dixiemes: {
            element: editDixiemesScroll, min: 0, max: 9, step: 1, defaultValue: 3, currentValue: 3,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        },
        unites: {
            element: editUnitesScroll, min: 0, max: 9, step: 1, defaultValue: 0, currentValue: 0,
            format: (val) => val.toString().padStart(1, '0'),
            buffer: BUFFER
        }
    };

    let temperatures = JSON.parse(localStorage.getItem('temperatures')) || [];
    if (temperatures.length > 100) {
        temperatures = temperatures.slice(0, 100);
        localStorage.setItem('temperatures', JSON.stringify(temperatures));
    }
    let editingIndex = -1;

    let chart = null;

    // THÈME SOMBRÉ
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const toggleIcon = themeToggle.querySelector('i');
    toggleIcon.classList.toggle('fa-moon', savedTheme === 'light');
    toggleIcon.classList.toggle('fa-sun', savedTheme === 'dark');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggleIcon.classList.toggle('fa-moon', newTheme === 'light');
        toggleIcon.classList.toggle('fa-sun', newTheme === 'dark');
        if (chart) updateGraph();
    });

    // RENDU ROULETTE (FIX : Ordre décroissant pour "4 au-dessus de 3")
    function renderSelector(selectorConfig) {
        const { element, min, max, step, format, buffer, currentValue } = selectorConfig;
        const totalValues = (max - min) / step + 1;
        element.innerHTML = '';

        // Dummies haut
        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }

        // FIX ORDRE : Render en décroissant pour wheel "4 au-dessus de 3" (haut = grand, bas = petit)
        for (let i = max; i >= min; i -= step) {
            const valueEl = document.createElement('div');
            valueEl.classList.add('value');
            valueEl.setAttribute('data-value', i);
            valueEl.textContent = format(i);
            valueEl.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(valueEl);
        }

        // Dummies bas
        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }

        // Position initial (ajustée pour ordre décroissant)
        const offsetIndex = (max - currentValue) / step; // Inversé pour décroissant
        if (offsetIndex >= 0 && offsetIndex < totalValues) {
            const fullIndex = buffer + offsetIndex;
            const children = element.children;
            if (children[fullIndex]) {
                children[fullIndex].classList.add('current-value');
                const initialOffset = fullIndex * SELECTOR_HEIGHT;
                element.style.transform = `translateY(-${initialOffset}px)`;
                selectorConfig.startIndex = fullIndex;
            }
        }
    }

    // INIT SWIPE (FIX : Direction up = -valeur, Wrapping sans jump + CORRECTION SENS & VALEUR)
    function initSwipe(selectorConfig, isModal = false) {
        const { element, min, max, step, buffer } = selectorConfig;
        let startY = 0;
        let currentY = 0;
        let currentIndex = selectorConfig.startIndex || buffer;
        const totalValues = (max - min) / step + 1;

        function updateDisplay(newIndex) {
            const children = element.querySelectorAll('.value');
            let dataIndex = newIndex - buffer;
            // FIX WRAPPING : Modulo pour boucle infinie (géré négatif)
            const valueIndex = ((dataIndex % totalValues) + totalValues) % totalValues;
            // CORRECTION : Pour ordre décroissant, newValue = max - valueIndex * step
            const newValue = max - valueIndex * step;

            children.forEach((child, index) => {
                child.classList.remove('current-value');
                // FIX INDEX WRAP : Pour ordre décroissant, index wrap
                const wrappedIndex = ((index - buffer) % totalValues + totalValues) % totalValues + buffer;
                if (wrappedIndex === newIndex) {
                    child.classList.add('current-value');
                }
            });

            selectorConfig.currentValue = newValue;
            const offset = newIndex * SELECTOR_HEIGHT;
            element.style.transform = `translateY(-${offset}px)`;

            // Mise à jour du display approprié
            if (isModal) {
                // Différencie add vs edit via global ou param (ici, assume add/edit ont même func pour simplicité)
                if (document.getElementById('add-current-display')) updateAddCurrentDisplay();
                if (document.getElementById('edit-current-display')) updateEditCurrentDisplay();
            } else {
                updateCurrentDisplay();
            }
        }

        updateDisplay(currentIndex);

        function getCoordsY(e) {
            if (e.touches && e.touches.length > 0) return e.touches[0].clientY;
            if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientY;
            return e.clientY;
        }

        function startDrag(e) {
            e.preventDefault();
            startY = getCoordsY(e);
            element.style.transition = 'none';

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
            document.addEventListener('mouseleave', endDrag);
        }

        function drag(e) {
            e.preventDefault();
            currentY = getCoordsY(e);
            // CORRECTION SENS : diff = startY - currentY (inversion pour geste naturel : swipe down → +valeur)
            const diff = startY - currentY;
            const currentOffset = currentIndex * SELECTOR_HEIGHT;
            const newOffset = currentOffset + diff;
            element.style.transform = `translateY(-${newOffset}px)`;
        }

        function endDrag(e) {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
            document.removeEventListener('mouseleave', endDrag);
            
            element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // CORRECTION SENS : Même diff inversé
            const diff = startY - currentY;
            const stepsMoved = Math.round(diff / SELECTOR_HEIGHT);

            let newIndex = currentIndex + stepsMoved;
            // FIX WRAPPING : Modulo sur totalValues (buffer neutralisé)
            const dataOffset = newIndex - buffer;
            const wrappedOffset = ((dataOffset % totalValues) + totalValues) % totalValues;
            newIndex = wrappedOffset + buffer;

            currentIndex = newIndex;
            updateDisplay(currentIndex);
        }

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false });
    }

    // MAJ AFFICHAGE COURANT (main)
    function updateCurrentDisplay() {
        const finalTemp = config.degrees.currentValue + (config.dixiemes.currentValue / 10) + (config.unites.currentValue / 100);
        currentDisplay.textContent = `${finalTemp.toFixed(2)}°C`;
    }

    // MAJ AFFICHAGE COURANT (add modal)
    function updateAddCurrentDisplay() {
        const finalTemp = addConfig.degrees.currentValue + (addConfig.dixiemes.currentValue / 10) + (addConfig.unites.currentValue / 100);
        addCurrentDisplay.textContent = `${finalTemp.toFixed(2)}°C`;
    }

    // MAJ AFFICHAGE COURANT (edit modal : Nouveau)
    function updateEditCurrentDisplay() {
        const finalTemp = editConfig.degrees.currentValue + (editConfig.dixiemes.currentValue / 10) + (editConfig.unites.currentValue / 100);
        editCurrentDisplay.textContent = `${finalTemp.toFixed(2)}°C`;
    }

    // TRI CHRONO HISTORIQUE (asc : oldest first)
    function sortTemperatures() {
        temperatures.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // RENDU HISTORIQUE (avec group jour)
    function renderHistory() {
        sortTemperatures();
        temperatureList.innerHTML = '';
        
        if (temperatures.length === 0) {
            temperatureList.innerHTML = '<li style="text-align: center; color: var(--text-muted);">Aucune température enregistrée.</li>';
            chartTitle.textContent = 'Pas assez de données pour le graphe';
            if (chart) chart.destroy();
            return;
        }

        let currentDay = null;
        temperatures.forEach((temp, index) => {
            const date = new Date(temp.timestamp);
            const dayKey = date.toLocaleDateString('fr-FR');

            if (dayKey !== currentDay) {
                const sep = document.createElement('li');
                sep.classList.add('day-separator');
                sep.textContent = `Jour du ${dayKey}`;
                temperatureList.appendChild(sep);
                currentDay = dayKey;
            }

            const li = document.createElement('li');
            const dateStr = date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
            li.innerHTML = `
                <div>
                    <span>${dateStr}</span>
                    <span class="temp-value">${temp.value.toFixed(2)}°C</span>
                </div>
                <div class="temp-actions">
                    <button onclick="editTemp(${index})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTemp(${index})" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            `;
            temperatureList.appendChild(li);
        });

        updateGraph();
    }

    // GRAPHE MENSUEL
    function updateGraph() {
        if (temperatures.length === 0) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const dailyTemps = {};
        temperatures.forEach(temp => {
            const date = new Date(temp.timestamp);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                const day = date.getDate();
                if (!dailyTemps[day] || new Date(temp.timestamp) > new Date(dailyTemps[day].timestamp)) {
                    dailyTemps[day] = temp;
                }
            }
        });

        const days = Object.keys(dailyTemps).sort((a, b) => a - b);
        const temps = days.map(day => dailyTemps[day].value);
        const labels = days.map(day => `Jour ${day}`);

        chartTitle.textContent = `Évolution Mensuelle (${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} )`;

        if (chart) chart.destroy();
        const ctx = chartCanvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Température (°C)',
                    data: temps,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 34,
                        max: 42
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(2)}°C`;
                            }
                        }
                    }
                }
            }
        });
    }

    // FONCTIONS MODAL AJOUT MANUEL
    function showAddManualModal() {
        addConfig.degrees.currentValue = addConfig.degrees.defaultValue;
        addConfig.dixiemes.currentValue = addConfig.dixiemes.defaultValue;
        addConfig.unites.currentValue = addConfig.unites.defaultValue;
        renderSelector(addConfig.degrees);
        renderSelector(addConfig.dixiemes);
        renderSelector(addConfig.unites);
        initSwipe(addConfig.degrees, true); // true pour modal ajout
        initSwipe(addConfig.dixiemes, true);
        initSwipe(addConfig.unites, true);
        updateAddCurrentDisplay();

        const now = new Date();
        const minDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().slice(0, 16);
        const maxDate = new Date(now.getFullYear() + 1, 11, 31).toISOString().slice(0, 16);
        addDateInput.min = minDate;
        addDateInput.max = maxDate;
        addDateInput.value = now.toISOString().slice(0, 16);
        addDateInput.focus();
        addManualModal.style.display = 'flex';
    }

    function hideAddManualModal() {
        addManualModal.style.display = 'none';
    }

    addManualOk.addEventListener('click', () => {
        addManualOk.classList.add('validating');
        const newDateStr = addDateInput.value;
        setTimeout(() => {
            let manualTimestamp = new Date().toISOString();
            if (newDateStr && newDateStr !== '') {
                const newDate = new Date(newDateStr + ':00');
                if (!isNaN(newDate.getTime())) {
                    manualTimestamp = newDate.toISOString();
                }
            }

            const degrees = addConfig.degrees.currentValue;
            const dixiemes = addConfig.dixiemes.currentValue / 10;
            const unites = addConfig.unites.currentValue / 100;
            const finalTemp = degrees + dixiemes + unites;

            const newEntry = {
                value: finalTemp,
                timestamp: manualTimestamp
            };

            temperatures.push(newEntry);
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
            hideAddManualModal();
            addManualOk.classList.remove('validating');

            addManualBtn.textContent = `Ajouté : ${finalTemp.toFixed(2)}°C`;
            setTimeout(() => {
                addManualBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter Manuel';
            }, 1500);
        }, 500);
    });

    addManualCancel.addEventListener('click', () => {
        hideAddManualModal();
    });

    addDateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addManualOk.click();
        if (e.key === 'Escape') addManualCancel.click();
    });

    window.addEventListener('click', (e) => {
        if (e.target === addManualModal) addManualCancel.click();
    });

    // FONCTIONS MODAL ÉDITION (Nouveau : Unifié)
    function showEditModal(index) {
        editingIndex = index;
        const temp = temperatures[index];

        // Préremplir date
        const date = new Date(temp.timestamp);
        const minDate = new Date(date.getFullYear() - 1, 0, 1).toISOString().slice(0, 16);
        const maxDate = new Date(date.getFullYear() + 1, 11, 31).toISOString().slice(0, 16);
        editDateInput.min = minDate;
        editDateInput.max = maxDate;
        editDateInput.value = date.toISOString().slice(0, 16);

        // Préremplir temp roulettes
        editConfig.degrees.currentValue = Math.floor(temp.value);
        const decimal = (temp.value % 1) * 100;
        editConfig.dixiemes.currentValue = Math.floor(decimal / 10);
        editConfig.unites.currentValue = Math.round(decimal % 10);
        renderSelector(editConfig.degrees);
        renderSelector(editConfig.dixiemes);
        renderSelector(editConfig.unites);
        initSwipe(editConfig.degrees, true); // true = modal mode
        initSwipe(editConfig.dixiemes, true);
        initSwipe(editConfig.unites, true);
        updateEditCurrentDisplay();

        // Show modal
        editModal.style.display = 'flex';
        editDateInput.focus();
    }

    function hideEditModal() {
        editModal.style.display = 'none';
        editingIndex = -1;
    }

    editOk.addEventListener('click', () => {
        editOk.classList.add('validating');
        const newDateStr = editDateInput.value;
        setTimeout(() => {
            let editTimestamp = temperatures[editingIndex].timestamp;
            if (newDateStr && newDateStr !== '') {
                const newDate = new Date(newDateStr + ':00');
                if (!isNaN(newDate.getTime())) {
                    editTimestamp = newDate.toISOString();
                }
            }

            const degrees = editConfig.degrees.currentValue;
            const dixiemes = editConfig.dixiemes.currentValue / 10;
            const unites = editConfig.unites.currentValue / 100;
            const finalTemp = degrees + dixiemes + unites;

            temperatures[editingIndex] = { value: finalTemp, timestamp: editTimestamp };
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
            hideEditModal();
            editOk.classList.remove('validating');
        }, 500);
    });

    editCancel.addEventListener('click', () => {
        hideEditModal();
    });

    editDateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') editOk.click();
        if (e.key === 'Escape') editCancel.click();
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) editCancel.click();
    });

    // ACTIONS HISTORIQUE
    window.deleteTemp = function(index) {
        if (confirm('Supprimer cette mesure ?')) {
            temperatures.splice(index, 1);
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
        }
    };

    window.editTemp = function(index) {
        showEditModal(index);
    };

    window.clearAllTemps = function() {
        if (confirm('Vider tout l\'historique ?')) {
            temperatures = [];
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
        }
    };

    clearButton.addEventListener('click', window.clearAllTemps);
    addManualBtn.addEventListener('click', showAddManualModal);

    // ENREGISTREMENT (Simplifié : Seulement pour ajouts neufs, éditions dans modal)
    saveButton.addEventListener('click', () => {
        const degrees = config.degrees.currentValue;
        const dixiemes = config.dixiemes.currentValue / 10;
        const unites = config.unites.currentValue / 100;
        const finalTemp = degrees + dixiemes + unites;

        const newEntry = {
            value: finalTemp,
            timestamp: new Date().toISOString()
        };

        temperatures.push(newEntry);
        localStorage.setItem('temperatures', JSON.stringify(temperatures));
        renderHistory();
        updateCurrentDisplay();
        
        saveButton.textContent = `Enregistré : ${finalTemp.toFixed(2)}°C`;
        setTimeout(() => {
            config.degrees.currentValue = config.degrees.defaultValue;
            config.dixiemes.currentValue = config.dixiemes.defaultValue;
            config.unites.currentValue = config.unites.defaultValue;
            renderSelector(config.degrees);
            renderSelector(config.dixiemes);
            renderSelector(config.unites);
            initSwipe(config.degrees);
            initSwipe(config.dixiemes);
            initSwipe(config.unites);
            updateCurrentDisplay();
            saveButton.textContent = "Enregistrer la Température";
        }, 1500);
    });

    // --- INITIALISATION ---
    renderSelector(config.degrees);
    renderSelector(config.dixiemes);
    renderSelector(config.unites);
    initSwipe(config.degrees);
    initSwipe(config.dixiemes);
    initSwipe(config.unites);
    updateCurrentDisplay();
    renderHistory();
}

// Point d'entrée
document.addEventListener('DOMContentLoaded', initializeApp);