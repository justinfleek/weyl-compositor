<template>
  <div class="timeline-panel" @mouseup="stopResize" @mouseleave="stopResize" @mousemove="handleResize">
    <!-- Header -->
    <div class="timeline-header">
      <div class="header-left">
        <span class="timeline-title">Timeline</span>
        <span class="timeline-info">{{ store.frameCount }}f @ {{ store.fps }}fps</span>
      </div>
      <div class="header-center">
        <div class="playback-controls">
          <button @click="goToStart" title="Start">|&lt;</button>
          <button @click="stepBackward" title="Prev">&lt;</button>
          <button @click="togglePlayback" :class="{ active: isPlaying }">{{ isPlaying ? '||' : '▶' }}</button>
          <button @click="stepForward" title="Next">&gt;</button>
          <button @click="goToEnd" title="End">&gt;|</button>
        </div>
        <div class="frame-display">
           <input type="number" :value="store.currentFrame" @change="setFrame" class="frame-input" />
        </div>
      </div>
      <div class="header-right">
        <button class="delete-btn" @click="deleteSelectedLayers" :disabled="store.selectedLayerIds.length === 0" title="Delete Layer">
          🗑️
        </button>
        <button class="graph-toggle" :class="{ active: viewMode === 'graph' }" @click="toggleViewMode">
          {{ viewMode === 'graph' ? 'Graphs' : 'Layers' }}
        </button>

        <!-- Add Layer Menu (Fixed Positioning) -->
        <div class="add-layer-wrapper">
          <button class="add-layer-btn" @click="showAddLayerMenu = !showAddLayerMenu">+ Layer</button>
          <div v-if="showAddLayerMenu" class="add-layer-menu">
            <button @click="addLayer('solid')"><span class="icon">■</span> Solid</button>
            <button @click="addLayer('text')"><span class="icon">T</span> Text</button>
            <button @click="addLayer('spline')"><span class="icon">~</span> Shape</button>
            <button @click="addLayer('null')"><span class="icon">□</span> Null</button>
            <button @click="addLayer('camera')"><span class="icon">📷</span> Camera</button>
            <button @click="addLayer('light')"><span class="icon">💡</span> Light</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area (Unified Vertical Scroll) -->
    <div class="timeline-content" ref="timelineContentRef">
      <!-- Sticky Time Ruler -->
      <div class="time-ruler-container">
        <!-- Spacer matches Sidebar Width -->
        <div class="ruler-sidebar-spacer" :style="{ width: sidebarWidth + 'px' }">
          <div class="column-headers">
            <span class="col-header col-hash">#</span>
            <span class="col-header col-name">Layer Name</span>
            <span class="col-header col-mode">Mode</span>
            <span class="col-header col-trkmat">T/M</span>
            <span class="col-header col-parent">Parent</span>
          </div>
        </div>

        <div class="ruler-track" ref="rulerTrackRef" @mousedown="startRulerScrub">
          <div v-for="i in 20" :key="i" class="ruler-mark" :style="{ left: `${i * 5}%` }">{{ i * 5 }}</div>
          <!-- Playhead Head -->
          <div class="playhead-head" :style="{ left: `${playheadPosition}px` }">
            <div class="playhead-marker">▼</div>
          </div>
        </div>
      </div>

      <!-- Split Layout -->
      <div class="timeline-split-layout">

        <!-- LEFT: Resizable Sidebar -->
        <div class="property-tree-sidebar" :style="{ width: sidebarWidth + 'px' }">
          <template v-for="layer in filteredLayers" :key="'sidebar-' + layer.id">
            <EnhancedLayerTrack
              v-if="layer"
              :layer="layer"
              layoutMode="sidebar"
              :viewMode="viewMode"
              :frameCount="store.frameCount"
              :currentFrame="store.currentFrame"
              :allLayers="store.layers"
              :soloedLayerIds="soloedLayerIds"
              :isExpandedExternal="expandedLayers[layer.id]"
              :selectedPropertyIds="Array.from(selectedPropertyIds)"
              @select="selectLayer"
              @updateLayer="updateLayer"
              @toggleExpand="handleToggleExpand"
              @selectProperty="handlePropertySelect"
            />
          </template>
          <div v-if="filteredLayers.length === 0" class="empty-state">
            No Layers. Click "+ Layer" to create one.
          </div>
        </div>

        <!-- RESIZE HANDLE -->
        <div class="resize-handle" @mousedown="startResize"></div>

        <!-- RIGHT: Timeline Tracks -->
        <div class="track-viewport" ref="trackViewportRef">
          <!-- Playhead Line (Global, Thicker hit area) -->
          <div class="playhead-line-wrapper" :style="{ left: `${playheadPosition}px` }">
            <div class="playhead-line"></div>
          </div>

          <!-- Keyframe View -->
          <template v-if="viewMode === 'keyframes'">
            <div class="layer-bars-container">
              <template v-for="layer in filteredLayers" :key="'track-' + layer.id">
                <EnhancedLayerTrack
                  v-if="layer"
                  :layer="layer"
                  layoutMode="track"
                  :viewMode="viewMode"
                  :frameCount="store.frameCount"
                  :currentFrame="store.currentFrame"
                  :allLayers="store.layers"
                  :soloedLayerIds="soloedLayerIds"
                  :isExpandedExternal="expandedLayers[layer.id]"
                  :selectedPropertyIds="Array.from(selectedPropertyIds)"
                  @selectKeyframe="selectKeyframe"
                  @updateLayer="updateLayer"
                  @select="selectLayer"
                />
              </template>
            </div>
          </template>

          <!-- Graph View -->
          <GraphEditorCanvas
            v-else-if="viewMode === 'graph'"
            :frameCount="store.frameCount"
            :currentFrame="store.currentFrame"
            :selectedPropertyIds="Array.from(selectedPropertyIds)"
            :graphMode="'value'"
          />
        </div>
      </div>
    </div>

    <!-- Footer Controls -->
    <div class="timeline-footer">
      <div class="zoom-slider-container">
        <span class="icon">🔍</span>
        <input type="range" min="10" max="200" v-model="zoomPercent" class="zoom-slider" title="Zoom Timeline" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onMounted, onUnmounted } from 'vue';
import { useCompositorStore } from '@/stores/compositorStore';
import EnhancedLayerTrack from './EnhancedLayerTrack.vue';
import GraphEditorCanvas from './GraphEditorCanvas.vue';

const store = useCompositorStore();
const viewMode = ref<'keyframes' | 'graph'>('keyframes');
const expandedLayers = ref<Record<string, boolean>>({});
const selectedPropertyIds = ref<Set<string>>(new Set());
const showAddLayerMenu = ref(false);
const timelineContentRef = ref<HTMLDivElement | null>(null);
const rulerTrackRef = ref<HTMLDivElement | null>(null);
const trackWidth = ref(1000);
const zoomPercent = ref(100);
const soloedLayerIds = ref<string[]>([]);

// RESIZE LOGIC
const sidebarWidth = ref(400); // Wider default to fit columns
const isResizing = ref(false);
function startResize() { isResizing.value = true; document.body.style.cursor = 'col-resize'; }
function stopResize() { isResizing.value = false; document.body.style.cursor = 'default'; }
function handleResize(e: MouseEvent) {
  if (isResizing.value) sidebarWidth.value = Math.max(300, Math.min(800, e.clientX));
}

// Logic
const filteredLayers = computed(() => store.layers || []);
const playheadPosition = computed(() => {
  // Simple zoom logic
  const zoomFactor = zoomPercent.value / 100;
  return (store.currentFrame / Math.max(1, store.frameCount)) * (trackWidth.value * zoomFactor);
});

function handleToggleExpand(layerId: string, expanded: boolean) { expandedLayers.value[layerId] = expanded; }
function handlePropertySelect(propId: string, add: boolean) {
  if (add) { if (selectedPropertyIds.value.has(propId)) selectedPropertyIds.value.delete(propId); else selectedPropertyIds.value.add(propId); }
  else { selectedPropertyIds.value.clear(); selectedPropertyIds.value.add(propId); }
  selectedPropertyIds.value = new Set(selectedPropertyIds.value);
}

// Actions
function addLayer(type: string) { store.createLayer(type as any); showAddLayerMenu.value = false; }
function selectLayer(id: string) { store.selectLayer(id); }
function updateLayer(id: string, u: any) { store.updateLayer(id, u); }
function deleteSelectedLayers() { store.selectedLayerIds.forEach(id => store.deleteLayer(id)); }
function toggleViewMode() { viewMode.value = viewMode.value === 'keyframes' ? 'graph' : 'keyframes'; }
function selectKeyframe(id: string) {}

// Playback
const isPlaying = ref(false);
function togglePlayback() { isPlaying.value = !isPlaying.value; }
function goToStart() { store.setFrame(0); }
function goToEnd() { store.setFrame(store.frameCount - 1); }
function stepBackward() { store.setFrame(Math.max(0, store.currentFrame - 1)); }
function stepForward() { store.setFrame(Math.min(store.frameCount - 1, store.currentFrame + 1)); }
function setFrame(e: Event) { store.setFrame(parseInt((e.target as HTMLInputElement).value) || 0); }

// Scrubbing
function startRulerScrub(e: MouseEvent) {
  if (!rulerTrackRef.value) return;
  const rect = rulerTrackRef.value.getBoundingClientRect();
  const update = (ev: MouseEvent) => {
    const x = ev.clientX - rect.left;
    // Account for zoom
    const zoomFactor = zoomPercent.value / 100;
    const f = Math.max(0, Math.min(store.frameCount, (x / (rect.width * zoomFactor)) * store.frameCount));
    store.setFrame(Math.round(f));
  };
  update(e);
  window.addEventListener('mousemove', update);
  window.addEventListener('mouseup', () => window.removeEventListener('mousemove', update), { once: true });
}

function updateLayout() { if (rulerTrackRef.value) trackWidth.value = rulerTrackRef.value.clientWidth; }
function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'Delete' || e.key === 'Backspace') deleteSelectedLayers();
  if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
}

onMounted(() => { window.addEventListener('resize', updateLayout); window.addEventListener('keydown', handleKeydown); nextTick(updateLayout); });
onUnmounted(() => { window.removeEventListener('resize', updateLayout); window.removeEventListener('keydown', handleKeydown); });
</script>

<style scoped>
.timeline-panel { display: flex; flex-direction: column; height: 100%; background: #161616; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; user-select: none; }
.timeline-header { height: 40px; background: #222; border-bottom: 1px solid #000; display: flex; justify-content: space-between; padding: 0 10px; align-items: center; }
.header-left, .header-center, .header-right { display: flex; gap: 10px; align-items: center; }
.timeline-title { font-size: 16px; font-weight: 600; color: #bbb; }
.timeline-info { font-size: 12px; color: #666; }

/* Main Scroll Area */
.timeline-content { flex: 1; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; position: relative; }

/* Sticky Ruler */
.time-ruler-container { display: flex; height: 28px; background: #1a1a1a; position: sticky; top: 0; z-index: 20; border-bottom: 1px solid #333; }
.ruler-sidebar-spacer { flex-shrink: 0; border-right: 1px solid #444; background: #222; }
.column-headers { display: flex; height: 100%; align-items: center; padding: 0 5px; font-size: 11px; color: #888; }
.col-header { padding: 0 5px; border-right: 1px solid #333; height: 100%; display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
.col-hash { width: 30px; justify-content: center; }
.col-name { flex: 1; padding-left: 10px; }
.col-mode { width: 60px; justify-content: center; }
.col-trkmat { width: 40px; justify-content: center; }
.col-parent { width: 60px; justify-content: center; }

.ruler-track { flex: 1; position: relative; cursor: pointer; background: #222; }
.ruler-mark { position: absolute; font-size: 9px; color: #666; top: 2px; border-left: 1px solid #444; padding-left: 2px; height: 100%; }
.playhead-head { position: absolute; top: 0; height: 28px; transform: translateX(-50%); pointer-events: none; z-index: 25; }
.playhead-marker { width: 13px; height: 14px; background: #3ea6ff; clip-path: polygon(0 0, 100% 0, 50% 100%); }

/* Split Layout */
.timeline-split-layout { display: flex; flex: 1; }

.property-tree-sidebar {
  background: #1e1e1e;
  border-right: 1px solid #333;
  display: flex; flex-direction: column; flex-shrink: 0;
  overflow: visible; /* Let Parent Scroll */
}

.resize-handle { width: 4px; background: #111; cursor: col-resize; border-left: 1px solid #333; border-right: 1px solid #333; z-index: 10; flex-shrink: 0; }
.resize-handle:hover { background: #4a90d9; }

.track-viewport {
  flex: 1; position: relative; background: #1a1a1a;
  overflow-x: auto; /* Horizontal Scroll allowed */
  min-width: 0;
}

/* Playhead Line with hit area */
.playhead-line-wrapper { position: absolute; top: 0; bottom: 0; width: 1px; z-index: 100; pointer-events: none; }
.playhead-line { width: 2px; height: 100%; background: #3ea6ff; margin-left: -1px; }

/* Controls */
button { background: #333; border: 1px solid #444; color: #eee; cursor: pointer; padding: 3px 8px; border-radius: 2px; font-size: 13px; }
button:hover { background: #444; }
button.active { background: #4a90d9; border-color: #4a90d9; }
.frame-input { width: 50px; background: #111; border: 1px solid #444; color: #3ea6ff; padding: 2px; text-align: center; }

/* Fixed Menu Position */
.add-layer-wrapper { position: relative; display: inline-block; }
.add-layer-menu {
  position: absolute; top: 100%; right: 0;
  background: #252525; border: 1px solid #000;
  display: flex; flex-direction: column;
  z-index: 1000; width: 140px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5);
  margin-top: 4px;
}
.add-layer-menu button { text-align: left; border: none; background: transparent; padding: 8px 12px; border-bottom: 1px solid #333; display: flex; align-items: center; gap: 8px; }
.add-layer-menu button:hover { background: #4a90d9; color: #fff; }

.timeline-footer { height: 24px; background: #222; border-top: 1px solid #333; display: flex; align-items: center; padding: 0 10px; }
.zoom-slider { width: 100px; }
.empty-state { padding: 40px; text-align: center; color: #555; font-size: 14px; }
</style>
