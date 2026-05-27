import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("https://formsubmit.co/ajax/support@studplex.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _subject: `New Studplex Support Message: ${form.subject}`
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error("Failed to send message.")
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto 0 auto' }}>
      <div className="card">
        {submitted ? (
          <div className="empty-state" style={{ textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '48px', color: 'var(--accent)' }}>✉️</div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '16px' }}>Message Sent!</h3>
            <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
              Thank you for contacting Studplex. Our team will get back to you shortly.
            </p>
            <button className="btn-accent" style={{ marginTop: '24px', width: 'auto', padding: '12px 28px' }} onClick={() => setSubmitted(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Contact Support</h2>
              <p style={{ color: 'var(--muted)' }}>Have a question, feedback, or need assistance? Drop us a line below.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="grid one-col-gap">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    id="name"
                    type="text" 
                    placeholder="e.g. Alex Carter" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="e.g. alex@gmail.com" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input 
                  id="subject"
                  type="text" 
                  placeholder="How can we help you?" 
                  value={form.subject} 
                  onChange={e => setForm({ ...form, subject: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea 
                  id="message"
                  placeholder="Write your message here..." 
                  value={form.message} 
                  onChange={e => setForm({ ...form, message: e.target.value })} 
                  style={{ minHeight: '150px', resize: 'vertical' }}
                  required 
                />
              </div>

              {error && <p className="error-msg" style={{ color: '#ef4444', marginTop: '12px' }}>⚠️ {error}</p>}

              <button type="submit" className="btn-accent" style={{ marginTop: '12px', padding: '16px' }} disabled={loading}>
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
