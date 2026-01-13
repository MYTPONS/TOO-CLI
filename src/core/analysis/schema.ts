// 项目分析架构配置

import type { IndexConfig } from './types.js';

/**
 * 默认索引配置
 */
export const DEFAULT_INDEX_CONFIG: IndexConfig = {
  autoIndex: true,
  indexInterval: 60000, // 1分钟
  watchChanges: false, // 暂不支持实时监听
};

/**
 * 支持的文件扩展名和语言映射
 */
export const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.mts': 'typescript',
  '.cts': 'typescript',

  // Python
  '.py': 'python',
  '.pyi': 'python',
  '.pyw': 'python',

  // Go
  '.go': 'go',

  // Rust
  '.rs': 'rust',

  // Java
  '.java': 'java',
  '.kt': 'kotlin',
  '.scala': 'scala',

  // C/C++
  '.c': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.hxx': 'cpp',

  // C#
  '.cs': 'csharp',

  // PHP
  '.php': 'php',

  // Ruby
  '.rb': 'ruby',

  // Swift
  '.swift': 'swift',

  // Objective-C
  '.m': 'objc',
  '.mm': 'objc',

  // Shell
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',

  // Web
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',

  // Config
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.ini': 'ini',
  '.conf': 'conf',

  // Markdown
  '.md': 'markdown',
  '.markdown': 'markdown',

  // Other
  '.txt': 'text',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
};

/**
 * 默认排除的目录
 */
export const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  '.vscode',
  '.idea',
  'coverage',
  '__pycache__',
  'venv',
  'env',
  '.venv',
  'node_modules',
  'bower_components',
  '.cache',
  '.tmp',
  'tmp',
];

/**
 * 默认排除的文件
 */
export const DEFAULT_EXCLUDE_FILES = [
  '*.log',
  '*.lock',
  '*.pid',
  '*.seed',
  '*.pid.lock',
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  '.gitattributes',
  '.npmrc',
  '.yarnrc',
];

/**
 Tree-sitter 语言映射
 */
export const TREE_SITTER_LANGUAGES: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'python',
  go: 'go',
  rust: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  php: 'php',
  ruby: 'ruby',
  swift: 'swift',
  html: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  sql: 'sql',
  graphql: 'graphql',
};

/**
 * 符号类型映射（Tree-sitter -> 内部类型）
 */
export const SYMBOL_KIND_MAP: Record<string, string> = {
  function_declaration: 'function',
  function_definition: 'function',
  method_definition: 'method',
  arrow_function: 'function',
  class_definition: 'class',
  interface_declaration: 'interface',
  type_alias_declaration: 'type',
  variable_declaration: 'variable',
  const_declaration: 'constant',
  property_declaration: 'property',
  import_statement: 'import',
  export_statement: 'export',
  namespace_declaration: 'namespace',
  module_declaration: 'module',
  enum_declaration: 'enum',
  enum_member: 'enum_member',
  struct_declaration: 'struct',
  trait_declaration: 'trait',
  implementation_declaration: 'implementation',
};

/**
 * 依赖配置文件映射
 */
export const DEPENDENCY_FILES: Record<string, { type: string; source: string }> = {
  'package.json': { type: 'runtime', source: 'npm' },
  'package-lock.json': { type: 'runtime', source: 'npm' },
  'yarn.lock': { type: 'runtime', source: 'yarn' },
  'pnpm-lock.yaml': { type: 'runtime', source: 'pnpm' },
  'Cargo.toml': { type: 'runtime', source: 'cargo' },
  'Cargo.lock': { type: 'runtime', source: 'cargo' },
  'requirements.txt': { type: 'runtime', source: 'pip' },
  'Pipfile': { type: 'runtime', source: 'pip' },
  'pyproject.toml': { type: 'runtime', source: 'pip' },
  'go.mod': { type: 'runtime', source: 'go' },
  'go.sum': { type: 'runtime', source: 'go' },
  'pom.xml': { type: 'runtime', source: 'maven' },
  'build.gradle': { type: 'runtime', source: 'gradle' },
  'build.gradle.kts': { type: 'runtime', source: 'gradle' },
};