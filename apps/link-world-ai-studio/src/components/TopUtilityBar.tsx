import React, { useEffect, useRef } from 'react';
import { Menu, Search, ChevronRight, Sun, Moon, ArrowLeft, RefreshCw, LogOut, LogIn } from 'lucide-react';

interface TopUtilityBarProps {
  dimensionPath: string[];
  onNavigatePath: (index: number) => void;
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
  onRefresh: () => void;
  refreshing: boolean;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = (props) => {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b" style={{background: 'var(--canvas)', borderColor: 'var(--border-subtle)'}}>
      <div className="flex items-center justify-between gap-2 h-14 px-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <button aria-label="Abrir navegación" onClick={props.onOpenMobileLedger} className="p-2 md:hidden"><Menu size={18}/></button>
          {props.canGoBack && <button aria-label="Volver" title="Volver" onClick={props.onBack} className="p-2"><ArrowLeft size={16}/></button>}
          <nav aria-label="Ruta dimensional" className="flex gap-1 items-center text-xs font-mono min-w-0 overflow-hidden">
            {props.dimensionPath.map((item, index) => <React.Fragment key={`${index}-${item}`}>
              {index > 0 && <ChevronRight size={12} className="shrink-0 opacity-40"/>}
              {index === props.dimensionPath.length - 1 ? <span aria-current="page" className="truncate font-bold">{item}</span> : <button className="shrink-0 hover:underline" onClick={() => props.onNavigatePath(index)}>{item}</button>}
            </React.Fragment>)}
          </nav>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden lg:inline text-[11px] mr-3" role="status" style={{color: 'var(--ink-muted)'}}>{props.supabaseConnected ? 'Supabase conectado' : 'Sin conexión a Supabase'}</span>
          <button aria-label="Actualizar datos" title="Actualizar datos" onClick={props.onRefresh} disabled={props.refreshing} className="p-2 disabled:opacity-50"><RefreshCw size={16} className={props.refreshing ? 'animate-spin' : ''}/></button>
          <button aria-label={props.theme === 'day' ? 'Modo noche' : 'Modo día'} title={props.theme === 'day' ? 'Modo noche' : 'Modo día'} onClick={() => props.onThemeChange(props.theme === 'day' ? 'night' : 'day')} className="p-2">{props.theme === 'day' ? <Moon size={16}/> : <Sun size={16}/>}</button>
          <button aria-label={props.userEmail ? 'Cerrar sesión' : 'Iniciar sesión'} title={props.userEmail || 'Iniciar sesión'} onClick={props.userEmail ? props.onSignOut : props.onOpenAuth} className="flex items-center gap-2 p-2 text-xs">
            {props.userEmail ? <LogOut size={16}/> : <LogIn size={16}/>}
            <span className="hidden sm:inline">{props.userEmail ? (props.isMember ? 'Miembro LINK' : 'Sesión activa') : 'Ingresar'}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 sm:px-6 pb-3">
        <Search size={14} className="opacity-50"/>
        <input ref={searchRef} aria-label="Buscar células" type="search" value={props.searchQuery} onChange={event => props.onSearchChange(event.target.value)} placeholder="Buscar células por nombre, sector o ciudad" className="w-full max-w-lg bg-transparent text-xs outline-none"/>
        <kbd className="text-[10px] opacity-40 hidden sm:inline">⌘ K</kbd>
      </div>
    </header>
  );
};
