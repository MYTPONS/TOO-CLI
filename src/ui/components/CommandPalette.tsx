// 命令面板组件 - 简化版本

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors, borders } from '../themes/index.js';

export interface Command {
  id: string;
  label: string;
  description: string;
  icon?: string;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  isVisible: boolean;
  commands: Command[];
  query: string;
}

export function CommandPalette({
  isVisible,
  commands,
  query,
}: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 过滤命令
  const filteredCommands = React.useMemo(() => {
    if (!query) {
      return commands;
    }

    const searchQuery = query.toLowerCase().replace(/^\//, '');
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(searchQuery) ||
      cmd.description.toLowerCase().includes(searchQuery) ||
      cmd.id.toLowerCase().includes(searchQuery)
    );
  }, [commands, query]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  if (!isVisible) {
    return null;
  }

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      paddingX: 2,
      paddingY: 1,
    },
    // 标题
    React.createElement(
      Box,
      {
        marginBottom: 1,
      },
      React.createElement(
        Text,
        { bold: true, color: colors.primary },
        '命令面板'
      ),
      React.createElement(
        Text,
        { color: colors.textDim },
        ` (${filteredCommands.length} 个命令)`
      )
    ),
    // 输入框
    React.createElement(
      Box,
      {
        borderStyle: borders.single,
        borderColor: colors.primary,
        paddingX: 1,
        marginBottom: 1,
      },
      React.createElement(Text, { color: colors.text }, `> ${query}`)
    ),
    // 命令列表
    React.createElement(
      Box,
      {
        flexDirection: 'column',
      },
      filteredCommands.length === 0
        ? React.createElement(
            Box,
            { paddingY: 1 },
            React.createElement(Text, { color: colors.textDim }, '未找到匹配的命令')
          )
        : filteredCommands.slice(0, 10).map((cmd, index) =>
            React.createElement(
              Box,
              {
                key: cmd.id,
                paddingY: 1,
                paddingX: 1,
              },
              React.createElement(
                Text,
                {
                  color: index === selectedIndex ? colors.primary : colors.text,
                  bold: index === selectedIndex,
                },
                `${cmd.icon || '⚡'} ${cmd.label} - ${cmd.description}`
              )
            )
          )
    ),
    // 提示
    React.createElement(
      Box,
      {
        marginTop: 1,
      },
      React.createElement(Text, { color: colors.textDim }, '↑↓ 选择 | Enter 执行 | Esc 关闭')
    )
  );
}