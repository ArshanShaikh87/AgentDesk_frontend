import { useState } from 'react';

const links = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Waitlist', href: '#waitlist' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur border-b border-border">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-display font-semibold text-lg">
          AgentDesk
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#waitlist"
            className="h-10 px-5 rounded-lg font-medium text-sm text-white bg-accent flex items-center"
          >
            Join waitlist
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="md:hidden w-10 h-10 flex items-center justify-center -mr-2"
        >
          <span className="relative w-5 h-4 block">
            <span
              className={`absolute left-0 top-0 w-5 h-0.5 bg-text-primary transition-transform duration-200 ${
                open ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] w-5 h-0.5 bg-text-primary transition-opacity duration-200 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] w-5 h-0.5 bg-text-primary transition-transform duration-200 ${
                open ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile dropdown panel */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-out border-b border-border ${
          open ? 'max-h-64' : 'max-h-0 border-b-0'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-text-secondary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#waitlist"
            onClick={() => setOpen(false)}
            className="h-11 px-5 rounded-lg font-medium text-sm text-white bg-accent flex items-center justify-center"
          >
            Join waitlist
          </a>
        </div>
      </div>
    </header>
  );
}
