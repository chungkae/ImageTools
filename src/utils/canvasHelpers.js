/**
 * Canvas 操作輔助工具
 * 
 * 提供圖片繪製、縮放、格式轉換等 Canvas 相關功能
 */

/**
 * 載入圖片
 * 
 * @param {string|File|Blob} source - 圖片來源（URL、Data URL、File 或 Blob）
 * @returns {Promise<HTMLImageElement>}
 */
export async function loadImage(source) {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // 釋放 Object URL（如果是）
      if (typeof img.src === 'string' && img.src.startsWith('blob:')) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(img.src);
          } catch (e) {
            // Ignore errors in test environment
          }
        }, 100);
      }
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error('IMAGE_LOAD_ERROR'));
    };
    
    // 設定來源（必須在 onload/onerror 設置之後）
    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob) {
      // 檢查是否在 Node.js 測試環境（node-canvas）
      const isNodeEnvironment = typeof process !== 'undefined' && 
                                process.versions && 
                                process.versions.node;
      
      if (isNodeEnvironment && typeof Buffer !== 'undefined') {
        // 在測試環境中（node-canvas）
        // 優先使用 _dataURL（用於SVG等特殊格式）
        if (source._dataURL) {
          img.src = source._dataURL;
        } else if (source._buffer) {
          // 使用 _buffer 屬性（用於PNG/JPEG等）
          img.src = source._buffer;
        } else {
          // Fallback: 嘗試讀取 Blob
          let arrayBuffer;
          if (typeof source.arrayBuffer === 'function') {
            arrayBuffer = await source.arrayBuffer();
          } else if (typeof FileReader !== 'undefined') {
            // Fallback for environments where Blob.arrayBuffer is not available
            arrayBuffer = await new Promise((resolveBuffer, rejectBuffer) => {
              const reader = new FileReader();
              reader.onload = () => resolveBuffer(reader.result);
              reader.onerror = rejectBuffer;
              reader.readAsArrayBuffer(source);
            });
          } else {
            reject(new Error('CANNOT_READ_BLOB'));
            return;
          }
          const buffer = Buffer.from(arrayBuffer);
          img.src = buffer;
        }
      } else {
        // 在瀏覽器環境中，使用 Object URL
        img.src = URL.createObjectURL(source);
      }
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * 建立 Canvas
 * 
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', { alpha: true });
  
  return { canvas, ctx };
}

/**
 * 在 Canvas 上繪製圖片
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLImageElement|HTMLCanvasElement} source - 圖片來源
 * @param {Object} [options] - 繪製選項
 * @param {number} [options.x=0] - X 座標
 * @param {number} [options.y=0] - Y 座標
 * @param {number} [options.width] - 寬度（預設為來源寬度）
 * @param {number} [options.height] - 高度（預設為來源高度）
 */
export function drawImage(ctx, source, options = {}) {
  const {
    x = 0,
    y = 0,
    width = source.width || source.naturalWidth,
    height = source.height || source.naturalHeight,
  } = options;
  
  ctx.drawImage(source, x, y, width, height);
}

/**
 * 縮放圖片（保持比例）
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} source - 圖片來源
 * @param {Object} options - 縮放選項
 * @param {number} [options.maxWidth] - 最大寬度
 * @param {number} [options.maxHeight] - 最大高度
 * @param {number} [options.scale] - 縮放倍率（0-1）
 * @returns {{ canvas: HTMLCanvasElement, width: number, height: number }}
 */
export function resizeImage(source, options = {}) {
  const { maxWidth, maxHeight, scale } = options;
  
  let width = source.width || source.naturalWidth;
  let height = source.height || source.naturalHeight;
  
  // 按倍率縮放
  if (scale !== undefined) {
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
  
  // 建立新 Canvas
  const { canvas, ctx } = createCanvas(width, height);
  
  // 繪製縮放後的圖片
  ctx.drawImage(source, 0, 0, width, height);
  
  return { canvas, width, height };
}

/**
 * Canvas 轉 Blob
 * 
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {string} [mimeType='image/png'] - 輸出格式
 * @param {number} [quality=0.92] - 品質（0-1，僅適用於 JPEG）
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('CANVAS_TO_BLOB_FAILED'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Canvas 轉 Data URL
 * 
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {string} [mimeType='image/png'] - 輸出格式
 * @param {number} [quality=0.92] - 品質（0-1，僅適用於 JPEG）
 * @returns {string} Data URL 字串
 */
export function canvasToDataURL(canvas, mimeType = 'image/png', quality = 0.92) {
  return canvas.toDataURL(mimeType, quality);
}

/**
 * 圖片轉 Blob
 * 
 * @param {HTMLImageElement|File|Blob|string} source - 圖片來源
 * @param {string} [outputMimeType='image/png'] - 輸出格式
 * @param {number} [quality=0.92] - 品質（0-1）
 * @param {Object} [resizeOptions] - 縮放選項（傳給 resizeImage）
 * @returns {Promise<Blob>}
 */
export async function imageToBlob(source, outputMimeType = 'image/png', quality = 0.92, resizeOptions = null) {
  // 如果來源已經是 Blob 且格式相符，直接返回
  if (source instanceof Blob && source.type === outputMimeType && !resizeOptions) {
    return source;
  }
  
  // 載入圖片
  const img = await loadImage(source);
  
  // 縮放（如果需要）
  const { canvas } = resizeOptions 
    ? resizeImage(img, resizeOptions) 
    : createCanvas(img.naturalWidth, img.naturalHeight);
  
  if (!resizeOptions) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }
  
  // 轉換為 Blob
  return canvasToBlob(canvas, outputMimeType, quality);
}

/**
 * 圖片轉 Data URL
 * 
 * @param {HTMLImageElement|File|Blob|string} source - 圖片來源
 * @param {string} [outputMimeType='image/png'] - 輸出格式
 * @param {number} [quality=0.92] - 品質（0-1）
 * @param {Object} [resizeOptions] - 縮放選項
 * @returns {Promise<string>} Data URL 字串
 */
export async function imageToDataURL(source, outputMimeType = 'image/png', quality = 0.92, resizeOptions = null) {
  const img = await loadImage(source);
  
  const { canvas } = resizeOptions 
    ? resizeImage(img, resizeOptions) 
    : createCanvas(img.naturalWidth, img.naturalHeight);
  
  if (!resizeOptions) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }
  
  return canvasToDataURL(canvas, outputMimeType, quality);
}

/**
 * 計算適合的尺寸（保持比例）
 * 
 * @param {number} width - 原始寬度
 * @param {number} height - 原始高度
 * @param {number} maxWidth - 最大寬度
 * @param {number} maxHeight - 最大高度
 * @returns {{ width: number, height: number }}
 */
export function calculateFitSize(width, height, maxWidth, maxHeight) {
  const aspectRatio = width / height;
  
  let newWidth = width;
  let newHeight = height;
  
  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.floor(newWidth / aspectRatio);
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.floor(newHeight * aspectRatio);
  }
  
  return { width: newWidth, height: newHeight };
}

/**
 * 清除 Canvas
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} [width] - 寬度（預設為 canvas 寬度）
 * @param {number} [height] - 高度（預設為 canvas 高度）
 */
export function clearCanvas(ctx, width = ctx.canvas.width, height = ctx.canvas.height) {
  ctx.clearRect(0, 0, width, height);
}

/**
 * 填滿 Canvas 背景
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color - 顏色
 * @param {number} [width] - 寬度（預設為 canvas 寬度）
 * @param {number} [height] - 高度（預設為 canvas 高度）
 */
export function fillBackground(ctx, color, width = ctx.canvas.width, height = ctx.canvas.height) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}
