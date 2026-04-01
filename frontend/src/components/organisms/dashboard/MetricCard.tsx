import React from 'react';
import { Box, Card, CardContent, Typography, SxProps, Theme } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  color?: string;
  sx?: SxProps<Theme>;
}

/**
 * MetricCard Component
 * Displays a key metric with icon, title, value and optional trend indicator
 * Used in dashboard for displaying important statistics
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary.main',
  sx,
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      <CardContent sx={{ flex: 1, padding: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1.5,
              mr: 1.5,
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" component="div" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        
        {trend && (
          <Box display="flex" alignItems="center">
            <Typography
              variant="body2"
              color={trend.isPositive ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Typography>
            <Typography variant="body2" color="text.secondary" ml={1}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;