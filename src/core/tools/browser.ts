import puppeteer from 'puppeteer-core';
import * as chromeLauncher from 'chrome-launcher';

// 浏览器操作结果
export interface BrowserResult {
  screenshot?: string;
  consoleLogs: string[];
  url: string;
  title: string;
}

// 浏览器操作选项
export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
}

// 启动浏览器
async function launchBrowser(options: BrowserOptions = {}) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: options.headless ? ['--headless'] : [],
  });

  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${chrome.port}`,
  });

  return { browser, chrome };
}

// 访问页面并截图
export async function visitPage(
  url: string,
  actions: Array<{
    type: 'click' | 'type' | 'scroll' | 'wait';
    selector?: string;
    text?: string;
    amount?: number;
    time?: number;
  }> = [],
  options: BrowserOptions = {}
): Promise<BrowserResult> {
  const { browser, chrome } = await launchBrowser(options);
  const page = await browser.newPage();

  const consoleLogs: string[] = [];

  page.on('console', (msg) => {
    consoleLogs.push(msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: options.timeout || 30000 });

    // 执行操作
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
          }
          break;
        case 'type':
          if (action.selector && action.text) {
            await page.type(action.selector, action.text);
          }
          break;
        case 'scroll':
          await page.evaluate((amount) => {
            (globalThis as any).window.scrollBy(0, amount || 500);
          }, action.amount);
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, action.time || 1000));
          break;
      }
    }

    // 截图
    const screenshot = await page.screenshot({ encoding: 'base64' });

    const result: BrowserResult = {
      screenshot: `data:image/png;base64,${screenshot}`,
      consoleLogs,
      url: page.url(),
      title: await page.title(),
    };

    return result;
  } finally {
    await page.close();
    await browser.close();
    await chrome.kill();
  }
}

// 获取页面内容
export async function getPageContent(url: string, options: BrowserOptions = {}): Promise<string> {
  const { browser, chrome } = await launchBrowser(options);
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: options.timeout || 30000 });
    const content = await page.evaluate(() => (globalThis as any).document.body.innerText);
    return content;
  } finally {
    await page.close();
    await browser.close();
    await chrome.kill();
  }
}