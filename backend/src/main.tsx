import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startHealthMonitoring } from './services/health'

// Handle initial path from session storage
const initialPath = sessionStorage.getItem('path');
if (initialPath && window.location.pathname !== initialPath) {
  window.history.replaceState(null, '', initialPath);
}

// API sağlık kontrolünü başlat
if (import.meta.env.PROD) {
  startHealthMonitoring(60000); // Production'da her 1 dakikada bir kontrol et
} else {
  startHealthMonitoring(300000); // Development'da her 5 dakikada bir kontrol et
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
