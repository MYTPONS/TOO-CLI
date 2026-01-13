import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIProvider as IAIProvider,
  Message,
  Tool,
  ToolCall,
  AIResponse,
  StreamChunk,
} from '../interface.js';
import type { GoogleConfig } from '../../../config/types.js';

export class GoogleProvider implements IAIProvider {
  private client: GoogleGenerativeAI;
  private config: GoogleConfig;

  constructor(config: GoogleConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(messages: Message[], tools: Tool[] | undefined): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      tools: tools?.map((t) => ({
        functionDeclarations: [
          {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema as any,
          },
        ],
      })),
    });

    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const chat = model.startChat({
      history: userMessages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      systemInstruction: systemMessage?.content,
    });

    const result = await chat.sendMessage(userMessages[userMessages.length - 1].content);
    const response = result.response;

    let content = '';
    let toolCalls: ToolCall[] = [];

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if ('text' in part) {
        content += part.text;
      } else if ('functionCall' in part && part.functionCall) {
        toolCalls.push({
          id: `tool_${Date.now()}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args as Record<string, any>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: this.config.model,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async chatStream(
    messages: Message[],
    tools: Tool[] | undefined,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      tools: tools?.map((t) => ({
        functionDeclarations: [
          {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema as any,
          },
        ],
      })),
    });

    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const chat = model.startChat({
      history: userMessages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      systemInstruction: systemMessage?.content,
    });

    const result = await chat.sendMessageStream(userMessages[userMessages.length - 1].content);
    const response = await result.response;

    let fullContent = '';
    let toolCalls: ToolCall[] = [];

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullContent += text;
        onChunk({ type: 'content', content: text });
      }
    }

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if ('functionCall' in part && part.functionCall) {
        toolCalls.push({
          id: `tool_${Date.now()}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args as Record<string, any>,
        });
      }
    }

    onChunk({ type: 'done', done: true });

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
    return 'Google';
  }
}