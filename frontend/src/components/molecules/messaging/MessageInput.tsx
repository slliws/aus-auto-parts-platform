import React, { useState, KeyboardEvent } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Message input props
 */
export interface MessageInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Callback when message is sent */
  onSend: (message: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether someone is typing */
  showTypingIndicator?: boolean;
}

/**
 * Container for message input area
 */
const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  padding: ${theme.spacing.spacing12} ${theme.spacing.spacing16};
  background-color: ${theme.colors.neutral.white};
  border-top: 1px solid ${theme.colors.neutral.lightGray};
  gap: ${theme.spacing.spacing8};
`;

/**
 * Text input wrapper
 */
const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background-color: ${theme.colors.neutral.background};
  border-radius: 20px;
  padding: ${theme.spacing.spacing8} ${theme.spacing.spacing16};
  transition: background-color 0.2s;
  
  &:focus-within {
    background-color: ${theme.colors.neutral.lightGray};
  }
`;

/**
 * Text input field
 */
const TextInput = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${theme.typography.fontFamilies.primary};
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.black};
  resize: none;
  max-height: 100px;
  min-height: 20px;
  line-height: 20px;
  
  &::placeholder {
    color: ${theme.colors.neutral.darkGray};
  }
  
  /* Hide scrollbar but allow scrolling */
  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.neutral.mediumGray} transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.neutral.mediumGray};
    border-radius: 2px;
  }
`;

/**
 * Send button
 */
const SendButton = styled.button<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: ${props => props.disabled 
    ? theme.colors.neutral.lightGray 
    : theme.colors.facebook.primary};
  color: ${theme.colors.neutral.white};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s, transform 0.1s;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background-color: ${theme.colors.facebook.primary}e6;
    transform: scale(1.05);
  }
  
  &:active:not(:disabled) {
    background-color: ${theme.colors.facebook.primary}cc;
    transform: scale(0.95);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * Send icon SVG
 */
const SendIcon: React.FC = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

/**
 * MessageInput component with Facebook Messenger styling
 * 
 * @example
 * <MessageInput
 *   placeholder="Type a message..."
 *   onSend={(message) => handleSendMessage(message)}
 *   disabled={false}
 * />
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = 'Type a message...',
  onSend,
  disabled = false,
  showTypingIndicator = false,
}) => {
  const [message, setMessage] = useState('');
  
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };
  
  const canSend = message.trim().length > 0 && !disabled;
  
  return (
    <InputContainer>
      <InputWrapper>
        <TextInput
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
      </InputWrapper>
      
      <SendButton 
        onClick={handleSend}
        disabled={!canSend}
        type="button"
      >
        <SendIcon />
      </SendButton>
    </InputContainer>
  );
};

export default MessageInput;