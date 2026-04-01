/**
 * Color palette for Australian Auto Parts Platform
 * Inspired by Facebook Messenger/Marketplace with custom brand colors
 */

// Brand colors
export const brandColors = {
  deepBlue: '#0C4DA2',
  oceanTeal: '#2D8D8D',
  australiaGreen: '#00843D',
  sunsetOrange: '#FF5A5F',
  desertSand: '#E8D2A0',
};

// Facebook-inspired colors
export const facebookColors = {
  // Primary colors
  primary: '#1877F2',        // Facebook Blue
  secondary: '#42B72A',      // Facebook Green
  tertiary: '#F02849',       // Facebook Red
  
  // Messaging colors (Messenger)
  messengerBlue: '#0084FF',
  messengerLightBlue: '#00C6FF',
  messengerGrey: '#F1F0F0',
  
  // Marketplace colors
  marketplaceBlue: '#0064E0',
  marketplaceGreen: '#33A852',
  marketplaceYellow: '#FBBC04',
  marketplaceRed: '#F02849', // Same as tertiary/Facebook Red
};

// Neutral colors
export const neutralColors = {
  white: '#FFFFFF',
  background: '#ffffff',
  lightGray: '#E4E6EB',      // Button background
  mediumGray: '#6D6D6D',     // Secondary text
  darkGray: '#4B4B4B',       // Secondary text
  lightGrayDisabled: '#999999', // Disabled states
  border: '#CCCCCC',         // Borders
  black: '#1C1E21',          // Primary text
};

// Semantic colors
export const semanticColors = {
  success: brandColors.oceanTeal,
  warning: facebookColors.marketplaceYellow,
  error: facebookColors.tertiary,
  info: brandColors.deepBlue,
};

// Gradient colors
export const gradients = {
  messengerGradient: `linear-gradient(83.84deg, ${facebookColors.messengerBlue} 0%, ${facebookColors.messengerLightBlue} 100%)`,
  brandGradient: `linear-gradient(83.84deg, ${brandColors.deepBlue} 0%, ${brandColors.oceanTeal} 100%)`,
};

// Alpha colors - with opacity
export const alphaColors = {
  primaryAlpha10: 'rgba(24, 119, 242, 0.1)',
  primaryAlpha20: 'rgba(24, 119, 242, 0.2)',
  blackAlpha5: 'rgba(0, 0, 0, 0.05)',
  blackAlpha10: 'rgba(0, 0, 0, 0.1)',
  whiteAlpha80: 'rgba(255, 255, 255, 0.8)',
};

// Export all color objects
export const colors = {
  brand: brandColors,
  facebook: facebookColors,
  neutral: neutralColors,
  semantic: semanticColors,
  gradients,
  alpha: alphaColors,
};

export default colors;