/**
 * Image Processor Worker
 * 
 * 背景處理圖片轉換任務
 */

// 匯入 heic2any（需要在 Worker 中使用）
// 注意：heic2any 可能需要透過 importScripts 載入
// 這裡先建立架構，實際整合時再調整

/**
 * 處理訊息
 */
self.addEventListener('message', async (e) => {
  const { id, type, data } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'convertImage':
        result = await convertImage(data);
        break;
      
      case 'resizeImage':
        result = await resizeImage(data);
        break;
      
      case 'convertHeic':
      case 'DECODE_HEIC':  // T052 要求的訊息類型
        result = await convertHeic(data, id);
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
    self.postMessage({
      id,
      success: false,
      error: error.message || 'WORKER_ERROR',
    });
  }
});

/**
 * 轉換圖片格式
 * 
 * @param {Object} params
 * @param {Blob} params.blob - 原始 Blob
 * @param {string} params.outputMimeType - 輸出格式
 * @param {number} params.quality - 品質（0-1）
 */
async function convertImage({ blob, outputMimeType, quality }) {
  // 建立 bitmap
  const bitmap = await createImageBitmap(blob);
  
  // 建立離屏 Canvas
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  
  // 繪製圖片
  ctx.drawImage(bitmap, 0, 0);
  
  // 轉換為 Blob
  const outputBlob = await canvas.convertToBlob({
    type: outputMimeType,
    quality,
  });
  
  return {
    blob: outputBlob,
    width: bitmap.width,
    height: bitmap.height,
  };
}

/**
 * 縮放圖片
 * 
 * @param {Object} params
 * @param {Blob} params.blob - 原始 Blob
 * @param {number} params.maxWidth - 最大寬度
 * @param {number} params.maxHeight - 最大高度
 * @param {number} params.scale - 縮放倍率（0-1）
 * @param {string} params.outputMimeType - 輸出格式
 * @param {number} params.quality - 品質（0-1）
 */
async function resizeImage({ blob, maxWidth, maxHeight, scale, outputMimeType, quality }) {
  const bitmap = await createImageBitmap(blob);
  
  let width = bitmap.width;
  let height = bitmap.height;
  
  // 按倍率縮放
  if (scale !== undefined && scale < 1) {
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }
  
  // 按最大尺寸限制
  if (maxWidth || maxHeight) {
    const aspectRatio = width / height;
    
    if (maxWidth && width > maxWidth) {
      width = maxWidth;
      height = Math.floor(width / aspectRatio);
    }
    
    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      width = Math.floor(height * aspectRatio);
    }
  }
  
  // 建立離屏 Canvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 繪製縮放後的圖片
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  // 轉換為 Blob
  const outputBlob = await canvas.convertToBlob({
    type: outputMimeType,
    quality,
  });
  
  return {
    blob: outputBlob,
    width,
    height,
  };
}

/**
 * 轉換 HEIC 格式
 * T052 要求：在 Worker 執行，回報進度 0-100%
 * 
 * @param {Object} params
 * @param {Blob} params.blob - HEIC Blob
 * @param {string} params.outputMimeType - 輸出格式
 * @param {number} params.quality - 品質（0-1）
 * @param {string} id - 任務 ID（用於回報進度）
 */
async function convertHeic({ blob, outputMimeType = 'image/png', quality = 0.92 }, id) {
  // 回報進度：開始
  reportProgress(id, 0);
  
  // 嘗試動態匯入 heic2any
  let heic2any;
  try {
    reportProgress(id, 10);
    
    // Vite 會處理 Worker 中的模組匯入
    const module = await import('heic2any');
    heic2any = module.default;
    
    reportProgress(id, 20);
  } catch (error) {
    throw new Error('HEIC 轉換套件載入失敗');
  }
  
  reportProgress(id, 30);
  
  // 使用 heic2any 轉換
  const convertedBlob = await heic2any({
    blob,
    toType: outputMimeType,
    quality,
  });
  
  reportProgress(id, 70);
  
  // heic2any 可能返回陣列
  const resultBlob = Array.isArray(convertedBlob) 
    ? convertedBlob[0] 
    : convertedBlob;
  
  reportProgress(id, 90);
  
  // 取得尺寸
  const bitmap = await createImageBitmap(resultBlob);
  
  reportProgress(id, 100);
  
  return {
    blob: resultBlob,
    width: bitmap.width,
    height: bitmap.height,
  };
}

/**
 * 進度報告（用於未來擴展）
 */
function reportProgress(id, progress) {
  self.postMessage({
    id,
    type: 'progress',
    progress,
  });
}
