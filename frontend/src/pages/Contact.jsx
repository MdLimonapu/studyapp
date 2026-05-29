import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'

function validateEmail(email) {
  if (!email) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address.'
}

export default function Contact() {
  const { user, isLoaded } = useUser()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [emailError, setEmailError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [activeFaq, setActiveFaq] = useState(null)

  // Pre-fill name and email when Clerk user loads
  useEffect(() => {
    if (isLoaded && user) {
      setForm(prev => ({
        ...prev,
        name: user.fullName || user.username || prev.name,
        email: user.primaryEmailAddress?.emailAddress || prev.email
      }))
    }
  }, [user, isLoaded])

  useEffect(() => {
    document.title = 'Contact Us | Studplex'
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const emailErr = validateEmail(form.email)
    if (emailErr) {
      setEmailError(emailErr)
      return
    }
    
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
        // Reset form but preserve profile credentials if logged in
        setForm({
          name: user?.fullName || user?.username || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          subject: '',
          message: ''
        })
      } else {
        throw new Error("Failed to send message.")
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const faqs = [
    {
      q: "Is Studplex free to use?",
      a: "Yes! Studplex is 100% free for students searching for international English-taught university programs."
    },
    {
      q: "How accurate are the university matches?",
      a: "Our system matches you based on official eligibility parameters (GPA, degree level, field). However, requirements can change, so we recommend always verifying details via the 'Open course page' link before applying."
    },
    {
      q: "How do I edit my matching details?",
      a: "You can update your GPA, degree level, or field of study anytime by navigating to your Profile page. The matching engine will instantly adapt to your updated credentials."
    },
    {
      q: "Who can I contact if I have visa or admission questions?",
      a: "For official visa or university application queries, you should contact the respective country's embassy or the university's international student office directly, as they are the official authorities."
    }
  ]

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto 0 auto', padding: '0 20px' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          How can we help?
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '16px' }}>
          Submit a ticket below or browse our frequently asked questions.
        </p>
      </div>

      <style>{`
        .contact-grid-custom {
          display: grid;
          grid-template-columns: 50% 40%;
          gap: 10%;
          align-items: start;
        }
        @media (max-width: 900px) {
          .contact-grid-custom {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>

      <div className="contact-grid-custom">
        
        {/* LEFT COLUMN: CONTACT FORM */}
        <div className="card" style={{ padding: '32px' }}>
          {submitted ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="empty-icon" style={{ fontSize: '48px', color: 'var(--accent)', marginBottom: '16px' }}>✉️</div>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Message Sent!</h3>
              <p style={{ color: 'var(--muted)', marginTop: '8px', lineHeight: '1.5' }}>
                Thank you for contacting Studplex. We've received your request and will get back to you at <strong>{user?.primaryEmailAddress?.emailAddress || 'your email'}</strong> shortly.
              </p>
              <button 
                className="btn-accent" 
                style={{ marginTop: '24px', width: 'auto', padding: '12px 28px' }} 
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Submit a Message</h3>
              <form onSubmit={handleSubmit} className="grid one-col-gap">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="name" style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted)' }}>Full Name</label>
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
                    <label htmlFor="email" style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted)' }}>Email Address</label>
                    <input 
                      id="email"
                      type="email" 
                      placeholder="e.g. alex@gmail.com" 
                      value={form.email} 
                      onChange={e => {
                        setForm({ ...form, email: e.target.value })
                        setEmailError(validateEmail(e.target.value))
                      }} 
                      className={emailError ? 'pf-input-error' : ''}
                      required 
                    />
                    {emailError && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{emailError}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject" style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted)' }}>Subject Category</label>
                  <select 
                    id="subject"
                    value={form.subject} 
                    onChange={e => setForm({ ...form, subject: e.target.value })} 
                    required 
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Select a category</option>
                    <option value="University Matching & Admission">University Matching & Admission</option>
                    <option value="Visa & Document Preparation">Visa & Document Preparation</option>
                    <option value="Eligibility & Grade Conversion">Eligibility & Grade Conversion (APS/GPA)</option>
                    <option value="Scholarships & Funding">Scholarships & Funding</option>
                    <option value="Profile & Account Setup">Profile & Account Setup</option>
                    <option value="Bug Report or Feedback">Bug Report or Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message" style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted)' }}>Message</label>
                  <textarea 
                    id="message"
                    placeholder="Write your message here..." 
                    value={form.message} 
                    onChange={e => setForm({ ...form, message: e.target.value })} 
                    style={{ minHeight: '130px', resize: 'vertical' }}
                    required 
                  />
                </div>

                {error && <p className="error-msg" style={{ color: '#ef4444', marginTop: '12px' }}>⚠️ {error}</p>}

                <button 
                  type="submit" 
                  className="btn-accent" 
                  style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', fontWeight: '800' }} 
                  disabled={loading || !!emailError}
                >
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FAQ ACCORDION */}
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Frequently Asked Questions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i
              return (
                <div 
                  key={i} 
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                    paddingBottom: '16px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFaq(i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: isOpen ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'color 0.2s ease',
                      padding: '8px 0'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '12px',
                      color: 'var(--muted)'
                    }}>
                      ▼
                    </span>
                  </div>
                  
                  {isOpen && (
                    <p style={{ 
                      color: 'var(--muted)', 
                      fontSize: '13.5px', 
                      marginTop: '10px', 
                      lineHeight: '1.6',
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ 
            marginTop: '32px', 
            padding: '16px 20px', 
            background: 'rgba(255, 255, 255, 0.01)', 
            border: '1px solid rgba(255, 255, 255, 0.03)', 
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--muted)',
            lineHeight: '1.5'
          }}>
            💡 <strong>Note:</strong> We typically respond within 24 hours. You can also reach us directly at <a href="mailto:support@studplex.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>support@studplex.com</a>.
          </div>
        </div>

      </div>
    </div>
  )
}
