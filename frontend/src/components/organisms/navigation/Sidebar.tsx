import React from 'react';
import styled from '@emotion/styled';
import { Link, useLocation } from 'react-router-dom';
import { theme } from '../../../styles/theme';
import Button from '../../atoms/Button';

/**
 * Sidebar item interface
 */
export interface SidebarItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Route path */
  path: string;
  /** Optional badge count */
  badgeCount?: number;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  /** Optional custom className */
  className?: string;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Toggle collapse callback */
  onToggleCollapse?: () => void;
  /** List of sidebar items */
  items?: SidebarItem[];
  /** Item click handler */
  onItemClick?: (item: SidebarItem) => void;
}

/**
 * Sidebar component - Facebook-style collapsible sidebar for desktop
 * 
 * Provides a collapsible navigation sidebar similar to Facebook's desktop UI
 */
export const Sidebar: React.FC<SidebarProps> = ({
  className,
  collapsed = false,
  onToggleCollapse,
  items = [],
  onItemClick,
}) => {
  const location = useLocation();
  
  const handleItemClick = (item: SidebarItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarContainer className={className} collapsed={collapsed}>
      <SidebarHeader>
        {!collapsed && <SidebarTitle>Menu</SidebarTitle>}
        <CollapseButton
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </CollapseButton>
      </SidebarHeader>

      <SidebarContent>
        {items.map((item) => (
          <SidebarItemContainer
            key={item.id}
            as={Link}
            to={item.path}
            active={isActive(item.path)}
            onClick={() => handleItemClick(item)}
            collapsed={collapsed}
          >
            <SidebarItemIcon>{item.icon}</SidebarItemIcon>
            {!collapsed && (
              <>
                <SidebarItemLabel>{item.label}</SidebarItemLabel>
                {item.badgeCount && item.badgeCount > 0 && (
                  <SidebarItemBadge>{item.badgeCount}</SidebarItemBadge>
                )}
              </>
            )}
          </SidebarItemContainer>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <Button fullWidth size="small" variant="primary">
            + New Post
          </Button>
        )}
        {collapsed && (
          <SmallButton aria-label="New Post">+</SmallButton>
        )}
      </SidebarFooter>
    </SidebarContainer>
  );
};

// Styled components
const SidebarContainer = styled.aside<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${({ collapsed }) => collapsed ? '60px' : theme.spacing.componentSpacing.sidebarWidth};
  height: 100%;
  background-color: ${theme.colors.neutral.white};
  border-right: 1px solid ${theme.colors.neutral.mediumGray};
  position: fixed;
  top: ${theme.spacing.componentSpacing.navBarHeight};
  left: 0;
  bottom: 0;
  z-index: ${theme.spacing.zIndices.sticky};
  transition: width 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }
  
  ${theme.breakpoints.devices.mobile} {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.spacingValues.md};
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
`;

const SidebarTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.semiBold};
  margin: 0;
  color: ${theme.colors.neutral.black};
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.colors.neutral.darkGray};
  
  &:hover {
    background-color: ${theme.colors.neutral.lightGray};
  }
`;

const SidebarContent = styled.nav`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing.spacingValues.sm} 0;
  flex: 1;
`;

const SidebarItemContainer = styled.button<{ active?: boolean; collapsed: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ collapsed }) =>
    collapsed
      ? theme.spacing.spacingValues.xs
      : `${theme.spacing.spacingValues.sm} ${theme.spacing.spacingValues.md}`
  };
  margin: ${({ collapsed }) =>
    collapsed
      ? `${theme.spacing.spacingValues.xs} auto`
      : `${theme.spacing.spacingValues.xxs} ${theme.spacing.spacingValues.xs}`
  };
  border-radius: ${({ collapsed }) => collapsed ? '50%' : '8px'};
  background: ${({ active }) => active ? theme.colors.alpha.primaryAlpha10 : 'transparent'};
  border: none;
  cursor: pointer;
  width: ${({ collapsed }) => collapsed ? '40px' : 'auto'};
  height: ${({ collapsed }) => collapsed ? '40px' : 'auto'};
  justify-content: ${({ collapsed }) => collapsed ? 'center' : 'flex-start'};
  transition: background-color 0.2s;
  text-align: left;
  text-decoration: none;
  color: ${({ active }) => active ? theme.colors.facebook.primary : theme.colors.neutral.black};
  
  &:hover {
    background-color: ${theme.colors.neutral.lightGray};
  }
  
  &:active {
    background-color: ${theme.colors.neutral.mediumGray};
  }
`;

const SidebarItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  min-width: 24px;
  margin-right: ${theme.spacing.spacingValues.sm};
`;

const SidebarItemLabel = styled.span`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarItemBadge = styled.span`
  background-color: ${theme.colors.facebook.tertiary};
  color: ${theme.colors.neutral.white};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${theme.spacing.spacingValues.xxs};
`;

const SidebarFooter = styled.div`
  padding: ${theme.spacing.spacingValues.md};
  border-top: 1px solid ${theme.colors.neutral.lightGray};
`;

const SmallButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${theme.colors.facebook.primary};
  color: ${theme.colors.neutral.white};
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: ${theme.typography.fontSizes.lg};
  margin: 0 auto;
  
  &:hover {
    background-color: ${theme.colors.facebook.primary}e6; /* 90% opacity */
  }
`;

export default Sidebar;