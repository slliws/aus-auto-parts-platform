/**
 * Typography system for Australian Auto Parts Platform
 * Inspired by Facebook Messenger/Marketplace design patterns
 */

// Font families
export const fontFamilies = {
  primary: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif', // Facebook's primary font
  secondary: 'SFProText-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', // Alternative font
  mono: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', // For code blocks or monospaced text
};

// Font weights
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
};

// Font sizes (in px)
export const fontSizes = {
  // Base sizes
  xs: '12px',
  sm: '13px',
  md: '14px', // Facebook's base font size
  lg: '16px',
  xl: '18px',
  xxl: '20px',
  
  // Heading sizes
  h1: '28px',
  h2: '24px',
  h3: '20px',
  h4: '18px',
  h5: '16px',
  h6: '14px',
  
  // Special sizes
  title: '32px',
  subtitle: '22px',
  caption: '12px',
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.4, // Facebook default
  relaxed: 1.6,
  loose: 2,
  
  // Specific line heights
  body: 1.34, // Facebook text
  heading: 1.25,
  paragraph: 1.5,
};

// Letter spacing
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0', // Facebook default
  wide: '0.025em',
  wider: '0.05em',
};

// Text transforms
export const textTransforms = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  normal: 'none',
};

// Predefined text styles
export const textStyles = {
  // Facebook Messenger style text variants
  heading: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.heading,
  },
  subheading: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.semiBold,
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.heading,
  },
  body: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.body,
  },
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.body,
  },
  caption: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.tight,
  },
  button: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.semiBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.tight,
  },
};

// Export typography system
export const typography = {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacings,
  textTransforms,
  textStyles,
};

export default typography;