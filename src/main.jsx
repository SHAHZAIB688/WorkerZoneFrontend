import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { BrowserLocationProvider } from './state/BrowserLocationContext.jsx'
import { initFirebaseAnalytics } from './firebase'

initFirebaseAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BrowserLocationProvider>
          <App />
          <Toaster position="top-center" />
        </BrowserLocationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
