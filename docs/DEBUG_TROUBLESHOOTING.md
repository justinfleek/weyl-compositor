# DEBUG & TROUBLESHOOTING GUIDE

**Weyl Compositor - Common Issues and Solutions**

**HYPER-CRITICAL FOR HANDOFF**: This document helps diagnose and fix common issues quickly.

---

## Quick Diagnosis Flowchart

```
Issue?
  │
  ├─▶ UI not responding ──▶ Check console for errors
  │                        └──▶ Check if infinite loop in useEffect/watch
  │
  ├─▶ Animation not playing ──▶ Check playbackStore.isPlaying
  │                           └──▶ Check layer inPoint/outPoint
  │
  ├─▶ Rendering issues ──▶ Check ThreeCanvas initialization
  │                      └──▶ Check WebGL context status
  │
  ├─▶ Non-deterministic output ──▶ Check for Math.random() usage
  │                              └──▶ Check Date.now() usage
  │                              └──▶ Check particle seed consistency
  │
  └─▶ Performance issues ──▶ Check frameCache hit rate
                          └──▶ Check effect stack complexity
```

---

## Common Issues & Solutions

### 1. Animation Not Playing

**Symptoms**: Clicking play does nothing, timeline doesn't advance

**Diagnosis**:
```typescript
// In browser console:
const store = useCompositorStore();
console.log('isPlaying:', store.isPlaying);
console.log('currentFrame:', store.currentFrame);
console.log('activeComposition:', store.activeComposition);
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| No active composition | Ensure `activeCompositionId` is set |
| Frame at end | Check `currentFrame < frameCount` |
| Playback store not initialized | Call `playbackStore.initialize()` |
| RequestAnimationFrame not running | Check browser tab is focused |

**Code Fix**:
```typescript
// In TimelinePanel.vue - ensure playback loop runs
watch(() => playbackStore.isPlaying, (playing) => {
  if (playing) {
    requestAnimationFrame(playbackLoop);
  }
});
```

---

### 2. Layer Not Visible

**Symptoms**: Layer exists in project but doesn't render

**Diagnosis**:
```typescript
const layer = store.getLayer(layerId);
console.log('visible:', layer.visible);
console.log('inPoint:', layer.inPoint, 'outPoint:', layer.outPoint);
console.log('currentFrame:', store.currentFrame);
console.log('opacity:', interpolateProperty(layer.opacity, store.currentFrame));
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Layer not visible | Set `layer.visible = true` |
| Frame outside range | Check `currentFrame` is between inPoint/outPoint |
| Opacity is 0 | Check opacity keyframes |
| Behind other layers | Check layer order in composition |
| Off-screen position | Check transform.position values |

---

### 3. Particle System Non-Deterministic

**Symptoms**: Scrubbing produces different particle positions

**Diagnosis**:
```typescript
const system = new ParticleSystem({ seed: 12345 });

// Evaluate frame 60 twice
system.reset();
const first = system.evaluate(60);
system.reset();
const second = system.evaluate(60);

console.log('Same?', JSON.stringify(first) === JSON.stringify(second));
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Using Math.random() | Replace with SeededRandom |
| Missing checkpoint | Ensure checkpoints every 30 frames |
| Date.now() in simulation | Remove time-dependent code |
| Async operations in evaluate | Make evaluation synchronous |

**Code Fix**:
```typescript
// WRONG - non-deterministic
const spread = Math.random() * 360;

// CORRECT - deterministic
const rng = new SeededRandom(particleSeed + frame);
const spread = rng.next() * 360;
```

---

### 4. WebGL Context Lost

**Symptoms**: Canvas goes black, "WebGL context lost" in console

**Diagnosis**:
```typescript
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
console.log('Context lost:', gl.isContextLost());
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Too many contexts | Dispose unused renderers |
| GPU memory exhausted | Reduce texture sizes, clear caches |
| Browser throttling | Avoid excessive draw calls |
| Extension not supported | Check gpuDetection.ts tier |

**Code Fix**:
```typescript
// Add context loss handling
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.error('WebGL context lost - attempting recovery');
  // Pause rendering, clear caches
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Reinitialize renderer
});
```

---

### 5. Audio Analysis Fails

**Symptoms**: `analyzeAudio()` returns undefined or throws

**Diagnosis**:
```typescript
try {
  const buffer = await loadAudioFile(file);
  console.log('Buffer duration:', buffer.duration);
  console.log('Sample rate:', buffer.sampleRate);
  console.log('Channels:', buffer.numberOfChannels);
} catch (e) {
  console.error('Load failed:', e);
}
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Invalid audio file | Check file format (MP3, WAV, OGG) |
| File too large | Process in chunks |
| CORS issue | Ensure same-origin or CORS headers |
| AudioContext suspended | Call `audioContext.resume()` |

**Code Fix**:
```typescript
// Ensure AudioContext is running
const ctx = new AudioContext();
if (ctx.state === 'suspended') {
  await ctx.resume();
}
```

---

### 6. Keyframe Interpolation Wrong

**Symptoms**: Values jump instead of smoothly interpolating

**Diagnosis**:
```typescript
const prop = layer.transform.position;
console.log('Keyframes:', prop.keyframes);
console.log('Animated:', prop.animated);

for (let f = 0; f <= 30; f++) {
  console.log(`Frame ${f}:`, interpolateProperty(prop, f));
}
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| `animated: false` | Set `animated: true` when keyframes exist |
| Missing keyframes | Ensure at least 2 keyframes |
| Wrong interpolation type | Check `keyframe.interpolation` |
| Bezier handles inverted | Verify handle directions |

---

### 7. Effect Not Rendering

**Symptoms**: Effect in stack but no visual change

**Diagnosis**:
```typescript
const effects = layer.effects;
console.log('Effects:', effects.map(e => ({ key: e.effectKey, enabled: e.enabled })));

const evaluated = evaluateEffectParameters(effects[0], currentFrame);
console.log('Evaluated params:', evaluated);
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Effect disabled | Check `effect.enabled === true` |
| Parameters at zero | Check intensity/amount values |
| Wrong effect order | Effects apply top-to-bottom |
| Canvas not compatible | Check effect supports layer type |

---

### 8. History/Undo Not Working

**Symptoms**: Ctrl+Z does nothing, history empty

**Diagnosis**:
```typescript
const history = useHistoryStore();
console.log('Stack size:', history.undoStack.length);
console.log('Can undo:', history.canUndo);
console.log('Last action:', history.undoStack[history.undoStack.length - 1]?.description);
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Actions not pushed | Ensure `history.push()` called |
| Max stack size reached | Check `MAX_HISTORY_SIZE` |
| State cloning failed | Check for circular references |

---

### 9. Performance Slow (< 30 FPS)

**Symptoms**: Timeline scrubbing laggy, UI unresponsive

**Diagnosis**:
```typescript
// Check cache performance
const stats = getEvaluationCacheStats();
console.log('Cache stats:', stats);

// Profile render time
console.time('render');
engine.render(currentFrame);
console.timeEnd('render');
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Cache misses | Increase cache size |
| Too many layers | Precomp heavy layers |
| Complex effects | Reduce effect quality |
| Large textures | Resize source images |
| Particle count | Reduce maxParticles |

**Performance Optimization Checklist**:
- [ ] Frame cache enabled and sized appropriately
- [ ] Layer evaluation cache working
- [ ] Effects using GPU acceleration
- [ ] Textures are power-of-2 dimensions
- [ ] Unused layers hidden or removed

---

### 10. Export Fails

**Symptoms**: "Export failed" error, incomplete output

**Diagnosis**:
```typescript
const validation = matteExporter.validateDimensions(width, height);
console.log('Dimension valid:', validation.valid);
console.log('Adjusted:', validation.adjustedWidth, validation.adjustedHeight);
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Dimensions not divisible by 8 | Round to nearest 8 |
| Out of memory | Export in smaller chunks |
| Invalid format | Check format is 'png'/'webp'/'jpeg' |
| CORS on assets | Ensure all assets same-origin |

---

## Debug Utilities

### Console Helpers

Add to browser console for debugging:

```typescript
// Expose stores globally
window.debug = {
  compositor: useCompositorStore(),
  playback: usePlaybackStore(),
  selection: useSelectionStore(),
  history: useHistoryStore(),

  // Quick layer lookup
  layer: (id) => useCompositorStore().getLayer(id),

  // Evaluate property at frame
  eval: (prop, frame) => interpolateProperty(prop, frame),

  // Get cache stats
  cacheStats: () => ({
    frame: getFrameCache().getStats(),
    layer: getEvaluationCacheStats()
  }),

  // Force re-render
  rerender: () => {
    useCompositorStore().markAllDirty();
    useCompositorStore().requestRender();
  }
};
```

### Vue DevTools

1. Install Vue DevTools browser extension
2. Open DevTools → Vue tab
3. Inspect Pinia stores for state
4. Use timeline to track mutations

### Performance Profiling

```typescript
// Wrap slow operations
const profiledEvaluate = (frame) => {
  performance.mark('eval-start');
  const result = engine.evaluate(frame);
  performance.mark('eval-end');
  performance.measure('evaluate', 'eval-start', 'eval-end');
  return result;
};
```

---

## Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cannot read property 'keyframes' of undefined` | Property doesn't exist on layer | Check property path |
| `Maximum call stack size exceeded` | Infinite recursion | Check for circular deps in drivers |
| `WebGL: INVALID_OPERATION` | GPU state error | Reset WebGL state before draw |
| `Failed to decode audio data` | Corrupt/unsupported audio | Try different format |
| `Cannot freeze` | Object already frozen | Check for double-freeze |

---

## Logging Levels

Set via environment variable or localStorage:

```typescript
// In code
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Set level
localStorage.setItem('WEYL_LOG_LEVEL', '3'); // DEBUG

// Usage
if (LOG_LEVEL >= LOG_LEVELS.DEBUG) {
  console.log('[DEBUG] Evaluating frame:', frame);
}
```

---

**See also**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [TEST_COVERAGE_MAP.md](./TEST_COVERAGE_MAP.md) - Test information
- [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) - Service APIs

*Generated: December 19, 2024*
