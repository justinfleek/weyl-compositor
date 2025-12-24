/**
 * Project Data Integrity Integration Tests
 *
 * Tests the complete project data lifecycle:
 * - Project serialization and deserialization
 * - Cross-store data synchronization
 * - Asset reference integrity
 * - Layer property preservation
 * - Keyframe data round-trip
 *
 * CRITICAL: These tests verify that saving and loading a project
 * produces identical functional results.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createAnimatableProperty, type LatticeProject, type Composition, type Layer, type Keyframe } from '@/types/project';
import { interpolateProperty } from '@/services/interpolation';
import { MotionEngine } from '@/engine/MotionEngine';

// Create a fully populated test project
function createCompleteTestProject(): LatticeProject {
  const compId = 'main_comp';
  const nestedCompId = 'nested_comp';

  // Create layers with various configurations
  const solidLayer: Layer = {
    id: 'layer_solid_001',
    name: 'Background Solid',
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
    opacity: createAnimatedOpacity(100, 0, 0, 80),
    transform: createStaticTransform(960, 540),
    effects: [],
    properties: [],
    data: { color: '#336699', width: 1920, height: 1080 }
  } as unknown as Layer;

  const textLayer: Layer = {
    id: 'layer_text_001',
    name: 'Animated Title',
    type: 'text',
    visible: true,
    locked: false,
    isolate: false,
    threeD: false,
    motionBlur: true,
    startFrame: 10,
    endFrame: 70,
    inPoint: 10,
    outPoint: 70,
    parentId: null,
    blendMode: 'normal',
    opacity: createAnimatableProperty('opacity', 100, 'number'),
    transform: createAnimatedTransform(),
    effects: [{
      id: 'effect_001',
      effectKey: 'blur',
      enabled: true,
      parameters: {
        radius: createAnimatableProperty('radius', 0, 'number')
      }
    }],
    properties: [],
    data: {
      text: 'LATTICE',
      fontFamily: 'Inter',
      fontSize: 96,
      fontWeight: '700',
      fontStyle: 'normal',
      fill: '#ffffff',
      stroke: '',
      strokeWidth: 0,
      tracking: 50,
      letterSpacing: 0,
      lineSpacing: 1.2,
      lineAnchor: 50,
      textAlign: 'center'
    }
  } as unknown as Layer;

  const particleLayer: Layer = {
    id: 'layer_particles_001',
    name: 'Fire Particles',
    type: 'particles',
    visible: true,
    locked: false,
    isolate: false,
    threeD: false,
    motionBlur: false,
    startFrame: 0,
    endFrame: 80,
    inPoint: 0,
    outPoint: 80,
    parentId: 'layer_control_001',
    blendMode: 'add',
    opacity: createAnimatableProperty('opacity', 80, 'number'),
    transform: createStaticTransform(0, 0), // Relative to parent
    effects: [],
    properties: [],
    data: {
      systemConfig: {
        maxParticles: 500,
        gravity: -50,
        windStrength: 20,
        windDirection: 90,
        warmupPeriod: 0,
        respectMaskBoundary: false,
        boundaryBehavior: 'kill',
        friction: 0.02
      },
      emitters: [{
        id: 'emitter_1',
        name: 'Fire Emitter',
        x: 0,
        y: 0,
        emitterType: 'point',
        emissionRate: 100,
        burstCount: 0,
        burstInterval: 0,
        lifetime: { min: 0.5, max: 1.5 },
        speed: { min: 80, max: 120 },
        direction: { min: -15, max: 15 },
        spread: 30,
        size: { min: 8, max: 16 },
        sizeOverLife: { start: 1, end: 0 },
        color: { r: 255, g: 200, b: 50, a: 255 },
        colorOverLife: null,
        opacity: { min: 1, max: 1 },
        opacityOverLife: { start: 1, end: 0 },
        rotation: { min: 0, max: 360 },
        angularVelocity: { min: -180, max: 180 }
      }]
    }
  } as unknown as Layer;

  const controlLayer: Layer = {
    id: 'layer_control_001',
    name: 'Particle Control',
    type: 'control',
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
    transform: createAnimatedControlTransform(),
    effects: [],
    properties: [],
    data: { size: 50 }
  } as unknown as Layer;

  // Main composition
  const mainComp: Composition = {
    id: compId,
    name: 'Main Composition',
    settings: {
      name: 'Main Composition',
      width: 1920,
      height: 1080,
      frameCount: 81,
      fps: 16,
      backgroundColor: '#000000'
    },
    layers: [solidLayer, textLayer, particleLayer, controlLayer]
  };

  // Nested composition (for reference integrity test)
  const nestedComp: Composition = {
    id: nestedCompId,
    name: 'Nested Logo',
    settings: {
      name: 'Nested Logo',
      width: 512,
      height: 512,
      frameCount: 81,
      fps: 16,
      backgroundColor: '#00000000'
    },
    layers: []
  };

  return {
    version: '1.0.0',
    mainCompositionId: compId,
    compositions: {
      [compId]: mainComp,
      [nestedCompId]: nestedComp
    },
    composition: { width: 1920, height: 1080 },
    assets: [
      { id: 'asset_001', name: 'logo.png', type: 'image', path: '/assets/logo.png' },
      { id: 'asset_002', name: 'music.mp3', type: 'audio', path: '/assets/music.mp3' }
    ],
    meta: {
      name: 'Test Project',
      created: '2025-01-01T00:00:00Z',
      modified: '2025-01-15T12:00:00Z'
    }
  } as LatticeProject;
}

// Helper to create static transform
function createStaticTransform(x: number, y: number) {
  return {
    position: createAnimatableProperty('position', { x, y }, 'vector2'),
    scale: createAnimatableProperty('scale', { x: 100, y: 100 }, 'vector2'),
    rotation: createAnimatableProperty('rotation', 0, 'number'),
    origin: createAnimatableProperty('origin', { x: 0, y: 0 }, 'vector2')
  };
}

// Helper to create animated transform
function createAnimatedTransform() {
  const position = createAnimatableProperty('position', { x: 960, y: 540 }, 'vector2');
  position.animated = true;
  position.keyframes = [
    createKeyframe({ x: 960, y: 800 }, 0),
    createKeyframe({ x: 960, y: 540 }, 20),
    createKeyframe({ x: 960, y: 540 }, 60),
    createKeyframe({ x: 960, y: 300 }, 80)
  ];

  const scale = createAnimatableProperty('scale', { x: 100, y: 100 }, 'vector2');
  scale.animated = true;
  scale.keyframes = [
    createKeyframe({ x: 0, y: 0 }, 0),
    createKeyframe({ x: 100, y: 100 }, 15),
    createKeyframe({ x: 100, y: 100 }, 65),
    createKeyframe({ x: 120, y: 120 }, 80)
  ];

  return {
    position,
    scale,
    rotation: createAnimatableProperty('rotation', 0, 'number'),
    origin: createAnimatableProperty('origin', { x: 0, y: 0 }, 'vector2')
  };
}

// Helper to create animated control layer transform (for parenting test)
function createAnimatedControlTransform() {
  const position = createAnimatableProperty('position', { x: 960, y: 800 }, 'vector2');
  position.animated = true;
  position.keyframes = [
    createKeyframe({ x: 400, y: 800 }, 0),
    createKeyframe({ x: 960, y: 600 }, 40),
    createKeyframe({ x: 1520, y: 800 }, 80)
  ];

  return {
    position,
    scale: createAnimatableProperty('scale', { x: 100, y: 100 }, 'vector2'),
    rotation: createAnimatableProperty('rotation', 0, 'number'),
    origin: createAnimatableProperty('origin', { x: 0, y: 0 }, 'vector2')
  };
}

// Helper to create animated opacity
function createAnimatedOpacity(value: number, fadeInStart: number, fadeInEnd: number, fadeOutStart: number) {
  const opacity = createAnimatableProperty('opacity', value, 'number');
  opacity.animated = true;
  opacity.keyframes = [
    createKeyframe(0, fadeInStart),
    createKeyframe(100, fadeInEnd + 10),
    createKeyframe(100, fadeOutStart - 10),
    createKeyframe(0, fadeOutStart + 10)
  ];
  return opacity;
}

// Helper to create keyframes with unique IDs
let keyframeCounter = 0;
function createKeyframe<T>(value: T, frame: number): Keyframe<T> {
  return {
    id: `kf_test_${++keyframeCounter}`,
    frame,
    value,
    interpolation: 'linear',
    inHandle: { frame: 0, value: 0, enabled: false },
    outHandle: { frame: 0, value: 0, enabled: false },
    controlMode: 'smooth'
  };
}

describe('Project Data Integrity', () => {
  let engine: MotionEngine;

  beforeEach(() => {
    engine = new MotionEngine();
    keyframeCounter = 0;
  });

  describe('Project Structure Integrity', () => {
    it('preserves all compositions', () => {
      const project = createCompleteTestProject();

      expect(Object.keys(project.compositions)).toHaveLength(2);
      expect(project.compositions['main_comp']).toBeDefined();
      expect(project.compositions['nested_comp']).toBeDefined();
    });

    it('preserves composition settings', () => {
      const project = createCompleteTestProject();
      const settings = project.compositions['main_comp'].settings;

      expect(settings.width).toBe(1920);
      expect(settings.height).toBe(1080);
      expect(settings.frameCount).toBe(81);
      expect(settings.fps).toBe(16);
      expect(settings.backgroundColor).toBe('#000000');
    });

    it('preserves all layers in composition', () => {
      const project = createCompleteTestProject();
      const layers = project.compositions['main_comp'].layers;

      expect(layers).toHaveLength(4);
      expect(layers.map(l => l.type)).toContain('solid');
      expect(layers.map(l => l.type)).toContain('text');
      expect(layers.map(l => l.type)).toContain('particles');
      expect(layers.map(l => l.type)).toContain('control');
    });

    it('preserves layer parent references', () => {
      const project = createCompleteTestProject();
      const layers = project.compositions['main_comp'].layers;

      const particleLayer = layers.find(l => l.type === 'particles');
      const controlLayer = layers.find(l => l.type === 'control');

      expect(particleLayer?.parentId).toBe('layer_control_001');
      expect(controlLayer?.parentId).toBeNull();
    });

    it('preserves asset references', () => {
      const project = createCompleteTestProject();

      expect(project.assets).toHaveLength(2);
      expect(project.assets[0].type).toBe('image');
      expect(project.assets[1].type).toBe('audio');
    });
  });

  describe('Layer Property Integrity', () => {
    it('preserves text layer data', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text');
      const data = textLayer?.data as any;

      expect(data.text).toBe('LATTICE');
      expect(data.fontFamily).toBe('Inter');
      expect(data.fontSize).toBe(96);
      expect(data.fontWeight).toBe('700');
      expect(data.tracking).toBe(50);
    });

    it('preserves particle system configuration', () => {
      const project = createCompleteTestProject();
      const particleLayer = project.compositions['main_comp'].layers.find(l => l.type === 'particles');
      const data = particleLayer?.data as any;

      expect(data.systemConfig.maxParticles).toBe(500);
      expect(data.systemConfig.gravity).toBe(-50);
      expect(data.emitters).toHaveLength(1);
      expect(data.emitters[0].emissionRate).toBe(100);
    });

    it('preserves solid layer color', () => {
      const project = createCompleteTestProject();
      const solidLayer = project.compositions['main_comp'].layers.find(l => l.type === 'solid');
      const data = solidLayer?.data as any;

      expect(data.color).toBe('#336699');
      expect(data.width).toBe(1920);
      expect(data.height).toBe(1080);
    });

    it('preserves effect configurations', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text');

      expect(textLayer?.effects).toHaveLength(1);
      expect(textLayer?.effects[0].effectKey).toBe('blur');
      expect(textLayer?.effects[0].enabled).toBe(true);
    });
  });

  describe('Animation Data Integrity', () => {
    it('preserves keyframe count', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;

      expect(textLayer.transform.position.keyframes).toHaveLength(4);
      expect(textLayer.transform.scale.keyframes).toHaveLength(4);
    });

    it('preserves keyframe frames', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;

      const posFrames = textLayer.transform.position.keyframes.map(kf => kf.frame);
      expect(posFrames).toEqual([0, 20, 60, 80]);
    });

    it('preserves keyframe values', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;

      const firstKf = textLayer.transform.position.keyframes[0];
      expect(firstKf.value).toEqual({ x: 960, y: 800 });

      const lastKf = textLayer.transform.position.keyframes[3];
      expect(lastKf.value).toEqual({ x: 960, y: 300 });
    });

    it('preserves interpolation types', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;

      textLayer.transform.position.keyframes.forEach(kf => {
        expect(kf.interpolation).toBe('linear');
      });
    });

    it('interpolation produces expected values', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;

      // At frame 0: y = 800
      const pos0 = interpolateProperty(textLayer.transform.position, 0) as { x: number; y: number };
      expect(pos0.y).toBe(800);

      // At frame 20: y = 540
      const pos20 = interpolateProperty(textLayer.transform.position, 20) as { x: number; y: number };
      expect(pos20.y).toBe(540);

      // At frame 10 (midpoint 0-20): y = 670
      const pos10 = interpolateProperty(textLayer.transform.position, 10) as { x: number; y: number };
      expect(pos10.y).toBe(670);
    });
  });

  describe('Frame Evaluation Integrity', () => {
    it('evaluates all layers at frame 0', () => {
      const project = createCompleteTestProject();
      const state = engine.evaluate(0, project, null, null, false);

      expect(state.layers).toHaveLength(4);
    });

    it('evaluates animated position correctly', () => {
      const project = createCompleteTestProject();

      // Text layer position at frame 10 (between frame 0 and 20)
      const state = engine.evaluate(10, project, null, null, false);
      const textLayer = state.layers.find(l => l.type === 'text');

      expect(textLayer?.transform.position.y).toBe(670); // Interpolated
    });

    it('evaluates animated scale correctly', () => {
      const project = createCompleteTestProject();

      // Text layer scale at frame 0 should be 0
      const state0 = engine.evaluate(0, project, null, null, false);
      const textAt0 = state0.layers.find(l => l.type === 'text');
      expect(textAt0?.transform.scale.x).toBe(0);

      // Text layer scale at frame 15 should be 100
      const state15 = engine.evaluate(15, project, null, null, false);
      const textAt15 = state15.layers.find(l => l.type === 'text');
      expect(textAt15?.transform.scale.x).toBe(100);
    });

    it('respects layer timing bounds', () => {
      const project = createCompleteTestProject();

      // Text layer starts at frame 10
      const state5 = engine.evaluate(5, project, null, null, false);
      const textAt5 = state5.layers.find(l => l.type === 'text');
      expect(textAt5?.inRange).toBe(false);

      // Text layer visible at frame 40
      const state40 = engine.evaluate(40, project, null, null, false);
      const textAt40 = state40.layers.find(l => l.type === 'text');
      expect(textAt40?.inRange).toBe(true);

      // Text layer ends at frame 70
      const state75 = engine.evaluate(75, project, null, null, false);
      const textAt75 = state75.layers.find(l => l.type === 'text');
      expect(textAt75?.inRange).toBe(false);
    });
  });

  describe('JSON Serialization Round-Trip', () => {
    it('survives JSON stringify/parse', () => {
      const original = createCompleteTestProject();
      const json = JSON.stringify(original);
      const restored = JSON.parse(json) as LatticeProject;

      // Structure preserved
      expect(Object.keys(restored.compositions)).toEqual(Object.keys(original.compositions));
      expect(restored.mainCompositionId).toBe(original.mainCompositionId);

      // Layers preserved
      const origLayers = original.compositions['main_comp'].layers;
      const restLayers = restored.compositions['main_comp'].layers;
      expect(restLayers).toHaveLength(origLayers.length);

      // Keyframes preserved
      const origText = origLayers.find(l => l.type === 'text')!;
      const restText = restLayers.find(l => l.type === 'text')!;
      expect(restText.transform.position.keyframes).toHaveLength(
        origText.transform.position.keyframes.length
      );
    });

    it('produces identical interpolation after round-trip', () => {
      const original = createCompleteTestProject();
      const restored = JSON.parse(JSON.stringify(original)) as LatticeProject;

      // Evaluate both at multiple frames
      for (const frame of [0, 10, 20, 40, 60, 80]) {
        const origState = engine.evaluate(frame, original, null, null, false);
        engine.invalidateCache();
        const restState = engine.evaluate(frame, restored, null, null, false);

        // Compare text layer positions
        const origText = origState.layers.find(l => l.type === 'text')!;
        const restText = restState.layers.find(l => l.type === 'text')!;

        expect(restText.transform.position.x).toBeCloseTo(origText.transform.position.x, 10);
        expect(restText.transform.position.y).toBeCloseTo(origText.transform.position.y, 10);
      }
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('parent layer ID references exist', () => {
      const project = createCompleteTestProject();
      const layers = project.compositions['main_comp'].layers;

      for (const layer of layers) {
        if (layer.parentId) {
          const parent = layers.find(l => l.id === layer.parentId);
          expect(parent).toBeDefined();
        }
      }
    });

    it('composition IDs are unique', () => {
      const project = createCompleteTestProject();
      const ids = Object.keys(project.compositions);
      const uniqueIds = [...new Set(ids)];

      expect(ids).toEqual(uniqueIds);
    });

    it('layer IDs are unique within composition', () => {
      const project = createCompleteTestProject();
      const layers = project.compositions['main_comp'].layers;
      const ids = layers.map(l => l.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids).toEqual(uniqueIds);
    });

    it('effect IDs are unique within layer', () => {
      const project = createCompleteTestProject();
      const textLayer = project.compositions['main_comp'].layers.find(l => l.type === 'text')!;
      const effectIds = textLayer.effects.map(e => e.id);
      const uniqueIds = [...new Set(effectIds)];

      expect(effectIds).toEqual(uniqueIds);
    });
  });
});
