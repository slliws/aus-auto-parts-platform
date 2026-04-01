import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import Header from '../organisms/navigation/Header';
import Sidebar from '../organisms/navigation/Sidebar';
import BottomNav from '../organisms/navigation/BottomNav';
import { sidebarItems, bottomNavItems } from '../../utils/navigationItems';
import { selectSidebarCollapsed } from '../../store/slices/uiSlice';

/**
 * Page container props
 */
export interface PageContainerProps {
  /** Page content */
  children: React.ReactNode;
  /** Whether the sidebar is visible (default: true) */
  showSidebar?: boolean;
  /** Whether the sidebar is collapsed (default: false) */
  sidebarCollapsed?: boolean;
  /** Toggle sidebar collapse callback */
  onToggleSidebar?: () => void;
  /** Header props */
  headerProps?: React.ComponentProps<typeof Header>;
  /** Sidebar props */
  sidebarProps?: React.ComponentProps<typeof Sidebar>;
  /** Bottom navigation props */
  bottomNavProps?: React.ComponentProps<typeof BottomNav>;
}

/**
 * PageContainer component - Main container for pages with responsive behavior
 * 
 * This is the main layout container that integrates the Header, Sidebar, and
 * BottomNav components, handling responsive layout changes across different device sizes.
 * It follows Facebook's layout patterns with a fixed header, optional sidebar, and
 * bottom navigation on mobile devices.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  showSidebar = true,
  sidebarCollapsed: propSidebarCollapsed,
  onToggleSidebar,
  headerProps,
  sidebarProps,
  bottomNavProps,
}) => {
  // Local state for sidebar collapse
  const [localSidebarCollapsed, setLocalSidebarCollapsed] = useState(false);
  
  // Use prop value if provided, otherwise use local state
  const sidebarCollapsed = propSidebarCollapsed ?? localSidebarCollapsed;
  
  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setLocalSidebarCollapsed(!localSidebarCollapsed);
    }
  };

  return (
    <Container>
      <Header {...headerProps} />
      
      {showSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          items={sidebarProps?.items || sidebarItems}
          {...sidebarProps}
        />
      )}
      
      <Main showSidebar={showSidebar} sidebarCollapsed={sidebarCollapsed}>
        {children}
      </Main>
      
      <BottomNav
        items={bottomNavProps?.items || bottomNavItems}
        {...bottomNavProps}
      />
    </Container>
  );
};

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${theme.colors.neutral.background};
`;

const Main = styled.main<{
  showSidebar: boolean;
  sidebarCollapsed: boolean;
}>`
  flex: 1;
  margin-top: ${theme.spacing.componentSpacing.navBarHeight};
  
  /* Adjust margin based on sidebar state */
  ${({ showSidebar, sidebarCollapsed }) => {
    if (!showSidebar) return '';
    if (sidebarCollapsed) {
      return `
        margin-left: 60px;
        
        ${theme.breakpoints.devices.mobile} {
          margin-left: 0;
        }
      `;
    }
    return `
      margin-left: ${theme.spacing.componentSpacing.sidebarWidth};
      
      ${theme.breakpoints.devices.mobile} {
        margin-left: 0;
      }
    `;
  }}
  
  /* Add bottom padding for mobile to account for bottom nav */
  ${theme.breakpoints.devices.mobile} {
    padding-bottom: 56px;
  }
  
  /* Transition for smooth sidebar expand/collapse */
  transition: margin-left 0.3s ease;
`;

export default PageContainer;