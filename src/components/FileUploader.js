/**
 * FileUploader 元件
 * 
 * 提供拖放與點擊上傳功能
 */

import { validateFile } from '../utils/validators.js';
import { ERROR_MESSAGES, formatMessage } from '../constants/messages.js';
import { getFileSizeLimitMB } from '../constants/limits.js';

export class FileUploader {
  /**
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 選項
   * @param {string} [options.accept] - 接受的檔案類型（如 "image/*"）
   * @param {boolean} [options.multiple=false] - 是否允許多檔案
   * @param {'IMAGE'|'VIDEO'} [options.fileType='IMAGE'] - 檔案類型（用於驗證）
   * @param {Function} [options.onFilesSelected] - 檔案選擇回調
   * @param {Function} [options.onError] - 錯誤回調
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      accept: 'image/*',
      multiple: false,
      fileType: 'IMAGE',
      onFilesSelected: null,
      onError: null,
      ...options,
    };
    
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
    const { accept, multiple } = this.options;
    
    // 先生成 ID
    const inputId = this.generateId();
    
    this.container.innerHTML = `
      <div class="file-uploader">
        <input 
          type="file" 
          accept="${accept}" 
          ${multiple ? 'multiple' : ''}
          class="file-input hidden"
          id="${inputId}"
        />
        <label for="${inputId}" class="file-uploader-label">
          <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <p class="upload-text">拖放檔案至此，或點擊選擇檔案</p>
          <p class="upload-hint text-muted">支援的檔案大小限制：${getFileSizeLimitMB(this.options.fileType)} MB</p>
        </label>
      </div>
    `;
    
    this.fileInput = this.container.querySelector('.file-input');
    this.uploaderEl = this.container.querySelector('.file-uploader');
  }
  
  /**
   * 綁定事件
   */
  bindEvents() {
    // 檔案選擇
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });
    
    // 拖放事件
    this.uploaderEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploaderEl.classList.add('dragging');
    });
    
    this.uploaderEl.addEventListener('dragleave', () => {
      this.uploaderEl.classList.remove('dragging');
    });
    
    this.uploaderEl.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploaderEl.classList.remove('dragging');
      this.handleFiles(e.dataTransfer.files);
    });
  }
  
  /**
   * 處理檔案
   * 
   * @param {FileList} files - 檔案列表
   */
  handleFiles(files) {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];
    
    // 驗證每個檔案
    for (const file of fileArray) {
      const validation = validateFile(file, {
        checkSize: true,
        checkType: true,
        expectedType: this.options.fileType,
      });
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        const errorMsg = formatMessage(ERROR_MESSAGES[validation.error], {
          limit: getFileSizeLimitMB(this.options.fileType),
          format: file.type || '未知',
        });
        errors.push({ file: file.name, error: errorMsg });
      }
    }
    
    // 回調
    if (validFiles.length > 0 && this.options.onFilesSelected) {
      this.options.onFilesSelected(validFiles);
    }
    
    if (errors.length > 0 && this.options.onError) {
      this.options.onError(errors);
    }
    
    // 重置 input（允許重複選擇同一檔案）
    this.fileInput.value = '';
  }
  
  /**
   * 產生唯一 ID
   */
  generateId() {
    if (!this.inputId) {
      this.inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.inputId;
  }
  
  /**
   * 重置元件
   */
  reset() {
    this.fileInput.value = '';
    this.uploaderEl.classList.remove('dragging');
  }
  
  /**
   * 銷毀元件
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
