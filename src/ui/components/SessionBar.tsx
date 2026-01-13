// 会话栏组件 - 显示当前会话信息和快捷操作

import React from 'react';
import { Box, Text } from 'ink';
import { colors, borders } from '../themes/index.js';
import type { SessionMetadata } from '../../core/session/types.js';

interface SessionBarProps {
  session: SessionMetadata | null;
  onNewSession?: () => void;
  onShowHistory?: () => void;
}

export function SessionBar({ session, onNewSession, onShowHistory }: SessionBarProps) {
  return React.createElement(
    Box,
    {
      borderStyle: borders.single,
      borderColor: colors.primary,
      paddingX: 1,
      marginBottom: 1,
      justifyContent: 'space-between',
    },
    React.createElement(
      Box,
      { gap: 1 },
      React.createElement(Text, { color: colors.primary, bold: true }, '会话:'),
      React.createElement(
        Text,
        { color: colors.text },
        session ? session.title : '无会话'
      ),
      session &&
        React.createElement(
          Text,
          { color: colors.textDim },
          `(${session.messageCount} 消息)`
        )
    ),
    React.createElement(
      Box,
      { gap: 2 },
      onNewSession &&
        React.createElement(Text, { color: colors.primaryLight }, '[N] 新建'),
      onShowHistory &&
        React.createElement(Text, { color: colors.primaryLight }, '[H] 历史')
    )
  );
}