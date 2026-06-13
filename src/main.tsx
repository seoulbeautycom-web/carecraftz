import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hide SEO content when React loads
const hideSeoContent = () => {
  const seoContent = document.getElementById('seo-content')
  if (seoContent) {
    seoContent.style.display = 'none'
  }
}

// Hide noscript content wrapper when JS is enabled
const hideNoscriptContent = () => {
  const noscriptElements = document.querySelectorAll('noscript')
  noscriptElements.forEach(el => {
    el.style.display = 'none'
  })
}

// Run immediately
hideSeoContent()
hideNoscriptContent()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
