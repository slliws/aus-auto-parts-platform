/**
 * Messaging Service
 * Handles all API calls related to messaging functionality
 */

import axios, { AxiosError } from 'axios';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Conversation interface
 */
export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  status: 'online' | 'offline' | 'away' | 'busy';
  createdAt: string;
  updatedAt: string;
}

/**
 * Message interface
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Send message payload
 */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
}

/**
 * Create conversation payload
 */
export interface CreateConversationPayload {
  participantId: string;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * API error response
 */
interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Get tenant ID from localStorage
 */
const getTenantId = (): string | null => {
  return localStorage.getItem('tenantId');
};

/**
 * Create axios instance with auth headers
 */
const createApiClient = () => {
  const token = getAuthToken();
  const tenantId = getTenantId();
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
    },
  });
};

/**
 * Handle API errors
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  throw new Error('An unexpected error occurred');
};

/**
 * Fetch all conversations for the current user
 */
export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Conversation[]>>('/messages/conversations');
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch a single conversation by ID
 */
export const fetchConversation = async (conversationId: string): Promise<Conversation> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Conversation>>(`/messages/conversations/${conversationId}`);
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch messages for a specific conversation
 */
export const fetchMessages = async (
  conversationId: string,
  params?: {
    limit?: number;
    offset?: number;
    before?: string;
  }
): Promise<Message[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Message[]>>(
      `/messages/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (payload: SendMessagePayload): Promise<Message> => {
  try {
    const api = createApiClient();
    const response = await api.post<ApiResponse<Message>>('/messages', payload);
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.patch(`/messages/${messageId}/read`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.patch(`/messages/conversations/${conversationId}/read`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (payload: CreateConversationPayload): Promise<Conversation> => {
  try {
    const api = createApiClient();
    const response = await api.post<ApiResponse<Conversation>>('/messages/conversations', payload);
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.delete(`/messages/conversations/${conversationId}`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Search conversations
 */
export const searchConversations = async (query: string): Promise<Conversation[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Conversation[]>>('/messages/conversations/search', {
      params: { q: query },
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<{ count: number }>>('/messages/unread-count');
    return response.data.data.count;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  fetchConversations,
  fetchConversation,
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead,
  createConversation,
  deleteConversation,
  searchConversations,
  getUnreadCount,
};