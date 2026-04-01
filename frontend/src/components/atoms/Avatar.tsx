import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/**
 * Avatar size options
 */
type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Online status options
 */
type StatusType = 'online' | 'offline' | 'away' | 'busy' | 'none';

/**
 * Avatar component props
 */
export interface AvatarProps {
  /** User name (for alt text and initials) */
  name: string;
  /** Optional avatar image source */
  imageSrc?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Online status indicator */
  status?: StatusType;
  /** Optional border around avatar */
  hasBorder?: boolean;
  /** Optional onClick handler */
  onClick?: () => void;
}

/**
 * Size mapping following Facebook Messenger avatar sizes
 */
const sizeMap = {
  small: '32px',
  medium: '40px',
  large: '56px',
  xlarge: '80px',
};

/**
 * Font size mapping for initials
 */
const fontSizeMap = {
  small: '14px',
  medium: '16px',
  large: '20px',
  xlarge: '28px',
};

/**
 * Status indicator size mapping
 */
const statusSizeMap = {
  small: '8px',
  medium: '10px',
  large: '12px',
  xlarge: '14px',
};

/**
 * Status indicator border width mapping
 */
const statusBorderWidthMap = {
  small: '1px',
  medium: '2px',
  large: '2px',
  xlarge: '3px',
};

/**
 * Status color mapping
 */
const statusColorMap = {
  online: theme.colors.facebook.secondary,  // Facebook's online green
  offline: theme.colors.neutral.mediumGray,
  away: theme.colors.facebook.marketplaceYellow,
  busy: theme.colors.facebook.tertiary,
  none: 'transparent',
};

/**
 * Styled avatar container
 */
const AvatarContainer = styled.div<{
  size: AvatarSize;
  hasBorder: boolean;
  clickable: boolean;
}>`
  position: relative;
  width: ${props => sizeMap[props.size]};
  height: ${props => sizeMap[props.size]};
  border-radius: 50%;
  overflow: hidden;
  background-color: ${theme.colors.neutral.lightGray};
  ${props => props.hasBorder && `
    border: 2px solid ${theme.colors.neutral.white};
    box-shadow: 0 1px 3px ${theme.colors.alpha.blackAlpha10};
  `}
  
  ${props => props.clickable && `
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.98);
    }
  `}
`;

/**
 * Styled image component
 */
const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/**
 * Initials container when no image is provided
 */
const Initials = styled.div<{ size: AvatarSize }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.typography.fontWeights.semiBold};
  font-size: ${props => fontSizeMap[props.size]};
  color: ${theme.colors.neutral.white};
  background: ${theme.colors.gradients.messengerGradient};
  text-transform: uppercase;
`;

/**
 * Status indicator
 */
const StatusIndicator = styled.div<{
  status: StatusType;
  size: AvatarSize;
}>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: ${props => statusSizeMap[props.size]};
  height: ${props => statusSizeMap[props.size]};
  border-radius: 50%;
  background-color: ${props => statusColorMap[props.status]};
  border: ${props => statusBorderWidthMap[props.size]} solid ${theme.colors.neutral.white};
  box-shadow: 0 0 0 1px ${theme.colors.alpha.blackAlpha5};
`;

/**
 * Get user initials from name
 * @param name User's full name
 * @returns Initials (max 2 characters)
 */
const getInitials = (name: string): string => {
  if (!name) return '';
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 1) {
    return parts[0].charAt(0);
  }
  
  // Get first letter of first and last parts
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
};

/**
 * Avatar component with Facebook Messenger styling
 * 
 * @example
 * <Avatar 
 *   name="John Smith" 
 *   size="medium" 
 *   status="online"
 *   imageSrc="path/to/avatar.jpg" 
 * />
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageSrc,
  size = 'medium',
  status = 'none',
  hasBorder = false,
  onClick,
}) => {
  const initials = getInitials(name);
  const isClickable = !!onClick;
  
  return (
    <AvatarContainer 
      size={size} 
      hasBorder={hasBorder}
      clickable={isClickable}
      onClick={onClick}
    >
      {imageSrc ? (
        <AvatarImage src={imageSrc} alt={name} />
      ) : (
        <Initials size={size}>{initials}</Initials>
      )}
      
      {status !== 'none' && (
        <StatusIndicator status={status} size={size} />
      )}
    </AvatarContainer>
  );
};

export default Avatar;