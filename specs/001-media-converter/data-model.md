# 資料模型：媒體轉換工具箱

**功能**: 001-media-converter  
**日期**: 2025-10-31  
**版本**: 1.0.0

## 概述

本文件定義媒體轉換工具箱的核心資料結構。由於這是純前端應用，所有資料都在瀏覽器記憶體或 IndexedDB 中處理，無需後端資料庫。

---

## 實體定義

### 1. ConversionTask（轉換任務）

**用途**: 代表單次轉換操作的狀態和設定

**屬性**:

```typescript
interface ConversionTask {
  // 識別
  id: string;                    // UUID v4
  type: ConversionType;          // 'base64-to-image' | 'image-to-base64' | 'image-format' | 'gif-from-video' | 'gif-from-images'
  
  // 輸入
  input: File | string | File[]; // File 物件、Base64 字串、或多個 File
  inputFormat?: string;          // 輸入格式（MIME type 或 'base64'）
  
  // 輸出設定
  outputFormat: string;          // 'image/png' | 'image/gif' | 'base64'
  outputSettings?: OutputSettings; // GIF 參數等
  
  // 狀態
  status: TaskStatus;            // 'pending' | 'processing' | 'completed' | 'failed'
  progress: number;              // 0-100
  
  // 結果
  result?: Blob | string;        // 轉換結果（Blob 或 Base64 字串）
  resultSize?: number;           // 結果檔案大小（bytes）
  
  // 錯誤
  error?: ConversionError;       // 錯誤資訊
  
  // 時間戳記
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

type ConversionType = 
  | 'base64-to-image'   // Base64 → PNG
  | 'image-to-base64'   // Image → Base64
  | 'image-format'      // WebP/HEIC/SVG → PNG
  | 'gif-from-video'    // Video → GIF
  | 'gif-from-images';  // Images → GIF

type TaskStatus = 
  | 'pending'      // 等待處理
  | 'processing'   // 處理中
  | 'completed'    // 完成
  | 'failed';      // 失敗
```

**驗證規則**:
- `id` 必須唯一
- `type` 必須為定義的類型之一
- `progress` 範圍 0-100
- `status` 為 'completed' 時必須有 `result`
- `status` 為 'failed' 時必須有 `error`

**生命週期**:
```
pending → processing → completed
                    → failed
```

**IndexedDB 儲存**: 
- Store 名稱: `conversionTasks`
- Key: `id`
- Indexes: `status`, `type`, `createdAt`

---

### 2. ImageFile（圖片檔案）

**用途**: 代表輸入或輸出的圖片資料

**屬性**:

```typescript
interface ImageFile {
  // 基本資訊
  file: File | Blob;             // 原始檔案物件
  name: string;                  // 檔案名稱
  format: string;                // MIME type (e.g., 'image/png')
  size: number;                  // 檔案大小（bytes）
  
  // 圖片屬性
  width: number;                 // 寬度（pixels）
  height: number;                // 高度（pixels）
  aspectRatio: number;           // 寬高比（width / height）
  
  // 預覽
  previewUrl?: string;           // ObjectURL 用於預覽
  thumbnail?: string;            // Base64 縮圖（用於列表顯示）
  
  // 元資料
  lastModified: Date;            // 檔案最後修改時間
  exifData?: Record<string, any>; // EXIF 資料（HEIC/JPEG 可能有）
}
```

**驗證規則**:
- `size` 必須 <= 50MB（圖片限制）
- `format` 必須為支援的格式：
  - 輸入: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/heic`, `image/svg+xml`
  - 輸出: `image/png`, `image/gif`
- `width` 和 `height` 必須 > 0

**輔助方法**:
```javascript
// 產生預覽 URL
static createPreviewUrl(file: File): string;

// 讀取圖片尺寸
static async getDimensions(file: File): Promise<{width, height}>;

// 產生縮圖
static async createThumbnail(file: File, maxSize: number): Promise<string>;
```

---

### 3. VideoFile（影片檔案）

**用途**: 代表輸入的影片資料（用於 GIF 製作）

**屬性**:

```typescript
interface VideoFile {
  // 基本資訊
  file: File;                    // 原始檔案
  name: string;                  // 檔案名稱
  format: string;                // MIME type (e.g., 'video/mp4')
  size: number;                  // 檔案大小（bytes）
  
  // 影片屬性
  duration: number;              // 時長（秒）
  width: number;                 // 寬度
  height: number;                // 高度
  frameRate: number;             // 幀率（fps）
  
  // 預覽
  videoElement?: HTMLVideoElement; // Video 元素（用於播放預覽）
  posterUrl?: string;            // 封面圖 URL
  
  // 元資料
  codec?: string;                // 編碼格式
  bitrate?: number;              // 位元率
}
```

**驗證規則**:
- `size` 必須 <= 100MB（影片限制）
- `format` 必須為: `video/mp4`, `video/quicktime` (.mov), `video/webm`
- `duration` 必須 > 0 且 <= 300 秒（5 分鐘）

**輔助方法**:
```javascript
// 載入影片元資料
static async loadMetadata(file: File): Promise<VideoFile>;

// 擷取影格
static async captureFrame(video: HTMLVideoElement, time: number): Promise<Blob>;

// 產生封面
static async generatePoster(file: File): Promise<string>;
```

---

### 4. GifParameters（GIF 參數）

**用途**: GIF 產生的設定參數

**屬性**:

```typescript
interface GifParameters {
  // 影格設定
  frameRate: number;             // 幀率（fps），1-30
  frameDelay: number;            // 每幀延遲（ms），計算自 frameRate
  
  // 尺寸設定
  width: number;                 // 輸出寬度
  height: number;                // 輸出高度
  maintainAspectRatio: boolean;  // 保持原始比例
  
  // 品質設定
  quality: number;               // 品質等級，1-30（10=高品質）
  
  // 動畫設定
  repeat: number;                // 循環次數，0=無限循環
  
  // 時間範圍（僅影片轉 GIF）
  startTime?: number;            // 開始時間（秒）
  endTime?: number;              // 結束時間（秒）
}
```

**預設值**:
```javascript
const DEFAULT_GIF_PARAMS: GifParameters = {
  frameRate: 10,
  frameDelay: 100,               // 1000 / 10
  width: 0,                      // 0 = 使用原始尺寸的 80%
  height: 0,
  maintainAspectRatio: true,
  quality: 10,
  repeat: 0,                     // 無限循環
};
```

**驗證規則**:
- `frameRate` 範圍 1-30
- `quality` 範圍 1-30
- `repeat` >= 0
- `startTime` < `endTime`（如果都有設定）

**計算方法**:
```javascript
// 根據幀率計算延遲
static calculateDelay(frameRate: number): number {
  return Math.round(1000 / frameRate);
}

// 計算輸出尺寸（保持比例）
static calculateDimensions(
  sourceWidth: number, 
  sourceHeight: number, 
  targetScale: number = 0.8
): {width, height} {
  return {
    width: Math.round(sourceWidth * targetScale),
    height: Math.round(sourceHeight * targetScale)
  };
}

// 估算 GIF 檔案大小
static estimateFileSize(
  width: number, 
  height: number, 
  frameCount: number, 
  quality: number
): number {
  // 經驗公式：每影格約 width * height * 0.5 bytes
  // quality 越低檔案越小
  const bytesPerFrame = (width * height * 0.5) * (quality / 10);
  return Math.round(frameCount * bytesPerFrame);
}
```

---

### 5. Base64Data（Base64 資料）

**用途**: Base64 編碼字串及其元資料

**屬性**:

```typescript
interface Base64Data {
  // Base64 字串
  data: string;                  // 完整 Base64 字串（含或不含 data URI prefix）
  pure: string;                  // 純 Base64（移除 data URI prefix）
  
  // 格式資訊
  mimeType: string;              // 圖片格式（從 data URI 解析或預設 'image/png'）
  
  // 統計
  length: number;                // 字串長度
  estimatedSize: number;         // 估算二進位大小（bytes）
  
  // 驗證
  isValid: boolean;              // 是否為有效 Base64
}
```

**靜態方法**:
```javascript
class Base64Data {
  // 解析 Base64 字串
  static parse(input: string): Base64Data {
    const dataUriRegex = /^data:([^;]+);base64,(.+)$/;
    const match = input.match(dataUriRegex);
    
    if (match) {
      // 含 data URI prefix
      return {
        data: input,
        pure: match[2],
        mimeType: match[1],
        length: match[2].length,
        estimatedSize: Math.ceil(match[2].length * 0.75),
        isValid: this.validate(match[2])
      };
    } else {
      // 純 Base64
      return {
        data: input,
        pure: input,
        mimeType: 'image/png',     // 預設
        length: input.length,
        estimatedSize: Math.ceil(input.length * 0.75),
        isValid: this.validate(input)
      };
    }
  }
  
  // 驗證 Base64 格式
  static validate(base64: string): boolean {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64.trim());
  }
  
  // 轉換為 Blob
  static toBlob(base64Data: Base64Data): Blob {
    const binary = atob(base64Data.pure);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: base64Data.mimeType });
  }
  
  // 從 Blob 建立
  static async fromBlob(blob: Blob): Promise<Base64Data> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(this.parse(result));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
```

**驗證規則**:
- `pure` 必須符合 Base64 正規表達式
- `estimatedSize` 必須 <= 50MB

---

### 6. ConversionError（轉換錯誤）

**用途**: 統一的錯誤資訊結構

**屬性**:

```typescript
interface ConversionError {
  code: ErrorCode;               // 錯誤代碼
  message: string;               // 繁體中文錯誤訊息
  details?: string;              // 詳細資訊（開發用）
  timestamp: Date;               // 發生時間
  recoverable: boolean;          // 是否可恢復（重試）
}

type ErrorCode =
  | 'INVALID_INPUT'              // 無效輸入
  | 'INVALID_BASE64'             // 無效 Base64 格式
  | 'FILE_TOO_LARGE'             // 檔案過大
  | 'UNSUPPORTED_FORMAT'         // 不支援的格式
  | 'CONVERSION_FAILED'          // 轉換失敗
  | 'MEMORY_ERROR'               // 記憶體不足
  | 'BROWSER_NOT_SUPPORTED'      // 瀏覽器不支援
  | 'WORKER_ERROR'               // Worker 執行錯誤
  | 'STORAGE_ERROR';             // 儲存錯誤
```

**錯誤訊息映射**:
```javascript
const ERROR_MESSAGES = {
  INVALID_INPUT: '輸入資料無效，請檢查後重試',
  INVALID_BASE64: '無效的 Base64 格式，請確認輸入內容正確',
  FILE_TOO_LARGE: '檔案過大（限制 {limit}MB），請選擇較小的檔案',
  UNSUPPORTED_FORMAT: '不支援的檔案格式：{format}',
  CONVERSION_FAILED: '轉換失敗：{reason}',
  MEMORY_ERROR: '記憶體不足，請關閉其他分頁或減少檔案大小',
  BROWSER_NOT_SUPPORTED: '您的瀏覽器版本過舊，請更新至最新版本',
  WORKER_ERROR: '背景處理發生錯誤，請重試',
  STORAGE_ERROR: '儲存資料時發生錯誤'
};
```

---

## 關係圖

```
ConversionTask
  ├─ input: ImageFile | VideoFile | Base64Data | ImageFile[]
  ├─ outputSettings?: GifParameters
  ├─ result?: ImageFile | Base64Data
  └─ error?: ConversionError

ImageFile
  └─ (獨立實體，可在多個 Task 中使用)

VideoFile
  └─ (獨立實體，僅用於 gif-from-video)

GifParameters
  └─ (設定物件，嵌入 ConversionTask)

Base64Data
  └─ (獨立實體，可轉換為 ImageFile)

ConversionError
  └─ (嵌入 ConversionTask)
```

---

## IndexedDB Schema

```javascript
// 資料庫名稱: ImageToolsDB
// 版本: 1

const dbSchema = {
  name: 'ImageToolsDB',
  version: 1,
  stores: [
    {
      name: 'conversionTasks',
      keyPath: 'id',
      indexes: [
        { name: 'status', keyPath: 'status' },
        { name: 'type', keyPath: 'type' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },
    {
      name: 'cachedFiles',
      keyPath: 'id',
      indexes: [
        { name: 'name', keyPath: 'name' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    }
  ]
};
```

---

## localStorage Schema

```javascript
// 使用者偏好設定
const preferences = {
  // GIF 預設參數
  defaultGifParams: GifParameters,
  
  // UI 設定
  theme: 'light' | 'dark',
  language: 'zh-TW',
  
  // 功能設定
  autoSaveResults: boolean,
  showFileSize: boolean,
  
  // 最後更新時間
  lastUpdated: string  // ISO 8601
};

// Key: 'imagetools_preferences'
```

---

## 驗證摘要

所有實體都包含完整的驗證規則，確保：

1. **資料完整性**: 必要欄位都存在
2. **型別正確性**: 欄位型別符合定義
3. **業務規則**: 符合功能需求（檔案大小限制等）
4. **關係完整性**: 參照的實體存在且有效

實作時將在 `src/utils/validators.js` 中提供驗證函式。
