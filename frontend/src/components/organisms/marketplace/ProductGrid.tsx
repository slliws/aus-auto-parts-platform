import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { ProductCard, ProductCardProps } from '../../molecules/marketplace/ProductCard';

/**
 * ProductGrid Props
 */
export interface ProductGridProps {
  products: ProductCardProps[];
  loading?: boolean;
  emptyMessage?: string;
  onProductClick?: (id: string) => void;
  onSaveToggle?: (id: string, saved: boolean) => void;
}

/**
 * Grid Container with responsive layout
 */
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.componentSpacing.cardGap};
  padding: ${theme.spacing.componentSpacing.containerPadding};
  
  /* Tablet: 2 columns */
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Mobile: 1 column */
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.componentSpacing.mobileGap};
    padding: ${theme.spacing.componentSpacing.mobilePadding};
  }
`;

/**
 * Empty State Container
 */
const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

/**
 * Empty State Icon
 */
const EmptyIcon = styled.svg`
  width: 80px;
  height: 80px;
  fill: ${theme.colors.neutral.mediumGray};
  margin-bottom: 16px;
`;

/**
 * Empty State Text
 */
const EmptyText = styled.p`
  font-size: ${theme.typography.fontSizes.lg};
  color: ${theme.colors.neutral.darkGray};
  margin: 0;
`;

/**
 * Loading State Container
 */
const LoadingContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
`;

/**
 * Loading Spinner
 */
const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${theme.colors.neutral.lightGray};
  border-top-color: ${theme.colors.facebook.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/**
 * Skeleton Card for loading state
 */
const SkeletonCard = styled.div`
  width: 100%;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  overflow: hidden;
`;

/**
 * Skeleton Image
 */
const SkeletonImage = styled.div`
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(
    90deg,
    ${theme.colors.neutral.lightGray} 0%,
    ${theme.colors.neutral.mediumGray}20 50%,
    ${theme.colors.neutral.lightGray} 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

/**
 * Skeleton Content
 */
const SkeletonContent = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * Skeleton Line
 */
const SkeletonLine = styled.div<{ width: string; height?: string }>`
  width: ${props => props.width};
  height: ${props => props.height || '16px'};
  background: linear-gradient(
    90deg,
    ${theme.colors.neutral.lightGray} 0%,
    ${theme.colors.neutral.mediumGray}20 50%,
    ${theme.colors.neutral.lightGray} 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

/**
 * ProductGrid Component - Responsive grid of product cards
 * 
 * @example
 * <ProductGrid
 *   products={parts}
 *   loading={isLoading}
 *   emptyMessage="No parts found"
 *   onProductClick={handleProductClick}
 *   onSaveToggle={handleSaveToggle}
 * />
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  emptyMessage = 'No products found',
  onProductClick,
  onSaveToggle,
}) => {
  // Render skeleton cards during loading
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <SkeletonCard key={`skeleton-${index}`}>
        <SkeletonImage />
        <SkeletonContent>
          <SkeletonLine width="60%" height="20px" />
          <SkeletonLine width="100%" />
          <SkeletonLine width="40%" />
        </SkeletonContent>
      </SkeletonCard>
    ));
  };

  // Render empty state
  const renderEmpty = () => (
    <EmptyState>
      <EmptyIcon viewBox="0 0 24 24">
        <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM15 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
      </EmptyIcon>
      <EmptyText>{emptyMessage}</EmptyText>
    </EmptyState>
  );

  return (
    <GridContainer>
      {loading ? (
        renderSkeletons()
      ) : products.length === 0 ? (
        renderEmpty()
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onClick={onProductClick}
            onSaveToggle={onSaveToggle}
          />
        ))
      )}
    </GridContainer>
  );
};

export default ProductGrid;