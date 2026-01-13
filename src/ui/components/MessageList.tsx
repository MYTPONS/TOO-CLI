import React from 'react';
import { Box, Text } from 'ink';
import { colors, roleStyles } from '../themes/index.js';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
  content: string;
  timestamp?: Date;
  toolName?: string;
}

export interface MessageListProps {
  messages: Message[];
  maxHeight?: number;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function MessageItem({ message }: { message: Message }) {
  const style = roleStyles[message.role] || roleStyles.assistant;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      marginBottom: 1,
      paddingLeft: 1,
      borderStyle: 'single',
      borderColor: message.role === 'user' ? colors.primaryDark : colors.border,
      borderLeft: true,
      borderRight: false,
      borderTop: false,
      borderBottom: false,
    },
    // 消息头部
    React.createElement(
      Box,
      { gap: 1 },
      React.createElement(
        Text,
        { color: style.color, bold: true },
        `${style.prefix} ${message.toolName ? `[${message.toolName}]` : style.label}`
      ),
      message.timestamp && React.createElement(
        Text,
        { color: colors.textDim },
        formatTime(message.timestamp)
      )
    ),
    // 消息内容
    React.createElement(
      Box,
      { marginTop: 0, paddingLeft: 2 },
      React.createElement(
        Text,
        {
          color: message.role === 'error' ? colors.error : colors.text,
          wrap: 'wrap',
        },
        message.content
      )
    )
  );
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return React.createElement(
      Box,
      { padding: 1 },
      React.createElement(
        Text,
        { color: colors.textMuted },
        '暂无消息'
      )
    );
  }

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      flexGrow: 1,
      paddingX: 1,
    },
    messages.map((msg) =>
      React.createElement(MessageItem, { key: msg.id, message: msg })
    )
  );
}

export default MessageList;
