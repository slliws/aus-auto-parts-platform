import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/**
 * Card component props for Facebook Marketplace style
 */
export interface CardProps {
  /** Product title */
  title: string;
  /** Product price */
  price: string;
  /** Product image source */
  imageSrc: string;
  /** Optional product rating (0-5) */
  rating?: number;
  /** Optional location text */
  location?: string;
  /** Optional onClick handler */
  onClick?: () => void;
}

/**
 * Card container with Marketplace styling
 */
const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
  border-radius: ${theme.spacing.borderRadius.md};
  box-shadow: 0 1px 2px ${theme.colors.alpha.blackAlpha5};
  overflow: hidden;
  background-color: ${theme.colors.neutral.white};
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px ${theme.colors.alpha.blackAlpha10};
  }
`;

/**
 * Image container for the product image
 */
const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
`;

/**
 * Product image styling
 */
const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

/**
 * Content container for text information
 */
const Content = styled.div`
  padding: ${theme.spacing.componentSpacing.cardPadding};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * Price styling
 */
const Price = styled.div`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.semiBold};
  color: ${theme.colors.neutral.black};
`;

/**
 * Title styling
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
`;

/**
 * Metadata container for location and rating
 */
const Metadata = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Location text styling
 */
const Location = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Rating container styling
 */
const Rating = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Star icon component for ratings
 */
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={theme.colors.facebook.marketplaceYellow}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/**
 * Location icon component
 */
const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

/**
 * Card component with Facebook Marketplace styling
 * 
 * @example
 * <Card 
 *   title="Ford Ranger 2022 Brake Pads" 
 *   price="$89.99" 
 *   imageSrc="path/to/image.jpg" 
 *   rating={4.5}
 *   location="Sydney"
 * />
 */
export const Card: React.FC<CardProps> = ({
  title,
  price,
  imageSrc,
  rating,
  location,
  onClick
}) => {
  return (
    <CardContainer onClick={onClick}>
      <ImageContainer>
        <Image src={imageSrc} alt={title} />
      </ImageContainer>
      <Content>
        <Price>{price}</Price>
        <Title>{title}</Title>
        <Metadata>
          {location && (
            <Location>
              <LocationIcon />
              {location}
            </Location>
          )}
          {rating && (
            <Rating>
              <StarIcon />
              {rating.toFixed(1)}
            </Rating>
          )}
        </Metadata>
      </Content>
    </CardContainer>
  );
};

export default Card;