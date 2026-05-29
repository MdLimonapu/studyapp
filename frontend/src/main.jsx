import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import App from './App'
import './styles.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
        variables: {
          colorPrimary: 'var(--accent)',
          colorBackground: 'var(--bg)',
          colorText: 'var(--text)',
          colorInputBackground: 'var(--input-bg)',
          colorInputText: 'var(--text)',
          colorTextSecondary: 'var(--muted)',
          borderRadius: '16px',
        },
        elements: {
          modalCloseButton: {
            display: 'none !important',
          },
          card: {
            border: '1px solid var(--card-border)',
            background: 'var(--card) !important',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-card)',
            width: '500px !important',
            maxWidth: '100%',
          },
          socialButtonsIconButton: {
            borderColor: 'var(--card-border)',
            backgroundColor: 'var(--glass-glow)',
            color: 'var(--text)',
            '&:hover': {
              backgroundColor: 'var(--card-border)',
            }
          },
          formButtonPrimary: {
            background: 'var(--btn-gradient) !important',
            color: 'var(--btn-text) !important',
            fontWeight: '700',
            border: 'none',
            '&:hover': {
              opacity: '0.9 !important',
            }
          },
          dividerLine: {
            backgroundColor: 'var(--card-border)',
          },
          footer: {
            background: 'transparent !important',
            '& a': {
              color: 'var(--accent) !important',
            }
          }
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
)

