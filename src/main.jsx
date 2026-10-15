import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Global error logger to help debug screen issues
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorDiv = document.createElement('div')
    errorDiv.style.position = 'fixed'
    errorDiv.style.top = '0'
    errorDiv.style.left = '0'
    errorDiv.style.width = '100%'
    errorDiv.style.backgroundColor = '#FEE2E2'
    errorDiv.style.color = '#991B1B'
    errorDiv.style.padding = '15px'
    errorDiv.style.zIndex = '999999'
    errorDiv.style.fontFamily = 'monospace'
    errorDiv.style.fontSize = '12px'
    errorDiv.style.borderBottom = '3px solid #EF4444'
    errorDiv.innerHTML = `<strong>Runtime Error:</strong> ${event.message} <br/> <em>at ${event.filename}:${event.lineno}</em>`
    document.body.appendChild(errorDiv)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
