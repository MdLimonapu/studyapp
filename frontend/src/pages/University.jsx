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

export default function University() {
  const raw    = localStorage.getItem('searchResults')
  const result = raw ? JSON.parse(raw) : { results: [], related_fields: [], source: null }
  const form   = JSON.parse(localStorage.getItem('searchForm') || '{}')
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
          {isAI && (
            <div className="ai-badge">
              <span className="ai-dot"></span>
              AI-powered — live web search
            </div>
          )}
          {isStatic && result.fallback_notice && (
            <p className="data-notice" style={{marginTop: 10}}>⚠️ {result.fallback_notice}</p>
          )}
        </div>
        <div className="summary-right">
          <div className="big-number">{result.total || 0}</div>
          <div className="big-label">{isAI ? 'AI matches found' : 'Results found'}</div>
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

                {item.why_match && (
                  <div className="rc-why">
                    <span className="rc-why-label">✨ Why it matches you</span>
                    <p>{item.why_match}</p>
                  </div>
                )}

                <div className="rc-meta">
                  <div className="rc-meta-item">
                    <span className="rc-meta-label">Intake</span>
                    <span className="rc-meta-value">{item.intake || 'See website'}</span>
                  </div>
                  <div className="rc-meta-item">
                    <span className="rc-meta-label">Fee</span>
                    <span className="rc-meta-value">{item.fee || 'See website'}</span>
                  </div>
                </div>

                {item.requirements && (
                  <p className="rc-requirements">📋 {item.requirements}</p>
                )}

                <div className="rc-cta">Open course page →</div>
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
