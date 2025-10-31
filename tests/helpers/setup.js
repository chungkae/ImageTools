/**
 * Vitest 測試環境設定
 * 
 * 在測試執行前進行全域設定
 */

import { beforeAll, afterEach, vi } from 'vitest';
import { Canvas, Image as CanvasImage } from 'canvas';

/**
 * 全域設定（所有測試前執行一次）
 */
beforeAll(() => {
  // 設定 Canvas 支援（使用 node-canvas）
  global.HTMLCanvasElement = Canvas;
  global.Image = CanvasImage;
  
  // FileReader（jsdom 應該已提供，但確保存在）
  global.FileReader = class MockFileReader {
    constructor() {
      this._result = null;
      this._error = null;
      this._readyState = 0; // EMPTY
      this.onload = null;
      this.onerror = null;
      this.onabort = null;
      this.onprogress = null;
    }
    
    get result() {
      return this._result;
    }
    
    get error() {
      return this._error;
    }
    
    get readyState() {
      return this._readyState;
    }
    
    readAsDataURL(blob) {
      setTimeout(() => {
        this._readyState = 2; // DONE
        // 從 Blob 建立簡單的 data URL（使用有效的 Base64）
        // 使用 1x1 透明 PNG 的 Base64
        const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        this._result = `data:${blob.type || 'application/octet-stream'};base64,${validBase64}`;
        if (this.onload) {
          this.onload({ target: this });
        }
      }, 0);
    }
    
    readAsArrayBuffer(blob) {
      setTimeout(() => {
        this._readyState = 2; // DONE
        const buffer = new ArrayBuffer(blob.size || 1024);
        this._result = buffer;
        if (this.onload) {
          this.onload({ target: this });
        }
      }, 0);
    }
    
    readAsText(blob) {
      setTimeout(() => {
        this._readyState = 2; // DONE
        // SVG 測試用簡單內容
        if (blob.type === 'image/svg+xml') {
          this._result = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
        } else {
          this._result = 'mock text content';
        }
        if (this.onload) {
          this.onload({ target: this });
        }
      }, 0);
    }
    
    readAsBinaryString(blob) {
      setTimeout(() => {
        this._readyState = 2; // DONE
        this._result = 'mock binary string';
        if (this.onload) {
          this.onload({ target: this });
        }
      }, 0);
    }
    
    abort() {
      this._readyState = 2; // DONE
      if (this.onabort) {
        this.onabort();
      }
    }
  };
  
  // URL.createObjectURL / revokeObjectURL
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  }
  
  // OffscreenCanvas（Worker 中使用，jsdom 不支援）
  if (!global.OffscreenCanvas) {
    global.OffscreenCanvas = class MockOffscreenCanvas {
      constructor(width, height) {
        this.width = width;
        this.height = height;
      }
      
      getContext() {
        return {
          drawImage: vi.fn(),
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          getImageData: vi.fn(),
        };
      }
      
      convertToBlob() {
        return Promise.resolve(new Blob(['mock canvas data'], { type: 'image/png' }));
      }
    };
  }
  
  // createImageBitmap（Worker 中使用）
  if (!global.createImageBitmap) {
    global.createImageBitmap = vi.fn((source) => {
      return Promise.resolve({
        width: source.width || 100,
        height: source.height || 100,
        close: vi.fn(),
      });
    });
  }
  
  // IndexedDB（jsdom 應提供，但確保存在）
  if (!global.indexedDB) {
    global.indexedDB = {
      open: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      })),
      deleteDatabase: vi.fn(),
    };
  }
  
  // localStorage（jsdom 應提供）
  if (!global.localStorage) {
    const store = new Map();
    global.localStorage = {
      getItem: (key) => store.get(key) || null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
    };
  }
  
  // navigator.clipboard（測試複製功能）
  if (!global.navigator.clipboard) {
    global.navigator.clipboard = {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
    };
  }
  
  // navigator.storage（儲存配額檢查）
  if (!global.navigator.storage) {
    global.navigator.storage = {
      estimate: vi.fn(() => Promise.resolve({
        usage: 1000000,
        quota: 100000000,
      })),
    };
  }
});

/**
 * 每個測試後執行（清理）
 */
afterEach(() => {
  // 清除所有 mock
  vi.clearAllMocks();
  
  // 清除 localStorage
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  // 清除計時器
  vi.clearAllTimers();
});

/**
 * 全域測試工具（可在測試中直接使用）
 */
global.testUtils = {
  /**
   * 等待下一個 tick
   */
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  /**
   * 等待指定時間
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};
