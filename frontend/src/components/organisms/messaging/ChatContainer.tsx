import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { ConversationsList } from './ConversationsList';
import { MessageThread, Message } from './MessageThread';
import { MessageInput } from '../../molecules/messaging/MessageInput';
import { Avatar } from '../../atoms/Avatar';
import { ConversationItemProps } from '../../molecules/messaging/ConversationItem';

/**
 * Chat container props
 */
export interface ChatContainerProps {
  /** Array of conversations */
  conversations: ConversationItemProps[];
  /** ID of the active conversation */
  activeConversationId?: string;
  /** Messages for the active conversation */
  messages: Message[];
  /** Current user ID */
  currentUserId: string;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Callback when a message is sent */
  onSendMessage: (message: string) => void;
  /** Loading state for conversations */
  isLoadingConversations?: boolean;
  /** Loading state for messages */
  isLoadingMessages?: boolean;
  /** Error message for conversations */
  conversationsError?: string | null;
  /** Whether someone is typing */
  isTyping?: boolean;
  /** Name of person typing */
  typingUserName?: string;
  /** Whether there are more messages to load */
  hasMoreMessages?: boolean;
  /** Callback to load more messages */
  onLoadMoreMessages?: () => void;
}

/**
 * Main container with two-column layout
 */
const Container = styled.div`
  display: flex;
  height: 100%;
  background-color: ${theme.colors.neutral.white};
  overflow: hidden;
`;

/**
 * Left column for conversations list
 */
const ConversationsColumn = styled.div`
  width: 360px;
  border-right: 1px solid ${theme.colors.neutral.lightGray};
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 100%;
    display: ${(props: { hideOnMobile: boolean }) => props.hideOnMobile ? 'none' : 'flex'};
  }
`;

/**
 * Right column for active chat
 */
const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: ${(props: { hideOnMobile: boolean }) => props.hideOnMobile ? 'none' : 'flex'};
  }
`;

/**
 * Chat header with participant info
 */
const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.spacing12} ${theme.spacing.spacing16};
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
  background-color: ${theme.colors.neutral.white};
  gap: ${theme.spacing.spacing12};
`;

/**
 * Back button for mobile
 */
const BackButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: ${theme.colors.neutral.black};
  
  &:hover {
    background-color: ${theme.colors.neutral.lightGray};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: flex;
  }
`;

/**
 * Participant info in header
 */
const ParticipantInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ParticipantName = styled.div`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.semiBold};
  color: ${theme.colors.neutral.black};
`;

const ParticipantStatus = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Empty state when no conversation is selected
 */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${theme.colors.neutral.darkGray};
  text-align: center;
  padding: ${theme.spacing.spacing32};
  
  svg {
    width: 80px;
    height: 80px;
    margin-bottom: ${theme.spacing.spacing16};
    opacity: 0.5;
  }
`;

/**
 * Empty state icon
 */
const EmptyIcon: React.FC = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

/**
 * Back arrow icon
 */
const BackIcon: React.FC = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);

/**
 * ChatContainer component with Facebook Messenger styling
 * 
 * @example
 * <ChatContainer
 *   conversations={conversations}
 *   activeConversationId="conv-1"
 *   messages={messages}
 *   currentUserId="user-1"
 *   onSelectConversation={(id) => handleSelect(id)}
 *   onSendMessage={(msg) => handleSend(msg)}
 * />
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({
  conversations,
  activeConversationId,
  messages,
  currentUserId,
  onSelectConversation,
  onSendMessage,
  isLoadingConversations = false,
  isLoadingMessages = false,
  conversationsError = null,
  isTyping = false,
  typingUserName,
  hasMoreMessages = false,
  onLoadMoreMessages,
}) => {
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const hasActiveConversation = !!activeConversation;
  
  const handleBackToList = () => {
    // On mobile, going back means deselecting the conversation
    onSelectConversation('');
  };
  
  return (
    <Container>
      <ConversationsColumn hideOnMobile={hasActiveConversation}>
        <ConversationsList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
          isLoading={isLoadingConversations}
          error={conversationsError}
        />
      </ConversationsColumn>
      
      <ChatColumn hideOnMobile={!hasActiveConversation}>
        {hasActiveConversation ? (
          <>
            <ChatHeader>
              <BackButton onClick={handleBackToList}>
                <BackIcon />
              </BackButton>
              
              <Avatar
                name={activeConversation.participantName}
                imageSrc={activeConversation.participantAvatar}
                size="medium"
                status={activeConversation.status}
              />
              
              <ParticipantInfo>
                <ParticipantName>
                  {activeConversation.participantName}
                </ParticipantName>
                <ParticipantStatus>
                  {activeConversation.status === 'online' ? 'Active now' : 'Offline'}
                </ParticipantStatus>
              </ParticipantInfo>
            </ChatHeader>
            
            <MessageThread
              messages={messages}
              currentUserId={currentUserId}
              isTyping={isTyping}
              typingUserName={typingUserName}
              isLoading={isLoadingMessages}
              hasMore={hasMoreMessages}
              onLoadMore={onLoadMoreMessages}
            />
            
            <MessageInput
              onSend={onSendMessage}
              placeholder="Type a message..."
              disabled={isLoadingMessages}
            />
          </>
        ) : (
          <EmptyState>
            <EmptyIcon />
            <div style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.semiBold, marginBottom: theme.spacing.spacing8 }}>
              Select a conversation
            </div>
            <div style={{ fontSize: theme.typography.fontSizes.sm }}>
              Choose a conversation from the list to start messaging
            </div>
          </EmptyState>
        )}
      </ChatColumn>
    </Container>
  );
};

export default ChatContainer;