import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pt-sans/400.css';
import '@fontsource/pt-sans/700.css';
import '@fontsource/pt-sans/400-italic.css';
import '@fontsource/pt-sans-caption/700.css';
import './styles/tokens.css';
import './styles/base.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
