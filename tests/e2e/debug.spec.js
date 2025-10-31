/**
 * 調試用的 E2E 測試 - 檢查頁面實際渲染狀態
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test('調試: 檢查頁面載入和元素存在', async ({ page }) => {
  // 啟用控制台監聽
  page.on('console', msg => console.log('瀏覽器控制台:', msg.text()));
  page.on('pageerror', err => console.error('頁面錯誤:', err.message));
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  // 截圖頁面
  await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });
  
  // 檢查標題
  const title = await page.title();
  console.log('頁面標題:', title);
  
  // 檢查 h1
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const h1Text = await h1.textContent();
  console.log('H1 文字:', h1Text);
  
  // 檢查 Tab 按鈕
  const tabButtons = page.locator('.tab-button');
  const tabCount = await tabButtons.count();
  console.log('Tab 按鈕數量:', tabCount);
  
  // 檢查 base64-input-container 是否存在
  const base64InputContainer = page.locator('#base64-input-container');
  const containerExists = await base64InputContainer.count();
  console.log('#base64-input-container 數量:', containerExists);
  
  if (containerExists > 0) {
    // 檢查容器內容
    const containerHTML = await base64InputContainer.innerHTML();
    console.log('#base64-input-container HTML:', containerHTML);
    
    // 檢查 textarea 是否存在
    const textarea = base64InputContainer.locator('textarea');
    const textareaCount = await textarea.count();
    console.log('textarea 數量:', textareaCount);
  }
  
  // 檢查所有可見元素
  const allElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    return {
      total: elements.length,
      visible: Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length
    };
  });
  console.log('元素統計:', allElements);
  
  // 檢查 JavaScript 是否載入
  const hasMainScript = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="module"]');
    return scripts.length > 0;
  });
  console.log('是否有 module script:', hasMainScript);
  
  // 檢查是否有錯誤訊息
  const errors = page.locator('.error-message:visible');
  const errorCount = await errors.count();
  console.log('可見錯誤訊息數量:', errorCount);
  
  // 等待一下讓 JavaScript 執行
  await page.waitForTimeout(2000);
  
  // 再次檢查
  const base64InputContainerAfterWait = page.locator('#base64-input-container');
  const containerHTMLAfterWait = await base64InputContainerAfterWait.innerHTML();
  console.log('等待 2 秒後 #base64-input-container HTML:', containerHTMLAfterWait);
  
  // 最後截圖
  await page.screenshot({ path: 'test-results/debug-after-wait.png', fullPage: true });
});
