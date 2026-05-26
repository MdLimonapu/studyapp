import { useNavigate } from 'react-router-dom'

function SkeletonCard() {
  return (
    <div className="result-card card skeleton-card">
      <div className="skeleton-line sk-short"></div>
      <div className="skeleton-line sk-long"></div>
      <div className="skeleton-line sk-medium"></div>
      <div className="skeleton-line sk-full"></div>
    </div>
  )
}

const getMatchLabel = (rating) => {
  const r = Number(rating) || 3;
  if (r >= 3) return { stars: '⭐⭐⭐', label: 'Best Match' };
  if (r === 2) return { stars: '⭐⭐', label: 'Good Match' };
  return { stars: '⭐', label: 'Plausible Match' };
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

  const isAI      = result.source === 'ai'
  const isStatic  = result.source === 'static'
  const isLoading = !raw

  return (
    <section className="grid one-col-gap">

      <div className="card search-summary">
        <div className="summary-left">
          <h2>University matches</h2>
          <p>
            <span className="chip">🌍 {form.country || '-'}</span>
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
            ? result.results.map((item, i) => (
              <a
                key={i}
                className="result-card card"
                href={item.link || '#'}
                target="_blank"
                rel="noreferrer"
              >
                <div className="rc-top">
                  <span className="rc-country">{item.country}</span>
                  {item.city && <span className="rc-city">📍 {item.city}</span>}
                </div>

                <h3 className="rc-uni">{item.university}</h3>
                <p className="rc-course">{item.course}</p>

                <div className="rc-rating-badge" onClick={(e) => e.stopPropagation()}>
                  <span className="rc-stars">{getMatchLabel(item.match_rating).stars}</span>
                  <span className="rc-label">{getMatchLabel(item.match_rating).label}</span>
                </div>

                <div className="rc-meta">
                  <div className="rc-meta-item">
                    <span className="rc-meta-label">Intake</span>
                    <span className="rc-meta-value">{item.intake || 'See website'}</span>
                  </div>
                </div>

                <div className="rc-cta">Open course page</div>
              </a>
            ))
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
