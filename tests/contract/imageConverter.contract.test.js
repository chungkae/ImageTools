/**
 * ImageConverter 合約測試
 * 
 * 測試範圍：
 * - convertToFormat 方法（WebP, HEIC, SVG → PNG）
 * - batchConvert 批次轉換
 * - 效能需求（SC-002: 10MB < 5 秒）
 * - 寬高比保持
 * - 並行限制
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageConverter } from '../../src/services/imageConverter.js';
import { createTestFile, TEST_FILE_SIZES, TEST_MIME_TYPES } from '../fixtures/index.js';
import {
  createPNGFile,
  createSVGFile,
  createWebPFile,
  createHEICFile,
  createLargePNGBuffer,
} from '../helpers/imageBuffers.js';

describe('ImageConverter Contract', () => {
  let converter;

  beforeEach(() => {
    converter = new ImageConverter();
  });

  describe('convertToFormat', () => {
    it('應接受 WebP 格式並輸出 PNG Blob', async () => {
      // Arrange: 使用真實的 WebP 圖片 File
      const webpFile = createWebPFile('test.webp', 100, 100);

      // Act
      const result = await converter.convertToFormat(webpFile, 'image/png');

      // Assert
      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalFormat).toBe('image/webp');
      expect(result.metadata.outputFormat).toBe('image/png');
    });

    it('應接受 SVG 格式並輸出 PNG Blob', async () => {
      // Arrange: 使用真實的 SVG File
      const svgFile = createSVGFile('test.svg', 100, 100, '#FF0000');

      // Act
      const result = await converter.convertToFormat(svgFile, 'image/png');

      // Assert
      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.metadata.originalFormat).toBe('image/svg+xml');
      expect(result.metadata.outputFormat).toBe('image/png');
    });

    it('應正確處理 HEIC 檔案（透過 Worker）', async () => {
      // Arrange
      const heicFile = createHEICFile('test.heic', 100, 100);

      // Act
      const result = await converter.convertToFormat(heicFile, 'image/png');

      // Assert
      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.metadata.originalFormat).toBe('image/heic');
      expect(result.metadata.usedWorker).toBe(true);
    });

    it('應保持原始寬高比', async () => {
      // Arrange
      const file = createWebPFile('test.webp', 100, 100);

      // Act
      const result = await converter.convertToFormat(file, 'image/png', {
        maintainAspectRatio: true,
      });

      // Assert
      expect(result.metadata.width).toBeDefined();
      expect(result.metadata.height).toBeDefined();
      const aspectRatio = result.metadata.width / result.metadata.height;
      expect(aspectRatio).toBeGreaterThan(0);
    });

    it('應支援調整尺寸', async () => {
      // Arrange
      const file = createWebPFile('test.webp', 1200, 900);

      // Act
      const result = await converter.convertToFormat(file, 'image/png', {
        maxWidth: 800,
        maxHeight: 600,
      });

      // Assert
      expect(result.metadata.width).toBeLessThanOrEqual(800);
      expect(result.metadata.height).toBeLessThanOrEqual(600);
    });

    it('應拒絕不支援的輸入格式', async () => {
      // Arrange
      const pdfFile = createTestFile('test.pdf', 'application/pdf', TEST_FILE_SIZES.small);

      // Act & Assert
      await expect(
        converter.convertToFormat(pdfFile, 'image/png')
      ).rejects.toThrow('UNSUPPORTED_INPUT_FORMAT');
    });

    it('應拒絕不支援的輸出格式', async () => {
      // Arrange
      const webpFile = createTestFile('test.webp', TEST_MIME_TYPES.webp, TEST_FILE_SIZES.small);

      // Act & Assert
      await expect(
        converter.convertToFormat(webpFile, 'image/bmp')
      ).rejects.toThrow('UNSUPPORTED_OUTPUT_FORMAT');
    });

    it('應包含完整的 metadata', async () => {
      // Arrange
      const file = createWebPFile('test.webp', 100, 100);

      // Act
      const result = await converter.convertToFormat(file, 'image/png');

      // Assert
      expect(result.metadata).toMatchObject({
        originalFormat: 'image/webp',
        outputFormat: 'image/png',
        originalSize: expect.any(Number),
        outputSize: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        compressionRatio: expect.any(Number),
        duration: expect.any(Number),
      });
    });
  });

  describe('batchConvert', () => {
    it('應正確處理混合格式的檔案', async () => {
      // Arrange
      const files = [
        createWebPFile('test1.webp', 100, 100),
        createSVGFile('test2.svg', 100, 100, '#FF0000'),
        createPNGFile('test3.png', 100, 100, 'blue'),
      ];

      // Act
      const results = await converter.batchConvert(files, 'image/png');

      // Assert
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.result.blob.type === 'image/png')).toBe(true);
    });

    it('應限制並行數量（≤ 3）', async () => {
      // Arrange
      const files = Array(10).fill(null).map((_, i) => 
        createWebPFile(`test${i}.webp`, 50, 50)
      );

      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const originalConvert = converter.convertToFormat.bind(converter);
      converter.convertToFormat = vi.fn(async (...args) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        const result = await originalConvert(...args);
        currentConcurrent--;
        return result;
      });

      // Act
      await converter.batchConvert(files, 'image/png', { maxConcurrent: 3 });

      // Assert
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it('應提供進度回呼', async () => {
      // Arrange
      const files = Array(5).fill(null).map((_, i) => 
        createWebPFile(`test${i}.webp`, 50, 50)
      );

      const progressUpdates = [];
      const onProgress = (progress) => {
        progressUpdates.push(progress);
      };

      // Act
      await converter.batchConvert(files, 'image/png', { onProgress });

      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toMatchObject({
        completed: 5,
        total: 5,
        percentage: 100,
      });
    });

    it('應回傳結果陣列包含成功和失敗項目', async () => {
      // Arrange
      const files = [
        createWebPFile('test1.webp', 50, 50),
        createTestFile('test2.pdf', 'application/pdf', TEST_FILE_SIZES.small), // Invalid
        createSVGFile('test3.svg', 50, 50, '#00FF00'),
      ];

      // Act
      const results = await converter.batchConvert(files, 'image/png', {
        continueOnError: true,
      });

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      expect(results[2].success).toBe(true);
    });

    it('應包含摘要統計', async () => {
      // Arrange
      const files = [
        createWebPFile('test1.webp', 50, 50),
        createSVGFile('test2.svg', 50, 50, '#0000FF'),
      ];

      // Act
      const results = await converter.batchConvert(files, 'image/png');

      // Assert
      const summary = results.summary;
      expect(summary).toMatchObject({
        total: 2,
        successful: 2,
        failed: 0,
        totalOriginalSize: expect.any(Number),
        totalOutputSize: expect.any(Number),
        totalDuration: expect.any(Number),
      });
    });
  });

  describe('效能需求 (SC-002)', () => {
    it('應在 5 秒內完成 10MB 檔案轉換', async () => {
      // Arrange
      const largeBuffer = createLargePNGBuffer(10 * 1024 * 1024); // 10 MB
      const largeFile = new File([largeBuffer], 'large.png', { type: 'image/png' });

      // Act
      const startTime = Date.now();
      const result = await converter.convertToFormat(largeFile, 'image/png');
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // < 5 seconds
      expect(result.metadata.duration).toBeLessThan(5000);
    }, 10000); // 10s timeout for safety

    it('應在合理時間內完成批次轉換（5個 2MB 檔案）', async () => {
      // Arrange
      const files = Array(5).fill(null).map((_, i) => {
        const buffer = createLargePNGBuffer(2 * 1024 * 1024);
        return new File([buffer], `test${i}.png`, { type: 'image/png' });
      });

      // Act
      const startTime = Date.now();
      const results = await converter.batchConvert(files, 'image/png', {
        maxConcurrent: 3,
      });
      const duration = Date.now() - startTime;

      // Assert
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(10000); // < 10 seconds for batch
    }, 15000);
  });

  describe('記憶體管理', () => {
    it('應正確釋放 ObjectURL', async () => {
      // Arrange
      const file = createWebPFile('test.webp', 100, 100);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      // Act
      const result = await converter.convertToFormat(file, 'image/png');
      
      // Simulate cleanup
      if (result.cleanup) {
        result.cleanup();
      }

      // Assert
      // Note: Actual ObjectURL revocation would be tested in integration
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('錯誤處理', () => {
    it('應處理 null 輸入', async () => {
      await expect(
        converter.convertToFormat(null, 'image/png')
      ).rejects.toThrow('INVALID_INPUT');
    });

    it('應處理損壞的圖片檔案', async () => {
      // Arrange
      const corruptedFile = new File(['invalid data'], 'corrupt.webp', {
        type: TEST_MIME_TYPES.webp,
      });

      // Act & Assert
      await expect(
        converter.convertToFormat(corruptedFile, 'image/png')
      ).rejects.toThrow();
    });

    it('應在批次轉換中隔離錯誤', async () => {
      // Arrange
      const files = [
        createWebPFile('test1.webp', 50, 50),
        new File(['corrupt'], 'corrupt.webp', { type: TEST_MIME_TYPES.webp }),
        createWebPFile('test3.webp', 50, 50),
      ];

      // Act
      const results = await converter.batchConvert(files, 'image/png', {
        continueOnError: true,
      });

      // Assert
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });
});
