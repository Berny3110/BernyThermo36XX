// script.js (Version Simplifiée)

// --- LOGIQUE PRINCIPALE DE L'APPLICATION ---

function initializeApp() {
    const degreesScroll = document.getElementById('degrees-scroll');
    const centiemesScroll = document.getElementById('centiemes-scroll');
    const saveButton = document.getElementById('save-button');
    const temperatureList = document.getElementById('temperature-list');

    // Configuration des SÉLECTEURS
    const SELECTOR_HEIGHT = 80; 
    const config = {
        degrees: {
            element: degreesScroll, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36,
            format: (val) => val.toString().padStart(2, '0') 
        },
        centiemes: {
            element: centiemesScroll, min: 0, max: 99, step: 1, defaultValue: 0, currentValue: 0,
            format: (val) => val.toString().padStart(2, '0') 
        }
    };

    let temperatures = JSON.parse(localStorage.getItem('temperatures')) || [];

    // FONCTIONS de Rendu et de Swipe (Roulette) - (Le code de ces fonctions reste inchangé)
    function renderSelector(selectorConfig) {
        // ... (Code de renderSelector) ...
        const { element, min, max, format, defaultValue } = selectorConfig;
        element.innerHTML = '';
        const buffer = 5; 
        
        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.textContent = ''; 
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }

        let defaultIndex = -1;
        
        for (let i = min; i <= max; i += selectorConfig.step) {
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

        for (let i = 0; i < buffer; i++) {
            const dummy = document.createElement('div');
            dummy.classList.add('value', 'dummy');
            dummy.textContent = ''; 
            dummy.style.height = `${SELECTOR_HEIGHT}px`;
            element.appendChild(dummy);
        }
        
        if (defaultIndex !== -1) {
            const initialOffset = (defaultIndex - buffer) * SELECTOR_HEIGHT;
            element.style.transform = `translateY(-${initialOffset}px)`;
            selectorConfig.currentValue = defaultValue;
            selectorConfig.startIndex = defaultIndex; 
        }
    }

    function initSwipe(selectorConfig) {
        const { element, min, max, step } = selectorConfig;
        let startY = 0;
        let currentY = 0;
        let currentIndex = selectorConfig.startIndex;
        const totalValues = (max - min) / step + 1;

        function updateDisplay(newIndex) {
            const children = element.querySelectorAll('.value');
            const dataIndex = newIndex - selectorConfig.startIndex;
            const valueIndex = Math.min(Math.max(0, dataIndex), totalValues - 1);
            const newValue = min + valueIndex * step;

            children.forEach((child, index) => {
                child.classList.remove('current-value');
                if (index === newIndex) {
                    child.classList.add('current-value');
                }
            });

            selectorConfig.currentValue = newValue;

            const offset = (newIndex - (selectorConfig.startIndex)) * SELECTOR_HEIGHT;
            element.style.transform = `translateY(-${offset}px)`;
        }

        updateDisplay(currentIndex);

        // NOUVELLE FONCTION UTILITAIRE POUR UNE MEILLEURE LECTURE DES COORDONNÉES
        function getCoordsY(e) {
            // Pour les événements tactiles (touch)
            if (e.touches && e.touches.length > 0) {
                return e.touches[0].clientY;
            }
            // Pour les événements tactiles (touch end/change)
            if (e.changedTouches && e.changedTouches.length > 0) {
                 return e.changedTouches[0].clientY;
            }
            // Pour les événements souris
            return e.clientY;
        }

        // Gère le début du glissement (click ou touch)
        function startDrag(e) {
            // Empêcher le comportement par défaut (comme la sélection de texte sur PC)
            e.preventDefault(); 
            
            // On s'assure de récupérer la bonne coordonnée y pour le début du mouvement
            startY = getCoordsY(e);
            
            element.style.transition = 'none'; // Désactiver la transition pendant le drag

            // On attache les écouteurs au document pour ne pas perdre le mouvement
            document.addEventListener('mousemove', drag);
            // { passive: false } est crucial sur mobile pour permettre le preventDefault
            document.addEventListener('touchmove', drag, { passive: false }); 
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
            document.addEventListener('mouseleave', endDrag); // Utile sur PC
        }

        // Gère le mouvement de glissement (drag)
        function drag(e) {
            // Empêche le défilement de la page mobile pendant le glissement de la roulette
            e.preventDefault(); 
            
            currentY = getCoordsY(e);
            
            const diff = currentY - startY;
            const currentOffset = (currentIndex - selectorConfig.startIndex) * SELECTOR_HEIGHT;
            const newOffset = currentOffset - diff;
            
            element.style.transform = `translateY(-${newOffset}px)`;
        }

        // Gère la fin du glissement (lâcher)
        function endDrag(e) {
            // Enlever les écouteurs attachés au document
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
            document.removeEventListener('mouseleave', endDrag); 
            
            element.style.transition = 'transform 0.2s ease-out'; // Réactiver la transition
            
            // Assurez-vous d'utiliser la dernière position de 'currentY'
            const diff = currentY - startY;
            const stepsMoved = Math.round(diff / SELECTOR_HEIGHT);

            let newIndex = currentIndex - stepsMoved;

            // Limiter l'index aux valeurs réelles
            const minIndex = selectorConfig.startIndex;
            const maxIndex = selectorConfig.startIndex + totalValues - 1;
            newIndex = Math.min(Math.max(minIndex, newIndex), maxIndex); 

            currentIndex = newIndex;
            updateDisplay(currentIndex);
        }

        // Initialisation : Attachement des événements de départ à l'élément de la roulette
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false }); // Ajout de { passive: false }
    }
    
    // GESTION de l'HISTORIQUE
    function renderHistory() {
        temperatureList.innerHTML = '';
        
        if (temperatures.length === 0) {
             temperatureList.innerHTML = '<li>Aucune température enregistrée.</li>';
             return;
        }
        
        temperatures.forEach((temp) => {
            const li = document.createElement('li');
            const date = new Date(temp.timestamp);
            const dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
            li.innerHTML = `
                <span>${dateStr}</span>
                <span class="temp-value">${temp.value.toFixed(2)}°C</span>
            `;
            temperatureList.appendChild(li);
        });
    }

    // GESTION de l'ENREGISTREMENT
    saveButton.addEventListener('click', () => {
        const degrees = config.degrees.currentValue;
        const centiemes = config.centiemes.currentValue / 100;
        const finalTemp = degrees + centiemes;

        const newEntry = {
            value: finalTemp,
            timestamp: new Date().toISOString()
        };

        temperatures.unshift(newEntry);
        
        localStorage.setItem('temperatures', JSON.stringify(temperatures));
        renderHistory();
        
        saveButton.textContent = `Enregistré : ${finalTemp.toFixed(2)}°C`;
        setTimeout(() => {
            saveButton.textContent = "Enregistrer la Température";
        }, 1500);
    });

    // --- INITIALISATION DES COMPOSANTS ---
    renderSelector(config.degrees);
    renderSelector(config.centiemes);
    initSwipe(config.degrees);
    initSwipe(config.centiemes);
    renderHistory();
}

// Point d'entrée : lance l'application directement au chargement
document.addEventListener('DOMContentLoaded', initializeApp);