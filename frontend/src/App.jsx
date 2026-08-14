import { useEffect, useState, lazy, Suspense } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'

const About = lazy(() => import('./pages/About'))
const University = lazy(() => import('./pages/University'))
const Profile = lazy(() => import('./pages/Profile'))
const Services = lazy(() => import('./pages/Services'))
const Roadmap = lazy(() => import('./pages/Roadmap'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Products = lazy(() => import('./pages/Products'))

import { SignedIn, SignedOut, UserButton, SignInButton, useUser, SignIn } from '@clerk/clerk-react'
import { fetchProfile, saveProfile, registerUser } from './api'

function MobileAuth() {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || ""
      const fullName = user.fullName || user.username || ""
      const redirectUrl = `mobile://auth?email=${encodeURIComponent(email)}&fullName=${encodeURIComponent(fullName)}`
      window.location.href = redirectUrl
    }
  }, [isLoaded, isSignedIn, user])

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '80px auto', padding: '40px', textAlign: 'center' }}>
      <h2>Connecting to mobile app...</h2>
      <p style={{ color: 'var(--muted)', margin: '12px 0 24px' }}>
        Once logged in, you will be redirected back to the mobile app automatically.
      </p>
      {isSignedIn && user ? (
        <a 
          href={`mobile://auth?email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || "")}&fullName=${encodeURIComponent(user.fullName || "")}`}
          className="btn-accent"
          style={{ textDecoration: 'none', padding: '12px 28px', borderRadius: '12px', display: 'inline-block', color: 'var(--btn-text)', fontWeight: 700 }}
        >
          Open Studplex App
        </a>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SignIn forceRedirectUrl="/mobile-auth" signUpForceRedirectUrl="/mobile-auth" />
        </div>
      )}
    </div>
  )
}

import SEO from './components/SEO'

function NotFound() {
  return (
    <div className="card empty-state" style={{marginTop: 40}}>
      <SEO
        title="Page Not Found — Studplex"
        description="The page you are looking for does not exist on Studplex."
        noindex={true}
      />
      <div className="empty-icon">🔍</div>
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style={{display:'inline-block',marginTop:16}}>
        <button style={{width:'auto',padding:'12px 28px'}}>Go home</button>
      </a>
    </div>
  )
}

const getInitials = (name) => {
  if (!name) return '👤'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AppStoreButtons({ onClick }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
      {/* App Store */}
      <button 
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px',
          padding: '6px 14px',
          color: '#ffffff',
          width: 'auto',
          cursor: 'pointer',
          margin: 0,
        }}
        className="store-btn"
      >
        <svg width="16" height="18" viewBox="0 0 170 170" fill="currentColor">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.35-6.09-3.23-2.62-7.14-7.23-11.73-13.82-5.46-7.81-9.92-17.15-13.4-28.03-3.48-10.88-5.21-21.22-5.21-31.03 0-14.63 3.69-26.6 11.07-35.9 7.39-9.3 16.59-13.97 27.6-13.97 5.02 0 10.37 1.34 16.03 4.02 5.66 2.68 9.53 4.02 11.61 4.02 1.9 0 5.46-1.23 10.7-3.69 6.25-2.9 11.61-4.24 16.07-4.02 17.51.78 30.68 7.25 39.52 19.41-14.84 9.04-22.1 21.03-21.78 35.95.34 11.5 4.8 21.1 13.4 28.79 8.6 7.7 18.57 11.83 29.91 12.39-2.46 7.15-5.91 14.18-10.35 21.09zm-26.24-118.84c0 10.94-3.9 20.3-11.71 28.1-7.8 7.8-17.18 11.8-28.1 11.8-1.01 0-2.34-.1-4.02-.34.34-11.5 4.35-21.1 12.05-28.8 7.7-7.7 17.08-11.7 28.1-12 1.23.89 2.12 1.68 2.68 2.35.67 1.12 1 2.23 1 3.35z"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.7 }}>Download on the</span>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>App Store</span>
        </div>
      </button>

      {/* Play Store */}
      <button 
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px',
          padding: '6px 14px',
          color: '#ffffff',
          width: 'auto',
          cursor: 'pointer',
          margin: 0,
        }}
        className="store-btn"
      >
        <svg width="16" height="18" viewBox="0 0 170 170" fill="currentColor">
          <path d="M12.9 2.5C11.5 4 10.7 6.3 10.7 9.1v151.7c0 2.8.8 5.1 2.2 6.6l.8.8L90 91.8V90v-1.8L13.7 1.7l-.8.8zM116.2 118L90 91.8v1.8l26.2 26.2 31.1-17.8c8.9-5.1 8.9-13.4 0-18.5L116.2 118zM90 90L13.7 13.7c4.6 4.6 86.3 86.3 86.3 86.3v-10zM90 90l26.2-26.2c3.4-2 7.7-2 11.1 0l18.4 10.5c8.9 5.1 8.9 13.4 0 18.5L116.2 118z"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.7 }}>Get it on</span>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>Google Play</span>
        </div>
      </button>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const { user, isLoaded } = useUser()
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })
  const [showSoonModal, setShowSoonModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [countryFlag, setCountryFlag] = useState('')
  const [countryName, setCountryName] = useState('')

  useEffect(() => {
    const cachedFlag = localStorage.getItem('user_country_flag')
    const cachedName = localStorage.getItem('user_country_name')
    if (cachedFlag && cachedName) {
      setCountryFlag(cachedFlag)
      setCountryName(cachedName)
      return
    }

    const parseFlag = (countryCode) => {
      if (!countryCode) return ''
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }

    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) throw new Error('status ' + res.status)
        return res.json()
      })
      .then(data => {
        if (data && data.country_code) {
          const flag = parseFlag(data.country_code)
          const name = data.country_name || ''
          setCountryFlag(flag)
          setCountryName(name)
          localStorage.setItem('user_country_flag', flag)
          localStorage.setItem('user_country_name', name)
        }
      })
      .catch(() => {
        // Fallback: ipapi.co is blocked/rate-limited. Try ipinfo.io.
        fetch('https://ipinfo.io/json')
          .then(res => {
            if (!res.ok) throw new Error('status ' + res.status)
            return res.json()
          })
          .then(data => {
            if (data && data.country) {
              const flag = parseFlag(data.country)
              const name = data.country || ''
              setCountryFlag(flag)
              setCountryName(name)
              localStorage.setItem('user_country_flag', flag)
              localStorage.setItem('user_country_name', name)
            }
          })
          .catch(() => {})
      })
  }, [])

  useEffect(() => {
    const handleShowSoon = () => setShowSoonModal(true)
    window.addEventListener('show-app-soon', handleShowSoon)
    return () => window.removeEventListener('show-app-soon', handleShowSoon)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    // Update theme-color meta tag for mobile status bar coloring
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.getElementsByTagName('head')[0].appendChild(metaThemeColor)
    }
    // In light mode the top header is blue (#5e92f3); in dark mode it is dark (#16171a)
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#16171a' : '#5e92f3')
  }, [theme])

  useEffect(() => {
    const updateProfile = () => {
      if (!user) {
        setProfile(null)
        return
      }
      const email = user.primaryEmailAddress?.emailAddress || ""
      fetchProfile(email)
        .then(data => { if (data && Object.keys(data).length > 0) setProfile(data) })
        .catch(() => {})
    }
    if (isLoaded) {
      updateProfile()
    }
    window.addEventListener('profile-updated', updateProfile)
    return () => window.removeEventListener('profile-updated', updateProfile)
  }, [user, isLoaded])

  // Sync Clerk authentication status and user details automatically to the backend
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        const email = user.primaryEmailAddress?.emailAddress || ""
        const fullName = user.fullName || user.username || "Clerk User"
        const avatarUrl = user.imageUrl || ""

        fetchProfile(email).then((existing) => {
          if (!existing || !existing.email) {
            saveProfile({
              fullName,
              email,
              avatarUrl,
              documents: []
            }).then(() => {
              window.dispatchEvent(new Event('profile-updated'))
            }).catch(() => {})
          } else {
            window.dispatchEvent(new Event('profile-updated'))
          }
        }).catch(() => {})

        registerUser({
          email,
          fullName,
          avatarUrl,
          method: 'clerk'
        }).catch(() => {})
      } else {
        // User logged out, clear local session data but do NOT wipe the backend databases
        localStorage.removeItem('searchResults')
        localStorage.removeItem('searchForm')
        setProfile(null)
      }
    }
  }, [user, isLoaded])

  // Check if we're on the products/essentials route — render standalone
  const isProductsPage = window.location.pathname === '/products' || window.location.pathname === '/essentials'

  if (isProductsPage) {
    return (
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 20px', color: '#666' }}>Loading...</div>}>
        <Products />
      </Suspense>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" style={{textDecoration:'none', color:'inherit'}}>
          <div className="brand-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#studplex-grad)" />
              <path d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z" fill="url(#studplex-grad2)" />
              <defs>
                <linearGradient id="studplex-grad" x1="2" y1="2" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--accent)" />
                  <stop offset="1" stopColor="var(--accent2)" />
                </linearGradient>
                <linearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--accent2)" />
                  <stop offset="1" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Stud<span className="brand-plex">plex</span></div>
            <span className="brand-tagline" style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Match Your Future
            </span>
          </div>
        </NavLink>
        
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/university">University Matches</NavLink>
          <NavLink to="/roadmap">Check Eligibility</NavLink>
          <NavLink to="/products">Essentials Store</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        
        <div className="topbar-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', height: '100%' }}>
            <SignedIn>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transform: 'none', alignSelf: 'center' }}>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid var(--card-border)',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action 
                      label="My Profile" 
                      labelIcon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      }
                      onClick={() => navigate('/profile')} 
                    />
                  </UserButton.MenuItems>
                </UserButton>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.65 }}>Profile</span>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button 
                  className="btn-accent" 
                  style={{ 
                    padding: '8px 20px', 
                    fontSize: '13px', 
                    width: 'auto', 
                    margin: 0,
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '36px'
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ margin: 0, marginLeft: '32px', height: '40px', width: '40px', borderRadius: '10px' }}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>

            {countryFlag && (
              <span 
                className="user-country-badge" 
                title={`Visiting from ${countryName}`}
                style={{
                  fontSize: '24px',
                  height: '40px',
                  width: '40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'default',
                  userSelect: 'none'
                }}
              >
                {countryFlag}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Header Right Controls */}
        <div className="mobile-header-right" style={{ display: 'none', alignItems: 'center', gap: '10px', zIndex: 1001 }}>
          {countryFlag && (
            <span 
              className="user-country-badge" 
              title={`Visiting from ${countryName}`}
              style={{
                fontSize: '24px',
                height: '40px',
                width: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                userSelect: 'none',
                cursor: 'default'
              }}
            >
              {countryFlag}
            </span>
          )}
          <button 
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-logo">Stud<span style={{ color: 'var(--accent)' }}>plex</span></span>
              <button className="drawer-close" onClick={() => setMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <nav className="drawer-nav">
              <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
              <NavLink to="/university" onClick={() => setMenuOpen(false)}>University Matches</NavLink>
              <NavLink to="/roadmap" onClick={() => setMenuOpen(false)}>Check Eligibility</NavLink>
              <NavLink to="/products" onClick={() => setMenuOpen(false)}>Essentials Store</NavLink>
              <NavLink to="/services" onClick={() => setMenuOpen(false)}>Services</NavLink>
              <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
            </nav>

            <div className="drawer-footer">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
                <SignedIn>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: {
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: '2px solid var(--card-border)'
                          }
                        }
                      }}
                    />
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>My Profile</span>
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button 
                      className="btn-accent" 
                      onClick={() => setMenuOpen(false)}
                      style={{ 
                        padding: '10px 20px', 
                        fontSize: '13px', 
                        width: 'auto', 
                        margin: 0,
                        borderRadius: '10px',
                        fontWeight: 700
                      }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>

                <button 
                  className="theme-toggle-btn"
                  onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  style={{ margin: 0, height: '40px', width: '40px', borderRadius: '10px' }}
                >
                  {theme === 'dark' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="page-wrap">
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 20px', color: 'var(--muted)' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/university" element={<University />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/mobile-auth" element={<MobileAuth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">Stud<span style={{ color: 'var(--accent)' }}>plex</span></span>
            <p className="footer-tagline">Personalised international university matches in seconds.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <div className="footer-col-title">Navigation</div>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/about">About Us</NavLink>
              <NavLink to="/university">University Matches</NavLink>
              <NavLink to="/roadmap">Check Eligibility</NavLink>
              <NavLink to="/services">Services</NavLink>
              <a href="/news">Guides &amp; News</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Support</div>
              <NavLink to="/contact">Contact Support</NavLink>
              <NavLink to="/services">Book a Session</NavLink>
              <NavLink to="/contact">Help & FAQ</NavLink>
              <div style={{ marginTop: '16px' }}>
                <AppStoreButtons onClick={() => setShowSoonModal(true)} />
              </div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Legal</div>
              <NavLink to="/privacy">Privacy Policy</NavLink>
              <NavLink to="/terms">Terms of Service</NavLink>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Studplex. All rights reserved.</p>
        </div>
      </footer>
      {showSoonModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Mobile App Coming Soon</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              We're putting the finishing touches on the Studplex mobile app. It will be available for iOS and Android soon!
            </p>
            <button 
              className="btn-accent" 
              onClick={() => setShowSoonModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
            >
              Great, Can't Wait!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
