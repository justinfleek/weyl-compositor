<template>
  <Teleport to="body">
    <div class="expression-overlay" v-if="visible" @click.self="$emit('close')">
      <div class="expression-input">
        <div class="expression-header">
      <span class="expression-icon">fx</span>
      <span class="expression-title">Expression</span>
      <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>

    <div class="expression-body">
      <!-- Mode toggle -->
      <div class="mode-toggle">
        <button
          :class="{ active: mode === 'preset' }"
          @click="mode = 'preset'"
        >Preset</button>
        <button
          :class="{ active: mode === 'custom' }"
          @click="mode = 'custom'"
        >Custom</button>
      </div>

      <!-- Preset mode -->
      <div v-if="mode === 'preset'" class="preset-section">
        <label>Expression Type</label>
        <select v-model="selectedPreset" class="preset-select">
          <option value="">Select expression...</option>
          <optgroup label="Motion">
            <option value="inertiaLight">Inertia (Light)</option>
            <option value="inertiaHeavy">Inertia (Heavy)</option>
            <option value="bounceGentle">Bounce (Gentle)</option>
            <option value="bounceFirm">Bounce (Firm)</option>
            <option value="elasticSnappy">Elastic (Snappy)</option>
            <option value="elasticLoose">Elastic (Loose)</option>
          </optgroup>
          <optgroup label="Jitter/Wiggle">
            <option value="jitterSubtle">Jitter (Subtle)</option>
            <option value="jitterModerate">Jitter (Moderate)</option>
            <option value="jitterIntense">Jitter (Intense)</option>
          </optgroup>
          <optgroup label="Loop">
            <option value="repeatCycle">Loop (Cycle)</option>
            <option value="repeatPingpong">Loop (Ping-Pong)</option>
            <option value="repeatOffset">Loop (Offset)</option>
          </optgroup>
        </select>

        <!-- Preset description -->
        <p v-if="presetDescription" class="preset-description">
          {{ presetDescription }}
        </p>
      </div>

      <!-- Custom mode -->
      <div v-if="mode === 'custom'" class="custom-section">
        <label>Expression Code</label>
        <textarea
          v-model="customExpression"
          class="expression-textarea"
          placeholder="wiggle(2, 10)"
          rows="3"
          @keydown.enter.ctrl="apply"
        />
        <p class="hint">
          Available: wiggle(freq, amp), loopOut('cycle'), time, value
        </p>
      </div>
    </div>

    <div class="expression-footer">
      <button class="btn-remove" v-if="hasExpression" @click="remove">
        Remove
      </button>
      <div class="spacer"></div>
      <button class="btn-cancel" @click="$emit('close')">Cancel</button>
      <button
        class="btn-apply"
        @click="apply"
        :disabled="!canApply"
      >Apply</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { EXPRESSION_PRESETS } from '@/services/expressions';
import type { PropertyExpression } from '@/types/project';

interface Props {
  visible: boolean;
  currentExpression?: PropertyExpression | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', expression: PropertyExpression): void;
  (e: 'remove'): void;
}>();

const mode = ref<'preset' | 'custom'>('preset');
const selectedPreset = ref<string>('');
const customExpression = ref<string>('');

// Check if property already has an expression
const hasExpression = computed(() => {
  return props.currentExpression?.enabled ?? false;
});

// Preset descriptions
const presetDescriptions: Record<string, string> = {
  inertiaLight: 'Adds subtle overshoot after keyframes end',
  inertiaHeavy: 'Adds noticeable overshoot with slower settle',
  bounceGentle: 'Soft bouncing at the end of motion',
  bounceFirm: 'Quick bouncing with higher energy',
  elasticSnappy: 'Snappy spring-like motion',
  elasticLoose: 'Loose, wobbly spring motion',
  jitterSubtle: 'Subtle random movement (noise)',
  jitterModerate: 'Moderate random movement',
  jitterIntense: 'Strong random movement',
  repeatCycle: 'Loop keyframes from start',
  repeatPingpong: 'Loop keyframes back and forth',
  repeatOffset: 'Loop with continuous offset'
};

const presetDescription = computed(() => {
  return presetDescriptions[selectedPreset.value] || '';
});

// Can apply if preset selected or custom expression entered
const canApply = computed(() => {
  if (mode.value === 'preset') {
    return selectedPreset.value !== '';
  }
  return customExpression.value.trim() !== '';
});

// Initialize from current expression when dialog opens
watch(() => props.visible, (visible) => {
  if (visible && props.currentExpression) {
    if (props.currentExpression.type === 'preset') {
      mode.value = 'preset';
      // Find matching preset
      const presetKey = Object.keys(EXPRESSION_PRESETS).find(key => {
        const preset = EXPRESSION_PRESETS[key];
        return preset.name === props.currentExpression?.name;
      });
      selectedPreset.value = presetKey || '';
    } else {
      mode.value = 'custom';
      customExpression.value = props.currentExpression.name || '';
    }
  } else if (visible) {
    // Reset
    mode.value = 'preset';
    selectedPreset.value = '';
    customExpression.value = '';
  }
});

function apply() {
  if (!canApply.value) return;

  let expression: PropertyExpression;

  if (mode.value === 'preset') {
    const preset = EXPRESSION_PRESETS[selectedPreset.value];
    if (preset) {
      expression = {
        enabled: true,
        type: 'preset',
        name: preset.name,
        params: { ...preset.params }
      };
    } else {
      return;
    }
  } else {
    expression = {
      enabled: true,
      type: 'custom',
      name: customExpression.value.trim(),
      params: {}
    };
  }

  emit('apply', expression);
  emit('close');
}

function remove() {
  emit('remove');
  emit('close');
}
</script>

<style scoped>
.expression-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.expression-input {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 280px;
  overflow: hidden;
}

.expression-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
  border-bottom: 1px solid #333;
}

.expression-icon {
  font-size: 12px;
  font-weight: bold;
  color: #EC4899;
  font-style: italic;
}

.expression-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #e5e5e5;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
}
.close-btn:hover { color: #fff; }

.expression-body {
  padding: 12px;
}

.mode-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.mode-toggle button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #444;
  background: #111;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.mode-toggle button:hover {
  background: #222;
  color: #aaa;
}

.mode-toggle button.active {
  background: var(--weyl-accent, #8B5CF6);
  border-color: var(--weyl-accent, #8B5CF6);
  color: #fff;
}

label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-select {
  width: 100%;
  padding: 8px;
  background: #111;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e5e5e5;
  font-size: 13px;
  cursor: pointer;
}

.preset-select:focus {
  outline: none;
  border-color: var(--weyl-accent, #8B5CF6);
}

.preset-select option {
  background: #1e1e1e;
}

.preset-select optgroup {
  color: #888;
  font-style: normal;
}

.preset-description {
  margin: 8px 0 0;
  font-size: 11px;
  color: #888;
  font-style: italic;
}

.expression-textarea {
  width: 100%;
  padding: 8px;
  background: #111;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e5e5e5;
  font-size: 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
  resize: vertical;
  min-height: 60px;
}

.expression-textarea:focus {
  outline: none;
  border-color: var(--weyl-accent, #8B5CF6);
}

.hint {
  margin: 6px 0 0;
  font-size: 10px;
  color: #666;
}

.expression-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #333;
  background: #151515;
}

.spacer { flex: 1; }

.btn-remove, .btn-cancel, .btn-apply {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-remove {
  background: transparent;
  border: 1px solid #EF4444;
  color: #EF4444;
}
.btn-remove:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-cancel {
  background: #333;
  border: 1px solid #444;
  color: #ccc;
}
.btn-cancel:hover { background: #444; }

.btn-apply {
  background: var(--weyl-accent, #8B5CF6);
  border: none;
  color: #fff;
}
.btn-apply:hover:not(:disabled) {
  background: var(--weyl-accent-hover, #9D70F9);
}
.btn-apply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
