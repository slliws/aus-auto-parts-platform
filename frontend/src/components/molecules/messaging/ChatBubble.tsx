import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { theme } from '../../../styles/theme';

/**
 * Chat bubble props
 */
export interface ChatBubbleProps {
  /** Message ID */
  id: string;
  /** Message text content */
  message: string;
  /** Timestamp of the message */
  timestamp: string;
  /** Whether this message is from the current user */
  isOwn: boolean;
  /** Sender's name (for received messages) */
  senderName?: string;
  /** Whether to show the timestamp */
  showTimestamp?: boolean;
  /** Whether this is the first message in a group */
  isFirstInGroup?: boolean;
  /** Whether this is the last message in a group */
  isLastInGroup?: boolean;
}

/**
 * Container for chat bubble
 */
const BubbleContainer = styled.div<{ isOwn: boolean; isLastInGroup: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: ${props => props.isLastInGroup ? theme.spacing.spacing12 : theme.spacing.spacing2};
  padding: 0 ${theme.spacing.spacing16};
`;

/**
 * Message bubble styling
 */
const Bubble = styled.div<{ isOwn: boolean; isFirstInGroup: boolean; isLastInGroup: boolean }>`
  max-width: 60%;
  padding: ${theme.spacing.spacing8} ${theme.spacing.spacing12};
  border-radius: 18px;
  word-wrap: break-word;
  word-break: break-word;
  position: relative;
  
  ${props => props.isOwn ? css`
    background: ${theme.colors.gradients.messengerGradient};
    color: ${theme.colors.neutral.white};
    
    /* Rounded corners based on position in group */
    ${!props.isFirstInGroup && css`
      border-top-right-radius: 4px;
    `}
    ${!props.isLastInGroup && css`
      border-bottom-right-radius: 4px;
    `}
  ` : css`
    background-color: ${theme.colors.facebook.messengerGrey};
    color: ${theme.colors.neutral.black};
    
    /* Rounded corners based on position in group */
    ${!props.isFirstInGroup && css`
      border-top-left-radius: 4px;
    `}
    ${!props.isLastInGroup && css`
      border-bottom-left-radius: 4px;
    `}
  `}
`;

/**
 * Message text
 */
const MessageText = styled.div`
  font-size: ${theme.typography.fontSizes.md};
  line-height: 1.4;
  white-space: pre-wrap;
`;

/**
 * Sender name (for received messages)
 */
const SenderName = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
  margin-bottom: ${theme.spacing.spacing4};
  padding-left: ${theme.spacing.spacing4};
  font-weight: ${theme.typography.fontWeights.semiBold};
`;

/**
 * Timestamp text
 */
const TimestampText = styled.div<{ isOwn: boolean }>`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
  margin-top: ${theme.spacing.spacing4};
  padding: 0 ${theme.spacing.spacing4};
  text-align: ${props => props.isOwn ? 'right' : 'left'};
`;

/**
 * ChatBubble component with Facebook Messenger styling
 * 
 * @example
 * <ChatBubble
 *   id="msg-1"
 *   message="Hey, how are you?"
 *   timestamp="2:30 PM"
 *   isOwn={false}
 *   senderName="John Smith"
 *   showTimestamp={true}
 *   isFirstInGroup={true}
 *   isLastInGroup={true}
 * />
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  id,
  message,
  timestamp,
  isOwn,
  senderName,
  showTimestamp = false,
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  return (
    <BubbleContainer isOwn={isOwn} isLastInGroup={isLastInGroup}>
      {!isOwn && isFirstInGroup && senderName && (
        <SenderName>{senderName}</SenderName>
      )}
      
      <Bubble 
        isOwn={isOwn}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
      >
        <MessageText>{message}</MessageText>
      </Bubble>
      
      {showTimestamp && (
        <TimestampText isOwn={isOwn}>{timestamp}</TimestampText>
      )}
    </BubbleContainer>
  );
};

export default ChatBubble;