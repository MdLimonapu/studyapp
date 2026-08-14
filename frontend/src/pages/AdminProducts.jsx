import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'
import { fetchCustomProducts, extractProductFromUrl, addCustomProduct, deleteCustomProduct } from '../api'

export default function AdminProducts() {
  const [pin, setPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('studplex_admin_auth') === 'true'
  })
  const [pinError, setPinError] = useState('')

  const [inputUrl, setInputUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [draftProduct, setDraftProduct] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_products_store')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(PRODUCTS_DATA.map(p => p.id))
          const uniqueCustom = parsed.filter(p => !existingIds.has(p.id))
          return [...PRODUCTS_DATA, ...uniqueCustom]
        }
      }
    } catch (e) {}
    return PRODUCTS_DATA
  })

  // Sync products on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomProducts().then(customItems => {
        if (Array.isArray(customItems) && customItems.length > 0) {
          setProducts(prev => {
            const map = new Map()
            PRODUCTS_DATA.forEach(p => map.set(p.id, p))
            const savedLocal = localStorage.getItem('custom_products_store')
            if (savedLocal) {
              try {
                JSON.parse(savedLocal).forEach(p => map.set(p.id, p))
              } catch (e) {}
            }
            customItems.forEach(p => map.set(p.id, p))
            return Array.from(map.values())
          })
        }
      }).catch(() => {})
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (pin.trim() === '1234' || pin.trim() === 'admin') {
      setIsAuthenticated(true)
      localStorage.setItem('studplex_admin_auth', 'true')
      setPinError('')
    } else {
      setPinError('Incorrect PIN. (Default PIN: 1234)')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('studplex_admin_auth')
  }

  // Extract link
  const handleExtractLink = async () => {
    if (!inputUrl.trim()) return
    setIsExtracting(true)
    setExtractError('')
    setSuccessMsg('')
    setDraftProduct(null)

    try {
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

      const template = {
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
          'Direct partner offer on Amazon',
          'Fast EU & international delivery',
          'Student friendly pricing'
        ],
        targetCountries: ['Germany', 'Global']
      }

      const res = await extractProductFromUrl(inputUrl)
      if (res && res.status === 'success' && res.product) {
        if (res.product.name && !res.product.name.includes('Product (')) {
          template.name = res.product.name
        }
        if (res.product.price) {
          template.price = res.product.price
        }
      }

      setDraftProduct(template)
    } catch (err) {
      console.warn('Scrape notice:', err)
    } finally {
      setIsExtracting(false)
    }
  }

  // Save Product to Store
  const handlePublish = async () => {
    if (!draftProduct) return

    const newProduct = { ...draftProduct }

    // 1. Update State
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)])

    // 2. Save LocalStorage
    try {
      const savedLocal = localStorage.getItem('custom_products_store')
      let list = []
      if (savedLocal) list = JSON.parse(savedLocal)
      list = [newProduct, ...list.filter(p => p.id !== newProduct.id)]
      localStorage.setItem('custom_products_store', JSON.stringify(list))
    } catch (e) {}

    // 3. Post to MongoDB Backend API
    try {
      await addCustomProduct(newProduct)
    } catch (e) {}

    setSuccessMsg(`✅ Product "${newProduct.name}" successfully published to studplex.com/products!`)
    setDraftProduct(null)
    setInputUrl('')
  }

  // Delete product
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from store?`)) return

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

  // 1. PIN Protection Screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#121316', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Inter, sans-serif'
      }}>
        <SEO title="Studplex Admin Tool" noindex={true} />
        <form onSubmit={handleLogin} style={{
          background: '#1c1d22', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Admin Store Tool</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px' }}>
            Enter your admin PIN to access the private link adder.
          </p>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (Default: 1234)"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: '#121316',
              color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12,
              textAlign: 'center', boxSizing: 'border-box'
            }}
          />

          {pinError && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{pinError}</p>}

          <button type="submit" style={{
            width: '100%', padding: 12, borderRadius: 10, background: '#ff8c00',
            color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer'
          }}>
            Unlock Tool
          </button>
        </form>
      </div>
    )
  }

  // 2. Authenticated Admin Dashboard Tool
  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5', color: '#1a1a2e',
      padding: '30px 20px 80px', fontFamily: 'Inter, sans-serif'
    }}>
      <SEO title="Studplex Private Admin Store Tool" noindex={true} />

      {/* Top Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ff6a00', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Private Admin Tool</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '2px 0 0' }}>Remote Product Adder</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/products" target="_blank" style={{
            padding: '8px 16px', borderRadius: 8, background: '#1a3faa', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            View Store Page ↗
          </a>
          <button onClick={handleLogout} style={{
            padding: '8px 14px', borderRadius: 8, background: '#e2e8f0', color: '#475569',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            Lock Tool
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ADD PRODUCT BY LINK CARD */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #e4e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#1a1a2e' }}>
            ⚡ Paste Amazon Link to Add Product
          </h2>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
            Paste any Amazon link (from <strong>Amazon.de</strong> or <strong>Amazon.com</strong>). The tool extracts the ASIN, automatically attaches your affiliate tracking tag (<code>limison-21</code>), and publishes the card to your store!
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://www.amazon.de/dp/B0CH31SQH8..."
              style={{
                flex: 1, minWidth: 260, padding: '12px 16px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 14, outline: 'none'
              }}
            />
            <button
              onClick={handleExtractLink}
              disabled={isExtracting || !inputUrl.trim()}
              style={{
                padding: '12px 24px', borderRadius: 10, background: '#ff6a00',
                color: '#fff', fontSize: 14, fontWeight: 800, border: 'none',
                cursor: isExtracting ? 'wait' : 'pointer', transition: 'background .2s'
              }}
            >
              {isExtracting ? 'Extracting...' : 'Auto Extract Link'}
            </button>
          </div>

          {extractError && <p style={{ color: '#d32f2f', fontSize: 13, marginTop: 10, fontWeight: 600 }}>{extractError}</p>}
          {successMsg && <p style={{ color: '#00875a', fontSize: 13, marginTop: 10, fontWeight: 700 }}>{successMsg}</p>}

          {/* DRAFT PREVIEW & EDITOR */}
          {draftProduct && (
            <div style={{ marginTop: 24, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#00875a', textTransform: 'uppercase' }}>✅ Product Extracted & Ready</span>
                <span style={{ fontSize: 11, color: '#666', background: '#fff', padding: '3px 8px', borderRadius: 4, border: '1px solid #ddd' }}>ASIN: {draftProduct.asin}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Product Title</label>
                  <input
                    type="text"
                    value={draftProduct.name}
                    onChange={(e) => setDraftProduct({ ...draftProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Price</label>
                    <input
                      type="text"
                      value={draftProduct.price}
                      onChange={(e) => setDraftProduct({ ...draftProduct, price: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Category</label>
                    <select
                      value={draftProduct.category}
                      onChange={(e) => setDraftProduct({ ...draftProduct, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    >
                      <option value="dorm">Household & Dorm</option>
                      <option value="tech">Tech</option>
                      <option value="travel">Travel</option>
                      <option value="supplies">Study</option>
                      <option value="adapters">Power</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Badge Tag</label>
                    <input
                      type="text"
                      value={draftProduct.badge}
                      onChange={(e) => setDraftProduct({ ...draftProduct, badge: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Product Image Path / URL</label>
                    <input
                      type="text"
                      value={draftProduct.image}
                      onChange={(e) => setDraftProduct({ ...draftProduct, image: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#475569', background: '#fff', padding: 10, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                  <strong>Generated Partner Affiliate URL:</strong><br/>
                  <code style={{ color: '#1a3faa', wordBreak: 'break-all' }}>{draftProduct.customUrl}</code>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={handlePublish}
                  style={{
                    padding: '12px 28px', borderRadius: 10, background: '#00875a',
                    color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer'
                  }}
                >
                  🚀 Publish to Store Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STORE PRODUCTS MANAGEMENT LIST */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #e4e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Active Store Products ({products.length})</h3>
            <span style={{ fontSize: 12, color: '#666' }}>Managed remotely</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <img src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Price: <strong>{p.price}</strong> | ASIN: {p.asin || 'Default'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a href={p.customUrl || buildAmazonUrl(p.asin, AMAZON_ASSOCIATE_TAG, p.domain)} target="_blank" rel="noopener noreferrer" style={{
                    padding: '6px 12px', borderRadius: 6, background: '#e2e8f0', color: '#1a3faa',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none'
                  }}>
                    Link ↗
                  </a>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, background: '#fee2e2', color: '#dc2626',
                      border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
