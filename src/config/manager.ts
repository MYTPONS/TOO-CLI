import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  configSchema,
  type Config,
  type ModelCapabilities,
  AIProvider,
  defaultConfig,
} from './types.js';

// 模型能力映射
const modelCapabilitiesMap: Record<string, ModelCapabilities> = {
  // Anthropic Claude
  'claude-3-5-sonnet-20241022': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 200000,
  },
  'claude-3-5-haiku-20241022': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 200000,
  },
  'claude-3-opus-20240229': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 200000,
  },

  // OpenAI
  'gpt-4-turbo': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'gpt-4': {
    supportsTools: true,
    supportsImages: false,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 8192,
  },
  'gpt-3.5-turbo': {
    supportsTools: true,
    supportsImages: false,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 16385,
  },

  // Google Gemini
  'gemini-1.5-pro': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },
  'gemini-1.5-flash': {
    supportsTools: true,
    supportsImages: true,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },

  // 纯推理模型（不支持工具调用）
  'deepseek-r1': {
    supportsTools: false,
    supportsImages: false,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 64000,
  },
  'qwen-qwq-32b-preview': {
    supportsTools: false,
    supportsImages: false,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 32000,
  },
};

// 配置管理器
class ConfigManager {
  private config: Config | null = null;
  private configPath: string | null = null;

  // 获取配置目录
  async getConfigDir(): Promise<string> {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.too');

    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch {
      // 静默处理目录创建失败
    }

    return configDir;
  }

  // 获取配置文件路径
  async getConfigFilePath(): Promise<string> {
    const configDir = await this.getConfigDir();
    return path.join(configDir, 'config.json');
  }

  // 加载配置
  async load(): Promise<Config> {
    // 如果已加载，直接返回
    if (this.config) {
      return this.config;
    }

    // 尝试从文件加载
    this.configPath = await this.getConfigFilePath();

    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(configContent);
      this.config = configSchema.parse(parsedConfig);
    } catch {
      // 文件不存在或解析失败，使用默认配置
      this.config = {
        ...defaultConfig,
        workspace: process.cwd(),
      } as Config;
    }

    return this.config;
  }

  // 保存配置
  async save(config: Partial<Config>): Promise<void> {
    const currentConfig = await this.load();
    this.config = { ...currentConfig, ...config };

    const configPath = await this.getConfigFilePath();
    const configContent = JSON.stringify(this.config, null, 2);

    await fs.writeFile(configPath, configContent, 'utf-8');
  }

  // 获取配置
  async get(): Promise<Config> {
    return this.load();
  }

  // 设置配置项
  async set<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    const currentConfig = await this.get();
    (currentConfig as any)[key] = value;
    await this.save(currentConfig);
  }

  // 获取模型能力
  getModelCapabilities(model: string): ModelCapabilities {
    // 精确匹配
    if (modelCapabilitiesMap[model]) {
      return modelCapabilitiesMap[model];
    }

    // 模糊匹配
    const matchedKey = Object.keys(modelCapabilitiesMap).find((key) =>
      model.includes(key)
    );

    if (matchedKey) {
      return modelCapabilitiesMap[matchedKey];
    }

    // 默认能力
    return {
      supportsTools: true,
      supportsImages: false,
      supportsStreaming: true,
      maxTokens: 4096,
      contextWindow: 8192,
    };
  }

  // 检查模型是否支持工具调用
  supportsTools(model: string): boolean {
    const capabilities = this.getModelCapabilities(model);
    return capabilities.supportsTools;
  }

  // 获取当前 AI 提供商配置
  async getProviderConfig(provider: AIProvider): Promise<any> {
    const config = await this.get();

    switch (provider) {
      case AIProvider.ANTHROPIC:
        return config.anthropic;
      case AIProvider.OPENAI:
        return config.openai;
      case AIProvider.GOOGLE:
        return config.google;
      case AIProvider.OPENROUTER:
        return config.openRouter;
      case AIProvider.OLLAMA:
        return config.ollama;
      default:
        throw new Error(`不支持的 AI 提供商: ${provider}`);
    }
  }

  // 重置配置
  async reset(): Promise<void> {
    this.config = {
      ...defaultConfig,
      workspace: process.cwd(),
    } as Config;

    const configPath = await this.getConfigFilePath();
    const configContent = JSON.stringify(this.config, null, 2);

    await fs.writeFile(configPath, configContent, 'utf-8');
  }
}

// 导出单例
export const configManager = new ConfigManager();