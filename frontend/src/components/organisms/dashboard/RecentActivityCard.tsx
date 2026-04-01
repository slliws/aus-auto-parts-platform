import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  SxProps,
  Theme 
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'part' | 'customer' | 'order';
}

interface RecentActivityCardProps {
  title?: string;
  items: ActivityItem[];
  emptyMessage?: string;
  maxItems?: number;
  sx?: SxProps<Theme>;
}

/**
 * RecentActivityCard Component
 * Displays a list of recent activities in the system
 * Used in dashboard for providing visibility of recent changes
 */
const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  title = 'Recent Activity',
  items,
  emptyMessage = 'No recent activity',
  maxItems = 5,
  sx,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'part':
        return <InventoryIcon />;
      case 'customer':
        return <PersonIcon />;
      case 'order':
        return <ShoppingCartIcon />;
      default:
        return <InventoryIcon />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'part':
        return 'primary.main';
      case 'customer':
        return 'success.main';
      case 'order':
        return 'warning.main';
      default:
        return 'grey.500';
    }
  };

  const displayedItems = items.slice(0, maxItems);

  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardHeader title={title} />
      <CardContent sx={{ pt: 0 }}>
        {displayedItems.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {displayedItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getIconColor(item.type)}20`, color: getIconColor(item.type) }}>
                      {getIcon(item.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.description}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" color="text.secondary">
                          {dayjs(item.timestamp).fromNow()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < displayedItems.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;