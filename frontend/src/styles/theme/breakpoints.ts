/**
 * Responsive breakpoints for Australian Auto Parts Platform
 * Inspired by Facebook Messenger/Marketplace responsive design
 */

// Define device breakpoints (in pixels)
// Following Facebook's responsive design patterns
export const breakpointValues = {
  // Facebook primarily focuses on these device sizes
  xs: 0,        // Extra small devices (portrait phones)
  sm: 576,      // Small devices (landscape phones)
  md: 768,      // Medium devices (tablets)
  lg: 1024,     // Large devices (desktops)
  xl: 1280,     // Extra large devices (large desktops)
  xxl: 1440,    // Extra extra large devices
};

// Media query helpers for Emotion CSS
export const breakpointUp = (size: keyof typeof breakpointValues) => {
  return `@media (min-width: ${breakpointValues[size]}px)`;
};

export const breakpointDown = (size: keyof typeof breakpointValues) => {
  const value = breakpointValues[size];
  return `@media (max-width: ${value - 0.02}px)`;
};

export const breakpointBetween = (
  min: keyof typeof breakpointValues,
  max: keyof typeof breakpointValues
) => {
  return `@media (min-width: ${breakpointValues[min]}px) and (max-width: ${
    breakpointValues[max] - 0.02
  }px)`;
};

// Predefined device breakpoints
// These match the requirements from the task:
// Mobile < 768px, Tablet 768px-1023px, Desktop ≥ 1024px
export const devices = {
  mobile: breakpointDown('md'),           // < 768px
  tablet: breakpointBetween('md', 'lg'),  // 768px-1023px
  desktop: breakpointUp('lg'),            // ≥ 1024px
  
  // Additional convenience breakpoints
  smallMobile: breakpointDown('sm'),      // < 576px
  largeMobile: breakpointBetween('sm', 'md'), // 576px-767px
  largeDesktop: breakpointUp('xl'),       // ≥ 1280px
  extraLargeDesktop: breakpointUp('xxl'),  // ≥ 1440px
};

// Export breakpoints system
export const breakpoints = {
  values: breakpointValues,
  up: breakpointUp,
  down: breakpointDown,
  between: breakpointBetween,
  devices,
};

export default breakpoints;