import styled from '@emotion/styled';
import PageContainer from '../components/templates/PageContainer';
import ProductGrid from '../components/organisms/marketplace/ProductGrid';

const FavoritesContent = styled.div`
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 24px;

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
    h1 {
      font-size: 20px;
    }

    p {
      font-size: 14px;
    }
  }
`;

const EmptyState = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #050505;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    color: #65676b;
    margin: 0;
  }
`;

/**
 * FavoritesPage Component
 * Displays user's saved/favorite parts
 */
const FavoritesPage = () => {
  // TODO: Get favorites from Redux store
  const hasFavorites = false; // Placeholder

  return (
    <PageContainer>
      <FavoritesContent>
        <PageHeader>
          <h1>Saved Parts</h1>
          <p>Parts you've marked as favorites</p>
        </PageHeader>

        {hasFavorites ? (
          <ProductGrid />
        ) : (
          <EmptyState>
            <h2>No saved parts yet</h2>
            <p>Start browsing the marketplace to save parts you're interested in</p>
          </EmptyState>
        )}
      </FavoritesContent>
    </PageContainer>
  );
};

export default FavoritesPage;