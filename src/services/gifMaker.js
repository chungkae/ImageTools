/**
 * GIF 製作器服務
 * 
 * 提供影片轉 GIF 和圖片序列轉 GIF 功能
 * 使用 Web Worker 進行 GIF 編碼以避免阻塞 UI
 * 
 * 遵循合約規範: specs/001-media-converter/contracts/gif-maker-api.md
 */

import { loadImage, createCanvas, canvasToBlob } from '../utils/canvasHelpers.js';
import { validateFileSize, isVideoFile, isImageFile } from '../utils/validators.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { FILE_SIZE_LIMITS } from '../constants/limits.js';
import GifEncoderWorker from '../workers/gifEncoder.worker.js?worker';

/**
 * 進度階段常數
 */
const PROGRESS_STAGES = {
  LOADING_VIDEO: { start: 0, end: 10 },
  EXTRACTING_FRAMES: { start: 10, end: 70 },
  ENCODING_GIF: { start: 70, end: 100 },
  LOADING_IMAGES: { start: 0, end: 30 },
  PROCESSING_IMAGES: { start: 30, end: 60 },
  ENCODING_GIF_FROM_IMAGES: { start: 60, end: 100 }
};

export class GifMaker {
  constructor() {
    this.worker = null;
    this.currentTaskId = 0;
    this.pendingTasks = new Map();
  }
  
  /**
   * 確保 Worker 已初始化
   */
  _ensureWorker() {
    if (!this.worker) {
      this.worker = new GifEncoderWorker();
      this.worker.addEventListener('message', (e) => {
        this._handleWorkerMessage(e.data);
      });
    }
  }
  
  /**
   * 處理 Worker 訊息
   */
  _handleWorkerMessage(data) {
    const task = this.pendingTasks.get(data.id);
    if (!task) return;
    
    if (data.type === 'PROGRESS') {
      if (task.onProgress) {
        task.onProgress(data.progress);
      }
    } else if (data.success) {
      task.resolve(data.result);
      this.pendingTasks.delete(data.id);
    } else {
      task.reject(new Error(data.error.code || data.error.message || 'WORKER_ERROR'));
      this.pendingTasks.delete(data.id);
    }
  }
  
  /**
   * 發送任務到 Worker
   */
  _sendToWorker(type, payload, onProgress) {
    this._ensureWorker();
    
    const taskId = `task-${this.currentTaskId++}`;
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve, reject, onProgress });
      
      this.worker.postMessage({
        id: taskId,
        type,
        payload,
      });
    });
  }

  /**
   * 影片轉 GIF
   * 
   * @param {File} videoFile - 影片檔案
   * @param {Object} options - 選項
   * @param {number} options.startTime - 開始時間（秒），預設 0
   * @param {number} options.endTime - 結束時間（秒），預設影片結尾
   * @param {number} options.frameRate - 幀率（fps），1-30，預設 10
   * @param {number} options.width - 輸出寬度（0=原尺寸的 80%）
   * @param {number} options.height - 輸出高度（0=原尺寸的 80%）
   * @param {number} options.quality - 品質（1-30），預設 10
   * @param {number} options.repeat - 循環次數（0=無限），預設 0
   * @param {Function} options.onProgress - 進度回呼（0-100）
   * @returns {Promise<{file: Blob, metadata: Object}>}
   */
  async videoToGif(videoFile, options = {}) {
    const startTime = Date.now();

    // 驗證輸入
    if (!videoFile || !(videoFile instanceof File)) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT || 'INVALID_INPUT');
    }

    if (!isVideoFile(videoFile)) {
      throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT || 'UNSUPPORTED_FORMAT');
    }

    // 驗證檔案大小（100MB 限制）
    const VIDEO_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > VIDEO_SIZE_LIMIT) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE || 'FILE_TOO_LARGE');
    }

    // 解析選項
    const {
      startTime: clipStartTime = 0,
      endTime: clipEndTime,
      frameRate = 10,
      width = 0,
      height = 0,
      quality = 10,
      repeat = 0,
      onProgress = () => {}
    } = options;

    try {
      // 階段 1: 載入影片（0-10%）
      onProgress(0);
      const metadata = await this.loadVideoMetadata(videoFile);
      onProgress(5);

      const actualEndTime = clipEndTime || metadata.duration;

      // 驗證時間範圍
      if (clipStartTime >= actualEndTime) {
        throw new Error('INVALID_TIME_RANGE');
      }

      onProgress(10);

      // 階段 2: 擷取影格（10-70%）
      const frames = await this.extractVideoFrames(
        videoFile,
        metadata,
        clipStartTime,
        actualEndTime,
        frameRate,
        (progress) => {
          const stageProgress = PROGRESS_STAGES.EXTRACTING_FRAMES.start +
            (progress / 100) * (PROGRESS_STAGES.EXTRACTING_FRAMES.end - PROGRESS_STAGES.EXTRACTING_FRAMES.start);
          onProgress(Math.round(stageProgress));
        }
      );

      onProgress(70);

      // 計算輸出尺寸
      const outputWidth = width || Math.round(metadata.width * 0.8);
      const outputHeight = height || Math.round(metadata.height * 0.8);

      // 調整影格尺寸（如果需要）
      let resizedFrames = frames;
      if (outputWidth !== metadata.width || outputHeight !== metadata.height) {
        resizedFrames = await this.resizeFrames(frames, outputWidth, outputHeight);
      }

      // 階段 3: 編碼 GIF（70-100%）
      const encodingResult = await this.encodeGif(
        resizedFrames,
        {
          width: outputWidth,
          height: outputHeight,
          quality,
          repeat,
          frameDelay: Math.round(1000 / frameRate),
        },
        (progress) => {
          const stageProgress = PROGRESS_STAGES.ENCODING_GIF.start +
            (progress / 100) * (PROGRESS_STAGES.ENCODING_GIF.end - PROGRESS_STAGES.ENCODING_GIF.start);
          onProgress(Math.round(stageProgress));
        }
      );
      
      const gifBlob = encodingResult.file;

      onProgress(100);

      const processingTime = Date.now() - startTime;

      return {
        file: gifBlob,
        metadata: {
          width: outputWidth,
          height: outputHeight,
          frameCount: frames.length,
          fileSize: gifBlob.size,
          duration: actualEndTime - clipStartTime,
          processingTime
        }
      };
    } catch (error) {
      console.error('videoToGif error:', error);
      throw error;
    }
  }

  /**
   * 圖片序列轉 GIF
   * 
   * @param {File[]} imageFiles - 圖片檔案陣列
   * @param {Object} options - 選項
   * @param {number} options.frameDelay - 每幀延遲（毫秒），預設 100
   * @param {number} options.width - 輸出寬度（0=使用第一張圖的寬度）
   * @param {number} options.height - 輸出高度（0=使用第一張圖的高度）
   * @param {number} options.quality - 品質（1-30），預設 10
   * @param {number} options.repeat - 循環次數（0=無限），預設 0
   * @param {boolean} options.maintainAspectRatio - 保持比例，預設 true
   * @param {Function} options.onProgress - 進度回呼（0-100）
   * @returns {Promise<{file: Blob, metadata: Object}>}
   */
  async imagesToGif(imageFiles, options = {}) {
    const startTime = Date.now();

    // 驗證輸入
    if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT || 'INVALID_INPUT');
    }

    // 驗證每個檔案
    for (const file of imageFiles) {
      if (!file || !(file instanceof File)) {
        throw new Error(ERROR_MESSAGES.INVALID_INPUT || 'INVALID_INPUT');
      }

      if (!isImageFile(file)) {
        throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT || 'UNSUPPORTED_FORMAT');
      }

      // 驗證檔案大小（50MB 限制）
      if (file.size > FILE_SIZE_LIMITS.IMAGE) {
        throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE || 'FILE_TOO_LARGE');
      }
    }

    // 解析選項
    const {
      frameDelay = 100,
      width = 0,
      height = 0,
      quality = 10,
      repeat = 0,
      maintainAspectRatio = true,
      onProgress = () => {}
    } = options;

    try {
      // 階段 1: 載入圖片（0-30%）
      onProgress(0);
      const loadedImages = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const img = await loadImage(imageFiles[i]);
        const { canvas, ctx } = createCanvas(img.width, img.height);
        ctx.drawImage(img, 0, 0);
        loadedImages.push(canvas);
        
        const progress = ((i + 1) / imageFiles.length) * 30;
        onProgress(Math.round(progress));
      }

      // 取得第一張圖片的尺寸作為基準
      const firstCanvas = loadedImages[0];
      let targetWidth = width || firstCanvas.width;
      let targetHeight = height || firstCanvas.height;

      // 如果只指定了寬度或高度，且需要保持比例
      if (maintainAspectRatio) {
        const aspectRatio = firstCanvas.width / firstCanvas.height;
        
        if (width && !height) {
          targetHeight = Math.round(width / aspectRatio);
        } else if (height && !width) {
          targetWidth = Math.round(height * aspectRatio);
        }
      }

      onProgress(30);

      // 階段 2: 處理圖片（30-60%）
      const frames = [];
      
      for (let i = 0; i < loadedImages.length; i++) {
        const canvas = loadedImages[i];
        
        // 調整尺寸（如果需要）
        let processedCanvas = canvas;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          processedCanvas = await this.resizeCanvas(canvas, targetWidth, targetHeight);
        }

        // 取得 ImageData
        const ctx = processedCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        frames.push(imageData);

        const progress = 30 + ((i + 1) / loadedImages.length) * 30;
        onProgress(Math.round(progress));
      }

      onProgress(60);

      // 階段 3: 編碼 GIF（60-100%）
      const encodingResult = await this.encodeGif(
        frames,
        {
          width: targetWidth,
          height: targetHeight,
          quality,
          repeat,
          frameDelay,
        },
        (progress) => {
          const stageProgress = 60 + (progress / 100) * 40;
          onProgress(Math.round(stageProgress));
        }
      );
      
      const gifBlob = encodingResult.file;

      onProgress(100);

      const processingTime = Date.now() - startTime;

      return {
        file: gifBlob,
        metadata: {
          width: targetWidth,
          height: targetHeight,
          frameCount: frames.length,
          fileSize: gifBlob.size,
          processingTime
        }
      };
    } catch (error) {
      console.error('imagesToGif error:', error);
      throw error;
    }
  }

  /**
   * 載入影片元資料
   * 
   * @param {File} videoFile - 影片檔案
   * @returns {Promise<{duration: number, width: number, height: number}>}
   */
  async loadVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(videoFile);

      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('VIDEO_LOAD_ERROR'));
      };

      video.src = url;
    });
  }

  /**
   * 從影片擷取影格
   * 
   * @param {File} videoFile - 影片檔案
   * @param {Object} metadata - 影片元資料
   * @param {number} startTime - 開始時間（秒）
   * @param {number} endTime - 結束時間（秒）
   * @param {number} frameRate - 幀率
   * @param {Function} onProgress - 進度回呼
   * @returns {Promise<ImageData[]>}
   */
  async extractVideoFrames(videoFile, metadata, startTime, endTime, frameRate, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      canvas.width = metadata.width;
      canvas.height = metadata.height;

      const url = URL.createObjectURL(videoFile);
      const frames = [];
      const frameInterval = 1 / frameRate; // 秒
      const totalFrames = this.calculateFrameCount(startTime, endTime, frameRate);
      let currentFrameIndex = 0;

      video.preload = 'auto';
      
      video.onloadeddata = () => {
        video.currentTime = startTime;
      };

      video.onseeked = () => {
        try {
          // 繪製當前影格到 Canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 取得 ImageData
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          frames.push(imageData);

          currentFrameIndex++;
          const progress = (currentFrameIndex / totalFrames) * 100;
          onProgress(progress);

          // 移動到下一影格
          const nextTime = startTime + (currentFrameIndex * frameInterval);
          
          if (nextTime < endTime && currentFrameIndex < totalFrames) {
            video.currentTime = nextTime;
          } else {
            // 完成
            URL.revokeObjectURL(url);
            resolve(frames);
          }
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('VIDEO_FRAME_EXTRACTION_ERROR'));
      };

      video.src = url;
    });
  }

  /**
   * 調整 Canvas 尺寸
   * 
   * @param {HTMLCanvasElement} sourceCanvas - 來源 Canvas
   * @param {number} targetWidth - 目標寬度
   * @param {number} targetHeight - 目標高度
   * @returns {Promise<HTMLCanvasElement>}
   */
  async resizeCanvas(sourceCanvas, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    return canvas;
  }

  /**
   * 批次調整影格尺寸
   * 
   * @param {ImageData[]} frames - 影格陣列
   * @param {number} targetWidth - 目標寬度
   * @param {number} targetHeight - 目標高度
   * @returns {Promise<ImageData[]>}
   */
  async resizeFrames(frames, targetWidth, targetHeight) {
    const resizedFrames = [];
    
    for (const frame of frames) {
      // 建立臨時 Canvas 放置原始 ImageData
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frame.width;
      tempCanvas.height = frame.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(frame, 0, 0);

      // 調整尺寸
      const resizedCanvas = await this.resizeCanvas(tempCanvas, targetWidth, targetHeight);
      
      // 取得新的 ImageData
      const resizedCtx = resizedCanvas.getContext('2d');
      const resizedImageData = resizedCtx.getImageData(0, 0, targetWidth, targetHeight);
      
      resizedFrames.push(resizedImageData);
    }
    
    return resizedFrames;
  }

  /**
   * 編碼 GIF（使用 Worker）
   * 
   * @param {ImageData[]} frames - 影格陣列
   * @param {Object} options - 編碼選項
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<{file: Blob, metadata: Object}>}
   */
  async encodeGif(frames, options, onProgress) {
    const {
      width = frames[0].width,
      height = frames[0].height,
      frameDelay = 100,
      quality = 10,
      repeat = 0,
    } = options;
    
    // 發送到 Worker 進行編碼
    const result = await this._sendToWorker(
      'ENCODE_GIF',
      {
        frames,
        width,
        height,
        frameDelay,
        quality,
        repeat,
      },
      onProgress
    );
    
    return result;
  }

  /**
   * 計算影格數量
   * 
   * @param {number} startTime - 開始時間（秒）
   * @param {number} endTime - 結束時間（秒）
   * @param {number} frameRate - 幀率
   * @returns {number}
   */
  calculateFrameCount(startTime, endTime, frameRate) {
    return Math.ceil((endTime - startTime) * frameRate);
  }

  /**
   * 估算 GIF 檔案大小
   * 
   * @param {number} width - 寬度
   * @param {number} height - 高度
   * @param {number} frameCount - 影格數
   * @param {number} quality - 品質（1-30）
   * @returns {number} 估算檔案大小（bytes）
   */
  estimateGifSize(width, height, frameCount, quality) {
    const bytesPerFrame = (width * height * 0.5) * (quality / 10);
    return Math.round(frameCount * bytesPerFrame);
  }

  /**
   * 清理資源
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// 預設匯出
export default GifMaker;
