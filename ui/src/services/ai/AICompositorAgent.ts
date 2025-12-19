/**
 * AI Compositor Agent
 *
 * A fully autonomous LLM-powered motion graphics engine that can:
 * - Understand complex natural language motion descriptions
 * - Create, modify, and delete any layer type
 * - Set keyframes, expressions, and effects
 * - Iteratively refine based on user feedback
 * - Verify its own changes
 *
 * Architecture:
 * 1. User provides natural language instruction
 * 2. Agent receives instruction + current project state
 * 3. Agent generates tool calls to modify the compositor
 * 4. Action executor applies changes to the store
 * 5. Agent verifies changes and reports back
 * 6. User can provide refinement feedback (loop to step 2)
 */

import { useCompositorStore } from '@/stores/compositorStore';
import type {
  Layer,
  Composition,
  Keyframe,
  AnimatableProperty,
  LayerType
} from '@/types/project';
import { SYSTEM_PROMPT } from './systemPrompt';
import { TOOL_DEFINITIONS, type ToolCall, type ToolResult } from './toolDefinitions';
import { executeToolCall } from './actionExecutor';
import { serializeProjectState } from './stateSerializer';

// ============================================================================
// TYPES
// ============================================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

export interface AIAgentConfig {
  model: 'gpt-4o' | 'claude-sonnet' | 'local';
  maxTokens: number;
  temperature: number;
  maxIterations: number;  // Max tool call iterations per request
  autoVerify: boolean;    // Automatically verify changes after applying
}

export interface AIAgentState {
  isProcessing: boolean;
  currentTask: string | null;
  messages: AIMessage[];
  lastError: string | null;
  iterationCount: number;
}

const DEFAULT_CONFIG: AIAgentConfig = {
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.3,  // Lower for more deterministic tool use
  maxIterations: 10,
  autoVerify: true,
};

// ============================================================================
// AI COMPOSITOR AGENT
// ============================================================================

export class AICompositorAgent {
  private config: AIAgentConfig;
  private state: AIAgentState;
  private abortController: AbortController | null = null;

  constructor(config: Partial<AIAgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isProcessing: false,
      currentTask: null,
      messages: [],
      lastError: null,
      iterationCount: 0,
    };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Process a user instruction
   * This is the main entry point for the AI agent
   */
  async processInstruction(instruction: string): Promise<string> {
    if (this.state.isProcessing) {
      throw new Error('Agent is already processing a request');
    }

    this.state.isProcessing = true;
    this.state.currentTask = instruction;
    this.state.lastError = null;
    this.state.iterationCount = 0;
    this.abortController = new AbortController();

    try {
      // Add user message to history
      this.addMessage({ role: 'user', content: instruction, timestamp: Date.now() });

      // Get current project state for context
      const projectState = serializeProjectState();

      // Build the full prompt with context
      const contextualPrompt = this.buildContextualPrompt(instruction, projectState);

      // Process with LLM (may involve multiple iterations for tool calls)
      const response = await this.runAgentLoop(contextualPrompt);

      // Add assistant response to history
      this.addMessage({ role: 'assistant', content: response, timestamp: Date.now() });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      throw error;
    } finally {
      this.state.isProcessing = false;
      this.state.currentTask = null;
      this.abortController = null;
    }
  }

  /**
   * Cancel the current operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.state.messages = [];
  }

  /**
   * Get current state
   */
  getState(): AIAgentState {
    return { ...this.state };
  }

  /**
   * Get conversation history
   */
  getHistory(): AIMessage[] {
    return [...this.state.messages];
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private addMessage(message: AIMessage): void {
    this.state.messages.push(message);
  }

  private buildContextualPrompt(instruction: string, projectState: string): string {
    return `${SYSTEM_PROMPT}

## Current Project State
\`\`\`json
${projectState}
\`\`\`

## User Request
${instruction}

## Instructions
1. Analyze the user's request carefully
2. Think step-by-step about what needs to be done
3. Use the available tools to make changes
4. After making changes, verify they match the user's intent
5. Provide a clear summary of what you did`;
  }

  private async runAgentLoop(initialPrompt: string): Promise<string> {
    let currentMessages: Array<{ role: string; content: string; tool_calls?: ToolCall[]; tool_call_id?: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: initialPrompt },
    ];

    while (this.state.iterationCount < this.config.maxIterations) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      this.state.iterationCount++;

      // Call LLM
      const response = await this.callLLM(currentMessages);

      // Check if response contains tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Execute tool calls
        const toolResults = await this.executeToolCalls(response.toolCalls);

        // Add assistant message with tool calls
        currentMessages.push({
          role: 'assistant',
          content: response.content,
          tool_calls: response.toolCalls,
        });

        // Add tool results
        for (const result of toolResults) {
          currentMessages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: result.toolCallId,
          });
        }

        // Continue loop to get next response
        continue;
      }

      // No tool calls - we have the final response
      return response.content;
    }

    return 'Maximum iterations reached. Please try a simpler request or break it into steps.';
  }

  private async callLLM(messages: Array<{ role: string; content: string }>): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const response = await fetch('/weyl/api/ai/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        tools: TOOL_DEFINITIONS,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
      signal: this.abortController?.signal,
    });

    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.message || 'LLM API error');
    }

    return {
      content: result.data.content || '',
      toolCalls: result.data.toolCalls,
    };
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      try {
        const result = await executeToolCall(call);
        results.push({
          toolCallId: call.id,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          toolCallId: call.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let agentInstance: AICompositorAgent | null = null;

export function getAIAgent(): AICompositorAgent {
  if (!agentInstance) {
    agentInstance = new AICompositorAgent();
  }
  return agentInstance;
}

export default AICompositorAgent;
