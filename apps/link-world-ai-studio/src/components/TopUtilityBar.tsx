import React from 'react';
import { 
  Menu, Search, ChevronRight, ChevronDown, Sun, Moon, 
  CheckCircle2, LogIn, LogOut 
} from 'lucide-react';
import { ASSETS } from '../assets/images.ts';

interface TopUtilityBarProps {
  dimensionPath: string[];
  onBack?: () => void;
  canGoBack?: boolean;
  theme: 'day' | 'night' | 'gray';
  onThemeChange: (theme: 'day' | 'night' | 'gray') => void;
  supabaseConnected: boolean;
  isMember: boolean;
  userEmail?: string;
  onOpenAuth: () => void;
  onSignOut: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileLedger: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  dimensionPath,
  theme,
  onThemeChange,
  supabaseConnected,
  isMember,
  userEmail,
  onOpenAuth,
  onSignOut,
  searchQuery,
  onSearchChange,
  onOpenMobileLedger,
}) => {
  return (
    <header 
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 transition-colors border-b"
      style={{ 
        backgroundColor: 'var(--canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Botón Mobile + Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMobileLedger}
          className="p-1 mr-1 md:hidden"
          style={{ color: 'var(--ink)' }}
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav aria-label="Ruta dimensional" className="flex items-center gap-1.5 text-xs font-mono font-medium">
          {dimensionPath.map((item, idx) => {
            const isLast = idx === dimensionPath.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                )}
                <span 
                  className={isLast ? 'font-bold' : 'hover:underline cursor-pointer'}
                  style={{ color: isLast ? 'var(--ink)' : 'var(--ink-muted)' }}
                >
                  {item}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Buscador Universal Central con shortcut ⌘ K */}
      <div className="flex-1 max-w-md mx-6 hidden sm:block">
        <div 
          className="relative flex items-center px-3 py-1.5 rounded-md text-xs border transition-all"
          style={{ 
            backgroundColor: 'var(--surface)', 
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Search className="w-3.5 h-3.5 mr-2 shrink-0 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar células, operaciones, personas..."
            className="w-full bg-transparent border-0 outline-none text-xs"
            style={{ color: 'var(--ink)' }}
          />
          <kbd 
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border ml-2 text-neutral-400 select-none shrink-0"
            style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--border-subtle)' }}
          >
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Utilidades del lado derecho */}
      <div className="flex items-center gap-4 text-xs font-medium">
        {/* Indicador: Sistema operativo online */}
        <div className="hidden lg:flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          <span 
            className="w-2 h-2 rounded-full inline-block animate-pulse"
            style={{ background: supabaseConnected ? 'var(--link-fluor-strong)' : '#E5484D' }}
          />
          <span style={{ color: 'var(--ink)' }}>Sistema operativo online</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </div>

        {/* Toggle Modo Día / Noche */}
        <button
          onClick={() => onThemeChange(theme === 'day' ? 'night' : 'day')}
          title={theme === 'day' ? 'Modo noche' : 'Modo día'}
          className="p-1.5 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
          style={{ color: 'var(--ink)' }}
        >
          {theme === 'day' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Avatar + Sesión LINK */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={isMember ? onSignOut : onOpenAuth}>
          <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0">
            <img 
              src={ASSETS.avatarProfile} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="hidden md:inline font-medium" style={{ color: 'var(--ink)' }}>
            {isMember ? (userEmail?.split('@')[0] || 'Sesión LINK') : 'Sesión LINK'}
          </span>
          <ChevronDown className="w-3 h-3 text-neutral-400 hidden md:inline" />
        </div>
      </div>
    </header>
  );
};
