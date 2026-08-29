import {
  ShieldCheck,
} from "lucide-react";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
            <ShieldCheck size={18} />
          </span>

          <div>
            <h1 className="text-lg font-bold text-white">
              Privacy Policy
            </h1>

            <p className="text-xs text-purple-200">
              How we handle your data
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <h2 className="text-xl font-bold text-[#24113f] mb-6">
          Privacy Policy
        </h2>

        <p className="text-base text-gray-700 mb-6">
          Effective Date: [Date]
        </p>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          Information We Collect
        </h3>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li>Personal information (name, email, phone number)</li>
          <li>Transaction details (orders, payments, amounts)</li>
          <li>Device information (IP address, browser type)</li>
          <li>Usage data (pages visited, time spent)</li>
        </ul>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          How We Use Your Information
        </h3>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li>To process and fulfill orders</li>
          <li>To communicate with you about your orders</li>
          <li>To improve our menu and services</li>
          <li>For security and fraud prevention</li>
        </ul>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          Information Sharing
        </h3>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li>We do not sell your personal information</li>
          <li>We may share data with trusted third-party payment processors</li>
          <li>We may disclose information if required by law</li>
        </ul>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          Your Rights
        </h3>
        <ul className="list-disc list-inside text-gray-600">
          <li>You can request access to your personal data</li>
          <li>You can request deletion of your data</li>
          <li>You can opt-out of marketing communications</li>
        </ul>

        <p className="text-sm text-gray-500 mt-8">
          For any privacy-related questions, contact us at privacy@smartcanteen.example
        </p>
      </main>

      <Footer />
    </div>
  );
}