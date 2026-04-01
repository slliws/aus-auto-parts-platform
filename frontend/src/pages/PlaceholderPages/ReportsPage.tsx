import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

/**
 * ReportsPage Component (Placeholder)
 * This is a placeholder for the Reports feature that will be implemented in the future
 */
const ReportsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports
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
        <AssessmentIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
        
        <Typography variant="h5" gutterBottom>
          Reports & Analytics Coming Soon
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The Reports and Analytics system is currently under development.
          This feature will provide business intelligence and reporting capabilities.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Key features will include:
        </Typography>
        
        <Box sx={{ textAlign: 'left', maxWidth: 400, mb: 2 }}>
          <ul>
            <li>Sales reports by period, category, or customer</li>
            <li>Inventory analytics and stock forecasting</li>
            <li>Customer purchase patterns</li>
            <li>Profitability analysis</li>
            <li>Custom report builder</li>
            <li>Export to Excel, PDF, CSV</li>
          </ul>
        </Box>
        
        <Button variant="contained" disabled>
          Generate Reports (Coming Soon)
        </Button>
      </Paper>
    </Box>
  );
};

export default ReportsPage;