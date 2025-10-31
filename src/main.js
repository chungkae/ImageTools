/**
 * 媒體轉換工具箱 - 主應用程式入口點
 * 
 * 功能：
 * - Tab 切換邏輯
 * - 元件初始化
 * - 全域事件處理
 */

import { Base64Input } from './components/Base64Input.js';
import { FileUploader } from './components/FileUploader.js';
import { ProgressBar } from './components/ProgressBar.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { ImagePreview } from './components/ImagePreview.js';
import { DownloadButton } from './components/DownloadButton.js';
import { ImageConverterComponent } from './components/ImageConverterComponent.js';
import GifMaker from './components/GifMaker.js';
import { Base64Converter } from './services/base64Converter.js';
import { copyToClipboard, generateFilename } from './utils/fileHelpers.js';
import { ERROR_MESSAGES } from './constants/messages.js';
import { memoryMonitor } from './utils/memoryMonitor.js';
import { browserCheck } from './utils/browserCheck.js';
import { resourceManager } from './utils/resourceManager.js';
import { errorBoundary } from './utils/errorBoundary.js';
import { logger } from './utils/logger.js';

console.log('🚀 媒體轉換工具箱 v1.0.0');

// 初始化錯誤邊界 (T077)
errorBoundary.onError((error, context) => {
  logger.error('全域錯誤', { error, context });
});

// 除錯模式設定 (T079)
const debugMode = localStorage.getItem('debug') === 'true';
if (debugMode) {
  logger.setLevel('DEBUG');
  console.log('🐛 除錯模式已啟用');
  console.log('💡 提示：localStorage.setItem("debug", "false") 可關閉除錯模式');
}

// 效能監控設定 (T080)
const perfMode = new URLSearchParams(window.location.search).get('perf') === 'true';
if (perfMode) {
  console.log('⚡ 效能監控模式已啟用');
  
  // 標記效能測量點
  window.perfMarks = {
    mark: (name) => {
      performance.mark(name);
      const now = performance.now();
      console.log(`⏱️ [${name}] ${now.toFixed(2)}ms`);
    },
    measure: (name, startMark, endMark) => {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`⏱️ [${name}] ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    }
  };
  
  window.perfMarks.mark('app-start');
}

// 瀏覽器相容性檢查 (T074)
browserCheck.showWarning();
if (localStorage.getItem('debug') === 'true') {
  console.log('📊 瀏覽器相容性報告:', browserCheck.getReport());
}

// 啟動記憶體監控 (T073)
memoryMonitor.start();
memoryMonitor.onWarning((warning) => {
  console.warn(`⚠️ 記憶體使用過高: ${warning.usedMB}MB (${warning.percentage}%)`);
  
  // 可選：顯示 UI 警告
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 60px;
    right: 16px;
    background-color: #fbbf24;
    color: #78350f;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 9999;
    max-width: 300px;
  `;
  banner.innerHTML = `
    <strong>⚠️ 記憶體警告</strong><br>
    目前使用 ${warning.usedMB}MB (${warning.percentage}%)<br>
    建議關閉一些分頁或重新整理頁面
  `;
  document.body.appendChild(banner);
  
  setTimeout(() => banner.remove(), 5000);
});

// 註冊 Service Worker (T071)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker 註冊成功:', registration.scope);
        
        // 檢查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 發現 Service Worker 更新');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本已安裝，但舊版本仍在控制
              console.log('💡 新版本可用，請重新整理頁面');
              // 可選：顯示通知提示使用者重新整理
              if (confirm('發現新版本，是否重新整理頁面？')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Service Worker 註冊失敗:', error);
      });
  });
}

// 全域元件實例
let base64Input, imageUploader, imagePreview, downloadButton, errorMessage;
let base64ToImageUploader, base64Output, copyButton;
let imageConverterComponent;
let gifMaker;
const converter = new Base64Converter();

// Tab 切換功能
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // 移除所有 active 類別
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabPanels.forEach((panel) => panel.classList.remove('active'));

      // 啟用點擊的 tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Base64 → 圖片功能初始化
function initBase64ToImage() {
  const base64InputContainer = document.getElementById('base64-input-container');
  const previewContainer = document.getElementById('base64-to-image-preview');
  const downloadContainer = document.getElementById('base64-download-container');
  const errorContainer = document.getElementById('base64-to-image-error');
  const convertButton = document.getElementById('convert-base64-button');
  
  if (!base64InputContainer || !previewContainer || !downloadContainer) {
    console.error('Base64 → 圖片容器元素未找到');
    return;
  }
  
  // 初始化元件
  base64Input = new Base64Input(base64InputContainer);
  imagePreview = new ImagePreview(previewContainer);
  downloadButton = new DownloadButton(downloadContainer);
  errorMessage = new ErrorMessage(errorContainer);
  
  // 轉換按鈕
  convertButton.addEventListener('click', async () => {
    const base64String = base64Input.getValue();
    
    if (!base64Input.isValueValid()) {
      errorMessage.show('請輸入有效的 Base64 字串');
      return;
    }
    
    try {
      errorMessage.hide();
      convertButton.disabled = true;
      convertButton.textContent = '轉換中...';
      
      // 轉換 Base64 → 圖片
      const result = await converter.base64ToImage(base64String);
      
      // 顯示預覽
      const dataUrl = URL.createObjectURL(result.blob);
      imagePreview.show(dataUrl, {
        type: result.metadata.mimeType,
        size: result.metadata.size,
        width: result.metadata.width,
        height: result.metadata.height,
      });
      
      // 設定下載按鈕
      const filename = generateFilename('base64-image', result.metadata.mimeType);
      downloadButton.setData(result.blob, filename);
      
      convertButton.textContent = '轉換為圖片';
      convertButton.disabled = false;
    } catch (error) {
      console.error('Base64 轉換失敗:', error);
      errorMessage.show(ERROR_MESSAGES[error.message] || '轉換失敗，請檢查 Base64 格式');
      convertButton.textContent = '轉換為圖片';
      convertButton.disabled = false;
    }
  });
}

// 圖片 → Base64 功能初始化
function initImageToBase64() {
  const uploaderContainer = document.getElementById('image-to-base64-uploader');
  const outputContainer = document.getElementById('base64-output-container');
  const errorContainer = document.getElementById('image-to-base64-error');
  
  if (!uploaderContainer || !outputContainer) {
    console.error('圖片 → Base64 容器元素未找到');
    return;
  }
  
  // 初始化元件
  base64ToImageUploader = new FileUploader(uploaderContainer, {
    accept: 'image/*',
    multiple: false,
    fileType: 'IMAGE',
    onFilesSelected: handleImageToBase64,
    onError: (errors) => {
      const messages = errors.map(e => e.error);
      errorMessage.show(messages);
    },
  });
  
  base64Output = outputContainer;
  copyButton = document.getElementById('copy-base64-button');
  
  // 複製按鈕
  copyButton?.addEventListener('click', async () => {
    const base64Text = base64Output.querySelector('.base64-output-preview')?.textContent;
    
    if (!base64Text) return;
    
    try {
      await copyToClipboard(base64Text);
      
      // 顯示複製成功狀態
      copyButton.classList.add('copied');
      copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        已複製
      `;
      
      setTimeout(() => {
        copyButton.classList.remove('copied');
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          複製
        `;
      }, 2000);
    } catch (error) {
      console.error('複製失敗:', error);
      errorMessage.show('複製失敗，請手動選取文字複製');
    }
  });
}

// 處理圖片轉 Base64
async function handleImageToBase64(files) {
  const file = files[0];
  const errorContainer = document.getElementById('image-to-base64-error');
  const outputError = new ErrorMessage(errorContainer);
  
  try {
    outputError.hide();
    
    // 轉換圖片 → Base64
    const result = await converter.imageToBase64(file);
    
    // 顯示 Base64 輸出
    base64Output.classList.remove('hidden');
    base64Output.innerHTML = `
      <div class="base64-output">
        <div class="base64-output-header">
          <span class="base64-output-title">Base64 字串（${(result.metadata.base64Length / 1024).toFixed(1)} KB）</span>
          <button id="copy-base64-button" class="btn btn-secondary copy-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            複製
          </button>
        </div>
        <div class="base64-output-preview">${result.base64.substring(0, 200)}${result.base64.length > 200 ? '...' : ''}</div>
      </div>
    `;
    
    // 重新綁定複製按鈕
    copyButton = document.getElementById('copy-base64-button');
    copyButton.addEventListener('click', async () => {
      try {
        await copyToClipboard(result.base64);
        
        copyButton.classList.add('copied');
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          已複製
        `;
        
        setTimeout(() => {
          copyButton.classList.remove('copied');
          copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            複製
          `;
        }, 2000);
      } catch (error) {
        console.error('複製失敗:', error);
        outputError.show('複製失敗，請手動選取文字複製');
      }
    });
  } catch (error) {
    console.error('圖片轉 Base64 失敗:', error);
    outputError.show(ERROR_MESSAGES[error.message] || '轉換失敗，請檢查圖片格式');
  }
}

// 圖片格式轉換功能初始化
function initImageConverter() {
  const imageConverterContainer = document.getElementById('image-converter');
  
  if (!imageConverterContainer) {
    console.error('圖片轉換容器元素未找到');
    return;
  }
  
  imageConverterComponent = new ImageConverterComponent(imageConverterContainer);
}

// GIF 製作功能初始化
function initGifMaker() {
  const gifMakerContainer = document.getElementById('gif-maker');
  
  if (!gifMakerContainer) {
    console.error('GIF 製作容器元素未找到');
    return;
  }
  
  try {
    gifMaker = new GifMaker();
    gifMakerContainer.appendChild(gifMaker.getElement());
  } catch (error) {
    console.error('GIF 製作器初始化失敗:', error);
    gifMakerContainer.innerHTML = '<p style="color: red;">GIF 製作器載入失敗，請檢查控制台錯誤</p>';
  }
}

// 應用程式初始化
function initApp() {
  try {
    if (perfMode) window.perfMarks?.mark('init-start');
    
    // 初始化 Tab 切換
    initTabs();
    
    // 檢查瀏覽器支援
    if (!window.FileReader || !window.Blob || !HTMLCanvasElement) {
      alert('您的瀏覽器版本過舊，請更新至最新版本');
      return;
    }
    
    if (perfMode) window.perfMarks?.mark('tabs-ready');
    
    // 初始化 Base64 轉換功能
    initBase64ToImage();
    initImageToBase64();
    
    if (perfMode) window.perfMarks?.mark('base64-ready');
    
    // 初始化圖片格式轉換功能
    initImageConverter();
    
    if (perfMode) window.perfMarks?.mark('converter-ready');
    
    // 初始化 GIF 製作功能
    initGifMaker();
    
    if (perfMode) {
      window.perfMarks?.mark('gif-ready');
      window.perfMarks?.mark('app-ready');
      
      // 顯示總初始化時間
      const duration = window.perfMarks?.measure('total-init', 'app-start', 'app-ready');
      console.log(`✅ 應用程式初始化完成，總耗時: ${duration.toFixed(2)}ms`);
      
      // 顯示各階段耗時
      console.log('📊 各階段耗時:');
      window.perfMarks?.measure('tabs-init', 'init-start', 'tabs-ready');
      window.perfMarks?.measure('base64-init', 'tabs-ready', 'base64-ready');
      window.perfMarks?.measure('converter-init', 'base64-ready', 'converter-ready');
      window.perfMarks?.measure('gif-init', 'converter-ready', 'gif-ready');
    }
    
    logger.info('應用程式初始化完成');
    
  } catch (error) {
    console.error('❌ 應用程式初始化失敗:', error);
    logger.error('應用程式初始化失敗', { error });
    alert(`應用程式載入失敗：${error.message}`);
  }
}

// DOM 載入完成後執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
