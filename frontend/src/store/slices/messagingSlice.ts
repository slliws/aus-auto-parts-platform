/**
 * Messaging Redux Slice
 * Manages state for messaging functionality including conversations and messages
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as messagingService from '../../services/messaging.service';
import type { Conversation, Message, SendMessagePayload } from '../../services/messaging.service';

/**
 * Messaging state interface
 */
export interface MessagingState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  conversationsLoading: boolean;
  conversationsError: string | null;
  
  // Messages
  messages: Record<string, Message[]>; // Keyed by conversation ID
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: Record<string, boolean>; // Keyed by conversation ID
  
  // Typing indicators
  typingUsers: Record<string, string[]>; // Keyed by conversation ID, value is array of user IDs
  
  // Unread count
  unreadCount: number;
  
  // UI state
  isSending: boolean;
}

/**
 * Initial state
 */
const initialState: MessagingState = {
  conversations: [],
  activeConversationId: null,
  conversationsLoading: false,
  conversationsError: null,
  
  messages: {},
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: {},
  
  typingUsers: {},
  
  unreadCount: 0,
  
  isSending: false,
};

/**
 * Async thunk: Fetch all conversations
 */
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await messagingService.fetchConversations();
      return conversations;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Fetch messages for a conversation
 */
export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async (
    { conversationId, params }: { 
      conversationId: string; 
      params?: { limit?: number; offset?: number; before?: string } 
    },
    { rejectWithValue }
  ) => {
    try {
      const messages = await messagingService.fetchMessages(conversationId, params);
      return { conversationId, messages };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Send a message
 */
export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const message = await messagingService.sendMessage(payload);
      return message;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Mark message as read
 */
export const markMessageAsRead = createAsyncThunk(
  'messaging/markMessageAsRead',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await messagingService.markMessageAsRead(messageId);
      return messageId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Mark conversation as read
 */
export const markConversationAsRead = createAsyncThunk(
  'messaging/markConversationAsRead',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await messagingService.markConversationAsRead(conversationId);
      return conversationId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Create a new conversation
 */
export const createConversation = createAsyncThunk(
  'messaging/createConversation',
  async (participantId: string, { rejectWithValue }) => {
    try {
      const conversation = await messagingService.createConversation({ participantId });
      return conversation;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Async thunk: Get unread count
 */
export const fetchUnreadCount = createAsyncThunk(
  'messaging/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const count = await messagingService.getUnreadCount();
      return count;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Messaging slice
 */
const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    /**
     * Set active conversation
     */
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      
      // Mark conversation as read when opened
      if (action.payload) {
        const conversation = state.conversations.find(c => c.id === action.payload);
        if (conversation && conversation.unreadCount > 0) {
          conversation.unreadCount = 0;
        }
      }
    },
    
    /**
     * Add a new message to the state (for real-time updates)
     */
    addMessage: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Add message if it doesn't already exist
      const exists = state.messages[conversationId].some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages[conversationId].push(action.payload);
      }
      
      // Update conversation's last message
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = action.payload.content;
        conversation.lastMessageTimestamp = action.payload.timestamp;
        
        // Increment unread count if not the active conversation
        if (conversationId !== state.activeConversationId) {
          conversation.unreadCount += 1;
          state.unreadCount += 1;
        }
      }
    },
    
    /**
     * Update typing indicator
     */
    setTypingIndicator: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        // Add user to typing list if not already present
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        // Remove user from typing list
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
      }
    },
    
    /**
     * Clear messages for a conversation
     */
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
      delete state.hasMoreMessages[action.payload];
    },
    
    /**
     * Clear all messaging state
     */
    clearMessagingState: (state) => {
      Object.assign(state, initialState);
    },
    
    /**
     * Update conversation status
     */
    updateConversationStatus: (
      state,
      action: PayloadAction<{ conversationId: string; status: 'online' | 'offline' | 'away' | 'busy' }>
    ) => {
      const { conversationId, status } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.conversationsError = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
        state.conversationsError = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.conversationsError = action.payload as string;
      });
    
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { conversationId, messages } = action.payload;
        
        // If offset is provided, append to existing messages (load more)
        if (state.messages[conversationId]) {
          state.messages[conversationId] = [...messages, ...state.messages[conversationId]];
        } else {
          state.messages[conversationId] = messages;
        }
        
        // Update hasMoreMessages flag
        state.hasMoreMessages[conversationId] = messages.length > 0;
        state.messagesError = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload as string;
      });
    
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const message = action.payload;
        const { conversationId } = message;
        
        // Add message to state
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(message);
        
        // Update conversation's last message
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.lastMessage = message.content;
          conversation.lastMessageTimestamp = message.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isSending = false;
      });
    
    // Mark conversation as read
    builder
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conversation = state.conversations.find(c => c.id === conversationId);
        
        if (conversation) {
          state.unreadCount -= conversation.unreadCount;
          conversation.unreadCount = 0;
        }
        
        // Mark all messages in the conversation as read
        if (state.messages[conversationId]) {
          state.messages[conversationId].forEach(message => {
            message.isRead = true;
          });
        }
      });
    
    // Create conversation
    builder
      .addCase(createConversation.fulfilled, (state, action) => {
        const conversation = action.payload;
        state.conversations.unshift(conversation);
        state.activeConversationId = conversation.id;
      });
    
    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

// Export actions
export const {
  setActiveConversation,
  addMessage,
  setTypingIndicator,
  clearMessages,
  clearMessagingState,
  updateConversationStatus,
} = messagingSlice.actions;

// Export reducer
export default messagingSlice.reducer;