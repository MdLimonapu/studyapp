import { NavLink, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import University from './pages/University'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🎓</div>
          <h1>StudyFinder</h1>
        </div>
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
        </Routes>
      </main>

      <footer className="footer">
        <p>StudyFinder — Powered by live university data 🌍</p>
      </footer>
    </div>
  )
}
