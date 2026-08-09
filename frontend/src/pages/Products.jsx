import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

const Stars = ({ rating }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[...Array(5)].map((_, i) => (
      <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i < Math.round(rating) ? '#f59e0b' : '#2a2d35'}>
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.69l5.34-.78z" />
      </svg>
    ))}
  </span>
)

const FALLBACK = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%23f1f5f9"/><text x="150" y="155" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23cbd5e1">No Image</text></svg>')

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
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 20px 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', margin: '0 0 6px' }}>Studplex Store</p>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>Student Essentials</h1>
      </div>

      {/* Search + Region */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', outline: 'none' }} />
        </div>
        <select value={region} onChange={e => setRegion(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">🌍 All Regions</option>
          <option value="Germany">🇩🇪 Germany</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="USA">🇺🇸 USA</option>
          <option value="Canada">🇨🇦 Canada</option>
          <option value="Australia">🇦🇺 Australia</option>
        </select>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRODUCT_CATEGORIES.map(c => {
          const on = cat === c.id
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: on ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, width: 'auto', border: 'none',
              background: on ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              color: on ? '#f59e0b' : '#94a3b8',
              transition: 'all .15s'
            }}>
              {c.icon} {c.name}
            </button>
          )
        })}
      </div>

      {/* Count + disclosure */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{list.length} product{list.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>As an Amazon Associate, Studplex earns from qualifying purchases.</span>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📦</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No products found</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Try a different search or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 16 }}>
          {list.map(p => {
            const url = p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain || 'com')
            const on = hov === p.id
            return (
              <a key={p.id} href={url} target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => setHov(p.id)} onMouseLeave={() => setHov(null)}
                style={{
                  display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden',
                  textDecoration: 'none', color: 'inherit',
                  background: '#1e1f25',
                  border: on ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.04)',
                  transform: on ? 'translateY(-3px)' : 'none',
                  boxShadow: on ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.12)',
                  transition: 'all .25s ease', cursor: 'pointer'
                }}>

                {/* Image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} loading="lazy" referrerPolicy="no-referrer"
                    onError={e => { e.currentTarget.src = FALLBACK }}
                    style={{ maxWidth: '75%', maxHeight: '75%', objectFit: 'contain', transition: 'transform .35s', transform: on ? 'scale(1.06)' : 'scale(1)' }} />
                  {p.badge && (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 5 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.35, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Stars rating={p.rating} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.rating} ({p.reviewsCount.toLocaleString()})</span>
                  </div>

                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
                    {p.shortDesc}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 19, fontWeight: 800, color: '#f1f5f9' }}>{p.price}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: on ? '#f59e0b' : 'rgba(245,158,11,0.1)',
                      color: on ? '#000' : '#f59e0b',
                      transition: 'all .2s'
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
