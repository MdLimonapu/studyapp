import React from 'react'
import { useNavigate } from 'react-router-dom'

const SERVICES = [
  {
    icon: '📄',
    title: 'Academic Document Evaluation',
    desc: 'Comprehensive review of your transcripts, certificates, and GPA conversions. We verify international equivalence and highlight matching parameters to fit university admissions criteria.',
    features: ['GPA Equivalence Audits', 'Credential Verification', 'Prerequisites Mapping']
  },
  {
    icon: '🛂',
    title: 'Visa & Immigration Guidance',
    desc: 'Step-by-step navigation through visa applications. We help organize your visa portfolios, prepare financial proofs, and audit documents to maximize approval odds.',
    features: ['Document Checklist Audits', 'Financial Statement Review', 'Interview Preparation Tips']
  },
  {
    icon: '🎓',
    title: 'University Application Strategy',
    desc: 'Professional review of your university application folders. Get structural feedback on your Personal Statement, CV, and letters of recommendation to stand out to admissions boards.',
    features: ['SOP / Essay Review', 'Letter of Recommendation Audits', 'Portfolio Alignment']
  },
  {
    icon: '💡',
    title: 'Admissions & Matching Consult',
    desc: 'In-depth review of your academic background to map out specific courses and admission roadmaps across Europe, North America, and beyond.',
    features: ['Custom Eligibility Checklists', 'Direct Admission Entry Audits', 'Deadline Management']
  },
  {
    icon: '💰',
    title: 'Scholarship & Funding Advisory',
    desc: 'Discover and align with compatible government, university, and private scholarship programs that fit your profile credentials.',
    features: ['Scholarship Eligibility Checks', 'Funding Document Verification', 'Application Alignment']
  },
  {
    icon: '🌍',
    title: 'Departure & Integration Support',
    desc: 'Pre-departure assistance, including accommodation guidance, health insurance alignment, and student enrollment verification steps.',
    features: ['Accommodation Sourcing Tips', 'Health Insurance Alignment', 'Enrollment Portals Setup']
  }
]

export default function Services() {
  const navigate = useNavigate()

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
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px', transition: 'all 0.3s ease', border: '1px solid var(--card-border)' }}>
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
    </div>
  )
}
