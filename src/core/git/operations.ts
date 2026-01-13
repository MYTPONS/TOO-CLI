// Git 操作模块 - 使用 simple-git

import simpleGit, { SimpleGit } from 'simple-git';
import type {
  GitStatus,
  GitBranch,
  GitCommit,
  GitFileStatusInfo,
  GitRemote,
  GitStashEntry,
  GitOptions,
  GitResult,
  GitCommitOptions,
  GitBranchOptions,
  GitCloneOptions,
  GitPullOptions,
  GitPushOptions,
  GitStashOptions,
} from './types.js';
import { GitFileStatus } from './types.js';

/**
 * Git 管理器类
 */
export class GitManager {
  private git: SimpleGit;
  private cwd: string;

  constructor(options: GitOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.git = simpleGit({ baseDir: this.cwd });
  }

  /**
   * 检查是否是 Git 仓库
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.revparse('--is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Git 状态
   */
  async getStatus(): Promise<GitResult<GitStatus>> {
    try {
      const status = await this.git.status();
      const branch = status.current || 'HEAD';

      // 解析文件状态
      const staged: GitFileStatusInfo[] = [];
      const unstaged: GitFileStatusInfo[] = [];

      for (const file of status.files) {
        const statusInfo: GitFileStatusInfo = {
          path: file.path,
          status: this.parseFileStatus(file.index),
        };

        if (file.index !== ' ') {
          staged.push(statusInfo);
        }
        if (file.working_dir !== ' ') {
          unstaged.push({
            path: file.path,
            status: this.parseFileStatus(file.working_dir),
          });
        }
      }

      return {
        success: true,
        data: {
          branch,
          ahead: status.ahead || 0,
          behind: status.behind || 0,
          staged,
          unstaged,
          untracked: status.not_added,
          conflicts: status.conflicted,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 解析文件状态
   */
  private parseFileStatus(status: string): GitFileStatus {
    switch (status) {
      case 'M':
        return GitFileStatus.MODIFIED;
      case 'A':
        return GitFileStatus.ADDED;
      case 'D':
        return GitFileStatus.DELETED;
      case 'R':
        return GitFileStatus.RENAMED;
      case '?':
        return GitFileStatus.UNTRACKED;
      default:
        return GitFileStatus.UNTRACKED;
    }
  }

  /**
   * 添加文件到暂存区
   */
  async add(files: string | string[]): Promise<GitResult<void>> {
    try {
      await this.git.add(files);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 提交更改
   */
  async commit(options: GitCommitOptions): Promise<GitResult<string>> {
    try {
      const commit = await this.git.commit(options.message, options.files);

      return {
        success: true,
        data: commit.commit || 'unknown',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取分支列表
   */
  async getBranches(): Promise<GitResult<GitBranch[]>> {
    try {
      const branches = await this.git.branch();
      const result: GitBranch[] = [];

      // 本地分支
      for (const branch of branches.all) {
        result.push({
          name: branch,
          isCurrent: branch === branches.current,
          isRemote: false,
        });
      }

      // 远程分支（暂时不支持，simple-git API 变更）
      // for (const branch of branches.remotes) {
      //   result.push({
      //     name: branch,
      //     isCurrent: false,
      //     isRemote: true,
      //   });
      // }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 创建分支
   */
  async createBranch(name: string, options: GitBranchOptions = {}): Promise<GitResult<void>> {
    try {
      await this.git.branch([name, options.startPoint || 'HEAD', '-D']);
      if (options.track) {
        await this.git.branch(['--track', name, options.startPoint || 'HEAD']);
      } else {
        await this.git.branch([name]);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 切换分支
   */
  async checkout(branch: string): Promise<GitResult<void>> {
    try {
      await this.git.checkout(branch);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 删除分支
   */
  async deleteBranch(name: string, force: boolean = false): Promise<GitResult<void>> {
    try {
      if (force) {
        await this.git.branch(['-D', name]);
      } else {
        await this.git.branch(['-d', name]);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取提交历史
   */
  async getLog(maxCount: number = 20): Promise<GitResult<GitCommit[]>> {
    try {
      const log = await this.git.log({ maxCount });
      const commits: GitCommit[] = log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
      }));

      return {
        success: true,
        data: commits,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取远程仓库
   */
  async getRemotes(): Promise<GitResult<GitRemote[]>> {
    try {
      const remotes = await this.git.getRemotes(true);
      const result: GitRemote[] = remotes.map((remote) => ({
        name: remote.name,
        url: remote.refs.fetch || '',
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 拉取更新
   */
  async pull(options: GitPullOptions = {}): Promise<GitResult<void>> {
    try {
      const args: string[] = [];
      if (options.rebase) {
        args.push('--rebase');
      }
      if (options.remote) {
        args.push(options.remote);
      }
      if (options.branch) {
        args.push(options.branch);
      }

      await this.git.pull(args);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 推送更改
   */
  async push(options: GitPushOptions = {}): Promise<GitResult<void>> {
    try {
      const args: string[] = [];
      if (options.force) {
        args.push('--force');
      }
      if (options.setUpstream) {
        args.push('--set-upstream');
      }
      if (options.remote) {
        args.push(options.remote);
      }
      if (options.branch) {
        args.push(options.branch);
      }

      await this.git.push(args);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 克隆仓库
   */
  static async clone(url: string, dir: string, options: GitCloneOptions = {}): Promise<GitResult<void>> {
    try {
      const git = simpleGit();
      const args: string[] = [];

      if (options.depth) {
        args.push('--depth', String(options.depth));
      }
      if (options.branch) {
        args.push('--branch', options.branch);
      }
      if (options.singleBranch) {
        args.push('--single-branch');
      }
      if (options.recursive) {
        args.push('--recursive');
      }

      await git.clone(url, dir, args);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 初始化仓库
   */
  async init(): Promise<GitResult<void>> {
    try {
      await this.git.init();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 暂存更改
   */
  async stash(options: GitStashOptions = {}): Promise<GitResult<void>> {
    try {
      const args: string[] = [];
      if (options.message) {
        args.push('-m', options.message);
      }
      if (options.includeUntracked) {
        args.push('-u');
      }
      if (options.keepIndex) {
        args.push('--keep-index');
      }

      await this.git.stash(args);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 列出暂存列表
   */
  async stashList(): Promise<GitResult<GitStashEntry[]>> {
    try {
      const list = await this.git.stashList();
      const entries: GitStashEntry[] = list.all.map((entry) => ({
        ref: entry.hash,
        message: entry.message,
        branch: 'HEAD',
        date: new Date(entry.date),
      }));

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 应用暂存
   */
  async stashApply(stashRef?: string): Promise<GitResult<void>> {
    try {
      if (stashRef) {
        await this.git.stash(['apply', stashRef]);
      } else {
        await this.git.stash(['apply']);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 弹出暂存
   */
  async stashPop(stashRef?: string): Promise<GitResult<void>> {
    try {
      if (stashRef) {
        await this.git.stash(['pop', stashRef]);
      } else {
        await this.git.stash(['pop']);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 丢弃暂存
   */
  async stashDrop(stashRef?: string): Promise<GitResult<void>> {
    try {
      if (stashRef) {
        await this.git.stash(['drop', stashRef]);
      } else {
        await this.git.stash(['drop']);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取当前工作目录
   */
  getCwd(): string {
    return this.cwd;
  }
}

/**
 * 默认 Git 管理器实例
 */
let defaultManager: GitManager | null = null;

/**
 * 获取默认 Git 管理器
 */
export function getGitManager(cwd?: string): GitManager {
  if (!defaultManager || (cwd && defaultManager.getCwd() !== cwd)) {
    defaultManager = new GitManager({ cwd });
  }
  return defaultManager;
}

/**
 * 重置默认 Git 管理器
 */
export function resetGitManager(): void {
  defaultManager = null;
}