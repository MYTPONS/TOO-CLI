// MCP 协议支持

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  Tool as MCPTool,
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, MCPTool> = new Map();

  /**
   * 连接到 MCP 服务器
   */
  async connectServer(config: MCPServerConfig): Promise<boolean> {
    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      const client = new Client({
        name: `too-cli-${config.name}`,
        version: '0.1.0',
      }, {
        capabilities: {},
      });

      await client.connect(transport);
      this.clients.set(config.name, client);

      // 获取工具列表
      await this.loadTools(config.name, client);

      return true;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      return false;
    }
  }

  /**
   * 加载 MCP 服务器的工具
   */
  private async loadTools(serverName: string, client: Client): Promise<void> {
    try {
      const result = await client.listTools() as ListToolsResult;

      for (const tool of result.tools) {
        const toolId = `${serverName}:${tool.name}`;
        this.tools.set(toolId, tool);
      }
    } catch (error) {
      console.error(`Failed to load tools from ${serverName}:`, error);
    }
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<CallToolResult | null> {
    const client = this.clients.get(serverName);
    if (!client) {
      return null;
    }

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      }) as any;

      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on ${serverName}:`, error);
      return null;
    }
  }

  /**
   * 获取所有 MCP 工具
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取指定服务器的工具
   */
  getServerTools(serverName: string): MCPTool[] {
    const prefix = `${serverName}:`;
    return Array.from(this.tools.entries())
      .filter(([id]) => id.startsWith(prefix))
      .map(([, tool]) => tool);
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Failed to disconnect from ${name}:`, error);
      }
    }

    this.clients.clear();
    this.tools.clear();
  }

  /**
   * 断开指定服务器
   */
  async disconnectServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Failed to disconnect from ${serverName}:`, error);
      }
      this.clients.delete(serverName);

      // 移除该服务器的工具
      const prefix = `${serverName}:`;
      for (const id of this.tools.keys()) {
        if (id.startsWith(prefix)) {
          this.tools.delete(id);
        }
      }
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): {
    connected: string[];
    totalTools: number;
  } {
    return {
      connected: Array.from(this.clients.keys()),
      totalTools: this.tools.size,
    };
  }
}

let defaultManager: MCPClientManager | null = null;

export function getMCPManager(): MCPClientManager {
  if (!defaultManager) {
    defaultManager = new MCPClientManager();
  }
  return defaultManager;
}

export function resetMCPManager(): void {
  if (defaultManager) {
    defaultManager.disconnectAll();
  }
  defaultManager = null;
}