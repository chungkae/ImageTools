# 部署到 B 電腦檢查清單

## ✅ 部署前準備（A 電腦）

### 1. 確認專案已建置
```powershell
cd d:\Git_Project\Side_Project\ImageTools
npm run build
```

### 2. 檢查 dist 資料夾內容

應包含以下檔案：
```
dist/
├── index.html ✅
├── manifest.json ✅
├── sw.js ✅
├── clear-cache.html ✅
├── gif.worker.js ✅
├── assets/
│   ├── index-xxxxx.js ✅
│   ├── index-xxxxx.css ✅
│   ├── heic-decoder-xxxxx.js ✅
│   ├── gifEncoder.worker-xxxxx.js ✅
│   └── gif-encoder-xxxxx.js ✅
└── icons/
    ├── icon-192x192.png ✅
    └── icon-512x512.png ✅
```

### 3. 複製整個 dist 資料夾
- 方法 A：使用 USB 隨身碟
- 方法 B：透過區域網路分享
- 方法 C：使用雲端硬碟（Google Drive, OneDrive）

---

## ✅ B 電腦設定

### 1. 準備環境

#### 選項 A：使用 Node.js + serve（推薦）

1. **安裝 Node.js**（若未安裝）
   - 下載：https://nodejs.org/
   - 選擇 LTS 版本
   - 安裝時勾選「Add to PATH」

2. **安裝 serve**
   ```powershell
   npm install -g serve
   ```

3. **啟動伺服器**
   ```powershell
   cd C:\路徑\到\dist
   serve -p 8088
   ```

#### 選項 B：使用 Python

1. **檢查 Python 是否已安裝**
   ```powershell
   python --version
   ```

2. **啟動伺服器**
   ```powershell
   cd C:\路徑\到\dist
   python -m http.server 8088
   ```

### 2. 開啟瀏覽器
訪問：`http://localhost:8088`

---

## ⚠️ 首次使用注意事項

### 清除舊快取（如果之前使用過舊版本）

1. **方法 A：使用清除快取頁面**
   - 訪問：`http://localhost:8088/clear-cache.html`
   - 點選「清除所有快取」
   - 點選「解除註冊 Service Worker」
   - 點選「重新載入應用程式」

2. **方法 B：手動清除**
   - 按 `F12` 開啟開發者工具
   - Application 標籤 → Service Workers → Unregister
   - Application 標籤 → Cache Storage → 刪除所有
   - 關閉瀏覽器重開

3. **方法 C：使用無痕模式**
   - `Ctrl + Shift + N` (Chrome)
   - `Ctrl + Shift + P` (Firefox)

---

## 🧪 功能測試清單

啟動後，測試以下功能：

### Base64 轉換
- [ ] 貼上 Base64 字串 → 下載 PNG
- [ ] 上傳圖片 → 複製 Base64

### 圖片格式轉換
- [ ] 上傳 WebP → 下載 PNG
- [ ] 上傳 HEIC → 下載 PNG ⭐
- [ ] 上傳 SVG → 下載 PNG
- [ ] 批次轉換多張圖片

### GIF 製作
- [ ] 上傳影片 → 產生 GIF ⭐
- [ ] 上傳多張圖片 → 產生 GIF
- [ ] 調整參數（幀率、品質、尺寸）

---

## 🐛 故障排除

### 問題 1：HEIC 轉換卡在 70%

**錯誤訊息**：
```
Failed to load heic2any
HEIC_DECODER_NOT_AVAILABLE
```

**解決方案**：
1. 確認 `assets/heic-decoder-xxxxx.js` 檔案存在
2. 清除瀏覽器快取（見上方）
3. 檢查 Console (F12) 是否有其他錯誤
4. 確認伺服器正常運行（終端沒有錯誤）

### 問題 2：GIF 製作卡在 60%

**錯誤訊息**：
```
Failed to fetch manifest.json
Service Worker error
```

**解決方案**：
1. 確認 `manifest.json` 檔案存在
2. 解除註冊 Service Worker（見清除快取步驟）
3. 使用無痕模式測試
4. 檢查 `sw.js` 是否存在

### 問題 3：頁面空白或樣式錯誤

**可能原因**：
- 檔案複製不完整
- 直接開啟 index.html（應該使用 HTTP 伺服器）

**解決方案**：
1. 確認所有檔案都複製完整
2. 確認使用 HTTP 伺服器（不是直接開啟檔案）
3. 硬重新整理：`Ctrl + Shift + R`

### 問題 4：Service Worker 無法更新

**解決方案**：
```powershell
# 訪問清除快取頁面
http://localhost:8088/clear-cache.html

# 或在 Console (F12) 執行
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})
```

---

## 📝 版本記錄

### v4 (2025-11-07)
- ✅ 修正 Service Worker 生產環境路徑問題
- ✅ 移除開發環境專用的快取路徑
- ✅ 改善錯誤處理

### v3 (2025-10-31)
- 修正 HEIC CSP 問題
- 新增 'unsafe-eval' 支援

### v2
- CSS Network First 策略

### v1
- 初始版本

---

## 🚀 進階：自動化部署

### 建立啟動批次檔

建立 `啟動圖片工具.bat`：
```batch
@echo off
echo 正在啟動媒體轉換工具箱...
cd /d "%~dp0"
start http://localhost:8088
serve -p 8088
pause
```

放在 dist 資料夾內，雙擊即可啟動！

---

## 📞 需要協助？

如果遇到問題：

1. 檢查瀏覽器 Console (F12) 的錯誤訊息
2. 檢查終端是否有錯誤訊息
3. 參考 `DEPLOYMENT_FIX.md` 詳細說明
4. 確認檔案完整性
5. 嘗試使用無痕模式測試
