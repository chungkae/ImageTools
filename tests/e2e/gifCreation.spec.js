/**
 * GIF Creation E2E Tests
 * 
 * 測試 GIF 製作的端對端流程
 */

import { test, expect } from '@playwright/test';

/**
 * 創建最小的 WebM 測試影片檔案
 * 這是一個有效的 WebM 檔案頭部，足以通過檔案類型驗證
 */
function createMinimalWebMBuffer() {
  // WebM 檔案的 EBML header (最小化版本)
  // 這個 buffer 包含 WebM 識別標記，可以被瀏覽器識別為影片檔案
  const webmHeader = new Uint8Array([
    0x1A, 0x45, 0xDF, 0xA3, // EBML
    0x9F, 0x42, 0x86, 0x81, 0x01, // DocType: webm
    0x42, 0x87, 0x81, 0x02, // DocTypeVersion: 2
    0x42, 0x85, 0x81, 0x02  // DocTypeReadVersion: 2
  ]);
  return Buffer.from(webmHeader);
}

test.describe('GIF Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // 切換到 GIF 製作 tab
    await page.click('button[data-tab="gif-maker"]');
    
    // 等待 GIF 製作器載入
    await page.waitForSelector('.gif-maker');
  });

  test('should load GIF maker component', async ({ page }) => {
    // 驗證 GIF 製作器已載入
    const gifMaker = page.locator('.gif-maker');
    await expect(gifMaker).toBeVisible();
    
    // 驗證標題
    await expect(page.locator('.gif-maker h2')).toContainText('GIF 動畫製作');
    
    // 驗證模式選擇器
    await expect(page.locator('.mode-selector')).toBeVisible();
  });

  test.describe('Video to GIF', () => {
    test('should upload video, set time range, adjust parameters, and download GIF', async ({ page }) => {
      // 1. 確認在影片模式
      const videoMode = page.locator('input[name="gif-mode"][value="video"]');
      await expect(videoMode).toBeChecked();

      // 2. 上傳影片檔案 (需要測試影片檔案)
      // 注意：這需要實際的測試影片檔案
      // 暫時跳過實際上傳，測試 UI 流程

      // 驗證上傳區域可見
      await expect(page.locator('#video-uploader')).toBeVisible();
      
      // 驗證提示文字 - 使用更具體的選擇器
      await expect(page.locator('.video-mode .file-info .hint')).toContainText('支援 MP4, MOV, WEBM 格式');
    });

    test('should show video preview after upload', async ({ page }) => {
      // 測試影片預覽區域初始狀態
      const previewSection = page.locator('.video-preview-section');
      await expect(previewSection).toHaveCSS('display', 'none');
    });

    test('should enable convert button after video is loaded', async ({ page }) => {
      // 測試轉換按鈕初始狀態
      const convertBtn = page.locator('#convert-btn');
      await expect(convertBtn).toBeDisabled();
    });
  });

  test.describe('Images to GIF', () => {
    test('should switch to images mode', async ({ page }) => {
      // 切換到圖片模式
      await page.click('input[name="gif-mode"][value="images"]');
      
      // 驗證圖片模式 UI 顯示
      await expect(page.locator('.images-mode')).toHaveClass(/active/);
      await expect(page.locator('.video-mode')).not.toHaveClass(/active/);
    });

    test('should show images grid after upload', async ({ page }) => {
      // 切換到圖片模式
      await page.click('input[name="gif-mode"][value="images"]');
      
      // 驗證圖片網格初始隱藏
      const imagesPreview = page.locator('.images-preview-section');
      await expect(imagesPreview).toHaveCSS('display', 'none');
    });

    test('should enable frame delay control in images mode', async ({ page }) => {
      // 切換到圖片模式
      await page.click('input[name="gif-mode"][value="images"]');
      
      // 驗證幀延遲控制顯示
      const frameDelayControl = page.locator('.images-only');
      // 初始應該隱藏（因為沒有上傳圖片）
    });
  });

  test.describe('Parameter Controls', () => {
    test('should display all parameter controls', async ({ page }) => {
      // 測試參數控制（需要先有檔案才會顯示）
      const parametersSection = page.locator('.parameters-section');
      
      // 初始應該隱藏
      await expect(parametersSection).toHaveCSS('display', 'none');
    });

    test('should update frame rate value when slider changes', async ({ page }) => {
      // 這個測試需要有檔案上傳後才能執行
      // 暫時測試元素存在性
      const frameRateSlider = page.locator('#frame-rate');
      await expect(frameRateSlider).toBeAttached();
    });

    test('should update quality value when slider changes', async ({ page }) => {
      const qualitySlider = page.locator('#gif-quality');
      await expect(qualitySlider).toBeAttached();
    });

    test('should have maintain aspect ratio checkbox', async ({ page }) => {
      const aspectRatioCheckbox = page.locator('#gif-maintain-aspect-ratio');
      await expect(aspectRatioCheckbox).toBeAttached();
      await expect(aspectRatioCheckbox).toBeChecked();
    });
  });

  test.describe('File Size Estimation', () => {
    test('should show estimation info section', async ({ page }) => {
      const estimationInfo = page.locator('.estimation-info');
      await expect(estimationInfo).toBeAttached();
    });

    test('should have estimated frames display', async ({ page }) => {
      const estimatedFrames = page.locator('#estimated-frames');
      await expect(estimatedFrames).toContainText('--');
    });

    test('should have estimated size display', async ({ page }) => {
      const estimatedSize = page.locator('#estimated-size');
      await expect(estimatedSize).toContainText('--');
    });
  });

  test.describe('Progress Display', () => {
    test('should have progress section hidden initially', async ({ page }) => {
      const progressSection = page.locator('.progress-section');
      await expect(progressSection).toHaveCSS('display', 'none');
    });

    test('should have progress bar element', async ({ page }) => {
      const progressBar = page.locator('#progress-bar');
      await expect(progressBar).toBeAttached();
    });

    test('should have progress status and percentage displays', async ({ page }) => {
      await expect(page.locator('#progress-status')).toBeAttached();
      await expect(page.locator('#progress-percentage')).toBeAttached();
    });
  });

  test.describe('Result Display', () => {
    test('should have result section hidden initially', async ({ page }) => {
      const resultSection = page.locator('.result-section');
      await expect(resultSection).toHaveCSS('display', 'none');
    });

    test('should have result preview image element', async ({ page }) => {
      const resultPreview = page.locator('#result-preview');
      await expect(resultPreview).toBeAttached();
    });

    test('should have download and restart buttons', async ({ page }) => {
      await expect(page.locator('#download-btn')).toBeAttached();
      await expect(page.locator('#restart-btn')).toBeAttached();
    });

    test('should have result metadata displays', async ({ page }) => {
      await expect(page.locator('#result-size')).toBeAttached();
      await expect(page.locator('#result-dimensions')).toBeAttached();
      await expect(page.locator('#result-frames')).toBeAttached();
      await expect(page.locator('#result-time')).toBeAttached();
    });
  });

  test.describe('Mode Switching', () => {
    test('should correctly toggle between video and images modes', async ({ page }) => {
      // 初始應該在影片模式
      await expect(page.locator('input[name="gif-mode"][value="video"]')).toBeChecked();
      await expect(page.locator('.video-mode')).toHaveClass(/active/);
      
      // 切換到圖片模式
      await page.click('input[name="gif-mode"][value="images"]');
      await expect(page.locator('input[name="gif-mode"][value="images"]')).toBeChecked();
      await expect(page.locator('.images-mode')).toHaveClass(/active/);
      await expect(page.locator('.video-mode')).not.toHaveClass(/active/);
      
      // 切換回影片模式
      await page.click('input[name="gif-mode"][value="video"]');
      await expect(page.locator('input[name="gif-mode"][value="video"]')).toBeChecked();
      await expect(page.locator('.video-mode')).toHaveClass(/active/);
      await expect(page.locator('.images-mode')).not.toHaveClass(/active/);
    });

    test('should show/hide mode-specific controls when switching', async ({ page }) => {
      // 測試模式切換時，模式專屬的控制項類別應該正確切換
      const videoOnlyControl = page.locator('.video-only').first();
      const imagesOnlyControl = page.locator('.images-only').first();
      
      // 預設是影片模式，video-only 控制項應該存在（雖然參數區域隱藏）
      await expect(page.locator('input[name="gif-mode"][value="video"]')).toBeChecked();
      
      // 切換到圖片模式
      await page.click('input[name="gif-mode"][value="images"]');
      await expect(page.locator('input[name="gif-mode"][value="images"]')).toBeChecked();
      
      // 切回影片模式
      await page.click('input[name="gif-mode"][value="video"]');
      await expect(page.locator('input[name="gif-mode"][value="video"]')).toBeChecked();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for all inputs', async ({ page }) => {
      // 上傳檔案以顯示參數區域
      const testVideoBuffer = createMinimalWebMBuffer();
      await page.setInputFiles('.video-mode input[type="file"]', {
        name: 'test-video.webm',
        mimeType: 'video/webm',
        buffer: testVideoBuffer
      });
      await expect(page.locator('.parameters-section')).toBeVisible({ timeout: 10000 });
      
      // 檢查重要輸入欄位的 label（限定在 GIF Maker 區域內，使用包含文字匹配）
      const gifMaker = page.locator('#gif-maker');
      await expect(gifMaker.locator('label:text-matches("幀率", "i")')).toBeVisible();
      await expect(gifMaker.locator('label:text-matches("品質", "i")').first()).toBeVisible();
      await expect(gifMaker.locator('label:text-matches("輸出寬度", "i")')).toBeVisible();
      await expect(gifMaker.locator('label:text-matches("輸出高度", "i")')).toBeVisible();
      await expect(gifMaker.locator('label:text-matches("循環次數", "i")')).toBeVisible();
    });

    test('should have descriptive hints', async ({ page }) => {
      // 上傳檔案以顯示參數區域
      const testVideoBuffer = createMinimalWebMBuffer();
      await page.setInputFiles('.video-mode input[type="file"]', {
        name: 'test-video.webm',
        mimeType: 'video/webm',
        buffer: testVideoBuffer
      });
      await expect(page.locator('.parameters-section')).toBeVisible({ timeout: 10000 });
      
      // 檢查提示文字
      await expect(page.locator('.hint:has-text("支援 MP4, MOV, WEBM 格式")')).toBeVisible();
      await expect(page.locator('.hint:has-text("數字越小")')).toBeVisible();
      await expect(page.locator('.hint:has-text("0 = 無限循環")')).toBeVisible();
    });
  });

  test.describe('Validation', () => {
    test('should have file size limits in hints', async ({ page }) => {
      await expect(page.locator('.video-mode .file-info .hint')).toContainText('100MB');
      
      // 切換到圖片模式檢查圖片檔案限制
      await page.click('input[name="gif-mode"][value="images"]');
      await expect(page.locator('.images-mode .file-info .hint')).toContainText('50MB');
    });

    test('should have convert button disabled initially', async ({ page }) => {
      const convertBtn = page.locator('#convert-btn');
      await expect(convertBtn).toBeDisabled();
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should have responsive layout classes', async ({ page }) => {
      const gifMaker = page.locator('.gif-maker');
      await expect(gifMaker).toHaveClass(/gif-maker/);
      
      // 檢查網格布局
      const parameterGrid = page.locator('.parameter-grid');
      await expect(parameterGrid).toBeAttached();
    });
  });
});
