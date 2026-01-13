// 消息类型
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

// 工具定义
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// 工具调用
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// 工具执行结果
export interface ToolResult {
  toolCallId: string;
  output: string;
  isError?: boolean;
}

// AI 响应
export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// 流式响应块
export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done';
  content?: string;
  toolCall?: ToolCall;
  done?: boolean;
}

// AI 提供商接口
export interface AIProvider {
  // 聊天（非流式）
  chat(messages: Message[], tools?: Tool[]): Promise<AIResponse>;

  // 聊天（流式）
  chatStream(
    messages: Message[],
    tools: Tool[] | undefined,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AIResponse>;

  // 获取模型名称
  getModel(): string;

  // 获取提供商名称
  getProviderName(): string;
}