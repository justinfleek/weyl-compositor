<template>
  <WorkspaceLayout />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import WorkspaceLayout from './components/layout/WorkspaceLayout.vue';
import { useThemeStore } from './stores/themeStore';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.loadSavedTheme();
});
</script>

<style>
/* Global styles for the app - using design tokens */
* {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--weyl-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  font-size: var(--weyl-text-base, 12px);
  line-height: var(--weyl-leading-normal, 1.5);
  background: var(--weyl-void, #050505);
  color: var(--weyl-text-primary, #E5E5E5);
}

/* Global font size for form elements */
button, input, select, textarea, label {
  font-size: var(--weyl-text-base, 12px);
  font-family: inherit;
}

/* Ensure small text is still readable */
.small-text, small {
  font-size: var(--weyl-text-sm, 11px);
}

/* Floating panel utility class */
.floating-panel {
  background: var(--weyl-surface-1);
  border-radius: var(--weyl-radius-xl);
  box-shadow: var(--weyl-shadow-panel);
  border: none;
  overflow: hidden;
}

/* Surface level utilities */
.surface-0 { background: var(--weyl-surface-0); }
.surface-1 { background: var(--weyl-surface-1); }
.surface-2 { background: var(--weyl-surface-2); }
.surface-3 { background: var(--weyl-surface-3); }
.surface-4 { background: var(--weyl-surface-4); }

/* Text utilities */
.text-primary { color: var(--weyl-text-primary); }
.text-secondary { color: var(--weyl-text-secondary); }
.text-muted { color: var(--weyl-text-muted); }
.text-accent { color: var(--weyl-accent); }

/* Focus ring for accessibility */
.focus-ring:focus,
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--weyl-void), 0 0 0 4px var(--weyl-accent);
}
</style>
