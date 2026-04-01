import styled from '@emotion/styled';
import { useParams } from 'react-router-dom';
import PageContainer from '../components/templates/PageContainer';
import TwoColumnLayout from '../components/templates/TwoColumnLayout';
import ConversationsList from '../components/organisms/messaging/ConversationsList';
import ChatContainer from '../components/organisms/messaging/ChatContainer';

const MessagesContainer = styled.div`
  height: calc(100vh - 56px); // Account for header
  
  @media (min-width: 768px) {
    height: calc(100vh - 60px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
  color: #65676b;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #050505;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    margin: 0;
  }
`;

/**
 * MessagesPage Component
 * Messaging interface with conversation list and chat view
 * Supports both list view (mobile) and split view (desktop)
 */
const MessagesPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  // On mobile, show only conversations list or chat based on URL
  const isMobile = window.innerWidth < 768;

  if (isMobile && !conversationId) {
    return (
      <PageContainer>
        <MessagesContainer>
          <ConversationsList />
        </MessagesContainer>
      </PageContainer>
    );
  }

  if (isMobile && conversationId) {
    return (
      <PageContainer>
        <MessagesContainer>
          <ChatContainer conversationId={conversationId} />
        </MessagesContainer>
      </PageContainer>
    );
  }

  // Desktop: two-column layout
  return (
    <PageContainer>
      <MessagesContainer>
        <TwoColumnLayout
          sidebar={<ConversationsList />}
          main={
            conversationId ? (
              <ChatContainer conversationId={conversationId} />
            ) : (
              <EmptyState>
                <h2>Select a conversation</h2>
                <p>Choose a conversation from the list to start messaging</p>
              </EmptyState>
            )
          }
          sidebarWidth="360px"
        />
      </MessagesContainer>
    </PageContainer>
  );
};

export default MessagesPage;