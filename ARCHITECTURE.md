# TOO-CLI 项目架构文档

本文档详细说明 TOO-CLI 的系统架构、模块设计和数据流。

---

## 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [模块说明](#模块说明)
- [数据流](#数据流)
- [技术选型](#技术选型)
- [扩展机制](#扩展机制)

---

## 系统概述

TOO-CLI 是一个基于终端的 AI 编程助手，采用模块化架构设计，支持多 AI 提供商和可扩展的工具系统。

### 设计原则

- **模块化**：各功能模块独立，低耦合高内聚
- **可扩展**：支持通过 MCP 协议扩展工具
- **类型安全**：全面使用 TypeScript 类型系统
- **用户体验**：提供流畅的终端交互体验

### 系统目标

- 提供高效的 AI 辅助编程体验
- 支持多种 AI 提供商
- 实现智能工具调用
- 提供完整的会话管理
- 集成 Git 工作流

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI 层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  命令解析器  │  │  配置向导    │  │  交互界面    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                         核心层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  会话管理    │  │  AI 接口     │  │  工具系统    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Git 操作    │  │  项目分析    │  │  MCP 协议    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                         数据层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  SQLite 存储 │  │  文件系统    │  │  Git 仓库    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                         外部服务                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AI 提供商   │  │  MCP 服务器  │  │  HTTP 服务   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 分层说明

#### 1. CLI 层
- **职责**：用户交互、命令解析、配置管理
- **组件**：
  - 命令解析器：解析用户输入和命令
  - 配置向导：引导用户完成初始配置
  - 交互界面：基于 Ink 的终端 UI

#### 2. 核心层
- **职责**：业务逻辑、功能实现
- **组件**：
  - 会话管理：管理对话会话和历史
  - AI 接口：与 AI 提供商交互
  - 工具系统：实现各种工具功能
  - Git 操作：封装 Git 操作
  - 项目分析：分析代码结构
  - MCP 协议：支持外部工具扩展

#### 3. 数据层
- **职责**：数据存储和持久化
- **组件**：
  - SQLite 存储：存储会话和配置
  - 文件系统：读写项目文件
  - Git 仓库：与 Git 仓库交互

#### 4. 外部服务
- **职责**：与外部服务集成
- **组件**：
  - AI 提供商：Anthropic、OpenAI 等
  - MCP 服务器：外部工具服务器
  - HTTP 服务：网络请求服务

---

## 模块说明

### 1. CLI 模块 (`src/cli/`)

#### 文件结构
```
cli/
├── index.ts      # 主入口
└── wizard.ts     # 配置向导
```

#### 功能
- 解析命令行参数
- 初始化应用
- 启动配置向导
- 处理用户交互

#### 关键类
- `CLIApp`: 主应用类
- `ConfigWizard`: 配置向导类

---

### 2. 配置模块 (`src/config/`)

#### 文件结构
```
config/
├── index.ts      # 导出接口
├── manager.ts    # 配置管理器
└── types.ts      # 类型定义
```

#### 功能
- 读取和写入配置
- 配置验证
- 多环境配置支持

#### 关键类
- `ConfigManager`: 配置管理器
- `Config`: 配置类型接口

---

### 3. AI 模块 (`src/core/ai/`)

#### 文件结构
```
ai/
├── index.ts           # 导出接口
├── interface.ts       # AI 接口定义
├── factory.ts         # AI 工厂
└── providers/
    ├── anthropic.ts   # Anthropic 提供商
    ├── openai.ts      # OpenAI 提供商
    ├── google.ts      # Google 提供商
    ├── openrouter.ts  # OpenRouter 提供商
    └── ollama.ts      # Ollama 提供商
```

#### 功能
- 统一的 AI 接口
- 多提供商支持
- 消息处理
- Token 使用统计

#### 关键类
- `AIProvider`: AI 提供商接口
- `AnthropicProvider`: Anthropic 实现
- `OpenAIProvider`: OpenAI 实现
- `AIFactory`: AI 工厂类

#### 接口定义
```typescript
interface AIProvider {
  chat(messages: Message[], tools?: Tool[]): Promise<ChatResponse>;
  stream(messages: Message[], tools?: Tool[]): AsyncIterable<StreamChunk>;
  getModel(): string;
  getUsage(): TokenUsage;
}
```

---

### 4. 工具模块 (`src/core/tools/`)

#### 文件结构
```
tools/
├── index.ts       # 导出接口
├── registry.ts    # 工具注册表
├── file.ts        # 文件工具
├── command.ts     # 命令工具
├── editor.ts      # 编辑器工具
├── search.ts      # 搜索工具
├── browser.ts     # 浏览器工具
└── network.ts     # 网络工具
```

#### 功能
- 工具注册和调用
- 文件操作
- 命令执行
- 代码编辑
- 内容搜索
- 网络请求

#### 关键类
- `ToolRegistry`: 工具注册表
- `FileTool`: 文件工具
- `CommandTool`: 命令工具
- `EditorTool`: 编辑器工具
- `SearchTool`: 搜索工具
- `BrowserTool`: 浏览器工具
- `NetworkTool`: 网络工具

#### 工具接口
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: z.ZodType;
  execute: (params: any) => Promise<ToolResult>;
}
```

---

### 5. 会话模块 (`src/core/session/`)

#### 文件结构
```
session/
├── index.ts       # 导出接口
├── manager.ts     # 会话管理器
├── types.ts       # 类型定义
├── schema.ts      # 数据库模式
└── storage.ts     # 存储实现
```

#### 功能
- 会话创建和管理
- 消息历史存储
- 会话快照
- 会话恢复

#### 关键类
- `SessionManager`: 会话管理器
- `SessionStorage`: 会话存储

#### 数据库模式
```typescript
interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: SessionMetadata;
}
```

---

### 6. Git 模块 (`src/core/git/`)

#### 文件结构
```
git/
├── index.ts       # 导出接口
├── operations.ts  # Git 操作
├── diff.ts        # Diff 处理
└── types.ts       # 类型定义
```

#### 功能
- Git 状态查询
- Git 操作封装
- Diff 生成和展示
- 分支管理

#### 关键类
- `GitOperations`: Git 操作类
- `DiffGenerator`: Diff 生成器

---

### 7. 分析模块 (`src/core/analysis/`)

#### 文件结构
```
analysis/
├── index.ts       # 导出接口
├── analyzer.ts    # 项目分析器
├── types.ts       # 类型定义
├── schema.ts      # 数据库模式
├── indexer.ts     # 代码索引
└── search.ts      # 代码搜索
```

#### 功能
- 项目结构分析
- 代码统计
- 代码索引
- 符号搜索
- 内容搜索

#### 关键类
- `ProjectAnalyzer`: 项目分析器
- `CodeIndexer`: 代码索引器
- `CodeSearcher`: 代码搜索器

---

### 8. MCP 模块 (`src/core/mcp/`)

#### 文件结构
```
mcp/
├── index.ts       # 导出接口
├── client.ts      # MCP 客户端
└── registry.ts    # MCP 注册表
```

#### 功能
- MCP 客户端管理
- 工具服务器连接
- 工具调用代理

#### 关键类
- `MCPClient`: MCP 客户端
- `MCPRegistry`: MCP 注册表

---

### 9. 错误处理模块 (`src/core/errors/`)

#### 文件结构
```
errors/
├── index.ts       # 导出接口
├── handler.ts     # 错误处理器
└── types.ts       # 类型定义
```

#### 功能
- 错误捕获和处理
- 错误日志记录
- 用户友好的错误信息

#### 关键类
- `ErrorHandler`: 错误处理器

---

### 10. 日志模块 (`src/core/logger/`)

#### 文件结构
```
logger/
└── index.ts       # 日志实现
```

#### 功能
- 日志记录
- 日志级别控制
- 日志文件管理

---

### 11. UI 模块 (`src/ui/`)

#### 文件结构
```
ui/
├── index.ts           # 导出接口
├── components/        # UI 组件
├── themes/            # 主题配置
└── shortcuts/
    └── manager.ts     # 快捷键管理
```

#### 功能
- 终端 UI 渲染
- 主题管理
- 快捷键处理
- 交互组件

#### 关键类
- `ThemeManager`: 主题管理器
- `ShortcutManager`: 快捷键管理器

---

## 数据流

### 1. 用户交互流程

```
用户输入
  ↓
CLI 层解析
  ↓
会话管理器
  ↓
AI 接口
  ↓
工具调用
  ↓
结果返回
  ↓
UI 渲染
  ↓
用户
```

### 2. 工具调用流程

```
AI 决定调用工具
  ↓
工具注册表查找
  ↓
工具执行
  ↓
结果返回
  ↓
AI 处理结果
  ↓
生成回复
  ↓
返回给用户
```

### 3. 会话管理流程

```
用户发送消息
  ↓
创建/更新会话
  ↓
存储消息
  ↓
AI 处理
  ↓
更新会话
  ↓
返回回复
  ↓
自动保存（可选）
```

---

## 技术选型

### 核心技术

| 技术 | 用途 | 理由 |
|------|------|------|
| TypeScript | 主要开发语言 | 类型安全，提高代码质量 |
| Node.js | 运行时 | 跨平台，生态丰富 |
| Ink | 终端 UI | React 组件化，易于维护 |
| React | UI 框架 | 组件化，状态管理 |

### AI SDK

| SDK | 用途 | 理由 |
|-----|------|------|
| @anthropic-ai/sdk | Anthropic API | 官方 SDK，功能完整 |
| openai | OpenAI API | 官方 SDK，广泛使用 |
| @google/generative-ai | Google API | 官方 SDK，支持 Gemini |
| @modelcontextprotocol/sdk | MCP 协议 | 标准协议，可扩展 |

### 工具库

| 库 | 用途 | 理由 |
|----|------|------|
| better-sqlite3 | 数据存储 | 高性能，同步 API |
| simple-git | Git 操作 | 简单易用，功能完整 |
| web-tree-sitter | 代码解析 | 高性能，多语言支持 |
| execa | 命令执行 | 跨平台，易用 |
| diff | 差异对比 | 快速，准确 |
| chalk | 终端颜色 | 美化输出 |
| ora | 进度指示 | 用户体验好 |
| inquirer | 交互式输入 | 友好的交互体验 |
| commander | 命令行解析 | 功能强大 |
| zod | 数据验证 | 类型安全 |

---

## 扩展机制

### 1. MCP 协议扩展

TOO-CLI 支持 MCP 协议，可以动态加载外部工具。

#### 配置示例
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]
    }
  ]
}
```

#### 开发自定义工具
1. 创建 MCP 服务器
2. 实现工具接口
3. 在配置中注册服务器

### 2. 自定义 AI 提供商

可以通过实现 `AIProvider` 接口来添加新的 AI 提供商。

#### 示例
```typescript
class CustomProvider implements AIProvider {
  async chat(messages: Message[], tools?: Tool[]): Promise<ChatResponse> {
    // 实现自定义逻辑
  }

  async stream(messages: Message[], tools?: Tool[]): AsyncIterable<StreamChunk> {
    // 实现流式响应
  }

  getModel(): string {
    return "custom-model";
  }

  getUsage(): TokenUsage {
    return { input: 0, output: 0, total: 0 };
  }
}
```

### 3. 自定义工具

可以通过实现 `Tool` 接口来添加自定义工具。

#### 示例
```typescript
const customTool: Tool = {
  name: "custom_tool",
  description: "自定义工具",
  parameters: z.object({
    param1: z.string(),
  }),
  execute: async (params) => {
    // 实现工具逻辑
    return { success: true, data: {} };
  },
};
```

---

## 性能优化

### 1. 代码索引
- 使用 web-tree-sitter 进行高效代码解析
- 增量索引，只更新变更的文件
- 缓存索引结果

### 2. 会话存储
- 使用 SQLite 高效存储
- 批量写入操作
- 定期清理过期会话

### 3. UI 渲染
- 使用 React 虚拟 DOM
- 按需渲染组件
- 防抖和节流

---

## 安全考虑

### 1. API 密钥管理
- 配置文件加密存储
- 环境变量支持
- 不在日志中输出密钥

### 2. 命令执行
- 危险命令黑名单
- 命令执行前确认
- 超时控制

### 3. 文件操作
- 路径验证
- 权限检查
- 操作确认

---

## 未来规划

### 短期目标
- [ ] 添加更多 AI 提供商
- [ ] 改进代码搜索性能
- [ ] 增强会话管理功能

### 中期目标
- [ ] 支持多语言
- [ ] 添加插件系统
- [ ] 改进 UI/UX

### 长期目标
- [ ] Web 版本
- [ ] IDE 插件
- [ ] 云端同步

---

## 参考资源

- [Ink 文档](https://github.com/vadimdemedes/ink)
- [MCP 协议](https://modelcontextprotocol.io/)
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

**最后更新**: 2026-01-13