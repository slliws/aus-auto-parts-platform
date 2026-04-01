import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, type Theme as MuiTheme } from '@mui/material/styles';
import { theme as customTheme } from './theme';
import GlobalStyle from './theme/GlobalStyle';

// ----------------------------------------------------------------------
// Type Definitions and Module Augmentation
// ----------------------------------------------------------------------

declare module '@mui/material/styles' {
  // Extend the Theme interface to include our custom properties
  interface Theme {
    colors: typeof customTheme.colors;
    // We merge custom typography properties into the MUI Typography
    // Note: Some keys might conflict, we prioritize MUI structure for MUI components
    // and custom structure for styled-components where they don't overlap.
    // For strict typing, one might need a more complex type intersection.
  }
  
  // Allow configuration using `createTheme`
  interface ThemeOptions {
    colors?: typeof customTheme.colors;
  }

  // Add custom breakpoints
  interface BreakpointOverrides {
    xxl: true;
  }

  interface Breakpoints {
    devices: typeof customTheme.breakpoints.devices;
  }
}

// Augment Emotion's Theme to match the MUI Theme (which now includes custom props)
declare module '@emotion/react' {
  export interface Theme extends MuiTheme {
    // We merge types without using recursive references to the Emotion Theme itself
    colors: typeof customTheme.colors;
    spacing: MuiTheme['spacing'] & typeof customTheme.spacing;
    typography: MuiTheme['typography'] & typeof customTheme.typography;
    breakpoints: MuiTheme['breakpoints'] & typeof customTheme.breakpoints;
  }
}

// ----------------------------------------------------------------------
// Theme Creation
// ----------------------------------------------------------------------

// 1. Create the base MUI theme with our custom values mapped to MUI structure
const muiBaseTheme = createTheme({
  palette: {
    primary: {
      main: customTheme.colors.facebook.primary,
    },
    secondary: {
      main: customTheme.colors.facebook.secondary,
    },
    error: {
      main: customTheme.colors.facebook.tertiary,
    },
    success: {
      main: customTheme.colors.semantic.success,
    },
    warning: {
      main: customTheme.colors.semantic.warning,
    },
    info: {
      main: customTheme.colors.semantic.info,
    },
    background: {
      default: customTheme.colors.neutral.background,
      paper: customTheme.colors.neutral.white,
    },
    text: {
      primary: customTheme.colors.neutral.black,
      secondary: customTheme.colors.neutral.mediumGray,
    },
  },
  typography: {
    fontFamily: customTheme.typography.fontFamilies.primary,
  },
  breakpoints: {
    values: {
      xs: customTheme.breakpoints.values.xs,
      sm: customTheme.breakpoints.values.sm,
      md: customTheme.breakpoints.values.md,
      lg: customTheme.breakpoints.values.lg,
      xl: customTheme.breakpoints.values.xl,
      xxl: customTheme.breakpoints.values.xxl,
    },
  },
  // MUI automatically provides zIndex, transitions, mixins, etc.
});

// 2. Augment the MUI theme with our custom properties to support existing styled-components.
// We modify the created theme object to include the custom objects.
// We use Object.assign for properties that are functions in MUI (like spacing) 
// to attach static properties to them.

const augmentedTheme = {
  ...muiBaseTheme,
  colors: customTheme.colors,
  
  // Merge typography: MUI's typography object + Custom typography object
  typography: {
    ...muiBaseTheme.typography,
    ...customTheme.typography,
  },
  
  // Spacing: MUI uses a function `theme.spacing(2)`.
  // Custom theme uses an object `theme.spacing.md`.
  // We attach the custom spacing properties to the MUI spacing function.
  spacing: Object.assign(muiBaseTheme.spacing, customTheme.spacing),
  
  // Breakpoints: MUI has specific methods (up, down, etc.).
  // We keep MUI's breakpoints object but add our custom 'devices' property.
  // Note: existing custom code using `theme.breakpoints.up('md')` should work
  // because MUI's implementation is compatible (returns a media query string).
  breakpoints: {
    ...muiBaseTheme.breakpoints,
    ...customTheme.breakpoints,
    devices: customTheme.breakpoints.devices,
    // Restore MUI methods to ensure compatibility with MUI components
    up: muiBaseTheme.breakpoints.up,
    down: muiBaseTheme.breakpoints.down,
    between: muiBaseTheme.breakpoints.between,
    values: muiBaseTheme.breakpoints.values,
  },
};

/**
 * ThemeProvider component for Australian Auto Parts Platform
 * 
 * Provides the Material UI theme (which includes custom design tokens) to all components.
 * This ensures compatibility with both MUI components and custom styled-components.
 * 
 * @param {React.PropsWithChildren} props - Component props with children
 * @returns {JSX.Element} ThemeProvider component with children
 */
export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <MuiThemeProvider theme={augmentedTheme}>
      <GlobalStyle />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;