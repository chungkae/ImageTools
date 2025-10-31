/**
 * 統一錯誤邊界 (T077)
 * 
 * 功能：
 * - 捕捉全域未處理的錯誤與 Promise rejections
 * - 統一錯誤格式與處理流程
 * - 使用者友善的錯誤訊息
 */

import { logger } from './logger.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

class ErrorBoundary {
  constructor() {
    this.errorHandlers = [];
    this.init();
  }

  /**
   * 初始化錯誤邊界
   */
  init() {
    // 捕捉全域 JavaScript 錯誤
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // 防止瀏覽器預設錯誤處理
      event.preventDefault();
    });

    // 捕捉未處理的 Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        promise: event.promise
      });
      
      event.preventDefault();
    });

    console.log('✅ 錯誤邊界已初始化');
  }

  /**
   * 處理錯誤
   * @param {Error|any} error - 錯誤物件
   * @param {Object} context - 錯誤上下文
   */
  handleError(error, context = {}) {
    // 標準化錯誤物件
    const normalizedError = this.normalizeError(error);
    
    // 記錄錯誤
    logger.error('錯誤邊界捕捉到錯誤', {
      error: normalizedError,
      context
    });

    // 觸發註冊的錯誤處理器
    this.errorHandlers.forEach(handler => {
      try {
        handler(normalizedError, context);
      } catch (handlerError) {
        console.error('錯誤處理器本身發生錯誤:', handlerError);
      }
    });

    // 顯示使用者友善的錯誤訊息
    this.showUserError(normalizedError, context);
  }

  /**
   * 標準化錯誤物件
   * @param {Error|any} error - 原始錯誤
   * @returns {Object} 標準化錯誤
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        originalError: error
      };
    }

    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error,
        stack: null,
        originalError: error
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
      stack: null,
      originalError: error
    };
  }

  /**
   * 顯示使用者友善的錯誤訊息
   * @param {Object} error - 標準化錯誤
   * @param {Object} context - 錯誤上下文
   */
  showUserError(error, context) {
    let userMessage = ERROR_MESSAGES.GENERAL_ERROR;

    // 根據錯誤類型選擇訊息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = '網路連線失敗，請檢查您的網路連線';
    } else if (error.name === 'QuotaExceededError') {
      userMessage = '儲存空間不足，請清理瀏覽器快取';
    } else if (error.message.includes('memory')) {
      userMessage = '記憶體不足，請關閉其他分頁後重試';
    } else if (error.message.includes('timeout')) {
      userMessage = '處理超時，請重試或減少檔案大小';
    }

    // 建立錯誤訊息元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'global-error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #fee2e2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      z-index: 10001;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;

    errorDiv.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 18px;">❌ 發生錯誤</h3>
      <p style="margin: 0 0 16px 0; color: #7f1d1d;">${userMessage}</p>
      ${localStorage.getItem('debug') === 'true' ? `
        <details style="margin-bottom: 16px;">
          <summary style="cursor: pointer; color: #991b1b;">技術細節</summary>
          <pre style="margin-top: 8px; padding: 8px; background: white; border-radius: 4px; overflow: auto; font-size: 12px; color: #7f1d1d;">${error.name}: ${error.message}\n${error.stack || ''}</pre>
        </details>
      ` : ''}
      <div style="display: flex; gap: 8px;">
        <button id="error-reload" style="flex: 1; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">重新整理頁面</button>
        <button id="error-close" style="flex: 1; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">關閉</button>
      </div>
    `;

    // 移除舊的錯誤訊息
    document.querySelectorAll('.global-error-message').forEach(el => el.remove());

    document.body.appendChild(errorDiv);

    // 事件監聽
    document.getElementById('error-reload')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('error-close')?.addEventListener('click', () => {
      errorDiv.remove();
    });

    // 10 秒後自動關閉（除非是嚴重錯誤）
    if (!error.message.includes('memory') && !error.message.includes('quota')) {
      setTimeout(() => {
        errorDiv.remove();
      }, 10000);
    }
  }

  /**
   * 註冊錯誤處理器
   * @param {Function} handler - 錯誤處理函式
   */
  onError(handler) {
    if (typeof handler === 'function') {
      this.errorHandlers.push(handler);
    }
  }

  /**
   * 手動觸發錯誤處理
   * @param {Error|any} error - 錯誤物件
   * @param {Object} context - 錯誤上下文
   */
  captureError(error, context = {}) {
    this.handleError(error, { ...context, manual: true });
  }

  /**
   * 包裝非同步函式以自動捕捉錯誤
   * @param {Function} fn - 非同步函式
   * @returns {Function} 包裝後的函式
   */
  wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureError(error, {
          function: fn.name,
          arguments: args
        });
        throw error;
      }
    };
  }

  /**
   * 包裝同步函式以自動捕捉錯誤
   * @param {Function} fn - 同步函式
   * @returns {Function} 包裝後的函式
   */
  wrapSync(fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.captureError(error, {
          function: fn.name,
          arguments: args
        });
        throw error;
      }
    };
  }
}

// 單例模式
const errorBoundary = new ErrorBoundary();

export { errorBoundary };
