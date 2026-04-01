import { Global, css } from '@emotion/react';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

/**
 * Global styles for Australian Auto Parts Platform
 * Inspired by Facebook Messenger/Marketplace design patterns
 * 
 * Includes:
 * - CSS reset
 * - Base styles
 * - Typography defaults
 * - Smooth scrolling behavior
 * - Link and button resets
 */
const GlobalStyle = () => (
  <Global
    styles={css`
      /* CSS Reset */
      *,
      *::before,
      *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Base HTML and Body Styles */
      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: ${typography.fontFamilies.primary};
        font-size: ${typography.fontSizes.md};
        font-weight: ${typography.fontWeights.regular};
        line-height: ${typography.lineHeights.body};
        color: ${colors.neutral.black};
        background-color: var(--neutral-background, #ffffff);
        overflow-x: hidden;
      }

      /* Typography Defaults */
      h1, h2, h3, h4, h5, h6 {
        margin: 0;
        padding: 0;
        font-weight: ${typography.fontWeights.bold};
        line-height: ${typography.lineHeights.heading};
      }

      h1 {
        font-size: ${typography.fontSizes.h1};
      }

      h2 {
        font-size: ${typography.fontSizes.h2};
      }

      h3 {
        font-size: ${typography.fontSizes.h3};
      }

      h4 {
        font-size: ${typography.fontSizes.h4};
      }

      h5 {
        font-size: ${typography.fontSizes.h5};
      }

      h6 {
        font-size: ${typography.fontSizes.h6};
      }

      p {
        margin: 0;
        padding: 0;
        line-height: ${typography.lineHeights.paragraph};
      }

      /* Link Styles */
      a {
        color: ${colors.facebook.primary};
        text-decoration: none;
        transition: color 0.2s ease;
      }

      a:hover {
        color: ${colors.facebook.marketplaceBlue};
        text-decoration: underline;
      }

      a:focus {
        outline: 2px solid ${colors.facebook.primary};
        outline-offset: 2px;
      }

      /* Button Reset */
      button {
        margin: 0;
        padding: 0;
        border: none;
        background: none;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        cursor: pointer;
        outline: none;
      }

      button:focus-visible {
        outline: 2px solid ${colors.facebook.primary};
        outline-offset: 2px;
      }

      /* Input Reset */
      input,
      textarea,
      select {
        margin: 0;
        padding: 0;
        border: none;
        background: none;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        outline: none;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: 2px solid ${colors.facebook.primary};
        outline-offset: -2px;
      }

      /* List Reset */
      ul, ol {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      /* Image Defaults */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      /* Remove default fieldset border */
      fieldset {
        margin: 0;
        padding: 0;
        border: none;
      }

      /* Legend styles */
      legend {
        padding: 0;
      }

      /* Table Reset */
      table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      /* Scrollbar Styles (Webkit) */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: ${colors.neutral.lightGray};
      }

      ::-webkit-scrollbar-thumb {
        background: ${colors.neutral.mediumGray};
        border-radius: ${spacing.borderRadius.sm};
      }

      ::-webkit-scrollbar-thumb:hover {
        background: ${colors.neutral.darkGray};
      }

      /* Selection Styles */
      ::selection {
        background-color: ${colors.alpha.primaryAlpha20};
        color: ${colors.neutral.black};
      }

      ::-moz-selection {
        background-color: ${colors.alpha.primaryAlpha20};
        color: ${colors.neutral.black};
      }

      /* Disable text selection on UI elements */
      button,
      [role="button"] {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Root container */
      #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* Smooth transitions for interactive elements */
      button,
      a,
      input,
      textarea,
      select {
        transition: all 0.2s ease;
      }

      /* Focus visible styles for accessibility */
      *:focus-visible {
        outline: 2px solid ${colors.facebook.primary};
        outline-offset: 2px;
      }

      /* Remove focus outline for mouse users */
      *:focus:not(:focus-visible) {
        outline: none;
      }
    `}
  />
);

export default GlobalStyle;