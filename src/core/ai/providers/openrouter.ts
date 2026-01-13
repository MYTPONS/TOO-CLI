import OpenAI from 'openai';
import type {
  AIProvider as IAIProvider,
  Message,
  Tool,
  ToolCall,
  AIResponse,
  StreamChunk,
} from '../interface.js';
import type { OpenRouterConfig } from '../../../config/types.js';

export class OpenRouterProvider implements IAIProvider {
  private client: OpenAI;
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
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

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;

      if (delta.content) {
        fullContent += delta.content;
        onChunk({ type: 'content', content: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.function?.name && tc.id && !toolCalls.find((t) => t.id === tc.id)) {
            const newToolCall: ToolCall = {
              id: tc.id,
              name: tc.function.name,
              arguments: {},
            };
            toolCalls.push(newToolCall);
          }

          if (tc.id) {
            const existingToolCall = toolCalls.find((t) => t.id === tc.id);
            if (existingToolCall && tc.function?.arguments) {
              try {
                const partialArgs = JSON.parse(tc.function.arguments);
                existingToolCall.arguments = {
                  ...existingToolCall.arguments,
                  ...partialArgs,
                };
              } catch {
                // 忽略不完整的 JSON
              }
            }
          }
        }
      }

      if (chunk.choices[0].finish_reason) {
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
    return 'OpenRouter';
  }
}