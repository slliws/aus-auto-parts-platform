/**
 * Theme system for Australian Auto Parts Platform
 * Exports all theme components from a central location
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import breakpoints from './breakpoints';

/**
 * Complete theme object that combines all styling systems
 * This serves as the single source of truth for styling across the application
 */
export const theme = {
  colors,
  typography,
  spacing,
  breakpoints,
};

// Type definition for the theme
export type Theme = typeof theme;

// Export individual theme components
export { colors };
export { typography };
export { spacing };
export { breakpoints };

// Default export of the complete theme
export default theme;