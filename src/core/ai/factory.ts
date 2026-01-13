import { AnthropicProvider } from './providers/anthropic.js';
import { OpenAIProvider } from './providers/openai.js';
import { GoogleProvider } from './providers/google.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { OllamaProvider } from './providers/ollama.js';
import type { AIProvider } from './interface.js';
import { AIProvider as AIProviderEnum } from '../../config/types.js';
import { configManager } from '../../config/manager.js';

// AI 提供商工厂
export class AIProviderFactory {
  // 创建 AI 提供商实例
  static async create(provider?: AIProviderEnum): Promise<AIProvider> {
    const config = await configManager.get();
    const selectedProvider = provider || config.provider;

    const providerConfig = await configManager.getProviderConfig(selectedProvider);

    if (!providerConfig) {
      throw new Error(
        `未配置 ${selectedProvider} 提供商，请先运行配置命令`
      );
    }

    switch (selectedProvider) {
      case AIProviderEnum.ANTHROPIC:
        return new AnthropicProvider(providerConfig);
      case AIProviderEnum.OPENAI:
        return new OpenAIProvider(providerConfig);
      case AIProviderEnum.GOOGLE:
        return new GoogleProvider(providerConfig);
      case AIProviderEnum.OPENROUTER:
        return new OpenRouterProvider(providerConfig);
      case AIProviderEnum.OLLAMA:
        return new OllamaProvider(providerConfig);
      default:
        throw new Error(`不支持的 AI 提供商: ${selectedProvider}`);
    }
  }

  // 获取所有支持的提供商
  static getSupportedProviders(): AIProviderEnum[] {
    return Object.values(AIProviderEnum);
  }

  // 检查提供商是否已配置
  static async isProviderConfigured(provider: AIProviderEnum): Promise<boolean> {
    const config = await configManager.get();

    switch (provider) {
      case AIProviderEnum.ANTHROPIC:
        return !!config.anthropic?.apiKey;
      case AIProviderEnum.OPENAI:
        return !!config.openai?.apiKey;
      case AIProviderEnum.GOOGLE:
        return !!config.google?.apiKey;
      case AIProviderEnum.OPENROUTER:
        return !!config.openRouter?.apiKey;
      case AIProviderEnum.OLLAMA:
        return !!config.ollama?.baseUrl;
      default:
        return false;
    }
  }
}