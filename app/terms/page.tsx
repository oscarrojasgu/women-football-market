"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="account-page">
      <section className="account-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="eyebrow">WFM LEGAL</div>
        <h1>Terms of Use</h1>
        <p className="account-muted">Last updated: October 8, 2026</p>

        <h2>1. Acceptance</h2>
        <p>By using Women’s Football Market (“WFM”), you agree to these Terms of Use. If you do not agree, do not use the service.</p>

        <h2>2. The WFM service</h2>
        <p>WFM provides football information, scouting tools, analytics, account features and commercial data products. Availability and functionality may change as the service develops.</p>

        <h2>3. Data accuracy and verification</h2>
        <p>WFM strives to publish useful and well-sourced information, but football data can change quickly and some records may be incomplete, estimated, historical or unverified. Source, confidence and verification indicators should be considered when evaluating a record. WFM does not guarantee that every public record is complete, current or error-free.</p>

        <h2>4. No professional or legal advice</h2>
        <p>WFM data is provided for informational and football-industry purposes. It is not legal, financial, employment, tax, immigration, medical or other professional advice. Users should independently verify material information before relying on it for a consequential decision.</p>

        <h2>5. Accounts</h2>
        <p>You are responsible for maintaining the security of your account credentials and for activity performed through your account. Do not impersonate another person or organization or provide information that you are not authorized to provide.</p>

        <h2>6. Professional and commercial access</h2>
        <p>Club, agency, professional, data and API access may be subject to additional commercial terms, licensing agreements, usage limits and payment terms. Those terms control where they conflict with these general Terms of Use.</p>

        <h2>7. Acceptable use</h2>
        <ul>
          <li>Do not attempt to bypass authentication, access controls or commercial restrictions.</li>
          <li>Do not scrape, reproduce, resell or redistribute WFM data in violation of an applicable license or agreement.</li>
          <li>Do not use WFM to harass, threaten, impersonate or unlawfully target another person.</li>
          <li>Do not interfere with the security, availability or normal operation of the service.</li>
        </ul>

        <h2>8. Intellectual property and third-party material</h2>
        <p>WFM software, branding, original databases, editorial material and interface elements may be protected by applicable intellectual-property laws. Third-party names, logos, photographs, trademarks and source material remain the property of their respective owners. WFM does not claim ownership of third-party trademarks or copyrighted source material merely because they are referenced or linked.</p>

        <h2>9. Corrections and disputes</h2>
        <p>If you believe a WFM record is inaccurate or improperly presented, contact WFM with the specific record and supporting information. WFM may review, correct, annotate, restrict or remove a record where appropriate.</p>

        <h2>10. Availability and changes</h2>
        <p>WFM may change, suspend or discontinue features, including free features, as the service evolves. We may also update these Terms. Continued use after an update constitutes acceptance of the updated Terms to the extent permitted by applicable law.</p>

        <h2>11. Limitation</h2>
        <p>To the maximum extent permitted by applicable law, WFM is provided on an “as available” basis and WFM does not guarantee uninterrupted availability or error-free information. Nothing in these Terms excludes rights that cannot lawfully be excluded.</p>

        <h2>12. Contact</h2>
        <p>For questions about these Terms, licensing, corrections or account matters, use the dedicated WFM contact pathway at /contact.</p>

        <p style={{ marginTop: 28 }}><Link href="/privacy" className="outline">Privacy Policy</Link></p>
      </section>
    </main>
  );
}
