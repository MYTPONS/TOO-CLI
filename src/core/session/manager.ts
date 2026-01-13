// 会话管理器 - 提供高级会话管理 API

import { getStorage, type SessionStorage } from './storage.js';
import type {
  Session,
  SessionMetadata,
  SessionSnapshot,
  SessionQueryOptions,
  SessionStats,
  SessionSearchResult,
} from './types.js';
import { SessionStatus } from './types.js';
import type { Message } from '../../ui/components/MessageList.js';

/**
 * 会话管理器配置
 */
interface SessionManagerConfig {
  autoSave?: boolean;
  autoSaveInterval?: number; // 毫秒
  maxSessions?: number;
  maxMessagesPerSession?: number;
}

/**
 * 会话管理器类
 */
export class SessionManager {
  private storage: SessionStorage;
  private currentSession: Session | null = null;
  private config: Required<SessionManagerConfig>;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: SessionManagerConfig = {}) {
    this.storage = getStorage();
    this.config = {
      autoSave: config.autoSave ?? true,
      autoSaveInterval: config.autoSaveInterval ?? 30000, // 30秒
      maxSessions: config.maxSessions ?? 100,
      maxMessagesPerSession: config.maxMessagesPerSession ?? 1000,
    };

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 创建新会话
   */
  createSession(options: {
    title?: string;
    provider?: string;
    model?: string;
    workspace?: string;
  } = {}): Session {
    const metadata = this.storage.createSession({
      title: options.title || '新会话',
      provider: options.provider || 'anthropic',
      model: options.model || 'claude-3-5-sonnet',
      workspace: options.workspace || process.cwd(),
    });

    const session: Session = {
      metadata,
      messages: [],
    };

    this.currentSession = session;
    return session;
  }

  /**
   * 加载会话
   */
  loadSession(sessionId: string): Session | null {
    const session = this.storage.getSession(sessionId);
    if (session) {
      this.currentSession = session;
    }
    return session;
  }

  /**
   * 保存当前会话
   */
  saveCurrentSession(): boolean {
    if (!this.currentSession) return false;

    // 更新元数据
    this.storage.updateSession(this.currentSession.metadata.id, {
      messageCount: this.currentSession.messages.length,
      updatedAt: new Date(),
    });

    return true;
  }

  /**
   * 切换会话
   */
  switchSession(sessionId: string): Session | null {
    return this.loadSession(sessionId);
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * 添加消息到当前会话
   */
  addMessage(message: Message): void {
    if (!this.currentSession) {
      throw new Error('没有当前会话');
    }

    // 检查消息数量限制
    if (this.currentSession.messages.length >= this.config.maxMessagesPerSession) {
      // 删除最旧的消息
      const oldestMessage = this.currentSession.messages.shift();
      if (oldestMessage) {
        // 可以选择在数据库中也删除，但这里保留历史记录
      }
    }

    this.currentSession.messages.push(message);
    this.storage.addMessage(this.currentSession.metadata.id, message);

    // 更新会话标题（使用第一条用户消息）
    if (
      message.role === 'user' &&
      this.currentSession.messages.filter((m) => m.role === 'user').length === 1
    ) {
      const title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
      this.storage.updateSession(this.currentSession.metadata.id, { title });
    }

    if (this.config.autoSave) {
      this.saveCurrentSession();
    }
  }

  /**
   * 更新会话元数据
   */
  updateSessionMetadata(sessionId: string, updates: Partial<SessionMetadata>): boolean {
    return this.storage.updateSession(sessionId, updates);
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    if (this.currentSession?.metadata.id === sessionId) {
      this.currentSession = null;
    }
    return this.storage.deleteSession(sessionId);
  }

  /**
   * 归档会话
   */
  archiveSession(sessionId: string): boolean {
    return this.storage.updateSession(sessionId, { status: SessionStatus.ARCHIVED });
  }

  /**
   * 激活归档的会话
   */
  activateSession(sessionId: string): boolean {
    return this.storage.updateSession(sessionId, { status: SessionStatus.ACTIVE });
  }

  /**
   * 查询会话
   */
  querySessions(options: SessionQueryOptions = {}): SessionMetadata[] {
    return this.storage.querySessions(options);
  }

  /**
   * 搜索会话
   */
  searchSessions(query: {
    keyword?: string;
    status?: SessionStatus;
    workspace?: string;
    provider?: string;
    page?: number;
    pageSize?: number;
  }): SessionSearchResult {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let sessions = this.storage.querySessions({
      status: query.status,
      workspace: query.workspace,
      provider: query.provider,
      limit: pageSize,
      offset,
    });

    // 关键词搜索
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      sessions = sessions.filter((session) => {
        return (
          session.title.toLowerCase().includes(keyword) ||
          session.workspace.toLowerCase().includes(keyword)
        );
      });
    }

    return {
      sessions,
      total: sessions.length,
      page,
      pageSize,
    };
  }

  /**
   * 获取统计信息
   */
  getStats(): SessionStats {
    return this.storage.getStats();
  }

  /**
   * 创建快照
   */
  createSnapshot(name?: string): SessionSnapshot | null {
    if (!this.currentSession) return null;

    return this.storage.createSnapshot(
      this.currentSession.metadata.id,
      name || `快照 ${new Date().toLocaleString('zh-CN')}`
    );
  }

  /**
   * 获取快照
   */
  getSnapshot(snapshotId: string): SessionSnapshot | null {
    return this.storage.getSnapshot(snapshotId);
  }

  /**
   * 列出会话的所有快照
   */
  listSnapshots(_sessionId: string): SessionSnapshot[] {
    // 需要在存储层添加此方法
    // 暂时返回空数组
    return [];
  }

  /**
   * 从快照恢复
   */
  restoreFromSnapshot(snapshotId: string): Session | null {
    const session = this.storage.restoreFromSnapshot(snapshotId);
    if (session) {
      this.currentSession = session;
    }
    return session;
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    return this.storage.deleteSnapshot(snapshotId);
  }

  /**
   * 清理旧会话
   */
  cleanupOldSessions(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    // 30天前
    const cutoffDate = new Date(Date.now() - maxAge);
    const oldSessions = this.storage.querySessions({
      status: SessionStatus.ACTIVE,
      limit: 1000,
    });

    let cleaned = 0;
    for (const session of oldSessions) {
      if (session.updatedAt < cutoffDate) {
        this.archiveSession(session.id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 清理已删除的会话
   */
  cleanupDeletedSessions(): number {
    return this.storage.cleanupDeletedSessions();
  }

  /**
   * 导出会话
   */
  exportSession(sessionId: string): Session | null {
    return this.storage.getSession(sessionId);
  }

  /**
   * 导出所有会话
   */
  exportAllSessions(): Session[] {
    const sessions: Session[] = [];
    const metadataList = this.storage.querySessions({ limit: 1000 });

    for (const metadata of metadataList) {
      const session = this.storage.getSession(metadata.id);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * 导入会话
   */
  importSession(session: Session): SessionMetadata {
    const metadata = this.storage.createSession(session.metadata);

    for (const message of session.messages) {
      this.storage.addMessage(metadata.id, message);
    }

    return metadata;
  }

  /**
   * 开始自动保存
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveCurrentSession();
    }, this.config.autoSaveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopAutoSave();
    this.saveCurrentSession();
  }
}

/**
 * 默认会话管理器实例
 */
let defaultManager: SessionManager | null = null;

/**
 * 获取默认会话管理器
 */
export function getSessionManager(config?: SessionManagerConfig): SessionManager {
  if (!defaultManager) {
    defaultManager = new SessionManager(config);
  }
  return defaultManager;
}

/**
 * 重置默认会话管理器
 */
export function resetSessionManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}

/**
 * 便捷函数：创建新会话
 */
export function createSession(options?: {
  title?: string;
  provider?: string;
  model?: string;
  workspace?: string;
}): Session {
  return getSessionManager().createSession(options);
}

/**
 * 便捷函数：加载会话
 */
export function loadSession(sessionId: string): Session | null {
  return getSessionManager().loadSession(sessionId);
}

/**
 * 便捷函数：获取当前会话
 */
export function getCurrentSession(): Session | null {
  return getSessionManager().getCurrentSession();
}

/**
 * 便捷函数：添加消息
 */
export function addMessage(message: Message): void {
  getSessionManager().addMessage(message);
}

/**
 * 便捷函数：查询会话
 */
export function querySessions(options?: SessionQueryOptions): SessionMetadata[] {
  return getSessionManager().querySessions(options);
}

/**
 * 便捷函数：获取统计信息
 */
export function getSessionStats(): SessionStats {
  return getSessionManager().getStats();
}