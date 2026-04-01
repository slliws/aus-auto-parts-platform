import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/**
 * ContentArea component props
 */
export interface ContentAreaProps {
  /** Content to render inside the area */
  children: React.ReactNode;
  /** Optional custom className */
  className?: string;
  /** Whether content should use max width (default: true) */
  maxWidth?: boolean;
  /** Whether to use padding (default: true) */
  padding?: boolean;
  /** Whether this is a primary content area (default: true) */
  primary?: boolean;
  /** Whether this content should be centered (default: false) */
  centered?: boolean;
}

/**
 * ContentArea component - Primary content area that adapts to sidebar state
 * 
 * A flexible container for page content with Facebook-inspired styling.
 * Adapts to different screen sizes and content types.
 */
export const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  className,
  maxWidth = true,
  padding = true,
  primary = true,
  centered = false,
}) => {
  return (
    <ContentContainer 
      className={className}
      maxWidth={maxWidth}
      hasPadding={padding}
      primary={primary}
      centered={centered}
    >
      {children}
    </ContentContainer>
  );
};

// Styled components
const ContentContainer = styled.div<{
  maxWidth: boolean;
  hasPadding: boolean;
  primary: boolean;
  centered: boolean;
}>`
  /* Base styles */
  background-color: ${({ primary }) => 
    primary ? theme.colors.neutral.white : 'transparent'
  };
  border-radius: ${theme.spacing.borderRadius.md};
  
  /* Box shadow for primary content areas - Facebook-style subtle shadow */
  ${({ primary }) => primary && `
    box-shadow: 0 1px 2px ${theme.colors.alpha.blackAlpha10};
  `}
  
  /* Padding control */
  ${({ hasPadding }) => hasPadding && `
    padding: ${theme.spacing.layoutSpacing.containerPadding};
    
    ${theme.breakpoints.devices.mobile} {
      padding: ${theme.spacing.spacingValues.sm};
    }
  `}
  
  /* Max width control - Facebook typically constrains content width */
  ${({ maxWidth }) => maxWidth && `
    max-width: 1200px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    
    ${theme.breakpoints.devices.mobile} {
      max-width: 100%;
    }
  `}
  
  /* Centering for certain Facebook UI patterns */
  ${({ centered }) => centered && `
    display: flex;
    flex-direction: column;
    align-items: center;
  `}
`;

export default ContentArea;