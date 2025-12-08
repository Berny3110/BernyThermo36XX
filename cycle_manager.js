// cycle-manager.js - Gestion du cycle menstruel
export class CycleManager {
    constructor(dom, data) {
        this.dom = dom;
        this.data = data;
        this.cycleStartDate = localStorage.getItem('cycleStartDate');
    }

    start() {
        this.cycleStartDate = new Date().toISOString();
        localStorage.setItem('cycleStartDate', this.cycleStartDate);
        this.updateUI();
    }

    end() {
        localStorage.removeItem('cycleStartDate');
        this.cycleStartDate = null;
        this.updateUI();
    }

    updateStartDate(dateString) {
        this.cycleStartDate = new Date(dateString).toISOString();
        localStorage.setItem('cycleStartDate', this.cycleStartDate);
        this.updateUI();
    }

    getStartDate() {
        return this.cycleStartDate;
    }

    updateUI() {
        if (!this.cycleStartDate) {
            this.dom.cycleBtn.classList.remove('hidden');
            this.dom.cycleStatus.classList.add('hidden');
        } else {
            this.dom.cycleBtn.classList.add('hidden');
            this.dom.cycleStatus.classList.remove('hidden');
            const start = new Date(this.cycleStartDate);
            const diffTime = Math.abs(new Date() - start);
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.dom.cycleInfo.innerHTML = `J${days} <small>(Début: ${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})</small>`;
        }
    }

    analyzeCycle(temps) {
        if (temps.length < 5) return null;
        
        const sorted = [...temps].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        for (let i = 6; i < sorted.length - 2; i++) {
            const pre = sorted.slice(i - 6, i).map(t => t.value);
            const post = sorted.slice(i, i + 3).map(t => t.value);
            
            if (Math.min(...post) > Math.max(...pre)) {
                const day = Math.floor(
                    (new Date(sorted[i].timestamp) - new Date(this.cycleStartDate)) / 86400000
                ) + 1;
                return { detected: true, day };
            }
        }
        
        return { detected: false };
    }
}
