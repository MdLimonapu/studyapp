import { useEffect, useState } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import University from './pages/University'
import Profile from './pages/Profile'
import Roadmap from './pages/Roadmap'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/clerk-react'
import { fetchProfile, saveProfile, registerUser } from './api'

function NotFound() {
  return (
    <div className="card empty-state" style={{marginTop: 40}}>
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

export default function App() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    const updateProfile = () => {
      const email = user?.primaryEmailAddress?.emailAddress || ""
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

        saveProfile({
          fullName,
          email,
          avatarUrl
        }).then(() => {
          window.dispatchEvent(new Event('profile-updated'))
        }).catch(() => {})

        registerUser({
          email,
          fullName,
          avatarUrl,
          method: 'clerk'
        }).catch(() => {})
      } else {
        // User logged out, clear backend profile JSON
        saveProfile({
          fullName: '',
          email: '',
          currentDegree: '',
          currentField: '',
          semester: '',
          universityName: '',
          grade: '',
          notes: '',
          avatarUrl: ''
        }).then(() => {
          window.dispatchEvent(new Event('profile-updated'))
        }).catch(() => {})
      }
    }
  }, [user, isLoaded])

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
                  <stop stopColor="#51faaa" />
                  <stop offset="1" stopColor="#ff81ff" />
                </linearGradient>
                <linearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff81ff" />
                  <stop offset="1" stopColor="#51faaa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Stud<span style={{color: 'var(--accent)'}}>plex</span></h1>
        </NavLink>
        
        <div className="topbar-right">
          <nav className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/university">University Matches</NavLink>
            <NavLink to="/roadmap">Check Eligibility</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <SignedIn>
              <NavLink to="/profile">Profile</NavLink>
            </SignedIn>
          </nav>

          <SignedIn>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <UserButton afterSignOutUrl="/">
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
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/university" element={<University />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">Stud<span style={{ color: 'var(--accent)' }}>plex</span></span>
            <p className="footer-tagline">Personalised international university matches in seconds.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Navigation</h4>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/university">University Matches</NavLink>
              <NavLink to="/roadmap">Check Eligibility</NavLink>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <NavLink to="/contact">Contact Support</NavLink>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <NavLink to="/privacy">Privacy Policy</NavLink>
              <NavLink to="/terms">Terms of Service</NavLink>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Studplex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
