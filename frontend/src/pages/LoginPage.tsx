import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';
import Button from '../components/atoms/Button';
import { setRememberMe, getRememberMe } from '../utils/auth';
import { CircularProgress } from '@mui/material';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 24px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1877f2;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    color: #65676b;
    margin: 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid #dddfe2;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #1877f2;
  }

  &::placeholder {
    color: #8a8d91;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebe9;
  color: #c41e3a;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
`;

const LinksSection = styled.div`
  text-align: center;
  margin-top: 16px;

  a {
    color: #1877f2;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  border-top: 1px solid #dadde1;
  margin: 20px 0;
`;

const RegisterSection = styled.div`
  text-align: center;
  padding-top: 20px;
`;

/**
 * LoginPage Component
 * Facebook-style login page with form validation
 */
const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 8px;
  
  label {
    margin-left: 8px;
    font-size: 14px;
    color: #65676b;
    cursor: pointer;
  }
  
  input[type="checkbox"] {
    cursor: pointer;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
`;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(getRememberMe());
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || '/';

  // Update remember me in local storage when it changes
  useEffect(() => {
    setRememberMe(remember);
  }, [remember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Include tenantId if using multi-tenant setup
      await dispatch(login({
        email,
        password,
        // tenantId: '1' // Uncomment if using multi-tenant
      })).unwrap();
      
      // Navigate to intended destination after successful login
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by Redux state
      setSubmitting(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard style={{ position: 'relative' }}>
        {(submitting || loading === 'pending') && (
          <LoadingOverlay>
            <CircularProgress />
          </LoadingOverlay>
        )}
        <Logo>
          <h1>Auto Parts</h1>
          <p>Australian Auto Parts Marketplace</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <RememberMeContainer>
            <input
              type="checkbox"
              id="remember-me"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember-me">Remember me</label>
          </RememberMeContainer>

          <Button
            type="submit"
            variant="primary"
            disabled={loading === 'pending' || submitting}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading === 'pending' || submitting ? 'Logging in...' : 'Log In'}
          </Button>

          <LinksSection>
            <Link to="/forgot-password">Forgot password?</Link>
          </LinksSection>
        </Form>

        <Divider />

        <RegisterSection>
          <Link to="/register">
            <Button variant="secondary">Create New Account</Button>
          </Link>
        </RegisterSection>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;