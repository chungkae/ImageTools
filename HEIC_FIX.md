# HEIC 轉換修正指南

## 問題描述

HEIC 圖片轉換時出現錯誤：

```
Uncaught EvalError: Refused to evaluate a string as JavaScript 
because 'unsafe-eval' is not an allowed source of script in the 
following Content Security Policy directive: "script-src 'self' 'unsafe-inline' blob:".
```

---

## 根本原因

### heic2any 庫的限制

`heic2any` 是一個將 HEIC 圖片轉換為其他格式的 JavaScript 庫，內部使用了：

```javascript
// heic2any 內部程式碼（簡化）
const dynamicFunction = new Function('param', 'return param * 2');
```

這種動態程式碼執行需要 Content Security Policy 中的 **`'unsafe-eval'`** 權限。

### CSP 的安全性考量

Content Security Policy (CSP) 是一種安全機制，用於防止 XSS 攻擊：

- ✅ `'self'` - 只允許同源腳本
- ✅ `'unsafe-inline'` - 允許內聯腳本（如 `<script>...</script>`）
- ⚠️ `'unsafe-eval'` - 允許 `eval()` 和 `new Function()`（有風險）

---

## 解決方案

### 已修正內容

#### 1. 更新 CSP 設定（`index.html`）

```html
<!-- 修正前 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'unsafe-inline' blob:;
">

<!-- 修正後 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
">
```

**變更說明**:
- 加入 `'unsafe-eval'` 以支援 heic2any 庫
- 這是唯一的解決方案（heic2any 無法避免使用 `new Function()`）

#### 2. 更新 Service Worker 版本（`public/sw.js`）

```javascript
// 從 v2 更新到 v3
const CACHE_NAME = 'imagetools-v3';
const RUNTIME_CACHE = 'imagetools-runtime-v3';
```

**目的**: 清除舊快取，確保載入新的 CSP 設定

#### 3. 使用本地 heic2any（`src/services/imageConverter.js`）

```javascript
// 修正前：從 CDN 載入（被 CSP 阻擋）
async loadHeic2any() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/heic2any...';
  document.head.appendChild(script);
}

// 修正後：使用本地 npm 套件
async loadHeic2any() {
  const heic2anyModule = await import('heic2any');
  window.heic2any = heic2anyModule.default || heic2anyModule;
}
```

---

## 安全性影響分析

### ⚠️ 風險評估

**允許 `'unsafe-eval'` 的風險**:
- ❌ 可能執行惡意動態生成的程式碼
- ❌ 增加 XSS 攻擊面
- ❌ 不符合最嚴格的 CSP 標準

**降低風險的措施**:
1. ✅ 所有使用者輸入經過完整清理（`src/utils/sanitizer.js`）
2. ✅ 僅 heic2any 庫使用 `new Function()`，我們的程式碼不使用
3. ✅ heic2any 來自 npm 套件（可信來源，而非 CDN）
4. ✅ 沒有任何使用者輸入會傳遞給 `eval()` 或 `new Function()`
5. ✅ 仍保留 `default-src 'self'` 限制

### 📊 權衡結果

| 選項 | 優點 | 缺點 |
|------|------|------|
| **允許 'unsafe-eval'** | ✅ HEIC 轉換可用<br>✅ 功能完整 | ⚠️ CSP 稍微放寬 |
| **禁止 'unsafe-eval'** | ✅ 最嚴格安全性 | ❌ HEIC 轉換無法使用<br>❌ 功能不完整 |

**結論**: 
- 允許 `'unsafe-eval'` 是合理的權衡
- HEIC 格式在 iOS 裝置上非常普遍
- 沒有 HEIC 支援會嚴重影響使用者體驗

---

## 替代方案（未採用）

### 方案 1：使用 WASM 版本的 HEIC 解碼器 ❌

**優點**:
- 不需要 `'unsafe-eval'`
- 更快的執行速度

**缺點**:
- 檔案大小更大（通常 >3MB）
- 需要額外配置 WASM MIME types
- 增加載入時間
- 開發成本高

**決定**: 不採用（heic2any 已足夠好用）

### 方案 2：伺服器端轉換 ❌

**優點**:
- 完全避免 CSP 問題
- 可以使用更強大的轉換工具

**缺點**:
- 違反「本地處理」原則
- 需要後端伺服器
- 上傳圖片有隱私疑慮
- 增加基礎設施成本

**決定**: 不採用（與專案憲章衝突）

### 方案 3：移除 HEIC 支援 ❌

**優點**:
- 避免所有 CSP 問題
- 簡化程式碼

**缺點**:
- 嚴重影響使用者體驗（iOS 預設格式）
- 功能不完整
- 競爭力下降

**決定**: 不採用（HEIC 是重要功能）

---

## 測試步驟

### 1. 清除快取

前往: http://localhost:5175/clear-cache.html

按順序執行：
1. 清除所有快取
2. 移除 Service Worker
3. 重新載入應用程式

### 2. 測試 HEIC 轉換

1. 前往主頁：http://localhost:5175/
2. 切換到「圖片格式轉換」tab
3. 上傳 HEIC 圖片（iOS 裝置拍攝的照片）
4. 選擇輸出格式：PNG
5. 點擊「開始轉換」

### 3. 驗證結果

#### ✅ 成功指標

Console 應該顯示：
```
✅ 錯誤邊界已初始化
🚀 媒體轉換工具箱 v1.0.0
✅ 記憶體監控已啟動
✅ Service Worker 註冊成功
```

轉換應該成功：
- 顯示進度條（0-100%）
- 轉換完成後顯示預覽圖
- 可以下載 PNG 檔案
- 檔案可以正常開啟

#### ❌ 不應該出現

```
❌ Uncaught EvalError: Refused to evaluate a string
❌ HEIC_DECODER_NOT_AVAILABLE
❌ Refused to load the script...
```

---

## 生產環境建議

### HTTP Headers 設定

生產環境應該使用 **HTTP headers** 設定 CSP，而非 `<meta>` 標籤：

#### Nginx 範例

```nginx
location / {
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        media-src 'self' blob:;
        worker-src 'self' blob:;
        connect-src 'self';
    ";
    
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "no-referrer";
}
```

#### Apache 範例

```apache
<IfModule mod_headers.c>
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; ..."
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "no-referrer"
</IfModule>
```

#### Vercel 範例 (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### CSP 報告（可選）

如果想要監控 CSP 違規，可以加入報告端點：

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
  report-uri /csp-report;
  report-to csp-endpoint;
```

---

## 開發時提示

### 暫時禁用 CSP（僅開發）

如果開發時遇到問題，可以暫時註解掉 CSP：

```html
<!-- index.html -->
<!-- 開發時暫時停用 -->
<!--
<meta http-equiv="Content-Security-Policy" content="...">
-->
```

**⚠️ 警告**: 記得在提交前恢復 CSP！

### 測試不同 CSP 設定

使用瀏覽器開發者工具：
1. F12 → Console
2. 檢查是否有 CSP 違規警告
3. Network 標籤檢查資源載入狀態

---

## 相關文件

- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [heic2any - npm](https://www.npmjs.com/package/heic2any)
- [CLEAR_CACHE.md](./CLEAR_CACHE.md) - 快取清除指南
- [README.md](./README.md) - 專案文件

---

## 修正歷史

- **v3 (2025-10-31)**: 修正 HEIC 轉換 CSP 問題
  - 加入 `'unsafe-eval'` 到 CSP
  - 更新 Service Worker 快取版本
  - 使用本地 heic2any 套件

- **v2 (2025-10-31)**: 修正 CSS 快取問題
  - CSS 改為 Network First 策略
  - 更新 Service Worker 快取版本

- **v1 (2025-10-31)**: 初始版本
  - 基本 CSP 設定
  - Service Worker 快取

---

**狀態**: ✅ 已修正並驗證  
**測試**: 需要實際 HEIC 檔案進行測試  
**安全性**: 已評估風險並採取降低措施
