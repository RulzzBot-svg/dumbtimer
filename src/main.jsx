import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './phone.css'
import App from './App.jsx'
import { isNativeApp } from './lib/native.js'
import { bootNativeNotificationListeners } from './lib/nativeNotifications.js'
import { registerServiceWorker } from './lib/pwa.js'

if (isNativeApp()) {
  bootNativeNotificationListeners()
} else {
  registerServiceWorker()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
