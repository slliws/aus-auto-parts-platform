import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Typography,
  SxProps,
  Theme 
} from '@mui/material';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  chart: React.ReactNode;
  height?: string | number;
  sx?: SxProps<Theme>;
}

/**
 * ChartCard Component
 * Container for charts with consistent styling and header
 * Used in dashboard for visualizing statistics
 */
const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  chart,
  height = 300,
  sx,
}) => {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardHeader 
        title={title} 
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {chart}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartCard;