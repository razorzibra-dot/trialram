/**
 * Ant Design Theme Configuration
 * Enterprise-grade Salesforce-inspired design system
 * Professional Blue Theme with Modern Corporate Look
 */

import type { ThemeConfig } from 'antd';

// Professional Blue Color Palette (Salesforce-inspired)
export const colors = {
  // Primary Blue - Professional Corporate
  primary: {
    50: '#E8F2FF',
    100: '#D0E5FF',
    200: '#A8D1FF',
    300: '#7AB8FF',
    400: '#4D9EFF',
    500: '#1B7CED', // Main Primary
    600: '#0B5FD1',
    700: '#0047B5',
    800: '#003399',
    900: '#002266',
  },
  
  // Neutral Grays - Clean and Professional
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Success Green
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  // Warning Orange
  warning: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Error Red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Info Blue
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
};

// Typography System
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
    '5xl': '36px',
    '6xl': '48px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const borderRadius = {
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// Ant Design Theme Configuration
export const antdTheme: ThemeConfig = {
  token: {
    // Color Tokens
    colorPrimary: colors.primary[500],
    colorSuccess: colors.success[500],
    colorWarning: colors.warning[500],
    colorError: colors.error[500],
    colorInfo: colors.info[500],
    
    // Background Colors
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: colors.neutral[50],
    colorBgSpotlight: colors.neutral[100],
    
    // Text Colors
    colorText: colors.neutral[800],
    colorTextSecondary: colors.neutral[600],
    colorTextTertiary: colors.neutral[500],
    colorTextQuaternary: colors.neutral[400],
    
    // Border Colors
    colorBorder: colors.neutral[200],
    colorBorderSecondary: colors.neutral[100],
    
    // Typography
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Line Height
    lineHeight: 1.5715,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.3,
    lineHeightHeading4: 1.35,
    lineHeightHeading5: 1.4,
    
    // Border Radius
    borderRadius: borderRadius.base,
    borderRadiusLG: borderRadius.lg,
    borderRadiusSM: borderRadius.sm,
    borderRadiusXS: borderRadius.sm,
    
    // Spacing
    padding: spacing.md,
    paddingLG: spacing.lg,
    paddingSM: spacing.sm,
    paddingXS: spacing.xs,
    paddingXL: spacing.xl,
    
    margin: spacing.md,
    marginLG: spacing.lg,
    marginSM: spacing.sm,
    marginXS: spacing.xs,
    marginXL: spacing.xl,
    
    // Control Heights
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,
    
    // Shadows
    boxShadow: shadows.base,
    boxShadowSecondary: shadows.sm,
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    
    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
    
    // Screen Breakpoints
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600,
  },
  
  components: {
    // Button Component
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 13,
      borderRadius: borderRadius.base,
      borderRadiusLG: borderRadius.md,
      borderRadiusSM: borderRadius.sm,
      paddingContentHorizontal: 16,
      paddingContentHorizontalLG: 20,
      paddingContentHorizontalSM: 12,
      fontWeight: typography.fontWeight.medium,
      primaryShadow: '0 2px 0 rgba(27, 124, 237, 0.1)',
    },
    
    // Input Component
    Input: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontSize: 14,
      borderRadius: borderRadius.base,
      paddingBlock: 8,
      paddingInline: 12,
      colorBorder: colors.neutral[300],
      colorBgContainer: '#FFFFFF',
      activeShadow: `0 0 0 2px ${colors.primary[100]}`,
    },
    
    // Select Component
    Select: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontSize: 14,
      borderRadius: borderRadius.base,
      optionPadding: '8px 12px',
      optionSelectedBg: colors.primary[50],
      optionActiveBg: colors.neutral[50],
    },
    
    // Table Component
    Table: {
      headerBg: colors.neutral[50],
      headerColor: colors.neutral[800],
      headerSortActiveBg: colors.neutral[100],
      headerSortHoverBg: colors.neutral[100],
      rowHoverBg: colors.primary[50],
      rowSelectedBg: colors.primary[50],
      rowSelectedHoverBg: colors.primary[100],
      borderColor: colors.neutral[200],
      fontSize: 14,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      headerSplitColor: colors.neutral[200],
      fixedHeaderSortActiveBg: colors.neutral[100],
    },
    
    // Card Component
    Card: {
      headerBg: 'transparent',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 48,
      paddingLG: spacing.lg,
      borderRadiusLG: borderRadius.lg,
      boxShadowTertiary: shadows.md,
    },
    
    // Modal Component
    Modal: {
      headerBg: '#FFFFFF',
      contentBg: '#FFFFFF',
      titleFontSize: 18,
      titleLineHeight: 1.4,
      borderRadiusLG: borderRadius.lg,
      boxShadow: shadows.xl,
    },
    
    // Drawer Component
    Drawer: {
      footerPaddingBlock: spacing.md,
      footerPaddingInline: spacing.lg,
      borderRadiusLG: borderRadius.lg,
    },
    
    // Menu Component
    Menu: {
      itemBg: 'transparent',
      itemColor: colors.neutral[700],
      itemHoverBg: colors.primary[50],
      itemHoverColor: colors.primary[600],
      itemSelectedBg: colors.primary[100],
      itemSelectedColor: colors.primary[700],
      itemActiveBg: colors.primary[100],
      itemBorderRadius: borderRadius.base,
      itemMarginBlock: 2,
      itemMarginInline: 4,
      itemPaddingInline: 12,
      iconSize: 18,
      iconMarginInlineEnd: 10,
      collapsedIconSize: 18,
      fontSize: 14,
      itemHeight: 40,
      subMenuItemBg: 'transparent',
    },
    
    // Layout Component
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 64,
      headerPadding: '0 24px',
      headerColor: colors.neutral[800],
      bodyBg: colors.neutral[50],
      footerBg: '#FFFFFF',
      footerPadding: '24px 50px',
      siderBg: '#FFFFFF',
      triggerBg: colors.neutral[100],
      triggerColor: colors.neutral[700],
      zeroTriggerWidth: 48,
      zeroTriggerHeight: 48,
    },
    
    // Breadcrumb Component
    Breadcrumb: {
      fontSize: 14,
      iconFontSize: 14,
      linkColor: colors.neutral[600],
      linkHoverColor: colors.primary[600],
      itemColor: colors.neutral[800],
      lastItemColor: colors.neutral[800],
      separatorColor: colors.neutral[400],
      separatorMargin: 8,
    },
    
    // Tabs Component
    Tabs: {
      itemColor: colors.neutral[600],
      itemHoverColor: colors.primary[600],
      itemSelectedColor: colors.primary[600],
      itemActiveColor: colors.primary[600],
      inkBarColor: colors.primary[500],
      cardBg: colors.neutral[50],
      cardHeight: 40,
      cardPadding: '8px 16px',
      cardPaddingSM: '6px 12px',
      cardPaddingLG: '10px 20px',
      titleFontSize: 14,
      titleFontSizeLG: 16,
      titleFontSizeSM: 13,
    },
    
    // Badge Component
    Badge: {
      statusSize: 8,
      dotSize: 8,
      textFontSize: 12,
      textFontSizeSM: 11,
      textFontWeight: typography.fontWeight.medium,
    },
    
    // Tag Component
    Tag: {
      defaultBg: colors.neutral[100],
      defaultColor: colors.neutral[700],
      fontSize: 13,
      fontSizeSM: 12,
      lineHeight: 1.5,
      borderRadiusSM: borderRadius.sm,
    },
    
    // Alert Component
    Alert: {
      withDescriptionIconSize: 24,
      defaultPadding: '12px 16px',
      withDescriptionPadding: '16px 20px',
      borderRadiusLG: borderRadius.md,
    },
    
    // Message Component
    Message: {
      contentBg: '#FFFFFF',
      contentPadding: '10px 16px',
      borderRadiusLG: borderRadius.md,
    },
    
    // Notification Component
    Notification: {
      width: 384,
      paddingMD: spacing.md,
      paddingContentHorizontalLG: spacing.lg,
      borderRadiusLG: borderRadius.lg,
    },
    
    // Pagination Component
    Pagination: {
      itemSize: 32,
      itemSizeSM: 24,
      itemActiveBg: colors.primary[500],
      itemLinkBg: '#FFFFFF',
      itemBg: 'transparent',
      itemInputBg: '#FFFFFF',
      miniOptionsSizeChangerTop: 0,
    },
    
    // Progress Component
    Progress: {
      defaultColor: colors.primary[500],
      remainingColor: colors.neutral[200],
      circleTextColor: colors.neutral[800],
      lineBorderRadius: borderRadius.full,
    },
    
    // Spin Component
    Spin: {
      contentHeight: 400,
      dotSize: 20,
      dotSizeSM: 14,
      dotSizeLG: 32,
    },
    
    // Switch Component
    Switch: {
      trackHeight: 22,
      trackHeightSM: 16,
      trackMinWidth: 44,
      trackMinWidthSM: 28,
      trackPadding: 2,
      handleSize: 18,
      handleSizeSM: 12,
      innerMinMargin: 6,
      innerMaxMargin: 24,
    },
    
    // Tooltip Component
    Tooltip: {
      colorBgSpotlight: colors.neutral[800],
      borderRadius: borderRadius.base,
      paddingSM: 8,
      paddingXS: 6,
    },
    
    // Popover Component
    Popover: {
      minWidth: 177,
      titleMinWidth: 177,
      borderRadiusLG: borderRadius.md,
      boxShadowSecondary: shadows.lg,
    },
    
    // Dropdown Component
    Dropdown: {
      paddingBlock: 4,
      controlPaddingHorizontal: 12,
      borderRadiusLG: borderRadius.md,
      boxShadowSecondary: shadows.lg,
    },
    
    // DatePicker Component
    DatePicker: {
      cellHeight: 32,
      cellWidth: 36,
      cellHoverBg: colors.primary[50],
      cellActiveWithRangeBg: colors.primary[100],
      cellHoverWithRangeBg: colors.primary[50],
      cellRangeBorderColor: colors.primary[300],
      cellBg: 'transparent',
      borderRadiusLG: borderRadius.md,
      borderRadiusSM: borderRadius.sm,
    },
    
    // TimePicker Component
    TimePicker: {
      cellHeight: 28,
      cellHoverBg: colors.primary[50],
      columnHeight: 224,
      columnWidth: 56,
    },
    
    // Upload Component
    Upload: {
      actionsColor: colors.neutral[600],
    },
    
    // Steps Component
    Steps: {
      iconSize: 32,
      iconSizeSM: 24,
      dotSize: 8,
      dotCurrentSize: 10,
      navArrowColor: colors.neutral[400],
      titleLineHeight: 1.5,
      customIconSize: 32,
      customIconTop: 0,
      customIconFontSize: 24,
      iconTop: 0,
      iconFontSize: 16,
    },
    
    // Form Component
    Form: {
      labelFontSize: 14,
      labelColor: colors.neutral[700],
      labelHeight: 32,
      labelColonMarginInlineStart: 2,
      labelColonMarginInlineEnd: 8,
      itemMarginBottom: 24,
      verticalLabelPadding: '0 0 8px',
    },
    
    // Collapse Component
    Collapse: {
      headerBg: colors.neutral[50],
      headerPadding: '12px 16px',
      contentBg: '#FFFFFF',
      contentPadding: '16px',
      borderRadiusLG: borderRadius.md,
    },
    
    // Tree Component
    Tree: {
      titleHeight: 24,
      nodeHoverBg: colors.primary[50],
      nodeSelectedBg: colors.primary[100],
      directoryNodeSelectedBg: colors.primary[100],
      directoryNodeSelectedColor: colors.primary[700],
    },
    
    // Statistic Component
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
      unitFontSize: 16,
    },
  },
};

// Export theme presets
export const themePresets = {
  light: antdTheme,
  // Can add dark theme later
};

export default antdTheme;