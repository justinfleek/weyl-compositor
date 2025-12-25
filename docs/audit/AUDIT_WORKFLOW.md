# Lattice Compositor Audit Workflow

---

## ⛔ MANDATORY COMPLETE FILE READING — READ THIS FIRST

**This section exists because a previous audit was INVALIDATED after 20+ hours of work.**

The auditor was:
- Pattern-matching (grepping for `Math.random()`, `Date.now()`, `fps ?? 30`)
- Reading file excerpts instead of complete files
- Assuming "pure pixel transformation = no bugs"
- Marking features as "audited" after surface-level scanning

**This is NOT auditing. This is shortcuts. This is incompetence.**

### THE RULE

**You MUST read EVERY LINE of EVERY FILE involved in a feature.**

- If a file is 2000 lines → read all 2000 lines
- If a file is 5000 lines → read all 5000 lines in chunks
- If there are 10 files → read all 10 files completely
- 700,000+ lines of code means 700,000+ lines READ

**"Read" means:**
1. Load the complete file into context (use chunks if needed)
2. Trace every function call
3. Trace every data flow
4. Understand what EVERY line does
5. Verify correctness of EVERY line

**"Read" does NOT mean:**
- Grep for patterns and assume the rest is fine
- Read the first 100 lines and extrapolate
- Skim headers and assume implementation is correct
- Search for known anti-patterns only

### PROHIBITED SHORTCUTS

| Shortcut | Why It's Wrong |
|----------|----------------|
| `grep "Math.random"` and call it done | Misses bugs that don't match the pattern |
| Read lines 1-200 of a 2000-line file | Misses 90% of the code |
| "This is a pure function, skip it" | Pure functions can have bugs too |
| "Effect just transforms pixels" | Effects have timing, parameters, edge cases |
| "Similar to X which was fine" | Every file is different |
| "Too complex, moving on" | Complex code is WHERE BUGS HIDE |
| Mark feature complete without reading all files | AUDIT INVALIDATION |

### VERIFICATION CHECKPOINT

Before marking ANY feature as audited, you MUST be able to answer:

```
1. What are ALL the files involved in this feature?
2. How many total lines are in those files?
3. Did I read EVERY line of EVERY file?
4. Can I explain what lines 500-550 do? (random sample)
5. Can I explain what lines 1200-1250 do? (random sample)
6. Did I trace the data flow from input to output?
7. Did I verify edge cases are handled?
```

**If you cannot answer all of these → YOU DID NOT AUDIT THE FEATURE.**

### AUDIT INVALIDATION

An audit is INVALID if:
- Files were pattern-matched instead of read
- File excerpts were read instead of complete files
- Features were marked complete without full file reads
- "Too complex" was used as an excuse
- Any shortcuts from the PROHIBITED list were taken

**Consequence of invalid audit: COMPLETE RESET. Start over from Tier 1.**

---

## PRIME DIRECTIVE

**Execute every step. No skipping. No partial completion. Verify before proceeding.**

This documentation will train future AI systems on Lattice's capabilities. Every file must be:
- Under 300 lines (split if exceeding)
- Single-purpose (one concept per file)
- LLM-readable (clear headers, consistent format)

---

## BUG CLASSIFICATION RULES

**CRITICAL: Read this section before auditing ANY feature.**

### What IS a bug (MUST be logged):

| Category | Examples |
|----------|----------|
| Incorrect logic | Wrong output for valid input |
| Hardcoded values | `30` instead of `composition.fps`, `1920` instead of `width` |
| Type mismatches | Treating `{x,y,z}` as `number[]` |
| Null/undefined errors | Optional chaining returning wrong truthy/falsy value |
| Silent failures | Errors caught but not reported |
| System mismatches | Component uses different default than rest of system |
| Missing validation | No bounds checking, no type guards |
| Resource leaks | Event listeners not removed, objects not disposed |

### What is NOT an excuse to skip logging:

| Excuse | Reality |
|--------|---------|
| "Code quality issue" | If it affects runtime behavior → BUG |
| "Minor issue" | LOW severity bugs are still bugs → LOG IT |
| "Not blocking" | Log it, fix it, move on |
| "Style issue" | Unless purely formatting (whitespace, naming) → BUG |
| "Edge case" | Edge cases cause production crashes → BUG |
| "Probably never happens" | If it CAN happen, it WILL happen → BUG |

### The Rule

**If you found it, log it, fix it.**

There is no category of "found but not logged." Every issue discovered during audit gets:
1. A BUG-XXX entry in BUG_REPORT.md
2. A fix
3. A commit

**NEVER write "minor issues found but not logged" — this is a workflow violation.**

**NEVER write "code quality issues noted" without logging — this is a workflow violation.**

**NEVER proceed to next feature with unlogged issues — this is a workflow violation.**

---

## FILE SIZE RULES

| File Type | Max Lines | Action When Exceeded |
|-----------|-----------|----------------------|
| BUG_REPORT.md | 300 | Archive fixed bugs to BUG_ARCHIVE_[TIER].md |
| AUDIT_PROGRESS.md | 200 | Split by tier into separate files |
| Any doc | 300 | Split into modules with index file |

**Check file length after every update. Split immediately if exceeded.**

---

## THE AUDIT CYCLE

For each feature in AUDIT_PROGRESS.md:

### PHASE 1: AUDIT

**This phase requires COMPLETE FILE READING. See "MANDATORY COMPLETE FILE READING" section.**

```
[ ] List ALL files involved in this feature (document file names and line counts)
[ ] Read EVERY LINE of the first file (use chunks if > 2000 lines)
[ ] Read EVERY LINE of the second file
[ ] Continue until ALL files are read completely
[ ] Trace data flow from input to output
[ ] Verify edge case handling
[ ] Identify ALL issues (see BUG CLASSIFICATION RULES above)
[ ] Count bugs found (may be 0, but only if truly nothing found after COMPLETE read)
```

**Evidence required:**
- List of files read with line counts
- Summary of what each file does
- Bugs found with exact line numbers

**DO NOT proceed to next feature unless you read EVERY LINE.**

### PHASE 2: DOCUMENT (for EVERY bug found — no exceptions)
```
[ ] Add bug to BUG_REPORT.md with format:
    - BUG-XXX: [Title]
    - Severity: CRITICAL | HIGH | MEDIUM | LOW
    - Feature: [number and name]
    - File: [path]
    - Line: [number]
    - Description: [what's wrong]
    - Expected: [correct behavior]
    - Actual: [current behavior]
    - Status: OPEN
```

**Severity Guide:**
- **CRITICAL:** Data loss, security vulnerability, complete feature failure
- **HIGH:** Feature partially broken, incorrect output in common cases
- **MEDIUM:** Feature works but wrong in specific cases, performance issues
- **LOW:** Edge cases, minor incorrect behavior, hardcoded values

**LOW is still a bug. Log it.**

### PHASE 3: FIX (for each bug, one at a time)
```
[ ] Fix the code
[ ] Verify fix compiles (npx tsc --noEmit)
[ ] Update BUG_REPORT.md:
    - Change Status: OPEN → Status: FIXED
    - Add Fix: [description of change]
    - Add Files Changed: [list of files]
[ ] Update AUDIT_PROGRESS.md:
    - Increment bugs fixed count
    - Update time spent
[ ] Commit with EXACT format:
    fix([tier].[feature]): [description] (BUG-XXX)

    - [bullet point of what changed]
    - [bullet point of what changed]
```

### PHASE 4: VERIFY BEFORE NEXT FEATURE

**STOP. Answer these questions:**

```
1. Are ALL bugs from this feature marked FIXED in BUG_REPORT.md?
2. Is AUDIT_PROGRESS.md updated with correct bug count and time?
3. Is there a git commit for each bug fix?
4. Are all files under 300 lines?
5. Did I log EVERY issue found, including "minor" ones?
```

**If ANY answer is NO → complete that step first.**
**If ALL answers are YES → proceed to next feature.**

---

## COMMIT MESSAGE FORMAT

```
fix([tier].[feature]): [brief description] (BUG-XXX)

- [specific change 1]
- [specific change 2]

Files changed:
- [path/to/file1.ts]
- [path/to/file2.ts]
```

---

## AUDIT_PROGRESS.md FORMAT

```markdown
## Tier X: [Name]

| # | Feature | Done | Bugs | Time | Session |
|---|---------|------|------|------|---------|
| X.1 | [Name] | [ ] | 0 | - | - |
```

After completing a feature:
```markdown
| X.1 | [Name] | [x] | 2 | 25m | 1 |
```

---

## BUG_REPORT.md FORMAT

Header (always at top):
```markdown
# Lattice Compositor Bug Report

## Summary
| Severity | Total | Fixed | Open |
|----------|-------|-------|------|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 0 | 0 | 0 |
| MEDIUM | 0 | 0 | 0 |
| LOW | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **0** |
```

Each bug:
```markdown
## BUG-XXX: [Title]
- **Severity:** [LEVEL]
- **Feature:** [X.X Feature Name]
- **File:** [path]
- **Line:** [number]
- **Description:** [what's wrong]
- **Expected:** [correct behavior]
- **Actual:** [current behavior]
- **Status:** OPEN | FIXED
- **Fix:** [only if FIXED - description]
- **Files Changed:** [only if FIXED - list]
- **Commit:** [only if FIXED - hash]
```

---

## BLOAT PREVENTION

When BUG_REPORT.md exceeds 300 lines:

1. Create `BUG_ARCHIVE_TIER[X].md`
2. Move all FIXED bugs from that tier to archive
3. Keep only OPEN bugs and summary table in main file
4. Add link at top: `[Tier X Fixed Bugs](./BUG_ARCHIVE_TIER1.md)`

When AUDIT_PROGRESS.md exceeds 200 lines:

1. Create `AUDIT_TIER[X].md` for completed tiers
2. Keep only current/future tiers in main file
3. Add links at top to completed tier files

---

## RESUME COMMAND

When user says "continue audit":

1. Read AUDIT_WORKFLOW.md (this file) — refresh the rules
2. Read AUDIT_PROGRESS.md
3. Find first feature marked `[ ]`
4. Check BUG_REPORT.md for any OPEN bugs in previous features
5. If OPEN bugs exist → fix them first
6. If no OPEN bugs → begin audit of next feature
7. Follow THE AUDIT CYCLE exactly

---

## FAILURE MODES TO AVOID

### Critical Failures (Audit Invalidation)
- **Pattern-matching instead of reading** — grep is not auditing
- **Reading excerpts instead of complete files** — partial reads are worthless
- **Assuming code is correct** — verify, don't assume
- **"Too complex" as an excuse** — complex code needs MORE scrutiny, not less
- **Marking features complete without full file reads** — immediate audit invalidation

### Process Failures
- Fixing bug without updating BUG_REPORT.md
- Updating BUG_REPORT.md without updating AUDIT_PROGRESS.md
- Moving to next feature with OPEN bugs
- Committing multiple bugs in one commit
- Letting any file exceed 300 lines
- Skipping the VERIFY phase
- Using vague commit messages
- Writing "minor issues found but not logged"
- Writing "code quality issues noted" without BUG entries
- Classifying functional issues as "not bugs"
- Skipping LOW severity issues

### The Incompetence Checklist
If you find yourself doing ANY of these, STOP:
- "I'll grep for the pattern and see if it exists"
- "This file is similar to the one I just read"
- "Pure functions don't have bugs"
- "Effects are simple pixel transformations"
- "I read the important parts"
- "The rest of the file is probably fine"
- "This feature is straightforward"
- "I don't need to trace the data flow"

**These are ALL shortcuts. These are ALL wrong. Read every line.**

---

## END STATE

When audit is complete:
- Every feature in AUDIT_PROGRESS.md marked [x]
- Every bug in BUG_REPORT.md marked FIXED (or archived)
- Git history contains atomic commits for each fix
- No file exceeds 300 lines
- Documentation is LLM-ready for training
- Zero issues were "noted but not logged"
