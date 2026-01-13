import type { Tool } from '../ai/interface.js';
import * as fileTools from './file.js';
import * as commandTools from './command.js';
import * as browserTools from './browser.js';
import { getGitManager } from '../git/operations.js';
import { getDiffManager } from '../git/diff.js';
import { getAnalyzer } from '../analysis/analyzer.js';
import { getSearcher } from '../analysis/search.js';
import { editFile } from './editor.js';
import { searchInFiles } from './search.js';
import { httpRequest } from './network.js';

// 工具执行结果
export interface ToolExecutionResult {
  toolName: string;
  output: string;
  isError?: boolean;
}

// 工具注册表
export const toolRegistry: Record<string, Tool> = {
  read_file: {
    name: 'read_file',
    description: '读取文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '文件路径',
        },
      },
      required: ['filePath'],
    },
  },

  write_file: {
    name: 'write_file',
    description: '写入文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '文件路径',
        },
        content: {
          type: 'string',
          description: '文件内容',
        },
      },
      required: ['filePath', 'content'],
    },
  },

  list_files: {
    name: 'list_files',
    description: '列出目录中的文件',
    inputSchema: {
      type: 'object',
      properties: {
        dirPath: {
          type: 'string',
          description: '目录路径',
        },
        recursive: {
          type: 'boolean',
          description: '是否递归列出子目录',
        },
      },
      required: ['dirPath'],
    },
  },

  execute_command: {
    name: 'execute_command',
    description: '执行终端命令',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '命令名称',
        },
        args: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '命令参数',
        },
        cwd: {
          type: 'string',
          description: '工作目录',
        },
      },
      required: ['command'],
    },
  },

  visit_page: {
    name: 'visit_page',
    description: '访问网页并执行操作',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '网页 URL',
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['click', 'type', 'scroll', 'wait'],
              },
              selector: {
                type: 'string',
              },
              text: {
                type: 'string',
              },
              amount: {
                type: 'number',
              },
              time: {
                type: 'number',
              },
            },
          },
          description: '要执行的操作',
        },
      },
      required: ['url'],
    },
  },

  git_status: {
    name: 'git_status',
    description: '获取 Git 仓库状态',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: {
          type: 'string',
          description: '工作目录',
        },
      },
    },
  },

  git_add: {
    name: 'git_add',
    description: '添加文件到 Git 暂存区',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'string',
          description: '文件路径或模式（如：. 表示所有文件）',
        },
      },
      required: ['files'],
    },
  },

  git_commit: {
    name: 'git_commit',
    description: '提交 Git 更改',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '提交信息',
        },
      },
      required: ['message'],
    },
  },

  git_diff: {
    name: 'git_diff',
    description: '查看 Git 差异',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '文件路径（可选，不指定则显示所有差异）',
        },
        staged: {
          type: 'boolean',
          description: '是否查看暂存区的差异',
        },
      },
    },
  },

  git_branch: {
    name: 'git_branch',
    description: '获取或创建 Git 分支',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'create', 'checkout', 'delete'],
          description: '操作类型',
        },
        name: {
          type: 'string',
          description: '分支名称',
        },
        force: {
          type: 'boolean',
          description: '是否强制操作',
        },
      },
      required: ['action'],
    },
  },

  git_log: {
    name: 'git_log',
    description: '查看 Git 提交历史',
    inputSchema: {
      type: 'object',
      properties: {
        maxCount: {
          type: 'number',
          description: '最大显示数量',
        },
      },
    },
  },

  analyze_project: {
    name: 'analyze_project',
    description: '分析项目结构和代码统计',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径（默认为当前目录）',
        },
      },
    },
  },

  search_code: {
    name: 'search_code',
    description: '搜索代码（文件、符号、内容）',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询',
        },
        type: {
          type: 'string',
          enum: ['file', 'symbol', 'content', 'all'],
          description: '搜索类型',
        },
        language: {
          type: 'string',
          description: '过滤语言',
        },
        maxResults: {
          type: 'number',
          description: '最大结果数',
        },
      },
      required: ['query'],
    },
  },

  edit_file: {
    name: 'edit_file',
    description: '编辑文件内容（支持 diff 预览）',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '文件路径',
        },
        content: {
          type: 'string',
          description: '新内容',
        },
        createIfNotExists: {
          type: 'boolean',
          description: '文件不存在时是否创建',
        },
        backup: {
          type: 'boolean',
          description: '是否创建备份',
        },
      },
      required: ['filePath', 'content'],
    },
  },

  search_files: {
    name: 'search_files',
    description: '在文件中搜索内容（使用 ripgrep/grep）',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '搜索模式',
        },
        directory: {
          type: 'string',
          description: '搜索目录',
        },
        filePattern: {
          type: 'string',
          description: '文件模式（如 *.js）',
        },
        caseSensitive: {
          type: 'boolean',
          description: '是否区分大小写',
        },
        maxResults: {
          type: 'number',
          description: '最大结果数',
        },
      },
      required: ['pattern'],
    },
  },

  http_request: {
    name: 'http_request',
    description: '发送 HTTP 请求',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '请求 URL',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP 方法',
        },
        headers: {
          type: 'object',
          description: '请求头',
        },
        body: {
          type: 'object',
          description: '请求体',
        },
      },
      required: ['url'],
    },
  },
};

// 工具执行器
export async function executeTool(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case 'read_file': {
        const result = await fileTools.readFile(args.filePath);
        return {
          toolName,
          output: JSON.stringify(result),
        };
      }

      case 'write_file': {
        await fileTools.writeFile(args.filePath, args.content);
        return {
          toolName,
          output: '文件写入成功',
        };
      }

      case 'list_files': {
        const files = await fileTools.listFiles(args.dirPath, args.recursive);
        return {
          toolName,
          output: JSON.stringify(files),
        };
      }

      case 'execute_command': {
        const result = await commandTools.executeCommand(args.command, args.args, {
          cwd: args.cwd,
        });
        return {
          toolName,
          output: JSON.stringify(result),
          isError: !result.success,
        };
      }

      case 'visit_page': {
        const result = await browserTools.visitPage(args.url, args.actions);
        return {
          toolName,
          output: JSON.stringify({
            url: result.url,
            title: result.title,
            screenshot: result.screenshot ? '[截图已生成]' : null,
            consoleLogs: result.consoleLogs,
          }),
        };
      }

      case 'git_status': {
        const git = getGitManager(args.cwd);
        const result = await git.getStatus();
        if (result.success && result.data) {
          const status = result.data;
          let output = `分支: ${status.branch}\n`;
          if (status.ahead > 0) output += `领先 ${status.ahead} 个提交\n`;
          if (status.behind > 0) output += `落后 ${status.behind} 个提交\n`;
          if (status.staged.length > 0) {
            output += '\n已暂存:\n';
            for (const file of status.staged) {
              output += `  ${file.status} ${file.path}\n`;
            }
          }
          if (status.unstaged.length > 0) {
            output += '\n未暂存:\n';
            for (const file of status.unstaged) {
              output += `  ${file.status} ${file.path}\n`;
            }
          }
          if (status.untracked.length > 0) {
            output += '\n未跟踪:\n';
            for (const file of status.untracked) {
              output += `  ${file}\n`;
            }
          }
          return { toolName, output };
        }
        return { toolName, output: result.error || '获取状态失败', isError: true };
      }

      case 'git_add': {
        const git = getGitManager();
        const result = await git.add(args.files);
        if (result.success) {
          return { toolName, output: `已添加: ${args.files}` };
        }
        return { toolName, output: result.error || '添加失败', isError: true };
      }

      case 'git_commit': {
        const git = getGitManager();
        const result = await git.commit({ message: args.message });
        if (result.success) {
          return { toolName, output: `提交成功: ${result.data}` };
        }
        return { toolName, output: result.error || '提交失败', isError: true };
      }

      case 'git_diff': {
        const diffManager = getDiffManager();
        if (args.filePath) {
          const result = await diffManager.getFileDiff(args.filePath, args.staged);
          if (result.success && result.data) {
            return { toolName, output: diffManager.formatDiff(result.data) };
          }
        } else {
          const result = args.staged
            ? await diffManager.getStagedDiff()
            : await diffManager.getWorkingDiff();
          if (result.success && result.data) {
            let output = '';
            for (const diff of result.data) {
              output += diffManager.formatDiff(diff) + '\n\n';
            }
            return { toolName, output };
          }
        }
        return { toolName, output: '获取差异失败', isError: true };
      }

      case 'git_branch': {
        const git = getGitManager();
        if (args.action === 'list') {
          const result = await git.getBranches();
          if (result.success && result.data) {
            let output = '分支列表:\n';
            for (const branch of result.data) {
              const prefix = branch.isCurrent ? '* ' : '  ';
              const remote = branch.isRemote ? ' (remote)' : '';
              output += `${prefix}${branch.name}${remote}\n`;
            }
            return { toolName, output };
          }
        } else if (args.action === 'create' && args.name) {
          const result = await git.createBranch(args.name);
          return result.success
            ? { toolName, output: `分支已创建: ${args.name}` }
            : { toolName, output: result.error || '创建失败', isError: true };
        } else if (args.action === 'checkout' && args.name) {
          const result = await git.checkout(args.name);
          return result.success
            ? { toolName, output: `已切换到: ${args.name}` }
            : { toolName, output: result.error || '切换失败', isError: true };
        } else if (args.action === 'delete' && args.name) {
          const result = await git.deleteBranch(args.name, args.force);
          return result.success
            ? { toolName, output: `分支已删除: ${args.name}` }
            : { toolName, output: result.error || '删除失败', isError: true };
        }
        return { toolName, output: '操作失败', isError: true };
      }

      case 'git_log': {
        const git = getGitManager();
        const result = await git.getLog(args.maxCount || 20);
        if (result.success && result.data) {
          let output = '提交历史:\n';
          for (const commit of result.data) {
            output += `${commit.hash} ${commit.author} ${commit.date.toLocaleString('zh-CN')}\n`;
            output += `    ${commit.message}\n\n`;
          }
          return { toolName, output };
        }
        return { toolName, output: result.error || '获取历史失败', isError: true };
      }

      case 'analyze_project': {
        const analyzer = getAnalyzer();
        const projectPath = args.projectPath || process.cwd();
        const result = await analyzer.analyzeProject(projectPath);
        return { toolName, output: analyzer.formatAnalysisResult(result) };
      }

      case 'search_code': {
        const searcher = getSearcher();
        const result = await searcher.search({
          query: args.query,
          type: args.type || 'all',
          language: args.language,
          maxResults: args.maxResults || 20,
        });

        let output = `搜索结果 (${result.length}):\n\n`;
        for (const item of result) {
          output += `[${item.type}] ${item.path}\n`;
          if (item.line) {
            output += `  行 ${item.line}: ${item.match}\n`;
          } else {
            output += `  匹配: ${item.match}\n`;
          }
          if (item.context) {
            output += `  ${item.context}\n`;
          }
          output += '\n';
        }

        return { toolName, output };
      }

      case 'edit_file': {
        const result = await editFile(args.filePath, args.content, {
          createIfNotExists: args.createIfNotExists,
          backup: args.backup,
        });

        let output = result.message;
        if (result.diff) {
          output += '\n\n变更:\n' + result.diff;
        }

        return {
          toolName,
          output,
          isError: !result.success,
        };
      }

      case 'search_files': {
        const result = await searchInFiles(args.pattern, {
          directory: args.directory,
          filePattern: args.filePattern,
          caseSensitive: args.caseSensitive,
          maxResults: args.maxResults || 50,
        });

        if (!result.success) {
          return {
            toolName,
            output: result.message,
            isError: true,
          };
        }

        let output = `搜索结果 (${result.results.length}):\n\n`;
        for (const match of result.results) {
          output += `${match.file}:${match.line}\n`;
          output += `  ${match.content}\n`;
          if (match.context && match.context.length > 0) {
            output += `  上下文:\n${match.context.map(c => `    ${c}`).join('\n')}\n`;
          }
          output += '\n';
        }

        return { toolName, output };
      }

      case 'http_request': {
        const result = await httpRequest(args.url, {
          method: args.method || 'GET',
          headers: args.headers,
          body: args.body,
        });

        if (!result.success) {
          return {
            toolName,
            output: result.error || '请求失败',
            isError: true,
          };
        }

        let output = `状态: ${result.response!.status} ${result.response!.statusText}\n`;
        output += `\n响应头:\n`;
        for (const [key, value] of Object.entries(result.response!.headers)) {
          output += `  ${key}: ${value}\n`;
        }
        output += `\n响应体:\n${result.response!.body}`;

        return { toolName, output };
      }

      default:
        throw new Error(`未知工具: ${toolName}`);
    }
  } catch (error) {
    return {
      toolName,
      output: (error as Error).message,
      isError: true,
    };
  }
}

// 获取所有工具
export function getAllTools(): Tool[] {
  return Object.values(toolRegistry);
}