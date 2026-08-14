import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import { PRODUCTS_DATA, PRODUCT_CATEGORIES, AMAZON_ASSOCIATE_TAG } from '../data/productsData'
import { fetchCustomProducts, extractProductFromUrl, addCustomProduct, deleteCustomProduct, uploadProductImage } from '../api'

const PIN = '1234'

const PRESETS = [
  { l: '🎧 Earbuds', s: '/products/sony-headphones.jpg', c: 'tech' },
  { l: '💻 Laptop', s: '/products/macbook-air.jpg', c: 'tech' },
  { l: '💡 Bulb', s: '/products/govee-bulb.jpg', c: 'dorm' },
  { l: '🧺 Washer', s: '/products/siemens-washer.jpg', c: 'dorm' },
  { l: '⚡ Adapter', s: '/products/epicka-adapter.jpg', c: 'adapters' },
  { l: '🔋 Power', s: '/products/anker-powerbank.jpg', c: 'adapters' },
  { l: '🧳 Luggage', s: '/products/samsonite-luggage.jpg', c: 'travel' },
  { l: '🎒 Bag', s: '/products/matein-backpack.jpg', c: 'travel' },
  { l: '📚 Kindle', s: '/products/kindle-paperwhite.jpg', c: 'supplies' },
  { l: '🛏 Bed', s: '/products/utopia-bedding.jpg', c: 'dorm' },
]

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, ...rest }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
        border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b', outline: 'none',
        boxSizing: 'border-box', transition: 'border .15s',
      }}
      {...rest}
    />
  )
}

export default function AdminProducts() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(() => sessionStorage.getItem('sp_admin') === '1')
  const [pinErr, setPinErr] = useState('')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [draft, setDraft] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const custom = await fetchCustomProducts()
      const map = new Map()
      if (Array.isArray(custom)) custom.forEach(p => map.set(p.id, p))
      PRODUCTS_DATA.forEach(p => { if (!map.has(p.id)) map.set(p.id, p) })
      setProducts(Array.from(map.values()))
    } catch { setProducts([...PRODUCTS_DATA]) }
    setLoading(false)
  }, [])

  useEffect(() => { if (auth) load() }, [auth, load])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) } }, [toast])

  const login = e => {
    e.preventDefault()
    if (pin.trim() === PIN || pin.trim() === 'admin') { setAuth(true); sessionStorage.setItem('sp_admin', '1') }
    else setPinErr('Wrong PIN')
  }

  const blank = () => ({
    id: `p-${Date.now()}`, name: '', category: 'dorm', asin: '', domain: 'de',
    customUrl: '', image: '', rating: 4.5, reviewsCount: 500, price: '', badge: '',
    shortDesc: '', highlights: ['', '', ''], targetCountries: ['Germany', 'Global'],
  })

  const openAdd = () => { setDraft(blank()); setIsEdit(false); setShowModal(true); setUrlInput('') }

  const openEdit = p => {
    setDraft({ ...p, highlights: [...(p.highlights || []), '', '', ''].slice(0, 3) })
    setIsEdit(true); setShowModal(true); setUrlInput('')
  }

  const extract = async () => {
    if (!urlInput.trim()) return
    setExtracting(true)
    try {
      let url = urlInput.trim()
      if (!url.startsWith('http')) url = 'https://' + url
      const res = await extractProductFromUrl(url)
      if (res?.status === 'success' && res.product) {
        const p = res.product
        setDraft(prev => ({
          ...prev, id: p.id || prev.id, name: p.name || prev.name, asin: p.asin || prev.asin,
          domain: p.domain || prev.domain, customUrl: p.customUrl || prev.customUrl,
          image: p.image || prev.image, price: p.price || prev.price, badge: p.badge || prev.badge,
          shortDesc: p.shortDesc || prev.shortDesc, category: p.category || prev.category,
        }))
        setToast('Product info extracted!')
      }
    } catch { setToast('Could not extract info') }
    setExtracting(false)
  }

  const handleImg = async file => {
    if (!file) return
    setUploadingImg(true)
    try {
      const res = await uploadProductImage(file)
      if (res?.image_url) {
        const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001'
        setDraft(prev => ({ ...prev, image: base + res.image_url }))
      } else throw 0
    } catch {
      const r = new FileReader()
      r.onload = e => setDraft(prev => ({ ...prev, image: e.target.result }))
      r.readAsDataURL(file)
    }
    setUploadingImg(false)
    setToast('Image uploaded!')
  }

  const save = async () => {
    if (!draft?.name?.trim()) { setToast('Name required'); return }
    setSaving(true)
    const product = { ...draft, highlights: draft.highlights.filter(h => h.trim()), id: draft.id || `p-${Date.now()}` }
    try { await addCustomProduct(product); setToast(`"${product.name}" saved!`); setShowModal(false); load() }
    catch { setToast('Save failed') }
    setSaving(false)
  }

  const del = async p => {
    if (!confirm(`Delete "${p.name}"?`)) return
    try { await deleteCustomProduct(p.id); setToast('Deleted'); load() } catch { setToast('Delete failed') }
  }

  const filtered = products.filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (search && !(p.name + (p.shortDesc || '')).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = { total: products.length, tech: products.filter(p => p.category === 'tech').length, dorm: products.filter(p => p.category === 'dorm').length }

  // ─── LOGIN ───
  if (!auth) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
      <SEO title="Admin — Studplex" noindex={true} />
      <form onSubmit={login} style={{ background: '#fff', borderRadius: 16, padding: '44px 36px', width: 360, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>Admin Access</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px' }}>Enter PIN to manage products</p>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN"
          autoFocus style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 16, textAlign: 'center', letterSpacing: 6, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
        {pinErr && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 10px' }}>{pinErr}</p>}
        <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 10, background: '#1e293b', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Unlock</button>
      </form>
    </div>
  )

  // ─── MAIN ───
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter',sans-serif", color: '#1e293b' }}>
      <SEO title="Admin — Studplex" noindex={true} />

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#1e293b', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast}</div>}

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📦</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Product Manager</span>
          <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{stats.total} items</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/products" target="_blank" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#64748b', border: '1px solid #e2e8f0', textDecoration: 'none', background: '#fff' }}>View Store ↗</a>
          <button onClick={() => { setAuth(false); sessionStorage.removeItem('sp_admin') }} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#ef4444', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer' }}>Lock</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 80px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 460 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="all">All</option>
              {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={openAdd} style={{ padding: '9px 20px', borderRadius: 8, background: '#1e293b', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Product
          </button>
        </div>

        {/* Product List */}
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No products found</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Try a different search or add a new product.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'background .1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {/* Thumbnail */}
                <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                  {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 20 }}>📦</div>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Untitled'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.badge && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{p.badge}</span>}
                    <span>{PRODUCT_CATEGORIES.find(c => c.id === p.category)?.name || p.category}</span>
                    {p.asin && p.asin !== 'N/A' && <span>ASIN: {p.asin}</span>}
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', minWidth: 70, textAlign: 'right' }}>{p.price || '—'}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => del(p)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Delete</button>
                  {p.customUrl && <a href={p.customUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569', textDecoration: 'none', display: 'inline-flex' }}>↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {showModal && draft && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>

            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{isEdit ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* URL Extract */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Quick — Paste product link</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input value={urlInput} onChange={setUrlInput} placeholder="https://amazon.de/dp/… or any URL" onKeyDown={e => e.key === 'Enter' && extract()} />
                  <button onClick={extract} disabled={extracting || !urlInput.trim()}
                    style={{ padding: '9px 16px', borderRadius: 8, background: '#1e293b', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: extracting ? .5 : 1 }}>
                    {extracting ? '…' : 'Extract'}
                  </button>
                </div>
              </div>

              {/* Image */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault() }} onDrop={e => { e.preventDefault(); handleImg(e.dataTransfer.files[0]) }}
                  style={{ width: 100, height: 100, borderRadius: 10, border: `2px dashed ${draft.image ? '#3b82f6' : '#e2e8f0'}`, background: '#f8fafc', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {draft.image ? <img src={draft.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>{uploadingImg ? '…' : '📷 Upload'}</div>}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImg(e.target.files?.[0])} />
                </div>
                <div style={{ flex: 1 }}>
                  <Input value={draft.image} onChange={v => setDraft(p => ({ ...p, image: v }))} placeholder="Image URL" />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {PRESETS.map(pr => (
                      <button key={pr.l} type="button" onClick={() => setDraft(p => ({ ...p, image: pr.s, category: pr.c }))}
                        style={{ padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: draft.image === pr.s ? '#1e293b' : '#f1f5f9', color: draft.image === pr.s ? '#fff' : '#64748b', border: 'none', cursor: 'pointer' }}>{pr.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <Field label="Product Name"><Input value={draft.name} onChange={v => setDraft(p => ({ ...p, name: v }))} placeholder="e.g. Anker Soundcore P20i" /></Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Price"><Input value={draft.price} onChange={v => setDraft(p => ({ ...p, price: v }))} placeholder="€29.99" /></Field>
                <Field label="Category">
                  <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                    {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Badge"><Input value={draft.badge} onChange={v => setDraft(p => ({ ...p, badge: v }))} placeholder="Amazon Deal" /></Field>
                <Field label="ASIN"><Input value={draft.asin} onChange={v => setDraft(p => ({ ...p, asin: v }))} placeholder="B0CH31SQH8" /></Field>
              </div>

              <Field label="Description">
                <textarea value={draft.shortDesc} onChange={e => setDraft(p => ({ ...p, shortDesc: e.target.value }))} rows={2} placeholder="Short product description"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
              </Field>

              <Field label="Affiliate / Product URL"><Input value={draft.customUrl} onChange={v => setDraft(p => ({ ...p, customUrl: v }))} placeholder="https://…" /></Field>

              <Field label="Highlights">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {draft.highlights.map((h, i) => (
                    <Input key={i} value={h} onChange={v => { const n = [...draft.highlights]; n[i] = v; setDraft(p => ({ ...p, highlights: n })) }} placeholder={`Highlight ${i + 1}`} />
                  ))}
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .5 : 1 }}>
                {saving ? 'Saving…' : isEdit ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input:focus, select:focus, textarea:focus { border-color: #3b82f6 !important; }`}</style>
    </div>
  )
}
