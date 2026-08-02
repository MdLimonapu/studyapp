import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')

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

  return (
    <div className="products-page-container" style={{ paddingBottom: '80px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Clean Minimalist Header */}
      <div style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--card-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Student Essentials &amp; Tech Gear
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>
              Handpicked travel essentials, laptops, and study gear for international students. Click any product to view directly on Amazon.
            </p>
          </div>

          {/* Destination Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="all">🌍 All Destinations</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="UK">🇬🇧 United Kingdom</option>
            <option value="USA">🇺🇸 United States</option>
            <option value="Canada">🇨🇦 Canada</option>
            <option value="Australia">🇦🇺 Australia</option>
          </select>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '16px', paddingBottom: '4px' }}>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#000000' : 'var(--text)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  margin: 0
                }}
              >
                {cat.icon} {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Official Amazon Affiliate Disclosure */}
      <div 
        style={{
          fontSize: '11px',
          color: 'var(--muted)',
          marginBottom: '20px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '6px',
          border: '1px solid var(--card-border)'
        }}
      >
        <strong>Amazon Associate Disclosure:</strong> As an Amazon Associate, Studplex earns from qualifying purchases. Prices &amp; availability subject to change on Amazon.
      </div>

      {/* Compact Grid Layout */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No products found matching your search criteria.</p>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '12px'
          }}
        >
          {filteredProducts.map((product) => {
            const productAffiliateUrl = buildAmazonUrl(product.asin, AMAZON_ASSOCIATE_TAG)

            return (
              <a
                key={product.id}
                href={productAffiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '16px',
                  gap: '16px',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer'
                }}
                className="product-card-link"
              >
                {/* Left Side: Product Image */}
                <div 
                  style={{
                    width: '120px',
                    height: '120px',
                    flexShrink: 0,
                    background: '#ffffff',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&auto=format&fit=crop&q=80';
                    }}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Right Side: Info & Price */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div 
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      lineHeight: 1.3,
                      marginBottom: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                    title={product.name}
                  >
                    {product.name}
                  </div>

                  {/* Price Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                      {product.price}
                    </span>
                    <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 700 }}>✓</span>
                  </div>

                  {/* Rating / Free Shipping label */}
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                    <span>⭐ {product.rating} ({product.reviewsCount.toLocaleString()})</span>
                    <span style={{ margin: '0 6px' }}>•</span>
                    <span>Free Shipping</span>
                  </div>

                  {/* Direct Buy Link Indicator */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--accent)'
                      }}
                    >
                      Buy on Amazon ↗
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
