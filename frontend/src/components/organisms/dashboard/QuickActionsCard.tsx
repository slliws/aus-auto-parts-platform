import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Grid,
  Button,
  SxProps,
  Theme 
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  RequestQuote as RequestQuoteIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  path?: string;
}

interface QuickActionsCardProps {
  title?: string;
  actions: QuickAction[];
  sx?: SxProps<Theme>;
}

/**
 * QuickActionsCard Component
 * Displays a grid of quick action buttons for common tasks
 * Used in dashboard for providing quick access to frequently used actions
 */
const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title = 'Quick Actions',
  actions,
  sx,
}) => {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardHeader title={title} />
      <CardContent>
        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid item xs={6} sm={3} key={action.id}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={action.icon}
                onClick={() => handleAction(action)}
                sx={{ 
                  width: '100%', 
                  justifyContent: 'flex-start',
                  py: 1,
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Default quick actions for the dashboard
export const defaultQuickActions: QuickAction[] = [
  {
    id: 'add-part',
    label: 'Add New Part',
    icon: <AddIcon />,
    path: '/parts'
  },
  {
    id: 'add-customer',
    label: 'Add New Customer',
    icon: <PersonAddIcon />,
    path: '/customers'
  },
  {
    id: 'create-quote',
    label: 'Create Quote',
    icon: <RequestQuoteIcon />,
    path: '/quotes'
  },
  {
    id: 'create-order',
    label: 'Create Order',
    icon: <ShoppingCartIcon />,
    path: '/orders'
  }
];

export default QuickActionsCard;