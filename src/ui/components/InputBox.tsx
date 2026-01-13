import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/index.js';

export interface InputBoxProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  showCursor?: boolean;
}

export function InputBox({
  value,
  placeholder = '输入消息...',
  disabled = false,
  showCursor = true,
}: InputBoxProps) {
  const [cursorVisible, setCursorVisible] = useState(true);

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor || disabled) {
      setCursorVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor, disabled]);

  const displayValue = value || '';
  const showPlaceholder = !displayValue && placeholder;

  return React.createElement(
    Box,
    {
      borderStyle: 'round',
      borderColor: disabled ? colors.border : colors.borderFocus,
      paddingX: 1,
      paddingY: 0,
    },
    // 提示符
    React.createElement(
      Text,
      { color: colors.primary, bold: true },
      '> '
    ),
    // 输入内容或占位符
    showPlaceholder
      ? React.createElement(
          Text,
          { color: colors.textDim },
          placeholder
        )
      : React.createElement(
          Text,
          { color: disabled ? colors.textMuted : colors.text },
          displayValue
        ),
    // 光标
    !disabled && cursorVisible && React.createElement(
      Text,
      { color: colors.primary, bold: true },
      '_'
    )
  );
}

export default InputBox;
