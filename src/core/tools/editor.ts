// 文件编辑工具 - 支持编辑预览

import fs from 'fs/promises';
import { getDiffManager } from '../git/diff.js';

/**
 * 编辑文件
 */
export async function editFile(
  filePath: string,
  newContent: string,
  options: {
    createIfNotExists?: boolean;
    backup?: boolean;
  } = {}
): Promise<{ success: boolean; message: string; diff?: string }> {
  try {
    const { createIfNotExists = true, backup = false } = options;

    // 检查文件是否存在
    let oldContent = '';
    try {
      oldContent = await fs.readFile(filePath, 'utf-8');
    } catch {
      if (!createIfNotExists) {
        return { success: false, message: `文件不存在: ${filePath}` };
      }
    }

    // 创建备份
    if (backup && oldContent) {
      const backupPath = `${filePath}.backup`;
      await fs.writeFile(backupPath, oldContent);
    }

    // 生成 diff
    const diffManager = getDiffManager();
    const diffResult = diffManager.compareText(oldContent, newContent);
    const diffText = formatDiffResult(diffResult);

    // 写入新内容
    await fs.writeFile(filePath, newContent, 'utf-8');

    return {
      success: true,
      message: `文件已更新: ${filePath}`,
      diff: diffText,
    };
  } catch (error) {
    return {
      success: false,
      message: `编辑失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 格式化 diff 结果
 */
function formatDiffResult(diffResult: any): string {
  let output = '';

  for (const hunk of diffResult.hunks) {
    output += `行 ${hunk.oldStart}-${hunk.oldStart + hunk.oldLines - 1}:\n`;

    for (const line of hunk.lines) {
      if (line.type === 'deletion') {
        output += `  - ${line.content}\n`;
      } else if (line.type === 'addition') {
        output += `  + ${line.content}\n`;
      }
    }
  }

  return output || '无变更';
}

/**
 * 批量编辑文件
 */
export async function batchEditFiles(
  edits: Array<{ filePath: string; content: string }>
): Promise<{ success: boolean; results: Array<{ filePath: string; success: boolean; message: string }> }> {
  const results = [];

  for (const edit of edits) {
    const result = await editFile(edit.filePath, edit.content);
    results.push({
      filePath: edit.filePath,
      success: result.success,
      message: result.message,
    });
  }

  const allSuccess = results.every(r => r.success);

  return {
    success: allSuccess,
    results,
  };
}