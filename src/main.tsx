import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

//Make the UI BETTER
//Check the logic performance so it render the data correctly
//Make an empty "admin" page to let the visitor to test the site

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

