// dom-manager.js - Gestion des références DOM
export class DOMManager {
    constructor() {
        // Main
        this.display = document.getElementById('current-display');
        this.saveBtn = document.getElementById('save-button');
        this.list = document.getElementById('temperature-list');
        this.chartCanvas = document.getElementById('monthly-chart');
        this.chartCtx = this.chartCanvas.getContext('2d');
        this.themeBtn = document.getElementById('theme-toggle');
        this.todayDate = document.getElementById('today-date');
        
        // Cycle
        this.cycleBtn = document.getElementById('start-cycle-btn');
        this.endCycleBtn = document.getElementById('cycle-end-btn');
        this.cycleStatus = document.getElementById('cycle-status-container');
        this.cycleInfo = document.getElementById('cycle-info');
        
        // Buttons
        this.addManualBtn = document.getElementById('add-manual-btn');
        this.clearBtn = document.getElementById('clear-history');

        // Modals
        this.modals = {
            cycle: document.getElementById('cycle-date-modal'),
            edit: document.getElementById('edit-modal'),
            manual: document.getElementById('add-manual-modal')
        };

        // Inputs
        this.inputs = {
            cycleStart: document.getElementById('cycle-start-input'),
            editDate: document.getElementById('edit-date-input'),
            manualDate: document.getElementById('add-date-input')
        };

        // Modal buttons
        this.modalBtns = {
            cycleOk: document.getElementById('cycle-date-ok'),
            cycleCancel: document.getElementById('cycle-date-cancel'),
            editOk: document.getElementById('edit-ok'),
            editCancel: document.getElementById('edit-cancel'),
            manualOk: document.getElementById('add-manual-ok'),
            manualCancel: document.getElementById('add-manual-cancel')
        };

        // Selectors principaux
        this.mainSelectors = {
            degrees: document.getElementById('degrees-scroll'),
            dixiemes: document.getElementById('dixiemes-scroll'),
            unites: document.getElementById('unites-scroll')
        };

        // Date header
        this.todayDate.textContent = new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
    }

		getModalSelectors(prefix) {
				// 'prefix' est l'ID complet de la modale, ex: 'edit-modal' ou 'add-manual-modal'
				
				// Détermine la base de l'ID pour les sélecteurs de roue
				const idBase = prefix.includes('add-manual') ? 'add' : 'edit';
				
				return {
						// Correction : chercher directement le #scroll-area avec le bon ID
						degrees: document.querySelector(`#${idBase}-degrees-scroll`),
						dixiemes: document.querySelector(`#${idBase}-dixiemes-scroll`),
						unites: document.querySelector(`#${idBase}-unites-scroll`)
				};
		}
}