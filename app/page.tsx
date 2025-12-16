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
      icon: <span className="text-3xl leading-none">📝</span>
    },
    {
      href: "/scan",
      label: "Scan",
      number: 2,
      icon: <span className="text-3xl leading-none mb-2">📷</span>
    },
    {
      href: "/tree",
      label: "Tree",
      number: 3,
      icon: <span className="text-3xl leading-none">🌳</span>
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
