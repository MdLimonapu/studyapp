import { useNavigate } from 'react-router-dom'

export default function University() {
  const result = JSON.parse(localStorage.getItem('searchResults') || '{"results":[],"related_fields":[]}')
  const form   = JSON.parse(localStorage.getItem('searchForm') || '{}')
  const navigate = useNavigate()

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
          <div className="big-number">{result.total || 0}</div>
          <div className="big-label">Results found</div>
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
        {result.results?.length
          ? result.results.map((item, i) => (
            <a
              key={i}
              className="result-card card"
              href={item.link}
              target="_blank"
              rel="noreferrer"
            >
              <div className="rc-top">
                <span className="rc-country">{item.country}</span>
              </div>
              <h3 className="rc-uni">{item.university}</h3>
              <p className="rc-course">{item.course}</p>
              <div className="rc-meta">
                <div className="rc-meta-item">
                  <span className="rc-meta-label">Intake</span>
                  <span className="rc-meta-value">{item.intake || 'Winter / Summer'}</span>
                </div>
                <div className="rc-meta-item">
                  <span className="rc-meta-label">Fee</span>
                  <span className="rc-meta-value">{item.fee || 'See website'}</span>
                </div>
              </div>
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
