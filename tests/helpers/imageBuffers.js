/**
 * 圖片 Buffer 產生器 - 用於測試環境
 * 
 * 在 node-canvas 環境中產生真實的圖片 Buffer，
 * 而不是使用 Data URL（node-canvas 不支援）
 */

import { Canvas } from 'canvas';

/**
 * 創建一個簡單的 PNG Buffer
 * 
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {string} color - 顏色 (red, blue, green, transparent)
 * @returns {Buffer} PNG Buffer
 */
export function createPNGBuffer(width = 100, height = 100, color = 'red') {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 設定背景顏色
  switch (color) {
    case 'red':
      ctx.fillStyle = '#FF0000';
      break;
    case 'blue':
      ctx.fillStyle = '#0000FF';
      break;
    case 'green':
      ctx.fillStyle = '#00FF00';
      break;
    case 'transparent':
      ctx.clearRect(0, 0, width, height);
      return canvas.toBuffer('image/png');
    default:
      ctx.fillStyle = color;
  }
  
  ctx.fillRect(0, 0, width, height);
  return canvas.toBuffer('image/png');
}

/**
 * 創建一個簡單的 JPEG Buffer
 * 
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {number} quality - 品質 (0-1)
 * @returns {Buffer} JPEG Buffer
 */
export function createJPEGBuffer(width = 100, height = 100, quality = 0.9) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 創建一個漸層背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FF0000');
  gradient.addColorStop(1, '#0000FF');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toBuffer('image/jpeg', { quality });
}

/**
 * 創建一個簡單的 SVG 字串
 * 
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {string} color - 填充顏色
 * @returns {string} SVG XML 字串
 */
export function createSVGString(width = 100, height = 100, color = '#FF0000') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${color}"/>
  <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/4}" fill="#FFFFFF"/>
</svg>`;
}

/**
 * 創建一個 File 物件（包含真實 PNG Buffer）
 * 在測試環境中添加 _buffer 屬性以便直接訪問
 * 
 * @param {string} filename - 檔案名稱
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {string} color - 顏色
 * @returns {File}
 */
export function createPNGFile(filename = 'test.png', width = 100, height = 100, color = 'red') {
  const buffer = createPNGBuffer(width, height, color);
  const file = new File([buffer], filename, { type: 'image/png' });
  // 在測試環境中，直接附加 buffer 以繞過 arrayBuffer() 缺失
  file._buffer = buffer;
  return file;
}

/**
 * 創建一個 File 物件（包含真實 JPEG Buffer）
 * 在測試環境中添加 _buffer 屬性以便直接訪問
 * 
 * @param {string} filename - 檔案名稱
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {number} quality - 品質
 * @returns {File}
 */
export function createJPEGFile(filename = 'test.jpg', width = 100, height = 100, quality = 0.9) {
  const buffer = createJPEGBuffer(width, height, quality);
  const file = new File([buffer], filename, { type: 'image/jpeg' });
  file._buffer = buffer;
  return file;
}

/**
 * 創建一個 SVG File 物件
 * 在測試環境中，SVG以DataURL形式存儲在_dataURL屬性中
 * 
 * @param {string} filename - 檔案名稱
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @param {string} color - 顏色
 * @returns {File}
 */
export function createSVGFile(filename = 'test.svg', width = 100, height = 100, color = '#FF0000') {
  const svgString = createSVGString(width, height, color);
  const buffer = Buffer.from(svgString, 'utf-8');
  const file = new File([buffer], filename, { type: 'image/svg+xml' });
  // SVG需要作為Data URL使用，因為node-canvas不能直接處理SVG Buffer
  file._dataURL = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
  return file;
}

/**
 * 創建一個 WebP File 物件（使用 PNG 作為替代）
 * 注意：node-canvas 可能不支援 WebP 編碼，所以使用 PNG 代替
 * 在測試環境中添加 _buffer 屬性
 * 
 * @param {string} filename - 檔案名稱
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @returns {File}
 */
export function createWebPFile(filename = 'test.webp', width = 100, height = 100) {
  const buffer = createPNGBuffer(width, height, 'blue');
  const file = new File([buffer], filename, { type: 'image/webp' });
  file._buffer = buffer;
  return file;
}

/**
 * 創建一個模擬的 HEIC File 物件（使用 PNG 作為替代）
 * 注意：HEIC 需要特殊處理，這裡只是模擬
 * 在測試環境中添加 _buffer 屬性
 * 
 * @param {string} filename - 檔案名稱
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @returns {File}
 */
export function createHEICFile(filename = 'test.heic', width = 100, height = 100) {
  const buffer = createPNGBuffer(width, height, 'green');
  const file = new File([buffer], filename, { type: 'image/heic' });
  file._buffer = buffer;
  return file;
}

/**
 * 創建指定大小的 PNG Buffer（用於效能測試）
 * 
 * @param {number} targetSizeBytes - 目標大小（bytes）
 * @returns {Buffer}
 */
export function createLargePNGBuffer(targetSizeBytes) {
  // 根據目標大小估算尺寸
  // PNG 大小約等於 width * height * 4（RGBA）
  const pixelCount = Math.floor(targetSizeBytes / 4);
  const dimension = Math.floor(Math.sqrt(pixelCount));
  
  return createPNGBuffer(dimension, dimension, 'red');
}

/**
 * 將 Buffer 轉換為 Base64 Data URL
 * 
 * @param {Buffer} buffer - 圖片 Buffer
 * @param {string} mimeType - MIME type
 * @returns {string} Data URL
 */
export function bufferToDataURL(buffer, mimeType = 'image/png') {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 將 Buffer 轉換為 Blob
 * 
 * @param {Buffer} buffer - 圖片 Buffer
 * @param {string} mimeType - MIME type
 * @returns {Blob}
 */
export function bufferToBlob(buffer, mimeType = 'image/png') {
  return new Blob([buffer], { type: mimeType });
}
