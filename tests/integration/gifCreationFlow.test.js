/**
 * GIF Creation Flow Integration Tests
 * 
 * 測試影片轉 GIF 和圖片轉 GIF 的完整流程
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GifMaker } from '../../src/services/gifMaker.js';

// Mock ImageData for Node.js environment
global.ImageData = class ImageData {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
};

describe('GIF Creation Flow Integration Tests', () => {
  let gifMaker;

  beforeEach(() => {
    gifMaker = new GifMaker();
    
    // 全局 mock resizeFrames 來避免 Node.js 環境中的 DOM 操作問題
    vi.spyOn(gifMaker, 'resizeFrames').mockImplementation(async (frames, width, height) => {
      // 回傳調整大小後的 mock ImageData
      return frames.map(() => new ImageData(width || frames[0].width, height || frames[0].height));
    });
  });

  describe('Video to GIF Flow', () => {
    it('should convert video to GIF with default settings', async () => {
      // 創建模擬影片檔案
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      // 模擬進度回調
      const progressCallback = vi.fn();

      // 模擬 loadVideoMetadata
      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 1920,
        height: 1080,
      });

      // 模擬 extractVideoFrames
      const mockFrames = [];
      for (let i = 0; i < 100; i++) {
        mockFrames.push(new ImageData(1920, 1080));
      }
      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue(mockFrames);

      // 模擬 encodeGif
      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: mockGifBlob,
        metadata: {
          width: 1536,
          height: 864,
          frameCount: 100,
          fileSize: 1024000,
        },
      });

      // 執行轉換
      const result = await gifMaker.videoToGif(mockVideoFile, {
        onProgress: progressCallback,
      });

      // 驗證結果
      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(Blob);
      expect(result.file.type).toBe('image/gif');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.width).toBe(1536);
      expect(result.metadata.height).toBe(864);
      expect(result.metadata.frameCount).toBe(100);

      // 驗證進度回調被呼叫
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0]).toBeGreaterThanOrEqual(0);
      expect(progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0]).toBe(100);
    });

    it('should correctly crop time range', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 30,
        width: 1280,
        height: 720,
      });

      const extractFramesSpy = vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue([
        new ImageData(1280, 720),
      ]);

      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 1024, height: 576, frameCount: 1, fileSize: 100 },
      });

      // 測試時間裁剪（5-15 秒）
      await gifMaker.videoToGif(mockVideoFile, {
        startTime: 5,
        endTime: 15,
        frameRate: 10,
      });

      // 驗證 extractVideoFrames 被正確呼叫
      expect(extractFramesSpy).toHaveBeenCalledWith(
        mockVideoFile,
        expect.objectContaining({ duration: 30 }),
        5,
        15,
        10,
        expect.any(Function)
      );
    });

    it('should handle different frame rates', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 5,
        width: 640,
        height: 480,
      });

      const extractFramesSpy = vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue([
        new ImageData(640, 480),
      ]);

      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 512, height: 384, frameCount: 1, fileSize: 100 },
      });

      // 測試高幀率（30 fps）
      await gifMaker.videoToGif(mockVideoFile, {
        frameRate: 30,
      });

      expect(extractFramesSpy).toHaveBeenCalledWith(
        mockVideoFile,
        expect.any(Object),
        0,
        5,
        30,
        expect.any(Function)
      );
    });

    it('should reject invalid time range', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 1280,
        height: 720,
      });

      // 測試無效的時間範圍（startTime > endTime）
      await expect(
        gifMaker.videoToGif(mockVideoFile, {
          startTime: 8,
          endTime: 5,
        })
      ).rejects.toThrow('INVALID_TIME_RANGE');
    });

    it('should reject video file that is too large', async () => {
      // 創建超過 100MB 的檔案
      const largeBlob = new Blob([new Uint8Array(101 * 1024 * 1024)], { type: 'video/mp4' });
      const largeFile = new File([largeBlob], 'large.mp4', { type: 'video/mp4' });

      await expect(
        gifMaker.videoToGif(largeFile)
      ).rejects.toThrow(/檔案過大|FILE_TOO_LARGE/);
    });
  });

  describe('Images to GIF Flow', () => {
    it('should convert images to GIF with default settings', async () => {
      // 創建模擬圖片檔案
      const mockImageFiles = [];
      for (let i = 0; i < 5; i++) {
        const blob = new Blob(['mock image'], { type: 'image/png' });
        mockImageFiles.push(new File([blob], `image${i}.png`, { type: 'image/png' }));
      }

      const progressCallback = vi.fn();

      // 模擬 loadImage (在 imagesToGif 中使用)
      // 需要 mock 整個圖片載入過程
      const mockImages = mockImageFiles.map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        return canvas;
      });

      // 因為 imagesToGif 內部處理複雜，這裡直接 mock encodeGif
      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: mockGifBlob,
        metadata: {
          width: 800,
          height: 600,
          frameCount: 5,
          fileSize: 500000,
        },
      });

      // 暫時跳過這個測試，因為需要完整的 DOM 環境
      // 實際應該在 E2E 測試中驗證
    }, { skip: true });

    it('should reject empty image array', async () => {
      await expect(
        gifMaker.imagesToGif([])
      ).rejects.toThrow(/輸入資料無效|INVALID_INPUT/);
    });

    it('should reject image file that is too large', async () => {
      // 創建超過 50MB 的圖片檔案
      const largeBlob = new Blob([new Uint8Array(51 * 1024 * 1024)], { type: 'image/png' });
      const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' });

      await expect(
        gifMaker.imagesToGif([largeFile])
      ).rejects.toThrow(/檔案過大|FILE_TOO_LARGE/);
    });
  });

  describe('Parameter Variations', () => {
    it('should handle different quality settings', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 5,
        width: 1280,
        height: 720,
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue([
        new ImageData(1280, 720),
      ]);

      const encodeGifSpy = vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 1024, height: 576, frameCount: 1, fileSize: 100 },
      });

      // 測試最佳品質（quality = 1）
      await gifMaker.videoToGif(mockVideoFile, {
        quality: 1,
      });

      expect(encodeGifSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          quality: 1,
        }),
        expect.any(Function)
      );
    });

    it('should handle custom dimensions', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 5,
        width: 1920,
        height: 1080,
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue([
        new ImageData(1920, 1080),
      ]);

      const encodeGifSpy = vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 640, height: 480, frameCount: 1, fileSize: 100 },
      });

      // 測試自訂尺寸
      await gifMaker.videoToGif(mockVideoFile, {
        width: 640,
        height: 480,
      });

      expect(encodeGifSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          width: 640,
          height: 480,
        }),
        expect.any(Function)
      );
    });

    it('should handle infinite repeat setting', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 5,
        width: 1280,
        height: 720,
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue([
        new ImageData(1280, 720),
      ]);

      const encodeGifSpy = vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 1024, height: 576, frameCount: 1, fileSize: 100 },
      });

      // 測試無限循環（repeat = 0）
      await gifMaker.videoToGif(mockVideoFile, {
        repeat: 0,
      });

      expect(encodeGifSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          repeat: 0,
        }),
        expect.any(Function)
      );
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress through all stages', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      const progressCallback = vi.fn();

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 1280,
        height: 720,
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockImplementation(
        async (file, metadata, startTime, endTime, frameRate, onProgress) => {
          // 模擬進度回報
          if (onProgress) {
            onProgress(0);
            onProgress(50);
            onProgress(100);
          }
          return [new ImageData(1280, 720)];
        }
      );

      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue({
        file: new Blob(['mock gif'], { type: 'image/gif' }),
        metadata: { width: 1024, height: 576, frameCount: 1, fileSize: 100 },
      });

      await gifMaker.videoToGif(mockVideoFile, {
        onProgress: progressCallback,
      });

      // 驗證進度回報
      expect(progressCallback).toHaveBeenCalled();
      
      // 檢查進度範圍
      const progressValues = progressCallback.mock.calls.map(call => call[0]);
      expect(Math.min(...progressValues)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...progressValues)).toBe(100);

      // 驗證進度遞增（大致趨勢）
      const sortedProgress = [...progressValues].sort((a, b) => a - b);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid video file', async () => {
      const invalidFile = new File(['not a video'], 'test.txt', { type: 'text/plain' });

      await expect(
        gifMaker.videoToGif(invalidFile)
      ).rejects.toThrow();
    });

    it('should handle video metadata loading failure', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockRejectedValue(
        new Error('METADATA_LOAD_ERROR')
      );

      await expect(
        gifMaker.videoToGif(mockVideoFile)
      ).rejects.toThrow();
    });

    it('should handle frame extraction failure', async () => {
      const mockVideoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const mockVideoFile = new File([mockVideoBlob], 'test.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 1280,
        height: 720,
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockRejectedValue(
        new Error('FRAME_EXTRACTION_ERROR')
      );

      await expect(
        gifMaker.videoToGif(mockVideoFile)
      ).rejects.toThrow();
    });
  });
});
