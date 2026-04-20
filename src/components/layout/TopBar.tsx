import { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageSquare, ChevronDown, User, Settings, HelpCircle, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activePage?: 'home' | 'feed' | 'recommended';
  onPageChange?: (page: 'home' | 'feed' | 'recommended') => void;
  userName?: string;
  userAvatar?: string;
  onProfileClick?: () => void;
}

export function TopBar({
  searchQuery = '',
  onSearchChange,
  activePage = 'home',
  onPageChange,
  userName = 'User',
  userAvatar,
  onProfileClick,
}: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const navItems: Array<{ id: 'home' | 'feed' | 'recommended'; label: string; shortLabel: string }> = [
    { id: 'home', label: 'Overview', shortLabel: 'Home' },
    { id: 'feed', label: 'Job Feed', shortLabel: 'Feed' },
    { id: 'recommended', label: 'Recommended', shortLabel: 'For You' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,14,25,0.92),rgba(6,14,25,0.72))] backdrop-blur-2xl shadow-[0_12px_40px_-24px_rgba(0,0,0,0.95)]">
      <div className="w-full px-3 py-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-sm transition-all hover:border-white/16 hover:bg-white/[0.075]"
            onClick={() => onPageChange?.('home')}
            aria-label="Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_30%_30%,rgba(196,242,255,0.95),rgba(68,139,173,0.85))] text-[11px] font-bold text-slate-950 shadow-[0_0_25px_rgba(128,214,255,0.28)] shrink-0">
              RA
            </div>
            <div className="hidden text-left sm:block">
              <div className="font-display text-lg leading-none text-foreground">Renaisons</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-white/45">Talent console</div>
            </div>
          </button>

          <div className="hidden min-w-0 flex-1 sm:flex">
            <div className="relative w-full min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                type="text"
                placeholder="Search by title, company, skill, or location"
                value={searchQuery}
                onChange={(event) => onSearchChange?.(event.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-white/40 transition-all hover:border-white/16 hover:bg-white/[0.075] focus:outline-none focus:border-primary/40 focus:bg-white/[0.08]"
              />
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange?.(item.id)}
                className={cn(
                  'flex items-center rounded-full px-3.5 py-2 text-sm font-medium transition-all whitespace-nowrap',
                  activePage === item.id
                    ? 'border border-white/12 bg-white/[0.14] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'border border-transparent text-white/58 hover:text-foreground hover:bg-white/[0.07]'
                )}
              >
                <span className="lg:inline xl:hidden">{item.shortLabel}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-1 xl:flex">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.045] hover:bg-white/[0.08]" aria-label="Notifications">
              <Bell className="h-4 w-4 text-white/65" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.045] hover:bg-white/[0.08]" aria-label="Messages">
              <MessageSquare className="h-4 w-4 text-white/65" />
            </Button>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-1.5 py-1.5 transition-all hover:bg-white/[0.08]"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-9 w-9 rounded-full border border-white/12 object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_30%,rgba(196,242,255,0.65),rgba(37,58,86,0.95))] text-xs font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <div className="text-xs font-medium text-foreground">{userName}</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Live</div>
              </div>
              <ChevronDown className={cn('h-3.5 w-3.5 text-white/45 transition-transform duration-200', showUserMenu && 'rotate-180')} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 z-[200] mt-3 w-60 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,24,39,0.94),rgba(9,17,29,0.88))] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_30%,rgba(196,242,255,0.65),rgba(37,58,86,0.95))] text-sm font-bold text-white shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-white/45">Workspace access</p>
                  </div>
                </div>
                <div className="py-1.5">
                  <button onClick={() => { onProfileClick?.(); setShowUserMenu(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]">
                    <User className="h-4 w-4 shrink-0 text-white/45" />
                    View Profile
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]">
                    <Settings className="h-4 w-4 shrink-0 text-white/45" />
                    Settings
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]">
                    <HelpCircle className="h-4 w-4 shrink-0 text-white/45" />
                    Help & Support
                  </button>
                </div>
                <div className="mx-4 h-px bg-white/10" />
                <div className="py-1.5">
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10">
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 sm:hidden">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              type="text"
              placeholder="Search jobs"
              value={searchQuery}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-white/40 transition-all hover:border-white/16 hover:bg-white/[0.075] focus:outline-none focus:border-primary/40 focus:bg-white/[0.08]"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
