import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES } from '../data/productsData'
import { fetchCustomProducts, extractProductFromUrl, addCustomProduct, deleteCustomProduct, uploadProductImage } from '../api'

const ADMIN_PIN = '1234'

const PRESET_SHORTCUTS = [
  { label: 'Earbuds', icon: '🎧', src: '/products/sony-headphones.jpg', cat: 'tech' },
  { label: 'Laptop', icon: '💻', src: '/products/macbook-air.jpg', cat: 'tech' },
  { label: 'Bulb', icon: '💡', src: '/products/govee-bulb.jpg', cat: 'dorm' },
  { label: 'Washer', icon: '🧺', src: '/products/siemens-washer.jpg', cat: 'dorm' },
  { label: 'Adapter', icon: '⚡', src: '/products/epicka-adapter.jpg', cat: 'adapters' },
  { label: 'Powerbank', icon: '🔋', src: '/products/anker-powerbank.jpg', cat: 'adapters' },
  { label: 'Luggage', icon: '🧳', src: '/products/samsonite-luggage.jpg', cat: 'travel' },
  { label: 'Backpack', icon: '🎒', src: '/products/matein-backpack.jpg', cat: 'travel' },
  { label: 'Kindle', icon: '📚', src: '/products/kindle-paperwhite.jpg', cat: 'supplies' },
  { label: 'Bedding', icon: '🛏️', src: '/products/utopia-bedding.jpg', cat: 'dorm' },
]

export default function AdminProducts() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(() => sessionStorage.getItem('sp_admin') === '1')
  const [pinErr, setPinErr] = useState('')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const custom = await fetchCustomProducts()
      const map = new Map()
      if (Array.isArray(custom)) custom.forEach(p => map.set(p.id, p))
      PRODUCTS_DATA.forEach(p => { if (!map.has(p.id)) map.set(p.id, p) })
      setProducts(Array.from(map.values()))
    } catch {
      setProducts([...PRODUCTS_DATA])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (auth) loadData()
  }, [auth, loadData])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleLogin = e => {
    e.preventDefault()
    if (pin.trim() === ADMIN_PIN || pin.trim() === 'admin') {
      setAuth(true)
      sessionStorage.setItem('sp_admin', '1')
    } else {
      setPinErr('Incorrect PIN code')
    }
  }

  const createBlankDraft = () => ({
    id: `prod_${Date.now()}`,
    name: '',
    category: 'dorm',
    asin: '',
    domain: 'de',
    customUrl: '',
    image: '',
    rating: 4.6,
    reviewsCount: 350,
    price: '',
    badge: '',
    shortDesc: '',
    highlights: ['', '', ''],
    targetCountries: ['Germany', 'Global']
  })

  const handleOpenAdd = () => {
    setDraft(createBlankDraft())
    setIsEditing(false)
    setUrlInput('')
    setModalOpen(true)
  }

  const handleOpenEdit = p => {
    const hl = Array.isArray(p.highlights) && p.highlights.length > 0
      ? [...p.highlights, '', '', ''].slice(0, 3)
      : ['', '', '']
    setDraft({ ...p, highlights: hl })
    setIsEditing(true)
    setUrlInput('')
    setModalOpen(true)
  }

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return
    setExtracting(true)
    try {
      let rawUrl = urlInput.trim()
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl
      }
      const res = await extractProductFromUrl(rawUrl)
      if (res?.status === 'success' && res.product) {
        const ext = res.product
        setDraft(prev => ({
          ...prev,
          id: ext.id || prev.id,
          name: ext.name || prev.name,
          asin: ext.asin || prev.asin,
          domain: ext.domain || prev.domain,
          customUrl: ext.customUrl || prev.customUrl,
          image: ext.image || prev.image,
          price: ext.price || prev.price,
          badge: ext.badge || prev.badge,
          shortDesc: ext.shortDesc || prev.shortDesc,
          category: ext.category || prev.category,
        }))
        setToast({ type: 'success', text: 'Extracted product details from link!' })
      } else {
        setToast({ type: 'error', text: 'Could not parse URL automatically. Fill fields manually.' })
      }
    } catch {
      setToast({ type: 'error', text: 'Extraction failed. Please check the URL.' })
    }
    setExtracting(false)
  }

  const handleFileUpload = async file => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadProductImage(file)
      if (res?.image_url) {
        const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001'
        const fullUrl = res.image_url.startsWith('http') ? res.image_url : base + res.image_url
        setDraft(prev => ({ ...prev, image: fullUrl }))
        setToast({ type: 'success', text: 'Image uploaded to cloud database!' })
      } else {
        // Fallback local base64 preview
        const reader = new FileReader()
        reader.onload = ev => setDraft(prev => ({ ...prev, image: ev.target.result }))
        reader.readAsDataURL(file)
        setToast({ type: 'success', text: 'Image preview loaded!' })
      }
    } catch {
      const reader = new FileReader()
      reader.onload = ev => setDraft(prev => ({ ...prev, image: ev.target.result }))
      reader.readAsDataURL(file)
      setToast({ type: 'success', text: 'Image preview loaded locally!' })
    }
    setUploading(false)
  }

  const handleSaveProduct = async () => {
    if (!draft?.name?.trim()) {
      setToast({ type: 'error', text: 'Product name is required.' })
      return
    }
    setSaving(true)
    const payload = {
      ...draft,
      highlights: (draft.highlights || []).filter(h => h.trim()),
      id: draft.id || `prod_${Date.now()}`
    }
    try {
      await addCustomProduct(payload)
      setToast({ type: 'success', text: `Saved "${payload.name}"!` })
      setModalOpen(false)
      setDraft(null)
      await loadData()
    } catch {
      setToast({ type: 'error', text: 'Failed to save product.' })
    }
    setSaving(false)
  }

  const handleDeleteProduct = async p => {
    if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return
    try {
      await deleteCustomProduct(p.id)
      setToast({ type: 'success', text: `Deleted "${p.name}"` })
      await loadData()
    } catch {
      setToast({ type: 'error', text: 'Failed to delete.' })
    }
  }

  const filteredProducts = products.filter(p => {
    if (selectedCat !== 'all' && p.category !== selectedCat) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const nameMatch = (p.name || '').toLowerCase().includes(q)
      const descMatch = (p.shortDesc || '').toLowerCase().includes(q)
      const asinMatch = (p.asin || '').toLowerCase().includes(q)
      if (!nameMatch && !descMatch && !asinMatch) return false
    }
    return true
  })

  // ─── LOGIN SCREEN ───
  if (!auth) {
    return (
      <div className="admin-panel ap-login-wrap">
        <SEO title="Admin — Studplex" noindex={true} />
        <div className="ap-login-box">
          <div className="ap-login-icon">🔒</div>
          <h1 className="ap-login-title">Studplex Admin</h1>
          <p className="ap-login-sub">Enter your security PIN to manage products</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={10}
              autoFocus
              className="ap-login-input"
            />
            {pinErr && <div className="ap-login-err">{pinErr}</div>}
            <button type="submit" className="ap-btn-submit">Unlock Dashboard</button>
          </form>
        </div>
        <ScopedStyles />
      </div>
    )
  }

  // ─── MAIN DASHBOARD ───
  return (
    <div className="admin-panel ap-root">
      <SEO title="Admin Dashboard — Studplex" noindex={true} />

      {/* Toast Notification */}
      {toast && (
        <div className={`ap-toast ap-toast-${toast.type || 'info'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="ap-header">
        <div className="ap-header-left">
          <div className="ap-brand-icon">⚡</div>
          <div>
            <h1 className="ap-brand-title">Studplex Catalog Manager</h1>
            <span className="ap-brand-meta">{products.length} total products in database</span>
          </div>
        </div>
        <div className="ap-header-right">
          <a href="/products" target="_blank" rel="noopener noreferrer" className="ap-btn-secondary">
            View Live Store ↗
          </a>
          <button
            type="button"
            onClick={() => { setAuth(false); sessionStorage.removeItem('sp_admin') }}
            className="ap-btn-danger-outline"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="ap-body">
        {/* Controls Bar */}
        <div className="ap-controls">
          <div className="ap-search-wrap">
            <span className="ap-search-icon">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name, ASIN or description..."
              className="ap-search-input"
            />
          </div>

          <div className="ap-filters">
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="ap-select"
            >
              <option value="all">All Categories ({products.length})</option>
              {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(c => {
                const count = products.filter(p => p.category === c.id).length
                return (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} ({count})
                  </option>
                )
              })}
            </select>

            <button type="button" onClick={handleOpenAdd} className="ap-btn-primary">
              <span>+</span> Add Product
            </button>
          </div>
        </div>

        {/* Product Cards / Table */}
        {loading ? (
          <div className="ap-empty-state">
            <div className="ap-spinner"></div>
            <p>Loading database products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="ap-empty-state">
            <div className="ap-empty-icon">📦</div>
            <h3>No products found</h3>
            <p>No products match your search or filter query.</p>
            <button type="button" onClick={handleOpenAdd} className="ap-btn-primary" style={{ marginTop: 12 }}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th style={{ width: 68 }}>Photo</th>
                  <th>Product Name</th>
                  <th style={{ width: 140 }}>Category</th>
                  <th style={{ width: 100 }}>Price</th>
                  <th style={{ width: 130 }}>Badge</th>
                  <th style={{ width: 160, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="ap-thumb-box">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="ap-thumb-img" />
                        ) : (
                          <span className="ap-thumb-ph">📦</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="ap-row-title">{p.name || 'Untitled Product'}</div>
                      <div className="ap-row-sub">
                        {p.asin && p.asin !== 'N/A' && <span className="ap-chip">ASIN: {p.asin}</span>}
                        {p.rating && <span className="ap-chip-sub">⭐ {p.rating} ({p.reviewsCount || 0})</span>}
                      </div>
                    </td>
                    <td>
                      <span className="ap-cat-tag">
                        {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.icon || '📁'}{' '}
                        {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                      </span>
                    </td>
                    <td>
                      <span className="ap-price-text">{p.price || '—'}</span>
                    </td>
                    <td>
                      {p.badge ? (
                        <span className="ap-badge-tag">{p.badge}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="ap-actions-group">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="ap-btn-action-edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="ap-btn-action-del"
                        >
                          Delete
                        </button>
                        {p.customUrl && (
                          <a
                            href={p.customUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ap-btn-action-link"
                            title="Open affiliate link"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ ADD / EDIT PRODUCT MODAL ═══ */}
      {modalOpen && draft && (
        <div className="admin-panel ap-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="ap-modal-card">
            {/* Header */}
            <div className="ap-modal-header">
              <div>
                <h2 className="ap-modal-title">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="ap-modal-subtitle">Add directly via link or fill in details manually</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="ap-modal-close">✕</button>
            </div>

            <div className="ap-modal-body">
              {/* ── Quick URL Extractor ── */}
              <div className="ap-quick-box">
                <div className="ap-quick-title">⚡ Quick Auto-Fill from Link</div>
                <div className="ap-quick-row">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleExtractUrl()}
                    placeholder="Paste Amazon, MediaMarkt, or any product URL..."
                    className="ap-input"
                  />
                  <button
                    type="button"
                    onClick={handleExtractUrl}
                    disabled={extracting || !urlInput.trim()}
                    className="ap-btn-extract"
                  >
                    {extracting ? 'Fetching...' : 'Extract Info'}
                  </button>
                </div>
              </div>

              {/* ── Image & Presets ── */}
              <div className="ap-form-group">
                <label className="ap-label">Product Image</label>
                <div className="ap-img-section">
                  {/* Uploader Box */}
                  <div
                    className="ap-img-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
                    }}
                  >
                    {draft.image ? (
                      <img src={draft.image} alt="Preview" className="ap-img-preview" />
                    ) : (
                      <div className="ap-img-upload-ph">
                        <span className="ap-img-upload-icon">📷</span>
                        <span>{uploading ? 'Uploading...' : 'Click or drop image'}</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
                      }}
                    />
                  </div>

                  {/* URL Input & Shortcuts */}
                  <div className="ap-img-controls">
                    <input
                      type="text"
                      value={draft.image || ''}
                      onChange={e => setDraft(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Image URL (e.g. /products/sony-headphones.jpg or https://...)"
                      className="ap-input"
                    />

                    <div className="ap-presets-label">Or choose a clean preset photo:</div>
                    <div className="ap-presets-chips">
                      {PRESET_SHORTCUTS.map(pr => {
                        const active = draft.image === pr.src
                        return (
                          <button
                            key={pr.label}
                            type="button"
                            onClick={() => setDraft(prev => ({ ...prev, image: pr.src, category: pr.cat }))}
                            className={`ap-chip-btn ${active ? 'ap-chip-active' : ''}`}
                          >
                            <span>{pr.icon}</span>
                            <span>{pr.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Title ── */}
              <div className="ap-form-group">
                <label className="ap-label">Product Name / Title *</label>
                <input
                  type="text"
                  value={draft.name || ''}
                  onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Anker Soundcore P20i Wireless Earbuds"
                  className="ap-input"
                />
              </div>

              {/* ── Price & Category ── */}
              <div className="ap-grid-2">
                <div className="ap-form-group">
                  <label className="ap-label">Price</label>
                  <input
                    type="text"
                    value={draft.price || ''}
                    onChange={e => setDraft(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. €24.99"
                    className="ap-input"
                  />
                </div>

                <div className="ap-form-group">
                  <label className="ap-label">Category</label>
                  <select
                    value={draft.category}
                    onChange={e => setDraft(prev => ({ ...prev, category: e.target.value }))}
                    className="ap-select"
                  >
                    {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Badge & ASIN ── */}
              <div className="ap-grid-2">
                <div className="ap-form-group">
                  <label className="ap-label">Badge / Ribbon (Optional)</label>
                  <input
                    type="text"
                    value={draft.badge || ''}
                    onChange={e => setDraft(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. Best Seller, Student Deal, Must Have"
                    className="ap-input"
                  />
                </div>

                <div className="ap-form-group">
                  <label className="ap-label">Amazon ASIN (Optional)</label>
                  <input
                    type="text"
                    value={draft.asin || ''}
                    onChange={e => setDraft(prev => ({ ...prev, asin: e.target.value }))}
                    placeholder="e.g. B0CH31SQH8"
                    className="ap-input"
                  />
                </div>
              </div>

              {/* ── Short Description ── */}
              <div className="ap-form-group">
                <label className="ap-label">Short Description</label>
                <textarea
                  value={draft.shortDesc || ''}
                  onChange={e => setDraft(prev => ({ ...prev, shortDesc: e.target.value }))}
                  rows={2}
                  placeholder="Short 1-2 sentence description of why this product is great for students..."
                  className="ap-textarea"
                />
              </div>

              {/* ── Affiliate / Product URL ── */}
              <div className="ap-form-group">
                <label className="ap-label">Direct Affiliate URL</label>
                <input
                  type="text"
                  value={draft.customUrl || ''}
                  onChange={e => setDraft(prev => ({ ...prev, customUrl: e.target.value }))}
                  placeholder="https://www.amazon.de/dp/...?tag=limison-21"
                  className="ap-input"
                />
              </div>

              {/* ── Key Highlights ── */}
              <div className="ap-form-group">
                <label className="ap-label">Key Highlights / Features (Up to 3)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(draft.highlights || ['', '', '']).map((hl, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={hl}
                      onChange={e => {
                        const nextHl = [...(draft.highlights || ['', '', ''])]
                        nextHl[idx] = e.target.value
                        setDraft(prev => ({ ...prev, highlights: nextHl }))
                      }}
                      placeholder={`Bullet ${idx + 1} (e.g. 30-Hour Battery Life)`}
                      className="ap-input"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ap-modal-footer">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="ap-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="ap-btn-primary"
              >
                {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ScopedStyles />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SCOPED CSS — Complete Isolation from any global website styles
   ══════════════════════════════════════════════════════════════════ */
function ScopedStyles() {
  return (
    <style>{`
      /* Isolation Root */
      .admin-panel {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        color: #0f172a !important;
        box-sizing: border-box !important;
      }
      .admin-panel *, .admin-panel *::before, .admin-panel *::after {
        box-sizing: border-box !important;
      }

      /* Login Screen */
      .ap-login-wrap {
        min-height: 100vh;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .ap-login-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
        padding: 40px 32px;
        width: 100%;
        max-width: 360px;
        text-align: center;
      }
      .ap-login-icon {
        font-size: 36px;
        margin-bottom: 12px;
      }
      .ap-login-title {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 6px;
      }
      .ap-login-sub {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 24px;
      }
      .ap-login-input {
        width: 100% !important;
        padding: 12px 16px !important;
        font-size: 18px !important;
        letter-spacing: 6px !important;
        text-align: center !important;
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 10px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        outline: none !important;
        margin-bottom: 16px !important;
      }
      .ap-login-input:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
      }
      .ap-login-err {
        color: #dc2626;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .ap-btn-submit {
        width: 100% !important;
        padding: 12px 16px !important;
        background: #0f172a !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: none !important;
        transform: none !important;
        text-transform: none !important;
        letter-spacing: normal !important;
      }
      .ap-btn-submit:hover {
        background: #1e293b !important;
      }

      /* Main Page */
      .ap-root {
        min-height: 100vh;
        background: #f8fafc;
      }
      .ap-header {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 16px 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 40;
      }
      .ap-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .ap-brand-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #eff6ff;
        color: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
      }
      .ap-brand-title {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        line-height: 1.2;
      }
      .ap-brand-meta {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      .ap-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* Buttons Standard */
      .admin-panel button {
        all: unset;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
        font-family: inherit !important;
        line-height: 1 !important;
        transition: background 0.15s, border-color 0.15s, opacity 0.15s !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        box-shadow: none !important;
        transform: none !important;
      }
      .ap-btn-primary {
        background: #0f172a !important;
        color: #ffffff !important;
        padding: 10px 18px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        gap: 6px !important;
      }
      .ap-btn-primary:hover {
        background: #1e293b !important;
      }
      .ap-btn-primary:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }
      .ap-btn-secondary {
        background: #ffffff !important;
        color: #475569 !important;
        border: 1px solid #e2e8f0 !important;
        padding: 9px 16px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        text-decoration: none !important;
        display: inline-flex !important;
      }
      .ap-btn-secondary:hover {
        background: #f1f5f9 !important;
        color: #0f172a !important;
      }
      .ap-btn-danger-outline {
        background: #ffffff !important;
        color: #dc2626 !important;
        border: 1px solid #fecaca !important;
        padding: 9px 16px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }
      .ap-btn-danger-outline:hover {
        background: #fef2f2 !important;
      }

      /* Body Layout */
      .ap-body {
        max-width: 1200px;
        margin: 0 auto;
        padding: 28px 32px 80px;
      }
      .ap-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .ap-search-wrap {
        position: relative;
        flex: 1;
        min-width: 280px;
      }
      .ap-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 13px;
        color: #94a3b8;
      }
      .ap-search-input {
        width: 100% !important;
        padding: 10px 14px 10px 38px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 13px !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .ap-search-input:focus {
        border-color: #2563eb !important;
      }
      .ap-filters {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ap-select {
        padding: 10px 14px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        outline: none !important;
        cursor: pointer !important;
      }

      /* Table Styles */
      .ap-table-wrap {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      }
      .ap-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .ap-table thead tr {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .ap-table th {
        padding: 12px 18px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
      }
      .ap-table tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s;
      }
      .ap-table tbody tr:last-child {
        border-bottom: none;
      }
      .ap-table tbody tr:hover {
        background: #f8fafc;
      }
      .ap-table td {
        padding: 14px 18px;
        font-size: 13px;
        color: #334155;
        vertical-align: middle;
      }
      .ap-thumb-box {
        width: 52px;
        height: 52px;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .ap-thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ap-thumb-ph {
        font-size: 22px;
        color: #cbd5e1;
      }
      .ap-row-title {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
        line-height: 1.35;
      }
      .ap-row-sub {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ap-chip {
        font-size: 11px;
        font-family: monospace;
        background: #f1f5f9;
        color: #475569;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      .ap-chip-sub {
        font-size: 12px;
        color: #64748b;
      }
      .ap-cat-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        color: #475569;
        font-weight: 500;
      }
      .ap-price-text {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .ap-badge-tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
        padding: 3px 8px;
        border-radius: 6px;
      }
      .ap-actions-group {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
      }
      .ap-btn-action-edit {
        padding: 6px 12px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        background: #f1f5f9 !important;
        color: #334155 !important;
        border: 1px solid #e2e8f0 !important;
      }
      .ap-btn-action-edit:hover {
        background: #e2e8f0 !important;
        color: #0f172a !important;
      }
      .ap-btn-action-del {
        padding: 6px 12px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        background: #fef2f2 !important;
        color: #dc2626 !important;
        border: 1px solid #fecaca !important;
      }
      .ap-btn-action-del:hover {
        background: #fee2e2 !important;
      }
      .ap-btn-action-link {
        padding: 6px 10px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        background: #f1f5f9 !important;
        color: #334155 !important;
        border: 1px solid #e2e8f0 !important;
        text-decoration: none !important;
      }
      .ap-btn-action-link:hover {
        background: #e2e8f0 !important;
      }

      /* Empty State */
      .ap-empty-state {
        text-align: center;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 64px 24px;
      }
      .ap-empty-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .ap-empty-state h3 {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 6px;
      }
      .ap-empty-state p {
        font-size: 13px;
        color: #64748b;
        margin: 0;
      }

      /* Modal */
      .ap-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 40px 16px;
        overflow-y: auto;
      }
      .ap-modal-card {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 40px -15px rgba(0,0,0,0.15);
        width: 100%;
        max-width: 620px;
        overflow: hidden;
      }
      .ap-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .ap-modal-title {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 3px;
      }
      .ap-modal-subtitle {
        font-size: 12px;
        color: #64748b;
        margin: 0;
      }
      .ap-modal-close {
        width: 32px !important;
        height: 32px !important;
        border-radius: 8px !important;
        background: #f1f5f9 !important;
        color: #64748b !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        border: none !important;
      }
      .ap-modal-close:hover {
        background: #e2e8f0 !important;
        color: #0f172a !important;
      }
      .ap-modal-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: calc(85vh - 140px);
        overflow-y: auto;
      }
      .ap-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        background: #f8fafc;
      }

      /* Modal Form Controls */
      .ap-form-group {
        display: flex;
        flex-direction: column;
      }
      .ap-label {
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 5px;
      }
      .ap-input {
        width: 100% !important;
        padding: 9px 13px !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 13px !important;
        outline: none !important;
        box-shadow: none !important;
        font-family: inherit !important;
      }
      .ap-input:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important;
      }
      .ap-textarea {
        width: 100% !important;
        padding: 9px 13px !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 13px !important;
        outline: none !important;
        box-shadow: none !important;
        font-family: inherit !important;
        resize: vertical !important;
      }
      .ap-textarea:focus {
        border-color: #2563eb !important;
      }
      .ap-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      /* Quick Box */
      .ap-quick-box {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
      }
      .ap-quick-title {
        font-size: 12px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ap-quick-row {
        display: flex;
        gap: 8px;
      }
      .ap-btn-extract {
        background: #2563eb !important;
        color: #ffffff !important;
        padding: 9px 16px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
      }
      .ap-btn-extract:hover {
        background: #1d4ed8 !important;
      }
      .ap-btn-extract:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }

      /* Image Section */
      .ap-img-section {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .ap-img-upload-box {
        width: 104px;
        height: 104px;
        border-radius: 10px;
        border: 2px dashed #cbd5e1;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        flex-shrink: 0;
        transition: border-color 0.15s;
      }
      .ap-img-upload-box:hover {
        border-color: #2563eb;
      }
      .ap-img-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ap-img-upload-ph {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 8px;
        font-size: 10px;
        color: #64748b;
        font-weight: 500;
        gap: 4px;
      }
      .ap-img-upload-icon {
        font-size: 20px;
      }
      .ap-img-controls {
        flex: 1;
      }
      .ap-presets-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        margin: 8px 0 6px;
      }
      .ap-presets-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .ap-chip-btn {
        padding: 4px 8px !important;
        border-radius: 6px !important;
        background: #f1f5f9 !important;
        color: #475569 !important;
        border: 1px solid #e2e8f0 !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        gap: 4px !important;
      }
      .ap-chip-btn:hover {
        background: #e2e8f0 !important;
        color: #0f172a !important;
      }
      .ap-chip-active {
        background: #0f172a !important;
        color: #ffffff !important;
        border-color: #0f172a !important;
      }

      /* Toast */
      .ap-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        animation: apSlideUp 0.2s ease-out;
      }
      .ap-toast-success {
        background: #0f172a;
        color: #ffffff;
      }
      .ap-toast-error {
        background: #dc2626;
        color: #ffffff;
      }
      @keyframes apSlideUp {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `}</style>
  )
}
