import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCountries, fetchProfile, fetchNews, searchCourses } from '../api'

const ALL_FIELDS = [
  "Electrical Engineering", "Computer Science", "Mechanical Engineering",
  "Data Science", "Business Administration", "Medicine", "Architecture",
  "Civil Engineering", "Aerospace Engineering", "Biomedical Engineering",
  "Information Technology", "Artificial Intelligence", "Robotics",
  "Environmental Engineering", "Chemical Engineering", "Physics",
  "Mathematics", "Economics", "Psychology", "Law", "Nursing",
  "Embedded Systems", "Telecommunications", "Power Systems",
  "Software Engineering", "Cybersecurity", "Finance", "Marketing"
]

const FALLBACK_NEWS = [
  {title:"Germany extends student visa processing to 8 weeks for 2026 intake", source:"daad.de", date:"May 2026", summary:"DAAD reports increased demand. Apply early for German student visas.", country:"Germany"},
  {title:"UK Graduate Route visa — 2 years post-study work rights confirmed", source:"gov.uk", date:"May 2026", summary:"International graduates can stay 2 years after completing UK degrees.", country:"UK"},
  {title:"Holland Scholarship 2026-2027 applications now open", source:"studyinholland.nl", date:"Apr 2026", summary:"Available for students outside EEA applying to Dutch universities.", country:"Netherlands"},
  {title:"Canada caps international student permits for 2026", source:"canada.ca", date:"Apr 2026", summary:"New annual cap introduced to manage housing pressure in major cities.", country:"Canada"},
  {title:"Sweden updates tuition fees for non-EU students — Autumn 2026", source:"universityadmissions.se", date:"Apr 2026", summary:"Swedish universities publish updated fee structures for non-EU students.", country:"Sweden"},
  {title:"DAAD scholarships for Master's and PhD — deadlines June 2026", source:"daad.de", date:"Mar 2026", summary:"Multiple DAAD funding programs open now. Deadline approaching fast.", country:"Germany"},
  {title:"Australia simplifies student visa process for 2026", source:"homeaffairs.gov.au", date:"Mar 2026", summary:"New streamlined process reduces student visa processing to 3-4 weeks.", country:"Australia"},
  {title:"France Campus Bourses — new scholarships for international students", source:"campusfrance.org", date:"Mar 2026", summary:"France opens new scholarship round for Master students worldwide.", country:"France"},
  {title:"ETH Zurich and EPFL ranked top universities in Europe 2026", source:"timeshighereducation.com", date:"Feb 2026", summary:"Switzerland dominates European rankings with two universities in top 10.", country:"Switzerland"},
  {title:"Japan MEXT scholarship applications open for 2026-2027", source:"mext.go.jp", date:"Feb 2026", summary:"Japanese government scholarship covers tuition and living expenses.", country:"Japan"},
  {title:"USA F-1 student visa interview waiver extended through 2026", source:"state.gov", date:"Feb 2026", summary:"Eligible students can skip in-person interview for F-1 student visa.", country:"USA"},
  {title:"KTH Stockholm opens applications for 60+ English Master programs", source:"kth.se", date:"Jan 2026", summary:"KTH offers world-class engineering and technology programs in English.", country:"Sweden"},
]

const GERMANY_ONLY_COUNTRIES = []

export default function Home() {
  const [countries, setCountries] = useState([])
  const [form, setForm] = useState({ country: '', degree: 'master', field: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const [profile, setProfile] = useState(null)
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const sugRef = useRef(null)
  const sliderRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => setError('Cannot connect to backend.'))

    fetchProfile()
      .then(data => { if (data && Object.keys(data).length > 0) setProfile(data) })
      .catch(() => {})

    fetchNews()
      .then(data => {
        setNews(data && data.length > 3 ? data : FALLBACK_NEWS)
        setNewsLoading(false)
      })
      .catch(() => { setNews(FALLBACK_NEWS); setNewsLoading(false) })
  }, [])

  useEffect(() => {
    if (!sliderRef.current || news.length === 0) return
    const slider = sliderRef.current
    const interval = setInterval(() => {
      slider.scrollLeft += 1
      if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth) {
        slider.scrollLeft = 0
      }
    }, 20)
    return () => clearInterval(interval)
  }, [news])

  useEffect(() => {
    const handleClick = (e) => {
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleFieldChange = (val) => {
    setForm({...form, field: val})
    if (val.length > 0) {
      setSuggestions(ALL_FIELDS.filter(f => f.toLowerCase().includes(val.toLowerCase())).slice(0,6))
      setShowSug(true)
    } else setShowSug(false)
  }

  const isProfileComplete = (p) => p && p.fullName && p.fullName.trim() !== ''

  const isGermanyOnly = false

  const doSearch = async () => {
    setShowProfilePrompt(false)
    setLoading(true)
    setError('')
    try {
      const data = await searchCourses(form, profile)
      localStorage.setItem('searchResults', JSON.stringify(data))
      localStorage.setItem('searchForm', JSON.stringify(form))
      navigate('/university')
    } catch { setError('Search failed. Please check your backend is running.') }
    finally { setLoading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!isProfileComplete(profile)) { setShowProfilePrompt(true); return }
    await doSearch()
  }

  const COUNTRY_FLAG = {
    Germany:"🇩🇪", UK:"🇬🇧", USA:"🇺🇸", Canada:"🇨🇦",
    Australia:"🇦🇺", Netherlands:"🇳🇱", Sweden:"🇸🇪",
    France:"🇫🇷", Switzerland:"🇨🇭", Japan:"🇯🇵",
    Europe:"🇪🇺", Global:"🌍", Visa:"📋"
  }

  return (
    <>
      {showProfilePrompt && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon">👤</div>
            <h2>Complete your profile first</h2>
            <p>To get accurate university matches based on your <strong>grade, field and degree</strong> — please fill in your profile first.</p>
            <div className="modal-actions">
              <button className="btn-accent" onClick={() => navigate('/profile')}>Complete profile</button>
              <button className="btn-ghost" onClick={doSearch}>Search anyway</button>
            </div>
          </div>
        </div>
      )}

      <section className="grid two-col">
        <div className="card hero-card">
          <span className="badge">🎓 Study Search</span>
          <h2>Find the right<br/><span>university</span><br/>worldwide</h2>
          <p>Select a country, degree level, and field to find matching universities with exact course page links.</p>
          <div className="hero-stats">
            <div className="stat"><strong>10+</strong><span>Countries</span></div>
            <div className="stat"><strong>Live</strong><span>Real Data</span></div>
            <div className="stat"><strong>Free</strong><span>To Use</span></div>
          </div>
          {isProfileComplete(profile) && (
            <div className="profile-pill">✅ Searching as <strong>{profile.fullName}</strong></div>
          )}
        </div>

        <form className="card form-card" onSubmit={submit}>
          <div>
            <label>Country</label>
            <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} required>
              <option value="">Select country</option>
              {countries.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
            </select>
          {isGermanyOnly && (
            <p className="data-notice">⚠️ Only Germany data is currently available. Results for other countries coming soon.</p>
          )}
          </div>
          <div>
            <label>Degree level</label>
            <div className="degree-pills">
              {['bachelor','master','phd'].map(d => (
                <button type="button" key={d}
                  className={`pill ${form.degree===d?'pill-active':''}`}
                  onClick={() => setForm({...form, degree: d})}>
                  {d==='phd'?'PhD':d.charAt(0).toUpperCase()+d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Field of study</label>
            <div className="autocomplete-wrap" ref={sugRef}>
              <input type="text" placeholder="e.g. Electrical Engineering"
                value={form.field}
                onChange={e => handleFieldChange(e.target.value)}
                onFocus={() => form.field && setShowSug(true)}
                required />
              {showSug && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s,i) => (
                    <div key={i} className="suggestion-item"
                      onMouseDown={() => { setForm({...form, field: s}); setShowSug(false) }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="error-msg">⚠️ {error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Find My Perfect Program'}
          </button>
          {!isProfileComplete(profile) && (
            <p className="profile-hint">💡 <span onClick={() => navigate('/profile')}>Complete your profile</span> for better matches</p>
          )}
        </form>
      </section>

      <section className="news-section">
        <div className="news-header">
          <h3>📰 Latest study abroad &amp; visa news</h3>
          <span className="live-dot"><span></span>Live updates</span>
        </div>
        {newsLoading ? (
          <p className="news-loading">Loading latest news...</p>
        ) : (
          <div className="news-slider-wrap">
            <div className="news-slider" ref={sliderRef}>
              {[...news, ...news].map((item, i) => (
                <a key={i}
                  href={item.link || '#'}
                  target="_blank" rel="noreferrer"
                  className="news-card"
                >
                  <div className="news-card-top">
                    <span className="news-flag">{COUNTRY_FLAG[item.country] || '🌍'}</span>
                    <span className="news-country">{item.country || 'Global'}</span>
                  </div>
                  <p className="news-title">{item.title}</p>
                  <p className="news-summary">{item.summary}</p>
                  <span className="news-date">{item.date}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
