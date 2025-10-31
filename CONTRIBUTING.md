# 貢獻指南

感謝您對媒體轉換工具箱的關注！本文件說明如何參與專案開發。

## 📋 目錄

- [開發環境設定](#開發環境設定)
- [開發流程](#開發流程)
- [程式碼規範](#程式碼規範)
- [測試要求](#測試要求)
- [提交規範](#提交規範)
- [專案憲章](#專案憲章)

## 🛠️ 開發環境設定

### 必要條件

- **Node.js**: 18.x 或更新版本
- **npm**: 9.x 或更新版本
- **Git**: 最新穩定版本
- **瀏覽器**: Chrome 90+ / Firefox 88+ / Edge 90+（用於測試）

### 安裝步驟

1. **Fork 專案**
   ```bash
   # 在 GitHub 上 Fork 此專案到您的帳號
   ```

2. **Clone 到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ImageTools.git
   cd ImageTools
   ```

3. **安裝依賴**
   ```bash
   npm install
   ```

4. **執行開發伺服器**
   ```bash
   npm run dev
   ```
   
   瀏覽器會自動開啟 http://localhost:5173

5. **執行測試（確認環境正常）**
   ```bash
   npm test
   ```

## 🔄 開發流程

### 1. 建立分支

從 `main` 分支建立新的功能分支：

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

分支命名規則：
- `feature/` - 新功能（如 `feature/add-png-optimization`）
- `fix/` - Bug 修復（如 `fix/gif-encoding-freeze`）
- `docs/` - 文件更新（如 `docs/update-readme`）
- `refactor/` - 程式碼重構（如 `refactor/canvas-pool`）
- `test/` - 測試相關（如 `test/add-e2e-heic`）

### 2. 開發與測試

#### 測試驅動開發（TDD）

本專案採用 **測試優先** 的開發方式：

1. **先寫契約測試**（定義介面）
   ```bash
   # 編輯 tests/contract/yourFeature.contract.test.js
   npm run test:contract
   ```
   
   契約測試應該**先失敗**（RED），確認測試本身有效。

2. **實作功能**（滿足契約）
   ```bash
   # 編輯 src/services/yourFeature.js
   npm run test:contract
   ```
   
   實作直到契約測試**通過**（GREEN）。

3. **重構與優化**（改善程式碼）
   ```bash
   # 重構程式碼但保持測試通過
   npm run test:contract
   ```

4. **整合測試**（完整流程）
   ```bash
   # 編輯 tests/integration/yourFeature.test.js
   npm run test:integration
   ```

5. **端對端測試**（使用者場景）
   ```bash
   # 編輯 tests/e2e/yourFeature.spec.js
   npm run test:e2e
   ```

#### 即時開發

```bash
# 開發伺服器（自動重載）
npm run dev

# 測試監視模式（自動執行測試）
npm run test:watch
```

### 3. 程式碼檢查

提交前執行：

```bash
# 格式化程式碼
npm run format

# Lint 檢查
npm run lint

# 自動修復 Lint 錯誤
npm run lint:fix

# 執行所有測試
npm test

# 建置驗證
npm run build
```

### 4. 提交變更

```bash
git add .
git commit -m "feat: add PNG optimization support"
git push origin feature/your-feature-name
```

### 5. 提交 Pull Request

1. 前往 GitHub 專案頁面
2. 點擊「Compare & pull request」
3. 填寫 PR 描述（請詳細說明）：
   - **目的**：解決什麼問題或新增什麼功能
   - **變更**：列出主要變更項目
   - **測試**：如何驗證這些變更
   - **截圖**：UI 變更請附上前後對比
4. 確認勾選：
   - [ ] 所有測試通過
   - [ ] 程式碼已格式化
   - [ ] 無 ESLint 錯誤
   - [ ] 文件已更新（如需要）
5. 提交 PR

## 📝 程式碼規範

### JavaScript 規範

遵循 **ESLint** 與 **Prettier** 設定：

```javascript
// ✅ 良好實踐
const imageData = await converter.processImage(file);

// ❌ 避免
var imageData = await converter.processImage(file)  // 缺少分號
```

#### 核心原則

1. **使用 ES6+ 語法**
   ```javascript
   // ✅ 使用 const/let
   const maxSize = 1024;
   let currentIndex = 0;
   
   // ❌ 避免 var
   var maxSize = 1024;
   ```

2. **函式應簡短且專注**
   ```javascript
   // ✅ 單一職責
   function resizeImage(image, width, height) {
     // 僅處理尺寸調整
   }
   
   // ❌ 過於複雜
   function processImageAndUploadAndNotify(image, options) {
     // 太多職責
   }
   ```

3. **使用有意義的變數名稱**
   ```javascript
   // ✅ 清楚明確
   const maxImageSizeInBytes = 5 * 1024 * 1024;
   
   // ❌ 模糊不清
   const max = 5242880;
   ```

4. **錯誤處理**
   ```javascript
   // ✅ 明確的錯誤處理
   try {
     const result = await processImage(file);
     return result;
   } catch (error) {
     logger.error('圖片處理失敗', { error, file });
     throw new Error(`無法處理圖片: ${error.message}`);
   }
   ```

5. **註解應解釋「為什麼」而非「是什麼」**
   ```javascript
   // ✅ 解釋原因
   // 使用 willReadFrequently 因為 GIF 編碼需要多次讀取像素
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   
   // ❌ 陳述事實
   // 取得 Canvas Context
   const ctx = canvas.getContext('2d');
   ```

### HTML/CSS 規範

1. **語意化 HTML**
   ```html
   <!-- ✅ 使用語意標籤 -->
   <section class="converter-section">
     <h2>圖片格式轉換</h2>
     <button type="button">轉換</button>
   </section>
   
   <!-- ❌ 避免無意義的 div -->
   <div class="section">
     <div class="title">圖片格式轉換</div>
     <div class="button">轉換</div>
   </div>
   ```

2. **CSS 變數優先**
   ```css
   /* ✅ 使用 CSS 變數 */
   .button {
     background-color: var(--primary-color);
     padding: var(--spacing-md);
   }
   
   /* ❌ 硬編碼數值 */
   .button {
     background-color: #3b82f6;
     padding: 16px;
   }
   ```

### 文字規範

- **所有 UI 文字使用繁體中文**
- **錯誤訊息要友善且具體**
  ```javascript
  // ✅ 具體的錯誤訊息
  throw new Error('檔案大小超過 10MB 限制（目前: 15.3MB）');
  
  // ❌ 模糊的錯誤訊息
  throw new Error('檔案太大');
  ```

## 🧪 測試要求

### 測試層級

1. **契約測試（必須）**
   - 所有 public API 必須有契約測試
   - 測試輸入/輸出規格
   - 不依賴實作細節
   
   ```javascript
   // tests/contract/imageConverter.contract.test.js
   test('convertImage 應該接受 File 並回傳 Blob', async () => {
     const inputFile = createTestImageFile();
     const result = await imageConverter.convertImage(inputFile, 'png');
     
     expect(result).toBeInstanceOf(Blob);
     expect(result.type).toBe('image/png');
   });
   ```

2. **整合測試（重要流程）**
   - 測試多個模組協同運作
   - 驗證完整業務流程
   
   ```javascript
   // tests/integration/gifCreationFlow.test.js
   test('完整 GIF 製作流程', async () => {
     const frames = await extractFrames(video);
     const resized = await resizeFrames(frames, 400, 300);
     const gif = await encodeGif(resized, { quality: 10 });
     
     expect(gif).toBeInstanceOf(Blob);
     expect(gif.size).toBeGreaterThan(0);
   });
   ```

3. **E2E 測試（使用者場景）**
   - 模擬真實使用者操作
   - 驗證 UI 互動
   
   ```javascript
   // tests/e2e/imageConversion.spec.js
   test('使用者應能上傳並轉換圖片', async ({ page }) => {
     await page.goto('/');
     await page.click('text=圖片格式轉換');
     await page.setInputFiles('input[type="file"]', 'test.jpg');
     await page.selectOption('select[name="format"]', 'png');
     await page.click('button:has-text("轉換")');
     
     await expect(page.locator('.preview')).toBeVisible();
   });
   ```

### 測試覆蓋率要求

- **契約測試**：100%（所有 public API）
- **整合測試**：核心流程必須覆蓋
- **E2E 測試**：所有使用者故事場景

### 執行測試

```bash
# 快速測試（契約 + 整合）
npm run test:contract && npm run test:integration

# 完整測試（包含 E2E）
npm test

# 監視模式（開發時）
npm run test:watch

# 單一測試檔案
npx vitest run tests/contract/yourTest.test.js
```

## 📝 提交規範

### Commit Message 格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type（必須）

- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文件更新
- `style`: 格式調整（不影響程式碼邏輯）
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置/工具相關

#### 範例

```bash
# 新功能
git commit -m "feat(converter): add WebP format support"

# Bug 修復
git commit -m "fix(gif): resolve 70% freeze issue with worker path"

# 文件更新
git commit -m "docs(readme): add browser compatibility section"

# 重構
git commit -m "refactor(canvas): extract canvas pool utility"

# 測試
git commit -m "test(e2e): add HEIC conversion scenarios"
```

#### 詳細描述範例

```
feat(gif): add video trimming support

允許使用者選擇影片的起始與結束時間，僅擷取指定範圍製作 GIF。

- 新增時間範圍選擇器 UI
- 實作 extractVideoFrames 時間參數
- 更新 GIF 製作流程整合時間裁剪
- 新增 E2E 測試場景

Closes #123
```

## 🏛️ 專案憲章

本專案遵循 [Speckit](https://github.com/Cactus-Liz/speckit) 開發方法論，詳細憲章請參閱：

**[`specs/001-media-converter/charter.md`](specs/001-media-converter/charter.md)**

### 核心價值

1. **品質優先**
   - 測試驅動開發（TDD）
   - 契約優先設計
   - 程式碼審查

2. **使用者至上**
   - 隱私保護（本地處理）
   - 友善的錯誤訊息
   - 無障礙支援

3. **簡潔實用**
   - 避免過度設計
   - MVP 優先交付
   - 保持程式碼可讀性

4. **開源透明**
   - 所有決策文件化
   - 程式碼開源
   - 歡迎社群貢獻

### 技術決策原則

- **無後端依賴**：所有功能純前端實現
- **無框架依賴**：使用原生 JavaScript
- **效能優先**：Web Workers 處理耗時任務
- **漸進增強**：核心功能優先，進階功能可選

### 不接受的 PR

以下類型的 PR 可能被拒絕：

- ❌ 引入大型框架（React、Vue 等）
- ❌ 需要後端伺服器的功能
- ❌ 未經討論的大型架構變更
- ❌ 缺少測試的新功能
- ❌ 破壞現有 API 契約的變更
- ❌ 違反隱私原則（上傳資料到伺服器）

## ❓ 常見問題

### Q: 我應該從哪裡開始？

A: 建議順序：
1. 閱讀 [`README.md`](README.md) 瞭解專案
2. 閱讀 [`specs/001-media-converter/charter.md`](specs/001-media-converter/charter.md) 瞭解設計理念
3. 查看 [`specs/001-media-converter/tasks.md`](specs/001-media-converter/tasks.md) 尋找待完成任務
4. 執行 `npm test` 確認環境正常
5. 從簡單的 Issue 或 Bug 修復開始

### Q: 如何執行單一測試檔案？

A:
```bash
# Vitest（契約/整合測試）
npx vitest run tests/contract/base64Converter.contract.test.js

# Playwright（E2E 測試）
npx playwright test tests/e2e/base64.spec.js
```

### Q: 如何啟用除錯模式？

A: 在瀏覽器 Console 執行：
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### Q: 如何測量效能？

A: 使用 URL 參數：
```
http://localhost:5173/?perf=true
```

### Q: 程式碼格式化失敗怎麼辦？

A:
```bash
# 查看問題
npm run format:check

# 自動修復
npm run format

# 如果還有問題，手動執行 Prettier
npx prettier --write "src/**/*.js"
```

### Q: E2E 測試失敗怎麼辦？

A:
```bash
# 啟用 UI 模式除錯
npx playwright test --ui

# 啟用 headed 模式查看瀏覽器
npx playwright test --headed

# 產生測試報告
npx playwright show-report
```

## 📞 聯繫方式

- **Issues**：[GitHub Issues](https://github.com/YOUR_USERNAME/ImageTools/issues)
- **Discussions**：[GitHub Discussions](https://github.com/YOUR_USERNAME/ImageTools/discussions)
- **Email**：請透過 GitHub 聯繫

## 🙏 致謝

感謝所有貢獻者的付出！您的每一個 PR 都讓這個專案更好。

---

**歡迎加入我們，一起打造更好的媒體轉換工具！** 🎉
