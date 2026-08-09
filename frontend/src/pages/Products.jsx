import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

/* ── Tiny star component ─────────────────────── */
const Stars = ({ rating }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[...Array(5)].map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={i < Math.round(rating) ? '#facc15' : '#334155'}>
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.69l5.34-.78z" />
      </svg>
    ))}
  </span>
)

/* ── Fallback placeholder ────────────────────── */
const FALLBACK_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" fill="%23111827"><rect width="300" height="300" fill="%23f1f5f9"/><text x="150" y="160" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%2394a3b8">Image</text></svg>'
)

/* ═══════════════════════════════════════════════ */
export default function Products() {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('all')
  const [hover, setHover] = useState(null)

  const items = useMemo(() => PRODUCTS_DATA.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false
    if (q && !(p.name + p.shortDesc + (p.badge || '')).toLowerCase().includes(q.toLowerCase())) return false
    if (country !== 'all' && !p.targetCountries.includes('Global') && !p.targetCountries.includes(country)) return false
    return true
  }), [cat, q, country])

  /* ── Page-scoped inline styles ──────────────── */
  const page = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 20px 120px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  }

  return (
    <div style={page}>

      {/* ──── HEADER ──── */}
      <header style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#818cf8' }}>Studplex</span>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', margin: '4px 0 0', color: 'var(--text)' }}>Student Essentials</h1>
      </header>

      {/* ──── TOOLBAR ──── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%', padding: '11px 14px 11px 40px',
              borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: '1.5px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.5)', color: 'var(--text)',
              outline: 'none', transition: 'border-color .2s'
            }}
          />
        </div>

        {/* Country */}
        <select value={country} onChange={e => setCountry(e.target.value)} style={{
          padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: '1.5px solid rgba(148,163,184,0.2)', cursor: 'pointer',
          background: 'rgba(15,23,42,0.5)', color: 'var(--text)'
        }}>
          <option value="all">🌍 All Regions</option>
          <option value="Germany">🇩🇪 Germany</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="USA">🇺🇸 USA</option>
          <option value="Canada">🇨🇦 Canada</option>
          <option value="Australia">🇦🇺 Australia</option>
        </select>
      </div>

      {/* ──── CATEGORY CHIPS ──── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {PRODUCT_CATEGORIES.map(c => {
          const on = cat === c.id
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: on ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, width: 'auto',
              border: 'none',
              background: on ? '#818cf8' : 'rgba(100,116,139,0.12)',
              color: on ? '#fff' : '#94a3b8',
              transition: 'all .2s'
            }}>
              {c.icon} {c.name}
            </button>
          )
        })}
      </div>

      {/* ──── RESULTS INFO ──── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{items.length} product{items.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>As an Amazon Associate, Studplex earns from qualifying purchases.</span>
      </div>

      {/* ──── GRID ──── */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(30,41,59,0.4)', borderRadius: 16 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>No products match your filters</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Try a different search or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {items.map(p => {
            const url = p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain || 'com')
            const on = hover === p.id

            return (
              <a
                key={p.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  borderRadius: 14, overflow: 'hidden',
                  textDecoration: 'none', color: 'inherit',
                  background: 'rgba(30, 41, 59, 0.45)',
                  backdropFilter: 'blur(12px)',
                  border: on ? '1px solid rgba(129,140,248,0.5)' : '1px solid rgba(148,163,184,0.08)',
                  transform: on ? 'translateY(-5px) scale(1.01)' : 'none',
                  boxShadow: on
                    ? '0 24px 48px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(129,140,248,0.2)'
                    : '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                  cursor: 'pointer'
                }}
              >
                {/* ── Image ── */}
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '4/3',
                  background: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={e => { e.currentTarget.src = FALLBACK_IMG }}
                    style={{
                      maxWidth: '80%', maxHeight: '80%', objectFit: 'contain',
                      transition: 'transform .4s ease',
                      transform: on ? 'scale(1.08)' : 'scale(1)'
                    }}
                  />

                  {/* Badge pill */}
                  {p.badge && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: '#818cf8', color: '#fff',
                      fontSize: 10, fontWeight: 700, padding: '3px 9px',
                      borderRadius: 6, letterSpacing: '0.03em'
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4,
                    margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {p.name}
                  </h3>

                  {/* Rating row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={p.rating} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.rating}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>({p.reviewsCount.toLocaleString()})</span>
                  </div>

                  {/* Short desc */}
                  <p style={{
                    fontSize: 12, color: '#94a3b8', lineHeight: 1.55, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    flex: 1
                  }}>
                    {p.shortDesc}
                  </p>

                  {/* Price + CTA */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 10, paddingTop: 12,
                    borderTop: '1px solid rgba(148,163,184,0.1)'
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      {p.price}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', borderRadius: 8,
                      fontSize: 12, fontWeight: 700,
                      background: on ? '#818cf8' : 'rgba(129,140,248,0.12)',
                      color: on ? '#fff' : '#818cf8',
                      transition: 'all .2s'
                    }}>
                      View on Amazon
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
