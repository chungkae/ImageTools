/**
 * 測試用固定資料（Fixtures）
 * 
 * 提供測試用的圖片、Base64 等資料
 */

/**
 * 1x1 透明 PNG 圖片（Base64）
 */
export const TRANSPARENT_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * 1x1 透明 PNG 圖片（Data URL）
 */
export const TRANSPARENT_PNG_DATA_URL = `data:image/png;base64,${TRANSPARENT_PNG_BASE64}`;

/**
 * 1x1 紅色 PNG 圖片（Base64）
 */
export const RED_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

/**
 * 1x1 紅色 PNG 圖片（Data URL）
 */
export const RED_PNG_DATA_URL = `data:image/png;base64,${RED_PNG_BASE64}`;

/**
 * 1x1 藍色 PNG 圖片（Base64）
 */
export const BLUE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA/e8HhwAAAABJRU5ErkJggg==';

/**
 * 1x1 藍色 PNG 圖片（Data URL）
 */
export const BLUE_PNG_DATA_URL = `data:image/png;base64,${BLUE_PNG_BASE64}`;

/**
 * 無效的 Base64 字串
 */
export const INVALID_BASE64 = 'This is not a valid base64 string!!!';

/**
 * 無效的 Data URL
 */
export const INVALID_DATA_URL = 'data:invalid';

/**
 * 測試用圖片尺寸
 */
export const TEST_IMAGE_DIMENSIONS = {
  small: { width: 100, height: 100 },
  medium: { width: 800, height: 600 },
  large: { width: 1920, height: 1080 },
  portrait: { width: 600, height: 800 },
  landscape: { width: 800, height: 600 },
};

/**
 * 測試用檔案大小（bytes）
 */
export const TEST_FILE_SIZES = {
  tiny: 1024, // 1 KB
  small: 100 * 1024, // 100 KB
  medium: 1024 * 1024, // 1 MB
  large: 10 * 1024 * 1024, // 10 MB
  xlarge: 50 * 1024 * 1024, // 50 MB
  overLimit: 60 * 1024 * 1024, // 60 MB（超過限制）
};

/**
 * 測試用 MIME types
 */
export const TEST_MIME_TYPES = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  unsupported: 'application/pdf',
};

/**
 * 測試用檔案名稱
 */
export const TEST_FILENAMES = {
  png: 'test.png',
  jpeg: 'photo.jpg',
  gif: 'animation.gif',
  webp: 'modern.webp',
  heic: 'iphone.heic',
  svg: 'vector.svg',
  mp4: 'video.mp4',
  mov: 'clip.mov',
  invalid: 'document.pdf',
};

/**
 * 建立測試用 Blob
 * 
 * @param {string} type - MIME type
 * @param {number} size - 大小（bytes）
 * @returns {Blob}
 */
export function createTestBlob(type = 'image/png', size = 1024) {
  const content = new Uint8Array(size);
  return new Blob([content], { type });
}

/**
 * 建立測試用 File
 * 
 * @param {string} name - 檔案名稱
 * @param {string} type - MIME type
 * @param {number} size - 大小（bytes）
 * @returns {File}
 */
export function createTestFile(name = 'test.png', type = 'image/png', size = 1024) {
  const blob = createTestBlob(type, size);
  return new File([blob], name, { type, lastModified: Date.now() });
}

/**
 * 建立測試用 Data URL
 * 
 * @param {string} base64 - Base64 字串
 * @param {string} mimeType - MIME type
 * @returns {string}
 */
export function createTestDataURL(base64 = TRANSPARENT_PNG_BASE64, mimeType = 'image/png') {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 產生隨機 Base64 字串（用於效能測試）
 * 
 * @param {number} length - 長度
 * @returns {string}
 */
export function generateRandomBase64(length = 1000) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 確保長度是 4 的倍數
  const padding = length % 4;
  if (padding > 0) {
    result += '='.repeat(4 - padding);
  }
  
  return result;
}

/**
 * 測試用錯誤碼
 */
export const TEST_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_BASE64: 'INVALID_BASE64',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  MEMORY_ERROR: 'MEMORY_ERROR',
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  WORKER_ERROR: 'WORKER_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
};

/**
 * 測試用偏好設定
 */
export const TEST_PREFERENCES = {
  jpegQuality: 0.92,
  gifQuality: 10,
  gifFrameRate: 10,
  defaultOutputFormat: 'image/png',
  enableCache: true,
};
