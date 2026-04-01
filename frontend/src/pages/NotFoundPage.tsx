import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import Button from '../components/atoms/Button';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
  text-align: center;
`;

const ErrorCode = styled.h1`
  font-size: 120px;
  font-weight: 700;
  color: #1877f2;
  margin: 0;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 80px;
  }
`;

const ErrorTitle = styled.h2`
  font-size: 32px;
  font-weight: 600;
  color: #050505;
  margin: 16px 0 8px 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ErrorMessage = styled.p`
  font-size: 17px;
  color: #65676b;
  margin: 0 0 32px 0;
  max-width: 500px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

const IllustrationBox = styled.div`
  width: 200px;
  height: 200px;
  background: #e4e6eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 80px;

  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
    font-size: 60px;
  }
`;

/**
 * NotFoundPage Component
 * Friendly 404 error page with navigation options
 */
const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <NotFoundContainer>
      <IllustrationBox>🔍</IllustrationBox>
      <ErrorCode>404</ErrorCode>
      <ErrorTitle>Page Not Found</ErrorTitle>
      <ErrorMessage>
        Sorry, the page you're looking for doesn't exist or has been moved.
        Try going back to the home page.
      </ErrorMessage>
      <ButtonGroup>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Home
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </ButtonGroup>
    </NotFoundContainer>
  );
};

export default NotFoundPage;