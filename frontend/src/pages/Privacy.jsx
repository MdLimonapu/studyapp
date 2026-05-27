import React from 'react'

export default function Privacy() {
  return (
    <div className="card form-card text-content-page" style={{ maxWidth: '800px', margin: '40px auto', padding: '40px' }}>
      <h2 style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        Privacy Policy
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Last updated: May 27, 2026</p>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>1. Information We Collect</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
          We collect information you provide directly to us when using Studplex. This includes:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '12px' }}>
          <li>Account credentials managed securely through Clerk (Email address, Full Name, Profile picture).</li>
          <li>Academic profile data (GPA, degree level, field of study, and target universities).</li>
          <li>Communications sent to us through our support/contact form.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>2. How We Use Your Information</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
          We use the information we collect to:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '12px' }}>
          <li>Provide, maintain, and improve our university matching services.</li>
          <li>Personalize search results and calculate matching eligibility scores.</li>
          <li>Respond to your support requests, comments, and questions.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>3. Data Sharing and Security</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
          We do not sell your personal data. We only share data with secure third-party sub-processors (such as Clerk for user authentication and MongoDB Atlas for secure cloud storage). We implement strict technical and organizational measures to safeguard your personal data from unauthorized access or alteration.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>4. Your Rights</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
          Depending on your location (such as the EEA/GDPR scope), you have the right to access, correct, delete, or export your personal data stored with us. You can delete your account and profile data at any time from your settings or by contacting support.
        </p>
      </section>

      <section>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>5. Contact Us</h3>
        <p style={{ lineHeight: '1.6' }}>
          If you have any questions about this Privacy Policy or our data practices, please contact us via our website contact form or at <a href="mailto:support@studplex.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>support@studplex.com</a>.
        </p>
      </section>
    </div>
  )
}
