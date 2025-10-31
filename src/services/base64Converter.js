/**
 * Base64 轉換器服務
 * 
 * 提供 Base64 與圖片之間的雙向轉換功能
 */

import { isValidBase64, isValidDataUrl, extractMimeType } from '../utils/validators.js';
import { 
  readFileAsDataURL, 
  dataURLToBlob, 
  estimateBase64Size 
} from '../utils/fileHelpers.js';
import { loadImage, canvasToBlob } from '../utils/canvasHelpers.js';
import { validateFile } from '../utils/validators.js';
import { ERROR_MESSAGES, formatMessage } from '../constants/messages.js';
import { FILE_SIZE_LIMITS } from '../constants/limits.js';

export class Base64Converter {
  /**
   * 將 Base64 字串轉換為圖片 Blob
   * 
   * @param {string} base64Input - Base64 字串（可含或不含 data: 前綴）
   * @returns {Promise<{blob: Blob, metadata: Object}>}
   * @throws {Error} 無效的 Base64 格式或資料過大
   */
  async base64ToImage(base64Input) {
    // 驗證輸入
    if (!base64Input || typeof base64Input !== 'string') {
      throw new Error('INVALID_INPUT');
    }
    
    const trimmed = base64Input.trim();
    if (trimmed.length === 0) {
      throw new Error('INVALID_INPUT');
    }
    
    // 解析 Data URL 或純 Base64
    let mimeType = 'image/png'; // 預設
    let base64Data = trimmed;
    
    if (isValidDataUrl(trimmed)) {
      const parsed = Base64Converter.parseDataUrl(trimmed);
      mimeType = parsed.mimeType;
      base64Data = parsed.base64;
    }
    
    // 驗證 Base64 格式
    if (!Base64Converter.isValidBase64(base64Data)) {
      throw new Error('INVALID_BASE64');
    }
    
    // 檢查估算大小
    const estimatedSize = Base64Converter.estimateSize(base64Data);
    if (estimatedSize > FILE_SIZE_LIMITS.BASE64) {
      throw new Error('BASE64_TOO_LARGE');
    }
    
    // 轉換為 Blob
    const dataUrl = isValidDataUrl(trimmed) 
      ? trimmed 
      : `data:${mimeType};base64,${base64Data}`;
    
    const blob = dataURLToBlob(dataUrl);
    
    // 載入圖片以取得尺寸資訊
    const img = await loadImage(blob);
    
    const metadata = {
      mimeType: blob.type,
      originalSize: estimatedSize,
      size: blob.size,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    
    return { blob, metadata };
  }
  
  /**
   * 將圖片檔案轉換為 Base64 字串
   * 
   * @param {File|Blob} file - 圖片檔案
   * @param {Object} [options] - 選項
   * @param {boolean} [options.includePrefix=true] - 是否包含 data: 前綴
   * @returns {Promise<{base64: string, metadata: Object}>}
   * @throws {Error} 檔案過大或格式不支援
   */
  async imageToBase64(file, options = {}) {
    const { includePrefix = true } = options;
    
    // 驗證輸入
    if (!file) {
      throw new Error('INVALID_INPUT');
    }
    
    // 驗證檔案
    const validation = validateFile(file, {
      checkSize: true,
      checkType: true,
      expectedType: 'IMAGE',
    });
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // 讀取為 Data URL
    const dataUrl = await readFileAsDataURL(file);
    
    // 提取純 Base64（如果需要）
    let base64;
    if (includePrefix) {
      base64 = dataUrl;
    } else {
      const parsed = Base64Converter.parseDataUrl(dataUrl);
      base64 = parsed.base64;
    }
    
    // 建立 metadata
    const metadata = {
      fileName: file.name || 'unknown',
      mimeType: file.type,
      size: file.size,
      base64Length: base64.length,
    };
    
    return { base64, metadata };
  }
  
  /**
   * 解析 Data URL
   * 
   * @param {string} dataUrl - Data URL 字串
   * @returns {{mimeType: string, base64: string}}
   */
  static parseDataUrl(dataUrl) {
    if (!isValidDataUrl(dataUrl)) {
      throw new Error('INVALID_DATA_URL');
    }
    
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('INVALID_DATA_URL');
    }
    
    return {
      mimeType: match[1],
      base64: match[2],
    };
  }
  
  /**
   * 驗證 Base64 格式
   * 
   * @param {string} base64 - Base64 字串
   * @returns {boolean}
   */
  static isValidBase64(base64) {
    return isValidBase64(base64);
  }
  
  /**
   * 估算 Base64 解碼後的大小
   * 
   * @param {string} base64 - Base64 字串
   * @returns {number} 估算的位元組數
   */
  static estimateSize(base64) {
    return estimateBase64Size(base64);
  }
}
