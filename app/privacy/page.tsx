"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="account-page">
      <section className="account-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="eyebrow">WFM LEGAL</div>
        <h1>Privacy Policy</h1>
        <p className="account-muted">Last updated: October 8, 2026</p>

        <h2>1. What this policy covers</h2>
        <p>Women’s Football Market (“WFM”, “we”, “us”) provides women’s football player, club, contract, salary, transfer, market-value, scouting and related information. This policy explains what information WFM collects, why we use it, and the choices available to visitors and account holders.</p>

        <h2>2. Information we collect</h2>
        <p><strong>Account information.</strong> When you create an account, WFM may process your email address, display name, organization, job title, account type and information you voluntarily add to your profile.</p>
        <p><strong>Product activity.</strong> With analytics consent, WFM records limited first-party activity such as pages viewed, session activity, feature interactions, locale and approximate device/display information. We do not intentionally collect IP addresses through the WFM first-party activity tracker, and anonymous visitors remain pseudonymous.</p>
        <p><strong>Google Analytics.</strong> Google Analytics is loaded only after analytics consent. WFM may associate a signed-in account with a pseudonymous internal user identifier. WFM does not send your name or email address to Google Analytics.</p>
        <p><strong>Commercial account information.</strong> For club, agency and other professional accounts, WFM may process organization information, access-plan status, licensing information, sales notes and account activity needed to administer commercial relationships.</p>
        <p><strong>Public football data.</strong> WFM publishes football information such as player identities, clubs, contracts, salaries, transfers, statistics and market values where the information is available to WFM. Published records may include source, confidence, verification and last-accessed information. WFM does not intentionally publish private account credentials.</p>
        <p><strong>Contact requests.</strong> If you use the WFM contact pathway, we collect the information you submit, such as your name, email address, organization, subject, message and an optional WFM record or page reference. We use it to respond to the request, investigate the issue and maintain an appropriate request history.</p>

        <h2>3. Why we use information</h2>
        <ul>
          <li>Operate, secure and improve WFM.</li>
          <li>Provide player, club, scouting and commercial features.</li>
          <li>Measure product usage when analytics consent has been provided.</li>
          <li>Administer subscriptions, licensing, verification and customer relationships.</li>
          <li>Investigate abuse, security issues and data-quality problems.</li>
          <li>Respond to correction, verification and other legitimate requests.</li>
        </ul>

        <h2>4. Analytics choices</h2>
        <p>WFM asks for consent before loading analytics. You can decline analytics and continue using the public site. If you previously accepted analytics, you can clear the WFM analytics-consent setting in your browser and make a new choice when the consent prompt appears again.</p>

        <h2>5. Data sharing</h2>
        <p>WFM does not sell personal information to advertisers. Service providers may process information when necessary to operate hosting, authentication, analytics, database, security or other infrastructure used by WFM. Commercial account information is not made public merely because an organization has a WFM account.</p>

        <h2>6. Retention and security</h2>
        <p>We retain information for as long as reasonably necessary for the purposes described above, including maintaining account history, commercial records, security records and legitimate business documentation. We use access controls, database security policies and other reasonable safeguards appropriate to the information we maintain.</p>

        <h2>7. Your choices and requests</h2>
        <p>You may request access, correction or deletion of account information where applicable. You may also report inaccurate public football data and provide supporting information for review. WFM may retain information where necessary for security, legal obligations, legitimate business records or dispute resolution.</p>

        <h2>8. Public-data corrections</h2>
        <p>WFM is building a source-based correction workflow for clubs, agencies, players, representatives and other knowledgeable parties. A correction request should identify the record, explain the proposed correction and, when available, provide a reliable supporting source or authorization.</p>

        <h2>9. Children</h2>
        <p>WFM is not designed as a service for children. Account registration and professional/commercial features are intended for users who are legally able to use them.</p>

        <h2>10. Changes</h2>
        <p>We may update this policy as WFM evolves. Material changes will be reflected by updating the date shown at the top of this page.</p>

        <h2>11. Contact</h2>
        <p>For privacy, account or data-correction requests, use the dedicated WFM contact pathway. You can submit a request at /contact, including access, correction or deletion requests where applicable.</p>

        <p style={{ marginTop: 28 }}><Link href="/terms" className="outline">Terms of Use</Link></p>
      </section>
    </main>
  );
}
