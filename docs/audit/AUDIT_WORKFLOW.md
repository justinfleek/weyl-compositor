# Lattice Compositor Audit Workflow

---

## ⛔ CRITICAL: THE CONFIRMATION CHECKPOINT

**This is the most important rule. Violations invalidate the entire audit.**

Before marking ANY feature complete:

1. State the exact line count (no estimates)
2. Summarize what the code does
3. Explain the data flow
4. List bugs found OR justify why none exist
5. **SAY: "Waiting for confirmation before proceeding"**
6. **ACTUALLY WAIT** for user response

**You cannot proceed to the next feature without user confirmation.**

---

## ⛔ PROHIBITED SHORTCUTS

| Shortcut | Why It's Wrong | What To Do Instead |
|----------|----------------|-------------------|
| `grep "pattern" file.ts` | Misses everything that doesn't match | Read entire file |
| "~400 lines" | Estimates hide incomplete reads | Use exact count: `wc -l` |
| "Similar to X which was fine" | Every file is different | Read this file completely |
| "Pure function, skip it" | Pure functions have bugs too | Read and trace logic |
| "No Math.random() found" | Determinism issues aren't just random | Trace all state changes |
| "Effects just transform pixels" | Effects have timing, params, edge cases | Full analysis required |
| Mark complete without confirmation | User must verify your work | Wait for explicit OK |
| "Clean" for AI layers | AI layers have complex integrations | Detailed model analysis required |

---

## AI/ML LAYER AUDIT REQUIREMENTS

For DepthLayer, NormalLayer, PoseLayer, GeneratedLayer, ProceduralMatteLayer:

**You MUST document:**

1. **Model Support**
   - Which AI models does this layer accept output from?
   - Are there hardcoded assumptions about specific models?

2. **Tensor Format**
   - What shape/dtype does the layer expect?
   - How does it handle different input formats?

3. **Value Range Normalization**
   - What range does the model output? (0-1? 0-255? -1 to 1? arbitrary?)
   - How does the layer normalize this?
   - Are there hardcoded magic numbers?

4. **Data Flow**
   - Raw model output → layer input → processing → render output
   - Where could data be misinterpreted?

5. **Edge Cases**
   - What happens with invalid/missing data?
   - What happens with different resolution inputs?

**"Clean" is not acceptable without answering ALL of these.**

---

## VERIFICATION QUESTIONS

Before marking ANY feature audited:
```
1. How many lines total? (exact number)
2. Can I explain what lines 100-150 do? (random sample)
3. Can I explain what lines 300-350 do? (another sample)
4. What is the input to this code?
5. What is the output?
6. What processing happens between input and output?
7. What bugs did I find? (or why are there none?)
8. Have I waited for user confirmation?
```

**If you cannot answer all of these, you did not audit the feature.**

---

## THE AUDIT CYCLE

### STEP 1: Read Entire File
```
- Use view tool to read ALL lines
- If file is large, read in chunks
- Document exact line count
- NO grep, NO search patterns
```

### STEP 2: Understand and Summarize
```
- What does this code do?
- What are the inputs and outputs?
- How does data flow through?
- What are the key functions/methods?
```

### STEP 3: Trace Dependencies
```
- What other files does this depend on?
- Read those files too (with line counts)
- Trace the complete data path
```

### STEP 4: Identify Issues
```
- Look for hardcoded values
- Look for missing fps parameters
- Look for type mismatches
- Look for null safety issues
- Look for determinism violations
- Look for AI model assumptions
```

### STEP 5: Document Findings
```
For each bug:
- Exact file and line number
- What's wrong
- What the impact is
- How to fix it
```

### STEP 6: Request Confirmation
```
Present your findings:
- Lines read (exact)
- Summary of what code does
- Data flow explanation
- Bugs found (or why none)

Then say: "Waiting for confirmation before proceeding."
```

### STEP 7: Wait
```
Do NOT proceed until user confirms.
Do NOT start the next feature.
Do NOT assume silence means approval.
```

### STEP 8: Fix and Continue (after confirmation)
```
- Fix any bugs found
- Commit fixes
- Update BUGS_FOUND.md
- Update AUDIT_PROGRESS.md
- Then proceed to next feature
```

---

## STATISTICAL SANITY CHECKS

**Red flags that indicate shallow auditing:**

| Observation | Likely Problem |
|-------------|----------------|
| 5+ consecutive "clean" features | Not reading carefully |
| 80%+ of tier "clean" | Missing bugs |
| Any AI layer "clean" without model analysis | Skipped integration checks |
| Line count estimates (~) | Incomplete file reads |
| No bugs in entire session | Not looking hard enough |
| Very fast completion times | Rushing/skipping |

**If you notice these patterns, STOP and re-examine your methodology.**

---

## BUG SEVERITY GUIDE

**CRITICAL:** Complete failure, data loss, crash
**HIGH:** Feature produces wrong output in common cases
**MEDIUM:** Edge cases broken, timing issues, hardcoded values
**LOW:** Minor issues, but still MUST BE LOGGED

**There is no "too minor to log" category. Every issue gets a BUG entry.**

---

## COMMIT FORMAT
```
fix([tier].[feature]): [description] (BUG-XXX)

- [specific change]
- [specific change]

Files changed:
- [path]
```

---

## FAILURE MODES

### Audit Invalidation Triggers
- Using grep/search patterns instead of reading
- Using line count estimates
- Marking complete without confirmation
- Marking AI layers "clean" without model analysis
- Finding 0 bugs in an entire tier

### How to Recover
1. Acknowledge the shortcut taken
2. Re-read AUDIT_WORKFLOW.md completely
3. Start over on the current feature
4. Use proper methodology this time