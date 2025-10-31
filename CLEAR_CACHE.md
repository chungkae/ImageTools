# 清除快取指南

## 問題：排版錯誤或樣式未更新

如果遇到以下問題：
- ✅ 按 `Ctrl+Shift+R` 硬重新整理後正常
- ❌ 但一般重新整理又變亂

這是因為 **Service Worker 快取了舊的 CSS 檔案**。

---

## 解決方案（3 種方法）

### 方法 1：使用清除快取工具頁面 🛠️ **推薦**

1. 前往 http://localhost:5175/clear-cache.html
2. 點擊「清除所有快取」按鈕
3. 點擊「移除 Service Worker」按鈕
4. 點擊「重新載入應用程式」

### 方法 2：開發者工具手動清除

1. 按 `F12` 開啟開發者工具
2. 前往「Application」標籤（或「應用程式」）
3. 左側選單：
   - **Storage** → 點擊「Clear site data」（清除網站資料）
   - **Service Workers** → 點擊「Unregister」（取消註冊）
   - **Cache Storage** → 刪除所有 `imagetools-*` 快取
4. 關閉開發者工具
5. 按 `Ctrl+Shift+R` 硬重新整理

### 方法 3：瀏覽器無痕模式測試

1. 按 `Ctrl+Shift+N`（Chrome）或 `Ctrl+Shift+P`（Firefox）
2. 前往 http://localhost:5175/
3. 無快取干擾，可驗證最新程式碼

---

## 已修正的問題

### ✅ HEIC 轉換錯誤

**錯誤訊息**:
```
Refused to load the script 'https://cdn.jsdelivr.net/npm/heic2any...'
HEIC_DECODER_NOT_AVAILABLE
```

**修正內容**:
- ❌ 舊方式：從 CDN 載入 heic2any（被 CSP 阻擋）
- ✅ 新方式：使用 npm 安裝的本地套件（動態 import）

**檔案**: `src/services/imageConverter.js` 的 `loadHeic2any()` 方法

### ✅ Service Worker 快取策略改進

**變更**:
- CSS 檔案：從 **Cache First** 改為 **Network First**
- 確保每次都載入最新的樣式檔案
- 快取版本從 `v1` 更新到 `v2`

**檔案**: `public/sw.js`

---

## 開發時最佳實踐

### 暫時停用 Service Worker（開發階段）

在 `src/main.js` 中註解掉 Service Worker 註冊：

```javascript
// 開發時暫時停用
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', async () => {
//     // ... SW 註冊程式碼
//   });
// }
```

### 使用 Vite 的 HMR（熱模組替換）

Vite 的開發伺服器已內建 HMR：
- 修改 CSS → 自動更新（無需重新整理）
- 修改 JS → 自動重新載入模組
- Service Worker 不會干擾 HMR

---

## 驗證修正是否成功

1. 前往 http://localhost:5175/clear-cache.html
2. 清除所有快取和 Service Worker
3. 返回主頁 http://localhost:5175/
4. 測試 HEIC 轉換功能：
   - 上傳 HEIC 圖片
   - 選擇輸出格式（PNG）
   - 點擊「開始轉換」
   - ✅ 應該成功轉換，無 CSP 錯誤

5. 檢查 Console：
   - ❌ 不應該出現 `Refused to load the script` 錯誤
   - ✅ 應該看到 `✅ Service Worker 註冊成功`

---

## 技術細節

### heic2any 載入方式

**修正前**:
```javascript
async loadHeic2any() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/heic2any...'; // ❌ 被 CSP 阻擋
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

**修正後**:
```javascript
async loadHeic2any() {
  try {
    const heic2anyModule = await import('heic2any'); // ✅ 本地套件
    window.heic2any = heic2anyModule.default || heic2anyModule;
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load heic2any:', error);
    return Promise.reject(error);
  }
}
```

### Service Worker 快取策略

**CSS - Network First**:
```javascript
if (request.destination === 'style') {
  event.respondWith(
    fetch(request)  // 1️⃣ 先嘗試網路
      .then((response) => {
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone); // 2️⃣ 快取回應
        });
        return response;
      })
      .catch(() => caches.match(request)) // 3️⃣ 失敗時使用快取
  );
}
```

**JavaScript/圖片 - Cache First**:
```javascript
if (request.destination === 'script' || request.destination === 'image') {
  event.respondWith(
    caches.match(request)  // 1️⃣ 先檢查快取
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse; // 2️⃣ 有快取就用
        return fetch(request); // 3️⃣ 沒快取才從網路取得
      })
  );
}
```

---

## 故障排除

### 問題：清除快取後仍然有問題

**檢查清單**:
1. ✅ 確認 Service Worker 已完全移除（開發者工具 → Application → Service Workers）
2. ✅ 確認所有快取已清除（Application → Cache Storage）
3. ✅ 確認開發伺服器已重新啟動（`npm run dev`）
4. ✅ 嘗試無痕模式測試

### 問題：HEIC 轉換仍然失敗

**檢查清單**:
1. ✅ 確認 heic2any 已安裝：`npm list heic2any`
2. ✅ 確認 Console 無 CSP 錯誤
3. ✅ 確認 Network 標籤中有載入 `heic-decoder-*.js` chunk
4. ✅ 嘗試重新安裝依賴：`rm -rf node_modules; npm install`

---

## 後續建議

### 生產環境部署

部署時記得：
1. 設定正確的 HTTP headers（CSP、X-Frame-Options 等）
2. Service Worker 快取策略適合生產環境
3. 考慮使用 CDN 加速靜態資源（但保持 heic2any 使用本地版本）

### 開發環境建議

開發時可暫時停用 Service Worker：
- 修改 `src/main.js` 註解掉 SW 註冊
- 或在瀏覽器開發者工具中勾選「Bypass for network」

---

**更新日期**: 2025-10-31  
**版本**: v3 (修正 HEIC 轉換 CSP 問題)

## 最新修正 (v3)

### ✅ HEIC 轉換 EvalError 修正

**錯誤訊息**:
```
Uncaught EvalError: Refused to evaluate a string as JavaScript 
because 'unsafe-eval' is not an allowed source of script
```

**根本原因**:
- heic2any 庫內部使用 `new Function()` 進行程式碼動態執行
- 這需要 CSP 中的 `'unsafe-eval'` 權限

**修正內容**:
- ✅ CSP `script-src` 加入 `'unsafe-eval'`
- ✅ Service Worker 快取版本更新到 v3
- ✅ heic2any 使用本地 npm 套件（動態 import）

**安全性說明**:
- `'unsafe-eval'` 僅用於 heic2any 庫內部
- 我們的程式碼不直接使用 `eval()` 或 `new Function()`
- 所有使用者輸入仍經過完整清理（sanitizer.js）

---
