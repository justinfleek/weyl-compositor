# SPEC 07: BUILD & TEST

**Last Updated:** December 23, 2025

---

## Build System Overview

| Component | Technology | Status |
|-----------|------------|--------|
| Build Tool | Vite 5.x | ✅ Complete |
| Language | TypeScript 5.x | ✅ Complete |
| Framework | Vue 3.5 | ✅ Complete |
| 3D Engine | Three.js r170 | ✅ Complete |
| State | Pinia 2.2 | ✅ Complete |
| Testing | Vitest | ✅ Complete |
| Package Manager | npm | ✅ Complete |

---

## Build Commands

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Development server (hot reload)
npm run dev
# Opens at http://localhost:5173

# Production build
npm run build
# Outputs to: ../web/js/

# Type check
npx tsc --noEmit

# Run tests
npm test

# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test
npm test -- audioFeatures.test.ts
```

---

## Build Output

```
web/js/
├── extension.js              # ComfyUI sidebar registration
├── weyl-compositor.js        # Main app bundle (~2.2MB)
├── weyl-compositor.css       # Styles (~240KB)
├── weyl-three-vendor.js      # Three.js chunk (~2.4MB)
├── weyl-vue-vendor.js        # Vue chunk (~210KB)
├── weyl-ui-vendor.js         # PrimeVue chunk
├── weyl-export-vendor.js     # Export libraries
└── worker-*.js               # Web Workers
```

---

## Test Suite

### Metrics

| Metric | Value |
|--------|-------|
| Test Framework | Vitest |
| Test Files | 48 |
| Total Tests | 1786 |
| Passing | 1777 |
| Skipped | 9 |
| Pass Rate | 99.5% |

### Test Categories

| Category | Files | Description |
|----------|-------|-------------|
| Engine | 7 | Core evaluation, determinism |
| Integration | 4 | End-to-end workflows |
| Services | 34 | Business logic |
| Stores | 3 | State management |

### Key Test Files

| File | Purpose |
|------|---------|
| `MotionEngine.test.ts` | Deterministic frame evaluation |
| `ScrubDeterminism.test.ts` | Scrub order independence |
| `particleSystem.test.ts` | Particle checkpoint system |
| `audioFeatures.test.ts` | Audio analysis (FFT, BPM) |
| `interpolation.test.ts` | Keyframe interpolation |
| `expressions.test.ts` | Expression language |

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vue | 3.5.x | UI framework |
| pinia | 2.2.x | State management |
| three | r170 | 3D rendering |
| primevue | 4.2.x | UI components |
| troika-three-text | 0.52.x | 3D text |
| simplex-noise | 4.0.x | Procedural noise |
| mp4-muxer | 5.2.x | Video export |
| jszip | 3.10.x | ZIP creation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vite | 5.x | Build tool |
| vitest | 1.x | Testing |
| typescript | 5.x | Type checking |
| @vitejs/plugin-vue | 5.x | Vue plugin |

---

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Initial load | <3s | ~2s |
| Frame render (1080p) | <16ms | ~8ms |
| Particle sim (10k) | <16ms | ~6ms |
| Build time | <30s | ~28s |
| Test suite | <60s | ~28s |

---

## Environment Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.x | 20.x |
| Browser | Chrome 94+ | Chrome 120+ |
| GPU | WebGL 2.0 | WebGPU |
| RAM | 4GB | 8GB |

---

## Verification Checklist

### Build Verification
- [x] `npm run build` completes without errors
- [x] Output files generated in web/js/
- [x] No TypeScript errors (`npx tsc --noEmit`)
- [x] Bundle sizes within limits

### Test Verification
- [x] All 48 test files pass
- [x] 1777/1786 tests passing (99.5%)
- [x] No flaky tests
- [x] Determinism tests pass

### Runtime Verification
- [x] App loads in browser
- [x] No console errors
- [x] GPU tier detected correctly
- [x] All panels render

---

*Generated: December 23, 2025*
