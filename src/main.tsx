import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from 'App';

import './i18n';
import './index.css';

// TODO: Move these to proper locations (Technical Debt)
// - Font imports should be in a fonts.css or theme setup
// - initialize() should be in App.tsx or a setup module
// - Global styles should be in index.css or theme
// - DocumentUtils should be called from App.tsx useEffect
import 'simplebar-react/dist/simplebar.min.css';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/700.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/700.css';

import { InitializationType, initialize } from 'config';
import { DocumentUtils } from 'utils';

// TEMPORARY: Global styles for fullscreen simulation (move to CSS file)
const fullscreenStyles = `
  .ios-fullscreen-active {
    overflow: hidden !important;
  }
  .ios-fullscreen-simulation {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
    background-color: #fff !important;
  }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = fullscreenStyles;
document.head.appendChild(styleSheet);

// TEMPORARY: Initialize core services (move to App.tsx)
initialize([InitializationType.ERROR_MONITORING, InitializationType.AUTH, InitializationType.MESSAGING, InitializationType.CHUNK_RELOAD]);

document.addEventListener('DOMContentLoaded', () => {
  DocumentUtils.setDocumentMetadata();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
