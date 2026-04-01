import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { theme } from '../../../styles/theme';
import Button from '../../atoms/Button';
import GlobalSearchBar from '../search/GlobalSearchBar';
import { AppDispatch } from '../../../store';
import { performQuickSearch } from '../../../store/slices/searchSlice';

/**
 * Header component props
 */
export interface HeaderProps {
  /** Optional custom className */
  className?: string;
  /** Logo element or component */
  logo?: React.ReactNode;
  /** User profile element or component */
  profileComponent?: React.ReactNode;
  /** Search callback function */
  onSearch?: (query: string) => void;
}

/**
 * Header layout component - Facebook-style top navigation bar
 * 
 * Provides a responsive header with logo, search, and action buttons
 * following Facebook's design patterns.
 */
export const Header: React.FC<HeaderProps> = ({
  className,
  logo,
  profileComponent,
  onSearch,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Keyboard shortcut handler for focusing search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' key to focus search (common pattern in many apps)
      if (e.key === '/' &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle search submission
  const handleSearchSubmit = useCallback((query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      if (onSearch) {
        onSearch(query);
      }
    }
  }, [navigate, onSearch]);
  
  // Perform quick search for autocomplete results
  const handleQuickSearch = useCallback((query: string) => {
    if (query.trim()) {
      dispatch(performQuickSearch({ query, limit: 5 }));
    }
  }, [dispatch]);
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <HeaderContainer className={className}>
      <LeftSection>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {logo || <LogoPlaceholder>Auto Parts</LogoPlaceholder>}
        </Link>
        <SearchContainer>
          <GlobalSearchBar
            onSearch={handleSearchSubmit}
            onInputChange={handleQuickSearch}
            id="global-search-input"
            placeholder="Search parts, customers, vehicles..."
          />
          <KeyboardShortcutHint>Press / to search</KeyboardShortcutHint>
        </SearchContainer>
      </LeftSection>
      
      <CenterSection>
        <NavButton
          as={Link}
          to="/"
          aria-label="Home"
          className={isActive('/') ? 'active' : ''}
        >
          <NavIcon>🏠</NavIcon>
        </NavButton>
        <NavButton
          as={Link}
          to="/messages"
          aria-label="Messages"
          className={isActive('/messages') || location.pathname.startsWith('/messages/') ? 'active' : ''}
        >
          <NavIcon>💬</NavIcon>
        </NavButton>
        <NavButton
          as={Link}
          to="/marketplace"
          aria-label="Marketplace"
          className={isActive('/marketplace') || location.pathname.startsWith('/marketplace/') ? 'active' : ''}
        >
          <NavIcon>🛒</NavIcon>
        </NavButton>
        <NavButton
          as={Link}
          to="/favorites"
          aria-label="Favorites"
          className={isActive('/favorites') ? 'active' : ''}
        >
          <NavIcon>⭐</NavIcon>
        </NavButton>
      </CenterSection>
      
      <RightSection>
        {profileComponent || (
          <>
            <Button size="small" variant="text">Sign In</Button>
            <Button size="small">Sign Up</Button>
          </>
        )}
      </RightSection>
    </HeaderContainer>
  );
};

// Styled components
const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${theme.spacing.componentSpacing.navBarHeight};
  padding: 0 ${theme.spacing.layoutSpacing.containerPadding};
  background-color: ${theme.colors.neutral.white};
  border-bottom: 1px solid ${theme.colors.neutral.mediumGray};
  position: sticky;
  top: 0;
  z-index: ${theme.spacing.zIndices.header};
  box-shadow: 0 2px 4px ${theme.colors.alpha.blackAlpha5};
  
  ${theme.breakpoints.devices.mobile} {
    padding: 0 ${theme.spacing.spacingValues.sm};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  
  ${theme.breakpoints.devices.mobile} {
    flex: 0;
  }
`;

const LogoPlaceholder = styled.div`
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.facebook.primary};
  font-size: ${theme.typography.fontSizes.xl};
  margin-right: ${theme.spacing.spacingValues.md};
  
  ${theme.breakpoints.devices.mobile} {
    font-size: ${theme.typography.fontSizes.md};
    margin-right: ${theme.spacing.spacingValues.sm};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 350px;
  width: 100%;
  
  ${theme.breakpoints.devices.mobile} {
    display: none;
  }
`;

const KeyboardShortcutHint = styled.div`
  position: absolute;
  right: 10px;
  top: -18px;
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
  opacity: 0.7;
  pointer-events: none;
`;

const CenterSection = styled.nav`
  display: flex;
  justify-content: center;
  flex: 1;
  
  ${theme.breakpoints.devices.mobile} {
    display: none;
  }
`;

const NavButton = styled.button`
  background: none;
  border: none;
  padding: ${theme.spacing.spacingValues.md};
  margin: 0 ${theme.spacing.spacingValues.sm};
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &:hover {
    background-color: ${theme.colors.neutral.lightGray};
  }
  
  &:active {
    background-color: ${theme.colors.neutral.mediumGray};
  }
  
  /* Active state indicator */
  &.active {
    color: ${theme.colors.facebook.primary};
    
    &::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 3px;
      background-color: ${theme.colors.facebook.primary};
      border-radius: 2px 2px 0 0;
    }
  }
`;

const NavIcon = styled.span`
  font-size: 20px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${theme.spacing.spacingValues.sm};
  flex: 1;
`;

export default Header;