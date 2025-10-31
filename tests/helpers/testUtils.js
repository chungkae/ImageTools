/**
 * 測試工具集
 * 
 * 提供模擬物件、斷言輔助等測試功能
 */

import { vi } from 'vitest';

/**
 * 建立模擬的 File 物件
 * 
 * @param {Object} options
 * @param {string} [options.name='test.png'] - 檔案名稱
 * @param {string} [options.type='image/png'] - MIME type
 * @param {number} [options.size=1024] - 檔案大小（bytes）
 * @param {ArrayBuffer|string} [options.content] - 檔案內容
 * @returns {File}
 */
export function createMockFile(options = {}) {
  const {
    name = 'test.png',
    type = 'image/png',
    size = 1024,
    content = new ArrayBuffer(size),
  } = options;
  
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type, lastModified: Date.now() });
  
  // 覆寫 size 屬性（如果指定）
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  
  return file;
}

/**
 * 建立模擬的 Blob 物件
 * 
 * @param {Object} options
 * @param {string} [options.type='image/png'] - MIME type
 * @param {number} [options.size=1024] - 大小（bytes）
 * @param {ArrayBuffer|string} [options.content] - 內容
 * @returns {Blob}
 */
export function createMockBlob(options = {}) {
  const {
    type = 'image/png',
    size = 1024,
    content = new ArrayBuffer(size),
  } = options;
  
  const blob = new Blob([content], { type });
  
  Object.defineProperty(blob, 'size', {
    value: size,
    writable: false,
  });
  
  return blob;
}

/**
 * 建立模擬的 Image 元素
 * 
 * @param {Object} options
 * @param {number} [options.width=100] - 寬度
 * @param {number} [options.height=100] - 高度
 * @param {string} [options.src=''] - 來源
 * @returns {HTMLImageElement}
 */
export function createMockImage(options = {}) {
  const {
    width = 100,
    height = 100,
    src = '',
  } = options;
  
  const img = new Image();
  
  Object.defineProperty(img, 'naturalWidth', { value: width, writable: false });
  Object.defineProperty(img, 'naturalHeight', { value: height, writable: false });
  Object.defineProperty(img, 'width', { value: width, writable: false });
  Object.defineProperty(img, 'height', { value: height, writable: false });
  
  if (src) {
    img.src = src;
  }
  
  return img;
}

/**
 * 建立模擬的 Canvas 元素
 * 
 * @param {number} [width=100] - 寬度
 * @param {number} [height=100] - 高度
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function createMockCanvas(width = 100, height = 100) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  return { canvas, ctx };
}

/**
 * 模擬 FileReader
 * 
 * @param {Object} options
 * @param {*} [options.result] - 讀取結果
 * @param {Error} [options.error] - 錯誤物件
 * @param {number} [options.delay=0] - 延遲時間（ms）
 * @returns {FileReader}
 */
export function mockFileReader(options = {}) {
  const { result = '', error = null, delay = 0 } = options;
  
  const reader = {
    readAsDataURL: vi.fn(function () {
      setTimeout(() => {
        if (error) {
          this.onerror && this.onerror({ target: this });
        } else {
          this.result = result;
          this.onload && this.onload({ target: this });
        }
      }, delay);
    }),
    readAsArrayBuffer: vi.fn(function () {
      setTimeout(() => {
        if (error) {
          this.onerror && this.onerror({ target: this });
        } else {
          this.result = result;
          this.onload && this.onload({ target: this });
        }
      }, delay);
    }),
    readAsText: vi.fn(function () {
      setTimeout(() => {
        if (error) {
          this.onerror && this.onerror({ target: this });
        } else {
          this.result = result;
          this.onload && this.onload({ target: this });
        }
      }, delay);
    }),
    result: null,
    error: error,
    onload: null,
    onerror: null,
  };
  
  return reader;
}

/**
 * 等待一段時間（用於測試非同步行為）
 * 
 * @param {number} ms - 毫秒
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 斷言錯誤訊息
 * 
 * @param {Function} fn - 要執行的函式
 * @param {string} expectedError - 預期的錯誤訊息
 */
export async function expectError(fn, expectedError) {
  let error;
  
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  
  if (!error) {
    throw new Error(`預期會拋出錯誤，但沒有錯誤發生`);
  }
  
  if (error.message !== expectedError) {
    throw new Error(`預期錯誤訊息為 "${expectedError}"，實際為 "${error.message}"`);
  }
}

/**
 * 建立模擬的 IndexedDB
 * 
 * @returns {Object} 模擬的 indexedDB 物件
 */
export function mockIndexedDB() {
  const databases = new Map();
  
  return {
    open: vi.fn((name, version) => {
      return {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: {
          name,
          version,
          objectStoreNames: {
            contains: vi.fn(() => false),
          },
          createObjectStore: vi.fn((storeName, options) => {
            return {
              createIndex: vi.fn(),
            };
          }),
          transaction: vi.fn((storeNames, mode) => {
            return {
              objectStore: vi.fn(() => ({
                add: vi.fn(() => ({ onsuccess: null, onerror: null })),
                get: vi.fn(() => ({ onsuccess: null, onerror: null })),
                delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
                clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
                index: vi.fn(() => ({
                  get: vi.fn(() => ({ onsuccess: null, onerror: null })),
                  openCursor: vi.fn(() => ({ onsuccess: null, onerror: null })),
                })),
              })),
            };
          }),
        },
      };
    }),
    deleteDatabase: vi.fn(),
  };
}

/**
 * 建立模擬的 localStorage
 * 
 * @returns {Object} 模擬的 localStorage 物件
 */
export function mockLocalStorage() {
  const store = new Map();
  
  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size;
    },
  };
}

/**
 * 建立模擬的 Worker
 * 
 * @param {Function} messageHandler - 訊息處理函式
 * @returns {Worker}
 */
export function mockWorker(messageHandler) {
  const worker = {
    postMessage: vi.fn((data) => {
      // 模擬非同步處理
      setTimeout(() => {
        const response = messageHandler(data);
        if (response && worker.onmessage) {
          worker.onmessage({ data: response });
        }
      }, 0);
    }),
    addEventListener: vi.fn((event, handler) => {
      if (event === 'message') {
        worker.onmessage = handler;
      } else if (event === 'error') {
        worker.onerror = handler;
      }
    }),
    removeEventListener: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
  };
  
  return worker;
}
