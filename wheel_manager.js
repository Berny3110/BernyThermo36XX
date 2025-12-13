// wheel_manager.js - Gestion des roues de sélection
const BUFFER = 5;
const ITEM_HEIGHT = 60;

export class WheelManager {
    constructor(dom, data) {
        this.dom = dom;
        this.data = data;
        
        this.mainConfig = {
            degrees: { element: dom.mainSelectors.degrees, min: 34, max: 39, step: 1, defaultValue: 36, currentValue: 36, isRepeating: false },
            dixiemes: { element: dom.mainSelectors.dixiemes, min: 0, max: 9, step: 1, defaultValue: 3, currentValue: 3, isRepeating: true },
            unites: { element: dom.mainSelectors.unites, min: 0, max: 9, step: 1, defaultValue: 0, currentValue: 0, isRepeating: true }
        };
    }

    initMainWheels() {
        ['degrees', 'dixiemes', 'unites'].forEach(key => {
            this.renderSelector(this.mainConfig[key]);
            this.initSwipe(this.mainConfig[key], () => this.updateMainDisplay());
        });
        this.updateMainDisplay();
    }

    initModalWheels(config, displayCallback) {
        ['degrees', 'dixiemes', 'unites'].forEach(key => {
            this.renderSelector(config[key]);
            this.initSwipe(config[key], displayCallback);
        });
    }

    renderSelector(cfg) {
        const { element, min, max, step, currentValue, isRepeating } = cfg;
        if (!element) return;

        element.innerHTML = '';

        const rangeSize = (max - min) / step + 1;

        const generateSequence = () => {
            let html = '';
            for (let i = max; i >= min; i -= step) {
                html += `<div class="value">${i}</div>`;
            }
            return html;
        };

        // Padding supérieur (dummy)
        for (let i = 0; i < BUFFER; i++) {
            element.innerHTML += '<div class="value dummy"></div>';
        }

        let offsetIndexAdjustment = 0;

        if (isRepeating) {
            element.innerHTML += generateSequence();
            element.innerHTML += generateSequence();
            offsetIndexAdjustment = 2 * rangeSize;
        }

        element.innerHTML += generateSequence();

        if (isRepeating) {
            element.innerHTML += generateSequence();
            element.innerHTML += generateSequence();
        }

        const idxInSequence = (max - currentValue) / step;
        cfg.selectionIdx = idxInSequence + offsetIndexAdjustment;
        const offset = (cfg.selectionIdx + BUFFER - 1.5) * ITEM_HEIGHT;

        element.style.transform = `translateY(-${offset}px)`;

        // Ajout direct de current-value
        const values = element.querySelectorAll('.value:not(.dummy)');
        values.forEach(v => v.classList.remove('current-value'));
        if (values[cfg.selectionIdx]) {
            values[cfg.selectionIdx].classList.add('current-value');
        }
    }

    initSwipe(cfg, callbackDisplay) {
        const { element, min, max, step, buffer = BUFFER, isRepeating } = cfg;
        if (!element) return;
        
        let startY = 0, currentY = 0, isDragging = false;
        let currentIndex = cfg.selectionIdx || (max - cfg.currentValue) / step;
        const rangeSize = (max - min) / step + 1;

        const updateVisuals = (yOffset, index) => {
            element.style.transform = `translateY(-${yOffset}px)`;

            let actualIndex = index;
            if (isRepeating) {
                actualIndex = (index - (2 * rangeSize)) % rangeSize;
                if (actualIndex < 0) actualIndex += rangeSize;
            }

            cfg.currentValue = max - (actualIndex * step);

            const values = element.querySelectorAll('.value:not(.dummy)');
            values.forEach(v => v.classList.remove('current-value'));
            if (values[index]) values[index].classList.add('current-value');

            if (callbackDisplay) callbackDisplay();
        };

        const onStart = (e) => {
            isDragging = true;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            const style = window.getComputedStyle(element);
            const matrix = new WebKitCSSMatrix(style.transform);
            currentY = -matrix.m42;
            element.style.transition = 'none';
            e.stopPropagation();
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const delta = clientY - startY;
            const scrollY = currentY + delta;
            element.style.transform = `translateY(-${scrollY}px)`;
            e.stopPropagation();
        };

        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            element.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';

            const style = window.getComputedStyle(element);
            const matrix = new WebKitCSSMatrix(style.transform);
            let finalScrollY = -matrix.m42;
            let newIndex = Math.round((finalScrollY - (buffer - 1.5) * ITEM_HEIGHT) / ITEM_HEIGHT);

            if (!isRepeating) {
                const maxIdx = (max - min) / step;
                newIndex = Math.max(0, Math.min(maxIdx, newIndex));
                currentIndex = newIndex;
            } else {
                const centerStart = 2 * rangeSize;
                const centerEnd = 3 * rangeSize - 1;

                if (newIndex < centerStart) {
                    newIndex = centerEnd - (centerStart - newIndex - 1);
                    element.style.transition = 'none';
                    const offset = (newIndex + buffer - 1.5) * ITEM_HEIGHT;
                    element.style.transform = `translateY(-${offset}px)`;
                    setTimeout(() => {
                        element.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                    }, 10);
                } else if (newIndex > centerEnd) {
                    newIndex = centerStart + (newIndex - centerEnd - 1);
                    element.style.transition = 'none';
                    const offset = (newIndex + buffer - 1.5) * ITEM_HEIGHT;
                    element.style.transform = `translateY(-${offset}px)`;
                    setTimeout(() => {
                        element.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                    }, 10);
                }

                currentIndex = newIndex;
            }

            const offset = (currentIndex + buffer - 1.5) * ITEM_HEIGHT;
            updateVisuals(offset, currentIndex);
            cfg.selectionIdx = currentIndex;
            e.stopPropagation();
        };

        // Ajout des listeners avec capture pour les modales
        element.addEventListener('touchstart', onStart, { passive: false, capture: true });
        element.addEventListener('touchmove', onMove, { passive: false, capture: true });
        element.addEventListener('touchend', onEnd, { capture: true });
        element.addEventListener('mousedown', onStart, { capture: true });
        
        // Pour les événements souris globaux
        const mouseMoveHandler = (e) => onMove(e);
        const mouseUpHandler = (e) => {
            onEnd(e);
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
        };
        
        element.addEventListener('mousedown', () => {
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        });
    }

    getMainValue() {
        const d = this.mainConfig.degrees.currentValue;
        const dx = this.mainConfig.dixiemes.currentValue;
        const u = this.mainConfig.unites.currentValue;
        return d + dx / 10 + u / 100;
    }

    getValue(config) {
        const d = config.degrees.currentValue;
        const dx = config.dixiemes.currentValue;
        const u = config.unites.currentValue;
        return d + dx / 10 + u / 100;
    }

    updateMainDisplay() {
        this.dom.display.textContent = this.getMainValue().toFixed(2) + '°C';
    }

    createModalConfig(modalId, defaults) {
        console.log('🔧 Creating modal config for:', modalId);
        const selectors = this.dom.getModalSelectors(modalId);
        console.log('📍 Selectors found:', {
            degrees: selectors.degrees?.id,
            dixiemes: selectors.dixiemes?.id,
            unites: selectors.unites?.id
        });
        
        return {
            degrees: { element: selectors.degrees, min: 34, max: 38, step: 1, defaultValue: defaults.d, currentValue: defaults.d, isRepeating: false },
            dixiemes: { element: selectors.dixiemes, min: 0, max: 9, step: 1, defaultValue: defaults.dx, currentValue: defaults.dx, isRepeating: true },
            unites: { element: selectors.unites, min: 0, max: 9, step: 1, defaultValue: defaults.u, currentValue: defaults.u, isRepeating: true }
        };
    }

    getModalSelectors(prefix) {
        const modalId = prefix === 'edit-' ? 'edit-modal' : 'add-manual-modal';
        return this.dom.getModalSelectors(modalId);
    }
}