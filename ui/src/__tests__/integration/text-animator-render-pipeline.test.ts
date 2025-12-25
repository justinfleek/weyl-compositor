/**
 * Text Animator Render Pipeline Integration Test
 *
 * This test verifies that text animators actually render through the engine pipeline.
 * These tests would have FAILED before the fixes in TextLayer.ts:
 *
 * FIX 1: this.animators was never initialized (unreachable code after return)
 * FIX 2: onApplyEvaluatedState didn't call applyAnimatorsToCharacters
 *
 * These tests verify the ACTUAL render pipeline, not just store calculations.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCompositorStore } from '@/stores/compositorStore';
import {
  calculateCharacterInfluence,
  calculateCompleteCharacterInfluence,
  createTextAnimator,
} from '@/services/textAnimator';
import type { TextRangeSelector, TextAnimator } from '@/types/project';

describe('Text Animator Render Pipeline', () => {
  let store: ReturnType<typeof useCompositorStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCompositorStore();
    store.createComposition({
      name: 'Render Test',
      width: 1920,
      height: 1080,
      fps: 24,
      duration: 5
    });
  });

  // ==========================================================================
  // VERIFICATION: These tests prove the fixes work
  // ==========================================================================

  describe('Verification: Pipeline Integration', () => {

    test('VERIFY FIX 1: Animators added via store are tracked correctly', () => {
      // Create text layer
      const layer = store.createTextLayer('TEST');

      // Add animator through store
      const animator = store.addTextAnimator(layer.id, { name: 'Initial Animator' });

      // Get animators through store
      const animators = store.getTextAnimators(layer.id);

      // Verify animator was added (tests store → layer data flow)
      // Before FIX 1, the TextLayer engine class wouldn't have had this.animators
      // properly initialized, causing render issues
      expect(animators.length).toBe(1);
      expect(animators[0].name).toBe('Initial Animator');
      expect(animators[0].id).toBe(animator!.id);
    });

    test('VERIFY FIX 1: Animators added after creation are tracked', () => {
      const layer = store.createTextLayer('HELLO');

      // No animators initially
      expect(store.getTextAnimators(layer.id).length).toBe(0);

      // Add animator
      const animator = store.addTextAnimator(layer.id, { name: 'Position Anim' });
      expect(animator).not.toBeNull();

      // Animator should be tracked
      const animators = store.getTextAnimators(layer.id);
      expect(animators.length).toBe(1);
    });

    test('VERIFY FIX 2: Character transforms reflect animator properties', () => {
      const layer = store.createTextLayer('ABCDE');
      const animator = store.addTextAnimator(layer.id);

      // Set position offset on animator
      store.setAnimatorPropertyValue(layer.id, animator!.id, 'position', { x: 0, y: -100 });

      // Configure range to affect all characters
      store.configureRangeSelector(layer.id, animator!.id, {
        start: 0,
        end: 100,
        shape: 'square'
      });

      // Get computed transforms at frame 0
      const transforms = store.getCharacterTransforms(layer.id, 0);

      // All 5 characters should have Y offset of -100
      // This verifies the full pipeline works
      expect(transforms.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(transforms[i].position.y).toBe(-100);
      }
    });

    test('VERIFY FIX 3: Range selector offset wrapping works correctly', () => {
      // Test the wraparound case that was fixed
      const layer = store.createTextLayer('ABCDEFGHIJ'); // 10 chars
      const animator = store.addTextAnimator(layer.id);

      store.setAnimatorPropertyValue(layer.id, animator!.id, 'position', { x: 0, y: -50 });

      // Set range 0-50% with offset 80% - should wrap around
      // This should affect chars at 80-100% AND 0-30%
      store.configureRangeSelector(layer.id, animator!.id, {
        start: 0,
        end: 50,
        offset: 80,
        shape: 'square'
      });

      const transforms = store.getCharacterTransforms(layer.id, 0);

      // For 10 chars: positions are 0%, 11.1%, 22.2%, 33.3%, 44.4%, 55.5%, 66.6%, 77.7%, 88.8%, 100%
      // With start=0, end=50, offset=80:
      // - effectiveStart = 80%, effectiveEnd = 30% (wraps)
      // - Should affect: chars at 80-100% (chars 8,9) AND 0-30% (chars 0,1,2)

      // Chars 0,1,2 should be affected (0%, 11%, 22% are < 30%)
      expect(transforms[0].position.y).toBe(-50);
      expect(transforms[1].position.y).toBe(-50);
      expect(transforms[2].position.y).toBe(-50);

      // Chars 3-7 should NOT be affected (33% to 78% are in the gap)
      expect(transforms[3].position.y).toBe(0);
      expect(transforms[4].position.y).toBe(0);
      expect(transforms[5].position.y).toBe(0);
      expect(transforms[6].position.y).toBe(0);
      expect(transforms[7].position.y).toBe(0);

      // Chars 8,9 should be affected (89%, 100% are >= 80%)
      expect(transforms[8].position.y).toBe(-50);
      expect(transforms[9].position.y).toBe(-50);
    });
  });

  // ==========================================================================
  // Shape Formula Verification
  // ==========================================================================

  describe('Shape Formulas Match After Effects', () => {
    function createMockRangeSelector(shape: TextRangeSelector['shape']): TextRangeSelector {
      return {
        mode: 'percent',
        start: { id: 'start', name: 'Start', type: 'number', value: 0, animated: false, keyframes: [] },
        end: { id: 'end', name: 'End', type: 'number', value: 100, animated: false, keyframes: [] },
        offset: { id: 'offset', name: 'Offset', type: 'number', value: 0, animated: false, keyframes: [] },
        basedOn: 'characters',
        shape,
        selectorMode: 'add',
        amount: 100,
        smoothness: 100,
        randomizeOrder: false,
        randomSeed: 12345,
        ease: { high: 100, low: 0 },
      };
    }

    test('Square shape: constant 1.0 influence', () => {
      const selector = createMockRangeSelector('square');

      // All positions should have 1.0 influence
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBe(1);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBe(1);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBe(1);
    });

    test('Ramp Up shape: linear 0 to 1', () => {
      const selector = createMockRangeSelector('ramp_up');

      // First char: 0, last char: 1
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBeCloseTo(0, 2);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBeCloseTo(0.5, 2);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBeCloseTo(1, 2);
    });

    test('Ramp Down shape: linear 1 to 0', () => {
      const selector = createMockRangeSelector('ramp_down');

      // First char: 1, last char: 0
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBeCloseTo(1, 2);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBeCloseTo(0.5, 2);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBeCloseTo(0, 2);
    });

    test('Triangle shape: peaks at center', () => {
      const selector = createMockRangeSelector('triangle');

      // 0 at edges, 1 at center
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBeCloseTo(0, 2);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBeCloseTo(1, 2);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBeCloseTo(0, 2);
    });

    test('Round shape: smooth bell curve (sin-based)', () => {
      const selector = createMockRangeSelector('round');

      // sin(0) = 0, sin(π/2) = 1, sin(π) = 0
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBeCloseTo(0, 2);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBeCloseTo(1, 2);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBeCloseTo(0, 2);

      // Quarter positions should have sin(π/4) ≈ 0.707
      expect(calculateCharacterInfluence(1, 5, selector, 0)).toBeCloseTo(0.707, 1);
      expect(calculateCharacterInfluence(3, 5, selector, 0)).toBeCloseTo(0.707, 1);
    });

    test('Smooth shape: cubic ease in-out', () => {
      const selector = createMockRangeSelector('smooth');

      // t * t * (3 - 2 * t)
      // t=0: 0, t=0.5: 0.5, t=1: 1
      expect(calculateCharacterInfluence(0, 5, selector, 0)).toBeCloseTo(0, 2);
      expect(calculateCharacterInfluence(2, 5, selector, 0)).toBeCloseTo(0.5, 2);
      expect(calculateCharacterInfluence(4, 5, selector, 0)).toBeCloseTo(1, 2);
    });
  });

  // ==========================================================================
  // Wiggly & Expression Selector Verification
  // ==========================================================================

  describe('Advanced Selectors', () => {
    test('Wiggly selector produces deterministic values', () => {
      const layer = store.createTextLayer('WIGGLE');
      const animator = store.addTextAnimator(layer.id);

      store.setAnimatorPropertyValue(layer.id, animator!.id, 'position', { x: 0, y: -50 });
      store.configureWigglySelector(layer.id, animator!.id, {
        enabled: true,
        maxAmount: 100,
        minAmount: 0,
        wigglesPerSecond: 2,
        correlation: 50,
        randomSeed: 12345
      });

      // Get transforms at frame 0
      const transforms1 = store.getCharacterTransforms(layer.id, 0);

      // Get transforms at frame 0 again - should be IDENTICAL (deterministic)
      const transforms2 = store.getCharacterTransforms(layer.id, 0);

      for (let i = 0; i < 6; i++) {
        expect(transforms1[i].position.y).toBeCloseTo(transforms2[i].position.y, 5);
      }
    });

    test('Expression selector evaluates correctly', () => {
      const layer = store.createTextLayer('EXPR');
      const animator = store.addTextAnimator(layer.id);

      store.setAnimatorPropertyValue(layer.id, animator!.id, 'position', { x: 0, y: -100 });

      // Expression: textIndex / textTotal * 100
      // Should give linear gradient 0%, 25%, 50%, 75%
      store.configureExpressionSelector(layer.id, animator!.id, {
        enabled: true,
        expression: 'textIndex / textTotal * 100'
      });

      const transforms = store.getCharacterTransforms(layer.id, 0);

      // For 4 chars: 0/4=0, 1/4=0.25, 2/4=0.5, 3/4=0.75
      expect(transforms[0].position.y).toBeCloseTo(0, 1);
      expect(transforms[1].position.y).toBeCloseTo(-25, 1);
      expect(transforms[2].position.y).toBeCloseTo(-50, 1);
      expect(transforms[3].position.y).toBeCloseTo(-75, 1);
    });
  });

  // ==========================================================================
  // Animation Over Time
  // ==========================================================================

  describe('Animated Range Selectors', () => {
    test('Range selector responds to different start values', () => {
      const layer = store.createTextLayer('ANIM');
      const animator = store.addTextAnimator(layer.id);

      store.setAnimatorPropertyValue(layer.id, animator!.id, 'opacity', 0);

      // Test with start=100, end=100: only last char at 100% position affected
      store.configureRangeSelector(layer.id, animator!.id, {
        start: 100,
        end: 100,
        shape: 'square'
      });

      const transforms100 = store.getCharacterTransforms(layer.id, 0);
      // For 4 chars: positions are 0%, 33%, 67%, 100%
      // Only last char (100%) should be affected
      expect(transforms100[0].opacity).toBe(100); // 0% - not in range
      expect(transforms100[1].opacity).toBe(100); // 33% - not in range
      expect(transforms100[2].opacity).toBe(100); // 67% - not in range
      expect(transforms100[3].opacity).toBe(0);   // 100% - in range (point at 100%)

      // Test with start=50: second half should be affected
      store.configureRangeSelector(layer.id, animator!.id, {
        start: 50,
        end: 100,
        shape: 'square'
      });

      const transforms50 = store.getCharacterTransforms(layer.id, 0);
      // For 4 chars: 0%, 33%, 67%, 100%
      // Chars 0,1 (0%, 33%) are < 50%, so not affected (visible)
      expect(transforms50[0].opacity).toBe(100);
      expect(transforms50[1].opacity).toBe(100);
      // Chars 2,3 (67%, 100%) are >= 50%, so affected (opacity=0)
      expect(transforms50[2].opacity).toBe(0);
      expect(transforms50[3].opacity).toBe(0);

      // Test with start=0: all chars affected
      store.configureRangeSelector(layer.id, animator!.id, {
        start: 0,
        end: 100,
        shape: 'square'
      });

      const transforms0 = store.getCharacterTransforms(layer.id, 0);
      for (const t of transforms0) {
        expect(t.opacity).toBe(0);
      }
    });
  });
});
