// Import StrictMode for highlighting potential problems during development
import { StrictMode } from 'react';
// Import createRoot to create a React root in the DOM
import { createRoot } from 'react-dom/client';
// Import the main App component
import App from './App.tsx';
// Import global CSS styles (Tailwind)
import './index.css';

// Create and render the root React component
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
