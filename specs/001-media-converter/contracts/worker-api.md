# Web Worker API

**模組**: `src/workers/*.worker.js`  
**用途**: 在背景執行緒處理 CPU 密集任務  
**優先級**: P2（效能優化）

---

## Worker 1: imageProcessor.worker.js

**用途**: HEIC 解碼與圖片格式轉換

### postMessage 協定（主執行緒 → Worker）

```typescript
// 訊息類型
type WorkerMessage = {
  id: string;                            // 任務 ID
  type: 'DECODE_HEIC' | 'CONVERT_IMAGE';
  payload: DecodeHeicPayload | ConvertImagePayload;
};

// HEIC 解碼
interface DecodeHeicPayload {
  file: Blob;                            // HEIC 檔案
  outputFormat: 'image/png' | 'image/jpeg';
  quality?: number;                      // JPEG 品質（0.0-1.0）
}

// 圖片轉換
interface ConvertImagePayload {
  file: Blob;
  outputFormat: 'image/png' | 'image/jpeg';
  width?: number;
  height?: number;
  quality?: number;
}
```

### postMessage 協定（Worker → 主執行緒）

```typescript
// 成功回應
type WorkerResponse = {
  id: string;                            // 對應的任務 ID
  success: true;
  result: {
    file: Blob;
    metadata: {
      width: number;
      height: number;
      size: number;
      format: string;
    };
  };
};

// 錯誤回應
type WorkerErrorResponse = {
  id: string;
  success: false;
  error: {
    code: string;
    message: string;
  };
};

// 進度回報（HEIC 解碼）
type WorkerProgressResponse = {
  id: string;
  type: 'PROGRESS';
  progress: number;                      // 0-100
};
```

### 使用範例

```javascript
// 主執行緒
import ImageProcessorWorker from './workers/imageProcessor.worker.js?worker';

const worker = new ImageProcessorWorker();

// 發送任務
worker.postMessage({
  id: 'task-123',
  type: 'DECODE_HEIC',
  payload: {
    file: heicBlob,
    outputFormat: 'image/png'
  }
});

// 接收回應
worker.onmessage = (e) => {
  const response = e.data;
  
  if (response.type === 'PROGRESS') {
    console.log(`處理中：${response.progress}%`);
  } else if (response.success) {
    console.log('解碼完成', response.result.metadata);
  } else {
    console.error('解碼失敗', response.error);
  }
};
```

---

## Worker 2: gifEncoder.worker.js

**用途**: GIF 編碼（使用 gif.js）

### postMessage 協定（主執行緒 → Worker）

```typescript
type GifEncoderMessage = {
  id: string;
  type: 'ENCODE_GIF';
  payload: {
    frames: ImageData[];                 // 影格陣列
    width: number;
    height: number;
    frameDelay: number;                  // 每幀延遲（毫秒）
    quality: number;                     // 1-30
    repeat: number;                      // 0=無限循環
  };
};
```

### postMessage 協定（Worker → 主執行緒）

```typescript
// 成功回應
type GifEncoderResponse = {
  id: string;
  success: true;
  result: {
    file: Blob;                          // GIF 檔案
    metadata: {
      frameCount: number;
      fileSize: number;
      processingTime: number;
    };
  };
};

// 進度回報
type GifProgressResponse = {
  id: string;
  type: 'PROGRESS';
  progress: number;                      // 0-100
  currentFrame: number;
  totalFrames: number;
};
```

### 使用範例

```javascript
// 主執行緒
import GifEncoderWorker from './workers/gifEncoder.worker.js?worker';

const worker = new GifEncoderWorker();

// 發送任務
worker.postMessage({
  id: 'gif-task-456',
  type: 'ENCODE_GIF',
  payload: {
    frames: imageDataArray,
    width: 800,
    height: 600,
    frameDelay: 100,
    quality: 10,
    repeat: 0
  }
});

// 接收回應
worker.onmessage = (e) => {
  const response = e.data;
  
  if (response.type === 'PROGRESS') {
    console.log(`編碼中：${response.currentFrame}/${response.totalFrames}`);
  } else if (response.success) {
    downloadBlob(response.result.file, 'animation.gif');
  } else {
    console.error('編碼失敗', response.error);
  }
};
```

---

## Worker 管理（src/services/workerManager.js）

**用途**: 統一管理 Worker 生命週期

### `class WorkerPool`

```javascript
class WorkerPool {
  constructor(WorkerClass, maxWorkers = 3) {
    this.WorkerClass = WorkerClass;
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.queue = [];
  }
  
  async execute(message) {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      if (worker) {
        this.runTask(worker, message, resolve, reject);
      } else {
        this.queue.push({ message, resolve, reject });
      }
    });
  }
  
  getAvailableWorker() {
    // 找空閒 Worker 或建立新的（最多 maxWorkers）
  }
  
  runTask(worker, message, resolve, reject) {
    // 執行任務並監聽回應
  }
  
  terminate() {
    // 終止所有 Worker
  }
}
```

### 使用範例

```javascript
import ImageProcessorWorker from './workers/imageProcessor.worker.js?worker';

const pool = new WorkerPool(ImageProcessorWorker, 3);

// 批次處理
const tasks = files.map(file => 
  pool.execute({
    id: generateId(),
    type: 'DECODE_HEIC',
    payload: { file, outputFormat: 'image/png' }
  })
);

const results = await Promise.all(tasks);
```

---

## 合約測試

測試檔案: `tests/contract/workers.contract.test.js`

```javascript
describe('Workers Contract', () => {
  describe('imageProcessor.worker', () => {
    let worker;
    
    beforeEach(() => {
      worker = new ImageProcessorWorker();
    });
    
    afterEach(() => {
      worker.terminate();
    });
    
    it('應正確解碼 HEIC 檔案', async () => {
      const heicBlob = await loadTestFile('test.heic');
      
      const result = await new Promise((resolve) => {
        worker.postMessage({
          id: 'test-1',
          type: 'DECODE_HEIC',
          payload: { file: heicBlob, outputFormat: 'image/png' }
        });
        
        worker.onmessage = (e) => {
          if (e.data.success) resolve(e.data.result);
        };
      });
      
      expect(result.file).toBeInstanceOf(Blob);
      expect(result.metadata.format).toBe('image/png');
    });
    
    it('應回報 HEIC 解碼進度', async () => {
      const progressUpdates = [];
      const heicBlob = await loadTestFile('large.heic');
      
      worker.postMessage({
        id: 'test-2',
        type: 'DECODE_HEIC',
        payload: { file: heicBlob, outputFormat: 'image/png' }
      });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'PROGRESS') {
          progressUpdates.push(e.data.progress);
        }
      };
      
      await delay(3000); // 等待完成
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });
  
  describe('gifEncoder.worker', () => {
    let worker;
    
    beforeEach(() => {
      worker = new GifEncoderWorker();
    });
    
    afterEach(() => {
      worker.terminate();
    });
    
    it('應正確編碼 GIF', async () => {
      const frames = [
        createMockImageData(100, 100),
        createMockImageData(100, 100),
        createMockImageData(100, 100)
      ];
      
      const result = await new Promise((resolve) => {
        worker.postMessage({
          id: 'gif-1',
          type: 'ENCODE_GIF',
          payload: {
            frames,
            width: 100,
            height: 100,
            frameDelay: 100,
            quality: 10,
            repeat: 0
          }
        });
        
        worker.onmessage = (e) => {
          if (e.data.success) resolve(e.data.result);
        };
      });
      
      expect(result.file.type).toBe('image/gif');
      expect(result.metadata.frameCount).toBe(3);
    });
  });
  
  describe('WorkerPool', () => {
    it('應限制最大並行 Worker 數量', async () => {
      const pool = new WorkerPool(ImageProcessorWorker, 2);
      let activeCount = 0;
      let maxActive = 0;
      
      const tasks = Array(5).fill(null).map(() => 
        pool.execute({
          id: generateId(),
          type: 'CONVERT_IMAGE',
          payload: { file: createMockBlob(), outputFormat: 'image/png' }
        }).then(() => {
          activeCount--;
        })
      );
      
      // 追蹤並行數
      const interval = setInterval(() => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
      }, 10);
      
      await Promise.all(tasks);
      clearInterval(interval);
      
      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });
});
```

---

## 依賴

- **外部庫**:
  - `heic2any` (imageProcessor.worker.js)
  - `gif.js` (gifEncoder.worker.js)
- **Vite 設定**: Worker 以 `?worker` 後綴匯入

```javascript
// vite.config.js
export default {
  worker: {
    format: 'es'  // ES Module 格式
  }
};
```

---

## 錯誤處理

```javascript
// Worker 內部錯誤捕捉
self.addEventListener('error', (e) => {
  self.postMessage({
    id: currentTaskId,
    success: false,
    error: {
      code: 'WORKER_ERROR',
      message: `Worker 執行錯誤：${e.message}`
    }
  });
});

// 主執行緒超時處理
function executeWithTimeout(worker, message, timeout = 30000) {
  return Promise.race([
    executeTask(worker, message),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Worker 超時')), timeout)
    )
  ]);
}
```

---

## 效能考量

1. **Worker 池**: 最多 3 個並行 Worker，避免資源競爭
2. **記憶體管理**: 任務完成後釋放大型物件（ImageData）
3. **進度回報**: 每處理 10% 回報一次，避免過多訊息
4. **錯誤隔離**: Worker 錯誤不影響主執行緒

---

## 憲法檢查

- ✅ **MVP-First**: P2 功能，用於效能優化
- ✅ **Testability**: 完整合約測試
- ✅ **Simplicity**: 清晰的 postMessage 協定
- ✅ **High Quality**: 錯誤處理、超時保護、進度回報
- ✅ **繁體中文**: 錯誤訊息用繁中
