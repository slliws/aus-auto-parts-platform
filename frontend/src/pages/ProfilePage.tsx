import styled from '@emotion/styled';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import PageContainer from '../components/templates/PageContainer';
import Avatar from '../components/atoms/Avatar';
import Button from '../components/atoms/Button';

const ProfileContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const ProfileHeader = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #050505;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    color: #65676b;
    margin: 0;
  }
`;

const ProfileSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #050505;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e6eb;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e4e6eb;

  &:last-child {
    border-bottom: none;
  }

  label {
    font-weight: 600;
    color: #050505;
  }

  span {
    color: #65676b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Badge = styled.span<{ variant: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.variant) {
      case 'OWNER':
      case 'ADMIN':
        return '#e7f3ff';
      case 'SALES':
        return '#e3f2fd';
      case 'CUSTOMER':
        return '#f0f2f5';
      default:
        return '#e4e6eb';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'OWNER':
      case 'ADMIN':
        return '#1877f2';
      case 'SALES':
        return '#0084ff';
      case 'CUSTOMER':
        return '#65676b';
      default:
        return '#050505';
    }
  }};
`;

/**
 * ProfilePage Component
 * User profile view with account information
 */
const ProfilePage = () => {
  const user = useSelector(selectUser);

  if (!user) {
    return (
      <PageContainer>
        <ProfileContent>
          <ProfileSection>
            <p>Loading profile...</p>
          </ProfileSection>
        </ProfileContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ProfileContent>
        <ProfileHeader>
          <Avatar 
            size="large" 
            name={`${user.firstName} ${user.lastName}`}
            status={user.isActive ? 'online' : 'offline'}
          />
          <ProfileInfo>
            <h1>{user.firstName} {user.lastName}</h1>
            <p>{user.email}</p>
            <div style={{ marginTop: '8px' }}>
              <Badge variant={user.role}>{user.role}</Badge>
            </div>
          </ProfileInfo>
        </ProfileHeader>

        <ProfileSection>
          <h2>Account Information</h2>
          <InfoRow>
            <label>Email</label>
            <span>{user.email}</span>
          </InfoRow>
          <InfoRow>
            <label>First Name</label>
            <span>{user.firstName}</span>
          </InfoRow>
          <InfoRow>
            <label>Last Name</label>
            <span>{user.lastName}</span>
          </InfoRow>
          <InfoRow>
            <label>Role</label>
            <span>{user.role}</span>
          </InfoRow>
          <InfoRow>
            <label>Account Status</label>
            <span>{user.isActive ? 'Active' : 'Inactive'}</span>
          </InfoRow>
          <InfoRow>
            <label>User ID</label>
            <span>{user.id}</span>
          </InfoRow>
        </ProfileSection>

        <ProfileSection>
          <h2>Settings</h2>
          <ButtonGroup>
            <Button variant="primary">Edit Profile</Button>
            <Button variant="secondary">Change Password</Button>
            <Button variant="outline">Privacy Settings</Button>
          </ButtonGroup>
        </ProfileSection>
      </ProfileContent>
    </PageContainer>
  );
};

export default ProfilePage;