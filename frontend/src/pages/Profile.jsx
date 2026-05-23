import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName:'', email:'', currentDegree:'', currentField:'',
    semester:'', universityName:'', grade:'', notes:''
  })
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('https://studyapp-backend-cal9.onrender.com/api/profile')
      .then(r => r.json())
      .then(data => { if (Object.keys(data).length) setProfile(data) })
      .catch(() => {})
  }, [])

  const completion = () => {
    const filled = Object.values(profile).filter(v => v !== '').length
    return Math.round((filled / Object.keys(profile).length) * 100)
  }

  const submit = async (e) => {
    e.preventDefault()
    await fetch('https://studyapp-backend-cal9.onrender.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
    setSaved(true)
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <section className="grid one-col-gap">

      <div className="card profile-header">
        <div className="avatar">
          {profile.fullName ? profile.fullName[0].toUpperCase() : '?'}
        </div>
        <div>
          <h2>{profile.fullName || 'Your Profile'}</h2>
          <p>{profile.email || 'Complete your profile for better matching'}</p>
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{width: completion() + '%'}}></div>
            </div>
            <span>{completion()}% complete</span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid one-col-gap">

        <div className="card">
          <h3>👤 Personal information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full name</label>
              <input placeholder="e.g. Md Limon" value={profile.fullName}
                onChange={e => setProfile({...profile, fullName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input placeholder="your@email.com" value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🎓 Your education</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Current degree</label>
              <select value={profile.currentDegree}
                onChange={e => setProfile({...profile, currentDegree: e.target.value})}>
                <option value="">Select degree</option>
                <option>Bachelor</option>
                <option>Master</option>
                <option>PhD</option>
                <option>Apprenticeship</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Field of study</label>
              <input placeholder="e.g. Electrical Engineering" value={profile.currentField}
                onChange={e => setProfile({...profile, currentField: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>University name</label>
              <input placeholder="e.g. FH Südwestfalen" value={profile.universityName}
                onChange={e => setProfile({...profile, universityName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Current semester</label>
              <input placeholder="e.g. 6" value={profile.semester}
                onChange={e => setProfile({...profile, semester: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grade / GPA</label>
              <input placeholder="e.g. 2.1 or 3.8" value={profile.grade}
                onChange={e => setProfile({...profile, grade: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Additional notes</label>
              <input placeholder="Any extra info" value={profile.notes}
                onChange={e => setProfile({...profile, notes: e.target.value})} />
            </div>
          </div>
        </div>

        <button type="submit" className={saved ? 'btn-saved' : ''}>
          {saved ? '✅ Saved! Redirecting...' : 'Save & find universities →'}
        </button>

      </form>
    </section>
  )
}
