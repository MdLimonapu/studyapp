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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? ''
    : 'Please enter a valid email address.'
}

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName: '', email: '', currentDegree: '', currentField: '',
    semester: '', universityName: '', grade: '', notes: '', avatarUrl: ''
  })
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [emailError, setEmailError] = useState('')
  const [fieldSugs, setFieldSugs]   = useState([])
  const [showSugs, setShowSugs]     = useState(false)
  const fieldRef = useRef(null)
  const fileRef  = useRef(null)

  useEffect(() => {
    fetchProfile()
      .then(data => { if (Object.keys(data).length) setProfile(p => ({ ...p, ...data })) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target)) setShowSugs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const completion = () => {
    const keys = ['fullName', 'email', 'currentDegree', 'currentField', 'grade']
    return Math.round(keys.filter(k => profile[k]?.trim()).length / keys.length * 100)
  }

  const set = (key, val) => {
    setProfile(p => ({ ...p, [key]: val }))
    setSaved(false)
  }

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('avatarUrl', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleFieldInput = (val) => {
    set('currentField', val)
    if (val.length > 0) {
      setFieldSugs(FIELD_OPTIONS.filter(f => f.toLowerCase().includes(val.toLowerCase())).slice(0, 5))
      setShowSugs(true)
    } else {
      setShowSugs(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = validateEmail(profile.email)
    if (err) { setEmailError(err); return }
    setSaving(true)
    await saveProfile(profile)
    setSaving(false)
    setSaved(true)
  }

  const pct = completion()

  return (
    <div className="profile-page">

      {/* Page header */}
      <div className="profile-page-header">
        <div className="profile-page-header-left">
          <p className="profile-page-eyebrow">Student Profile</p>
          <h1 className="profile-page-title">Your Academic Profile</h1>
          <p className="profile-page-sub">
            Complete your profile so StudyFinder can surface the most relevant
            degree programs for your background, goals, and qualifications.
          </p>
        </div>
        <div className="profile-completion-widget">
          <div className="pct-ring-wrap">
            <svg viewBox="0 0 36 36" className="pct-ring-svg">
              <path className="pct-ring-track"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="pct-ring-fill"
                strokeDasharray={`${pct}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="pct-ring-num">{pct}%</span>
          </div>
          <div className="profile-completion-meta">
            <p className="pct-label">Profile completeness</p>
            <p className="pct-sublabel">
              {pct === 100
                ? 'Your profile is ready for AI matching.'
                : 'Complete all fields for the best matches.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} noValidate>

        {/* Avatar card */}
        <div className="card profile-avatar-card">
          <div className="profile-avatar-inner">
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => fileRef.current.click()}
              aria-label="Upload profile photo"
            >
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="Profile" className="avatar-img" />
                : <div className="avatar-initials">
                    {profile.fullName ? profile.fullName[0].toUpperCase() : 'A'}
                  </div>
              }
              <span className="avatar-upload-label">Change photo</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
            <div className="avatar-identity">
              <p className="avatar-display-name">{profile.fullName || 'Your full name'}</p>
              <p className="avatar-display-email">{profile.email || 'Add your email address below'}</p>
              <p className="avatar-upload-hint">
                JPG or PNG, maximum 2 MB. Your photo is stored locally.
              </p>
            </div>
          </div>
          {saved && (
            <div className="save-success-banner">
              Profile saved successfully.
            </div>
          )}
        </div>

        {/* Section 01 — Personal Information */}
        <div className="card profile-section-card">
          <div className="section-header">
            <div className="section-number">01</div>
            <div>
              <h2 className="section-title">Personal Information</h2>
              <p className="section-desc">
                Your name and email are used to personalise results and save your preferences.
              </p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. James Anderson"
                value={profile.fullName}
                onChange={e => set('fullName', e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="e.g. james.anderson@university.edu"
                value={profile.email}
                onChange={e => {
                  set('email', e.target.value)
                  setEmailError(validateEmail(e.target.value))
                }}
                className={emailError ? 'input-invalid' : ''}
                autoComplete="email"
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>
          </div>
        </div>

        {/* Section 02 — Academic Background */}
        <div className="card profile-section-card">
          <div className="section-header">
            <div className="section-number">02</div>
            <div>
              <h2 className="section-title">Academic Background</h2>
              <p className="section-desc">
                Tell us about your current studies so we can match you with the right programs worldwide.
              </p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currentDegree">Current Degree Level</label>
              <select
                id="currentDegree"
                value={profile.currentDegree}
                onChange={e => set('currentDegree', e.target.value)}
              >
                <option value="">Select your current level</option>
                <option value="High School">High School / Secondary</option>
                <option value="Foundation">Foundation / Pre-university</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">PhD / Doctorate</option>
                <option value="Diploma">Diploma or Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" ref={fieldRef}>
              <label htmlFor="currentField">Field of Study</label>
              <div className="autocomplete-wrap">
                <input
                  id="currentField"
                  type="text"
                  placeholder="e.g. Computer Science, Economics"
                  value={profile.currentField}
                  onChange={e => handleFieldInput(e.target.value)}
                  onFocus={() => profile.currentField && setShowSugs(true)}
                  autoComplete="off"
                />
                {showSugs && fieldSugs.length > 0 && (
                  <div className="suggestions-dropdown">
                    {fieldSugs.map((s, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onMouseDown={() => { set('currentField', s); setShowSugs(false) }}
                      >
                        <span>→</span> {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="universityName">Current University or Institution</label>
              <input
                id="universityName"
                type="text"
                placeholder="e.g. University of Toronto, ETH Zurich, NUS"
                value={profile.universityName}
                onChange={e => set('universityName', e.target.value)}
              />
              <span className="field-hint">
                Enter the full name of your current or most recent institution.
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="semester">Current Semester or Year</label>
              <input
                id="semester"
                type="text"
                placeholder="e.g. Year 2, Semester 4, Final year"
                value={profile.semester}
                onChange={e => set('semester', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grade">Academic Grade or GPA</label>
              <input
                id="grade"
                type="text"
                placeholder="e.g. 3.8 / 4.0 GPA, First Class, 85%"
                value={profile.grade}
                onChange={e => set('grade', e.target.value)}
              />
              <span className="field-hint">
                Enter your GPA, percentage, or grade classification as used in your country.
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Additional Information</label>
              <input
                id="notes"
                type="text"
                placeholder="e.g. Research interests, language skills, work experience"
                value={profile.notes}
                onChange={e => set('notes', e.target.value)}
              />
              <span className="field-hint">
                Optional. Anything else that may help match you to a program.
              </span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="profile-form-footer">
          <p className="profile-form-footer-note">
            Your profile is saved to this device. It is used only to personalise your search results.
          </p>
          <button
            type="submit"
            id="save-profile-btn"
            className={`btn-save-profile ${saved ? 'btn-save-profile--saved' : ''}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  )
}
