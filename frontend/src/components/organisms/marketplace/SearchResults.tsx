import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { SortSelector, SortOption } from '../../molecules/marketplace/SortSelector';
import { SearchBar } from '../../molecules/marketplace/SearchBar';

/**
 * SearchResults Props
 */
export interface SearchResultsProps {
  totalResults: number;
  currentPage?: number;
  totalPages?: number;
  searchQuery?: string;
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

/**
 * Results Container
 */
const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

/**
 * Results Header
 */
const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

/**
 * Results Info
 */
const ResultsInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * Results Count
 */
const ResultsCount = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0;
`;

/**
 * Results Subtext
 */
const ResultsSubtext = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
  margin: 0;
`;

/**
 * Controls Container
 */
const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * Search Container
 */
const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    max-width: 100%;
  }
`;

/**
 * Pagination Info
 */
const PaginationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Format results count text
 */
const formatResultsText = (count: number): string => {
  if (count === 0) return 'No results found';
  if (count === 1) return '1 result';
  return `${count.toLocaleString()} results`;
};

/**
 * SearchResults Component - Search results header with count and sorting
 * 
 * @example
 * <SearchResults
 *   totalResults={156}
 *   currentPage={1}
 *   totalPages={8}
 *   searchQuery="brake pads"
 *   sortOptions={[
 *     { label: 'Most Relevant', value: 'relevance' },
 *     { label: 'Price: Low to High', value: 'price_asc' },
 *     { label: 'Price: High to Low', value: 'price_desc' },
 *     { label: 'Newest First', value: 'date_desc' }
 *   ]}
 *   sortValue={sortValue}
 *   onSortChange={setSortValue}
 *   onSearchChange={setSearchQuery}
 *   onSearch={handleSearch}
 * />
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  totalResults,
  currentPage = 1,
  totalPages = 1,
  searchQuery = '',
  sortOptions,
  sortValue,
  onSortChange,
  onSearchChange,
  onSearch,
}) => {
  return (
    <ResultsContainer>
      <ResultsHeader>
        <ResultsInfo>
          <ResultsCount>{formatResultsText(totalResults)}</ResultsCount>
          {searchQuery && (
            <ResultsSubtext>
              for "{searchQuery}"
            </ResultsSubtext>
          )}
          {totalPages > 1 && (
            <PaginationInfo>
              Page {currentPage} of {totalPages}
            </PaginationInfo>
          )}
        </ResultsInfo>
        
        <ControlsContainer>
          {onSearchChange && onSearch && (
            <SearchContainer>
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                onSearch={onSearch}
                placeholder="Search parts..."
              />
            </SearchContainer>
          )}
          <SortSelector
            options={sortOptions}
            value={sortValue}
            onChange={onSortChange}
          />
        </ControlsContainer>
      </ResultsHeader>
    </ResultsContainer>
  );
};

export default SearchResults;