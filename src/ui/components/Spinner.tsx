import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/index.js';

// 加载动画帧（纯字符，无表情包）
const spinnerFrames = ['|', '/', '-', '\\'];
const dotsFrames = ['.  ', '.. ', '...', '   '];
const barFrames = ['[=   ]', '[==  ]', '[=== ]', '[====]', '[ ===]', '[  ==]', '[   =]', '[    ]'];

export type SpinnerType = 'spinner' | 'dots' | 'bar';
export type SpinnerStatus = 'loading' | 'success' | 'error';

export interface SpinnerProps {
  text?: string;
  type?: SpinnerType;
  status?: SpinnerStatus;
  speed?: number;
}

const framesByType: Record<SpinnerType, string[]> = {
  spinner: spinnerFrames,
  dots: dotsFrames,
  bar: barFrames,
};

export function Spinner({
  text = '加载中',
  type = 'spinner',
  status = 'loading',
  speed = 100,
}: SpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = framesByType[type];

  useEffect(() => {
    if (status !== 'loading') return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [status, frames.length, speed]);

  // 根据状态显示不同内容
  if (status === 'success') {
    return React.createElement(
      Box,
      { gap: 1 },
      React.createElement(
        Text,
        { color: colors.success, bold: true },
        '[OK]'
      ),
      React.createElement(
        Text,
        { color: colors.text },
        text
      )
    );
  }

  if (status === 'error') {
    return React.createElement(
      Box,
      { gap: 1 },
      React.createElement(
        Text,
        { color: colors.error, bold: true },
        '[ERR]'
      ),
      React.createElement(
        Text,
        { color: colors.error },
        text
      )
    );
  }

  // 加载中状态
  return React.createElement(
    Box,
    { gap: 1 },
    React.createElement(
      Text,
      { color: colors.primary, bold: true },
      frames[frameIndex]
    ),
    React.createElement(
      Text,
      { color: colors.textMuted },
      text
    )
  );
}

export default Spinner;
