import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { fetchCountries, fetchFields, fetchProfile, fetchNews, searchCourses } from '../api'

const FALLBACK_NEWS = [
  {title:"Germany extends student visa processing to 8 weeks for 2026 intake", source:"daad.de", date:"May 2026", summary:"DAAD reports increased demand. Apply early for German student visas.", country:"Germany", link: "https://www.daad.de"},
  {title:"UK Graduate Route visa — 2 years post-study work rights confirmed", source:"gov.uk", date:"May 2026", summary:"International graduates can stay 2 years after completing UK degrees.", country:"UK", link: "https://www.gov.uk/graduate-visa"},
  {title:"Holland Scholarship 2026-2027 applications now open", source:"studyinholland.nl", date:"Apr 2026", summary:"Available for students outside EEA applying to Dutch universities.", country:"Netherlands", link: "https://www.studyinholland.nl"},
  {title:"Canada caps international student permits for 2026", source:"canada.ca", date:"Apr 2026", summary:"New annual cap introduced to manage housing pressure in major cities.", country:"Canada", link: "https://www.canada.ca"},
  {title:"Sweden updates tuition fees for non-EU students — Autumn 2026", source:"universityadmissions.se", date:"Apr 2026", summary:"Swedish universities publish updated fee structures for non-EU students.", country:"Sweden", link: "https://www.universityadmissions.se"},
  {title:"DAAD scholarships for Master's and PhD — deadlines June 2026", source:"daad.de", date:"Mar 2026", summary:"Multiple DAAD funding programs open now. Deadline approaching fast.", country:"Germany", link: "https://www.daad.de"},
  {title:"Australia simplifies student visa process for 2026", source:"homeaffairs.gov.au", date:"Mar 2026", summary:"New streamlined process reduces student visa processing to 3-4 weeks.", country:"Australia", link: "https://immi.homeaffairs.gov.au"},
  {title:"France Campus Bourses — new scholarships for international students", source:"campusfrance.org", date:"Mar 2026", summary:"France opens new scholarship round for Master students worldwide.", country:"France", link: "https://www.campusfrance.org"},
  {title:"ETH Zurich and EPFL ranked top universities in Europe 2026", source:"timeshighereducation.com", date:"Feb 2026", summary:"Switzerland dominates European rankings with two universities in top 10.", country:"Switzerland", link: "https://www.timeshighereducation.com"},
  {title:"Japan MEXT scholarship applications open for 2026-2027", source:"mext.go.jp", date:"Feb 2026", summary:"Japanese government scholarship covers tuition and living expenses.", country:"Japan", link: "https://www.mext.go.jp"},
  {title:"USA F-1 student visa interview waiver extended through 2026", source:"state.gov", date:"Feb 2026", summary:"Eligible students can skip in-person interview for F-1 student visa.", country:"USA", link: "https://travel.state.gov"},
  {title:"KTH Stockholm opens applications for 60+ English Master programs", source:"kth.se", date:"Jan 2026", summary:"KTH offers world-class engineering and technology programs in English.", country:"Sweden", link: "https://www.kth.se"}
]

const GERMANY_ONLY_COUNTRIES = []
const POPULAR_FIELDS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Data Science", "Business Administration", "Medicine", "Architecture",
  "Artificial Intelligence", "Economics", "Physics", "Mathematics", "Law"
]

export default function Home() {
  const { user, isLoaded } = useUser()
  const [countries, setCountries] = useState([])
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('searchForm')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          return {
            country: parsed.country || '',
            degree: parsed.degree || 'master',
            field: parsed.field || ''
          }
        }
      } catch (e) {}
    }
    return { country: '', degree: 'master', field: '' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [allFields, setAllFields] = useState([])
  const [showSug, setShowSug] = useState(false)
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const [profile, setProfile] = useState(null)
  const [useProfile, setUseProfile] = useState(true)
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const sugRef = useRef(null)
  const sliderRef = useRef(null)
  const formRef = useRef(null)
  const countryRef = useRef(null)
  const degreeRef = useRef(null)
  const fieldInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const focus = params.get('focus')
    const val = params.get('val')
    if (focus && val !== null) {
      setForm({
        country: focus === 'country' ? val : '',
        degree: focus === 'degree' ? val : '',
        field: focus === 'field' ? val : ''
      })

      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      
      setTimeout(() => {
        if (focus === 'country' && countryRef.current) {
          countryRef.current.focus()
        } else if (focus === 'degree' && degreeRef.current) {
          // focus the active pill or first pill button
          const activePill = degreeRef.current.querySelector('.pill-active') || degreeRef.current.querySelector('.pill')
          if (activePill) activePill.focus()
        } else if (focus === 'field' && fieldInputRef.current) {
          fieldInputRef.current.focus()
        }
      }, 400)
    }
    document.title = 'Studplex — Discover the Right University, Worldwide'
  }, [])

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => setError('Cannot connect to backend.'))

    fetchFields()
      .then(setAllFields)
      .catch(() => setAllFields(POPULAR_FIELDS))

    fetchNews()
      .then(data => {
        setNews(data && data.length > 3 ? data : FALLBACK_NEWS)
        setNewsLoading(false)
      })
      .catch(() => { setNews(FALLBACK_NEWS); setNewsLoading(false) })
  }, [])

  // Fetch Clerk user profile and pre-fill search details
  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        setProfile(null)
        return
      }
      const email = user.primaryEmailAddress?.emailAddress || ""
      fetchProfile(email)
        .then(data => { 
          if (data && Object.keys(data).length > 0) {
            setProfile(data)
            // Pre-fill degree & field from profile ONLY if not returning with a specific focus query parameter
            const params = new URLSearchParams(window.location.search)
            if (!params.get('focus')) {
              setForm(prev => ({
                ...prev,
                degree: data.currentDegree ? data.currentDegree.toLowerCase() : prev.degree,
                field: data.currentField || prev.field
              }))
            }
          }
        })
        .catch(() => {})
    }
  }, [user, isLoaded])

  // Re-fetch fields when country changes, and handle prefill scroll
  useEffect(() => {
    if (countries.length > 0) {
      const prefill = localStorage.getItem('prefillCountry')
      if (prefill) {
        setForm(prev => ({ ...prev, country: prefill }))
        localStorage.removeItem('prefillCountry')
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      }
    }
  }, [countries])

  useEffect(() => {
    fetchFields(form.country)
      .then(setAllFields)
      .catch(() => {})
  }, [form.country])

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
      const query = val.toLowerCase().trim()
      
      // 1. Exact start matching (e.g. typing 'e' matches 'Electrical Engineering' first)
      const startsWithQuery = allFields.filter(f => f.toLowerCase().startsWith(query))
      
      // 2. Word boundary starting matches (e.g. typing 'e' matches 'Software Engineering' next)
      const wordStartsWithQuery = allFields.filter(f => {
        const lower = f.toLowerCase()
        if (lower.startsWith(query)) return false
        return lower.split(/\s+/).some(word => word.startsWith(query))
      })
      
      // 3. Contains query anywhere else
      const containsQuery = allFields.filter(f => {
        const lower = f.toLowerCase()
        return lower.includes(query) && 
               !lower.startsWith(query) && 
               !lower.split(/\s+/).some(word => word.startsWith(query))
      })

      // Combine and remove duplicates while preserving order
      const combined = Array.from(new Set([...startsWithQuery, ...wordStartsWithQuery, ...containsQuery]))
      setSuggestions(combined.slice(0, 5))
      setShowSug(true)
    } else setShowSug(false)
  }

  const isProfileComplete = (p) => p && p.fullName && p.fullName.trim() !== ''

  const isGermanyOnly = false

  const doSearch = async (bypassProfile = false) => {
    setShowProfilePrompt(false)
    setLoading(true)
    setError('')
    try {
      const activeProfile = bypassProfile ? null : (useProfile ? profile : null)
      const data = await searchCourses(form, activeProfile)
      localStorage.setItem('searchResults', JSON.stringify(data))
      localStorage.setItem('searchForm', JSON.stringify(form))
      navigate('/university')
    } catch { setError('Search failed. Please check your backend is running.') }
    finally { setLoading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!isProfileComplete(profile) && useProfile) { setShowProfilePrompt(true); return }
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
              <button className="btn-ghost" onClick={() => doSearch(true)}>Search anyway</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .home-search-grid {
          display: grid;
          grid-template-columns: 50% 40%;
          gap: 10%;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .home-search-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>

      <section className="home-search-grid">
        <div className="card hero-card">
          <h2>Find the right<br/><span>university</span><br/>worldwide</h2>
          <p>Match with your dream international university program in seconds.</p>
          <div className="hero-stats">
            <div className="stat"><strong>10+</strong><span>Countries</span></div>
            <div className="stat"><strong>Live</strong><span>Real Data</span></div>
            <div className="stat"><strong>Free</strong><span>To Use</span></div>
          </div>
        </div>

        <form ref={formRef} className="card form-card" onSubmit={submit}>
          <div>
            <label>Country</label>
            <select ref={countryRef} value={form.country} onChange={e => setForm({...form, country: e.target.value})} required>
              <option value="">Select country</option>
              {countries.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
            </select>
          {isGermanyOnly && (
            <p className="data-notice">⚠️ Only Germany data is currently available. Results for other countries coming soon.</p>
          )}
          </div>
          <div>
            <label>Degree level</label>
            <div className="degree-pills" ref={degreeRef}>
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
              <input ref={fieldInputRef} type="text" placeholder="e.g. Electrical Engineering"
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
            {isProfileComplete(profile) && (
              useProfile ? (
                <div className="profile-pill-interactive" onClick={() => setUseProfile(false)} title="Click to search without profile info">
                  <span className="profile-pill-text">Searching as <strong>{profile.fullName}</strong></span>
                  <span className="profile-pill-close">×</span>
                </div>
              ) : (
                <p className="profile-hint" style={{ textAlign: 'left', marginTop: 8 }}>
                  💡 <span onClick={() => setUseProfile(true)}>Use profile matches</span> for better results
                </p>
              )
            )}
          </div>
          {error && <p className="error-msg">⚠️ {error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Find My Perfect Program'}
          </button>
          
          {user && !isProfileComplete(profile) && (
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
                  <div className="news-card-bottom">
                    <span className="news-date">{item.date}</span>
                    {item.source && <span className="news-source">{item.source}</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
