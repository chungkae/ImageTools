/**
 * GIF Maker Contract Tests
 * 
 * 測試 GIF 製作器的公開 API 合約
 * - videoToGif: 影片轉 GIF
 * - imagesToGif: 圖片序列轉 GIF
 * 
 * 遵循合約規範: specs/001-media-converter/contracts/gif-maker-api.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GifMaker } from '../../src/services/gifMaker.js';
import { createPNGFile, createPNGBuffer } from '../helpers/imageBuffers.js';

describe('GIF Maker Contract Tests', () => {
  let gifMaker;

  beforeEach(() => {
    gifMaker = new GifMaker();
  });

  afterEach(() => {
    // 清理 Worker
    if (gifMaker && gifMaker.terminate) {
      gifMaker.terminate();
    }
  });

  describe('videoToGif', () => {
    it('應接受影片並輸出 GIF', async () => {
      // 建立模擬影片檔案
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const videoFile = new File([videoBlob], 'test-video.mp4', { 
        type: 'video/mp4',
        lastModified: Date.now()
      });

      // 模擬影片元資料
      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 640,
        height: 480
      });

      // 模擬影格擷取
      const mockFrames = [
        new ImageData(640, 480),
        new ImageData(640, 480),
        new ImageData(640, 480)
      ];
      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue(mockFrames);

      // 模擬 GIF 編碼
      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const result = await gifMaker.videoToGif(videoFile, {
        startTime: 0,
        endTime: 5,
        frameRate: 10
      });

      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(Blob);
      expect(result.file.type).toBe('image/gif');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.frameCount).toBeGreaterThan(0);
      expect(result.metadata.width).toBeGreaterThan(0);
      expect(result.metadata.height).toBeGreaterThan(0);
    });

    it('應在 30 秒內完成 10 秒影片（SC-003）', async () => {
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 640,
        height: 480
      });

      const mockFrames = Array(100).fill(null).map(() => new ImageData(640, 480));
      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue(mockFrames);

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const startTime = Date.now();
      
      await gifMaker.videoToGif(videoFile, { frameRate: 10 });
      
      const processingTime = Date.now() - startTime;
      
      // 應在 30 秒內完成（實際測試中可能需要更寬鬆的限制）
      expect(processingTime).toBeLessThan(30000);
    }, 35000); // 測試超時設為 35 秒

    it('應正確裁剪時間範圍', async () => {
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 30,
        width: 640,
        height: 480
      });

      const extractSpy = vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue(
        Array(50).fill(null).map(() => new ImageData(640, 480))
      );

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const result = await gifMaker.videoToGif(videoFile, {
        startTime: 5,
        endTime: 10,
        frameRate: 10
      });

      // 驗證 extractVideoFrames 被呼叫時使用了正確的時間範圍
      expect(extractSpy).toHaveBeenCalled();
      
      // 5 秒 * 10 fps = 50 影格
      expect(result.metadata.frameCount).toBe(50);
    });

    it('應回報進度', async () => {
      const progressUpdates = [];
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 640,
        height: 480
      });

      vi.spyOn(gifMaker, 'extractVideoFrames').mockResolvedValue(
        Array(10).fill(null).map(() => new ImageData(640, 480))
      );

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      await gifMaker.videoToGif(videoFile, {
        frameRate: 10,
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toBeGreaterThanOrEqual(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      
      // 進度應該是遞增的
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
      }
    });

    it('應拒絕無效影片檔案', async () => {
      const invalidFile = new File(['not a video'], 'test.txt', { type: 'text/plain' });

      await expect(gifMaker.videoToGif(invalidFile, {}))
        .rejects
        .toThrow();
    });

    it('應拒絕超過 100MB 的影片', async () => {
      // 建立大於 100MB 的模擬檔案
      const largeBlob = new Blob([new Uint8Array(101 * 1024 * 1024)], { type: 'video/mp4' });
      const largeFile = new File([largeBlob], 'large-video.mp4', { type: 'video/mp4' });

      await expect(gifMaker.videoToGif(largeFile, {}))
        .rejects
        .toThrow(/FILE_TOO_LARGE|超過|大小/);
    });

    it('應拒絕無效的時間範圍', async () => {
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' });
      const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

      vi.spyOn(gifMaker, 'loadVideoMetadata').mockResolvedValue({
        duration: 10,
        width: 640,
        height: 480
      });

      // startTime >= endTime 應該失敗
      await expect(gifMaker.videoToGif(videoFile, {
        startTime: 10,
        endTime: 5
      })).rejects.toThrow(/INVALID_TIME_RANGE|時間範圍|無效/);
    });
  });

  describe('imagesToGif', () => {
    it('應接受圖片陣列並輸出 GIF', async () => {
      const images = [
        createPNGFile('frame1.png', 100, 100, '#FF0000'),
        createPNGFile('frame2.png', 100, 100, '#00FF00'),
        createPNGFile('frame3.png', 100, 100, '#0000FF')
      ];

      // 模擬 GIF 編碼
      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const result = await gifMaker.imagesToGif(images, {
        frameDelay: 100,
        quality: 10
      });

      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(Blob);
      expect(result.file.type).toBe('image/gif');
      expect(result.metadata.frameCount).toBe(3);
    });

    it('應拒絕空陣列', async () => {
      await expect(gifMaker.imagesToGif([], {}))
        .rejects
        .toThrow(/INVALID_INPUT|空|無效/);
    });

    it('應統一調整所有影格尺寸', async () => {
      const images = [
        createPNGFile('large.png', 1920, 1080, '#FF0000'),
        createPNGFile('small.png', 800, 600, '#00FF00'),
        createPNGFile('medium.png', 1280, 720, '#0000FF')
      ];

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const result = await gifMaker.imagesToGif(images, {
        width: 800,
        height: 450,
        maintainAspectRatio: false
      });

      expect(result.metadata.width).toBe(800);
      expect(result.metadata.height).toBe(450);
    });

    it('應拒絕包含無效檔案的陣列', async () => {
      const images = [
        createPNGFile('valid.png', 100, 100, '#FF0000'),
        new File(['not an image'], 'invalid.txt', { type: 'text/plain' })
      ];

      await expect(gifMaker.imagesToGif(images, {}))
        .rejects
        .toThrow();
    });

    it('應拒絕包含超過 50MB 圖片的陣列', async () => {
      const largeBlob = new Blob([new Uint8Array(51 * 1024 * 1024)], { type: 'image/png' });
      const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' });

      const images = [
        createPNGFile('valid.png', 100, 100, '#FF0000'),
        largeFile
      ];

      await expect(gifMaker.imagesToGif(images, {}))
        .rejects
        .toThrow(/FILE_TOO_LARGE|超過|大小/);
    });

    it('應回報進度', async () => {
      const progressUpdates = [];
      const images = [
        createPNGFile('frame1.png', 100, 100, '#FF0000'),
        createPNGFile('frame2.png', 100, 100, '#00FF00'),
        createPNGFile('frame3.png', 100, 100, '#0000FF')
      ];

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      await gifMaker.imagesToGif(images, {
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('應保持寬高比（當 maintainAspectRatio=true）', async () => {
      const images = [
        createPNGFile('frame.png', 1920, 1080, '#FF0000')
      ];

      const mockGifBlob = new Blob(['mock gif'], { type: 'image/gif' });
      vi.spyOn(gifMaker, 'encodeGif').mockResolvedValue(mockGifBlob);

      const result = await gifMaker.imagesToGif(images, {
        width: 800,
        maintainAspectRatio: true
      });

      // 原始比例 16:9，寬度 800 時高度應為 450
      expect(result.metadata.width).toBe(800);
      expect(result.metadata.height).toBe(450);
    });
  });

  describe('輔助方法', () => {
    it('estimateGifSize 應正確估算檔案大小', () => {
      const size = gifMaker.estimateGifSize(800, 600, 30, 10);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
      
      // 公式: (width * height * 0.5) * (quality / 10) * frameCount
      const expected = (800 * 600 * 0.5) * (10 / 10) * 30;
      expect(size).toBeCloseTo(expected, -3); // 允許小誤差
    });

    it('estimateGifSize 應考慮品質參數', () => {
      const lowQuality = gifMaker.estimateGifSize(800, 600, 30, 5);
      const highQuality = gifMaker.estimateGifSize(800, 600, 30, 20);
      
      expect(highQuality).toBeGreaterThan(lowQuality);
    });

    it('calculateFrameCount 應正確計算影格數', () => {
      const frameCount = gifMaker.calculateFrameCount(0, 5, 10);
      
      // 5 秒 * 10 fps = 50 影格
      expect(frameCount).toBe(50);
    });

    it('calculateFrameCount 應處理小數時間', () => {
      const frameCount = gifMaker.calculateFrameCount(2.5, 7.5, 15);
      
      // 5 秒 * 15 fps = 75 影格
      expect(frameCount).toBe(75);
    });
  });
});
