import {
  HelpCircle,
  ScrollText,
  ShieldCheck,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface TeamMember {
  name: string;
  role: string;
  linkedinUrl: string;
  githubUrl: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Yasar Arafath",
    role: "Member 1",
    linkedinUrl: "https://www.linkedin.com/in/yasar-arafath-365490333/",
    githubUrl: "https://github.com/Yasar-Arafath24",
  },
  {
    name: "Mohamed Imran",
    role: "Member 2",
    linkedinUrl: "https://www.linkedin.com/in/mohamed-imran-dev/",
    githubUrl: "https://github.com/mohamedthoufik003",
  },
  {
    name: "Moohamed Thavubik",
    role: "Member 3",
    linkedinUrl: "https://www.linkedin.com/in/moohamed-thavubik-444554308/",
    githubUrl: "https://github.com/Techie-Imran",
  },
];

const LEGAL_LINKS = [
  {
    label: "FAQ",
    to: "/faq",
    icon: <HelpCircle size={16} />,
  },
  {
    label: "Privacy Policy",
    to: "/privacy-policy",
    icon: <ShieldCheck size={16} />,
  },
  {
    label: "Cookies",
    to: "/cookies",
    icon: <ScrollText size={16} />,
  },
];

function Footer() {
  const [teamOpen, setTeamOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setTeamOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  return (
    <footer className="border-t border-[#24113f] bg-[#32145f]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:gap-10 md:flex-row md:items-start md:justify-between">
        {/* Brand */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
              <UtensilsCrossed size={18} />
            </span>

            <span>
              <span className="block text-sm font-extrabold tracking-tight text-white">
                SmartCanteen
              </span>

              <span className="block text-[10px] font-medium uppercase tracking-widest text-purple-200">
                Quality. Simplicity. Taste.
              </span>
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-purple-200">
            SmartCanteen keeps your canteen running
            smoothly with fast ordering, live
            inventory and real-time alerts.
          </p>

          <p className="mt-6 text-xs text-purple-300/70">
            © {new Date().getFullYear()} SmartCanteen.
            All rights reserved.
          </p>
        </div>

        {/* Legal */}
        <nav className="flex flex-col gap-3" aria-label="Help and policy links">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-200">
            Help &amp; Info
          </h3>

          <div className="flex flex-wrap gap-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {link.icon}

                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Team */}
        <div className="flex flex-col items-start gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-200">
            Our Team
          </h3>

          <div className="relative" ref={popupRef}>
            <button
              type="button"
              onClick={() => setTeamOpen((open) => !open)}
              aria-expanded={teamOpen}
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {teamOpen ? (
                <X size={16} />
              ) : (
                <UserRound size={16} />
              )}

              <span>
                {teamOpen ? "Close" : "View"}
              </span>
            </button>

            {teamOpen && (
              <div className="fixed inset-x-3 bottom-24 z-50 max-h-[65vh] overflow-y-auto rounded-2xl border border-[#24113f] bg-white p-3 shadow-xl md:absolute md:inset-x-auto md:bottom-full md:right-0 md:mb-2 md:w-72 md:max-h-none">
                <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Meet the developers
                </p>

                <ul className="flex flex-col gap-1">
                  {TEAM_MEMBERS.map((member) => (
                    <li
                      key={member.githubUrl}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-purple-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#24113f]">
                          {member.name}
                        </span>

                        <span className="block text-xs text-gray-400">
                          {member.role}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${member.name} on LinkedIn`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32145f] text-white transition hover:bg-[#421b7a]"
                        >
                          <LinkedInIcon size={16} />
                        </a>

                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${member.name} on GitHub`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-[#24113f] hover:bg-[#24113f] hover:text-white"
                        >
                          <GitHubIcon size={16} />
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;