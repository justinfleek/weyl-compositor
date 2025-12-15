/**
 * SplineLayer - 3D Spline/Path Layer
 *
 * Renders bezier splines in 3D space. Used for:
 * - Shape paths
 * - Motion paths
 * - Text-on-path
 * - Mask paths
 */

import * as THREE from 'three';
import type { Layer, SplineData, ControlPoint } from '@/types/project';
import { BaseLayer } from './BaseLayer';

export class SplineLayer extends BaseLayer {
  /** The line mesh for the spline */
  private lineMesh: THREE.Line | null = null;

  /** The fill mesh (if closed path with fill) */
  private fillMesh: THREE.Mesh | null = null;

  /** Spline data */
  private splineData: SplineData;

  /** Cached curve for path calculations */
  private curve: THREE.CurvePath<THREE.Vector3> | null = null;

  constructor(layerData: Layer) {
    super(layerData);

    // Extract spline data
    this.splineData = this.extractSplineData(layerData);

    // Build the spline geometry
    this.buildSpline();

    // Apply initial blend mode
    this.initializeBlendMode();
  }

  /**
   * Extract spline data from layer
   */
  private extractSplineData(layerData: Layer): SplineData {
    const data = layerData.data as SplineData | null;

    return {
      controlPoints: data?.controlPoints ?? [],
      closed: data?.closed ?? false,
      stroke: data?.stroke ?? '#00ff00',
      strokeWidth: data?.strokeWidth ?? 2,
      fill: data?.fill ?? '',
      pathData: data?.pathData ?? '',
    };
  }

  /**
   * Build the Three.js spline from control points
   */
  private buildSpline(): void {
    // Clear existing meshes
    this.clearMeshes();

    const points = this.splineData.controlPoints;
    if (points.length < 2) return;

    // Build curve path from control points
    this.curve = new THREE.CurvePath<THREE.Vector3>();

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Use depth for Z position (depth map sampled value)
      const z0 = p0.depth ?? 0;
      const z1 = p1.depth ?? 0;

      // Create bezier curve segment
      const bezier = new THREE.CubicBezierCurve3(
        new THREE.Vector3(p0.x, -p0.y, z0),
        new THREE.Vector3(
          p0.x + (p0.handleOut?.x ?? 0),
          -(p0.y + (p0.handleOut?.y ?? 0)),
          z0
        ),
        new THREE.Vector3(
          p1.x + (p1.handleIn?.x ?? 0),
          -(p1.y + (p1.handleIn?.y ?? 0)),
          z1
        ),
        new THREE.Vector3(p1.x, -p1.y, z1)
      );

      this.curve.add(bezier);
    }

    // Close path if needed
    if (this.splineData.closed && points.length > 2) {
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];

      const zLast = lastPoint.depth ?? 0;
      const zFirst = firstPoint.depth ?? 0;

      const closingBezier = new THREE.CubicBezierCurve3(
        new THREE.Vector3(lastPoint.x, -lastPoint.y, zLast),
        new THREE.Vector3(
          lastPoint.x + (lastPoint.handleOut?.x ?? 0),
          -(lastPoint.y + (lastPoint.handleOut?.y ?? 0)),
          zLast
        ),
        new THREE.Vector3(
          firstPoint.x + (firstPoint.handleIn?.x ?? 0),
          -(firstPoint.y + (firstPoint.handleIn?.y ?? 0)),
          zFirst
        ),
        new THREE.Vector3(firstPoint.x, -firstPoint.y, zFirst)
      );

      this.curve.add(closingBezier);
    }

    // Create line geometry
    const curvePoints = this.curve.getPoints(points.length * 20);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.splineData.stroke,
      linewidth: this.splineData.strokeWidth,
      transparent: true,
    });

    this.lineMesh = new THREE.Line(lineGeometry, lineMaterial);
    this.lineMesh.name = `spline_line_${this.id}`;
    this.group.add(this.lineMesh);

    // Create fill if specified and path is closed
    if (this.splineData.fill && this.splineData.closed) {
      this.createFill(curvePoints);
    }
  }

  /**
   * Create fill mesh for closed paths
   */
  private createFill(curvePoints: THREE.Vector3[]): void {
    if (curvePoints.length < 3) return;

    // Create shape from points (project to XY plane)
    const shape = new THREE.Shape();
    shape.moveTo(curvePoints[0].x, curvePoints[0].y);

    for (let i = 1; i < curvePoints.length; i++) {
      shape.lineTo(curvePoints[i].x, curvePoints[i].y);
    }

    shape.closePath();

    const fillGeometry = new THREE.ShapeGeometry(shape);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: this.splineData.fill,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    this.fillMesh.name = `spline_fill_${this.id}`;
    this.fillMesh.position.z = -0.1; // Slightly behind stroke
    this.group.add(this.fillMesh);
  }

  /**
   * Clear existing meshes
   */
  private clearMeshes(): void {
    if (this.lineMesh) {
      this.group.remove(this.lineMesh);
      this.lineMesh.geometry.dispose();
      (this.lineMesh.material as THREE.Material).dispose();
      this.lineMesh = null;
    }

    if (this.fillMesh) {
      this.group.remove(this.fillMesh);
      this.fillMesh.geometry.dispose();
      (this.fillMesh.material as THREE.Material).dispose();
      this.fillMesh = null;
    }

    this.curve = null;
  }

  // ============================================================================
  // PATH UTILITIES
  // ============================================================================

  /**
   * Get a point on the path at parameter t (0-1)
   */
  getPointAt(t: number): THREE.Vector3 | null {
    if (!this.curve) return null;
    return this.curve.getPointAt(Math.max(0, Math.min(1, t)));
  }

  /**
   * Get the tangent at parameter t (0-1)
   */
  getTangentAt(t: number): THREE.Vector3 | null {
    if (!this.curve) return null;
    return this.curve.getTangentAt(Math.max(0, Math.min(1, t)));
  }

  /**
   * Get the total length of the path
   */
  getLength(): number {
    if (!this.curve) return 0;
    return this.curve.getLength();
  }

  /**
   * Get point and rotation for placing objects along path
   */
  getTransformAt(t: number): { position: THREE.Vector3; rotation: number } | null {
    const point = this.getPointAt(t);
    const tangent = this.getTangentAt(t);

    if (!point || !tangent) return null;

    // Calculate rotation from tangent
    const rotation = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);

    return { position: point, rotation };
  }

  /**
   * Get the underlying curve for advanced operations
   */
  getCurve(): THREE.CurvePath<THREE.Vector3> | null {
    return this.curve;
  }

  // ============================================================================
  // PROPERTY SETTERS
  // ============================================================================

  /**
   * Set stroke color
   */
  setStroke(color: string): void {
    this.splineData.stroke = color;
    if (this.lineMesh) {
      (this.lineMesh.material as THREE.LineBasicMaterial).color.set(color);
    }
  }

  /**
   * Set stroke width
   */
  setStrokeWidth(width: number): void {
    this.splineData.strokeWidth = width;
    if (this.lineMesh) {
      (this.lineMesh.material as THREE.LineBasicMaterial).linewidth = width;
    }
  }

  /**
   * Set fill color
   */
  setFill(color: string): void {
    this.splineData.fill = color;
    if (this.fillMesh) {
      (this.fillMesh.material as THREE.MeshBasicMaterial).color.set(color);
    } else if (color && this.splineData.closed && this.curve) {
      // Create fill if it doesn't exist
      const curvePoints = this.curve.getPoints(this.splineData.controlPoints.length * 20);
      this.createFill(curvePoints);
    }
  }

  /**
   * Update control points
   */
  setControlPoints(points: ControlPoint[]): void {
    this.splineData.controlPoints = points;
    this.buildSpline();
  }

  /**
   * Set closed state
   */
  setClosed(closed: boolean): void {
    if (this.splineData.closed === closed) return;
    this.splineData.closed = closed;
    this.buildSpline();
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  protected onEvaluateFrame(_frame: number): void {
    // Splines could have animated control points in the future
    // For now, static paths only
  }

  protected onUpdate(properties: Partial<Layer>): void {
    const data = properties.data as SplineData | undefined;

    if (data) {
      let needsRebuild = false;

      if (data.controlPoints !== undefined) {
        this.splineData.controlPoints = data.controlPoints;
        needsRebuild = true;
      }

      if (data.closed !== undefined && data.closed !== this.splineData.closed) {
        this.splineData.closed = data.closed;
        needsRebuild = true;
      }

      if (data.stroke !== undefined) {
        this.setStroke(data.stroke);
      }

      if (data.strokeWidth !== undefined) {
        this.setStrokeWidth(data.strokeWidth);
      }

      if (data.fill !== undefined) {
        this.setFill(data.fill);
      }

      if (needsRebuild) {
        this.buildSpline();
      }
    }
  }

  protected onDispose(): void {
    this.clearMeshes();
  }
}
