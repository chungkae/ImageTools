/**
 * Base64 轉換器合約測試
 * 
 * 驗證 Base64Converter 服務符合 contracts/converter-api.md 定義的介面
 * 
 * 測試重點：
 * - base64ToImage 接受有效 Base64 並回傳 Blob
 * - base64ToImage 拒絕無效 Base64
 * - imageToBase64 接受 File 並回傳 Base64 字串
 * - imageToBase64 拒絕過大檔案（> 50MB）
 * - 效能：5MB 檔案 < 2 秒（SC-001）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Base64Converter } from '../../src/services/base64Converter.js';
import { 
  createTestFile, 
  INVALID_BASE64,
  TEST_FILE_SIZES,
} from '../fixtures/index.js';
import {
  createPNGBuffer,
  createPNGFile,
  createJPEGFile,
  bufferToDataURL,
  createLargePNGBuffer,
} from '../helpers/imageBuffers.js';

describe('Base64Converter Contract', () => {
  let converter;
  
  beforeEach(() => {
    converter = new Base64Converter();
  });
  
  describe('base64ToImage', () => {
    it('應接受有效的 Base64 Data URL 並回傳 Blob', async () => {
      // 使用真實的 PNG Buffer 轉換為 Data URL
      const pngBuffer = createPNGBuffer(10, 10, 'red');
      const dataURL = bufferToDataURL(pngBuffer, 'image/png');
      
      const result = await converter.base64ToImage(dataURL);
      
      expect(result).toHaveProperty('blob');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toMatch(/^image\//);
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('width');
      expect(result.metadata).toHaveProperty('height');
      expect(result.metadata).toHaveProperty('size');
    }, 10000); // Increase timeout for image loading in jsdom
    
    it('應接受無前綴的純 Base64 字串並回傳 Blob', async () => {
      // 使用真實的 PNG Buffer 轉換為純 Base64
      const pngBuffer = createPNGBuffer(10, 10, 'blue');
      const base64 = pngBuffer.toString('base64');
      
      const result = await converter.base64ToImage(base64);
      
      expect(result).toHaveProperty('blob');
      expect(result.blob).toBeInstanceOf(Blob);
    }, 10000);
    
    it('應拒絕無效的 Base64 字串並拋出錯誤', async () => {
      await expect(
        converter.base64ToImage(INVALID_BASE64)
      ).rejects.toThrow('INVALID_BASE64');
    });
    
    it('應拒絕空字串並拋出錯誤', async () => {
      await expect(
        converter.base64ToImage('')
      ).rejects.toThrow('INVALID_INPUT');
    });
    
    it('應拒絕估算大小超過限制的 Base64 字串', async () => {
      // 產生超過 50MB 的 Base64 字串（約 67MB Base64 = 50MB 解碼後）
      const largeBase64 = 'A'.repeat(70 * 1024 * 1024);
      
      await expect(
        converter.base64ToImage(`data:image/png;base64,${largeBase64}`)
      ).rejects.toThrow('BASE64_TOO_LARGE');
    });
    
    it('回傳的 metadata 應包含完整資訊', async () => {
      // 使用真實的 PNG Buffer
      const pngBuffer = createPNGBuffer(50, 50, 'green');
      const dataURL = bufferToDataURL(pngBuffer, 'image/png');
      
      const result = await converter.base64ToImage(dataURL);
      
      expect(result.metadata).toHaveProperty('mimeType');
      expect(result.metadata).toHaveProperty('originalSize');
      expect(result.metadata).toHaveProperty('width');
      expect(result.metadata).toHaveProperty('height');
      expect(result.metadata.width).toBeGreaterThan(0);
      expect(result.metadata.height).toBeGreaterThan(0);
    }, 10000);
  });
  
  describe('imageToBase64', () => {
    it('應接受 File 物件並回傳 Base64 Data URL', async () => {
      const file = createPNGFile('test.png', 50, 50, 'red');
      const result = await converter.imageToBase64(file);
      
      expect(result).toHaveProperty('base64');
      expect(result.base64).toMatch(/^data:image\/\w+;base64,/);
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('mimeType');
      expect(result.metadata).toHaveProperty('size');
    });
    
    it('應支援回傳不含前綴的純 Base64 字串', async () => {
      const file = createPNGFile('test.png', 30, 30, 'blue');
      const result = await converter.imageToBase64(file, { includePrefix: false });
      
      expect(result.base64).not.toMatch(/^data:/);
      expect(result.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
    
    it('應拒絕超過 50MB 的檔案', async () => {
      const largeBuffer = createLargePNGBuffer(51 * 1024 * 1024); // 51MB
      const largeFile = new File([largeBuffer], 'large.png', { type: 'image/png' });
      
      await expect(
        converter.imageToBase64(largeFile)
      ).rejects.toThrow('FILE_TOO_LARGE');
    });
    
    it('應拒絕 null 或 undefined 輸入', async () => {
      await expect(
        converter.imageToBase64(null)
      ).rejects.toThrow('INVALID_INPUT');
      
      await expect(
        converter.imageToBase64(undefined)
      ).rejects.toThrow('INVALID_INPUT');
    });
    
    it('應拒絕非圖片檔案', async () => {
      const pdfFile = createTestFile('document.pdf', 'application/pdf', TEST_FILE_SIZES.small);
      
      await expect(
        converter.imageToBase64(pdfFile)
      ).rejects.toThrow('UNSUPPORTED_FORMAT');
    });
    
    it('回傳的 metadata 應包含檔案資訊', async () => {
      const file = createPNGFile('test.png', 40, 40, 'green');
      const result = await converter.imageToBase64(file);
      
      expect(result.metadata).toHaveProperty('fileName');
      expect(result.metadata).toHaveProperty('mimeType');
      expect(result.metadata).toHaveProperty('size');
      expect(result.metadata).toHaveProperty('base64Length');
      expect(result.metadata.fileName).toBe('test.png');
      expect(result.metadata.mimeType).toBe('image/png');
    });
  });
  
  describe('效能需求 (SC-001)', () => {
    it('應在 2 秒內完成 5MB 檔案的 imageToBase64 轉換', async () => {
      // 創建一個約 5MB 的 PNG 檔案
      const largeBuffer = createLargePNGBuffer(5 * 1024 * 1024);
      const file = new File([largeBuffer], 'large.png', { type: 'image/png' });
      
      const startTime = performance.now();
      await converter.imageToBase64(file);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000); // 2 秒
    }, 10000); // 設定 10 秒 timeout 以防測試環境較慢
    
    it('應在 2 秒內完成 5MB Base64 的 base64ToImage 轉換', async () => {
      // 創建約 5MB 的真實 PNG Buffer 並轉換為 Base64
      const largeBuffer = createLargePNGBuffer(5 * 1024 * 1024);
      const dataUrl = bufferToDataURL(largeBuffer, 'image/png');
      
      const startTime = performance.now();
      await converter.base64ToImage(dataUrl);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    }, 10000);
  });
  
  describe('Base64Data 靜態類別', () => {
    it('應正確解析 Data URL', () => {
      const pngBuffer = createPNGBuffer(10, 10, 'red');
      const dataURL = bufferToDataURL(pngBuffer, 'image/png');
      
      const parsed = Base64Converter.parseDataUrl(dataURL);
      
      expect(parsed).toHaveProperty('mimeType');
      expect(parsed).toHaveProperty('base64');
      expect(parsed.mimeType).toBe('image/png');
      expect(parsed.base64).toBeTruthy();
    });
    
    it('應正確驗證 Base64 格式', () => {
      const pngBuffer = createPNGBuffer(5, 5, 'blue');
      const validBase64 = pngBuffer.toString('base64');
      
      expect(Base64Converter.isValidBase64(validBase64)).toBe(true);
      expect(Base64Converter.isValidBase64(INVALID_BASE64)).toBe(false);
      expect(Base64Converter.isValidBase64('')).toBe(false);
      expect(Base64Converter.isValidBase64(null)).toBe(false);
    });
    
    it('應正確估算 Base64 解碼後的大小', () => {
      // 1 字元 Base64 ≈ 0.75 bytes
      const base64 = 'AAAA'; // 4 字元 = 3 bytes
      const estimatedSize = Base64Converter.estimateSize(base64);
      
      expect(estimatedSize).toBe(3);
    });
  });
});
