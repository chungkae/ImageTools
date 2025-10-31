/**
 * 日誌記錄工具 (T078)
 * 
 * 功能：
 * - 統一日誌格式
 * - 分級記錄（DEBUG, INFO, WARN, ERROR）
 * - 可選的遠端日誌上傳
 * - 本地日誌儲存
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const MAX_LOGS = 1000; // 最多保留 1000 筆日誌
const STORAGE_KEY = 'imagetools_logs';

class Logger {
  constructor() {
    this.logs = [];
    this.currentLevel = LOG_LEVELS.INFO;
    this.enabledCategories = new Set();
    
    // Debug 模式啟用 DEBUG 級別
    if (localStorage.getItem('debug') === 'true') {
      this.currentLevel = LOG_LEVELS.DEBUG;
    }

    // 載入儲存的日誌
    this.loadLogs();
  }

  /**
   * 設定日誌級別
   * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level - 日誌級別
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.currentLevel = LOG_LEVELS[level];
      console.log(`📝 日誌級別設為: ${level}`);
    }
  }

  /**
   * 啟用特定類別的日誌
   * @param {string} category - 類別名稱
   */
  enableCategory(category) {
    this.enabledCategories.add(category);
  }

  /**
   * 停用特定類別的日誌
   * @param {string} category - 類別名稱
   */
  disableCategory(category) {
    this.enabledCategories.delete(category);
  }

  /**
   * 記錄日誌
   * @param {string} level - 日誌級別
   * @param {string} message - 訊息
   * @param {Object} data - 額外資料
   * @param {string} category - 類別
   */
  log(level, message, data = {}, category = 'general') {
    const levelValue = LOG_LEVELS[level];
    
    // 檢查級別
    if (levelValue < this.currentLevel) {
      return;
    }

    // 檢查類別過濾
    if (this.enabledCategories.size > 0 && !this.enabledCategories.has(category)) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 加入到記憶體
    this.logs.push(logEntry);
    
    // 限制日誌數量
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    // 輸出到 console
    this.outputToConsole(logEntry);

    // 儲存到 localStorage（僅錯誤級別）
    if (level === 'ERROR' || level === 'WARN') {
      this.saveLogs();
    }
  }

  /**
   * 輸出到 Console
   * @param {Object} logEntry - 日誌項目
   */
  outputToConsole(logEntry) {
    const { level, category, message, data } = logEntry;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString('zh-TW');
    const prefix = `[${timestamp}] [${level}] [${category}]`;

    switch (level) {
      case 'DEBUG':
        console.debug(prefix, message, data);
        break;
      case 'INFO':
        console.info(prefix, message, data);
        break;
      case 'WARN':
        console.warn(prefix, message, data);
        break;
      case 'ERROR':
        console.error(prefix, message, data);
        break;
    }
  }

  /**
   * DEBUG 級別日誌
   * @param {string} message - 訊息
   * @param {Object} data - 額外資料
   * @param {string} category - 類別
   */
  debug(message, data, category = 'general') {
    this.log('DEBUG', message, data, category);
  }

  /**
   * INFO 級別日誌
   * @param {string} message - 訊息
   * @param {Object} data - 額外資料
   * @param {string} category - 類別
   */
  info(message, data, category = 'general') {
    this.log('INFO', message, data, category);
  }

  /**
   * WARN 級別日誌
   * @param {string} message - 訊息
   * @param {Object} data - 額外資料
   * @param {string} category - 類別
   */
  warn(message, data, category = 'general') {
    this.log('WARN', message, data, category);
  }

  /**
   * ERROR 級別日誌
   * @param {string} message - 訊息
   * @param {Object} data - 額外資料
   * @param {string} category - 類別
   */
  error(message, data, category = 'general') {
    this.log('ERROR', message, data, category);
  }

  /**
   * 儲存日誌到 localStorage
   */
  saveLogs() {
    try {
      // 只儲存最近 100 筆錯誤/警告
      const importantLogs = this.logs
        .filter(log => log.level === 'ERROR' || log.level === 'WARN')
        .slice(-100);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(importantLogs));
    } catch (error) {
      console.error('儲存日誌失敗:', error);
    }
  }

  /**
   * 載入儲存的日誌
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const logs = JSON.parse(stored);
        this.logs.push(...logs);
        console.log(`📝 已載入 ${logs.length} 筆歷史日誌`);
      }
    } catch (error) {
      console.error('載入日誌失敗:', error);
    }
  }

  /**
   * 清除所有日誌
   */
  clear() {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ 日誌已清除');
  }

  /**
   * 取得所有日誌
   * @param {Object} filters - 過濾條件
   * @returns {Array} 日誌陣列
   */
  getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    if (filters.since) {
      const sinceTime = new Date(filters.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    return filtered;
  }

  /**
   * 匯出日誌為 JSON 檔案
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `imagetools-logs-${new Date().toISOString()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('📥 日誌已匯出');
  }

  /**
   * 取得日誌統計
   * @returns {Object} 統計資料
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0
      },
      byCategory: {}
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      
      if (!stats.byCategory[log.category]) {
        stats.byCategory[log.category] = 0;
      }
      stats.byCategory[log.category]++;
    });

    return stats;
  }
}

// 單例模式
const logger = new Logger();

// 在 Debug 模式顯示日誌統計
if (localStorage.getItem('debug') === 'true') {
  console.log('📊 日誌統計:', logger.getStats());
}

export { logger, LOG_LEVELS };
