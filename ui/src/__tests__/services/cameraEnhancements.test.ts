/**
 * Camera Enhancements Tests
 *
 * Tests camera shake, rack focus, and autofocus features.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CameraShake,
  createCameraShake,
  getRackFocusDistance,
  generateRackFocusKeyframes,
  createRackFocus,
  calculateAutoFocusDistance,
  createAutoFocus,
  estimateMotionBlur,
  DEFAULT_SHAKE_CONFIG,
  DEFAULT_RACK_FOCUS,
  SHAKE_PRESETS,
} from '@/services/cameraEnhancements';
import type { Camera3D, CameraKeyframe } from '@/types/camera';
import { createDefaultCamera } from '@/types/camera';

// ============================================================================
// CAMERA SHAKE
// ============================================================================

describe('CameraShake', () => {
  it('should create with default config', () => {
    const shake = new CameraShake();
    expect(shake).toBeDefined();
  });

  it('should create from preset', () => {
    const shake = createCameraShake('handheld');
    expect(shake).toBeDefined();
  });

  it('should produce deterministic output with same seed', () => {
    const shake1 = new CameraShake({ seed: 12345 });
    const shake2 = new CameraShake({ seed: 12345 });

    const offset1 = shake1.getOffset(10);
    const offset2 = shake2.getOffset(10);

    expect(offset1.position.x).toBe(offset2.position.x);
    expect(offset1.position.y).toBe(offset2.position.y);
    expect(offset1.rotation.x).toBe(offset2.rotation.x);
  });

  it('should produce different output with different seeds', () => {
    const shake1 = new CameraShake({ seed: 12345 });
    const shake2 = new CameraShake({ seed: 54321 });

    const offset1 = shake1.getOffset(10);
    const offset2 = shake2.getOffset(10);

    expect(offset1.position.x).not.toBe(offset2.position.x);
  });

  it('should return zero offset outside duration', () => {
    const shake = new CameraShake({}, 10, 20);

    const beforeStart = shake.getOffset(5);
    expect(beforeStart.position.x).toBe(0);
    expect(beforeStart.position.y).toBe(0);

    const afterEnd = shake.getOffset(50);
    expect(afterEnd.position.x).toBe(0);
    expect(afterEnd.position.y).toBe(0);
  });

  it('should return non-zero offset within duration', () => {
    const shake = new CameraShake({ intensity: 0.5 }, 0, 100);

    const offset = shake.getOffset(50);
    // With noise, exact values vary but should be non-zero
    expect(offset.position.x !== 0 || offset.position.y !== 0).toBe(true);
  });

  it('should apply decay over time', () => {
    const shake = new CameraShake({ intensity: 1.0, decay: 1.0 }, 0, 100);

    const earlyOffset = shake.getOffset(10);
    const lateOffset = shake.getOffset(90);

    // Late offset should be smaller due to decay
    const earlyMag = Math.abs(earlyOffset.position.x) + Math.abs(earlyOffset.position.y);
    const lateMag = Math.abs(lateOffset.position.x) + Math.abs(lateOffset.position.y);

    expect(lateMag).toBeLessThan(earlyMag);
  });

  it('should disable rotation when configured', () => {
    const shake = new CameraShake({ rotationEnabled: false });

    const offset = shake.getOffset(10);
    expect(offset.rotation.x).toBe(0);
    expect(offset.rotation.y).toBe(0);
    expect(offset.rotation.z).toBe(0);
  });

  it('should apply shake to camera', () => {
    const camera = createDefaultCamera('test', 1920, 1080);
    const shake = new CameraShake({ intensity: 1.0, seed: 12345 }, 0, 100);

    const shakenCamera = shake.applyToCamera(camera, 10);

    expect(shakenCamera.position.x).not.toBe(camera.position.x);
    expect(shakenCamera.position.y).not.toBe(camera.position.y);
  });

  it('should generate keyframes with shake', () => {
    const baseKeyframes: CameraKeyframe[] = [
      { frame: 0, position: { x: 0, y: 0, z: -1000 }, temporalInterpolation: 'linear' },
      { frame: 30, position: { x: 100, y: 0, z: -1000 }, temporalInterpolation: 'linear' },
    ];

    const shake = new CameraShake({ intensity: 0.5 }, 0, 30);
    const shakenKeyframes = shake.generateKeyframes(baseKeyframes, 5);

    expect(shakenKeyframes.length).toBeGreaterThan(2);
    // First keyframe should be shaken
    expect(shakenKeyframes[0].position?.x).not.toBe(0);
  });

  it('should have correct presets', () => {
    expect(SHAKE_PRESETS.handheld).toBeDefined();
    expect(SHAKE_PRESETS.impact).toBeDefined();
    expect(SHAKE_PRESETS.earthquake).toBeDefined();
    expect(SHAKE_PRESETS.subtle).toBeDefined();

    expect(SHAKE_PRESETS.impact.intensity).toBeGreaterThan(SHAKE_PRESETS.subtle.intensity!);
  });
});

// ============================================================================
// RACK FOCUS
// ============================================================================

describe('Rack Focus', () => {
  it('should create rack focus config', () => {
    const config = createRackFocus(1000, 2000, 30);

    expect(config.startDistance).toBe(1000);
    expect(config.endDistance).toBe(2000);
    expect(config.duration).toBe(30);
  });

  it('should return start distance before animation', () => {
    const config = createRackFocus(1000, 2000, 30, { startFrame: 10 });

    expect(getRackFocusDistance(config, 5)).toBe(1000);
  });

  it('should return end distance after animation', () => {
    const config = createRackFocus(1000, 2000, 30, { startFrame: 0 });

    expect(getRackFocusDistance(config, 50)).toBe(2000);
  });

  it('should interpolate during animation', () => {
    const config = createRackFocus(1000, 2000, 30, {
      startFrame: 0,
      easing: 'linear',
      holdStart: 0,
      holdEnd: 0,
    });

    const midDistance = getRackFocusDistance(config, 15);
    expect(midDistance).toBeCloseTo(1500, 0);
  });

  it('should handle hold at start', () => {
    const config = createRackFocus(1000, 2000, 30, {
      startFrame: 0,
      holdStart: 10,
    });

    expect(getRackFocusDistance(config, 5)).toBe(1000);
    expect(getRackFocusDistance(config, 10)).toBe(1000);
  });

  it('should handle hold at end', () => {
    const config = createRackFocus(1000, 2000, 30, {
      startFrame: 0,
      holdEnd: 10,
    });

    expect(getRackFocusDistance(config, 30)).toBe(2000);
    expect(getRackFocusDistance(config, 35)).toBe(2000);
  });

  it('should apply ease-in easing', () => {
    const config = createRackFocus(0, 1000, 100, {
      startFrame: 0,
      easing: 'ease-in',
    });

    const earlyProgress = getRackFocusDistance(config, 25) / 1000;
    const lateProgress = (getRackFocusDistance(config, 75) - getRackFocusDistance(config, 50)) / 1000;

    // Ease-in should be slower at start
    expect(earlyProgress).toBeLessThan(0.25);
  });

  it('should generate keyframes', () => {
    const config = createRackFocus(1000, 2000, 30, { startFrame: 0 });

    const keyframes = generateRackFocusKeyframes(config, 10);

    expect(keyframes.length).toBeGreaterThan(1);
    expect(keyframes[0].focusDistance).toBe(1000);
    expect(keyframes[keyframes.length - 1].focusDistance).toBe(2000);
  });
});

// ============================================================================
// AUTOFOCUS
// ============================================================================

describe('AutoFocus', () => {
  function createMockDepthMap(width: number, height: number, fill: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fill;     // R (depth)
      data[i + 1] = fill; // G
      data[i + 2] = fill; // B
      data[i + 3] = 255;  // A
    }
    return { data, width, height, colorSpace: 'srgb' } as ImageData;
  }

  it('should create autofocus config', () => {
    const config = createAutoFocus('center');
    expect(config.mode).toBe('center');
  });

  it('should return previous distance when no depth map', () => {
    const config = createAutoFocus('center');
    const distance = calculateAutoFocusDistance(null, config, 1500);

    expect(distance).toBe(1500);
  });

  it('should calculate distance from uniform depth map', () => {
    const depthMap = createMockDepthMap(100, 100, 128);
    const config = createAutoFocus('center', { smoothing: 0 });

    const distance = calculateAutoFocusDistance(depthMap, config, 1500);

    // 128/255 * 4900 + 100 = ~2562
    expect(distance).toBeCloseTo(2562, -1);
  });

  it('should apply smoothing', () => {
    const depthMap = createMockDepthMap(100, 100, 255);
    const config = createAutoFocus('center', { smoothing: 0.9 });

    const distance = calculateAutoFocusDistance(depthMap, config, 1000);

    // With high smoothing, should stay close to previous
    expect(distance).toBeLessThan(1500);
    expect(distance).toBeGreaterThan(1000);
  });

  it('should respect threshold', () => {
    const depthMap = createMockDepthMap(100, 100, 130);
    const config = createAutoFocus('center', { smoothing: 0, threshold: 100 });

    // Small change should not update
    const distance = calculateAutoFocusDistance(depthMap, config, 2550);
    expect(distance).toBe(2550);
  });

  it('should find nearest depth', () => {
    // Create depth map with varied depths
    const depthMap = createMockDepthMap(100, 100, 200);
    // Set some pixels to near (low value)
    depthMap.data[0] = 10;

    const config = createAutoFocus('nearest', { smoothing: 0 });
    const distance = calculateAutoFocusDistance(depthMap, config, 3000);

    // Should find the near pixel
    expect(distance).toBeLessThan(500);
  });

  it('should find farthest depth', () => {
    const depthMap = createMockDepthMap(100, 100, 50);
    // Set some pixels to far (high value)
    depthMap.data[0] = 250;

    const config = createAutoFocus('farthest', { smoothing: 0 });
    const distance = calculateAutoFocusDistance(depthMap, config, 1000);

    // Should find the far pixel
    expect(distance).toBeGreaterThan(4500);
  });

  it('should sample at focus point', () => {
    // Create depth map with gradient
    const depthMap = createMockDepthMap(100, 100, 0);
    // Right side is far
    for (let y = 0; y < 100; y++) {
      for (let x = 50; x < 100; x++) {
        const idx = (y * 100 + x) * 4;
        depthMap.data[idx] = 200;
      }
    }

    const configLeft = createAutoFocus('point', { focusPoint: { x: 0.25, y: 0.5 }, smoothing: 0 });
    const configRight = createAutoFocus('point', { focusPoint: { x: 0.75, y: 0.5 }, smoothing: 0 });

    const leftDistance = calculateAutoFocusDistance(depthMap, configLeft, 0);
    const rightDistance = calculateAutoFocusDistance(depthMap, configRight, 0);

    expect(rightDistance).toBeGreaterThan(leftDistance);
  });
});

// ============================================================================
// MOTION BLUR
// ============================================================================

describe('Motion Blur Estimation', () => {
  it('should return zero blur with no previous camera', () => {
    const camera = createDefaultCamera('test', 1920, 1080);

    const blur = estimateMotionBlur(camera, null);

    expect(blur.velocity).toBe(0);
    expect(blur.blurAmount).toBe(0);
  });

  it('should calculate blur from camera movement', () => {
    const camera1 = createDefaultCamera('test', 1920, 1080);
    const camera2 = { ...camera1, position: { x: camera1.position.x + 50, y: camera1.position.y, z: camera1.position.z } };

    const blur = estimateMotionBlur(camera2, camera1);

    expect(blur.velocity).toBe(50);
    expect(blur.blurAmount).toBeGreaterThan(0);
    expect(blur.blurAmount).toBeLessThanOrEqual(1);
  });

  it('should scale blur with shutter angle', () => {
    const camera1 = createDefaultCamera('test', 1920, 1080);
    const camera2 = { ...camera1, position: { x: camera1.position.x + 100, y: camera1.position.y, z: camera1.position.z } };

    const blur180 = estimateMotionBlur(camera2, camera1, 180);
    const blur360 = estimateMotionBlur(camera2, camera1, 360);

    expect(blur360.blurAmount).toBeGreaterThan(blur180.blurAmount);
  });

  it('should calculate motion direction', () => {
    const camera1 = createDefaultCamera('test', 1920, 1080);
    const cameraRight = { ...camera1, position: { x: camera1.position.x + 100, y: camera1.position.y, z: camera1.position.z } };
    const cameraDown = { ...camera1, position: { x: camera1.position.x, y: camera1.position.y + 100, z: camera1.position.z } };

    const blurRight = estimateMotionBlur(cameraRight, camera1);
    const blurDown = estimateMotionBlur(cameraDown, camera1);

    expect(blurRight.direction).toBeCloseTo(0, 0); // 0 degrees = right
    expect(blurDown.direction).toBeCloseTo(90, 0); // 90 degrees = down
  });

  it('should cap blur amount at 1', () => {
    const camera1 = createDefaultCamera('test', 1920, 1080);
    const camera2 = { ...camera1, position: { x: camera1.position.x + 500, y: camera1.position.y, z: camera1.position.z } };

    const blur = estimateMotionBlur(camera2, camera1);

    expect(blur.blurAmount).toBe(1);
  });
});
