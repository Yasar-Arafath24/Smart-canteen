import {
  HelpCircle,
} from "lucide-react";
import Footer from "../components/Footer";

export default function FAQ() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
            <HelpCircle size={18} />
          </span>

          <div>
            <h1 className="text-lg font-bold text-white">FAQ</h1>

            <p className="text-xs text-purple-200">
              Frequently asked questions
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <h2 className="text-xl font-bold text-[#24113f] mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 text-gray-700">
          <details>
            <summary className="font-medium text-purple-600 cursor-pointer">
              How do I place an order?
            </summary>
            <p className="text-base leading-relaxed">
              Simply browse the menu, add items to your cart, and proceed to checkout. You'll need to select a payment method and confirm your delivery address.
            </p>
          </details>

          <details>
            <summary className="font-medium text-purple-600 cursor-pointer">
              What payment methods do you accept?
            </summary>
            <p className="text-base leading-relaxed">
              We accept all major credit cards (Visa, MasterCard, American Express) as well as debit cards and net banking.
            </p>
          </details>

          <details>
            <summary className="font-medium text-purple-600 cursor-pointer">
              How can I track my order?
            </summary>
            <p className="text-base leading-relaxed">
              Once your order is confirmed, you'll receive a tracking link via SMS/email. You can also view the status in your account under "My Orders".
            </p>
          </details>

          <details>
            <summary className="font-medium text-purple-600 cursor-pointer">
              What is your return policy?
            </summary>
            <p className="text-base leading-relaxed">
              Unopened, non-perishable items can be returned within 7 days of delivery with a receipt. Food items cannot be returned for health and safety reasons.
            </p>
          </details>
        </div>
      </main>

      <Footer />
    </div>
  );
}