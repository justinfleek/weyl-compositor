import { defineStore } from 'pinia';

export type ThemeName = 'violet' | 'ocean' | 'sunset' | 'forest' | 'ember' | 'mono';

export interface ThemeState {
  currentTheme: ThemeName;
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    currentTheme: 'violet'
  }),

  getters: {
    themeGradient: (state) => `var(--weyl-theme-${state.currentTheme}-gradient)`,
    themePrimary: (state) => `var(--weyl-theme-${state.currentTheme}-primary)`,
    themeSecondary: (state) => `var(--weyl-theme-${state.currentTheme}-secondary)`
  },

  actions: {
    setTheme(theme: ThemeName) {
      this.currentTheme = theme;

      // Update CSS custom properties
      const root = document.documentElement;
      root.style.setProperty('--weyl-accent', `var(--weyl-theme-${theme}-primary)`);
      root.style.setProperty('--weyl-accent-secondary', `var(--weyl-theme-${theme}-secondary)`);
      root.style.setProperty('--weyl-accent-gradient', `var(--weyl-theme-${theme}-gradient)`);

      // Update glow color based on theme
      const glowColors: Record<ThemeName, string> = {
        violet: 'rgba(139, 92, 246, 0.3)',
        ocean: 'rgba(6, 182, 212, 0.3)',
        sunset: 'rgba(245, 158, 11, 0.3)',
        forest: 'rgba(16, 185, 129, 0.3)',
        ember: 'rgba(239, 68, 68, 0.3)',
        mono: 'rgba(107, 114, 128, 0.3)'
      };
      root.style.setProperty('--weyl-accent-glow', glowColors[theme]);

      // Persist to localStorage
      localStorage.setItem('weyl-theme', theme);
    },

    loadSavedTheme() {
      const saved = localStorage.getItem('weyl-theme') as ThemeName | null;
      if (saved && ['violet', 'ocean', 'sunset', 'forest', 'ember', 'mono'].includes(saved)) {
        this.setTheme(saved);
      }
    }
  }
});
