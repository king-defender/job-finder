'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Profile' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/applications', label: 'Applications' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/outreach', label: 'Outreach' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-violet-500/20">
            J
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            JobAgent
          </span>
        </div>
        <nav className="flex items-center gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
