// 代码库索引器 - 使用 web-tree-sitter

import path from 'path';
import fs from 'fs';
import Parser from 'web-tree-sitter';
import { globby } from 'globby';
import type {
  FileInfo,
  CodeSymbol,
  ProjectStructure,
  SymbolKind,
} from './types.js';
import { FileType } from './types.js';
import {
  LANGUAGE_MAP,
  DEFAULT_EXCLUDE_DIRS,
  DEFAULT_EXCLUDE_FILES,
  TREE_SITTER_LANGUAGES,
  SYMBOL_KIND_MAP,
} from './schema.js';

/**
 * 索引器类
 */
export class CodeIndexer {
  private parser: Parser | null = null;
  private languageCache: Map<string, any> = new Map();
  private files: Map<string, FileInfo> = new Map();
  private symbols: Map<string, CodeSymbol> = new Map();

  constructor() {
    this.initParser();
  }

  /**
   * 初始化 Tree-sitter 解析器
   */
  private async initParser(): Promise<void> {
    try {
      await Parser.init();
      this.parser = new Parser();
    } catch (error) {
      console.error('Failed to initialize tree-sitter:', error);
    }
  }

  /**
   * 获取语言解析器
   */
  private async getLanguage(language: string): Promise<any> {
    if (this.languageCache.has(language)) {
      return this.languageCache.get(language);
    }

    const tsLang = TREE_SITTER_LANGUAGES[language];
    if (!tsLang) {
      return null;
    }

    try {
      // 动态导入语言解析器
      const langModule = await import(`tree-sitter-${tsLang}`);
      const lang = langModule.default || langModule;
      this.languageCache.set(language, lang);
      return lang;
    } catch (error) {
      console.warn(`Failed to load tree-sitter-${tsLang}:`, error);
      return null;
    }
  }

  /**
   * 索引项目
   */
  async indexProject(rootPath: string, options: {
    includeTests?: boolean;
    includeNodeModules?: boolean;
    filePatterns?: string[];
    excludePatterns?: string[];
  } = {}): Promise<ProjectStructure> {
    const {
      includeTests = true,
      includeNodeModules = false,
      filePatterns,
      excludePatterns,
    } = options;

    // 清空现有索引
    this.files.clear();
    this.symbols.clear();

    // 构建排除模式
    const exclude = [
      ...DEFAULT_EXCLUDE_DIRS,
      ...DEFAULT_EXCLUDE_FILES,
      ...(!includeNodeModules ? ['node_modules'] : []),
      ...(!includeTests ? ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'] : []),
      ...(excludePatterns || []),
    ];

    // 查找文件
    const patterns = filePatterns || ['**/*'];
    const filePaths = await globby(patterns, {
      cwd: rootPath,
      ignore: exclude,
      onlyFiles: true,
      absolute: true,
    });

    // 索引每个文件
    for (const filePath of filePaths) {
      await this.indexFile(filePath);
    }

    // 构建项目结构
    return this.buildStructure(rootPath);
  }

  /**
   * 索引单个文件
   */
  async indexFile(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.promises.stat(filePath);
      const ext = path.extname(filePath);
      const language = LANGUAGE_MAP[ext.toLowerCase()];

      if (!language) {
        return null;
      }

      // 读取文件内容
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;

      // 确定文件类型
      const fileType = this.getFileType(filePath);

      const fileInfo: FileInfo = {
        path: filePath,
        type: fileType,
        language,
        size: stats.size,
        lines,
        lastModified: stats.mtime,
      };

      this.files.set(filePath, fileInfo);

      // 解析代码符号
      await this.parseSymbols(filePath, content, language);

      return fileInfo;
    } catch (error) {
      console.warn(`Failed to index file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(filePath: string): FileType {
    const basename = path.basename(filePath).toLowerCase();

    if (basename.includes('test') || basename.includes('spec')) {
      return FileType.TEST;
    }

    if (['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts'].includes(basename)) {
      return FileType.CONFIG;
    }

    if (['readme.md', 'license', 'changelog.md', 'docs'].some(name => basename.includes(name))) {
      return FileType.DOCUMENTATION;
    }

    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(path.extname(filePath))) {
      return FileType.ASSET;
    }

    if (['dist', 'build', 'out'].some(dir => filePath.includes(dir))) {
      return FileType.BUILD;
    }

    return FileType.SOURCE;
  }

  /**
   * 解析代码符号
   */
  private async parseSymbols(filePath: string, content: string, language: string): Promise<void> {
    if (!this.parser) {
      return;
    }

    const lang = await this.getLanguage(language);
    if (!lang) {
      return;
    }

    try {
      this.parser.setLanguage(lang);
      const tree = this.parser.parse(content);

      // 遍历 AST 提取符号
      this.extractSymbols(tree.rootNode, filePath, language);
    } catch (error) {
      console.warn(`Failed to parse symbols in ${filePath}:`, error);
    }
  }

  /**
   * 提取符号
   */
  private extractSymbols(node: any, filePath: string, language: string, parent?: string): void {
    if (!node) return;

    const kind = node.type;
    const mappedKind = SYMBOL_KIND_MAP[kind];

    if (mappedKind) {
      const nameNode = this.findNameNode(node);
      const name = nameNode ? nameNode.text : kind;

      const symbol: CodeSymbol = {
        id: `${filePath}:${node.startIndex}:${name}`,
        name,
        kind: mappedKind as SymbolKind,
        filePath,
        startLine: node.startPosition.row + 1,
        startColumn: node.startPosition.column + 1,
        endLine: node.endPosition.row + 1,
        endColumn: node.endPosition.column + 1,
        parent,
      };

      this.symbols.set(symbol.id, symbol);

      // 添加到父节点的子节点
      if (parent) {
        const parentSymbol = this.symbols.get(parent);
        if (parentSymbol) {
          if (!parentSymbol.children) {
            parentSymbol.children = [];
          }
          parentSymbol.children.push(symbol.id);
        }
      }

      parent = symbol.id;
    }

    // 递归处理子节点
    for (const child of node.children) {
      this.extractSymbols(child, filePath, language, parent);
    }
  }

  /**
   * 查找名称节点
   */
  private findNameNode(node: any): any {
    // 简单实现：查找第一个 identifier 类型的节点
    for (const child of node.children) {
      if (child.type === 'identifier' || child.type === 'property_identifier') {
        return child;
      }
      const found = this.findNameNode(child);
      if (found) return found;
    }
    return null;
  }

  /**
   * 构建项目结构
   */
  private buildStructure(rootPath: string): ProjectStructure {
    const files = Array.from(this.files.values());
    const directories = new Set<string>();

    for (const file of files) {
      const dir = path.dirname(file.path);
      directories.add(dir);
    }

    // 统计语言
    const languages: Record<string, number> = {};
    for (const file of files) {
      if (file.language) {
        languages[file.language] = (languages[file.language] || 0) + 1;
      }
    }

    return {
      root: rootPath,
      name: path.basename(rootPath),
      files,
      directories: Array.from(directories),
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      totalLines: files.reduce((sum, f) => sum + (f.lines || 0), 0),
      languages,
    };
  }

  /**
   * 获取所有文件
   */
  getFiles(): FileInfo[] {
    return Array.from(this.files.values());
  }

  /**
   * 获取所有符号
   */
  getSymbols(): CodeSymbol[] {
    return Array.from(this.symbols.values());
  }

  /**
   * 获取文件的符号
   */
  getFileSymbols(filePath: string): CodeSymbol[] {
    return Array.from(this.symbols.values()).filter(s => s.filePath === filePath);
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.files.clear();
    this.symbols.clear();
  }

  /**
   * 获取索引状态
   */
  getStatus(): { fileCount: number; symbolCount: number } {
    return {
      fileCount: this.files.size,
      symbolCount: this.symbols.size,
    };
  }
}

/**
 * 默认索引器实例
 */
let defaultIndexer: CodeIndexer | null = null;

/**
 * 获取默认索引器
 */
export function getIndexer(): CodeIndexer {
  if (!defaultIndexer) {
    defaultIndexer = new CodeIndexer();
  }
  return defaultIndexer;
}

/**
 * 重置默认索引器
 */
export function resetIndexer(): void {
  defaultIndexer = null;
}