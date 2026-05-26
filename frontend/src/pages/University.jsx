import { useNavigate } from 'react-router-dom'

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
      <div className="skeleton-header">
        <div className="skeleton-line sk-short"></div>
        <div className="skeleton-line sk-tiny"></div>
      </div>
      <div className="skeleton-line sk-long"></div>
      <div className="skeleton-line sk-medium"></div>
      <div className="skeleton-line sk-badge"></div>
      <div className="skeleton-specs">
        <div className="sk-spec-placeholder"></div>
        <div className="sk-spec-placeholder"></div>
        <div className="sk-spec-placeholder"></div>
      </div>
      <div className="skeleton-line sk-full"></div>
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

  const isLoading = !raw

  return (
    <section className="grid one-col-gap">

      <div className="card search-summary">
        <div className="summary-left">
          <h2>University matches</h2>
          <p>
            <span className="chip">{getCountryFlag(form.country)} {form.country || '-'}</span>
            <span className="chip">🎓 {form.degree || '-'}</span>
            <span className="chip">📚 {form.field || '-'}</span>
          </p>
        </div>
        <div className="summary-right">
          <div className="summary-stats">
            <div className="big-number">{result.total || 0}</div>
            <div className="big-label">Results found</div>
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

      <div className="results-grid">
        {isLoading
          ? Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)
          : result.results?.length
            ? result.results.map((item, i) => {
              const match = getMatchLabel(item.match_rating);
              return (
                <a
                  key={i}
                  className="result-card card"
                  href={item.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="rc-top">
                    <div className="rc-location">
                      <span className="rc-flag-country">
                        {getCountryFlag(item.country)} {item.country}
                      </span>
                      {item.city && <span className="rc-city">• {item.city}</span>}
                    </div>
                    {item.source && (
                      <span className="rc-source-tag">
                        {formatSource(item.source)}
                      </span>
                    )}
                  </div>

                  <h3 className="rc-uni">{item.university}</h3>
                  <p className="rc-course">{item.course}</p>

                  <div className={`rc-rating-badge ${match.class}`} onClick={(e) => e.stopPropagation()}>
                    <span className="rc-stars">{match.stars}</span>
                    <span className="rc-label">{match.label}</span>
                  </div>

                  <div className="rc-specs-grid">
                    <div className="rc-spec-item">
                      <span className="rc-spec-icon">🎓</span>
                      <div className="rc-spec-details">
                        <span className="rc-spec-label">Degree</span>
                        <span className="rc-spec-value">{formatDegree(item.degree)}</span>
                      </div>
                    </div>
                    <div className="rc-spec-item">
                      <span className="rc-spec-icon">📊</span>
                      <div className="rc-spec-details">
                        <span className="rc-spec-label">Requirements</span>
                        <span className="rc-spec-value">{formatGpa(item.requirements)}</span>
                      </div>
                    </div>
                    <div className="rc-spec-item">
                      <span className="rc-spec-icon">🗓️</span>
                      <div className="rc-spec-details">
                        <span className="rc-spec-label">Intake</span>
                        <span className="rc-spec-value">{item.intake || 'See website'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rc-cta-container">
                    <span className="rc-cta-text">Open course page</span>
                    <span className="rc-cta-arrow">→</span>
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
    </section>
  )
}
