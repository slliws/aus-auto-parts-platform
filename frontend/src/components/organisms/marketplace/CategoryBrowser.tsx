import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Category interface
 */
export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
  description?: string;
}

/**
 * CategoryBrowser Props
 */
export interface CategoryBrowserProps {
  categories: Category[];
  onCategoryClick: (categoryId: string) => void;
  selectedCategory?: string;
}

/**
 * Browser Container
 */
const BrowserContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: ${theme.spacing.componentSpacing.containerPadding};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    padding: ${theme.spacing.componentSpacing.mobilePadding};
  }
`;

/**
 * Category Card
 */
const CategoryCard = styled.div<{ isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  background-color: ${props => 
    props.isSelected ? theme.colors.alpha.primaryAlpha10 : theme.colors.neutral.white
  };
  border: 2px solid ${props => 
    props.isSelected ? theme.colors.facebook.primary : theme.colors.neutral.lightGray
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${theme.colors.facebook.primary};
  }
`;

/**
 * Category Icon Container
 */
const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.alpha.primaryAlpha10};
  border-radius: 50%;
  margin-bottom: 12px;
`;

/**
 * Category Icon
 */
const Icon = styled.svg`
  width: 24px;
  height: 24px;
  fill: ${theme.colors.facebook.primary};
`;

/**
 * Category Name
 */
const CategoryName = styled.h3`
  font-size: ${theme.typography.fontSizes.sm};\
  font-weight: ${theme.typography.fontWeights.semiBold};
  color: ${theme.colors.neutral.black};
  margin: 0 0 4px 0;
  text-align: center;
`;

/**
 * Category Count
 */
const CategoryCount = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Default category icons by name
 */
const defaultIcons: Record<string, JSX.Element> = {
  'Brake Parts': (
    <Icon viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
    </Icon>
  ),
  'Engine Parts': (
    <Icon viewBox="0 0 24 24">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.12 6 2.12v4.78z" />
    </Icon>
  ),
  'Suspension': (
    <Icon viewBox="0 0 24 24">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </Icon>
  ),
  'Electrical': (
    <Icon viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </Icon>
  ),
  'Body Parts': (
    <Icon viewBox="0 0 24 24">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </Icon>
  ),
  'Filters': (
    <Icon viewBox="0 0 24 24">
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
    </Icon>
  ),
  'All Parts': (
    <Icon viewBox="0 0 24 24">
      <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
    </Icon>
  ),
};

/**
 * Get icon for category
 */
const getIcon = (category: Category): JSX.Element => {
  if (category.icon && defaultIcons[category.icon]) {
    return defaultIcons[category.icon];
  }
  if (defaultIcons[category.name]) {
    return defaultIcons[category.name];
  }
  // Default icon
  return (
    <Icon viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
    </Icon>
  );
};

/**
 * CategoryBrowser Component - Browse by category with icons and counts
 * 
 * @example
 * <CategoryBrowser
 *   categories={[
 *     { id: '1', name: 'Brake Parts', count: 156 },
 *     { id: '2', name: 'Engine Parts', count: 243 },
 *     { id: '3', name: 'Suspension', count: 89 },
 *     { id: '4', name: 'Electrical', count: 127 }
 *   ]}
 *   onCategoryClick={handleCategoryClick}
 *   selectedCategory={selectedCategoryId}
 * />
 */
export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  categories,
  onCategoryClick,
  selectedCategory,
}) => {
  return (
    <BrowserContainer>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          isSelected={selectedCategory === category.id}
          onClick={() => onCategoryClick(category.id)}
        >
          <IconContainer>
            {getIcon(category)}
          </IconContainer>
          <CategoryName>{category.name}</CategoryName>
          {category.count !== undefined && (
            <CategoryCount>
              {category.count.toLocaleString()} {category.count === 1 ? 'item' : 'items'}
            </CategoryCount>
          )}
        </CategoryCard>
      ))}
    </BrowserContainer>
  );
};

export default CategoryBrowser;