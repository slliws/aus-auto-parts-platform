import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Message list props
 */
export interface MessageListProps {
  /** Child components (typically ChatBubble components) */
  children: React.ReactNode;
  /** Whether to auto-scroll to bottom on new messages */
  autoScroll?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Whether there are more messages to load */
  hasMore?: boolean;
  /** Callback to load more messages */
  onLoadMore?: () => void;
}

/**
 * Scrollable container for messages
 */
const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${theme.colors.neutral.white};
  
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
 * Messages content wrapper
 */
const MessagesContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing.spacing16} 0;
  min-height: 100%;
`;

/**
 * Loading indicator
 */
const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.spacing16};
  color: ${theme.colors.neutral.darkGray};
  font-size: ${theme.typography.fontSizes.sm};
`;

/**
 * Load more trigger area
 */
const LoadMoreTrigger = styled.div`
  height: 1px;
  margin-top: ${theme.spacing.spacing8};
`;

/**
 * Empty state message
 */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
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
 * MessageList component with Facebook Messenger styling
 * 
 * @example
 * <MessageList autoScroll={true} isLoading={false}>
 *   <ChatBubble message="Hello" isOwn={false} />
 *   <ChatBubble message="Hi there!" isOwn={true} />
 * </MessageList>
 */
export const MessageList: React.FC<MessageListProps> = ({
  children,
  autoScroll = true,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current && !isFirstRender.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    isFirstRender.current = false;
  }, [children, autoScroll]);
  
  // Initial scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);
  
  // Intersection observer for loading more messages
  useEffect(() => {
    if (!hasMore || !onLoadMore || !loadMoreTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreTriggerRef.current);
    
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isLoading]);
  
  const hasChildren = React.Children.count(children) > 0;
  
  return (
    <ScrollContainer ref={scrollContainerRef}>
      {hasMore && (
        <LoadMoreTrigger ref={loadMoreTriggerRef} />
      )}
      
      {isLoading && (
        <LoadingIndicator>Loading messages...</LoadingIndicator>
      )}
      
      <MessagesContent>
        {hasChildren ? (
          children
        ) : (
          <EmptyState>
            <EmptyIcon />
            <div>No messages yet</div>
            <div style={{ fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.spacing8 }}>
              Start the conversation!
            </div>
          </EmptyState>
        )}
      </MessagesContent>
    </ScrollContainer>
  );
};

export default MessageList;