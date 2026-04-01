import React, { useState } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { Button } from '../../atoms/Button';
import { PriceDisplay } from '../../molecules/marketplace/PriceDisplay';

/**
 * Product Detail interface
 */
export interface ProductDetailData {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  seller: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    responseRate?: number;
    memberSince?: string;
  };
  specifications?: Record<string, string>;
  quantity?: number;
  partNumber?: string;
  manufacturer?: string;
}

/**
 * ProductDetail Props
 */
export interface ProductDetailProps {
  product: ProductDetailData;
  onContact: (sellerId: string) => void;
  onBuy?: (productId: string) => void;
  onSave?: (productId: string) => void;
  isSaved?: boolean;
}

/**
 * Detail Container
 */
const DetailContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  padding: 24px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

/**
 * Image Gallery Container
 */
const GalleryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Main Image Container
 */
const MainImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${theme.colors.neutral.lightGray};
`;

/**
 * Main Image
 */
const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/**
 * Thumbnail Gallery
 */
const ThumbnailGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
`;

/**
 * Thumbnail
 */
const Thumbnail = styled.div<{ isActive: boolean }>`
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => 
    props.isActive ? theme.colors.facebook.primary : theme.colors.neutral.lightGray
  };
  transition: border-color 0.2s;
  
  &:hover {
    border-color: ${theme.colors.facebook.primary};
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/**
 * Info Container
 */
const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * Title
 */
const Title = styled.h1`
  font-size: ${theme.typography.fontSizes['2xl']};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0;
  line-height: 1.3;
`;

/**
 * Price Container
 */
const PriceContainer = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
`;

/**
 * Meta Information
 */
const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/**
 * Meta Item
 */
const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.darkGray};
  
  svg {
    width: 18px;
    height: 18px;
    fill: ${theme.colors.neutral.darkGray};
  }
  
  strong {
    color: ${theme.colors.neutral.black};
    font-weight: ${theme.typography.fontWeights.semiBold};
  }
`;

/**
 * Description Section
 */
const DescriptionSection = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
`;

/**
 * Section Title
 */
const SectionTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0 0 12px 0;
`;

/**
 * Description Text
 */
const DescriptionText = styled.p`
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.darkGray};
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
`;

/**
 * Specifications Grid
 */
const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Spec Item
 */
const SpecItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background-color: ${theme.colors.neutral.lightGray};
  border-radius: 6px;
`;

/**
 * Spec Label
 */
const SpecLabel = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
  text-transform: uppercase;
  font-weight: ${theme.typography.fontWeights.semiBold};
`;

/**
 * Spec Value
 */
const SpecValue = styled.span`
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.black};
  font-weight: ${theme.typography.fontWeights.medium};
`;

/**
 * Seller Card
 */
const SellerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: ${theme.colors.neutral.lightGray};
  border-radius: 8px;
`;

/**
 * Seller Avatar
 */
const SellerAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${theme.colors.neutral.mediumGray};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/**
 * Seller Info
 */
const SellerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * Seller Name
 */
const SellerName = styled.h4`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0;
`;

/**
 * Seller Stats
 */
const SellerStats = styled.div`
  display: flex;
  gap: 12px;
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Action Buttons Container
 */
const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  bottom: 16px;
  background-color: ${theme.colors.neutral.white};
  padding: 16px 0;
`;

/**
 * Button Row
 */
const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

/**
 * Condition Badge
 */
const ConditionBadge = styled.span<{ condition: string }>`
  display: inline-block;
  padding: 4px 12px;
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
`;

/**
 * ProductDetail Component - Full product detail view
 * 
 * @example
 * <ProductDetail
 *   product={productData}
 *   onContact={handleContact}
 *   onBuy={handleBuy}
 *   onSave={handleSave}
 *   isSaved={false}
 * />
 */
export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onContact,
  onBuy,
  onSave,
  isSaved = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saved, setSaved] = useState(isSaved);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(product.id);
  };

  const selectedImage = product.images[selectedImageIndex] || product.images[0] || '';

  return (
    <DetailContainer>
      {/* Image Gallery */}
      <GalleryContainer>
        <MainImageContainer>
          <MainImage src={selectedImage} alt={product.title} />
        </MainImageContainer>
        {product.images.length > 1 && (
          <ThumbnailGallery>
            {product.images.map((image, index) => (
              <Thumbnail
                key={index}
                isActive={index === selectedImageIndex}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img src={image} alt={`${product.title} ${index + 1}`} />
              </Thumbnail>
            ))}
          </ThumbnailGallery>
        )}
      </GalleryContainer>

      {/* Product Info */}
      <InfoContainer>
        <div>
          <Title>{product.title}</Title>
          <MetaInfo style={{ marginTop: '12px' }}>
            <MetaItem>
              <ConditionBadge condition={product.condition}>
                {product.condition}
              </ConditionBadge>
            </MetaItem>
          </MetaInfo>
        </div>

        <PriceContainer>
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="large"
          />
        </PriceContainer>

        <MetaInfo>
          <MetaItem>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <strong>Location:</strong> {product.location}
          </MetaItem>
          <MetaItem>
            <svg viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            </svg>
            <strong>Category:</strong> {product.category}
          </MetaItem>
          {product.partNumber && (
            <MetaItem>
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
              <strong>Part Number:</strong> {product.partNumber}
            </MetaItem>
          )}
          {product.manufacturer && (
            <MetaItem>
              <svg viewBox="0 0 24 24">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
              </svg>
              <strong>Manufacturer:</strong> {product.manufacturer}
            </MetaItem>
          )}
        </MetaInfo>

        {/* Description */}
        <DescriptionSection>
          <SectionTitle>Description</SectionTitle>
          <DescriptionText>{product.description}</DescriptionText>
        </DescriptionSection>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <SectionTitle>Specifications</SectionTitle>
            <SpecsGrid>
              {Object.entries(product.specifications).map(([key, value]) => (
                <SpecItem key={key}>
                  <SpecLabel>{key}</SpecLabel>
                  <SpecValue>{value}</SpecValue>
                </SpecItem>
              ))}
            </SpecsGrid>
          </div>
        )}

        {/* Seller Info */}
        <div>
          <SectionTitle>Seller Information</SectionTitle>
          <SellerCard>
            <SellerAvatar>
              {product.seller.avatar ? (
                <img src={product.seller.avatar} alt={product.seller.name} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill={theme.colors.neutral.darkGray}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </SellerAvatar>
            <SellerInfo>
              <SellerName>{product.seller.name}</SellerName>
              <SellerStats>
                {product.seller.rating && (
                  <span>⭐ {product.seller.rating.toFixed(1)}</span>
                )}
                {product.seller.responseRate && (
                  <span>• {product.seller.responseRate}% response rate</span>
                )}
                {product.seller.memberSince && (
                  <span>• Member since {product.seller.memberSince}</span>
                )}
              </SellerStats>
            </SellerInfo>
          </SellerCard>
        </div>

        {/* Action Buttons */}
        <ActionsContainer>
          <ButtonRow>
            <Button
              variant="primary"
              fullWidth
              onClick={() => onContact(product.seller.id)}
            >
              Contact Seller
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
            >
              {saved ? '❤️' : '🤍'}
            </Button>
          </ButtonRow>
          {onBuy && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onBuy(product.id)}
            >
              Buy Now
            </Button>
          )}
        </ActionsContainer>
      </InfoContainer>
    </DetailContainer>
  );
};

export default ProductDetail;