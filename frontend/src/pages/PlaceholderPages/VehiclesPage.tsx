import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { DirectionsCar as DirectionsCarIcon } from '@mui/icons-material';

/**
 * VehiclesPage Component (Placeholder)
 * This is a placeholder for the Vehicles feature that will be implemented in the future
 */
const VehiclesPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vehicles
      </Typography>
      
      <Paper 
        sx={{ 
          p: 4, 
          mt: 2, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <DirectionsCarIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
        
        <Typography variant="h5" gutterBottom>
          Vehicle Management Coming Soon
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The Vehicle management system is currently under development.
          This feature will allow you to track compatible vehicles for auto parts.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Key features will include:
        </Typography>
        
        <Box sx={{ textAlign: 'left', maxWidth: 400, mb: 2 }}>
          <ul>
            <li>Vehicle database with makes and models</li>
            <li>Part compatibility lookup</li>
            <li>Year/make/model filtering</li>
            <li>Vehicle specifications</li>
            <li>VIN decoding</li>
            <li>Service history tracking</li>
          </ul>
        </Box>
        
        <Button variant="contained" disabled>
          Add New Vehicle (Coming Soon)
        </Button>
      </Paper>
    </Box>
  );
};

export default VehiclesPage;