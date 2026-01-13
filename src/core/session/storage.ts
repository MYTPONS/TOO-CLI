// 会话存储层 - 使用 better-sqlite3

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import {
  INIT_DB_SQL,
  SESSIONS_TABLE,
  MESSAGES_TABLE,
  SNAPSHOTS_TABLE,
  SNAPSHOT_MESSAGES_TABLE,
  type SessionRow,
  type MessageRow,
  type SnapshotRow,
  type SnapshotMessageRow,
  sessionRowToMetadata,
  metadataToSessionRow,
} from './schema.js';
import type {
  Session,
  SessionMetadata,
  SessionSnapshot,
  SessionQueryOptions,
  SessionStats,
} from './types.js';
import { SessionStatus } from './types.js';
import type { Message } from '../../ui/components/MessageList.js';

/**
 * 存储配置
 */
interface StorageConfig {
  dbPath: string;
  autoMigrate?: boolean;
}

/**
 * 存储层类
 */
export class SessionStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(config: StorageConfig) {
    this.dbPath = config.dbPath;
    this.ensureDirectory();
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // 启用 WAL 模式提高并发性能
    this.initDatabase();
  }

  /**
   * 确保数据库目录存在
   */
  private ensureDirectory(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 初始化数据库
   */
  private initDatabase(): void {
    for (const sql of INIT_DB_SQL) {
      this.db.exec(sql);
    }
  }

  /**
   * 创建会话
   */
  createSession(metadata: Partial<SessionMetadata> = {}): SessionMetadata {
    const now = Date.now();
    const id = metadata.id || nanoid();

    const row: SessionRow = {
      id,
      title: metadata.title || '新会话',
      status: metadata.status || SessionStatus.ACTIVE,
      workspace: metadata.workspace || process.cwd(),
      provider: metadata.provider || 'anthropic',
      model: metadata.model || 'claude-3-5-sonnet',
      message_count: metadata.messageCount || 0,
      token_input: metadata.tokenUsage?.input || 0,
      token_output: metadata.tokenUsage?.output || 0,
      created_at: metadata.createdAt?.getTime() || now,
      updated_at: metadata.updatedAt?.getTime() || now,
      context: undefined,
    };

    const stmt = this.db.prepare(`
      INSERT INTO ${SESSIONS_TABLE} (
        id, title, status, workspace, provider, model,
        message_count, token_input, token_output, created_at, updated_at, context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.id,
      row.title,
      row.status,
      row.workspace,
      row.provider,
      row.model,
      row.message_count,
      row.token_input,
      row.token_output,
      row.created_at,
      row.updated_at,
      row.context
    );

    return sessionRowToMetadata(row);
  }

  /**
   * 获取会话元数据
   */
  getSessionMetadata(sessionId: string): SessionMetadata | null {
    const stmt = this.db.prepare(`
      SELECT * FROM ${SESSIONS_TABLE} WHERE id = ? AND status != ?
    `);
    const row = stmt.get(sessionId, SessionStatus.DELETED) as SessionRow | undefined;

    return row ? sessionRowToMetadata(row) : null;
  }

  /**
   * 获取完整会话
   */
  getSession(sessionId: string): Session | null {
    const metadata = this.getSessionMetadata(sessionId);
    if (!metadata) return null;

    const messages = this.getSessionMessages(sessionId);

    return {
      metadata,
      messages,
    };
  }

  /**
   * 获取会话消息
   */
  getSessionMessages(sessionId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${MESSAGES_TABLE}
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(sessionId) as MessageRow[];

    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      toolName: row.tool_name,
      timestamp: new Date(row.timestamp),
    }));
  }

  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<SessionMetadata>): boolean {
    const current = this.getSessionMetadata(sessionId);
    if (!current) return false;

    const merged = { ...current, ...updates, updatedAt: new Date() };
    const row = metadataToSessionRow(merged);

    const stmt = this.db.prepare(`
      UPDATE ${SESSIONS_TABLE}
      SET title = ?, status = ?, workspace = ?, provider = ?, model = ?,
          message_count = ?, token_input = ?, token_output = ?, updated_at = ?, context = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      row.title,
      row.status,
      row.workspace,
      row.provider,
      row.model,
      row.message_count,
      row.token_input,
      row.token_output,
      row.updated_at,
      row.context,
      sessionId
    );

    return result.changes > 0;
  }

  /**
   * 删除会话（软删除）
   */
  deleteSession(sessionId: string): boolean {
    return this.updateSession(sessionId, { status: SessionStatus.DELETED });
  }

  /**
   * 永久删除会话
   */
  permanentlyDeleteSession(sessionId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${SESSIONS_TABLE} WHERE id = ?`);
    const result = stmt.run(sessionId);
    return result.changes > 0;
  }

  /**
   * 添加消息到会话
   */
  addMessage(sessionId: string, message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO ${MESSAGES_TABLE} (id, session_id, role, content, tool_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.id,
      sessionId,
      message.role,
      message.content,
      message.toolName || null,
      message.timestamp?.getTime() || Date.now()
    );

    // 更新会话的消息计数
    const metadata = this.getSessionMetadata(sessionId);
    if (metadata) {
      this.updateSession(sessionId, {
        messageCount: metadata.messageCount + 1,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * 查询会话
   */
  querySessions(options: SessionQueryOptions = {}): SessionMetadata[] {
    let sql = `SELECT * FROM ${SESSIONS_TABLE} WHERE status != ?`;
    const params: any[] = [SessionStatus.DELETED];

    if (options.status) {
      sql += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.workspace) {
      sql += ` AND workspace = ?`;
      params.push(options.workspace);
    }

    if (options.provider) {
      sql += ` AND provider = ?`;
      params.push(options.provider);
    }

    if (options.model) {
      sql += ` AND model = ?`;
      params.push(options.model);
    }

    // 排序
    const orderBy = options.orderBy || 'updatedAt';
    const order = options.order || 'desc';
    sql += ` ORDER BY ${orderBy} ${order}`;

    // 分页
    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);

      if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as SessionRow[];

    return rows.map(sessionRowToMetadata);
  }

  /**
   * 获取统计信息
   */
  getStats(): SessionStats {
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${SESSIONS_TABLE} WHERE status != ?
    `);
    const total = (totalStmt.get(SessionStatus.DELETED) as { count: number }).count;

    const activeStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${SESSIONS_TABLE} WHERE status = ?
    `);
    const active = (activeStmt.get(SessionStatus.ACTIVE) as { count: number }).count;

    const archivedStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${SESSIONS_TABLE} WHERE status = ?
    `);
    const archived = (archivedStmt.get(SessionStatus.ARCHIVED) as { count: number }).count;

    const messageStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${MESSAGES_TABLE}
    `);
    const totalMessages = (messageStmt.get() as { count: number }).count;

    const tokenStmt = this.db.prepare(`
      SELECT SUM(token_input) as input, SUM(token_output) as output
      FROM ${SESSIONS_TABLE} WHERE status != ?
    `);
    const tokens = tokenStmt.get(SessionStatus.DELETED) as {
      input: number | null;
      output: number | null;
    };

    const providerStmt = this.db.prepare(`
      SELECT provider, COUNT(*) as count FROM ${SESSIONS_TABLE}
      WHERE status != ? GROUP BY provider
    `);
    const providerRows = providerStmt.all(SessionStatus.DELETED) as {
      provider: string;
      count: number;
    }[];
    const byProvider: Record<string, number> = {};
    for (const row of providerRows) {
      byProvider[row.provider] = row.count;
    }

    const modelStmt = this.db.prepare(`
      SELECT model, COUNT(*) as count FROM ${SESSIONS_TABLE}
      WHERE status != ? GROUP BY model
    `);
    const modelRows = modelStmt.all(SessionStatus.DELETED) as {
      model: string;
      count: number;
    }[];
    const byModel: Record<string, number> = {};
    for (const row of modelRows) {
      byModel[row.model] = row.count;
    }

    return {
      totalSessions: total,
      activeSessions: active,
      archivedSessions: archived,
      totalMessages,
      totalTokens: {
        input: tokens.input || 0,
        output: tokens.output || 0,
      },
      byProvider,
      byModel,
    };
  }

  /**
   * 创建快照
   */
  createSnapshot(sessionId: string, name: string): SessionSnapshot | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const snapshotId = nanoid();
    const now = Date.now();

    // 创建快照记录
    const snapshotStmt = this.db.prepare(`
      INSERT INTO ${SNAPSHOTS_TABLE} (id, session_id, name, created_at, context)
      VALUES (?, ?, ?, ?, ?)
    `);
    snapshotStmt.run(
      snapshotId,
      sessionId,
      name,
      now,
      session.context ? JSON.stringify(session.context) : null
    );

    // 复制消息
    const messageStmt = this.db.prepare(`
      INSERT INTO ${SNAPSHOT_MESSAGES_TABLE} (id, snapshot_id, role, content, tool_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const message of session.messages) {
      messageStmt.run(
        nanoid(),
        snapshotId,
        message.role,
        message.content,
        message.toolName || null,
        message.timestamp?.getTime() || Date.now()
      );
    }

    return {
      id: snapshotId,
      sessionId,
      name,
      createdAt: new Date(now),
      messages: session.messages,
      context: session.context,
    };
  }

  /**
   * 获取快照
   */
  getSnapshot(snapshotId: string): SessionSnapshot | null {
    const snapshotStmt = this.db.prepare(`
      SELECT * FROM ${SNAPSHOTS_TABLE} WHERE id = ?
    `);
    const snapshotRow = snapshotStmt.get(snapshotId) as SnapshotRow | undefined;

    if (!snapshotRow) return null;

    // 获取快照消息
    const messagesStmt = this.db.prepare(`
      SELECT * FROM ${SNAPSHOT_MESSAGES_TABLE}
      WHERE snapshot_id = ?
      ORDER BY timestamp ASC
    `);
    const messageRows = messagesStmt.all(snapshotId) as SnapshotMessageRow[];

    const messages: Message[] = messageRows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      toolName: row.tool_name,
      timestamp: new Date(row.timestamp),
    }));

    return {
      id: snapshotRow.id,
      sessionId: snapshotRow.session_id,
      name: snapshotRow.name,
      createdAt: new Date(snapshotRow.created_at),
      messages,
      context: snapshotRow.context ? JSON.parse(snapshotRow.context) : undefined,
    };
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${SNAPSHOTS_TABLE} WHERE id = ?`);
    const result = stmt.run(snapshotId);
    return result.changes > 0;
  }

  /**
   * 从快照恢复会话
   */
  restoreFromSnapshot(snapshotId: string): Session | null {
    const snapshot = this.getSnapshot(snapshotId);
    if (!snapshot) return null;

    // 创建新会话
    const metadata = this.createSession({
      title: `恢复: ${snapshot.name}`,
      provider: snapshot.context?.provider || 'anthropic',
      model: snapshot.context?.model || 'claude-3-5-sonnet',
      workspace: snapshot.context?.workspace || process.cwd(),
    });

    // 恢复消息
    for (const message of snapshot.messages) {
      this.addMessage(metadata.id, message);
    }

    return this.getSession(metadata.id);
  }

  /**
   * 清理已删除的会话
   */
  cleanupDeletedSessions(): number {
    const stmt = this.db.prepare(`DELETE FROM ${SESSIONS_TABLE} WHERE status = ?`);
    const result = stmt.run(SessionStatus.DELETED);
    return result.changes;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }

  /**
   * 获取数据库路径
   */
  getDbPath(): string {
    return this.dbPath;
  }
}

/**
 * 默认存储实例
 */
let defaultStorage: SessionStorage | null = null;

/**
 * 获取默认存储实例
 */
export function getStorage(dbPath?: string): SessionStorage {
  if (!defaultStorage) {
    const sessionsPath = process.env.TOO_SESSIONS_PATH || '~/.too/sessions';
    const expandedPath = sessionsPath.replace(/^~/, process.env.HOME || '');
    defaultStorage = new SessionStorage({
      dbPath: dbPath || path.join(expandedPath, 'sessions.db'),
    });
  }
  return defaultStorage;
}

/**
 * 重置默认存储实例
 */
export function resetStorage(): void {
  if (defaultStorage) {
    defaultStorage.close();
    defaultStorage = null;
  }
}