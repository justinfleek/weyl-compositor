/**
 * Model Export Service
 *
 * Exports compositor data in formats compatible with:
 * - Light-X (relighting + camera)
 * - TTM (Time-to-Move - cut-and-drag motion)
 * - Wan-Move (point trajectories)
 * - ATI (Any Trajectory Instruction)
 * - camera-comfyUI (4x4 matrices)
 */

import * as THREE from 'three';
import type { Camera3D } from '@/types/camera';
import type { Layer, ControlPoint, SplineData } from '@/types/project';

// ============================================================================
// CAMERA MATRIX EXPORT (camera-comfyUI compatible)
// ============================================================================

/**
 * Camera pose as 4x4 transformation matrix
 * Format: [R|t] where R is 3x3 rotation, t is 3x1 translation
 */
export interface CameraMatrix4x4 {
  frame: number;
  matrix: number[][]; // 4x4 row-major
}

/**
 * Convert Camera3D to 4x4 transformation matrix
 * Uses Three.js for proper matrix computation
 */
export function camera3DToMatrix4x4(camera: Camera3D): number[][] {
  // Create Three.js objects for proper matrix computation
  const position = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );

  // Combine all rotations (orientation + individual axes)
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(camera.orientation.x + camera.xRotation),
    THREE.MathUtils.degToRad(camera.orientation.y + camera.yRotation),
    THREE.MathUtils.degToRad(camera.orientation.z + camera.zRotation),
    'XYZ'
  );

  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  const scale = new THREE.Vector3(1, 1, 1);

  // Compose the matrix
  const matrix = new THREE.Matrix4();
  matrix.compose(position, quaternion, scale);

  // Convert to 4x4 array (row-major for compatibility)
  const elements = matrix.elements;
  return [
    [elements[0], elements[4], elements[8], elements[12]],
    [elements[1], elements[5], elements[9], elements[13]],
    [elements[2], elements[6], elements[10], elements[14]],
    [elements[3], elements[7], elements[11], elements[15]]
  ];
}

/**
 * Export camera trajectory as sequence of 4x4 matrices
 * Compatible with camera-comfyUI
 */
export interface CameraTrajectoryExport {
  matrices: number[][][]; // [frame][4][4]
  metadata: {
    frameCount: number;
    fps: number;
    fov: number;
    nearClip: number;
    farClip: number;
    width: number;
    height: number;
  };
}

export function exportCameraTrajectory(
  cameras: Camera3D[],  // One per frame (interpolated)
  fps: number,
  width: number,
  height: number
): CameraTrajectoryExport {
  const matrices = cameras.map(cam => camera3DToMatrix4x4(cam));

  return {
    matrices,
    metadata: {
      frameCount: cameras.length,
      fps,
      fov: cameras[0]?.angleOfView ?? 39.6,
      nearClip: cameras[0]?.nearClip ?? 1,
      farClip: cameras[0]?.farClip ?? 10000,
      width,
      height
    }
  };
}

// ============================================================================
// TRAJECTORY EXPORT (Wan-Move / ATI compatible)
// ============================================================================

/**
 * Point trajectory format for Wan-Move
 * Each trajectory is a sequence of (x, y) positions over frames
 */
export interface PointTrajectory {
  id: string;
  points: Array<{ frame: number; x: number; y: number }>;
  visibility: boolean[]; // Per-frame visibility
}

/**
 * Full trajectory export for Wan-Move
 * Format matches their expected NumPy array structure
 */
export interface WanMoveTrajectoryExport {
  // Shape: [num_points, num_frames, 2] for coordinates
  trajectories: number[][][];
  // Shape: [num_points, num_frames] for visibility
  visibility: number[][];
  metadata: {
    numPoints: number;
    numFrames: number;
    imageWidth: number;
    imageHeight: number;
  };
}

/**
 * Extract point trajectories from layer position animation
 */
export function extractLayerTrajectory(
  layer: Layer,
  startFrame: number,
  endFrame: number,
  getPositionAtFrame: (layer: Layer, frame: number) => { x: number; y: number }
): PointTrajectory {
  const points: Array<{ frame: number; x: number; y: number }> = [];
  const visibility: boolean[] = [];

  for (let frame = startFrame; frame <= endFrame; frame++) {
    const inRange = frame >= layer.inPoint && frame <= layer.outPoint;
    const pos = getPositionAtFrame(layer, frame);

    points.push({ frame, x: pos.x, y: pos.y });
    visibility.push(inRange && layer.visible);
  }

  return {
    id: layer.id,
    points,
    visibility
  };
}

/**
 * Extract trajectories from spline control points
 */
export function extractSplineTrajectories(
  splineData: SplineData,
  startFrame: number,
  endFrame: number
): PointTrajectory[] {
  // For now, splines are static - return constant positions
  // TODO: Support animated spline control points
  return splineData.controlPoints.map(cp => ({
    id: cp.id,
    points: Array.from({ length: endFrame - startFrame + 1 }, (_, i) => ({
      frame: startFrame + i,
      x: cp.x,
      y: cp.y
    })),
    visibility: Array(endFrame - startFrame + 1).fill(true)
  }));
}

/**
 * Export trajectories in Wan-Move format
 */
export function exportWanMoveTrajectories(
  trajectories: PointTrajectory[],
  imageWidth: number,
  imageHeight: number
): WanMoveTrajectoryExport {
  if (trajectories.length === 0) {
    return {
      trajectories: [],
      visibility: [],
      metadata: { numPoints: 0, numFrames: 0, imageWidth, imageHeight }
    };
  }

  const numFrames = trajectories[0].points.length;

  // Convert to [num_points, num_frames, 2] format
  const trajArray = trajectories.map(traj =>
    traj.points.map(pt => [pt.x, pt.y])
  );

  // Convert visibility to [num_points, num_frames] format (1 or 0)
  const visArray = trajectories.map(traj =>
    traj.visibility.map(v => v ? 1 : 0)
  );

  return {
    trajectories: trajArray,
    visibility: visArray,
    metadata: {
      numPoints: trajectories.length,
      numFrames,
      imageWidth,
      imageHeight
    }
  };
}

// ============================================================================
// ATI TRAJECTORY EXPORT
// ============================================================================

/**
 * ATI trajectory instruction types
 */
export type ATITrajectoryType = 'free' | 'circular' | 'static' | 'pan';

export interface ATITrajectoryInstruction {
  type: ATITrajectoryType;
  points?: Array<{ x: number; y: number }>; // For free trajectories
  center?: { x: number; y: number }; // For circular
  radius?: number;
  panSpeed?: { x: number; y: number }; // Pixels per frame
}

/**
 * Calculate pan speed from position animation
 */
export function calculatePanSpeed(
  layer: Layer,
  startFrame: number,
  endFrame: number,
  getPositionAtFrame: (layer: Layer, frame: number) => { x: number; y: number }
): { x: number; y: number } {
  if (endFrame <= startFrame) return { x: 0, y: 0 };

  const startPos = getPositionAtFrame(layer, startFrame);
  const endPos = getPositionAtFrame(layer, endFrame);
  const frameCount = endFrame - startFrame;

  return {
    x: (endPos.x - startPos.x) / frameCount,
    y: (endPos.y - startPos.y) / frameCount
  };
}

/**
 * Export trajectory in ATI format
 */
export function exportATITrajectory(
  trajectory: PointTrajectory,
  imageWidth: number,
  imageHeight: number
): ATITrajectoryInstruction {
  const points = trajectory.points;

  if (points.length < 2) {
    return { type: 'static' };
  }

  // Check if it's a linear pan (constant velocity)
  const dx = points[points.length - 1].x - points[0].x;
  const dy = points[points.length - 1].y - points[0].y;
  const frameCount = points.length - 1;

  // Calculate variance to detect linear motion
  let isLinear = true;
  const expectedDxPerFrame = dx / frameCount;
  const expectedDyPerFrame = dy / frameCount;

  for (let i = 1; i < points.length; i++) {
    const actualDx = points[i].x - points[i - 1].x;
    const actualDy = points[i].y - points[i - 1].y;

    if (Math.abs(actualDx - expectedDxPerFrame) > 1 ||
        Math.abs(actualDy - expectedDyPerFrame) > 1) {
      isLinear = false;
      break;
    }
  }

  if (isLinear && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    return {
      type: 'pan',
      panSpeed: {
        x: expectedDxPerFrame,
        y: expectedDyPerFrame
      }
    };
  }

  // Otherwise, export as free trajectory
  return {
    type: 'free',
    points: points.map(p => ({ x: p.x, y: p.y }))
  };
}

// ============================================================================
// TTM (Time-to-Move) EXPORT
// ============================================================================

/**
 * TTM export format
 * Requires: image, mask, and trajectory
 */
export interface TTMExport {
  // Reference image (base64 or path)
  referenceImage: string;

  // Motion mask - defines region to animate
  // White = move, Black = static
  motionMask: string; // Base64 PNG

  // Trajectory - where the masked region should move
  trajectory: Array<{ x: number; y: number }>;

  // Model-specific params
  modelConfig: {
    model: 'wan' | 'cogvideox' | 'svd';
    tweakIndex: number;
    tstrongIndex: number;
    inferenceSteps: number;
  };
}

/**
 * Generate motion mask from layer bounds
 */
export function generateMotionMask(
  layer: Layer,
  compWidth: number,
  compHeight: number,
  getLayerBounds: (layer: Layer, frame: number) => { x: number; y: number; width: number; height: number }
): ImageData {
  // Create canvas for mask
  const canvas = document.createElement('canvas');
  canvas.width = compWidth;
  canvas.height = compHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with black (static region)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, compWidth, compHeight);

  // Draw white rectangle for layer bounds (motion region)
  const bounds = getLayerBounds(layer, layer.inPoint);
  ctx.fillStyle = 'white';
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  return ctx.getImageData(0, 0, compWidth, compHeight);
}

// ============================================================================
// LIGHT-X EXPORT
// ============================================================================

/**
 * Light-X camera motion types
 */
export type LightXMotionStyle = 'gradual' | 'bullet' | 'direct' | 'dolly-zoom';

/**
 * Light-X relighting source types
 */
export type LightXRelightSource = 'text' | 'reference' | 'hdr' | 'background';

export interface LightXExport {
  // Camera trajectory
  cameraTrajectory: CameraTrajectoryExport;

  // Motion style
  motionStyle: LightXMotionStyle;

  // Relighting configuration
  relighting: {
    source: LightXRelightSource;
    textPrompt?: string;
    referenceImage?: string; // Base64
    hdrMap?: string; // Base64 or path
    backgroundColor?: string; // Hex
  };
}

/**
 * Detect motion style from camera animation
 */
export function detectMotionStyle(
  cameras: Camera3D[]
): LightXMotionStyle {
  if (cameras.length < 2) return 'static' as any;

  const first = cameras[0];
  const last = cameras[cameras.length - 1];

  // Check for dolly zoom (position changes while FOV changes)
  const positionChange = Math.sqrt(
    Math.pow(last.position.z - first.position.z, 2)
  );
  const fovChange = Math.abs(last.angleOfView - first.angleOfView);

  if (positionChange > 100 && fovChange > 5) {
    return 'dolly-zoom';
  }

  // Check for bullet time (orbit around POI)
  const yRotationChange = Math.abs(last.yRotation - first.yRotation);
  if (yRotationChange > 45) {
    return 'bullet';
  }

  // Check for gradual (smooth linear motion)
  let isSmooth = true;
  for (let i = 1; i < cameras.length - 1; i++) {
    const prev = cameras[i - 1];
    const curr = cameras[i];
    const next = cameras[i + 1];

    // Check for acceleration changes
    const vel1 = curr.position.x - prev.position.x;
    const vel2 = next.position.x - curr.position.x;

    if (Math.abs(vel2 - vel1) > 10) {
      isSmooth = false;
      break;
    }
  }

  return isSmooth ? 'gradual' : 'direct';
}

// ============================================================================
// UNIFIED EXPORT FUNCTION
// ============================================================================

export type ModelTarget =
  | 'camera-comfyui'
  | 'wan-move'
  | 'ati'
  | 'ttm'
  | 'light-x';

export interface UnifiedExportOptions {
  target: ModelTarget;
  layers: Layer[];
  cameras: Camera3D[];
  compWidth: number;
  compHeight: number;
  fps: number;
  startFrame: number;
  endFrame: number;

  // Callbacks for getting animated values
  getPositionAtFrame: (layer: Layer, frame: number) => { x: number; y: number };
  getLayerBounds: (layer: Layer, frame: number) => { x: number; y: number; width: number; height: number };

  // Model-specific options
  ttmModel?: 'wan' | 'cogvideox' | 'svd';
  lightXRelighting?: LightXExport['relighting'];
}

export interface UnifiedExportResult {
  success: boolean;
  target: ModelTarget;
  data: any;
  files: {
    name: string;
    content: string | Blob;
    type: 'json' | 'npy' | 'png' | 'tensor';
  }[];
}

/**
 * Export compositor data for a specific model
 */
export async function exportForModel(
  options: UnifiedExportOptions
): Promise<UnifiedExportResult> {
  const { target, layers, cameras, compWidth, compHeight, fps, startFrame, endFrame } = options;

  switch (target) {
    case 'camera-comfyui': {
      const trajectory = exportCameraTrajectory(cameras, fps, compWidth, compHeight);
      return {
        success: true,
        target,
        data: trajectory,
        files: [{
          name: 'camera_trajectory.json',
          content: JSON.stringify(trajectory, null, 2),
          type: 'json'
        }]
      };
    }

    case 'wan-move': {
      // Extract trajectories from animated layers
      const trajectories: PointTrajectory[] = [];
      for (const layer of layers) {
        if (layer.transform.position.animated) {
          trajectories.push(
            extractLayerTrajectory(layer, startFrame, endFrame, options.getPositionAtFrame)
          );
        }
      }

      const wanMoveData = exportWanMoveTrajectories(trajectories, compWidth, compHeight);

      // Convert to pseudo-NPY format (JSON representation)
      // Real NPY export would require a proper binary encoder
      return {
        success: true,
        target,
        data: wanMoveData,
        files: [
          {
            name: 'trajectories.json',
            content: JSON.stringify(wanMoveData.trajectories, null, 2),
            type: 'json'
          },
          {
            name: 'visibility.json',
            content: JSON.stringify(wanMoveData.visibility, null, 2),
            type: 'json'
          },
          {
            name: 'metadata.json',
            content: JSON.stringify(wanMoveData.metadata, null, 2),
            type: 'json'
          }
        ]
      };
    }

    case 'ati': {
      // Export trajectories with pan speed calculation
      const atiInstructions: ATITrajectoryInstruction[] = [];

      for (const layer of layers) {
        if (layer.transform.position.animated) {
          const trajectory = extractLayerTrajectory(
            layer, startFrame, endFrame, options.getPositionAtFrame
          );
          atiInstructions.push(exportATITrajectory(trajectory, compWidth, compHeight));
        }
      }

      // Also export camera as trajectory if animated
      if (cameras.length > 1) {
        const camTrajectory = exportCameraTrajectory(cameras, fps, compWidth, compHeight);
        atiInstructions.push({
          type: 'circular', // Camera motion is typically orbital
          points: cameras.map(c => ({ x: c.position.x, y: c.position.y }))
        });
      }

      return {
        success: true,
        target,
        data: atiInstructions,
        files: [{
          name: 'ati_trajectories.json',
          content: JSON.stringify(atiInstructions, null, 2),
          type: 'json'
        }]
      };
    }

    case 'ttm': {
      // Find the first animated layer for TTM
      const animatedLayer = layers.find(l => l.transform.position.animated);
      if (!animatedLayer) {
        return {
          success: false,
          target,
          data: null,
          files: []
        };
      }

      const trajectory = extractLayerTrajectory(
        animatedLayer, startFrame, endFrame, options.getPositionAtFrame
      );

      // Generate motion mask
      const maskData = generateMotionMask(
        animatedLayer, compWidth, compHeight, options.getLayerBounds
      );

      // Convert ImageData to base64 PNG
      const canvas = document.createElement('canvas');
      canvas.width = compWidth;
      canvas.height = compHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(maskData, 0, 0);
      const maskBase64 = canvas.toDataURL('image/png');

      const ttmExport: TTMExport = {
        referenceImage: '', // Would be filled by caller
        motionMask: maskBase64,
        trajectory: trajectory.points.map(p => ({ x: p.x, y: p.y })),
        modelConfig: {
          model: options.ttmModel || 'wan',
          tweakIndex: 10,
          tstrongIndex: 20,
          inferenceSteps: 50
        }
      };

      return {
        success: true,
        target,
        data: ttmExport,
        files: [
          {
            name: 'ttm_config.json',
            content: JSON.stringify(ttmExport, null, 2),
            type: 'json'
          },
          {
            name: 'motion_mask.png',
            content: maskBase64,
            type: 'png'
          }
        ]
      };
    }

    case 'light-x': {
      const cameraTrajectory = exportCameraTrajectory(cameras, fps, compWidth, compHeight);
      const motionStyle = detectMotionStyle(cameras);

      const lightXExport: LightXExport = {
        cameraTrajectory,
        motionStyle,
        relighting: options.lightXRelighting || {
          source: 'text',
          textPrompt: 'natural lighting'
        }
      };

      return {
        success: true,
        target,
        data: lightXExport,
        files: [
          {
            name: 'lightx_config.json',
            content: JSON.stringify(lightXExport, null, 2),
            type: 'json'
          },
          {
            name: 'camera_matrices.json',
            content: JSON.stringify(cameraTrajectory.matrices, null, 2),
            type: 'json'
          }
        ]
      };
    }

    default:
      return {
        success: false,
        target,
        data: null,
        files: []
      };
  }
}

// ============================================================================
// NPY BINARY EXPORT (for true Wan-Move compatibility)
// ============================================================================

/**
 * Create NPY file header for float32 array
 * NPY format: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html
 */
export function createNpyHeader(shape: number[], dtype: string = '<f4'): Uint8Array {
  const header = {
    descr: dtype,
    fortran_order: false,
    shape: shape
  };

  const headerStr = JSON.stringify(header)
    .replace(/"/g, "'")
    .replace(/: /g, ': ')
    .replace(/, /g, ', ');

  // Pad to 64-byte alignment
  const headerBytes = new TextEncoder().encode(headerStr);
  const padLen = 64 - ((10 + headerBytes.length) % 64);
  const paddedHeader = headerStr + ' '.repeat(padLen - 1) + '\n';

  // NPY magic number + version
  const magic = new Uint8Array([0x93, 0x4E, 0x55, 0x4D, 0x50, 0x59, 0x01, 0x00]);
  const headerLenBytes = new Uint8Array(2);
  new DataView(headerLenBytes.buffer).setUint16(0, paddedHeader.length, true);

  const fullHeader = new Uint8Array(magic.length + headerLenBytes.length + paddedHeader.length);
  fullHeader.set(magic, 0);
  fullHeader.set(headerLenBytes, magic.length);
  fullHeader.set(new TextEncoder().encode(paddedHeader), magic.length + 2);

  return fullHeader;
}

/**
 * Export trajectory data as NPY binary
 */
export function trajectoriesToNpy(trajectories: number[][][]): Blob {
  // Flatten the 3D array
  const flat: number[] = [];
  for (const traj of trajectories) {
    for (const point of traj) {
      flat.push(...point);
    }
  }

  const shape = [trajectories.length, trajectories[0]?.length || 0, 2];
  const header = createNpyHeader(shape, '<f4');

  // Create float32 data
  const data = new Float32Array(flat);
  const dataBytes = new Uint8Array(data.buffer);

  // Combine header and data
  const result = new Uint8Array(header.length + dataBytes.length);
  result.set(header, 0);
  result.set(dataBytes, header.length);

  return new Blob([result], { type: 'application/octet-stream' });
}

export default {
  camera3DToMatrix4x4,
  exportCameraTrajectory,
  extractLayerTrajectory,
  exportWanMoveTrajectories,
  exportATITrajectory,
  exportForModel,
  trajectoriesToNpy
};
