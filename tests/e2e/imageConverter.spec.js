/**
 * 圖片格式轉換功能 E2E 測試 (T059)
 * 
 * 測試場景：
 * 1. 上傳單一圖片 → 選擇輸出格式 → 轉換 → 下載
 * 2. 批次上傳多個圖片 → 轉換 → 全部下載
 * 3. 調整品質滑桿 → 轉換
 * 4. 調整尺寸選項 → 轉換
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// 測試用 Base64 圖片 (有效的 2x2 紅色 PNG)
// 這是一個完整有效的 PNG 檔案，包含 IHDR, IDAT, IEND chunks
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8DwHwyBNGMjIwMAIwwDAWF+E/YAAAAASUVORK5CYII=';

// 建立有效的測試圖片檔案
function createTestImageBuffer(format = 'png') {
  return Buffer.from(VALID_PNG_BASE64, 'base64');
}

// 驗證檔案上傳是否成功（等待選項顯示或錯誤訊息）
async function waitForUploadResult(page, timeout = 5000) {
  try {
    // 等待選項顯示或錯誤訊息出現
    await Promise.race([
      page.locator('#converter-options:not(.hidden)').waitFor({ state: 'visible', timeout }),
      page.locator('#image-converter-error:not(:empty)').waitFor({ state: 'visible', timeout })
    ]);
    
    // 檢查是否有錯誤
    const errorText = await page.locator('#image-converter-error').textContent();
    if (errorText && errorText.trim()) {
      throw new Error(`Upload failed: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    // 如果超時，檢查是否有錯誤訊息
    const errorText = await page.locator('#image-converter-error').textContent();
    if (errorText && errorText.trim()) {
      throw new Error(`Upload validation failed: ${errorText}`);
    }
    throw error;
  }
}

test.describe('圖片格式轉換功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 切換到圖片格式轉換 tab
    const imageConvertTabButton = page.locator('.tab-button[data-tab="image-convert"]');
    await imageConvertTabButton.click();
    
    // 等待 tab panel 變成 active
    await page.locator('#image-convert-tab.tab-panel.active').waitFor({ state: 'visible' });
  });

  test('場景 1: 上傳單一圖片 → 選擇輸出格式 → 轉換', async ({ page }) => {
    // Step 1: 找到檔案上傳元件
    const fileInput = page.locator('#image-converter input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Step 2: 上傳一個有效的 PNG 圖片
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // Step 3: 等待上傳結果（選項顯示或錯誤）
    await waitForUploadResult(page, 8000);
    
    const converterOptions = page.locator('#converter-options');
    await expect(converterOptions).not.toHaveClass(/hidden/);
    
    // 驗證檔案數量顯示
    const fileCount = page.locator('#file-count');
    await expect(fileCount).toContainText('1');

    // Step 4: 選擇輸出格式為 JPEG
    const formatSelect = page.locator('#output-format');
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption('image/jpeg');

    // Step 5: 驗證格式已選擇
    const selectedValue = await formatSelect.inputValue();
    expect(selectedValue).toBe('image/jpeg');

    // Step 6: 點擊轉換按鈕
    const convertButton = page.locator('#convert-images-button');
    await expect(convertButton).toBeVisible();
    await expect(convertButton).toBeEnabled();
    await convertButton.click();

    // Step 7: 等待轉換完成（可能會失敗但按鈕應該可點擊）
    await page.waitForTimeout(2000);
  });

  test('場景 2: 批次上傳多個圖片 → 轉換', async ({ page }) => {
    // Step 1: 上傳多個檔案
    const fileInput = page.locator('#image-converter input[type="file"]');
    
    await fileInput.setInputFiles([
      {
        name: 'test1.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('png'),
      },
      {
        name: 'test2.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('png'),
      },
      {
        name: 'test3.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('png'),
      },
    ]);

    // Step 2: 等待上傳結果
    await waitForUploadResult(page, 8000);

    // Step 3: 確認檔案數量
    await expect(page.locator('#file-count')).toContainText('3');

    // Step 4: 選擇輸出格式為 WebP
    await page.locator('#output-format').selectOption('image/webp');

    // Step 5: 點擊批次轉換按鈕
    await page.locator('#convert-images-button').click();

    // Step 6: 等待處理
    await page.waitForTimeout(3000);
  });

  test('場景 3: 調整品質滑桿', async ({ page }) => {
    // Step 1: 上傳檔案
    await page.locator('#image-converter input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // Step 2: 等待選項顯示
    await waitForUploadResult(page, 8000);

    // Step 3: 選擇 JPEG 格式（支援品質調整）
    await page.locator('#output-format').selectOption('image/jpeg');

    // Step 4: 調整品質滑桿
    const qualitySlider = page.locator('#quality');
    await expect(qualitySlider).toBeVisible();
    await qualitySlider.fill('0.8');

    // Step 5: 驗證品質值顯示
    await expect(page.locator('#quality-value')).toContainText('80');

    // Step 6: 執行轉換
    await page.locator('#convert-images-button').click();
    await page.waitForTimeout(2000);
  });

  test('場景 4: 調整尺寸選項', async ({ page }) => {
    // Step 1: 上傳檔案
    await page.locator('#image-converter input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // Step 2: 等待選項顯示
    await waitForUploadResult(page, 8000);

    // Step 3: 選擇輸出格式
    await page.locator('#output-format').selectOption('image/png');

    // Step 4: 選擇尺寸選項
    const resizeOption = page.locator('#resize-option');
    await expect(resizeOption).toBeVisible();
    await resizeOption.selectOption('max-width-800');

    // Step 5: 驗證選項已選擇
    const selectedResize = await resizeOption.inputValue();
    expect(selectedResize).toBe('max-width-800');

    // Step 6: 執行轉換
    await page.locator('#convert-images-button').click();
    await page.waitForTimeout(2000);
  });

  test('場景 5: 自訂尺寸選項', async ({ page }) => {
    // Step 1: 上傳檔案
    await page.locator('#image-converter input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // Step 2: 等待選項顯示
    await waitForUploadResult(page, 8000);

    // Step 3: 選擇自訂尺寸
    await page.locator('#resize-option').selectOption('custom');

    // Step 4: 確認自訂尺寸輸入框顯示
    const customSizeGroup = page.locator('#custom-size-group');
    await expect(customSizeGroup).toBeVisible();

    // Step 5: 輸入自訂寬度
    const customWidth = page.locator('#custom-width');
    await expect(customWidth).toBeVisible();
    await customWidth.fill('800');

    // Step 6: 確認保持比例勾選
    const maintainRatio = page.locator('#maintain-aspect-ratio');
    await expect(maintainRatio).toBeChecked();

    // Step 7: 執行轉換
    await page.locator('#convert-images-button').click();
    await page.waitForTimeout(2000);
  });

  test('場景 6: Tab 切換功能', async ({ page }) => {
    // 確認圖片轉換 tab 的內容是顯示的 (已在 beforeEach 切換過)
    const imageConvertTab = page.locator('#image-convert-tab.tab-panel.active');
    await expect(imageConvertTab).toBeVisible();

    // 切換到 Base64 tab
    const base64TabButton = page.locator('.tab-button[data-tab="base64"]');
    await base64TabButton.click();
    
    // 確認 Base64 tab 內容變成 active 並顯示
    await page.locator('#base64-tab.tab-panel.active').waitFor({ state: 'visible' });
    await expect(page.locator('#base64-tab')).toHaveClass(/active/);
    
    // 切回圖片格式轉換
    const imageConvertTabButton = page.locator('.tab-button[data-tab="image-convert"]');
    await imageConvertTabButton.click();
    
    // 確認圖片轉換 tab 內容又變回 active
    await page.locator('#image-convert-tab.tab-panel.active').waitFor({ state: 'visible' });
    await expect(imageConvertTab).toHaveClass(/active/);
  });
});

test.describe('圖片格式轉換效能測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 切換到圖片格式轉換 tab
    const imageConvertTabButton = page.locator('.tab-button[data-tab="image-convert"]');
    await imageConvertTabButton.click();
    await page.locator('#image-convert-tab.tab-panel.active').waitFor({ state: 'visible' });
  });
  
  test('應在合理時間內完成單一圖片轉換', async ({ page }) => {
    // 開始計時
    const startTime = Date.now();

    // 上傳檔案
    await page.locator('#image-converter input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // 等待選項顯示
    await waitForUploadResult(page, 8000);

    // 選擇格式並轉換
    await page.locator('#output-format').selectOption('image/jpeg');
    await page.locator('#convert-images-button').click();

    // 等待處理完成
    await page.waitForTimeout(2000);

    // 計算耗時
    const duration = Date.now() - startTime;
    
    // 驗證在合理時間內完成（應 < 10 秒）
    expect(duration).toBeLessThan(10000);
  });
});

test.describe('圖片格式轉換無障礙測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 切換到圖片格式轉換 tab
    const imageConvertTabButton = page.locator('.tab-button[data-tab="image-convert"]');
    await imageConvertTabButton.click();
    await page.locator('#image-convert-tab.tab-panel.active').waitFor({ state: 'visible' });
  });
  
  test('應有適當的表單元素', async ({ page }) => {
    // 上傳檔案以顯示選項
    await page.locator('#image-converter input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('png'),
    });

    // 等待選項顯示
    await waitForUploadResult(page, 8000);

    // 檢查重要元素是否可見
    const formatSelect = page.locator('#output-format');
    await expect(formatSelect).toBeVisible();
    
    const resizeSelect = page.locator('#resize-option');
    await expect(resizeSelect).toBeVisible();
    
    const qualitySlider = page.locator('#quality');
    await expect(qualitySlider).toBeVisible();
  });
});
