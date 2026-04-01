import styled from '@emotion/styled';
import PageContainer from '../components/templates/PageContainer';
import ProductGrid from '../components/organisms/marketplace/ProductGrid';
import CategoryBrowser from '../components/organisms/marketplace/CategoryBrowser';

// Sample categories for demo
const sampleCategories = [
  { id: '1', name: 'Brake Parts', count: 156 },
  { id: '2', name: 'Engine Parts', count: 243 },
  { id: '3', name: 'Suspension', count: 89 },
  { id: '4', name: 'Electrical', count: 127 },
  { id: '5', name: 'Body Parts', count: 94 },
  { id: '6', name: 'Filters', count: 78 },
];

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
 * Landing page with marketplace overview and featured categories
 */
const HomePage = () => {
  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId);
    // TODO: Implement category filtering
  };

  const handleProductClick = (id: string) => {
    console.log('Product clicked:', id);
    // TODO: Navigate to product detail page
  };

  const handleSaveToggle = (id: string, saved: boolean) => {
    console.log('Save toggled:', id, saved);
    // TODO: Implement save/unsave functionality
  };

  return (
    <PageContainer>
      <HomeContent>
        <WelcomeSection>
          <h1>Australian Auto Parts Marketplace</h1>
          <p>Find quality parts for your vehicle</p>
        </WelcomeSection>

        <CategoryBrowser
          categories={sampleCategories}
          onCategoryClick={handleCategoryClick}
        />

        <ProductGrid
          products={[]}
          emptyMessage="No products available. Check back soon!"
          onProductClick={handleProductClick}
          onSaveToggle={handleSaveToggle}
        />
      </HomeContent>
    </PageContainer>
  );
};

export default HomePage;