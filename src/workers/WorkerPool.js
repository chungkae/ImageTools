/**
 * Worker Pool - Worker 管理池
 * 
 * 管理多個 Worker 實例，提供任務排程與並行控制
 */

import { CONCURRENCY_LIMITS } from '../constants/limits.js';

export class WorkerPool {
  /**
   * @param {string|Function} workerPath - Worker 檔案路徑或建構函式
   * @param {number} [maxWorkers=CONCURRENCY_LIMITS.MAX_WORKERS] - 最大 Worker 數量
   */
  constructor(workerPath, maxWorkers = CONCURRENCY_LIMITS.MAX_WORKERS) {
    this.workerPath = workerPath;
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.taskId = 0;
  }
  
  /**
   * 初始化 Worker Pool
   */
  init() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(this.workerPath, { type: 'module' });
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
      
      // 監聽訊息
      worker.addEventListener('message', (e) => {
        this.handleWorkerMessage(worker, e.data);
      });
      
      // 監聽錯誤
      worker.addEventListener('error', (e) => {
        console.error('Worker 錯誤:', e);
      });
    }
  }
  
  /**
   * 執行任務
   * 
   * @param {string} type - 任務類型
   * @param {Object} data - 任務資料
   * @param {Function} [onProgress] - 進度回調
   * @returns {Promise<any>} 任務結果
   */
  execute(type, data, onProgress = null) {
    return new Promise((resolve, reject) => {
      const taskId = this.taskId++;
      
      const task = {
        id: taskId,
        type,
        data,
        onProgress,
        resolve,
        reject,
      };
      
      // 嘗試立即執行或加入佇列
      if (this.availableWorkers.length > 0) {
        this.runTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }
  
  /**
   * 執行任務（分配給可用 Worker）
   * 
   * @param {Object} task - 任務物件
   */
  runTask(task) {
    const worker = this.availableWorkers.shift();
    
    // 標記 Worker 為忙碌
    worker.currentTask = task;
    
    // 發送任務
    worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data,
    });
  }
  
  /**
   * 處理 Worker 回傳訊息
   * 
   * @param {Worker} worker - Worker 實例
   * @param {Object} message - 訊息物件
   */
  handleWorkerMessage(worker, message) {
    const { id, type: messageType, success, result, error, progress } = message;
    
    const task = worker.currentTask;
    
    if (!task || task.id !== id) {
      console.warn('收到未知任務的回應:', id);
      return;
    }
    
    // 進度報告
    if (messageType === 'progress' && task.onProgress) {
      task.onProgress(progress);
      return;
    }
    
    // 任務完成
    if (success) {
      task.resolve(result);
    } else {
      task.reject(new Error(error || 'WORKER_ERROR'));
    }
    
    // 釋放 Worker
    delete worker.currentTask;
    this.availableWorkers.push(worker);
    
    // 處理下一個任務
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.runTask(nextTask);
    }
  }
  
  /**
   * 取得佇列狀態
   * 
   * @returns {{ busy: number, available: number, queued: number }}
   */
  getStatus() {
    return {
      busy: this.workers.length - this.availableWorkers.length,
      available: this.availableWorkers.length,
      queued: this.taskQueue.length,
    };
  }
  
  /**
   * 終止所有 Worker
   */
  terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
  
  /**
   * 清空任務佇列
   */
  clearQueue() {
    // 拒絕所有排隊中的任務
    for (const task of this.taskQueue) {
      task.reject(new Error('任務已取消'));
    }
    
    this.taskQueue = [];
  }
}
