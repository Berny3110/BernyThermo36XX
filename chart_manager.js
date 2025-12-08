// chart-manager.js - Gestion du graphique Chart.js
export class ChartManager {
    constructor(dom, data, cycle) {
        this.dom = dom;
        this.data = data;
        this.cycle = cycle;
        this.chart = null;
    }

    render() {
        if (this.chart) {
            this.chart.destroy();
        }

        const cycleStart = this.cycle.getStartDate();
        const temps = this.data.getTemperatures();
        
        const relevant = cycleStart 
            ? temps.filter(t => new Date(t.timestamp) >= new Date(cycleStart))
            : temps;

        if (relevant.length === 0) {
            document.getElementById('ai-analysis-container').classList.add('hidden');
            return;
        }

        relevant.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // AI Analysis
        const aiBox = document.getElementById('ai-analysis-container');
        if (cycleStart) {
            const analysis = this.cycle.analyzeCycle(relevant);
            if (analysis && analysis.detected) {
                aiBox.classList.remove('hidden');
                document.getElementById('ai-content').innerHTML = 
                    `<strong>Phase Lutéale</strong><br>Décalage à J${analysis.day}.`;
            } else {
                aiBox.classList.add('hidden');
            }
        } else {
            aiBox.classList.add('hidden');
        }

        // Chart rendering
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const color = isDark ? '#818cf8' : '#6366f1';

        this.chart = new Chart(this.dom.chartCtx, {
            type: 'line',
            data: {
                labels: relevant.map(t => 
                    cycleStart 
                        ? `J${Math.floor((new Date(t.timestamp) - new Date(cycleStart)) / 86400000) + 1}`
                        : new Date(t.timestamp).getDate()
                ),
                datasets: [{
                    data: relevant.map(t => t.value),
                    borderColor: color,
                    backgroundColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: 35.8,
                        max: 37.8
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
}
