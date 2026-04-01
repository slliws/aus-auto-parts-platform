/**
 * Global Search Bar Component
 * 
 * Provides unified search across all entities with autocomplete
 * and keyboard navigation support.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { 
  setSearchQuery, 
  setActiveEntityType,
  performGlobalSearch,
  selectSearchResults,
  selectSearchQuery,
  selectActiveEntityType,
  selectSearchLoading,
  clearSearch,
  selectSearchSuggestions,
  setSuggestions,
  clearSuggestions
} from '../../../store/slices/searchSlice';
import { EntityType } from '../../../services/search.service';
import { AppDispatch } from '../../../store';

// Styled Components
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0 ${props => props.theme.spacing.sm};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primaryLight};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: none;
  outline: none;
  font-size: ${props => props.theme.typography.sizes.md};
  color: ${props => props.theme.colors.text};
  background: transparent;

  &::placeholder {
    color: ${props => props.theme.colors.textLight};
  }
`;

const SearchIcon = styled.i`
  color: ${props => props.theme.colors.textLight};
  margin-right: ${props => props.theme.spacing.sm};
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.xs};
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
    color: ${props => props.theme.colors.danger};
  }
`;

const EntityFilterContainer = styled.div`
  display: flex;
  margin-top: ${props => props.theme.spacing.xs};
  gap: ${props => props.theme.spacing.xs};
`;

const EntityFilterButton = styled.button<{ active: boolean }>`
  border: none;
  background-color: ${props => props.active ? props.theme.colors.primaryLight : props.theme.colors.backgroundLight};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primaryLight : props.theme.colors.backgroundMedium};
  }
`;

const ResultsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ResultItem = styled.div<{ isActive: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.isActive ? props.theme.colors.backgroundLight : 'transparent'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
  }
`;

const ResultItemContent = styled.div`
  display: flex;
  align-items: center;
`;

const ResultItemIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.theme.spacing.sm};
  flex-shrink: 0;

  i {
    color: ${props => props.theme.colors.primary};
    font-size: ${props => props.theme.typography.sizes.md};
  }
`;

const ResultItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultItemTitle = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultItemSubtitle = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textLight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EntityBadge = styled.div`
  font-size: ${props => props.theme.typography.sizes.xs};
  padding: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.backgroundLight};
  color: ${props => props.theme.colors.textLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-left: ${props => props.theme.spacing.sm};
  text-transform: uppercase;
  font-weight: 500;
`;

const NoResults = styled.div`
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.textLight};
  text-align: center;
  font-size: ${props => props.theme.typography.sizes.md};
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.sm};
  
  i {
    color: ${props => props.theme.colors.primary};
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ViewAllResults = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.borderLight};
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
  }
`;

// Component props
interface GlobalSearchBarProps {
  placeholder?: string;
  maxResults?: number;
  showEntityFilter?: boolean;
  showInHeader?: boolean;
  onSelectResult?: (result: any) => void;
}

/**
 * GlobalSearchBar Component
 * Provides a unified search interface across all entities with autocomplete
 */
const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = 'Search parts, customers, vehicles...',
  maxResults = 5,
  showEntityFilter = true,
  showInHeader = false,
  onSelectResult
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Redux state
  const searchQuery = useSelector(selectSearchQuery);
  const searchResults = useSelector(selectSearchResults);
  const activeEntityType = useSelector(selectActiveEntityType);
  const isLoading = useSelector(selectSearchLoading) === 'pending';
  const suggestions = useSelector(selectSearchSuggestions);

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      if (query.trim().length > 1) {
        dispatch(performGlobalSearch({ 
          query,
          pagination: { page: 1, pageSize: maxResults }
        }));
      } else if (query.trim().length === 0) {
        dispatch(clearSearch());
        dispatch(clearSuggestions());
      }
    }, 300)
  ).current;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchQuery(value));
    debouncedSearch(value);

    if (value.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle entity type filter change
  const handleEntityFilterChange = (entityType: EntityType | 'all') => {
    dispatch(setActiveEntityType(entityType));
    
    if (searchQuery.trim().length > 0) {
      dispatch(performGlobalSearch({
        query: searchQuery,
        filters: entityType !== 'all' ? { entityTypes: [entityType] } : undefined,
        pagination: { page: 1, pageSize: maxResults }
      }));
    }
  };

  // Handle clicking on a result item
  const handleResultClick = (result: any) => {
    if (onSelectResult) {
      onSelectResult(result);
    } else {
      // Navigate to the result's URL
      navigate(result.url);
    }
    
    // Close the dropdown
    setIsOpen(false);
  };

  // Handle clear button click
  const handleClear = () => {
    dispatch(clearSearch());
    dispatch(clearSuggestions());
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If dropdown is not open, open it on arrow down
    if (!isOpen && e.key === 'ArrowDown' && searchQuery.trim().length > 0) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!isOpen) return;

    const results = searchResults.all;

    switch (e.key) {
      case 'ArrowDown':
        // Move down through results
        e.preventDefault();
        setActiveIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        // Move up through results
        e.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        break;
      case 'Enter':
        // Select current result
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleResultClick(results[activeIndex]);
        } else if (searchQuery.trim().length > 0) {
          // If no result is selected, navigate to search results page
          navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        // Close dropdown
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Handle view all results click
  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if / key is pressed and not inside an input/textarea
      if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Get current results based on active entity type
  const getResultsByEntity = () => {
    if (activeEntityType === 'all') {
      return searchResults.all.slice(0, maxResults);
    }
    
    switch (activeEntityType) {
      case EntityType.PART:
        return searchResults.parts.slice(0, maxResults);
      case EntityType.CUSTOMER:
        return searchResults.customers.slice(0, maxResults);
      case EntityType.VEHICLE:
        return searchResults.vehicles.slice(0, maxResults);
      default:
        return searchResults.all.slice(0, maxResults);
    }
  };

  // Get the icon class based on entity type
  const getIconForEntity = (entity: EntityType) => {
    switch (entity) {
      case EntityType.PART:
        return 'fa-cog';
      case EntityType.CUSTOMER:
        return 'fa-user';
      case EntityType.VEHICLE:
        return 'fa-car';
      default:
        return 'fa-search';
    }
  };

  // Get the badge text based on entity type
  const getBadgeTextForEntity = (entity: EntityType) => {
    switch (entity) {
      case EntityType.PART:
        return 'Part';
      case EntityType.CUSTOMER:
        return 'Customer';
      case EntityType.VEHICLE:
        return 'Vehicle';
      default:
        return 'Item';
    }
  };

  // Calculate total results count
  const getTotalResultsCount = () => {
    if (activeEntityType === 'all') {
      return searchResults.parts.length + 
             searchResults.customers.length + 
             searchResults.vehicles.length;
    }
    
    switch (activeEntityType) {
      case EntityType.PART:
        return searchResults.parts.length;
      case EntityType.CUSTOMER:
        return searchResults.customers.length;
      case EntityType.VEHICLE:
        return searchResults.vehicles.length;
      default:
        return 0;
    }
  };

  return (
    <SearchContainer>
      <SearchInputWrapper>
        <SearchIcon className="fa fa-search" />
        <SearchInput
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            setInputFocused(true);
            if (searchQuery.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => setInputFocused(false)}
          onKeyDown={handleKeyDown}
          aria-label="Search"
          data-testid="global-search-input"
        />
        {searchQuery && (
          <ClearButton 
            onClick={handleClear}
            aria-label="Clear search"
            data-testid="clear-search-button"
          >
            <i className="fa fa-times-circle" />
          </ClearButton>
        )}
      </SearchInputWrapper>

      {showEntityFilter && (
        <EntityFilterContainer>
          <EntityFilterButton
            active={activeEntityType === 'all'}
            onClick={() => handleEntityFilterChange('all')}
          >
            All
          </EntityFilterButton>
          <EntityFilterButton
            active={activeEntityType === EntityType.PART}
            onClick={() => handleEntityFilterChange(EntityType.PART)}
          >
            <i className="fa fa-cog" /> Parts
          </EntityFilterButton>
          <EntityFilterButton
            active={activeEntityType === EntityType.CUSTOMER}
            onClick={() => handleEntityFilterChange(EntityType.CUSTOMER)}
          >
            <i className="fa fa-user" /> Customers
          </EntityFilterButton>
          <EntityFilterButton
            active={activeEntityType === EntityType.VEHICLE}
            onClick={() => handleEntityFilterChange(EntityType.VEHICLE)}
          >
            <i className="fa fa-car" /> Vehicles
          </EntityFilterButton>
        </EntityFilterContainer>
      )}

      {isOpen && (
        <ResultsDropdown>
          {isLoading ? (
            <LoadingIndicator>
              <i className="fa fa-spinner" />
            </LoadingIndicator>
          ) : getResultsByEntity().length > 0 ? (
            <>
              {getResultsByEntity().map((result, index) => (
                <ResultItem
                  key={`${result.entity}-${result.id}`}
                  isActive={activeIndex === index}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <ResultItemContent>
                    <ResultItemIcon>
                      <i className={`fa ${getIconForEntity(result.entity)}`} />
                    </ResultItemIcon>
                    <ResultItemInfo>
                      <ResultItemTitle>{result.title}</ResultItemTitle>
                      <ResultItemSubtitle>{result.subtitle}</ResultItemSubtitle>
                    </ResultItemInfo>
                    <EntityBadge>
                      {getBadgeTextForEntity(result.entity)}
                    </EntityBadge>
                  </ResultItemContent>
                </ResultItem>
              ))}
              
              {getTotalResultsCount() > maxResults && (
                <ViewAllResults onClick={handleViewAllResults}>
                  View all results ({getTotalResultsCount()})
                </ViewAllResults>
              )}
            </>
          ) : searchQuery.trim().length > 0 ? (
            <NoResults>
              No results found for "{searchQuery}"
            </NoResults>
          ) : null}
        </ResultsDropdown>
      )}

      {/* Keyboard shortcut hint */}
      {showInHeader && !inputFocused && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '12px', pointerEvents: 'none' }}>
          Press / to search
        </div>
      )}
    </SearchContainer>
  );
};

export default GlobalSearchBar;