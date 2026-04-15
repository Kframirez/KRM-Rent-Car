import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UiFeedbackProvider } from './components/feedback/UiFeedbackProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UiFeedbackProvider>
      <App />
    </UiFeedbackProvider>
  </StrictMode>,
)
