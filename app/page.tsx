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

export default function HomePage() {
  const actions = [
    {
      href: "/register",
      label: "Register",
      number: 1,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          {/* Square outline with open bottom-right */}
          <path
            d="M6 6h7.5M6 6v10.5c0 1.1.9 2 2 2H17"
            strokeLinecap="round"
          />
          {/* Pencil */}
          <path d="M11 13.5l5-5" strokeLinecap="round" />
          <path
            d="M16.7 7.8l1-1a1 1 0 011.4 0l.9.9a1 1 0 010 1.4l-1 1-2.3-2.3z"
            fill="currentColor"
          />
          <path d="M10.6 14l.4-1.6 1.2 1.2-1.6.4z" fill="currentColor" />
        </svg>
      )
    },
    {
      href: "/scan",
      label: "Scan",
      number: 2,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          {/* Camera body */}
          <rect
            x="3.5"
            y="7"
            width="17"
            height="11"
            rx="2.2"
            ry="2.2"
          />
          {/* Top bump */}
          <path d="M8 7L9.2 5.2C9.5 4.7 9.9 4.5 10.4 4.5h3.2c0.5 0 0.9 0.2 1.2 0.7L16 7" />
          {/* Lens */}
          <circle cx="12" cy="12.5" r="3" />
          {/* Small flash indicator */}
          <circle cx="6" cy="9.2" r="0.8" fill="currentColor" />
        </svg>
      )
    },
    {
      href: "/tree",
      label: "Tree",
      number: 3,
      icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-8 w-8"
                fill="none"
                stroke="currentColor"
          strokeWidth="1.5"
              >
          {/* Simple canopy */}
                <path
            d="M8 9c0-2.5 1.9-4.5 4-4.5s4 2 4 4.5c0 2.2-1.6 3.7-4 3.7S8 11.2 8 9z"
            fill="currentColor"
                />
          {/* Trunk */}
          <path d="M11 12.7v4.8M13 12.7v4.8" strokeLinecap="round" />
          {/* Ground */}
          <path d="M7.5 18.5h9" strokeLinecap="round" />
              </svg>
      )
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="max-w-xl text-center space-y-4">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl shadow-sm bg-black">
          <Image
            src="/assets/backgrounds/bg-eacdc80e81739bcebfabac5a3ff5e6d1.jpg"
            alt="Tzu Chi Jing Si Hall"
            width={800}
            height={400}
            className="w-full h-auto max-h-64 object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl font-semibold text-tzuchiBlue">
          {HOME_TITLE}
        </h1>
        <p className="text-sm text-slate-600">{HOME_DESCRIPTION}</p>

        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-1 focus-visible:outline-none"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tzuchiBlue text-white shadow-sm transition-colors group-hover:bg-blue-800 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-tzuchiBlue">
                {action.icon}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-tzuchiBlue">
                <span className="text-xs font-semibold">{action.number}.</span>
                <span className="text-sm font-semibold leading-tight">
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
