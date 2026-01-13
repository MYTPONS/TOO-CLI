#!/usr/bin/env node

import { render } from 'ink';
import { App } from '../ui/index.js';
import React from 'react';
import { checkAndRunWizard } from './wizard.js';

// 检查配置
await checkAndRunWizard();

// 启动应用
const { unmount } = render(React.createElement(App));

// 处理退出
process.on('SIGINT', () => {
  unmount();
  process.exit(0);
});