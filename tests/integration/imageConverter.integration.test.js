/**
 * Image Converter Integration Tests
 * 
 * 測試 ImageConverterComponent 與 ImageConverter service 的整合
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageConverterComponent } from '../../src/components/ImageConverterComponent.js';
import { createTestFile, TEST_MIME_TYPES, TEST_FILE_SIZES } from '../fixtures/index.js';

describe('ImageConverter Integration', () => {
  let container;
  let component;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Component Initialization', () => {
    it('應正確初始化並渲染 UI 元素', () => {
      component = new ImageConverterComponent(container);

      // 檢查主要元素
      expect(container.querySelector('.image-converter')).toBeDefined();
      expect(container.querySelector('#image-converter-uploader')).toBeDefined();
      expect(container.querySelector('#converter-options')).toBeDefined();
      expect(container.querySelector('#output-format')).toBeDefined();
      expect(container.querySelector('#convert-images-button')).toBeDefined();
    });

    it('應隱藏轉換選項直到選擇檔案', () => {
      component = new ImageConverterComponent(container);

      const options = container.querySelector('#converter-options');
      expect(options.classList.contains('hidden')).toBe(true);
    });
  });

  describe('File Selection', () => {
    it('應在選擇檔案後顯示轉換選項', () => {
      component = new ImageConverterComponent(container);

      const files = [
        createTestFile('test.webp', TEST_MIME_TYPES.webp, TEST_FILE_SIZES.small),
      ];

      component.handleFilesSelected(files);

      const options = container.querySelector('#converter-options');
      expect(options.classList.contains('hidden')).toBe(false);
    });

    it('應更新檔案計數', () => {
      component = new ImageConverterComponent(container);

      const files = [
        createTestFile('test1.webp', TEST_MIME_TYPES.webp, TEST_FILE_SIZES.small),
        createTestFile('test2.heic', TEST_MIME_TYPES.heic, TEST_FILE_SIZES.small),
      ];

      component.handleFilesSelected(files);

      const fileCount = container.querySelector('#file-count');
      expect(fileCount.textContent).toBe('2');
    });
  });

  describe('Conversion Options', () => {
    beforeEach(() => {
      component = new ImageConverterComponent(container);

      const files = [
        createTestFile('test.webp', TEST_MIME_TYPES.webp, TEST_FILE_SIZES.small),
      ];
      component.handleFilesSelected(files);
    });

    it('應提供輸出格式選項 (PNG, JPEG, WebP)', () => {
      const formatSelect = container.querySelector('#output-format');
      const options = formatSelect.querySelectorAll('option');

      expect(options.length).toBe(3);
      expect(options[0].value).toBe('image/png');
      expect(options[1].value).toBe('image/jpeg');
      expect(options[2].value).toBe('image/webp');
    });

    it('應提供尺寸調整選項', () => {
      const resizeSelect = container.querySelector('#resize-option');
      const options = resizeSelect.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(3);
      expect(options[0].value).toBe('none');
    });

    it('應在選擇自訂尺寸時顯示輸入欄位', () => {
      const resizeSelect = container.querySelector('#resize-option');
      const customSizeGroup = container.querySelector('#custom-size-group');

      expect(customSizeGroup.classList.contains('hidden')).toBe(true);

      resizeSelect.value = 'custom';
      resizeSelect.dispatchEvent(new Event('change'));

      expect(customSizeGroup.classList.contains('hidden')).toBe(false);
    });

    it('應根據輸出格式顯示/隱藏品質選項', () => {
      const formatSelect = container.querySelector('#output-format');
      const qualityGroup = container.querySelector('#quality-group');

      // PNG - 隱藏品質選項
      formatSelect.value = 'image/png';
      formatSelect.dispatchEvent(new Event('change'));
      expect(qualityGroup.classList.contains('hidden')).toBe(true);

      // JPEG - 顯示品質選項
      formatSelect.value = 'image/jpeg';
      formatSelect.dispatchEvent(new Event('change'));
      expect(qualityGroup.classList.contains('hidden')).toBe(false);

      // WebP - 顯示品質選項
      formatSelect.value = 'image/webp';
      formatSelect.dispatchEvent(new Event('change'));
      expect(qualityGroup.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('應顯示上傳錯誤訊息', () => {
      component = new ImageConverterComponent(container);

      const errors = [
        { fileName: 'test.pdf', error: 'UNSUPPORTED_FORMAT' },
      ];

      component.handleUploadError(errors);

      const errorMessage = container.querySelector('.error-message');
      expect(errorMessage).toBeDefined();
      expect(errorMessage.textContent).toContain('UNSUPPORTED_FORMAT');
    });

    it('應在未選擇檔案時顯示錯誤', async () => {
      component = new ImageConverterComponent(container);

      const convertButton = container.querySelector('#convert-images-button');
      convertButton.click();

      await global.testUtils.nextTick();

      const errorMessage = container.querySelector('.error-message');
      expect(errorMessage).toBeDefined();
    });
  });

  describe('Conversion Options Retrieval', () => {
    beforeEach(() => {
      component = new ImageConverterComponent(container);

      const files = [
        createTestFile('test.webp', TEST_MIME_TYPES.webp, TEST_FILE_SIZES.small),
      ];
      component.handleFilesSelected(files);
    });

    it('應正確解析輸出格式和品質', () => {
      const formatSelect = container.querySelector('#output-format');
      const qualitySlider = container.querySelector('#quality');

      formatSelect.value = 'image/jpeg';
      qualitySlider.value = '0.85';

      const { outputFormat, options } = component.getConversionOptions();

      expect(outputFormat).toBe('image/jpeg');
      expect(options.quality).toBe(0.85);
    });

    it('應正確解析預設尺寸選項', () => {
      const resizeSelect = container.querySelector('#resize-option');

      resizeSelect.value = 'max-width-1920';

      const { options } = component.getConversionOptions();

      expect(options.maxWidth).toBe(1920);
      expect(options.maintainAspectRatio).toBe(true);
    });

    it('應正確解析自訂尺寸選項', () => {
      const resizeSelect = container.querySelector('#resize-option');
      const widthInput = container.querySelector('#custom-width');
      const heightInput = container.querySelector('#custom-height');
      const aspectRatio = container.querySelector('#maintain-aspect-ratio');

      resizeSelect.value = 'custom';
      widthInput.value = '800';
      heightInput.value = '600';
      aspectRatio.checked = false;

      const { options } = component.getConversionOptions();

      expect(options.maxWidth).toBe(800);
      expect(options.maxHeight).toBe(600);
      expect(options.maintainAspectRatio).toBe(false);
    });
  });
});
