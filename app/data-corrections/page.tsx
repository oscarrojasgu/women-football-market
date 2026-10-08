"use client";

import Link from "next/link";

export default function DataCorrectionsPage() {
  return (
    <main className="account-page">
      <section className="account-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="eyebrow">WFM DATA QUALITY</div>
        <h1>Data Corrections & Verification</h1>
        <p className="account-muted">WFM is designed to make corrections and verification part of the database workflow.</p>

        <h2>Report an error</h2>
        <p>If you find an incorrect player, club, contract, salary, transfer, statistic or market-value record, identify the exact WFM page or record and explain what should change.</p>

        <h2>Strong supporting evidence</h2>
        <p>Where possible, provide an official club or league announcement, player or representative confirmation, an authoritative competition record, a licensing document, or another reliable source that directly supports the proposed correction.</p>

        <h2>How WFM reviews corrections</h2>
        <ol>
          <li>Identify the affected record.</li>
          <li>Review the supplied evidence and existing WFM sources.</li>
          <li>Compare dates, club relationships and other relevant context.</li>
          <li>Update the record, annotate it, request additional evidence, or leave it unchanged when the evidence is insufficient.</li>
          <li>Where appropriate, record the verification status and source context.</li>
        </ol>

        <h2>Club and agency representatives</h2>
        <p>Authorized club and agency representatives may request profile corrections and may discuss verification or licensing arrangements with WFM. Verification does not automatically mean that every historical record associated with an organization is correct; it indicates that the relevant identity or information has been reviewed under the applicable WFM process.</p>

        <h2>Salary and contract information</h2>
        <p>Salary and contract information can be particularly difficult to verify. WFM will distinguish verified records from other confidence levels and will not represent an unavailable figure as a confirmed fact.</p>

        <p>Use the WFM contact pathway to submit a correction or verification request, including the affected record and supporting evidence.</p>

        <p style={{ marginTop: 28 }}><Link href="/privacy" className="outline">Privacy Policy</Link> <Link href="/contact" className="outline">Contact WFM</Link></p>
      </section>
    </main>
  );
}
