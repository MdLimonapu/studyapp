import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName:'', email:'', currentDegree:'', currentField:'',
    semester:'', universityName:'', grade:'', notes:'', avatarUrl:''
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('https://studyapp-backend-cal9.onrender.com/api/profile')
      .then(r => r.json())
      .then(data => { if (Object.keys(data).length) setProfile(p => ({...p, ...data})) })
      .catch(() => {})
  }, [])

  const completion = () => {
    const fields = ['fullName','email','currentDegree','currentField','grade']
    const filled = fields.filter(k => profile[k] && profile[k] !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setProfile(p => ({...p, avatarUrl: ev.target.result}))
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await fetch('https://studyapp-backend-cal9.onrender.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <section className="grid one-col-gap">

      <div className="card profile-header">
        <div className="avatar-wrap" onClick={() => fileRef.current.click()} title="Click to change photo" style={{cursor:'pointer',position:'relative',display:'inline-block'}}>
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt="avatar" style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',display:'block'}} />
            : <div className="avatar">{profile.fullName ? profile.fullName[0].toUpperCase() : '?'}</div>
          }
          <div style={{position:'absolute',bottom:0,right:0,background:'#00c9a7',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>📷</div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar} />
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
          {saved && <p style={{color:'#00c9a7',marginTop:8}}>✅ Profile saved!</p>}
        </div>
      </div>

      <form onSubmit={submit} className="grid one-col-gap">

        <div className="card">
          <h3>👤 Personal information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full name</label>
              <input placeholder="e.g. Md Limon" value={profile.fullName}
                onChange={e => { setProfile({...profile, fullName: e.target.value}); setSaved(false) }} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input placeholder="your@email.com" value={profile.email}
                onChange={e => { setProfile({...profile, email: e.target.value}); setSaved(false) }} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🎓 Your education</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Current degree</label>
              <select value={profile.currentDegree}
                onChange={e => { setProfile({...profile, currentDegree: e.target.value}); setSaved(false) }}>
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
                onChange={e => { setProfile({...profile, currentField: e.target.value}); setSaved(false) }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>University name</label>
              <input placeholder="e.g. FH Südwestfalen" value={profile.universityName}
                onChange={e => { setProfile({...profile, universityName: e.target.value}); setSaved(false) }} />
            </div>
            <div className="form-group">
              <label>Current semester</label>
              <input placeholder="e.g. 6" value={profile.semester}
                onChange={e => { setProfile({...profile, semester: e.target.value}); setSaved(false) }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grade / GPA</label>
              <input placeholder="e.g. 2.1 or 3.8" value={profile.grade}
                onChange={e => { setProfile({...profile, grade: e.target.value}); setSaved(false) }} />
            </div>
            <div className="form-group">
              <label>Additional notes</label>
              <input placeholder="Any extra info" value={profile.notes}
                onChange={e => { setProfile({...profile, notes: e.target.value}); setSaved(false) }} />
            </div>
          </div>
        </div>

        <button type="submit" className={saved ? 'btn-saved' : ''} disabled={saving}>
          {saving ? '💾 Saving...' : saved ? '✅ Saved' : 'Save & find universities →'}
        </button>

      </form>
    </section>
  )
}
