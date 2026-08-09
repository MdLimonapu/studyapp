import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

const StarRating = ({ rating }) => {
  const full = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  return (
    <span style={{ display: 'inline-flex', gap: '1px', fontSize: '12px' }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: i < full ? '#f59e0b' : (i === full && hasHalf ? '#f59e0b' : 'rgba(255,255,255,0.15)') }}>★</span>
      ))}
    </span>
  )
}

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [hoveredId, setHoveredId] = useState(null)

  const filteredProducts = useMemo(() => {
    return PRODUCTS_DATA.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.badge && p.badge.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCountry =
        selectedCountry === 'all' ||
        p.targetCountries.includes('Global') ||
        p.targetCountries.includes(selectedCountry)
      return matchCat && matchSearch && matchCountry
    })
  }, [selectedCategory, searchQuery, selectedCountry])

  const resultCount = filteredProducts.length

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '100px' }}>

      {/* ═══ SHOP HEADER ═══ */}
      <div style={{ padding: '32px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
              Studplex Store
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Student Essentials
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: '10px',
                border: '1px solid var(--card-border)', background: 'var(--card)',
                color: 'var(--text)', fontSize: '13px', cursor: 'pointer', fontWeight: 600
              }}
            >
              <option value="all">🌍 All</option>
              <option value="Germany">🇩🇪 Germany</option>
              <option value="UK">🇬🇧 UK</option>
              <option value="USA">🇺🇸 USA</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Australia">🇦🇺 Australia</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Search laptops, adapters, luggage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 44px', borderRadius: '14px',
              border: '1px solid var(--card-border)', background: 'var(--card)',
              color: 'var(--text)', fontSize: '14px', outline: 'none'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px', borderRadius: '10px',
                  border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                  background: isActive ? 'rgba(255, 140, 0, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: isActive ? 700 : 500, fontSize: '13px',
                  cursor: 'pointer', whiteSpace: 'nowrap', width: 'auto', margin: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.icon} {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ RESULTS BAR ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {resultCount} {resultCount === 1 ? 'product' : 'products'} found
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', opacity: 0.7, fontStyle: 'italic' }}>
          As an Amazon Associate, Studplex earns from qualifying purchases.
        </span>
      </div>

      {/* ═══ PRODUCT GRID ═══ */}
      {resultCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📦</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No products found</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProducts.map((product) => {
            const productAffiliateUrl = product.customUrl || buildAmazonUrl(product.asin, AMAZON_ASSOCIATE_TAG, product.domain || 'com')
            const isHovered = hoveredId === product.id

            return (
              <a
                key={product.id}
                href={productAffiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--card)',
                  border: isHovered ? '1px solid rgba(255, 140, 0, 0.4)' : '1px solid var(--card-border)',
                  borderRadius: '16px',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,140,0,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {/* Image Container */}
                <div style={{
                  position: 'relative',
                  width: '100%', height: '220px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                    }}
                  />

                  {/* Badge */}
                  {product.badge && (
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px',
                      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
                      color: '#ffffff', fontSize: '11px', fontWeight: 700,
                      padding: '5px 10px', borderRadius: '8px',
                      letterSpacing: '0.02em'
                    }}>
                      {product.badge}
                    </div>
                  )}

                  {/* Amazon Tag */}
                  <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    background: 'rgba(255, 153, 0, 0.9)',
                    color: '#000', fontSize: '10px', fontWeight: 800,
                    padding: '4px 8px', borderRadius: '6px',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Amazon
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                  {/* Category Label */}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    {PRODUCT_CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                  </span>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '15px', fontWeight: 700, color: 'var(--text)',
                    lineHeight: 1.35, marginBottom: '10px', minHeight: '40px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <StarRating rating={product.rating} />
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {product.rating} ({product.reviewsCount.toLocaleString()})
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5,
                    marginBottom: '16px', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {product.shortDesc}
                  </p>

                  {/* Price & CTA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)' }}>
                      {product.price}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: isHovered ? 'var(--accent)' : 'rgba(255, 140, 0, 0.12)',
                      color: isHovered ? '#000' : 'var(--accent)',
                      fontSize: '12px', fontWeight: 700,
                      padding: '8px 14px', borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}>
                      View Deal
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
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
