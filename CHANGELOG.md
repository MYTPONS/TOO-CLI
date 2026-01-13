# TOO-CLI 变更日志

本文档记录 TOO-CLI 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 计划中
- 支持更多 AI 提供商
- 改进代码搜索性能
- 添加插件系统
- 支持多语言
- Web 版本开发

---

## [0.0.1] - 2026-01-13

### 新增

#### 核心功能
- ✅ AI 对话和代码生成
- ✅ 文件操作工具（读取、创建、编辑、diff 预览）
- ✅ 终端命令执行
- ✅ Git 完整集成（status、add、commit、branch、log、diff、pull、push）
- ✅ 多 AI 提供商支持（Anthropic、OpenAI、Google、OpenRouter、Ollama）
- ✅ 项目代码库分析
- ✅ 会话历史和快照
- ✅ 纯推理模型兼容

#### 会话管理
- ✅ 会话创建和管理
- ✅ 会话保存和恢复
- ✅ 会话快照功能
- ✅ 会话历史查看
- ✅ 自动保存会话

#### Git 集成
- ✅ Git 状态查询（git_status）
- ✅ 文件添加到暂存区（git_add）
- ✅ 提交更改（git_commit）
- ✅ 查看差异（git_diff）
- ✅ 分支管理（git_branch）
- ✅ 查看提交历史（git_log）
- ✅ 拉取和推送（git_pull、git_push）

#### 项目分析
- ✅ 项目结构分析（analyze_project）
- ✅ 代码统计
- ✅ 依赖分析
- ✅ 代码索引
- ✅ 代码搜索（文件、符号、内容）

#### 文件工具
- ✅ 读取文件（read_file）
- ✅ 写入文件（write_file）
- ✅ 列出目录文件（list_files）
- ✅ 编辑文件（edit_file，支持 diff 预览）
- ✅ 文件内容搜索（search_files，支持 riprep/grep）

#### 网络工具
- ✅ HTTP 请求工具（http_request）
- ✅ 访问网页（visit_page）
- ✅ 浏览器自动化

#### 系统功能
- ✅ 错误处理系统
- ✅ 日志系统
- ✅ 快捷键系统
- ✅ 命令补全
- ✅ 语法高亮
- ✅ Diff 可视化
- ✅ 配置向导
- ✅ 主题管理

#### MCP 协议
- ✅ MCP 客户端支持
- ✅ MCP 工具注册
- ✅ 动态加载外部工具

#### 文档
- ✅ 详细的 README.md
- ✅ 架构文档（ARCHITECTURE.md）
- ✅ 贡献指南（CONTRIBUTING.md）
- ✅ 变更日志（CHANGELOG.md）
- ✅ 配置说明（CONFIG.md）

### 优化

#### 性能
- 优化代码索引性能
- 改进会话存储效率
- 优化 UI 渲染性能

#### 用户体验
- 改进配置向导流程
- 优化错误提示信息
- 改进命令补全体验
- 增强 diff 可视化效果

### 修复

- 修复会话保存时的数据丢失问题
- 修复 Git 操作在某些情况下的失败问题
- 修复文件搜索的性能问题
- 修复命令执行的权限问题
- 修复终端 UI 的显示问题

### 技术栈

#### 核心依赖
- TypeScript 5.4.5
- Node.js 18+
- Ink 4.4.1
- React 18.3.1

#### AI SDK
- @anthropic-ai/sdk 0.37.0
- openai 4.80.0
- @google/generative-ai 0.21.0
- @modelcontextprotocol/sdk 1.25.1

#### 工具库
- better-sqlite3 12.4.1
- simple-git 3.27.0
- web-tree-sitter 0.22.6
- execa 9.5.2
- diff 7.0.0
- chalk 5.4.1
- ora 8.1.1
- inquirer 12.5.0
- commander 12.1.0
- zod 3.24.2

### 已知问题

- 浏览器自动化在某些环境下可能不稳定
- 大型项目的代码索引可能需要较长时间
- 某些 AI 提供商的流式响应可能存在延迟

### 破坏性变更

无

---

## 版本说明

### 版本号格式

TOO-CLI 遵循语义化版本规范：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的 Bug 修复

### 发布周期

- **主版本**：不定期，重大更新时发布
- **次版本**：每月或每两月，新功能发布
- **修订版本**：随时，Bug 修复

### 版本标签

- `stable`：稳定版本，推荐生产环境使用
- `beta`：测试版本，包含新功能但可能不稳定
- `alpha`：早期版本，功能不完整，仅供测试

---

## 贡献者

感谢以下贡献者对本项目的贡献：

- @ama - 项目创建者和主要开发者

如果你也想成为贡献者，请查看 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 变更类型说明

| 类型 | 说明 |
|------|------|
| 新增 | 新功能 |
| 变更 | 现有功能的变更 |
| 弃用 | 即将移除的功能 |
| 移除 | 已移除的功能 |
| 修复 | Bug 修复 |
| 安全 | 安全相关的修复 |

---

## 反馈

如果你有任何问题或建议，请：

- 提交 [Issue](https://github.com/yourusername/too-cli/issues)
- 参与 [Discussions](https://github.com/yourusername/too-cli/discussions)
- 提交 [Pull Request](https://github.com/yourusername/too-cli/pulls)

---

**最后更新**: 2026-01-13