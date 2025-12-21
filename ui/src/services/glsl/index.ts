/**
 * GLSL Shader System - Index
 *
 * GPU-accelerated shader effects for Weyl Compositor.
 * Inspired by Jovi_GLSL with Shadertoy-compatible uniforms.
 */

export {
  GLSLEngine,
  getGLSLEngine,
  disposeGLSLEngine,
  GLSL_LIBRARY,
  type ShaderUniforms,
  type ShaderCompileResult,
  type EdgeMode,
  type GLSLEngineOptions
} from './GLSLEngine';

export {
  ShaderEffectProcessor,
  getShaderEffectProcessor,
  disposeShaderEffectProcessor,
  ALL_SHADER_EFFECTS,
  BLUR_EFFECTS,
  DISTORT_EFFECTS,
  COLOR_EFFECTS,
  GENERATE_EFFECTS,
  STYLIZE_EFFECTS,
  TRANSITION_EFFECTS,
  type ShaderEffectDefinition
} from './ShaderEffects';
