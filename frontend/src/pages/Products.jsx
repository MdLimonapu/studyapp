import { useState, useMemo } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [activeModalProduct, setActiveModalProduct] = useState(null)
  const [tagInput, setTagInput] = useState(AMAZON_ASSOCIATE_TAG)
  const [customTag, setCustomTag] = useState(AMAZON_ASSOCIATE_TAG)

  const handleApplyTag = (e) => {
    e.preventDefault()
    if (tagInput.trim()) {
      setCustomTag(tagInput.trim())
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
    <div className="products-page-container" style={{ paddingBottom: '60px' }}>
      {/* Hero Banner Header */}
      <section 
        className="card hero-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.12) 0%, rgba(94, 146, 243, 0.08) 100%)',
          border: '1px solid rgba(255, 140, 0, 0.25)',
          padding: '40px 32px',
          borderRadius: '24px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 140, 0, 0.15)',
              color: '#ff8c00',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}
          >
            🛒 Student Store &amp; Travel Essentials
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.15, marginBottom: '14px' }}>
            Handpicked Gear for <span style={{ color: 'var(--accent)' }}>International Students</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
            Everything you need for studying abroad—from international universal voltage power adapters and noise-canceling headphones to airline-approved luggage and laptops.
          </p>

          {/* Tag Configuration Setting for User */}
          <form onSubmit={handleApplyTag} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>
              Amazon Tracking Tag ID:
            </div>
            <input 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. studplex-20"
              style={{
                width: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
            <button 
              type="submit"
              className="btn-accent" 
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', width: 'auto', margin: 0 }}
            >
              Update Tag
            </button>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
              Active Tag: {customTag}
            </span>
          </form>
        </div>
      </section>

      {/* Legal Mandatory Amazon Affiliate Disclosure */}
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderLeft: '4px solid #ff8c00',
          padding: '14px 20px',
          borderRadius: '8px',
          marginBottom: '28px',
          fontSize: '13px',
          color: 'var(--muted)',
          lineHeight: 1.5
        }}
      >
        <strong>⚖️ Amazon Affiliate Disclosure:</strong> As an Amazon Associate, <strong>Studplex</strong> earns from qualifying purchases. When you buy through links on our site, we may earn an affiliate commission at no additional cost to you. Product prices and availability are accurate as of the date/time indicated and are subject to change on Amazon.
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {/* Search Bar & Country Select */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input 
              type="text"
              placeholder="Search products (e.g. laptop, adapter, luggage)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                fontSize: '15px'
              }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                fontSize: '15px',
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

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '30px',
                border: selectedCategory === cat.id ? '2px solid #ff8c00' : '1px solid var(--card-border)',
                background: selectedCategory === cat.id ? 'rgba(255, 140, 0, 0.15)' : 'var(--card-bg)',
                color: selectedCategory === cat.id ? '#ff8c00' : 'var(--text)',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                width: 'auto',
                margin: 0
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3>No matching products found</h3>
          <p style={{ color: 'var(--muted)' }}>Try adjusting your search query or filter categories.</p>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProducts.map((product) => {
            const productAffiliateUrl = buildAmazonUrl(product.asin, customTag)

            return (
              <div 
                key={product.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)',
                  padding: '20px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Product Badge */}
                {product.badge && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      background: 'rgba(255, 140, 0, 0.9)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      zIndex: 2
                    }}
                  >
                    {product.badge}
                  </div>
                )}

                {/* Product Image Box */}
                <div 
                  style={{
                    height: '200px',
                    width: '100%',
                    borderRadius: '14px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    overflow: 'hidden',
                    padding: '12px',
                    boxSizing: 'border-box'
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Title & Rating */}
                <h3 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.35, marginBottom: '8px', minHeight: '44px' }}>
                  {product.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: '#f59e0b', fontSize: '14px' }}>⭐ {product.rating}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>({product.reviewsCount.toLocaleString()} reviews)</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                  {product.shortDesc}
                </p>

                {/* Price and Outbound CTA */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{product.price}</span>
                    <button 
                      onClick={() => setActiveModalProduct(product)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Details &amp; Specs ℹ️
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
                      padding: '12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)'
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

      {/* Product Details Modal */}
      {activeModalProduct && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box" style={{ maxWidth: '600px', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ff8c00', textTransform: 'uppercase' }}>
                {activeModalProduct.category.toUpperCase()} ESSENTIAL
              </span>
              <button 
                onClick={() => setActiveModalProduct(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '140px', height: '140px', background: '#fff', borderRadius: '14px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={activeModalProduct.image} alt={activeModalProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{activeModalProduct.name}</h2>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>{activeModalProduct.price}</div>
                <div style={{ color: '#f59e0b', fontSize: '13px' }}>⭐ {activeModalProduct.rating} / 5.0 ({activeModalProduct.reviewsCount.toLocaleString()} reviews)</div>
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>Key Highlights:</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              {activeModalProduct.highlights.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
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
                gap: '8px',
                background: 'linear-gradient(135deg, #ff9900 0%, #ff8c00 100%)',
                color: '#000000',
                fontWeight: 800,
                fontSize: '15px',
                padding: '14px',
                borderRadius: '14px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Check Price &amp; Availability on Amazon ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
