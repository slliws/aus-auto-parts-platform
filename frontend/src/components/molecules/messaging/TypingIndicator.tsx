import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../../../styles/theme';

/**
 * Typing indicator props
 */
export interface TypingIndicatorProps {
  /** Name of the person typing */
  userName?: string;
  /** Whether to show the indicator */
  isVisible?: boolean;
}

/**
 * Bounce animation for typing dots
 */
const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
`;

/**
 * Container for typing indicator
 */
const IndicatorContainer = styled.div<{ isVisible: boolean }>`
  display: ${props => props.isVisible ? 'flex' : 'none'};
  flex-direction: column;
  align-items: flex-start;
  padding: 0 ${theme.spacing.spacing16};
  margin-bottom: ${theme.spacing.spacing8};
`;

/**
 * Typing text (e.g., "John is typing...")
 */
const TypingText = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
  margin-bottom: ${theme.spacing.spacing4};
  font-style: italic;
`;

/**
 * Bubble container for animated dots
 */
const DotsBubble = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: ${theme.spacing.spacing8} ${theme.spacing.spacing12};
  background-color: ${theme.colors.facebook.messengerGrey};
  border-radius: 18px;
  height: 40px;
`;

/**
 * Individual animated dot
 */
const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${theme.colors.neutral.darkGray};
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
`;

/**
 * TypingIndicator component with Facebook Messenger styling
 * 
 * @example
 * <TypingIndicator
 *   userName="John Smith"
 *   isVisible={true}
 * />
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  isVisible = false,
}) => {
  return (
    <IndicatorContainer isVisible={isVisible}>
      {userName && (
        <TypingText>{userName} is typing...</TypingText>
      )}
      <DotsBubble>
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </DotsBubble>
    </IndicatorContainer>
  );
};

export default TypingIndicator;