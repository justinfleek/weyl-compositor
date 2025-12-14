<template>
  <div class="prop-wrapper">

    <!-- ================== SIDEBAR MODE ================== -->
    <!-- Name, Value, Stopwatch - NO TRACK -->
    <div v-if="layoutMode === 'sidebar'" class="prop-sidebar" :class="{ selected: isSelected }" @click="selectProp">
      <div class="indent-spacer"></div>

      <button class="stopwatch" :class="{ active: property.animated }" @click.stop="toggleAnim" title="Toggle Animation">
        ⏱
      </button>

      <div class="prop-name">{{ name }}</div>

      <!-- Value Display -->
      <div class="prop-value">{{ formatValue(property.value) }}</div>
    </div>

    <!-- ================== TRACK MODE ================== -->
    <!-- Keyframes Only - NO TEXT -->
    <div v-else-if="layoutMode === 'track'" class="prop-track">
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
  if (typeof v === 'object' && v?.x !== undefined) return `${v.x.toFixed(0)},${v.y.toFixed(0)}`;
  return v;
}

function toggleAnim() {
  store.setPropertyAnimated(props.layerId, props.propertyPath, !props.property.animated);
}

function selectProp(e: MouseEvent) {
  emit('selectProperty', propId.value, e.shiftKey);
}
</script>

<style scoped>
.prop-wrapper { width: 100%; display: flex; flex-direction: column; }

/* SIDEBAR */
.prop-sidebar {
  display: flex; height: 28px; align-items: center;
  border-bottom: 1px solid #2a2a2a;
  background: #1e1e1e;
  color: #bbb;
  font-size: 16px; /* Large Font */
  padding-right: 10px; cursor: pointer;
}
.prop-sidebar:hover { background: #252525; color: #fff; }
.prop-sidebar.selected { background: #2c2c2c; border-left: 2px solid #3ea6ff; }

.indent-spacer { width: 40px; flex-shrink: 0; }
.stopwatch { background: none; border: none; cursor: pointer; color: #666; padding: 0 8px; font-size: 16px; }
.stopwatch:hover { color: #aaa; }
.stopwatch.active { color: #3ea6ff; }

.prop-name { flex: 1; }
.prop-value { color: #3ea6ff; font-family: monospace; font-size: 16px; cursor: ew-resize; }

/* TRACK */
.prop-track { height: 28px; border-bottom: 1px solid #2a2a2a; position: relative; background: #161616; }
.keyframe {
  position: absolute; top: 9px;
  width: 10px; height: 10px; margin-left: -5px;
  background: #ebcb8b;
  transform: rotate(45deg);
  border: 1px solid #000;
  z-index: 5; cursor: pointer;
}
.keyframe:hover { background: #fff; transform: rotate(45deg) scale(1.2); }
</style>
