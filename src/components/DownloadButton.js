/**
 * DownloadButton 元件
 * 
 * 提供下載功能的按鈕
 */

import { downloadFile } from '../utils/fileHelpers.js';

export class DownloadButton {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {string} [options.text='下載檔案'] - 按鈕文字
   * @param {string} [options.className='btn btn-primary download-button'] - CSS class
   * @param {Function} [options.onDownload] - 下載回調
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      text: '下載檔案',
      className: 'btn btn-primary download-button',
      onDownload: null,
      ...options,
    };
    
    this.data = null;
    this.filename = null;
    
    this.init();
  }
  
  /**
   * 初始化元件
   */
  init() {
    this.render();
    this.bindEvents();
  }
  
  /**
   * 渲染 UI
   */
  render() {
    this.container.innerHTML = `
      <button class="${this.options.className}" disabled>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 8px">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        ${this.options.text}
      </button>
    `;
    
    this.button = this.container.querySelector('button');
  }
  
  /**
   * 綁定事件
   */
  bindEvents() {
    this.button.addEventListener('click', () => {
      if (this.data && this.filename) {
        downloadFile(this.data, this.filename);
        
        if (this.options.onDownload) {
          this.options.onDownload(this.filename);
        }
      }
    });
  }
  
  /**
   * 設定下載資料
   * 
   * @param {Blob|string} data - Blob 或 Data URL
   * @param {string} filename - 檔案名稱
   */
  setData(data, filename) {
    this.data = data;
    this.filename = filename;
    
    // 啟用按鈕
    this.button.disabled = false;
  }
  
  /**
   * 清除資料
   */
  clear() {
    this.data = null;
    this.filename = null;
    
    // 停用按鈕
    this.button.disabled = true;
  }
  
  /**
   * 更新按鈕文字
   * 
   * @param {string} text - 新文字
   */
  setText(text) {
    const icon = this.button.querySelector('svg');
    this.button.innerHTML = '';
    this.button.appendChild(icon);
    this.button.appendChild(document.createTextNode(text));
  }
  
  /**
   * 啟用按鈕
   */
  enable() {
    this.button.disabled = false;
  }
  
  /**
   * 停用按鈕
   */
  disable() {
    this.button.disabled = true;
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
