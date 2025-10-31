# 儲存服務 API

**模組**: `src/services/storageService.js`  
**用途**: IndexedDB 檔案快取與 localStorage 設定管理  
**優先級**: P2（支援離線功能）

---

## 公開 API

### IndexedDB 操作（檔案快取）

#### `async saveFile(id, file, metadata)`

**描述**: 儲存檔案到 IndexedDB

**輸入**:
```typescript
id: string                              // 檔案 ID（UUID）
file: Blob                              // 檔案內容
metadata?: {
  name: string;
  type: string;
  size: number;
  createdAt: Date;
}
```

**輸出**:
```typescript
{
  success: boolean;
  id: string;
}
```

**錯誤**:
- `STORAGE_ERROR`: IndexedDB 寫入失敗
- `QUOTA_EXCEEDED`: 儲存空間不足

---

#### `async loadFile(id)`

**描述**: 從 IndexedDB 載入檔案

**輸入**: `string` (檔案 ID)  
**輸出**:
```typescript
{
  file: Blob;
  metadata: {
    name: string;
    type: string;
    size: number;
    createdAt: Date;
  };
} | null
```

**錯誤**:
- `STORAGE_ERROR`: IndexedDB 讀取失敗

---

#### `async deleteFile(id)`

**描述**: 刪除快取檔案

**輸入**: `string` (檔案 ID)  
**輸出**: `{ success: boolean }`

---

#### `async clearCache()`

**描述**: 清空所有快取檔案

**輸出**: `{ deletedCount: number }`

---

#### `async getCacheInfo()`

**描述**: 取得快取統計資訊

**輸出**:
```typescript
{
  fileCount: number;
  totalSize: number;                     // bytes
  oldestFile: Date;
  newestFile: Date;
}
```

---

### localStorage 操作（使用者偏好）

#### `savePreferences(preferences)`

**描述**: 儲存使用者偏好設定

**輸入**:
```typescript
preferences: {
  defaultGifParams?: Partial<GifParameters>;
  theme?: 'light' | 'dark';
  language?: 'zh-TW';
  autoSaveResults?: boolean;
  showFileSize?: boolean;
}
```

**輸出**: `{ success: boolean }`

**儲存位置**: `localStorage['imagetools_preferences']`

---

#### `loadPreferences()`

**描述**: 載入使用者偏好設定

**輸出**:
```typescript
{
  defaultGifParams: GifParameters;
  theme: 'light' | 'dark';
  language: 'zh-TW';
  autoSaveResults: boolean;
  showFileSize: boolean;
  lastUpdated: Date;
}
```

**預設值**:
```javascript
{
  defaultGifParams: {
    frameRate: 10,
    quality: 10,
    repeat: 0
  },
  theme: 'light',
  language: 'zh-TW',
  autoSaveResults: false,
  showFileSize: true
}
```

---

#### `clearPreferences()`

**描述**: 清除偏好設定（恢復預設值）

**輸出**: `{ success: boolean }`

---

## 內部方法

### `initDb()`

**描述**: 初始化 IndexedDB

**Schema**:
```javascript
{
  name: 'ImageToolsDB',
  version: 1,
  stores: [
    {
      name: 'cachedFiles',
      keyPath: 'id',
      indexes: [
        { name: 'name', keyPath: 'name' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    }
  ]
}
```

---

### `checkQuota()`

**描述**: 檢查儲存空間配額

**輸出**:
```typescript
{
  usage: number;                         // bytes
  quota: number;                         // bytes
  available: number;                     // bytes
  percentUsed: number;                   // 0-100
}
```

---

### `cleanOldFiles(maxAge)`

**描述**: 清理超過指定天數的快取檔案

**輸入**: `number` (天數)  
**輸出**: `{ deletedCount: number }`

---

## 合約測試

測試檔案: `tests/contract/storageService.contract.test.js`

```javascript
describe('Storage Service Contract', () => {
  beforeEach(async () => {
    await clearCache();
    clearPreferences();
  });
  
  it('saveFile 應儲存 Blob 到 IndexedDB', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const result = await saveFile('test-id', blob, {
      name: 'test.txt',
      type: 'text/plain',
      size: 4,
      createdAt: new Date()
    });
    
    expect(result.success).toBe(true);
    expect(result.id).toBe('test-id');
  });
  
  it('loadFile 應正確載入已儲存檔案', async () => {
    const blob = new Blob(['test data'], { type: 'text/plain' });
    await saveFile('test-id', blob, { name: 'test.txt' });
    
    const loaded = await loadFile('test-id');
    
    expect(loaded).not.toBeNull();
    expect(loaded.metadata.name).toBe('test.txt');
    expect(loaded.file.size).toBe(9);
  });
  
  it('loadFile 應在找不到檔案時回傳 null', async () => {
    const result = await loadFile('non-existent-id');
    expect(result).toBeNull();
  });
  
  it('deleteFile 應刪除指定檔案', async () => {
    const blob = new Blob(['test']);
    await saveFile('test-id', blob, { name: 'test.txt' });
    
    const result = await deleteFile('test-id');
    expect(result.success).toBe(true);
    
    const loaded = await loadFile('test-id');
    expect(loaded).toBeNull();
  });
  
  it('clearCache 應清空所有檔案', async () => {
    await saveFile('id1', new Blob(['1']), { name: 'f1.txt' });
    await saveFile('id2', new Blob(['2']), { name: 'f2.txt' });
    
    const result = await clearCache();
    
    expect(result.deletedCount).toBe(2);
    const info = await getCacheInfo();
    expect(info.fileCount).toBe(0);
  });
  
  it('getCacheInfo 應回報正確統計', async () => {
    const blob1 = new Blob(['test1'], { type: 'text/plain' });
    const blob2 = new Blob(['test22'], { type: 'text/plain' });
    
    await saveFile('id1', blob1, { name: 'f1.txt', size: 5 });
    await delay(10);
    await saveFile('id2', blob2, { name: 'f2.txt', size: 6 });
    
    const info = await getCacheInfo();
    
    expect(info.fileCount).toBe(2);
    expect(info.totalSize).toBe(11);
    expect(info.oldestFile).toBeLessThan(info.newestFile);
  });
  
  it('savePreferences 應儲存設定到 localStorage', () => {
    const prefs = {
      theme: 'dark',
      autoSaveResults: true
    };
    
    const result = savePreferences(prefs);
    
    expect(result.success).toBe(true);
    expect(localStorage.getItem('imagetools_preferences')).toBeTruthy();
  });
  
  it('loadPreferences 應載入已儲存設定', () => {
    savePreferences({ theme: 'dark', showFileSize: false });
    
    const loaded = loadPreferences();
    
    expect(loaded.theme).toBe('dark');
    expect(loaded.showFileSize).toBe(false);
    expect(loaded.language).toBe('zh-TW'); // 預設值
  });
  
  it('loadPreferences 應在無設定時回傳預設值', () => {
    const prefs = loadPreferences();
    
    expect(prefs.theme).toBe('light');
    expect(prefs.language).toBe('zh-TW');
    expect(prefs.autoSaveResults).toBe(false);
  });
  
  it('clearPreferences 應清除 localStorage', () => {
    savePreferences({ theme: 'dark' });
    clearPreferences();
    
    const prefs = loadPreferences();
    expect(prefs.theme).toBe('light'); // 恢復預設
  });
  
  it('checkQuota 應回報儲存空間資訊', async () => {
    const quota = await checkQuota();
    
    expect(quota.usage).toBeGreaterThanOrEqual(0);
    expect(quota.quota).toBeGreaterThan(0);
    expect(quota.available).toBeLessThanOrEqual(quota.quota);
    expect(quota.percentUsed).toBeGreaterThanOrEqual(0);
    expect(quota.percentUsed).toBeLessThanOrEqual(100);
  });
});
```

---

## 依賴

- **瀏覽器 API**: 
  - IndexedDB (IDBDatabase, IDBObjectStore)
  - localStorage
  - StorageManager (Quota API)
- **內部模組**: `src/constants/messages.js`（錯誤訊息）

---

## 錯誤處理

```javascript
// 儲存空間不足處理
async function handleQuotaExceeded() {
  // 1. 清理 7 天前的快取
  const deleted = await cleanOldFiles(7);
  
  if (deleted.deletedCount > 0) {
    return { success: true, message: '已清理舊檔案' };
  }
  
  // 2. 仍不足，提示使用者
  throw new ConversionError({
    code: 'QUOTA_EXCEEDED',
    message: '儲存空間不足，請清理瀏覽器快取或刪除舊檔案',
    recoverable: true
  });
}
```

---

## 效能考量

1. **批次讀取**: 提供 `loadMultipleFiles(ids)` 減少 IDB 交易次數
2. **快取策略**: LRU（Least Recently Used）自動清理
3. **大小限制**: 單檔最大 50MB，總快取限制 500MB
4. **索引使用**: `createdAt` 索引加速查詢舊檔案

---

## 憲法檢查

- ✅ **MVP-First**: 僅實作必要的快取與設定儲存
- ✅ **Testability**: 完整合約測試
- ✅ **Simplicity**: 使用原生 IndexedDB 與 localStorage
- ✅ **High Quality**: 配額檢查、錯誤處理、自動清理
- ✅ **繁體中文**: 錯誤訊息用繁中
