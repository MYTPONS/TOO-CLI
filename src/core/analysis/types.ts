// 项目分析类型定义

/**
 * 文件类型
 */
export enum FileType {
  SOURCE = 'source',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation',
  ASSET = 'asset',
  TEST = 'test',
  BUILD = 'build',
  OTHER = 'other',
}

/**
 * 文件信息
 */
export interface FileInfo {
  path: string;
  type: FileType;
  language?: string;
  size: number;
  lines?: number;
  lastModified: Date;
}

/**
 * 代码符号类型
 */
export enum SymbolKind {
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  TYPE = 'type',
  VARIABLE = 'variable',
  CONSTANT = 'constant',
  PROPERTY = 'property',
  METHOD = 'method',
  PARAMETER = 'parameter',
  IMPORT = 'import',
  EXPORT = 'export',
  NAMESPACE = 'namespace',
  MODULE = 'module',
  MACRO = 'macro',
  ENUM = 'enum',
  ENUM_MEMBER = 'enum_member',
  STRUCT = 'struct',
  TRAIT = 'trait',
  IMPLEMENTATION = 'implementation',
}

/**
 * 代码符号
 */
export interface CodeSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  parent?: string;
  children?: string[];
  documentation?: string;
}

/**
 * 依赖项
 */
export interface Dependency {
  name: string;
  version?: string;
  type: 'runtime' | 'dev' | 'peer' | 'optional';
  source: 'npm' | 'yarn' | 'pnpm' | 'cargo' | 'pip' | 'go' | 'maven' | 'gradle' | 'other';
}

/**
 * 项目依赖图
 */
export interface DependencyGraph {
  direct: Dependency[];
  indirect: Dependency[];
  outdated?: Dependency[];
}

/**
 * 项目结构
 */
export interface ProjectStructure {
  root: string;
  name: string;
  files: FileInfo[];
  directories: string[];
  totalSize: number;
  totalLines: number;
  languages: Record<string, number>; // language -> file count
}

/**
 * 代码统计
 */
export interface CodeStats {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  totalClasses: number;
  languages: Record<string, {
    files: number;
    lines: number;
    functions: number;
    classes: number;
  }>;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  type: 'file' | 'symbol' | 'content';
  path: string;
  line?: number;
  column?: number;
  match: string;
  context?: string;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  query: string;
  type?: 'file' | 'symbol' | 'content' | 'all';
  language?: string;
  caseSensitive?: boolean;
  regex?: boolean;
  maxResults?: number;
}

/**
 * 分析选项
 */
export interface AnalysisOptions {
  includeTests?: boolean;
  includeNodeModules?: boolean;
  includeGit?: boolean;
  maxDepth?: number;
  filePatterns?: string[];
  excludePatterns?: string[];
}

/**
 * 项目分析结果
 */
export interface AnalysisResult {
  structure: ProjectStructure;
  stats: CodeStats;
  dependencies: DependencyGraph;
  symbols: CodeSymbol[];
  errors: string[];
}

/**
 * 索引状态
 */
export interface IndexStatus {
  isIndexing: boolean;
  lastIndexed?: Date;
  fileCount: number;
  symbolCount: number;
}

/**
 * 索引配置
 */
export interface IndexConfig {
  autoIndex: boolean;
  indexInterval: number; // 毫秒
  watchChanges: boolean;
}