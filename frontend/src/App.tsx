import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from './styles/ThemeProvider';
import { store } from './store';
import AppRoutes from './routes';

console.log('[DEBUG] App.tsx - App component rendering');

function App() {
  console.log('[DEBUG] App.tsx - Redux store:', store);
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;