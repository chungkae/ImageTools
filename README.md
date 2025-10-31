# 媒體轉換工具箱

一個完全在瀏覽器本地端運作的媒體轉換工具，提供圖片格式轉換、Base64 編碼解碼、GIF 動畫製作等功能。所有處理均在您的裝置上完成，不會上傳任何檔案到伺服器。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Powered by Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite)](https://vitejs.dev)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps/)

## ✨ 核心功能

### 📝 Base64 轉換
- **Base64 → 圖片**：將 Base64 字串解碼並下載為圖片檔案
- **圖片 → Base64**：上傳圖片轉換為 Base64 字串，可直接複製使用
- **格式支援**：PNG、JPEG、GIF、WebP
- **即時預覽**：立即查看轉換結果

### 🖼️ 圖片格式轉換
- **多格式支援**：PNG、JPEG、GIF、WebP、HEIC/HEIF、SVG
- **批次轉換**：同時處理多個檔案，一鍵下載
- **品質調整**：JPEG 品質可自訂（0-100%）
- **尺寸調整**：自訂輸出寬度與高度（保持比例）
- **Apple 格式**：支援 HEIC/HEIF 格式（iPhone 照片）
- **效能優化**：使用 Web Workers 背景處理，不阻塞 UI

### 🎬 GIF 動畫製作
- **影片轉 GIF**：從 MP4/MOV/WebM 影片擷取片段製作 GIF
  - 時間範圍選擇（精確到秒）
  - 即時影片預覽
- **圖片合成 GIF**：多張圖片合成動畫
  - 拖放排序影格
  - 支援不同尺寸圖片（自動調整）
- **參數調整**：
  - 幀率（1-30 fps）
  - 品質（1-30，數字越小顏色越豐富、品質越好）
  - 尺寸縮放（避免檔案過大）
  - 循環次數（預設無限循環）
- **檔案大小估算**：即時顯示預估 GIF 檔案大小
- **進度顯示**：多階段進度條（載入、擷取、編碼）

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

應用將自動開啟於 http://localhost:5173

### 建置生產版本

```bash
npm run build
```

建置產物將輸出至 `dist/` 目錄。

### 預覽生產版本

```bash
npm run preview
```

## 🛠️ 技術架構

### 核心技術
- **建置工具**：Vite 5.x（快速的前端建置工具）
- **語言**：原生 JavaScript ES2020+、HTML5、CSS3
- **無框架**：不依賴任何前端框架，保持輕量
- **PWA**：支援離線使用與安裝到桌面

### 關鍵函式庫
- **heic2any** (^0.0.4)：HEIC/HEIF 格式解碼
- **gif.js** (^0.2.0)：GIF 動畫編碼（使用 Web Workers）

### 瀏覽器 API
- **Canvas API**：圖片繪製與轉換
- **File API**：檔案讀取與處理
- **Web Workers API**：背景處理大型任務（GIF 編碼、圖片轉換）
- **Service Worker**：離線快取與 PWA 支援
- **Performance API**：記憶體監控與效能測量
- **localStorage**：使用者偏好設定與日誌儲存

### 測試工具
- **Vitest**：單元測試與整合測試（jsdom 環境）
- **Playwright**：端對端測試（Chromium、Firefox、WebKit）
- **測試覆蓋率**：Contract (18/18) + Integration (15/15) + E2E (84/84) = **100% 通過**

## 📋 NPM 指令

```bash
# 開發
npm run dev              # 啟動開發伺服器（http://localhost:5173）

# 建置
npm run build            # 建置生產版本
npm run preview          # 預覽建置結果

# 測試
npm test                 # 執行所有測試（Contract + Integration + E2E）
npm run test:contract    # 執行契約測試（18 tests）
npm run test:integration # 執行整合測試（15 tests）
npm run test:e2e         # 執行端對端測試（84 tests）
npm run test:watch       # 監視模式（開發時使用）

# 程式碼品質
npm run lint             # ESLint 檢查
npm run lint:fix         # 自動修復 ESLint 錯誤
npm run format           # Prettier 格式化
npm run format:check     # 檢查格式（CI 使用）
```

## 🌐 瀏覽器需求

### 最低版本
- **Chrome / Edge**：90+
- **Firefox**：88+
- **Safari**：14+
- **Opera**：76+

### 必要功能支援
- FileReader API
- Blob API
- Canvas API
- Web Workers（GIF 製作功能需要）
- Promise & Fetch（ES6+）

### 可選功能（增強體驗）
- Service Worker（離線支援）
- Performance.memory（記憶體監控，僅 Chrome/Edge）
- IndexedDB（未來可能使用）

應用程式啟動時會自動檢測瀏覽器相容性，不支援的功能會顯示警告。

## 🧪 測試與品質保證

### 測試策略
本專案採用**測試驅動開發（TDD）**與**契約優先設計（Contract-First）**：

1. **契約測試（Contract Tests）**：18 個
   - 定義並驗證所有服務 API 的輸入/輸出契約
   - 確保介面穩定，不受實作細節影響
   
2. **整合測試（Integration Tests）**：15 個
   - 測試完整業務流程（如 GIF 製作的所有步驟）
   - 驗證多個模組協同運作
   
3. **端對端測試（E2E Tests）**：84 個
   - 模擬真實使用者操作
   - 跨瀏覽器測試（Chromium、Firefox、WebKit）
   - 涵蓋所有使用者故事場景

### 測試執行

```bash
# 執行所有測試（建議在 commit 前執行）
npm test

# 僅執行快速測試（契約 + 整合）
npm run test:contract && npm run test:integration

# 完整測試套件（包含 E2E，較慢）
npm run test:e2e
```

### 效能基準（Success Criteria）
- **SC-001**：1MB 圖片轉換 < 3 秒 ✅
- **SC-002**：100KB Base64 轉換 < 500ms ✅
- **SC-003**：10 秒影片 → GIF < 30 秒 ✅

## 📁 專案結構

```
ImageTools/
├── src/
│   ├── components/      # UI 元件（Base64Input, FileUploader, GifMaker 等）
│   ├── services/        # 業務邏輯服務（base64Converter, imageConverter, gifMaker）
│   ├── workers/         # Web Workers（imageProcessor, gifEncoder）
│   ├── utils/           # 工具函式（監控、日誌、錯誤處理、資源管理）
│   │   ├── memoryMonitor.js      # 記憶體監控（500MB 警告）
│   │   ├── browserCheck.js       # 瀏覽器相容性檢測
│   │   ├── canvasPool.js         # Canvas 池（重用元素）
│   │   ├── resourceManager.js    # ObjectURL 自動清理
│   │   ├── errorBoundary.js      # 全域錯誤處理
│   │   └── logger.js             # 日誌系統
│   ├── constants/       # 常數定義（訊息、MIME 類型、格式支援）
│   └── styles/          # CSS 樣式（元件化、變數化）
├── tests/
│   ├── contract/        # 契約測試（18 tests）
│   ├── integration/     # 整合測試（15 tests）
│   ├── e2e/             # 端對端測試（84 tests）
│   ├── helpers/         # 測試工具（建立測試圖片、Blob 等）
│   └── fixtures/        # 測試資料（Base64 樣本等）
├── public/              # 靜態資源
│   ├── sw.js            # Service Worker（離線快取）
│   ├── manifest.json    # PWA Manifest
│   └── icons/           # PWA 圖示（192x192, 512x512）
├── specs/               # 規格文件（Speckit 格式）
│   └── 001-media-converter/
│       ├── charter.md          # 專案憲章
│       ├── research.md         # 技術研究
│       ├── data-model.md       # 資料模型
│       ├── tasks.md            # 任務清單（90 tasks）
│       ├── quickstart.md       # 快速開始指南
│       └── contracts/          # API 契約定義
├── dist/                # 建置產物（自動生成，不提交到 git）
└── node_modules/        # 依賴套件（自動安裝，不提交到 git）
```

## 🔒 隱私與安全

### 本地處理
所有檔案處理完全在您的瀏覽器本地端執行，**不會上傳至任何伺服器**。

### 資料儲存
- **localStorage**：僅儲存使用者偏好設定（除錯模式、日誌）
- **記憶體**：處理過程中暫存資料，頁面關閉即清除
- **不蒐集**：無任何資料追蹤、分析或上傳

### 安全措施
- **XSS 防護**：所有使用者輸入經過清理
- **CSP 設定**：Content Security Policy 限制資源載入
- **HTTPS 建議**：生產環境建議使用 HTTPS（Service Worker 需求）

### 開源透明
本專案完全開源，您可以檢視所有原始碼，確保無任何資料外洩風險。

## 🐛 除錯與監控

### 除錯模式
啟用詳細日誌輸出：

```javascript
// 在瀏覽器 Console 執行
localStorage.setItem('debug', 'true');
location.reload();
```

除錯模式會顯示：
- 詳細的 Canvas 池、記憶體、資源管理資訊
- 所有服務呼叫的 DEBUG 級別日誌
- 錯誤訊息的完整堆疊追蹤

### 效能監控模式
測量應用程式各階段耗時：

```
http://localhost:5173/?perf=true
```

Console 會輸出：
- 應用程式初始化各階段耗時
- 所有 `window.perfMarks.mark()` 標記
- 使用 Performance API 測量的精確時間

### 記憶體監控
自動監控記憶體使用（僅 Chrome/Edge）：
- 每 30 秒檢查一次
- 超過 500MB 顯示警告
- 提供記憶體狀態報告：`memoryMonitor.getMemoryStatus()`

### 日誌系統
查看應用程式日誌：

```javascript
// 取得所有錯誤日誌
logger.getLogs({ level: 'ERROR' });

// 取得日誌統計
logger.getStats();

// 匯出日誌為 JSON 檔案
logger.exportLogs();
```

## 📝 授權

MIT License

Copyright (c) 2024

本專案以 MIT 授權條款發佈，您可以自由使用、修改、散佈本軟體。

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

### 開發準則
請參閱 [`CONTRIBUTING.md`](CONTRIBUTING.md) 瞭解詳細的貢獻指南。

核心原則：
- 遵循 ESLint 規則
- 使用 Prettier 格式化程式碼
- 所有 UI 文字使用繁體中文
- 新功能需附帶測試（TDD）
- 保持程式碼簡潔（避免過度設計）
- 追求 MVP（最小可行產品）優先交付

### 提交 Pull Request 前
1. 執行測試：`npm test`
2. 檢查格式：`npm run format:check`
3. 檢查 Lint：`npm run lint`
4. 建置驗證：`npm run build`

## 📚 文件

更多技術細節請參閱：
- [`specs/001-media-converter/charter.md`](specs/001-media-converter/charter.md) - 專案憲章
- [`specs/001-media-converter/research.md`](specs/001-media-converter/research.md) - 技術研究
- [`specs/001-media-converter/data-model.md`](specs/001-media-converter/data-model.md) - 資料模型
- [`specs/001-media-converter/tasks.md`](specs/001-media-converter/tasks.md) - 開發任務（90 tasks）
- [`specs/001-media-converter/contracts/`](specs/001-media-converter/contracts/) - API 契約
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - 貢獻指南

## 🐛 問題回報

如遇到問題，請提供以下資訊：
- 瀏覽器版本（Chrome 版本號等）
- 操作系統（Windows 11, macOS 14 等）
- 操作步驟（如何重現問題）
- 錯誤訊息或截圖
- 檔案類型與大小（如適用）
- Console 錯誤訊息（F12 開啟 DevTools）

**除錯資訊**：
```javascript
// 在 Console 執行以取得瀏覽器相容性報告
browserCheck.getReport();

// 取得記憶體狀態
memoryMonitor.getMemoryStatus();

// 匯出日誌
logger.exportLogs();
```

---

**🎯 目標**：打造高品質、可測試、簡潔的前端工具，所有處理在本地完成，保護使用者隱私。

**🏆 品質保證**：117 個測試全部通過 ✅ | PWA Ready ✅ | 離線可用 ✅
