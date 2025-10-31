/**
 * ImageConverter 服務
 * 
 * 功能：
 * - 圖片格式轉換（WebP, HEIC, SVG → PNG）
 * - 批次轉換
 * - 尺寸調整
 * - 進度追蹤
 */

import { loadImage, createCanvas, canvasToBlob, resizeImage } from '../utils/canvasHelpers.js';
import { validateFile } from '../utils/validators.js';
import { FILE_SIZE_LIMITS } from '../constants/limits.js';
import { SUPPORTED_IMAGE_FORMATS } from '../constants/fileTypes.js';

/**
 * 支援的輸入格式
 */
const SUPPORTED_INPUT_FORMATS = [
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/png',
  'image/jpeg',
  'image/gif',
];

/**
 * 支援的輸出格式
 */
const SUPPORTED_OUTPUT_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

export class ImageConverter {
  constructor() {
    this.workerManager = null; // Will be initialized when needed
  }

  /**
   * 轉換圖片格式
   * 
   * @param {File|Blob} file - 輸入檔案
   * @param {string} outputFormat - 輸出格式 (e.g., 'image/png')
   * @param {Object} options - 選項
   * @param {number} [options.maxWidth] - 最大寬度
   * @param {number} [options.maxHeight] - 最大高度
   * @param {boolean} [options.maintainAspectRatio=true] - 保持寬高比
   * @param {number} [options.quality=0.92] - JPEG/WebP 品質 (0-1)
   * @returns {Promise<{blob: Blob, metadata: Object}>}
   */
  async convertToFormat(file, outputFormat, options = {}) {
    const startTime = Date.now();

    // 驗證輸入
    if (!file) {
      throw new Error('INVALID_INPUT');
    }

    // 驗證格式 - 如果 MIME type 為空，根據副檔名判斷
    let inputFormat = file.type;
    
    if (!inputFormat || inputFormat === 'application/octet-stream') {
      // 嘗試從副檔名推斷格式
      if (file.name) {
        const ext = file.name.toLowerCase().match(/\.(\w+)$/)?.[1];
        const mimeTypes = {
          'heic': 'image/heic',
          'heif': 'image/heif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
        };
        inputFormat = mimeTypes[ext] || 'unknown';
      } else {
        inputFormat = 'unknown';
      }
    }
    
    if (!SUPPORTED_INPUT_FORMATS.includes(inputFormat)) {
      throw new Error('UNSUPPORTED_INPUT_FORMAT');
    }

    if (!SUPPORTED_OUTPUT_FORMATS.includes(outputFormat)) {
      throw new Error('UNSUPPORTED_OUTPUT_FORMAT');
    }

    const {
      maxWidth,
      maxHeight,
      maintainAspectRatio = true,
      quality = 0.92,
    } = options;

    try {
      // 根據輸入格式選擇解碼器
      let blob;
      let usedWorker = false;

      if (inputFormat === 'image/heic' || inputFormat === 'image/heif') {
        // HEIC 需要特殊處理（使用 Worker）
        blob = await this.decodeHEIC(file);
        usedWorker = true;
      } else if (inputFormat === 'image/svg+xml') {
        // SVG 需要特殊處理
        blob = await this.decodeSVG(file);
      } else if (inputFormat === 'image/webp') {
        // WebP 可直接處理
        blob = await this.decodeWebP(file);
      } else {
        // PNG, JPEG, GIF 等標準格式
        blob = file;
      }

      // 載入圖片
      const img = await loadImage(blob);

      // 計算尺寸
      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (maxWidth || maxHeight) {
        const dimensions = this.calculateTargetDimensions(
          targetWidth,
          targetHeight,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        );
        targetWidth = dimensions.width;
        targetHeight = dimensions.height;
      }

      // 繪製到 Canvas
      const { canvas, ctx } = createCanvas(targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 轉換為目標格式
      const outputBlob = await canvasToBlob(canvas, outputFormat, quality);

      const duration = Date.now() - startTime;

      // 回傳結果與 metadata
      return {
        blob: outputBlob,
        metadata: {
          originalFormat: inputFormat,
          outputFormat: outputFormat,
          originalSize: file.size,
          outputSize: outputBlob.size,
          width: targetWidth,
          height: targetHeight,
          compressionRatio: (file.size / outputBlob.size).toFixed(2),
          duration: duration,
          usedWorker: usedWorker,
        },
      };
    } catch (error) {
      console.error('Format conversion error:', error);
      throw error;
    }
  }

  /**
   * 解碼 WebP
   * 
   * @param {File|Blob} file - WebP 檔案
   * @returns {Promise<Blob>}
   */
  async decodeWebP(file) {
    // WebP 在現代瀏覽器中原生支援，直接回傳
    // 瀏覽器的 Image/Canvas API 會自動處理
    return file;
  }

  /**
   * 解碼 SVG
   * 
   * @param {File|Blob} file - SVG 檔案
   * @returns {Promise<Blob>}
   */
  async decodeSVG(file) {
    // SVG 是文字格式，需要讀取內容
    let text;
    
    if (file.text && typeof file.text === 'function') {
      // 現代瀏覽器支援 Blob.text()
      text = await file.text();
    } else {
      // Fallback: 使用 FileReader
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('SVG_READ_ERROR'));
        reader.readAsText(file);
      });
    }
    
    // 建立 Blob with SVG content
    const svgBlob = new Blob([text], { type: 'image/svg+xml' });
    
    return svgBlob;
  }

  /**
   * 解碼 HEIC（透過 heic2any）
   * 
   * @param {File|Blob} file - HEIC 檔案
   * @returns {Promise<Blob>}
   */
  async decodeHEIC(file) {
    // 檢查是否有 heic2any 函式庫
    if (typeof window.heic2any === 'undefined') {
      // 如果沒有，嘗試動態載入
      try {
        await this.loadHeic2any();
      } catch (error) {
        throw new Error('HEIC_DECODER_NOT_AVAILABLE');
      }
    }

    try {
      // 使用 heic2any 轉換 HEIC → PNG
      const convertedBlob = await window.heic2any({
        blob: file,
        toType: 'image/png',
        quality: 0.92,
      });

      // heic2any 可能回傳陣列
      return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (error) {
      console.error('HEIC decode error:', error);
      throw new Error('HEIC_DECODE_FAILED');
    }
  }

  /**
   * 動態載入 heic2any 函式庫
   * 使用本地安裝的 npm 套件，避免 CSP 阻擋
   */
  async loadHeic2any() {
    try {
      // 使用動態 import 載入本地安裝的 heic2any
      const heic2anyModule = await import('heic2any');
      // heic2any 的預設匯出
      window.heic2any = heic2anyModule.default || heic2anyModule;
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to load heic2any:', error);
      return Promise.reject(error);
    }
  }

  /**
   * 計算目標尺寸
   * 
   * @param {number} width - 原始寬度
   * @param {number} height - 原始高度
   * @param {number} maxWidth - 最大寬度
   * @param {number} maxHeight - 最大高度
   * @param {boolean} maintainAspectRatio - 是否保持寬高比
   * @returns {{width: number, height: number}}
   */
  calculateTargetDimensions(width, height, maxWidth, maxHeight, maintainAspectRatio = true) {
    if (!maxWidth && !maxHeight) {
      return { width, height };
    }

    if (!maintainAspectRatio) {
      return {
        width: maxWidth || width,
        height: maxHeight || height,
      };
    }

    // 保持寬高比
    const aspectRatio = width / height;

    if (maxWidth && maxHeight) {
      // 同時限制寬高，選擇較小的縮放比例
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);

      return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
      };
    } else if (maxWidth) {
      // 只限制寬度
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio),
      };
    } else {
      // 只限制高度
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      };
    }
  }

  /**
   * 批次轉換
   * 
   * @param {Array<File>} files - 檔案陣列
   * @param {string} outputFormat - 輸出格式
   * @param {Object} options - 選項
   * @param {number} [options.maxConcurrent=3] - 最大並行數
   * @param {Function} [options.onProgress] - 進度回呼
   * @param {boolean} [options.continueOnError=true] - 遇到錯誤是否繼續
   * @returns {Promise<Array<{success: boolean, result?: Object, error?: Error}>>}
   */
  async batchConvert(files, outputFormat, options = {}) {
    const {
      maxConcurrent = 3,
      onProgress,
      continueOnError = true,
      ...convertOptions
    } = options;

    const results = [];
    const totalFiles = files.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;
    let totalOriginalSize = 0;
    let totalOutputSize = 0;
    const startTime = Date.now();

    // 建立工作佇列
    const queue = [...files];
    const activePromises = new Set();

    const processNext = async () => {
      if (queue.length === 0) {
        return;
      }

      const file = queue.shift();
      const fileIndex = files.indexOf(file);

      const promise = (async () => {
        try {
          const result = await this.convertToFormat(file, outputFormat, convertOptions);
          
          results[fileIndex] = {
            success: true,
            result: result,
            fileName: file.name,
          };

          successCount++;
          totalOriginalSize += result.metadata.originalSize;
          totalOutputSize += result.metadata.outputSize;
        } catch (error) {
          results[fileIndex] = {
            success: false,
            error: error,
            fileName: file.name,
          };

          failCount++;

          if (!continueOnError) {
            throw error;
          }
        } finally {
          completed++;

          // 回報進度
          if (onProgress) {
            onProgress({
              completed,
              total: totalFiles,
              percentage: Math.round((completed / totalFiles) * 100),
              successCount,
              failCount,
            });
          }

          activePromises.delete(promise);
          
          // 處理下一個
          if (queue.length > 0) {
            await processNext();
          }
        }
      })();

      activePromises.add(promise);
      return promise;
    };

    // 啟動初始並行任務
    const initialPromises = [];
    for (let i = 0; i < Math.min(maxConcurrent, files.length); i++) {
      initialPromises.push(processNext());
    }

    // 等待所有任務完成
    await Promise.all(initialPromises);
    await Promise.all(Array.from(activePromises));

    const totalDuration = Date.now() - startTime;

    // 附加摘要統計
    results.summary = {
      total: totalFiles,
      successful: successCount,
      failed: failCount,
      totalOriginalSize,
      totalOutputSize,
      totalDuration,
      averageDuration: Math.round(totalDuration / totalFiles),
      compressionRatio: totalOriginalSize > 0 
        ? (totalOriginalSize / totalOutputSize).toFixed(2) 
        : 0,
    };

    return results;
  }
}
