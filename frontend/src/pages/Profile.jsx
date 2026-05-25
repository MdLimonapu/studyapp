import { useEffect, useState, useRef } from 'react'
import { fetchProfile, saveProfile } from '../api'

const FIELD_OPTIONS = [
  "Artificial Intelligence", "Aerospace Engineering", "Architecture",
  "Biomedical Engineering", "Business Administration", "Chemical Engineering",
  "Civil Engineering", "Computer Science", "Cybersecurity",
  "Data Science", "Economics", "Electrical Engineering",
  "Environmental Engineering", "Finance", "Information Technology",
  "Law", "Marketing", "Mathematics", "Mechanical Engineering",
  "Medicine", "Nursing", "Physics", "Psychology", "Robotics",
  "Software Engineering", "Telecommunications", "Urban Planning",
  "International Relations", "Public Health", "Supply Chain Management",
]

function validateEmail(email) {
  if (!email) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address.'
}

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName: '', email: '', currentDegree: '', currentField: '',
    semester: '', universityName: '', grade: '', notes: '', avatarUrl: ''
  })
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [emailError, setEmailError] = useState('')
  const [fieldSugs, setFieldSugs]   = useState([])
  const [showSugs, setShowSugs]     = useState(false)
  const fieldRef = useRef(null)
  const fileRef  = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    fetchProfile()
      .then(data => {
        if (data && Object.keys(data).length) setProfile(p => ({ ...p, ...data }))
        setInitialLoaded(true)
      })
      .catch(() => setInitialLoaded(true))
  }, [])

  useEffect(() => {
    if (!initialLoaded) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaving(true)
    setSaved(false)
    debounceRef.current = setTimeout(() => {
      saveProfile(profile).then(() => {
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      })
    }, 1000)
  }, [profile, initialLoaded])

  useEffect(() => {
    const handler = (e) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target)) setShowSugs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pct = () => {
    const keys = ['fullName', 'email', 'currentDegree', 'currentField', 'grade']
    return Math.round(keys.filter(k => profile[k]?.trim()).length / keys.length * 100)
  }

  const set = (key, val) => { setProfile(p => ({ ...p, [key]: val })) }

  const handleAvatar = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('avatarUrl', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleFieldInput = (val) => {
    set('currentField', val)
    setFieldSugs(val.length > 0
      ? FIELD_OPTIONS.filter(f => f.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      : [])
    setShowSugs(val.length > 0)
  }


  const p = pct()
  const circumference = 100
  const dash = (p / 100) * circumference

  return (
    <div className="pf-layout">

      {/* ── Left sidebar ── */}
      <aside className="pf-sidebar">

        <div className="pf-avatar-card">
          <button type="button" className="pf-avatar-btn" onClick={() => fileRef.current.click()}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="Profile" className="pf-avatar-img" />
              : <div className="pf-avatar-initials">
                  {profile.fullName ? profile.fullName[0].toUpperCase() : 'A'}
                </div>
            }
            <span className="pf-avatar-overlay">Upload photo</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />

          <div className="pf-avatar-info">
            <p className="pf-avatar-name">{profile.fullName || 'Your Name'}</p>
            <p className="pf-avatar-email">{profile.email || 'No email added yet'}</p>
          </div>
        </div>

        <div className="pf-completion-card">
          <div className="pf-ring-wrap">
            <svg viewBox="0 0 36 36" className="pf-ring-svg">
              <circle className="pf-ring-bg" cx="18" cy="18" r="15.9" />
              <circle
                className="pf-ring-prog"
                cx="18" cy="18" r="15.9"
                strokeDasharray={`${(p / 100) * 99.9}, 100`}
                strokeDashoffset="25"
              />
            </svg>
            <span className="pf-ring-pct">{p}%</span>
          </div>
          <p className="pf-completion-label">Profile complete</p>
          <p className="pf-completion-hint">
            {p === 100
              ? 'Ready for personalised matching.'
              : 'Fill in all fields for the best university matches.'}
          </p>

          <div className="pf-checklist">
            {[
              ['Full name',    !!profile.fullName],
              ['Email',        !!profile.email],
              ['Degree level', !!profile.currentDegree],
              ['Field',        !!profile.currentField],
              ['Grade / GPA',  !!profile.grade],
            ].map(([label, done]) => (
              <div key={label} className={`pf-check-item ${done ? 'pf-check-done' : ''}`}>
                <span className="pf-check-dot" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop: 16, fontSize: 13, fontWeight: 600, color: saving ? 'var(--muted)' : (saved ? 'var(--accent)' : 'transparent'), transition: 'color 0.3s'}}>
            {saving ? 'Saving changes...' : (saved ? '✓ All changes saved' : ' ')}
          </div>
        </div>

        <div className="pf-tip-card">
          <p className="pf-tip-label">Why complete your profile?</p>
          <p className="pf-tip-text">
            Studplex uses your academic background to rank and personalise
            university results — the more detail you provide, the better the matches.
          </p>
        </div>

      </aside>

      {/* ── Right form ── */}
      <form className="pf-form" onSubmit={e => e.preventDefault()} noValidate>

        {/* Section 01 */}
        <div className="pf-section-card">
          <div className="pf-section-head">
            <span className="pf-section-num">01</span>
            <div>
              <h2 className="pf-section-title">Personal Information</h2>
              <p className="pf-section-desc">Used to personalise your experience and save your preferences.</p>
            </div>
          </div>
          <div className="pf-divider" />
          <div className="pf-fields-grid">
            <div className="pf-field">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" type="text" placeholder="e.g. James Anderson"
                value={profile.fullName} onChange={e => set('fullName', e.target.value)}
                autoComplete="name" />
            </div>
            <div className="pf-field">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="e.g. james@university.edu"
                value={profile.email}
                onChange={e => { set('email', e.target.value); setEmailError(validateEmail(e.target.value)) }}
                className={emailError ? 'pf-input-error' : ''}
                autoComplete="email" />
              {emailError && <span className="pf-error-msg">{emailError}</span>}
            </div>
          </div>
        </div>

        {/* Section 02 */}
        <div className="pf-section-card">
          <div className="pf-section-head">
            <span className="pf-section-num">02</span>
            <div>
              <h2 className="pf-section-title">Academic Background</h2>
              <p className="pf-section-desc">Your current studies help us match you with the right programs worldwide.</p>
            </div>
          </div>
          <div className="pf-divider" />
          <div className="pf-fields-grid">
            <div className="pf-field">
              <label htmlFor="currentDegree">Current Degree Level</label>
              <select id="currentDegree" value={profile.currentDegree}
                onChange={e => set('currentDegree', e.target.value)}>
                <option value="">Select your level</option>
                <option value="High School">High School / Secondary</option>
                <option value="Foundation">Foundation / Pre-university</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">PhD / Doctorate</option>
                <option value="Diploma">Diploma or Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="pf-field" ref={fieldRef}>
              <label htmlFor="currentField">Field of Study</label>
              <div className="autocomplete-wrap">
                <input id="currentField" type="text"
                  placeholder="e.g. Computer Science, Economics"
                  value={profile.currentField}
                  onChange={e => handleFieldInput(e.target.value)}
                  onFocus={() => profile.currentField && setShowSugs(true)}
                  autoComplete="off" />
                {showSugs && fieldSugs.length > 0 && (
                  <div className="suggestions-dropdown">
                    {fieldSugs.map((s, i) => (
                      <div key={i} className="suggestion-item"
                        onMouseDown={() => { set('currentField', s); setShowSugs(false) }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pf-fields-grid">
            <div className="pf-field">
              <label htmlFor="universityName">Current University or Institution</label>
              <input id="universityName" type="text"
                placeholder="e.g. University of Toronto, ETH Zurich, NUS"
                value={profile.universityName}
                onChange={e => set('universityName', e.target.value)} />
              <span className="pf-hint">Enter the full name of your current or most recent institution.</span>
            </div>
            <div className="pf-field">
              <label htmlFor="semester">Current Semester or Year</label>
              <input id="semester" type="text"
                placeholder="e.g. Year 2, Semester 4, Final year"
                value={profile.semester}
                onChange={e => set('semester', e.target.value)} />
            </div>
          </div>

          <div className="pf-fields-grid">
            <div className="pf-field">
              <label htmlFor="grade">Academic Grade or GPA</label>
              <input id="grade" type="text"
                placeholder="e.g. 3.8 / 4.0 GPA, First Class, 85%"
                value={profile.grade}
                onChange={e => set('grade', e.target.value)} />
              <span className="pf-hint">Enter your GPA, percentage, or grade classification as used in your country.</span>
            </div>
            <div className="pf-field">
              <label htmlFor="notes">Additional Information</label>
              <input id="notes" type="text"
                placeholder="e.g. Research interests, language skills"
                value={profile.notes}
                onChange={e => set('notes', e.target.value)} />
              <span className="pf-hint">Optional. Anything else that may help find a better match.</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
