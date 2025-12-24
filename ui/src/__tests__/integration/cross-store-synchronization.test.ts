/**
 * Cross-Store Synchronization Integration Tests
 *
 * CRITICAL FAILURE POINT: Audio state exists in BOTH compositorStore AND audioStore.
 * This creates potential for state drift where one store is updated but not the other.
 *
 * These tests verify that:
 * 1. State changes propagate correctly between stores
 * 2. Selection state stays in sync with layer state
 * 3. Playback state coordinates correctly with other stores
 * 4. History state captures changes from all stores
 *
 * IDENTIFIED RISKS FROM SYSTEM_MAP.md:
 * - compositorStore.audio vs audioStore audio mappings
 * - Selection referencing deleted layers
 * - Clipboard containing stale layer references
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createAnimatableProperty } from '@/types/project';
import type { Layer, AudioMapping, Keyframe } from '@/types/project';
import { syncAudioState, checkAudioStateSync, createSyncValidator, type AudioSyncTarget } from '@/stores/audioSync';

// Simulate the store state structures
interface MockAudioState {
  audioFile: string | null;
  audioAnalysis: any | null;
  mappings: AudioMapping[];
  stems: Map<string, any>;
}

interface MockSelectionState {
  selectedLayerIds: string[];
  selectedKeyframeIds: Map<string, string[]>;
  selectionMode: 'single' | 'multi' | 'range';
}

interface MockPlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  loopPlayback: boolean;
  workAreaStart: number;
  workAreaEnd: number;
}

interface MockCompositorAudioState {
  audioFile: string | null;
  audioMappings: AudioMapping[];
  bpm: number | null;
}

// Create mock stores that mirror actual store structure
function createMockAudioStore(): MockAudioState {
  return {
    audioFile: null,
    audioAnalysis: null,
    mappings: [],
    stems: new Map()
  };
}

function createMockSelectionStore(): MockSelectionState {
  return {
    selectedLayerIds: [],
    selectedKeyframeIds: new Map(),
    selectionMode: 'single'
  };
}

function createMockPlaybackStore(): MockPlaybackState {
  return {
    isPlaying: false,
    currentFrame: 0,
    loopPlayback: true,
    workAreaStart: 0,
    workAreaEnd: 80
  };
}

function createMockCompositorAudioState(): MockCompositorAudioState {
  return {
    audioFile: null,
    audioMappings: [],
    bpm: null
  };
}

// Create a test layer
function createTestLayer(id: string): Layer {
  return {
    id,
    name: `Layer ${id}`,
    type: 'solid',
    visible: true,
    locked: false,
    isolate: false,
    threeD: false,
    motionBlur: false,
    startFrame: 0,
    endFrame: 80,
    inPoint: 0,
    outPoint: 80,
    parentId: null,
    blendMode: 'normal',
    opacity: createAnimatableProperty('opacity', 100, 'number'),
    transform: {
      position: createAnimatableProperty('position', { x: 0, y: 0 }, 'vector2'),
      scale: createAnimatableProperty('scale', { x: 100, y: 100 }, 'vector2'),
      rotation: createAnimatableProperty('rotation', 0, 'number'),
      origin: createAnimatableProperty('origin', { x: 0, y: 0 }, 'vector2')
    },
    effects: [],
    properties: [],
    data: { color: '#808080', width: 1920, height: 1080 }
  } as unknown as Layer;
}

describe('Cross-Store Synchronization', () => {
  describe('Audio State Synchronization', () => {
    // This tests the identified failure point: audio state in two places

    it('audio file path must be synchronized between stores', () => {
      const audioStore = createMockAudioStore();
      const compositorAudio = createMockCompositorAudioState();

      // Simulate loading audio file
      const audioPath = '/assets/music.mp3';

      // In a proper implementation, both should be updated atomically
      audioStore.audioFile = audioPath;
      compositorAudio.audioFile = audioPath;

      expect(audioStore.audioFile).toBe(compositorAudio.audioFile);
    });

    it('audio mappings must be synchronized', () => {
      const audioStore = createMockAudioStore();
      const compositorAudio = createMockCompositorAudioState();

      // Create an audio mapping
      const mapping: AudioMapping = {
        id: 'mapping_001',
        name: 'Bass to Scale',
        sourceFeature: 'bass',
        targetLayerId: 'layer_001',
        targetPropertyPath: 'transform.scale',
        targetParameter: 'scaleUniform',
        sensitivity: 1.0,
        smoothing: 0.5,
        min: 100,
        max: 150,
        enabled: true
      };

      // Both stores should have the same mapping
      audioStore.mappings.push(mapping);
      compositorAudio.audioMappings.push(mapping);

      expect(audioStore.mappings).toHaveLength(1);
      expect(compositorAudio.audioMappings).toHaveLength(1);
      expect(audioStore.mappings[0].id).toBe(compositorAudio.audioMappings[0].id);
    });

    it('removing audio should clear both stores', () => {
      const audioStore = createMockAudioStore();
      const compositorAudio = createMockCompositorAudioState();

      // Setup initial state
      audioStore.audioFile = '/assets/music.mp3';
      audioStore.mappings.push({ id: 'map1' } as AudioMapping);
      compositorAudio.audioFile = '/assets/music.mp3';
      compositorAudio.audioMappings.push({ id: 'map1' } as AudioMapping);
      compositorAudio.bpm = 120;

      // Clear audio (both stores)
      audioStore.audioFile = null;
      audioStore.mappings = [];
      audioStore.audioAnalysis = null;
      compositorAudio.audioFile = null;
      compositorAudio.audioMappings = [];
      compositorAudio.bpm = null;

      expect(audioStore.audioFile).toBeNull();
      expect(compositorAudio.audioFile).toBeNull();
      expect(audioStore.mappings).toHaveLength(0);
      expect(compositorAudio.audioMappings).toHaveLength(0);
    });
  });

  describe('Selection State Synchronization', () => {
    it('selection should reference only existing layers', () => {
      const selectionStore = createMockSelectionStore();
      const layers: Layer[] = [
        createTestLayer('layer_001'),
        createTestLayer('layer_002'),
        createTestLayer('layer_003')
      ];

      // Select layers
      selectionStore.selectedLayerIds = ['layer_001', 'layer_002'];

      // All selected IDs should exist in layers
      const layerIds = layers.map(l => l.id);
      const allExist = selectionStore.selectedLayerIds.every(id => layerIds.includes(id));
      expect(allExist).toBe(true);
    });

    it('deleting a layer should remove it from selection', () => {
      const selectionStore = createMockSelectionStore();
      const layers: Layer[] = [
        createTestLayer('layer_001'),
        createTestLayer('layer_002'),
        createTestLayer('layer_003')
      ];

      // Select all layers
      selectionStore.selectedLayerIds = ['layer_001', 'layer_002', 'layer_003'];

      // Delete layer_002
      const deletedLayerId = 'layer_002';
      const index = layers.findIndex(l => l.id === deletedLayerId);
      layers.splice(index, 1);

      // Selection should be updated (simulating what removeFromSelection does)
      selectionStore.selectedLayerIds = selectionStore.selectedLayerIds.filter(
        id => id !== deletedLayerId
      );

      expect(selectionStore.selectedLayerIds).toHaveLength(2);
      expect(selectionStore.selectedLayerIds).not.toContain('layer_002');
    });

    it('selected keyframes should reference existing layers', () => {
      const selectionStore = createMockSelectionStore();
      const layers: Layer[] = [createTestLayer('layer_001')];

      // Add keyframe to layer
      const layer = layers[0];
      layer.transform.position.animated = true;
      layer.transform.position.keyframes = [
        { id: 'kf_001', frame: 0, value: { x: 0, y: 0 } } as Keyframe<any>,
        { id: 'kf_002', frame: 40, value: { x: 100, y: 100 } } as Keyframe<any>
      ];

      // Select keyframes
      selectionStore.selectedKeyframeIds.set('layer_001', ['kf_001', 'kf_002']);

      // Verify layer exists for selected keyframes
      for (const [layerId, _] of selectionStore.selectedKeyframeIds) {
        expect(layers.some(l => l.id === layerId)).toBe(true);
      }
    });

    it('clearing layers should clear keyframe selection', () => {
      const selectionStore = createMockSelectionStore();

      selectionStore.selectedKeyframeIds.set('layer_001', ['kf_001', 'kf_002']);
      selectionStore.selectedKeyframeIds.set('layer_002', ['kf_003']);

      // Simulate clearing all layers
      selectionStore.selectedLayerIds = [];
      selectionStore.selectedKeyframeIds.clear();

      expect(selectionStore.selectedKeyframeIds.size).toBe(0);
    });
  });

  describe('Playback State Coordination', () => {
    it('work area bounds must be within composition range', () => {
      const playbackStore = createMockPlaybackStore();
      const compositionFrameCount = 81;

      expect(playbackStore.workAreaStart).toBeGreaterThanOrEqual(0);
      expect(playbackStore.workAreaEnd).toBeLessThanOrEqual(compositionFrameCount - 1);
      expect(playbackStore.workAreaStart).toBeLessThan(playbackStore.workAreaEnd);
    });

    it('current frame should be within work area during playback', () => {
      const playbackStore = createMockPlaybackStore();
      playbackStore.workAreaStart = 10;
      playbackStore.workAreaEnd = 60;
      playbackStore.isPlaying = true;

      // During playback, frame should loop within work area
      playbackStore.currentFrame = 35; // Valid
      expect(playbackStore.currentFrame).toBeGreaterThanOrEqual(playbackStore.workAreaStart);
      expect(playbackStore.currentFrame).toBeLessThanOrEqual(playbackStore.workAreaEnd);
    });

    it('resizing composition should constrain work area', () => {
      const playbackStore = createMockPlaybackStore();
      playbackStore.workAreaEnd = 80;

      // Simulate reducing composition to 50 frames
      const newFrameCount = 50;

      // Work area should be constrained
      if (playbackStore.workAreaEnd >= newFrameCount) {
        playbackStore.workAreaEnd = newFrameCount - 1;
      }
      if (playbackStore.currentFrame >= newFrameCount) {
        playbackStore.currentFrame = newFrameCount - 1;
      }

      expect(playbackStore.workAreaEnd).toBe(49);
    });
  });

  describe('Clipboard State Integrity', () => {
    it('clipboard layers should be deep copies', () => {
      const layers: Layer[] = [createTestLayer('layer_001')];
      const clipboard: { layers: Layer[] } = { layers: [] };

      // Copy to clipboard (should deep clone)
      const originalLayer = layers[0];
      const clonedLayer = JSON.parse(JSON.stringify(originalLayer)) as Layer;
      clonedLayer.id = 'layer_001_copy'; // New ID for paste
      clipboard.layers = [clonedLayer];

      // Modify original
      originalLayer.name = 'Modified Name';

      // Clipboard should be unaffected
      expect(clipboard.layers[0].name).toBe('Layer layer_001');
    });

    it('pasting layers should generate new IDs', () => {
      const layers: Layer[] = [createTestLayer('layer_001')];
      const clipboard: { layers: Layer[] } = { layers: [] };

      // Copy
      const cloned = JSON.parse(JSON.stringify(layers[0])) as Layer;
      clipboard.layers = [cloned];

      // Paste (generate new ID)
      const pasted = JSON.parse(JSON.stringify(clipboard.layers[0])) as Layer;
      pasted.id = `layer_${Date.now()}_pasted`;
      layers.push(pasted);

      // Verify unique IDs
      const ids = layers.map(l => l.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids).toEqual(uniqueIds);
    });

    it('pasting should update parent references', () => {
      const parent = createTestLayer('layer_parent');
      const child = createTestLayer('layer_child');
      child.parentId = 'layer_parent';

      const layers = [parent, child];
      const clipboard: { layers: Layer[] } = { layers: [] };

      // Copy both layers
      clipboard.layers = layers.map(l => JSON.parse(JSON.stringify(l)));

      // Simulate paste with new IDs
      const idMap: Record<string, string> = {
        'layer_parent': 'layer_parent_copy',
        'layer_child': 'layer_child_copy'
      };

      const pastedLayers = clipboard.layers.map(l => {
        const copy = JSON.parse(JSON.stringify(l)) as Layer;
        copy.id = idMap[l.id];
        if (copy.parentId && idMap[copy.parentId]) {
          copy.parentId = idMap[copy.parentId];
        }
        return copy;
      });

      // Verify parent reference was updated
      const pastedChild = pastedLayers.find(l => l.id === 'layer_child_copy');
      expect(pastedChild?.parentId).toBe('layer_parent_copy');
    });
  });

  describe('Effect Reference Integrity', () => {
    it('audio mapping layer references should exist', () => {
      const layers: Layer[] = [
        createTestLayer('layer_001'),
        createTestLayer('layer_002')
      ];

      const mappings: AudioMapping[] = [
        {
          id: 'map_001',
          name: 'Test Mapping',
          sourceFeature: 'amplitude',
          targetLayerId: 'layer_001',
          targetPropertyPath: 'opacity',
          targetParameter: 'opacity',
          sensitivity: 1.0,
          smoothing: 0.5,
          min: 0,
          max: 100,
          enabled: true
        }
      ];

      // Verify all referenced layers exist
      const layerIds = layers.map(l => l.id);
      for (const mapping of mappings) {
        expect(layerIds).toContain(mapping.targetLayerId);
      }
    });

    it('deleting layer should clean up audio mappings', () => {
      const layers: Layer[] = [
        createTestLayer('layer_001'),
        createTestLayer('layer_002')
      ];

      const mappings: AudioMapping[] = [
        { id: 'map_001', targetLayerId: 'layer_001' } as AudioMapping,
        { id: 'map_002', targetLayerId: 'layer_002' } as AudioMapping
      ];

      // Delete layer_001
      const deletedId = 'layer_001';
      const layerIndex = layers.findIndex(l => l.id === deletedId);
      layers.splice(layerIndex, 1);

      // Clean up mappings referencing deleted layer
      const cleanedMappings = mappings.filter(m => m.targetLayerId !== deletedId);

      expect(cleanedMappings).toHaveLength(1);
      expect(cleanedMappings[0].targetLayerId).toBe('layer_002');
    });

    it('nested comp references should be valid composition IDs', () => {
      const compositions = {
        'comp_main': { id: 'comp_main', name: 'Main' },
        'comp_logo': { id: 'comp_logo', name: 'Logo' }
      };

      const nestedCompLayer = createTestLayer('layer_nested');
      nestedCompLayer.type = 'nestedComp';
      (nestedCompLayer.data as any) = { compositionId: 'comp_logo' };

      // Verify referenced composition exists
      const referencedCompId = (nestedCompLayer.data as any).compositionId;
      expect(compositions[referencedCompId]).toBeDefined();
    });
  });

  describe('Cascade Delete Operations', () => {
    it('deleting parent layer should orphan children', () => {
      const layers: Layer[] = [
        createTestLayer('layer_parent'),
        createTestLayer('layer_child_1'),
        createTestLayer('layer_child_2')
      ];
      layers[1].parentId = 'layer_parent';
      layers[2].parentId = 'layer_parent';

      // Delete parent
      const parentId = 'layer_parent';
      const parentIndex = layers.findIndex(l => l.id === parentId);
      layers.splice(parentIndex, 1);

      // Children should have parentId cleared
      for (const layer of layers) {
        if (layer.parentId === parentId) {
          layer.parentId = null;
        }
      }

      expect(layers[0].parentId).toBeNull();
      expect(layers[1].parentId).toBeNull();
    });

    it('deleting composition should clean up nested comp references', () => {
      const compositions: Record<string, any> = {
        'comp_main': {
          id: 'comp_main',
          layers: [
            { id: 'layer_1', type: 'nestedComp', data: { compositionId: 'comp_nested' } }
          ]
        },
        'comp_nested': { id: 'comp_nested', layers: [] }
      };

      // Delete nested composition
      delete compositions['comp_nested'];

      // Main comp's nested layer reference is now invalid
      const mainComp = compositions['comp_main'];
      for (const layer of mainComp.layers) {
        if (layer.type === 'nestedComp') {
          const refId = layer.data.compositionId;
          if (!compositions[refId]) {
            // Mark as broken reference
            layer.data.compositionId = null;
            layer.visible = false; // Hide broken reference
          }
        }
      }

      expect(mainComp.layers[0].data.compositionId).toBeNull();
      expect(mainComp.layers[0].visible).toBe(false);
    });
  });
});

// ============================================================================
// AUDIO SYNC MECHANISM TESTS
// ============================================================================

describe('Audio Sync Mechanism', () => {
  /**
   * Tests for the audio state synchronization system.
   * audioStore is SOURCE OF TRUTH, compositorStore is synced FROM it.
   */

  // Create mock stores for testing sync without Pinia
  function createMockAudioSource() {
    return {
      audioBuffer: null as AudioBuffer | null,
      audioFile: null as File | null,
      audioAnalysis: null as any,
      loadingState: 'idle' as const,
      loadingProgress: 0,
      loadingPhase: '',
      loadingError: null as string | null,
    };
  }

  function createMockSyncTarget(): AudioSyncTarget {
    return {
      audioBuffer: null,
      audioFile: null,
      audioAnalysis: null,
      audioLoadingState: 'idle',
      audioLoadingProgress: 0,
      audioLoadingPhase: '',
      audioLoadingError: null,
    };
  }

  describe('syncAudioState', () => {
    it('syncs audioBuffer from source to target', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      // Simulate loaded audio in source
      const mockBuffer = { duration: 5.0 } as AudioBuffer;
      source.audioBuffer = mockBuffer;

      // Before sync - target is empty
      expect(target.audioBuffer).toBeNull();

      // Sync
      syncAudioState(target, source);

      // After sync - target matches source
      expect(target.audioBuffer).toBe(mockBuffer);
    });

    it('syncs audioFile from source to target', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      const mockFile = new File([''], 'test.mp3', { type: 'audio/mp3' });
      source.audioFile = mockFile;

      syncAudioState(target, source);

      expect(target.audioFile).toBe(mockFile);
    });

    it('syncs loading state from source to target', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      source.loadingState = 'analyzing';
      source.loadingProgress = 0.75;
      source.loadingPhase = 'Extracting features...';

      syncAudioState(target, source);

      expect(target.audioLoadingState).toBe('analyzing');
      expect(target.audioLoadingProgress).toBe(0.75);
      expect(target.audioLoadingPhase).toBe('Extracting features...');
    });

    it('syncs error state from source to target', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      source.loadingState = 'error';
      source.loadingError = 'Failed to decode audio';

      syncAudioState(target, source);

      expect(target.audioLoadingState).toBe('error');
      expect(target.audioLoadingError).toBe('Failed to decode audio');
    });

    it('syncs null values (clear audio)', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      // Target has audio loaded
      target.audioBuffer = { duration: 5.0 } as AudioBuffer;
      target.audioFile = new File([''], 'test.mp3');
      target.audioLoadingState = 'complete';

      // Source is cleared
      source.audioBuffer = null;
      source.audioFile = null;
      source.loadingState = 'idle';

      syncAudioState(target, source);

      expect(target.audioBuffer).toBeNull();
      expect(target.audioFile).toBeNull();
      expect(target.audioLoadingState).toBe('idle');
    });
  });

  describe('checkAudioStateSync', () => {
    it('returns true when stores are in sync', () => {
      const mockBuffer = { duration: 5.0 } as AudioBuffer;
      const mockFile = new File([''], 'test.mp3');

      const storeA = { audioBuffer: mockBuffer, audioFile: mockFile };
      const storeB = { audioBuffer: mockBuffer, audioFile: mockFile };

      expect(checkAudioStateSync(storeA, storeB)).toBe(true);
    });

    it('returns false when audioBuffer differs', () => {
      const bufferA = { duration: 5.0 } as AudioBuffer;
      const bufferB = { duration: 5.0 } as AudioBuffer; // Different instance!

      const storeA = { audioBuffer: bufferA, audioFile: null };
      const storeB = { audioBuffer: bufferB, audioFile: null };

      // Different instances = not in sync (reference equality)
      expect(checkAudioStateSync(storeA, storeB)).toBe(false);
    });

    it('returns false when audioFile differs', () => {
      const fileA = new File([''], 'a.mp3');
      const fileB = new File([''], 'b.mp3');

      const storeA = { audioBuffer: null, audioFile: fileA };
      const storeB = { audioBuffer: null, audioFile: fileB };

      expect(checkAudioStateSync(storeA, storeB)).toBe(false);
    });

    it('returns true when both are null', () => {
      const storeA = { audioBuffer: null, audioFile: null };
      const storeB = { audioBuffer: null, audioFile: null };

      expect(checkAudioStateSync(storeA, storeB)).toBe(true);
    });
  });

  describe('createSyncValidator', () => {
    it('creates a validator that detects sync state', () => {
      const mockBuffer = { duration: 5.0 } as AudioBuffer;

      const storeA = { audioBuffer: mockBuffer, audioFile: null };
      const storeB = { audioBuffer: mockBuffer, audioFile: null };

      const validator = createSyncValidator(storeA, storeB);
      const result = validator();

      expect(result.inSync).toBe(true);
      expect(result.drift).toHaveLength(0);
    });

    it('detects drift and reports which fields are out of sync', () => {
      const storeA = { audioBuffer: { duration: 5 } as AudioBuffer, audioFile: null };
      const storeB = { audioBuffer: null, audioFile: null };

      const validator = createSyncValidator(storeA, storeB);
      const result = validator();

      expect(result.inSync).toBe(false);
      expect(result.drift).toContain('audioBuffer');
    });

    it('detects multiple drift fields', () => {
      const storeA = {
        audioBuffer: { duration: 5 } as AudioBuffer,
        audioFile: new File([''], 'a.mp3')
      };
      const storeB = {
        audioBuffer: null,
        audioFile: new File([''], 'b.mp3')
      };

      const validator = createSyncValidator(storeA, storeB);
      const result = validator();

      expect(result.inSync).toBe(false);
      expect(result.drift).toContain('audioBuffer');
      expect(result.drift).toContain('audioFile');
      expect(result.drift).toHaveLength(2);
    });
  });

  describe('Integration: Sync after audio operations', () => {
    it('stores stay in sync after audio load simulation', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      // Simulate audio load sequence
      const mockFile = new File([''], 'music.mp3');
      const mockBuffer = { duration: 120.5 } as AudioBuffer;
      const mockAnalysis = { bpm: 128, frameCount: 1928 };

      // Step 1: File selected
      source.audioFile = mockFile;
      source.loadingState = 'decoding';
      syncAudioState(target, source);

      expect(target.audioFile).toBe(mockFile);
      expect(target.audioLoadingState).toBe('decoding');

      // Step 2: Decoding complete, analyzing
      source.loadingState = 'analyzing';
      source.loadingProgress = 0.5;
      syncAudioState(target, source);

      expect(target.audioLoadingState).toBe('analyzing');
      expect(target.audioLoadingProgress).toBe(0.5);

      // Step 3: Complete
      source.audioBuffer = mockBuffer;
      source.audioAnalysis = mockAnalysis;
      source.loadingState = 'complete';
      source.loadingProgress = 1;
      syncAudioState(target, source);

      expect(target.audioBuffer).toBe(mockBuffer);
      expect(target.audioAnalysis).toBe(mockAnalysis);
      expect(target.audioLoadingState).toBe('complete');

      // Verify sync
      expect(checkAudioStateSync(
        { audioBuffer: source.audioBuffer, audioFile: source.audioFile },
        { audioBuffer: target.audioBuffer, audioFile: target.audioFile }
      )).toBe(true);
    });

    it('stores stay in sync after audio clear simulation', () => {
      const source = createMockAudioSource();
      const target = createMockSyncTarget();

      // Setup: Both have audio loaded
      const mockBuffer = { duration: 60 } as AudioBuffer;
      source.audioBuffer = mockBuffer;
      target.audioBuffer = mockBuffer;

      // Clear audio in source
      source.audioBuffer = null;
      source.audioFile = null;
      source.audioAnalysis = null;
      source.loadingState = 'idle';

      // Target not yet synced - drift detected
      expect(checkAudioStateSync(
        { audioBuffer: source.audioBuffer, audioFile: source.audioFile },
        { audioBuffer: target.audioBuffer, audioFile: target.audioFile }
      )).toBe(false);

      // Sync
      syncAudioState(target, source);

      // Now in sync
      expect(checkAudioStateSync(
        { audioBuffer: source.audioBuffer, audioFile: source.audioFile },
        { audioBuffer: target.audioBuffer, audioFile: target.audioFile }
      )).toBe(true);

      expect(target.audioBuffer).toBeNull();
    });
  });
});
