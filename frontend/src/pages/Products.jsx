import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

const Stars = ({ rating }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[...Array(5)].map((_, i) => (
      <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i < Math.round(rating) ? '#f59e0b' : 'rgba(148,163,184,0.2)'}>
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.69l5.34-.78z" />
      </svg>
    ))}
  </span>
)

const FALLBACK = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%23f8fafc"/><text x="150" y="155" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Image unavailable</text></svg>')

export default function Products() {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('all')
  const [hov, setHov] = useState(null)

  const list = useMemo(() => PRODUCTS_DATA.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false
    if (q && !(p.name + p.shortDesc + (p.badge || '')).toLowerCase().includes(q.toLowerCase())) return false
    if (region !== 'all' && !p.targetCountries.includes('Global') && !p.targetCountries.includes(region)) return false
    return true
  }), [cat, q, region])

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '36px 20px 120px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 4px' }}>
          Studplex Store
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>
          Student Essentials
        </h1>
      </div>

      {/* ── Search + Region ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
              fontSize: 13, fontWeight: 500,
              border: '2px solid var(--card-border)',
              background: 'var(--card)', color: 'var(--text)', outline: 'none'
            }}
          />
        </div>
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '2px solid var(--card-border)',
            background: 'var(--card)', color: 'var(--text)', cursor: 'pointer'
          }}
        >
          <option value="all">🌍 All Regions</option>
          <option value="Germany">🇩🇪 Germany</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="USA">🇺🇸 USA</option>
          <option value="Canada">🇨🇦 Canada</option>
          <option value="Australia">🇦🇺 Australia</option>
        </select>
      </div>

      {/* ── Category pills ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRODUCT_CATEGORIES.map(c => {
          const on = cat === c.id
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, width: 'auto',
              border: on ? '2px solid var(--card-border)' : '2px solid transparent',
              background: on ? 'var(--accent)' : 'var(--card)',
              color: on ? 'var(--btn-text)' : 'var(--muted)',
              boxShadow: on ? 'var(--shadow-news)' : 'none',
              transition: 'all .15s'
            }}>
              {c.icon} {c.name}
            </button>
          )
        })}
      </div>

      {/* ── Count + Disclosure ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          {list.length} product{list.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', opacity: 0.7 }}>
          As an Amazon Associate, Studplex earns from qualifying purchases.
        </span>
      </div>

      {/* ── Product Grid ── */}
      {list.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px', borderRadius: 14,
          background: 'var(--card)', border: '2px solid var(--card-border)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📦</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>No products found</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Try a different search or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 18 }}>
          {list.map(p => {
            const url = p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain || 'com')
            const on = hov === p.id

            return (
              <a
                key={p.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHov(p.id)}
                onMouseLeave={() => setHov(null)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  borderRadius: 14, overflow: 'hidden',
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--card)',
                  border: '2px solid var(--card-border)',
                  boxShadow: on ? 'var(--shadow-news-hover)' : 'var(--shadow-news)',
                  transform: on ? 'translateY(-4px)' : 'none',
                  transition: 'all .2s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Image */}
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '1/1',
                  background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  borderBottom: '2px solid var(--card-border)'
                }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={e => { e.currentTarget.src = FALLBACK }}
                    style={{
                      maxWidth: '72%', maxHeight: '72%', objectFit: 'contain',
                      transition: 'transform .3s ease',
                      transform: on ? 'scale(1.06)' : 'scale(1)'
                    }}
                  />

                  {p.badge && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: 'var(--accent)', color: 'var(--btn-text)',
                      fontSize: 10, fontWeight: 800, padding: '4px 10px',
                      borderRadius: 6, border: '1.5px solid var(--card-border)',
                      textTransform: 'uppercase', letterSpacing: '0.03em'
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>

                  <h3 style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {p.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Stars rating={p.rating} />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                      {p.rating} ({p.reviewsCount.toLocaleString()})
                    </span>
                  </div>

                  <p style={{
                    fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    flex: 1
                  }}>
                    {p.shortDesc}
                  </p>

                  {/* Price + CTA */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 8, paddingTop: 10,
                    borderTop: '1px solid var(--card-border)'
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      {p.price}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                      background: on ? 'var(--accent)' : 'var(--card)',
                      color: on ? 'var(--btn-text)' : 'var(--text)',
                      border: '1.5px solid var(--card-border)',
                      boxShadow: on ? 'none' : '0 2px 0 var(--card-border)',
                      transition: 'all .15s'
                    }}>
                      View Deal →
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
