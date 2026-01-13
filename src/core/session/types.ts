// 会话数据类型定义

import type { Message } from '../../ui/components/MessageList.js';

// 导出类型供其他模块使用
export type { Message };

/**
 * 会话状态
 */
export type SessionStatus = 'active' | 'archived' | 'deleted';

export const SessionStatus = {
  ACTIVE: 'active' as SessionStatus,
  ARCHIVED: 'archived' as SessionStatus,
  DELETED: 'deleted' as SessionStatus,
};

/**
 * 会话元数据
 */
export interface SessionMetadata {
  id: string;
  title: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  workspace: string;
  provider: string;
  model: string;
  messageCount: number;
  tokenUsage: {
    input: number;
    output: number;
  };
}

/**
 * 会话数据
 */
export interface Session {
  metadata: SessionMetadata;
  messages: Message[];
  context?: Record<string, any>;
}

/**
 * 会话快照
 */
export interface SessionSnapshot {
  id: string;
  sessionId: string;
  name: string;
  createdAt: Date;
  messages: Message[];
  context?: Record<string, any>;
}

/**
 * 会话查询选项
 */
export interface SessionQueryOptions {
  status?: SessionStatus;
  workspace?: string;
  provider?: string;
  model?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

/**
 * 会话统计信息
 */
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
  totalMessages: number;
  totalTokens: {
    input: number;
    output: number;
  };
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}

/**
 * 会话搜索结果
 */
export interface SessionSearchResult {
  sessions: SessionMetadata[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 会话导入/导出格式
 */
export interface SessionExport {
  version: string;
  exportedAt: Date;
  sessions: Session[];
}

/**
 * 会话迁移数据
 */
export interface SessionMigration {
  fromVersion: string;
  toVersion: string;
  migratedAt: Date;
  sessionCount: number;
}