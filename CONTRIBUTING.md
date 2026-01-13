# TOO-CLI 贡献指南

感谢你对 TOO-CLI 项目的关注！我们欢迎任何形式的贡献。本文档将指导你如何参与到项目中来。

---

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)
- [功能建议](#功能建议)

---

## 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：
- 使用欢迎和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 恶意攻击、侮辱或贬损的评论
- 公开或私下的骚扰
- 未经许可发布他人的私人信息
- 其他不专业或不恰当的行为

---

## 如何贡献

### 贡献方式

1. **报告 Bug**：发现问题时，请创建 Issue
2. **提出功能建议**：有好的想法时，请创建 Feature Request
3. **提交代码**：修复 Bug 或实现新功能
4. **改进文档**：完善项目文档
5. **帮助他人**：在 Issues 中帮助解答问题
6. **分享经验**：分享使用经验和最佳实践

---

## 开发环境设置

### 前置要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: >= 2.0.0
- **编辑器**: 推荐使用 VSCode

### 获取代码

```bash
# 1. Fork 仓库
# 访问 https://github.com/yourusername/too-cli 并点击 Fork 按钮

# 2. 克隆仓库
git clone https://github.com/YOUR_USERNAME/too-cli.git
cd too-cli

# 3. 添加上游仓库
git remote add upstream https://github.com/yourusername/too-cli.git
```

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 开发模式运行
npm run dev

# 构建项目
npm run build

# 监听模式编译
npm run watch

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 推荐的 VSCode 扩展

- ESLint
- Prettier
- TypeScript Importer
- Error Lens
- GitLens

---

## 代码规范

### TypeScript 规范

#### 类型定义
- 为所有函数参数和返回值添加类型注解
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型和交叉类型
- 避免使用 `any`，使用 `unknown` 代替

```typescript
// ✅ 好的做法
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  // 实现
}

// ❌ 不好的做法
async function getUser(id: any): any {
  // 实现
}
```

#### 命名规范
- 类名使用 PascalCase：`class UserManager {}`
- 函数和变量使用 camelCase：`const userName = ''`
- 常量使用 UPPER_SNAKE_CASE：`const MAX_RETRIES = 3`
- 接口使用 PascalCase：`interface UserService {}`
- 类型别名使用 PascalCase：`type UserRole = 'admin' | 'user'`

#### 函数设计
- 单一职责原则
- 函数长度不超过 50 行
- 参数不超过 5 个
- 使用解构参数

```typescript
// ✅ 好的做法
async function createUser({
  name,
  email,
  role = 'user',
}: {
  name: string;
  email: string;
  role?: string;
}): Promise<User> {
  // 实现
}

// ❌ 不好的做法
async function createUser(name, email, role, options, config) {
  // 实现
}
```

#### 错误处理
- 使用 try-catch 处理异步错误
- 抛出自定义错误类型
- 提供有意义的错误信息

```typescript
// ✅ 好的做法
try {
  const user = await getUser(id);
  return user;
} catch (error) {
  throw new UserNotFoundError(`User with id ${id} not found`, error);
}

// ❌ 不好的做法
const user = await getUser(id);
return user;
```

### 代码格式化

项目使用 Prettier 进行代码格式化，请确保提交前运行：

```bash
npm run format
```

### 代码检查

项目使用 ESLint 进行代码检查，请确保提交前运行：

```bash
npm run lint
```

### 类型检查

项目使用 TypeScript 进行类型检查，请确保提交前运行：

```bash
npm run typecheck
```

---

## 提交规范

### Commit Message 格式

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 Bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动

### 示例

```bash
# 新功能
git commit -m "feat(ai): add support for OpenAI provider"

# 修复 Bug
git commit -m "fix(session): resolve session save failure"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(tools): improve tool registry performance"

# 性能优化
git commit -m "perf(indexer): optimize code indexing speed"
```

### Commit Message 最佳实践

- 使用现在时态："add" 而不是 "added" 或 "adds"
- 首字母小写
- 结尾不加句号
- 主题行不超过 50 个字符
- 正文每行不超过 72 个字符
- 详细说明"为什么"和"是什么"，而不是"怎么做"

---

## Pull Request 流程

### 1. 创建分支

```bash
# 从主分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 分支命名规范
feature/xxx   # 新功能
fix/xxx       # 修复 Bug
docs/xxx      # 文档更新
refactor/xxx  # 重构
test/xxx      # 测试相关
```

### 2. 开发和测试

```bash
# 开发你的功能
# ...

# 运行测试
npm test

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 3. 提交代码

```bash
git add .
git commit -m "feat: add your feature description"
```

### 4. 同步上游代码

```bash
git fetch upstream
git rebase upstream/main
```

### 5. 推送到你的仓库

```bash
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

- 访问你的 Fork 仓库
- 点击 "New Pull Request"
- 填写 PR 模板
- 等待代码审查

### Pull Request 模板

```markdown
## 描述
简要描述这个 PR 的目的和内容

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构
- [ ] 性能优化
- [ ] 测试

## 相关 Issue
Closes #(issue number)

## 变更内容
- 列出主要的变更

## 测试
- [ ] 已添加测试
- [ ] 已通过现有测试
- [ ] 已手动测试

## 截图（如果适用）
添加截图说明变更效果

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已通过类型检查
- [ ] 已通过代码检查
- [ ] 已更新文档
- [ ] 已添加测试
```

### 7. 代码审查

- 维护者会审查你的 PR
- 根据反馈进行修改
- 确保所有检查通过
- 等待合并

---

## 问题反馈

### 报告 Bug

在创建 Issue 之前，请先搜索已有的 Issues，避免重复报告。

### Bug Report 模板

```markdown
## Bug 描述
清晰简洁地描述 Bug

## 复现步骤
1. 执行操作 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为
描述你期望发生什么

## 实际行为
描述实际发生了什么

## 截图
如果适用，添加截图

## 环境信息
- OS: [e.g. macOS 14.0]
- Node.js 版本: [e.g. 20.10.0]
- TOO-CLI 版本: [e.g. 0.0.1]

## 额外信息
添加其他相关信息
```

### 问题信息

为了更好地帮助你解决问题，请提供以下信息：
- 完整的错误信息
- 复现步骤
- 配置文件内容（删除敏感信息）
- 环境信息

---

## 功能建议

### 提出新功能

在创建 Feature Request 之前，请先搜索已有的 Issues。

### Feature Request 模板

```markdown
## 功能描述
清晰简洁地描述你想要的功能

## 问题或动机
你为什么需要这个功能？它解决了什么问题？

## 建议的解决方案
详细描述你希望这个功能如何工作

## 替代方案
描述你考虑过的其他替代解决方案

## 额外信息
添加其他相关信息或截图
```

---

## 文档贡献

### 改进文档

如果你发现文档有错误或可以改进的地方：
- 创建分支：`git checkout -b docs/your-doc-change`
- 修改文档
- 提交 PR
- 在 PR 描述中说明文档变更

### 文档规范

- 使用 Markdown 格式
- 保持简洁明了
- 添加适当的代码示例
- 更新相关文档
- 保持格式一致

---

## 测试贡献

### 编写测试

我们欢迎测试贡献：
- 为新功能添加测试
- 为现有功能补充测试
- 修复失败的测试

### 测试规范

```typescript
// 测试文件命名：xxx.test.ts
// 测试套件命名：describe('功能名称', () => {})
// 测试用例命名：it('应该描述测试行为', () => {})

describe('UserManager', () => {
  it('应该成功创建用户', async () => {
    const userManager = new UserManager();
    const user = await userManager.createUser({
      name: 'Test User',
      email: 'test@example.com',
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
  });

  it('应该在用户不存在时抛出错误', async () => {
    const userManager = new UserManager();

    await expect(userManager.getUser('non-existent-id')).rejects.toThrow(
      UserNotFoundError
    );
  });
});
```

---

## 发布流程

### 版本号规范

项目遵循 [语义化版本](https://semver.org/)：
- `MAJOR.MINOR.PATCH`
- MAJOR：不兼容的 API 变更
- MINOR：向后兼容的功能新增
- PATCH：向后兼容的 Bug 修复

### 发布步骤

1. 更新 CHANGELOG.md
2. 更新 package.json 版本号
3. 创建发布标签
4. 推送标签
5. 发布 GitHub Release

---

## 社区

### 获取帮助

- GitHub Issues：报告问题和讨论
- GitHub Discussions：一般讨论和问答
- Pull Requests：代码贡献

### 联系方式

- GitHub: https://github.com/yourusername/too-cli
- Issues: https://github.com/yourusername/too-cli/issues

---

## 许可证

通过贡献代码，你同意你的贡献将在 Apache-2.0 许可证下发布。

---

## 致谢

感谢所有为 TOO-CLI 做出贡献的开发者！

---

**最后更新**: 2026-01-13