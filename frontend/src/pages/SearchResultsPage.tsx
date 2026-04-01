import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Pagination,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import { AppDispatch, RootState } from '../store';
import { 
  selectSearchResults,
  selectSearchLoading,
  selectSearchError,
  selectSearchQuery,
  selectSearchPagination,
  performSearch,
  clearSearchResults,
  setEntityTypeFilter
} from '../store/slices/searchSlice';
import { theme } from '../styles/theme';
import PageContainer from '../components/templates/PageContainer';
import { Entity } from '../types';

/**
 * Search Results Page Component
 * 
 * Displays search results with filtering options and pagination
 */
const SearchResultsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchResults = useSelector(selectSearchResults);
  const isLoading = useSelector(selectSearchLoading);
  const error = useSelector(selectSearchError);
  const searchQuery = useSelector(selectSearchQuery);
  const pagination = useSelector(selectSearchPagination);
  
  const [activeTab, setActiveTab] = useState<'all' | Entity>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'name'>('relevance');
  
  // Extract query params on initial load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';
    const page = parseInt(queryParams.get('page') || '1', 10);
    const entity = queryParams.get('entity') as Entity | null;
    
    if (query) {
      dispatch(performSearch({ 
        query, 
        page, 
        entityType: entity || undefined,
        sortBy
      }));
      
      if (entity && ['part', 'customer', 'vehicle'].includes(entity)) {
        setActiveTab(entity as Entity);
        dispatch(setEntityTypeFilter(entity as Entity));
      }
    }
    
    return () => {
      dispatch(clearSearchResults());
    };
  }, [dispatch, location.search]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'all' | Entity) => {
    setActiveTab(newValue);
    
    const queryParams = new URLSearchParams(location.search);
    
    if (newValue === 'all') {
      queryParams.delete('entity');
      dispatch(setEntityTypeFilter(null));
    } else {
      queryParams.set('entity', newValue);
      dispatch(setEntityTypeFilter(newValue));
    }
    
    queryParams.set('page', '1');
    navigate(`/search?${queryParams.toString()}`);
    
    dispatch(performSearch({ 
      query: searchQuery, 
      page: 1, 
      entityType: newValue === 'all' ? undefined : newValue,
      sortBy
    }));
  };
  
  // Handle pagination change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', page.toString());
    navigate(`/search?${queryParams.toString()}`);
    
    dispatch(performSearch({ 
      query: searchQuery, 
      page, 
      entityType: activeTab === 'all' ? undefined : activeTab,
      sortBy
    }));
  };
  
  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newSortBy = event.target.value as 'relevance' | 'newest' | 'name';
    setSortBy(newSortBy);
    
    dispatch(performSearch({ 
      query: searchQuery, 
      page: pagination.page, 
      entityType: activeTab === 'all' ? undefined : activeTab,
      sortBy: newSortBy
    }));
  };
  
  // Get count of results by entity type
  const getCountByEntity = (entity: Entity) => {
    if (!searchResults) return 0;
    return searchResults[`${entity}s`]?.total || 0;
  };
  
  const getTotalResults = () => {
    if (!searchResults) return 0;
    return searchResults.totalResults;
  };
  
  // Render search results by entity type
  const renderResultsByEntity = (entity: Entity) => {
    if (!searchResults || !searchResults[`${entity}s`]?.results) {
      return null;
    }
    
    const results = searchResults[`${entity}s`]?.results || [];
    
    if (results.length === 0) {
      return <EmptyState entity={entity} query={searchQuery} />;
    }
    
    return (
      <ResultsList>
        {results.map((result) => (
          <ResultCard key={`${result.entity}-${result.id}`}>
            <Link to={result.url} style={{ textDecoration: 'none', color: 'inherit' }}>
              <ResultCardContent>
                <ResultInfo>
                  <ResultTitle>
                    {result.title}
                    <RelevanceBadge relevance={result.relevance} />
                  </ResultTitle>
                  <ResultSubtitle>{result.subtitle}</ResultSubtitle>
                  <ResultDetails>{result.details}</ResultDetails>
                </ResultInfo>
                {result.imageUrl && (
                  <ResultImageContainer>
                    <ResultImage src={result.imageUrl} alt={result.title} />
                  </ResultImageContainer>
                )}
              </ResultCardContent>
            </Link>
          </ResultCard>
        ))}
      </ResultsList>
    );
  };
  
  // Empty state component
  const EmptyState = ({ entity, query }: { entity: Entity, query: string }) => {
    const entityDisplay = {
      part: 'parts',
      customer: 'customers',
      vehicle: 'vehicles'
    }[entity];
    
    return (
      <EmptyStateContainer>
        <Typography variant="h6">
          No {entityDisplay} found for "{query}"
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Try adjusting your search terms or browse all {entityDisplay}
        </Typography>
      </EmptyStateContainer>
    );
  };
  
  // Relevance badge component
  const RelevanceBadge = ({ relevance }: { relevance: number }) => {
    // Only show relevance badge if sorting by relevance
    if (sortBy !== 'relevance') return null;
    
    // Convert relevance score to percentage for display
    const relevancePercent = Math.round(relevance * 100);
    
    return (
      <RelevanceChip 
        label={`${relevancePercent}% match`} 
        size="small" 
        relevance={relevance}
      />
    );
  };
  
  return (
    <PageContainer>
      <SearchHeader>
        <Typography variant="h4" component="h1">
          Search Results for "{searchQuery}"
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {getTotalResults()} results found
        </Typography>
      </SearchHeader>
      
      <FilterContainer>
        <StyledTabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <StyledTab value="all" label={`All (${getTotalResults()})`} />
          <StyledTab 
            value="part" 
            label={`Parts (${getCountByEntity('part')})`} 
            disabled={getCountByEntity('part') === 0}
          />
          <StyledTab 
            value="customer" 
            label={`Customers (${getCountByEntity('customer')})`} 
            disabled={getCountByEntity('customer') === 0}
          />
          <StyledTab 
            value="vehicle" 
            label={`Vehicles (${getCountByEntity('vehicle')})`} 
            disabled={getCountByEntity('vehicle') === 0}
          />
        </StyledTabs>
        
        <SortByContainer>
          <FormControl variant="outlined" size="small">
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
            >
              <MenuItem value="relevance">Relevance</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </SortByContainer>
      </FilterContainer>
      
      <Divider />
      
      {isLoading ? (
        <LoadingContainer>
          <CircularProgress />
          <Typography variant="body2">Searching...</Typography>
        </LoadingContainer>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : !searchResults ? (
        <EmptyStateContainer>
          <Typography variant="h6">
            No results found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search terms or browse all categories
          </Typography>
        </EmptyStateContainer>
      ) : (
        <ResultsContainer>
          {activeTab === 'all' ? (
            <>
              {['part', 'customer', 'vehicle'].map((entity) => {
                const entityResults = searchResults[`${entity}s`]?.results;
                if (!entityResults || entityResults.length === 0) return null;
                
                return (
                  <EntitySection key={entity}>
                    <EntitySectionHeader>
                      <Typography variant="h5" component="h2">
                        {entity === 'part' ? 'Parts' : 
                         entity === 'customer' ? 'Customers' : 'Vehicles'}
                      </Typography>
                      {searchResults[`${entity}s`]?.total > (entityResults?.length || 0) && (
                        <ViewMoreLink 
                          onClick={() => handleTabChange({} as React.SyntheticEvent, entity as Entity)}
                        >
                          View all {searchResults[`${entity}s`]?.total} results
                        </ViewMoreLink>
                      )}
                    </EntitySectionHeader>
                    {renderResultsByEntity(entity as Entity)}
                  </EntitySection>
                );
              })}
            </>
          ) : (
            renderResultsByEntity(activeTab)
          )}
          
          {pagination.totalPages > 1 && (
            <PaginationContainer>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <Typography variant="body2" color="textSecondary">
                Showing {pagination.pageSize * (pagination.page - 1) + 1} - {Math.min(pagination.pageSize * pagination.page, getTotalResults())} of {getTotalResults()}
              </Typography>
            </PaginationContainer>
          )}
        </ResultsContainer>
      )}
    </PageContainer>
  );
};

// Styled components
const SearchHeader = styled.div`
  margin-bottom: ${theme.spacing.spacingValues.lg};
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.spacingValues.md};
  
  ${theme.breakpoints.devices.mobile} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StyledTabs = styled(Tabs)`
  margin-bottom: ${theme.spacing.spacingValues.sm};
`;

const StyledTab = styled(Tab)`
  text-transform: none;
`;

const SortByContainer = styled.div`
  ${theme.breakpoints.devices.mobile} {
    margin-top: ${theme.spacing.spacingValues.sm};
  }
`;

const ResultsContainer = styled.div`
  margin-top: ${theme.spacing.spacingValues.lg};
`;

const EntitySection = styled.section`
  margin-bottom: ${theme.spacing.spacingValues.xl};
`;

const EntitySectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.spacingValues.sm};
`;

const ViewMoreLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary.main};
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: ${theme.colors.primary.dark};
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.spacingValues.sm};
`;

const ResultCard = styled(Card)`
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ResultCardContent = styled(CardContent)`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing.spacingValues.md};
`;

const ResultInfo = styled.div`
  flex: 1;
`;

const ResultTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  margin: 0 0 ${theme.spacing.spacingValues.xs} 0;
  font-weight: ${theme.typography.fontWeights.medium};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.spacingValues.xs};
`;

const ResultSubtitle = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
  margin-bottom: ${theme.spacing.spacingValues.xs};
`;

const ResultDetails = styled.p`
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.gray};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ResultImageContainer = styled.div`
  width: 80px;
  height: 80px;
  margin-left: ${theme.spacing.spacingValues.md};
  flex-shrink: 0;
`;

const ResultImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
`;

const RelevanceChip = styled(Chip)<{ relevance: number }>`
  background-color: ${({ relevance }) => {
    if (relevance >= 0.8) return theme.colors.success.light;
    if (relevance >= 0.5) return theme.colors.warning.light;
    return theme.colors.error.light;
  }};
  color: ${({ relevance }) => {
    if (relevance >= 0.8) return theme.colors.success.dark;
    if (relevance >= 0.5) return theme.colors.warning.dark;
    return theme.colors.error.dark;
  }};
  font-size: 0.75rem;
  height: 20px;
  margin-left: ${theme.spacing.spacingValues.sm};
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: ${theme.spacing.spacingValues.xl};
  gap: ${theme.spacing.spacingValues.sm};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.spacingValues.xl} 0;
  gap: ${theme.spacing.spacingValues.md};
`;

const EmptyStateContainer = styled.div`
  text-align: center;
  padding: ${theme.spacing.spacingValues.xl} 0;
`;

export default SearchResultsPage;