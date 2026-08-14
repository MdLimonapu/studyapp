import { useState, useMemo, useEffect } from 'react'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'
import SEO from '../components/SEO'
import { fetchCustomProducts, extractProductFromUrl, addCustomProduct, deleteCustomProduct } from '../api'

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
    <span style={{ fontSize: 11, color: '#999' }}>({count ? count.toLocaleString() : 120})</span>
  </div>
)

/* ─── Fallback ─── */
const FALLBACK = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%23f5f5f5"/><text x="150" y="155" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23bbb">No image</text></svg>')

export default function Products() {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('all')
  const [hov, setHov] = useState(null)

  // Products state (starts with PRODUCTS_DATA, syncs with localStorage & API)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_products_store')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Combine defaults and custom
          const existingIds = new Set(PRODUCTS_DATA.map(p => p.id))
          const uniqueCustom = parsed.filter(p => !existingIds.has(p.id))
          return [...PRODUCTS_DATA, ...uniqueCustom]
        }
      }
    } catch (e) {}
    return PRODUCTS_DATA
  })

  // Modal State for Remote Link Extraction & Addition
  const [showAddModal, setShowAddModal] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedProduct, setExtractedProduct] = useState(null)
  const [extractError, setExtractError] = useState('')

  // Sync custom products from API backend on mount
  useEffect(() => {
    fetchCustomProducts().then(customItems => {
      if (Array.isArray(customItems) && customItems.length > 0) {
        setProducts(prev => {
          const map = new Map()
          PRODUCTS_DATA.forEach(p => map.set(p.id, p))
          // Add local custom
          const savedLocal = localStorage.getItem('custom_products_store')
          if (savedLocal) {
            try {
              JSON.parse(savedLocal).forEach(p => map.set(p.id, p))
            } catch (e) {}
          }
          // Add remote DB custom
          customItems.forEach(p => map.set(p.id, p))
          return Array.from(map.values())
        })
      }
    }).catch(() => {})
  }, [])

  // Auto-Extract Amazon Link details
  const handleExtractLink = async () => {
    if (!inputUrl.trim()) return
    setIsExtracting(true)
    setExtractError('')
    setExtractedProduct(null)

    try {
      // 1. Client-Side Regex Extraction (instant)
      const asinMatch = inputUrl.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/)([A-Z0-9]{10})/)
      const domainMatch = inputUrl.match(/amazon\.([a-z\.]+)/)

      if (!asinMatch) {
        setExtractError('Could not find a valid 10-character Amazon ASIN in this link. Make sure it contains /dp/ASIN')
        setIsExtracting(false)
        return
      }

      const asin = asinMatch[1]
      const domain = domainMatch ? domainMatch[1] : 'de'
      const affiliateUrl = `https://www.amazon.${domain}/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`

      // Create base pre-filled product object
      const draftProduct = {
        id: `amazon-${asin.toLowerCase()}`,
        name: `Amazon Product (${asin})`,
        category: 'dorm',
        asin: asin,
        domain: domain,
        customUrl: affiliateUrl,
        image: '/products/siemens-washer.jpg',
        rating: 4.7,
        reviewsCount: 1450,
        price: 'Check Price',
        badge: 'Amazon Deal',
        shortDesc: 'Curated Amazon student essential item with direct partner referral tracking.',
        highlights: [
          'Direct affiliate partner link on Amazon',
          'Fast EU & International delivery',
          'Student friendly deal'
        ],
        targetCountries: ['Germany', 'Global']
      }

      // 2. Try Backend API scrape for title/price
      const res = await extractProductFromUrl(inputUrl)
      if (res && res.status === 'success' && res.product) {
        if (res.product.name && !res.product.name.includes('Product (')) {
          draftProduct.name = res.product.name
        }
        if (res.product.price) {
          draftProduct.price = res.product.price
        }
      }

      setExtractedProduct(draftProduct)
    } catch (err) {
      console.warn('Extraction notice:', err)
    } finally {
      setIsExtracting(false)
    }
  }

  // Save Extracted / Edited Product
  const handleSaveProduct = async () => {
    if (!extractedProduct) return

    const newProduct = { ...extractedProduct }

    // 1. Update state
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)])

    // 2. Save to LocalStorage
    try {
      const savedLocal = localStorage.getItem('custom_products_store')
      let list = []
      if (savedLocal) list = JSON.parse(savedLocal)
      list = [newProduct, ...list.filter(p => p.id !== newProduct.id)]
      localStorage.setItem('custom_products_store', JSON.stringify(list))
    } catch (e) {}

    // 3. Post to MongoDB Backend
    try {
      await addCustomProduct(newProduct)
    } catch (e) {}

    // Reset Modal
    setShowAddModal(false)
    setInputUrl('')
    setExtractedProduct(null)
  }

  // Remove custom product
  const handleDeleteProduct = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to remove this product from the store?')) return

    setProducts(prev => prev.filter(p => p.id !== id))

    try {
      const savedLocal = localStorage.getItem('custom_products_store')
      if (savedLocal) {
        const list = JSON.parse(savedLocal).filter(p => p.id !== id)
        localStorage.setItem('custom_products_store', JSON.stringify(list))
      }
    } catch (e) {}

    try {
      await deleteCustomProduct(id)
    } catch (e) {}
  }

  const filteredList = useMemo(() => products.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false
    if (q && !(p.name + p.shortDesc + (p.badge || '')).toLowerCase().includes(q.toLowerCase())) return false
    if (region !== 'all' && !p.targetCountries.includes('Global') && !p.targetCountries.includes(region)) return false
    return true
  }), [products, cat, q, region])

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
      <SEO
        title="Essentials Store — Student Laptops, Gear & Dorm Accessories | Studplex"
        description="Curated student essentials: laptops, international power adapters, durable luggage, noise-canceling headphones, and dorm room necessities for studying abroad."
        keywords="student laptops, travel adapter, student luggage, noise canceling headphones, dorm accessories, study abroad store, student essentials"
        canonical="https://studplex.com/products"
      />

      {/* ═══ TOP BAR / HEADER ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3faa 0%, #2851c5 60%, #3b6de0 100%)',
        padding: '0 20px 48px',
        marginBottom: 0
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Nav bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 28px' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color .15s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Studplex
            </a>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Quick Remote Add Button */}
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'background .2s'
                }}
              >
                <span>➕</span> Add Product by Link
              </button>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Stud<span style={{ opacity: 0.7 }}>plex</span></span>
            </div>
          </div>

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
          <span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>{filteredList.length} product{filteredList.length !== 1 ? 's' : ''} found</span>
          <span style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>As an Amazon Associate, Studplex earns from qualifying purchases.</span>
        </div>

        {/* ═══ PRODUCT GRID ═══ */}
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: 12, background: '#fff', border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No products found</p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Try a different search or category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 16 }}>
            {filteredList.map(p => {
              const url = p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain || 'de')
              const on = hov === p.id
              const isCustom = p.id.startsWith('amazon-') && !PRODUCTS_DATA.some(d => d.id === p.id)

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
                    transition: 'all .2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Image */}
                  <div style={{
                    position: 'relative', width: '100%', aspectRatio: '4/3',
                    background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: `1px solid ${C.border}`
                  }}>
                    <img
                      src={p.image} alt={p.name} loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { e.currentTarget.src = FALLBACK }}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform .3s ease',
                        transform: on ? 'scale(1.05)' : 'scale(1)'
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
                    {isCustom && (
                      <button
                        onClick={(e) => handleDeleteProduct(e, p.id)}
                        title="Delete product"
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(204, 61, 0, 0.9)', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 26, height: 26, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12
                        }}
                      >
                        ✕
                      </button>
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

      {/* ═══ REMOTE ADD PRODUCT MODAL ═══ */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, maxWidth: 540, width: '100%',
            padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>➕ Add Amazon Product remotely</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
              Paste any Amazon link (from <strong>Amazon.de</strong> or <strong>Amazon.com</strong>). The system will automatically extract the ASIN, attach your affiliate tracking tag (<code>limison-21</code>), and generate the product card!
            </p>

            {/* Input URL */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Amazon Product Link</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.amazon.de/dp/B0CH31SQH8..."
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8,
                    border: '1.5px solid #ccc', fontSize: 13, outline: 'none'
                  }}
                />
                <button
                  onClick={handleExtractLink}
                  disabled={isExtracting || !inputUrl.trim()}
                  style={{
                    padding: '10px 16px', borderRadius: 8, background: C.cta,
                    color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
                    cursor: isExtracting ? 'wait' : 'pointer'
                  }}
                >
                  {isExtracting ? 'Extracting...' : 'Auto Extract'}
                </button>
              </div>
              {extractError && <p style={{ color: '#d32f2f', fontSize: 12, marginTop: 6 }}>{extractError}</p>}
            </div>

            {/* Live Extracted Product Editor & Card Preview */}
            {extractedProduct && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.badge, margin: '0 0 12px', textTransform: 'uppercase' }}>✅ Product Extracted Successfully</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Product Title</label>
                    <input
                      type="text"
                      value={extractedProduct.name}
                      onChange={(e) => setExtractedProduct({ ...extractedProduct, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Price</label>
                      <input
                        type="text"
                        value={extractedProduct.price}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, price: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Category</label>
                      <select
                        value={extractedProduct.category}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, category: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                      >
                        <option value="dorm">Household & Dorm</option>
                        <option value="tech">Tech</option>
                        <option value="travel">Travel</option>
                        <option value="supplies">Study</option>
                        <option value="adapters">Power</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Badge Tag</label>
                    <input
                      type="text"
                      value={extractedProduct.badge}
                      onChange={(e) => setExtractedProduct({ ...extractedProduct, badge: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Product Image URL</label>
                    <input
                      type="text"
                      value={extractedProduct.image}
                      onChange={(e) => setExtractedProduct({ ...extractedProduct, image: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                    />
                  </div>

                  {/* Affiliate Link Display */}
                  <div style={{ fontSize: 11, color: '#666', background: '#fff', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                    <strong>Generated Affiliate Link:</strong><br/>
                    <code style={{ wordBreak: 'break-all', color: C.cta }}>{extractedProduct.customUrl}</code>
                  </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    onClick={handleSaveProduct}
                    style={{
                      padding: '10px 24px', borderRadius: 8, background: C.badge,
                      color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer'
                    }}
                  >
                    🚀 Publish Product to Store
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
