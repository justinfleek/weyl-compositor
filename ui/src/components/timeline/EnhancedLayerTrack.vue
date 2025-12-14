<template>
  <div class="track-wrapper">

    <!-- ================== SIDEBAR MODE ================== -->
    <!-- Renders Layer Name, Icons, and Controls -->
    <div v-if="layoutMode === 'sidebar'" class="sidebar-row" :class="{ selected: isSelected }">
      <div class="row-content" @click="selectLayer">
        <!-- Color Strip -->
        <div class="label-strip" :style="{ background: layer.labelColor || '#999' }"></div>

        <!-- Expand Arrow -->
        <div class="arrow-container" @click.stop="toggleExpand">
          <span class="arrow">{{ isExpanded ? '▼' : '▶' }}</span>
        </div>

        <!-- ID -->
        <div class="layer-id">1</div>

        <!-- Controls -->
        <button class="icon-btn" @click.stop="toggleVis">{{ layer.visible ? '👁' : '•' }}</button>
        <button class="icon-btn" @click.stop="toggleLock">{{ layer.locked ? '🔒' : '🔓' }}</button>
        <button class="icon-btn" @click.stop="toggleSolo" :class="{active: isSoloed}">●</button>

        <!-- Name -->
        <div class="layer-name-box" @dblclick.stop="startRename">
          <span class="type-icon">{{ getLayerIcon(layer.type) }}</span>
          <span v-if="!isRenaming" class="name-text">{{ layer.name }}</span>
          <input v-else v-model="renameVal" @blur="saveRename" @keydown.enter="saveRename" class="rename-input" ref="renameInput" />
        </div>
      </div>

      <!-- Recursive Children (Sidebar) -->
      <div v-if="isExpanded" class="children-container">
        <PropertyTrack
          v-for="prop in properties" :key="prop.path"
          :layerId="layer.id" :propertyPath="prop.path" :name="prop.name" :property="prop.property"
          layoutMode="sidebar"
          :selectedPropertyIds="selectedPropertyIds"
          @selectProperty="(id, add) => $emit('selectProperty', id, add)"
        />
      </div>
    </div>

    <!-- ================== TRACK MODE ================== -->
    <!-- Renders Duration Bar and Keyframe Markers -->
    <div v-else-if="layoutMode === 'track'" class="track-row-container">
      <div class="track-row">
        <!-- Layer Duration Bar -->
        <div class="duration-bar" :style="barStyle" @mousedown="startDrag">
          <div class="bar-fill" :style="{ background: layer.labelColor || '#999' }"></div>
          <div class="trim-handle trim-in" @mousedown.stop="startTrimIn"></div>
          <div class="trim-handle trim-out" @mousedown.stop="startTrimOut"></div>
        </div>

        <!-- Layer Keyframes Summary -->
        <div v-for="kf in allKeyframes" :key="kf.id"
             class="keyframe-marker"
             :style="{ left: `${(kf.frame / frameCount) * 100}%` }">◆</div>
      </div>

      <!-- Recursive Children (Track) -->
      <div v-if="isExpanded" class="children-container">
        <PropertyTrack
          v-for="prop in properties" :key="prop.path"
          :layerId="layer.id" :propertyPath="prop.path" :name="prop.name" :property="prop.property"
          layoutMode="track" :viewMode="viewMode" :frameCount="frameCount"
          :selectedKeyframeIds="[]"
          @selectKeyframe="(id, add) => $emit('selectKeyframe', id, add)"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useCompositorStore } from '@/stores/compositorStore';
import PropertyTrack from './PropertyTrack.vue';

const props = defineProps(['layer', 'layoutMode', 'isExpandedExternal', 'selectedPropertyIds', 'frameCount', 'viewMode', 'allLayers', 'soloedLayerIds']);
const emit = defineEmits(['toggleExpand', 'select', 'updateLayer', 'selectProperty', 'selectKeyframe', 'toggleSolo', 'setParent']);
const store = useCompositorStore();

const localExpanded = ref(false);
const isExpanded = computed(() => props.isExpandedExternal ?? localExpanded.value);
const isSelected = computed(() => store.selectedLayerIds.includes(props.layer.id));
const isSoloed = computed(() => props.soloedLayerIds?.includes(props.layer.id));

const isRenaming = ref(false);
const renameVal = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

const properties = computed(() => [
  { path: 'transform.position', name: 'Position', property: props.layer.transform.position },
  { path: 'transform.scale', name: 'Scale', property: props.layer.transform.scale },
  { path: 'transform.rotation', name: 'Rotation', property: props.layer.transform.rotation },
  { path: 'opacity', name: 'Opacity', property: props.layer.opacity }
]);

const allKeyframes = computed(() => {
  const kfs: any[] = [];
  properties.value.forEach(p => { if(p.property.animated) kfs.push(...p.property.keyframes); });
  return kfs;
});

const barStyle = computed(() => {
  const start = (props.layer.inPoint / props.frameCount) * 100;
  const end = ((props.layer.outPoint || props.frameCount) / props.frameCount) * 100;
  return { left: `${start}%`, width: `${end - start}%` };
});

function toggleExpand() { emit('toggleExpand', props.layer.id, !isExpanded.value); }
function selectLayer() { emit('select', props.layer.id); }
function toggleVis() { emit('updateLayer', props.layer.id, { visible: !props.layer.visible }); }
function toggleLock() { emit('updateLayer', props.layer.id, { locked: !props.layer.locked }); }
function toggleSolo() { emit('toggleSolo', props.layer.id); }
function getLayerIcon(t: string) { return t === 'solid' ? '■' : t === 'text' ? 'T' : 'L'; }

function startRename() { isRenaming.value = true; renameVal.value = props.layer.name; nextTick(() => renameInput.value?.focus()); }
function saveRename() { emit('updateLayer', props.layer.id, { name: renameVal.value }); isRenaming.value = false; }

function startDrag() {}
function startTrimIn() {}
function startTrimOut() {}

watch(() => props.isExpandedExternal, v => localExpanded.value = v);
</script>

<style scoped>
.track-wrapper { display: flex; flex-direction: column; width: 100%; }

/* SIDEBAR LAYOUT */
.sidebar-row {
  border-bottom: 1px solid #2a2a2a;
  background: #1e1e1e;
  color: #ccc;
  font-size: 16px; /* LARGE FONT */
  min-height: 32px;
}
.sidebar-row.selected { background: #2a2a2a; color: #fff; }

.row-content {
  display: flex;
  height: 32px; /* AE Standard Height */
  align-items: center;
}

.label-strip { width: 6px; height: 100%; margin-right: 4px; }
.arrow-container { width: 24px; display: flex; justify-content: center; cursor: pointer; color: #888; }
.layer-id { width: 24px; text-align: center; font-size: 12px; color: #888; }
.icon-btn { width: 24px; background: none; border: none; color: #888; cursor: pointer; font-size: 14px; }
.icon-btn:hover { color: #fff; }
.icon-btn.active { color: #f5c542; }

.layer-name-box {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 5px;
}
.type-icon { font-size: 12px; margin-right: 6px; color: #f5c542; }
.name-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 16px; }
.rename-input { background: #000; border: 1px solid #4a90d9; color: #fff; width: 100%; font-size: 16px; }

.children-container { display: flex; flex-direction: column; }

/* TRACK LAYOUT */
.track-row-container { width: 100%; }
.track-row {
  height: 32px; /* MATCHES SIDEBAR */
  border-bottom: 1px solid #333;
  position: relative;
  background: #191919;
}
.duration-bar {
  position: absolute;
  height: 20px;
  top: 6px;
  border-radius: 2px;
  opacity: 0.7;
  cursor: move;
  border: 1px solid rgba(0,0,0,0.5);
}
.bar-fill { width: 100%; height: 100%; opacity: 0.5; }
.trim-handle { position: absolute; top: 0; bottom: 0; width: 8px; cursor: ew-resize; background: rgba(255,255,255,0.1); }
.trim-in { left: 0; } .trim-out { right: 0; }
.keyframe-marker { position: absolute; top: 11px; width: 10px; height: 10px; margin-left: -5px; background: #ebcb8b; transform: rotate(45deg); border: 1px solid #000; z-index: 5; }
</style>
