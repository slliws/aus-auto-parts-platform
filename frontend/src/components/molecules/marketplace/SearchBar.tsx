import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Autocomplete suggestion interface
 */
export interface SearchSuggestion {
  id: string;
  text: string;
  type?: 'recent' | 'suggestion' | 'category';
}

/**
 * SearchBar Props
 */
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
}

/**
 * Search Container
 */
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`;

/**
 * Search Input Wrapper
 */
const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background-color: ${theme.colors.neutral.lightGray};
  border-radius: 24px;
  padding: 0 16px;
  transition: background-color 0.2s, box-shadow 0.2s;
  
  &:focus-within {
    background-color: ${theme.colors.neutral.white};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

/**
 * Search Icon
 */
const SearchIcon = styled.svg`
  width: 20px;
  height: 20px;
  fill: ${theme.colors.neutral.darkGray};
  flex-shrink: 0;
  margin-right: 8px;
`;

/**
 * Search Input
 */
const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.black};
  
  &::placeholder {
    color: ${theme.colors.neutral.darkGray};
  }
  
  &:focus {
    outline: none;
  }
`;

/**
 * Clear Button
 */
const ClearButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${theme.colors.neutral.mediumGray};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${theme.colors.neutral.darkGray};
  }
  
  svg {
    width: 12px;
    height: 12px;
    fill: ${theme.colors.neutral.white};
  }
`;

/**
 * Suggestions Dropdown
 */
const SuggestionsDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
`;

/**
 * Suggestion Item
 */
const SuggestionItem = styled.div<{ type?: string }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${theme.colors.neutral.lightGray};
  }
  
  &:first-of-type {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-of-type {
    border-radius: 0 0 8px 8px;
  }
`;

/**
 * Suggestion Icon
 */
const SuggestionIcon = styled.svg<{ type?: string }>`
  width: 16px;
  height: 16px;
  fill: ${props => 
    props.type === 'recent' ? theme.colors.neutral.darkGray :
    props.type === 'category' ? theme.colors.facebook.primary :
    theme.colors.neutral.mediumGray
  };
  flex-shrink: 0;
`;

/**
 * Suggestion Text
 */
const SuggestionText = styled.span`
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.black};
  flex: 1;
`;

/**
 * Loading Spinner
 */
const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${theme.colors.neutral.lightGray};
  border-top-color: ${theme.colors.facebook.primary};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/**
 * SearchBar Component with autocomplete
 * 
 * @example
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={handleSearch}
 *   placeholder="Search auto parts..."
 *   suggestions={suggestions}
 *   loading={isLoading}
 *   onSuggestionClick={handleSuggestionClick}
 * />
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  suggestions = [],
  loading = false,
  onSuggestionClick,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.length > 0);
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
    onSearch(suggestion.text);
  };

  const renderIcon = (type?: string) => {
    if (type === 'recent') {
      return (
        <SuggestionIcon type={type} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </SuggestionIcon>
      );
    } else if (type === 'category') {
      return (
        <SuggestionIcon type={type} viewBox="0 0 24 24">
          <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
        </SuggestionIcon>
      );
    } else {
      return (
        <SuggestionIcon type={type} viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </SuggestionIcon>
      );
    }
  };

  return (
    <SearchContainer ref={containerRef}>
      <InputWrapper>
        <SearchIcon viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </SearchIcon>
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => value.length > 0 && setShowSuggestions(true)}
        />
        {loading && <LoadingSpinner />}
        {value && !loading && (
          <ClearButton onClick={handleClear} aria-label="Clear search">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </ClearButton>
        )}
      </InputWrapper>
      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsDropdown>
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              type={suggestion.type}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {renderIcon(suggestion.type)}
              <SuggestionText>{suggestion.text}</SuggestionText>
            </SuggestionItem>
          ))}
        </SuggestionsDropdown>
      )}
    </SearchContainer>
  );
};

export default SearchBar;