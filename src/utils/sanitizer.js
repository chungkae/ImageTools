/**
 * 輸入清理與 XSS 防護工具 (T085)
 * 
 * 功能：
 * - 清理使用者輸入的字串
 * - 防止 XSS 攻擊
 * - 驗證檔案類型
 */

/**
 * 清理 HTML 字串，移除所有標籤
 * @param {string} input - 輸入字串
 * @returns {string} 清理後的字串
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // 建立臨時元素解析 HTML
  const temp = document.createElement('div');
  temp.textContent = input;
  
  // 回傳純文字（所有 HTML 標籤被移除）
  return temp.innerHTML;
}

/**
 * 清理檔案名稱，移除危險字元
 * @param {string} filename - 檔案名稱
 * @returns {string} 清理後的檔案名稱
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return 'untitled';
  }

  // 移除路徑分隔符號和危險字元
  let cleaned = filename
    .replace(/[<>:"|?*\/\\]/g, '_')  // 替換危險字元為底線
    .replace(/\s+/g, '_')             // 空白替換為底線
    .replace(/_{2,}/g, '_')           // 多個底線合併為一個
    .replace(/^[._]+|[._]+$/g, '');  // 移除開頭結尾的點和底線

  // 限制長度（Windows 限制 255 字元）
  if (cleaned.length > 200) {
    const ext = cleaned.slice(cleaned.lastIndexOf('.'));
    const name = cleaned.slice(0, 200 - ext.length);
    cleaned = name + ext;
  }

  return cleaned || 'untitled';
}

/**
 * 驗證 Base64 字串格式
 * @param {string} base64 - Base64 字串
 * @returns {boolean} 是否為有效的 Base64
 */
function isValidBase64(base64) {
  if (typeof base64 !== 'string') {
    return false;
  }

  // 移除 Data URL 前綴
  const cleaned = base64.replace(/^data:[^;]+;base64,/, '');

  // 檢查是否包含非 Base64 字元
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleaned)) {
    return false;
  }

  // 檢查長度（必須是 4 的倍數）
  if (cleaned.length % 4 !== 0) {
    return false;
  }

  return true;
}

/**
 * 驗證檔案 MIME 類型是否為允許的類型
 * @param {File|Blob} file - 檔案物件
 * @param {Array<string>} allowedTypes - 允許的 MIME 類型陣列
 * @returns {boolean} 是否為允許的類型
 */
function isAllowedFileType(file, allowedTypes) {
  if (!(file instanceof File || file instanceof Blob)) {
    return false;
  }

  // 檢查 MIME 類型
  if (!allowedTypes.includes(file.type)) {
    return false;
  }

  return true;
}

/**
 * 驗證檔案大小是否在限制內
 * @param {File|Blob} file - 檔案物件
 * @param {number} maxSizeInBytes - 最大檔案大小（位元組）
 * @returns {boolean} 是否在限制內
 */
function isFileSizeValid(file, maxSizeInBytes) {
  if (!(file instanceof File || file instanceof Blob)) {
    return false;
  }

  return file.size <= maxSizeInBytes;
}

/**
 * 清理 URL 參數，防止 XSS
 * @param {string} param - URL 參數
 * @returns {string} 清理後的參數
 */
function sanitizeURLParam(param) {
  if (typeof param !== 'string') {
    return '';
  }

  // 僅允許字母、數字、連字號、底線
  return param.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * 驗證數字範圍
 * @param {any} value - 輸入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} defaultValue - 預設值
 * @returns {number} 驗證後的數字
 */
function validateNumber(value, min, max, defaultValue) {
  const num = Number(value);
  
  if (isNaN(num)) {
    return defaultValue;
  }

  if (num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return num;
}

/**
 * 清理物件（遞迴移除危險屬性）
 * @param {Object} obj - 輸入物件
 * @returns {Object} 清理後的物件
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const cleaned = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !dangerousKeys.includes(key)) {
      if (typeof obj[key] === 'string') {
        cleaned[key] = sanitizeHTML(obj[key]);
      } else if (typeof obj[key] === 'object') {
        cleaned[key] = sanitizeObject(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }

  return cleaned;
}

/**
 * 建立安全的 Blob URL（追蹤並自動清理）
 * @param {Blob} blob - Blob 物件
 * @returns {string} Object URL
 */
function createSafeObjectURL(blob) {
  if (!(blob instanceof Blob)) {
    throw new TypeError('參數必須是 Blob 物件');
  }

  // 驗證 MIME 類型（只允許圖片、影片、GIF）
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];

  if (!allowedTypes.includes(blob.type)) {
    throw new Error(`不允許的 MIME 類型: ${blob.type}`);
  }

  // 直接建立 URL（建議透過 resourceManager.createObjectURL 使用以獲得自動清理）
  return URL.createObjectURL(blob);
}

/**
 * 驗證並清理設定物件
 * @param {Object} config - 設定物件
 * @param {Object} schema - 驗證模式
 * @returns {Object} 驗證後的設定
 */
function validateConfig(config, schema) {
  const validated = {};

  for (const key in schema) {
    const rule = schema[key];
    const value = config[key];

    // 檢查必填欄位
    if (rule.required && (value === undefined || value === null)) {
      throw new Error(`必填欄位缺失: ${key}`);
    }

    // 跳過未定義的非必填欄位
    if (value === undefined || value === null) {
      validated[key] = rule.default;
      continue;
    }

    // 類型驗證
    if (rule.type === 'number') {
      validated[key] = validateNumber(value, rule.min, rule.max, rule.default);
    } else if (rule.type === 'string') {
      validated[key] = sanitizeHTML(String(value));
    } else if (rule.type === 'boolean') {
      validated[key] = Boolean(value);
    } else {
      validated[key] = value;
    }
  }

  return validated;
}

export {
  sanitizeHTML,
  sanitizeFilename,
  isValidBase64,
  isAllowedFileType,
  isFileSizeValid,
  sanitizeURLParam,
  validateNumber,
  sanitizeObject,
  createSafeObjectURL,
  validateConfig
};
