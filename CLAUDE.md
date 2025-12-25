# CLAUDE.md - Lattice Compositor Development Guide

**Version:** 12.0 | **Last Updated:** December 25, 2025

---

## ⚠️ STOP AND READ THIS FIRST

Previous sessions have failed in two distinct ways:

**Failure Mode 1: Busywork Tests**
- Created 1,450+ tests that found ZERO bugs
- Tests just asserted what the code returned
- Wasted 7+ hours on pointless pixel tests

**Failure Mode 2: Surface-Level Auditing**
- Read files but didn't understand them
- Used grep/search patterns instead of reading
- Marked 19/23 layers "clean" (statistically impossible)
- Skipped AI model integration analysis entirely
- Used "~400" estimates instead of exact line counts

**What Actually Works:**
- Session 1: Reading code carefully found 4 critical bugs in 2 hours
- FPS audit: Reading every file found 9 bugs, all fixed

**THE RULE: Read. Understand. Confirm. Then mark complete.**

---

## 🔍 THE AUDIT SYSTEM

### Methodology That Works
```
1. READ entire file (exact line count, no estimates)
2. UNDERSTAND what it does (summarize in your own words)
3. TRACE data flow (input → processing → output)
4. IDENTIFY bugs (or explain WHY there are none)
5. CONFIRM with user before marking complete
6. FIX bugs immediately when found
```

### Methodology That Fails
```
❌ Grep for patterns → "no matches, must be clean"
❌ Read first 200 lines → "rest is probably similar"
❌ See no Math.random() → "determinism verified"
❌ "Pure function" → skip detailed analysis
❌ Mark complete without user confirmation
❌ Use "~" estimates instead of exact counts
```

---

## CONFIRMATION CHECKPOINTS

**Before marking ANY feature complete, you MUST:**

1. State exactly how many lines you read (no estimates)
2. Summarize what the code does in your own words
3. Explain the data flow from input to output
4. List any bugs found OR explain why you found none
5. **WAIT FOR USER CONFIRMATION** before proceeding

**Example of proper completion:**
```
AUDIT COMPLETE: DepthLayer.ts

Lines read: 331 (entire file)

What it does:
- Receives depth map data from DepthAnything v2 or MiDaS
- Normalizes depth values to 0-1 range using min/max
- Applies colormap for visualization
- Provides depth values for parallax effects

Data flow:
- Input: Raw depth tensor from AI model (float32, shape [H,W,1])
- Processing: Normalization, optional inversion, colormap application
- Output: RGBA texture for rendering, raw depth for effects

Bugs found: 1
- BUG-010: Line 156 - depth normalization assumes values are already 0-255
  but DepthAnything v2 outputs relative depth in arbitrary range

Waiting for confirmation before marking complete.
```

**If you skip the confirmation step, the audit is INVALID.**

---

## AI/ML LAYER REQUIREMENTS

These layers integrate with AI models and REQUIRE deep analysis:

| Layer | Model Integration | What to Check |
|-------|-------------------|---------------|
| DepthLayer | DepthAnything v2, MiDaS, ZoeDepth | Tensor format, value range normalization |
| NormalLayer | NormalCrafter, DSINE | Normal vector encoding (-1 to 1 vs 0-1) |
| PoseLayer | DWPose, OpenPose | Keypoint format, confidence thresholds |
| GeneratedLayer | Stable Diffusion, Flux | Latent decoding, color space |
| ProceduralMatteLayer | SAM, GroundingDINO | Mask format, edge handling |

**For each AI layer, you MUST answer:**

1. What model(s) does this layer support?
2. What tensor format does each model output?
3. How does the layer normalize/convert the data?
4. Are there hardcoded assumptions about value ranges?
5. Does it handle different model outputs correctly?

**"Clean" is NOT acceptable for AI layers without this analysis.**

---

## STATISTICAL SANITY CHECK

If your audit finds:
- More than 5 consecutive features "clean" → STOP and re-examine
- More than 80% of a tier "clean" → Something is wrong
- Any AI/ML layer "clean" → Requires explicit justification

**Reality check:** The codebase has 650,000+ lines. Bugs exist. If you're not finding them, you're not looking hard enough.

---

## ABSOLUTE RULES

### 1. NO GREP/SEARCH PATTERNS FOR AUDITING
```bash
# ❌ FORBIDDEN
grep -n "Math.random" file.ts  # Then claiming determinism verified
grep -n "fps" file.ts          # Then claiming fps handling verified

# ✅ REQUIRED
Read the entire file. Every line. Document exact line count.
```

### 2. NO ESTIMATES
```
❌ "~400 lines"
❌ "approximately 1000 lines"
❌ "about 500 lines"

✅ "421 lines" (exact count from wc -l or file read)
```

### 3. NO MARKING COMPLETE WITHOUT CONFIRMATION
```
❌ "ShapeLayer audit complete. Moving to next layer."

✅ "ShapeLayer audit complete. Summary: [detailed summary]. 
    Bugs found: [list or 'none - here's why']. 
    Waiting for confirmation before proceeding."
```

### 4. FIX BUGS IMMEDIATELY
When you find a bug:
1. Log it in BUGS_FOUND.md
2. Fix the code
3. Verify with TypeScript
4. Commit
5. Update bug status to FIXED
6. THEN continue auditing

### 5. UNDERSTAND, DON'T JUST READ
```
❌ "Read 1076 lines. No bugs found."

✅ "Read 1076 lines. This layer:
    - Creates Three.js PointLight/SpotLight/DirectionalLight
    - Handles shadow mapping via shadow.mapSize
    - Animates intensity, color, position via keyframes
    - Potential issue: Line 552 uses smoothing that could break determinism
    - Verified: Uses frame-based reset on non-sequential playback (line 556)
    No bugs found because [specific reasoning]."
```

---

## PROJECT OVERVIEW

**Lattice Compositor** - Professional motion graphics for ComfyUI AI video generation.

| Metric | Value |
|--------|-------|
| Lines of Code | 650,000+ |
| Layer Types | 24 |
| Effects | 102 (77 TS + 25 GLSL) |
| Store Actions | 251+ |
| Services | 160+ |

### Architecture
```
UI (Vue) → Store (Pinia) → Engine (Three.js) → Render
```

---

## THE DETERMINISM RULE

**Every frame MUST be reproducible.** Frame 50 → Frame 10 → Frame 50 = IDENTICAL.
```typescript
// ❌ FORBIDDEN
Date.now()
Math.random()           // Use seededRandom
this.state += delta     // Accumulation
previousFrame           // Order dependency

// ✅ REQUIRED
evaluate(frame, project)  // Pure function
seededRNG(seed, frame)    // Deterministic random
```

---

## TERMINOLOGY (Legal Requirement)

| ❌ Avoid | ✅ Use |
|----------|--------|
| Pickwhip | PropertyLink |
| Graph Editor | CurveEditor |
| Adjustment Layer | EffectLayer |
| loopOut/loopIn | repeatAfter/repeatBefore |
| Null Object | Control |
| Precomp | NestedComp |
| Anchor Point | origin |

---

## SESSION WORKFLOW

1. Read `docs/audit/AUDIT_PROGRESS.md` for current state
2. Read `docs/audit/AUDIT_WORKFLOW.md` to refresh rules
3. Pick next feature from `FEATURE_INVENTORY.md`
4. Audit with FULL FILE READS
5. Summarize findings and WAIT FOR CONFIRMATION
6. Fix any bugs found
7. Update progress AFTER confirmation
8. Repeat

---

**The goal is FINDING AND FIXING BUGS with USER CONFIRMATION at each step.**