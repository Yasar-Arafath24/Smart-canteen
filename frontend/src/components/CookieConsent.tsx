import { useState } from "react";

function CookieConsent() {
  // Check if current path is staff or admin - if so, don't show
  const isProtectedPath = ["/staff", "/admin"].some(
    (path) => window.location.pathname.startsWith(path)
  );

  // If on protected path, never show
  if (isProtectedPath) {
    return null;
  }

  const [accepted, setAccepted] = useState(() => {
    const stored = localStorage.getItem("cookie_consent");
    return stored === "accepted";
  });

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setAccepted(true);
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setAccepted(false);
  };

  // If already accepted/rejected, don't show again
  if (accepted === false) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#32145f] border-t border-white/20 z-50 py-4 px-6 shadow-lg"
      aria-label="Cookie consent"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-purple-200">
          We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept all", you consent to the storing of cookies on your device. {" "}
          <a href="/cookies" className="font-medium text-purple-300 hover:underline" target="_blank" rel="noopener">
            Learn more
          </a>
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Reject all
          </button>

          <button
            onClick={handleAccept}
            className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;