import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider as IAIProvider,
  Message,
  Tool,
  ToolCall,
  AIResponse,
  StreamChunk,
} from '../interface.js';
import type { AnthropicConfig } from '../../../config/types.js';

export class AnthropicProvider implements IAIProvider {
  private client: Anthropic;
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: Message[], tools?: Tool[]): Promise<AIResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      tools: tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    const toolCalls = response.content
      .filter((block) => block.type === 'tool_use')
      .map((block) => {
        if (block.type === 'tool_use') {
          return {
            id: block.id,
            name: block.name,
            arguments: block.input as Record<string, any>,
          };
        }
        return null;
      })
      .filter((tc): tc is ToolCall => tc !== null);

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: this.config.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async chatStream(
    messages: Message[],
    tools: Tool[] | undefined,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AIResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const stream = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      tools: tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      stream: true,
    });

    let fullContent = '';
    let toolCalls: ToolCall[] = [];
    let currentToolCall: Partial<ToolCall> | null = null;

    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_start':
          if (event.content_block.type === 'text') {
            onChunk({ type: 'content', content: '' });
          } else if (event.content_block.type === 'tool_use') {
            currentToolCall = {
              id: event.content_block.id,
              name: event.content_block.name,
              arguments: {},
            };
          }
          break;

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullContent += text;
            onChunk({ type: 'content', content: text });
          }
          break;

        case 'content_block_stop':
          if (currentToolCall) {
            toolCalls.push(currentToolCall as ToolCall);
            onChunk({
              type: 'tool_call',
              toolCall: currentToolCall as ToolCall,
            });
            currentToolCall = null;
          }
          break;

        case 'message_stop':
          onChunk({ type: 'done', done: true });
          break;
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
    return 'Anthropic';
  }
}