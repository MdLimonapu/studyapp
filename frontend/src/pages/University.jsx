import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from '../components/AuthModal'

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

export default function University() {
  const raw    = localStorage.getItem('searchResults')
  const result = parseStoredJson('searchResults', { results: [], related_fields: [], source: null })
  const form   = parseStoredJson('searchForm', {})
  const navigate = useNavigate()

  const [isRegistered, setIsRegistered] = useState(() => {
    return !!localStorage.getItem('user_account')
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const isLoading = !raw

  const resultsToRender = result.results || []

  return (
    <section className="grid one-col-gap">

      <div className="card search-summary">
        <div className="summary-left">
          <h2>University matches</h2>
          <div className="summary-chips">
            <span className="chip">{getCountryFlag(form.country)} {form.country || '-'}</span>
            <span className="chip">🎓 {form.degree || '-'}</span>
            <span className="chip">📚 {form.field || '-'}</span>
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

      <div className={`blur-gate-wrapper ${!isRegistered && resultsToRender.length > 3 ? 'gated' : ''}`}>
        <div className="results-grid">
          {isLoading
            ? Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)
            : resultsToRender.length
              ? resultsToRender.map((item, i) => {
                const match = getMatchLabel(item.match_rating);
                const isBlurred = !isRegistered && i >= 3;
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
                        {item.city && <span className="rc-city">• {item.city}</span>}
                      </div>
                      <div className={`rc-rating-badge ${match.class}`} onClick={(e) => e.stopPropagation()}>
                        <span className="rc-stars">{match.stars}</span>
                        <span className="rc-label">{match.label}</span>
                      </div>
                    </div>

                    <div className="rc-body">
                      <h3 className="rc-uni">{item.university}</h3>
                      <p className="rc-course">{item.course}</p>
                    </div>

                    <div className="rc-meta-section">
                      <div className="rc-intake-row">
                        <span className="rc-intake-icon">🗓️</span>
                        <span className="rc-intake-label">Intake:</span>
                        <span className="rc-intake-value">{item.intake || 'Winter / Summer'}</span>
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

        {!isRegistered && resultsToRender.length > 3 && (
          <div className="blur-gate-overlay">
            <div className="blur-gate-card">
              <div className="blur-gate-icon">🔒</div>
              <h3>Unlock remaining matches</h3>
              <p>
                We found <strong>{result.total || resultsToRender.length} matches</strong> for you. Sign up for a free account to unlock all results.
              </p>
              <button 
                type="button" 
                className="btn-accent" 
                onClick={() => setIsAuthModalOpen(true)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700 }}
              >
                Unlock All Matches
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={() => setIsRegistered(true)} 
      />
    </section>
  )
}
