import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import SEO from '../components/SEO'

const countryFlags = {
  'germany': '🇩🇪',
  'uk': '🇬🇧',
  'united kingdom': '🇬🇧',
  'usa': '🇺🇸',
  'united states': '🇺🇸',
  'canada': '🇨🇦',
  'australia': '🇦🇺',
  'netherlands': '🇳🇱',
  'sweden': '🇸🇪',
  'france': '🇫🇷',
  'switzerland': '🇨🇭',
  'japan': '🇯🇵',
}

const getShortFee = (feeText) => {
  if (!feeText) return 'Verify';
  return feeText.split(/ at | for | depending |;/i)[0].trim();
}

const getShortDeadline = (deadlineText) => {
  if (!deadlineText) return 'Verify';
  const text = deadlineText.toLowerCase();
  
  if (text.includes('january-july') && text.includes('july-january')) {
    return 'Jan-July / July-Jan';
  }
  if (text.includes('december-march')) return 'Dec - March';
  if (text.includes('january-may')) return 'Jan - May';
  if (text.includes('december-april')) return 'Dec - April';
  if (text.includes('november-march')) return 'Nov - March';
  if (text.includes('january') && text.includes('august')) return 'Jan (Autumn) / Aug (Spring)';
  if (text.includes('6-10 months')) return '6-10 months before';
  
  const monthRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)/gi;
  const matches = deadlineText.match(monthRegex);
  if (matches && matches.length > 0) {
    const unique = [...new Set(matches.map(m => m.slice(0, 3)))];
    return unique.join(' - ');
  }
  
  if (deadlineText.length > 30) {
    return 'Verify on site';
  }
  return deadlineText;
}

const getCountryFlag = (country) => {
  if (!country) return '🌍';
  return countryFlags[country.toLowerCase().trim()] || '🌍';
}

const formatDegree = (degree) => {
  if (!degree) return 'Degree Program';
  const d = degree.toLowerCase().trim();
  if (d === 'master') return "Master's Degree";
  if (d === 'bachelor') return "Bachelor's Degree";
  if (d === 'phd') return "PhD / Doctorate";
  return degree.charAt(0).toUpperCase() + degree.slice(1);
}

const formatSource = (src) => {
  if (!src) return '';
  const s = src.toLowerCase().trim();
  if (s === 'daad') return 'DAAD Verified';
  if (s === 'ucas') return 'UCAS Official';
  if (s === 'cricos') return 'CRICOS Approved';
  if (s === 'studera') return 'Studera/Antagning';
  if (s === 'studyinholland') return 'Study in NL';
  return src.toUpperCase();
}

const formatGpa = (reqs) => {
  if (!reqs) return 'No Minimum';
  return reqs.replace('Minimum GPA:', 'GPA').trim();
}

const getUniDomain = (uni, city) => {
  if (!uni) return 'daad.de';
  const u = uni.toLowerCase().trim();
  const c = city ? city.toLowerCase().trim() : '';

  // 1. Direct mappings
  if (u.includes('köln') || u.includes('cologne')) {
    if (u.includes('th') || u.includes('hochschule')) return 'th-koeln.de';
    return 'uni-koeln.de';
  }
  if (u.includes('paderborn')) return 'uni-paderborn.de';
  if (u.includes('würzburg') || u.includes('wuerzburg')) return 'uni-wuerzburg.de';
  if (u.includes('dresden')) return 'tu-dresden.de';
  if (u.includes('chemnitz')) return 'tu-chemnitz.de';
  if (u.includes('south westphalia') || u.includes('südwestfalen')) return 'fh-swf.de';
  if (u.includes('frankfurt')) {
    if (u.includes('applied sciences')) return 'frankfurt-university.de';
    return 'uni-frankfurt.de';
  }
  if (u.includes('munich') || u.includes('münchen')) {
    if (u.includes('technical') || u.includes('tu')) return 'tum.de';
    return 'lmu.de';
  }
  if (u.includes('german international')) return 'giu-berlin.de';
  if (u.includes('karlsruhe') || u.includes('kit')) return 'kit.edu';
  if (u.includes('aachen') || u.includes('rwth')) return 'rwth-aachen.de';
  if (u.includes('berlin')) {
    if (u.includes('tu') || u.includes('technical')) return 'tu-berlin.de';
    if (u.includes('free') || u.includes('freie')) return 'fu-berlin.de';
    return 'hu-berlin.de';
  }
  if (u.includes('heidelberg')) return 'uni-heidelberg.de';
  if (u.includes('bonn')) return 'uni-bonn.de';
  if (u.includes('hamburg')) return 'uni-hamburg.de';
  if (u.includes('stuttgart')) return 'uni-stuttgart.de';
  if (u.includes('darmstadt')) return 'tu-darmstadt.de';
  if (u.includes('freiburg')) return 'uni-freiburg.de';
  if (u.includes('tübingen') || u.includes('tuebingen')) return 'uni-tuebingen.de';
  if (u.includes('göttingen') || u.includes('goettingen')) return 'uni-goettingen.de';
  if (u.includes('erlangen') || u.includes('nürnberg') || u.includes('fau')) return 'fau.de';

  // 2. Generic heuristics based on city
  if (c) {
    const cleanCity = c.split(/\s+/)[0].replace(/[^a-z-]/g, '');
    if (u.includes('technical') || u.includes('tu ') || u.includes('technische')) {
      return `tu-${cleanCity}.de`;
    }
    if (u.includes('applied sciences') || u.includes('fh ') || u.includes('fachhochschule') || u.includes('hochschule')) {
      return `hs-${cleanCity}.de`;
    }
    return `uni-${cleanCity}.de`;
  }

  return 'daad.de';
}

function SkeletonCard() {
  return (
    <div className="result-card card skeleton-card">
      <div className="skeleton-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div className="skeleton-line sk-short" style={{ margin: 0 }}></div>
        <div className="skeleton-line sk-badge" style={{ margin: 0, height: '24px', width: '100px' }}></div>
      </div>
      <div className="skeleton-line sk-long" style={{ height: '24px', marginBottom: '8px' }}></div>
      <div className="skeleton-line sk-medium" style={{ marginBottom: '16px' }}></div>
      <div className="skeleton-meta-section">
        <div className="skeleton-line sk-tiny"></div>
      </div>
      <div className="skeleton-line sk-full" style={{ height: '44px', marginTop: 'auto' }}></div>
    </div>
  )
}

const getMatchLabel = (rating) => {
  const r = Number(rating) || 3;
  if (r >= 3) return { stars: '⭐⭐⭐', label: 'Best Match', class: 'best-match' };
  if (r === 2) return { stars: '⭐⭐', label: 'Good Match', class: 'good-match' };
  return { stars: '⭐', label: 'Plausible Match', class: 'plausible-match' };
}

const parseStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

const FEATURED_UNIVERSITIES = [
  {
    university: "Technical University of Munich (TUM)",
    country: "Germany",
    city: "Munich",
    degree: "Master's Degree",
    course: "M.Sc. Data Engineering & Analytics / Informatics",
    fee: "€0 / semester (Tuition-Free)",
    deadline: "May 31",
    intake: "Winter Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 2.8",
    source: "daad",
    domain: "tum.de"
  },
  {
    university: "University of Oxford",
    country: "UK",
    city: "Oxford",
    degree: "Master's Degree",
    course: "M.Sc. in Advanced Computer Science",
    fee: "£33,970 / year",
    deadline: "January 15",
    intake: "Autumn Intake",
    duration: "1 Year",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.7",
    source: "ucas",
    domain: "ox.ac.uk"
  },
  {
    university: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    degree: "Master's Degree",
    course: "Master of Science in Applied Computing (MScAC)",
    fee: "CAD $34,800 / year",
    deadline: "December 1",
    intake: "Fall Intake",
    duration: "16 Months",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.3",
    source: "cricos",
    domain: "utoronto.ca"
  },
  {
    university: "Heidelberg University",
    country: "Germany",
    city: "Heidelberg",
    degree: "Master's Degree",
    course: "M.Sc. Molecular Biosciences & Biomedicine",
    fee: "€1,500 / semester",
    deadline: "July 15",
    intake: "Winter Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 2.7",
    source: "daad",
    domain: "uni-heidelberg.de"
  },
  {
    university: "ETH Zurich (Swiss Federal Institute of Technology)",
    country: "Switzerland",
    city: "Zurich",
    degree: "Master's Degree",
    course: "M.Sc. Robotics, Systems and Control",
    fee: "CHF 730 / semester",
    deadline: "December 15",
    intake: "Autumn Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.5",
    source: "daad",
    domain: "ethz.ch"
  },
  {
    university: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    degree: "Master's Degree",
    course: "Master of Information Technology",
    fee: "AUD $48,200 / year",
    deadline: "October 31",
    intake: "Semester 1 (Feb)",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.0",
    source: "cricos",
    domain: "unimelb.edu.au"
  },
  {
    university: "RWTH Aachen University",
    country: "Germany",
    city: "Aachen",
    degree: "Master's Degree",
    course: "M.Sc. Automotive Engineering & Mobility",
    fee: "€0 / semester (Tuition-Free)",
    deadline: "March 1",
    intake: "Winter Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 2.9",
    source: "daad",
    domain: "rwth-aachen.de"
  },
  {
    university: "Imperial College London",
    country: "UK",
    city: "London",
    degree: "Master's Degree",
    course: "M.Sc. Machine Learning & Data Science",
    fee: "£36,500 / year",
    deadline: "March 31",
    intake: "Autumn Intake",
    duration: "1 Year",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.5",
    source: "ucas",
    domain: "imperial.ac.uk"
  },
  {
    university: "University of British Columbia (UBC)",
    country: "Canada",
    city: "Vancouver",
    degree: "Master's Degree",
    course: "Master of Business Analytics (MBAN)",
    fee: "CAD $39,200 / year",
    deadline: "January 10",
    intake: "Fall Intake",
    duration: "1 Year",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.2",
    source: "cricos",
    domain: "ubc.ca"
  },
  {
    university: "Delft University of Technology (TU Delft)",
    country: "Netherlands",
    city: "Delft",
    degree: "Master's Degree",
    course: "M.Sc. Aerospace Engineering",
    fee: "€19,500 / year",
    deadline: "April 1",
    intake: "Fall Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.0",
    source: "studyinholland",
    domain: "tudelft.nl"
  },
  {
    university: "Technical University of Berlin (TU Berlin)",
    country: "Germany",
    city: "Berlin",
    degree: "Master's Degree",
    course: "M.Sc. Computer Science & Software Systems",
    fee: "€0 / semester (Tuition-Free)",
    deadline: "June 15",
    intake: "Winter Intake",
    duration: "2 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 2.8",
    source: "daad",
    domain: "tu-berlin.de"
  },
  {
    university: "University of Sydney",
    country: "Australia",
    city: "Sydney",
    degree: "Master's Degree",
    course: "Master of Data Science",
    fee: "AUD $49,500 / year",
    deadline: "November 30",
    intake: "Semester 1",
    duration: "1.5 Years",
    language: "English",
    rating: 3,
    gpa: "Minimum GPA: 3.0",
    source: "cricos",
    domain: "sydney.edu.au"
  }
];

export default function University() {
  const raw    = localStorage.getItem('searchResults')
  const result = parseStoredJson('searchResults', { results: [], related_fields: [], source: null })
  const form   = parseStoredJson('searchForm', {})
  const navigate = useNavigate()
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('All')

  const { isSignedIn } = useAuth()

  const hasActiveSearch = !!raw && (result.results && result.results.length > 0)
  const isLoading = !raw && !!localStorage.getItem('searchForm')

  const resultsToRender = result.results || []

  useEffect(() => {
    if (form && (form.field || form.country)) {
      const fieldPart = form.field ? form.field : 'University Matches';
      const countryPart = form.country ? ` in ${form.country}` : '';
      document.title = `${fieldPart}${countryPart} | Studplex`;
    } else {
      document.title = 'Explore 10,000+ Universities Worldwide | Studplex';
    }
  }, [form])

  const seoTitle = form && (form.field || form.country)
    ? `${form.field ? form.field : 'University Matches'}${form.country ? ` in ${form.country}` : ''} | Studplex`
    : 'Search & Compare 10,000+ Universities Worldwide | Studplex'

  const seoDescription = form && form.country
    ? `Find and compare English-taught degree programs, admission requirements, deadlines, and tuition fees at top universities in ${form.country}.`
    : 'Explore and compare English-taught degree programs, tuition fees, entry requirements, and deadlines at top universities in Germany, UK, USA, Canada, and Australia.'

  return (
    <section className="grid one-col-gap">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords="university matches, study in Germany, study in UK, study in USA, study in Canada, study in Australia, tuition fees, university rankings, degree requirements"
        canonical="https://www.studplex.com/university"
      />

      {!hasActiveSearch && !isLoading ? (
        <>
          <div className="card search-summary">
            <div className="summary-left">
              <h1>Explore Top Global Universities & Degree Programs</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
                Browse verified degree programs, tuition fees, admission requirements, and deadlines across 10+ countries. Filter by destination or launch an AI match tailored to your profile.
              </p>
            </div>
            <div className="summary-right">
              <button 
                className="btn-accent" 
                style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'var(--btn-gradient)', color: 'var(--btn-text)' }} 
                onClick={() => navigate('/')}
              >
                🔍 Custom Match
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>Filter by Country</h3>
            <div className="summary-chips" style={{ flexWrap: 'wrap', gap: '8px' }}>
              {['All', 'Germany', 'UK', 'Canada', 'Australia', 'Netherlands', 'Switzerland'].map((country) => (
                <span
                  key={country}
                  className={`chip ${selectedCountryFilter === country ? 'active' : ''}`}
                  onClick={() => setSelectedCountryFilter(country)}
                  style={{
                    cursor: 'pointer',
                    background: selectedCountryFilter === country ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: selectedCountryFilter === country ? '#fff' : 'var(--text)',
                    borderColor: selectedCountryFilter === country ? 'var(--accent)' : 'var(--card-border)'
                  }}
                >
                  {country === 'All' ? '🌍 All Countries' : `${getCountryFlag(country)} ${country}`}
                </span>
              ))}
            </div>
          </div>

          <div className="results-grid">
            {FEATURED_UNIVERSITIES
              .filter(u => selectedCountryFilter === 'All' || u.country.toLowerCase() === selectedCountryFilter.toLowerCase())
              .map((item, idx) => {
                const match = getMatchLabel(item.rating)
                const domainName = item.domain || getUniDomain(item.university, item.city)
                return (
                  <div key={idx} className="result-card card">
                    <div className="rc-top-bar">
                      <div className="rc-flag-wrap">
                        <span className="rc-flag">{getCountryFlag(item.country)}</span>
                        <span className="rc-country-name">{item.country}</span>
                        {item.city && <span className="rc-city">• 📍 {item.city}</span>}
                      </div>
                      <div className={`rc-rating-badge ${match.class}`}>
                        <span className="rc-stars">{match.stars}</span>
                        <span className="rc-label">Top Choice</span>
                      </div>
                    </div>

                    <div className="rc-body">
                      <div className="rc-uni-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div className="rc-uni-logo-wrapper" style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          background: '#ffffff', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          overflow: 'hidden', 
                          flexShrink: 0 
                        }}>
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${domainName}&sz=64`}
                            alt={`${item.university} logo`} 
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '<span style="font-size: 16px;">🎓</span>';
                            }}
                          />
                        </div>
                        <h3 className="rc-uni">{item.university}</h3>
                      </div>
                      <p className="rc-course">{item.course}</p>
                    </div>

                    <div className="rc-meta-section">
                      <div className="rc-meta-pills">
                        <div className="rc-intake-row">
                          <span className="rc-intake-icon">🗓️</span>
                          <span className="rc-intake-value">{item.intake}</span>
                        </div>
                        <div className="rc-intake-row">
                          <span className="rc-intake-icon">⏱️</span>
                          <span className="rc-intake-value">{item.duration}</span>
                        </div>
                        <div className="rc-intake-row">
                          <span className="rc-intake-icon">🌐</span>
                          <span className="rc-intake-value">{item.language}</span>
                        </div>
                      </div>

                      <div className="rc-details-list">
                        <div className="rc-detail-item">
                          <span className="rc-detail-icon">💰</span>
                          <span className="rc-detail-label">Fee:</span>
                          <span className="rc-detail-value">{item.fee}</span>
                        </div>
                        <div className="rc-detail-item">
                          <span className="rc-detail-icon">📌</span>
                          <span className="rc-detail-label">Deadline:</span>
                          <span className="rc-detail-value">{item.deadline}</span>
                        </div>
                        <div className="rc-detail-item">
                          <span className="rc-detail-icon">🎯</span>
                          <span className="rc-detail-label">Requirements:</span>
                          <span className="rc-detail-value">{item.gpa}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rc-cta-btn" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        className="btn-accent" 
                        style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'var(--btn-gradient)', color: 'var(--btn-text)' }}
                        onClick={() => navigate(`/roadmap`)}
                      >
                        Check Eligibility
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => navigate(`/?focus=country&val=${encodeURIComponent(item.country)}`)}
                      >
                        Find More
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>

          <div className="card" style={{ padding: '32px', marginTop: '24px', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
              How to Choose the Right University for International Studies
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '16px' }}>
              Finding the best degree program abroad depends on several factors: academic GPA, language proficiency (IELTS, TOEFL, Duolingo), tuition costs, and post-graduation work opportunities.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>🇩🇪 Studying in Germany</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                  Most public German universities offer 100% tuition-free education for international students, with hundreds of English-taught Master's degrees in engineering, computer science, and business.
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>🇬🇧 Studying in the UK</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                  The UK offers fast-track 1-year Master's programs and a 2-year Graduate Route post-study work visa. Top universities include Oxford, Cambridge, Imperial, and Russell Group institutions.
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>🇨🇦 Studying in Canada</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                  Canadian universities provide high-quality education with Post-Graduation Work Permits (PGWP) of up to 3 years and clear permanent residency immigration pathways for graduates.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="card search-summary">
            <div className="summary-left">
              <h1>University matches</h1>
              <div className="summary-chips">
                <span className="chip" onClick={() => navigate(`/?focus=country&val=${encodeURIComponent(form.country || '')}`)} title="Click to edit country search">{getCountryFlag(form.country)} {form.country || '-'}</span>
                <span className="chip" onClick={() => navigate(`/?focus=degree&val=${encodeURIComponent(form.degree || '')}`)} title="Click to edit degree search">🎓 {form.degree || '-'}</span>
                <span className="chip" onClick={() => navigate(`/?focus=field&val=${encodeURIComponent(form.field || '')}`)} title="Click to edit field search">📚 {form.field || '-'}</span>
              </div>
            </div>
            <div className="summary-right">
              <div className="summary-stats">
                <span className="big-number">{result.total || 0}</span>
                <span className="big-label">Results</span>
              </div>
              <button className="btn-outline" onClick={() => navigate('/')}>New search</button>
            </div>
          </div>

          {result.related_fields?.length > 0 && (
            <div className="card">
              <h3>🔗 Related fields</h3>
              <div className="tag-wrap">
                {result.related_fields.map((f, i) => (
                  <span key={i} className="tag">{f}</span>
                ))}
              </div>
            </div>
          )}

          <div className={`blur-gate-wrapper ${!isSignedIn && resultsToRender.length > 4 ? 'gated' : ''}`}>
            <div className="results-grid">
              {isLoading
                ? Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)
                : resultsToRender.length
                  ? resultsToRender.map((item, i) => {
                    const match = getMatchLabel(item.match_rating);
                    const isBlurred = !isSignedIn && i >= 4;
                    const domainName = getUniDomain(item.university, item.city);
                    return (
                      <a
                        key={i}
                        className={`result-card card ${isBlurred ? 'blurred-card' : ''}`}
                        href={isBlurred ? '#' : (item.link || '#')}
                        target={isBlurred ? '_self' : '_blank'}
                        rel="noreferrer"
                        onClick={(e) => {
                          if (isBlurred) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <div className="rc-top">
                          <div className="rc-location">
                            <span className="rc-flag">{getCountryFlag(item.country)}</span>
                            <span className="rc-country-name">{item.country}</span>
                            {item.city && <span className="rc-city">• 📍 {item.city}</span>}
                          </div>
                          <div className={`rc-rating-badge ${match.class}`} onClick={(e) => e.stopPropagation()}>
                            <span className="rc-stars">{match.stars}</span>
                            <span className="rc-label">{match.label}</span>
                          </div>
                        </div>

                        <div className="rc-body">
                          <div className="rc-uni-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div className="rc-uni-logo-wrapper" style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '8px', 
                              background: '#ffffff', 
                              border: '1px solid rgba(255,255,255,0.08)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${domainName}&sz=64`}
                                alt={`${item.university} logo`} 
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = '<span style="font-size: 16px;">🎓</span>';
                                }}
                              />
                            </div>
                            <h3 className="rc-uni">{item.university}</h3>
                          </div>
                          <p className="rc-course">{item.course}</p>
                        </div>

                        <div className="rc-meta-section">
                          <div className="rc-meta-pills">
                            <div className="rc-intake-row">
                              <span className="rc-intake-icon">🗓️</span>
                              <span className="rc-intake-value">{item.intake || 'Verify'}</span>
                            </div>
                            {item.duration && (
                              <div className="rc-intake-row">
                                <span className="rc-intake-icon">⏱️</span>
                                <span className="rc-intake-value">{item.duration}</span>
                              </div>
                            )}
                            <div className="rc-intake-row">
                              <span className="rc-intake-icon">🌐</span>
                              <span className="rc-intake-value">{item.language || 'Verify'}</span>
                            </div>
                          </div>

                          <div className="rc-details-list">
                            <div className="rc-detail-item">
                              <span className="rc-detail-icon">💰</span>
                              <span className="rc-detail-label">{item.fee_source_type === 'source_listed' ? 'Real fee:' : 'Fee:'}</span>
                              <span className="rc-detail-value">{getShortFee(item.fee)}</span>
                            </div>
                            <div className="rc-detail-item">
                              <span className="rc-detail-icon">📌</span>
                              <span className="rc-detail-label">Deadline:</span>
                              <span className="rc-detail-value">{getShortDeadline(item.deadline)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rc-cta-btn">
                          <span>Open course page</span>
                          <span className="rc-cta-btn-arrow">→</span>
                        </div>
                      </a>
                    )
                  })
                  : (
                    <div className="card empty-state">
                      <div className="empty-icon">🎓</div>
                      <h3>No results found</h3>
                      <p>Try a different field, degree, or country.</p>
                      <button onClick={() => navigate('/')}>Search again</button>
                    </div>
                  )
              }
            </div>

            {!isSignedIn && resultsToRender.length > 4 && (
              <div className="blur-gate-overlay">
                <div className="blur-gate-card">
                  <div className="blur-gate-icon">🔒</div>
                  <h3>Unlock remaining matches</h3>
                  <p>
                    We found <strong>{result.total || resultsToRender.length} matches</strong> for you. Sign up for a free account to unlock all results.
                  </p>
                  <SignInButton mode="modal">
                    <button 
                      type="button" 
                      className="btn-accent" 
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700 }}
                    >
                      Unlock All Matches
                    </button>
                  </SignInButton>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
