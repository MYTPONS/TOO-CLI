// 主题配置

// 颜色定义
export const colors = {
  // 主色调
  primary: '#FF6B00',
  primaryLight: '#FF8C42',
  primaryDark: '#CC5500',

  // 背景色
  background: '#1A1A1A',
  backgroundLight: '#2D2D2D',
  backgroundDark: '#0D0D0D',

  // 文字色
  text: '#FFFFFF',
  textMuted: '#888888',
  textDim: '#666666',

  // 语义色
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // 边框色
  border: '#3D3D3D',
  borderLight: '#4D4D4D',
  borderFocus: '#FF6B00',

  // 特殊色
  highlight: '#FFD700',
  code: '#E0E0E0',
  codeBackground: '#252525',
};

// 间距定义
export const spacing = {
  none: 0,
  xs: 1,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

// 边框样式
export const borders = {
  none: undefined,
  single: 'single' as const,
  double: 'double' as const,
  round: 'round' as const,
  bold: 'bold' as const,
  classic: 'classic' as const,
};

// 主题对象
export const theme = {
  colors,
  spacing,
  borders,
};

// 消息角色样式
export const roleStyles = {
  user: {
    label: '你',
    color: colors.primaryLight,
    prefix: '>',
  },
  assistant: {
    label: '助手',
    color: colors.success,
    prefix: '<',
  },
  system: {
    label: '系统',
    color: colors.info,
    prefix: '*',
  },
  error: {
    label: '错误',
    color: colors.error,
    prefix: '!',
  },
  tool: {
    label: '工具',
    color: colors.warning,
    prefix: '#',
  },
};

// 状态样式
export const statusStyles = {
  connected: {
    label: '已连接',
    color: colors.success,
  },
  disconnected: {
    label: '未连接',
    color: colors.error,
  },
  connecting: {
    label: '连接中',
    color: colors.warning,
  },
  error: {
    label: '错误',
    color: colors.error,
  },
};

export default theme;
