// theme-manager.js - Gestion du thème clair/sombre
export class ThemeManager {
    constructor(dom) {
        this.dom = dom;
        this.currentTheme = localStorage.getItem('theme') || 'light';
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    getTheme() {
        return this.currentTheme;
    }
}
