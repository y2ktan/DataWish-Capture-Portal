"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-tzuchiBlue mb-6">
          Terms & Conditions
        </h1>
        
        <p className="text-sm text-slate-700 mb-6">
          Welcome to the Buddhist Tzu-Chi Merits Society Malaysia. We are committed to protecting your privacy and ensuring that your personal information is handled with the utmost care, integrity, and respect.
        </p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-tzuchiBlue mb-2">
            1. Our Commitment to Your Privacy
          </h2>
          <p className="text-sm text-slate-700">
            In compliance with the Malaysian Personal Data Protection Act 2010 (PDPA), Tzu Chi Malaysia is dedicated to protecting all Personal Identifiable Information (PII) collected through our website (vword.net), donation portals, volunteer registrations, and event sign-ups.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-tzuchiBlue mb-2">
            2. Collection of Personal Data
          </h2>
          <p className="text-sm text-slate-700 mb-3">
            We may collect information that identifies you, including but not limited to:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2 ml-4">
            <li><strong>Identity Data:</strong> Full name, NRIC/Passport number, and gender.</li>
            <li><strong>Contact Data:</strong> Mailing address, email address, and phone number.</li>
            <li><strong>Financial Data:</strong> Bank account or credit card details (processed securely for donations and official tax-exempt receipts).</li>
            <li><strong>Interaction Data:</strong> Information provided during volunteer applications, course registrations, or newsletter subscriptions.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-tzuchiBlue mb-2">
            3. Purpose of Data Collection
          </h2>
          <p className="text-sm text-slate-700 mb-3">
            Your personal data is collected and processed strictly for the internal purposes of Tzu Chi Malaysia, including:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2 ml-4">
            <li>Issuing official donation receipts for tax deduction purposes.</li>
            <li>Managing volunteer activities and humanitarian missions.</li>
            <li>Sending updates on Tzu Chi&apos;s charitable activities and environmental initiatives.</li>
            <li>Responding to your inquiries and providing requested services.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-tzuchiBlue mb-2">
            4. Strict Confidentiality & Non-Disclosure
          </h2>
          <p className="text-sm text-slate-700 mb-3">
            Tzu Chi Malaysia maintains a strict policy regarding the sharing of your data:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2 ml-4">
            <li><strong>No Commercial Sharing:</strong> We will never sell, rent, trade, or reveal your personal information to any third-party commercial entities.</li>
            <li><strong>Internal Use Only:</strong> Your data is strictly for the use of Buddhist Tzu-Chi Merits Society Malaysia and its authorized internal departments.</li>
            <li><strong>Legal Compliance:</strong> We only disclose personal data to third parties (such as the Inland Revenue Board of Malaysia) when required by law.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-tzuchiBlue mb-2">
            5. Contact Us
          </h2>
          <p className="text-sm text-slate-700">
            If you wish to access your data or update your information, please contact our Data Protection Office:
          </p>
          <p className="text-sm text-slate-700 mt-2">
            <strong>Buddhist Tzu-Chi Merits Society Malaysia</strong><br />
            Website:{" "}
            <a
              href="https://www.tzuchi.org.my"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tzuchiBlue underline hover:text-blue-800"
            >
              https://www.tzuchi.org.my
            </a>
          </p>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-tzuchiBlue px-6 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Back to Registration
          </Link>
        </div>
      </div>
    </main>
  );
}
