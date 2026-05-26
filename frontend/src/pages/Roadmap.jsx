import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ROADMAPS = {
  'Germany': {
    flag: '🇩🇪',
    steps: [
      { id: 1, title: 'Check University Admission Qualification', desc: 'Verify if your high school diploma or previous university degrees qualify you for direct admission in Germany.', critical: true },
      { id: 2, title: 'Pass Language Proficiency (English/German)', desc: 'Obtain required scores (e.g. IELTS 6.5+ for English programs, or TestDaF for German programs).', critical: true },
      { id: 3, title: 'Prepare Transcripts & Motivation Letter', desc: 'Get your academic transcripts translated. Write a compelling Letter of Motivation.', critical: true },
      { id: 4, title: 'Submit Applications via Uni-Assist or Direct Portal', desc: 'Send your application through the centralized Uni-Assist platform or directly to the university.', critical: true },
      { id: 5, title: 'Secure Blocked Account & Visa', desc: 'Deposit the required living funds (approx. €11,900) into a blocked account and book your visa interview.', critical: true }
    ]
  },
  'UK': {
    flag: '🇬🇧',
    steps: [
      { id: 1, title: 'Take English Language Test (IELTS/PTE)', desc: 'Take a recognized English proficiency test. Usually, an IELTS score of 6.0 - 7.0 is required.', critical: true },
      { id: 2, title: 'Write Personal Statement & Request References', desc: 'Draft an essay explaining your academic interest. Ask teachers or employers for reference letters.', critical: true },
      { id: 3, title: 'Submit Application via UCAS or Portal', desc: 'Apply through UCAS for Bachelor courses, or apply directly on the university portal for Master/PhD programs.', critical: true },
      { id: 4, title: 'Receive CAS Certificate & Apply for Visa', desc: 'Accept your offer, pay the deposit to receive your CAS letter, and submit your student visa application.', critical: true }
    ]
  },
  'USA': {
    flag: '🇺🇸',
    steps: [
      { id: 1, title: 'Take TOEFL/IELTS English Exam', desc: 'Take an English proficiency test. US universities widely prefer TOEFL but accept IELTS (6.5+).', critical: true },
      { id: 2, title: 'Draft Essays & Request Recommendations', desc: 'Write your Statement of Purpose (SOP). Request letters of recommendation from 2-3 academic referees.', critical: true },
      { id: 3, title: 'Submit Applications & Pay Fees', desc: 'Submit applications via Common App or direct portals. Pay university application fees ($50-$100 per school).', critical: true },
      { id: 4, title: 'Obtain Form I-20 & Book Visa Interview', desc: 'Submit bank statements to prove financial support, get your Form I-20, and attend the student visa interview.', critical: true }
    ]
  },
  'Canada': {
    flag: '🇨🇦',
    steps: [
      { id: 1, title: 'Take IELTS Academic Test', desc: 'For streamlined visa processing (SDS stream), you must score a minimum of 6.0 in all bands of IELTS Academic.', critical: true },
      { id: 2, title: 'Prepare Transcripts & Study Plan (SOP)', desc: 'Gather certified academic records and write a detailed Study Plan explaining your academic intentions in Canada.', critical: true },
      { id: 3, title: 'Submit Application directly to University', desc: 'Apply directly via the university online portal and pay the application fee ($100-$150 CAD).', critical: true },
      { id: 4, title: 'Purchase GIC & Apply for Study Permit', desc: 'Purchase a GIC of $20,635 CAD from an approved bank and submit your Canadian Study Permit application.', critical: true }
    ]
  },
  'Australia': {
    flag: '🇦🇺',
    steps: [
      { id: 1, title: 'Pass IELTS or PTE Academic Test', desc: 'Take a recognized English test. IELTS Academic (6.0 - 6.5) or PTE Academic (50 - 58) is standard.', critical: true },
      { id: 2, title: 'Complete Genuine Student (GS) Statements', desc: 'Address the Genuine Student requirement by detailing your career goals and course relevance.', critical: true },
      { id: 3, title: 'Submit Application & Pay Deposit', desc: 'Apply directly or via agent, pay the tuition deposit, and obtain your Confirmation of Enrolment (CoE).', critical: true },
      { id: 4, title: 'Purchase OSHC Health Cover & Get Visa', desc: 'Purchase Overseas Student Health Cover and apply online for your Student Visa (Subclass 500).', critical: true }
    ]
  },
  'Netherlands': {
    flag: '🇳🇱',
    steps: [
      { id: 1, title: 'Register on Studielink.nl', desc: 'Create an account on the centralized Dutch national student portal and select your target programs.', critical: true },
      { id: 2, title: 'Upload Documents & Pass English Test', desc: 'Submit transcripts on university portal. Provide IELTS (6.5+) or TOEFL score.', critical: true },
      { id: 3, title: 'Accept Offer & Deposit Living Funds', desc: 'Once accepted, pay the tuition invoice and deposit living funds (~€12,000) for university verification.', critical: true },
      { id: 4, title: 'Let University Handle Visa Application', desc: 'The university applies for your student visa (MVV/VVR) on your behalf after checking financial records.', critical: true }
    ]
  },
  'Sweden': {
    flag: '🇸🇪',
    steps: [
      { id: 1, title: 'Register on Universityadmissions.se', desc: 'Create an account on Sweden’s centralized portal. Select up to 4 programs.', critical: true },
      { id: 2, title: 'Upload Academic Records & English Test', desc: 'Upload certified academic transcripts, diplomas, and English test scores (IELTS Academic 6.5+).', critical: true },
      { id: 3, title: 'Pay Application Fee (SEK 900)', desc: 'Pay the application fee of SEK 900 online so Swedish admissions will process your files.', critical: true },
      { id: 4, title: 'Pay First Semester Tuition & Get Visa', desc: 'Accept your offer, pay the first semester fee directly, and apply for your study residence permit.', critical: true }
    ]
  },
  'France': {
    flag: '🇫🇷',
    steps: [
      { id: 1, title: 'Register on Campus France Portal', desc: 'Create an account on the Etudes en France portal for your country to select programs.', critical: true },
      { id: 2, title: 'Submit Language Test (English/French)', desc: 'Submit DELF/DALF for French programs, or IELTS/TOEFL for English-taught programs.', critical: true },
      { id: 3, title: 'Attend Campus France Academic Interview', desc: 'Schedule and attend the mandatory academic interview at your local Campus France office.', critical: true },
      { id: 4, title: 'Accept Offer & Apply for student Visa', desc: 'Confirm your choice on the portal and apply for your student visa showing proof of funds (~€615/month).', critical: true }
    ]
  },
  'Switzerland': {
    flag: '🇨🇭',
    steps: [
      { id: 1, title: 'Verify Course Language & Pass Test', desc: 'Confirm program language and take Goethe/DELF (German/French) or IELTS/TOEFL (English).', critical: true },
      { id: 2, title: 'Submit Online Application Directly', desc: 'Apply directly via the university online application system and pay fee (CHF 100 - CHF 200).', critical: true },
      { id: 3, title: 'Confirm Admission & Show Swiss Bank Funds', desc: 'Show CHF 20,000 available in a bank account under your name at a bank recognized in Switzerland.', critical: true },
      { id: 4, title: 'Apply for National Visa D', desc: 'Book visa appointment at Swiss consulate and bring your registration letter and bank statements.', critical: true }
    ]
  },
  'Japan': {
    flag: '🇯🇵',
    steps: [
      { id: 1, title: 'Language Certification (Japanese/English)', desc: 'Japanese-taught courses require JLPT N2/N1. English-taught courses require TOEFL/IELTS.', critical: true },
      { id: 2, title: 'Submit Application directly to University', desc: 'Apply directly to the Japanese university online or mail physical documents.', critical: true },
      { id: 3, title: 'Receive Admission & Request COE', desc: 'Submit documents for the university to apply for your COE (Certificate of Eligibility) at Japan Immigration.', critical: true },
      { id: 4, title: 'Receive COE & Get Embassy Visa', desc: 'Take your physical COE card and university admission letter to the Japanese embassy to receive your visa.', critical: true }
    ]
  }
}

export default function Roadmap() {
  const [selectedCountry, setSelectedCountry] = useState('Germany')
  const [completedSteps, setCompletedSteps] = useState({})
  const navigate = useNavigate()

  // Load completed steps from localStorage on mount
  useEffect(() => {
    const loaded = {}
    Object.keys(ROADMAPS).forEach(country => {
      try {
        const stored = localStorage.getItem(`roadmap_${country}`)
        loaded[country] = stored ? JSON.parse(stored) : {}
      } catch {
        loaded[country] = {}
      }
    })
    setCompletedSteps(loaded)
  }, [])

  const currentRoadmap = ROADMAPS[selectedCountry]
  const currentCompleted = completedSteps[selectedCountry] || {}

  const handleToggleStep = (stepId) => {
    const updatedCountryCompleted = {
      ...currentCompleted,
      [stepId]: !currentCompleted[stepId]
    }
    
    const updatedAll = {
      ...completedSteps,
      [selectedCountry]: updatedCountryCompleted
    }

    setCompletedSteps(updatedAll)
    localStorage.setItem(`roadmap_${selectedCountry}`, JSON.stringify(updatedCountryCompleted))
  }

  // Calculate progress
  const totalSteps = currentRoadmap.steps.length
  const completedCount = currentRoadmap.steps.filter(step => currentCompleted[step.id]).length
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  // Check if critical steps are all completed
  const criticalSteps = currentRoadmap.steps.filter(s => s.critical)
  const isEligible = criticalSteps.every(s => currentCompleted[s.id])

  const handleSearchClick = () => {
    localStorage.setItem('prefillCountry', selectedCountry)
    navigate('/')
  }

  const getCountryCompletedCount = (country) => {
    const completed = completedSteps[country] || {}
    return ROADMAPS[country].steps.filter(step => completed[step.id]).length
  }

  const getCountryTotalSteps = (country) => {
    return ROADMAPS[country].steps.length
  }

  return (
    <section className="grid one-col-gap">
      
      {/* HEADER BANNER */}
      <div className="card search-summary">
        <div className="summary-left">
          <h2>Check Eligibility</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
            Track your preparation progress step-by-step. Select a country to view custom guidelines and check your application eligibility.
          </p>
        </div>
      </div>

      <div className="eligibility-two-col">
        {/* COUNTRY SELECTOR GRID */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Select Country</h3>
          <div className="country-grid">
            {Object.keys(ROADMAPS).map(country => {
              const active = selectedCountry === country
              const count = getCountryCompletedCount(country)
              const total = getCountryTotalSteps(country)
              const done = count === total

              return (
                <div
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`country-box ${active ? 'active' : ''}`}
                >
                  <span className="country-box-flag">{ROADMAPS[country].flag}</span>
                  <span className="country-box-name">{country}</span>
                  <span className="country-box-status">
                    {done ? '✅ Eligible' : `${count}/${total} Steps`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* INTERACTIVE ELIGIBILITY CHECKLIST */}
        <div className="card" style={{ padding: '32px' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{currentRoadmap.flag}</span> {selectedCountry} Eligibility checklist
              </h3>
            </div>
            
            {/* Progress circular tag */}
            <div className="summary-stats" style={{ padding: '8px 16px', height: 'auto', background: 'rgba(255,255,255,0.02)' }}>
              <span className="big-number" style={{ fontSize: '24px' }}>{progressPercent}%</span>
              <span className="big-label">Done</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {currentRoadmap.steps.map(step => {
              const checked = !!currentCompleted[step.id]
              return (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleStep(step.id)}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 20px',
                    background: checked ? 'rgba(81,250,170,0.02)' : 'rgba(255,255,255,0.01)',
                    border: checked ? '1px solid rgba(81,250,170,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    alignItems: 'flex-start'
                  }}
                  className="roadmap-step-card"
                >
                  {/* Custom Checkbox */}
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={checked}
                      onChange={() => {}} // toggled by parent click
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        accentColor: 'var(--accent)',
                        cursor: 'pointer'
                      }} 
                    />
                  </div>

                  {/* Step Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <h4 style={{ 
                        fontSize: '14.5px', 
                        fontWeight: 700, 
                        color: checked ? 'var(--text)' : 'rgba(255,255,255,0.9)',
                        textDecoration: checked ? 'line-through' : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {step.title}
                      </h4>
                      {step.critical && (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: checked ? 'rgba(81,250,170,0.5)' : 'var(--accent)',
                          border: checked ? '1px solid rgba(81,250,170,0.2)' : '1px solid rgba(81,250,170,0.4)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Required
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      color: 'var(--muted)', 
                      fontSize: '12.5px', 
                      marginTop: '4px', 
                      lineHeight: 1.5,
                      textDecoration: checked ? 'line-through' : 'none',
                      opacity: checked ? 0.6 : 1
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Eligibility Banner / Search Trigger */}
          {isEligible ? (
            <div className="roadmap-success-card">
              <div>
                <span style={{ fontSize: '32px' }}>🎉</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>
                  Eligibility Unlocked for {selectedCountry}!
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px', maxWidth: '440px', lineHeight: 1.55 }}>
                  You have completed all critical preparation requirements. You are fully ready to find courses and start your application process!
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleSearchClick}
                style={{
                  width: 'auto',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '14.5px'
                }}
              >
                🔍 Find Courses in {selectedCountry}
              </button>
            </div>
          ) : (
            <div 
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5 }}>
                ⚠️ Complete all <strong style={{ color: 'var(--accent)' }}>Required</strong> steps above to verify your eligibility and unlock the search button.
              </p>
            </div>
          )}

        </div>
      </div>

    </section>
  )
}
