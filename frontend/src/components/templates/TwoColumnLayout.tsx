import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/**
 * TwoColumnLayout component props
 */
export interface TwoColumnLayoutProps {
  /** Left column content (conversation list, navigation, etc.) */
  leftColumn: React.ReactNode;
  /** Right column content (main conversation, content detail, etc.) */
  rightColumn: React.ReactNode;
  /** Optional custom className */
  className?: string;
  /** Width of the left column (default: '350px') */
  leftColumnWidth?: string;
  /** Whether the left column is visible on mobile (default: false) */
  showLeftColumnOnMobile?: boolean;
  /** Whether the layout should expand to full height (default: true) */
  fullHeight?: boolean;
}

/**
 * TwoColumnLayout component - Layout for messaging/marketplace
 * 
 * A Facebook-style two-column layout used for messaging interfaces,
 * marketplace browsing, and other two-panel interfaces.
 */
export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  leftColumn,
  rightColumn,
  className,
  leftColumnWidth = '350px',
  showLeftColumnOnMobile = false,
  fullHeight = true,
}) => {
  return (
    <Container className={className} fullHeight={fullHeight}>
      <LeftColumnContainer 
        width={leftColumnWidth}
        showOnMobile={showLeftColumnOnMobile}
      >
        {leftColumn}
      </LeftColumnContainer>
      
      <Divider />
      
      <RightColumnContainer>
        {rightColumn}
      </RightColumnContainer>
    </Container>
  );
};

// Styled components
const Container = styled.div<{ fullHeight: boolean }>`
  display: flex;
  width: 100%;
  ${({ fullHeight }) => fullHeight && 'height: 100%;'}
  background-color: ${theme.colors.neutral.white};
  border-radius: ${theme.spacing.borderRadius.md};
  box-shadow: 0 1px 2px ${theme.colors.alpha.blackAlpha10};
  overflow: hidden;
  
  /* On mobile, make it a column layout if left column is visible */
  ${theme.breakpoints.devices.mobile} {
    flex-direction: column;
  }
`;

const LeftColumnContainer = styled.div<{ 
  width: string; 
  showOnMobile: boolean;
}>`
  width: ${({ width }) => width};
  max-width: 100%;
  border-right: 1px solid ${theme.colors.neutral.lightGray};
  overflow-y: auto;
  background-color: ${theme.colors.neutral.white};
  z-index: 1; /* Ensures left column appears above right column on mobile */
  
  /* Scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.neutral.mediumGray};
    border-radius: 3px;
  }
  
  /* Mobile adjustments */
  ${theme.breakpoints.devices.mobile} {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${theme.colors.neutral.lightGray};
    ${({ showOnMobile }) => !showOnMobile && `
      display: none;
    `}
  }
`;

const Divider = styled.div`
  width: 1px;
  background-color: ${theme.colors.neutral.lightGray};
  
  ${theme.breakpoints.devices.mobile} {
    display: none;
  }
`;

const RightColumnContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${theme.colors.neutral.white};
  
  /* Scrollbar styling */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.neutral.mediumGray};
    border-radius: 3px;
  }
  
  /* Mobile adjustments */
  ${theme.breakpoints.devices.mobile} {
    width: 100%;
  }
`;

export default TwoColumnLayout;