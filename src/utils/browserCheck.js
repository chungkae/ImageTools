/**
 * 瀏覽器相容性檢測工具 (T074)
 * 
 * 功能：
 * - 檢測瀏覽器版本
 * - 檢測必要 API 支援度
 * - 顯示不相容警告
 */

const MINIMUM_VERSIONS = {
  chrome: 90,
  edge: 90,
  firefox: 88,
  safari: 14,
  opera: 76
};

const REQUIRED_FEATURES = [
  'FileReader',
  'Blob',
  'createObjectURL',
  'Canvas',
  'Worker',
  'Promise',
  'fetch'
];

class BrowserCheck {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.supportStatus = this.checkSupport();
  }

  /**
   * 偵測瀏覽器類型與版本
   * @returns {Object} { name, version, isSupported }
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    let name = 'unknown';
    let version = 0;

    // Chrome (需在 Edge 之前檢查)
    if (/Chrome\/(\d+)/.test(ua) && !/Edg/.test(ua)) {
      name = 'chrome';
      version = parseInt(RegExp.$1);
    }
    // Edge (Chromium-based)
    else if (/Edg\/(\d+)/.test(ua)) {
      name = 'edge';
      version = parseInt(RegExp.$1);
    }
    // Firefox
    else if (/Firefox\/(\d+)/.test(ua)) {
      name = 'firefox';
      version = parseInt(RegExp.$1);
    }
    // Safari
    else if (/Version\/(\d+).*Safari/.test(ua)) {
      name = 'safari';
      version = parseInt(RegExp.$1);
    }
    // Opera
    else if (/OPR\/(\d+)/.test(ua)) {
      name = 'opera';
      version = parseInt(RegExp.$1);
    }

    const minimumVersion = MINIMUM_VERSIONS[name] || 0;
    const isSupported = version >= minimumVersion;

    return {
      name,
      version,
      minimumVersion,
      isSupported,
      userAgent: ua
    };
  }

  /**
   * 檢查必要功能支援度
   * @returns {Object} 各功能支援狀態
   */
  checkSupport() {
    const support = {};

    // FileReader API
    support.FileReader = typeof FileReader !== 'undefined';

    // Blob API
    support.Blob = typeof Blob !== 'undefined';

    // createObjectURL
    support.createObjectURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

    // Canvas API
    support.Canvas = (() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    })();

    // Web Workers
    support.Worker = typeof Worker !== 'undefined';

    // Promise
    support.Promise = typeof Promise !== 'undefined';

    // Fetch API
    support.fetch = typeof fetch !== 'undefined';

    // Performance API (optional)
    support.Performance = typeof performance !== 'undefined';

    // Memory API (optional - Chrome only)
    support.PerformanceMemory = typeof performance !== 'undefined' && 'memory' in performance;

    // Service Worker (optional)
    support.ServiceWorker = 'serviceWorker' in navigator;

    // IndexedDB
    support.IndexedDB = typeof indexedDB !== 'undefined';

    // WebP support (async detection needed)
    support.WebP = null; // 需要非同步檢測

    return support;
  }

  /**
   * 檢查是否所有必要功能都支援
   * @returns {boolean}
   */
  isFullySupported() {
    const critical = REQUIRED_FEATURES.every(feature => {
      return this.supportStatus[feature] === true;
    });

    return critical && this.browserInfo.isSupported;
  }

  /**
   * 取得不支援的功能列表
   * @returns {Array<string>}
   */
  getUnsupportedFeatures() {
    return REQUIRED_FEATURES.filter(feature => {
      return this.supportStatus[feature] !== true;
    });
  }

  /**
   * 顯示相容性警告訊息
   */
  showWarning() {
    if (this.isFullySupported()) {
      return; // 完全支援，不需警告
    }

    const { name, version, minimumVersion } = this.browserInfo;
    const unsupported = this.getUnsupportedFeatures();

    let message = '';

    // 瀏覽器版本過舊
    if (!this.browserInfo.isSupported && name !== 'unknown') {
      message = `您的瀏覽器版本過舊（${name} ${version}），建議升級至 ${name} ${minimumVersion} 或更新版本以獲得最佳體驗。\n\n`;
    }

    // 缺少必要功能
    if (unsupported.length > 0) {
      message += `您的瀏覽器缺少以下必要功能：\n${unsupported.join(', ')}\n\n`;
      message += '部分功能可能無法正常運作。';
    }

    if (message) {
      console.warn('⚠️ 瀏覽器相容性警告:', message);
      
      // 在頁面上顯示警告
      this.displayWarningBanner(message);
    }
  }

  /**
   * 在頁面上顯示警告橫幅
   * @param {string} message - 警告訊息
   */
  displayWarningBanner(message) {
    const banner = document.createElement('div');
    banner.id = 'browser-warning-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #fbbf24;
      color: #78350f;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    banner.innerHTML = `
      <strong>⚠️ 瀏覽器相容性警告</strong><br>
      ${message.replace(/\n/g, '<br>')}
      <button id="close-warning" style="margin-left: 16px; padding: 4px 12px; background: #78350f; color: white; border: none; border-radius: 4px; cursor: pointer;">關閉</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // 關閉按鈕
    document.getElementById('close-warning')?.addEventListener('click', () => {
      banner.remove();
    });

    // 10 秒後自動關閉
    setTimeout(() => {
      banner.remove();
    }, 10000);
  }

  /**
   * 取得詳細相容性報告
   * @returns {Object}
   */
  getReport() {
    return {
      browser: this.browserInfo,
      support: this.supportStatus,
      isFullySupported: this.isFullySupported(),
      unsupportedFeatures: this.getUnsupportedFeatures(),
      recommendations: this.getRecommendations()
    };
  }

  /**
   * 取得建議
   * @returns {Array<string>}
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.browserInfo.isSupported) {
      recommendations.push(`請升級至 ${this.browserInfo.name} ${this.browserInfo.minimumVersion}+ 版本`);
    }

    if (!this.supportStatus.Worker) {
      recommendations.push('您的瀏覽器不支援 Web Workers，GIF 轉換可能會較慢');
    }

    if (!this.supportStatus.ServiceWorker) {
      recommendations.push('您的瀏覽器不支援離線功能');
    }

    if (!this.supportStatus.PerformanceMemory) {
      recommendations.push('無法監控記憶體使用（非 Chrome 瀏覽器）');
    }

    return recommendations;
  }
}

// 單例模式
const browserCheck = new BrowserCheck();

export { browserCheck, MINIMUM_VERSIONS, REQUIRED_FEATURES };
