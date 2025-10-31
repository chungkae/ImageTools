/**
 * 檔案類型常數
 * 
 * 定義支援的檔案格式及其 MIME types
 */

/**
 * 支援的圖片輸入格式
 */
export const SUPPORTED_IMAGE_FORMATS = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  JPG: 'image/jpeg',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  HEIC: 'image/heic',
  HEIF: 'image/heif',
  SVG: 'image/svg+xml',
};

/**
 * 支援的影片輸入格式
 */
export const SUPPORTED_VIDEO_FORMATS = {
  MP4: 'video/mp4',
  MOV: 'video/quicktime',
  WEBM: 'video/webm',
};

/**
 * 支援的輸出格式
 */
export const OUTPUT_FORMATS = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
};

/**
 * 檔案副檔名對應
 */
export const FILE_EXTENSIONS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

/**
 * 格式顯示名稱（繁體中文）
 */
export const FORMAT_DISPLAY_NAMES = {
  'image/png': 'PNG 圖片',
  'image/jpeg': 'JPEG 圖片',
  'image/gif': 'GIF 動畫',
  'image/webp': 'WebP 圖片',
  'image/heic': 'HEIC 圖片',
  'image/heif': 'HEIF 圖片',
  'image/svg+xml': 'SVG 向量圖',
  'video/mp4': 'MP4 影片',
  'video/quicktime': 'MOV 影片',
  'video/webm': 'WebM 影片',
  'base64': 'Base64 編碼',
};

/**
 * 檢查是否為支援的圖片格式
 * 
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
export function isSupportedImageFormat(mimeType) {
  return Object.values(SUPPORTED_IMAGE_FORMATS).includes(mimeType);
}

/**
 * 檢查是否為支援的影片格式
 * 
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
export function isSupportedVideoFormat(mimeType) {
  return Object.values(SUPPORTED_VIDEO_FORMATS).includes(mimeType);
}

/**
 * 根據副檔名取得 MIME type
 * 
 * @param {string} filename - 檔案名稱
 * @returns {string|null} MIME type 或 null
 */
export function getMimeTypeFromFilename(filename) {
  const ext = filename.toLowerCase().match(/\.(\w+)$/)?.[1];
  if (!ext) return null;

  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
  };

  return mimeTypes[ext] || null;
}

/**
 * 取得格式的顯示名稱
 * 
 * @param {string} mimeType - MIME type
 * @returns {string} 顯示名稱
 */
export function getFormatDisplayName(mimeType) {
  return FORMAT_DISPLAY_NAMES[mimeType] || mimeType;
}
