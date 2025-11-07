/**
 * ImageConverterComponent - 圖片格式轉換 UI 元件
 * 
 * 功能：
 * - 上傳 WebP、HEIC、SVG 等格式圖片
 * - 預覽原圖與轉換後圖片
 * - 選擇輸出格式（PNG、JPEG、WebP）
 * - 支援批次轉換
 * - 顯示轉換進度
 * - 下載轉換後的圖片
 */

import { FileUploader } from './FileUploader.js';
import { ProgressBar } from './ProgressBar.js';
import { ErrorMessage } from './ErrorMessage.js';
import { ImageConverter } from '../services/imageConverter.js';
import { generateFilename } from '../utils/fileHelpers.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

export class ImageConverterComponent {
  constructor(container) {
    this.container = container;
    this.converter = new ImageConverter();
    this.selectedFiles = [];
    this.convertedResults = [];
    
    this.render();
    this.initComponents();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="image-converter">
        <!-- 上傳區 -->
        <div class="upload-section">
          <div id="image-converter-uploader"></div>
          <div id="image-converter-error"></div>
        </div>
        
        <!-- 轉換選項 -->
        <div class="converter-options hidden" id="converter-options">
          <h3>轉換設定</h3>
          
          <div class="option-group">
            <label for="output-format">輸出格式:</label>
            <select id="output-format" class="select">
              <option value="image/png" selected>PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          
          <div class="option-group">
            <label for="resize-option">調整尺寸:</label>
            <select id="resize-option" class="select">
              <option value="none" selected>保持原尺寸</option>
              <option value="max-width-1920">最大寬度 1920px</option>
              <option value="max-width-1280">最大寬度 1280px</option>
              <option value="max-width-800">最大寬度 800px</option>
              <option value="custom">自訂尺寸</option>
            </select>
          </div>
          
          <div class="option-group hidden" id="custom-size-group">
            <label>自訂尺寸:</label>
            <div class="size-inputs">
              <input type="number" id="custom-width" placeholder="寬度" min="1" class="input-sm">
              <span>×</span>
              <input type="number" id="custom-height" placeholder="高度" min="1" class="input-sm">
              <label class="checkbox-label">
                <input type="checkbox" id="maintain-aspect-ratio" checked>
                保持比例
              </label>
            </div>
          </div>
          
          <div class="option-group" id="quality-group">
            <label for="quality">品質 (適用於 JPEG/WebP):</label>
            <div class="quality-slider">
              <input type="range" id="quality" min="0.1" max="1" step="0.05" value="0.92" class="slider">
              <span id="quality-value">92%</span>
            </div>
          </div>
          
          <button id="convert-images-button" class="btn btn-primary">
            開始轉換 (<span id="file-count">0</span> 個檔案)
          </button>
        </div>
        
        <!-- 進度條 -->
        <div id="conversion-progress" class="hidden"></div>
        
        <!-- 結果預覽 -->
        <div class="results-section hidden" id="results-section">
          <h3>轉換結果</h3>
          <div id="results-grid" class="results-grid"></div>
          <button id="download-all-button" class="btn btn-secondary">下載全部</button>
        </div>
      </div>
    `;
  }
  
  initComponents() {
    // File uploader
    const uploaderContainer = this.container.querySelector('#image-converter-uploader');
    this.uploader = new FileUploader(uploaderContainer, {
      accept: 'image/webp, image/heic, image/heif, image/svg+xml, image/png, image/jpeg, image/gif',
      multiple: true,
      fileType: 'IMAGE',
      onFilesSelected: (files) => this.handleFilesSelected(files),
      onError: (errors) => this.handleUploadError(errors),
    });
    
    // Error message
    const errorContainer = this.container.querySelector('#image-converter-error');
    this.errorMessage = new ErrorMessage(errorContainer);
    
    // Progress bar
    const progressContainer = this.container.querySelector('#conversion-progress');
    this.progressBar = new ProgressBar(progressContainer);
    
    // Event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Resize option change
    const resizeOption = this.container.querySelector('#resize-option');
    const customSizeGroup = this.container.querySelector('#custom-size-group');
    
    resizeOption.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customSizeGroup.classList.remove('hidden');
      } else {
        customSizeGroup.classList.add('hidden');
      }
    });
    
    // Quality slider
    const qualitySlider = this.container.querySelector('#quality');
    const qualityValue = this.container.querySelector('#quality-value');
    
    qualitySlider.addEventListener('input', (e) => {
      qualityValue.textContent = `${Math.round(e.target.value * 100)}%`;
    });
    
    // Output format change (show/hide quality slider)
    const outputFormat = this.container.querySelector('#output-format');
    const qualityGroup = this.container.querySelector('#quality-group');
    
    outputFormat.addEventListener('change', (e) => {
      if (e.target.value === 'image/jpeg' || e.target.value === 'image/webp') {
        qualityGroup.classList.remove('hidden');
      } else {
        qualityGroup.classList.add('hidden');
      }
    });
    
    // Convert button
    const convertButton = this.container.querySelector('#convert-images-button');
    convertButton.addEventListener('click', () => this.handleConvert());
    
    // Download all button
    const downloadAllButton = this.container.querySelector('#download-all-button');
    downloadAllButton.addEventListener('click', () => this.handleDownloadAll());
  }
  
  handleFilesSelected(files) {
    this.selectedFiles = files;
    this.errorMessage.hide();
    
    // Show preview of selected files
    this.showFilesPreviews(files);
    
    // Show options
    const options = this.container.querySelector('#converter-options');
    options.classList.remove('hidden');
    
    // Update file count
    const fileCount = this.container.querySelector('#file-count');
    fileCount.textContent = files.length;
  }
  
  showFilesPreviews(files) {
    // Create preview container if it doesn't exist
    let previewContainer = this.container.querySelector('#files-preview');
    if (!previewContainer) {
      const uploadSection = this.container.querySelector('.upload-section');
      previewContainer = document.createElement('div');
      previewContainer.id = 'files-preview';
      previewContainer.className = 'files-preview';
      uploadSection.appendChild(previewContainer);
    }
    
    previewContainer.innerHTML = '<h4>已選擇的圖片:</h4>';
    const grid = document.createElement('div');
    grid.className = 'preview-grid';
    
    files.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'preview-card';
      
      const img = document.createElement('img');
      img.className = 'preview-image';
      img.alt = file.name;
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      
      const info = document.createElement('div');
      info.className = 'preview-info';
      info.innerHTML = `
        <div class="preview-filename">${file.name}</div>
        <div class="preview-size">${(file.size / 1024).toFixed(1)} KB</div>
      `;
      
      card.appendChild(img);
      card.appendChild(info);
      grid.appendChild(card);
    });
    
    previewContainer.appendChild(grid);
  }

  
  handleUploadError(errors) {
    const messages = errors.map(e => e.error);
    this.errorMessage.show(messages.join('、'));
  }
  
  getConversionOptions() {
    const outputFormat = this.container.querySelector('#output-format').value;
    const resizeOption = this.container.querySelector('#resize-option').value;
    const quality = parseFloat(this.container.querySelector('#quality').value);
    
    const options = {
      quality,
    };
    
    // Parse resize option
    if (resizeOption !== 'none') {
      if (resizeOption === 'custom') {
        const width = parseInt(this.container.querySelector('#custom-width').value);
        const height = parseInt(this.container.querySelector('#custom-height').value);
        const maintainAspectRatio = this.container.querySelector('#maintain-aspect-ratio').checked;
        
        if (width > 0) options.maxWidth = width;
        if (height > 0) options.maxHeight = height;
        options.maintainAspectRatio = maintainAspectRatio;
      } else {
        const maxWidth = parseInt(resizeOption.split('-').pop());
        options.maxWidth = maxWidth;
        options.maintainAspectRatio = true;
      }
    }
    
    return { outputFormat, options };
  }
  
  async handleConvert() {
    if (this.selectedFiles.length === 0) {
      this.errorMessage.show('請先選擇檔案');
      return;
    }
    
    const { outputFormat, options } = this.getConversionOptions();
    const convertButton = this.container.querySelector('#convert-images-button');
    const progressContainer = this.container.querySelector('#conversion-progress');
    
    try {
      this.errorMessage.hide();
      convertButton.disabled = true;
      convertButton.textContent = '轉換中...';
      
      // Show progress
      progressContainer.classList.remove('hidden');
      this.progressBar.show();
      this.progressBar.update(0);
      
      // Batch convert
      const results = await this.converter.batchConvert(
        this.selectedFiles,
        outputFormat,
        {
          ...options,
          maxConcurrent: 3,
          onProgress: (progress) => {
            this.progressBar.update(progress.percentage, `${progress.completed} / ${progress.total} 完成`);
          },
        }
      );
      
      console.log('轉換完成，results:', results);
      console.log('成功數量:', results.filter(r => r.success).length);
      
      this.convertedResults = results.filter(r => r.success);
      
      // Show results
      console.log('準備顯示結果...');
      this.displayResults(results, outputFormat);
      console.log('結果已顯示');
      
      // Hide progress, show results
      progressContainer.classList.add('hidden');
      this.progressBar.hide();
      
      convertButton.textContent = `開始轉換 (${this.selectedFiles.length} 個檔案)`;
      convertButton.disabled = false;
      
      // Show success message if some failed
      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        this.errorMessage.show(`轉換完成，但有 ${failedCount} 個檔案失敗`);
      }
    } catch (error) {
      console.error('批次轉換失敗:', error);
      console.error('錯誤堆疊:', error.stack);
      
      let errorMsg = '轉換失敗，請重試';
      
      // 提供更詳細的錯誤訊息
      if (error.message === 'IMAGE_LOAD_ERROR') {
        errorMsg = '圖片載入失敗，請確認檔案格式是否正確';
      } else if (error.message === 'UNSUPPORTED_INPUT_FORMAT') {
        errorMsg = '不支援的輸入格式';
      } else if (error.message === 'UNSUPPORTED_OUTPUT_FORMAT') {
        errorMsg = '不支援的輸出格式';
      } else if (error.message) {
        errorMsg = ERROR_MESSAGES[error.message] || error.message;
      }
      
      this.errorMessage.show(errorMsg);
      
      progressContainer.classList.add('hidden');
      this.progressBar.hide();
      
      convertButton.textContent = `開始轉換 (${this.selectedFiles.length} 個檔案)`;
      convertButton.disabled = false;
    }
  }
  
  displayResults(results, outputFormat) {
    console.log('displayResults 被調用，results:', results);
    
    const resultsSection = this.container.querySelector('#results-section');
    const resultsGrid = this.container.querySelector('#results-grid');
    
    console.log('resultsSection:', resultsSection);
    console.log('resultsGrid:', resultsGrid);
    
    if (!resultsSection || !resultsGrid) {
      console.error('找不到結果顯示區域！');
      return;
    }
    
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('visible');
    console.log('已移除 hidden 類別並添加 visible 類別');
    
    resultsGrid.innerHTML = '';
    
    results.forEach((result, index) => {
      const card = document.createElement('div');
      card.className = `result-card ${result.success ? 'success' : 'error'}`;
      
      if (result.success) {
        const { blob, metadata } = result.result;
        const dataUrl = URL.createObjectURL(blob);
        const extension = outputFormat.split('/')[1];
        const filename = generateFilename(`converted-${index + 1}`, outputFormat);
        
        // Change the original filename's extension to the output format
        const originalName = result.fileName;
        const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
        const displayName = `${nameWithoutExt}.${extension}`;
        
        card.innerHTML = `
          <div class="result-image">
            <img src="${dataUrl}" alt="Converted ${index + 1}">
          </div>
          <div class="result-info">
            <div class="result-filename">${displayName}</div>
            <div class="result-details">
              ${metadata.width} × ${metadata.height}<br>
              ${(metadata.outputSize / 1024).toFixed(1)} KB<br>
              壓縮率: ${metadata.compressionRatio}×
            </div>
            <button class="btn btn-sm download-single" data-index="${index}">
              下載
            </button>
          </div>
        `;
        
        // Download single button
        const downloadBtn = card.querySelector('.download-single');
        downloadBtn.addEventListener('click', () => {
          this.downloadSingle(blob, filename);
        });
      } else {
        card.innerHTML = `
          <div class="result-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div class="result-filename">${result.fileName}</div>
            <div class="result-error-message">轉換失敗</div>
          </div>
        `;
      }
      
      resultsGrid.appendChild(card);
    });
  }
  
  downloadSingle(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
  
  async handleDownloadAll() {
    if (this.convertedResults.length === 0) {
      return;
    }
    
    const outputFormat = this.container.querySelector('#output-format').value;
    
    // Download each result
    this.convertedResults.forEach((result, index) => {
      const { blob } = result.result;
      const filename = generateFilename(`converted-${index + 1}`, outputFormat);
      
      setTimeout(() => {
        this.downloadSingle(blob, filename);
      }, index * 100); // Stagger downloads slightly
    });
  }
}
