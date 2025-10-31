# 媒體轉換工具箱 - 快速入門

**功能**: 001-media-converter  
**版本**: 1.0.0  
**最後更新**: 2025-10-31

---

## 安裝

### 前置需求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **瀏覽器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 步驟

```bash
# 1. Clone 專案
git clone <repository-url>
cd ImageTools

# 2. 切換到功能分支
git checkout 001-media-converter

# 3. 安裝依賴
npm install

# 4. 啟動開發伺服器
npm run dev
```

開發伺服器啟動後，開啟瀏覽器訪問 `http://localhost:5173`

---

## 專案結構

```
ImageTools/
├── src/
│   ├── components/           # UI 元件
│   │   ├── Base64Converter.js
│   │   ├── ImageConverter.js
│   │   └── GifMaker.js
│   ├── services/             # 核心服務
│   │   ├── base64Converter.js
│   │   ├── imageConverter.js
│   │   ├── gifMaker.js
│   │   ├── storageService.js
│   │   └── workerManager.js
│   ├── workers/              # Web Workers
│   │   ├── imageProcessor.worker.js
│   │   └── gifEncoder.worker.js
│   ├── utils/                # 工具函式
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── constants/            # 常數定義
│   │   └── messages.js
│   ├── styles/               # CSS 樣式
│   │   └── main.css
│   ├── main.js               # 應用程式入口
│   └── index.html            # HTML 主檔
├── tests/
│   ├── contract/             # 合約測試
│   ├── integration/          # 整合測試
│   └── e2e/                  # E2E 測試
├── specs/
│   └── 001-media-converter/  # 功能規格
├── vite.config.js            # Vite 設定
└── package.json
```

---

## 開發

### 啟動開發伺服器

```bash
npm run dev
```

- 自動開啟瀏覽器：`http://localhost:5173`
- 熱模組替換（HMR）已啟用
- 開發工具已整合

### 建置專案

```bash
npm run build
```

建置檔案輸出至 `dist/` 目錄

### 預覽建置結果

```bash
npm run preview
```

---

## 測試

### 執行所有測試

```bash
npm test
```

### 執行合約測試

```bash
npm run test:contract
```

### 執行整合測試

```bash
npm run test:integration
```

### 執行 E2E 測試

```bash
npm run test:e2e
```

### 測試覆蓋率

```bash
npm run test:coverage
```

---

## 功能測試場景

### P1: Base64 轉換器（MVP）

#### 場景 1: Base64 → 圖片

1. 開啟應用程式
2. 選擇「Base64 轉圖片」分頁
3. 在文字區域貼上 Base64 字串（含或不含 `data:image/png;base64,` 前綴）
4. 點擊「轉換」按鈕
5. **預期結果**:
   - 顯示預覽圖片
   - 顯示圖片資訊（尺寸、檔案大小）
   - 提供「下載 PNG」按鈕

**測試資料**:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```
（1x1 紅色像素 PNG）

#### 場景 2: 圖片 → Base64

1. 選擇「圖片轉 Base64」分頁
2. 點擊「選擇檔案」或拖曳圖片到上傳區
3. 點擊「轉換」按鈕
4. **預期結果**:
   - 顯示 Base64 字串（前 100 字元）
   - 提供「複製到剪貼簿」按鈕
   - 顯示字串長度與原始檔案大小

---

### P2: 圖片格式轉換

#### 場景 3: WebP → PNG

1. 選擇「格式轉換」分頁
2. 上傳 WebP 圖片
3. 選擇輸出格式：PNG
4. 點擊「轉換」按鈕
5. **預期結果**:
   - 顯示轉換進度
   - 顯示原始與輸出檔案大小對比
   - 提供下載按鈕

#### 場景 4: HEIC → PNG

1. 上傳 HEIC 圖片（iPhone 照片）
2. 選擇輸出格式：PNG
3. 設定輸出寬度：800px（選填）
4. 勾選「保持比例」
5. 點擊「轉換」按鈕
6. **預期結果**:
   - 顯示解碼進度（HEIC 解碼較慢）
   - 輸出 800px 寬的 PNG 圖片
   - 高度自動調整維持比例

#### 場景 5: 批次轉換

1. 選擇多個圖片（WebP、HEIC、SVG 混合）
2. 選擇輸出格式：PNG
3. 點擊「批次轉換」按鈕
4. **預期結果**:
   - 顯示整體進度（已完成/總數）
   - 每個檔案獨立顯示狀態（處理中/完成/失敗）
   - 完成後提供「下載全部（ZIP）」按鈕

---

### P3: GIF 製作

#### 場景 6: 影片 → GIF

1. 選擇「GIF 製作」分頁
2. 上傳影片檔案（MP4/MOV）
3. 設定參數:
   - 開始時間：5 秒
   - 結束時間：10 秒
   - 幀率：15 fps
   - 品質：10（高品質）
4. 點擊「產生 GIF」按鈕
5. **預期結果**:
   - 顯示影片預覽與時間軸
   - 顯示轉換進度（影格擷取 → GIF 編碼）
   - 估算 GIF 檔案大小
   - 完成後顯示 GIF 預覽與下載按鈕

#### 場景 7: 圖片序列 → GIF

1. 上傳多張圖片（按順序）
2. 設定參數:
   - 每幀延遲：200ms（5 fps）
   - 循環次數：0（無限循環）
   - 輸出尺寸：800x600
3. 點擊「產生 GIF」按鈕
4. **預期結果**:
   - 顯示圖片預覽列表（可拖曳排序）
   - 顯示編碼進度
   - 完成後播放 GIF 預覽

---

## 邊緣案例測試

### 檔案大小限制

#### 測試 1: 50MB 圖片（限制邊界）

```bash
# 產生測試檔案
npm run generate-test-file -- --size 50 --type image
```

1. 上傳 50MB PNG 圖片
2. 轉換為 Base64
3. **預期結果**: 成功處理，顯示警告「檔案接近大小限制」

#### 測試 2: 51MB 圖片（超過限制）

```bash
npm run generate-test-file -- --size 51 --type image
```

1. 嘗試上傳 51MB 圖片
2. **預期結果**: 顯示錯誤訊息「檔案過大（限制 50MB），請選擇較小的檔案」

### 無效輸入

#### 測試 3: 無效 Base64 字串

1. 在 Base64 輸入框貼上：`not-a-valid-base64-string!!!`
2. 點擊「轉換」
3. **預期結果**: 顯示錯誤「無效的 Base64 格式，請確認輸入內容正確」

#### 測試 4: 不支援的格式

1. 嘗試上傳 BMP 圖片（不支援格式）
2. **預期結果**: 顯示錯誤「不支援的檔案格式：image/bmp」

### 瀏覽器相容性

#### 測試 5: 舊版瀏覽器

在 Chrome 89 或更舊版本開啟應用程式

**預期結果**: 顯示警告「您的瀏覽器版本過舊，請更新至最新版本」

### 離線操作

#### 測試 6: 離線模式

1. 開啟應用程式（已快取）
2. 中斷網路連線
3. 上傳圖片並轉換
4. **預期結果**: 
   - 所有轉換功能正常運作
   - 顯示「離線模式」指示器

---

## 效能驗證

### SC-001: Base64 轉換效能

```bash
npm run perf-test -- --scenario base64-conversion
```

**驗證點**:
- 5MB 圖片 → Base64：< 2 秒
- Base64 → 5MB 圖片：< 2 秒

### SC-002: 圖片轉換效能

```bash
npm run perf-test -- --scenario image-conversion
```

**驗證點**:
- 10MB WebP → PNG：< 5 秒
- 10MB HEIC → PNG：< 5 秒（可能較慢，容許到 6 秒）

### SC-003: GIF 製作效能

```bash
npm run perf-test -- --scenario gif-making
```

**驗證點**:
- 10 秒影片 → GIF（15 fps）：< 30 秒

---

## 常見問題

### Q1: HEIC 解碼很慢怎麼辦？

HEIC 解碼是 CPU 密集任務，使用 Web Worker 避免阻塞 UI。對於大型 HEIC 檔案（> 10MB），可能需要 5-10 秒。

**優化建議**:
- 降低輸出尺寸（設定 `width` 參數）
- 使用較新的瀏覽器（Chrome 95+）

### Q2: GIF 檔案太大怎麼辦？

**優化參數**:
- 降低幀率（10 fps → 8 fps）
- 提高品質值（10 → 15，數字越大品質越低但檔案越小）
- 減少輸出尺寸（原尺寸 80% → 60%）

### Q3: 記憶體不足錯誤

**解決方法**:
1. 關閉其他分頁釋放記憶體
2. 減少批次處理數量（一次處理 3 個檔案）
3. 使用較小的檔案
4. 清除瀏覽器快取

### Q4: 離線功能不運作

確認步驟:
1. 首次訪問時已完整載入應用程式
2. Service Worker 已註冊（開發工具 → Application → Service Workers）
3. 已授予儲存權限

---

## 開發除錯

### 啟用除錯日誌

在 `localStorage` 設定:
```javascript
localStorage.setItem('imagetools_debug', 'true');
```

重新整理頁面後，Console 會顯示詳細日誌。

### 檢查 IndexedDB

開發工具 → Application → IndexedDB → ImageToolsDB

可查看:
- `cachedFiles`: 快取檔案
- `conversionTasks`: 轉換任務歷史

### 檢查 Worker 狀態

```javascript
// 在 Console 執行
workerPool.getStats();
```

顯示:
- 活躍 Worker 數量
- 佇列中的任務數
- 記憶體使用量

---

## 效能監控

### 啟用效能追蹤

在 URL 加上參數：`?perf=true`

```
http://localhost:5173?perf=true
```

會在 Console 顯示:
- 每個轉換任務的處理時間
- 記憶體使用量變化
- Worker 執行時間

---

## 部署

### 建置生產版本

```bash
npm run build
```

### 部署到靜態主機

```bash
# 例如：Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 設定 HTTPS

媒體轉換工具需要 HTTPS 才能使用某些功能（如剪貼簿 API）。

本地開發可使用:
```bash
npm run dev -- --https
```

---

## 貢獻

請遵循 [憲法](.specify/memory/constitution.md) 中的開發原則:

1. **MVP-First**: 優先實作 P1 功能
2. **Testability**: 所有功能都需合約測試
3. **Simplicity**: 使用原生 API，避免過度工程
4. **High Quality**: 完整錯誤處理、效能優化
5. **Traditional Chinese**: 所有文件與訊息使用繁體中文

---

## 授權

MIT License
