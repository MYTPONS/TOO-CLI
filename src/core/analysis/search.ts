// 代码搜索模块

import fs from 'fs';
import path from 'path';
import { getIndexer, type CodeIndexer } from './indexer.js';
import type {
  SearchResult,
  SearchOptions,
  FileInfo,
  CodeSymbol,
} from './types.js';

/**
 * 搜索器类
 */
export class CodeSearcher {
  private indexer: CodeIndexer;

  constructor(indexer?: CodeIndexer) {
    this.indexer = indexer || getIndexer();
  }

  /**
   * 搜索文件
   */
  async searchFiles(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();

    const files = this.indexer.getFiles();

    for (const file of files) {
      const fileName = path.basename(file.path);
      const matchName = options.caseSensitive ? fileName : fileName.toLowerCase();

      if (matchName.includes(query)) {
        results.push({
          type: 'file',
          path: file.path,
          match: fileName,
          context: `${file.language} - ${file.lines} lines`,
        });
      }
    }

    return this.limitResults(results, options.maxResults);
  }

  /**
   * 搜索符号
   */
  async searchSymbols(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();

    const symbols = this.indexer.getSymbols();

    for (const symbol of symbols) {
      // 语言过滤
      if (options.language) {
        const file = this.indexer.getFiles().find(f => f.path === symbol.filePath);
        if (file?.language !== options.language) {
          continue;
        }
      }

      const matchName = options.caseSensitive ? symbol.name : symbol.name.toLowerCase();

      if (matchName.includes(query)) {
        results.push({
          type: 'symbol',
          path: symbol.filePath,
          line: symbol.startLine,
          column: symbol.startColumn,
          match: symbol.name,
          context: `${symbol.kind}`,
        });
      }
    }

    return this.limitResults(results, options.maxResults);
  }

  /**
   * 搜索文件内容
   */
  async searchContent(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const files = this.indexer.getFiles();

    // 语言过滤
    let searchFiles = files;
    if (options.language) {
      searchFiles = files.filter(f => f.language === options.language);
    }

    for (const file of searchFiles) {
      try {
        const content = await fs.promises.readFile(file.path, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matchLine = options.caseSensitive ? line : line.toLowerCase();

          let matches: number[] = [];

          if (options.regex) {
            try {
              const regex = new RegExp(options.query, options.caseSensitive ? 'g' : 'gi');
              let match;
              while ((match = regex.exec(line)) !== null) {
                matches.push(match.index);
              }
            } catch {
              // 无效的正则表达式，跳过
            }
          } else {
            let index = 0;
            while (true) {
              const found = matchLine.indexOf(options.query, index);
              if (found === -1) break;
              matches.push(found);
              index = found + 1;
            }
          }

          if (matches.length > 0) {
            // 获取上下文
            const contextStart = Math.max(0, i - 2);
            const contextEnd = Math.min(lines.length - 1, i + 2);
            const contextLines = lines.slice(contextStart, contextEnd + 1)
              .map((l, idx) => (idx + contextStart === i ? `> ${l}` : `  ${l}`))
              .join('\n');

            results.push({
              type: 'content',
              path: file.path,
              line: i + 1,
              match: line.trim(),
              context: contextLines,
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to search in ${file.path}:`, error);
      }
    }

    return this.limitResults(results, options.maxResults);
  }

  /**
   * 综合搜索
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const searchType = options.type || 'all';

    switch (searchType) {
      case 'file':
        return this.searchFiles(options);
      case 'symbol':
        return this.searchSymbols(options);
      case 'content':
        return this.searchContent(options);
      case 'all':
      default:
        const [files, symbols, content] = await Promise.all([
          this.searchFiles(options),
          this.searchSymbols(options),
          this.searchContent(options),
        ]);

        return this.limitResults([...files, ...symbols, ...content], options.maxResults);
    }
  }

  /**
   * 限制结果数量
   */
  private limitResults(results: SearchResult[], max?: number): SearchResult[] {
    if (!max || max <= 0) {
      return results;
    }
    return results.slice(0, max);
  }

  /**
   * 查找文件
   */
  async findFile(filePath: string): Promise<FileInfo | null> {
    const files = this.indexer.getFiles();
    return files.find(f => f.path === filePath) || null;
  }

  /**
   * 查找符号
   */
  async findSymbol(symbolName: string, filePath?: string): Promise<CodeSymbol[]> {
    const symbols = this.indexer.getSymbols();
    const query = symbolName.toLowerCase();

    return symbols.filter(s => {
      if (filePath && s.filePath !== filePath) {
        return false;
      }
      return s.name.toLowerCase().includes(query);
    });
  }
}

/**
 * 默认搜索器实例
 */
let defaultSearcher: CodeSearcher | null = null;

/**
 * 获取默认搜索器
 */
export function getSearcher(): CodeSearcher {
  if (!defaultSearcher) {
    defaultSearcher = new CodeSearcher();
  }
  return defaultSearcher;
}

/**
 * 重置默认搜索器
 */
export function resetSearcher(): void {
  defaultSearcher = null;
}