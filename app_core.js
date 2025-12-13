// app-core.js - Point d'entrée principal
import { DOMManager } from './dom_manager.js';
import { DataManager } from './data_manager.js';
import { WheelManager } from './wheel_manager.js';
import { CycleManager } from './cycle_manager.js';
import { ModalManager } from './modal_manager.js';
import { ChartManager } from './chart_manager.js';
import { ThemeManager } from './theme_manager.js';

class ThermoApp {
    constructor() {
        this.dom = new DOMManager();
        this.data = new DataManager();
        this.theme = new ThemeManager(this.dom);
        this.wheel = new WheelManager(this.dom, this.data);
        this.cycle = new CycleManager(this.dom, this.data);
        this.chart = new ChartManager(this.dom, this.data, this.cycle);
        this.modal = new ModalManager(this.dom, this.data, this.wheel);
    }

    init() {
        // Initialiser le thème
        this.theme.init();

        // Initialiser les roues principales
        this.wheel.initMainWheels();

        // Initialiser le cycle UI
        this.cycle.updateUI();

				// Event: Sauvegarder température
				this.dom.saveBtn.addEventListener('click', () => {
						const value = this.wheel.getMainValue();
						const now = new Date();

						// Cherche s’il existe déjà une mesure aujourd’hui
						const existingToday = this.data.getTemperatureForDate(now);

						if (existingToday) {
								const dateStr = now.toLocaleDateString('fr-FR', {
										weekday: 'long',
										day: 'numeric',
										month: 'long',
										year: 'numeric'
								});

								const confirmReplace = confirm(
										`Vous avez déjà une mesure pour aujourd'hui (${dateStr}) :\n` +
										`${existingToday.value.toFixed(2)}°C\n\n` +
										`Voulez-vous la remplacer par ${value.toFixed(2)}°C ?`
								);

								if (!confirmReplace) {
										return; // Annulation → on sort sans rien faire
								}

								// Suppression de l’ancienne mesure du jour
								this.data.deleteTemperatureByTimestamp(existingToday.timestamp);
						}

						// Ajout de la nouvelle mesure (dans tous les cas)
						this.data.addTemperature(value);

						this.renderAll();

						// Feedback visuel
						this.dom.saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sauvegardé !';
						setTimeout(() => {
								this.dom.saveBtn.innerHTML = '<i class="fas fa-check"></i> Enregistrer';
						}, 2000);
				});

        // Event: Effacer historique
        this.dom.clearBtn.addEventListener('click', () => {
            if (confirm('Tout effacer ?')) {
                this.data.clearAll();
                this.renderAll();
            }
        });

        // Event: Bouton ajout manuel
        this.dom.addManualBtn.addEventListener('click', () => {
            this.modal.openManual();
        });

        // Event: Cycle
        this.dom.cycleBtn.addEventListener('click', () => {
            this.cycle.start();
            this.renderAll();
        });

        this.dom.endCycleBtn.addEventListener('click', () => {
            if (confirm('Terminer ce cycle ?')) {
                this.cycle.end();
                this.renderAll();
            }
        });

        this.dom.cycleInfo.addEventListener('click', () => {
            this.modal.openCycleDate();
        });

        // Event: Thème
        this.dom.themeBtn.addEventListener('click', () => {
            this.theme.toggle();
            this.chart.render();
        });

        // Fonctions globales pour les boutons inline
        window.editTemp = (index) => this.modal.openEdit(index);
        window.deleteTemp = (index) => {
            if (confirm('Supprimer ?')) {
                this.data.deleteTemperature(index);
                this.renderAll();
            }
        };

        // Rendu initial
        this.renderAll();
        setTimeout(() => this.chart.render(), 500);
    }

    renderAll() {
        this.renderList();
        this.chart.render();
        this.cycle.updateUI();
    }

    renderList() {
        this.dom.list.innerHTML = '';
        const temps = this.data.getTemperaturesSorted();
        
        temps.forEach((t, i) => {
            const li = document.createElement('li');
            const d = new Date(t.timestamp);
            li.innerHTML = `
                <div onclick="editTemp(${i})" style="cursor:pointer; flex:1">
                    <div class="temp-val">${t.value.toFixed(2)}°C</div>
                    <div class="temp-time">${d.toLocaleDateString()} à ${d.getHours()}h${d.getMinutes().toString().padStart(2,'0')} <i class="fas fa-pen" style="font-size:0.7em; opacity:0.5"></i></div>
                </div>
                <button onclick="deleteTemp(${i})" class="icon-btn-small danger"><i class="fas fa-times"></i></button>
            `;
            this.dom.list.appendChild(li);
        });
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.thermoApp = new ThermoApp();
    window.thermoApp.init();
});
