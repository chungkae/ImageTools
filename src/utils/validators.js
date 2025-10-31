/**
 * 檔案驗證工具
 * 
 * 提供檔案類型、大小、內容等驗證功能
 */

import { isSupportedImageFormat, isSupportedVideoFormat } from '../constants/fileTypes.js';
import { isFileSizeValid, isVideoDurationValid } from '../constants/limits.js';

/**
 * 驗證檔案類型是否為圖片
 * 
 * @param {File|Blob} file - 檔案物件
 * @returns {boolean}
 */
export function isImageFile(file) {
  if (!file) return false;
  
  // 先檢查 MIME type
  if (file.type && isSupportedImageFormat(file.type)) {
    return true;
  }
  
  // 如果 MIME type 不可用或不被識別（例如 HEIC），檢查副檔名
  if (file.name) {
    const ext = file.name.toLowerCase().match(/\.(\w+)$/)?.[1];
    const supportedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'svg'];
    return supportedExtensions.includes(ext);
  }
  
  return false;
}

/**
 * 驗證檔案類型是否為影片
 * 
 * @param {File|Blob} file - 檔案物件
 * @returns {boolean}
 */
export function isVideoFile(file) {
  if (!file || !file.type) return false;
  return isSupportedVideoFormat(file.type);
}

/**
 * 驗證檔案大小
 * 
 * @param {File|Blob} file - 檔案物件
 * @param {'IMAGE'|'VIDEO'} type - 檔案類型
 * @returns {boolean}
 */
export function validateFileSize(file, type = 'IMAGE') {
  if (!file || typeof file.size !== 'number') return false;
  return isFileSizeValid(file.size, type);
}

/**
 * 驗證檔案（綜合檢查）
 * 
 * @param {File|Blob} file - 檔案物件
 * @param {Object} options - 驗證選項
 * @param {boolean} options.checkSize - 是否檢查大小
 * @param {boolean} options.checkType - 是否檢查類型
 * @param {'IMAGE'|'VIDEO'} options.expectedType - 預期類型
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, options = {}) {
  const {
    checkSize = true,
    checkType = true,
    expectedType = 'IMAGE',
  } = options;

  if (!file) {
    return { valid: false, error: 'INVALID_INPUT' };
  }

  // 檢查類型
  if (checkType) {
    const isValid = expectedType === 'IMAGE' 
      ? isImageFile(file) 
      : isVideoFile(file);
    
    if (!isValid) {
      return { valid: false, error: 'UNSUPPORTED_FORMAT' };
    }
  }

  // 檢查大小
  if (checkSize) {
    if (!validateFileSize(file, expectedType)) {
      return { valid: false, error: 'FILE_TOO_LARGE' };
    }
  }

  return { valid: true };
}

/**
 * 驗證 Base64 字串格式
 * 
 * @param {string} base64 - Base64 字串
 * @returns {boolean}
 */
export function isValidBase64(base64) {
  if (typeof base64 !== 'string' || base64.trim().length === 0) {
    return false;
  }

  // 移除 Data URL 前綴（如果存在）
  const base64Data = base64.includes(',') 
    ? base64.split(',')[1] 
    : base64;

  // Base64 正規表示式
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  
  // 長度必須是 4 的倍數
  if (base64Data.length % 4 !== 0) {
    return false;
  }

  return base64Regex.test(base64Data);
}

/**
 * 驗證 Data URL 格式
 * 
 * @param {string} dataUrl - Data URL 字串
 * @returns {boolean}
 */
export function isValidDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  
  // Data URL 格式：data:[<mediatype>][;base64],<data>
  const dataUrlRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,/;
  
  return dataUrlRegex.test(dataUrl);
}

/**
 * 從 Data URL 提取 MIME type
 * 
 * @param {string} dataUrl - Data URL 字串
 * @returns {string|null} MIME type 或 null
 */
export function extractMimeType(dataUrl) {
  if (!isValidDataUrl(dataUrl)) return null;
  
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}

/**
 * 驗證影片時長
 * 
 * @param {number} duration - 影片時長（秒）
 * @returns {boolean}
 */
export function validateVideoDuration(duration) {
  return isVideoDurationValid(duration);
}

/**
 * 驗證數值範圍
 * 
 * @param {number} value - 數值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * 驗證必填欄位
 * 
 * @param {Object} data - 資料物件
 * @param {string[]} requiredFields - 必填欄位列表
 * @returns {{ valid: boolean, missingFields?: string[] }}
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}
