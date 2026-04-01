import styled from '@emotion/styled';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../components/templates/PageContainer';
import ProductDetail from '../components/organisms/marketplace/ProductDetail';
import Button from '../components/atoms/Button';

const DetailContainer = styled.div`
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const BackButton = styled.div`
  margin-bottom: 16px;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #65676b;
  margin-bottom: 16px;

  a {
    color: #1877f2;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  span {
    color: #65676b;
  }
`;

/**
 * ProductDetailPage Component
 * Individual product detail view with breadcrumb navigation
 */
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <PageContainer>
      <DetailContainer>
        <BackButton>
          <Button variant="text" onClick={handleBack}>
            ← Back
          </Button>
        </BackButton>

        <Breadcrumbs>
          <a onClick={() => navigate('/')}>Home</a>
          <span>/</span>
          <a onClick={() => navigate('/marketplace')}>Marketplace</a>
          <span>/</span>
          <span>Product Details</span>
        </Breadcrumbs>

        <ProductDetail productId={id} />
      </DetailContainer>
    </PageContainer>
  );
};

export default ProductDetailPage;