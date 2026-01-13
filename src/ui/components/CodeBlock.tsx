// 代码语法高亮组件

import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/index.js';
import type { Message } from './MessageList.js';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lines = code.split('\n');
  const maxLineNumber = lines.length.toString().length;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      paddingX: 1,
      borderStyle: 'single',
      borderColor: colors.primaryDark,
      marginBottom: 1,
    },
    React.createElement(
      Box,
      {
        marginBottom: 1,
      },
      React.createElement(
        Text,
        { color: colors.primaryLight, bold: true },
        language ? `${language}` : '代码'
      )
    ),
    ...lines.map((line, index) =>
      React.createElement(
        Box,
        { key: index },
        React.createElement(Text, { color: colors.textDim }, `${(index + 1).toString().padStart(maxLineNumber, ' ')} │`),
        React.createElement(
          Text,
          {},
          highlightSyntax(line, language)
        )
      )
    )
  );
}

// 简单的语法高亮（实际项目中可以使用 prism 或 highlight.js）
function highlightSyntax(line: string, language?: string): string {
  if (!language) return line;

  // 关键字高亮
  const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'interface', 'type'];
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    line = line.replace(regex, `{bold ${keyword}}`);
  }

  // 字符串高亮
  line = line.replace(/(['"`])(.*?)\1/g, `{green $&}`);

  // 注释高亮
  line = line.replace(/(\/\/.*$|#.*$)/gm, `{dim $1}`);

  return line;
}

// 在消息中渲染代码块
export function renderMessageWithCode(message: Message): React.ReactNode {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(message.content)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      parts.push(
        React.createElement(Text, { key: lastIndex }, message.content.slice(lastIndex, match.index))
      );
    }

    // 添加代码块
    parts.push(
      React.createElement(CodeBlock, {
        key: match.index,
        code: match[2],
        language: match[1] || undefined,
      })
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < message.content.length) {
    parts.push(
      React.createElement(Text, { key: lastIndex }, message.content.slice(lastIndex))
    );
  }

  if (parts.length === 0) {
    return React.createElement(Text, {}, message.content);
  }

  return React.createElement(Box, { flexDirection: 'column' }, ...parts);
}