import { useEffect, useState } from 'react';
import { Button, Link } from 'react-aria-components';
import { Sun, Moon, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'stack', label: 'Stack' },
  { id: 'process', label: 'Process' },
  { id: 'contact', label: 'Contact' },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Navbar({ onOpenAdmin }) {
  const isAdmin = !!localStorage.getItem('ADMIN_ACCESS_TOKEN');
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('top');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ids = ['top', ...NAV_LINKS.map((l) => l.id)];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-colors duration-300 ${
        scrolled ? 'border-ink-line bg-ink-deep/95' : 'border-ink-line/70 bg-ink-deep/85'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2 font-mono text-sm text-paper">
          <span className="grid h-8 w-8 place-items-center rounded-sm border border-blue-line text-blue-bright transition-colors duration-300 hover:border-blue-bright">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </span>
          <span className="text-stamp">
            FARESAYADI<span className="text-blue-bright">.DEV</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              onPress={() => scrollTo(link.id)}
              className={`relative cursor-pointer pb-1 font-mono text-xs uppercase tracking-widest outline-none transition-colors after:absolute after:-bottom-0 after:left-0 after:h-px after:bg-blue-bright after:transition-all after:duration-300 hover:text-blue-bright data-[focus-visible]:text-blue-bright ${
                active === link.id ? 'text-blue-bright after:w-full' : 'text-paper-dim after:w-0'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="cursor-pointer font-mono text-xs uppercase tracking-widest text-copper outline-none transition-colors hover:text-blue-bright data-[focus-visible]:text-blue-bright"
            >
              Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop theme + start project */}
          <Button
            onPress={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-9 w-9 place-items-center rounded-sm border border-ink-line text-paper-dim outline-none transition-colors hover:border-blue-bright hover:text-blue-bright data-[focus-visible]:border-blue-bright"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            onPress={() => scrollTo('contact')}
            className="hidden rounded-sm border border-copper px-4 py-2 font-mono text-xs uppercase tracking-widest text-copper outline-none transition-colors hover:bg-copper hover:text-ink-deep data-[focus-visible]:bg-copper data-[focus-visible]:text-ink-deep md:inline-block"
          >
            Start a project
          </Button>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-sm border border-ink-line text-paper-dim outline-none transition-colors hover:border-blue-bright hover:text-blue-bright md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[57px] z-50 bg-ink-deep/98 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-6 pt-8"
            aria-label="Mobile navigation"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => { scrollTo(link.id); setMenuOpen(false); }}
                className={`w-full rounded-sm px-4 py-3 text-left font-mono text-sm uppercase tracking-widest outline-none transition-colors ${
                  active === link.id
                    ? 'bg-blue-line/20 text-blue-bright'
                    : 'text-paper-dim hover:bg-ink-panel/40 hover:text-paper'
                }`}
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => { onOpenAdmin(); setMenuOpen(false); }}
                className="w-full rounded-sm px-4 py-3 text-left font-mono text-sm uppercase tracking-widest text-copper outline-none transition-colors hover:bg-ink-panel/40 hover:text-copper"
              >
                Admin
              </button>
            )}
            <div className="my-4 border-t border-ink-line/50" />
            <Button
              onPress={() => { scrollTo('contact'); setMenuOpen(false); }}
              className="w-full rounded-sm border border-copper px-4 py-3 font-mono text-sm uppercase tracking-widest text-copper outline-none transition-colors hover:bg-copper hover:text-ink-deep"
            >
              Start a project
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
