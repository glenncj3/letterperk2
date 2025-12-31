import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAnalytics, trackPageView } from './services/analytics';

// Initialize Google Analytics
initializeAnalytics();

// Track initial pageview
trackPageView(window.location.pathname, document.title);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
