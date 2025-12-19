# SERVICE API - Audio Services

**Weyl Compositor - Audio Analysis & Reactivity Services**

---

## 2.1 audioFeatures.ts

**Purpose**: Audio analysis and feature extraction. Pre-computes all features for deterministic playback.

**Location**: `ui/src/services/audioFeatures.ts`

**Size**: ~36KB | **Lines**: ~1200

### Exports

```typescript
// Types
export interface AudioAnalysis {
  /** Sample rate of source audio */
  sampleRate: number;
  /** Frames per second for frame indexing */
  fps: number;
  /** Total frame count */
  frameCount: number;
  /** Duration in seconds */
  duration: number;
  /** Per-frame amplitude envelope [0-1] */
  amplitude: Float32Array;
  /** Per-frame RMS energy [0-1] */
  rms: Float32Array;
  /** Per-frame frequency bands */
  frequencyBands: {
    bass: Float32Array;      // 20-250Hz
    lowMid: Float32Array;    // 250-500Hz
    mid: Float32Array;       // 500-2000Hz
    highMid: Float32Array;   // 2000-4000Hz
    high: Float32Array;      // 4000-20000Hz
  };
  /** Spectral centroid per frame */
  spectralCentroid: Float32Array;
  /** Spectral flux per frame */
  spectralFlux: Float32Array;
  /** Zero crossing rate per frame */
  zeroCrossingRate: Float32Array;
  /** Spectral rolloff per frame */
  spectralRolloff: Float32Array;
  /** Spectral flatness per frame */
  spectralFlatness: Float32Array;
  /** Chroma features (12-bin pitch class) */
  chroma?: Float32Array[];
  /** Detected beat frames */
  beats: number[];
  /** Detected BPM */
  bpm: number;
  /** Onset frames */
  onsets: number[];
}

export interface FrequencyBandRanges {
  bass: [number, number];      // Default: [20, 250]
  lowMid: [number, number];    // Default: [250, 500]
  mid: [number, number];       // Default: [500, 2000]
  highMid: [number, number];   // Default: [2000, 4000]
  high: [number, number];      // Default: [4000, 20000]
}

export interface ChromaFeatures {
  frameCount: number;
  chromagram: Float32Array[];  // 12 arrays (one per pitch class)
}

export interface AudioAnalysisConfig {
  fps: number;                    // Default: 30
  fftSize: number;                // Default: 2048
  frequencyBands: FrequencyBandRanges;
  beatDetection: boolean;         // Default: true
  chromaExtraction: boolean;      // Default: false
  onsetDetection: boolean;        // Default: true
}

export interface PeakDetectionConfig {
  threshold: number;              // Minimum peak height (0-1)
  minDistance: number;            // Minimum frames between peaks
}

export interface PeakData {
  frames: number[];
  values: number[];
}

// Core loading functions
export async function loadAudioFile(file: File): Promise<AudioBuffer>;
export async function loadAudioFromUrl(url: string): Promise<AudioBuffer>;

// Main analysis function
export async function analyzeAudio(
  buffer: AudioBuffer,
  config?: Partial<AudioAnalysisConfig>
): Promise<AudioAnalysis>;

// Individual feature extractors
export function extractAmplitudeEnvelope(
  buffer: AudioBuffer,
  fps: number
): number[];

export function extractRMSEnergy(
  buffer: AudioBuffer,
  fps: number
): number[];

export function extractFrequencyBands(
  buffer: AudioBuffer,
  fps: number,
  fftSize?: number,
  ranges?: FrequencyBandRanges
): {
  bass: Float32Array;
  lowMid: Float32Array;
  mid: Float32Array;
  highMid: Float32Array;
  high: Float32Array;
};

export function extractSpectralCentroid(
  buffer: AudioBuffer,
  fps: number,
  fftSize?: number
): Float32Array;

export function detectOnsets(
  buffer: AudioBuffer,
  fps: number,
  threshold?: number,      // Default: 0.1
  fftSize?: number
): number[];

export function extractSpectralFlux(
  buffer: AudioBuffer,
  fps: number
): number[];

export function extractZeroCrossingRate(
  buffer: AudioBuffer,
  fps: number
): number[];

export function extractSpectralRolloff(
  buffer: AudioBuffer,
  fps: number,
  rolloffPercent?: number  // Default: 0.85
): number[];

export function extractSpectralFlatness(
  buffer: AudioBuffer,
  fps: number
): number[];

export function extractChromaFeatures(
  buffer: AudioBuffer,
  fps: number
): ChromaFeatures;

export function detectBPM(buffer: AudioBuffer): number;

// Frame-indexed access
export function getFeatureAtFrame(
  analysis: AudioAnalysis,
  feature: keyof AudioAnalysis | 'bass' | 'mid' | 'high',
  frame: number
): number;

export function getSmoothedFeature(
  analysis: AudioAnalysis,
  feature: string,
  frame: number,
  windowSize?: number    // Default: 3
): number;

// Feature manipulation
export function normalizeFeature(
  values: Float32Array | number[],
  min?: number,          // Default: 0
  max?: number           // Default: 1
): Float32Array;

export function applyFeatureCurve(
  values: Float32Array,
  curve: 'linear' | 'exponential' | 'logarithmic' | 'scurve',
  strength?: number      // Default: 1.0
): Float32Array;

// Peak detection
export function detectPeaks(
  values: Float32Array | number[],
  config?: Partial<PeakDetectionConfig>
): PeakData;

export function generatePeakGraph(
  peaks: PeakData,
  frameCount: number,
  smoothing?: number
): Float32Array;

// Frame queries
export function isBeatAtFrame(analysis: AudioAnalysis, frame: number): boolean;
export function isPeakAtFrame(peaks: PeakData, frame: number): boolean;
```

### Usage Example

```typescript
import { loadAudioFile, analyzeAudio, getFeatureAtFrame } from '@/services/audioFeatures';

// Load and analyze
const buffer = await loadAudioFile(audioFile);
const analysis = await analyzeAudio(buffer, { fps: 30, chromaExtraction: true });

// Get bass energy at frame 45
const bass = getFeatureAtFrame(analysis, 'bass', 45);

// Check if frame is a beat
const isBeat = isBeatAtFrame(analysis, 45);

console.log(`BPM: ${analysis.bpm}, Beats: ${analysis.beats.length}`);
```

---

## 2.2 audioReactiveMapping.ts

**Purpose**: Maps audio features to animation parameters with customizable transforms.

**Location**: `ui/src/services/audioReactiveMapping.ts`

**Size**: ~22KB

### Exports

```typescript
// Types
export type AudioFeature =
  | 'amplitude'
  | 'rms'
  | 'bass'
  | 'lowMid'
  | 'mid'
  | 'highMid'
  | 'high'
  | 'spectralCentroid'
  | 'spectralFlux'
  | 'zeroCrossingRate'
  | 'beat'
  | 'onset';

export type TargetParameter =
  | 'position.x' | 'position.y' | 'position.z'
  | 'rotation.x' | 'rotation.y' | 'rotation.z'
  | 'scale.x' | 'scale.y' | 'scale'
  | 'opacity'
  | 'blur'
  | 'brightness'
  | 'hue'
  | 'saturation';

export interface AudioMapping {
  id: string;
  name: string;
  enabled: boolean;
  feature: AudioFeature;
  target: TargetParameter;
  layerId: string;

  // Transform settings
  sensitivity: number;      // Multiplier (default: 1.0)
  offset: number;           // Added to result (default: 0)
  min: number;              // Clamp minimum
  max: number;              // Clamp maximum
  smoothing: number;        // Temporal smoothing 0-1
  invert: boolean;          // Flip direction

  // Advanced
  curve: 'linear' | 'exponential' | 'logarithmic' | 'scurve';
  threshold: number;        // Minimum feature value to trigger
  attack: number;           // Rise time in frames
  decay: number;            // Fall time in frames
}

export interface IPAdapterTransition {
  fromStyle: string;
  toStyle: string;
  startFrame: number;
  endFrame: number;
  easing: string;
}

export interface WeightSchedule {
  frameCount: number;
  weights: Float32Array[];  // Per-style weights
  styles: string[];
}

// Main class
export class AudioReactiveMapper {
  constructor();

  addMapping(mapping: AudioMapping): void;
  removeMapping(id: string): void;
  updateMapping(id: string, updates: Partial<AudioMapping>): void;
  getMapping(id: string): AudioMapping | undefined;
  getAllMappings(): AudioMapping[];
  getMappingsForLayer(layerId: string): AudioMapping[];

  // Core evaluation
  evaluate(
    analysis: AudioAnalysis,
    frame: number
  ): Map<string, Map<TargetParameter, number>>;  // layerId -> param -> value

  // Get single value
  evaluateMapping(
    mapping: AudioMapping,
    analysis: AudioAnalysis,
    frame: number
  ): number;
}

// Factory functions
export function createDefaultAudioMapping(
  feature: AudioFeature,
  target: TargetParameter,
  layerId: string
): AudioMapping;

// IP-Adapter integration (style transitions)
export function createIPAdapterSchedule(
  transitions: IPAdapterTransition[],
  frameCount: number
): WeightSchedule;

export function getIPAdapterWeightsAtFrame(
  schedule: WeightSchedule,
  frame: number
): Map<string, number>;

// Feature/target metadata
export function getFeatureDisplayName(feature: AudioFeature): string;
export function getTargetDisplayName(target: TargetParameter): string;
export function getAllFeatures(): AudioFeature[];
export function getFeaturesByCategory(): Record<string, AudioFeature[]>;
export function getAllTargets(): TargetParameter[];
export function getTargetsByCategory(): Record<string, TargetParameter[]>;

// Spline control point targets
export function createSplineControlPointTargets(
  controlPointCount: number
): TargetParameter[];
```

---

## 2.3 audioPathAnimator.ts

**Purpose**: Animates objects along paths based on audio features.

**Location**: `ui/src/services/audioPathAnimator.ts`

**Size**: ~15KB

### Exports

```typescript
export type MovementMode = 'amplitude' | 'accumulate';

export interface PathAnimatorConfig {
  pathLayerId: string;           // SplineLayer to follow
  sensitivity: number;           // Speed multiplier
  smoothing: number;             // Position smoothing
  mode: MovementMode;            // amplitude: oscillate, accumulate: progress
  audioFeature: AudioFeature;    // Which feature drives movement
  loop: boolean;                 // Loop at path end
  pingPong: boolean;             // Reverse at ends
  startOffset: number;           // Initial position on path (0-1)
}

export interface PathAnimatorState {
  currentT: number;              // Position on path (0-1)
  velocity: number;              // Current velocity
  direction: 1 | -1;             // Current direction (for pingPong)
  totalDistance: number;         // Total distance traveled
}

export class AudioPathAnimator {
  constructor(config: PathAnimatorConfig);

  setConfig(config: Partial<PathAnimatorConfig>): void;
  getConfig(): PathAnimatorConfig;
  reset(): void;

  // Core update
  update(
    analysis: AudioAnalysis,
    frame: number,
    pathLength: number
  ): PathAnimatorState;

  // Get position at frame
  getPositionAtFrame(
    analysis: AudioAnalysis,
    frame: number,
    path: Bezier[]
  ): { x: number; y: number; angle: number };
}

export function createDefaultPathAnimatorConfig(): PathAnimatorConfig;
```

---

## 2.4 audioWorkerClient.ts

**Purpose**: Web Worker client for background audio analysis.

**Location**: `ui/src/services/audioWorkerClient.ts`

**Size**: ~5KB

### Exports

```typescript
export interface AudioAnalysisProgress {
  stage: string;
  progress: number;  // 0-1
  message?: string;
}

export interface AnalyzeOptions {
  fps?: number;
  onProgress?: (progress: AudioAnalysisProgress) => void;
}

// Analyze in worker thread
export async function analyzeAudioInWorker(
  buffer: AudioBuffer,
  options?: AnalyzeOptions
): Promise<AudioAnalysis>;

export function terminateWorker(): void;
export function cancelAnalysis(): void;
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2024*
