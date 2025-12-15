/**
 * Color Correction Effect Renderers
 *
 * Implements common color correction effects:
 * - Brightness & Contrast
 * - Hue/Saturation
 * - Levels
 * - Tint
 */
import {
  registerEffectRenderer,
  createMatchingCanvas,
  type EffectStackResult,
  type EvaluatedEffectParams
} from '../effectProcessor';

// ============================================================================
// BRIGHTNESS & CONTRAST
// ============================================================================

/**
 * Brightness & Contrast effect renderer
 *
 * Parameters:
 * - brightness: -150 to 150 (default 0)
 * - contrast: -100 to 100 (default 0)
 * - use_legacy: boolean (legacy mode uses simpler formula)
 */
export function brightnessContrastRenderer(
  input: EffectStackResult,
  params: EvaluatedEffectParams
): EffectStackResult {
  const brightness = (params.brightness ?? 0) / 100; // Normalize to -1.5 to 1.5
  const contrast = (params.contrast ?? 0) / 100;     // Normalize to -1 to 1
  const useLegacy = params.use_legacy ?? false;

  // No change needed
  if (brightness === 0 && contrast === 0) {
    return input;
  }

  const output = createMatchingCanvas(input.canvas);
  const imageData = input.ctx.getImageData(0, 0, input.canvas.width, input.canvas.height);
  const data = imageData.data;

  // Calculate contrast factor
  const contrastFactor = useLegacy
    ? 1 + contrast
    : (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += brightness * 255;
    g += brightness * 255;
    b += brightness * 255;

    // Apply contrast (center around 128)
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  output.ctx.putImageData(imageData, 0, 0);
  return output;
}

// ============================================================================
// HUE/SATURATION
// ============================================================================

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Hue/Saturation effect renderer
 *
 * Parameters:
 * - master_hue: -180 to 180 degrees (default 0)
 * - master_saturation: -100 to 100 (default 0)
 * - master_lightness: -100 to 100 (default 0)
 * - colorize: boolean (colorize mode)
 */
export function hueSaturationRenderer(
  input: EffectStackResult,
  params: EvaluatedEffectParams
): EffectStackResult {
  const hueShift = (params.master_hue ?? 0) / 360; // Normalize to 0-1
  const saturationShift = (params.master_saturation ?? 0) / 100;
  const lightnessShift = (params.master_lightness ?? 0) / 100;
  const colorize = params.colorize ?? false;

  // No change needed
  if (hueShift === 0 && saturationShift === 0 && lightnessShift === 0 && !colorize) {
    return input;
  }

  const output = createMatchingCanvas(input.canvas);
  const imageData = input.ctx.getImageData(0, 0, input.canvas.width, input.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let [h, s, l] = rgbToHsl(r, g, b);

    if (colorize) {
      // Colorize mode: use hue shift as absolute hue
      h = hueShift;
      s = Math.abs(saturationShift) + 0.25; // Base saturation
    } else {
      // Normal mode: shift values
      h = (h + hueShift) % 1;
      if (h < 0) h += 1;

      // Saturation adjustment
      s = s + s * saturationShift;
    }

    // Lightness adjustment
    l = l + l * lightnessShift;

    // Clamp saturation and lightness
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));

    const [newR, newG, newB] = hslToRgb(h, s, l);

    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }

  output.ctx.putImageData(imageData, 0, 0);
  return output;
}

// ============================================================================
// LEVELS
// ============================================================================

/**
 * Levels effect renderer
 *
 * Parameters:
 * - input_black: 0-255 (default 0)
 * - input_white: 0-255 (default 255)
 * - gamma: 0.1-10 (default 1)
 * - output_black: 0-255 (default 0)
 * - output_white: 0-255 (default 255)
 */
export function levelsRenderer(
  input: EffectStackResult,
  params: EvaluatedEffectParams
): EffectStackResult {
  const inputBlack = params.input_black ?? 0;
  const inputWhite = params.input_white ?? 255;
  const gamma = params.gamma ?? 1;
  const outputBlack = params.output_black ?? 0;
  const outputWhite = params.output_white ?? 255;

  // No change needed
  if (inputBlack === 0 && inputWhite === 255 && gamma === 1 &&
      outputBlack === 0 && outputWhite === 255) {
    return input;
  }

  const output = createMatchingCanvas(input.canvas);
  const imageData = input.ctx.getImageData(0, 0, input.canvas.width, input.canvas.height);
  const data = imageData.data;

  // Build lookup table for performance
  const lut = new Uint8Array(256);
  const inputRange = inputWhite - inputBlack;
  const outputRange = outputWhite - outputBlack;

  for (let i = 0; i < 256; i++) {
    // Input levels
    let value = (i - inputBlack) / inputRange;
    value = Math.max(0, Math.min(1, value));

    // Gamma correction
    value = Math.pow(value, 1 / gamma);

    // Output levels
    value = outputBlack + value * outputRange;
    value = Math.max(0, Math.min(255, value));

    lut[i] = Math.round(value);
  }

  // Apply LUT to all pixels
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }

  output.ctx.putImageData(imageData, 0, 0);
  return output;
}

// ============================================================================
// TINT
// ============================================================================

/**
 * Tint effect renderer - maps black to one color and white to another
 *
 * Parameters:
 * - map_black_to: color { r, g, b, a } (default black)
 * - map_white_to: color { r, g, b, a } (default white)
 * - amount_to_tint: 0-100 (default 100)
 */
export function tintRenderer(
  input: EffectStackResult,
  params: EvaluatedEffectParams
): EffectStackResult {
  const blackColor = params.map_black_to ?? { r: 0, g: 0, b: 0 };
  const whiteColor = params.map_white_to ?? { r: 255, g: 255, b: 255 };
  const amount = (params.amount_to_tint ?? 100) / 100;

  // No change at 0 amount
  if (amount === 0) {
    return input;
  }

  const output = createMatchingCanvas(input.canvas);
  const imageData = input.ctx.getImageData(0, 0, input.canvas.width, input.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate luminance
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

    // Interpolate between black and white colors based on luminance
    const tintR = blackColor.r + (whiteColor.r - blackColor.r) * lum;
    const tintG = blackColor.g + (whiteColor.g - blackColor.g) * lum;
    const tintB = blackColor.b + (whiteColor.b - blackColor.b) * lum;

    // Blend with original based on amount
    data[i] = Math.round(r + (tintR - r) * amount);
    data[i + 1] = Math.round(g + (tintG - g) * amount);
    data[i + 2] = Math.round(b + (tintB - b) * amount);
  }

  output.ctx.putImageData(imageData, 0, 0);
  return output;
}

// ============================================================================
// DROP SHADOW (Stylize)
// ============================================================================

/**
 * Drop Shadow effect renderer
 *
 * Parameters:
 * - shadow_color: color { r, g, b, a } (default black with 0.5 alpha)
 * - opacity: 0-100 (default 50)
 * - direction: 0-360 degrees (default 135)
 * - distance: 0-1000 pixels (default 5)
 * - softness: 0-250 blur radius (default 5)
 * - shadow_only: boolean (only show shadow)
 */
export function dropShadowRenderer(
  input: EffectStackResult,
  params: EvaluatedEffectParams
): EffectStackResult {
  const shadowColor = params.shadow_color ?? { r: 0, g: 0, b: 0, a: 0.5 };
  const opacity = (params.opacity ?? 50) / 100;
  const direction = (params.direction ?? 135) * Math.PI / 180;
  const distance = params.distance ?? 5;
  const softness = params.softness ?? 5;
  const shadowOnly = params.shadow_only ?? false;

  const output = createMatchingCanvas(input.canvas);
  const { width, height } = input.canvas;

  // Calculate offset from direction and distance
  const offsetX = Math.cos(direction) * distance;
  const offsetY = Math.sin(direction) * distance;

  // Apply shadow using canvas shadow API
  output.ctx.shadowColor = `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, ${opacity})`;
  output.ctx.shadowBlur = softness;
  output.ctx.shadowOffsetX = offsetX;
  output.ctx.shadowOffsetY = offsetY;

  // Draw the image (shadow will be rendered automatically)
  output.ctx.drawImage(input.canvas, 0, 0);

  // Reset shadow for the second draw
  output.ctx.shadowColor = 'transparent';
  output.ctx.shadowBlur = 0;
  output.ctx.shadowOffsetX = 0;
  output.ctx.shadowOffsetY = 0;

  if (!shadowOnly) {
    // Draw original image on top
    output.ctx.drawImage(input.canvas, 0, 0);
  }

  return output;
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all color correction effect renderers
 */
export function registerColorEffects(): void {
  registerEffectRenderer('brightness-contrast', brightnessContrastRenderer);
  registerEffectRenderer('hue-saturation', hueSaturationRenderer);
  registerEffectRenderer('levels', levelsRenderer);
  registerEffectRenderer('tint', tintRenderer);
  registerEffectRenderer('drop-shadow', dropShadowRenderer);
}

export default {
  brightnessContrastRenderer,
  hueSaturationRenderer,
  levelsRenderer,
  tintRenderer,
  dropShadowRenderer,
  registerColorEffects
};
