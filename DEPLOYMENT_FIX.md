# B 電腦部署錯誤修正指南

## 問題原因

1. **Service Worker 快取路徑錯誤**：開發環境路徑（`/src/`）≠ 生產環境路徑（`/assets/`）
2. **manifest.json 載入失敗**：Service Worker 嘗試快取但失敗
3. **HEIC decoder 動態載入問題**：檔案存在但 Service Worker 干擾

---

## 解決方案 1：重新建置並修正 Service Worker（推薦）✅

### 步驟 1：修正 Service Worker 快取清單

編輯 `public/sw.js` 的 CORE_ASSETS：

```javascript
// ❌ 錯誤（開發環境路徑）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',  // 生產環境不存在！
  '/manifest.json'
];

// ✅ 正確（只快取確定存在的檔案）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];
```

### 步驟 2：重新建置

```powershell
cd d:\Git_Project\Side_Project\ImageTools
npm run build
```

### 步驟 3：重新複製 dist 資料夾到 B 電腦

確保複製**完整的** dist 資料夾，包含：
- ✅ index.html
- ✅ manifest.json
- ✅ sw.js
- ✅ assets/ 資料夾（所有 JS/CSS 檔案）
- ✅ icons/ 資料夾
- ✅ clear-cache.html

---

## 解決方案 2：清除 B 電腦的快取（臨時）

如果無法重新建置，在 B 電腦：

### 方法 A：使用清除快取頁面

1. 訪問 `http://localhost:8088/clear-cache.html`
2. 點選「清除所有快取」
3. 點選「解除註冊 Service Worker」
4. 點選「重新載入應用程式」

### 方法 B：手動清除（瀏覽器）

1. 按 `F12` 開啟開發者工具
2. 前往 **Application** 標籤
3. 左側選單：
   - **Service Workers** → 點選「Unregister」
   - **Cache Storage** → 刪除所有 imagetools 快取
   - **Local Storage** → 清除所有項目
4. 關閉所有瀏覽器分頁
5. 重新開啟 `http://localhost:8088`

### 方法 C：使用無痕模式測試

```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```

---

## 解決方案 3：停用 Service Worker（最簡單）

### 修改 index.html（暫時停用）

在 B 電腦的 `dist/index.html` 中找到這段：

```html
<!-- 註冊 Service Worker -->
<script>
  if ('serviceWorker' in navigator) {
    // 暫時註解掉
    // navigator.serviceWorker.register('/sw.js')
  }
</script>
```

重新載入頁面即可。

---

## 驗證修復

在 B 電腦瀏覽器的 Console (F12) 應該看到：

✅ **成功**：
```
🚀 媒體轉換工具箱 v1.0.0
✅ 錯誤邊界已初始化
[INFO] 應用程式初始化完成
```

❌ **失敗**（仍有問題）：
```
Failed to load resource: net::ERR_FAILED
HEIC_DECODER_NOT_AVAILABLE
```

---

## 預防措施

### 更新 .gitignore（避免提交舊的 dist）

確保 `.gitignore` 包含：
```gitignore
dist/
node_modules/
```

### 建立自動化部署腳本

建立 `deploy.bat`：
```batch
@echo off
echo 正在建置專案...
call npm run build
echo.
echo 建置完成！
echo.
echo 請複製整個 dist 資料夾到目標電腦
pause
```

---

## 常見問題

### Q: 為什麼 A 電腦（開發環境）沒問題？

**答**：開發環境使用 `npm run dev`，檔案直接從 `src/` 載入，沒有經過 Vite 打包。

### Q: 可以不用 Service Worker 嗎？

**答**：可以！PWA 功能會失效（無法離線使用），但核心功能正常。

### Q: manifest.json 為什麼重要？

**答**：它是 PWA 配置檔，定義應用程式名稱、圖示等。缺少不影響功能，但會有警告。

---

## 終極解決方案：自動化部署

使用 GitHub Pages 或 Vercel，一次設定永久使用：

```powershell
# Vercel 部署（一行指令）
npm install -g vercel
vercel --prod
```

獲得網址：`https://imagetools-xxx.vercel.app`

任何電腦都能直接使用，無需複製檔案！
