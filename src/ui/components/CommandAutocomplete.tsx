// 命令补全组件

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/index.js';

interface CommandAutocompleteProps {
  input: string;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

export function CommandAutocomplete({ input, suggestions, visible }: CommandAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      marginTop: 1,
      paddingX: 1,
      borderStyle: 'single',
      borderColor: colors.primary,
    },
    React.createElement(Text, { color: colors.primary, bold: true }, '补全建议'),
    ...suggestions.map((suggestion, index) =>
      React.createElement(
        Box,
        {
          key: suggestion,
        },
        React.createElement(
          Text,
          {
            color: index === selectedIndex ? colors.primaryLight : colors.text,
            bold: index === selectedIndex,
          },
          `${index === selectedIndex ? '> ' : '  '}${suggestion}`
        )
      )
    )
  );
}