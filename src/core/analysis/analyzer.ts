// 项目分析器 - 提供项目概览和依赖分析

import path from 'path';
import fs from 'fs';
import { getIndexer } from './indexer.js';
import type {
  AnalysisResult,
  ProjectStructure,
  CodeStats,
  DependencyGraph,
  Dependency,
  AnalysisOptions,
  IndexStatus,
} from './types.js';
import { DEPENDENCY_FILES } from './schema.js';

/**
 * 项目分析器类
 */
export class ProjectAnalyzer {
  private lastAnalyzed: Date | null = null;

  /**
   * 分析项目
   */
  async analyzeProject(
    projectPath: string,
    options: AnalysisOptions = {}
  ): Promise<AnalysisResult> {
    const errors: string[] = [];

    try {
      // 索引项目
      const indexer = getIndexer();
      const structure = await indexer.indexProject(projectPath, options);

      // 计算代码统计
      const stats = this.calculateStats(structure);

      // 分析依赖
      const dependencies = await this.analyzeDependencies(projectPath);

      // 获取符号
      const symbols = indexer.getSymbols();

      this.lastAnalyzed = new Date();

      return {
        structure,
        stats,
        dependencies,
        symbols,
        errors,
      };
    } catch (error) {
      errors.push((error as Error).message);
      return {
        structure: this.getEmptyStructure(projectPath),
        stats: this.getEmptyStats(),
        dependencies: { direct: [], indirect: [] },
        symbols: [],
        errors,
      };
    }
  }

  /**
   * 获取项目概览
   */
  async getOverview(projectPath: string): Promise<{
    name: string;
    structure: ProjectStructure;
    stats: CodeStats;
  }> {
    const indexer = getIndexer();
    const structure = await indexer.indexProject(projectPath);
    const stats = this.calculateStats(structure);

    return {
      name: structure.name,
      structure,
      stats,
    };
  }

  /**
   * 计算代码统计
   */
  private calculateStats(structure: ProjectStructure): CodeStats {
    const stats: CodeStats = {
      totalFiles: structure.files.length,
      totalLines: structure.totalLines,
      totalFunctions: 0,
      totalClasses: 0,
      languages: {},
    };

    const indexer = getIndexer();
    const symbols = indexer.getSymbols();

    // 统计函数和类
    for (const symbol of symbols) {
      if (symbol.kind === 'function') {
        stats.totalFunctions++;
      } else if (symbol.kind === 'class') {
        stats.totalClasses++;
      }
    }

    // 按语言统计
    for (const file of structure.files) {
      if (file.language) {
        if (!stats.languages[file.language]) {
          stats.languages[file.language] = {
            files: 0,
            lines: 0,
            functions: 0,
            classes: 0,
          };
        }

        stats.languages[file.language].files++;
        stats.languages[file.language].lines += file.lines || 0;
      }
    }

    // 统计每种语言的函数和类
    for (const symbol of symbols) {
      const file = structure.files.find(f => f.path === symbol.filePath);
      if (file && file.language && stats.languages[file.language]) {
        if (symbol.kind === 'function') {
          stats.languages[file.language].functions++;
        } else if (symbol.kind === 'class') {
          stats.languages[file.language].classes++;
        }
      }
    }

    return stats;
  }

  /**
   * 分析依赖
   */
  private async analyzeDependencies(projectPath: string): Promise<DependencyGraph> {
    const direct: Dependency[] = [];
    const indirect: Dependency[] = [];

    // 检查各种依赖文件
    for (const [fileName, config] of Object.entries(DEPENDENCY_FILES)) {
      const filePath = path.join(projectPath, fileName);

      try {
        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const deps = this.parseDependencyFile(fileName, content, config.type, config.source);

          if (fileName === 'package.json') {
            direct.push(...deps);
          } else if (fileName.endsWith('.lock')) {
            indirect.push(...deps);
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${fileName}:`, error);
      }
    }

    return { direct, indirect };
  }

  /**
   * 解析依赖文件
   */
  private parseDependencyFile(
    fileName: string,
    content: string,
    _type: string,
    source: string
  ): Dependency[] {
    const deps: Dependency[] = [];

    try {
      if (fileName === 'package.json') {
        const pkg = JSON.parse(content);

        // dependencies
        if (pkg.dependencies) {
          for (const [name, version] of Object.entries(pkg.dependencies)) {
            deps.push({
              name,
              version: version as string,
              type: 'runtime' as any,
              source: source as any,
            });
          }
        }

        // devDependencies
        if (pkg.devDependencies) {
          for (const [name, version] of Object.entries(pkg.devDependencies)) {
            deps.push({
              name,
              version: version as string,
              type: 'dev',
              source: source as any,
            });
          }
        }

        // peerDependencies
        if (pkg.peerDependencies) {
          for (const [name, version] of Object.entries(pkg.peerDependencies)) {
            deps.push({
              name,
              version: version as string,
              type: 'peer',
              source: source as any,
            });
          }
        }
      } else if (fileName === 'requirements.txt') {
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const [name, version] = line.split(/[=<>!~]+/);
            if (name) {
              deps.push({
                name: name.trim(),
                version: version?.trim(),
                type: 'runtime',
                source: source as any,
              });
            }
          }
        }
      } else if (fileName === 'go.mod') {
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^require\s+(\S+)\s+(.+)$/);
          if (match) {
            deps.push({
              name: match[1],
              version: match[2],
              type: 'runtime',
              source: source as any,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to parse ${fileName}:`, error);
    }

    return deps;
  }

  /**
   * 获取索引状态
   */
  getIndexStatus(): IndexStatus {
    const indexer = getIndexer();
    const status = indexer.getStatus();

    return {
      isIndexing: false,
      lastIndexed: this.lastAnalyzed || undefined,
      fileCount: status.fileCount,
      symbolCount: status.symbolCount,
    };
  }

  /**
   * 获取空结构
   */
  private getEmptyStructure(projectPath: string): ProjectStructure {
    return {
      root: projectPath,
      name: path.basename(projectPath),
      files: [],
      directories: [],
      totalSize: 0,
      totalLines: 0,
      languages: {},
    };
  }

  /**
   * 获取空统计
   */
  private getEmptyStats(): CodeStats {
    return {
      totalFiles: 0,
      totalLines: 0,
      totalFunctions: 0,
      totalClasses: 0,
      languages: {},
    };
  }

  /**
   * 格式化分析结果
   */
  formatAnalysisResult(result: AnalysisResult): string {
    let output = '';

    // 项目信息
    output += `项目: ${result.structure.name}\n`;
    output += `路径: ${result.structure.root}\n\n`;

    // 统计信息
    output += '统计信息:\n';
    output += `  文件总数: ${result.stats.totalFiles}\n`;
    output += `  代码行数: ${result.stats.totalLines}\n`;
    output += `  函数数量: ${result.stats.totalFunctions}\n`;
    output += `  类数量: ${result.stats.totalClasses}\n\n`;

    // 语言分布
    output += '语言分布:\n';
    for (const [lang, stats] of Object.entries(result.stats.languages)) {
      output += `  ${lang}: ${stats.files} 文件, ${stats.lines} 行\n`;
    }
    output += '\n';

    // 依赖信息
    if (result.dependencies.direct.length > 0) {
      output += `直接依赖 (${result.dependencies.direct.length}):\n`;
      for (const dep of result.dependencies.direct.slice(0, 10)) {
        output += `  - ${dep.name}@${dep.version}\n`;
      }
      if (result.dependencies.direct.length > 10) {
        output += `  ... 还有 ${result.dependencies.direct.length - 10} 个\n`;
      }
      output += '\n';
    }

    // 错误信息
    if (result.errors.length > 0) {
      output += '错误:\n';
      for (const error of result.errors) {
        output += `  - ${error}\n`;
      }
    }

    return output;
  }
}

/**
 * 默认分析器实例
 */
let defaultAnalyzer: ProjectAnalyzer | null = null;

/**
 * 获取默认分析器
 */
export function getAnalyzer(): ProjectAnalyzer {
  if (!defaultAnalyzer) {
    defaultAnalyzer = new ProjectAnalyzer();
  }
  return defaultAnalyzer;
}

/**
 * 重置默认分析器
 */
export function resetAnalyzer(): void {
  defaultAnalyzer = null;
}