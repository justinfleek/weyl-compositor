<template>
  <div class="shape-properties">
    <div class="property-section">
      <div class="section-header">Shape Appearance</div>
      <div class="section-content">

        <div class="property-group">
          <div class="group-header">
            <label>Fill</label>
            <input
              type="checkbox"
              :checked="hasFill"
              @change="toggleFill"
            />
          </div>
          <div v-if="hasFill" class="control-row">
            <ColorPicker
              :modelValue="shapeData.fill || '#ffffff'"
              @update:modelValue="(v) => update('fill', v)"
              :alpha="true"
            />
          </div>
        </div>

        <div class="property-group">
          <div class="group-header">
            <label>Stroke</label>
            <input
              type="checkbox"
              :checked="hasStroke"
              @change="toggleStroke"
            />
          </div>

          <div v-if="hasStroke" class="stroke-controls">
            <div class="control-row">
              <ColorPicker
                :modelValue="shapeData.stroke || '#ffffff'"
                @update:modelValue="(v) => update('stroke', v)"
                :alpha="true"
              />
            </div>

            <div class="property-row">
              <label class="sub-label">Width</label>
              <ScrubableNumber
                :modelValue="shapeData.strokeWidth || 0"
                @update:modelValue="(v) => update('strokeWidth', v)"
                :min="0"
                :max="500"
                unit="px"
              />
            </div>

            <div class="property-row">
               <label class="sub-label">Cap</label>
               <div class="icon-toggle-group">
                 <button :class="{ active: strokeCap === 'butt' }" @click="update('strokeLineCap', 'butt')" title="Butt Cap">I</button>
                 <button :class="{ active: strokeCap === 'round' }" @click="update('strokeLineCap', 'round')" title="Round Cap">C</button>
                 <button :class="{ active: strokeCap === 'square' }" @click="update('strokeLineCap', 'square')" title="Square Cap">H</button>
               </div>
            </div>
          </div>
        </div>

        <div class="property-group">
          <label>Path</label>
          <div class="control-row checkbox-row">
            <label>
              <input
                type="checkbox"
                :checked="shapeData.closed"
                @change="update('closed', ($event.target as HTMLInputElement).checked)"
              />
              Closed Path
            </label>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Layer, SplineData } from '@/types/project';
import { useCompositorStore } from '@/stores/compositorStore';
import { ScrubableNumber, ColorPicker } from '@/components/controls';

const props = defineProps<{ layer: Layer }>();
const emit = defineEmits(['update']);
const store = useCompositorStore();

const shapeData = computed<SplineData>(() => {
  return props.layer.data as SplineData || {
    pathData: '',
    controlPoints: [],
    closed: false,
    stroke: '#ffffff',
    strokeWidth: 2,
    fill: ''
  };
});

const hasFill = computed(() => !!shapeData.value.fill && shapeData.value.fill !== 'transparent');
const hasStroke = computed(() => !!shapeData.value.stroke && shapeData.value.strokeWidth > 0);
const strokeCap = computed(() => (shapeData.value as any).strokeLineCap || 'round');

function update(key: keyof SplineData | string, value: any) {
  store.updateLayer(props.layer.id, {
    data: { ...shapeData.value, [key]: value }
  });
  emit('update');
}

function toggleFill(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  update('fill', checked ? '#ffffff' : '');
}

function toggleStroke(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    update('stroke', '#ffffff');
    update('strokeWidth', 2);
  } else {
    update('strokeWidth', 0);
  }
}
</script>

<style scoped>
.shape-properties { padding: 0; }
.property-section { border-bottom: 1px solid #2a2a2a; }
.section-header { padding: 8px 10px; background: #252525; font-weight: 600; font-size: 12px; color: #aaa; }
.section-content { padding: 10px; background: #1e1e1e; display: flex; flex-direction: column; gap: 12px; }

.property-group { display: flex; flex-direction: column; gap: 6px; }
.group-header { display: flex; justify-content: space-between; align-items: center; }
.group-header label { font-weight: 600; color: #ccc; font-size: 11px; }

.stroke-controls { display: flex; flex-direction: column; gap: 8px; padding-left: 8px; border-left: 2px solid #333; }

.property-row { display: flex; align-items: center; justify-content: space-between; }
.sub-label { color: #888; font-size: 10px; }

.control-row { display: flex; align-items: center; gap: 8px; }

.checkbox-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #ccc; font-size: 11px; }

.icon-toggle-group { display: flex; background: #111; border-radius: 3px; border: 1px solid #333; }
.icon-toggle-group button {
  background: transparent; border: none; color: #666; padding: 2px 6px; cursor: pointer; font-size: 10px;
  border-right: 1px solid #333;
}
.icon-toggle-group button:last-child { border-right: none; }
.icon-toggle-group button.active { background: #4a90d9; color: #fff; }
.icon-toggle-group button:hover:not(.active) { background: #333; }
</style>
