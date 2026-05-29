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
          <button className="btn-accent" style={{ padding: '14px 28px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px', background: 'var(--btn-gradient)', color: 'var(--btn-text)' }} onClick={() => navigate('/')}>
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
                            {item.city && <span className="rc-city">• {item.city}</span>}
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
                            <h3 className="rc-uni" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>{item.university}</h3>
                          </div>
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
