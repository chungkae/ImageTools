# Base64 轉換器 API

**模組**: `src/services/base64Converter.js`  
**用途**: Base64 與圖片格式互相轉換  
**優先級**: P1（MVP 核心功能）

---

## 公開 API

### `async base64ToImage(base64Input, options)`

**描述**: 將 Base64 字串轉換為圖片檔案

**輸入**:
```typescript
base64Input: string                     // Base64 字串（含或不含 data URI）
options?: {
  outputFormat?: 'image/png' | 'image/jpeg';  // 輸出格式，預設 'image/png'
  filename?: string;                     // 檔案名稱，預設 'image.png'
  quality?: number;                      // JPEG 品質（0.0-1.0），預設 0.92
}
```

**輸出**:
```typescript
{
  file: Blob;                            // 圖片檔案
  metadata: {
    width: number;
    height: number;
    size: number;                        // bytes
    format: string;                      // MIME type
  }
}
```

**錯誤**:
- `INVALID_BASE64`: 無效的 Base64 格式
- `FILE_TOO_LARGE`: 解碼後超過 50MB
- `CONVERSION_FAILED`: Canvas 處理失敗

**效能要求**:
- 5MB 檔案 < 2 秒（符合 SC-001）

**範例**:
```javascript
const result = await base64ToImage('data:image/png;base64,iVBOR...', {
  outputFormat: 'image/png',
  filename: 'converted.png'
});
console.log(`已轉換：${result.metadata.width}x${result.metadata.height}`);
```

---

### `async imageToBase64(file, options)`

**描述**: 將圖片檔案轉換為 Base64 字串

**輸入**:
```typescript
file: File | Blob                       // 圖片檔案
options?: {
  outputFormat?: 'image/png' | 'image/jpeg';  // 輸出格式，預設 'image/png'
  quality?: number;                      // JPEG 品質（0.0-1.0），預設 0.92
  includePrefix?: boolean;               // 是否包含 data URI prefix，預設 true
}
```

**輸出**:
```typescript
{
  base64: string;                        // Base64 字串
  metadata: {
    originalSize: number;                // 原始檔案大小（bytes）
    base64Length: number;                // Base64 字串長度
    format: string;                      // 輸出格式
  }
}
```

**錯誤**:
- `INVALID_INPUT`: 無效的檔案
- `FILE_TOO_LARGE`: 檔案超過 50MB
- `UNSUPPORTED_FORMAT`: 不支援的輸入格式
- `CONVERSION_FAILED`: FileReader 或 Canvas 失敗

**效能要求**:
- 5MB 檔案 < 2 秒（符合 SC-001）

**範例**:
```javascript
const result = await imageToBase64(imageFile, {
  outputFormat: 'image/png',
  includePrefix: true
});
navigator.clipboard.writeText(result.base64);
```

---

## 內部方法

### `validateBase64(base64String)`

**描述**: 驗證 Base64 格式

**輸入**: `string`  
**輸出**: `boolean`

---

### `parseDataUri(dataUri)`

**描述**: 解析 data URI

**輸入**: `string`  
**輸出**: `{ mimeType: string, base64: string } | null`

---

### `estimateDecodedSize(base64String)`

**描述**: 估算 Base64 解碼後檔案大小

**輸入**: `string`  
**輸出**: `number` (bytes)

**公式**: `Math.ceil(base64Length * 0.75)`

---

## 合約測試

測試檔案: `tests/contract/base64Converter.contract.test.js`

```javascript
describe('Base64 Converter Contract', () => {
  it('base64ToImage 應接受有效 Base64 並回傳 Blob', async () => {
    const validBase64 = 'data:image/png;base64,iVBORw0KGgo...';
    const result = await base64ToImage(validBase64);
    
    expect(result).toHaveProperty('file');
    expect(result.file).toBeInstanceOf(Blob);
    expect(result.metadata.format).toBe('image/png');
  });
  
  it('base64ToImage 應拒絕無效 Base64', async () => {
    await expect(base64ToImage('not-base64')).rejects.toThrow('INVALID_BASE64');
  });
  
  it('imageToBase64 應接受 File 並回傳 Base64 字串', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const result = await imageToBase64(file);
    
    expect(typeof result.base64).toBe('string');
    expect(result.base64).toMatch(/^data:image\/png;base64,/);
  });
  
  it('imageToBase64 應拒絕過大檔案', async () => {
    const largeFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.png');
    await expect(imageToBase64(largeFile)).rejects.toThrow('FILE_TOO_LARGE');
  });
  
  it('應在 2 秒內完成 5MB 轉換（SC-001）', async () => {
    const start = Date.now();
    const file = createMockFile(5 * 1024 * 1024); // 5MB
    await imageToBase64(file);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## 依賴

- **瀏覽器 API**: FileReader, Canvas API, Blob
- **內部模組**: `src/utils/validators.js`（驗證）
- **錯誤處理**: `src/constants/messages.js`（錯誤訊息）

---

## 效能優化

1. **預先驗證**: 先驗證 Base64 格式，避免無效輸入浪費資源
2. **檔案大小檢查**: 在解碼前估算檔案大小
3. **Canvas 重用**: 單例模式重用 Canvas 元素
4. **記憶體管理**: 轉換完成後立即釋放 ObjectURL

---

## 憲法檢查

- ✅ **MVP-First**: 僅實作核心轉換，無額外功能
- ✅ **Testability**: 所有公開方法都有合約測試
- ✅ **Simplicity**: 使用原生 API，無外部依賴
- ✅ **High Quality**: 錯誤處理完整，效能達標
- ✅ **繁體中文**: 所有訊息使用繁中
