import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { ConversationItem, ConversationItemProps } from '../../molecules/messaging/ConversationItem';

/**
 * Conversations list props
 */
export interface ConversationsListProps {
  /** Array of conversations */
  conversations: ConversationItemProps[];
  /** ID of the active conversation */
  activeConversationId?: string;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

/**
 * Container for conversations list
 */
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${theme.colors.neutral.white};
  overflow: hidden;
`;

/**
 * Header section
 */
const Header = styled.div`
  padding: ${theme.spacing.spacing16};
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
`;

/**
 * Title
 */
const Title = styled.h2`
  font-size: ${theme.typography.fontSizes.xl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0;
`;

/**
 * Scrollable conversations area
 */
const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${theme.spacing.spacing8};
  
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.neutral.mediumGray} transparent;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.neutral.mediumGray};
    border-radius: 4px;
    
    &:hover {
      background-color: ${theme.colors.neutral.darkGray};
    }
  }
`;

/**
 * Loading state
 */
const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.spacing32};
  color: ${theme.colors.neutral.darkGray};
  font-size: ${theme.typography.fontSizes.md};
`;

/**
 * Error state
 */
const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.spacing32};
  color: ${theme.colors.semantic.error};
  text-align: center;
`;

/**
 * Empty state
 */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.spacing32};
  color: ${theme.colors.neutral.darkGray};
  text-align: center;
  
  svg {
    width: 64px;
    height: 64px;
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
 * ConversationsList component with Facebook Messenger styling
 * 
 * @example
 * <ConversationsList
 *   conversations={conversations}
 *   activeConversationId="conv-1"
 *   onSelectConversation={(id) => handleSelect(id)}
 * />
 */
export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <ListContainer>
        <Header>
          <Title>Messages</Title>
        </Header>
        <LoadingState>Loading conversations...</LoadingState>
      </ListContainer>
    );
  }
  
  if (error) {
    return (
      <ListContainer>
        <Header>
          <Title>Messages</Title>
        </Header>
        <ErrorState>
          <div style={{ fontWeight: theme.typography.fontWeights.semiBold, marginBottom: theme.spacing.spacing8 }}>
            Error loading conversations
          </div>
          <div style={{ fontSize: theme.typography.fontSizes.sm }}>
            {error}
          </div>
        </ErrorState>
      </ListContainer>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <ListContainer>
        <Header>
          <Title>Messages</Title>
        </Header>
        <EmptyState>
          <EmptyIcon />
          <div>No conversations yet</div>
          <div style={{ fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.spacing8 }}>
            Start a new conversation
          </div>
        </EmptyState>
      </ListContainer>
    );
  }
  
  return (
    <ListContainer>
      <Header>
        <Title>Messages</Title>
      </Header>
      
      <ScrollArea>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            {...conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
      </ScrollArea>
    </ListContainer>
  );
};

export default ConversationsList;