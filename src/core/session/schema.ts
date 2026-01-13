// 会话数据库 Schema 定义

import type { SessionMetadata } from './types.js';
import { SessionStatus } from './types.js';

/**
 * 会话表 Schema
 */
export const SESSIONS_TABLE = 'sessions';

export interface SessionRow {
  id: string;
  title: string;
  status: SessionStatus;
  workspace: string;
  provider: string;
  model: string;
  message_count: number;
  token_input: number;
  token_output: number;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  context?: string; // JSON string
}

/**
 * 消息表 Schema
 */
export const MESSAGES_TABLE = 'messages';

export interface MessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'error';
  content: string;
  tool_name?: string;
  timestamp: number; // Unix timestamp
}

/**
 * 快照表 Schema
 */
export const SNAPSHOTS_TABLE = 'snapshots';

export interface SnapshotRow {
  id: string;
  session_id: string;
  name: string;
  created_at: number; // Unix timestamp
  context?: string; // JSON string
}

/**
 * 快照消息表 Schema
 */
export const SNAPSHOT_MESSAGES_TABLE = 'snapshot_messages';

export interface SnapshotMessageRow {
  id: string;
  snapshot_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'error';
  content: string;
  tool_name?: string;
  timestamp: number; // Unix timestamp
}

/**
 * 创建会话表 SQL
 */
export const CREATE_SESSIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${SESSIONS_TABLE} (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    workspace TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    token_input INTEGER NOT NULL DEFAULT 0,
    token_output INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    context TEXT
  );
`;

/**
 * 创建消息表 SQL
 */
export const CREATE_MESSAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${MESSAGES_TABLE} (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_name TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES ${SESSIONS_TABLE}(id) ON DELETE CASCADE
  );
`;

/**
 * 创建快照表 SQL
 */
export const CREATE_SNAPSHOTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${SNAPSHOTS_TABLE} (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    context TEXT,
    FOREIGN KEY (session_id) REFERENCES ${SESSIONS_TABLE}(id) ON DELETE CASCADE
  );
`;

/**
 * 创建快照消息表 SQL
 */
export const CREATE_SNAPSHOT_MESSAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${SNAPSHOT_MESSAGES_TABLE} (
    id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_name TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES ${SNAPSHOTS_TABLE}(id) ON DELETE CASCADE
  );
`;

/**
 * 创建索引 SQL
 */
export const CREATE_INDEXES_SQL = [
  // 会话表索引
  `CREATE INDEX IF NOT EXISTS idx_sessions_status ON ${SESSIONS_TABLE}(status);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON ${SESSIONS_TABLE}(workspace);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_provider ON ${SESSIONS_TABLE}(provider);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON ${SESSIONS_TABLE}(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON ${SESSIONS_TABLE}(updated_at);`,

  // 消息表索引
  `CREATE INDEX IF NOT EXISTS idx_messages_session_id ON ${MESSAGES_TABLE}(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON ${MESSAGES_TABLE}(timestamp);`,

  // 快照表索引
  `CREATE INDEX IF NOT EXISTS idx_snapshots_session_id ON ${SNAPSHOTS_TABLE}(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON ${SNAPSHOTS_TABLE}(created_at);`,

  // 快照消息表索引
  `CREATE INDEX IF NOT EXISTS idx_snapshot_messages_snapshot_id ON ${SNAPSHOT_MESSAGES_TABLE}(snapshot_id);`,
];

/**
 * 数据库版本
 */
export const DB_VERSION = 1;

/**
 * 数据库初始化 SQL
 */
export const INIT_DB_SQL = [
  CREATE_SESSIONS_TABLE_SQL,
  CREATE_MESSAGES_TABLE_SQL,
  CREATE_SNAPSHOTS_TABLE_SQL,
  CREATE_SNAPSHOT_MESSAGES_TABLE_SQL,
  ...CREATE_INDEXES_SQL,
];

/**
 * 行数据转换函数类型
 */
export type RowMapper<T, R> = (row: T) => R;

/**
 * 会话行转换为 SessionMetadata
 */
export function sessionRowToMetadata(row: SessionRow): SessionMetadata {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    workspace: row.workspace,
    provider: row.provider,
    model: row.model,
    messageCount: row.message_count,
    tokenUsage: {
      input: row.token_input,
      output: row.token_output,
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * SessionMetadata 转换为会话行
 */
export function metadataToSessionRow(metadata: SessionMetadata): SessionRow {
  return {
    id: metadata.id,
    title: metadata.title,
    status: metadata.status,
    workspace: metadata.workspace,
    provider: metadata.provider,
    model: metadata.model,
    message_count: metadata.messageCount,
    token_input: metadata.tokenUsage.input,
    token_output: metadata.tokenUsage.output,
    created_at: metadata.createdAt.getTime(),
    updated_at: metadata.updatedAt.getTime(),
  };
}