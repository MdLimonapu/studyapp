import React, { useEffect, useState } from 'react'

export default function About() {
  const [activePillar, setActivePillar] = useState(0)

  useEffect(() => {
    document.title = 'About Us | Studplex'
  }, [])

  const pillars = [
    {
      title: "Real & Curated Data",
      color: "#ff8c00",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      description: "No fake courses or outdated catalogs. We gather raw database information to feed our search algorithm, keeping it current, reliable, and tailored to real requirements.",
      bullets: ["Direct university APIs", "Daily updates", "Tuition & living fee tracking"]
    },
    {
      title: "Expert Evaluation",
      color: "#10b981",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      description: "Automatic search is great, but human touch is essential. Our coordinators evaluate transcripts and direct admissions entry profiles for maximum accuracy.",
      bullets: ["GPA equivalency check", "Credential screening", "Personal statement reviews"]
    },
    {
      title: "Academic Integrity",
      color: "#3b82f6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      description: "We strictly guide students based on true university requirements and criteria, maintaining high ethical standards. No shortcuts, just real paths to success.",
      bullets: ["Unbiased matches", "No hidden agent commissions", "Transparent admission odds"]
    }
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', animation: 'fadeIn 0.4s ease' }}>
      
      {/* Decorative Blur Blobs for Dark Mode */}
      <div className="about-glow-1" style={{
        position: 'absolute',
        top: '150px',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'var(--radial-1)',
        filter: 'blur(100px)',
        zIndex: -1,
        pointerEvents: 'none',
        borderRadius: '50%'
      }}></div>
      <div className="about-glow-2" style={{
        position: 'absolute',
        top: '400px',
        right: '10%',
        width: '320px',
        height: '320px',
        background: 'var(--radial-2)',
        filter: 'blur(120px)',
        zIndex: -1,
        pointerEvents: 'none',
        borderRadius: '50%'
      }}></div>

      {/* Hero Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '64px', position: 'relative' }}>
        <span className="badge" style={{ 
          marginBottom: '16px', 
          fontSize: '12px', 
          fontWeight: 700, 
          padding: '6px 16px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          background: 'var(--secondary-glow)',
          border: '1px solid var(--secondary-border)',
          color: 'var(--accent)',
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          About Studplex
        </span>
        <h1 style={{ 
          fontSize: 'clamp(32px, 5vw, 46px)', 
          fontWeight: 900, 
          marginBottom: '20px', 
          color: 'var(--text)', 
          letterSpacing: '-0.03em',
          lineHeight: 1.15
        }}>
          Connecting Ambition with <span style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Global Opportunity</span>
        </h1>
        <p style={{ 
          color: 'var(--muted)', 
          fontSize: '18px', 
          maxWidth: '760px', 
          margin: '0 auto', 
          lineHeight: 1.65,
          fontWeight: 450
        }}>
          Studplex was founded by international graduates who experienced firsthand the complexity of searching, applying, and relocating for overseas education. We built the platform we wish we had when we started.
        </p>
      </div>

      {/* Grid: Mission & Vision (Glassmorphic) */}
      <div className="grid two-col" style={{ marginBottom: '64px', gap: '28px' }}>
        
        {/* Mission Card */}
        <div className="card" style={{ 
          padding: '36px',
          borderRadius: '20px',
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          transition: 'transform 0.3s ease, border-color 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.borderColor = 'var(--card-border)'
        }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '14px', 
            background: 'rgba(255, 140, 0, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '28px' 
          }}>🎯</div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>Our Mission</h3>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            To democratize access to international higher education. We believe that finding your dream university should be based on transparent, real-world data and expert academic matching, not complex agency markups.
          </p>
        </div>

        {/* Vision Card */}
        <div className="card" style={{ 
          padding: '36px',
          borderRadius: '20px',
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          transition: 'transform 0.3s ease, border-color 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.borderColor = 'var(--card-border)'
        }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '14px', 
            background: 'rgba(59, 130, 246, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '28px' 
          }}>🔮</div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>Our Vision</h3>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            To become the leading platform for global academic mobility, easing the process of credential checking, admissions strategy, and visa preparation for students worldwide.
          </p>
        </div>

      </div>

      {/* Interactive Pillars Explorer */}
      <div style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text)' }}>Our Core Pillars</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15.5px', marginTop: '10px' }}>
            We base our software matching and services on three simple principles
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: '24px',
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Pillar selectors */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            borderBottom: '1px solid var(--card-border)',
            paddingBottom: '20px'
          }}>
            {pillars.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePillar(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: '1px solid ' + (activePillar === idx ? p.color : 'var(--card-border)'),
                  background: activePillar === idx ? `rgba(${idx === 0 ? '255,140,0' : idx === 1 ? '16,185,129' : '59,130,246'}, 0.08)` : 'rgba(0,0,0,0.1)',
                  color: activePillar === idx ? p.color : 'var(--muted)',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  outline: 'none',
                  width: 'auto',
                  margin: 0
                }}
              >
                {p.icon}
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Pillar Active Content */}
          <div style={{ 
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 800, 
                color: pillars[activePillar].color, 
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Pillar 0{activePillar + 1}
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 16px', color: 'var(--text)' }}>
                {pillars[activePillar].title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '15.5px', lineHeight: 1.7, margin: 0 }}>
                {pillars[activePillar].description}
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(0,0,0,0.15)', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid var(--card-border)' 
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
                What this means for you:
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pillars[activePillar].bullets.map((b, bIdx) => (
                  <li key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', color: 'var(--text)' }}>
                    <span style={{ color: pillars[activePillar].color, fontWeight: 'bold' }}>✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="card" style={{ 
        textAlign: 'center', 
        padding: '50px 40px', 
        borderRadius: '24px',
        marginBottom: '64px', 
        border: '1px solid var(--card-border)',
        background: 'var(--card)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '36px', color: 'var(--text)' }}>Studplex in Numbers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <span style={{ fontSize: '42px', fontWeight: 900, color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>92,000+</span>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Courses Indexed</span>
          </div>
          <div>
            <span style={{ fontSize: '42px', fontWeight: 900, color: '#10b981', display: 'block', marginBottom: '8px' }}>10+</span>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Countries Covered</span>
          </div>
          <div>
            <span style={{ fontSize: '42px', fontWeight: 900, color: '#3b82f6', display: 'block', marginBottom: '8px' }}>100%</span>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Free Basic Search</span>
          </div>
        </div>
      </div>

      {/* Interactive Platform Values Grid */}
      <div style={{ marginBottom: '64px' }}>
        <h3 style={{ fontSize: '26px', fontWeight: 800, textAlign: 'center', marginBottom: '32px', color: 'var(--text)' }}>
          Designed for Global Students
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '30px', borderRadius: '18px', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '16px' }}>🚀</span>
            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: 'var(--text)' }}>Instant Eligibility Reports</h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Instantly find matching universities. Select your origin country and field of interest, and see customized entry conditions.
            </p>
          </div>
          <div className="card" style={{ padding: '30px', borderRadius: '18px', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '16px' }}>🔒</span>
            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: 'var(--text)' }}>Privacy First</h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              We do not sell student contact info to brokers. Your academic record is confidential and shared only with universities you choose.
            </p>
          </div>
          <div className="card" style={{ padding: '30px', borderRadius: '18px', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '16px' }}>💸</span>
            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: 'var(--text)' }}>No Agent Markups</h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Traditional educational agencies charge huge margins. Studplex provides free toolsets, with transparent optional advisory fees.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box (Premium visual panel) */}
      <div className="card" style={{ 
        textAlign: 'center', 
        padding: '56px 40px', 
        borderRadius: '24px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '24px',
        background: 'linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(59,130,246,0.1) 100%)',
        border: '1px solid var(--accent)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>Ready to Find Your Match?</h3>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '650px', lineHeight: 1.65, margin: 0 }}>
          Join thousands of international students checking entry requirements and mapping courses across Europe and North America.
        </p>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="btn-accent" style={{ width: 'auto', padding: '16px 42px', borderRadius: '14px', fontWeight: 700, fontSize: '15.5px' }}>
            Get Started Free
          </button>
        </a>
      </div>

    </div>
  )
}
