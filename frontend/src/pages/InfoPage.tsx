import { FileQuestion } from "lucide-react";

import Footer from "../components/Footer";

interface InfoPageProps {
  title: string;
  description: string;
}

export default function InfoPage({
  title,
  description,
}: InfoPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
            <FileQuestion size={18} />
          </span>

          <div>
            <h1 className="text-lg font-bold text-white">
              {title}
            </h1>

            <p className="text-xs text-purple-200">
              {description}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#32145f]">
          <FileQuestion size={28} />
        </span>

        <h2 className="mt-6 text-2xl font-bold text-[#24113f]">
          {title}
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          This page is on its way. Content for{" "}
          <span className="font-semibold text-[#32145f]">
            {title}
          </span>{" "}
          will be added here soon. Please check back
          later.
        </p>
      </main>

      <Footer />
    </div>
  );
}