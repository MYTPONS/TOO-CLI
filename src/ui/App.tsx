import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { nanoid } from 'nanoid';
import { colors, borders } from './themes/index.js';
import { StatusBar } from './components/StatusBar.js';
import { MessageList, type Message } from './components/MessageList.js';
import { InputBox } from './components/InputBox.js';
import { Spinner } from './components/Spinner.js';
import { SessionBar } from './components/SessionBar.js';
import { CommandPalette, type Command } from './components/CommandPalette.js';
import { AIProviderFactory } from '../core/ai/factory.js';
import { configManager } from '../config/manager.js';
import { getAllTools, executeTool } from '../core/tools/index.js';
import {
  getSessionManager,
} from '../core/session/manager.js';
import type { SessionMetadata } from '../core/session/types.js';
import { SessionStatus } from '../core/session/types.js';
import type { AIProvider } from '../core/ai/interface.js';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface AppState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  status: ConnectionStatus;
  provider: string;
  model: string;
  tokenUsage: { input: number; output: number };
  streamingContent: string;
  showCommandPalette: boolean;
  commandPaletteQuery: string;
}

const initialState: AppState = {
  messages: [],
  input: '',
  isLoading: false,
  status: 'disconnected',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  tokenUsage: { input: 0, output: 0 },
  streamingContent: '',
  showCommandPalette: false,
  commandPaletteQuery: '',
};

// 帮助命令
const COMMANDS: Record<string, string> = {
  '/help': '显示帮助信息',
  '/clear': '清空消息历史',
  '/exit': '退出程序',
  '/model': '显示当前模型信息',
  '/new': '创建新会话',
  '/history': '查看会话历史',
  '/save': '保存当前会话',
  '/snapshot': '创建会话快照',
};

export function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [aiProvider, setAiProvider] = useState<AIProvider | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionMetadata | null>(null);
  const { exit } = useApp();

  // 获取会话管理器
  const sessionManager = getSessionManager();

  // 定义命令
  const commands: Command[] = [
    {
      id: 'help',
      label: '帮助',
      description: '显示帮助信息',
      icon: '❓',
      action: async () => {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: nanoid(),
              role: 'system',
              content: Object.entries(COMMANDS)
                .map(([k, v]) => `${k} - ${v}`)
                .join('\n'),
              timestamp: new Date(),
            },
          ],
          showCommandPalette: false,
        }));
      },
    },
    {
      id: 'clear',
      label: '清空',
      description: '清空消息历史',
      icon: '🗑️',
      action: async () => {
        setState((prev) => ({
          ...prev,
          messages: [],
          tokenUsage: { input: 0, output: 0 },
          showCommandPalette: false,
        }));
      },
    },
    {
      id: 'exit',
      label: '退出',
      description: '退出程序',
      icon: '🚪',
      action: async () => {
        exit();
      },
    },
    {
      id: 'model',
      label: '模型',
      description: '显示当前模型信息',
      icon: '🤖',
      action: async () => {
        if (aiProvider) {
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: nanoid(),
                role: 'system',
                content: `提供商: ${aiProvider.getProviderName()}\n模型: ${aiProvider.getModel()}`,
                timestamp: new Date(),
              },
            ],
            showCommandPalette: false,
          }));
        }
      },
    },
    {
      id: 'new',
      label: '新建会话',
      description: '创建新会话',
      icon: '➕',
      action: async () => {
        const newSession = sessionManager.createSession({
          provider: state.provider,
          model: state.model,
        });
        setCurrentSession(newSession.metadata);
        setState((prev) => ({
          ...prev,
          messages: [
            {
              id: nanoid(),
              role: 'system',
              content: `已创建新会话: ${newSession.metadata.title}`,
              timestamp: new Date(),
            },
          ],
          tokenUsage: { input: 0, output: 0 },
          showCommandPalette: false,
        }));
      },
    },
    {
      id: 'history',
      label: '历史',
      description: '查看会话历史',
      icon: '📜',
      action: async () => {
        const sessions = sessionManager.querySessions({
          status: SessionStatus.ACTIVE,
          limit: 10,
        });
        const historyText =
          sessions.length > 0
            ? sessions
                .map(
                  (s, i) =>
                    `${i + 1}. ${s.title} (${s.messageCount} 消息) - ${s.updatedAt.toLocaleString('zh-CN')}`
                )
                .join('\n')
            : '暂无会话历史';
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: nanoid(),
              role: 'system',
              content: `会话历史:\n${historyText}`,
              timestamp: new Date(),
            },
          ],
          showCommandPalette: false,
        }));
      },
    },
    {
      id: 'save',
      label: '保存',
      description: '保存当前会话',
      icon: '💾',
      action: async () => {
        if (currentSession) {
          sessionManager.saveCurrentSession();
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: nanoid(),
                role: 'system',
                content: `会话已保存: ${currentSession.title}`,
                timestamp: new Date(),
              },
            ],
            showCommandPalette: false,
          }));
        }
      },
    },
    {
      id: 'snapshot',
      label: '快照',
      description: '创建会话快照',
      icon: '📸',
      action: async () => {
        if (currentSession) {
          const snapshot = sessionManager.createSnapshot();
          if (snapshot) {
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `快照已创建: ${snapshot.name}`,
                  timestamp: new Date(),
                },
              ],
              showCommandPalette: false,
            }));
          }
        }
      },
    },
  ];

  // 初始化 AI 提供商和会话
  useEffect(() => {
    const initProvider = async () => {
      setState((prev) => ({ ...prev, status: 'connecting' }));

      try {
        const config = await configManager.get();
        const provider = await AIProviderFactory.create();

        setAiProvider(provider);

        // 尝试恢复或创建新会话
        const recentSessions = sessionManager.querySessions({
          status: SessionStatus.ACTIVE,
          limit: 1,
        });

        let sessionMetadata: SessionMetadata;
        let welcomeMessage: string;

        if (recentSessions.length > 0) {
          // 恢复最近的活动会话
          sessionManager.loadSession(recentSessions[0].id);
          sessionMetadata = recentSessions[0];
          welcomeMessage = `已恢复会话: ${sessionMetadata.title}\n当前模型: ${provider.getProviderName()} / ${provider.getModel()}\n\n输入 /help 查看帮助，/exit 退出`;
        } else {
          // 创建新会话
          const newSession = sessionManager.createSession({
            provider: config.provider,
            model: provider.getModel(),
          });
          sessionMetadata = newSession.metadata;
          welcomeMessage = `欢迎使用 TOO-CLI！\n当前模型: ${provider.getProviderName()} / ${provider.getModel()}\n\n输入 /help 查看帮助，/exit 退出`;
        }

        setCurrentSession(sessionMetadata);
        setState((prev) => ({
          ...prev,
          status: 'connected',
          provider: config.provider,
          model: provider.getModel(),
          messages: recentSessions.length > 0 ? sessionManager.getCurrentSession()?.messages || [] : [
            {
              id: nanoid(),
              role: 'assistant',
              content: welcomeMessage,
              timestamp: new Date(),
            },
          ],
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          messages: [
            {
              id: nanoid(),
              role: 'error',
              content: `初始化失败: ${(error as Error).message}\n请检查配置文件 ~/.too/config.json`,
              timestamp: new Date(),
            },
          ],
        }));
      }
    };

    initProvider();
  }, []);

  // 处理命令
  const handleCommand = useCallback(
    (command: string) => {
      const cmd = command.toLowerCase().trim();

      switch (cmd) {
        case '/help':
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: nanoid(),
                role: 'system',
                content: Object.entries(COMMANDS)
                  .map(([k, v]) => `${k} - ${v}`)
                  .join('\n'),
                timestamp: new Date(),
              },
            ],
          }));
          return true;

        case '/clear':
          setState((prev) => ({
            ...prev,
            messages: [],
            tokenUsage: { input: 0, output: 0 },
          }));
          return true;

        case '/exit':
        case '/quit':
          exit();
          return true;

        case '/model':
          if (aiProvider) {
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `提供商: ${aiProvider.getProviderName()}\n模型: ${aiProvider.getModel()}`,
                  timestamp: new Date(),
                },
              ],
            }));
          }
          return true;

        case '/new':
          // 创建新会话
          const newSession = sessionManager.createSession({
            provider: state.provider,
            model: state.model,
          });
          setCurrentSession(newSession.metadata);
          setState((prev) => ({
            ...prev,
            messages: [
              {
                id: nanoid(),
                role: 'system',
                content: `已创建新会话: ${newSession.metadata.title}`,
                timestamp: new Date(),
              },
            ],
            tokenUsage: { input: 0, output: 0 },
          }));
          return true;

        case '/history':
          // 显示会话历史
          const sessions = sessionManager.querySessions({
            status: 'active' as any,
            limit: 10,
          });
          const historyText =
            sessions.length > 0
              ? sessions
                  .map(
                    (s, i) =>
                      `${i + 1}. ${s.title} (${s.messageCount} 消息) - ${s.updatedAt.toLocaleString('zh-CN')}`
                  )
                  .join('\n')
              : '暂无会话历史';
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: nanoid(),
                role: 'system',
                content: `会话历史:\n${historyText}`,
                timestamp: new Date(),
              },
            ],
          }));
          return true;

        case '/save':
          // 保存当前会话
          if (currentSession) {
            sessionManager.saveCurrentSession();
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `会话已保存: ${currentSession.title}`,
                  timestamp: new Date(),
                },
              ],
            }));
          }
          return true;

        case '/snapshot':
          // 创建快照
          if (currentSession) {
            const snapshot = sessionManager.createSnapshot();
            if (snapshot) {
              setState((prev) => ({
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: nanoid(),
                    role: 'system',
                    content: `快照已创建: ${snapshot.name}`,
                    timestamp: new Date(),
                  },
                ],
              }));
            }
          }
          return true;

        default:
          return false;
      }
    },
    [aiProvider, exit]
  );

  // 发送消息到 AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!aiProvider || state.isLoading) return;

      // 添加用户消息
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        streamingContent: '',
      }));

      // 记录到会话
      if (currentSession) {
        sessionManager.addMessage(userMessage);
      }

      try {
        // 构建消息历史
        const history = state.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        history.push({ role: 'user', content });

        // 获取工具
        const tools = getAllTools();

        // 流式调用 AI
        let fullContent = '';
        const response = await aiProvider.chatStream(
          [
            {
              role: 'system',
              content:
                '你是 TOO-CLI 的 AI 助手，一个专业的编程助手。请用中文回复，简洁专业。',
            },
            ...history,
          ],
          tools,
          (chunk) => {
            if (chunk.type === 'content' && chunk.content) {
              fullContent += chunk.content;
              setState((prev) => ({
                ...prev,
                streamingContent: fullContent,
              }));
            }
          }
        );

        // 处理工具调用
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            // 显示工具调用
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: nanoid(),
                  role: 'tool',
                  content: `调用: ${JSON.stringify(toolCall.arguments)}`,
                  toolName: toolCall.name,
                  timestamp: new Date(),
                },
              ],
            }));

            // 执行工具
            const result = await executeTool(toolCall.name, toolCall.arguments);

            // 显示工具结果
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: nanoid(),
                  role: result.isError ? 'error' : 'tool',
                  content: result.output.slice(0, 500) + (result.output.length > 500 ? '...' : ''),
                  toolName: toolCall.name,
                  timestamp: new Date(),
                },
              ],
            }));
          }
        }

        // 添加助手消息
        const assistantMessage: Message = {
          id: nanoid(),
          role: 'assistant',
          content: response.content || fullContent,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          streamingContent: '',
          tokenUsage: response.usage
            ? {
                input: prev.tokenUsage.input + response.usage.inputTokens,
                output: prev.tokenUsage.output + response.usage.outputTokens,
              }
            : prev.tokenUsage,
        }));

        // 记录到会话
        if (currentSession) {
          sessionManager.addMessage(assistantMessage);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: nanoid(),
              role: 'error',
              content: `请求失败: ${(error as Error).message}`,
              timestamp: new Date(),
            },
          ],
          isLoading: false,
          streamingContent: '',
        }));
      }
    },
    [aiProvider, state.isLoading, state.messages]
  );

  // 处理用户输入
  useInput((char, key) => {
    // 如果命令面板打开，优先处理命令面板的键盘事件
    if (state.showCommandPalette) {
      // 简单处理命令面板的键盘事件
      if (key.escape) {
        setState((prev) => ({
          ...prev,
          showCommandPalette: false,
          commandPaletteQuery: '',
        }));
        return;
      }
      // 其他键盘事件暂时忽略
      return;
    }

    if (state.isLoading) return;

    // 检查是否按下 / 键打开命令面板
    if (char === '/' && state.input === '' && !state.showCommandPalette) {
      setState((prev) => ({
        ...prev,
        showCommandPalette: true,
        commandPaletteQuery: '/',
      }));
      return;
    }

    if (key.return) {
      const input = state.input.trim();
      if (!input) return;

      // 检查是否是命令
      if (input.startsWith('/')) {
        if (!handleCommand(input)) {
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: nanoid(),
                role: 'error',
                content: `未知命令: ${input}`,
                timestamp: new Date(),
              },
            ],
          }));
        }
      } else {
        sendMessage(input);
      }

      setState((prev) => ({ ...prev, input: '' }));
    } else if (key.ctrl && (key as any).name === 'c') {
      exit();
    } else if (key.escape && state.showCommandPalette) {
      setState((prev) => ({
        ...prev,
        showCommandPalette: false,
        commandPaletteQuery: '',
      }));
    } else if (key.backspace || key.delete) {
      setState((prev) => ({ ...prev, input: prev.input.slice(0, -1) }));
    } else if (char && !key.ctrl && !key.meta) {
      setState((prev) => ({ ...prev, input: prev.input + char }));
    }
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 1 },

    // 标题栏
    React.createElement(
      Box,
      {
        borderStyle: borders.double,
        borderColor: colors.primary,
        paddingX: 1,
        marginBottom: 1,
        justifyContent: 'center',
      },
      React.createElement(Text, { bold: true, color: colors.primary }, 'TOO-CLI'),
      React.createElement(Text, { color: colors.text }, ' - AI 编程助手')
    ),

    // 会话栏
    React.createElement(SessionBar, {
      session: currentSession,
      onNewSession: () => handleCommand('/new'),
      onShowHistory: () => handleCommand('/history'),
    }),

    // 状态栏
    React.createElement(StatusBar, {
      provider: state.provider,
      model: state.model,
      status: state.status,
      tokenUsage: state.tokenUsage,
    }),

    // 消息区域
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, marginY: 1 },
      React.createElement(MessageList, { messages: state.messages }),

      // 流式内容显示
      state.streamingContent &&
        React.createElement(
          Box,
          { paddingX: 1, marginTop: 1 },
          React.createElement(
            Text,
            { color: colors.success, dimColor: true },
            state.streamingContent
          )
        ),

      // 加载指示器
      state.isLoading &&
        !state.streamingContent &&
        React.createElement(
          Box,
          { paddingX: 1 },
          React.createElement(Spinner, { text: '思考中', type: 'spinner' })
        )
    ),

    // 输入框
    React.createElement(InputBox, {
      value: state.input,
      placeholder: '输入消息或命令...',
      disabled: state.isLoading,
    }),

    // 帮助栏
    React.createElement(
      Box,
      {
        marginTop: 1,
        justifyContent: 'center',
        gap: 2,
      },
      React.createElement(Text, { color: colors.textDim }, '按 / 打开命令面板'),
      React.createElement(Text, { color: colors.textDim }, '|'),
      React.createElement(Text, { color: colors.textDim }, 'Ctrl+C 退出')
    ),

    // 命令面板
    state.showCommandPalette &&
      React.createElement(CommandPalette, {
        isVisible: state.showCommandPalette,
        commands: commands,
        query: state.commandPaletteQuery,
      })
  );
}

export default App;
