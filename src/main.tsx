import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

//TODO:
//Make the UI BETTER
//Check the logic performance so it render the data correctly
//Make an empty "admin" page to let the visitor to test the site
//cryptoholding component need to be fixed, holding reset everytime a session is reloaded (login/logout)
//add input validation for crypto custom list
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
