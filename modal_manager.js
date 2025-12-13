// modal-manager.js - Gestion des modales
export class ModalManager {
    constructor(dom, data, wheel) {
        this.dom = dom;
        this.data = data;
        this.wheel = wheel;
        this.editingIndex = -1;
        this.manualConfig = null;
        this.editConfig = null;

        this.initEvents();
    }

    initEvents() {
        // Modal Cycle Date
        this.dom.modalBtns.cycleCancel.addEventListener('click', () => {
            this.dom.modals.cycle.style.display = 'none';
        });

        this.dom.modalBtns.cycleOk.addEventListener('click', () => {
            if (this.dom.inputs.cycleStart.value) {
                const event = new CustomEvent('cycle-date-update', {
                    detail: { date: this.dom.inputs.cycleStart.value }
                });
                window.dispatchEvent(event);
                this.dom.modals.cycle.style.display = 'none';
            }
        });

        // Modal Manual
				this.dom.modalBtns.manualCancel.addEventListener('click', () => {
            this.dom.modals.manual.style.display = 'none';
            document.body.classList.remove('modal-open'); // <-- AJOUTÉ
        });

        this.dom.modalBtns.manualOk.addEventListener('click', () => {
            const value = this.wheel.getValue(this.manualConfig);
            const timestamp = this.dom.inputs.manualDate.value 
                ? new Date(this.dom.inputs.manualDate.value).toISOString()
                : new Date().toISOString();
            
            this.data.addTemperature(value, timestamp);
            this.dom.modals.manual.style.display = 'none';
            document.body.classList.remove('modal-open'); // <-- AJOUTÉ
            
            const event = new Event('data-updated');
            window.dispatchEvent(event);
        });

        // Modal Edit
        this.dom.modalBtns.editCancel.addEventListener('click', () => {
            this.dom.modals.edit.style.display = 'none';
            document.body.classList.remove('modal-open'); // <-- AJOUTÉ
        });

        this.dom.modalBtns.editOk.addEventListener('click', () => {
            if (this.editingIndex > -1) {
                const value = this.wheel.getValue(this.editConfig);
                const timestamp = this.dom.inputs.editDate.value
                    ? new Date(this.dom.inputs.editDate.value).toISOString()
                    : null;
                
                this.data.updateTemperature(this.editingIndex, value, timestamp);
                this.dom.modals.edit.style.display = 'none';
                document.body.classList.remove('modal-open'); // <-- AJOUTÉ
                
                const event = new Event('data-updated');
                window.dispatchEvent(event);
            }
        });

        // Listen to custom events
        window.addEventListener('cycle-date-update', (e) => {
            window.thermoApp?.cycle.updateStartDate(e.detail.date);
            window.thermoApp?.renderAll();
        });

        window.addEventListener('data-updated', () => {
            window.thermoApp?.renderAll();
        });
    }

    openManual() {
        console.log('📝 Opening manual modal...');
        this.dom.inputs.manualDate.value = new Date().toISOString().slice(0, 16);
        
        // Utilise le modalId au lieu du prefix
        this.manualConfig = this.wheel.createModalConfig('add-manual-modal', { d: 36, dx: 6, u: 0 });
        
        console.log('📊 Manual config created:', this.manualConfig);
        
        const displayElement = document.getElementById('add-current-display');
        const updateDisplay = () => {
            displayElement.textContent = this.wheel.getValue(this.manualConfig).toFixed(2) + '°C';
        };

        this.wheel.initModalWheels(this.manualConfig, updateDisplay);
        updateDisplay();
        
        this.dom.modals.manual.style.display = 'flex';
        document.body.classList.add('modal-open');
        console.log('✅ Manual modal opened');
    }

    openEdit(index) {
        console.log('✏️ Opening edit modal for index:', index);
        this.editingIndex = index;
        const temps = this.data.getTemperaturesSorted();
        const t = temps[index];

        this.dom.inputs.editDate.value = new Date(t.timestamp).toISOString().slice(0, 16);
				
				const valueInt = Math.round(t.value * 100);

        const d = Math.floor(t.value);
        const dx = Math.floor((t.value % 1) * 10);
        const u = Math.round((t.value % 0.1) * 100);

        console.log('🔢 Edit values - d:', d, 'dx:', dx, 'u:', u);

        // Utilise le modalId au lieu du prefix
        this.editConfig = this.wheel.createModalConfig('edit-modal', { d, dx, u });
        
        console.log('📊 Edit config created:', this.editConfig);

        const displayElement = document.getElementById('edit-current-display');
        const updateDisplay = () => {
            displayElement.textContent = this.wheel.getValue(this.editConfig).toFixed(2) + '°C';
        };

        this.wheel.initModalWheels(this.editConfig, updateDisplay);
        updateDisplay();

        this.dom.modals.edit.style.display = 'flex';
        document.body.classList.add('modal-open');
        console.log('✅ Edit modal opened');
    }

    openCycleDate() {
        const cycleStart = window.thermoApp?.cycle.getStartDate();
        if (!cycleStart) return;
        
        this.dom.inputs.cycleStart.value = new Date(cycleStart).toISOString().split('T')[0];
        this.dom.modals.cycle.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}