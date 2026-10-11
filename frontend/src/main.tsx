import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('blib-color-theme')
document.documentElement.dataset.theme =
  savedTheme === 'botanical' || savedTheme === 'coastal' ? savedTheme : 'wood'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
