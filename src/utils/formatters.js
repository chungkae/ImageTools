/**
 * 格式化工具
 * 
 * 提供數值、時間、單位等格式化功能
 */

/**
 * 格式化位元組數
 * 
 * @param {number} bytes - 位元組數
 * @param {number} [decimals=2] - 小數位數
 * @returns {string} 格式化字串（如 "1.5 MB"）
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * 格式化檔案大小（formatBytes 的別名）
 * 
 * @param {number} bytes - 位元組數
 * @param {number} [decimals=2] - 小數位數
 * @returns {string} 格式化字串（如 "1.5 MB"）
 */
export function formatFileSize(bytes, decimals = 2) {
  return formatBytes(bytes, decimals);
}

/**
 * 格式化時間（秒 → 時:分:秒）
 * 
 * @param {number} seconds - 秒數
 * @param {boolean} [showHours=false] - 強制顯示小時（即使為 0）
 * @returns {string} 格式化字串（如 "1:23:45" 或 "23:45"）
 */
export function formatDuration(seconds, showHours = false) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0 || showHours) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 格式化百分比
 * 
 * @param {number} value - 數值（0-1 或 0-100）
 * @param {boolean} [isDecimal=true] - 是否為小數格式（0-1）
 * @param {number} [decimals=0] - 小數位數
 * @returns {string} 格式化字串（如 "75%"）
 */
export function formatPercentage(value, isDecimal = true, decimals = 0) {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * 格式化圖片尺寸
 * 
 * @param {number} width - 寬度
 * @param {number} height - 高度
 * @returns {string} 格式化字串（如 "1920 × 1080"）
 */
export function formatDimensions(width, height) {
  return `${width} × ${height}`;
}

/**
 * 格式化數字（加入千分位逗號）
 * 
 * @param {number} num - 數字
 * @returns {string} 格式化字串（如 "1,234,567"）
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化日期時間
 * 
 * @param {Date|number} date - 日期物件或時間戳記
 * @param {boolean} [includeTime=true] - 是否包含時間
 * @returns {string} 格式化字串（如 "2024-01-15 14:30:00"）
 */
export function formatDateTime(date, includeTime = true) {
  const d = date instanceof Date ? date : new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (!includeTime) {
    return `${year}-${month}-${day}`;
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化相對時間（如 "3 分鐘前"）
 * 
 * @param {Date|number} date - 日期物件或時間戳記
 * @returns {string} 格式化字串
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return '剛才';
  }
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} 分鐘前`;
  }
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour} 小時前`;
  }
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) {
    return `${diffDay} 天前`;
  }
  
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth} 個月前`;
  }
  
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} 年前`;
}

/**
 * 截斷字串（加入省略號）
 * 
 * @param {string} str - 字串
 * @param {number} maxLength - 最大長度
 * @param {string} [ellipsis='...'] - 省略符號
 * @returns {string} 截斷後的字串
 */
export function truncateString(str, maxLength, ellipsis = '...') {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 格式化 MIME type 為可讀格式
 * 
 * @param {string} mimeType - MIME type（如 "image/jpeg"）
 * @returns {string} 可讀格式（如 "JPEG"）
 */
export function formatMimeType(mimeType) {
  const mapping = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/heic': 'HEIC',
    'image/heif': 'HEIF',
    'image/svg+xml': 'SVG',
    'video/mp4': 'MP4',
    'video/quicktime': 'MOV',
    'video/webm': 'WebM',
  };
  
  return mapping[mimeType] || mimeType.split('/')[1]?.toUpperCase() || mimeType;
}

/**
 * 清理檔案名稱（移除非法字元）
 * 
 * @param {string} filename - 檔案名稱
 * @returns {string} 清理後的檔案名稱
 */
export function sanitizeFilename(filename) {
  // 移除或替換非法字元
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '')
    .trim();
}

/**
 * 格式化品質值（轉為百分比）
 * 
 * @param {number} quality - 品質值（0-1 或 1-100）
 * @returns {string} 格式化字串（如 "高品質 (92%)"）
 */
export function formatQuality(quality) {
  const percentage = quality <= 1 ? quality * 100 : quality;
  
  if (percentage >= 90) return `高品質 (${Math.round(percentage)}%)`;
  if (percentage >= 70) return `中等品質 (${Math.round(percentage)}%)`;
  if (percentage >= 50) return `標準品質 (${Math.round(percentage)}%)`;
  return `低品質 (${Math.round(percentage)}%)`;
}
