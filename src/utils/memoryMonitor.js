/**
 * 記憶體監控工具 (T073)
 * 
 * 功能：
 * - 監控 performance.memory API
 * - 超過 500MB 閾值時發出警告
 * - 提供記憶體使用報告
 */

const MEMORY_WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB in bytes
const CHECK_INTERVAL = 30000; // 30 秒檢查一次

class MemoryMonitor {
  constructor() {
    this.isSupported = 'memory' in performance;
    this.warningCallbacks = [];
    this.intervalId = null;
    this.lastWarningTime = 0;
    this.warningCooldown = 60000; // 1 分鐘內不重複警告
  }

  /**
   * 開始監控記憶體使用
   */
  start() {
    if (!this.isSupported) {
      console.warn('⚠️ performance.memory API 不支援（僅 Chrome/Edge）');
      return;
    }

    if (this.intervalId) {
      console.warn('記憶體監控已在執行中');
      return;
    }

    console.log('✅ 記憶體監控已啟動');
    this.intervalId = setInterval(() => this.checkMemory(), CHECK_INTERVAL);
    
    // 立即執行一次
    this.checkMemory();
  }

  /**
   * 停止監控
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('記憶體監控已停止');
    }
  }

  /**
   * 檢查記憶體使用
   */
  checkMemory() {
    if (!this.isSupported) return;

    const memory = performance.memory;
    const usedHeap = memory.usedJSHeapSize;
    const totalHeap = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;

    const usageMB = (usedHeap / 1024 / 1024).toFixed(2);
    const totalMB = (totalHeap / 1024 / 1024).toFixed(2);
    const limitMB = (limit / 1024 / 1024).toFixed(2);

    // Debug 模式顯示詳細資訊
    if (localStorage.getItem('debug') === 'true') {
      console.log(`📊 記憶體使用: ${usageMB}MB / ${totalMB}MB (限制: ${limitMB}MB)`);
    }

    // 超過閾值警告
    if (usedHeap > MEMORY_WARNING_THRESHOLD) {
      const now = Date.now();
      
      // 冷卻時間內不重複警告
      if (now - this.lastWarningTime > this.warningCooldown) {
        this.lastWarningTime = now;
        
        const warning = {
          usedMB: parseFloat(usageMB),
          totalMB: parseFloat(totalMB),
          limitMB: parseFloat(limitMB),
          percentage: ((usedHeap / limit) * 100).toFixed(1),
          timestamp: new Date().toISOString()
        };

        console.warn(`⚠️ 記憶體使用過高: ${usageMB}MB (${warning.percentage}%)`, warning);
        
        // 觸發所有註冊的回調
        this.warningCallbacks.forEach(callback => {
          try {
            callback(warning);
          } catch (error) {
            console.error('記憶體警告回調錯誤:', error);
          }
        });
      }
    }
  }

  /**
   * 註冊記憶體警告回調
   * @param {Function} callback - 當記憶體超過閾值時呼叫
   */
  onWarning(callback) {
    if (typeof callback === 'function') {
      this.warningCallbacks.push(callback);
    }
  }

  /**
   * 取得當前記憶體使用狀態
   * @returns {Object|null} 記憶體狀態物件
   */
  getMemoryStatus() {
    if (!this.isSupported) {
      return null;
    }

    const memory = performance.memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      percentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)
    };
  }

  /**
   * 手動觸發垃圾回收提示（僅建議）
   * 注意：實際的 GC 由瀏覽器控制
   */
  suggestGC() {
    if (!this.isSupported) return;

    const beforeStatus = this.getMemoryStatus();
    console.log(`💡 建議執行垃圾回收 (當前: ${beforeStatus.usedMB}MB)`);
    
    // 清除可能的大型臨時變數
    // 實際 GC 由瀏覽器自動執行
    
    setTimeout(() => {
      const afterStatus = this.getMemoryStatus();
      if (afterStatus) {
        console.log(`📊 GC 後: ${afterStatus.usedMB}MB`);
      }
    }, 1000);
  }
}

// 單例模式
const memoryMonitor = new MemoryMonitor();

export { memoryMonitor, MEMORY_WARNING_THRESHOLD };
