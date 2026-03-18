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
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const navItems: Array<{ id: 'home' | 'feed' | 'recommended'; label: string; shortLabel: string }> = [
    { id: 'home', label: 'Home', shortLabel: 'Home' },
    { id: 'feed', label: 'Job Feed', shortLabel: 'Feed' },
    { id: 'recommended', label: 'Recommended', shortLabel: 'For You' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-card/95 backdrop-blur shadow-xl shadow-black/25">
      <div className="w-full px-3 py-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-2 min-w-0">

          {/* Logo — always visible, never shrinks */}
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold tracking-tight transition-all hover:bg-muted/40 cursor-pointer shrink-0"
            onClick={() => onPageChange?.('home')}
            aria-label="Home"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xs shrink-0">
              RJ
            </div>
            <span className="hidden sm:inline text-foreground font-display">Renaisons</span>
          </button>

          {/* Search — takes all remaining space, never overflows */}
          <div className="flex-1 min-w-0 hidden sm:flex">
            <div className="relative w-full min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full rounded-full bg-muted/60 border border-border/40 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition-all hover:bg-muted/80 focus:outline-none focus:border-primary/50 focus:bg-muted/80 cursor-text"
              />
            </div>
          </div>

          {/* Nav items — lg+ only to avoid crowding */}
          <div className="hidden lg:flex items-center gap-0.5 shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange?.(item.id)}
                className={cn(
                  'flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
                  activePage === item.id
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                )}
              >
                <span className="lg:inline xl:hidden">{item.shortLabel}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Icons — xl+ only */}
          <div className="hidden xl:flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/60 cursor-pointer" aria-label="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/60 cursor-pointer" aria-label="Messages">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* User avatar — always visible, always shrink-0 */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 rounded-full hover:bg-muted/60 transition-all cursor-pointer pl-1 pr-2 py-1"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover border border-border/40" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white text-xs font-bold border border-border/40">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', showUserMenu && 'rotate-180')} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/50 z-[200] overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border/40 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground">Free plan</p>
                  </div>
                </div>
                <div className="py-1.5">
                  <button onClick={() => { onProfileClick?.(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    View Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                    Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    Help & Support
                  </button>
                </div>
                <div className="mx-3 h-px bg-border/40" />
                <div className="py-1.5">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search row — only on xs */}
        <div className="mt-2 sm:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full rounded-full bg-muted/60 border border-border/40 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition-all hover:bg-muted/80 focus:outline-none focus:border-primary/50 focus:bg-muted/80 cursor-text"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
