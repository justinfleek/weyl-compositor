# Lattice Compositor Audit Workflow

**Version:** 4.0 | **Updated:** December 25, 2025

---

## How This Works

You work → Checkpoint → Output reviewed → "confirmed" or feedback → Continue

The user passes messages. Another Claude reviews your output.
"Confirmed" means the review passed. Then you continue.

---

## The Audit Cycle

### 1. DISCOVERY

Identify ALL files related to the feature:
- Check FEATURE_INVENTORY.md for listed files
- Check ui/src/components for related .vue files
- Check ui/src/stores for related actions
- Check ui/src/engine for related classes
- Check ui/src/services for related services
- Check ui/src/types for related types

List every file you will read.

### 2. READ FILES

READ EVERY LINE of every file identified.

- Exact line counts required
- Large files: read in chunks, track progress
- Note observations from each file/chunk

Prohibited:
- Using grep/search to verify code
- Reading one chunk and assuming the rest
- Estimates like "~400 lines"
- Skipping files

### 3. TRACE USER FLOW

Follow the complete path for at least 2 user actions:

User clicks [X] → Component handles event → Store action called → Engine updates state → Render displays → Export survives/breaks

### 4. DOCUMENT FINDINGS

Use required format from CLAUDE.md.

### 5. CHECKPOINT

After documenting, state: "Waiting for confirmation before proceeding."

STOP. Do not continue until you receive "confirmed" or feedback.

### 6. AFTER CONFIRMATION

- Update AUDIT_PROGRESS.md (mark complete, add line count, bug count)
- Add bugs to BUGS_FOUND.md
- Git commit fixes and docs
- Begin discovery for next feature

### 7. AFTER FEEDBACK

- Address the specific issues raised
- Re-submit the audit
- Wait for confirmation again

---

## Automatic Pause Triggers

These are reviewed. You cannot skip them.

| Trigger | Required Action |
|---------|-----------------|
| 3+ consecutive 0-bug features | Pause. State trigger. Review methodology. |
| AI/ML layer with 0 bugs | Pause. State trigger. Provide detailed justification. |
| Session has 0 bugs after 3+ features | Pause. State trigger. Something is wrong. |

---

## FPS Architecture

Reference: docs/audit/FPS_ARCHITECTURE.md

Single Source of Truth: composition.settings.fps

Default Values (WAN AI model standard):
- fps: 16
- duration: 5 seconds
- frameCount: 81 (4n+1 pattern)

When auditing fps-related code:

1. Imported media with fps (video, animated assets) creates comp at that fps OR goes into subcomp with frame blending alert
2. Static assets inherit composition settings
3. New compositions default to 16fps / 81 frames
4. Export handles fps conversion for different AI models (WAN 16, Hunyuan 24, etc.)

If a function needs fps and does not have it, trace the call chain to find where fps originates (usually composition.settings.fps or store.fps) and determine why it was not passed.

---

## Context Analysis Methodology

When a function is missing context (fps, duration, composition settings, layer data, etc.):

Step 1: Trace the Call Chain Upward

- Does the immediate caller have the context?
- If not, does THEIR caller have it?
- Keep tracing until you find where context originates

Step 2: Classify and Act

| Finding | Classification | Action |
|---------|----------------|--------|
| Caller has context, does not pass it | BUG | Fix the caller to pass it |
| Context exists higher in chain, never passed down | ARCHITECTURE GAP | Refactor chain to pass context through |
| Function uses wrong default value | BUG | Fix the default |
| Feature is unfinished/stubbed | STUB | Document as TODO, file bug |

Step 3: Document Your Analysis

| Caller | Location | Has context? | Passes it? | Classification |
|--------|----------|--------------|------------|----------------|
| [name] | file:line | YES/NO | YES/NO | BUG / ARCH GAP / STUB |

---

## AI/ML Layer Checklist

For DepthLayer, NormalLayer, PoseLayer, GeneratedLayer, ProceduralMatteLayer:

Must verify ALL:
- Process spawn mechanism
- Input handling (resolution, format, frames)
- Output capture mechanism
- Output parsing
- Value normalization
- Hardcoded assumptions
- Timeline rendering
- Scrubbing determinism
- Expression access
- Export format
- Error handling

0 bugs requires addressing every checkbox with evidence.

---

## File Reading Rules

Under ~800 lines: Read entire file, report exact count

Over ~800 lines: Read in chunks, track progress, report total

Always:
- Exact counts (no ~ estimates)
- Note key findings from each section
- Track chunk progress for large files

---

## Quality Checks (Applied During Review)

Your output is checked for:

1. Discovery thoroughness - Did you identify all related files?
2. Line count accuracy - Exact numbers, no estimates?
3. Full file reads - Did you read every line, not grep?
4. Flow completeness - UI through Export traced?
5. Bug quality - File:line:evidence:impact:fix present?
6. Justification quality - If 0 bugs, is reasoning specific and credible?
7. Statistical sanity - Too many clean features in a row?
8. Context analysis - Did you trace missing context to its source?

Weak audits get sent back for rework.

---

## Git Workflow

After each bug fix:
git add -A && git commit -m "fix(BUG-XXX): [description]"

After documentation updates:
git add -A && git commit -m "docs: [description]"
