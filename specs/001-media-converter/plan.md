# 實作計畫：媒體轉換工具箱

**Branch**: `001-media-converter` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-media-converter/spec.md`

## Summary

建立一個純前端網頁應用程式，提供 Base64 與圖片互轉、圖片格式轉換（WebP/HEIC/SVG → PNG）、以及 GIF 動畫製作（影片/圖片轉 GIF）功能。所有處理完全在瀏覽器本地端執行，不上傳任何檔案至伺服器，確保使用者隱私。技術架構採用 Vite 建置工具，以原生 HTML、CSS、JavaScript 為主，使用 Canvas API 和 Web Workers 處理圖片轉換，資料暫存於 localStorage 或 IndexedDB。

## Technical Context

**Language/Version**: JavaScript (ES2020+) / HTML5 / CSS3  
**Primary Dependencies**: 
- Vite 5.x (建置工具)
- heic2any (HEIC 解碼)
- gif.js (GIF 編碼)
**Storage**: IndexedDB（檔案暫存）、localStorage（設定儲存）  
**Testing**: Vitest（單元測試）、Playwright（E2E 測試）  
**Target Platform**: 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）  
**Project Type**: Web（單一專案，純前端）  
**Performance Goals**: 
- Base64 轉換 < 2 秒（5MB 檔案）
- 圖片格式轉換 < 5 秒（10MB 檔案）
- 影片轉 GIF < 30 秒（10 秒影片）
**Constraints**: 
- 完全本地處理，無後端依賴
- 支援 50MB 圖片、100MB 影片
- 記憶體使用 < 500MB
- 離線可用（PWA）
**Scale/Scope**: 
- 單人使用工具
- 3 個主要功能模組
- 約 2000 行程式碼（預估）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ 一、MVP 優先
- **符合**: 使用者故事已按 P1（Base64 轉換）、P2（格式轉換）、P3（GIF 製作）排序
- **符合**: P1 為最小可行產品，可獨立交付價值
- **符合**: 無過度設計，功能聚焦核心需求

### ✅ 二、可測試性
- **符合**: 每個使用者故事都有明確驗收場景
- **計畫**: 將為每個模組建立合約測試（Canvas API、File API、IndexedDB 介面）
- **計畫**: 將建立整合測試涵蓋完整轉換流程

### ✅ 三、高品質標準
- **符合**: 規格中明確定義 7 個邊界情況
- **計畫**: 將使用 ESLint + Prettier 確保程式碼風格一致
- **計畫**: 每個模組將包含 JSDoc 註解（繁體中文）

### ✅ 四、簡約原則
- **符合**: 優先使用原生 JavaScript 和瀏覽器 API
- **符合**: 僅引入兩個必要函式庫（heic2any, gif.js）
- **符合**: 無複雜框架，無過度抽象

### ✅ 五、繁體中文優先
- **符合**: 所有文件使用繁體中文
- **符合**: UI 介面和錯誤訊息使用繁體中文
- **計畫**: 程式碼註解使用繁體中文，變數名稱使用英文

**結論**: ✅ 通過所有憲章檢查，可進入 Phase 0 研究階段

## Project Structure

### Documentation (this feature)

```text
specs/001-media-converter/
├── plan.md              # 本檔案（實作計畫）
├── spec.md              # 功能規格
├── research.md          # Phase 0 研究成果
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速開始指南
├── contracts/           # Phase 1 模組介面合約
│   ├── converter-api.md
│   ├── storage-api.md
│   └── worker-api.md
├── checklists/          # 品質檢查清單
│   └── requirements.md
└── tasks.md             # Phase 2 任務清單（/speckit.tasks 產生）
```

### Source Code (repository root)

```text
imagetools/
├── index.html           # 主要 HTML 檔案
├── vite.config.js       # Vite 建置設定
├── package.json         # 專案相依性
├── .eslintrc.js         # ESLint 設定
├── .prettierrc          # Prettier 設定
│
├── src/
│   ├── main.js          # 應用程式進入點
│   ├── styles/
│   │   ├── reset.css    # CSS Reset
│   │   ├── variables.css # CSS 變數（主題、顏色）
│   │   ├── layout.css   # 版面配置
│   │   └── components.css # 元件樣式
│   │
│   ├── components/      # UI 元件
│   │   ├── FileUploader.js     # 檔案上傳元件
│   │   ├── Base64Input.js      # Base64 輸入元件
│   │   ├── ImagePreview.js     # 圖片預覽元件
│   │   ├── ProgressBar.js      # 進度條元件
│   │   ├── ErrorMessage.js     # 錯誤訊息元件
│   │   └── DownloadButton.js   # 下載按鈕元件
│   │
│   ├── services/        # 業務邏輯服務
│   │   ├── base64Converter.js  # Base64 轉換服務
│   │   ├── imageConverter.js   # 圖片格式轉換服務
│   │   ├── gifMaker.js         # GIF 製作服務
│   │   ├── fileValidator.js    # 檔案驗證服務
│   │   └── storageService.js   # IndexedDB 儲存服務
│   │
│   ├── workers/         # Web Workers
│   │   ├── imageProcessor.worker.js  # 圖片處理 Worker
│   │   └── gifEncoder.worker.js      # GIF 編碼 Worker
│   │
│   ├── utils/           # 工具函式
│   │   ├── fileHelpers.js      # 檔案處理輔助函式
│   │   ├── canvasHelpers.js    # Canvas 操作輔助函式
│   │   ├── validators.js       # 驗證函式
│   │   └── formatters.js       # 格式化函式
│   │
│   └── constants/       # 常數定義
│       ├── fileTypes.js        # 支援的檔案類型
│       ├── limits.js           # 檔案大小限制
│       └── messages.js         # 錯誤訊息（繁體中文）
│
├── tests/
│   ├── contract/        # 合約測試
│   │   ├── base64Converter.test.js
│   │   ├── imageConverter.test.js
│   │   ├── gifMaker.test.js
│   │   └── storageService.test.js
│   │
│   ├── integration/     # 整合測試
│   │   ├── base64Flow.test.js
│   │   ├── imageConversionFlow.test.js
│   │   └── gifCreationFlow.test.js
│   │
│   └── e2e/            # E2E 測試（Playwright）
│       ├── base64.spec.js
│       ├── imageConversion.spec.js
│       └── gifCreation.spec.js
│
├── public/             # 靜態資源
│   ├── favicon.ico
│   └── manifest.json   # PWA manifest
│
└── dist/               # 建置輸出（Vite 產生）
```

**Structure Decision**: 

選擇單一 Web 專案結構，理由如下：

1. **純前端應用**: 所有功能在瀏覽器端執行，無需後端
2. **簡約原則**: 單一專案結構最簡單，符合憲章「簡約原則」
3. **Vite 最佳實務**: Vite 專案標準結構，src/ 放原始碼，public/ 放靜態資源
4. **關注點分離**: 
   - `components/` - UI 元件
   - `services/` - 業務邏輯（可獨立測試）
   - `workers/` - 耗時處理（避免阻塞主執行緒）
   - `utils/` - 純函式工具
5. **測試友善**: 清楚的 tests/ 結構，對應三層測試策略

## Complexity Tracking

> 無憲章違規，此區塊不適用

---

## Phase 0: Research

**Status**: ✅ Completed

### Research Documents

**[research.md](./research.md)**: 技術選型研究

完成 10 項技術決策，包含：

1. **建置工具**: Vite 5.x（快速開發、零設定 Worker、最佳化建置）
2. **HEIC 解碼**: heic2any v0.0.4+（純 JS、80KB、3-5 秒處理 10MB 檔案）
3. **GIF 編碼**: gif.js v0.2.0+（NeuQuant 演算法、Worker 支援）
4. **影片處理**: HTMLVideoElement + Canvas API（原生支援 MP4/MOV/WebM）
5. **儲存方案**: IndexedDB（Blob 快取）+ localStorage（設定）
6. **Worker 架構**: imageProcessor.worker.js + gifEncoder.worker.js
7. **SVG 處理**: SVG → Image → Canvas → PNG 流程
8. **測試策略**: Vitest（合約/整合）+ Playwright（E2E）
9. **CSS 方案**: 原生 CSS（變數、Flexbox/Grid、無預處理器）
10. **錯誤處理**: 統一錯誤處理類別（繁體中文訊息）

**效能驗證**:
- Base64 轉換（5MB）: < 2 秒 ✅
- 圖片轉換（10MB）: < 5 秒 ✅
- GIF 製作（10 秒影片）: < 30 秒 ✅

**風險緩解**:
- HEIC 效能：使用 Web Worker
- 記憶體限制：最多 3 個並行 Worker
- 瀏覽器相容性：功能檢測 + polyfill

---

## Phase 1: Design & Contracts

**Status**: ✅ Completed

### Data Model

**[data-model.md](./data-model.md)**: 核心資料結構定義

定義 6 個核心實體：

1. **ConversionTask**: 轉換任務狀態管理
   - 屬性：id, type, input, output, status, progress, result, error
   - 狀態流：pending → processing → completed/failed
   - 儲存：IndexedDB `conversionTasks` store

2. **ImageFile**: 圖片檔案描述
   - 屬性：file, name, format, size, width, height, previewUrl
   - 驗證：size ≤ 50MB, 支援格式（PNG/JPEG/GIF/WebP/HEIC/SVG）
   - 輔助方法：createPreviewUrl, getDimensions, createThumbnail

3. **VideoFile**: 影片檔案描述
   - 屬性：file, name, format, size, duration, width, height, frameRate
   - 驗證：size ≤ 100MB, duration ≤ 300 秒, 支援 MP4/MOV/WebM
   - 輔助方法：loadMetadata, captureFrame, generatePoster

4. **GifParameters**: GIF 產生參數
   - 屬性：frameRate, frameDelay, width, height, quality, repeat, startTime, endTime
   - 預設值：10 fps, 品質 10, 無限循環, 原尺寸 80%
   - 計算方法：calculateDelay, calculateDimensions, estimateFileSize

5. **Base64Data**: Base64 字串處理
   - 屬性：data, pure, mimeType, length, estimatedSize, isValid
   - 靜態方法：parse, validate, toBlob, fromBlob
   - 驗證：Base64 正規表達式, estimatedSize ≤ 50MB

6. **ConversionError**: 統一錯誤結構
   - 屬性：code, message, details, timestamp, recoverable
   - 錯誤代碼：INVALID_INPUT, INVALID_BASE64, FILE_TOO_LARGE, UNSUPPORTED_FORMAT 等
   - 訊息映射：繁體中文錯誤訊息

**IndexedDB Schema**:
```javascript
{
  name: 'ImageToolsDB',
  version: 1,
  stores: [
    { name: 'conversionTasks', keyPath: 'id', indexes: ['status', 'type', 'createdAt'] },
    { name: 'cachedFiles', keyPath: 'id', indexes: ['name', 'createdAt'] }
  ]
}
```

**localStorage Schema**:
```javascript
// Key: 'imagetools_preferences'
{
  defaultGifParams: GifParameters,
  theme: 'light' | 'dark',
  language: 'zh-TW',
  autoSaveResults: boolean,
  showFileSize: boolean
}
```

### API Contracts

**[contracts/](./contracts/)**: 模組介面規範

#### 1. Base64 轉換器（P1 - MVP）
**檔案**: `contracts/base64-converter-api.md`

```typescript
// 公開 API
async base64ToImage(base64Input: string, options?: {
  outputFormat?: 'image/png' | 'image/jpeg',
  filename?: string,
  quality?: number
}): Promise<{
  file: Blob,
  metadata: { width, height, size, format }
}>

async imageToBase64(file: File | Blob, options?: {
  outputFormat?: 'image/png' | 'image/jpeg',
  quality?: number,
  includePrefix?: boolean
}): Promise<{
  base64: string,
  metadata: { originalSize, base64Length, format }
}>
```

**效能要求**: 5MB 檔案 < 2 秒（SC-001）  
**合約測試**: `tests/contract/base64Converter.contract.test.js`（5 項測試）

#### 2. 圖片格式轉換器（P2）
**檔案**: `contracts/image-converter-api.md`

```typescript
async convertToFormat(inputFile: File | Blob, options: {
  outputFormat: 'image/png' | 'image/jpeg',
  quality?: number,
  width?: number,
  height?: number,
  maintainAspectRatio?: boolean
}): Promise<{
  file: Blob,
  metadata: { originalFormat, outputFormat, originalSize, outputSize, width, height, compressionRatio }
}>

async batchConvert(files: File[], options: {
  outputFormat: 'image/png' | 'image/jpeg',
  maxConcurrent?: number,
  onProgress?: (completed: number, total: number) => void
}): Promise<{
  results: Array<{ success, filename, file?, metadata?, error? }>,
  summary: { total, succeeded, failed, totalTime }
}>
```

**效能要求**: 10MB 檔案 < 5 秒（SC-002）  
**內部方法**: decodeHeic, decodeSvg, decodeWebp, resizeImage, validateInputFormat  
**合約測試**: 6 項測試（包含 HEIC 解碼、批次處理、並行限制）

#### 3. GIF 製作器（P3）
**檔案**: `contracts/gif-maker-api.md`

```typescript
async videoToGif(videoFile: File, options: {
  startTime?: number,
  endTime?: number,
  frameRate?: number,
  width?: number,
  height?: number,
  quality?: number,
  repeat?: number,
  onProgress?: (progress: number) => void
}): Promise<{
  file: Blob,
  metadata: { width, height, frameCount, fileSize, duration, processingTime }
}>

async imagesToGif(imageFiles: File[], options: {
  frameDelay?: number,
  width?: number,
  height?: number,
  quality?: number,
  repeat?: number,
  maintainAspectRatio?: boolean,
  onProgress?: (progress: number) => void
}): Promise<{
  file: Blob,
  metadata: { width, height, frameCount, fileSize, processingTime }
}>
```

**效能要求**: 10 秒影片 < 30 秒（SC-003）  
**內部方法**: extractVideoFrames, encodeGif, resizeFrames, calculateFrameCount, estimateGifSize  
**進度階段**: LOADING_VIDEO (0-10%), EXTRACTING_FRAMES (10-70%), ENCODING_GIF (70-100%)  
**合約測試**: 7 項測試（包含影片轉換、圖片序列、進度回報）

#### 4. 儲存服務（P2）
**檔案**: `contracts/storage-api.md`

```typescript
// IndexedDB 操作
async saveFile(id: string, file: Blob, metadata?: { name, type, size, createdAt }): Promise<{ success, id }>
async loadFile(id: string): Promise<{ file: Blob, metadata } | null>
async deleteFile(id: string): Promise<{ success }>
async clearCache(): Promise<{ deletedCount }>
async getCacheInfo(): Promise<{ fileCount, totalSize, oldestFile, newestFile }>

// localStorage 操作
savePreferences(preferences: {...}): { success }
loadPreferences(): Preferences
clearPreferences(): { success }

// 內部方法
initDb(): Promise<IDBDatabase>
checkQuota(): Promise<{ usage, quota, available, percentUsed }>
cleanOldFiles(maxAge: number): Promise<{ deletedCount }>
```

**快取策略**: LRU（Least Recently Used）自動清理  
**大小限制**: 單檔 50MB, 總快取 500MB  
**合約測試**: 10 項測試（涵蓋 IndexedDB CRUD、localStorage 操作、配額檢查）

#### 5. Web Worker API（P2）
**檔案**: `contracts/worker-api.md`

##### imageProcessor.worker.js
```typescript
// 訊息協定（主執行緒 → Worker）
{
  id: string,
  type: 'DECODE_HEIC' | 'CONVERT_IMAGE',
  payload: {
    file: Blob,
    outputFormat: 'image/png' | 'image/jpeg',
    quality?: number,
    width?: number,
    height?: number
  }
}

// 回應協定（Worker → 主執行緒）
{
  id: string,
  success: boolean,
  result?: { file: Blob, metadata: {...} },
  error?: { code, message }
}

// 進度回報
{ id: string, type: 'PROGRESS', progress: number }
```

##### gifEncoder.worker.js
```typescript
// 訊息協定
{
  id: string,
  type: 'ENCODE_GIF',
  payload: {
    frames: ImageData[],
    width: number,
    height: number,
    frameDelay: number,
    quality: number,
    repeat: number
  }
}

// 進度回報
{ id: string, type: 'PROGRESS', progress: number, currentFrame: number, totalFrames: number }
```

##### WorkerPool 管理
```typescript
class WorkerPool {
  constructor(WorkerClass, maxWorkers = 3)
  async execute(message): Promise<result>
  getAvailableWorker(): Worker | null
  terminate(): void
}
```

**並行限制**: 最多 3 個 Worker  
**超時處理**: 30 秒超時保護  
**合約測試**: 3 項測試（HEIC 解碼、GIF 編碼、Worker 池並行限制）

### Quickstart Guide

**[quickstart.md](./quickstart.md)**: 開發與測試指南

內容包含：
- **安裝步驟**: Node.js 18+, npm install, npm run dev
- **專案結構**: 完整目錄樹與說明
- **開發指令**: dev, build, preview, test
- **功能測試場景**: 
  - P1: Base64 → 圖片 / 圖片 → Base64
  - P2: WebP/HEIC/SVG → PNG, 批次轉換
  - P3: 影片 → GIF / 圖片序列 → GIF
- **邊緣案例測試**: 檔案大小限制、無效輸入、瀏覽器相容性、離線操作
- **效能驗證**: 針對 SC-001/002/003 的效能測試指令
- **常見問題**: HEIC 慢速、GIF 過大、記憶體不足、離線失效
- **除錯工具**: 除錯日誌、IndexedDB 檢查、Worker 狀態查詢
- **部署步驟**: 建置、部署到靜態主機、HTTPS 設定

**測試資料範例**:
- 1x1 紅色 PNG Base64 字串（用於快速驗證）
- 產生測試檔案指令：`npm run generate-test-file -- --size 50 --type image`

### Post-Design Constitution Check

重新驗證憲章合規性（Phase 1 完成後）：

#### ✅ 一、MVP 優先
- **符合**: 資料模型和 API 設計聚焦核心功能
- **符合**: P1（Base64 轉換）可獨立實作和交付
- **符合**: P2/P3 功能未引入過度複雜性

#### ✅ 二、可測試性
- **符合**: 每個模組都有完整合約測試規範（共 31 項測試）
- **符合**: API 簽章明確，易於 mock 和測試
- **符合**: Worker 協定標準化，可獨立測試

#### ✅ 三、高品質標準
- **符合**: 錯誤處理統一（ConversionError 類別）
- **符合**: 所有 API 都有效能要求（SC-001/002/003）
- **符合**: 完整的輸入驗證（檔案大小、格式、參數範圍）
- **符合**: 進度回報機制（長時間操作）

#### ✅ 四、簡約原則
- **符合**: 僅使用必要依賴（heic2any, gif.js）
- **符合**: 資料結構簡單直觀
- **符合**: 無過度抽象，接口清晰

#### ✅ 五、繁體中文優先
- **符合**: 所有文件使用繁體中文
- **符合**: 錯誤訊息映射表（messages.js）使用繁中
- **符合**: API 註解使用繁中（quickstart.md 示範）

**結論**: ✅ 通過所有憲章檢查，設計符合品質標準，可進入 Phase 2（任務拆解）
