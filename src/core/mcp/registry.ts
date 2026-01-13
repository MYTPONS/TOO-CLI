// MCP 工具发现和注册

import { getMCPManager } from './client.js';
import type { Tool } from '../ai/interface.js';

export class MCPToolRegistry {
  /**
   * 将 MCP 工具转换为内部工具格式
   */
  convertMCPTool(mcpTool: any, serverName: string): Tool {
    return {
      name: `${serverName}:${mcpTool.name}`,
      description: mcpTool.description || '',
      inputSchema: mcpTool.inputSchema || {
        type: 'object',
        properties: {},
        required: [],
      },
    };
  }

  /**
   * 获取所有 MCP 工具
   */
  getAllMCPTools(): Tool[] {
    const manager = getMCPManager();
    const mcpTools = manager.getAllTools();

    return mcpTools.map((tool) => {
      const [serverName] = tool.name.split(':');
      return this.convertMCPTool(tool, serverName);
    });
  }

  /**
   * 调用 MCP 工具
   */
  async callMCPTool(toolName: string, args: Record<string, any>): Promise<{
    success: boolean;
    output: string;
  }> {
    // 解析工具名称
    const [serverName, actualToolName] = toolName.split(':');

    if (!serverName || !actualToolName) {
      return {
        success: false,
        output: `Invalid MCP tool name: ${toolName}`,
      };
    }

    const manager = getMCPManager();
    const result = await manager.callTool(serverName, actualToolName, args);

    if (!result) {
      return {
        success: false,
        output: `Failed to call MCP tool: ${toolName}`,
      };
    }

    // 处理结果
    let output = '';
    if (result.content) {
      for (const content of result.content) {
        if (content.type === 'text') {
          output += content.text;
        } else if (content.type === 'image') {
          output += `[Image: ${content.data}]`;
        }
      }
    }

    return {
      success: !result.isError,
      output: output || 'Tool executed successfully',
    };
  }

  /**
   * 获取 MCP 工具列表摘要
   */
  getSummary(): string {
    const manager = getMCPManager();
    const status = manager.getStatus();

    let output = `MCP 服务器连接: ${status.connected.length}\n`;
    output += `可用工具: ${status.totalTools}\n`;

    if (status.connected.length > 0) {
      output += '\n连接的服务器:\n';
      for (const server of status.connected) {
        const tools = manager.getServerTools(server);
        output += `  ${server} (${tools.length} 工具)\n`;
        for (const tool of tools) {
          output += `    - ${tool.name}: ${tool.description}\n`;
        }
      }
    }

    return output;
  }
}

let defaultRegistry: MCPToolRegistry | null = null;

export function getMCPRegistry(): MCPToolRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new MCPToolRegistry();
  }
  return defaultRegistry;
}

export function resetMCPRegistry(): void {
  defaultRegistry = null;
}