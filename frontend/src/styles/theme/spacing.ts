/**
 * Spacing system for Australian Auto Parts Platform
 * Inspired by Facebook Messenger/Marketplace spacing patterns
 */

// Base unit for scaling (Facebook uses increments of 4px)
export const baseSpacing = 4;

// Spacing scale in pixels
export const spacingValues = {
  none: '0',
  xxs: `${baseSpacing}px`,          // 4px
  xs: `${baseSpacing * 2}px`,       // 8px
  sm: `${baseSpacing * 3}px`,       // 12px
  md: `${baseSpacing * 4}px`,       // 16px
  lg: `${baseSpacing * 5}px`,       // 20px
  xl: `${baseSpacing * 6}px`,       // 24px
  xxl: `${baseSpacing * 8}px`,      // 32px
  xxxl: `${baseSpacing * 10}px`,    // 40px
};

// Facebook Messenger/Marketplace specific spacings
export const componentSpacing = {
  // Avatar sizes (used in messaging and user profiles)
  avatarXSmall: '24px',
  avatarSmall: '32px',
  avatarMedium: '40px',
  avatarLarge: '56px',
  avatarXLarge: '80px',
  
  // Button spacing
  buttonPaddingX: spacingValues.md,
  buttonPaddingY: spacingValues.xs,
  buttonSmallPaddingX: spacingValues.sm,
  buttonSmallPaddingY: spacingValues.xxs,
  
  // Card spacing
  cardPadding: spacingValues.md,
  cardBorderRadius: '8px',
  cardMarginBottom: spacingValues.md,
  
  // Input spacing
  inputPaddingX: spacingValues.sm,
  inputPaddingY: spacingValues.xs,
  inputBorderRadius: '6px',
  
  // Navigation
  navItemPadding: spacingValues.sm,
  navBarHeight: '56px',
  sidebarWidth: '280px',
};

// Layout spacing
export const layoutSpacing = {
  containerPadding: spacingValues.md,
  sectionGap: spacingValues.xl,
  gridGap: spacingValues.md,
  inlineGap: spacingValues.xs,
};

// Marketplace-specific spacing
export const marketplaceSpacing = {
  productCardPadding: spacingValues.sm,
  productCardGap: spacingValues.md,
  productGridGap: spacingValues.lg,
  categoryPadding: `${spacingValues.sm} ${spacingValues.md}`,
};

// Border radius
export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',      // Facebook's standard border radius for cards
  lg: '12px',
  xl: '16px',
  pill: '500px',  // For pill-shaped buttons or elements
  circle: '50%',  // For circular elements
};

// Z-index values
export const zIndices = {
  hide: -1,
  base: 0,
  content: 10,
  header: 20,
  dropdown: 30,
  sticky: 40,
  overlay: 50,
  modal: 60,
  tooltip: 70,
  toast: 80,
  popover: 90,
};

// Export spacing system
export const spacing = {
  baseSpacing,
  spacingValues,
  componentSpacing,
  layoutSpacing,
  marketplaceSpacing,
  borderRadius,
  zIndices,
  
  // Aliases for backward compatibility
  spacing0: spacingValues.none,
  spacing4: spacingValues.xxs,
  spacing8: spacingValues.xs,
  spacing12: spacingValues.sm,
  spacing16: spacingValues.md,
  spacing20: spacingValues.lg,
  spacing24: spacingValues.xl,
  spacing32: spacingValues.xxl,
  spacing40: spacingValues.xxxl,
  spacing2: '2px', // Custom spacing used in ChatBubble
};

export default spacing;