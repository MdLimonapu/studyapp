import { useState, useEffect } from 'react'
import { saveProfile } from '../api'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Standard Google JWT decoder
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const handleGoogleCredential = async (response) => {
    if (!response.credential) return
    setLoading(true)
    setError('')
    try {
      const decoded = decodeJwt(response.credential)
      if (decoded && decoded.email) {
        const user = {
          email: decoded.email,
          fullName: decoded.name || 'Google User',
          avatarUrl: decoded.picture || null,
          method: 'google'
        }
        
        // Save to localStorage
        localStorage.setItem('user_account', JSON.stringify(user))

        // Save profile to backend so it immediately populates the app shell
        await saveProfile({
          fullName: user.fullName,
          avatarUrl: user.avatarUrl
        })
        
        // Notify app layout to reload avatar initials
        window.dispatchEvent(new Event('profile-updated'))
        
        onAuthSuccess()
        onClose()
      } else {
        setError('Failed to parse Google credentials.')
      }
    } catch (err) {
      setError('Google authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  // Load Google button script if SDK exists
  useEffect(() => {
    if (!isOpen) return
    
    // Tiny delay to ensure modal container has mounted and button DOM id is available
    const timer = setTimeout(() => {
      /* global google */
      if (window.google) {
        try {
          google.accounts.id.initialize({
            // Dummy client id. The button will render. If users customize it via .env, it'll connect to their GCloud project.
            client_id: "542289437119-9vplk22n8mupcge7j8n8q51vpe5q6uun.apps.googleusercontent.com", 
            callback: handleGoogleCredential
          })
          google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { theme: "outline", size: "large", width: 320 }
          )
        } catch (e) {
          console.error("Google accounts load error", e)
        }
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [isOpen])

  if (!isOpen) return null

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      // Simulate Email registration / login
      const nameFromEmail = email.split('@')[0]
      const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
      
      const user = {
        email,
        fullName: capitalizedName,
        avatarUrl: null,
        method: 'email'
      }

      localStorage.setItem('user_account', JSON.stringify(user))

      await saveProfile({
        fullName: user.fullName,
        avatarUrl: null
      })

      window.dispatchEvent(new Event('profile-updated'))
      onAuthSuccess()
      onClose()
    } catch {
      setError('Registration failed. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setLoading(true)
    setError('')
    try {
      const user = {
        email: 'demo.student@studplex.com',
        fullName: 'Demo Student',
        avatarUrl: null,
        method: 'demo'
      }

      localStorage.setItem('user_account', JSON.stringify(user))

      await saveProfile({
        fullName: user.fullName,
        avatarUrl: null
      })

      window.dispatchEvent(new Event('profile-updated'))
      onAuthSuccess()
      onClose()
    } catch {
      setError('Demo access failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: '400px', padding: '32px' }}>
        <button className="modal-close" onClick={onClose} style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: '20px',
          cursor: 'pointer'
        }}>×</button>

        <div className="modal-icon" style={{ fontSize: '36px', marginBottom: '8px' }}>👤</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          {isSignUp ? 'Create account' : 'Sign in'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.4 }}>
          Save preparation checkpoints, track deadlines, and get access to all matches.
        </p>

        {error && (
          <p className="error-msg" style={{ marginBottom: '16px', fontSize: '13px', color: '#ff6b6b' }}>
            ⚠️ {error}
          </p>
        )}

        {/* Traditional Auth Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email address
            </label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '12px',
            fontSize: '14.5px',
            fontWeight: 700,
            marginTop: '6px'
          }}>
            {loading ? <span className="spinner"></span> : (isSignUp ? 'Create Free Account' : 'Sign In')}
          </button>
        </form>

        {/* Separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: 'var(--muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
          <span>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
        </div>

        {/* OAuth Buttons Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
          <div id="google-signin-btn" style={{ minHeight: '40px' }}></div>
          
          <button 
            type="button" 
            onClick={handleDemoAccess}
            className="btn-outline" 
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13.5px',
              borderRadius: '12px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.01)',
              borderColor: 'var(--card-border)'
            }}
          >
            ⚡ Quick Demo Access (No setup needed)
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  )
}
