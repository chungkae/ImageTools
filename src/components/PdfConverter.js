/**
 * PDF 轉圖片元件
 * 
 * 提供 PDF 轉換為圖片的 UI
 */

import PdfConverter from '../services/pdfConverter.js';
import { FileUploader } from './FileUploader.js';
import { ProgressBar } from './ProgressBar.js';
import { ErrorMessage } from './ErrorMessage.js';
import { formatFileSize } from '../utils/formatters.js';
import { downloadFile } from '../utils/fileHelpers.js';

export default class PdfConverterComponent {
  constructor() {
    this.service = new PdfConverter();
    this.element = this.createElement();
    this.uploader = null;
    this.progressBar = null;
    this.errorMessage = null;
    this.convertedImages = [];
    this.isProcessing = false;
    this.pdfInfo = null;
    
    this.initializeComponents();
    this.attachEventListeners();
  }

  /**
   * 建立主要元素
   */
  createElement() {
    const container = document.createElement('div');
    container.className = 'pdf-converter';
    container.innerHTML = `
      <div class="pdf-converter-header">
        <h2>PDF 轉圖片</h2>
        <p class="description">上傳 PDF 檔案，將每一頁轉換為圖片並下載</p>
      </div>

      <!-- 上傳區域 -->
      <div class="upload-section">
        <div id="pdf-uploader"></div>
        <div class="file-info">
          <p class="hint">支援 PDF 格式，檔案大小限制 100MB</p>
        </div>
      </div>

      <!-- PDF 資訊 -->
      <div class="pdf-info-section" style="display: none;">
        <h3>PDF 資訊</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">檔案名稱：</span>
            <span id="pdf-filename">-</span>
          </div>
          <div class="info-item">
            <span class="label">檔案大小：</span>
            <span id="pdf-filesize">-</span>
          </div>
          <div class="info-item">
            <span class="label">總頁數：</span>
            <span id="pdf-pages">-</span>
          </div>
          <div class="info-item">
            <span class="label">預估輸出：</span>
            <span id="estimated-size">-</span>
          </div>
        </div>

        <!-- 轉換選項 -->
        <div class="conversion-options">
          <h4>轉換設定</h4>
          
          <div class="option-group">
            <label>
              輸出格式
              <select id="output-format" class="select">
                <option value="png">PNG（無損，檔案較大）</option>
                <option value="jpeg">JPEG（壓縮，檔案較小）</option>
              </select>
            </label>
          </div>

          <div class="option-group">
            <label>
              解析度（DPI）
              <span class="current-value" id="scale-value">150</span>
            </label>
            <input 
              type="range" 
              id="scale-slider" 
              min="0.5" 
              max="4" 
              step="0.5" 
              value="2"
              class="slider"
            >
            <div class="range-labels">
              <span>72 DPI</span>
              <span>150 DPI</span>
              <span>300 DPI</span>
            </div>
            <p class="hint">數值越高品質越好，但檔案越大</p>
          </div>

          <div class="option-group jpeg-only" style="display: none;">
            <label>
              JPEG 品質
              <span class="current-value" id="quality-value">92</span>
            </label>
            <input 
              type="range" 
              id="quality-slider" 
              min="60" 
              max="100" 
              step="5" 
              value="92"
              class="slider"
            >
            <div class="range-labels">
              <span>低品質</span>
              <span>高品質</span>
            </div>
          </div>
        </div>

        <!-- 轉換按鈕 -->
        <div class="action-buttons">
          <button id="convert-pdf-btn" class="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            開始轉換
          </button>
          <button id="clear-pdf-btn" class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
            清除
          </button>
        </div>
      </div>

      <!-- 進度條 -->
      <div id="pdf-progress"></div>

      <!-- 錯誤訊息 -->
      <div id="pdf-error"></div>

      <!-- 結果顯示 -->
      <div class="results-section" style="display: none;">
        <h3>轉換結果 (<span id="result-count">0</span> 張圖片)</h3>
        
        <div class="batch-actions">
          <button id="download-all-btn" class="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            下載全部
          </button>
        </div>

        <div class="results-grid" id="results-grid"></div>
      </div>
    `;
    
    return container;
  }

  /**
   * 初始化元件
   */
  initializeComponents() {
    // 檔案上傳器
    this.uploader = new FileUploader(
      this.element.querySelector('#pdf-uploader'),
      {
        accept: '.pdf,application/pdf',
        multiple: false,
        fileType: 'PDF',
        onFilesSelected: (files) => {
          if (files.length > 0) {
            this.handleFileUpload(files[0]);
          }
        },
        onError: (errors) => {
          this.errorMessage.show(errors[0].error);
        }
      }
    );

    // 進度條
    this.progressBar = new ProgressBar(
      this.element.querySelector('#pdf-progress')
    );

    // 錯誤訊息
    this.errorMessage = new ErrorMessage(
      this.element.querySelector('#pdf-error')
    );
  }

  /**
   * 附加事件監聽器
   */
  attachEventListeners() {
    // 輸出格式變更
    const formatSelect = this.element.querySelector('#output-format');
    formatSelect.addEventListener('change', () => {
      const isJpeg = formatSelect.value === 'jpeg';
      this.element.querySelector('.jpeg-only').style.display = isJpeg ? 'block' : 'none';
      this.updateEstimatedSize();
    });

    // 解析度滑桿
    const scaleSlider = this.element.querySelector('#scale-slider');
    scaleSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      const dpi = Math.round(scale * 72);
      this.element.querySelector('#scale-value').textContent = dpi;
      this.updateEstimatedSize();
    });

    // JPEG 品質滑桿
    const qualitySlider = this.element.querySelector('#quality-slider');
    qualitySlider.addEventListener('input', (e) => {
      this.element.querySelector('#quality-value').textContent = e.target.value;
    });

    // 轉換按鈕
    this.element.querySelector('#convert-pdf-btn').addEventListener('click', () => {
      this.handleConvert();
    });

    // 清除按鈕
    this.element.querySelector('#clear-pdf-btn').addEventListener('click', () => {
      this.handleClear();
    });

    // 下載全部按鈕
    this.element.querySelector('#download-all-btn').addEventListener('click', () => {
      this.downloadAllImages();
    });
  }

  /**
   * 處理檔案上傳
   */
  async handleFileUpload(file) {
    try {
      this.errorMessage.hide();
      this.progressBar.show();
      this.progressBar.update(0, '開始載入 PDF...');

      // 載入 PDF
      this.pdfInfo = await this.service.loadPdf(file, (percent, message) => {
        this.progressBar.update(percent, message);
      });

      // 顯示 PDF 資訊
      this.displayPdfInfo();

      this.progressBar.hide();
    } catch (error) {
      console.error('PDF upload error:', error);
      this.progressBar.hide();
      
      let errorMessage = '載入 PDF 檔案失敗';
      if (error.message === 'INVALID_FILE_TYPE') {
        errorMessage = '無效的檔案格式，請上傳 PDF 檔案';
      } else if (error.message === 'FILE_TOO_LARGE') {
        errorMessage = '檔案過大，限制 100MB';
      } else if (error.message === 'PDF_LOAD_ERROR') {
        errorMessage = 'PDF 檔案損壞或格式不支援';
      }
      
      this.errorMessage.show(errorMessage);
    }
  }

  /**
   * 顯示 PDF 資訊
   */
  displayPdfInfo() {
    const infoSection = this.element.querySelector('.pdf-info-section');
    infoSection.style.display = 'block';

    this.element.querySelector('#pdf-filename').textContent = this.pdfInfo.filename;
    this.element.querySelector('#pdf-filesize').textContent = formatFileSize(this.pdfInfo.fileSize);
    this.element.querySelector('#pdf-pages').textContent = `${this.pdfInfo.numPages} 頁`;

    this.updateEstimatedSize();
  }

  /**
   * 更新預估輸出大小
   */
  updateEstimatedSize() {
    if (!this.pdfInfo) return;

    const scale = parseFloat(this.element.querySelector('#scale-slider').value);
    const format = this.element.querySelector('#output-format').value;

    const estimatedSize = this.service.estimateOutputSize({ scale, format });
    this.element.querySelector('#estimated-size').textContent = formatFileSize(estimatedSize);
  }

  /**
   * 處理轉換
   */
  async handleConvert() {
    if (this.isProcessing || !this.pdfInfo) return;

    try {
      this.isProcessing = true;
      this.errorMessage.hide();
      this.progressBar.show();
      this.element.querySelector('#convert-pdf-btn').disabled = true;

      // 取得轉換選項
      const scale = parseFloat(this.element.querySelector('#scale-slider').value);
      const format = this.element.querySelector('#output-format').value;
      const quality = parseInt(this.element.querySelector('#quality-slider').value) / 100;

      const options = { scale, format, quality };

      // 轉換所有頁面
      this.convertedImages = await this.service.convertAllPages(
        options,
        (percent, message, pageNumber) => {
          this.progressBar.update(percent, message);
        }
      );

      // 顯示結果
      this.displayResults();

      this.progressBar.hide();
      this.element.querySelector('#convert-pdf-btn').disabled = false;
      this.isProcessing = false;
    } catch (error) {
      console.error('PDF convert error:', error);
      this.progressBar.hide();
      this.element.querySelector('#convert-pdf-btn').disabled = false;
      this.isProcessing = false;
      
      this.errorMessage.show('轉換失敗，請重試');
    }
  }

  /**
   * 顯示轉換結果
   */
  displayResults() {
    const resultsSection = this.element.querySelector('.results-section');
    const resultsGrid = this.element.querySelector('#results-grid');
    
    resultsSection.style.display = 'block';
    this.element.querySelector('#result-count').textContent = this.convertedImages.length;

    resultsGrid.innerHTML = '';

    this.convertedImages.forEach((result, index) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      
      const imageUrl = URL.createObjectURL(result.blob);
      const format = this.element.querySelector('#output-format').value;
      const filename = `${this.pdfInfo.filename.replace('.pdf', '')}_page_${result.pageNumber}.${format}`;

      card.innerHTML = `
        <div class="result-image">
          <img src="${imageUrl}" alt="Page ${result.pageNumber}" loading="lazy">
        </div>
        <div class="result-info">
          <div class="result-filename">第 ${result.pageNumber} 頁</div>
          <div class="result-details">
            ${result.metadata.width} × ${result.metadata.height} px<br>
            ${formatFileSize(result.metadata.size)}
          </div>
          <button class="btn btn-sm btn-download" data-index="${index}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            下載
          </button>
        </div>
      `;

      // 下載按鈕
      card.querySelector('.btn-download').addEventListener('click', () => {
        downloadFile(result.blob, filename);
      });

      resultsGrid.appendChild(card);
    });
  }

  /**
   * 下載所有圖片
   */
  async downloadAllImages() {
    const format = this.element.querySelector('#output-format').value;
    
    for (let i = 0; i < this.convertedImages.length; i++) {
      const result = this.convertedImages[i];
      const filename = `${this.pdfInfo.filename.replace('.pdf', '')}_page_${result.pageNumber}.${format}`;
      
      // 延遲下載以避免瀏覽器阻擋
      await new Promise(resolve => setTimeout(resolve, 100));
      downloadFile(result.blob, filename);
    }
  }

  /**
   * 清除
   */
  handleClear() {
    // 清除服務
    this.service.dispose();

    // 釋放 URL
    this.convertedImages.forEach(result => {
      const imgs = this.element.querySelectorAll('.result-image img');
      imgs.forEach(img => URL.revokeObjectURL(img.src));
    });

    // 重置狀態
    this.convertedImages = [];
    this.pdfInfo = null;
    this.isProcessing = false;

    // 隱藏區塊
    this.element.querySelector('.pdf-info-section').style.display = 'none';
    this.element.querySelector('.results-section').style.display = 'none';
    this.progressBar.hide();
    this.errorMessage.hide();

    // 重置上傳器
    this.uploader.reset();
  }

  /**
   * 取得元素
   */
  getElement() {
    return this.element;
  }

  /**
   * 銷毀元件
   */
  destroy() {
    this.handleClear();
    if (this.uploader) {
      this.uploader.destroy();
    }
  }
}
