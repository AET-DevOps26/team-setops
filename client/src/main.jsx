import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PrivacyModeProvider } from './context/PrivacyModeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivacyModeProvider>
      <App />
    </PrivacyModeProvider>
  </StrictMode>,
)
