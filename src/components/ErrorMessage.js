/**
 * ErrorMessage 元件
 * 
 * 顯示錯誤訊息（可關閉）
 */

export class ErrorMessage {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {boolean} [options.dismissible=true] - 是否可關閉
   * @param {number} [options.autoDismiss=0] - 自動關閉時間（毫秒，0 表示不自動關閉）
   * @param {Function} [options.onDismiss] - 關閉回調
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      dismissible: true,
      autoDismiss: 0,
      onDismiss: null,
      ...options,
    };
    
    this.autoDismissTimer = null;
  }
  
  /**
   * 顯示錯誤訊息
   * 
   * @param {string|string[]} message - 錯誤訊息（可為陣列）
   */
  show(message) {
    const messages = Array.isArray(message) ? message : [message];
    
    this.container.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          ${messages.map(msg => `<p>${msg}</p>`).join('')}
        </div>
        ${this.options.dismissible ? `
          <button class="error-close" aria-label="關閉">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
    
    this.container.classList.remove('hidden');
    
    // 綁定關閉事件
    if (this.options.dismissible) {
      const closeBtn = this.container.querySelector('.error-close');
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // 自動關閉
    if (this.options.autoDismiss > 0) {
      this.autoDismissTimer = setTimeout(() => {
        this.hide();
      }, this.options.autoDismiss);
    }
  }
  
  /**
   * 隱藏錯誤訊息
   */
  hide() {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
    
    // 清除自動關閉計時器
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    
    // 回調
    if (this.options.onDismiss) {
      this.options.onDismiss();
    }
  }
  
  /**
   * 檢查是否正在顯示
   * 
   * @returns {boolean}
   */
  isVisible() {
    return !this.container.classList.contains('hidden');
  }
  
  /**
   * 銷毀元件
   */
  destroy() {
    this.hide();
  }
}
