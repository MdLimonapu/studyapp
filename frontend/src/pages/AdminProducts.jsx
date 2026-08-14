import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG, buildAmazonUrl } from '../data/productsData'
import { fetchCustomProducts, extractProductFromUrl, addCustomProduct, deleteCustomProduct, uploadProductImage } from '../api'

/* ═══════════════════════════════════════════════════════
   STUDPLEX ADMIN PANEL — World-Class Product Manager
   ═══════════════════════════════════════════════════════ */

const ADMIN_PIN = '1234'

/* ── Color Tokens ── */
const T = {
  bg: '#0b0d12',
  surface: '#13151c',
  card: '#1a1d27',
  cardHover: '#1f2231',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  text: '#e8eaed',
  sub: '#8b8fa3',
  muted: '#5f6478',
  accent: '#6366f1',
  accentHover: '#818cf8',
  accentBg: 'rgba(99,102,241,0.12)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.1)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.1)',
  orange: '#f59e0b',
  orangeBg: 'rgba(245,158,11,0.1)',
  blue: '#3b82f6',
}

const PRESET_IMAGES = [
  { label: '🎧 Earbuds', src: '/products/sony-headphones.jpg', cat: 'tech' },
  { label: '💻 Laptop', src: '/products/macbook-air.jpg', cat: 'tech' },
  { label: '💡 Smart Bulb', src: '/products/govee-bulb.jpg', cat: 'dorm' },
  { label: '🧺 Washer', src: '/products/siemens-washer.jpg', cat: 'dorm' },
  { label: '⚡ Adapter', src: '/products/epicka-adapter.jpg', cat: 'adapters' },
  { label: '🔋 Powerbank', src: '/products/anker-powerbank.jpg', cat: 'adapters' },
  { label: '🧳 Luggage', src: '/products/samsonite-luggage.jpg', cat: 'travel' },
  { label: '🎒 Backpack', src: '/products/matein-backpack.jpg', cat: 'travel' },
  { label: '📚 Kindle', src: '/products/kindle-paperwhite.jpg', cat: 'supplies' },
  { label: '🛌 Bedding', src: '/products/utopia-bedding.jpg', cat: 'dorm' },
]

/* ── Shared Styles ── */
const btnPrimary = {
  padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
  border: 'none', cursor: 'pointer', transition: 'all .15s',
  background: T.accent, color: '#fff',
}
const btnGhost = {
  padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 12,
  border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all .15s',
  background: 'transparent', color: T.sub,
}
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
  border: `1px solid ${T.border}`, background: T.surface, color: T.text,
  outline: 'none', boxSizing: 'border-box', transition: 'border .15s',
}

/* ═══ COMPONENT ═══ */
export default function AdminProducts() {
  /* ── Auth State ── */
  const [pin, setPin] = useState('')
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('sp_admin') === '1')
  const [pinErr, setPinErr] = useState('')

  /* ── Data State ── */
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid') // 'grid' | 'table'

  /* ── Add/Edit Modal ── */
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState(null) // null = add mode, product = edit mode
  const [draft, setDraft] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef(null)

  /* ── Search/Filter ── */
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  /* ── Load Products ── */
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const custom = await fetchCustomProducts()
      const customMap = new Map()
      if (Array.isArray(custom)) custom.forEach(p => customMap.set(p.id, p))
      PRODUCTS_DATA.forEach(p => { if (!customMap.has(p.id)) customMap.set(p.id, p) })
      setProducts(Array.from(customMap.values()))
    } catch {
      setProducts([...PRODUCTS_DATA])
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (isAuth) loadProducts() }, [isAuth, loadProducts])

  /* ── Toast auto-clear ── */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  /* ── Auth ── */
  const handleLogin = (e) => {
    e.preventDefault()
    if (pin.trim() === ADMIN_PIN || pin.trim() === 'admin') {
      setIsAuth(true)
      sessionStorage.setItem('sp_admin', '1')
    } else {
      setPinErr('Wrong PIN')
    }
  }

  /* ── New blank draft ── */
  const newDraft = () => ({
    id: `prod-${Date.now()}`,
    name: '', category: 'dorm', asin: '', domain: 'de',
    customUrl: '', image: '', rating: 4.5, reviewsCount: 500,
    price: '', badge: '', shortDesc: '',
    highlights: ['', '', ''],
    targetCountries: ['Germany', 'Global']
  })

  /* ── Open Add Modal ── */
  const openAdd = () => { setDraft(newDraft()); setEditProduct(null); setShowAdd(true); setUrlInput('') }

  /* ── Open Edit Modal ── */
  const openEdit = (p) => {
    setDraft({
      ...p,
      highlights: Array.isArray(p.highlights) && p.highlights.length >= 3
        ? p.highlights
        : [...(p.highlights || []), '', '', ''].slice(0, 3)
    })
    setEditProduct(p)
    setShowAdd(true)
    setUrlInput('')
  }

  /* ── Extract from URL ── */
  const handleExtract = async () => {
    if (!urlInput.trim()) return
    setExtracting(true)
    try {
      let url = urlInput.trim()
      if (!url.startsWith('http')) url = 'https://' + url

      const res = await extractProductFromUrl(url)
      if (res?.status === 'success' && res.product) {
        const p = res.product
        setDraft(prev => ({
          ...prev,
          id: p.id || prev.id,
          name: p.name || prev.name,
          asin: p.asin || prev.asin,
          domain: p.domain || prev.domain,
          customUrl: p.customUrl || prev.customUrl,
          image: p.image || prev.image,
          price: p.price || prev.price,
          badge: p.badge || prev.badge,
          shortDesc: p.shortDesc || prev.shortDesc,
          category: p.category || prev.category,
        }))
        setToast({ type: 'success', msg: '✅ Product info extracted from link!' })
      }
    } catch {
      setToast({ type: 'error', msg: '❌ Could not extract product info' })
    }
    setExtracting(false)
  }

  /* ── Image Upload ── */
  const handleImageUpload = async (file) => {
    if (!file) return
    setUploadingImg(true)
    try {
      const res = await uploadProductImage(file)
      if (res?.status === 'success' && res.image_url) {
        const fullUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001') + res.image_url
        setDraft(prev => ({ ...prev, image: fullUrl }))
        setToast({ type: 'success', msg: '📸 Image uploaded successfully!' })
      } else {
        // Fallback: use local preview
        const reader = new FileReader()
        reader.onload = (e) => setDraft(prev => ({ ...prev, image: e.target.result }))
        reader.readAsDataURL(file)
        setToast({ type: 'success', msg: '📸 Image loaded (local preview)' })
      }
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => setDraft(prev => ({ ...prev, image: e.target.result }))
      reader.readAsDataURL(file)
      setToast({ type: 'success', msg: '📸 Image loaded (local preview)' })
    }
    setUploadingImg(false)
  }

  /* ── Save Product ── */
  const handleSave = async () => {
    if (!draft?.name?.trim()) { setToast({ type: 'error', msg: 'Product name is required' }); return }
    setSaving(true)
    const product = {
      ...draft,
      highlights: draft.highlights.filter(h => h.trim()),
      id: draft.id || `prod-${Date.now()}`
    }
    try {
      await addCustomProduct(product)
      setToast({ type: 'success', msg: `✅ "${product.name}" saved to store!` })
      setShowAdd(false)
      setDraft(null)
      await loadProducts()
    } catch {
      setToast({ type: 'error', msg: '❌ Failed to save product' })
    }
    setSaving(false)
  }

  /* ── Delete Product ── */
  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return
    try {
      await deleteCustomProduct(p.id)
      setToast({ type: 'success', msg: `🗑️ "${p.name}" deleted` })
      await loadProducts()
    } catch {
      setToast({ type: 'error', msg: '❌ Failed to delete' })
    }
  }

  /* ── Filtered Products ── */
  const filtered = products.filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (search && !(p.name + (p.shortDesc || '') + (p.badge || '')).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  /* ── Stats ── */
  const stats = {
    total: products.length,
    tech: products.filter(p => p.category === 'tech').length,
    dorm: products.filter(p => p.category === 'dorm').length,
    travel: products.filter(p => p.category === 'travel').length,
  }

  /* ═══════════════════════════════════════════
     LOGIN SCREEN
     ═══════════════════════════════════════════ */
  if (!isAuth) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg, color: T.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <SEO title="Admin — Studplex" noindex={true} />
        <form onSubmit={handleLogin} style={{
          background: T.card, borderRadius: 20, padding: '48px 40px',
          maxWidth: 380, width: '100%', textAlign: 'center',
          border: `1px solid ${T.border}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: T.accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 28,
          }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Admin Panel</h1>
          <p style={{ color: T.sub, fontSize: 13, margin: '0 0 28px' }}>
            Enter your PIN to access the product manager.
          </p>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            placeholder="Enter PIN"
            autoFocus
            style={{
              ...inputStyle, textAlign: 'center', fontSize: 18, letterSpacing: 6,
              padding: '14px 20px', marginBottom: 16, background: T.bg,
            }}
          />
          {pinErr && <p style={{ color: T.red, fontSize: 12, margin: '0 0 12px' }}>{pinErr}</p>}
          <button type="submit" style={{ ...btnPrimary, width: '100%', padding: 14, fontSize: 15 }}>
            Unlock
          </button>
        </form>
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     MAIN ADMIN PANEL
     ═══════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <SEO title="Admin Panel — Studplex" noindex={true} />

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '14px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: toast.type === 'success' ? T.greenBg : T.redBg,
          color: toast.type === 'success' ? T.green : T.red,
          border: `1px solid ${toast.type === 'success' ? T.green : T.red}30`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideIn .3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Top Bar ── */}
      <div style={{
        padding: '16px 28px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: T.surface, position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: T.accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>⚡</div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>Studplex</span>
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 8, fontWeight: 600 }}>Admin Panel</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/products" target="_blank" rel="noopener noreferrer" style={{
            ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            View Store ↗
          </a>
          <button onClick={() => { setIsAuth(false); sessionStorage.removeItem('sp_admin') }}
            style={{ ...btnGhost, color: T.red, borderColor: `${T.red}30` }}>
            Lock
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Products', val: stats.total, icon: '📦', color: T.accent, bg: T.accentBg },
            { label: 'Tech & Gadgets', val: stats.tech, icon: '💻', color: T.blue, bg: `${T.blue}15` },
            { label: 'Dorm & Home', val: stats.dorm, icon: '🏠', color: T.green, bg: T.greenBg },
            { label: 'Travel Gear', val: stats.travel, icon: '✈️', color: T.orange, bg: T.orangeBg },
          ].map(s => (
            <div key={s.label} style={{
              background: T.card, borderRadius: 14, padding: '18px 20px',
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{s.label}</span>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                }}>{s.icon}</span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: 130, cursor: 'pointer' }}>
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView(view === 'grid' ? 'table' : 'grid')} style={btnGhost}>
              {view === 'grid' ? '☰ Table' : '▦ Grid'}
            </button>
            <button onClick={openAdd} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>+</span> Add Product
            </button>
          </div>
        </div>

        {/* ── Product Grid / Table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: T.muted }}>Loading products…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 80, borderRadius: 16,
            background: T.card, border: `1px solid ${T.border}`,
          }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>🔍</p>
            <p style={{ fontWeight: 700 }}>No products found</p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Try a different search or add a new product.</p>
          </div>
        ) : view === 'grid' ? (
          /* ─── GRID VIEW ─── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                background: T.card, borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${T.border}`, transition: 'border .15s',
              }}>
                <div style={{
                  width: '100%', aspectRatio: '4/3', background: '#0e1017',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: T.muted, fontSize: 40 }}>📦</span>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  {p.badge && (
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 4, background: T.greenBg, color: T.green, marginBottom: 6,
                    }}>{p.badge}</span>
                  )}
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{p.name || 'Untitled Product'}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>{p.price || '—'}</span>
                    <span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>
                      {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{
                      ...btnGhost, flex: 1, textAlign: 'center', fontSize: 11, padding: '7px 0',
                    }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(p)} style={{
                      ...btnGhost, flex: 1, textAlign: 'center', fontSize: 11, padding: '7px 0',
                      color: T.red, borderColor: `${T.red}30`,
                    }}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── TABLE VIEW ─── */
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Image', 'Product Name', 'Price', 'Category', 'Badge', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#0e1017' }}>
                        {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.muted }}>📦</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', maxWidth: 280 }}>
                      <span style={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{p.asin || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: T.accent }}>{p.price || '—'}</td>
                    <td style={{ padding: '10px 16px', color: T.sub }}>
                      {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.icon} {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {p.badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: T.greenBg, color: T.green }}>{p.badge}</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ ...btnGhost, fontSize: 11, padding: '5px 10px' }}>Edit</button>
                        <button onClick={() => handleDelete(p)} style={{ ...btnGhost, fontSize: 11, padding: '5px 10px', color: T.red, borderColor: `${T.red}30` }}>Delete</button>
                        {p.customUrl && (
                          <a href={p.customUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, fontSize: 11, padding: '5px 10px', textDecoration: 'none' }}>↗</a>
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

      {/* ══════════════════════════════════════════
          ADD / EDIT PRODUCT MODAL
         ══════════════════════════════════════════ */}
      {showAdd && draft && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', overflowY: 'auto',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{
            background: T.surface, borderRadius: 20, width: '100%', maxWidth: 680,
            border: `1px solid ${T.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 28px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {editProduct ? '✏️ Edit Product' : '➕ Add New Product'}
              </h2>
              <button onClick={() => setShowAdd(false)} style={{
                background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer',
              }}>✕</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── URL Auto-Extract ── */}
              <div style={{ background: T.card, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ Quick Add — Paste Any Product Link
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://www.amazon.de/dp/... or any store URL"
                    style={{ ...inputStyle, flex: 1, background: T.bg }}
                    onKeyDown={e => e.key === 'Enter' && handleExtract()}
                  />
                  <button onClick={handleExtract} disabled={extracting || !urlInput.trim()}
                    style={{ ...btnPrimary, whiteSpace: 'nowrap', opacity: extracting ? 0.6 : 1 }}>
                    {extracting ? '...' : 'Extract'}
                  </button>
                </div>
              </div>

              {/* ── Image Section ── */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8, textTransform: 'uppercase' }}>
                  Product Image
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  {/* Upload / Preview */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f) }}
                    style={{
                      width: 140, height: 140, borderRadius: 12, overflow: 'hidden',
                      border: `2px dashed ${draft.image ? T.accent : T.border}`,
                      background: T.card, cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border .15s',
                    }}
                  >
                    {draft.image ? (
                      <img src={draft.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: T.muted }}>
                        <span style={{ fontSize: 28, display: 'block' }}>📸</span>
                        <span style={{ fontSize: 10, fontWeight: 600 }}>
                          {uploadingImg ? 'Uploading...' : 'Click or drop'}
                        </span>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
                    />
                  </div>

                  {/* Presets + URL */}
                  <div style={{ flex: 1 }}>
                    <input
                      value={draft.image} onChange={e => setDraft(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Image URL or upload"
                      style={{ ...inputStyle, marginBottom: 10, background: T.bg }}
                    />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {PRESET_IMAGES.map(pr => (
                        <button key={pr.label} type="button"
                          onClick={() => setDraft(prev => ({ ...prev, image: pr.src, category: pr.cat }))}
                          style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                            background: draft.image === pr.src ? T.accent : T.card,
                            color: draft.image === pr.src ? '#fff' : T.sub,
                            border: `1px solid ${draft.image === pr.src ? T.accent : T.border}`,
                            cursor: 'pointer', transition: 'all .1s',
                          }}
                        >{pr.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Product Details ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                <Field label="Product Name" value={draft.name} onChange={v => setDraft(prev => ({ ...prev, name: v }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Price" value={draft.price} onChange={v => setDraft(prev => ({ ...prev, price: v }))} placeholder="€29.99" />
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 5 }}>Category</label>
                    <select value={draft.category} onChange={e => setDraft(prev => ({ ...prev, category: e.target.value }))}
                      style={{ ...inputStyle, background: T.bg, cursor: 'pointer' }}>
                      {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Badge / Tag" value={draft.badge} onChange={v => setDraft(prev => ({ ...prev, badge: v }))} placeholder="Amazon Deal" />
                  <Field label="ASIN (Amazon)" value={draft.asin} onChange={v => setDraft(prev => ({ ...prev, asin: v }))} placeholder="B0CH31SQH8" />
                </div>
                <Field label="Short Description" value={draft.shortDesc} onChange={v => setDraft(prev => ({ ...prev, shortDesc: v }))} multiline />
                <Field label="Product / Affiliate URL" value={draft.customUrl} onChange={v => setDraft(prev => ({ ...prev, customUrl: v }))} placeholder="https://..." />

                {/* Highlights */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 5 }}>Highlights (up to 3)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {draft.highlights.map((h, i) => (
                      <input key={i} value={h}
                        onChange={e => {
                          const newH = [...draft.highlights]
                          newH[i] = e.target.value
                          setDraft(prev => ({ ...prev, highlights: newH }))
                        }}
                        placeholder={`Highlight ${i + 1}`}
                        style={{ ...inputStyle, background: T.bg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px 24px', borderTop: `1px solid ${T.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...btnPrimary, padding: '12px 32px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : editProduct ? '💾 Update Product' : '🚀 Publish to Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animation ── */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        input:focus, select:focus, textarea:focus { border-color: ${T.accent} !important; }
        tr:hover { background: ${T.cardHover}; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  )
}

/* ── Reusable Field Component ── */
function Field({ label, value, onChange, placeholder, multiline }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8b8fa3', marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          rows={3}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
            border: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', color: '#e8eaed',
            outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
          }}
        />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
            border: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', color: '#e8eaed',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}
