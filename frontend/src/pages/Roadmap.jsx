import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ROADMAPS = {
  'Germany': {
    flag: '🇩🇪',
    portal: 'Uni-Assist or Direct University Portal',
    visaInfo: 'Blocked Account (~€11,900/year)',
    steps: [
      { id: 1, title: 'Check HZB Admission Qualification', desc: 'Verify if your secondary school diploma or previous degree qualifies for direct admission in Germany using the Anabin database or DAAD tools.', critical: true },
      { id: 2, title: 'Pass Language Proficiency (English/German)', desc: 'Confirm course language. If German-taught, you need DSH/TestDaF. If English, take IELTS (typically 6.5+) or TOEFL.', critical: true },
      { id: 3, title: 'Obtain APS Certificate (Selected Countries)', desc: 'Applicants from India, China, and Vietnam must apply for and receive the APS certificate before submitting university files.', critical: false },
      { id: 4, title: 'Prepare Certified Translations & Motivation Letter', desc: 'Get your transcripts and certificates translated to German or English. Draft a strong Statement of Purpose (SOP).', critical: true },
      { id: 5, title: 'Submit Applications via Uni-Assist or Direct Portal', desc: 'Submit application documents through Uni-Assist (processing fee: €75) or directly on the university portal based on specific course rules.', critical: true },
      { id: 6, title: 'Open a German Blocked Account (Sperrkonto)', desc: 'Once accepted, deposit the required living funds (approx. €11,900) into an approved provider (e.g. Expatrio, Coracle, Fintiba).', critical: true },
      { id: 7, title: 'Apply for German Student Visa', desc: 'Book a visa appointment at the German embassy. Bring your university admission letter, blocked account proof, and health insurance.', critical: true }
    ]
  },
  'UK': {
    flag: '🇬🇧',
    portal: 'UCAS (Undergrad) or Direct University Portal',
    visaInfo: 'Student Visa Proof of Funds (~£12,006 - £15,000/year)',
    steps: [
      { id: 1, title: 'Take English Language Test (IELTS/PTE)', desc: 'Take IELTS Academic or PTE Academic. A score of 6.0 - 7.0 is standard depending on course competitiveness.', critical: true },
      { id: 2, title: 'Write Personal Statement & Request References', desc: 'Draft a compelling Personal Statement explaining your academic interest. Request 1-2 letters of recommendation.', critical: true },
      { id: 3, title: 'Submit UCAS Application or Apply Directly', desc: 'Apply through UCAS for Bachelor courses, or apply directly on the university portal for Master/PhD programs.', critical: true },
      { id: 4, title: 'Accept Offer & Receive CAS Certificate', desc: 'Meet conditional offer grades, pay your tuition deposit, and obtain your official CAS (Confirmation of Acceptance for Studies).', critical: true },
      { id: 5, title: 'Verify Maintenance Funds requirement', desc: 'Ensure you have tuition fees plus £1,023/month (outside London) or £1,334/month (inside London) in your bank account for 28 consecutive days.', critical: true },
      { id: 6, title: 'Apply for UK Student Visa', desc: 'Submit visa form online, pay the Health Surcharge (IHS), and attend your biometrics appointment at the visa center.', critical: true }
    ]
  },
  'USA': {
    flag: '🇺🇸',
    portal: 'Common App or Direct University Portal',
    visaInfo: 'I-20 financial proof (~$30k-$60k/year)',
    steps: [
      { id: 1, title: 'Take Standardized Tests (SAT/ACT/GRE)', desc: 'Take SAT/ACT for Undergrad, or GRE/GMAT for Postgrad. Verify if your target universities are test-optional.', critical: false },
      { id: 2, title: 'Take TOEFL/IELTS English Exam', desc: 'Submit English proficiency. US universities widely prefer TOEFL but accept IELTS (typically 6.5+).', critical: true },
      { id: 3, title: 'Draft Admission Essays & Request Recommendations', desc: 'Write your Statement of Purpose (SOP) or Common App essays. Request letters of recommendation from 2-3 academic referees.', critical: true },
      { id: 4, title: 'Submit Applications & Pay Fees', desc: 'Submit applications via Common App or direct portals. Pay university application fees ($50-$100 per school).', critical: true },
      { id: 5, title: 'Request Form I-20 after Admission', desc: 'Once accepted, submit bank statements to the university showing financial support for 1 year to receive your official I-20 certificate.', critical: true },
      { id: 6, title: 'Pay SEVIS I-901 Fee & Book Interview', desc: 'Pay the mandatory $350 SEVIS fee online. Complete the DS-160 visa form and attend your F-1 student visa interview.', critical: true }
    ]
  },
  'Canada': {
    flag: '🇨🇦',
    portal: 'OUAC or Direct University Portal',
    visaInfo: 'Guaranteed Investment Certificate (GIC ~$20,635 CAD)',
    steps: [
      { id: 1, title: 'Take IELTS Academic Test', desc: 'For streamlined visa processing (SDS stream), you must score a minimum of 6.0 in all bands of IELTS Academic.', critical: true },
      { id: 2, title: 'Prepare Transcripts & Study Plan (SOP)', desc: 'Gather certified academic transcripts and write a highly detailed Study Plan explaining your academic intentions in Canada.', critical: true },
      { id: 3, title: 'Submit Application to College/University', desc: 'Apply directly or via provincial systems (like OUAC in Ontario). Pay the application fee ($100-$150 CAD).', critical: true },
      { id: 4, title: 'Obtain official Letter of Acceptance (LOA)', desc: 'Once accepted, pay your first semester or first year tuition fee deposit to secure your LOA certificate.', critical: true },
      { id: 5, title: 'Purchase GIC (Guaranteed Investment Certificate)', desc: 'Purchase a GIC of $20,635 CAD from an approved Canadian bank (e.g. CIBC, Scotiabank) for visa proof of living funds.', critical: true },
      { id: 6, title: 'Submit Canadian Study Permit Application', desc: 'Apply online for the Study Permit. Provide your LOA, tuition receipt, GIC certificate, and undergo a medical exam.', critical: true }
    ]
  },
  'Australia': {
    flag: '🇦🇺',
    portal: 'Direct Portal or Authorized Agent Portal',
    visaInfo: 'Student Visa Proof of Funds (~$29,710 AUD/year)',
    steps: [
      { id: 1, title: 'Pass IELTS or PTE Academic Test', desc: 'Take a recognized English test. IELTS Academic (6.0 - 6.5) or PTE Academic (50 - 58) is standard.', critical: true },
      { id: 2, title: 'Complete Genuine Student (GS) Statements', desc: 'Address the Genuine Student requirement by detailing your career goals, course relevance, and incentives to return home.', critical: true },
      { id: 3, title: 'Submit University Application', desc: 'Submit application documents to the university directly or via an authorized educational agent.', critical: true },
      { id: 4, title: 'Accept Offer & Pay Tuition Deposit', desc: 'Sign and return the acceptance form and pay the first-semester tuition deposit to secure your placement.', critical: true },
      { id: 5, title: 'Receive Confirmation of Enrolment (CoE)', desc: 'The university will issue a CoE document once payment is verified. This is mandatory for your visa.', critical: true },
      { id: 6, title: 'Purchase Overseas Student Health Cover (OSHC)', desc: 'Obtain health insurance for the entire duration of your stay in Australia, which is required for the visa application.', critical: true },
      { id: 7, title: 'Apply for Student Visa (Subclass 500)', desc: 'Submit your student visa application online. Provide CoE, OSHC, GS statements, and proof of funds (~$29,710 AUD/year).', critical: true }
    ]
  },
  'Netherlands': {
    flag: '🇳🇱',
    portal: 'Studielink and Osiris/University Portal',
    visaInfo: 'Student Visa Proof of Funds (~€12,000/year)',
    steps: [
      { id: 1, title: 'Register on Studielink.nl', desc: 'Create an account on the centralized Dutch national student portal and select your target programs.', critical: true },
      { id: 2, title: 'Submit Documents via University Portal', desc: 'Upload your academic records, CV, and motivation letter on the university online portal (e.g. Osiris).', critical: true },
      { id: 3, title: 'Pass English Test (IELTS/TOEFL)', desc: 'Dutch universities require strong English skills. IELTS score of 6.0 - 6.5 or TOEFL 80 - 90 is standard.', critical: true },
      { id: 4, title: 'Accept Offer & Pay University Invoice', desc: 'Once accepted, pay the tuition invoice and deposit living funds (~€12,000) which the university will verify.', critical: true },
      { id: 5, title: 'Wait for University to File your Visa', desc: 'In the Netherlands, the university applies for your student visa (MVV/VVR) on your behalf after checking financial records.', critical: true }
    ]
  },
  'Sweden': {
    flag: '🇸🇪',
    portal: 'Universityadmissions.se',
    visaInfo: 'Proof of Living Funds (~SEK 10,314/month)',
    steps: [
      { id: 1, title: 'Create UniversityAdmissions.se Account', desc: 'Register on Sweden’s centralized portal. Select up to 4 programs in order of preference.', critical: true },
      { id: 2, title: 'Upload Academic Records & English Test', desc: 'Upload certified academic transcripts, diplomas, and English test scores (IELTS Academic 6.5+).', critical: true },
      { id: 3, title: 'Pay Sweden Application Fee (SEK 900)', desc: 'Pay the application fee of SEK 900 online. Applications are only processed after payment is cleared.', critical: true },
      { id: 4, title: 'Accept Admission Offer & Pay First Semester Fee', desc: 'Accept the offer on the portal once results are published. Pay the first semester tuition fee invoice to the university.', critical: true },
      { id: 5, title: 'Apply for Swedish Residence Permit for Studies', desc: 'Submit application online to Swedish Migration Agency. Prove you have living funds (approx. SEK 10,314/month) for 10 months.', critical: true }
    ]
  },
  'France': {
    flag: '🇫🇷',
    portal: 'Campus France (Etudes en France)',
    visaInfo: 'Long-stay Student Visa Proof of Funds (~€615/month)',
    steps: [
      { id: 1, title: 'Register on Etudes en France portal', desc: 'Create an account on the official Campus France portal for your country to select programs.', critical: true },
      { id: 2, title: 'Pass French/English Language Certification', desc: 'For French-taught courses, pass DELF/DALF. For English-taught, submit IELTS (6.0 - 6.5) or TOEFL.', critical: true },
      { id: 3, title: 'Submit Documents & CV', desc: 'Upload academic transcripts, CV, and motivation letters. Some courses require portfolios.', critical: true },
      { id: 4, title: 'Attend Campus France Interview', desc: 'Schedule and attend the mandatory academic interview at your local Campus France office.', critical: true },
      { id: 5, title: 'Confirm Admission & Apply for Student Visa', desc: 'Once accepted, confirm your choice on the portal to generate your registration certificate, then apply online for your visa.', critical: true },
      { id: 6, title: 'Prove Financial Self-Sufficiency', desc: 'Provide bank statements showing you have at least €615 per month for 1 year to secure your student visa.', critical: true }
    ]
  },
  'Switzerland': {
    flag: '🇨🇭',
    portal: 'Direct University Portal',
    visaInfo: 'Swiss Bank Account Proof (~CHF 20,000/year)',
    steps: [
      { id: 1, title: 'Verify Course Language & Take Tests', desc: 'Verify course language (German, French, or English). Pass language tests (IELTS/TOEFL or Goethe/DELF).', critical: true },
      { id: 2, title: 'Submit Online Application Directly', desc: 'Switzerland has no central application system. Apply directly on the university portal and pay fee (CHF 100 - CHF 200).', critical: true },
      { id: 3, title: 'Receive Admission Confirmation', desc: 'Accept admission offer and pay the first-semester fee deposit to receive your official registration letter.', critical: true },
      { id: 4, title: 'Show Swiss Bank Statement for Visa', desc: 'Prove you have CHF 20,000 available in a bank account under your name at a bank recognized in Switzerland.', critical: true },
      { id: 5, title: 'Apply for National Visa D', desc: 'Book appointment at the Swiss consulate. Bring registration letter, study plan, and bank statements.', critical: true }
    ]
  },
  'Japan': {
    flag: '🇯🇵',
    portal: 'Direct University Portal',
    visaInfo: 'Certificate of Eligibility Proof of Funds (~2,000,000 JPY/year)',
    steps: [
      { id: 1, title: 'Language Certification (Japanese/English)', desc: 'Japanese-taught courses require JLPT N2/N1. English-taught courses require TOEFL/IELTS.', critical: true },
      { id: 2, title: 'Submit University Application Directly', desc: 'Apply directly to the university online or by sending physical documents during their strict window.', critical: true },
      { id: 3, title: 'Receive Admission & Apply for COE', desc: 'Once accepted, submit visa documents to the university so they can apply for your COE (Certificate of Eligibility) at Japan Immigration.', critical: true },
      { id: 4, title: 'Receive COE & Apply for Student Visa', desc: 'Once immigration issues the physical COE card, bring it with university admission letter and bank statement to the Japanese embassy.', critical: true }
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
  const completedCount = Object.values(currentCompleted).filter(Boolean).length
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
    return Object.values(completed).filter(Boolean).length
  }

  const getCountryTotalSteps = (country) => {
    return ROADMAPS[country].steps.length
  }

  return (
    <section className="grid one-col-gap">
      
      {/* HEADER BANNER */}
      <div className="card search-summary">
        <div className="summary-left">
          <h2>Study Abroad Roadmap</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
            Track your preparation progress step-by-step. Select a country to view custom guidelines and unlock your application eligibility.
          </p>
        </div>
      </div>

      <div className="home-split">
        
        {/* LEFT COLUMN: COUNTRY SELECTOR */}
        <div className="card hero-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Select Country</h3>
          <div className="pf-checklist" style={{ border: 'none', paddingTop: 0, gap: '8px' }}>
            {Object.keys(ROADMAPS).map(country => {
              const active = selectedCountry === country
              const count = getCountryCompletedCount(country)
              const total = getCountryTotalSteps(country)
              const done = count === total

              return (
                <button
                  type="button"
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`level-btn ${active ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    textAlign: 'left',
                    width: '100%',
                    margin: 0,
                    boxShadow: 'none',
                    background: active ? 'rgba(81,250,170,0.08)' : 'rgba(0,0,0,0.15)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{ROADMAPS[country].flag}</span>
                    <span style={{ color: active ? 'var(--accent)' : 'var(--text)' }}>{country}</span>
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                    {done ? '✅ Eligible' : `${count}/${total} Steps`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE ROADMAP */}
        <div className="card" style={{ padding: '32px' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{currentRoadmap.flag}</span> {selectedCountry} Roadmap
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px' }}>
                Application Portal: <strong style={{ color: 'var(--text)' }}>{currentRoadmap.portal}</strong>
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
                Visa Financial Requirement: <strong style={{ color: 'var(--text)' }}>{currentRoadmap.visaInfo}</strong>
              </p>
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
            <div 
              style={{
                background: 'rgba(81,250,170,0.06)',
                border: '1px solid rgba(81,250,170,0.25)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(81,250,170,0.05)',
                animation: 'pulse 2s infinite'
              }}
            >
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
