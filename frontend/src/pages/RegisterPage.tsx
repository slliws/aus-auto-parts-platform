import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';
import Button from '../components/atoms/Button';
import { CircularProgress } from '@mui/material';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
`;

const RegisterCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;

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

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
`;

const TermsText = styled.p`
  font-size: 12px;
  color: #65676b;
  text-align: center;
  margin: 8px 0;

  a {
    color: #1877f2;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginSection = styled.div`
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dadde1;

  p {
    font-size: 15px;
    color: #65676b;
    margin: 0 0 12px 0;
  }

  a {
    color: #1877f2;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

/**
 * RegisterPage Component
 * Facebook-style registration page with form validation
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantId: '1' // Default tenant ID, adjust if needed
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // Call the register action
      await dispatch(register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        tenantId: formData.tenantId
      })).unwrap();
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '8px',
            zIndex: 10
          }}>
            <CircularProgress />
          </div>
        )}
        <Logo>
          <h1>Sign Up</h1>
          <p>Create your account to get started</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <NameRow>
            <Input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
            <Input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </NameRow>

          <Input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>Account created! Redirecting to login...</SuccessMessage>}

          <TermsText>
            By clicking Sign Up, you agree to our{' '}
            <a href="/terms">Terms</a> and{' '}
            <a href="/privacy">Privacy Policy</a>
          </TermsText>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || success}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </Form>

        <LoginSection>
          <p>Already have an account?</p>
          <Link to="/login">Log In</Link>
        </LoginSection>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;