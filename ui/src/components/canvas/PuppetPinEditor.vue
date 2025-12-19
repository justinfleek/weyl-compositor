<!--
  @deprecated This component is deprecated. Import from './MeshWarpPinEditor.vue' instead.

  This file re-exports MeshWarpPinEditor.vue for backwards compatibility.
  The "Puppet" naming has been replaced with "Mesh Warp" / "Warp" terminology.
-->
<template>
  <MeshWarpPinEditor
    :layerId="layerId"
    :canvasWidth="canvasWidth"
    :canvasHeight="canvasHeight"
    :isActive="isActive"
    @pin-added="$emit('pin-added', $event)"
    @pin-removed="$emit('pin-removed', $event)"
    @pin-moved="(pinId, x, y) => $emit('pin-moved', pinId, x, y)"
    @pin-selected="$emit('pin-selected', $event)"
  />
</template>

<script setup lang="ts">
import MeshWarpPinEditor from './MeshWarpPinEditor.vue';
import type { WarpPin } from '@/types/meshWarp';

// Backwards compatibility: re-export PuppetPin as alias
export type PuppetPin = WarpPin;

// Props
defineProps<{
  layerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  isActive: boolean;
}>();

// Emits - using WarpPin but keeping same event names for backwards compat
defineEmits<{
  (e: 'pin-added', pin: WarpPin): void;
  (e: 'pin-removed', pinId: string): void;
  (e: 'pin-moved', pinId: string, x: number, y: number): void;
  (e: 'pin-selected', pinId: string | null): void;
}>();
</script>
