/**
 * StorageService - 資料儲存服務
 * 
 * 提供 IndexedDB（檔案快取）與 localStorage（偏好設定）管理
 */

import { STORAGE_LIMITS } from '../constants/limits.js';

const DB_NAME = 'ImageToolsDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileCache';

export class StorageService {
  constructor() {
    this.db = null;
    this.isSupported = this.checkSupport();
  }
  
  /**
   * 檢查瀏覽器支援
   * 
   * @returns {boolean}
   */
  checkSupport() {
    return 'indexedDB' in window && 'localStorage' in window;
  }
  
  /**
   * 初始化 IndexedDB
   * 
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (!this.isSupported) {
      throw new Error('BROWSER_NOT_SUPPORTED');
    }
    
    if (this.db) {
      return this.db;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 建立 object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id',
            autoIncrement: true,
          });
          
          // 建立索引
          objectStore.createIndex('key', 'key', { unique: true });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }
  
  /**
   * 儲存資料到 IndexedDB
   * 
   * @param {string} key - 鍵名
   * @param {Blob} blob - 資料（Blob）
   * @param {Object} [metadata={}] - 元資料
   * @returns {Promise<number>} 儲存的 ID
   */
  async save(key, blob, metadata = {}) {
    await this.init();
    
    // 檢查容量
    const canStore = await this.checkQuota(blob.size);
    if (!canStore) {
      throw new Error('QUOTA_EXCEEDED');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const data = {
        key,
        blob,
        size: blob.size,
        timestamp: Date.now(),
        metadata,
      };
      
      // 先刪除舊資料（如果存在）
      const index = objectStore.index('key');
      const getRequest = index.get(key);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        
        if (existing) {
          objectStore.delete(existing.id);
        }
        
        const addRequest = objectStore.add(data);
        
        addRequest.onsuccess = () => {
          resolve(addRequest.result);
        };
        
        addRequest.onerror = () => {
          reject(new Error('STORAGE_ERROR'));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
    });
  }
  
  /**
   * 從 IndexedDB 取得資料
   * 
   * @param {string} key - 鍵名
   * @returns {Promise<{blob: Blob, metadata: Object}|null>}
   */
  async get(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('key');
      
      const request = index.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (result) {
          resolve({
            blob: result.blob,
            metadata: result.metadata,
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
    });
  }
  
  /**
   * 刪除 IndexedDB 中的資料
   * 
   * @param {string} key - 鍵名
   * @returns {Promise<void>}
   */
  async delete(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('key');
      
      const getRequest = index.get(key);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        
        if (existing) {
          const deleteRequest = objectStore.delete(existing.id);
          
          deleteRequest.onsuccess = () => {
            resolve();
          };
          
          deleteRequest.onerror = () => {
            reject(new Error('STORAGE_ERROR'));
          };
        } else {
          resolve(); // 不存在也視為成功
        }
      };
      
      getRequest.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
    });
  }
  
  /**
   * 清空所有快取
   * 
   * @returns {Promise<void>}
   */
  async clear() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
    });
  }
  
  /**
   * 檢查儲存容量
   * 
   * @param {number} requiredSize - 需要的大小（bytes）
   * @returns {Promise<boolean>} 是否有足夠空間
   */
  async checkQuota(requiredSize = 0) {
    if (!navigator.storage || !navigator.storage.estimate) {
      // 降級：假設有空間
      return true;
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      const available = estimate.quota - estimate.usage;
      
      return available >= requiredSize;
    } catch (error) {
      console.warn('無法檢查儲存配額', error);
      return true;
    }
  }
  
  /**
   * 取得儲存使用情況
   * 
   * @returns {Promise<{usage: number, quota: number, percentage: number}>}
   */
  async getUsage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0, percentage: 0 };
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota > 0 
          ? (estimate.usage / estimate.quota) * 100 
          : 0,
      };
    } catch (error) {
      console.warn('無法取得儲存使用情況', error);
      return { usage: 0, quota: 0, percentage: 0 };
    }
  }
  
  /**
   * 清理過期快取（依時間戳記）
   * 
   * @param {number} [maxAge=STORAGE_LIMITS.MAX_CACHE_AGE] - 最大保留天數
   * @returns {Promise<number>} 刪除的項目數
   */
  async cleanup(maxAge = STORAGE_LIMITS.MAX_CACHE_AGE) {
    await this.init();
    
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // 轉換為毫秒
    const cutoffTime = Date.now() - maxAgeMs;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('timestamp');
      
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          objectStore.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        reject(new Error('STORAGE_ERROR'));
      };
    });
  }
  
  /**
   * 取得 localStorage 中的偏好設定
   * 
   * @param {string} key - 鍵名
   * @param {*} [defaultValue=null] - 預設值
   * @returns {*} 值
   */
  getPreference(key, defaultValue = null) {
    if (!this.isSupported) return defaultValue;
    
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn('讀取偏好設定失敗', key, error);
      return defaultValue;
    }
  }
  
  /**
   * 儲存偏好設定到 localStorage
   * 
   * @param {string} key - 鍵名
   * @param {*} value - 值
   */
  setPreference(key, value) {
    if (!this.isSupported) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('儲存偏好設定失敗', key, error);
    }
  }
  
  /**
   * 刪除偏好設定
   * 
   * @param {string} key - 鍵名
   */
  removePreference(key) {
    if (!this.isSupported) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('刪除偏好設定失敗', key, error);
    }
  }
  
  /**
   * 清空所有偏好設定
   */
  clearPreferences() {
    if (!this.isSupported) return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('清空偏好設定失敗', error);
    }
  }
}

// 建立單例
export const storage = new StorageService();
