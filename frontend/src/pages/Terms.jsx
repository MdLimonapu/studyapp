import React from 'react'

export default function Terms() {
  return (
    <div className="card form-card text-content-page" style={{ maxWidth: '800px', margin: '40px auto', padding: '40px' }}>
      <h2 style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        Terms of Service
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Last updated: May 27, 2026</p>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>1. Acceptance of Terms</h3>
        <p style={{ lineHeight: '1.6' }}>
          By accessing or using Studplex (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the Service.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>2. Description of Service</h3>
        <p style={{ lineHeight: '1.6' }}>
          Studplex provides an automated university matching tool to search for English-taught degree programs and calculate general eligibility criteria based on academic metrics like GPA. The Service is provided for information purposes only. Official admission requirements should always be verified directly with the target university.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>3. User Conduct and Registration</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
          You agree to provide accurate and truthful profile details (GPA, degree, field of study). You are responsible for maintaining the confidentiality of your Clerk authentication credentials and account access.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>4. Intellectual Property</h3>
        <p style={{ lineHeight: '1.6' }}>
          All content, software, design systems, algorithms, and logos associated with Studplex are the intellectual property of Studplex and its operators. You may not copy, scraping, modify, or commercially distribute any data from the platform without prior written consent.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>5. Limitation of Liability</h3>
        <p style={{ lineHeight: '1.6' }}>
          Studplex provides the Service "as is" and makes no guarantees regarding the accuracy of matching calculations, university admissions, or visa processing outcomes. In no event shall Studplex be liable for any direct or indirect damages resulting from your use of the Service.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>6. Termination</h3>
        <p style={{ lineHeight: '1.6' }}>
          We reserve the right to suspend or terminate your access to the Service at any time, without prior notice, for violation of these Terms or other conduct deemed harmful to the platform.
        </p>
      </section>

      <section>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>7. Changes to Terms</h3>
        <p style={{ lineHeight: '1.6' }}>
          We may update these Terms of Service from time to time. Your continued use of Studplex after modifications are published constitutes acceptance of the updated terms.
        </p>
      </section>
    </div>
  )
}
