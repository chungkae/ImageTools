/**
 * Canvas 池管理工具 (T075)
 * 
 * 功能：
 * - 重用 Canvas 元素以減少記憶體分配
 * - 自動調整 Canvas 尺寸
 * - 自動清理閒置 Canvas
 */

const MAX_POOL_SIZE = 10; // 最多保留 10 個 Canvas
const CLEANUP_INTERVAL = 60000; // 60 秒清理一次閒置 Canvas
const IDLE_TIMEOUT = 30000; // 30 秒未使用視為閒置

class CanvasPool {
  constructor() {
    this.pool = [];
    this.inUse = new Set();
    this.lastUsed = new Map();
    
    // 定期清理閒置 Canvas
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  /**
   * 從池中取得或建立 Canvas
   * @param {number} width - Canvas 寬度
   * @param {number} height - Canvas 高度
   * @param {Object} options - Context 選項
   * @returns {Object} { canvas, ctx }
   */
  acquire(width, height, options = {}) {
    // 嘗試從池中取得可重用的 Canvas
    let canvas = this.pool.pop();
    
    if (!canvas) {
      // 池中沒有，建立新的
      canvas = document.createElement('canvas');
      
      if (localStorage.getItem('debug') === 'true') {
        console.log(`🎨 建立新 Canvas (池大小: ${this.pool.length})`);
      }
    } else {
      if (localStorage.getItem('debug') === 'true') {
        console.log(`♻️ 重用 Canvas (池大小: ${this.pool.length})`);
      }
    }

    // 設定尺寸
    canvas.width = width;
    canvas.height = height;

    // 取得 Context
    const contextOptions = {
      willReadFrequently: true,
      ...options
    };
    const ctx = canvas.getContext('2d', contextOptions);

    // 標記為使用中
    this.inUse.add(canvas);
    this.lastUsed.set(canvas, Date.now());

    return { canvas, ctx };
  }

  /**
   * 釋放 Canvas 回池中
   * @param {HTMLCanvasElement} canvas - 要釋放的 Canvas
   */
  release(canvas) {
    if (!canvas) return;

    // 從使用中移除
    this.inUse.delete(canvas);
    this.lastUsed.set(canvas, Date.now());

    // 清空 Canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 如果池未滿，放回池中
    if (this.pool.length < MAX_POOL_SIZE) {
      this.pool.push(canvas);
      
      if (localStorage.getItem('debug') === 'true') {
        console.log(`♻️ Canvas 已釋放回池 (池大小: ${this.pool.length})`);
      }
    } else {
      // 池已滿，丟棄
      if (localStorage.getItem('debug') === 'true') {
        console.log(`🗑️ Canvas 已丟棄 (池已滿)`);
      }
    }
  }

  /**
   * 清理閒置的 Canvas
   */
  cleanup() {
    const now = Date.now();
    const beforeSize = this.pool.length;

    // 保留最近使用的 Canvas
    this.pool = this.pool.filter(canvas => {
      const lastUsedTime = this.lastUsed.get(canvas) || 0;
      const isIdle = now - lastUsedTime > IDLE_TIMEOUT;
      
      if (isIdle) {
        this.lastUsed.delete(canvas);
      }
      
      return !isIdle;
    });

    const cleaned = beforeSize - this.pool.length;
    
    if (cleaned > 0 && localStorage.getItem('debug') === 'true') {
      console.log(`🧹 已清理 ${cleaned} 個閒置 Canvas (池大小: ${this.pool.length})`);
    }
  }

  /**
   * 清空整個池
   */
  clear() {
    const size = this.pool.length + this.inUse.size;
    
    this.pool = [];
    this.inUse.clear();
    this.lastUsed.clear();

    console.log(`🗑️ Canvas 池已清空 (共 ${size} 個)`);
  }

  /**
   * 取得池狀態
   * @returns {Object}
   */
  getStatus() {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      total: this.pool.length + this.inUse.size,
      maxSize: MAX_POOL_SIZE
    };
  }
}

// 單例模式
const canvasPool = new CanvasPool();

export { canvasPool, MAX_POOL_SIZE };
