/**
 * 資源管理工具 (T076)
 * 
 * 功能：
 * - 追蹤所有建立的 Object URLs
 * - 自動清理不再使用的 URLs
 * - 防止記憶體洩漏
 */

const CLEANUP_INTERVAL = 10000; // 10 秒檢查一次
const URL_TIMEOUT = 60000; // 60 秒後自動清理未使用的 URL

class ResourceManager {
  constructor() {
    this.urls = new Map(); // url -> { blob, timestamp, element }
    this.intervalId = null;
  }

  /**
   * 建立 Object URL 並追蹤
   * @param {Blob} blob - Blob 物件
   * @param {HTMLElement} element - 使用此 URL 的元素（可選）
   * @returns {string} Object URL
   */
  createObjectURL(blob, element = null) {
    if (!(blob instanceof Blob)) {
      throw new TypeError('參數必須是 Blob 物件');
    }

    const url = URL.createObjectURL(blob);
    
    this.urls.set(url, {
      blob,
      timestamp: Date.now(),
      element
    });

    // 如果是第一個 URL，啟動自動清理
    if (this.urls.size === 1) {
      this.startAutoCleanup();
    }

    if (localStorage.getItem('debug') === 'true') {
      console.log(`🔗 已建立 Object URL (共 ${this.urls.size} 個):`, url);
    }

    return url;
  }

  /**
   * 釋放 Object URL
   * @param {string} url - 要釋放的 URL
   */
  revokeObjectURL(url) {
    if (!url || !this.urls.has(url)) {
      return;
    }

    try {
      URL.revokeObjectURL(url);
      this.urls.delete(url);

      if (localStorage.getItem('debug') === 'true') {
        console.log(`🗑️ 已釋放 Object URL (剩餘 ${this.urls.size} 個):`, url);
      }

      // 如果沒有 URL 了，停止自動清理
      if (this.urls.size === 0) {
        this.stopAutoCleanup();
      }
    } catch (error) {
      console.error('釋放 Object URL 失敗:', error);
    }
  }

  /**
   * 釋放所有 Object URLs
   */
  revokeAll() {
    const count = this.urls.size;
    
    for (const url of this.urls.keys()) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('釋放 Object URL 失敗:', url, error);
      }
    }

    this.urls.clear();
    this.stopAutoCleanup();

    console.log(`🗑️ 已釋放所有 Object URLs (共 ${count} 個)`);
  }

  /**
   * 啟動自動清理
   */
  startAutoCleanup() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL);

    if (localStorage.getItem('debug') === 'true') {
      console.log('✅ Object URL 自動清理已啟動');
    }
  }

  /**
   * 停止自動清理
   */
  stopAutoCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;

      if (localStorage.getItem('debug') === 'true') {
        console.log('⏹️ Object URL 自動清理已停止');
      }
    }
  }

  /**
   * 清理過期的 URLs
   */
  cleanupExpired() {
    const now = Date.now();
    const expired = [];

    for (const [url, info] of this.urls.entries()) {
      const age = now - info.timestamp;
      
      // 檢查是否過期
      if (age > URL_TIMEOUT) {
        // 如果有關聯的元素，檢查元素是否還在 DOM 中
        if (info.element) {
          if (!document.body.contains(info.element)) {
            expired.push(url);
          }
        } else {
          // 沒有關聯元素，按時間清理
          expired.push(url);
        }
      }
    }

    if (expired.length > 0) {
      expired.forEach(url => this.revokeObjectURL(url));
      
      if (localStorage.getItem('debug') === 'true') {
        console.log(`🧹 已清理 ${expired.length} 個過期 Object URLs`);
      }
    }
  }

  /**
   * 替換元素的 Object URL（自動清理舊的）
   * @param {HTMLElement} element - 目標元素
   * @param {string} property - 屬性名稱（如 'src'）
   * @param {Blob} blob - 新的 Blob 物件
   */
  setElementURL(element, property, blob) {
    // 清理舊的 URL
    const oldUrl = element[property];
    if (oldUrl && this.urls.has(oldUrl)) {
      this.revokeObjectURL(oldUrl);
    }

    // 設定新的 URL
    const newUrl = this.createObjectURL(blob, element);
    element[property] = newUrl;

    return newUrl;
  }

  /**
   * 取得資源管理狀態
   * @returns {Object}
   */
  getStatus() {
    const now = Date.now();
    const urlList = [];

    for (const [url, info] of this.urls.entries()) {
      urlList.push({
        url,
        age: now - info.timestamp,
        hasElement: !!info.element,
        blobSize: info.blob.size,
        blobType: info.blob.type
      });
    }

    return {
      totalURLs: this.urls.size,
      autoCleanupActive: !!this.intervalId,
      urls: urlList
    };
  }
}

// 單例模式
const resourceManager = new ResourceManager();

// 頁面卸載時清理所有資源
window.addEventListener('beforeunload', () => {
  resourceManager.revokeAll();
});

export { resourceManager, URL_TIMEOUT };
