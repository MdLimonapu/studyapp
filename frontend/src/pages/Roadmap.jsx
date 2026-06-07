import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { fetchProfile, saveProfile } from '../api'

const ROADMAPS = {
  'Germany': {
    flag: '🇩🇪',
    steps: [
      { id: 1, title: 'Check University Admission Qualification', desc: 'Verify if your HSC / bachelor certificate qualifies you for direct admission via DAAD / Anabin database.', critical: true },
      { id: 2, title: 'Apply for APS Certificate', desc: 'You must obtain an APS Certificate before submitting university applications.', critical: true, apsOnly: true },
      { id: 3, title: 'Pass Language Proficiency (IELTS/TOEFL)', desc: 'Obtain required English (IELTS 6.5+) or German (TestDaF/Goethe C1) scores for your target program.', critical: true },
      { id: 4, title: 'Prepare Transcripts & Motivation Letter', desc: 'Gather attested academic transcripts and certificates. Write a strong Statement of Purpose (SOP).', critical: true },
      { id: 5, title: 'Submit Applications via Uni-Assist or Direct Portal', desc: 'Apply through Uni-Assist or directly to the German university portals.', critical: true },
      { id: 6, title: 'Secure Blocked Account & Visa Interview', desc: 'Deposit required living funds into a German Blocked Account (Expatrio/Fintiba) and book your visa slot at German Embassy Dhaka.', critical: true }
    ]
  },
  'UK': {
    flag: '🇬🇧',
    steps: [
      { id: 1, title: 'Take English Language Test (IELTS/PTE)', desc: 'Take IELTS Academic (6.0 - 7.0 required) or secure an IELTS waiver if your bachelor medium of instruction was English.', critical: true },
      { id: 2, title: 'Prepare Statement of Purpose & References', desc: 'Write an SOP detailing your career goals. Gather 2 academic recommendation letters.', critical: true },
      { id: 3, title: 'Submit Application & Secure CAS Offer', desc: 'Apply directly or via UCAS. Pay deposit to receive your Confirmation of Acceptance for Studies (CAS).', critical: true },
      { id: 4, title: 'Verify Bank Solvency & Apply for Visa', desc: 'Prepare bank solvency statements (funds held for 28 consecutive days in acceptable bank) and submit UK Student Visa.', critical: true }
    ]
  },
  'USA': {
    flag: '🇺🇸',
    steps: [
      { id: 1, title: 'Take IELTS/TOEFL English Exam', desc: 'Secure required English scores (IELTS 6.5+ or TOEFL 80+). Some universities may accept Duolingo.', critical: true },
      { id: 2, title: 'Draft SOP & Obtain Recommendation Letters', desc: 'Write your Statement of Purpose (SOP) and gather recommendation letters from academic referees.', critical: true },
      { id: 3, title: 'Submit Applications & Pay Fees', desc: 'Apply via Common App or direct portals. Pay university application fees.', critical: true },
      { id: 4, title: 'Secure I-20 Form & Book Interview at Dhaka', desc: 'Provide sponsor bank solvency certificates to get your I-20, pay SEVIS fee, and attend visa interview at US Embassy Dhaka.', critical: true }
    ]
  },
  'Canada': {
    flag: '🇨🇦',
    steps: [
      { id: 1, title: 'Take IELTS Academic Test', desc: 'Score a minimum of 6.0 in all bands of IELTS Academic to qualify for visa processing.', critical: true },
      { id: 2, title: 'Prepare Attested Transcripts & Study Plan', desc: 'Gather attested academic transcripts and write a detailed Study Plan explaining your ties to Bangladesh.', critical: true },
      { id: 3, title: 'Submit University Applications', desc: 'Apply directly via the university portal and pay the application fee.', critical: true },
      { id: 4, title: 'Purchase GIC & Apply for Study Permit', desc: 'Purchase a GIC of $20,635 CAD from an approved bank, arrange sponsor bank solvency statements, and submit Study Permit.', critical: true }
    ]
  },
  'Australia': {
    flag: '🇦🇺',
    steps: [
      { id: 1, title: 'Pass IELTS or PTE Academic Test', desc: 'Secure IELTS Academic (6.0 - 6.5) or PTE Academic (50 - 58) scores.', critical: true },
      { id: 2, title: 'Satisfy Genuine Student (GS) Requirements', desc: 'Draft statement details answering GS criteria, including your ties to Bangladesh and career benefits.', critical: true },
      { id: 3, title: 'Submit Application & Pay Deposit', desc: 'Apply directly or via agent, pay tuition deposit, and get your Confirmation of Enrolment (CoE).', critical: true },
      { id: 4, title: 'OSHC Health Cover & Submit Sponsor Bank Statements', desc: 'Purchase Overseas Student Health Cover, prepare 3 months of bank statements/solvency, and apply for Visa 500.', critical: true }
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

const COUNTRY_RESOURCES = {
  'Germany': {
    links: [
      { label: 'DAAD Requirements Database', url: 'https://www.daad.de/en/study-and-research-in-germany/requirements/', icon: '🔍' },
      { label: 'Anabin Database (Accreditation)', url: 'https://anabin.kmk.org/', icon: '🏛️' },
      { label: 'Uni-Assist Portal', url: 'https://www.uni-assist.de/en/', icon: '📤' },
      { label: 'Expatrio Blocked Account', url: 'https://www.expatrio.com/', icon: '💳' },
      { label: 'Fintiba Blocked Account', url: 'https://www.fintiba.com/', icon: '🏦' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS 6.5+ or German B2/C1' },
      { name: 'Visa Solvency / Funding', value: 'Blocked Account (€11,904/year)' },
      { name: 'Application Cost', value: 'Uni-Assist: €75 first course, €30 each add-on' }
    ],
    embassyLink: { label: 'German Embassy Dhaka Visa Guidelines', url: 'https://dhaka.diplo.de/bd-en/service/visa-einreise' }
  },
  'UK': {
    links: [
      { label: 'UCAS Official Application Portal', url: 'https://www.ucas.com/', icon: '📤' },
      { label: 'UK Gov Student Visa Guidance', url: 'https://www.gov.uk/student-visa', icon: '🇬🇧' },
      { label: 'IELTS Official Registration', url: 'https://www.ielts.org/', icon: '📝' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS Academic 6.0 - 7.0 (or MOI English waiver)' },
      { name: 'Visa Solvency / Funding', value: 'Tuition Balance + Living funds (£9,207 - £12,006) held for 28 days' },
      { name: 'CAS Deposit', value: 'Usually £2,000 - £5,000 upfront to issue visa letter' }
    ],
    embassyLink: { label: 'UK Visa Application Centre Dhaka', url: 'https://visa.vfsglobal.com/bgd/en/gbr/' }
  },
  'USA': {
    links: [
      { label: 'Common App Portal', url: 'https://www.commonapp.org/', icon: '📤' },
      { label: 'SEVIS Fee Payment (FMJfee)', url: 'https://www.fmjfee.com/', icon: '💵' },
      { label: 'US Visa Scheduling Portal', url: 'https://www.ustraveldocs.com/bd/', icon: '🗓️' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS 6.5+, TOEFL 80+, or Duolingo 110+' },
      { name: 'Visa Solvency / Funding', value: 'I-20 Form required; Sponsor bank solvency showing 1st year expenses' },
      { name: 'SEVIS & Visa Fees', value: 'SEVIS fee ($350) + DS-160 visa fee ($185)' }
    ],
    embassyLink: { label: 'US Embassy Dhaka Student Visa Info', url: 'https://bd.usembassy.gov/visas/nonimmigrant-visas/' }
  },
  'Canada': {
    links: [
      { label: 'IRCC Canada Study Permit Guide', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html', icon: '🍁' },
      { label: 'Scotiabank GIC Program', url: 'https://www.scotiabank.com/ca/en/personal/bank-accounts/students/student-gic.html', icon: '💰' },
      { label: 'CIBC Student GIC Program', url: 'https://www.cibc.com/en/personal-banking/student-banking/student-gic.html', icon: '🏦' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS Academic: minimum 6.0 in all bands' },
      { name: 'Visa Solvency / Funding', value: 'GIC of $20,635 CAD + tuition fee payment proof' },
      { name: 'Visa Pathways', value: 'Student Direct Stream (SDS) for faster processing' }
    ],
    embassyLink: { label: 'Canada Visa Application Centre Dhaka', url: 'https://visa.vfsglobal.com/bgd/en/can/' }
  },
  'Australia': {
    links: [
      { label: 'Study in Australia Portal', url: 'https://www.studyaustralia.gov.au/', icon: '🐨' },
      { label: 'OSHC Australia Health Insurance', url: 'https://www.oshcaustralia.com.au/', icon: '🏥' },
      { label: 'Home Affairs Visa 500 Guide', url: 'https://immi.homeaffairs.gov.uk/visas/getting-a-visa/visa-listing/student-500', icon: '🇦🇺' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS Academic (6.0-6.5) or PTE Academic (50-58)' },
      { name: 'Visa Solvency / Funding', value: '12 months tuition + Living costs (~$29,710 AUD) + travel funds' },
      { name: 'Health Cover', value: 'OSHC (Overseas Student Health Cover) is mandatory' }
    ],
    embassyLink: { label: 'VFS Global Australia Bangladesh', url: 'https://visa.vfsglobal.com/bgd/en/aus/' }
  },
  'Netherlands': {
    links: [
      { label: 'Studielink Application Portal', url: 'https://www.studielink.nl/', icon: '🌷' },
      { label: 'Study in NL Official Guide', url: 'https://www.studyinnl.org/', icon: 'ℹ️' },
      { label: 'IND Student Residence Permit', url: 'https://ind.nl/en/residence-permits/study/student-residence-permit', icon: '🏛️' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS Academic 6.5+ or TOEFL iBT 90+' },
      { name: 'Visa Solvency / Funding', value: 'Living funds deposit (~€12,180/year) + tuition paid upfront' },
      { name: 'Visa Procedure', value: 'Host university handles visa application on your behalf' }
    ],
    embassyLink: { label: 'Netherlands Embassy Dhaka Student Info', url: 'https://www.netherlandsandyou.nl/web/bangladesh' }
  },
  'Sweden': {
    links: [
      { label: 'University Admissions Sweden', url: 'https://www.universityadmissions.se/', icon: '🇸🇪' },
      { label: 'Study in Sweden Portal', url: 'https://studyinsweden.se/', icon: 'ℹ️' },
      { label: 'Migrationsverket Student Permit', url: 'https://www.migrationsverket.se/English/Private-individuals/Studying-in-Sweden.html', icon: '🏛️' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS Academic 6.5+ (no band below 5.5)' },
      { name: 'Visa Solvency / Funding', value: 'Migration Agency requires proof of ~SEK 10,380/month' },
      { name: 'Application Cost', value: 'SEK 900 application fee paid online at portal' }
    ],
    embassyLink: { label: 'Sweden Embassy Dhaka Visa Guidelines', url: 'https://www.swedenabroad.se/en/embassies/bangladesh-dhaka/' }
  },
  'France': {
    links: [
      { label: 'Campus France Portal', url: 'https://www.campusfrance.org/', icon: '🇫🇷' },
      { label: 'France-Visas Official Site', url: 'https://france-visas.gouv.fr/', icon: '🛂' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS 6.0+ (English taught) or DELF/DALF B2/C1 (French taught)' },
      { name: 'Visa Solvency / Funding', value: 'Minimum €615/month proof of funds for 1 year' },
      { name: 'Mandatory Process', value: 'Campus France Interview and file validation required' }
    ],
    embassyLink: { label: 'France Embassy Dhaka Visa Center', url: 'https://bd.ambafrance.org/Applying-for-a-French-visa-in-Bangladesh' }
  },
  'Switzerland': {
    links: [
      { label: 'Swissuniversities Portal', url: 'https://www.swissuniversities.ch/', icon: '🇨🇭' },
      { label: 'Study in Switzerland Guide', url: 'https://www.studyinswitzerland.ch/', icon: 'ℹ️' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'IELTS 6.5+ or French/German B2/C1 depending on program' },
      { name: 'Visa Solvency / Funding', value: 'Proof of CHF 20,000 held in a Swiss-recognized bank' },
      { name: 'Application Cost', value: 'Direct application fee: CHF 100 - 200 per university' }
    ],
    embassyLink: { label: 'Embassy of Switzerland in Bangladesh', url: 'https://www.eda.admin.ch/dhaka' }
  },
  'Japan': {
    links: [
      { label: 'Study in Japan Information', url: 'https://www.studyinjapan.go.jp/', icon: '🌸' },
      { label: 'JLPT Official Website', url: 'https://www.jlpt.jp/e/', icon: '🇯🇵' }
    ],
    requirements: [
      { name: 'Language Requirement', value: 'Japanese-taught: JLPT N2/N1; English-taught: IELTS 6.0+ / TOEFL 80+' },
      { name: 'Visa Solvency / Funding', value: 'Sponsor bank balance showing around 2,000,000 JPY per year' },
      { name: 'Certificate of Eligibility', value: 'COE must be approved by Japan Immigration beforehand' }
    ],
    embassyLink: { label: 'Embassy of Japan in Bangladesh', url: 'https://www.bd.emb-japan.go.jp/' }
  }
}

export default function Roadmap() {
  const [selectedCountry, setSelectedCountry] = useState('Germany')
  const [completedSteps, setCompletedSteps] = useState({})
  const [expandedSteps, setExpandedSteps] = useState({})
  const [activeUploaderId, setActiveUploaderId] = useState(null)
  const navigate = useNavigate()
  
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState(null)

  // Fetch profile on mount / login
  useEffect(() => {
    if (!isLoaded || !user) return
    const email = user.primaryEmailAddress?.emailAddress || ""
    fetchProfile(email)
      .then(data => { if (data) setProfile(data) })
      .catch(() => {})
  }, [user, isLoaded])

  useEffect(() => {
    document.title = `Check Eligibility for ${selectedCountry} | Studplex`
  }, [selectedCountry])

  const toggleExpandStep = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }

  const handleDocumentUpload = (e, stepId) => {
    const files = Array.from(e.target.files)
    if (!files.length || !profile) return

    files.forEach(file => {
      if (file.size > 4 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 4MB limit.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const newDoc = {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          data: ev.target.result,
          uploadedAt: new Date().toISOString(),
          country: selectedCountry,
          stepId: stepId
        }
        
        const updatedProfile = {
          ...profile,
          documents: [...(profile.documents || []), newDoc]
        }
        setProfile(updatedProfile)
        saveProfile(updatedProfile).then(() => {
          window.dispatchEvent(new Event('profile-updated'))
        }).catch(() => {})
      }
      reader.readAsDataURL(file)
    })
    e.target.value = '' // Reset input
  }

  const deleteDocument = (docId) => {
    if (!profile) return
    const updatedProfile = {
      ...profile,
      documents: (profile.documents || []).filter(d => d.id !== docId)
    }
    setProfile(updatedProfile)
    saveProfile(updatedProfile).then(() => {
      window.dispatchEvent(new Event('profile-updated'))
    }).catch(() => {})
  }

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
  // Detect user's home country from IP (stored by App.jsx)
  const APS_COUNTRIES = ['india', 'china', 'vietnam']
  const userHomeCountry = (localStorage.getItem('user_country_name') || '').toLowerCase()
  const needsAPS = APS_COUNTRIES.some(c => userHomeCountry.includes(c))

  // Filter steps: hide APS step if user doesn't need it
  const getVisibleSteps = (country) => {
    return ROADMAPS[country].steps.filter(step => !step.apsOnly || needsAPS)
  }

  const currentRoadmap = ROADMAPS[selectedCountry]
  const visibleSteps = getVisibleSteps(selectedCountry)
  const currentCompleted = completedSteps[selectedCountry] || {}

  // Fetch quick links & requirements
  const selectedCountryResources = COUNTRY_RESOURCES[selectedCountry] || { links: [], requirements: [], embassyLink: null }
  
  // Customise Germany links if user is from India/Vietnam/China (needs APS)
  let customLinks = [...selectedCountryResources.links]
  if (selectedCountry === 'Germany' && needsAPS) {
    let apsLink = { label: 'APS India Certificate Portal', url: 'https://www.aps-india.de/', icon: '🎓' }
    if (userHomeCountry.includes('vietnam')) {
      apsLink = { label: 'APS Vietnam (German Embassy Hanoi)', url: 'https://vietnam.diplo.de/vn-vi/dich-vu-lanh-su/aps', icon: '🎓' }
    } else if (userHomeCountry.includes('china')) {
      apsLink = { label: 'APS China Portal', url: 'https://www.aps.org.cn/', icon: '🎓' }
    }
    customLinks.unshift(apsLink)
  }

  const handleToggleStep = (stepId) => {
    const isNowChecked = !currentCompleted[stepId];
    if (activeUploaderId !== stepId) {
      setActiveUploaderId(null);
    } else if (!isNowChecked) {
      setActiveUploaderId(null);
    }
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
  const totalSteps = visibleSteps.length
  const completedCount = visibleSteps.filter(step => currentCompleted[step.id]).length
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  // Check if critical steps are all completed
  const criticalSteps = visibleSteps.filter(s => s.critical)
  const isEligible = criticalSteps.every(s => currentCompleted[s.id])

  const handleSearchClick = () => {
    localStorage.setItem('prefillCountry', selectedCountry)
    navigate('/')
  }

  const getCountryCompletedCount = (country) => {
    const completed = completedSteps[country] || {}
    return getVisibleSteps(country).filter(step => completed[step.id]).length
  }

  const getCountryTotalSteps = (country) => {
    return getVisibleSteps(country).length
  }

  return (
    <section className="grid one-col-gap">
      
      {/* HEADER BANNER */}
      <div className="card search-summary">
        <div className="summary-left">
          <h1>Check Eligibility</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
            Track your preparation progress step-by-step. Select a country to view custom guidelines and check your application eligibility.
          </p>
        </div>
      </div>

      <div className="eligibility-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* COUNTRY SELECTOR GRID */}
          <div className="card roadmap-left-card" style={{ padding: '24px' }}>
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

          {/* QUICK LINKS & RESOURCES CARD */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Quick Links & Resources</h3>
            </div>
            
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              Official portals and key eligibility guidelines for <strong>{selectedCountry}</strong>.
            </p>
            
            {/* Quick Links List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--dark2)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}
                  className="quick-link-item"
                >
                  <span style={{ fontSize: '16px' }}>{link.icon}</span>
                  <span style={{ flex: 1 }}>{link.label}</span>
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>↗</span>
                </a>
              ))}
            </div>

            {/* General Country info */}
            <div style={{
              background: 'var(--dark2)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ fontSize: '12px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                📋 General Requirements
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCountryResources.requirements.map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{req.name}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 700 }}>{req.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Context / Requirements Used */}
            <div style={{
              borderTop: '1px solid var(--card-border)',
              paddingTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>👤</span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Matching Credentials
                </span>
              </div>
              
              {profile ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.currentDegree && (
                    <span style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: 'var(--text)' }}>
                      🎓 <strong>Degree:</strong> {profile.currentDegree}
                    </span>
                  )}
                  {profile.currentField && (
                    <span style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: 'var(--text)' }}>
                      💼 <strong>Field:</strong> {profile.currentField}
                    </span>
                  )}
                  {profile.grade && (
                    <span style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: 'var(--text)' }}>
                      📊 <strong>Grade:</strong> {profile.grade}
                    </span>
                  )}
                  {userHomeCountry && (
                    <span style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: 'var(--text)' }}>
                      📍 <strong>Origin:</strong> {userHomeCountry.charAt(0).toUpperCase() + userHomeCountry.slice(1)}
                    </span>
                  )}
                  {!profile.currentDegree && !profile.currentField && !profile.grade && (
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      Profile empty. Complete it on the Profile page to customize matches.
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic' }}>
                  Sign in to see how your credentials match.
                </span>
              )}
            </div>
            
            {/* Embassy Contact Link */}
            {selectedCountryResources.embassyLink && (
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <a
                  href={selectedCountryResources.embassyLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--secondary-accent)',
                    textDecoration: 'underline',
                    fontWeight: 700
                  }}
                >
                  {selectedCountryResources.embassyLink.label}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE ELIGIBILITY CHECKLIST */}
        <div className="card roadmap-right-card" style={{ padding: '32px' }}>
          
          {/* Header Info */}
          <div className="roadmap-header-card" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            marginBottom: '24px',
            background: 'var(--dark2)',
            padding: '16px 24px',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <span>{currentRoadmap.flag}</span> {selectedCountry} Eligibility checklist
              </h3>
            </div>
            
            {/* Progress circular tag */}
            <div className="summary-stats" style={{ padding: '8px 16px', height: 'auto', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="big-number" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{progressPercent}%</span>
              <span className="big-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Done</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {visibleSteps.map(step => {
              const checked = !!currentCompleted[step.id]
              return (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleStep(step.id)}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 20px',
                    background: checked ? 'var(--secondary-glow)' : 'var(--glass-glow)',
                    border: checked ? '1px solid var(--secondary-border)' : '1px solid var(--card-border)',
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
                        accentColor: 'var(--secondary-accent)',
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
                        color: checked ? 'var(--muted)' : 'var(--text)',
                        textDecoration: checked ? 'line-through' : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {step.title}
                      </h4>
                      {step.critical && (
                        <span className="roadmap-badge-required" style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: checked ? 'var(--secondary-accent)' : 'var(--accent)',
                          border: '1px solid var(--secondary-border)',
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
                    
                    {checked && user && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }} onClick={e => e.stopPropagation()}>
                        {(() => {
                          const stepDocs = (profile?.documents || []).filter(
                            d => d.country === selectedCountry && d.stepId === step.id
                          );
                          const isExpanded = !!expandedSteps[step.id];
                          
                          return (
                            <div>
                              {stepDocs.length === 0 ? (
                                activeUploaderId !== step.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                                    <button
                                      type="button"
                                      className="btn-plain"
                                      onClick={() => {
                                        setActiveUploaderId(step.id);
                                      }}
                                      style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px dashed var(--card-border)',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        color: 'var(--muted)',
                                        fontSize: '12.5px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <span>📎 Upload documents</span>
                                      <span style={{ fontSize: '10px' }}>▼</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ position: 'relative' }}>
                                    <div 
                                      className="pf-document-upload-zone" 
                                      style={{ padding: '20px 12px' }} 
                                      onClick={() => document.getElementById(`doc-upload-${step.id}`).click()}
                                    >
                                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>📤</div>
                                      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                                        Upload certificates or transcripts here
                                      </p>
                                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                        Drag & drop or click to browse
                                      </span>
                                      <input 
                                        id={`doc-upload-${step.id}`}
                                        type="file" 
                                        multiple 
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                                        style={{ display: 'none' }} 
                                        onChange={(e) => handleDocumentUpload(e, step.id)} 
                                        onCancel={() => {
                                          setActiveUploaderId(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div>
                                  <button
                                    type="button"
                                    className="btn-plain"
                                    onClick={() => toggleExpandStep(step.id)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      color: 'var(--text)',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <span>📎 View Uploaded Documents ({stepDocs.length})</span>
                                    <span style={{ fontSize: '9px', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                  </button>

                                  {isExpanded && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div className="pf-documents-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {stepDocs.map((doc) => {
                                          const isPdf = doc.type === 'application/pdf';
                                          const isImg = doc.type?.startsWith('image/');
                                          const sizeKb = Math.round(doc.size / 1024);
                                          const sizeStr = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
                                          return (
                                            <div key={doc.id} className="pf-document-item" style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'space-between', 
                                              padding: '8px 12px', 
                                              background: 'rgba(255, 255, 255, 0.01)', 
                                              border: '1px solid var(--card-border)', 
                                              borderRadius: '10px' 
                                            }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                                <div style={{ fontSize: '16px' }}>{isPdf ? '📄' : (isImg ? '🖼️' : '📝')}</div>
                                                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{doc.name} ({sizeStr})</span>
                                              </div>
                                              <button 
                                                type="button" 
                                                className="btn-plain"
                                                onClick={() => deleteDocument(doc.id)} 
                                                style={{ 
                                                  background: 'transparent', 
                                                  border: 'none', 
                                                  color: 'rgba(248, 113, 113, 0.7)', 
                                                  fontSize: '14px', 
                                                  cursor: 'pointer', 
                                                  padding: '2px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}
                                              >
                                                🗑️
                                              </button>
                                            </div>
                                          )
                                        })}
                                      </div>

                                      <div style={{ marginTop: '4px' }}>
                                        <button
                                          type="button"
                                          className="btn-plain"
                                          onClick={() => document.getElementById(`doc-upload-${step.id}`).click()}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--accent)',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: '4px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                            }}
                                          >
                                            ➕ Upload another document
                                          </button>
                                          <input 
                                            id={`doc-upload-${step.id}`}
                                            type="file" 
                                            multiple 
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                                            style={{ display: 'none' }} 
                                            onChange={(e) => handleDocumentUpload(e, step.id)} 
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })()
                        }
                      </div>
                    )}
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
                background: 'var(--dark2)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                ⚠️ Complete all <strong style={{ color: '#ef4444' }}>Required</strong> steps above to verify your eligibility.
              </p>
              <button 
                type="button" 
                onClick={handleSearchClick}
                className="btn-secondary-search"
              >
                🔍 Search Courses Anyway
              </button>
            </div>
          )}

          {/* Sign-in reminder at the bottom of the card for guest users */}
          {!user && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px 20px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px dashed rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              fontSize: '13.5px', 
              color: 'var(--muted)', 
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <span>
                <strong>Sign in</strong> to upload your study documents (transcripts, certificates) for each step and sync them to your profile.
              </span>
            </div>
          )}

        </div>
      </div>

    </section>
  )
}
