// Git Diff 预览模块

import { getGitManager } from './operations.js';
import type {
  GitDiffInfo,
  GitDiffHunk,
  GitResult,
} from './types.js';
import { diffLines, type Change } from 'diff';

/**
 * Diff 预览管理器
 */
export class GitDiffManager {
  private gitManager = getGitManager();

  /**
   * 获取文件 diff
   */
  async getFileDiff(filePath: string, staged: boolean = false): Promise<GitResult<GitDiffInfo>> {
    try {
      const args = staged ? ['--staged', filePath] : [filePath];
      const diff = await this.gitManager['git'].diff(args);

      const diffInfo = this.parseDiff(diff, filePath);
      return {
        success: true,
        data: diffInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取工作区 diff
   */
  async getWorkingDiff(): Promise<GitResult<GitDiffInfo[]>> {
    try {
      const diff = await this.gitManager['git'].diff();
      const diffs = this.parseMultipleDiffs(diff);
      return {
        success: true,
        data: diffs,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取暂存区 diff
   */
  async getStagedDiff(): Promise<GitResult<GitDiffInfo[]>> {
    try {
      const diff = await this.gitManager['git'].diff(['--staged']);
      const diffs = this.parseMultipleDiffs(diff);
      return {
        success: true,
        data: diffs,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取提交 diff
   */
  async getCommitDiff(commitHash: string): Promise<GitResult<GitDiffInfo[]>> {
    try {
      const diff = await this.gitManager['git'].diff([`${commitHash}^`, commitHash]);
      const diffs = this.parseMultipleDiffs(diff);
      return {
        success: true,
        data: diffs,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 比较两个文本
   */
  compareText(oldText: string, newText: string): GitDiffInfo {
    const changes = diffLines(oldText, newText);
    const hunks = this.changesToHunks(changes);

    // 计算统计
    let additions = 0;
    let deletions = 0;
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'addition') additions++;
        if (line.type === 'deletion') deletions++;
      }
    }

    return {
      filePath: 'text',
      hunks,
      stats: { additions, deletions },
    };
  }

  /**
   * 解析单个 diff
   */
  private parseDiff(diffText: string, filePath: string): GitDiffInfo {
    const hunks: GitDiffHunk[] = [];
    const lines = diffText.split('\n');

    let currentHunk: GitDiffHunk | null = null;
    let oldLineNumber = 0;
    let newLineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 解析 hunk 头
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        currentHunk = {
          oldStart: parseInt(hunkMatch[1], 10),
          oldLines: parseInt(hunkMatch[2] || '1', 10),
          newStart: parseInt(hunkMatch[3], 10),
          newLines: parseInt(hunkMatch[4] || '1', 10),
          lines: [],
        };

        oldLineNumber = currentHunk.oldStart;
        newLineNumber = currentHunk.newStart;
        continue;
      }

      // 解析 diff 行
      if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'addition',
            content: line.slice(1),
            newLineNumber: newLineNumber++,
          });
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'deletion',
            content: line.slice(1),
            oldLineNumber: oldLineNumber++,
          });
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({
            type: 'context',
            content: line.slice(1),
            oldLineNumber: oldLineNumber++,
            newLineNumber: newLineNumber++,
          });
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    // 计算统计
    let additions = 0;
    let deletions = 0;
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'addition') additions++;
        if (line.type === 'deletion') deletions++;
      }
    }

    return {
      filePath,
      hunks,
      stats: { additions, deletions },
    };
  }

  /**
   * 解析多个 diff
   */
  private parseMultipleDiffs(diffText: string): GitDiffInfo[] {
    const diffs: GitDiffInfo[] = [];
    const sections = diffText.split(/^diff --git/m);

    for (const section of sections) {
      if (!section.trim()) continue;

      // 提取文件路径
      const pathMatch = section.match(/^a\/(.+?)\s+b\/(.+?)$/m);
      if (pathMatch) {
        const filePath = pathMatch[2];
        const diffContent = section.replace(/^a\/.+?\s+b\/.+\n/m, '');
        diffs.push(this.parseDiff(diffContent, filePath));
      }
    }

    return diffs;
  }

  /**
   * 将 changes 转换为 hunks
   */
  private changesToHunks(changes: Change[]): GitDiffHunk[] {
    const hunks: GitDiffHunk[] = [];
    let currentHunk: GitDiffHunk | null = null;
    let oldLineNumber = 1;
    let newLineNumber = 1;

    for (const change of changes) {
      if (!currentHunk) {
        currentHunk = {
          oldStart: oldLineNumber,
          oldLines: 0,
          newStart: newLineNumber,
          newLines: 0,
          lines: [],
        };
      }

      const removed = change.removed as string | undefined;
      const added = change.added as string | undefined;

      if (removed) {
        const lines = removed.split('\n');
        for (const line of lines) {
          currentHunk.lines.push({
            type: 'deletion',
            content: line,
            oldLineNumber: oldLineNumber++,
          });
          currentHunk.oldLines++;
        }
      }

      if (added) {
        const lines = added.split('\n');
        for (const line of lines) {
          currentHunk.lines.push({
            type: 'addition',
            content: line,
            newLineNumber: newLineNumber++,
          });
          currentHunk.newLines++;
        }
      }

      if (change.removed === undefined && change.added === undefined) {
        const lines = change.value.split('\n');
        for (const line of lines) {
          currentHunk.lines.push({
            type: 'context',
            content: line,
            oldLineNumber: oldLineNumber++,
            newLineNumber: newLineNumber++,
          });
          currentHunk.oldLines++;
          currentHunk.newLines++;
        }
      }
    }

    if (currentHunk && currentHunk.lines.length > 0) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * 格式化 diff 为可读文本
   */
  formatDiff(diff: GitDiffInfo): string {
    let output = `--- ${diff.filePath}\n`;
    output += `+++ ${diff.filePath}\n`;

    for (const hunk of diff.hunks) {
      output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;

      for (const line of hunk.lines) {
        const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
        output += `${prefix}${line.content}\n`;
      }
    }

    if (diff.stats) {
      output += `\n统计: +${diff.stats.additions} -${diff.stats.deletions}\n`;
    }

    return output;
  }
}

/**
 * 默认 Diff 管理器实例
 */
let defaultDiffManager: GitDiffManager | null = null;

/**
 * 获取默认 Diff 管理器
 */
export function getDiffManager(): GitDiffManager {
  if (!defaultDiffManager) {
    defaultDiffManager = new GitDiffManager();
  }
  return defaultDiffManager;
}

/**
 * 重置默认 Diff 管理器
 */
export function resetDiffManager(): void {
  defaultDiffManager = null;
}