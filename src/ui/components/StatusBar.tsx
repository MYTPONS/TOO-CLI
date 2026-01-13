import React from 'react';
import { Box, Text } from 'ink';
import { colors, statusStyles } from '../themes/index.js';

export interface StatusBarProps {
  provider: string;
  model: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export function StatusBar({ provider, model, status, tokenUsage }: StatusBarProps) {
  const statusStyle = statusStyles[status];

  return React.createElement(
    Box,
    {
      borderStyle: 'single',
      borderColor: colors.border,
      paddingX: 1,
      justifyContent: 'space-between',
    },
    // 左侧：提供商和模型
    React.createElement(
      Box,
      { gap: 1 },
      React.createElement(
        Text,
        { color: colors.primary, bold: true },
        `[${provider}]`
      ),
      React.createElement(
        Text,
        { color: colors.text },
        model
      ),
      React.createElement(
        Text,
        { color: colors.textMuted },
        '|'
      ),
      React.createElement(
        Text,
        { color: statusStyle.color },
        statusStyle.label
      )
    ),
    // 右侧：Token 使用统计
    tokenUsage && React.createElement(
      Box,
      { gap: 1 },
      React.createElement(
        Text,
        { color: colors.textMuted },
        'Token:'
      ),
      React.createElement(
        Text,
        { color: colors.info },
        `${tokenUsage.input}/${tokenUsage.output}`
      )
    )
  );
}

export default StatusBar;
