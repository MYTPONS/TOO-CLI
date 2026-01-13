# TOO-CLI 配置说明

本文档详细说明 TOO-CLI 的所有配置选项和使用方法。

---

## 目录

- [配置文件位置](#配置文件位置)
- [配置文件格式](#配置文件格式)
- [AI 提供商配置](#ai-提供商配置)
- [主题配置](#主题配置)
- [会话配置](#会话配置)
- [工具配置](#工具配置)
- [UI 配置](#ui-配置)
- [日志配置](#日志配置)
- [上下文配置](#上下文配置)
- [MCP 配置](#mcp-配置)
- [配置示例](#配置示例)
- [环境变量](#环境变量)

---

## 配置文件位置

TOO-CLI 的配置文件默认位于：

```
~/.too/config.json
```

其中 `~` 代表用户主目录：
- Linux/macOS: `/home/username/` 或 `/Users/username/`
- Windows: `C:\Users\username\`

### 自定义配置文件位置

可以通过环境变量 `TOO_CONFIG_PATH` 指定自定义配置文件位置：

```bash
export TOO_CONFIG_PATH=/path/to/custom/config.json
```

---

## 配置文件格式

配置文件使用 JSON 格式：

```json
{
  "provider": "anthropic",
  "anthropic": {
    "apiKey": "your-api-key",
    "model": "claude-3-5-sonnet-20241022"
  },
  "theme": {
    "primaryColor": "#FF6B00",
    "secondaryColor": "#2D2D2D",
    "textColor": "#FFFFFF",
    "accentColor": "#FF8C42"
  },
  "enableBrowser": false,
  "autoSaveSessions": true,
  "maxContextRounds": 10
}
```

---

## AI 提供商配置

### Anthropic (Claude)

```json
{
  "provider": "anthropic",
  "anthropic": {
    "apiKey": "sk-ant-api03-...",
    "model": "claude-3-5-sonnet-20241022",
    "baseUrl": "https://api.anthropic.com",
    "maxTokens": 8192,
    "temperature": 0.7
  }
}
```

#### 支持的模型

- `claude-3-5-sonnet-20241022` - 推荐，平衡性能和成本
- `claude-3-opus-20240229` - 最强性能，成本较高
- `claude-3-haiku-20240307` - 最快响应，成本最低

#### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | 必填 | Anthropic API 密钥 |
| model | string | claude-3-5-sonnet-20241022 | 使用的模型 |
| baseUrl | string | https://api.anthropic.com | API 基础 URL |
| maxTokens | number | 8192 | 最大输出 token 数 |
| temperature | number | 0.7 | 温度参数（0-1） |

---

### OpenAI (GPT)

```json
{
  "provider": "openai",
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4",
    "baseUrl": "https://api.openai.com/v1",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

#### 支持的模型

- `gpt-4` - 最强性能
- `gpt-4-turbo` - 更快更便宜
- `gpt-3.5-turbo` - 最快响应，成本最低

#### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | 必填 | OpenAI API 密钥 |
| model | string | gpt-4 | 使用的模型 |
| baseUrl | string | https://api.openai.com/v1 | API 基础 URL |
| maxTokens | number | 4096 | 最大输出 token 数 |
| temperature | number | 0.7 | 温度参数（0-1） |

---

### Google (Gemini)

```json
{
  "provider": "google",
  "google": {
    "apiKey": "your-api-key",
    "model": "gemini-pro",
    "maxTokens": 8192,
    "temperature": 0.7
  }
}
```

#### 支持的模型

- `gemini-pro` - 通用模型
- `gemini-pro-vision` - 支持图像

#### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | 必填 | Google API 密钥 |
| model | string | gemini-pro | 使用的模型 |
| maxTokens | number | 8192 | 最大输出 token 数 |
| temperature | number | 0.7 | 温度参数（0-1） |

---

### OpenRouter

```json
{
  "provider": "openrouter",
  "openrouter": {
    "apiKey": "sk-or-v1-...",
    "model": "anthropic/claude-3.5-sonnet",
    "maxTokens": 8192,
    "temperature": 0.7
  }
}
```

#### 支持的模型

OpenRouter 支持多种模型，格式为 `provider/model-name`：
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4`
- `google/gemini-pro`
- 等

#### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | 必填 | OpenRouter API 密钥 |
| model | string | anthropic/claude-3.5-sonnet | 使用的模型 |
| maxTokens | number | 8192 | 最大输出 token 数 |
| temperature | number | 0.7 | 温度参数（0-1） |

---

### Ollama (本地模型)

```json
{
  "provider": "ollama",
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

#### 支持的模型

取决于本地安装的 Ollama 模型：
- `llama3`
- `mistral`
- `codellama`
- 等

#### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| baseUrl | string | http://localhost:11434 | Ollama 服务地址 |
| model | string | llama3 | 使用的模型 |
| maxTokens | number | 4096 | 最大输出 token 数 |
| temperature | number | 0.7 | 温度参数（0-1） |

---

## 主题配置

```json
{
  "theme": {
    "primaryColor": "#FF6B00",
    "secondaryColor": "#2D2D2D",
    "textColor": "#FFFFFF",
    "accentColor": "#FF8C42",
    "backgroundColor": "#1E1E1E",
    "borderColor": "#3E3E3E",
    "successColor": "#4CAF50",
    "errorColor": "#F44336",
    "warningColor": "#FF9800",
    "infoColor": "#2196F3"
  }
}
```

### 颜色说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| primaryColor | string | #FF6B00 | 主色调 |
| secondaryColor | string | #2D2D2D | 次要色调 |
| textColor | string | #FFFFFF | 文本颜色 |
| accentColor | string | #FF8C42 | 强调色 |
| backgroundColor | string | #1E1E1E | 背景颜色 |
| borderColor | string | #3E3E3E | 边框颜色 |
| successColor | string | #4CAF50 | 成功提示颜色 |
| errorColor | string | #F44336 | 错误提示颜色 |
| warningColor | string | #FF9800 | 警告提示颜色 |
| infoColor | string | #2196F3 | 信息提示颜色 |

### 预设主题

```json
{
  "theme": "dark"  // 或 "light"
}
```

---

## 会话配置

```json
{
  "autoSaveSessions": true,
  "maxContextRounds": 10,
  "sessionStoragePath": "~/.too/sessions",
  "maxSessions": 100
}
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| autoSaveSessions | boolean | true | 自动保存会话 |
| maxContextRounds | number | 10 | 最大上下文轮数 |
| sessionStoragePath | string | ~/.too/sessions | 会话存储路径 |
| maxSessions | number | 100 | 最大会话数 |

---

## 工具配置

```json
{
  "enableBrowser": false,
  "enableGit": true,
  "enableAnalysis": true,
  "dangerousCommands": [
    "rm",
    "rmdir",
    "del",
    "remove",
    "shutdown",
    "reboot",
    "poweroff",
    "halt",
    "format",
    "fdisk",
    "mkfs",
    "dd",
    "chmod 777",
    "chown",
    "kill",
    "pkill",
    "killall",
    "sudo",
    "su",
    "> /dev",
    ":(){:|:&};:"
  ],
  "autoApprove": {
    "readFiles": true,
    "editFiles": false,
    "commands": false,
    "deleteFiles": false
  },
  "commandTimeout": 60000
}
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enableBrowser | boolean | false | 启用浏览器自动化 |
| enableGit | boolean | true | 启用 Git 工具 |
| enableAnalysis | boolean | true | 启用项目分析 |
| dangerousCommands | array | [默认列表] | 危险命令黑名单 |
| autoApprove | object | {...} | 自动批准设置 |
| commandTimeout | number | 60000 | 命令超时时间（毫秒） |

### autoApprove 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| readFiles | boolean | true | 自动批准读取文件 |
| editFiles | boolean | false | 自动批准编辑文件 |
| commands | boolean | false | 自动批准执行命令 |
| deleteFiles | boolean | false | 自动批准删除文件 |

---

## UI 配置

```json
{
  "ui": {
    "showThinking": true,
    "showTokenCount": true,
    "enableSyntaxHighlighting": true,
    "enableCompletion": true,
    "enableShortcuts": true
  }
}
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showThinking | boolean | true | 显示 AI 思考过程 |
| showTokenCount | boolean | true | 显示 token 使用量 |
| enableSyntaxHighlighting | boolean | true | 启用语法高亮 |
| enableCompletion | boolean | true | 启用命令补全 |
| enableShortcuts | boolean | true | 启用快捷键 |

---

## 日志配置

```json
{
  "logging": {
    "level": "info",
    "file": "~/.too/logs/too-cli.log",
    "maxSize": "10m",
    "maxFiles": 5
  }
}
```

### 日志级别

| 级别 | 说明 |
|------|------|
| error | 只记录错误 |
| warn | 记录警告和错误 |
| info | 记录信息、警告和错误（默认） |
| debug | 记录调试信息 |
| trace | 记录所有信息 |

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| level | string | info | 日志级别 |
| file | string | ~/.too/logs/too-cli.log | 日志文件路径 |
| maxSize | string | 10m | 单个日志文件最大大小 |
| maxFiles | number | 5 | 保留的日志文件数量 |

---

## 上下文配置

```json
{
  "context": {
    "compressionThreshold": 100000,
    "keepRecentTurns": 5,
    "maxContextSize": 200000
  }
}
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| compressionThreshold | number | 100000 | 压缩阈值（字符数） |
| keepRecentTurns | number | 5 | 保留的最近对话轮数 |
| maxContextSize | number | 200000 | 最大上下文大小（字符数） |

---

## MCP 配置

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  ]
}
```

### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | MCP 服务器名称 |
| command | string | 启动命令 |
| args | array | 命令参数 |

### 常用 MCP 服务器

#### 文件系统服务器

```json
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
}
```

#### GitHub 服务器

```json
{
  "name": "github",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"]
}
```

#### SQLite 服务器

```json
{
  "name": "sqlite",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
}
```

---

## 配置示例

### 最小配置

```json
{
  "provider": "anthropic",
  "anthropic": {
    "apiKey": "your-api-key"
  }
}
```

### 完整配置

```json
{
  "provider": "anthropic",
  "anthropic": {
    "apiKey": "sk-ant-api03-...",
    "model": "claude-3-5-sonnet-20241022",
    "baseUrl": "https://api.anthropic.com",
    "maxTokens": 8192,
    "temperature": 0.7
  },
  "theme": {
    "primaryColor": "#FF6B00",
    "secondaryColor": "#2D2D2D",
    "textColor": "#FFFFFF",
    "accentColor": "#FF8C42",
    "backgroundColor": "#1E1E1E",
    "borderColor": "#3E3E3E",
    "successColor": "#4CAF50",
    "errorColor": "#F44336",
    "warningColor": "#FF9800",
    "infoColor": "#2196F3"
  },
  "enableBrowser": false,
  "autoSaveSessions": true,
  "maxContextRounds": 10,
  "sessionStoragePath": "~/.too/sessions",
  "maxSessions": 100,
  "dangerousCommands": [
    "rm",
    "rmdir",
    "del",
    "remove"
  ],
  "autoApprove": {
    "readFiles": true,
    "editFiles": false,
    "commands": false,
    "deleteFiles": false
  },
  "commandTimeout": 60000,
  "ui": {
    "showThinking": true,
    "showTokenCount": true,
    "enableSyntaxHighlighting": true,
    "enableCompletion": true,
    "enableShortcuts": true
  },
  "logging": {
    "level": "info",
    "file": "~/.too/logs/too-cli.log",
    "maxSize": "10m",
    "maxFiles": 5
  },
  "context": {
    "compressionThreshold": 100000,
    "keepRecentTurns": 5,
    "maxContextSize": 200000
  },
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    }
  ]
}
```

---

## 环境变量

除了配置文件，TOO-CLI 还支持通过环境变量设置配置：

| 环境变量 | 说明 | 示例 |
|----------|------|------|
| TOO_CONFIG_PATH | 配置文件路径 | `/path/to/config.json` |
| TOO_PROVIDER | AI 提供商 | `anthropic` |
| ANTHROPIC_API_KEY | Anthropic API 密钥 | `sk-ant-api03-...` |
| OPENAI_API_KEY | OpenAI API 密钥 | `sk-...` |
| GOOGLE_API_KEY | Google API 密钥 | `your-api-key` |
| OPENROUTER_API_KEY | OpenRouter API 密钥 | `sk-or-v1-...` |
| TOO_LOG_LEVEL | 日志级别 | `info` |
| TOO_THEME | 主题 | `dark` |

### 使用环境变量

```bash
# Linux/macOS
export ANTHROPIC_API_KEY="sk-ant-api03-..."
export TOO_LOG_LEVEL="debug"

# Windows PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-api03-..."
$env:TOO_LOG_LEVEL="debug"

# Windows CMD
set ANTHROPIC_API_KEY=sk-ant-api03-...
set TOO_LOG_LEVEL=debug
```

---

## 配置验证

TOO-CLI 会在启动时验证配置文件的有效性。如果配置有误，会显示错误信息。

### 常见配置错误

1. **JSON 格式错误**
   - 确保使用有效的 JSON 格式
   - 检查引号、逗号、括号

2. **API 密钥无效**
   - 检查 API 密钥是否正确
   - 确认 API 密钥是否有效

3. **模型名称错误**
   - 检查模型名称是否正确
   - 确认模型是否可用

4. **路径错误**
   - 确保路径存在
   - 使用绝对路径或正确的相对路径

---

## 配置重置

如果配置出现问题，可以重置配置：

```bash
# 删除配置文件
rm ~/.too/config.json

# 重新运行配置向导
too
```

---

**最后更新**: 2026-01-13