import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const HOME_TITLE = "AI-Powered Memorable Moments";
const HOME_DESCRIPTION =
  "Capture, personalize, and share your special event photo in under a minute.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION
};

const RegisterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="url(#iconGradient)" strokeWidth="1.5" />
    <path d="M8 7h8M8 11h8M8 15h5" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="16" cy="15" r="2" fill="#00A3E0" />
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066B3" />
        <stop offset="50%" stopColor="#00A3E0" />
        <stop offset="100%" stopColor="#6DD5ED" />
      </linearGradient>
    </defs>
  </svg>
);

const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <rect x="3" y="3" width="18" height="14" rx="2" stroke="url(#iconGradient2)" strokeWidth="1.5" />
    <circle cx="12" cy="10" r="4" stroke="url(#iconGradient2)" strokeWidth="1.5" />
    <circle cx="12" cy="10" r="2" fill="#00A3E0" />
    <rect x="8" y="1" width="8" height="3" rx="1" fill="#00A3E0" opacity="0.8" />
    <path d="M6 20h12" stroke="#6DD5ED" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="iconGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066B3" />
        <stop offset="50%" stopColor="#00A3E0" />
        <stop offset="100%" stopColor="#6DD5ED" />
      </linearGradient>
    </defs>
  </svg>
);

const TreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 2L6 10h3v4H6l6 8 6-8h-3v-4h3L12 2z" stroke="url(#iconGradient3)" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="8" r="1.5" fill="#00A3E0" />
    <circle cx="10" cy="12" r="1" fill="#6DD5ED" />
    <circle cx="14" cy="12" r="1" fill="#6DD5ED" />
    <defs>
      <linearGradient id="iconGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00A3E0" />
        <stop offset="100%" stopColor="#A8E6CF" />
      </linearGradient>
    </defs>
  </svg>
);

export default function HomePage() {
  const actions = [
    {
      href: "/register",
      label: "Register",
      number: 1,
      icon: <RegisterIcon />
    },
    {
      href: "/scan",
      label: "Scan",
      number: 2,
      icon: <ScanIcon />
    },
    {
      href: "/tree",
      label: "Tree",
      number: 3,
      icon: <TreeIcon />
    }
  ];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: `
          linear-gradient(to right, #00A3E0 1px, transparent 1px),
          linear-gradient(to bottom, #00A3E0 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px'
      }} />
      
      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />

      <div className="relative z-10 max-w-xl text-center space-y-6">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl">
          <Image
            src="/assets/backgrounds/logo.svg"
            alt="DataWish - AI-Powered Moments"
            width={800}
            height={400}
            className="w-full h-auto max-h-64 object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-wide" style={{ 
          background: 'linear-gradient(135deg, #0066B3, #00A3E0, #6DD5ED)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {HOME_TITLE}
        </h1>
        <p className="text-sm tracking-wider" style={{ color: '#6DD5ED', opacity: 0.8 }}>{HOME_DESCRIPTION}</p>

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 focus-visible:outline-none"
            >
              <div 
                className="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,102,179,0.2), rgba(0,163,224,0.1))',
                  boxShadow: '0 0 20px rgba(0,163,224,0.3), inset 0 0 20px rgba(0,163,224,0.1)'
                }}
              >
                {/* Gradient border */}
                <div 
                  className="absolute inset-0 rounded-full p-[2px]"
                  style={{ 
                    background: 'linear-gradient(135deg, #0066B3, #00A3E0, #6DD5ED)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }}
                />
                {action.icon}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: '#6DD5ED' }}>{action.number}.</span>
                <span 
                  className="text-sm font-semibold leading-tight tracking-wider"
                  style={{ color: '#00A3E0' }}
                >
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
