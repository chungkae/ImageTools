/**
 * ImagePreview 元件
 * 
 * 顯示圖片預覽與資訊
 */

import { formatBytes, formatDimensions } from '../utils/formatters.js';
import { getFormatDisplayName } from '../constants/fileTypes.js';

export class ImagePreview {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {boolean} [options.showInfo=true] - 是否顯示資訊
   * @param {number} [options.maxHeight=400] - 最大高度（px）
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showInfo: true,
      maxHeight: 400,
      ...options,
    };
    
    this.imageData = null;
  }
  
  /**
   * 顯示圖片
   * 
   * @param {string} dataUrl - 圖片 Data URL
   * @param {Object} info - 圖片資訊
   * @param {string} [info.name] - 檔案名稱
   * @param {string} [info.type] - MIME type
   * @param {number} [info.size] - 檔案大小（bytes）
   * @param {number} [info.width] - 寬度
   * @param {number} [info.height] - 高度
   */
  show(dataUrl, info = {}) {
    this.imageData = { dataUrl, ...info };
    
    this.container.innerHTML = `
      <div class="image-preview">
        <img 
          src="${dataUrl}" 
          alt="預覽圖片"
          style="max-height: ${this.options.maxHeight}px"
        />
        ${this.options.showInfo && Object.keys(info).length > 0 ? `
          <div class="image-preview-info">
            ${info.name ? `<p><strong>檔案名稱：</strong>${info.name}</p>` : ''}
            ${info.type ? `<p><strong>格式：</strong>${getFormatDisplayName(info.type)}</p>` : ''}
            ${info.size ? `<p><strong>大小：</strong>${formatBytes(info.size)}</p>` : ''}
            ${info.width && info.height ? `<p><strong>尺寸：</strong>${formatDimensions(info.width, info.height)}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    this.container.classList.remove('hidden');
  }
  
  /**
   * 更新圖片資訊（不重新載入圖片）
   * 
   * @param {Object} info - 新的資訊
   */
  updateInfo(info) {
    if (!this.imageData) return;
    
    this.imageData = { ...this.imageData, ...info };
    
    const infoEl = this.container.querySelector('.image-preview-info');
    if (infoEl && this.options.showInfo) {
      const { name, type, size, width, height } = this.imageData;
      
      infoEl.innerHTML = `
        ${name ? `<p><strong>檔案名稱：</strong>${name}</p>` : ''}
        ${type ? `<p><strong>格式：</strong>${getFormatDisplayName(type)}</p>` : ''}
        ${size ? `<p><strong>大小：</strong>${formatBytes(size)}</p>` : ''}
        ${width && height ? `<p><strong>尺寸：</strong>${formatDimensions(width, height)}</p>` : ''}
      `;
    }
  }
  
  /**
   * 取得當前圖片的 Data URL
   * 
   * @returns {string|null}
   */
  getDataUrl() {
    return this.imageData?.dataUrl || null;
  }
  
  /**
   * 取得當前圖片資訊
   * 
   * @returns {Object|null}
   */
  getInfo() {
    return this.imageData || null;
  }
  
  /**
   * 隱藏預覽
   */
  hide() {
    this.container.classList.add('hidden');
  }
  
  /**
   * 清除預覽
   */
  clear() {
    this.container.innerHTML = '';
    this.container.classList.add('hidden');
    this.imageData = null;
  }
  
  /**
   * 銷毀元件
   */
  destroy() {
    this.clear();
  }
}
