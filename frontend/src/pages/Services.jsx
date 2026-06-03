import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useUser, useAuth, SignInButton } from '@clerk/clerk-react'

// Initialize Stripe publishable key from environment variables with safe fallback
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Pyourplaceholderkey')

const SERVICES = [
  {
    id: 'doc-eval',
    icon: '📄',
    title: 'Academic Document Evaluation',
    price: '$49.00',
    desc: 'Comprehensive review of your transcripts, certificates, and GPA conversions. We verify international equivalence and highlight matching parameters to fit university admissions criteria.',
    features: ['GPA Equivalence Audits', 'Credential Verification', 'Prerequisites Mapping'],
    docOptions: ['Academic Transcript', 'Graduation Certificate', 'GPA Report', 'Other'],
    ctaText: 'Start Document Evaluation'
  },
  {
    id: 'visa-guide',
    icon: '🛂',
    title: 'Visa & Immigration Guidance',
    price: '$99.00',
    desc: 'Step-by-step navigation through visa applications. We help organize your visa portfolios, prepare financial proofs, and audit documents to maximize approval odds.',
    features: ['Document Checklist Audits', 'Financial Statement Review', 'Interview Preparation Tips'],
    docOptions: ['Financial/Bank Statement', 'Passport Copy', 'Sponsorship Letter', 'Visa Application Draft', 'Other'],
    ctaText: 'Request Visa Review'
  },
  {
    id: 'app-strategy',
    icon: '🎓',
    title: 'University Application Strategy',
    price: '$79.00',
    desc: 'Professional review of your university application folders. Get structural feedback on your Personal Statement, CV, and letters of recommendation to stand out to admissions boards.',
    features: ['SOP / Essay Review', 'Letter of Recommendation Audits', 'Portfolio Alignment'],
    docOptions: ['Statement of Purpose (SOP)', 'CV / Resume', 'Letter of Recommendation', 'Other'],
    ctaText: 'Submit Application Files'
  },
  {
    id: 'admissions',
    icon: '💡',
    title: 'Admissions & Matching Consult',
    price: '$59.00',
    desc: 'In-depth review of your academic background to map out specific courses and admission roadmaps across Europe, North America, and beyond.',
    features: ['Custom Eligibility Checklists', 'Direct Admission Entry Audits', 'Deadline Management'],
    docOptions: ['Detailed CV', 'Transcripts Overview', 'Target University List', 'Other'],
    ctaText: 'Request Admissions Review'
  },
  {
    id: 'scholarship',
    icon: '💰',
    title: 'Scholarship & Funding Advisory',
    price: '$39.00',
    desc: 'Discover and align with compatible government, university, and private scholarship programs that fit your profile credentials.',
    features: ['Scholarship Eligibility Checks', 'Funding Document Verification', 'Application Alignment'],
    docOptions: ['Scholarship Application Essay', 'Income Statement', 'Awards Portfolio', 'Other'],
    ctaText: 'Request Funding Audit'
  },
  {
    id: 'departure',
    icon: '🌍',
    title: 'Departure & Integration Support',
    price: '$29.00',
    desc: 'Pre-departure assistance, including accommodation guidance, health insurance alignment, and student enrollment verification steps.',
    features: ['Accommodation Sourcing Tips', 'Health Insurance Alignment', 'Enrollment Portals Setup'],
    docOptions: ['Enrollment Offer Letter', 'Accommodation Application', 'Health Insurance Policy', 'Other'],
    ctaText: 'Request Departure Review'
  }
]

// Separate component for the Stripe PaymentElement Form
function StripePaymentForm({ clientSecret, selectedService, docType, file, comment, setBookingStep, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePayAndSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsSubmitting(true)
    
    try {
      // 1. Confirm payment using Stripe PaymentElement (automatically triggers Google Pay/Apple Pay if enabled)
      const paymentResult = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (paymentResult.error) {
        alert(`Payment Failed: ${paymentResult.error.message}`)
        setIsSubmitting(false)
      } else {
        if (paymentResult.paymentIntent.status === 'succeeded') {
          // 2. Call backend /api/payment/confirm to send transaction details email
          try {
            const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001"
            const formData = new FormData()
            formData.append('txn_id', paymentResult.paymentIntent.id)
            formData.append('email', user?.primaryEmailAddress?.emailAddress || 'student@example.com')
            formData.append('service_title', selectedService.title)
            formData.append('doc_type', docType)
            formData.append('comment', comment)
            formData.append('price', selectedService.price)
            if (file) {
              formData.append('file', file)
            }
            await fetch(`${backendUrl}/api/payment/confirm`, {
              method: 'POST',
              body: formData,
            })
          } catch (confirmErr) {
            console.error("⚠️ Failed to record transaction:", confirmErr)
          }

          setIsSubmitting(false)
          setBookingStep('success')
        }
      }
    } catch (err) {
      console.error(err)
      alert("An unexpected error occurred during checkout.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handlePayAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease' }}>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Order Summary</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: 'var(--text)' }}>{selectedService.title}</span>
          <strong style={{ color: '#ff8c00', fontWeight: 800 }}>{selectedService.price}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
          <span>Document:</span>
          <span>{file?.name} ({docType})</span>
        </div>
        {comment && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
            <span>Comment:</span>
            <span style={{ maxWidth: '70%', textAlign: 'right', wordBreak: 'break-all' }}>{comment}</span>
          </div>
        )}
      </div>

      {/* Real Stripe Payment Element (Displays Card, Apple Pay, Google Pay, Link automatically) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
          Payment Method
        </label>
        
        <div style={{ 
          padding: '16px', 
          borderRadius: '12px', 
          border: '1.5px solid var(--card-border)', 
          backgroundColor: 'rgba(255, 255, 255, 0.03)' 
        }}>
          <PaymentElement options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
            paymentMethodOrder: ['apple_pay', 'google_pay', 'link', 'card'],
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          type="button" 
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--card-border)',
            background: 'transparent',
            color: 'var(--text)'
          }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe}
          className="btn-accent"
          style={{
            flex: 2,
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? 'Processing Payment...' : `Confirm & Pay ${selectedService.price}`}
        </button>
      </div>
    </form>
  )
}

export default function Services() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { isSignedIn } = useAuth()

  const [selectedService, setSelectedService] = useState(null)
  const [bookingStep, setBookingStep] = useState('form')
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState(null)
  const [comment, setComment] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenBooking = (service) => {
    if (!isSignedIn) {
      setSelectedService({ ...service, _needsLogin: true })
      document.body.style.overflow = 'hidden'
      return
    }
    setSelectedService(service)
    setBookingStep('form')
    setDocType('')
    setFile(null)
    setComment('')
    setClientSecret('')
    document.body.style.overflow = 'hidden'
  }

  const handleCloseBooking = () => {
    setSelectedService(null)
    document.body.style.overflow = ''
  }

  const handleContinueToPayment = async (e) => {
    e.preventDefault()
    if (!docType || !file) return
    setIsSubmitting(true)
    
    try {
      // Fetch clientSecret from Python backend PaymentIntent API
      const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001"
      const res = await fetch(`${backendUrl}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: selectedService.price,
          service_id: selectedService.id,
          doc_type: docType
        })
      })
      
      const resData = await res.json()
      if (resData.error) {
        alert(`Backend Error: ${resData.error}`)
        setIsSubmitting(false)
        return
      }

      const secret = resData.clientSecret
      if (!secret) {
        alert("Failed to initialize Stripe session. Check backend STRIPE_SECRET_KEY.")
        setIsSubmitting(false)
        return
      }

      setClientSecret(secret)
      setIsSubmitting(false)
      setBookingStep('payment')
    } catch (err) {
      console.error(err)
      alert("Failed to reach backend payment server.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="services-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '32px' }}>{s.icon}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{s.title}</h3>
              </div>
              <span style={{ color: '#ff8c00', fontWeight: 800, fontSize: '16px', background: 'rgba(255, 140, 0, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                {s.price}
              </span>
            </div>
            
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, flexGrow: 1 }}>
              {s.desc}
            </p>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '14px', marginTop: 'auto' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#ff8c00', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Key Inclusions
              </h4>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {s.features.map((f, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ff8c00' }}>✔</span> {f}
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
                background: 'var(--accent)',
                border: 'none',
                color: '#000000',
                transition: 'transform 0.1s ease'
              }}
            >
              {s.ctaText}
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

      {/* Booking & Checkout Modal */}
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
            <span 
              onClick={handleCloseBooking}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '28px',
                cursor: 'pointer',
                transition: 'color 0.2s',
                display: 'inline-block',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
            >
              &times;
            </span>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingRight: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedService.icon}</span>
                <h3 style={{ fontSize: '20px', fontWeight: 850, color: '#ffffff' }}>{selectedService.title}</h3>
              </div>
              <span style={{ color: '#ff8c00', fontWeight: 800, fontSize: '15px', background: 'rgba(255, 140, 0, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>{selectedService.price}</span>
            </div>

            {/* LOGIN REQUIRED PROMPT */}
            {selectedService._needsLogin ? (
              <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <span style={{ fontSize: '56px' }}>🔒</span>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Sign In Required</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, maxWidth: '360px' }}>
                    You need to sign in to your account before uploading documents and booking services. This ensures we can track your orders and communicate with you.
                  </p>
                </div>
                <SignInButton mode="modal">
                  <button
                    className="btn-accent"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
                  >
                    Sign In to Continue
                  </button>
                </SignInButton>
                <button
                  onClick={handleCloseBooking}
                  style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text)', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
            <>

            {/* PROGRESS BAR */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: 'var(--accent)' }} />
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: bookingStep === 'payment' || bookingStep === 'success' ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: bookingStep === 'success' ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
            </div>

            {bookingStep === 'form' && (
              <form onSubmit={handleContinueToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: '13.5px', lineHeight: 1.5 }}>
                    Please select the document category and upload the copy to proceed with the audit booking payment.
                  </p>
                </div>

                {/* Dropdown Options */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>
                    What kind of document are you uploading?
                  </label>
                  <select 
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value)
                      setFile(null)
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--card-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: '#ffffff',
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>
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
                      <span style={{ fontSize: '14px', fontWeight: '700', display: 'block', color: '#ffffff', marginBottom: '4px' }}>
                        {file ? 'File selected:' : 'Choose file / Drag & Drop'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {file ? file.name : 'PDF, DOCX, JPG or PNG up to 10MB'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Comment Option */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>
                    Additional Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="E.g. Targets, universities, or specific request details..."
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--card-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      resize: 'none',
                      outline: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* Continue button */}
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
                  }}
                >
                  {isSubmitting ? 'Initializing Checkout...' : 'Continue to Checkout'}
                </button>
              </form>
            )}

            {bookingStep === 'payment' && clientSecret && (
              <Elements stripe={stripePromise} options={{ 
                clientSecret, 
                appearance: { 
                  theme: 'night',
                  variables: {
                    colorPrimary: '#d2f34c',
                    colorBackground: '#0d0f17',
                    colorText: '#e2e8f0',
                    borderRadius: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  },
                  rules: {
                    '.Tab': { border: '1.5px solid #242936' },
                    '.Tab--selected': { borderColor: '#d2f34c', backgroundColor: 'rgba(210,243,76,0.08)' },
                  }
                },
                paymentMethodOrder: ['apple_pay', 'google_pay', 'link', 'card'],
              }}>
                <StripePaymentForm 
                  clientSecret={clientSecret}
                  selectedService={selectedService}
                  docType={docType}
                  file={file}
                  comment={comment}
                  setBookingStep={setBookingStep}
                  onCancel={() => setBookingStep('form')}
                />
              </Elements>
            )}

            {bookingStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <span style={{ fontSize: '64px' }}>🛡️</span>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Payment Approved!</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
                    Your transaction for <strong style={{ color: 'var(--text)' }}>{selectedService.price}</strong> succeeded. We categorized your uploaded file <strong style={{ color: 'var(--text)' }}>{file?.name}</strong> under <strong style={{ color: 'var(--text)' }}>{docType}</strong>. Our academic coordinators will evaluate it and reach out shortly.
                  </p>
                </div>
                <button 
                  onClick={handleCloseBooking}
                  className="btn-accent"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                >
                  Dismiss
                </button>
              </div>
            )}
            </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
