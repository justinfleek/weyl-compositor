/**
 * AI Services Index
 *
 * Exports all AI-related services for the Weyl Compositor.
 */

// Main agent
export { AICompositorAgent, getAIAgent } from './AICompositorAgent';
export type { AIMessage, AIAgentConfig, AIAgentState } from './AICompositorAgent';

// Tool definitions
export { TOOL_DEFINITIONS } from './toolDefinitions';
export type { ToolCall, ToolResult, ToolDefinition } from './toolDefinitions';

// Action executor
export { executeToolCall } from './actionExecutor';

// State serialization
export {
  serializeProjectState,
  serializeLayerList,
  serializeLayerDetails,
  compareStates,
  generateStateSummary,
} from './stateSerializer';
export type {
  SerializedProjectState,
  SerializedComposition,
  SerializedLayer,
  SerializedTransform,
  SerializedAnimatableProperty,
  SerializedKeyframe,
  SerializedEffect,
} from './stateSerializer';

// System prompt
export { SYSTEM_PROMPT } from './systemPrompt';

// Depth estimation
export {
  LLMDepthEstimator,
  getLLMDepthEstimator,
  estimateDepthsHeuristic,
} from './depthEstimation';
export type {
  LayerDepthEstimate,
  DepthEstimationResult,
  LayerAnalysisInput,
  DepthEstimationOptions,
  LLMProvider,
} from './depthEstimation';
