import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { MessageList } from '../../molecules/messaging/MessageList';
import { ChatBubble, ChatBubbleProps } from '../../molecules/messaging/ChatBubble';
import { TypingIndicator } from '../../molecules/messaging/TypingIndicator';

/**
 * Message data structure
 */
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  createdAt: string;
}

/**
 * Message thread props
 */
export interface MessageThreadProps {
  /** Array of messages */
  messages: Message[];
  /** Current user ID */
  currentUserId: string;
  /** Whether someone is typing */
  isTyping?: boolean;
  /** Name of person typing */
  typingUserName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Whether there are more messages to load */
  hasMore?: boolean;
  /** Callback to load more messages */
  onLoadMore?: () => void;
}

/**
 * Container for message thread
 */
const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${theme.colors.neutral.white};
`;

/**
 * Date separator
 */
const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.spacing16} 0;
  margin: ${theme.spacing.spacing8} 0;
`;

const DateLabel = styled.div`
  padding: ${theme.spacing.spacing4} ${theme.spacing.spacing12};
  background-color: ${theme.colors.neutral.lightGray};
  color: ${theme.colors.neutral.darkGray};
  border-radius: 12px;
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.semiBold};
  text-transform: uppercase;
`;

/**
 * Group messages by sender and time proximity
 */
const groupMessages = (messages: Message[]): Array<Message[]> => {
  if (messages.length === 0) return [];
  
  const groups: Array<Message[]> = [];
  let currentGroup: Message[] = [messages[0]];
  
  for (let i = 1; i < messages.length; i++) {
    const current = messages[i];
    const previous = messages[i - 1];
    
    // Group messages from same sender within 1 minute of each other
    const timeDiff = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
    const sameGroupThreshold = 60000; // 1 minute in milliseconds
    
    if (current.senderId === previous.senderId && timeDiff < sameGroupThreshold) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  groups.push(currentGroup);
  return groups;
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (isYesterday) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
};

/**
 * Format date separator
 */
const formatDateSeparator = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
};

/**
 * Check if date separator is needed between messages
 */
const needsDateSeparator = (current: Message, previous: Message | null): boolean => {
  if (!previous) return true;
  
  const currentDate = new Date(current.createdAt).toDateString();
  const previousDate = new Date(previous.createdAt).toDateString();
  
  return currentDate !== previousDate;
};

/**
 * MessageThread component with Facebook Messenger styling
 * 
 * @example
 * <MessageThread
 *   messages={messages}
 *   currentUserId="user-1"
 *   isTyping={true}
 *   typingUserName="John Smith"
 * />
 */
export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  currentUserId,
  isTyping = false,
  typingUserName,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}) => {
  // Group messages for proper bubble styling
  const messageGroups = useMemo(() => groupMessages(messages), [messages]);
  
  return (
    <ThreadContainer>
      <MessageList
        autoScroll={true}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      >
        {messageGroups.map((group, groupIndex) => {
          const isFirstGroup = groupIndex === 0;
          const previousGroup = groupIndex > 0 ? messageGroups[groupIndex - 1] : null;
          const showDateSeparator = needsDateSeparator(
            group[0],
            previousGroup ? previousGroup[previousGroup.length - 1] : null
          );
          
          return (
            <React.Fragment key={`group-${group[0].id}`}>
              {showDateSeparator && (
                <DateSeparator>
                  <DateLabel>{formatDateSeparator(group[0].createdAt)}</DateLabel>
                </DateSeparator>
              )}
              
              {group.map((message, messageIndex) => {
                const isOwn = message.senderId === currentUserId;
                const isFirstInGroup = messageIndex === 0;
                const isLastInGroup = messageIndex === group.length - 1;
                const showTimestamp = isLastInGroup;
                
                return (
                  <ChatBubble
                    key={message.id}
                    id={message.id}
                    message={message.content}
                    timestamp={formatTimestamp(message.createdAt)}
                    isOwn={isOwn}
                    senderName={!isOwn ? message.senderName : undefined}
                    showTimestamp={showTimestamp}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
        
        {isTyping && (
          <TypingIndicator
            userName={typingUserName}
            isVisible={true}
          />
        )}
      </MessageList>
    </ThreadContainer>
  );
};

export default MessageThread;