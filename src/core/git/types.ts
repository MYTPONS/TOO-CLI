// Git 操作类型定义

/**
 * Git 文件状态
 */
export type GitFileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';

export const GitFileStatus = {
  MODIFIED: 'modified' as GitFileStatus,
  ADDED: 'added' as GitFileStatus,
  DELETED: 'deleted' as GitFileStatus,
  RENAMED: 'renamed' as GitFileStatus,
  UNTRACKED: 'untracked' as GitFileStatus,
};

/**
 * Git 文件状态信息
 */
export interface GitFileStatusInfo {
  path: string;
  status: GitFileStatus;
  oldPath?: string; // 用于重命名的文件
}

/**
 * Git 分支信息
 */
export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commit?: string;
}

/**
 * Git 提交信息
 */
export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files?: string[];
}

/**
 * Git 状态信息
 */
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileStatusInfo[];
  unstaged: GitFileStatusInfo[];
  untracked: string[];
  conflicts: string[];
}

/**
 * Git Diff 信息
 */
export interface GitDiffInfo {
  filePath: string;
  hunks: GitDiffHunk[];
  stats?: {
    additions: number;
    deletions: number;
  };
}

/**
 * Git Diff 块
 */
export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

/**
 * Git Diff 行
 */
export interface GitDiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Git 远程仓库信息
 */
export interface GitRemote {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
}

/**
 * Git 标签信息
 */
export interface GitTag {
  name: string;
  commit: string;
  date: Date;
  message?: string;
}

/**
 * Git 配置选项
 */
export interface GitOptions {
  cwd?: string;
  maxBuffer?: number;
}

/**
 * Git 操作结果
 */
export interface GitResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Git 提交选项
 */
export interface GitCommitOptions {
  message: string;
  files?: string[];
  amend?: boolean;
  allowEmpty?: boolean;
}

/**
 * Git 分支操作选项
 */
export interface GitBranchOptions {
  startPoint?: string;
  track?: boolean;
}

/**
 * Git 合并选项
 */
export interface GitMergeOptions {
  strategy?: 'ours' | 'theirs' | 'recursive' | 'resolve';
  noCommit?: boolean;
  squash?: boolean;
}

/**
 * Git 变基选项
 */
export interface GitRebaseOptions {
  upstream?: string;
  onto?: string;
  interactive?: boolean;
}

/**
 * Git 拉取选项
 */
export interface GitPullOptions {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}

/**
 * Git 推送选项
 */
export interface GitPushOptions {
  remote?: string;
  branch?: string;
  force?: boolean;
  setUpstream?: boolean;
}

/**
 * Git 克隆选项
 */
export interface GitCloneOptions {
  depth?: number;
  branch?: string;
  singleBranch?: boolean;
  recursive?: boolean;
}

/**
 * Git 暂存选项
 */
export interface GitStashOptions {
  message?: string;
  includeUntracked?: boolean;
  keepIndex?: boolean;
}

/**
 * Git 暂存列表项
 */
export interface GitStashEntry {
  ref: string;
  message: string;
  branch: string;
  date: Date;
}