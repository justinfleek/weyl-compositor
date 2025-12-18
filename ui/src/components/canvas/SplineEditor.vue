<template>
  <div class="spline-editor">
    <!-- Control point visuals are rendered via SVG overlay -->
    <svg
      class="control-overlay"
      :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
      :style="overlayStyle"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @contextmenu="handleRightClick"
    >
      <!-- Handle lines -->
      <template v-for="point in visibleControlPoints" :key="`handles-${point.id}`">
        <line
          v-if="point.handleIn && selectedPointId === point.id"
          :x1="point.x"
          :y1="point.y"
          :x2="point.handleIn.x"
          :y2="point.handleIn.y"
          class="handle-line"
        />
        <line
          v-if="point.handleOut && selectedPointId === point.id"
          :x1="point.x"
          :y1="point.y"
          :x2="point.handleOut.x"
          :y2="point.handleOut.y"
          class="handle-line"
        />
      </template>

      <!-- Handle points -->
      <template v-for="point in visibleControlPoints" :key="`handle-points-${point.id}`">
        <circle
          v-if="point.handleIn && selectedPointId === point.id"
          :cx="point.handleIn.x"
          :cy="point.handleIn.y"
          r="4"
          class="handle-point"
          :class="{ active: dragTarget?.type === 'handleIn' && dragTarget.pointId === point.id }"
          @mousedown.stop="startDragHandle(point.id, 'in', $event)"
        />
        <circle
          v-if="point.handleOut && selectedPointId === point.id"
          :cx="point.handleOut.x"
          :cy="point.handleOut.y"
          r="4"
          class="handle-point"
          :class="{ active: dragTarget?.type === 'handleOut' && dragTarget.pointId === point.id }"
          @mousedown.stop="startDragHandle(point.id, 'out', $event)"
        />
      </template>

      <!-- Control points -->
      <circle
        v-for="point in visibleControlPoints"
        :key="`point-${point.id}`"
        :cx="point.x"
        :cy="point.y"
        r="6"
        class="control-point"
        :class="{
          selected: selectedPointId === point.id,
          corner: point.type === 'corner',
          smooth: point.type === 'smooth'
        }"
        @mousedown.stop="startDragPoint(point.id, $event)"
      />

      <!-- Preview point when in pen mode -->
      <circle
        v-if="previewPoint && isPenMode"
        :cx="previewPoint.x"
        :cy="previewPoint.y"
        r="4"
        class="preview-point"
      />

      <!-- Close path indicator - shows when hovering near first point -->
      <circle
        v-if="canClosePath && closePathPreview"
        :cx="visibleControlPoints[0].x"
        :cy="visibleControlPoints[0].y"
        r="10"
        class="close-indicator"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCompositorStore } from '@/stores/compositorStore';
import type { ControlPoint, SplineData } from '@/types/project';

interface Props {
  layerId: string | null;
  canvasWidth: number;      // Composition width (e.g., 832)
  canvasHeight: number;     // Composition height (e.g., 480)
  containerWidth: number;   // DOM container width (CSS pixels)
  containerHeight: number;  // DOM container height (CSS pixels)
  zoom: number;
  viewportTransform: number[];
  isPenMode: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'pointAdded', point: ControlPoint): void;
  (e: 'pointMoved', pointId: string, x: number, y: number): void;
  (e: 'handleMoved', pointId: string, handleType: 'in' | 'out', x: number, y: number): void;
  (e: 'pointDeleted', pointId: string): void;
  (e: 'pathUpdated'): void;
  (e: 'pathClosed'): void;
}>();

const store = useCompositorStore();

// State
const selectedPointId = ref<string | null>(null);
const previewPoint = ref<{ x: number; y: number } | null>(null);
const closePathPreview = ref(false);
const dragTarget = ref<{
  type: 'point' | 'handleIn' | 'handleOut';
  pointId: string;
  startX: number;
  startY: number;
} | null>(null);

// Get control points from active spline layer
const visibleControlPoints = computed<ControlPoint[]>(() => {
  if (!props.layerId) return [];

  const layer = store.layers.find(l => l.id === props.layerId);
  if (!layer || layer.type !== 'spline' || !layer.data) return [];

  const splineData = layer.data as SplineData;
  return splineData.controlPoints || [];
});

// Check if path can be closed (at least 3 points, not already closed)
const canClosePath = computed(() => {
  if (!props.layerId || visibleControlPoints.value.length < 3) return false;

  const layer = store.layers.find(l => l.id === props.layerId);
  if (!layer || layer.type !== 'spline' || !layer.data) return false;

  const splineData = layer.data as SplineData;
  return !splineData.closed;
});

// Check if we're close to the first point
const CLOSE_THRESHOLD = 15; // pixels

// Calculate overlay position and size to match Three.js render area
const overlayStyle = computed(() => {
  const containerAspect = props.containerWidth / props.containerHeight;
  const compAspect = props.canvasWidth / props.canvasHeight;

  let width: number;
  let height: number;
  let left = 0;
  let top = 0;

  if (containerAspect > compAspect) {
    // Container is wider - composition is fit to height
    height = props.containerHeight;
    width = props.canvasWidth * (props.containerHeight / props.canvasHeight);
    left = (props.containerWidth - width) / 2;
  } else {
    // Container is taller - composition is fit to width
    width = props.containerWidth;
    height = props.canvasHeight * (props.containerWidth / props.canvasWidth);
    top = (props.containerHeight - height) / 2;
  }

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'all' as const
  };
});

// Convert screen coords (relative to SVG) to composition coords
function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
  // The SVG is now sized to match the composition area
  // Its viewBox is 0 0 canvasWidth canvasHeight
  // So we just need to scale from SVG element coords to viewBox coords
  const svgRect = overlayStyle.value;
  const svgWidth = parseFloat(svgRect.width);
  const svgHeight = parseFloat(svgRect.height);

  // Scale from SVG element size to composition (viewBox) size
  const x = (screenX / svgWidth) * props.canvasWidth;
  const y = (screenY / svgHeight) * props.canvasHeight;

  return { x, y };
}

// Get mouse position relative to SVG
function getMousePos(event: MouseEvent): { x: number; y: number } {
  const svg = event.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;
  return screenToCanvas(screenX, screenY);
}

// Handle mouse events
function handleMouseDown(event: MouseEvent) {
  if (!props.isPenMode) return;

  const pos = getMousePos(event);

  // In pen mode, add new point on click
  if (props.layerId) {
    const layer = store.layers.find(l => l.id === props.layerId);
    if (layer && layer.type === 'spline') {
      const newPoint: ControlPoint = {
        id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: pos.x,
        y: pos.y,
        handleIn: null,
        handleOut: null,
        type: 'corner'
      };

      // Add point via store action
      store.addSplineControlPoint(props.layerId, newPoint);

      // Select the new point
      selectedPointId.value = newPoint.id;

      // Start dragging to create handle
      dragTarget.value = {
        type: 'handleOut',
        pointId: newPoint.id,
        startX: pos.x,
        startY: pos.y
      };

      emit('pointAdded', newPoint);
      emit('pathUpdated');
    }
  }
}

function handleMouseMove(event: MouseEvent) {
  const pos = getMousePos(event);

  // Update preview point in pen mode
  if (props.isPenMode) {
    previewPoint.value = pos;
  }

  // Check proximity to first point for close path preview
  if (canClosePath.value && visibleControlPoints.value.length > 0) {
    const firstPoint = visibleControlPoints.value[0];
    const dx = pos.x - firstPoint.x;
    const dy = pos.y - firstPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    closePathPreview.value = dist < CLOSE_THRESHOLD;
  } else {
    closePathPreview.value = false;
  }

  // Handle dragging
  if (dragTarget.value && props.layerId) {
    const layer = store.layers.find(l => l.id === props.layerId);
    if (!layer || layer.type !== 'spline') return;

    const splineData = layer.data as SplineData;
    const point = splineData.controlPoints?.find(p => p.id === dragTarget.value!.pointId);
    if (!point) return;

    if (dragTarget.value.type === 'point') {
      // Move the control point
      const dx = pos.x - point.x;
      const dy = pos.y - point.y;

      // Build update with moved handles
      const updates: any = { x: pos.x, y: pos.y };
      if (point.handleIn) {
        updates.handleIn = { x: point.handleIn.x + dx, y: point.handleIn.y + dy };
      }
      if (point.handleOut) {
        updates.handleOut = { x: point.handleOut.x + dx, y: point.handleOut.y + dy };
      }

      // Update via store
      store.updateSplineControlPoint(props.layerId, point.id, updates);

      emit('pointMoved', point.id, pos.x, pos.y);
    } else if (dragTarget.value.type === 'handleIn') {
      const updates: any = { handleIn: { x: pos.x, y: pos.y } };

      // Mirror to handleOut if smooth
      if (point.type === 'smooth') {
        const dx = pos.x - point.x;
        const dy = pos.y - point.y;
        updates.handleOut = { x: point.x - dx, y: point.y - dy };
      }

      store.updateSplineControlPoint(props.layerId, point.id, updates);
      emit('handleMoved', point.id, 'in', pos.x, pos.y);
    } else if (dragTarget.value.type === 'handleOut') {
      const updates: any = { handleOut: { x: pos.x, y: pos.y } };

      // Mirror to handleIn if smooth
      if (point.type === 'smooth') {
        const dx = pos.x - point.x;
        const dy = pos.y - point.y;
        updates.handleIn = { x: point.x - dx, y: point.y - dy };
      }

      store.updateSplineControlPoint(props.layerId, point.id, updates);
      emit('handleMoved', point.id, 'out', pos.x, pos.y);
    }

    emit('pathUpdated');
  }
}

function handleMouseUp() {
  if (dragTarget.value && props.layerId) {
    // If we were creating a new handle by dragging, convert to smooth point
    const layer = store.layers.find(l => l.id === props.layerId);
    if (layer && layer.type === 'spline') {
      const splineData = layer.data as SplineData;
      const point = splineData.controlPoints?.find(p => p.id === dragTarget.value!.pointId);
      if (point && point.handleOut) {
        // Check if handle was dragged far enough
        const dx = point.handleOut.x - point.x;
        const dy = point.handleOut.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          // Convert to smooth and create mirrored handleIn via store
          store.updateSplineControlPoint(props.layerId, point.id, {
            type: 'smooth',
            handleIn: { x: point.x - dx, y: point.y - dy }
          });
        } else {
          // Too small, remove handle via store
          store.updateSplineControlPoint(props.layerId, point.id, {
            handleOut: null
          });
        }
      }
    }

    dragTarget.value = null;
    emit('pathUpdated');
  }
}

// Right-click to close path
function handleRightClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (!props.layerId || !canClosePath.value) return;

  const pos = getMousePos(event);

  // Check if clicking near first point
  if (visibleControlPoints.value.length > 0) {
    const firstPoint = visibleControlPoints.value[0];
    const dx = pos.x - firstPoint.x;
    const dy = pos.y - firstPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CLOSE_THRESHOLD) {
      closePath();
      return;
    }
  }

  // Also allow closing path from anywhere with right-click when in pen mode
  if (props.isPenMode && visibleControlPoints.value.length >= 3) {
    closePath();
  }
}

// Close the path
function closePath() {
  if (!props.layerId) return;

  const layer = store.layers.find(l => l.id === props.layerId);
  if (!layer || layer.type !== 'spline' || !layer.data) return;

  // Update the spline data to closed
  store.updateLayerData(props.layerId, { closed: true });

  emit('pathClosed');
  emit('pathUpdated');
}

function startDragPoint(pointId: string, event: MouseEvent) {
  selectedPointId.value = pointId;

  if (!props.isPenMode) {
    const pos = getMousePos(event);
    dragTarget.value = {
      type: 'point',
      pointId,
      startX: pos.x,
      startY: pos.y
    };
  }
}

function startDragHandle(pointId: string, handleType: 'in' | 'out', event: MouseEvent) {
  const pos = getMousePos(event);
  dragTarget.value = {
    type: handleType === 'in' ? 'handleIn' : 'handleOut',
    pointId,
    startX: pos.x,
    startY: pos.y
  };
}

// Delete selected point on Delete key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedPointId.value && props.layerId) {
      const layer = store.layers.find(l => l.id === props.layerId);
      if (layer && layer.type === 'spline') {
        const pointId = selectedPointId.value;
        // Delete via store action
        store.deleteSplineControlPoint(props.layerId, pointId);
        emit('pointDeleted', pointId);
        emit('pathUpdated');
        selectedPointId.value = null;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// Expose selected point for external access
defineExpose({
  selectedPointId,
  clearSelection: () => { selectedPointId.value = null; }
});
</script>

<style scoped>
.spline-editor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.control-overlay {
  /* Position and size set via inline styles (overlayStyle) */
  pointer-events: all;
}

.control-point {
  fill: #ffffff;
  stroke: #00ff00;
  stroke-width: 2;
  cursor: pointer;
  transition: fill 0.1s, transform 0.1s;
}

.control-point:hover {
  fill: #00ff00;
}

.control-point.selected {
  fill: #00ff00;
  stroke: #ffffff;
}

.control-point.corner {
  /* Square appearance for corner points */
}

.control-point.smooth {
  /* Circle for smooth points */
}

.handle-line {
  stroke: #00ff00;
  stroke-width: 1;
  stroke-dasharray: 4 2;
  opacity: 0.7;
}

.handle-point {
  fill: #00ff00;
  stroke: #ffffff;
  stroke-width: 1;
  cursor: pointer;
}

.handle-point:hover,
.handle-point.active {
  fill: #ffffff;
  stroke: #00ff00;
}

.preview-point {
  fill: rgba(0, 255, 0, 0.5);
  stroke: #00ff00;
  stroke-width: 1;
  pointer-events: none;
}

.close-indicator {
  fill: rgba(0, 255, 0, 0.2);
  stroke: #00ff00;
  stroke-width: 2;
  stroke-dasharray: 4 2;
  pointer-events: none;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
</style>
