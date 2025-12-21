# SERVICE API - Asset & Storage Services

**Weyl Compositor - Font Loading and Asset Management Services**

---

## 9.1 fontService.ts

**Purpose**: Font loading and management.

**Location**: `ui/src/services/fontService.ts`

**Size**: ~8KB

### Exports

```typescript
export interface FontInfo {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  url?: string;
  loaded: boolean;
}

export interface FontCategory {
  name: string;
  fonts: string[];
}

class FontService {
  constructor();

  // Loading
  loadFont(family: string, url?: string): Promise<void>;
  loadGoogleFont(family: string, weights?: number[]): Promise<void>;

  // Font queries
  isLoaded(family: string): boolean;
  getLoadedFonts(): FontInfo[];
  getSystemFonts(): string[];

  // Categories
  getCategories(): FontCategory[];
  getFontsByCategory(category: string): string[];

  // Font measurement
  measureText(
    text: string,
    family: string,
    size: number,
    weight?: number
  ): { width: number; height: number };

  getCharacterWidths(
    text: string,
    family: string,
    size: number
  ): number[];
}

// Singleton
export const fontService: FontService;
```

### Font Categories

```typescript
const categories: FontCategory[] = [
  { name: 'Sans Serif', fonts: ['Inter', 'Roboto', 'Open Sans', 'Lato'] },
  { name: 'Serif', fonts: ['Playfair Display', 'Merriweather', 'Lora'] },
  { name: 'Monospace', fonts: ['JetBrains Mono', 'Fira Code', 'Source Code Pro'] },
  { name: 'Display', fonts: ['Oswald', 'Bebas Neue', 'Anton'] },
  { name: 'Handwriting', fonts: ['Dancing Script', 'Pacifico', 'Caveat'] }
];
```

### Usage Example

```typescript
import { fontService } from '@/services/fontService';

// Load Google Font
await fontService.loadGoogleFont('Roboto', [400, 700]);

// Check if loaded
if (fontService.isLoaded('Roboto')) {
  // Measure text
  const { width, height } = fontService.measureText('Hello', 'Roboto', 24);

  // Get per-character widths (for text on path)
  const widths = fontService.getCharacterWidths('Hello', 'Roboto', 24);
}
```

---

## 9.2 lazyLoader.ts

**Purpose**: Lazy loading for assets and modules.

**Location**: `ui/src/services/lazyLoader.ts`

**Size**: ~5KB

### Exports

```typescript
class LazyLoader {
  constructor();

  // Image loading
  loadImage(url: string): Promise<HTMLImageElement>;
  preloadImages(urls: string[]): Promise<void>;

  // Module loading
  loadModule<T>(path: string): Promise<T>;

  // Asset loading with caching
  loadAsset<T>(
    key: string,
    loader: () => Promise<T>
  ): Promise<T>;

  // Cache management
  isLoaded(key: string): boolean;
  unload(key: string): void;
  clear(): void;

  getStats(): {
    loaded: number;
    pending: number;
    failed: number;
  };
}

// Singleton
export const lazyLoader: LazyLoader;
```

### Usage Example

```typescript
import { lazyLoader } from '@/services/lazyLoader';

// Load image with caching
const image = await lazyLoader.loadImage('/textures/particle.png');

// Preload multiple images
await lazyLoader.preloadImages([
  '/textures/smoke.png',
  '/textures/fire.png',
  '/textures/spark.png'
]);

// Custom asset loading
const audioData = await lazyLoader.loadAsset('audio:track1', async () => {
  const response = await fetch('/audio/track1.mp3');
  return await response.arrayBuffer();
});

// Check stats
console.log(lazyLoader.getStats());
// { loaded: 5, pending: 0, failed: 0 }
```

---

## Asset Types Supported

| Asset Type | Service | Formats |
|------------|---------|---------|
| **Fonts** | `fontService` | TTF, OTF, WOFF, WOFF2 |
| **Images** | `lazyLoader` | PNG, JPG, WebP, GIF |
| **Audio** | `audioFeatures` | MP3, WAV, OGG, AAC |
| **Video** | `VideoLayer` | MP4, WebM |
| **3D Models** | `ModelLayer` | GLTF, GLB, OBJ |
| **Sprite Sheets** | `spriteSheetService` | PNG (atlas) |

---

## Memory Management

Both services implement memory-conscious patterns:

```typescript
// Font Service
// - Tracks loaded state to prevent duplicate loads
// - Uses browser's FontFace API for efficient loading

// Lazy Loader
// - LRU-style cache eviction
// - Reference counting for shared assets
// - Explicit unload() for manual cleanup
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2025*
