// script.js (Version Corrigée & Améliorée)

// --- LOGIQUE PRINCIPALE ---

function initializeApp() {
    const degreesScroll = document.getElementById('degrees-scroll');
    const centiemesScroll = document.getElementById('centiemes-scroll');
    const saveButton = document.getElementById('save-button');
    const temperatureList = document.getElementById('temperature-list');
    const currentDisplay = document.getElementById('current-display');
    const clearButton = document.getElementById('clear-history');
    const themeToggle = document.getElementById('theme-toggle');

    // Configuration - BUFFER GLOBALISÉ pour fix bug index
    const BUFFER = 5;
    const SELECTOR_HEIGHT = 80;
    const config = {
        degrees: {
            element: degreesScroll, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36,
            format: (val) => val.toString().padStart(2, '0'),
            buffer: BUFFER
        },
        centiemes: {
            element: centiemesScroll, min: 0, max: 99, step: 1, defaultValue: 0, currentValue: 0,
            format: (val) => val.toString().padStart(2, '0'),
            buffer: BUFFER
        }
    };

    let temperatures = JSON.parse(localStorage.getItem('temperatures')) || [];
    let editingIndex = -1; // Pour édition : index de l'entrée à modifier

    // THÈME SOMBRÉ
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.querySelector('i').classList.toggle('fa-moon', savedTheme === 'light');
    themeToggle.querySelector('i').classList.toggle('fa-sun', savedTheme === 'dark');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.querySelector('i').classList.toggle('fa-moon', newTheme === 'light');
        themeToggle.querySelector('i').classList.toggle('fa-sun', newTheme === 'dark');
    });

    // FONCTION RENDU ROULETTE (Inchangée sauf buffer passé)
    function renderSelector(selectorConfig) {
        const { element, min, max, step, format, defaultValue, buffer } = selectorConfig;
        element.innerHTML = '';

        // Dummies haut
        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }

        let defaultIndex = -1;
        for (let i = min; i <= max; i += step) {
            const valueEl = document.createElement('div');
            valueEl.classList.add('value');
            valueEl.setAttribute('data-value', i);
            valueEl.textContent = format(i);
            valueEl.style.height = `${SELECTOR_HEIGHT}px`;
            
            if (i === defaultValue) {
                valueEl.classList.add('current-value');
                defaultIndex = element.children.length;
            }
            element.appendChild(valueEl);
        }

        // Dummies bas
        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }
        
        if (defaultIndex !== -1) {
            const initialOffset = (defaultIndex - buffer) * SELECTOR_HEIGHT; // Offset depuis buffer
            element.style.transform = `translateY(-${initialOffset}px)`;
            selectorConfig.currentValue = defaultValue;
            selectorConfig.startIndex = defaultIndex;
        }
    }

    // SWIPE CORRIGÉ : dataIndex = newIndex - BUFFER (fix bug init/swipe)
    function initSwipe(selectorConfig) {
        const { element, min, max, step, buffer } = selectorConfig;
        let startY = 0;
        let currentY = 0;
        let currentIndex = selectorConfig.startIndex || buffer; // Fallback à buffer
        const totalValues = (max - min) / step + 1;

        function updateDisplay(newIndex) {
            const children = element.querySelectorAll('.value');
            const dataIndex = newIndex - buffer; // FIX : -buffer au lieu de -startIndex
            const valueIndex = Math.min(Math.max(0, dataIndex), totalValues - 1);
            const newValue = min + valueIndex * step;

            children.forEach((child, index) => {
                child.classList.remove('current-value');
                if (index === newIndex) {
                    child.classList.add('current-value');
                }
            });

            selectorConfig.currentValue = newValue;
            const offset = (newIndex - buffer) * SELECTOR_HEIGHT; // FIX cohérent
            element.style.transform = `translateY(-${offset}px)`;

            // MAJ AFFICHAGE COURANT
            updateCurrentDisplay();
        }

        updateDisplay(currentIndex); // Init correcte maintenant

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
            const diff = currentY - startY;
            const currentOffset = (currentIndex - buffer) * SELECTOR_HEIGHT; // FIX
            const newOffset = currentOffset - diff;
            element.style.transform = `translateY(-${newOffset}px)`;
        }

        function endDrag(e) {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
            document.removeEventListener('mouseleave', endDrag);
            
            element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const diff = currentY - startY;
            const stepsMoved = Math.round(diff / SELECTOR_HEIGHT);

            let newIndex = currentIndex - stepsMoved;
            const minIndex = buffer;
            const maxIndex = buffer + totalValues - 1;
            newIndex = Math.min(Math.max(minIndex, newIndex), maxIndex);

            currentIndex = newIndex;
            updateDisplay(currentIndex);
        }

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false });
    }

    // MAJ AFFICHAGE COURANT
    function updateCurrentDisplay() {
        const finalTemp = config.degrees.currentValue + (config.centiemes.currentValue / 100);
        currentDisplay.textContent = `${finalTemp.toFixed(2)}°C`;
    }

    // RENDU HISTORIQUE (avec actions)
    function renderHistory() {
        temperatureList.innerHTML = '';
        
        if (temperatures.length === 0) {
            temperatureList.innerHTML = '<li style="text-align: center; color: var(--text-muted);">Aucune température enregistrée.</li>';
            return;
        }
        
        temperatures.forEach((temp, index) => {
            const li = document.createElement('li');
            const date = new Date(temp.timestamp);
            const dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
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
    }

    // FONCTIONS GLOBALES pour actions (exposées pour onclick)
    window.deleteTemp = function(index) {
        if (confirm('Supprimer cette mesure ?')) {
            temperatures.splice(index, 1);
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
        }
    };

    window.editTemp = function(index) {
        editingIndex = index;
        const temp = temperatures[index];
        config.degrees.currentValue = Math.floor(temp.value);
        config.centiemes.currentValue = Math.round((temp.value % 1) * 100);
        // Re-render pour reset roulettes à cette valeur
        renderSelector(config.degrees);
        renderSelector(config.centiemes);
        initSwipe(config.degrees);
        initSwipe(config.centiemes);
        updateCurrentDisplay();
        saveButton.textContent = 'Modifier & Enregistrer';
        saveButton.classList.add('saving');
    };

    window.clearAllTemps = function() {
        if (confirm('Vider tout l\'historique ?')) {
            temperatures = [];
            localStorage.setItem('temperatures', JSON.stringify(temperatures));
            renderHistory();
        }
    };

    // VIDAGE HISTORIQUE
    clearButton.addEventListener('click', window.clearAllTemps);

    // ENREGISTREMENT (gère édition)
    saveButton.addEventListener('click', () => {
        const degrees = config.degrees.currentValue;
        const centiemes = config.centiemes.currentValue / 100;
        const finalTemp = degrees + centiemes;

        const newEntry = {
            value: finalTemp,
            timestamp: new Date().toISOString()
        };

        if (editingIndex >= 0) {
            // Édition : Remplace
            temperatures[editingIndex] = newEntry;
            editingIndex = -1;
            saveButton.textContent = `Modifié : ${finalTemp.toFixed(2)}°C`;
        } else {
            // Nouveau : Ajoute au début
            temperatures.unshift(newEntry);
            saveButton.textContent = `Enregistré : ${finalTemp.toFixed(2)}°C`;
        }
        
        localStorage.setItem('temperatures', JSON.stringify(temperatures));
        renderHistory();
        updateCurrentDisplay();
        
        // Reset roulettes à default après save
        setTimeout(() => {
            config.degrees.currentValue = 36;
            config.centiemes.currentValue = 0;
            renderSelector(config.degrees);
            renderSelector(config.centiemes);
            initSwipe(config.degrees);
            initSwipe(config.centiemes);
            updateCurrentDisplay();
            saveButton.textContent = editingIndex >= 0 ? "Enregistrer la Température" : "Enregistrer la Température";
            saveButton.classList.remove('saving');
        }, 1500);
    });

    // --- INITIALISATION ---
    renderSelector(config.degrees);
    renderSelector(config.centiemes);
    initSwipe(config.degrees);
    initSwipe(config.centiemes);
    updateCurrentDisplay();
    renderHistory();
}

// Point d'entrée
document.addEventListener('DOMContentLoaded', initializeApp);