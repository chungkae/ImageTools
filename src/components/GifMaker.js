/**
 * GIF 製作器元件
 * 
 * 提供影片轉 GIF 和圖片轉 GIF 的 UI
 */

import { GifMaker as GifMakerService } from '../services/gifMaker.js';
import { FileUploader } from './FileUploader.js';
import { GIF_PARAMETER_LIMITS } from '../constants/limits.js';
import { formatFileSize } from '../utils/formatters.js';
import { downloadFile } from '../utils/fileHelpers.js';

export default class GifMaker {
  constructor() {
    this.service = new GifMakerService();
    this.mode = 'video'; // 'video' 或 'images'
    this.videoFile = null;
    this.imageFiles = [];
    this.element = this.createElement();
    this.videoUploader = null;
    this.imageUploader = null;
    this.videoPreview = null;
    this.isProcessing = false;
    
    this.initializeComponents();
    this.attachEventListeners();
  }

  /**
   * 建立主要元素
   */
  createElement() {
    const container = document.createElement('div');
    container.className = 'gif-maker';
    container.innerHTML = `
      <div class="gif-maker-header">
        <h2>GIF 動畫製作</h2>
        <p class="description">將影片或圖片轉換為 GIF 動畫</p>
      </div>

      <!-- 模式切換 -->
      <div class="mode-selector">
        <label class="mode-option">
          <input type="radio" name="gif-mode" value="video" checked>
          <span>影片轉 GIF</span>
        </label>
        <label class="mode-option">
          <input type="radio" name="gif-mode" value="images">
          <span>圖片轉 GIF</span>
        </label>
      </div>

      <!-- 影片模式 UI -->
      <div class="mode-content video-mode active">
        <div class="upload-section">
          <div id="video-uploader"></div>
          <div class="file-info">
            <p class="hint">支援 MP4, MOV, WEBM 格式，檔案大小限制 100MB</p>
          </div>
        </div>

        <div class="video-preview-section" style="display: none;">
          <div class="video-container">
            <video id="video-preview" controls></video>
          </div>
          
          <div class="time-range-controls">
            <h3>選擇時間範圍</h3>
            <div class="time-inputs">
              <div class="input-group">
                <label>開始時間（秒）</label>
                <input type="number" id="start-time" min="0" step="0.1" value="0">
              </div>
              <div class="input-group">
                <label>結束時間（秒）</label>
                <input type="number" id="end-time" min="0" step="0.1" value="0">
              </div>
              <div class="input-group">
                <label>影片長度</label>
                <span id="video-duration" class="readonly-value">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖片模式 UI -->
      <div class="mode-content images-mode">
        <div class="upload-section">
          <div id="image-uploader"></div>
          <div class="file-info">
            <p class="hint">支援 JPG, PNG, WebP 格式，可選擇多張圖片，每張限制 50MB</p>
          </div>
        </div>

        <div class="images-preview-section" style="display: none;">
          <h3>已選擇的圖片 (<span id="image-count">0</span> 張)</h3>
          <div class="images-grid" id="images-grid"></div>
          <p class="hint">拖曳圖片可調整順序</p>
        </div>
      </div>

      <!-- 共用參數設定 -->
      <div class="parameters-section" style="display: none;">
        <h3>參數設定</h3>
        
        <div class="parameter-grid">
          <!-- 幀率/延遲 -->
          <div class="parameter-item video-only">
            <label>
              幀率 (FPS)
              <span class="current-value" id="frame-rate-value">${GIF_PARAMETER_LIMITS.FRAME_RATE_DEFAULT}</span>
            </label>
            <input 
              type="range" 
              id="frame-rate" 
              min="${GIF_PARAMETER_LIMITS.FRAME_RATE_MIN}" 
              max="${GIF_PARAMETER_LIMITS.FRAME_RATE_MAX}" 
              value="${GIF_PARAMETER_LIMITS.FRAME_RATE_DEFAULT}"
            >
            <div class="range-labels">
              <span>${GIF_PARAMETER_LIMITS.FRAME_RATE_MIN}</span>
              <span>${GIF_PARAMETER_LIMITS.FRAME_RATE_MAX}</span>
            </div>
          </div>

          <div class="parameter-item images-only" style="display: none;">
            <label>
              幀延遲 (ms)
              <span class="current-value" id="frame-delay-value">${GIF_PARAMETER_LIMITS.FRAME_DELAY_DEFAULT}</span>
            </label>
            <input 
              type="range" 
              id="frame-delay" 
              min="${GIF_PARAMETER_LIMITS.FRAME_DELAY_MIN}" 
              max="${GIF_PARAMETER_LIMITS.FRAME_DELAY_MAX}" 
              step="10"
              value="${GIF_PARAMETER_LIMITS.FRAME_DELAY_DEFAULT}"
            >
            <div class="range-labels">
              <span>${GIF_PARAMETER_LIMITS.FRAME_DELAY_MIN}</span>
              <span>${GIF_PARAMETER_LIMITS.FRAME_DELAY_MAX}</span>
            </div>
          </div>

          <!-- 品質 -->
          <div class="parameter-item">
            <label>
              品質
              <span class="current-value" id="gif-quality-value">${GIF_PARAMETER_LIMITS.QUALITY_DEFAULT}</span>
            </label>
            <input 
              type="range" 
              id="gif-quality" 
              min="${GIF_PARAMETER_LIMITS.QUALITY_MIN}" 
              max="${GIF_PARAMETER_LIMITS.QUALITY_MAX}" 
              value="${GIF_PARAMETER_LIMITS.QUALITY_DEFAULT}"
            >
            <div class="range-labels">
              <span>高品質 (慢)</span>
              <span>低品質 (快)</span>
            </div>
            <p class="hint">數字越小顏色越豐富、品質越好，但檔案越大、處理時間越長</p>
          </div>

          <!-- 尺寸 -->
          <div class="parameter-item">
            <label>輸出寬度 (px)</label>
            <input type="number" id="gif-output-width" min="0" step="1" placeholder="0 = 自動 (80%)">
          </div>

          <div class="parameter-item">
            <label>輸出高度 (px)</label>
            <input type="number" id="gif-output-height" min="0" step="1" placeholder="0 = 自動 (80%)">
          </div>

          <div class="parameter-item">
            <label class="checkbox-label">
              <input type="checkbox" id="gif-maintain-aspect-ratio" checked>
              <span>保持長寬比</span>
            </label>
          </div>

          <!-- 循環次數 -->
          <div class="parameter-item">
            <label>循環次數</label>
            <input type="number" id="gif-repeat" min="0" step="1" value="${GIF_PARAMETER_LIMITS.REPEAT_DEFAULT}">
            <p class="hint">0 = 無限循環</p>
          </div>
        </div>

        <!-- 預估資訊 -->
        <div class="estimation-info">
          <div class="info-item">
            <span class="label">預估影格數：</span>
            <span id="estimated-frames">--</span>
          </div>
          <div class="info-item">
            <span class="label">預估檔案大小：</span>
            <span id="estimated-size">--</span>
          </div>
        </div>

        <!-- 轉換按鈕 -->
        <button id="convert-btn" class="primary-button" disabled>
          開始轉換
        </button>
      </div>

      <!-- 進度顯示 -->
      <div class="progress-section" style="display: none;">
        <div class="progress-info">
          <span id="progress-status">處理中...</span>
          <span id="progress-percentage">0%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
        <p class="hint" id="progress-hint">這可能需要一些時間，請耐心等待</p>
      </div>

      <!-- 結果顯示 -->
      <div class="result-section" style="display: none;">
        <h3>轉換完成！</h3>
        <div class="result-preview">
          <img id="result-preview" alt="GIF Preview">
        </div>
        <div class="result-info">
          <p><strong>檔案大小：</strong><span id="result-size">--</span></p>
          <p><strong>尺寸：</strong><span id="result-dimensions">--</span></p>
          <p><strong>影格數：</strong><span id="result-frames">--</span></p>
          <p><strong>處理時間：</strong><span id="result-time">--</span></p>
        </div>
        <div class="result-actions">
          <button id="download-btn" class="primary-button">下載 GIF</button>
          <button id="restart-btn" class="secondary-button">重新製作</button>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * 初始化子元件
   */
  initializeComponents() {
    // 影片上傳器
    const videoUploaderContainer = this.element.querySelector('#video-uploader');
    this.videoUploader = new FileUploader(videoUploaderContainer, {
      accept: 'video/mp4,video/quicktime,video/webm',
      multiple: false,
      fileType: 'VIDEO',
      onFilesSelected: (files) => this.handleVideoSelect(files[0]),
      onError: (errors) => {
        console.error('Video upload error:', errors);
      },
    });

    // 圖片上傳器
    const imageUploaderContainer = this.element.querySelector('#image-uploader');
    this.imageUploader = new FileUploader(imageUploaderContainer, {
      accept: 'image/jpeg,image/png,image/webp',
      multiple: true,
      fileType: 'IMAGE',
      onFilesSelected: (files) => this.handleImagesSelect(files),
      onError: (errors) => {
        console.error('Image upload error:', errors);
      },
    });

    // 影片預覽
    this.videoPreview = this.element.querySelector('#video-preview');
  }

  /**
   * 附加事件監聽器
   */
  attachEventListeners() {
    // 模式切換
    const modeRadios = this.element.querySelectorAll('input[name="gif-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.switchMode(e.target.value));
    });

    // 參數變更
    this.element.querySelector('#frame-rate').addEventListener('input', (e) => {
      this.element.querySelector('#frame-rate-value').textContent = e.target.value;
      this.updateEstimation();
    });

    this.element.querySelector('#frame-delay').addEventListener('input', (e) => {
      this.element.querySelector('#frame-delay-value').textContent = e.target.value;
      this.updateEstimation();
    });

    this.element.querySelector('#gif-quality').addEventListener('input', (e) => {
      this.element.querySelector('#gif-quality-value').textContent = e.target.value;
      this.updateEstimation();
    });

    this.element.querySelector('#gif-output-width').addEventListener('input', () => {
      this.updateEstimation();
    });

    this.element.querySelector('#gif-output-height').addEventListener('input', () => {
      this.updateEstimation();
    });

    // 時間範圍變更
    this.element.querySelector('#start-time').addEventListener('input', () => {
      this.updateEstimation();
    });

    this.element.querySelector('#end-time').addEventListener('input', () => {
      this.updateEstimation();
    });

    // 影片載入完成
    this.videoPreview.addEventListener('loadedmetadata', () => {
      this.handleVideoLoaded();
    });

    // 轉換按鈕
    this.element.querySelector('#convert-btn').addEventListener('click', () => {
      this.startConversion();
    });

    // 下載按鈕
    this.element.querySelector('#download-btn').addEventListener('click', () => {
      this.downloadResult();
    });

    // 重新製作按鈕
    this.element.querySelector('#restart-btn').addEventListener('click', () => {
      this.reset();
    });
  }

  /**
   * 切換模式
   */
  switchMode(mode) {
    this.mode = mode;

    // 切換 UI
    const videoMode = this.element.querySelector('.video-mode');
    const imagesMode = this.element.querySelector('.images-mode');
    const videoOnlyParams = this.element.querySelectorAll('.video-only');
    const imagesOnlyParams = this.element.querySelectorAll('.images-only');

    if (mode === 'video') {
      videoMode.classList.add('active');
      imagesMode.classList.remove('active');
      videoOnlyParams.forEach(el => el.style.display = '');
      imagesOnlyParams.forEach(el => el.style.display = 'none');
    } else {
      videoMode.classList.remove('active');
      imagesMode.classList.add('active');
      videoOnlyParams.forEach(el => el.style.display = 'none');
      imagesOnlyParams.forEach(el => el.style.display = '');
    }

    this.reset();
  }

  /**
   * 處理影片選擇
   */
  async handleVideoSelect(file) {
    this.videoFile = file;

    // 顯示預覽
    const url = URL.createObjectURL(file);
    this.videoPreview.src = url;

    this.element.querySelector('.video-preview-section').style.display = 'block';
    this.element.querySelector('.parameters-section').style.display = 'block';
    
    // 影片會在 loadedmetadata 事件中更新時間範圍
  }

  /**
   * 處理影片載入完成
   */
  handleVideoLoaded() {
    const duration = this.videoPreview.duration;
    
    this.element.querySelector('#video-duration').textContent = `${duration.toFixed(1)} 秒`;
    this.element.querySelector('#start-time').max = duration;
    this.element.querySelector('#end-time').max = duration;
    this.element.querySelector('#end-time').value = duration;
    
    this.updateEstimation();
    this.element.querySelector('#convert-btn').disabled = false;
  }

  /**
   * 處理圖片選擇
   */
  handleImagesSelect(files) {
    this.imageFiles = Array.from(files);

    // 顯示圖片網格
    this.renderImageGrid();

    this.element.querySelector('.images-preview-section').style.display = 'block';
    this.element.querySelector('.parameters-section').style.display = 'block';
    
    this.updateEstimation();
    this.element.querySelector('#convert-btn').disabled = this.imageFiles.length === 0;
  }

  /**
   * 渲染圖片網格
   */
  renderImageGrid() {
    const grid = this.element.querySelector('#images-grid');
    const count = this.element.querySelector('#image-count');
    
    count.textContent = this.imageFiles.length;
    grid.innerHTML = '';

    this.imageFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'image-item';
      item.draggable = true;
      item.dataset.index = index;

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;

      const label = document.createElement('div');
      label.className = 'image-label';
      label.textContent = `#${index + 1}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => this.removeImage(index));

      item.appendChild(img);
      item.appendChild(label);
      item.appendChild(removeBtn);
      grid.appendChild(item);

      // 拖曳事件
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(item.dataset.index);
        this.reorderImages(fromIndex, toIndex);
      });
    });
  }

  /**
   * 移除圖片
   */
  removeImage(index) {
    this.imageFiles.splice(index, 1);
    this.renderImageGrid();
    this.updateEstimation();
    this.element.querySelector('#convert-btn').disabled = this.imageFiles.length === 0;
  }

  /**
   * 重新排序圖片
   */
  reorderImages(fromIndex, toIndex) {
    const [removed] = this.imageFiles.splice(fromIndex, 1);
    this.imageFiles.splice(toIndex, 0, removed);
    this.renderImageGrid();
  }

  /**
   * 更新預估資訊
   */
  updateEstimation() {
    if (this.mode === 'video') {
      if (!this.videoFile || !this.videoPreview.duration) return;

      const startTime = parseFloat(this.element.querySelector('#start-time').value) || 0;
      const endTime = parseFloat(this.element.querySelector('#end-time').value) || this.videoPreview.duration;
      const frameRate = parseInt(this.element.querySelector('#frame-rate').value);
      const quality = parseInt(this.element.querySelector('#gif-quality').value);
      
      let width = parseInt(this.element.querySelector('#gif-output-width').value) || 0;
      let height = parseInt(this.element.querySelector('#gif-output-height').value) || 0;
      
      if (width === 0) width = Math.floor(this.videoPreview.videoWidth * 0.8);
      if (height === 0) height = Math.floor(this.videoPreview.videoHeight * 0.8);

      const frameCount = Math.ceil((endTime - startTime) * frameRate);
      const estimatedSize = (width * height * 0.5) * (quality / 10) * frameCount;

      this.element.querySelector('#estimated-frames').textContent = frameCount;
      this.element.querySelector('#estimated-size').textContent = formatFileSize(estimatedSize);

    } else {
      if (this.imageFiles.length === 0) return;

      const quality = parseInt(this.element.querySelector('#gif-quality').value);
      
      // 假設平均尺寸（實際應該載入第一張圖片）
      const avgWidth = parseInt(this.element.querySelector('#gif-output-width').value) || 800;
      const avgHeight = parseInt(this.element.querySelector('#gif-output-height').value) || 600;

      const frameCount = this.imageFiles.length;
      const estimatedSize = (avgWidth * avgHeight * 0.5) * (quality / 10) * frameCount;

      this.element.querySelector('#estimated-frames').textContent = frameCount;
      this.element.querySelector('#estimated-size').textContent = formatFileSize(estimatedSize);
    }
  }

  /**
   * 開始轉換
   */
  async startConversion() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.element.querySelector('#convert-btn').disabled = true;
    this.element.querySelector('.progress-section').style.display = 'block';
    this.element.querySelector('.result-section').style.display = 'none';

    try {
      let result;

      if (this.mode === 'video') {
        result = await this.convertVideo();
      } else {
        result = await this.convertImages();
      }

      this.showResult(result);

    } catch (error) {
      console.error('GIF 轉換失敗:', error);
      alert(`轉換失敗: ${error.message}`);
      this.element.querySelector('.progress-section').style.display = 'none';
      this.element.querySelector('#convert-btn').disabled = false;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 轉換影片
   */
  async convertVideo() {
    const startTime = parseFloat(this.element.querySelector('#start-time').value) || 0;
    const endTime = parseFloat(this.element.querySelector('#end-time').value);
    const frameRate = parseInt(this.element.querySelector('#frame-rate').value);
    const quality = parseInt(this.element.querySelector('#gif-quality').value);
    const repeat = parseInt(this.element.querySelector('#gif-repeat').value);
    
    let width = parseInt(this.element.querySelector('#gif-output-width').value) || 0;
    let height = parseInt(this.element.querySelector('#gif-output-height').value) || 0;

    const result = await this.service.videoToGif(this.videoFile, {
      startTime,
      endTime,
      frameRate,
      width,
      height,
      quality,
      repeat,
      onProgress: (progress) => this.updateProgress(progress),
    });

    return result;
  }

  /**
   * 轉換圖片
   */
  async convertImages() {
    const frameDelay = parseInt(this.element.querySelector('#frame-delay').value);
    const quality = parseInt(this.element.querySelector('#gif-quality').value);
    const repeat = parseInt(this.element.querySelector('#gif-repeat').value);
    const maintainAspectRatio = this.element.querySelector('#gif-maintain-aspect-ratio').checked;
    
    let width = parseInt(this.element.querySelector('#gif-output-width').value) || 0;
    let height = parseInt(this.element.querySelector('#gif-output-height').value) || 0;

    const result = await this.service.imagesToGif(this.imageFiles, {
      width,
      height,
      frameDelay,
      quality,
      repeat,
      maintainAspectRatio,
      onProgress: (progress) => this.updateProgress(progress),
    });

    return result;
  }

  /**
   * 更新進度
   */
  updateProgress(progress) {
    const percentage = Math.round(progress);
    const progressBar = this.element.querySelector('#progress-bar');
    const progressPercentage = this.element.querySelector('#progress-percentage');
    const progressStatus = this.element.querySelector('#progress-status');

    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;

    // 更新狀態文字
    if (percentage < 30) {
      progressStatus.textContent = '載入中...';
    } else if (percentage < 70) {
      progressStatus.textContent = '處理影格...';
    } else {
      progressStatus.textContent = '編碼 GIF...';
    }
  }

  /**
   * 顯示結果
   */
  showResult(result) {
    const { file, metadata } = result;

    // 顯示預覽
    const preview = this.element.querySelector('#result-preview');
    preview.src = URL.createObjectURL(file);

    // 顯示資訊
    this.element.querySelector('#result-size').textContent = formatFileSize(metadata.fileSize);
    this.element.querySelector('#result-dimensions').textContent = `${metadata.width} × ${metadata.height}`;
    this.element.querySelector('#result-frames').textContent = metadata.frameCount;
    this.element.querySelector('#result-time').textContent = `${(metadata.processingTime / 1000).toFixed(1)} 秒`;

    // 儲存結果
    this.resultFile = file;
    this.resultMetadata = metadata;

    // 顯示結果區塊
    this.element.querySelector('.progress-section').style.display = 'none';
    this.element.querySelector('.result-section').style.display = 'block';
  }

  /**
   * 下載結果
   */
  downloadResult() {
    if (!this.resultFile) return;

    const filename = `gif-${Date.now()}.gif`;
    downloadFile(this.resultFile, filename);
  }

  /**
   * 重置
   */
  reset() {
    this.videoFile = null;
    this.imageFiles = [];
    this.resultFile = null;
    this.resultMetadata = null;
    this.isProcessing = false;

    this.videoPreview.src = '';
    
    this.element.querySelector('.video-preview-section').style.display = 'none';
    this.element.querySelector('.images-preview-section').style.display = 'none';
    this.element.querySelector('.parameters-section').style.display = 'none';
    this.element.querySelector('.progress-section').style.display = 'none';
    this.element.querySelector('.result-section').style.display = 'none';
    
    this.element.querySelector('#convert-btn').disabled = true;
    
    // 重置上傳器
    this.videoUploader.reset();
    this.imageUploader.reset();
  }

  /**
   * 取得元素（供外部使用）
   */
  getElement() {
    return this.element;
  }
}
