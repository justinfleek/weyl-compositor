/**
 * Timeline Actions
 *
 * Playback controls, frame navigation, snap configuration,
 * and timeline-related state management.
 */

import { storeLogger } from '@/utils/logger';
import type { Layer } from '@/types/project';
import type { AudioAnalysis, PeakData } from '@/services/audioFeatures';
import { findNearestSnap, getBeatFrames, getPeakFrames, type SnapConfig, type SnapResult } from '@/services/timelineSnap';

// ============================================================================
// STORE INTERFACE
// ============================================================================

export interface TimelineStore {
  isPlaying: boolean;
  playbackRequestId: number | null;
  playbackStartTime: number | null;
  playbackStartFrame: number;
  snapConfig: SnapConfig;
  audioAnalysis: AudioAnalysis | null;
  peakData: PeakData | null;
  getActiveComp(): {
    currentFrame: number;
    settings: {
      fps: number;
      frameCount: number;
    };
    layers: Layer[];
  } | null;
  getActiveCompLayers(): Layer[];
}

// ============================================================================
// PLAYBACK CONTROLS
// ============================================================================

/**
 * Start playback
 * NOTE: This only updates UI state (currentFrame).
 * Actual frame evaluation happens via getFrameState() in render loop.
 */
export function play(store: TimelineStore): void {
  if (store.isPlaying) return;

  const comp = store.getActiveComp();
  if (!comp) return;

  store.isPlaying = true;
  store.playbackStartTime = performance.now();
  store.playbackStartFrame = comp.currentFrame;

  // Start the playback loop
  playbackLoop(store);
}

/**
 * Pause playback
 */
export function pause(store: TimelineStore): void {
  store.isPlaying = false;
  if (store.playbackRequestId !== null) {
    cancelAnimationFrame(store.playbackRequestId);
    store.playbackRequestId = null;
  }
}

/**
 * Toggle playback state
 */
export function togglePlayback(store: TimelineStore): void {
  if (store.isPlaying) {
    pause(store);
  } else {
    play(store);
  }
}

/**
 * Stop playback and reset to beginning
 */
export function stop(store: TimelineStore): void {
  pause(store);
  setFrame(store, 0);
}

/**
 * Animation loop for playback
 *
 * ARCHITECTURAL NOTE:
 * This method ONLY updates the UI state (currentFrame).
 * It does NOT evaluate or render frames directly.
 * The render loop in Vue components should watch currentFrame
 * and call getFrameState() → engine.applyFrameState().
 */
export function playbackLoop(store: TimelineStore): void {
  if (!store.isPlaying) return;

  const comp = store.getActiveComp();
  if (!comp) return;

  const elapsed = performance.now() - (store.playbackStartTime || 0);
  const fps = comp.settings.fps;
  const frameCount = comp.settings.frameCount;

  const elapsedFrames = Math.floor((elapsed / 1000) * fps);
  let newFrame = store.playbackStartFrame + elapsedFrames;

  // Loop playback
  if (newFrame >= frameCount) {
    newFrame = 0;
    store.playbackStartFrame = 0;
    store.playbackStartTime = performance.now();
  }

  // Only update UI state - do not evaluate/render here
  comp.currentFrame = newFrame;

  store.playbackRequestId = requestAnimationFrame(() => playbackLoop(store));
}

// ============================================================================
// FRAME NAVIGATION
// ============================================================================

/**
 * Set current frame (UI state only)
 * Components watching currentFrame should call getFrameState() to evaluate.
 */
export function setFrame(store: TimelineStore, frame: number): void {
  const comp = store.getActiveComp();
  if (!comp) return;
  comp.currentFrame = Math.max(0, Math.min(frame, comp.settings.frameCount - 1));
}

/**
 * Advance to next frame
 */
export function nextFrame(store: TimelineStore): void {
  const comp = store.getActiveComp();
  if (!comp) return;
  if (comp.currentFrame < comp.settings.frameCount - 1) {
    comp.currentFrame++;
  }
}

/**
 * Go to previous frame
 */
export function prevFrame(store: TimelineStore): void {
  const comp = store.getActiveComp();
  if (!comp) return;
  if (comp.currentFrame > 0) {
    comp.currentFrame--;
  }
}

/**
 * Go to first frame
 */
export function goToStart(store: TimelineStore): void {
  setFrame(store, 0);
}

/**
 * Go to last frame
 */
export function goToEnd(store: TimelineStore): void {
  const comp = store.getActiveComp();
  if (!comp) return;
  setFrame(store, comp.settings.frameCount - 1);
}

/**
 * Jump forward by N frames
 */
export function jumpFrames(store: TimelineStore, count: number): void {
  const comp = store.getActiveComp();
  if (!comp) return;
  setFrame(store, comp.currentFrame + count);
}

/**
 * Set frame with optional snap
 */
export function setFrameWithSnap(
  store: TimelineStore,
  frame: number,
  pixelsPerFrame: number,
  selectedLayerId?: string | null
): void {
  if (store.snapConfig.enabled) {
    const snapResult = findSnapPoint(store, frame, pixelsPerFrame, selectedLayerId);
    if (snapResult) {
      frame = snapResult.frame;
    }
  }
  setFrame(store, Math.round(frame));
}

// ============================================================================
// SNAP CONFIGURATION
// ============================================================================

/**
 * Find nearest snap point for a given frame
 */
export function findSnapPoint(
  store: TimelineStore,
  frame: number,
  pixelsPerFrame: number,
  selectedLayerId?: string | null
): SnapResult | null {
  return findNearestSnap(frame, store.snapConfig, pixelsPerFrame, {
    layers: store.getActiveCompLayers(),
    selectedLayerId,
    currentFrame: store.getActiveComp()?.currentFrame ?? 0,
    audioAnalysis: store.audioAnalysis,
    peakData: store.peakData,
  });
}

/**
 * Update snap configuration
 */
export function setSnapConfig(store: TimelineStore, config: Partial<SnapConfig>): void {
  store.snapConfig = { ...store.snapConfig, ...config };
}

/**
 * Toggle snapping enabled/disabled
 */
export function toggleSnapping(store: TimelineStore): void {
  store.snapConfig.enabled = !store.snapConfig.enabled;
}

/**
 * Toggle specific snap type
 */
export function toggleSnapType(
  store: TimelineStore,
  type: 'grid' | 'keyframes' | 'beats' | 'peaks' | 'layerBounds' | 'playhead'
): void {
  const typeMap: Record<string, keyof SnapConfig> = {
    'grid': 'snapToGrid',
    'keyframes': 'snapToKeyframes',
    'beats': 'snapToBeats',
    'peaks': 'snapToPeaks',
    'layerBounds': 'snapToLayerBounds',
    'playhead': 'snapToPlayhead',
  };
  const key = typeMap[type];
  if (key && typeof store.snapConfig[key] === 'boolean') {
    (store.snapConfig as any)[key] = !(store.snapConfig as any)[key];
  }
}

/**
 * Set snap threshold (tolerance in pixels)
 */
export function setSnapThreshold(store: TimelineStore, threshold: number): void {
  store.snapConfig.threshold = Math.max(1, Math.min(20, threshold));
}

/**
 * Set grid interval for snap
 */
export function setSnapGridInterval(store: TimelineStore, interval: number): void {
  store.snapConfig.gridInterval = Math.max(1, Math.round(interval));
}

// ============================================================================
// AUDIO BEAT/PEAK FRAME HELPERS
// ============================================================================

/**
 * Get all beat frames from audio analysis
 */
export function getAudioBeatFrames(store: TimelineStore): number[] {
  return getBeatFrames(store.audioAnalysis);
}

/**
 * Get all peak frames from peak data
 */
export function getAudioPeakFrames(store: TimelineStore): number[] {
  return getPeakFrames(store.peakData);
}

/**
 * Go to next beat
 */
export function goToNextBeat(store: TimelineStore): void {
  const beatFrames = getAudioBeatFrames(store);
  const currentFrame = store.getActiveComp()?.currentFrame ?? 0;

  const nextBeat = beatFrames.find(f => f > currentFrame);
  if (nextBeat !== undefined) {
    setFrame(store, nextBeat);
  }
}

/**
 * Go to previous beat
 */
export function goToPrevBeat(store: TimelineStore): void {
  const beatFrames = getAudioBeatFrames(store);
  const currentFrame = store.getActiveComp()?.currentFrame ?? 0;

  // Find last beat before current frame
  for (let i = beatFrames.length - 1; i >= 0; i--) {
    if (beatFrames[i] < currentFrame) {
      setFrame(store, beatFrames[i]);
      return;
    }
  }
}

// ============================================================================
// TIMELINE ZOOM (for UI state)
// ============================================================================

export interface TimelineZoomState {
  pixelsPerFrame: number;
  scrollOffset: number;
}

/**
 * Calculate pixels per frame from zoom level
 * @param zoomLevel - Normalized zoom level (0-1, or percentage)
 * @param minPixels - Minimum pixels per frame
 * @param maxPixels - Maximum pixels per frame
 */
export function calculatePixelsPerFrame(
  zoomLevel: number,
  minPixels: number = 2,
  maxPixels: number = 50
): number {
  // Exponential scaling for natural feel
  const t = Math.max(0, Math.min(1, zoomLevel));
  return minPixels + (maxPixels - minPixels) * Math.pow(t, 2);
}

/**
 * Calculate frame range visible in timeline viewport
 */
export function getVisibleFrameRange(
  viewportWidth: number,
  pixelsPerFrame: number,
  scrollOffset: number
): { startFrame: number; endFrame: number; frameCount: number } {
  const visibleFrames = Math.ceil(viewportWidth / pixelsPerFrame);
  const startFrame = Math.floor(scrollOffset / pixelsPerFrame);
  const endFrame = startFrame + visibleFrames;

  return {
    startFrame,
    endFrame,
    frameCount: visibleFrames
  };
}

/**
 * Calculate scroll offset to center on a specific frame
 */
export function calculateScrollToFrame(
  frame: number,
  viewportWidth: number,
  pixelsPerFrame: number
): number {
  return Math.max(0, frame * pixelsPerFrame - viewportWidth / 2);
}
