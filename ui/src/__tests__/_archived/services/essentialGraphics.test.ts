/**
 * Essential Graphics Service Tests
 *
 * Tests for Tutorial 13: Essential Graphics Panel & MOGRTs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeTemplate,
  clearTemplate,
  updateTemplateMetadata,
  getExposableProperties,
  addExposedProperty,
  removeExposedProperty,
  updateExposedProperty,
  reorderExposedProperties,
  addPropertyGroup,
  removePropertyGroup,
  movePropertyToGroup,
  addComment,
  removeComment,
  updateComment,
  getPropertyValue,
  setPropertyValue,
  validateTemplate,
  prepareMOGRTExport,
  EXPOSABLE_PROPERTIES,
} from '@/services/essentialGraphics';
import type { Composition, Layer } from '@/types/project';
import type { TemplateConfig } from '@/types/essentialGraphics';

// Test helpers
function createMockComposition(): Composition {
  return {
    id: 'comp-1',
    name: 'Test Composition',
    settings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      frameCount: 150,
      backgroundColor: '#000000',
      autoResizeToContent: false,
    },
    layers: [],
    currentFrame: 0,
    isNestedComp: false,
  };
}

function createMockTextLayer(): Layer {
  return {
    id: 'layer-1',
    type: 'text',
    name: 'Title',
    enabled: true,
    locked: false,
    solo: false,
    startFrame: 0,
    endFrame: 150,
    inPoint: 0,
    outPoint: 150,
    transform: {
      position: { value: { x: 960, y: 540, z: 0 }, keyframes: [] },
      rotation: { value: { x: 0, y: 0, z: 0 }, keyframes: [] },
      scale: { value: { x: 100, y: 100, z: 100 }, keyframes: [] },
      origin: { value: { x: 0, y: 0, z: 0 }, keyframes: [] },
      opacity: { value: 100, keyframes: [] },
    },
    blendMode: 'normal',
    effects: [],
    masks: [],
    parentId: null,
    data: {
      text: 'Hello World',
      fontFamily: 'Arial',
      fontSize: 72,
      fontWeight: 'normal',
      color: { r: 1, g: 1, b: 1, a: 1 },
      textAlign: 'center',
      lineHeight: 1.2,
    },
    is3D: false,
  } as unknown as Layer;
}

function createMockSolidLayer(): Layer {
  return {
    id: 'layer-2',
    type: 'solid',
    name: 'Background',
    enabled: true,
    locked: false,
    solo: false,
    startFrame: 0,
    endFrame: 150,
    inPoint: 0,
    outPoint: 150,
    transform: {
      position: { value: { x: 960, y: 540, z: 0 }, keyframes: [] },
      rotation: { value: { x: 0, y: 0, z: 0 }, keyframes: [] },
      scale: { value: { x: 100, y: 100, z: 100 }, keyframes: [] },
      origin: { value: { x: 0, y: 0, z: 0 }, keyframes: [] },
      opacity: { value: 100, keyframes: [] },
    },
    blendMode: 'normal',
    effects: [],
    masks: [],
    parentId: null,
    data: {
      color: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
    },
    is3D: false,
  } as unknown as Layer;
}

describe('Essential Graphics Service', () => {
  let composition: Composition;

  beforeEach(() => {
    composition = createMockComposition();
    composition.layers = [createMockTextLayer(), createMockSolidLayer()];
  });

  describe('Template Initialization', () => {
    it('should initialize a template config', () => {
      const config = initializeTemplate(composition);

      expect(config).toBeDefined();
      expect(config.name).toBe('Test Composition');
      expect(config.masterCompositionId).toBe('comp-1');
      expect(config.exposedProperties).toHaveLength(0);
      expect(config.groups).toHaveLength(0);
      expect(config.comments).toHaveLength(0);
      expect(config.created).toBeDefined();
      expect(config.modified).toBeDefined();
    });

    it('should clear template config', () => {
      composition.templateConfig = initializeTemplate(composition);
      expect(composition.templateConfig).toBeDefined();

      clearTemplate(composition);
      expect(composition.templateConfig).toBeUndefined();
    });

    it('should update template metadata', () => {
      const config = initializeTemplate(composition);

      updateTemplateMetadata(config, {
        name: 'Updated Title',
        posterFrame: 30,
      });

      expect(config.name).toBe('Updated Title');
      expect(config.posterFrame).toBe(30);
      // modified timestamp is updated (may be same or different depending on timing)
      expect(config.modified).toBeDefined();
    });
  });

  describe('Exposable Properties', () => {
    it('should get exposable properties for text layer', () => {
      const textLayer = composition.layers[0];
      const properties = getExposableProperties(textLayer);

      expect(properties.length).toBeGreaterThan(0);

      // Should include text-specific properties
      const textProp = properties.find(p => p.path === 'data.text');
      expect(textProp).toBeDefined();
      expect(textProp?.name).toBe('Source Text');
      expect(textProp?.type).toBe('sourceText');

      // Should include common transform properties
      const positionProp = properties.find(p => p.path === 'transform.position');
      expect(positionProp).toBeDefined();
    });

    it('should have predefined exposable properties', () => {
      expect(EXPOSABLE_PROPERTIES).toBeDefined();
      expect(EXPOSABLE_PROPERTIES['text']).toBeDefined();
      expect(EXPOSABLE_PROPERTIES['solid']).toBeDefined();
    });
  });

  describe('Property Exposure', () => {
    let config: TemplateConfig;

    beforeEach(() => {
      config = initializeTemplate(composition);
      composition.templateConfig = config;
    });

    it('should add exposed property', () => {
      const exposed = addExposedProperty(
        config,
        'layer-1',
        'data.text',
        'Title Text',
        'sourceText'
      );

      expect(exposed).toBeDefined();
      expect(exposed.name).toBe('Title Text');
      expect(exposed.sourceLayerId).toBe('layer-1');
      expect(exposed.sourcePropertyPath).toBe('data.text');
      expect(exposed.type).toBe('sourceText');
      expect(config.exposedProperties).toHaveLength(1);
    });

    it('should remove exposed property', () => {
      const exposed = addExposedProperty(
        config,
        'layer-1',
        'data.text',
        'Title Text',
        'sourceText'
      );

      expect(config.exposedProperties).toHaveLength(1);

      const result = removeExposedProperty(config, exposed.id);

      expect(result).toBe(true);
      expect(config.exposedProperties).toHaveLength(0);
    });

    it('should update exposed property', () => {
      const exposed = addExposedProperty(
        config,
        'layer-1',
        'data.text',
        'Title Text',
        'sourceText'
      );

      const result = updateExposedProperty(config, exposed.id, {
        name: 'Updated Name',
      });

      expect(result).toBe(true);
      expect(config.exposedProperties[0].name).toBe('Updated Name');
    });

    it('should reorder exposed properties', () => {
      const prop1 = addExposedProperty(config, 'layer-1', 'data.text', 'Prop 1', 'sourceText');
      const prop2 = addExposedProperty(config, 'layer-1', 'data.fontSize', 'Prop 2', 'number');
      const prop3 = addExposedProperty(config, 'layer-2', 'data.color', 'Prop 3', 'color');

      // Reorder: prop3, prop1, prop2
      reorderExposedProperties(config, [prop3.id, prop1.id, prop2.id]);

      expect(config.exposedProperties[0].id).toBe(prop3.id);
      expect(config.exposedProperties[1].id).toBe(prop1.id);
      expect(config.exposedProperties[2].id).toBe(prop2.id);
    });
  });

  describe('Property Groups', () => {
    let config: TemplateConfig;

    beforeEach(() => {
      config = initializeTemplate(composition);
      composition.templateConfig = config;
    });

    it('should create property group', () => {
      const group = addPropertyGroup(config, 'Text Options');

      expect(group).toBeDefined();
      expect(group.name).toBe('Text Options');
      expect(config.groups).toHaveLength(1);
    });

    it('should remove property group', () => {
      const group = addPropertyGroup(config, 'Text Options');
      expect(config.groups).toHaveLength(1);

      const result = removePropertyGroup(config, group.id);

      expect(result).toBe(true);
      expect(config.groups).toHaveLength(0);
    });

    it('should move property to group', () => {
      const group = addPropertyGroup(config, 'Text Options');
      const exposed = addExposedProperty(
        config,
        'layer-1',
        'data.text',
        'Title Text',
        'sourceText'
      );

      expect(exposed.groupId).toBeUndefined();

      const result = movePropertyToGroup(config, exposed.id, group.id);

      expect(result).toBe(true);
      expect(config.exposedProperties[0].groupId).toBe(group.id);
    });

    it('should ungroup property when moving to null', () => {
      const group = addPropertyGroup(config, 'Text Options');
      const exposed = addExposedProperty(
        config,
        'layer-1',
        'data.text',
        'Title Text',
        'sourceText'
      );

      movePropertyToGroup(config, exposed.id, group.id);
      expect(config.exposedProperties[0].groupId).toBe(group.id);

      const result = movePropertyToGroup(config, exposed.id, undefined);

      expect(result).toBe(true);
      // After ungrouping, groupId is set to undefined (no group)
      expect(config.exposedProperties[0].groupId).toBeUndefined();
    });
  });

  describe('Comments', () => {
    let config: TemplateConfig;

    beforeEach(() => {
      config = initializeTemplate(composition);
      composition.templateConfig = config;
    });

    it('should add comment', () => {
      const comment = addComment(config, 'This is a helpful note');

      expect(comment).toBeDefined();
      expect(comment.text).toBe('This is a helpful note');
      expect(config.comments).toHaveLength(1);
    });

    it('should update comment', () => {
      const comment = addComment(config, 'Original text');

      const result = updateComment(config, comment.id, 'Updated text');

      expect(result).toBe(true);
      expect(config.comments[0].text).toBe('Updated text');
    });

    it('should remove comment', () => {
      const comment = addComment(config, 'To be removed');
      expect(config.comments).toHaveLength(1);

      const result = removeComment(config, comment.id);

      expect(result).toBe(true);
      expect(config.comments).toHaveLength(0);
    });
  });

  describe('Property Value Access', () => {
    it('should get property value at path', () => {
      const textLayer = composition.layers[0];

      const text = getPropertyValue(textLayer, 'data.text');
      expect(text).toBe('Hello World');

      const fontSize = getPropertyValue(textLayer, 'data.fontSize');
      expect(fontSize).toBe(72);
    });

    it('should get nested transform value', () => {
      const textLayer = composition.layers[0];

      const opacity = getPropertyValue(textLayer, 'transform.opacity');
      expect(opacity).toBe(100);
    });

    it('should set property value at path', () => {
      const textLayer = composition.layers[0];

      const result = setPropertyValue(textLayer, 'data.text', 'New Text');

      expect(result).toBe(true);
      expect((textLayer.data as any).text).toBe('New Text');
    });

    it('should return undefined for invalid path', () => {
      const textLayer = composition.layers[0];

      const value = getPropertyValue(textLayer, 'invalid.path.here');
      expect(value).toBeUndefined();
    });
  });

  describe('Template Validation', () => {
    it('should validate valid template', () => {
      const config = initializeTemplate(composition);
      addExposedProperty(config, 'layer-1', 'data.text', 'Title', 'sourceText');

      const result = validateTemplate(config, composition);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty name', () => {
      const config = initializeTemplate(composition);
      config.name = '';
      addExposedProperty(config, 'layer-1', 'data.text', 'Title', 'sourceText');

      const result = validateTemplate(config, composition);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should warn for empty template', () => {
      const config = initializeTemplate(composition);

      const result = validateTemplate(config, composition);

      expect(result.warnings.some(w => w.includes('No properties exposed'))).toBe(true);
    });

    it('should error for missing layer reference', () => {
      const config = initializeTemplate(composition);
      addExposedProperty(config, 'non-existent-layer', 'data.text', 'Missing', 'sourceText');

      const result = validateTemplate(config, composition);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing layer'))).toBe(true);
    });

    it('should error for invalid property path', () => {
      const config = initializeTemplate(composition);
      addExposedProperty(config, 'layer-1', 'invalid.path', 'Invalid', 'sourceText');

      const result = validateTemplate(config, composition);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('path not found'))).toBe(true);
    });
  });

  describe('MOGRT Export', () => {
    it('should prepare MOGRT package', () => {
      const config = initializeTemplate(composition);
      composition.templateConfig = config;
      addExposedProperty(config, 'layer-1', 'data.text', 'Title', 'sourceText');

      const mogrt = prepareMOGRTExport(composition, {}, 'data:image/png;base64,test');

      expect(mogrt).toBeDefined();
      expect(mogrt?.formatVersion).toBe('1.0.0');
      expect(mogrt?.templateConfig).toBeDefined();
      expect(mogrt?.composition).toBeDefined();
      expect(mogrt?.posterImage).toBe('data:image/png;base64,test');
    });

    it('should return null without template config', () => {
      const mogrt = prepareMOGRTExport(composition, {}, 'data:image/png;base64,test');

      expect(mogrt).toBeNull();
    });

    it('should skip invalid properties during export', () => {
      const config = initializeTemplate(composition);
      composition.templateConfig = config;

      // Add a valid property
      addExposedProperty(config, 'layer-1', 'data.text', 'Valid', 'sourceText');

      // Add an invalid property (missing layer)
      addExposedProperty(config, 'missing-layer', 'data.text', 'Invalid', 'sourceText');

      const mogrt = prepareMOGRTExport(composition, {}, 'data:image/png;base64,test');

      expect(mogrt).toBeDefined();
      // Only the valid property should be included
      expect(mogrt?.templateConfig.exposedProperties).toHaveLength(1);
      expect(mogrt?.templateConfig.exposedProperties[0].name).toBe('Valid');
    });

    it('should collect fonts from text layers', () => {
      const config = initializeTemplate(composition);
      composition.templateConfig = config;
      config.exportSettings.includeFonts = true;

      const mogrt = prepareMOGRTExport(composition, {}, 'data:image/png;base64,test');

      expect(mogrt?.fonts).toBeDefined();
      expect(mogrt?.fonts.some(f => f.family === 'Arial')).toBe(true);
    });
  });
});
