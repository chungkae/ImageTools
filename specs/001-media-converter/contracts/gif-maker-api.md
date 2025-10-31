# GIF 製作器 API

**模組**: `src/services/gifMaker.js`  
**用途**: 從影片或圖片序列產生 GIF  
**優先級**: P3

---

## 公開 API

### `async videoToGif(videoFile, options)`

**描述**: 將影片轉換為 GIF 動畫

**輸入**:
```typescript
videoFile: File                         // 影片檔案
options: {
  startTime?: number;                    // 開始時間（秒），預設 0
  endTime?: number;                      // 結束時間（秒），預設影片結尾
  frameRate?: number;                    // 幀率（fps），1-30，預設 10
  width?: number;                        // 輸出寬度（0=原尺寸的 80%）
  height?: number;                       // 輸出高度（0=原尺寸的 80%）
  quality?: number;                      // 品質（1-30），預設 10
  repeat?: number;                       // 循環次數（0=無限），預設 0
  onProgress?: (progress: number) => void; // 進度回呼（0-100）
}
```

**輸出**:
```typescript
{
  file: Blob;                            // GIF 檔案
  metadata: {
    width: number;
    height: number;
    frameCount: number;                  // 總影格數
    fileSize: number;                    // 檔案大小（bytes）
    duration: number;                    // GIF 時長（秒）
    processingTime: number;              // 處理時間（毫秒）
  }
}
```

**錯誤**:
- `INVALID_INPUT`: 無效影片檔案
- `FILE_TOO_LARGE`: 影片超過 100MB
- `UNSUPPORTED_FORMAT`: 不支援的影片格式
- `INVALID_TIME_RANGE`: 時間範圍無效（startTime >= endTime）
- `CONVERSION_FAILED`: GIF 編碼失敗
- `MEMORY_ERROR`: 記憶體不足

**效能要求**:
- 10 秒影片 < 30 秒處理時間（符合 SC-003）

**範例**:
```javascript
const videoFile = new File([...], 'video.mp4', { type: 'video/mp4' });
const result = await videoToGif(videoFile, {
  startTime: 5,
  endTime: 10,
  frameRate: 15,
  quality: 10,
  onProgress: (p) => console.log(`處理中：${p}%`)
});
downloadBlob(result.file, 'output.gif');
```

---

### `async imagesToGif(imageFiles, options)`

**描述**: 將圖片序列轉換為 GIF 動畫

**輸入**:
```typescript
imageFiles: File[]                      // 圖片檔案陣列（順序即為播放順序）
options: {
  frameDelay?: number;                   // 每幀延遲（毫秒），預設 100
  width?: number;                        // 輸出寬度（0=使用第一張圖的寬度）
  height?: number;                       // 輸出高度（0=使用第一張圖的高度）
  quality?: number;                      // 品質（1-30），預設 10
  repeat?: number;                       // 循環次數（0=無限），預設 0
  maintainAspectRatio?: boolean;         // 保持比例，預設 true
  onProgress?: (progress: number) => void;
}
```

**輸出**:
```typescript
{
  file: Blob;                            // GIF 檔案
  metadata: {
    width: number;
    height: number;
    frameCount: number;
    fileSize: number;
    processingTime: number;
  }
}
```

**錯誤**:
- `INVALID_INPUT`: 圖片陣列為空或包含無效檔案
- `UNSUPPORTED_FORMAT`: 包含不支援的圖片格式
- `FILE_TOO_LARGE`: 單張圖片超過 50MB
- `CONVERSION_FAILED`: GIF 編碼失敗
- `MEMORY_ERROR`: 記憶體不足

**範例**:
```javascript
const images = [...fileInput.files];
const result = await imagesToGif(images, {
  frameDelay: 200,  // 每幀 200ms（5 fps）
  width: 800,
  quality: 15,
  repeat: 0
});
downloadBlob(result.file, 'animation.gif');
```

---

## 內部方法

### `async extractVideoFrames(videoElement, startTime, endTime, frameRate)`

**描述**: 從影片擷取影格

**輸入**: `HTMLVideoElement, number, number, number`  
**輸出**: `ImageData[]`

**流程**:
1. 設定影片 `currentTime` 到 `startTime`
2. 每隔 `1 / frameRate` 秒擷取一影格
3. 使用 Canvas `getImageData()` 取得像素資料
4. 重複直到 `endTime`

---

### `async encodeGif(frames, options)`

**描述**: 使用 gif.js 編碼 GIF（在 Worker 執行）

**輸入**: `ImageData[], GifEncoderOptions`  
**輸出**: `Blob`

**GifEncoderOptions**:
```typescript
{
  width: number;
  height: number;
  quality: number;                       // 1-30
  repeat: number;                        // 0=無限
  frameDelay: number;                    // 毫秒
  workerScript: string;                  // gif.worker.js 路徑
}
```

**依賴**: `gif.js` 庫 + 自訂 Worker 包裝

---

### `async resizeFrames(frames, targetWidth, targetHeight)`

**描述**: 批次調整影格尺寸

**輸入**: `ImageData[], number, number`  
**輸出**: `ImageData[]`

---

### `calculateFrameCount(startTime, endTime, frameRate)`

**描述**: 計算影格數量

**輸入**: `number, number, number`  
**輸出**: `number`

**公式**: `Math.ceil((endTime - startTime) * frameRate)`

---

### `estimateGifSize(width, height, frameCount, quality)`

**描述**: 估算 GIF 檔案大小

**輸入**: `number, number, number, number`  
**輸出**: `number` (bytes)

**公式**（經驗值）:
```javascript
const bytesPerFrame = (width * height * 0.5) * (quality / 10);
return Math.round(frameCount * bytesPerFrame);
```

---

## 合約測試

測試檔案: `tests/contract/gifMaker.contract.test.js`

```javascript
describe('GIF Maker Contract', () => {
  it('videoToGif 應接受影片並輸出 GIF', async () => {
    const videoFile = await loadTestFile('test-video.mp4');
    const result = await videoToGif(videoFile, {
      startTime: 0,
      endTime: 5,
      frameRate: 10
    });
    
    expect(result.file.type).toBe('image/gif');
    expect(result.metadata.frameCount).toBeGreaterThan(0);
  });
  
  it('videoToGif 應在 30 秒內完成 10 秒影片（SC-003）', async () => {
    const videoFile = createMockVideo(10); // 10 秒影片
    const start = Date.now();
    
    await videoToGif(videoFile, { frameRate: 10 });
    
    expect(Date.now() - start).toBeLessThan(30000);
  });
  
  it('videoToGif 應正確裁剪時間範圍', async () => {
    const videoFile = await loadTestFile('test-video.mp4'); // 30 秒
    const result = await videoToGif(videoFile, {
      startTime: 5,
      endTime: 10,
      frameRate: 10
    });
    
    expect(result.metadata.frameCount).toBe(50); // 5 秒 * 10 fps
  });
  
  it('videoToGif 應回報進度', async () => {
    const progressUpdates = [];
    const videoFile = await loadTestFile('test-video.mp4');
    
    await videoToGif(videoFile, {
      frameRate: 10,
      onProgress: (p) => progressUpdates.push(p)
    });
    
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
  
  it('imagesToGif 應接受圖片陣列並輸出 GIF', async () => {
    const images = [
      await loadTestFile('frame1.png'),
      await loadTestFile('frame2.png'),
      await loadTestFile('frame3.png')
    ];
    
    const result = await imagesToGif(images, {
      frameDelay: 100,
      quality: 10
    });
    
    expect(result.file.type).toBe('image/gif');
    expect(result.metadata.frameCount).toBe(3);
  });
  
  it('imagesToGif 應拒絕空陣列', async () => {
    await expect(imagesToGif([], {})).rejects.toThrow('INVALID_INPUT');
  });
  
  it('imagesToGif 應統一調整所有影格尺寸', async () => {
    const images = [
      createMockImage(1920, 1080), // 大圖
      createMockImage(800, 600),   // 小圖
      createMockImage(1280, 720)   // 中圖
    ];
    
    const result = await imagesToGif(images, {
      width: 800,
      height: 450,
      maintainAspectRatio: false
    });
    
    expect(result.metadata.width).toBe(800);
    expect(result.metadata.height).toBe(450);
  });
});
```

---

## 依賴

- **外部庫**: `gif.js` (v0.2.0+)
- **瀏覽器 API**: 
  - HTMLVideoElement
  - Canvas API (`getImageData`, `drawImage`)
  - FileReader
- **內部模組**:
  - `src/workers/gifEncoder.worker.js`（GIF 編碼 Worker）
  - `src/utils/validators.js`
- **錯誤處理**: `src/constants/messages.js`

---

## 效能優化

1. **Worker 編碼**: GIF 編碼在 Worker 執行，避免阻塞 UI
2. **影格抽樣**: 高幀率影片自動降低取樣率（如 60fps → 15fps）
3. **記憶體控制**: 
   - 最多同時處理 100 影格
   - 超過時分批編碼
4. **尺寸優化**: 預設輸出原尺寸的 80%，減少檔案大小
5. **品質調整**: 提供 1-30 品質選項，預設 10（高品質）

---

## 進度回報機制

```javascript
// videoToGif 進度階段
const PROGRESS_STAGES = {
  LOADING_VIDEO: 0,       // 0-10%: 載入影片
  EXTRACTING_FRAMES: 10,  // 10-70%: 擷取影格
  ENCODING_GIF: 70,       // 70-100%: 編碼 GIF
};

// 計算進度
function calculateProgress(stage, stageProgress) {
  const stageStart = PROGRESS_STAGES[stage];
  const stageEnd = Object.values(PROGRESS_STAGES)[
    Object.keys(PROGRESS_STAGES).indexOf(stage) + 1
  ] || 100;
  
  const stageRange = stageEnd - stageStart;
  return stageStart + (stageProgress * stageRange / 100);
}
```

---

## 憲法檢查

- ✅ **MVP-First**: P3 功能，最後實作
- ✅ **Testability**: 完整合約測試，包含效能測試
- ✅ **Simplicity**: 僅使用 gif.js（GIF 編碼必須）
- ✅ **High Quality**: 進度回報、錯誤處理、記憶體管理
- ✅ **繁體中文**: 所有訊息、進度文字用繁中
