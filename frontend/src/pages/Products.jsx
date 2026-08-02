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
    <div className="products-page-container" style={{ paddingBottom: '80px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Clean Professional Store Header */}
      <div style={{ textAlign: 'center', margin: '40px 0 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Student Essentials &amp; Gear
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '640px', margin: '0 auto 20px' }}>
          Recommended travel gear, tech, and dorm supplies for international students worldwide.
        </p>
        
        {/* Official Mandatory Amazon Affiliate Disclosure */}
        <div 
          style={{
            background: 'rgba(255, 140, 0, 0.08)',
            border: '1px solid rgba(255, 140, 0, 0.25)',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--muted)',
            lineHeight: 1.5,
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <strong>Amazon Associates Disclosure:</strong> As an Amazon Associate, <strong>Studplex</strong> earns from qualifying purchases. Prices and availability are accurate as of the date/time indicated and are subject to change on Amazon.
        </div>
      </div>

      {/* Clean Search & Category Filter Bar */}
      <div 
        style={{ 
          background: 'var(--card)', 
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '36px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'rgba(0, 0, 0, 0.15)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Destination Country Filter */}
          <div style={{ width: '220px' }}>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'rgba(0, 0, 0, 0.15)',
                color: 'var(--text)',
                fontSize: '14px',
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
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                  background: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#000000' : 'var(--text)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: 'auto',
                  margin: 0
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Clean Product Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No products found</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Try searching with different terms or selecting another category.</p>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProducts.map((product) => {
            const productAffiliateUrl = buildAmazonUrl(product.asin, AMAZON_ASSOCIATE_TAG)

            return (
              <div 
                key={product.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--card)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative'
                }}
              >
                {/* Product Badge */}
                {product.badge && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      background: 'rgba(255, 140, 0, 0.9)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '14px',
                      zIndex: 2
                    }}
                  >
                    {product.badge}
                  </div>
                )}

                {/* Product Image Frame */}
                <div 
                  style={{
                    height: '210px',
                    width: '100%',
                    borderRadius: '16px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    padding: '20px',
                    boxSizing: 'border-box'
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Rating & Reviews */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 800 }}>★ {product.rating}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>({product.reviewsCount.toLocaleString()})</span>
                </div>

                {/* Product Title */}
                <h3 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.35, marginBottom: '10px', color: 'var(--text)', minHeight: '46px' }}>
                  {product.name}
                </h3>

                {/* Short Description */}
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
                  {product.shortDesc}
                </p>

                {/* Price & Amazon Referral Button */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)' }}>{product.price}</span>
                    <button 
                      onClick={() => setActiveModalProduct(product)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View Specs ℹ️
                    </button>
                  </div>

                  <a 
                    href={productAffiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #ff9900 0%, #ff8c00 100%)',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    View on Amazon ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Specs Modal */}
      {activeModalProduct && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box" style={{ maxWidth: '580px', padding: '32px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Product Specifications</h3>
              <button 
                onClick={() => setActiveModalProduct(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '140px', height: '140px', background: '#ffffff', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={activeModalProduct.image} alt={activeModalProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{activeModalProduct.name}</h4>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', marginBottom: '6px' }}>{activeModalProduct.price}</div>
                <div style={{ color: '#f59e0b', fontSize: '13px' }}>★ {activeModalProduct.rating} / 5.0 ({activeModalProduct.reviewsCount.toLocaleString()} reviews)</div>
              </div>
            </div>

            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Highlights:</h5>
            <ul style={{ paddingLeft: '20px', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              {activeModalProduct.highlights.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
              ))}
            </ul>

            <a 
              href={buildAmazonUrl(activeModalProduct.asin, AMAZON_ASSOCIATE_TAG)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ff9900 0%, #ff8c00 100%)',
                color: '#000000',
                fontWeight: 800,
                fontSize: '14px',
                padding: '14px',
                borderRadius: '12px',
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
