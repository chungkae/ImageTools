/**
 * GIF Encoder Worker
 * 
 * 背景處理 GIF 編碼任務
 * 使用 gif.js 進行實際的 GIF 編碼
 */

import GIF from 'gif.js';

/**
 * 處理訊息
 */
self.addEventListener('message', async (e) => {
  const { id, type, payload } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'ENCODE_GIF':
        result = await encodeGif(payload, (progress) => {
          reportProgress(id, progress);
        });
        break;
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({
      id,
      success: true,
      result,
    });
  } catch (error) {
    console.error('GIF Encoder Worker error:', error);
    self.postMessage({
      id,
      success: false,
      error: {
        code: 'GIF_ENCODING_ERROR',
        message: error.message || 'GIF 編碼失敗',
      },
    });
  }
});

/**
 * 編碼 GIF
 * 
 * @param {Object} params
 * @param {ImageData[]} params.frames - 影格陣列（ImageData）
 * @param {number} params.width - GIF 寬度
 * @param {number} params.height - GIF 高度
 * @param {number} params.frameDelay - 每幀延遲（ms）
 * @param {number} params.quality - 品質（1-30，數字越小品質越好）
 * @param {number} params.repeat - 循環次數（0 = 無限）
 * @param {Function} onProgress - 進度回調
 * @returns {Promise<{file: Blob, metadata: Object}>}
 */
async function encodeGif({ frames, width, height, frameDelay, quality, repeat }, onProgress) {
  if (!frames || frames.length === 0) {
    throw new Error('沒有影格可編碼');
  }

  return new Promise((resolve, reject) => {
    try {
      // 創建 GIF 編碼器
      // 在 Worker 中使用 gif.js 時，指定 workerScript 路徑
      const gif = new GIF({
        workers: 2, // 使用 2 個內部 worker 加速
        quality: quality || 10,
        width,
        height,
        repeat: repeat === undefined ? 0 : repeat,
        transparent: null,
        background: '#ffffff',
        workerScript: '/gif.worker.js', // 使用 public 目錄中的 worker
      });
      
      // 添加所有影格
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        // gif.js 接受 Canvas、CanvasContext 或 ImageData
        if (frame.data && frame.width && frame.height) {
          // 這是 ImageData
          gif.addFrame(frame, { 
            delay: frameDelay || 100,
            copy: true // 複製數據以避免修改原始數據
          });
        } else {
          console.warn(`影格 ${i} 格式不正確，跳過`);
        }
      }
      
      // 監聽進度
      gif.on('progress', (progress) => {
        if (onProgress) {
          onProgress(progress);
        }
      });
      
      // 監聽完成
      gif.on('finished', (blob) => {
        resolve({
          file: blob,
          metadata: {
            frameCount: frames.length,
            fileSize: blob.size,
            width,
            height,
          },
        });
      });
      
      // 監聽錯誤
      gif.on('error', (error) => {
        reject(new Error(`GIF 編碼失敗: ${error.message || error}`));
      });
      
      // 開始編碼
      gif.render();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 進度報告
 * 
 * @param {string} id - 任務 ID
 * @param {number} progress - 進度（0-1）
 */
function reportProgress(id, progress) {
  self.postMessage({
    id,
    type: 'PROGRESS',
    progress: Math.round(progress * 100), // 轉換為 0-100
    currentFrame: null,
    totalFrames: null,
  });
}
