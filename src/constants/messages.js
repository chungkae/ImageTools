/**
 * 錯誤訊息常數 - 繁體中文
 * 
 * 統一管理所有錯誤訊息，確保使用者友善且一致
 */

export const ERROR_MESSAGES = {
  // Base64 相關
  INVALID_BASE64: '無效的 Base64 格式，請確認輸入內容正確',
  BASE64_TOO_LARGE: 'Base64 字串過大（估算檔案超過 {limit}MB），請使用較小的圖片',
  
  // 檔案相關
  INVALID_INPUT: '輸入資料無效，請檢查後重試',
  INVALID_FILE_TYPE: '檔案類型不正確',
  FILE_TOO_LARGE: '檔案過大（限制 {limit}MB），請選擇較小的檔案',
  UNSUPPORTED_FORMAT: '不支援的檔案格式：{format}',
  FILE_READ_ERROR: '檔案讀取失敗，請重試',
  
  // 轉換相關
  CONVERSION_FAILED: '轉換失敗：{reason}',
  DECODE_FAILED: '解碼失敗，檔案可能已損壞',
  ENCODE_FAILED: '編碼失敗，請重試',
  
  // 記憶體與效能
  MEMORY_ERROR: '記憶體不足，請關閉其他分頁或減少檔案大小',
  PROCESSING_TIMEOUT: '處理超時，請嘗試較小的檔案',
  
  // 瀏覽器支援
  BROWSER_NOT_SUPPORTED: '您的瀏覽器版本過舊，請更新至最新版本',
  FEATURE_NOT_SUPPORTED: '您的瀏覽器不支援此功能：{feature}',
  
  // Worker 相關
  WORKER_ERROR: '背景處理發生錯誤，請重試',
  WORKER_TIMEOUT: '背景處理超時，請嘗試較小的檔案',
  
  // 儲存相關
  STORAGE_ERROR: '儲存資料時發生錯誤',
  QUOTA_EXCEEDED: '儲存空間不足，請清理瀏覽器快取或刪除舊檔案',
  
  // GIF 相關
  INVALID_TIME_RANGE: '時間範圍無效（開始時間必須小於結束時間）',
  NO_IMAGES_PROVIDED: '請至少上傳一張圖片',
  VIDEO_LOAD_ERROR: '影片載入失敗，請確認檔案格式正確',
  GIF_TOO_LARGE: 'GIF 檔案過大（{size}MB），建議降低品質或尺寸',
  
  // PDF 相關
  PDF_LOAD_ERROR: 'PDF 載入失敗，檔案可能已損壞',
  PDF_PARSE_ERROR: 'PDF 解析失敗，請確認檔案格式正確',
  PDF_RENDER_ERROR: 'PDF 頁面渲染失敗',
  
  // 網路相關（雖然是本地工具，但保留以備擴展）
  NETWORK_ERROR: '網路連線失敗',
  
  // 通用
  UNKNOWN_ERROR: '發生未知錯誤，請重試',
};

/**
 * 成功訊息
 */
export const SUCCESS_MESSAGES = {
  CONVERSION_COMPLETE: '轉換完成！',
  FILE_SAVED: '檔案已儲存',
  COPIED_TO_CLIPBOARD: '已複製到剪貼簿',
  CACHE_CLEARED: '快取已清除',
};

/**
 * 資訊訊息
 */
export const INFO_MESSAGES = {
  PROCESSING: '處理中...',
  LOADING: '載入中...',
  UPLOADING: '上傳中...',
  DOWNLOADING: '下載中...',
  LOCAL_PROCESSING: '本地處理中，檔案不會上傳',
  OFFLINE_MODE: '離線模式',
};

/**
 * 警告訊息
 */
export const WARNING_MESSAGES = {
  LARGE_FILE: '檔案較大（{size}MB），處理可能需要較長時間',
  QUALITY_LOSS: '轉換可能造成品質損失',
  FILE_NEAR_LIMIT: '檔案接近大小限制（{size}MB / {limit}MB）',
};

/**
 * 格式化錯誤訊息（替換佔位符）
 * 
 * @param {string} template - 訊息模板
 * @param {Object} params - 參數物件
 * @returns {string} 格式化後的訊息
 * 
 * @example
 * formatMessage(ERROR_MESSAGES.FILE_TOO_LARGE, { limit: 50 })
 * // => "檔案過大（限制 50MB），請選擇較小的檔案"
 */
export function formatMessage(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}
