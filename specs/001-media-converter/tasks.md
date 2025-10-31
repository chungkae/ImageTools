# Tasks: 媒體轉換工具箱

**Input**: Design documents from `/specs/001-media-converter/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 本功能包含完整的測試任務（合約測試、整合測試、E2E 測試）

**Organization**: 任務按使用者故事分組，每個故事可獨立實作和測試

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無相依性）
- **[Story]**: 任務所屬使用者故事（US1, US2, US3）
- 包含確切檔案路徑

---

## Path Conventions

本專案為純前端單一專案結構：
- **源碼**: `src/` - 所有 JavaScript、CSS、HTML
- **測試**: `tests/` - 所有測試檔案
- **設定**: 根目錄 - vite.config.js, package.json 等

---

## Phase 1: Setup (專案初始化)

**Purpose**: 建立專案結構與開發環境

- [ ] T001 建立專案根目錄結構（src/, tests/, public/, .github/）
- [ ] T002 初始化 Node.js 專案並安裝 Vite 5.x 依賴（package.json）
- [ ] T003 安裝核心依賴：heic2any, gif.js（package.json）
- [ ] T004 安裝開發依賴：Vitest, Playwright, ESLint, Prettier（package.json）
- [ ] T005 [P] 建立 Vite 設定檔（vite.config.js）- Worker 支援、建置優化
- [ ] T006 [P] 建立 ESLint 設定檔（.eslintrc.js）- ES2020+ 規則
- [ ] T007 [P] 建立 Prettier 設定檔（.prettierrc）- 程式碼格式化
- [ ] T008 [P] 建立 Vitest 設定檔（vitest.config.js）- 測試環境
- [ ] T009 [P] 建立 Playwright 設定檔（playwright.config.js）- E2E 測試
- [ ] T010 建立主 HTML 檔案（index.html）- 基礎結構與 meta 標籤
- [ ] T011 建立應用程式入口點（src/main.js）- 初始化邏輯
- [ ] T012 [P] 建立 CSS Reset（src/styles/reset.css）
- [ ] T013 [P] 建立 CSS 變數檔案（src/styles/variables.css）- 主題顏色、字型
- [ ] T014 [P] 建立版面配置 CSS（src/styles/layout.css）- Flexbox/Grid 佈局
- [ ] T015 [P] 建立元件樣式 CSS（src/styles/components.css）- 按鈕、輸入框等
- [ ] T016 [P] 建立錯誤訊息常數（src/constants/messages.js）- 繁體中文訊息
- [ ] T017 [P] 建立檔案類型常數（src/constants/fileTypes.js）- 支援格式定義
- [ ] T018 [P] 建立檔案限制常數（src/constants/limits.js）- 大小限制（50MB/100MB）
- [ ] T019 建立 README.md - 專案說明與快速開始

**Checkpoint**: 專案結構完整，開發環境就緒

---

## Phase 2: Foundational (基礎建設)

**Purpose**: 核心工具與服務，**所有使用者故事的前置條件**

**⚠️ CRITICAL**: 此階段必須完成才能開始任何使用者故事實作

### 工具函式

- [ ] T020 [P] 實作檔案驗證工具（src/utils/validators.js）- validateFileSize, validateFormat, validateBase64
- [ ] T021 [P] 實作檔案處理輔助函式（src/utils/fileHelpers.js）- createObjectURL, revokeObjectURL, downloadBlob
- [ ] T022 [P] 實作 Canvas 輔助函式（src/utils/canvasHelpers.js）- imageToCanvas, canvasToBlob, resizeCanvas
- [ ] T023 [P] 實作格式化工具（src/utils/formatters.js）- formatFileSize, formatDuration, formatProgress

### 共用元件

- [ ] T024 [P] 建立檔案上傳元件（src/components/FileUploader.js）- 拖放、選擇檔案、預覽
- [ ] T025 [P] 建立進度條元件（src/components/ProgressBar.js）- 百分比顯示、動畫
- [ ] T026 [P] 建立錯誤訊息元件（src/components/ErrorMessage.js）- 錯誤顯示、關閉按鈕
- [ ] T027 [P] 建立圖片預覽元件（src/components/ImagePreview.js）- 縮圖、完整預覽
- [ ] T028 [P] 建立下載按鈕元件（src/components/DownloadButton.js）- Blob 下載、檔名設定

### 儲存服務

- [ ] T029 實作 IndexedDB 初始化（src/services/storageService.js - initDb）
- [ ] T030 實作檔案快取 CRUD（src/services/storageService.js - saveFile, loadFile, deleteFile, clearCache）
- [ ] T031 實作快取資訊查詢（src/services/storageService.js - getCacheInfo, checkQuota）
- [ ] T032 實作 localStorage 偏好管理（src/services/storageService.js - savePreferences, loadPreferences）
- [ ] T033 實作快取清理策略（src/services/storageService.js - cleanOldFiles）

### Web Workers

- [ ] T034 [P] 建立圖片處理 Worker（src/workers/imageProcessor.worker.js）- 基礎結構、訊息處理
- [ ] T035 [P] 建立 GIF 編碼 Worker（src/workers/gifEncoder.worker.js）- 基礎結構、訊息處理
- [ ] T036 實作 Worker Pool 管理器（src/services/workerManager.js）- 建立、執行、終止 Worker

### 測試基礎建設

- [ ] T037 [P] 建立測試輔助工具（tests/helpers/testUtils.js）- createMockFile, loadTestFile, delay
- [ ] T038 [P] 準備測試資料（tests/fixtures/）- test.png, test.webp, test.heic, test.svg, test-video.mp4

**Checkpoint**: 基礎建設完成，可開始使用者故事實作

---

## Phase 3: User Story 1 - Base64 與圖片互轉 (Priority: P1) 🎯 MVP

**Goal**: 使用者可快速將 Base64 字串轉換為圖片，或將圖片轉換為 Base64 字串

**Independent Test**: 貼上有效 Base64 並下載 PNG，或上傳圖片並複製 Base64 字串

### 合約測試 US1

> **NOTE: 先寫測試，確認測試 FAIL 後再實作**

- [ ] T039 [P] [US1] Base64 轉換器合約測試（tests/contract/base64Converter.contract.test.js）
  - 測試 base64ToImage 接受有效 Base64 並回傳 Blob
  - 測試 base64ToImage 拒絕無效 Base64
  - 測試 imageToBase64 接受 File 並回傳 Base64 字串
  - 測試 imageToBase64 拒絕過大檔案（> 50MB）
  - 測試效能：5MB 檔案 < 2 秒（SC-001）

### 實作 US1

- [ ] T040 [P] [US1] 實作 Base64 資料類別（src/services/base64Converter.js - Base64Data class）
  - 靜態方法：parse, validate, toBlob, fromBlob
  - 屬性：data, pure, mimeType, length, estimatedSize, isValid

- [ ] T041 [US1] 實作 base64ToImage 方法（src/services/base64Converter.js）
  - 驗證 Base64 格式
  - 解析 data URI（如果有）
  - 轉換為 Blob
  - 使用 Canvas 處理並輸出 PNG
  - 回傳 file 與 metadata

- [ ] T042 [US1] 實作 imageToBase64 方法（src/services/base64Converter.js）
  - 驗證檔案大小（≤ 50MB）
  - 使用 FileReader 讀取檔案
  - 轉換為 Base64（含或不含 prefix）
  - 回傳 base64 與 metadata

- [ ] T043 [P] [US1] 建立 Base64 輸入元件（src/components/Base64Input.js）
  - 文字區域（textarea）用於貼上 Base64
  - 驗證狀態顯示（有效/無效）
  - 清除按鈕

- [ ] T044 [US1] 整合 Base64 轉圖片 UI（src/main.js）
  - Base64Input 元件 → base64ToImage 服務
  - ImagePreview 顯示結果
  - DownloadButton 下載 PNG
  - ErrorMessage 顯示錯誤

- [ ] T045 [US1] 整合圖片轉 Base64 UI（src/main.js）
  - FileUploader 元件 → imageToBase64 服務
  - 顯示 Base64 字串（前 100 字元）
  - 複製到剪貼簿按鈕
  - ErrorMessage 顯示錯誤

- [ ] T046 [US1] 實作清除/重置功能（src/main.js）
  - 清空所有輸入輸出區域
  - 重置元件狀態
  - 釋放 ObjectURL

### 整合測試 US1

- [ ] T047 [US1] Base64 轉換流程整合測試（tests/integration/base64Flow.test.js）
  - 測試完整 Base64 → 圖片流程
  - 測試完整圖片 → Base64 流程
  - 測試清除功能
  - 測試錯誤處理（無效輸入、過大檔案）

### E2E 測試 US1

- [ ] T048 [US1] Base64 功能 E2E 測試（tests/e2e/base64.spec.js）
  - 場景 1: 貼上 Base64 → 預覽 → 下載 PNG
  - 場景 2: 上傳圖片 → 複製 Base64
  - 場景 3: 清除/重置
  - 場景 4: 無效 Base64 錯誤訊息

**Checkpoint**: User Story 1 完整功能，可獨立運作並測試 ✅

---

## Phase 4: User Story 2 - 圖片格式轉換 (Priority: P2)

**Goal**: 使用者可將 WebP、HEIC、SVG 等格式轉換為 PNG

**Independent Test**: 上傳 WebP/HEIC 圖片並成功下載 PNG

### 合約測試 US2

- [ ] T049 [P] [US2] 圖片轉換器合約測試（tests/contract/imageConverter.contract.test.js）
  - 測試 convertToFormat 接受 WebP 並輸出 PNG
  - 測試 convertToFormat 正確處理 HEIC 檔案
  - 測試 convertToFormat 在 5 秒內完成 10MB 轉換（SC-002）
  - 測試 convertToFormat 保持寬高比
  - 測試 batchConvert 正確處理混合格式
  - 測試 batchConvert 限制並行數量（≤ 3）

### 實作 US2 - Core

- [ ] T050 [P] [US2] 實作 WebP 解碼（src/services/imageConverter.js - decodeWebp）
  - 使用 Canvas API 載入 WebP
  - 轉換為 PNG Blob

- [ ] T051 [P] [US2] 實作 SVG 解碼（src/services/imageConverter.js - decodeSvg）
  - 讀取 SVG 文字內容
  - 建立 Image 元素載入 SVG
  - 繪製到 Canvas
  - 輸出 PNG Blob

- [ ] T052 [US2] 實作 HEIC 解碼（在 Worker 執行）
  - 在 imageProcessor.worker.js 整合 heic2any
  - 處理 DECODE_HEIC 訊息
  - 回報進度（0-100%）
  - 回傳 PNG Blob

- [ ] T053 [P] [US2] 實作圖片調整尺寸（src/services/imageConverter.js - resizeImage）
  - 載入 Blob 到 Canvas
  - 計算目標尺寸（保持比例）
  - 繪製並輸出新 Blob

- [ ] T054 [US2] 實作 convertToFormat 方法（src/services/imageConverter.js）
  - 驗證輸入格式
  - 根據格式呼叫對應解碼器（WebP/HEIC/SVG）
  - 調整尺寸（如果需要）
  - 輸出 PNG 並回傳 metadata（原始/輸出大小、壓縮率等）

- [ ] T055 [US2] 實作 batchConvert 方法（src/services/imageConverter.js）
  - 批次處理多個檔案
  - 限制並行數量（maxConcurrent: 3）
  - 進度回呼（onProgress）
  - 回傳結果陣列（成功/失敗）與摘要統計

### 實作 US2 - UI

- [ ] T056 [P] [US2] 建立圖片轉換元件（src/components/ImageConverter.js）
  - 檔案上傳區（單一或批次）
  - 輸出格式選擇器（PNG/JPEG）
  - 尺寸設定（寬度、高度、保持比例）
  - 品質設定（JPEG）
  - 轉換按鈕

- [ ] T057 [US2] 整合圖片轉換 UI（src/main.js）
  - ImageConverter 元件 → convertToFormat/batchConvert 服務
  - 顯示轉換進度（單一檔案）
  - 顯示批次進度（已完成/總數）
  - 顯示結果列表（檔名、大小、狀態）
  - 下載按鈕（單一或批次 ZIP）

### 整合測試 US2

- [ ] T058 [US2] 圖片轉換流程整合測試（tests/integration/imageConversionFlow.test.js）
  - 測試 WebP → PNG 完整流程
  - 測試 HEIC → PNG 完整流程（含進度）
  - 測試 SVG → PNG 完整流程
  - 測試批次轉換（混合格式）
  - 測試錯誤處理（不支援格式、過大檔案）

### E2E 測試 US2

- [ ] T059 [US2] 圖片轉換 E2E 測試（tests/e2e/imageConversion.spec.js）
  - 場景 1: 上傳 WebP → 下載 PNG
  - 場景 2: 上傳 HEIC → 設定尺寸 → 下載 PNG
  - 場景 3: 批次上傳多種格式 → 批次下載
  - 場景 4: 上傳非圖片檔案 → 錯誤訊息

**Checkpoint**: User Story 1 AND 2 都可獨立運作 ✅

---

## Phase 5: User Story 3 - GIF 動畫製作 (Priority: P3)

**Goal**: 使用者可將影片或圖片序列轉換為 GIF 動畫

**Independent Test**: 上傳影片並產生 GIF，或上傳圖片序列並產生 GIF

### 合約測試 US3

- [ ] T060 [P] [US3] GIF 製作器合約測試（tests/contract/gifMaker.contract.test.js）
  - 測試 videoToGif 接受影片並輸出 GIF
  - 測試 videoToGif 在 30 秒內完成 10 秒影片（SC-003）
  - 測試 videoToGif 正確裁剪時間範圍
  - 測試 videoToGif 回報進度
  - 測試 imagesToGif 接受圖片陣列並輸出 GIF
  - 測試 imagesToGif 拒絕空陣列
  - 測試 imagesToGif 統一調整所有影格尺寸

### 實作 US3 - Core

- [ ] T061 [P] [US3] 實作影片影格擷取（src/services/gifMaker.js - extractVideoFrames）
  - 載入影片到 HTMLVideoElement
  - 設定 currentTime 到指定位置
  - 使用 Canvas getImageData() 擷取影格
  - 根據 frameRate 計算間隔
  - 回傳 ImageData 陣列

- [ ] T062 [US3] 實作 GIF 編碼（在 Worker 執行）
  - 在 gifEncoder.worker.js 整合 gif.js
  - 處理 ENCODE_GIF 訊息
  - 接收 ImageData 陣列與參數
  - 使用 gif.js 編碼（NeuQuant 演算法）
  - 回報進度（currentFrame/totalFrames）
  - 回傳 GIF Blob

- [ ] T063 [P] [US3] 實作影格調整尺寸（src/services/gifMaker.js - resizeFrames）
  - 批次處理 ImageData 陣列
  - 調整到目標尺寸
  - 保持比例（如果需要）

- [ ] T064 [P] [US3] 實作 GIF 大小估算（src/services/gifMaker.js - estimateGifSize）
  - 根據 width、height、frameCount、quality 估算
  - 公式：bytesPerFrame = (width * height * 0.5) * (quality / 10)
  - 回傳估算檔案大小（bytes）

- [ ] T065 [US3] 實作 videoToGif 方法（src/services/gifMaker.js）
  - 驗證影片檔案（≤ 100MB, ≤ 300 秒）
  - 載入影片元資料
  - 擷取影格（startTime 到 endTime）
  - 調整影格尺寸（預設原尺寸 80%）
  - 呼叫 Worker 編碼 GIF
  - 進度回報：LOADING_VIDEO (0-10%) → EXTRACTING_FRAMES (10-70%) → ENCODING_GIF (70-100%)
  - 回傳 GIF Blob 與 metadata

- [ ] T066 [US3] 實作 imagesToGif 方法（src/services/gifMaker.js）
  - 驗證圖片陣列（非空，每張 ≤ 50MB）
  - 載入所有圖片到 Canvas
  - 統一調整尺寸（使用第一張圖或指定尺寸）
  - 轉換為 ImageData 陣列
  - 呼叫 Worker 編碼 GIF
  - 進度回報
  - 回傳 GIF Blob 與 metadata

### 實作 US3 - UI

- [ ] T067 [P] [US3] 建立 GIF 製作元件（src/components/GifMaker.js）
  - 模式切換（影片轉 GIF / 圖片轉 GIF）
  - 影片模式：
    - 影片上傳與預覽
    - 時間範圍選擇器（startTime, endTime）
  - 圖片模式：
    - 多圖片上傳
    - 圖片排序（拖放）
  - GIF 參數設定：
    - 幀率（1-30 fps）
    - 品質（1-30）
    - 尺寸（寬度、高度、保持比例）
    - 循環次數（0=無限）
  - 估算檔案大小顯示
  - 轉換按鈕

- [ ] T068 [US3] 整合 GIF 製作 UI（src/main.js）
  - GifMaker 元件 → videoToGif/imagesToGif 服務
  - 顯示多階段進度（載入、擷取、編碼）
  - 顯示 GIF 預覽（播放）
  - 顯示檔案大小與元資料
  - 下載按鈕
  - 參數過大警告（估算 > 10MB）

### 整合測試 US3

- [ ] T069 [US3] GIF 製作流程整合測試（tests/integration/gifCreationFlow.test.js）
  - 測試影片 → GIF 完整流程（含時間裁剪）
  - 測試圖片序列 → GIF 完整流程
  - 測試參數調整（幀率、品質、尺寸）
  - 測試進度回報機制
  - 測試錯誤處理（無效影片、空圖片陣列）

### E2E 測試 US3

- [ ] T070 [US3] GIF 製作 E2E 測試（tests/e2e/gifCreation.spec.js）
  - 場景 1: 上傳影片 → 選擇時間範圍 → 設定參數 → 下載 GIF
  - 場景 2: 上傳圖片序列 → 設定每幀延遲 → 下載 GIF
  - 場景 3: 調整參數 → 重新產生 GIF
  - 場景 4: 大檔案警告提示

**Checkpoint**: 所有 3 個使用者故事都可獨立運作 ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨功能改善與最終優化

- [ ] T071 [P] 實作離線支援（Service Worker）- public/sw.js
- [ ] T072 [P] 建立 PWA Manifest（public/manifest.json）- 圖示、名稱、主題
- [ ] T073 [P] 實作記憶體監控（src/utils/memoryMonitor.js）- 超過 500MB 警告
- [ ] T074 [P] 實作瀏覽器相容性檢測（src/utils/browserCheck.js）- Chrome 90+, Firefox 88+ 等
- [ ] T075 效能優化：Canvas 池（src/utils/canvasPool.js）- 重用 Canvas 元素
- [ ] T076 效能優化：ObjectURL 自動清理（src/utils/resourceManager.js）
- [ ] T077 [P] 加強錯誤處理：統一錯誤邊界（src/utils/errorBoundary.js）
- [ ] T078 [P] 加強錯誤處理：錯誤追蹤與日誌（src/utils/logger.js）
- [ ] T079 [P] 建立除錯模式（localStorage debug flag）- 詳細日誌輸出
- [ ] T080 [P] 建立效能監控工具（?perf=true URL 參數）- Console 輸出處理時間
- [ ] T081 文件更新：README.md - 完整使用說明與截圖
- [ ] T082 文件更新：CONTRIBUTING.md - 開發指南與憲法連結
- [ ] T083 [P] 程式碼重構：提取重複邏輯到共用函式
- [ ] T084 [P] 程式碼清理：移除 console.log、註解過時程式碼
- [ ] T085 [P] 安全性：輸入清理（防止 XSS）
- [ ] T086 [P] 安全性：CSP 設定（Content Security Policy）
- [ ] T087 執行完整測試套件（npm test）- 所有合約、整合、E2E 測試
- [ ] T088 執行 quickstart.md 驗證 - 所有場景與邊緣案例
- [ ] T089 效能基準測試 - 驗證 SC-001/002/003 達標
- [ ] T090 建置生產版本（npm run build）- 最終驗證

**Checkpoint**: 專案完整、優化、可部署 ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 相依 Setup 完成 - **阻塞所有使用者故事**
- **User Stories (Phase 3-5)**: 所有相依 Foundational 完成
  - 使用者故事可並行進行（如果有多人）
  - 或依優先級順序執行（P1 → P2 → P3）
- **Polish (Phase 6)**: 相依所有使用者故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事相依
- **User Story 2 (P2)**: Foundational 完成後可開始 - 與 US1 獨立
- **User Story 3 (P3)**: Foundational 完成後可開始 - 與 US1/US2 獨立

### Within Each User Story

1. **測試優先**: 合約測試必須先寫並確認 FAIL
2. **核心實作**: 服務層方法實作
3. **UI 整合**: 元件與主應用程式整合
4. **整合測試**: 完整流程測試
5. **E2E 測試**: 端對端使用者場景

### Parallel Opportunities

**Phase 1 (Setup)** - 可並行：
- T005-T009（所有設定檔）
- T012-T015（所有 CSS 檔案）
- T016-T018（所有常數檔案）

**Phase 2 (Foundational)** - 可並行：
- T020-T023（所有工具函式）
- T024-T028（所有共用元件）
- T034-T035（兩個 Worker）

**User Story 1** - 可並行：
- T040-T041（Base64Data 類別與 base64ToImage 可同時開發）
- T043（Base64Input 元件可獨立開發）

**User Story 2** - 可並行：
- T050, T051（WebP 與 SVG 解碼器）
- T053（resizeImage 可獨立開發）
- T056（UI 元件可獨立開發）

**User Story 3** - 可並行：
- T061, T063, T064（影格擷取、調整、估算可獨立開發）
- T067（UI 元件可獨立開發）

**Phase 6 (Polish)** - 可並行：
- T071-T074（離線、PWA、記憶體、瀏覽器檢查）
- T077-T080（錯誤處理與監控工具）
- T081-T082（文件）
- T083-T086（重構與安全性）

---

## Parallel Example: User Story 1

```bash
# 1. 先寫測試（單一任務）
Task T039: "Base64 轉換器合約測試"

# 2. 並行實作核心功能（不同檔案）
Task T040: "實作 Base64 資料類別"
Task T041: "實作 base64ToImage 方法"
Task T042: "實作 imageToBase64 方法"
Task T043: "建立 Base64 輸入元件"

# 3. 依序整合（有相依性）
Task T044: "整合 Base64 轉圖片 UI"（相依 T040-T043）
Task T045: "整合圖片轉 Base64 UI"（相依 T040-T043）
Task T046: "實作清除/重置功能"（相依 T044-T045）

# 4. 測試驗證（依序）
Task T047: "整合測試"
Task T048: "E2E 測試"
```

---

## Parallel Example: Multi-Developer Team

**Foundation Phase（Phase 2 完成後）**:

```bash
# Developer A: User Story 1 (P1 - MVP)
Tasks T039-T048

# Developer B: User Story 2 (P2)
Tasks T049-T059

# Developer C: User Story 3 (P3)
Tasks T060-T070
```

每個開發者可獨立完成一個完整的使用者故事，最後整合時不會衝突。

---

## Implementation Strategy

### MVP First (僅 User Story 1)

1. **Phase 1**: Setup（T001-T019）→ 專案結構就緒
2. **Phase 2**: Foundational（T020-T038）→ **關鍵阻塞點**
3. **Phase 3**: User Story 1（T039-T048）→ **MVP 完成！**
4. **停止並驗證**: 
   - 執行所有 US1 測試
   - 手動測試 quickstart.md 場景 1-2
   - 驗證效能（SC-001: < 2 秒）
5. **部署/展示**: Base64 轉換工具可立即使用

**MVP 範圍**:
- 總任務數: 48 (T001-T048)
- 預估時間: 3-5 天（單人）
- 交付價值: 完整的 Base64 ↔ 圖片轉換工具

### Incremental Delivery

1. **Sprint 1**: Setup + Foundational（T001-T038）→ 基礎就緒
2. **Sprint 2**: User Story 1（T039-T048）→ **MVP 上線** 🚀
3. **Sprint 3**: User Story 2（T049-T059）→ 圖片格式轉換上線
4. **Sprint 4**: User Story 3（T060-T070）→ GIF 製作上線
5. **Sprint 5**: Polish（T071-T090）→ 最終優化與部署

每個 Sprint 交付可獨立運作的增量功能。

### Parallel Team Strategy

**3 人團隊範例**:

1. **Week 1（共同）**: 
   - 所有人：Phase 1 + Phase 2（T001-T038）
   - 每日 Sync: 確保基礎建設一致

2. **Week 2-3（並行）**:
   - Developer A: User Story 1（T039-T048）
   - Developer B: User Story 2（T049-T059）
   - Developer C: User Story 3（T060-T070）
   - 每日 Sync: 分享進度，解決共用元件衝突

3. **Week 4（整合）**:
   - 合併所有分支
   - 整合測試
   - Phase 6 Polish（T071-T090）

**並行優勢**:
- 3 週完成所有功能（vs 單人 6-8 週）
- 每個故事獨立測試，降低整合風險
- 清晰的責任劃分

---

## Task Summary

### Total Tasks: 90

**By Phase**:
- Phase 1 (Setup): 19 tasks
- Phase 2 (Foundational): 19 tasks
- Phase 3 (US1 - MVP): 10 tasks
- Phase 4 (US2): 11 tasks
- Phase 5 (US3): 11 tasks
- Phase 6 (Polish): 20 tasks

**By User Story**:
- User Story 1 (Base64 轉換): 10 tasks
- User Story 2 (圖片格式轉換): 11 tasks
- User Story 3 (GIF 製作): 11 tasks
- Infrastructure (Setup + Foundational + Polish): 58 tasks

**Parallel Opportunities**: 38 tasks（標記 [P]）

**Independent Test Criteria**:
- US1: 貼上 Base64 → 下載 PNG ✅
- US2: 上傳 WebP/HEIC → 下載 PNG ✅
- US3: 上傳影片/圖片 → 下載 GIF ✅

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3（48 tasks）

---

## Format Validation

✅ **所有任務符合格式規範**:
- 所有任務以 `- [ ]` 開頭（checkbox）
- 所有任務包含 Task ID（T001-T090）
- 使用者故事任務包含 [Story] 標籤（[US1], [US2], [US3]）
- 可並行任務包含 [P] 標記
- 所有任務描述包含確切檔案路徑或明確動作

---

## Notes

- **[P] 標記**: 不同檔案、無相依性，可並行執行
- **[Story] 標籤**: 追溯任務所屬使用者故事
- **測試優先**: 每個使用者故事先寫測試，確認 FAIL 後再實作
- **獨立驗證**: 每個 Checkpoint 停下來驗證該故事獨立運作
- **增量交付**: 每個使用者故事完成即可部署，無需等待所有功能
- **避免**: 模糊任務、相同檔案衝突、破壞獨立性的跨故事相依

**憲法遵循**:
- ✅ MVP-First: P1 任務最少（10 tasks），優先交付
- ✅ Testability: 每個故事都有完整測試（合約 + 整合 + E2E）
- ✅ Simplicity: 無過度抽象，清晰的檔案結構
- ✅ High Quality: 完整錯誤處理、效能驗證、安全性檢查
- ✅ 繁體中文: 所有訊息、文件使用繁中
