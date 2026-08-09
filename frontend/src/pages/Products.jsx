import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

/* ─── Stars ─── */
const Stars = ({ rating, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ display: 'inline-flex', gap: '0.5px' }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={i < Math.round(rating) ? '#ff6a00' : '#ddd'}>
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.69l5.34-.78z"/>
        </svg>
      ))}
    </span>
    <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{rating}</span>
    <span style={{ fontSize: 11, color: '#999' }}>({count.toLocaleString()} reviews)</span>
  </div>
)

/* ─── Fallback ─── */
const FALLBACK = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%23f5f5f5"/><text x="150" y="155" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23bbb">No image</text></svg>')

/* ═══════════════════════════════════════════ */
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

  /* ─ idealo-inspired palette ─ */
  const C = {
    pageBg: '#f0f2f5',
    cardBg: '#ffffff',
    border: '#e4e7eb',
    text: '#1a1a2e',
    sub: '#555',
    muted: '#888',
    price: '#cc3d00',
    cta: '#1a3faa',
    ctaHover: '#0f2e8a',
    badge: '#00875a',
    accent: '#ff6a00',
    chipActive: '#1a3faa',
    chipBg: '#eef1f6',
  }

  return (
    <div style={{
      background: C.pageBg,
      minHeight: '100vh',
      padding: '0 0 80px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

      {/* ═══ TOP BAR / HEADER ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3faa 0%, #2851c5 60%, #3b6de0 100%)',
        padding: '40px 20px 48px',
        marginBottom: 0
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: '0 0 6px' }}>Studplex Store</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em' }}>Student Essentials</h1>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 560 }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search for laptops, adapters, luggage…"
              style={{
                width: '100%', padding: '13px 16px 13px 44px', borderRadius: 10,
                border: 'none', fontSize: 14, fontWeight: 500,
                background: '#fff', color: '#1a1a2e', outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* Toolbar: Chips + Region */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
          padding: '20px 0 16px'
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRODUCT_CATEGORIES.map(c => {
              const on = cat === c.id
              return (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, width: 'auto',
                  border: on ? `2px solid ${C.chipActive}` : '2px solid transparent',
                  background: on ? '#e8edfa' : C.chipBg,
                  color: on ? C.chipActive : '#555',
                  transition: 'all .15s'
                }}>
                  {c.icon} {c.name}
                </button>
              )
            })}
          </div>

          <select value={region} onChange={e => setRegion(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${C.border}`, background: '#fff', color: C.text, cursor: 'pointer'
          }}>
            <option value="all">🌍 All Regions</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="UK">🇬🇧 UK</option>
            <option value="USA">🇺🇸 USA</option>
            <option value="Canada">🇨🇦 Canada</option>
            <option value="Australia">🇦🇺 Australia</option>
          </select>
        </div>

        {/* Results count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>{list.length} product{list.length !== 1 ? 's' : ''} found</span>
          <span style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>As an Amazon Associate, Studplex earns from qualifying purchases.</span>
        </div>

        {/* ═══ PRODUCT GRID ═══ */}
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: 12, background: '#fff', border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No products found</p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Try a different search or category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 16 }}>
            {list.map(p => {
              const url = p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain || 'com')
              const on = hov === p.id

              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setHov(p.id)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderRadius: 12, overflow: 'hidden',
                    background: C.cardBg,
                    border: on ? `1px solid ${C.cta}` : `1px solid ${C.border}`,
                    boxShadow: on ? '0 8px 24px rgba(26,63,170,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transform: on ? 'translateY(-3px)' : 'none',
                    transition: 'all .2s ease'
                  }}
                >
                  {/* Image */}
                  <div style={{
                    position: 'relative', width: '100%', aspectRatio: '4/3',
                    background: '#fafafa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: `1px solid ${C.border}`
                  }}>
                    <img
                      src={p.image} alt={p.name} loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { e.currentTarget.src = FALLBACK }}
                      style={{
                        maxWidth: '80%', maxHeight: '80%', objectFit: 'contain',
                        transition: 'transform .3s', transform: on ? 'scale(1.04)' : 'scale(1)'
                      }}
                    />
                    {p.badge && (
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        background: C.badge, color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '3px 9px',
                        borderRadius: 4, letterSpacing: '0.02em'
                      }}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Category */}
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.cta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                    </span>

                    {/* Title */}
                    <h3 style={{
                      fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4,
                      margin: '0 0 8px',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {p.name}
                    </h3>

                    {/* Stars */}
                    <div style={{ marginBottom: 8 }}>
                      <Stars rating={p.rating} count={p.reviewsCount} />
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: 12, color: '#666', lineHeight: 1.55, margin: '0 0 4px',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      flex: 1
                    }}>
                      {p.shortDesc}
                    </p>

                    {/* Highlights (first 2) */}
                    {p.highlights && (
                      <ul style={{ margin: '6px 0 0', padding: '0 0 0 16px', listStyle: 'none' }}>
                        {p.highlights.slice(0, 2).map((h, i) => (
                          <li key={i} style={{ fontSize: 11, color: '#777', lineHeight: 1.6, position: 'relative', paddingLeft: 2 }}>
                            <span style={{ position: 'absolute', left: -14, color: C.badge }}>✓</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: `1px solid ${C.border}`, margin: '12px 0 10px' }} />

                    {/* Price row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 2 }}>from</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: C.price, letterSpacing: '-0.02em' }}>
                          {p.price}
                        </span>
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          textDecoration: 'none',
                          background: on ? C.ctaHover : C.cta,
                          color: '#fff',
                          boxShadow: on ? '0 4px 12px rgba(26,63,170,0.3)' : 'none',
                          transition: 'all .15s'
                        }}
                      >
                        View on Amazon
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                      </a>
                    </div>

                    {/* Shipping info */}
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00875a" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      <span style={{ fontSize: 11, color: C.badge, fontWeight: 600 }}>Free delivery available</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
