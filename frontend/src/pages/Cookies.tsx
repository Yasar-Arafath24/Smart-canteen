import {
  ScrollText,
} from "lucide-react";
import Footer from "../components/Footer";

export default function Cookies() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
            <ScrollText size={18} />
          </span>

          <div>
            <h1 className="text-lg font-bold text-white">
              Cookies
            </h1>

            <p className="text-xs text-purple-200">
              How we use cookies
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <h2 className="text-xl font-bold text-[#24113f] mb-6">
          Cookies Policy
        </h2>

        <p className="text-base text-gray-700 mb-6">
          Effective Date: [Date]
        </p>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          Types of Cookies We Use
        </h3>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li>
            <strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable basic features like page navigation and access to secure areas.
          </li>
          <li>
            <strong>Preference Cookies:</strong> These cookies allow the website to remember choices you make (such as your username, language, or your region) for a more personalized experience.
          </li>
          <li>
            <strong>Statistic Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting information anonymously.
          </li>
          <li>
            <strong>Marketing Cookies:</strong> These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.
          </li>
        </ul>

        <h3 className="text-lg font-medium text-purple-600 mb-4">
          Managing Cookies
        </h3>
        <p className="text-base text-gray-600 mb-4">
          You can control cookies through your browser settings. Most browsers allow you to:
        </p>
        <ul className="list-disc list-inside text-gray-600">
          <li>View which cookies have been set</li>
          <li>Delete cookies</li>
          <li>Block cookies from specific sites</li>
        </ul>

        <p className="text-sm text-gray-500 mt-6">
          Please note that blocking some types of cookies may impact your experience on the website and limit the services we can provide.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          For more information about cookies and how to manage them, visit <a href="https://www.aboutcookies.org" className="text-purple-600 underline" target="_blank" rel="noopener noreferrer">aboutcookies.org</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}