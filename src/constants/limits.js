/**
 * 檔案限制常數
 * 
 * 定義檔案大小、時長等限制
 */

/**
 * 檔案大小限制（bytes）
 */
export const FILE_SIZE_LIMITS = {
  // 圖片檔案最大 50MB
  IMAGE: 50 * 1024 * 1024,
  
  // 影片檔案最大 100MB
  VIDEO: 100 * 1024 * 1024,
  
  // PDF 檔案最大 100MB
  PDF: 100 * 1024 * 1024,
  
  // Base64 字串估算大小上限（對應 50MB 圖片）
  BASE64: 50 * 1024 * 1024,
};

/**
 * 影片時長限制（秒）
 */
export const VIDEO_DURATION_LIMITS = {
  // 影片最長 5 分鐘（300 秒）
  MAX: 300,
  
  // 建議處理長度（避免過長處理時間）
  RECOMMENDED: 30,
};

/**
 * GIF 參數限制
 */
export const GIF_PARAMETER_LIMITS = {
  // 幀率範圍（fps）
  FRAME_RATE_MIN: 1,
  FRAME_RATE_MAX: 30,
  FRAME_RATE_DEFAULT: 10,
  
  // 品質範圍（1 = 最佳，30 = 最低）
  QUALITY_MIN: 1,
  QUALITY_MAX: 30,
  QUALITY_DEFAULT: 10,
  
  // 循環次數（0 = 無限）
  REPEAT_MIN: 0,
  REPEAT_DEFAULT: 0,
  
  // 輸出尺寸倍率
  SCALE_DEFAULT: 0.8, // 預設為原尺寸的 80%
  
  // 每幀延遲（ms）
  FRAME_DELAY_MIN: 10,
  FRAME_DELAY_MAX: 5000,
  FRAME_DELAY_DEFAULT: 100,
};

/**
 * 圖片參數限制
 */
export const IMAGE_PARAMETER_LIMITS = {
  // 最大尺寸（寬或高）
  MAX_DIMENSION: 8192,
  
  // JPEG 品質範圍（0.0 - 1.0）
  JPEG_QUALITY_MIN: 0.0,
  JPEG_QUALITY_MAX: 1.0,
  JPEG_QUALITY_DEFAULT: 0.92,
};

/**
 * 記憶體限制
 */
export const MEMORY_LIMITS = {
  // 最大記憶體使用量（bytes）- 500MB
  MAX_USAGE: 500 * 1024 * 1024,
  
  // 警告閾值（bytes）- 400MB
  WARNING_THRESHOLD: 400 * 1024 * 1024,
};

/**
 * 並行處理限制
 */
export const CONCURRENCY_LIMITS = {
  // 最大並行 Worker 數量
  MAX_WORKERS: 3,
  
  // 批次處理最大並行數
  MAX_BATCH: 3,
};

/**
 * 效能目標（毫秒）
 */
export const PERFORMANCE_TARGETS = {
  // Base64 轉換（5MB 檔案）
  BASE64_CONVERSION: 2000,
  
  // 圖片格式轉換（10MB 檔案）
  IMAGE_CONVERSION: 5000,
  
  // GIF 製作（10 秒影片）
  GIF_CREATION: 30000,
};

/**
 * 儲存限制
 */
export const STORAGE_LIMITS = {
  // IndexedDB 最大快取大小（bytes）- 500MB
  MAX_CACHE_SIZE: 500 * 1024 * 1024,
  
  // localStorage 最大大小（bytes）- 5MB
  MAX_LOCALSTORAGE_SIZE: 5 * 1024 * 1024,
  
  // 快取檔案最長保留時間（天）
  MAX_CACHE_AGE: 7,
};

/**
 * 檢查檔案大小是否在限制內
 * 
 * @param {number} size - 檔案大小（bytes）
 * @param {'IMAGE'|'VIDEO'|'BASE64'} type - 檔案類型
 * @returns {boolean}
 */
export function isFileSizeValid(size, type = 'IMAGE') {
  const limit = FILE_SIZE_LIMITS[type];
  return size <= limit;
}

/**
 * 取得檔案大小限制（MB）
 * 
 * @param {'IMAGE'|'VIDEO'|'BASE64'} type - 檔案類型
 * @returns {number} 限制大小（MB）
 */
export function getFileSizeLimitMB(type = 'IMAGE') {
  return FILE_SIZE_LIMITS[type] / (1024 * 1024);
}

/**
 * 檢查影片時長是否在限制內
 * 
 * @param {number} duration - 時長（秒）
 * @returns {boolean}
 */
export function isVideoDurationValid(duration) {
  return duration > 0 && duration <= VIDEO_DURATION_LIMITS.MAX;
}

/**
 * 檢查 GIF 參數是否有效
 * 
 * @param {Object} params - GIF 參數
 * @returns {boolean}
 */
export function areGifParametersValid(params) {
  const { frameRate, quality, repeat } = params;
  
  if (frameRate !== undefined) {
    if (frameRate < GIF_PARAMETER_LIMITS.FRAME_RATE_MIN || 
        frameRate > GIF_PARAMETER_LIMITS.FRAME_RATE_MAX) {
      return false;
    }
  }
  
  if (quality !== undefined) {
    if (quality < GIF_PARAMETER_LIMITS.QUALITY_MIN || 
        quality > GIF_PARAMETER_LIMITS.QUALITY_MAX) {
      return false;
    }
  }
  
  if (repeat !== undefined) {
    if (repeat < GIF_PARAMETER_LIMITS.REPEAT_MIN) {
      return false;
    }
  }
  
  return true;
}
