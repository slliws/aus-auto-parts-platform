import React, { useState } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * ProductCard Props Interface
 */
export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageSrc: string;
  location?: string;
  condition?: 'new' | 'used' | 'refurbished';
  isSaved?: boolean;
  onSaveToggle?: (id: string, saved: boolean) => void;
  onClick?: (id: string) => void;
}

/**
 * Card Container with Facebook Marketplace styling
 */
const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

/**
 * Image Container
 */
const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 Aspect Ratio */
  overflow: hidden;
  background-color: ${theme.colors.neutral.lightGray};
`;

/**
 * Product Image
 */
const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/**
 * Save Button (Heart Icon)
 */
const SaveButton = styled.button<{ isSaved: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${theme.colors.neutral.white};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  z-index: 10;
  
  &:hover {
    transform: scale(1.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
    fill: ${props => props.isSaved ? theme.colors.facebook.marketplaceRed : 'none'};
    stroke: ${props => props.isSaved ? theme.colors.facebook.marketplaceRed : theme.colors.neutral.darkGray};
    stroke-width: 2;
  }
`;

/**
 * Condition Badge
 */
const ConditionBadge = styled.div<{ condition: string }>`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => 
    props.condition === 'new' ? theme.colors.facebook.marketplaceGreen :
    props.condition === 'refurbished' ? theme.colors.facebook.primary :
    theme.colors.neutral.darkGray
  };
  color: ${theme.colors.neutral.white};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.semiBold};
  text-transform: uppercase;
  z-index: 5;
`;

/**
 * Content Container
 */
const Content = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * Price Display
 */
const Price = styled.div`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
`;

/**
 * Title
 */
const Title = styled.h3`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.neutral.black};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
`;

/**
 * Location Container
 */
const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
  margin-top: 4px;
  
  svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }
`;

/**
 * Heart Icon Component
 */
const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

/**
 * Location Icon Component
 */
const LocationIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

/**
 * ProductCard Component - Facebook Marketplace style
 * 
 * @example
 * <ProductCard
 *   id="part-123"
 *   title="Brake Pads for Toyota Camry"
 *   price={89.99}
 *   imageSrc="/images/brake-pads.jpg"
 *   location="Sydney, NSW"
 *   condition="new"
 *   isSaved={false}
 *   onSaveToggle={handleSave}
 *   onClick={handleClick}
 * />
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  price,
  imageSrc,
  location,
  condition,
  isSaved = false,
  onSaveToggle,
  onClick,
}) => {
  const [saved, setSaved] = useState(isSaved);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !saved;
    setSaved(newSavedState);
    onSaveToggle?.(id, newSavedState);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  const formatPrice = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <CardContainer onClick={handleCardClick}>
      <ImageContainer>
        <Image src={imageSrc} alt={title} />
        {condition && <ConditionBadge condition={condition}>{condition}</ConditionBadge>}
        <SaveButton 
          isSaved={saved} 
          onClick={handleSaveClick}
          aria-label={saved ? 'Remove from saved' : 'Save item'}
        >
          <HeartIcon filled={saved} />
        </SaveButton>
      </ImageContainer>
      <Content>
        <Price>{formatPrice(price)}</Price>
        <Title>{title}</Title>
        {location && (
          <Location>
            <LocationIcon />
            {location}
          </Location>
        )}
      </Content>
    </CardContainer>
  );
};

export default ProductCard;