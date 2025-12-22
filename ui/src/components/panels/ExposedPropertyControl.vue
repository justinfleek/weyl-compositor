<template>
  <div class="exposed-property-control">
    <div class="property-header">
      <input
        type="text"
        v-model="localName"
        class="property-name-input"
        @blur="updateName"
      />
      <div class="property-actions">
        <button class="btn-icon-tiny" @click="$emit('remove')" title="Remove">
          ×
        </button>
      </div>
    </div>

    <div class="property-value">
      <!-- Source Text -->
      <template v-if="property.type === 'sourceText'">
        <input
          type="text"
          :value="currentValue"
          @input="updateValue(($event.target as HTMLInputElement).value)"
          class="text-input"
          placeholder="Enter text..."
        />
      </template>

      <!-- Number / Slider -->
      <template v-else-if="property.type === 'number'">
        <div class="slider-control">
          <input
            type="range"
            :min="property.config.min ?? 0"
            :max="property.config.max ?? 100"
            :step="property.config.step ?? 1"
            :value="currentValue"
            @input="updateValue(parseFloat(($event.target as HTMLInputElement).value))"
            class="slider"
          />
          <input
            type="number"
            :value="currentValue"
            @input="updateValue(parseFloat(($event.target as HTMLInputElement).value))"
            class="number-input"
          />
        </div>
      </template>

      <!-- Checkbox -->
      <template v-else-if="property.type === 'checkbox'">
        <label class="checkbox-control">
          <input
            type="checkbox"
            :checked="currentValue"
            @change="updateValue(($event.target as HTMLInputElement).checked)"
          />
          <span class="checkbox-label">{{ currentValue ? 'On' : 'Off' }}</span>
        </label>
      </template>

      <!-- Dropdown -->
      <template v-else-if="property.type === 'dropdown'">
        <select
          :value="currentValue"
          @change="updateValue(($event.target as HTMLSelectElement).value)"
          class="dropdown-input"
        >
          <option
            v-for="opt in property.config.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </template>

      <!-- Color -->
      <template v-else-if="property.type === 'color'">
        <div class="color-control">
          <input
            type="color"
            :value="colorToHex(currentValue)"
            @input="updateValue(hexToColor(($event.target as HTMLInputElement).value))"
            class="color-input"
          />
          <span class="color-hex">{{ colorToHex(currentValue) }}</span>
        </div>
      </template>

      <!-- Point -->
      <template v-else-if="property.type === 'point'">
        <div class="point-control">
          <label>
            X:
            <input
              type="number"
              :value="currentValue?.x ?? 0"
              @input="updatePointValue('x', parseFloat(($event.target as HTMLInputElement).value))"
              class="point-input"
            />
          </label>
          <label>
            Y:
            <input
              type="number"
              :value="currentValue?.y ?? 0"
              @input="updatePointValue('y', parseFloat(($event.target as HTMLInputElement).value))"
              class="point-input"
            />
          </label>
        </div>
      </template>

      <!-- Media -->
      <template v-else-if="property.type === 'media'">
        <div class="media-control">
          <div class="media-preview">
            <img v-if="currentValue" :src="currentValue" alt="" />
            <span v-else>No media</span>
          </div>
          <button class="btn-small" @click="selectMedia">Replace...</button>
        </div>
      </template>

      <!-- Font -->
      <template v-else-if="property.type === 'font'">
        <select
          :value="currentValue"
          @change="updateValue(($event.target as HTMLSelectElement).value)"
          class="dropdown-input"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
        </select>
      </template>

      <!-- Fallback -->
      <template v-else>
        <span class="unsupported">Unsupported type: {{ property.type }}</span>
      </template>
    </div>

    <!-- Property path info -->
    <div class="property-path">
      {{ property.sourcePropertyPath }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ExposedProperty } from '@/types/essentialGraphics';
import type { Layer } from '@/types/project';
import { getPropertyValue, setPropertyValue } from '@/services/essentialGraphics';

const props = defineProps<{
  property: ExposedProperty;
  layer?: Layer;
}>();

const emit = defineEmits<{
  (e: 'update', propertyId: string, updates: Partial<ExposedProperty>): void;
  (e: 'remove'): void;
}>();

// Local state
const localName = ref(props.property.name);

// Watch for external changes
watch(() => props.property.name, (newName) => {
  localName.value = newName;
});

// Current value from the layer
const currentValue = computed(() => {
  if (!props.layer) return undefined;
  return getPropertyValue(props.layer, props.property.sourcePropertyPath);
});

// Update property name
function updateName() {
  if (localName.value !== props.property.name) {
    emit('update', props.property.id, { name: localName.value });
  }
}

// Update property value in the layer
function updateValue(value: any) {
  if (!props.layer) return;
  setPropertyValue(props.layer, props.property.sourcePropertyPath, value);
}

// Update point value
function updatePointValue(axis: 'x' | 'y', value: number) {
  if (!props.layer) return;
  const current = currentValue.value || { x: 0, y: 0 };
  const updated = { ...current, [axis]: value };
  setPropertyValue(props.layer, props.property.sourcePropertyPath, updated);
}

// Color utilities
function colorToHex(color: any): string {
  if (!color) return '#ffffff';
  if (typeof color === 'string') return color;

  const r = Math.round((color.r ?? 255) * (color.r > 1 ? 1 : 255));
  const g = Math.round((color.g ?? 255) * (color.g > 1 ? 1 : 255));
  const b = Math.round((color.b ?? 255) * (color.b > 1 ? 1 : 255));

  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function hexToColor(hex: string): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 1, g: 1, b: 1, a: 1 };

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: 1
  };
}

// Media selection
function selectMedia() {
  // TODO: Open file picker
  console.log('Select media');
}
</script>

<style scoped>
.exposed-property-control {
  padding: 8px;
}

.property-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.property-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 12px;
  font-weight: 500;
  padding: 2px 0;
}

.property-name-input:focus {
  outline: none;
  background: var(--weyl-surface-0, #0a0a0a);
  border-radius: 2px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.property-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.exposed-property-control:hover .property-actions {
  opacity: 1;
}

.btn-icon-tiny {
  width: 18px;
  height: 18px;
  padding: 0;
  background: none;
  border: none;
  color: var(--weyl-text-muted, #6b7280);
  cursor: pointer;
  font-size: 14px;
}

.btn-icon-tiny:hover {
  color: var(--weyl-text-primary, #e5e5e5);
}

.property-value {
  margin-bottom: 4px;
}

.text-input,
.dropdown-input {
  width: 100%;
  padding: 6px 8px;
  background: var(--weyl-surface-0, #0a0a0a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 12px;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: var(--weyl-surface-0, #0a0a0a);
  border-radius: 2px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--weyl-accent, #8b5cf6);
  border-radius: 50%;
  cursor: pointer;
}

.number-input {
  width: 60px;
  padding: 4px 6px;
  background: var(--weyl-surface-0, #0a0a0a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 11px;
  text-align: right;
}

.checkbox-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 12px;
  color: var(--weyl-text-secondary, #9ca3af);
}

.color-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  cursor: pointer;
}

.color-hex {
  font-size: 11px;
  font-family: monospace;
  color: var(--weyl-text-secondary, #9ca3af);
}

.point-control {
  display: flex;
  gap: 12px;
}

.point-control label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--weyl-text-secondary, #9ca3af);
}

.point-input {
  width: 60px;
  padding: 4px 6px;
  background: var(--weyl-surface-0, #0a0a0a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 11px;
}

.media-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.media-preview {
  width: 48px;
  height: 36px;
  background: var(--weyl-surface-0, #0a0a0a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-preview span {
  font-size: 9px;
  color: var(--weyl-text-muted, #6b7280);
}

.btn-small {
  padding: 4px 8px;
  background: var(--weyl-surface-3, #222222);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 3px;
  color: var(--weyl-text-secondary, #9ca3af);
  font-size: 10px;
  cursor: pointer;
}

.btn-small:hover {
  background: var(--weyl-surface-4, #2a2a2a);
  color: var(--weyl-text-primary, #e5e5e5);
}

.property-path {
  font-size: 9px;
  color: var(--weyl-text-muted, #6b7280);
  font-family: monospace;
}

.unsupported {
  font-size: 11px;
  color: var(--weyl-text-muted, #6b7280);
  font-style: italic;
}
</style>
