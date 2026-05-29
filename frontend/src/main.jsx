import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import App from './App'
import './styles.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function Main() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'dark')

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const currentTheme = document.documentElement.getAttribute('data-theme')
          setTheme(currentTheme || 'dark')
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
        variables: {
          colorPrimary: 'var(--accent)',
          colorBackground: 'var(--bg)',
          colorText: 'var(--text)',
          colorInputBackground: 'transparent',
          colorInputText: 'var(--text)',
          colorTextSecondary: 'var(--muted)',
          borderRadius: '12px',
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
            borderRadius: '24px',
          },
          headerTitle: {
            fontWeight: '800',
            fontSize: '26px',
            letterSpacing: '-0.02em',
          },
          headerSubtitle: {
            fontSize: '14.5px',
            color: 'var(--muted)',
          },
          socialButtonsBlockButton: {
            borderRadius: '9999px !important',
            border: '1px solid var(--card-border) !important',
            backgroundColor: 'transparent !important',
            color: 'var(--text) !important',
            height: '46px',
            fontWeight: '600',
            '&:hover': {
              backgroundColor: 'var(--glass-glow) !important',
            }
          },
          socialButtonsBlockButtonText: {
            fontWeight: '600',
            color: 'var(--text) !important',
          },
          formButtonPrimary: {
            background: 'var(--btn-gradient) !important',
            color: 'var(--btn-text) !important',
            fontWeight: '700',
            border: 'none',
            borderRadius: '9999px !important',
            height: '46px',
            fontSize: '15px',
            '&:hover': {
              opacity: '0.9 !important',
            }
          },
          formFieldInput: {
            borderRadius: '8px !important',
            backgroundColor: 'transparent !important',
            border: '1px solid var(--card-border) !important',
            color: 'var(--text) !important',
            padding: '12px 16px',
            height: '46px',
            '&:focus': {
              borderColor: 'var(--accent) !important',
              boxShadow: 'none !important',
            }
          },
          dividerLine: {
            backgroundColor: 'var(--card-border)',
          },
          footer: {
            background: 'var(--card) !important',
            borderTop: '1px solid var(--card-border) !important',
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
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
)
