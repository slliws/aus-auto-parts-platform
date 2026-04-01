import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Button variants based on Facebook UI patterns
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

/**
 * Button size options
 */
type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is full width */
  fullWidth?: boolean;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Button styling variants
 */
const getButtonVariants = (theme: any) => ({
  primary: css`
    background-color: ${theme.colors.facebook.primary};
    color: ${theme.colors.neutral.white};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.facebook.primary}e6; /* 90% opacity */
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    
    &:active:not(:disabled) {
      background-color: ${theme.colors.facebook.primary}cc; /* 80% opacity */
    }
  `,
  
  secondary: css`
    background-color: ${theme.colors.facebook.secondary};
    color: ${theme.colors.neutral.white};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.facebook.secondary}e6; /* 90% opacity */
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    
    &:active:not(:disabled) {
      background-color: ${theme.colors.facebook.secondary}cc; /* 80% opacity */
    }
  `,
  
  outline: css`
    background-color: transparent;
    color: ${theme.colors.facebook.primary};
    border: 1px solid ${theme.colors.facebook.primary};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.alpha.primaryAlpha10};
    }
    
    &:active:not(:disabled) {
      background-color: ${theme.colors.alpha.primaryAlpha20};
    }
  `,
  
  text: css`
    background-color: transparent;
    color: ${theme.colors.facebook.primary};
    padding: 8px 12px;
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.alpha.primaryAlpha10};
      text-decoration: none;
    }
    
    &:active:not(:disabled) {
      background-color: ${theme.colors.alpha.primaryAlpha20};
    }
  `,
});

/**
 * Button size variants
 */
const getButtonSizes = (theme: any) => ({
  small: css`
    padding: 4px 8px;
    font-size: ${theme.typography.fontSizes.sm};
    border-radius: 4px;
    height: 32px;
  `,
  
  medium: css`
    padding: 8px 16px;
    font-size: ${theme.typography.fontSizes.md};
    border-radius: 6px;
    height: 36px;
  `,
  
  large: css`
    padding: 10px 20px;
    font-size: ${theme.typography.fontSizes.lg};
    border-radius: 6px;
    height: 40px;
  `,
});

/**
 * Styled button component with Facebook Messenger styling
 */
const StyledButton = styled.button<ButtonProps>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${(props: any) => props.theme.typography.fontFamilies.primary};
  font-weight: ${(props: any) => props.theme.typography.fontWeights.semiBold};
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s;
  white-space: nowrap;
  line-height: 1;
  
  /* Apply variant styles */
  ${(props: any) => getButtonVariants(props.theme)[props.variant || 'primary']}
  
  /* Apply size styles */
  ${(props: any) => getButtonSizes(props.theme)[props.size || 'medium']}
  
  /* Full width modifier */
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  /* Disabled state */
  &:disabled {
    background-color: ${(props: any) => props.theme.colors.neutral.lightGray};
    color: ${(props: any) => props.theme.colors.neutral.mediumGray};
    cursor: not-allowed;
    box-shadow: none;
  }
  
  /* Focus state */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props: any) => props.theme.colors.alpha.primaryAlpha20};
  }
`;

/**
 * Button component with Facebook UI styling
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click Me
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;