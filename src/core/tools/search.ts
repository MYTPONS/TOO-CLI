// 文件搜索工具 - 使用 ripgrep 或 grep

import { execa } from 'execa';

/**
 * 搜索文件内容
 */
export async function searchInFiles(
  pattern: string,
  options: {
    directory?: string;
    filePattern?: string;
    caseSensitive?: boolean;
    maxResults?: number;
    contextLines?: number;
  } = {}
): Promise<{
  success: boolean;
  results: Array<{
    file: string;
    line: number;
    content: string;
    context?: string[];
  }>;
  message: string;
}> {
  try {
    const {
      directory = '.',
      filePattern,
      caseSensitive = false,
      maxResults = 50,
      contextLines = 2,
    } = options;

    // 构建 ripgrep 命令
    const args: string[] = [];

    if (!caseSensitive) {
      args.push('-i');
    }

    if (filePattern) {
      args.push('--glob', filePattern);
    }

    args.push('-C', String(contextLines));
    args.push('--max-count', String(maxResults));
    args.push(pattern);
    args.push(directory);

    const { stdout } = await execa('rg', args, { reject: false });

    if (!stdout) {
      return {
        success: true,
        results: [],
        message: '未找到匹配结果',
      };
    }

    const results = parseRipgrepOutput(stdout);

    return {
      success: true,
      results,
      message: `找到 ${results.length} 个匹配`,
    };
  } catch (error) {
    // ripgrep 不可用，尝试使用 grep
    return searchWithGrep(pattern, options);
  }
}

/**
 * 使用 grep 搜索
 */
async function searchWithGrep(
  pattern: string,
  options: {
    directory?: string;
    filePattern?: string;
    caseSensitive?: boolean;
    maxResults?: number;
    contextLines?: number;
  }
): Promise<{
  success: boolean;
  results: Array<{
    file: string;
    line: number;
    content: string;
    context?: string[];
  }>;
  message: string;
}> {
  try {
    const {
      directory = '.',
      filePattern,
      caseSensitive = false,
      maxResults = 50,
      contextLines = 2,
    } = options;

    const args: string[] = [];

    if (!caseSensitive) {
      args.push('-i');
    }

    args.push('-n');
    args.push('-C', String(contextLines));

    if (filePattern) {
      args.push('--include=' + filePattern);
    }

    args.push('-r');
    args.push(pattern);
    args.push(directory);

    const { stdout } = await execa('grep', args, { reject: false });

    if (!stdout) {
      return {
        success: true,
        results: [],
        message: '未找到匹配结果',
      };
    }

    const results = parseGrepOutput(stdout);

    return {
      success: true,
      results: results.slice(0, maxResults),
      message: `找到 ${results.length} 个匹配`,
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      message: `搜索失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 解析 ripgrep 输出
 */
function parseRipgrepOutput(output: string): Array<{
  file: string;
  line: number;
  content: string;
  context?: string[];
}> {
  const results: any[] = [];
  const lines = output.split('\n');
  let currentResult: any = null;
  let contextLines: string[] = [];

  for (const line of lines) {
    // ripgrep 格式: file:line:content
    const match = line.match(/^([^:]+):(\d+):(.*)$/);

    if (match) {
      if (currentResult) {
        currentResult.context = contextLines;
        results.push(currentResult);
      }

      currentResult = {
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3],
      };
      contextLines = [];
    } else if (currentResult) {
      contextLines.push(line);
    }
  }

  if (currentResult) {
    currentResult.context = contextLines;
    results.push(currentResult);
  }

  return results;
}

/**
 * 解析 grep 输出
 */
function parseGrepOutput(output: string): Array<{
  file: string;
  line: number;
  content: string;
  context?: string[];
}> {
  const results: any[] = [];
  const lines = output.split('\n');
  let currentResult: any = null;
  let contextLines: string[] = [];

  for (const line of lines) {
    // grep 格式: file:line:content 或 -- 标记
    if (line.startsWith('--')) {
      continue;
    }

    const match = line.match(/^([^:]+):(\d+):(.*)$/);

    if (match) {
      if (currentResult) {
        currentResult.context = contextLines;
        results.push(currentResult);
      }

      currentResult = {
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3],
      };
      contextLines = [];
    } else if (currentResult) {
      contextLines.push(line);
    }
  }

  if (currentResult) {
    currentResult.context = contextLines;
    results.push(currentResult);
  }

  return results;
}