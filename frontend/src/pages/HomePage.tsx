import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../store';
import styled from '@emotion/styled';
import PageContainer from '../components/templates/PageContainer';
import ProductGrid from '../components/organisms/marketplace/ProductGrid';
import CategoryBrowser from '../components/organisms/marketplace/CategoryBrowser';
import {
  fetchParts,
  fetchCategories,
  savePartToFavorites,
  removePartFromFavorites,
  selectParts,
  selectPartsLoading,
  selectCategories,
  selectFavoritePartIds,
} from '../store/slices/partsSlice';

const HomeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
    gap: 16px;
  }
`;

const WelcomeSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #050505;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    color: #65676b;
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: 16px;

    h1 {
      font-size: 20px;
    }

    p {
      font-size: 14px;
    }
  }
`;

/**
 * HomePage Component
 * Landing page with live marketplace overview and featured categories
 */
const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const parts = useSelector(selectParts);
  const loading = useSelector(selectPartsLoading);
  const categories = useSelector(selectCategories);
  const favoriteIds = useSelector(selectFavoritePartIds);

  // Load parts and categories on mount
  useEffect(() => {
    dispatch(fetchParts({ page: 1, limit: 20 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/marketplace/category/${categoryId}`);
  };

  const handleProductClick = (id: string) => {
    navigate(`/marketplace/${id}`);
  };

  const handleSaveToggle = (id: string, saved: boolean) => {
    if (saved) {
      dispatch(savePartToFavorites(id));
    } else {
      // removePartFromFavorites needs the favoriteId — for now use the partId as identifier
      dispatch(removePartFromFavorites({ partId: id, favoriteId: id }));
    }
  };

  // Map parts to ProductCardProps shape
  const products = parts.map(part => ({
    id: part.id,
    title: part.name,
    price: part.sellingPrice,
    imageSrc: '',
    location: part.location ?? undefined,
    condition: 'used' as const,
    isSaved: favoriteIds.includes(part.id),
  }));

  return (
    <PageContainer>
      <HomeContent>
        <WelcomeSection>
          <h1>Australian Auto Parts Marketplace</h1>
          <p>Find quality parts for your vehicle</p>
        </WelcomeSection>

        {categories.length > 0 && (
          <CategoryBrowser
            categories={categories}
            onCategoryClick={handleCategoryClick}
          />
        )}

        <ProductGrid
          products={products}
          loading={loading === 'pending'}
          emptyMessage="No products available. Check back soon!"
          onProductClick={handleProductClick}
          onSaveToggle={handleSaveToggle}
        />
      </HomeContent>
    </PageContainer>
  );
};

export default HomePage;
