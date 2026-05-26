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
          colorPrimary: '#51faaa',
          colorBackground: '#121426',
          colorText: '#ffffff',
          colorInputBackground: '#1a1d36',
          colorInputText: '#ffffff',
          colorTextSecondary: '#8b90b8',
          borderRadius: '12px',
        },
        elements: {
          card: {
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(18, 20, 38, 0.95) !important',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          },
          socialButtonsIconButton: {
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }
          },
          formButtonPrimary: {
            background: 'linear-gradient(135deg, #51faaa 0%, #ff81ff 100%) !important',
            color: '#0c0e1d !important',
            fontWeight: '700',
            border: 'none',
            '&:hover': {
              opacity: '0.9 !important',
            }
          },
          dividerLine: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          footer: {
            background: 'transparent !important',
            '& a': {
              color: '#51faaa !important',
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

