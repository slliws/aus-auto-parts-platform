import React from 'react';
import styled from '@emotion/styled';
import { Link, useLocation } from 'react-router-dom';
import { theme } from '../../../styles/theme';

/**
 * Navigation item interface
 */
export interface NavItem {
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
 * BottomNav component props
 */
export interface BottomNavProps {
  /** Optional custom className */
  className?: string;
  /** Array of navigation items */
  items: NavItem[];
  /** Item click handler */
  onItemClick?: (item: NavItem) => void;
}

/**
 * BottomNav component - Facebook Messenger-style bottom navigation for mobile
 * 
 * Provides a fixed bottom navigation bar that appears only on mobile devices,
 * following Facebook Messenger's mobile UI patterns.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  className,
  items,
  onItemClick,
}) => {
  const location = useLocation();
  
  const handleItemClick = (item: NavItem) => {
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
    <BottomNavContainer className={className}>
      {items.map((item) => (
        <NavItemButton
          key={item.id}
          as={Link}
          to={item.path}
          active={isActive(item.path)}
          onClick={() => handleItemClick(item)}
          aria-label={item.label}
        >
          <NavItemIcon>
            {item.icon}
            {item.badgeCount && item.badgeCount > 0 && (
              <NavItemBadge>{item.badgeCount}</NavItemBadge>
            )}
          </NavItemIcon>
          <NavItemLabel>{item.label}</NavItemLabel>
        </NavItemButton>
      ))}
    </BottomNavContainer>
  );
};

// Styled components
const BottomNavContainer = styled.nav`
  display: none; /* Hidden on desktop by default */
  
  ${theme.breakpoints.devices.mobile} {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background-color: ${theme.colors.neutral.white};
    border-top: 1px solid ${theme.colors.neutral.mediumGray};
    z-index: ${theme.spacing.zIndices.sticky};
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const NavItemButton = styled.button<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ active }) => active
    ? theme.colors.facebook.primary
    : theme.colors.neutral.darkGray
  };
  position: relative;
  padding: ${theme.spacing.spacingValues.xxs} ${theme.spacing.spacingValues.xs};
  text-decoration: none;
  
  &:hover, &:active {
    background-color: ${theme.colors.neutral.lightGray};
  }
  
  /* Active indicator - Facebook-style blue line */
  ${({ active }) => active && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 25%;
      width: 50%;
      height: 3px;
      background-color: ${theme.colors.facebook.primary};
      border-radius: 2px 2px 0 0;
    }
  `}
`;

const NavItemIcon = styled.div`
  position: relative;
  font-size: 24px;
  margin-bottom: ${theme.spacing.spacingValues.xxs};
`;

const NavItemLabel = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const NavItemBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
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

export default BottomNav;