// 配置向导 - 交互式配置生成

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { Config } from '../config/types.js';
import { configSchema } from '../config/types.js';

export interface WizardAnswers {
  provider: string;
  apiKey?: string;
  model?: string;
  themeColor?: string;
  enableBrowser?: boolean;
}

export class ConfigWizard {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.too');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  /**
   * 运行配置向导
   */
  async run(): Promise<Config | null> {
    console.log('\n欢迎使用 TOO-CLI 配置向导！\n');

    const answers = await inquirer.prompt<WizardAnswers>([
      {
        type: 'list',
        name: 'provider',
        message: '选择 AI 提供商:',
        choices: [
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'OpenAI (GPT)', value: 'openai' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'OpenRouter', value: 'openrouter' },
          { name: 'Ollama (本地)', value: 'ollama' },
        ],
        default: 'anthropic',
      },
      {
        type: 'input',
        name: 'apiKey',
        message: '输入 API Key:',
        when: (answers) => answers.provider !== 'ollama',
        validate: (input) => input.length > 0 || 'API Key 不能为空',
      },
      {
        type: 'input',
        name: 'model',
        message: '输入模型名称:',
        default: (answers) => this.getDefaultModel(answers.provider || 'anthropic'),
        when: (answers) => answers.provider !== 'ollama',
      },
      {
        type: 'input',
        name: 'model',
        message: '输入模型名称:',
        default: 'llama3',
        when: (answers) => answers.provider === 'ollama',
      },
      {
        type: 'list',
        name: 'themeColor',
        message: '选择主题颜色:',
        choices: [
          { name: '橙色 (默认)', value: '#FF6B00' },
          { name: '蓝色', value: '#2196F3' },
          { name: '绿色', value: '#4CAF50' },
          { name: '紫色', value: '#9C27B0' },
          { name: '红色', value: '#F44336' },
        ],
        default: '#FF6B00',
      },
      {
        type: 'confirm',
        name: 'enableBrowser',
        message: '启用浏览器自动化功能?',
        default: false,
      },
    ]);

    const config = this.buildConfig(answers);

    // 验证配置
    const validationResult = configSchema.safeParse(config);
    if (!validationResult.success) {
      console.error('配置验证失败:', validationResult.error);
      return null;
    }

    // 保存配置
    await this.saveConfig(validationResult.data);

    console.log('\n✅ 配置已保存！');
    console.log(`配置文件: ${this.configPath}`);

    return validationResult.data;
  }

  /**
   * 获取默认模型
   */
  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      anthropic: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4-turbo',
      google: 'gemini-1.5-pro',
      openrouter: 'anthropic/claude-3.5-sonnet',
    };

    return defaults[provider] || 'unknown';
  }

  /**
   * 构建配置对象
   */
  private buildConfig(answers: WizardAnswers): Partial<Config> {
    const config: Partial<Config> = {
      provider: answers.provider as any,
      theme: {
        primaryColor: answers.themeColor || '#FF6B00',
        secondaryColor: '#2D2D2D',
        textColor: '#FFFFFF',
        accentColor: answers.themeColor || '#FF8C42',
      },
      enableBrowser: answers.enableBrowser || false,
      autoSaveSessions: true,
      maxContextRounds: 10,
    };

    // 根据提供商添加特定配置
    switch (answers.provider) {
      case 'anthropic':
        config.anthropic = {
          apiKey: answers.apiKey || '',
          model: answers.model || 'claude-3-5-sonnet-20241022',
          maxTokens: 8192,
          temperature: 0.7,
        };
        break;

      case 'openai':
        config.openai = {
          apiKey: answers.apiKey || '',
          model: answers.model || 'gpt-4-turbo',
          maxTokens: 4096,
          temperature: 0.7,
        };
        break;

      case 'google':
        config.google = {
          apiKey: answers.apiKey || '',
          model: answers.model || 'gemini-1.5-pro',
          maxTokens: 8192,
          temperature: 0.7,
        };
        break;

      case 'openrouter':
        config.openRouter = {
          apiKey: answers.apiKey || '',
          model: answers.model || 'anthropic/claude-3.5-sonnet',
          maxTokens: 8192,
          temperature: 0.7,
        };
        break;

      case 'ollama':
        config.ollama = {
          baseUrl: 'http://localhost:11434',
          model: answers.model || 'llama3',
          maxTokens: 4096,
          temperature: 0.7,
        };
        break;
    }

    return config;
  }

  /**
   * 保存配置文件
   */
  private async saveConfig(config: Config): Promise<void> {
    // 确保配置目录存在
    await fs.mkdir(this.configDir, { recursive: true });

    // 写入配置文件
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  }

  /**
   * 检查配置是否存在
   */
  async configExists(): Promise<boolean> {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取现有配置
   */
  async readConfig(): Promise<Config | null> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      const validationResult = configSchema.safeParse(config);

      if (validationResult.success) {
        return validationResult.data;
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * 运行配置向导
 */
export async function runConfigWizard(): Promise<Config | null> {
  const wizard = new ConfigWizard();
  return wizard.run();
}

/**
 * 检查并运行配置向导
 */
export async function checkAndRunWizard(): Promise<void> {
  const wizard = new ConfigWizard();

  if (!(await wizard.configExists())) {
    console.log('未找到配置文件，启动配置向导...\n');
    await wizard.run();
  }
}