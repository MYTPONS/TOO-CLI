// Diff 显示组件

import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/index.js';
import type { GitDiffLine, GitDiffHunk } from '../../core/git/types.js';

interface DiffViewProps {
  filePath: string;
  hunks: GitDiffHunk[];
  additions?: number;
  deletions?: number;
}

export function DiffView({ filePath, hunks, additions = 0, deletions = 0 }: DiffViewProps) {
  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      paddingX: 1,
      borderStyle: 'single',
      borderColor: colors.primary,
      marginBottom: 1,
    },
    // 文件头
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, { bold: true, color: colors.primary }, `文件: ${filePath}`),
      additions !== 0 && deletions !== 0 &&
        React.createElement(
          Text,
          { color: colors.textDim },
          ` (+${additions} -${deletions})`
        )
    ),
    // Diff 内容
    ...hunks.map((hunk, hunkIndex) =>
      React.createElement(
        Box,
        { key: hunkIndex, flexDirection: 'column', marginBottom: 1 },
        // Hunk 头
        React.createElement(
          Box,
          { marginBottom: 1 },
          React.createElement(
            Text,
            { color: colors.textDim, bold: true },
            `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
          )
        ),
        // Diff 行
        ...hunk.lines.map((line, lineIndex) => renderDiffLine(line, lineIndex))
      )
    )
  );
}

function renderDiffLine(line: GitDiffLine, index: number): React.ReactNode {
  let content: string;
  let color: string;

  switch (line.type) {
    case 'addition':
      color = colors.success;
      content = `+${line.content}`;
      break;
    case 'deletion':
      color = colors.error;
      content = `-${line.content}`;
      break;
    case 'context':
    default:
      color = colors.textDim;
      content = ` ${line.content}`;
      break;
  }

  return React.createElement(
    Box,
    { key: index },
    React.createElement(Text, { color }, content)
  );
}

// 格式化 diff 文本（用于纯文本输出）
export function formatDiffText(hunks: GitDiffHunk[], filePath: string): string {
  let output = `--- ${filePath}\n`;
  output += `+++ ${filePath}\n\n`;

  for (const hunk of hunks) {
    output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;

    for (const line of hunk.lines) {
      const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
      output += `${prefix}${line.content}\n`;
    }
  }

  return output;
}