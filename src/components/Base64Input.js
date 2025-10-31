/**
 * Base64Input 元件
 * 
 * 提供 Base64 字串輸入與驗證功能
 */

import { isValidBase64, isValidDataUrl } from '../utils/validators.js';
import { Base64Converter } from '../services/base64Converter.js';

export class Base64Input {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {string} [options.placeholder] - 佔位文字
   * @param {Function} [options.onChange] - 輸入變更回調
   * @param {Function} [options.onValidate] - 驗證回調
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      placeholder: '貼上 Base64 字串（可含或不含 data: 前綴）...',
      onChange: null,
      onValidate: null,
      maxDisplayLength: 5000, // 超過此長度不顯示在 textarea
      ...options,
    };
    
    this.value = ''; // 實際儲存的完整值
    this.isValid = false;
    this.isLongString = false; // 是否為長字串
    
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
      <div class="base64-input-container">
        <label for="base64-input" class="input-label">Base64 字串</label>
        <textarea 
          id="base64-input" 
          class="textarea base64-textarea" 
          placeholder="${this.options.placeholder}"
          rows="8"
        ></textarea>
        <div class="base64-info hidden">
          <span class="base64-length-info"></span>
        </div>
        <div class="base64-input-footer">
          <div class="validation-status hidden">
            <span class="status-icon"></span>
            <span class="status-text"></span>
          </div>
          <button class="btn btn-secondary clear-button" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            清除
          </button>
        </div>
      </div>
    `;
    
    this.textarea = this.container.querySelector('.base64-textarea');
    this.statusEl = this.container.querySelector('.validation-status');
    this.statusIcon = this.container.querySelector('.status-icon');
    this.statusText = this.container.querySelector('.status-text');
    this.clearButton = this.container.querySelector('.clear-button');
    this.infoEl = this.container.querySelector('.base64-info');
    this.lengthInfo = this.container.querySelector('.base64-length-info');
  }
  
  /**
   * 綁定事件
   */
  bindEvents() {
    // 輸入變更
    this.textarea.addEventListener('input', () => {
      // 如果是唯讀模式（長字串預覽），不處理
      if (this.textarea.readOnly) {
        return;
      }
      
      this.value = this.textarea.value.trim();
      this.handleValueChange();
    });
    
    // 貼上事件 - 在瀏覽器處理貼上之前攔截
    this.textarea.addEventListener('paste', (e) => {
      // 獲取剪貼簿的原始文字（在瀏覽器處理之前）
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData('text');
      
      if (!pastedText) {
        return;
      }
      
      // 阻止預設貼上行為
      e.preventDefault();
      
      const pastedValue = pastedText.trim();
      
      // 檢查是否為長字串
      if (pastedValue.length > this.options.maxDisplayLength) {
        // 長字串：儲存完整內容，顯示預覽
        this.value = pastedValue;
        this.isLongString = true;
        this.showLongStringPreview();
        this.validate();
        
        if (this.options.onChange) {
          this.options.onChange(this.value, this.isValid);
        }
      } else {
        // 短字串：正常貼上到 textarea
        this.textarea.value = pastedValue;
        this.value = pastedValue;
        this.isLongString = false;
        this.handleValueChange();
      }
    });
    
    // 清除按鈕
    this.clearButton.addEventListener('click', () => {
      this.clear();
    });
  }
  
  /**
   * 處理值變更
   */
  handleValueChange() {
    if (this.value.length > this.options.maxDisplayLength) {
      // 變成長字串
      this.isLongString = true;
      this.showLongStringPreview();
    } else {
      // 短字串或清空
      this.isLongString = false;
      this.infoEl.classList.add('hidden');
    }
    
    this.validate();
    
    if (this.options.onChange) {
      this.options.onChange(this.value, this.isValid);
    }
  }
  
  /**
   * 顯示長字串預覽
   */
  showLongStringPreview() {
    // 顯示部分內容（前後各 500 字元），避免完全空白
    const previewLength = 500;
    const start = this.value.substring(0, previewLength);
    const end = this.value.substring(this.value.length - previewLength);
    const omittedLength = this.value.length - (previewLength * 2);
    
    // 在 textarea 顯示預覽
    const preview = `${start}\n\n... (省略 ${omittedLength.toLocaleString()} 字元，已儲存完整內容) ...\n\n${end}`;
    this.textarea.value = preview;
    this.textarea.readOnly = true;
    this.textarea.style.color = 'var(--color-text-secondary)';
    
    // 顯示詳細資訊
    this.infoEl.classList.remove('hidden');
    const sizeKB = (this.value.length / 1024).toFixed(1);
    this.lengthInfo.textContent = `✓ 已載入完整字串：${this.value.length.toLocaleString()} 字元 (約 ${sizeKB} KB)`;
    this.lengthInfo.style.color = 'var(--color-success)';
  }
  
  /**
   * 恢復正常顯示
   */
  restoreNormalDisplay() {
    this.textarea.readOnly = false;
    this.textarea.style.color = '';
    this.infoEl.classList.add('hidden');
    this.lengthInfo.style.color = '';
  }
  
  /**
   * 更新顯示內容（處理長字串截斷）
   */
  updateDisplay() {
    // 如果是長字串，顯示預覽資訊
    if (this.isLongString && this.value.length > this.options.maxDisplayLength) {
      this.showLongStringPreview();
    } else if (this.value.length > 0) {
      const sizeKB = (this.value.length / 1024).toFixed(1);
      this.infoEl.classList.remove('hidden');
      this.lengthInfo.textContent = `字串長度: ${this.value.length.toLocaleString()} 字元 (約 ${sizeKB} KB)`;
      this.lengthInfo.style.color = '';
    } else {
      this.infoEl.classList.add('hidden');
    }
  }
  
  /**
   * 取得截斷預覽（已棄用，保留以防需要）
   * 
   * @param {string} str - 原始字串
   * @param {number} maxLength - 最大長度
   * @returns {string}
   */
  getTruncatedPreview(str, maxLength) {
    const halfLength = Math.floor(maxLength / 2);
    const start = str.substring(0, halfLength);
    const end = str.substring(str.length - halfLength);
    const omittedLength = str.length - maxLength;
    
    return `${start}\n\n... (省略 ${omittedLength.toLocaleString()} 字元) ...\n\n${end}`;
  }
  
  /**
   * 驗證 Base64 格式
   */
  validate() {
    if (!this.value) {
      this.hideStatus();
      this.isValid = false;
      return false;
    }
    
    // 檢查是否為有效的 Base64 或 Data URL
    let valid = false;
    let statusMessage = '';
    
    if (isValidDataUrl(this.value)) {
      // Data URL 格式
      try {
        const parsed = Base64Converter.parseDataUrl(this.value);
        const estimatedSize = Base64Converter.estimateSize(parsed.base64);
        valid = true;
        statusMessage = `✓ 有效的 Data URL（約 ${(estimatedSize / 1024).toFixed(1)} KB）`;
      } catch (error) {
        valid = false;
        statusMessage = '✗ 無效的 Data URL 格式';
      }
    } else {
      // 純 Base64 格式
      if (Base64Converter.isValidBase64(this.value)) {
        const estimatedSize = Base64Converter.estimateSize(this.value);
        valid = true;
        statusMessage = `✓ 有效的 Base64（約 ${(estimatedSize / 1024).toFixed(1)} KB）`;
      } else {
        valid = false;
        statusMessage = '✗ 無效的 Base64 格式';
      }
    }
    
    this.isValid = valid;
    this.showStatus(statusMessage, valid);
    
    if (this.options.onValidate) {
      this.options.onValidate(this.value, valid);
    }
    
    return valid;
  }
  
  /**
   * 顯示驗證狀態
   * 
   * @param {string} message - 狀態訊息
   * @param {boolean} isValid - 是否有效
   */
  showStatus(message, isValid) {
    this.statusEl.classList.remove('hidden');
    this.statusText.textContent = message;
    
    if (isValid) {
      this.statusIcon.textContent = '✓';
      this.statusEl.classList.add('status-valid');
      this.statusEl.classList.remove('status-invalid');
    } else {
      this.statusIcon.textContent = '✗';
      this.statusEl.classList.add('status-invalid');
      this.statusEl.classList.remove('status-valid');
    }
  }
  
  /**
   * 隱藏驗證狀態
   */
  hideStatus() {
    this.statusEl.classList.add('hidden');
    this.statusEl.classList.remove('status-valid', 'status-invalid');
  }
  
  /**
   * 取得輸入值
   * 
   * @returns {string}
   */
  getValue() {
    return this.value;
  }
  
  /**
   * 設定輸入值
   * 
   * @param {string} value - Base64 字串
   */
  setValue(value) {
    this.value = value;
    
    if (value.length > this.options.maxDisplayLength) {
      // 長字串：不顯示在 textarea
      this.isLongString = true;
      this.showLongStringPreview();
    } else {
      // 短字串：正常顯示
      this.isLongString = false;
      this.textarea.value = value;
      this.restoreNormalDisplay();
    }
    
    this.validate();
    this.updateDisplay();
  }
  
  /**
   * 清除輸入
   */
  clear() {
    this.value = '';
    this.isLongString = false;
    this.textarea.value = '';
    this.isValid = false;
    this.hideStatus();
    this.restoreNormalDisplay();
    
    if (this.options.onChange) {
      this.options.onChange('', false);
    }
  }
  
  /**
   * 檢查是否有效
   * 
   * @returns {boolean}
   */
  isValueValid() {
    return this.isValid;
  }
  
  /**
   * 銷毀元件
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
