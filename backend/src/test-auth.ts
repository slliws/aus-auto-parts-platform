import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';

/**
 * Authentication Endpoints Test Script
 * Tests all authentication endpoints for the Australian Auto Parts platform
 * Run with: npx ts-node test-auth.ts
 */

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_USERS = {
  admin: {
    email: 'admin@aussieautoparts.com.au',
    password: 'Password123!'
  },
  manager: {
    email: 'manager@aussieautoparts.com.au',
    password: 'Password123!'
  },
  sales: {
    email: 'sales@aussieautoparts.com.au',
    password: 'Password123!'
  }
};

// Test registration data
const TEST_REGISTER_USER = {
  email: `test-user-${Date.now()}@test.com`,
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User',
  tenantId: '1' // Default tenant ID, adjust if needed
};

// Storage for tokens
let accessToken: string = '';
let refreshToken: string = '';
let resetToken: string = '';
let verificationToken: string = '';

// Create API client
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to set auth header
const setAuthHeader = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper function to clear auth header
const clearAuthHeader = () => {
  delete api.defaults.headers.common['Authorization'];
};

// Helper function to log test results
const logResult = (testName: string, success: boolean, message?: string, error?: any) => {
  const statusText = success ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
  console.log(`${statusText} ${testName}`);
  
  if (message) {
    console.log(`  ${message}`);
  }
  
  if (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      console.log(chalk.red(`  Error: ${axiosError.message}`));
      if (axiosError.response) {
        console.log(chalk.red(`  Status: ${axiosError.response.status}`));
        console.log(chalk.red(`  Response: ${JSON.stringify(axiosError.response.data, null, 2)}`));
      }
    } else {
      console.log(chalk.red(`  Error: ${error.message || error}`));
    }
  }
  
  console.log(''); // Empty line for spacing
};

/**
 * Test Functions
 */

// Test login with valid credentials
const testValidLogin = async (): Promise<boolean> => {
  try {
    const response = await api.post('/auth/login', TEST_USERS.admin);
    
    if (response.data.success && response.data.data) {
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      
      // Set token for subsequent tests
      setAuthHeader(accessToken);
      
      logResult('Login with valid credentials', true, `User ${TEST_USERS.admin.email} logged in successfully`);
      return true;
    } else {
      logResult('Login with valid credentials', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Login with valid credentials', false, undefined, error);
    return false;
  }
};

// Test login with invalid credentials
const testInvalidLogin = async (): Promise<boolean> => {
  try {
    await api.post('/auth/login', {
      email: 'invalid@email.com',
      password: 'WrongPassword123'
    });
    
    // If we get here, the login succeeded unexpectedly
    logResult('Login with invalid credentials', false, 'Login succeeded with invalid credentials');
    return false;
  } catch (error) {
    // Expected behavior: login should fail
    logResult('Login with invalid credentials', true, 'Server correctly rejected invalid credentials');
    return true;
  }
};

// Test token refresh
const testTokenRefresh = async (): Promise<boolean> => {
  try {
    if (!refreshToken) {
      logResult('Token refresh', false, 'No refresh token available');
      return false;
    }
    
    const response = await api.post('/auth/refresh', { refreshToken });
    
    if (response.data.success && response.data.data) {
      // Update access token
      accessToken = response.data.data.accessToken;
      
      // Update token for subsequent tests if a new refresh token was issued
      if (response.data.data.refreshToken) {
        refreshToken = response.data.data.refreshToken;
      }
      
      // Update auth header
      setAuthHeader(accessToken);
      
      logResult('Token refresh', true, 'Access token refreshed successfully');
      return true;
    } else {
      logResult('Token refresh', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Token refresh', false, undefined, error);
    return false;
  }
};

// Test user registration
const testRegistration = async (): Promise<boolean> => {
  try {
    // Clear auth header for registration (public endpoint)
    clearAuthHeader();
    
    const response = await api.post('/auth/register', TEST_REGISTER_USER);
    
    if (response.data.success && response.data.data) {
      verificationToken = response.data.data.verificationToken;
      
      logResult('User registration', true, `User ${TEST_REGISTER_USER.email} registered successfully`);
      return true;
    } else {
      logResult('User registration', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('User registration', false, undefined, error);
    return false;
  }
};

// Test email verification
const testEmailVerification = async (): Promise<boolean> => {
  try {
    if (!verificationToken) {
      logResult('Email verification', false, 'No verification token available');
      return false;
    }
    
    // Clear auth header for verification (public endpoint)
    clearAuthHeader();
    
    const response = await api.post('/auth/verify-email', { token: verificationToken });
    
    if (response.data.success) {
      logResult('Email verification', true, 'Email verified successfully');
      return true;
    } else {
      logResult('Email verification', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Email verification', false, undefined, error);
    return false;
  }
};

// Test password reset request
const testPasswordResetRequest = async (): Promise<boolean> => {
  try {
    // Clear auth header for password reset (public endpoint)
    clearAuthHeader();
    
    // Use the admin email to request password reset
    const response = await api.post('/auth/forgot-password', { email: TEST_USERS.admin.email });
    
    if (response.data.success && response.data.data) {
      resetToken = response.data.data.resetToken;
      
      logResult('Password reset request', true, 'Password reset token generated successfully');
      return true;
    } else {
      logResult('Password reset request', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Password reset request', false, undefined, error);
    return false;
  }
};

// Test password reset
const testPasswordReset = async (): Promise<boolean> => {
  try {
    if (!resetToken) {
      logResult('Password reset', false, 'No reset token available');
      return false;
    }
    
    // Clear auth header for password reset (public endpoint)
    clearAuthHeader();
    
    // Set a new password (same as original for test purposes)
    const response = await api.post('/auth/reset-password', {
      token: resetToken,
      newPassword: TEST_USERS.admin.password
    });
    
    if (response.data.success) {
      logResult('Password reset', true, 'Password reset successfully');
      return true;
    } else {
      logResult('Password reset', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Password reset', false, undefined, error);
    return false;
  }
};

// Test get current user
const testGetCurrentUser = async (): Promise<boolean> => {
  try {
    // Ensure auth header is set
    setAuthHeader(accessToken);
    
    const response = await api.get('/auth/me');
    
    if (response.data.success && response.data.data) {
      const userData = response.data.data.user;
      
      logResult('Get current user', true, `Retrieved user data for ${userData.email}`);
      return true;
    } else {
      logResult('Get current user', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Get current user', false, undefined, error);
    return false;
  }
};

// Test logout
const testLogout = async (): Promise<boolean> => {
  try {
    if (!refreshToken) {
      logResult('Logout', false, 'No refresh token available');
      return false;
    }
    
    // Ensure auth header is set
    setAuthHeader(accessToken);
    
    const response = await api.post('/auth/logout', { refreshToken });
    
    if (response.data.success) {
      // Clear tokens
      accessToken = '';
      refreshToken = '';
      clearAuthHeader();
      
      logResult('Logout', true, 'User logged out successfully');
      return true;
    } else {
      logResult('Logout', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logResult('Logout', false, undefined, error);
    return false;
  }
};

/**
 * Run Tests
 */
const runTests = async () => {
  console.log(chalk.blue('=== Australian Auto Parts Authentication Tests ==='));
  console.log(chalk.blue(`API URL: ${API_URL}`));
  console.log(chalk.blue('=================================================\n'));

  try {
    // Run login test first to get tokens
    await testValidLogin();
    
    // Test invalid login scenario
    await testInvalidLogin();
    
    // Test refreshing token
    await testTokenRefresh();
    
    // Test get current user
    await testGetCurrentUser();
    
    // Test password reset
    await testPasswordResetRequest();
    await testPasswordReset();
    
    // Test registration
    await testRegistration();
    await testEmailVerification();
    
    // Test logout last
    await testLogout();
    
    console.log(chalk.green('\nAuth testing completed!'));
  } catch (error) {
    console.error(chalk.red('Error running tests:'), error);
  }
};

// Run all tests
runTests();