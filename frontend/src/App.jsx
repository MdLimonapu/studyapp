import { NavLink, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import University from './pages/University'
import Profile from './pages/Profile'

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
          <div className="brand-icon">🎓</div>
          <h1>StudyFinder</h1>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/university">University</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/university" element={<University />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

    </div>
  )
}
