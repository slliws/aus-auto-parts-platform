import { useEffect } from 'react';
import styled from '@emotion/styled';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchCategories, selectCategories } from '../store/slices/partsSlice';
import PageContainer from '../components/templates/PageContainer';
import TwoColumnLayout from '../components/templates/TwoColumnLayout';
import FilterPanel from '../components/organisms/marketplace/FilterPanel';
import ProductGrid from '../components/organisms/marketplace/ProductGrid';
import SearchBar from '../components/molecules/marketplace/SearchBar';
import SortSelector from '../components/molecules/marketplace/SortSelector';

const MarketplaceHeader = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const SearchSection = styled.div`
  flex: 1;
`;

const SortSection = styled.div`
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CategoryTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #050505;
  margin: 0 0 16px 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

/**
 * MarketplacePage Component
 * Full marketplace view with filters, search, and product grid
 * Supports category-specific views via URL parameter
 */
const MarketplacePage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(selectCategories);

  // Ensure categories are loaded so we can resolve the name
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const getCategoryTitle = (): string => {
    if (!categoryId) return 'All Parts';
    const match = categories.find((c) => String(c.id) === categoryId);
    return match ? match.name : `Category: ${categoryId}`;
  };

  return (
    <PageContainer>
      {categoryId && <CategoryTitle>{getCategoryTitle()}</CategoryTitle>}

      <MarketplaceHeader>
        <SearchSection>
          <SearchBar />
        </SearchSection>
        <SortSection>
          <SortSelector />
        </SortSection>
      </MarketplaceHeader>

      <TwoColumnLayout
        sidebar={<FilterPanel />}
        main={<ProductGrid />}
      />
    </PageContainer>
  );
};

export default MarketplacePage;
