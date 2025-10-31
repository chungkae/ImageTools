/**
 * ProgressBar 元件
 * 
 * 顯示處理進度
 */

import { formatPercentage } from '../utils/formatters.js';

export class ProgressBar {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {boolean} [options.showPercentage=true] - 是否顯示百分比
   * @param {boolean} [options.showText=true] - 是否顯示文字
   * @param {string} [options.initialText='處理中...'] - 初始文字
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showPercentage: true,
      showText: true,
      initialText: '處理中...',
      ...options,
    };
    
    this.progress = 0;
    this.text = this.options.initialText;
    
    this.init();
  }
  
  /**
   * 初始化元件
   */
  init() {
    this.render();
  }
  
  /**
   * 渲染 UI
   */
  render() {
    this.container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${this.progress}%"></div>
        ${this.options.showPercentage || this.options.showText ? `
          <div class="progress-text">
            ${this.options.showText ? `<span class="progress-label">${this.text}</span>` : ''}
            ${this.options.showPercentage ? `<span class="progress-percentage">${formatPercentage(this.progress / 100)}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    this.fillEl = this.container.querySelector('.progress-fill');
    this.textEl = this.container.querySelector('.progress-label');
    this.percentageEl = this.container.querySelector('.progress-percentage');
  }
  
  /**
   * 更新進度
   * 
   * @param {number} progress - 進度（0-100）
   * @param {string} [text] - 文字（選用）
   */
  update(progress, text) {
    this.progress = Math.max(0, Math.min(100, progress));
    
    if (text !== undefined) {
      this.text = text;
    }
    
    // 更新 UI
    if (this.fillEl) {
      this.fillEl.style.width = `${this.progress}%`;
    }
    
    if (this.textEl && text !== undefined) {
      this.textEl.textContent = text;
    }
    
    if (this.percentageEl) {
      this.percentageEl.textContent = formatPercentage(this.progress / 100);
    }
  }
  
  /**
   * 設定為完成狀態
   */
  complete() {
    this.update(100, '完成！');
  }
  
  /**
   * 重置進度
   */
  reset() {
    this.update(0, this.options.initialText);
  }
  
  /**
   * 顯示元件
   */
  show() {
    this.container.classList.remove('hidden');
  }
  
  /**
   * 隱藏元件
   */
  hide() {
    this.container.classList.add('hidden');
  }
  
  /**
   * 銷毀元件
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
