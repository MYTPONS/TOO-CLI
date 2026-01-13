import OpenAI from 'openai';
import type {
  AIProvider as IAIProvider,
  Message,
  Tool,
  ToolCall,
  AIResponse,
  StreamChunk,
} from '../interface.js';
import type { OpenAIConfig } from '../../../config/types.js';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: Message[], tools?: Tool[]): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools?.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
    });

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}'),
    }));

    return {
      content: message.content || '',
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      model: this.config.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async chatStream(
    messages: Message[],
    tools: Tool[] | undefined,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AIResponse> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools?.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
      stream: true,
    });

    let fullContent = '';
    let toolCalls: ToolCall[] = [];
    const toolCallArgs: Record<string, string> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;

      // 内容流
      if (delta.content) {
        fullContent += delta.content;
        onChunk({ type: 'content', content: delta.content });
      }

      // 工具调用流
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.function?.name && tc.id) {
            if (!toolCalls.find((t) => t.id === tc.id)) {
              const newToolCall: ToolCall = {
                id: tc.id,
                name: tc.function.name,
                arguments: {},
              };
              toolCalls.push(newToolCall);
              toolCallArgs[tc.id] = '';
            }
          }

          if (tc.id && tc.function?.arguments) {
            toolCallArgs[tc.id] = (toolCallArgs[tc.id] || '') + tc.function.arguments;
          }
        }
      }

      // 完成
      if (chunk.choices[0].finish_reason) {
        // 解析累积的工具调用参数
        for (const toolCall of toolCalls) {
          if (toolCallArgs[toolCall.id]) {
            try {
              toolCall.arguments = JSON.parse(toolCallArgs[toolCall.id]);
            } catch {
              toolCall.arguments = {};
            }
          }
        }
        onChunk({ type: 'done', done: true });
      }
    }

    return {
      content: fullContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: this.config.model,
    };
  }

  getModel(): string {
    return this.config.model;
  }

  getProviderName(): string {
    return 'OpenAI';
  }
}