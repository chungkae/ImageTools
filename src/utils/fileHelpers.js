/**
 * 檔案操作輔助工具
 * 
 * 提供檔案讀取、轉換、下載等通用功能
 */

import { FILE_EXTENSIONS } from '../constants/fileTypes.js';

/**
 * 讀取檔案為 Data URL (Base64)
 * 
 * @param {File|Blob} file - 檔案物件
 * @returns {Promise<string>} Data URL 字串
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    
    reader.readAsDataURL(file);
  });
}

/**
 * 讀取檔案為 ArrayBuffer
 * 
 * @param {File|Blob} file - 檔案物件
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 讀取檔案為文字
 * 
 * @param {File|Blob} file - 檔案物件
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    
    reader.readAsText(file);
  });
}

/**
 * Data URL 轉 Blob
 * 
 * @param {string} dataUrl - Data URL 字串
 * @returns {Blob}
 */
export function dataURLToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const base64 = parts[1];
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mime });
}

/**
 * Blob 轉 Data URL
 * 
 * @param {Blob} blob - Blob 物件
 * @returns {Promise<string>} Data URL 字串
 */
export function blobToDataURL(blob) {
  return readFileAsDataURL(blob);
}

/**
 * 下載檔案
 * 
 * @param {Blob|string} data - Blob 物件或 Data URL
 * @param {string} filename - 檔案名稱
 * @param {string} [mimeType] - MIME type（若 data 為 Blob 則可選）
 */
export function downloadFile(data, filename, mimeType) {
  let url;
  
  if (typeof data === 'string') {
    // Data URL
    url = data;
  } else {
    // Blob
    url = URL.createObjectURL(data);
  }
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // 觸發下載
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 釋放 Object URL
  if (typeof data !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

/**
 * 產生檔案名稱
 * 
 * @param {string} baseName - 基礎名稱（不含副檔名）
 * @param {string} mimeType - MIME type
 * @param {boolean} [includeTimestamp=true] - 是否包含時間戳記
 * @returns {string} 完整檔案名稱
 */
export function generateFilename(baseName, mimeType, includeTimestamp = true) {
  const extension = FILE_EXTENSIONS[mimeType] || '';
  const timestamp = includeTimestamp 
    ? `_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}` 
    : '';
  
  return `${baseName}${timestamp}${extension}`;
}

/**
 * 取得檔案大小（格式化）
 * 
 * @param {number} bytes - 位元組數
 * @param {number} [decimals=2] - 小數位數
 * @returns {string} 格式化的檔案大小（如 "1.5 MB"）
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * 複製文字到剪貼簿
 * 
 * @param {string} text - 要複製的文字
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 現代瀏覽器
    await navigator.clipboard.writeText(text);
  } else {
    // 降級方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * 建立檔案物件（從 Blob）
 * 
 * @param {Blob} blob - Blob 物件
 * @param {string} filename - 檔案名稱
 * @param {Object} [options] - 選項
 * @returns {File}
 */
export function createFile(blob, filename, options = {}) {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
    ...options,
  });
}

/**
 * 批次讀取檔案
 * 
 * @param {FileList|File[]} files - 檔案列表
 * @param {Function} readFunction - 讀取函式（如 readFileAsDataURL）
 * @returns {Promise<Array>} 結果陣列
 */
export async function readFilesInBatch(files, readFunction = readFileAsDataURL) {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(file => readFunction(file)));
}

/**
 * 估算 Base64 字串解碼後的檔案大小
 * 
 * @param {string} base64 - Base64 字串（可含 Data URL 前綴）
 * @returns {number} 估算的位元組數
 */
export function estimateBase64Size(base64) {
  // 移除 Data URL 前綴
  const base64Data = base64.includes(',') 
    ? base64.split(',')[1] 
    : base64;
  
  // 計算 padding
  const padding = (base64Data.match(/=/g) || []).length;
  
  // Base64 解碼後大小 = (length * 3 / 4) - padding
  return (base64Data.length * 3 / 4) - padding;
}
