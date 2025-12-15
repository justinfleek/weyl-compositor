/**
 * SolidLayer - Solid Color Layer
 *
 * A simple colored rectangle layer, commonly used for:
 * - Backgrounds
 * - Color mattes
 * - Adjustment layer bases
 */

import * as THREE from 'three';
import type { Layer } from '@/types/project';
import { BaseLayer } from './BaseLayer';

export class SolidLayer extends BaseLayer {
  private mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshBasicMaterial;

  /** Solid color */
  private color: string;

  /** Solid dimensions */
  private width: number;
  private height: number;

  constructor(layerData: Layer) {
    super(layerData);

    // Extract solid-specific data
    const solidData = this.extractSolidData(layerData);
    this.color = solidData.color;
    this.width = solidData.width;
    this.height = solidData.height;

    // Create geometry
    this.geometry = new THREE.PlaneGeometry(this.width, this.height);

    // Create material
    this.material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = `solid_${this.id}`;

    // Add to group
    this.group.add(this.mesh);

    // Apply initial blend mode
    this.initializeBlendMode();
  }

  /**
   * Extract solid layer data from layer object
   */
  private extractSolidData(layerData: Layer): {
    color: string;
    width: number;
    height: number;
  } {
    // Solid data might be in layerData.data or direct properties
    const data = layerData.data as any;

    return {
      color: data?.color ?? '#808080',
      width: data?.width ?? 1920,
      height: data?.height ?? 1080,
    };
  }

  /**
   * Set solid color
   */
  setColor(color: string): void {
    this.color = color;
    this.material.color.set(color);
    this.material.needsUpdate = true;
  }

  /**
   * Get current color
   */
  getColor(): string {
    return this.color;
  }

  /**
   * Set solid dimensions
   */
  setDimensions(width: number, height: number): void {
    if (width === this.width && height === this.height) {
      return;
    }

    this.width = width;
    this.height = height;

    // Recreate geometry
    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(width, height);
    this.mesh.geometry = this.geometry;
  }

  /**
   * Get dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  protected onEvaluateFrame(_frame: number): void {
    // Solid layers have no frame-specific animation beyond transform
    // Color could be animated in the future
  }

  protected onUpdate(properties: Partial<Layer>): void {
    const data = properties.data as any;

    if (data?.color !== undefined) {
      this.setColor(data.color);
    }

    if (data?.width !== undefined || data?.height !== undefined) {
      this.setDimensions(
        data.width ?? this.width,
        data.height ?? this.height
      );
    }

    // Color can also be set directly
    if (data === undefined && (properties as any).labelColor !== undefined) {
      this.setColor((properties as any).labelColor);
    }
  }

  protected onDispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
