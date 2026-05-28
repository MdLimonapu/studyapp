import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, SignInButton } from '@clerk/clerk-react'

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

  const { isSignedIn } = useAuth()

  const hasActiveSearch = !!raw && (result.results && result.results.length > 0)
  const isLoading = !raw && !!localStorage.getItem('searchForm')

  const resultsToRender = result.results || []

  return (
    <section className="grid one-col-gap">

      {!hasActiveSearch && !isLoading ? (
        <div className="card empty-state" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="empty-icon" style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🔍</div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Start Your Search</h3>
          <p style={{ color: 'var(--muted)', fontSize: '15.5px', margin: 0, lineHeight: 1.6, maxWidth: '440px' }}>
            You haven't searched for any programs yet. Let's find the perfect university matching your background and profile.
          </p>
          <button className="btn-accent" style={{ padding: '14px 28px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px' }} onClick={() => navigate('/')}>
            Go to Home Page
          </button>
        </div>
      ) : (
        <>
          <div className="card search-summary">
            <div className="summary-left">
              <h2>University matches</h2>
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
