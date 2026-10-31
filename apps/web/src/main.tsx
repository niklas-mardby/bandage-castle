import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { queryClient } from './lib/queryClient'
import './app.css'

// 🎃 The castle dresses up for October. Gorm started this tradition in 2022.
if (new Date().getMonth() === 9 && localStorage.getItem('no-halloween') !== '1') document.body.classList.add('halloween')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
