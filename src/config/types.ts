import { z } from 'zod';

// AI 提供商类型
export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  OPENROUTER = 'openrouter',
  OLLAMA = 'ollama',
}

// 模型能力
export interface ModelCapabilities {
  supportsTools: boolean;
  supportsImages: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
  contextWindow: number;
}

// Anthropic 配置
export const anthropicConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  model: z.string().default('claude-3-5-sonnet-20241022'),
  maxTokens: z.number().default(8192),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;

// OpenAI 配置
export const openaiConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  model: z.string().default('gpt-4-turbo'),
  maxTokens: z.number().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type OpenAIConfig = z.infer<typeof openaiConfigSchema>;

// Google Gemini 配置
export const googleConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().default('gemini-1.5-pro'),
  maxTokens: z.number().default(8192),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type GoogleConfig = z.infer<typeof googleConfigSchema>;

// OpenRouter 配置
export const openRouterConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().default('anthropic/claude-3.5-sonnet'),
  maxTokens: z.number().default(8192),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type OpenRouterConfig = z.infer<typeof openRouterConfigSchema>;

// Ollama 配置
export const ollamaConfigSchema = z.object({
  baseUrl: z.string().url().default('http://localhost:11434'),
  model: z.string().default('llama3'),
  maxTokens: z.number().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type OllamaConfig = z.infer<typeof ollamaConfigSchema>;

// MCP 服务器配置
export const mcpServerConfigSchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
});

export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;

// 主配置
export const configSchema = z.object({
  // 默认 AI 提供商
  provider: z.nativeEnum(AIProvider).default(AIProvider.ANTHROPIC),

  // 各提供商配置
  anthropic: anthropicConfigSchema.optional(),
  openai: openaiConfigSchema.optional(),
  google: googleConfigSchema.optional(),
  openRouter: openRouterConfigSchema.optional(),
  ollama: ollamaConfigSchema.optional(),

  // 工具调用模型配置（用于纯推理模型）
  toolCallModel: z.object({
    provider: z.nativeEnum(AIProvider),
    model: z.string(),
  }).optional(),

  // MCP 服务器
  mcpServers: z.array(mcpServerConfigSchema).default([]),

  // 工作目录
  workspace: z.string().default(process.cwd()),

  // 语言设置
  language: z.string().default('zh-CN'),

  // 主题
  theme: z.object({
    primaryColor: z.string().default('#FF6B00'),
    secondaryColor: z.string().default('#2D2D2D'),
    textColor: z.string().default('#FFFFFF'),
    accentColor: z.string().default('#FF8C42'),
  }).default({
    primaryColor: '#FF6B00',
    secondaryColor: '#2D2D2D',
    textColor: '#FFFFFF',
    accentColor: '#FF8C42',
  }),

  // 是否启用浏览器自动化
  enableBrowser: z.boolean().default(false),

  // 最大上下文轮数
  maxContextRounds: z.number().default(10),

  // 是否自动保存会话
  autoSaveSessions: z.boolean().default(true),

  // 会话保存路径
  sessionsPath: z.string().default('~/.too/sessions'),
});

export type Config = z.infer<typeof configSchema>;

// 默认配置
export const defaultConfig: Partial<Config> = {
  provider: AIProvider.ANTHROPIC,
  language: 'zh-CN',
  theme: {
    primaryColor: '#FF6B00',
    secondaryColor: '#2D2D2D',
    textColor: '#FFFFFF',
    accentColor: '#FF8C42',
  },
  enableBrowser: false,
  maxContextRounds: 10,
  autoSaveSessions: true,
  sessionsPath: '~/.too/sessions',
};