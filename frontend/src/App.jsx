import { NavLink, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import University from './pages/University'
import Profile from './pages/Profile'
import Roadmap from './pages/Roadmap'

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

export default function App() {
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
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/university">University</NavLink>
          <NavLink to="/roadmap">Roadmap</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/university" element={<University />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

    </div>
  )
}
