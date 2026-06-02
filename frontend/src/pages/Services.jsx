import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SERVICES = [
  {
    id: 'doc-eval',
    icon: '📄',
    title: 'Academic Document Evaluation',
    desc: 'Comprehensive review of your transcripts, certificates, and GPA conversions. We verify international equivalence and highlight matching parameters to fit university admissions criteria.',
    features: ['GPA Equivalence Audits', 'Credential Verification', 'Prerequisites Mapping'],
    docOptions: ['Academic Transcript', 'Graduation Certificate', 'GPA Report', 'Other']
  },
  {
    id: 'visa-guide',
    icon: '🛂',
    title: 'Visa & Immigration Guidance',
    desc: 'Step-by-step navigation through visa applications. We help organize your visa portfolios, prepare financial proofs, and audit documents to maximize approval odds.',
    features: ['Document Checklist Audits', 'Financial Statement Review', 'Interview Preparation Tips'],
    docOptions: ['Financial/Bank Statement', 'Passport Copy', 'Sponsorship Letter', 'Visa Application Draft', 'Other']
  },
  {
    id: 'app-strategy',
    icon: '🎓',
    title: 'University Application Strategy',
    desc: 'Professional review of your university application folders. Get structural feedback on your Personal Statement, CV, and letters of recommendation to stand out to admissions boards.',
    features: ['SOP / Essay Review', 'Letter of Recommendation Audits', 'Portfolio Alignment'],
    docOptions: ['Statement of Purpose (SOP)', 'CV / Resume', 'Letter of Recommendation', 'Other']
  },
  {
    id: 'admissions',
    icon: '💡',
    title: 'Admissions & Matching Consult',
    desc: 'In-depth review of your academic background to map out specific courses and admission roadmaps across Europe, North America, and beyond.',
    features: ['Custom Eligibility Checklists', 'Direct Admission Entry Audits', 'Deadline Management'],
    docOptions: ['Detailed CV', 'Transcripts Overview', 'Target University List', 'Other']
  },
  {
    id: 'scholarship',
    icon: '💰',
    title: 'Scholarship & Funding Advisory',
    desc: 'Discover and align with compatible government, university, and private scholarship programs that fit your profile credentials.',
    features: ['Scholarship Eligibility Checks', 'Funding Document Verification', 'Application Alignment'],
    docOptions: ['Scholarship Application Essay', 'Income Statement', 'Awards Portfolio', 'Other']
  },
  {
    id: 'departure',
    icon: '🌍',
    title: 'Departure & Integration Support',
    desc: 'Pre-departure assistance, including accommodation guidance, health insurance alignment, and student enrollment verification steps.',
    features: ['Accommodation Sourcing Tips', 'Health Insurance Alignment', 'Enrollment Portals Setup'],
    docOptions: ['Enrollment Offer Letter', 'Accommodation Application', 'Health Insurance Policy', 'Other']
  }
]

export default function Services() {
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState(null)
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleOpenBooking = (service) => {
    setSelectedService(service)
    setDocType('')
    setFile(null)
    setComment('')
    setSubmitSuccess(false)
  }

  const handleCloseBooking = () => {
    setSelectedService(null)
  }

  const handleSubmitBooking = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API request/uploading delay
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
    }, 1500)
  }

  return (
    <div className="services-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '12px', background: 'linear-gradient(to right, #ffffff, var(--muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Our Premium Services
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Get expert human assistance and academic audits alongside our search engine to guarantee a smooth entry into your dream university abroad.
        </p>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '56px' }}>
        {SERVICES.map((s, i) => (
          <div 
            key={i} 
            className="card hover-card" 
            onClick={() => handleOpenBooking(s)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              padding: '32px', 
              transition: 'all 0.3s ease', 
              border: '1px solid var(--card-border)',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '32px' }}>{s.icon}</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{s.title}</h3>
            </div>
            
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, flexGrow: 1 }}>
              {s.desc}
            </p>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '14px', marginTop: 'auto' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Key Inclusions
              </h4>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {s.features.map((f, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent)' }}>✔</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="btn-accent"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenBooking(s)
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                color: 'var(--text)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--accent)'
                e.target.style.color = '#000000'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                e.target.style.color = 'var(--text)'
              }}
            >
              Book Service
            </button>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Need Personalized Assistance?</h3>
        <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '600px', lineHeight: 1.6 }}>
          Whether you need a complete document audit, scholarship guidance, or step-by-step visa assistance, our specialized academic coordinators are here to guide you.
        </p>
        <button 
          className="btn-accent" 
          onClick={() => navigate('/contact')}
          style={{ width: 'auto', padding: '14px 36px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          Book an Audit Session
        </button>
      </div>

      {/* Booking Modal Popup */}
      {selectedService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
        }} onClick={handleCloseBooking}>
          <div style={{
            background: 'var(--card-bg, #0d0f17)',
            border: '1.5px solid var(--card-border, #242936)',
            borderRadius: '24px',
            padding: '36px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'fadeIn 0.25s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={handleCloseBooking}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
            >
              &times;
            </button>

            {!submitSuccess ? (
              <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{selectedService.icon}</span>
                    <h3 style={{ fontSize: '22px', fontWeight: 800 }}>Book {selectedService.title}</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    Upload your profile documents to request a premium evaluation session with our coordinators.
                  </p>
                </div>

                {/* Dropdown Options */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                    What kind of data are you uploading?
                  </label>
                  <select 
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value)
                      setFile(null) // Reset file when type changes
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--card-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: '#0d0f17' }}>-- Select document type --</option>
                    {selectedService.docOptions.map((opt, idx) => (
                      <option key={idx} value={opt} style={{ backgroundColor: '#0d0f17', color: 'white' }}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Upload File Input */}
                {docType && (
                  <div style={{ animation: 'fadeIn 0.2s ease' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                      Select File to Upload
                    </label>
                    <div style={{
                      border: '2px dashed var(--card-border)',
                      borderRadius: '16px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}>
                      <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 2,
                        }}
                      />
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📤</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', display: 'block', color: 'var(--text)', marginBottom: '4px' }}>
                        {file ? 'File selected:' : 'Choose file / Drag & Drop'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {file ? file.name : 'PDF, DOCX, JPG or PNG up to 10MB'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Comment Option */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                    Additional Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter any details or questions for our auditors..."
                    style={{
                      width: '100%',
                      height: '90px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--card-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text)',
                      fontSize: '13.5px',
                      resize: 'none',
                      outline: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  {isSubmitting ? 'Uploading Documents...' : 'Confirm & Request Audit'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <span style={{ fontSize: '64px' }}>✅</span>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Request Received!</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
                    Your document <strong style={{ color: 'var(--text)' }}>{file?.name}</strong> has been successfully uploaded and categorized under <strong>{docType}</strong>. Our academic coordinators will review it and contact you within 24 hours.
                  </p>
                </div>
                <button 
                  onClick={handleCloseBooking}
                  className="btn-accent"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
