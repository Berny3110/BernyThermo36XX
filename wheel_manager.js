// wheel-manager.js - Gestion des roues de sélection
const BUFFER = 5;
const ITEM_HEIGHT = 60;

export class WheelManager {
    constructor(dom, data) {
        this.dom = dom;
        this.data = data;
        
        // Config principale
        this.mainConfig = {
            degrees: { element: dom.mainSelectors.degrees, min: 34, max: 42, step: 1, defaultValue: 36, currentValue: 36, isRepeating: false },
            dixiemes: { element: dom.mainSelectors.dixiemes, min: 0, max: 9, step: 1, defaultValue: 6, currentValue: 6, isRepeating: true },
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
        const { element, min, max, step, buffer = BUFFER, currentValue, isRepeating } = cfg;
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

        // Padding supérieur
        for (let i = 0; i < buffer; i++) {
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
        const offset = (cfg.selectionIdx + buffer - 1.5) * ITEM_HEIGHT;

        element.style.transform = `translateY(-${offset}px)`;

        setTimeout(() => {
            const values = element.querySelectorAll('.value:not(.dummy)');
            if (values[cfg.selectionIdx]) {
                values[cfg.selectionIdx].classList.add('current-value');
            }
        }, 50);
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
        };

        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            const delta = startY - y;
            element.style.transform = `translateY(-${currentY + delta}px)`;
        };

        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            element.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            const delta = startY - y;

            const finalScrollY = currentY + delta;
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
        };

        element.addEventListener('touchstart', onStart, { passive: false });
        element.addEventListener('touchmove', onMove, { passive: false });
        element.addEventListener('touchend', onEnd);
        element.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
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

    createModalConfig(prefix, defaults) {
        const selectors = this.getModalSelectors(prefix);
        return {
            degrees: { element: selectors.degrees, min: 34, max: 42, step: 1, defaultValue: defaults.d, currentValue: defaults.d, isRepeating: false },
            dixiemes: { element: selectors.dixiemes, min: 0, max: 9, step: 1, defaultValue: defaults.dx, currentValue: defaults.dx, isRepeating: true },
            unites: { element: selectors.unites, min: 0, max: 9, step: 1, defaultValue: defaults.u, currentValue: defaults.u, isRepeating: true }
        };
    }

    getModalSelectors(prefix) {
        const modalId = prefix === 'edit-' ? 'edit-modal' : 'add-manual-modal';
        const modal = document.getElementById(modalId);
        if (!modal) return { degrees: null, dixiemes: null, unites: null };

        return {
            degrees: modal.querySelector('.degrees .scroll-area'),
            dixiemes: modal.querySelector('.dixiemes .scroll-area'),
            unites: modal.querySelector('.unites .scroll-area')
        };
    }
}
