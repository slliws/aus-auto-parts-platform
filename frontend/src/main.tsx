import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('[DEBUG] main.tsx - Starting application initialization');
console.log('[DEBUG] main.tsx - Root element:', document.getElementById('root'));

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('[DEBUG] main.tsx - React render called successfully');
} catch (error) {
  console.error('[DEBUG] main.tsx - Error during render:', error);
}
