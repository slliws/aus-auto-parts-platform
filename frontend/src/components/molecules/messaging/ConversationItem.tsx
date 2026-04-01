import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { Avatar } from '../../atoms/Avatar';

/**
 * Conversation item props
 */
export interface ConversationItemProps {
  /** Conversation ID */
  id: string;
  /** Participant name */
  participantName: string;
  /** Participant avatar URL */
  participantAvatar?: string;
  /** Last message preview */
  lastMessage: string;
  /** Timestamp of last message */
  timestamp: string;
  /** Whether there are unread messages */
  hasUnread?: boolean;
  /** Number of unread messages */
  unreadCount?: number;
  /** Online status of participant */
  status?: 'online' | 'offline' | 'away' | 'busy' | 'none';
  /** Whether this conversation is currently selected */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Container for conversation item
 */
const ConversationContainer = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.spacing12} ${theme.spacing.spacing16};
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.isActive 
    ? theme.colors.alpha.primaryAlpha10 
    : 'transparent'};
  border-radius: 8px;
  
  &:hover {
    background-color: ${props => props.isActive 
      ? theme.colors.alpha.primaryAlpha10 
      : theme.colors.neutral.background};
  }
  
  &:active {
    background-color: ${theme.colors.alpha.primaryAlpha20};
  }
`;

/**
 * Content area (name, message, timestamp)
 */
const ContentArea = styled.div`
  flex: 1;
  margin-left: ${theme.spacing.spacing12};
  min-width: 0; /* Allows text truncation */
`;

/**
 * Header row with name and timestamp
 */
const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.spacing4};
`;

/**
 * Participant name
 */
const ParticipantName = styled.div<{ hasUnread: boolean }>`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${props => props.hasUnread 
    ? theme.typography.fontWeights.semiBold 
    : theme.typography.fontWeights.regular};
  color: ${theme.colors.neutral.black};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Timestamp text
 */
const Timestamp = styled.div<{ hasUnread: boolean }>`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${props => props.hasUnread 
    ? theme.colors.facebook.primary 
    : theme.colors.neutral.darkGray};
  font-weight: ${props => props.hasUnread 
    ? theme.typography.fontWeights.semiBold 
    : theme.typography.fontWeights.regular};
  white-space: nowrap;
  margin-left: ${theme.spacing.spacing8};
`;

/**
 * Last message preview
 */
const MessagePreview = styled.div<{ hasUnread: boolean }>`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${props => props.hasUnread 
    ? theme.colors.neutral.black 
    : theme.colors.neutral.darkGray};
  font-weight: ${props => props.hasUnread 
    ? theme.typography.fontWeights.semiBold 
    : theme.typography.fontWeights.regular};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.spacing8};
`;

/**
 * Unread badge
 */
const UnreadBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: ${theme.colors.facebook.primary};
  color: ${theme.colors.neutral.white};
  border-radius: 10px;
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  flex-shrink: 0;
`;

/**
 * ConversationItem component with Facebook Messenger styling
 * 
 * @example
 * <ConversationItem
 *   id="conv-1"
 *   participantName="John Smith"
 *   lastMessage="Hey, how are you?"
 *   timestamp="2m"
 *   hasUnread={true}
 *   unreadCount={3}
 *   status="online"
 *   onClick={() => handleSelectConversation('conv-1')}
 * />
 */
export const ConversationItem: React.FC<ConversationItemProps> = ({
  id,
  participantName,
  participantAvatar,
  lastMessage,
  timestamp,
  hasUnread = false,
  unreadCount = 0,
  status = 'none',
  isActive = false,
  onClick,
}) => {
  return (
    <ConversationContainer isActive={isActive} onClick={onClick}>
      <Avatar
        name={participantName}
        imageSrc={participantAvatar}
        size="large"
        status={status}
      />
      
      <ContentArea>
        <HeaderRow>
          <ParticipantName hasUnread={hasUnread}>
            {participantName}
          </ParticipantName>
          <Timestamp hasUnread={hasUnread}>
            {timestamp}
          </Timestamp>
        </HeaderRow>
        
        <MessagePreview hasUnread={hasUnread}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lastMessage}
          </span>
          {hasUnread && unreadCount > 0 && (
            <UnreadBadge>{unreadCount}</UnreadBadge>
          )}
        </MessagePreview>
      </ContentArea>
    </ConversationContainer>
  );
};

export default ConversationItem;