import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * PriceDisplay Props
 */
export interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  showDiscount?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Price Container
 */
const PriceContainer = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
`;

/**
 * Current Price
 */
const CurrentPrice = styled.span<{ size: string }>`
  font-size: ${props => 
    props.size === 'small' ? theme.typography.fontSizes.md :
    props.size === 'large' ? theme.typography.fontSizes['2xl'] :
    theme.typography.fontSizes.xl
  };
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
`;

/**
 * Original Price (strikethrough)
 */
const OriginalPrice = styled.span<{ size: string }>`
  font-size: ${props => 
    props.size === 'small' ? theme.typography.fontSizes.sm :
    props.size === 'large' ? theme.typography.fontSizes.lg :
    theme.typography.fontSizes.md
  };
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.neutral.darkGray};
  text-decoration: line-through;
`;

/**
 * Discount Badge
 */
const DiscountBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${theme.colors.facebook.marketplaceRed};
  color: ${theme.colors.neutral.white};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.semiBold};
`;

/**
 * Format currency value
 */
const formatCurrency = (value: number, currency: string = 'AUD'): string => {
  if (currency === 'AUD' || currency === 'USD') {
    return `$${value.toFixed(2)}`;
  }
  return `${currency} ${value.toFixed(2)}`;
};

/**
 * Calculate discount percentage
 */
const calculateDiscount = (original: number, current: number): number => {
  return Math.round(((original - current) / original) * 100);
};

/**
 * PriceDisplay Component - Price formatting with discount support
 * 
 * @example
 * // Regular price
 * <PriceDisplay price={89.99} />
 * 
 * // With discount
 * <PriceDisplay 
 *   price={69.99} 
 *   originalPrice={89.99} 
 *   showDiscount={true}
 *   size="large"
 * />
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency = 'AUD',
  showDiscount = true,
  size = 'medium',
}) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? calculateDiscount(originalPrice, price) : 0;

  return (
    <PriceContainer>
      <CurrentPrice size={size}>
        {formatCurrency(price, currency)}
      </CurrentPrice>
      {hasDiscount && (
        <>
          <OriginalPrice size={size}>
            {formatCurrency(originalPrice, currency)}
          </OriginalPrice>
          {showDiscount && discountPercent > 0 && (
            <DiscountBadge>
              {discountPercent}% OFF
            </DiscountBadge>
          )}
        </>
      )}
    </PriceContainer>
  );
};

export default PriceDisplay;