// data-manager.js - Gestion des données localStorage
export class DataManager {
    constructor() {
        this.temperatures = JSON.parse(localStorage.getItem('temperatures_v2') || '[]');
    }

    addTemperature(value, timestamp = null) {
        const ts = timestamp || new Date().toISOString();
        this.temperatures.push({ value, timestamp: ts });
        this.save();
    }

    updateTemperature(index, value, timestamp) {
        const sorted = this.getTemperaturesSorted();
        if (index >= 0 && index < sorted.length) {
            const ts = timestamp || sorted[index].timestamp;
            sorted[index] = { value, timestamp: ts };
            this.temperatures = sorted;
            this.save();
        }
    }

    deleteTemperature(index) {
        const sorted = this.getTemperaturesSorted();
        sorted.splice(index, 1);
        this.temperatures = sorted;
        this.save();
    }
		
		deleteTemperatureByTimestamp(timestamp) {
				this.temperatures = this.temperatures.filter(t => t.timestamp !== timestamp);
				this.save();
		}

    getTemperaturesSorted() {
        return [...this.temperatures].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    getTemperatures() {
        return this.temperatures;
    }

    clearAll() {
        this.temperatures = [];
        this.save();
    }

    save() {
        localStorage.setItem('temperatures_v2', JSON.stringify(this.temperatures));
    }
		
		getTemperatureForDate(date) {
				const targetMidnight = new Date(date);
				targetMidnight.setHours(0, 0, 0, 0);

				return this.temperatures.find(t => {
						const tDate = new Date(t.timestamp);
						tDate.setHours(0, 0, 0, 0);
						return tDate.getTime() === targetMidnight.getTime();
				});
		}
}
