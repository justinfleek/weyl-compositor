<template>
  <div class="light-properties">
    <div class="property-section">
      <div class="section-header">Light Settings</div>
      <div class="section-content">
        <div class="property-row">
          <label>Type</label>
          <select
            :value="lightData.lightType"
            @change="update('lightType', ($event.target as HTMLSelectElement).value)"
            class="type-select"
          >
            <option value="point">Point</option>
            <option value="spot">Spot</option>
            <option value="ambient">Ambient</option>
            <option value="directional">Directional</option>
          </select>
        </div>

        <div class="property-group">
          <label>Color</label>
          <ColorPicker
            :modelValue="lightData.color"
            @update:modelValue="(v) => update('color', v)"
          />
        </div>

        <div class="property-group">
          <label>Intensity</label>
          <div class="control-row">
            <SliderInput
              :modelValue="lightData.intensity"
              @update:modelValue="(v) => update('intensity', v)"
              :min="0"
              :max="500"
              :step="1"
              unit="%"
            />
          </div>
        </div>

        <template v-if="lightData.lightType === 'spot'">
          <div class="property-group">
            <label>Cone Angle</label>
            <div class="control-row">
              <AngleDial
                :modelValue="lightData.coneAngle ?? 90"
                @update:modelValue="(v) => update('coneAngle', v)"
                :size="32"
              />
              <ScrubableNumber
                :modelValue="lightData.coneAngle ?? 90"
                @update:modelValue="(v) => update('coneAngle', v)"
                unit="°"
              />
            </div>
          </div>

          <div class="property-group">
            <label>Cone Feather</label>
            <SliderInput
              :modelValue="lightData.coneFeather ?? 50"
              @update:modelValue="(v) => update('coneFeather', v)"
              :min="0"
              :max="100"
              unit="%"
            />
          </div>
        </template>

        <div class="property-group" v-if="lightData.lightType !== 'ambient' && lightData.lightType !== 'directional'">
          <label>Falloff Radius</label>
          <ScrubableNumber
            :modelValue="lightData.radius"
            @update:modelValue="(v) => update('radius', v)"
            :min="0"
            unit="px"
          />
        </div>

        <div class="property-group checkbox-row">
          <label>
            <input
              type="checkbox"
              :checked="lightData.castShadows"
              @change="update('castShadows', ($event.target as HTMLInputElement).checked)"
            />
            Casts Shadows
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Layer } from '@/types/project';
import { useCompositorStore } from '@/stores/compositorStore';
import { ScrubableNumber, SliderInput, AngleDial, ColorPicker } from '@/components/controls';

interface LightData {
  lightType: 'point' | 'spot' | 'ambient' | 'directional';
  color: string;
  intensity: number;
  radius: number;
  falloff: string;
  castShadows: boolean;
  coneAngle?: number;
  coneFeather?: number;
}

const props = defineProps<{ layer: Layer }>();
const emit = defineEmits(['update']);
const store = useCompositorStore();

const lightData = computed<LightData>(() => {
  return props.layer.data as LightData || {
    lightType: 'point',
    color: '#ffffff',
    intensity: 100,
    radius: 500,
    falloff: 'quadratic',
    castShadows: false
  };
});

function update(key: keyof LightData, value: any) {
  store.updateLayer(props.layer.id, {
    data: { ...lightData.value, [key]: value }
  });
  emit('update');
}
</script>

<style scoped>
.light-properties { padding: 0; }
.property-section { border-bottom: 1px solid #2a2a2a; }
.section-header { padding: 8px 10px; background: #252525; font-weight: 600; font-size: 12px; color: #aaa; }
.section-content { padding: 10px; background: #1e1e1e; display: flex; flex-direction: column; gap: 10px; }

.property-row { display: flex; align-items: center; justify-content: space-between; }
.property-row label { color: #888; font-size: 11px; width: 80px; }

.property-group { display: flex; flex-direction: column; gap: 4px; }
.property-group label { color: #888; font-size: 10px; }

.control-row { display: flex; align-items: center; gap: 8px; }

.type-select {
  flex: 1;
  background: #111;
  border: 1px solid #333;
  color: #ccc;
  padding: 4px;
  border-radius: 3px;
  font-size: 11px;
}

.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ccc;
  font-size: 11px;
  cursor: pointer;
}
</style>
