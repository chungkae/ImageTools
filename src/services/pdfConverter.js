/**
 * PDF 轉圖片服務
 * 
 * 功能：
 * - 載入 PDF 檔案
 * - 將每一頁轉換為圖片
 * - 支援批次下載
 */

import * as pdfjsLib from 'pdfjs-dist';
import { FILE_SIZE_LIMITS } from '../constants/limits.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

// 設定 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

class PdfConverter {
  constructor() {
    this.pdfDocument = null;
    this.currentFile = null;
  }

  /**
   * 驗證 PDF 檔案
   * @param {File} file - PDF 檔案
   * @returns {Object} 驗證結果
   */
  validatePdfFile(file) {
    // 檢查檔案類型
    if (file.type !== 'application/pdf') {
      return {
        valid: false,
        error: 'INVALID_FILE_TYPE',
        message: ERROR_MESSAGES.INVALID_FILE_TYPE + ' (僅支援 PDF)'
      };
    }

    // 檢查檔案大小（限制 100MB）
    if (file.size > FILE_SIZE_LIMITS.VIDEO_MAX) {
      return {
        valid: false,
        error: 'FILE_TOO_LARGE',
        message: `${ERROR_MESSAGES.FILE_TOO_LARGE} (限制 100MB)`
      };
    }

    return { valid: true };
  }

  /**
   * 載入 PDF 檔案
   * @param {File} file - PDF 檔案
   * @param {Function} onProgress - 進度回呼 (percent, message)
   * @returns {Promise<Object>} PDF 文件資訊
   */
  async loadPdf(file, onProgress) {
    try {
      // 驗證檔案
      const validation = this.validatePdfFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (onProgress) {
        onProgress(10, '正在讀取 PDF 檔案...');
      }

      this.currentFile = file;

      // 讀取檔案為 ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      if (onProgress) {
        onProgress(30, '正在解析 PDF 文件...');
      }

      // 載入 PDF 文件
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      });

      this.pdfDocument = await loadingTask.promise;

      if (onProgress) {
        onProgress(50, '載入完成！');
      }

      // 返回文件資訊
      const metadata = await this.pdfDocument.getMetadata();
      
      return {
        numPages: this.pdfDocument.numPages,
        metadata: metadata.info,
        filename: file.name,
        fileSize: file.size
      };
    } catch (error) {
      console.error('Load PDF error:', error);
      
      if (error.message === 'INVALID_FILE_TYPE' || error.message === 'FILE_TOO_LARGE') {
        throw error;
      }
      
      throw new Error('PDF_LOAD_ERROR');
    }
  }

  /**
   * 讀取檔案為 ArrayBuffer
   * @param {File} file - 檔案
   * @returns {Promise<ArrayBuffer>}
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('FILE_READ_ERROR'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 轉換單一頁面為圖片
   * @param {number} pageNumber - 頁碼（1-based）
   * @param {Object} options - 轉換選項
   * @param {number} options.scale - 縮放比例（預設 2.0 = 150 DPI）
   * @param {string} options.format - 輸出格式（'png' 或 'jpeg'）
   * @param {number} options.quality - JPEG 品質（0.1-1.0）
   * @returns {Promise<Object>} 包含 blob 和 metadata
   */
  async convertPageToImage(pageNumber, options = {}) {
    if (!this.pdfDocument) {
      throw new Error('PDF_NOT_LOADED');
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error('INVALID_PAGE_NUMBER');
    }

    try {
      const {
        scale = 2.0,  // 預設 2x = 150 DPI
        format = 'png',
        quality = 0.92
      } = options;

      // 取得頁面
      const page = await this.pdfDocument.getPage(pageNumber);

      // 計算視口尺寸
      const viewport = page.getViewport({ scale });

      // 建立 Canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 渲染頁面
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // 轉換為 Blob
      const blob = await new Promise((resolve) => {
        if (format === 'jpeg') {
          canvas.toBlob(resolve, 'image/jpeg', quality);
        } else {
          canvas.toBlob(resolve, 'image/png');
        }
      });

      // 清理
      canvas.remove();

      return {
        blob,
        metadata: {
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          scale,
          format,
          size: blob.size
        }
      };
    } catch (error) {
      console.error(`Convert page ${pageNumber} error:`, error);
      throw new Error('PAGE_CONVERSION_ERROR');
    }
  }

  /**
   * 轉換所有頁面為圖片
   * @param {Object} options - 轉換選項
   * @param {Function} onProgress - 進度回呼 (percent, message, pageNumber)
   * @returns {Promise<Array>} 圖片陣列
   */
  async convertAllPages(options = {}, onProgress) {
    if (!this.pdfDocument) {
      throw new Error('PDF_NOT_LOADED');
    }

    const results = [];
    const totalPages = this.pdfDocument.numPages;

    try {
      for (let i = 1; i <= totalPages; i++) {
        if (onProgress) {
          const percent = 50 + Math.floor((i / totalPages) * 50);
          onProgress(percent, `正在轉換第 ${i}/${totalPages} 頁...`, i);
        }

        const result = await this.convertPageToImage(i, options);
        results.push({
          ...result,
          pageNumber: i
        });
      }

      if (onProgress) {
        onProgress(100, '轉換完成！');
      }

      return results;
    } catch (error) {
      console.error('Convert all pages error:', error);
      throw error;
    }
  }

  /**
   * 取得 PDF 縮圖（第一頁的小圖）
   * @returns {Promise<string>} Data URL
   */
  async getThumbnail() {
    if (!this.pdfDocument) {
      throw new Error('PDF_NOT_LOADED');
    }

    try {
      const result = await this.convertPageToImage(1, {
        scale: 0.5,  // 小尺寸預覽
        format: 'png'
      });

      return URL.createObjectURL(result.blob);
    } catch (error) {
      console.error('Get thumbnail error:', error);
      return null;
    }
  }

  /**
   * 釋放資源
   */
  dispose() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
    this.currentFile = null;
  }

  /**
   * 估算轉換後的檔案大小
   * @param {Object} options - 轉換選項
   * @returns {number} 估算大小（bytes）
   */
  estimateOutputSize(options = {}) {
    if (!this.pdfDocument) {
      return 0;
    }

    const { scale = 2.0, format = 'png' } = options;
    const totalPages = this.pdfDocument.numPages;

    // 粗略估算：假設 A4 頁面，scale 2.0 約為 1654x2339 像素
    const avgWidth = 1654 * scale / 2.0;
    const avgHeight = 2339 * scale / 2.0;
    const pixels = avgWidth * avgHeight;

    // PNG: 約 4 bytes/pixel（含壓縮）
    // JPEG: 約 0.5-1 bytes/pixel
    const bytesPerPixel = format === 'png' ? 4 : 0.75;
    const avgSizePerPage = pixels * bytesPerPixel;

    return Math.floor(avgSizePerPage * totalPages);
  }
}

export default PdfConverter;
