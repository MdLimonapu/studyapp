import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [activeModalProduct, setActiveModalProduct] = useState(null)

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
              Handpicked travel essentials, laptops, and study gear for international students.
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

      {/* Compact Grid Layout (Matching Reference Screenshot) */}
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
              <div 
                key={product.id}
                style={{
                  display: 'flex',
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '16px',
                  gap: '16px',
                  position: 'relative',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Left Side: Product Image */}
                <a 
                  href={productAffiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
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
                    textDecoration: 'none'
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </a>

                {/* Right Side: Info & Price */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <a 
                    href={productAffiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      textDecoration: 'none',
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
                  </a>

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
                    <span>Free Shipping Eligible</span>
                  </div>

                  {/* Action Link */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a 
                      href={productAffiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        textDecoration: 'none'
                      }}
                    >
                      View on Amazon ↗
                    </a>

                    <button 
                      onClick={() => setActiveModalProduct(product)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Specs ℹ️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Specs Modal */}
      {activeModalProduct && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box" style={{ maxWidth: '540px', padding: '28px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Product Specifications</h3>
              <button 
                onClick={() => setActiveModalProduct(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '100px', height: '100px', background: '#ffffff', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={activeModalProduct.image} alt={activeModalProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{activeModalProduct.name}</h4>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{activeModalProduct.price}</div>
              </div>
            </div>

            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              {activeModalProduct.highlights.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>

            <a 
              href={buildAmazonUrl(activeModalProduct.asin, AMAZON_ASSOCIATE_TAG)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                background: 'var(--accent)',
                color: '#000000',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px',
                borderRadius: '6px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Check Price on Amazon ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
