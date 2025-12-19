# AI Compositor Agent Service API

## Overview

The AI Compositor Agent is a fully autonomous LLM-powered motion graphics engine that can understand natural language instructions and execute complex motion graphics tasks without manual intervention.

**Location:** `ui/src/services/ai/`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Instruction                          │
│              "Fade in the title over 1 second"              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AICompositorAgent.ts                       │
│  - Conversation memory                                       │
│  - Tool execution loop (max 10 iterations)                  │
│  - Model selection (GPT-4o / Claude Sonnet)                 │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  systemPrompt   │ │ toolDefinitions │ │ stateSerializer │
│                 │ │                 │ │                 │
│ 400+ lines of   │ │ 30+ tool defs   │ │ Project state   │
│ compositor      │ │ for all actions │ │ to JSON for     │
│ schema          │ │                 │ │ LLM context     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    actionExecutor.ts                         │
│  - Maps tool calls to store actions                         │
│  - Error handling with informative messages                 │
│  - Returns verification data                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Proxy                         │
│          /weyl/api/ai/agent (nodes/weyl_api_proxy.py)       │
│  - OpenAI & Anthropic support with tool calling             │
│  - API keys from environment variables                      │
└─────────────────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `AICompositorAgent.ts` | Main agent class with conversation memory and tool loop |
| `systemPrompt.ts` | Comprehensive 400+ line system prompt |
| `toolDefinitions.ts` | 30+ tool definitions for all compositor actions |
| `actionExecutor.ts` | Executes tool calls against the store |
| `stateSerializer.ts` | Serializes project state for LLM context |
| `index.ts` | Module exports |

## Usage

### Basic Usage

```typescript
import { getAIAgent } from '@/services/ai';

const agent = getAIAgent();

// Process an instruction
const response = await agent.processInstruction('Fade in the title over 1 second');
console.log(response);
// "I've added two keyframes to the opacity property of the text layer:
//  - Frame 0: opacity 0
//  - Frame 16: opacity 100 (with easeOut interpolation)
//  The title will now fade in smoothly over 1 second."

// Continue conversation with context
const response2 = await agent.processInstruction('Make it faster');
// Agent understands context and scales the keyframe timing
```

### Configuration

```typescript
import { AICompositorAgent } from '@/services/ai';

const agent = new AICompositorAgent({
  model: 'gpt-4o',        // or 'claude-sonnet'
  maxTokens: 4096,
  temperature: 0.3,       // Lower = more deterministic
  maxIterations: 10,      // Max tool call iterations per request
  autoVerify: true,       // Verify changes after applying
});
```

## Tool Definitions

### Layer Management

| Tool | Description |
|------|-------------|
| `createLayer` | Create a new layer (solid, text, shape, spline, particles, image, camera, control, nested) |
| `deleteLayer` | Delete a layer by ID |
| `duplicateLayer` | Duplicate a layer with optional new name |
| `renameLayer` | Rename a layer |
| `setLayerParent` | Set or remove layer parent |
| `reorderLayers` | Move layer to new index in stack |

### Property Modification

| Tool | Description |
|------|-------------|
| `setLayerProperty` | Set any layer property by path |
| `setLayerTransform` | Set transform properties (position, scale, rotation, opacity, anchorPoint) |

### Keyframe Animation

| Tool | Description |
|------|-------------|
| `addKeyframe` | Add keyframe at frame with value and optional interpolation |
| `removeKeyframe` | Remove keyframe at specific frame |
| `setKeyframeEasing` | Change interpolation type for keyframe |
| `scaleKeyframeTiming` | Scale all keyframe times by factor (speed up/slow down) |

### Expressions

| Tool | Description |
|------|-------------|
| `setExpression` | Apply expression (jitter, repeatAfter, repeatBefore, inertia, bounce, elastic) |
| `removeExpression` | Remove expression from property |

### Effects

| Tool | Description |
|------|-------------|
| `addEffect` | Add effect to layer |
| `updateEffect` | Update effect parameters |
| `removeEffect` | Remove effect from layer |

### Specialized

| Tool | Description |
|------|-------------|
| `configureParticles` | Configure particle system (emitter, particles, physics) |
| `setTextContent` | Set text layer content and styling |
| `setTextPath` | Attach/detach text to spline path |
| `setSplinePoints` | Set spline control points |
| `setTimeRemap` | Enable/configure time remapping |

### Playback & Utility

| Tool | Description |
|------|-------------|
| `setCurrentFrame` | Jump to specific frame |
| `playPreview` | Start/stop playback |
| `getLayerInfo` | Get detailed info about a layer |
| `findLayers` | Search layers by name or type |
| `getProjectState` | Get full project state summary |

## System Prompt

The system prompt teaches the LLM:

1. **Layer Types** - All 9 layer types with complete property schemas
2. **Transform Properties** - position, scale, rotation, opacity, anchorPoint
3. **Keyframe Animation** - All 20+ interpolation types
4. **Expression Functions** - jitter, repeatAfter, repeatBefore, inertia, bounce, elastic
5. **Effects Catalog** - Blur, color, stylize, distortion, generate effects
6. **Time Remapping** - Speed control via keyframed time mapping
7. **Chain of Thought Process** - 5-step reasoning: Understand → Break Down → Plan → Execute → Verify

## Backend API

**Endpoint:** `POST /weyl/api/ai/agent`

**Request:**
```json
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [...],
  "max_tokens": 4096,
  "temperature": 0.3
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "content": "I've created a text layer...",
    "toolCalls": [
      {
        "id": "call_abc123",
        "name": "createLayer",
        "arguments": {
          "type": "text",
          "name": "Title",
          "properties": { "text": "Hello" }
        }
      }
    ]
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude Sonnet |

At least one must be set for the AI agent to function.

## Example Interactions

### Simple Animation
```
User: "Fade in the title over 1 second"

Agent thinks:
1. Find or identify the title layer
2. Set opacity to 0 at frame 0
3. Set opacity to 100 at frame 16 (1 second at 16fps)
4. Use easeOut for smooth fade

Agent actions:
- addKeyframe(layerId, "opacity", 0, 0, "hold")
- addKeyframe(layerId, "opacity", 16, 100, "easeOut")
```

### Complex Multi-Step
```
User: "Create cherry blossom petals that enter from the left, spiral around the center, and exit right"

Agent thinks:
1. Create a spline layer defining spiral path
2. Create particle layer with petal-like particles
3. Configure emitter to follow path
4. Set particle appearance (pink, small, rotating)
5. Time animation across 81 frames

Agent actions:
- createLayer("spline", { points: [...spiral...] })
- createLayer("particles", { emitter: { type: "path", pathReference: splineId }, ... })
- configureParticles(particleLayerId, { ... })
```

### Iterative Refinement
```
User: "Make it faster"

Agent thinks:
1. User wants to speed up the previous animation
2. Scale keyframe timing by 0.5x (twice as fast)

Agent actions:
- scaleKeyframeTiming(layerId, 0.5)
```

## UI Component

The `AIChatPanel.vue` component provides:
- Chat interface with conversation history
- Model selector (GPT-4o / Claude Sonnet)
- Example prompts for quick start
- Processing indicators
- Tool call visualization
- API status indicator

Access via the **AI** tab in the right panel.
