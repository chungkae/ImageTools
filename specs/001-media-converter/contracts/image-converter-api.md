# 圖片格式轉換器 API

**模組**: `src/services/imageConverter.js`  
**用途**: 圖片格式轉換（WebP/HEIC/SVG → PNG）  
**優先級**: P2

---

## 公開 API

### `async convertToFormat(inputFile, options)`

**描述**: 將圖片轉換為指定格式

**輸入**:
```typescript
inputFile: File | Blob                  // 輸入圖片
options: {
  outputFormat: 'image/png' | 'image/jpeg';  // 目標格式
  quality?: number;                      // JPEG 品質（0.0-1.0），預設 0.92
  width?: number;                        // 輸出寬度（0=保持原尺寸）
  height?: number;                       // 輸出高度（0=保持原尺寸）
  maintainAspectRatio?: boolean;         // 保持比例，預設 true
}
```

**輸出**:
```typescript
{
  file: Blob;                            // 轉換後檔案
  metadata: {
    originalFormat: string;              // 原始格式
    outputFormat: string;                // 輸出格式
    originalSize: number;                // 原始大小（bytes）
    outputSize: number;                  // 輸出大小（bytes）
    width: number;
    height: number;
    compressionRatio: number;            // 壓縮率（outputSize / originalSize）
  }
}
```

**錯誤**:
- `INVALID_INPUT`: 無效檔案
- `UNSUPPORTED_FORMAT`: 不支援的輸入格式
- `FILE_TOO_LARGE`: 檔案超過 50MB
- `CONVERSION_FAILED`: 解碼或轉換失敗
- `MEMORY_ERROR`: 記憶體不足

**效能要求**:
- 10MB 檔案 < 5 秒（符合 SC-002）

**範例**:
```javascript
const webpFile = new File([...], 'image.webp', { type: 'image/webp' });
const result = await convertToFormat(webpFile, {
  outputFormat: 'image/png',
  width: 800,
  maintainAspectRatio: true
});
downloadBlob(result.file, 'converted.png');
```

---

### `async batchConvert(files, options)`

**描述**: 批次轉換多個圖片

**輸入**:
```typescript
files: File[]                           // 圖片陣列
options: {
  outputFormat: 'image/png' | 'image/jpeg';
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  maxConcurrent?: number;                // 最大並行數，預設 3
  onProgress?: (completed: number, total: number) => void;
}
```

**輸出**:
```typescript
{
  results: Array<{
    success: boolean;
    filename: string;
    file?: Blob;
    metadata?: ConversionMetadata;
    error?: ConversionError;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalTime: number;                   // 毫秒
  }
}
```

**效能要求**:
- 每個檔案符合 `convertToFormat` 的效能標準
- 並行處理最多 3 個檔案（避免記憶體過載）

**範例**:
```javascript
const files = [...fileInputElement.files];
const result = await batchConvert(files, {
  outputFormat: 'image/png',
  onProgress: (completed, total) => {
    console.log(`進度：${completed}/${total}`);
  }
});
console.log(`成功：${result.summary.succeeded}，失敗：${result.summary.failed}`);
```

---

## 內部方法

### `async decodeHeic(file)`

**描述**: 使用 heic2any 解碼 HEIC 檔案

**輸入**: `File`  
**輸出**: `Blob` (image/png)

**依賴**: `heic2any` 庫

---

### `async decodeSvg(file, width, height)`

**描述**: 將 SVG 轉為 Canvas 再輸出 PNG

**輸入**: `File, number, number`  
**輸出**: `Blob` (image/png)

**流程**:
1. 讀取 SVG 文字內容
2. 建立 Image 元素載入 SVG
3. 繪製到 Canvas
4. 輸出 PNG

---

### `async decodeWebp(file)`

**描述**: 解碼 WebP 圖片（使用 Canvas API）

**輸入**: `File`  
**輸出**: `Blob` (image/png)

---

### `async resizeImage(blob, width, height, maintainAspectRatio)`

**描述**: 調整圖片尺寸

**輸入**: `Blob, number, number, boolean`  
**輸出**: `Blob`

---

### `validateInputFormat(mimeType)`

**描述**: 驗證輸入格式是否支援

**輸入**: `string`  
**輸出**: `boolean`

**支援格式**:
- `image/webp`
- `image/heic` (或 `image/heif`)
- `image/svg+xml`
- `image/png`
- `image/jpeg`
- `image/gif`

---

## 合約測試

測試檔案: `tests/contract/imageConverter.contract.test.js`

```javascript
describe('Image Converter Contract', () => {
  it('convertToFormat 應接受 WebP 並輸出 PNG', async () => {
    const webpFile = await loadTestFile('test.webp');
    const result = await convertToFormat(webpFile, {
      outputFormat: 'image/png'
    });
    
    expect(result.file.type).toBe('image/png');
    expect(result.metadata.originalFormat).toBe('image/webp');
  });
  
  it('convertToFormat 應正確處理 HEIC 檔案', async () => {
    const heicFile = await loadTestFile('test.heic');
    const result = await convertToFormat(heicFile, {
      outputFormat: 'image/png'
    });
    
    expect(result.file.type).toBe('image/png');
    expect(result.metadata.width).toBeGreaterThan(0);
  });
  
  it('convertToFormat 應在 5 秒內完成 10MB 轉換（SC-002）', async () => {
    const largeFile = createMockFile(10 * 1024 * 1024, 'image/webp');
    const start = Date.now();
    
    await convertToFormat(largeFile, { outputFormat: 'image/png' });
    
    expect(Date.now() - start).toBeLessThan(5000);
  });
  
  it('convertToFormat 應保持寬高比', async () => {
    const file = await loadTestFile('landscape.png'); // 1920x1080
    const result = await convertToFormat(file, {
      outputFormat: 'image/png',
      width: 960,
      maintainAspectRatio: true
    });
    
    expect(result.metadata.width).toBe(960);
    expect(result.metadata.height).toBe(540); // 保持 16:9
  });
  
  it('batchConvert 應正確處理混合格式', async () => {
    const files = [
      await loadTestFile('test.webp'),
      await loadTestFile('test.heic'),
      await loadTestFile('test.svg')
    ];
    
    const result = await batchConvert(files, {
      outputFormat: 'image/png'
    });
    
    expect(result.summary.succeeded).toBe(3);
    expect(result.results.every(r => r.success)).toBe(true);
  });
  
  it('batchConvert 應限制並行數量', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;
    
    // Mock convertToFormat 來追蹤並行數
    const original = convertToFormat;
    convertToFormat = async (...args) => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await delay(100);
      concurrentCount--;
      return original(...args);
    };
    
    const files = Array(10).fill(null).map(() => createMockFile(1024));
    await batchConvert(files, { outputFormat: 'image/png', maxConcurrent: 3 });
    
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });
});
```

---

## 依賴

- **外部庫**: `heic2any` (v0.0.4+)
- **瀏覽器 API**: Canvas API, FileReader, Image
- **內部模組**: 
  - `src/utils/validators.js`
  - `src/workers/imageProcessor.worker.js`（HEIC 解碼在 Worker 執行）
- **錯誤處理**: `src/constants/messages.js`

---

## 效能優化

1. **HEIC 解碼**: 在 Web Worker 執行，避免阻塞 UI
2. **批次處理**: 限制並行數（預設 3），避免記憶體溢位
3. **Canvas 池**: 重用 Canvas 元素
4. **記憶體監控**: 超過 500MB 時拒絕新任務

---

## 憲法檢查

- ✅ **MVP-First**: P2 功能，僅在 P1 完成後實作
- ✅ **Testability**: 完整合約測試，包含效能測試
- ✅ **Simplicity**: 僅使用 heic2any（HEIC 必須），其他用原生 API
- ✅ **High Quality**: 批次處理錯誤隔離，記憶體管理
- ✅ **繁體中文**: 錯誤訊息、進度回呼都用繁中
