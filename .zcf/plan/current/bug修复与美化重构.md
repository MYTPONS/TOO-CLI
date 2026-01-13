# too-cli Bug 修复与美化重构计划

## 任务概述

对 too-cli 项目进行整体 bug 修复和 UI 美化重构，采用渐进式重构方案。

## 一、Bug 修复

### 1.1 config/types.ts - theme 默认值问题

**问题**：`theme` 对象缺少 `.default()`，当配置文件中没有 theme 字段时可能导致验证失败

**修复**：
```typescript
// 修改前
theme: z.object({
  primaryColor: z.string().default('#FF6B00'),
  // ...
}),

// 修改后
theme: z.object({
  primaryColor: z.string().default('#FF6B00'),
  // ...
}).default({
  primaryColor: '#FF6B00',
  secondaryColor: '#2D2D2D',
  textColor: '#FFFFFF',
  accentColor: '#FF8C42',
}),
```

### 1.2 google.ts - chat 方法消息重复

**问题**：history 包含所有消息后又发送最后一条，导致重复

**修复**：
```typescript
// 修改前
const chat = model.startChat({
  history: userMessages.map((m) => ({ ... })),
  // ...
});
const result = await chat.sendMessage(userMessages[userMessages.length - 1].content);

// 修改后
const chat = model.startChat({
  history: userMessages.slice(0, -1).map((m) => ({ ... })),
  // ...
});
const result = await chat.sendMessage(userMessages[userMessages.length - 1].content);
```

### 1.3 google.ts - usage 计算错误

**问题**：inputTokens 错误使用了 totalTokenCount

**修复**：
```typescript
// 修改前
inputTokens: response.usageMetadata?.totalTokenCount || 0,

// 修改后
inputTokens: response.usageMetadata?.promptTokenCount || 0,
```

### 1.4 openai.ts - 流式工具调用参数解析

**问题**：分块传输时 JSON.parse 可能失败，需要累积完整 JSON

**修复**：使用累积字符串方式收集参数，在流结束时统一解析

### 1.5 command.ts - 流式执行选项

**问题**：execa 的 onStdout/onStderr 不是有效选项

**修复**：使用 subprocess.stdout.on('data') 方式处理流式输出

### 1.6 manager.ts - console 输出

**问题**：在 Ink 应用中使用 console 会干扰 UI

**修复**：移除 console.error 和 console.info 调用，改为静默处理或返回错误

## 二、美化重构

### 2.1 扩展主题系统

**文件**：`src/ui/themes/index.ts`（新建）

**内容**：
- 扩展颜色语义：info、muted、border、highlight
- 添加间距常量：spacing
- 添加边框样式常量：borders

### 2.2 创建 UI 组件

#### StatusBar 组件
**文件**：`src/ui/components/StatusBar.tsx`

**功能**：
- 显示当前 AI 提供商和模型
- 显示连接状态
- 显示 token 使用统计
- 显示帮助提示

#### MessageList 组件
**文件**：`src/ui/components/MessageList.tsx`

**功能**：
- 区分用户/助手消息样式
- 支持消息时间戳
- 支持代码块高亮显示
- 支持滚动显示

#### InputBox 组件
**文件**：`src/ui/components/InputBox.tsx`

**功能**：
- 光标闪烁效果
- 多行输入支持
- 输入提示文字
- 命令自动补全提示

#### Spinner 组件
**文件**：`src/ui/components/Spinner.tsx`

**功能**：
- 加载动画（使用字符动画，无表情包）
- 可自定义文字
- 支持不同状态（加载中、成功、失败）

### 2.3 重构 App.tsx

**布局结构**：
```
+------------------------------------------+
|  TOO-CLI - AI 编程助手                    |  <- 标题栏
+------------------------------------------+
|  [anthropic] claude-3-5-sonnet | 已连接   |  <- 状态栏
+------------------------------------------+
|                                          |
|  你: 你好                                 |  <- 消息区
|                                          |
|  助手: 你好！有什么可以帮助你的？          |
|                                          |
|  [加载中...]                              |  <- 加载指示
|                                          |
+------------------------------------------+
|  > 输入消息...                            |  <- 输入框
+------------------------------------------+
|  /help 帮助 | /exit 退出 | Ctrl+C 中断    |  <- 帮助栏
+------------------------------------------+
```

**集成 AI 核心**：
- 连接 AIProviderFactory
- 实现消息发送和接收
- 实现流式响应显示
- 实现工具调用显示

## 三、文件变更清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | src/config/types.ts |
| 修改 | src/config/manager.ts |
| 修改 | src/core/ai/providers/google.ts |
| 修改 | src/core/ai/providers/openai.ts |
| 修改 | src/core/tools/command.ts |
| 新建 | src/ui/themes/index.ts |
| 新建 | src/ui/components/StatusBar.tsx |
| 新建 | src/ui/components/MessageList.tsx |
| 新建 | src/ui/components/InputBox.tsx |
| 新建 | src/ui/components/Spinner.tsx |
| 修改 | src/ui/App.tsx |
| 修改 | src/ui/index.ts |

## 四、预期结果

1. 所有已识别的 bug 得到修复
2. UI 界面更加专业、层次分明
3. 用户体验显著提升（状态反馈、加载动画、帮助提示）
4. AI 核心与 UI 正确集成，可以进行实际对话
5. 代码结构更清晰，便于后续维护
