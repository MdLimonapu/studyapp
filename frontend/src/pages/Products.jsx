import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [activeModalProduct, setActiveModalProduct] = useState(null)
  const [customTag, setCustomTag] = useState(AMAZON_ASSOCIATE_TAG)
  const [showTagSettings, setShowTagSettings] = useState(false)
  const [tagInput, setTagInput] = useState(AMAZON_ASSOCIATE_TAG)

  const handleApplyTag = (e) => {
    e.preventDefault()
    if (tagInput.trim()) {
      setCustomTag(tagInput.trim())
      setShowTagSettings(false)
    }
  }

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
      
      {/* Sleek Modern Hero Header */}
      <section 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
          border: '1px solid var(--card-border)',
          padding: '48px 36px',
          borderRadius: '24px',
          marginBottom: '28px',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '720px' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 140, 0, 0.18)',
                color: '#ff8c00',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}
            >
              🎓 Student Essentials &amp; Travel Gear
            </div>
            <h1 style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Essential Products for <span style={{ color: 'var(--accent)' }}>International Students</span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Handpicked, highly rated gear for moving and studying abroad—from universal adapters and luggage to laptops and dorm essentials.
            </p>
          </div>

          <button
            onClick={() => setShowTagSettings(!showTagSettings)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: 'auto',
              margin: 0
            }}
          >
            ⚙️ Tag: <strong>{customTag}</strong>
          </button>
        </div>

        {showTagSettings && (
          <form onSubmit={handleApplyTag} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Amazon Associate Tag:</span>
            <input 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
            <button type="submit" className="btn-accent" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', width: 'auto', margin: 0 }}>
              Save Tag
            </button>
          </form>
        )}
      </section>

      {/* FTC Amazon Legal Disclaimer Banner */}
      <div 
        style={{
          background: 'rgba(255, 140, 0, 0.06)',
          border: '1px solid rgba(255, 140, 0, 0.2)',
          padding: '14px 20px',
          borderRadius: '14px',
          marginBottom: '32px',
          fontSize: '13px',
          color: 'var(--muted)',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontSize: '18px' }}>⚖️</span>
        <div>
          <strong>Amazon Associate Notice:</strong> As an Amazon Associate, <strong>Studplex</strong> earns from qualifying purchases at no extra cost to you. Prices and availability are subject to change on Amazon.
        </div>
      </div>

      {/* Search & Filter Control Panel */}
      <div 
        style={{ 
          background: 'var(--card)', 
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '36px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input 
              type="text"
              placeholder="Search gear (e.g. MacBook, Universal Adapter, Backpack)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Destination Selector */}
          <div style={{ width: '220px' }}>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">🌍 All Destination Countries</option>
              <option value="Germany">🇩🇪 Germany</option>
              <option value="UK">🇬🇧 United Kingdom</option>
              <option value="USA">🇺🇸 United States</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Australia">🇦🇺 Australia</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
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
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                  background: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#000000' : 'var(--text)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No products found</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Try searching with different terms or selecting another category.</p>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '28px'
          }}
        >
          {filteredProducts.map((product) => {
            const productAffiliateUrl = buildAmazonUrl(product.asin, customTag)

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
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative'
                }}
              >
                {/* Product Badge Pill */}
                {product.badge && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      background: 'linear-gradient(135deg, #ff8c00 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      letterSpacing: '0.02em',
                      zIndex: 2,
                      boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)'
                    }}
                  >
                    {product.badge}
                  </div>
                )}

                {/* Product Image Frame */}
                <div 
                  style={{
                    height: '220px',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 800 }}>★ {product.rating}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>({product.reviewsCount.toLocaleString()})</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    {product.category}
                  </span>
                </div>

                {/* Product Title */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.3, marginBottom: '10px', color: 'var(--text)', minHeight: '48px' }}>
                  {product.name}
                </h3>

                {/* Short Description */}
                <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
                  {product.shortDesc}
                </p>

                {/* Pricing & CTA Row */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Amazon Price</span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)' }}>{product.price}</span>
                    </div>

                    <button 
                      onClick={() => setActiveModalProduct(product)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '8px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Quick Specs ℹ️
                    </button>
                  </div>

                  {/* High-Converting Amazon Referral CTA Button */}
                  <a 
                    href={productAffiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      background: 'linear-gradient(135deg, #ff9900 0%, #ff8c00 100%)',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(255, 140, 0, 0.3)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span>Check on Amazon</span>
                    <span style={{ fontSize: '16px' }}>↗</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Specs Modal */}
      {activeModalProduct && (
        <div className="modal-overlay" style={{ zIndex: 2000, background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="modal-box" style={{ maxWidth: '620px', padding: '36px', borderRadius: '24px', background: 'var(--dark2)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ff8c00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {activeModalProduct.category} Essential
              </span>
              <button 
                onClick={() => setActiveModalProduct(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ width: '160px', height: '160px', background: '#ffffff', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={activeModalProduct.image} alt={activeModalProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', lineHeight: 1.3 }}>{activeModalProduct.name}</h2>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>{activeModalProduct.price}</div>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}>★ {activeModalProduct.rating} / 5.0 ({activeModalProduct.reviewsCount.toLocaleString()} Amazon reviews)</div>
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>Product Highlights:</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '28px' }}>
              {activeModalProduct.highlights.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
              ))}
            </ul>

            <a 
              href={buildAmazonUrl(activeModalProduct.asin, customTag)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #ff9900 0%, #ff8c00 100%)',
                color: '#000000',
                fontWeight: 800,
                fontSize: '15px',
                padding: '16px',
                borderRadius: '14px',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(255, 140, 0, 0.35)'
              }}
            >
              View Latest Price on Amazon ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
