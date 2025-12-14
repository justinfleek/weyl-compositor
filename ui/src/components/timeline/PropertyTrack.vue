<template>
  <div class="prop-wrapper">

    <!-- SIDEBAR MODE -->
    <div v-if="layoutMode === 'sidebar'" class="prop-sidebar" :class="{ selected: isSelected }" @click="selectProp">
      <div class="indent-spacer"></div>

      <!-- Stopwatch -->
      <div class="icon-box" @click.stop="toggleAnim">
        <span class="stopwatch" :class="{ active: property.animated }">⏱</span>
      </div>

      <div class="prop-name">{{ name }}</div>

      <!-- Value Display (Handles X,Y,Z) -->
      <div class="prop-value">{{ formatValue(property.value) }}</div>

      <!-- Add Keyframe Diamond -->
      <div class="icon-box" @click.stop="addKeyframeAtCurrent" title="Add Keyframe">
        <span class="kf-btn" :class="{ active: hasKeyframeAtCurrent }">◇</span>
      </div>
    </div>

    <!-- TRACK MODE -->
    <div v-else-if="layoutMode === 'track'" class="prop-track">
      <div class="track-bg"></div>
      <template v-if="viewMode === 'keyframes'">
        <div v-for="kf in property.keyframes" :key="kf.id"
             class="keyframe"
             :style="{ left: `${(kf.frame / frameCount) * 100}%` }"
             @click.stop="$emit('selectKeyframe', kf.id, true)"
        ></div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCompositorStore } from '@/stores/compositorStore';

const props = defineProps(['name', 'property', 'layerId', 'propertyPath', 'layoutMode', 'viewMode', 'frameCount', 'selectedPropertyIds']);
const emit = defineEmits(['selectProperty', 'selectKeyframe']);
const store = useCompositorStore();

const propId = computed(() => `${props.layerId}-${props.propertyPath}`);
const isSelected = computed(() => props.selectedPropertyIds?.includes(propId.value));

function formatValue(v: any) {
  if (typeof v === 'number') return v.toFixed(1);
  if (typeof v === 'object') {
    if (v?.z !== undefined) return `${v.x.toFixed(0)},${v.y.toFixed(0)},${v.z.toFixed(0)}`;
    if (v?.x !== undefined) return `${v.x.toFixed(0)},${v.y.toFixed(0)}`;
  }
  return v;
}

const hasKeyframeAtCurrent = computed(() => {
  return props.property.keyframes?.some((k: any) => k.frame === store.currentFrame);
});

function toggleAnim() { store.setPropertyAnimated(props.layerId, props.propertyPath, !props.property.animated); }
function addKeyframeAtCurrent() { store.addKeyframe(props.layerId, props.propertyPath, store.currentFrame, props.property.value); }
function selectProp(e: MouseEvent) { emit('selectProperty', propId.value, e.shiftKey); }
</script>

<style scoped>
.prop-wrapper { width: 100%; display: flex; flex-direction: column; }

/* SIDEBAR */
.prop-sidebar {
  display: flex; height: 24px; align-items: center;
  border-bottom: 1px solid #2a2a2a;
  background: #1e1e1e;
  color: #bbb;
  font-size: 12px;
  padding-right: 5px; cursor: pointer;
}
.prop-sidebar:hover { background: #252525; color: #fff; }
.prop-sidebar.selected { background: #2c2c2c; border-left: 2px solid #3ea6ff; }

.indent-spacer { width: 35px; flex-shrink: 0; }
.icon-box { width: 24px; text-align: center; cursor: pointer; display: flex; justify-content: center; }
.stopwatch { font-size: 14px; color: #666; }
.stopwatch.active { color: #3ea6ff; }
.kf-btn { font-size: 14px; color: #666; }
.kf-btn:hover { color: #fff; }
.kf-btn.active { color: #3ea6ff; }

.prop-name { flex: 1; }
.prop-value { color: #3ea6ff; font-family: monospace; font-size: 12px; cursor: ew-resize; margin-right: 8px; }

/* TRACK */
.prop-track { height: 24px; border-bottom: 1px solid #2a2a2a; position: relative; background: #161616; }
.keyframe {
  position: absolute; width: 9px; height: 9px;
  background: #ebcb8b;
  transform: rotate(45deg);
  top: 7px; margin-left: -4px;
  border: 1px solid #000;
  z-index: 5; cursor: pointer;
}
.keyframe:hover { background: #fff; transform: rotate(45deg) scale(1.2); }
</style>
